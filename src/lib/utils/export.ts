import jsPDF from "jspdf";

export function copyToClipboard(text: string) {
	navigator.clipboard.writeText(text);
}

export function exportToPDF(title: string, content: string) {
	const doc = new jsPDF();

	if (!content) {
		console.warn("exportToPDF: content is empty");
		return;
	}

	// 🧠 Clean markdown
	const cleanText = String(content)
		.replace(/\*\*/g, "")
		.replace(/#/g, "")
		.replace(/\r/g, "")
		.trim();

	const pageWidth = 180;
	const pageHeight = 280;

	const marginX = 10;
	let cursorY = 15;

	// 🔥 TITLE
	doc.setFont("Helvetica", "bold");
	doc.setFontSize(18);
	doc.text(title, marginX, cursorY);

	cursorY += 8;

	// 🕒 Timestamp
	doc.setFont("Helvetica", "normal");
	doc.setFontSize(10);
	doc.text(
		`Generated on ${new Date().toLocaleString()}`,
		marginX,
		cursorY
	);

	cursorY += 8;

	// Divider
	doc.setDrawColor(200);
	doc.line(marginX, cursorY, marginX + pageWidth, cursorY);

	cursorY += 10;

	// 🧠 Split into paragraphs
	const paragraphs = cleanText.split("\n");

	doc.setFontSize(11);

	paragraphs.forEach((para) => {
		const text = para.trim();
		if (!text) {
			cursorY += 4;
			return;
		}

		// 🧠 Detect headings (simple heuristic)
		const isHeading =
			text.length < 60 &&
			(text === text.toUpperCase() || /^[A-Z]/.test(text));

		// 🔥 Page break check
		if (cursorY > pageHeight - 15) {
			doc.addPage();
			cursorY = 15;
		}

		if (isHeading) {
			doc.setFont("Helvetica", "bold");
			doc.setFontSize(13);

			doc.text(text, marginX, cursorY);
			cursorY += 7;

			doc.setFont("Helvetica", "normal");
			doc.setFontSize(11);
		} else {
			const lines = doc.splitTextToSize(text, pageWidth);

			lines.forEach((line: string) => {
				if (cursorY > pageHeight - 10) {
					doc.addPage();
					cursorY = 15;
				}

				doc.text(line, marginX, cursorY);
				cursorY += 6;
			});
		}
	});

	// 🔥 Save
	doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
}