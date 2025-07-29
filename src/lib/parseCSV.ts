import Papa from "papaparse";

export interface DataRow {
  Date: string;
  Revenue: number;
  Expenses: number;
}

// Type for raw CSV data before parsing
interface RawDataRow {
  Date?: string;
  Revenue?: string | number;
  Expenses?: string | number;
  [key: string]: string | number | undefined; // Allow additional columns
}

export function parseCSV(file: File): Promise<DataRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep as strings initially for better control
      complete: (results) => {
        try {
          // Check for parsing errors
          if (results.errors && results.errors.length > 0) {
            console.warn("CSV parsing warnings:", results.errors);
          }

          const parsed = (results.data as RawDataRow[]).map((row, index) => {
            // Validate required fields exist
            if (
              !row.Date ||
              row.Revenue === undefined ||
              row.Expenses === undefined
            ) {
              throw new Error(`Missing required fields in row ${index + 1}`);
            }

            const revenue = parseFloat(String(row.Revenue).trim());
            const expenses = parseFloat(String(row.Expenses).trim());

            // Check for valid numbers
            if (isNaN(revenue)) {
              throw new Error(
                `Invalid Revenue value in row ${index + 1}: "${row.Revenue}"`,
              );
            }
            if (isNaN(expenses)) {
              throw new Error(
                `Invalid Expenses value in row ${index + 1}: "${row.Expenses}"`,
              );
            }

            return {
              Date: String(row.Date).trim(),
              Revenue: revenue,
              Expenses: expenses,
            } as DataRow;
          });

          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}
