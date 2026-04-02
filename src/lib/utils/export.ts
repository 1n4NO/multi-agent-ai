import jsPDF from "jspdf";

export function copyToClipboard(text: string) {
	navigator.clipboard.writeText(text);
}

export function exportToPDF(title: string, data: any) {
	const doc = new jsPDF();

	if (!data) {
		console.warn("exportToPDF: no data");
		return;
	}

	const marginX = 15;
	let cursorY = 20;
	const pageWidth = 180;
	const pageHeight = 280;

	// 🧠 Helpers
	const addPageIfNeeded = (space = 10) => {
		if (cursorY + space > pageHeight) {
			doc.addPage();
			cursorY = 20;
		}
	};

	const addSection = (title: string, content?: string) => {
		if (!content) return;

		addPageIfNeeded(15);

		doc.setFont("Helvetica", "bold");
		doc.setFontSize(14);
		doc.text(title, marginX, cursorY);

		cursorY += 8;

		doc.setFont("Helvetica", "normal");
		doc.setFontSize(11);

		const clean = String(content)
			.replace(/\*\*/g, "")
			.replace(/#/g, "")
			.replace(/\r/g, "")
			.trim();

		const lines = doc.splitTextToSize(clean, pageWidth);

		lines.forEach((line: string) => {
			addPageIfNeeded(7);
			doc.text(line, marginX, cursorY);
			cursorY += 6;
		});

		cursorY += 6;
	};

	// 🏁 TITLE
	doc.setFont("Helvetica", "bold");
	doc.setFontSize(18);
	doc.text(title, marginX, cursorY);

	cursorY += 8;

	doc.setFont("Helvetica", "normal");
	doc.setFontSize(10);
	doc.text(`Generated on ${new Date().toLocaleString()}`, marginX, cursorY);

	cursorY += 10;

	doc.setDrawColor(200);
	doc.line(marginX, cursorY, marginX + pageWidth, cursorY);

	cursorY += 10;

	// 🎯 SECTIONS
	addSection("Planning", data.planner);

	// 🧪 Researchers
	if (Array.isArray(data.researchers)) {
		data.researchers.forEach((r: string, i: number) => {
			addSection(`Researcher ${i + 1}`, r);
		});
	}

	addSection("Synthesized Insights", data.synthesizer);
	addSection("Draft Output", data.writer);
	addSection("Final Answer", data.critic);

	// 📄 Footer
	const pageCount = doc.getNumberOfPages();

	for (let i = 1; i <= pageCount; i++) {
		doc.setPage(i);
		doc.setFontSize(10);
		doc.text(`Page ${i} of ${pageCount}`, 200, 290, {
			align: "right",
		});
	}

	doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
}