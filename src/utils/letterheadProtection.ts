/**
 * Letterhead Protection and Document Integrity Validator
 * Ensures that imported external documents (Word or Google Docs) preserve
 * mandatory corporate metadata, references, subject, and letterhead elements.
 */

import { Letter } from '../types/correspondenceTypes';

export interface LetterIntegrityReport {
  isValid: boolean;
  missingElements: string[];
  warnings: string[];
  suggestedAction: string;
}

/**
 * Validates whether an imported document text contains essential letterhead and corporate elements
 */
export function validateImportedLetterIntegrity(
  importedText: string,
  targetLetter: Letter,
  companyName?: string
): LetterIntegrityReport {
  const missingElements: string[] = [];
  const warnings: string[] = [];
  const textLower = (importedText || '').toLowerCase();

  // 1. Check Letter Reference Number
  if (targetLetter.letterNumber) {
    const refCore = targetLetter.letterNumber.replace(/\s+/g, '').toLowerCase();
    const cleanDoc = textLower.replace(/\s+/g, '');
    if (!cleanDoc.includes(refCore)) {
      missingElements.push(`Letter Reference Number (${targetLetter.letterNumber})`);
    }
  }

  // 2. Check Subject
  if (targetLetter.subject) {
    const subjectWords = targetLetter.subject
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3);
    const matches = subjectWords.filter(w => textLower.includes(w));
    if (subjectWords.length > 0 && matches.length < Math.min(2, subjectWords.length)) {
      missingElements.push(`Subject line wording: "${targetLetter.subject.slice(0, 40)}..."`);
    }
  }

  // 3. Check Recipient Organization
  if (targetLetter.recipientOrganization) {
    const recipWords = targetLetter.recipientOrganization
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3);
    const hasRecipient = recipWords.some(w => textLower.includes(w));
    if (!hasRecipient) {
      missingElements.push(`Recipient Name (${targetLetter.recipientOrganization})`);
    }
  }

  // 4. Check Company Identity / Letterhead Header
  const orgName = companyName || 'Apex';
  const orgWords = orgName
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2);
  const hasOrg = orgWords.some(w => textLower.includes(w));
  if (!hasOrg) {
    missingElements.push(`Corporate Entity Identity (${orgName})`);
  }

  // 5. Check Date
  if (targetLetter.date) {
    const year = targetLetter.date.slice(0, 4);
    if (!textLower.includes(year)) {
      warnings.push(`The correspondence year (${year}) was not detected in the imported text.`);
    }
  }

  const isValid = missingElements.length === 0;

  return {
    isValid,
    missingElements,
    warnings,
    suggestedAction: isValid
      ? 'Document passed corporate letterhead integrity checks.'
      : 'Official letterhead elements appear to be missing from the imported document.'
  };
}
