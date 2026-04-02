import jsPDF from "jspdf";
import { loadImageAsBase64 } from "./loadImage";

const LOGO_RATIO = 1382 / 752;

const getLogoSize = (targetWidth: number) => {
	return {
		width: targetWidth,
		height: targetWidth / LOGO_RATIO,
	};
};

export function copyToClipboard(text: string) {
	navigator.clipboard.writeText(text);
}

export async function exportToPDF(title: string, data: any) {
	const doc = new jsPDF();

	if (!data) return;

	// 🔥 Load logo
	const logo = await loadImageAsBase64("/logo.png");

	const marginX = 20;
	const pageWidth = 170;
	const pageHeight = 280;

	let cursorY = 20;

	// 🧠 Helpers
	const addPage = () => {
		doc.addPage();
		cursorY = 25;

		// 🔥 Small logo on every page
		const headerLogo = getLogoSize(30);

		doc.addImage(
			logo,
			"PNG",
			210 - headerLogo.width - 10,
			8,
			headerLogo.width,
			headerLogo.height
		);

		// Divider
		doc.setDrawColor(220);
		doc.line(20, 20, 190, 20);
	};

	const addSection = (title: string, content?: string) => {
		if (!content) return;

		if (cursorY > pageHeight - 40) addPage();

		doc.setFont("Helvetica", "bold");
		doc.setFontSize(14);
		doc.text(title, marginX, cursorY);

		cursorY += 8;

		doc.setFont("Helvetica", "normal");
		doc.setFontSize(11);

		const clean = String(content)
			.replace(/\*\*/g, "")
			.replace(/#/g, "")
			.trim();

		const lines = doc.splitTextToSize(clean, pageWidth);

		lines.forEach((line: string) => {
			if (cursorY > pageHeight - 20) addPage();
			doc.text(line, marginX, cursorY);
			cursorY += 6;
		});

		cursorY += 6;
	};

	// =============================
	// 🏁 COVER PAGE
	// =============================
	doc.setFillColor(245, 245, 245);
	doc.rect(0, 0, 210, 297, "F");

	// 🔥 BIG LOGO
	const coverLogo = getLogoSize(100);

	doc.addImage(
		logo,
		"PNG",
		(210 - coverLogo.width) / 2, // center horizontally
		40,
		coverLogo.width,
		coverLogo.height
	);

	doc.setFont("Helvetica", "bold");
	doc.setFontSize(24);
	doc.text(title, 105, 100, { align: "center" });

	doc.setFontSize(12);
	doc.setFont("Helvetica", "normal");
	doc.text(
		`Generated on ${new Date().toLocaleString()}`,
		105,
		115,
		{ align: "center" }
	);

	doc.setFontSize(11);
	doc.text(
		"AI Multi-Agent Intelligence Report",
		105,
		130,
		{ align: "center" }
	);

	// Footer
	doc.setFontSize(10);
	doc.text("Confidential Report", 105, 280, { align: "center" });

	// =============================
	// 📄 CONTENT PAGES
	// =============================
	addPage();

	addSection("1. Planning", data.planner);

	if (Array.isArray(data.researchers)) {
		data.researchers.forEach((r: string, i: number) => {
			addSection(`2.${i + 1} Research Insight`, r);
		});
	}

	addSection("3. Synthesized Intelligence", data.synthesizer);
	addSection("4. Draft Output", data.writer);
	addSection("5. Final Answer", data.critic);

	// =============================
	// 📄 FOOTER (page numbers)
	// =============================
	const pageCount = doc.getNumberOfPages();

	for (let i = 1; i <= pageCount; i++) {
		doc.setPage(i);

		doc.setFontSize(9);
		doc.text(`Page ${i} of ${pageCount}`, 190, 290, {
			align: "right",
		});
	}

	doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
}