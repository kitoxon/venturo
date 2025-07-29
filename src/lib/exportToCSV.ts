// If you actually want to export an array of strings as a single-column CSV
export function exportToCSV(
  data: string[],
  filename: string,
  columnName: string = "Value",
) {
  if (!data || data.length === 0) return;

  const csv = [
    columnName,
    ...data.map((value) => {
      // Handle values that might contain commas, quotes, or newlines
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
