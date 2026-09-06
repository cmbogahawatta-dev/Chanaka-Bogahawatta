import JSZip from 'jszip';
import { EnterpriseDocument } from '../../types/enterpriseTypes';

export interface TenderPackOptions {
  packName: string;
  projectCode?: string;
  clientName?: string;
  documents: EnterpriseDocument[];
}

export const generateTenderPackZip = async (options: TenderPackOptions): Promise<void> => {
  const { packName, projectCode, clientName, documents } = options;
  const zip = new JSZip();

  // Create folder structure inside zip
  const statutoryFolder = zip.folder('01_Statutory_and_Registrations');
  const cidaFolder = zip.folder('02_CIDA_and_Technical_Grades');
  const isoFolder = zip.folder('03_ISO_Certifications_and_Audits');
  const financialFolder = zip.folder('04_Financial_Auditor_Reports_and_Tax');
  const insuranceFolder = zip.folder('05_Insurance_Policies_and_Licences');
  const generalFolder = zip.folder('06_Project_Credentials_and_Other');

  const manifestLines: string[] = [
    `========================================================================`,
    `               ENTERPRISE CORPORATE TENDER PACK MANIFEST                `,
    `========================================================================`,
    `Pack Name    : ${packName}`,
    `Generated At : ${new Date().toISOString()}`,
    `Project Code : ${projectCode || 'General Corporate Submission'}`,
    `Client / Bid : ${clientName || 'Competitive Tender / Authority Submission'}`,
    `Total Files  : ${documents.length}`,
    `========================================================================\n`,
    `INDEX OF ATTACHED DOCUMENTS:\n`
  ];

  documents.forEach((doc, idx) => {
    let targetFolder = generalFolder;

    if (doc.CATEGORY === 'Statutory Registration' || doc.CATEGORY === 'VAT/Tax') {
      targetFolder = statutoryFolder;
    } else if (doc.CATEGORY === 'CIDA') {
      targetFolder = cidaFolder;
    } else if (doc.CATEGORY === 'ISO Certificate' || doc.CATEGORY === 'ISO Audit Report') {
      targetFolder = isoFolder;
    } else if (doc.CATEGORY === 'Auditor Report' || doc.CATEGORY === 'Bank Confirmation' || doc.CATEGORY === 'Bank Statement') {
      targetFolder = financialFolder;
    } else if (doc.CATEGORY === 'Insurance Policy' || doc.CATEGORY === 'Licence/Permit') {
      targetFolder = insuranceFolder;
    }

    const cleanFileName = `${String(idx + 1).padStart(2, '0')}_${doc.DOC_REF}_${doc.FILE_NAME.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    manifestLines.push(
      `[${String(idx + 1).padStart(2, '0')}] ${doc.DOC_REF} | ${doc.CATEGORY} | ${doc.TITLE} | File: ${cleanFileName} (${doc.FILE_SIZE_KB} KB)`
    );

    // If FILE_DATA is base64
    if (doc.FILE_DATA && doc.FILE_DATA.includes('base64,')) {
      const base64Data = doc.FILE_DATA.split('base64,')[1];
      targetFolder?.file(cleanFileName, base64Data, { base64: true });
    } else if (doc.FILE_DATA) {
      targetFolder?.file(cleanFileName, doc.FILE_DATA);
    } else {
      targetFolder?.file(`${cleanFileName}.txt`, `Document Reference: ${doc.DOC_REF}\nTitle: ${doc.TITLE}\nCategory: ${doc.CATEGORY}`);
    }
  });

  // Add Manifest to root
  zip.file('00_TENDER_PACK_MANIFEST.txt', manifestLines.join('\n'));

  // Generate and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `${packName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
};
