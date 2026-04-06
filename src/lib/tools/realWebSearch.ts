const DUCKDUCKGO_HTML_URL = "https://html.duckduckgo.com/html/";
const DEFAULT_MAX_RESULTS = 5;
const DEFAULT_MAX_SCRAPED_PAGES = 3;
const DEFAULT_PAGE_TEXT_LIMIT = 4000;
const DEFAULT_TIMEOUT_MS = 15000;
import { isAbortError, throwIfAborted } from "@/lib/utils/abort";

export type SearchHit = {
	title: string;
	url: string;
	snippet: string;
	content?: string;
};

export type WebResearchResult = {
	query: string;
	results: SearchHit[];
};

export type ResearchSourceGroup = {
	nodeId: string;
	task: string;
	sources: SearchHit[];
};

export type CitationEntry = {
	id: number;
	title: string;
	url: string;
	snippet: string;
	tasks: string[];
};

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function buildAnchorTag(url: string, label: string): string {
	return `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
}

type PuppeteerModule = {
	default: {
		launch: (options?: {
			headless?: boolean | "shell";
			args?: string[];
		}) => Promise<{
			newPage: () => Promise<{
				setUserAgent: (userAgent: string) => Promise<void>;
				goto: (
					url: string,
					options?: {
						waitUntil?: "domcontentloaded" | "load" | "networkidle0" | "networkidle2";
						timeout?: number;
					}
				) => Promise<void>;
				evaluate: <T>(pageFunction: () => T | Promise<T>) => Promise<T>;
				close: () => Promise<void>;
			}>;
			close: () => Promise<void>;
		}>;
	};
};

function decodeHtmlEntities(value: string) {
	return value
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&#x2F;/g, "/");
}

function stripHtml(value: string) {
	return decodeHtmlEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function getUserAgent() {
	return [
		"Mozilla/5.0",
		"(Macintosh; Intel Mac OS X 10_15_7)",
		"AppleWebKit/537.36",
		"(KHTML, like Gecko)",
		"Chrome/124.0.0.0",
		"Safari/537.36",
	].join(" ");
}

function extractDuckDuckGoResults(html: string, maxResults: number): SearchHit[] {
	const results: SearchHit[] = [];
	const blocks = html.split(/<div[^>]*class="[^"]*result[^"]*"[^>]*>/i);

	for (const block of blocks) {
		if (results.length >= maxResults) {
			break;
		}

		const titleMatch = block.match(
			/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
		);
		if (!titleMatch) {
			continue;
		}

		const snippetMatch =
			block.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ??
			block.match(/<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

		results.push({
			url: decodeHtmlEntities(titleMatch[1]),
			title: stripHtml(titleMatch[2]),
			snippet: snippetMatch ? stripHtml(snippetMatch[1]) : "",
		});
	}

	return results;
}

export async function searchDuckDuckGo(
	query: string,
	maxResults = DEFAULT_MAX_RESULTS,
	signal?: AbortSignal
): Promise<SearchHit[]> {
	throwIfAborted(signal);
	const response = await fetch(DUCKDUCKGO_HTML_URL, {
		method: "POST",
		headers: {
			"content-type": "application/x-www-form-urlencoded",
			"user-agent": getUserAgent(),
		},
		signal,
		body: new URLSearchParams({
			q: query,
		}),
	});

	if (!response.ok) {
		throw new Error(`DuckDuckGo search failed with status ${response.status}`);
	}

	const html = await response.text();
	throwIfAborted(signal);
	const results = extractDuckDuckGoResults(html, maxResults);

	if (results.length === 0) {
		throw new Error("DuckDuckGo returned no parseable search results");
	}

	return results;
}

async function loadPuppeteer(): Promise<PuppeteerModule["default"] | null> {
	try {
		const puppeteerModule = (await import("puppeteer")) as PuppeteerModule;
		return puppeteerModule.default;
	} catch {
		return null;
	}
}

async function createBrowser() {
	const puppeteer = await loadPuppeteer();
	if (!puppeteer) {
		return null;
	}

	return puppeteer.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});
}

async function scrapePageContent(
	browser: Awaited<ReturnType<typeof createBrowser>>,
	url: string,
	maxChars = DEFAULT_PAGE_TEXT_LIMIT,
	signal?: AbortSignal
): Promise<string | null> {
	if (!browser) {
		return null;
	}

	throwIfAborted(signal);
	const page = await browser.newPage();

	try {
		await page.setUserAgent(getUserAgent());
		await page.goto(url, {
			waitUntil: "domcontentloaded",
			timeout: DEFAULT_TIMEOUT_MS,
		});
		throwIfAborted(signal);

		const content = await page.evaluate(() => {
			const selectors = ["main", "article", "[role='main']", "body"];

			for (const selector of selectors) {
				const root = document.querySelector(selector);
				if (!root) {
					continue;
				}

				const text = Array.from(root.querySelectorAll("h1, h2, h3, p, li"))
					.map((node) => node.textContent?.trim() ?? "")
					.filter(Boolean)
					.join("\n");

				if (text.trim()) {
					return text;
				}
			}

			return document.body?.innerText ?? "";
		});

		return content.replace(/\n{3,}/g, "\n\n").slice(0, maxChars).trim();
	} finally {
		await page.close();
	}
}

export async function scrapeSearchHits(
	results: SearchHit[],
	maxScrapedPages = DEFAULT_MAX_SCRAPED_PAGES,
	signal?: AbortSignal
) {
	const enrichedResults = [...results];
	const browser = await createBrowser();

	if (!browser) {
		return enrichedResults;
	}

	const onAbort = () => {
		void browser.close().catch(() => {
			// Ignore browser close errors during abort.
		});
	};

	signal?.addEventListener("abort", onAbort, { once: true });

	try {
		throwIfAborted(signal);
		for (let index = 0; index < Math.min(maxScrapedPages, enrichedResults.length); index += 1) {
			throwIfAborted(signal);
			const result = enrichedResults[index];

			try {
				const content = await scrapePageContent(browser, result.url, DEFAULT_PAGE_TEXT_LIMIT, signal);
				if (content) {
					result.content = content;
				}
			} catch (error) {
				if (isAbortError(error)) {
					throw error;
				}
				// Keep the search hit even if scraping fails.
			}
		}
	} finally {
		signal?.removeEventListener("abort", onAbort);
		await browser.close().catch(() => {
			// Ignore browser close errors after abort.
		});
	}

	return enrichedResults;
}

export function formatWebResearchForAgent(research: WebResearchResult): string {
	return research.results
		.map((result, index) => {
			const sections = [`${index + 1}. ${result.title}`, `URL: ${result.url}`];

			if (result.snippet) {
				sections.push(`Snippet: ${result.snippet}`);
			}

			if (result.content) {
				sections.push(`Scraped Content:\n${result.content}`);
			}

			return sections.join("\n");
		})
		.join("\n\n");
}

export function formatCitationBlock(
	task: string,
	sources: SearchHit[],
	errorMessage?: string
): string {
	const lines = [`## Sources Consulted`, `Task: ${task}`];

	if (sources.length === 0) {
		lines.push("No sources were successfully collected.");
	} else {
		sources.forEach((source, index) => {
			lines.push(`${index + 1}. ${buildAnchorTag(source.url, source.title)}`);

			if (source.snippet) {
				lines.push(`   Why consulted: ${source.snippet}`);
			}
		});
	}

	if (errorMessage) {
		lines.push(`Search note: ${errorMessage}`);
	}

	return lines.join("\n");
}

export function buildCitationCatalog(
	researchSources: ResearchSourceGroup[]
): CitationEntry[] {
	const sourceUsage = new Map<string, CitationEntry>();

	researchSources
		.slice()
		.sort((a, b) => a.nodeId.localeCompare(b.nodeId))
		.forEach((group) => {
			group.sources.forEach((source) => {
				const existing = sourceUsage.get(source.url);

				if (existing) {
					if (!existing.tasks.includes(group.task)) {
						existing.tasks.push(group.task);
					}
					return;
				}

				sourceUsage.set(source.url, {
					id: sourceUsage.size + 1,
					title: source.title,
					url: source.url,
					snippet: source.snippet,
					tasks: [group.task],
				});
			});
		});

	return Array.from(sourceUsage.values());
}

export function formatCitationCatalogForAgent(
	citationCatalog: CitationEntry[]
): string {
	if (citationCatalog.length === 0) {
		return "No citations are available for this run.";
	}

	return citationCatalog
		.map((citation) => {
			const lines = [
				`[${citation.id}] ${citation.title}`,
				`URL: ${citation.url}`,
				`Research tasks: ${citation.tasks.join("; ")}`,
			];

			if (citation.snippet) {
				lines.push(`Search context: ${citation.snippet}`);
			}

			return lines.join("\n");
		})
		.join("\n\n");
}

export function formatCitationCatalogMarkdown(
	citationCatalog: CitationEntry[]
): string {
	if (citationCatalog.length === 0) {
		return "## Citations\n\nNo external sources were successfully collected for this run.";
	}

	const entries = citationCatalog.map((citation) => {
		const lines = [
			`### [${citation.id}] ${buildAnchorTag(citation.url, citation.title)}`,
			`- URL: ${buildAnchorTag(citation.url, citation.url)}`,
			`- Used in: ${citation.tasks.join("; ")}`,
			"- Propagated to: Synthesizer, Writer, Critic",
		];

		if (citation.snippet) {
			lines.push(`- Search context: ${citation.snippet}`);
		}

		return lines.join("\n");
	});

	return `## Citations\n\n${entries.join("\n\n")}`;
}

export async function realWebSearch(
	query: string,
	signal?: AbortSignal
): Promise<WebResearchResult> {
	const results = await searchDuckDuckGo(query, DEFAULT_MAX_RESULTS, signal);
	const enrichedResults = await scrapeSearchHits(results, DEFAULT_MAX_SCRAPED_PAGES, signal);

	return {
		query,
		results: enrichedResults,
	};
}
