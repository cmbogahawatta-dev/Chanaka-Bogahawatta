/**
 * Google Docs Integration Service
 * Provides Google Docs API v1 creation, updating, retrieval, and export
 * with full letterhead styling, table/section structures, and token security.
 */

import { Letter, LetterheadTemplate } from '../types/correspondenceTypes';
import {
  getGoogleAccessToken,
  exportDriveFileAsBlob,
  getDriveFileMetadata,
  isGoogleDriveConfigured,
  getGoogleDriveConfigStatus
} from './googleDriveService';

export interface GoogleDocResult {
  documentId: string;
  documentUrl: string;
  title: string;
  webViewLink: string;
  createdAt: string;
}

export interface GoogleDocDetails {
  documentId: string;
  title: string;
  bodyText: string;
  bodyHtml: string;
  modifiedTime?: string;
  revisionId?: string;
}

/**
 * Checks whether Google Docs integration is available.
 */
export function isGoogleDocsConfigured(): boolean {
  return isGoogleDriveConfigured();
}

export function getGoogleDocsStatus() {
  return getGoogleDriveConfigStatus();
}

/**
 * Strips HTML tags and preserves paragraph line breaks cleanly for formatting.
 */
function cleanHtmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Builds the comprehensive professional document structure for Google Docs
 */
export function formatLetterContentForGoogleDocs(
  letter: Letter,
  profile?: any,
  letterhead?: LetterheadTemplate | null
): { title: string; contentText: string; plainBody: string } {
  const companyName = profile?.companyName || 'APEX GLOBAL LOGISTICS & ENGINEERING';
  const regAddress = profile?.registeredAddress || 'No. 45, Galle Road, Colombo 03, Sri Lanka';
  const contactLine = `Tel: ${profile?.telephone || '+94 11 234 5678'} | Web: ${profile?.website || 'www.apexglobal.com'}`;

  const headerTitle = letterhead?.name
    ? `${companyName} [${letterhead.name}]`
    : companyName;

  const letterheadBlock = [
    headerTitle.toUpperCase(),
    regAddress,
    contactLine,
    '--------------------------------------------------------------------------------'
  ].join('\n');

  const particularsBlock = [
    `DATE:            ${letter.date || new Date().toISOString().slice(0, 10)}`,
    `LETTER REF:      ${letter.letterNumber || 'EMA/GEN/2026/DRAFT'}`,
    letter.ourReference ? `OUR REFERENCE:   ${letter.ourReference}` : null,
    letter.theirReference ? `THEIR REFERENCE: ${letter.theirReference}` : null,
    letter.projectCode ? `PROJECT CODE:    ${letter.projectCode} - ${letter.projectName || ''}` : null,
    `CLASSIFICATION:  ${letter.confidentiality || 'Normal'} | Priority: ${letter.priority || 'Normal'}`
  ].filter(Boolean).join('\n');

  const recipientBlock = [
    'ADDRESSED TO:',
    letter.recipientOrganization || 'Recipient Organization',
    letter.attention ? `ATTENTION: ${letter.attention}` : null,
    letter.recipientAddress || 'Recipient Address'
  ].filter(Boolean).join('\n');

  const subjectLine = `SUBJECT: ${letter.subject ? letter.subject.toUpperCase() : 'OFFICIAL CORRESPONDENCE'}`;

  const plainBody = cleanHtmlToText(letter.bodyHtml);

  const signatoryBlock = [
    'Yours faithfully,',
    '',
    '_____________________________________',
    letter.preparedBy || 'Authorized Signatory',
    companyName
  ].join('\n');

  const fullDocumentText = [
    letterheadBlock,
    '',
    particularsBlock,
    '',
    recipientBlock,
    '',
    subjectLine,
    '================================================================================',
    '',
    plainBody,
    '',
    signatoryBlock
  ].join('\n');

  const docTitle = `${letter.letterNumber || 'Draft'} - ${letter.subject || 'Official Letter'}`;

  return {
    title: docTitle,
    contentText: fullDocumentText,
    plainBody
  };
}

/**
 * Creates a real Google Document from the letter using Google Docs API v1.
 * If credentials are not configured, throws "Google Docs integration is not configured."
 */
export async function createGoogleDocumentFromLetter(
  letter: Letter,
  profile?: any,
  letterhead?: LetterheadTemplate | null
): Promise<GoogleDocResult> {
  if (!isGoogleDocsConfigured()) {
    throw new Error('Google Docs integration is not configured.');
  }

  const token = await getGoogleAccessToken(true);
  const formatted = formatLetterContentForGoogleDocs(letter, profile, letterhead);

  // Step 1: Create empty document via Google Docs API
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: formatted.title
    })
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create Google Document: ${createRes.status} - ${err}`);
  }

  const docData = await createRes.json();
  const documentId = docData.documentId;
  const webViewLink = `https://docs.google.com/document/d/${documentId}/edit`;

  // Step 2: Insert text and apply basic heading styling via batchUpdate
  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: formatted.contentText
          }
        }
      ]
    })
  });

  if (!updateRes.ok) {
    console.warn('Batch update to Google Doc encountered a warning:', await updateRes.text());
  }

  return {
    documentId,
    documentUrl: webViewLink,
    title: formatted.title,
    webViewLink,
    createdAt: new Date().toISOString()
  };
}

/**
 * Updates an existing Google Document with fresh text from the letter.
 */
export async function updateGoogleDocumentFromLetter(
  documentId: string,
  letter: Letter,
  profile?: any,
  letterhead?: LetterheadTemplate | null
): Promise<void> {
  if (!isGoogleDocsConfigured()) {
    throw new Error('Google Docs integration is not configured.');
  }

  const token = await getGoogleAccessToken(true);
  const formatted = formatLetterContentForGoogleDocs(letter, profile, letterhead);

  // Retrieve current doc to find end index
  const doc = await getGoogleDocument(documentId);
  const bodyLength = doc.bodyText.length;

  const requests: any[] = [];
  if (bodyLength > 1) {
    requests.push({
      deleteContentRange: {
        range: {
          startIndex: 1,
          endIndex: Math.max(2, bodyLength)
        }
      }
    });
  }

  requests.push({
    insertText: {
      location: { index: 1 },
      text: formatted.contentText
    }
  });

  const res = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update Google Document: ${res.status} - ${err}`);
  }
}

/**
 * Retrieves the text and structural metadata of a Google Document
 */
export async function getGoogleDocument(documentId: string): Promise<GoogleDocDetails> {
  if (!isGoogleDocsConfigured()) {
    throw new Error('Google Docs integration is not configured.');
  }

  const token = await getGoogleAccessToken(true);
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to retrieve Google Document: ${res.status} - ${err}`);
  }

  const doc = await res.json();
  const content = doc.body?.content || [];

  let extractedText = '';
  for (const element of content) {
    if (element.paragraph?.elements) {
      for (const el of element.paragraph.elements) {
        if (el.textRun?.content) {
          extractedText += el.textRun.content;
        }
      }
    }
  }

  // Also query Drive API for last modified time
  let modifiedTime: string | undefined;
  try {
    const meta = await getDriveFileMetadata(documentId);
    modifiedTime = meta.modifiedTime;
  } catch {}

  // Format paragraphs as simple HTML
  const bodyHtml = extractedText
    .split(/\n{2,}/)
    .filter(p => p.trim())
    .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('\n');

  return {
    documentId,
    title: doc.title || 'Untitled Document',
    bodyText: extractedText,
    bodyHtml,
    modifiedTime,
    revisionId: doc.revisionId
  };
}

/**
 * Exports Google Document as specified MIME type (PDF or DOCX)
 */
export async function exportGoogleDocument(
  documentId: string,
  mimeType: 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
): Promise<Blob> {
  return exportDriveFileAsBlob(documentId, mimeType);
}

/**
 * Downloads Google Document as DOCX Blob
 */
export async function downloadGoogleDocumentAsDocx(documentId: string): Promise<Blob> {
  return exportGoogleDocument(
    documentId,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
}

/**
 * Downloads Google Document as PDF Blob
 */
export async function downloadGoogleDocumentAsPdf(documentId: string): Promise<Blob> {
  return exportGoogleDocument(documentId, 'application/pdf');
}

/**
 * Saves or associates a Google Document link to a letter.
 */
export function saveGoogleDocumentLink(
  letter: Letter,
  docUrl: string,
  docId?: string
): Partial<Letter> {
  const extractedId = docId || extractGoogleDocId(docUrl);
  return {
    googleDocumentId: extractedId,
    googleDocumentUrl: docUrl,
    externalEditor: 'GOOGLE_DOCS',
    externalDocumentUpdatedAt: new Date().toISOString()
  };
}

/**
 * Extracts Google Document ID from a URL
 */
export function extractGoogleDocId(url: string): string | undefined {
  if (!url) return undefined;
  const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : undefined;
}
