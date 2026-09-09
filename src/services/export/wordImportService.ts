import mammoth from 'mammoth';
import JSZip from 'jszip';

export interface WordImportResult {
  fileName: string;
  fileSize: number;
  fileType: string;
  html: string;
  rawText: string;
  dataUrl: string;
}

/**
 * Reads a .docx file and extracts its HTML content, plain text, and base64 dataUrl
 */
export async function readWordDocumentFile(file: File): Promise<WordImportResult> {
  const arrayBuffer = await file.arrayBuffer();

  // 1. Read base64 dataUrl for persistence & download
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file as Data URL'));
    reader.readAsDataURL(file);
  });

  let extractedHtml = '';
  let extractedText = '';

  // 2. Try mammoth first for rich semantic HTML
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer });
    extractedHtml = result.value || '';
  } catch (err) {
    console.warn('Mammoth convertToHtml failed, trying JSZip fallback:', err);
  }

  // 3. Try mammoth extractRawText
  try {
    const textRes = await mammoth.extractRawText({ arrayBuffer });
    extractedText = textRes.value || '';
  } catch (err) {
    console.warn('Mammoth extractRawText failed:', err);
  }

  // 4. Fallback to JSZip if mammoth didn't produce HTML
  if (!extractedHtml.trim()) {
    try {
      const zip = await JSZip.loadAsync(arrayBuffer);
      const documentXml = await zip.file('word/document.xml')?.async('text');
      if (documentXml) {
        // Parse <w:p> tags from document.xml
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(documentXml, 'application/xml');
        const paragraphs = xmlDoc.getElementsByTagName('w:p');
        const htmlParts: string[] = [];
        const textParts: string[] = [];

        for (let i = 0; i < paragraphs.length; i++) {
          const p = paragraphs[i];
          const textNodes = p.getElementsByTagName('w:t');
          let pText = '';
          for (let j = 0; j < textNodes.length; j++) {
            pText += textNodes[j].textContent || '';
          }
          if (pText.trim()) {
            htmlParts.push(`<p>${escapeHtml(pText.trim())}</p>`);
            textParts.push(pText.trim());
          }
        }

        extractedHtml = htmlParts.join('\n');
        extractedText = textParts.join('\n\n');
      }
    } catch (zipErr) {
      console.error('JSZip fallback failed:', zipErr);
    }
  }

  // If still empty (e.g. plain text or other file format)
  if (!extractedHtml.trim() && extractedText.trim()) {
    extractedHtml = extractedText
      .split(/\n\s*\n/)
      .map(p => `<p>${escapeHtml(p.trim())}</p>`)
      .join('\n');
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    html: extractedHtml,
    rawText: extractedText,
    dataUrl
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
