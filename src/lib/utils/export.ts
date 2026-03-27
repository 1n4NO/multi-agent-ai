import jsPDF from "jspdf";

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

export function exportToPDF(title: string, content: string) {
  const doc = new jsPDF();

  const lines = doc.splitTextToSize(content, 180);

  doc.text(title, 10, 10);
  doc.text(lines, 10, 20);

  doc.save(`${title}.pdf`);
}