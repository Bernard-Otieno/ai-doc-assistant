// Import PDF.js from CDN (this is now compatible with ESM)
import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.2.133/+esm';

// Set the workerSrc to the correct worker path from the CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.2.133/build/pdf.worker.min.js';

// Function to extract text from the uploaded file (supporting .pdf and .txt)
export async function extractTextFromFile(file) {
  const fileType = file.type;

  if (fileType === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(' ') + '\n';
    }

    return text;
  }

  if (fileType === 'text/plain') {
    return await file.text();
  }

  return 'Unsupported file type.';
}
