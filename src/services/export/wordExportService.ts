import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  convertMillimetersToTwip,
  Footer,
  PageNumber,
  NumberFormat
} from 'docx';
import { Letter, LetterheadTemplate } from '../../types/correspondenceTypes';
import { EnterpriseProfileDetails } from '../../types/enterpriseProfileTypes';

/**
 * Strips HTML tags and splits into paragraphs, preserving bold and italic runs where possible
 */
export function parseHtmlToWordParagraphs(html: string): Paragraph[] {
  if (!html) {
    return [
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200, line: 320 },
        children: [new TextRun({ text: 'No content recorded.', font: 'Calibri', size: 22 })]
      })
    ];
  }

  // Use DOMParser in browser if available
  if (typeof window !== 'undefined' && window.DOMParser) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
      const root = doc.body.firstElementChild || doc.body;
      const paragraphs: Paragraph[] = [];

      const processNode = (node: Node): Paragraph[] => {
        const result: Paragraph[] = [];

        // Handle paragraphs, headings, list items
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tag = el.tagName.toLowerCase();

          if (tag === 'p' || tag === 'li' || tag === 'div' || tag === 'blockquote' || /^h[1-6]$/.test(tag)) {
            const runs = extractTextRuns(el);
            if (runs.length > 0) {
              result.push(
                new Paragraph({
                  alignment: AlignmentType.JUSTIFIED,
                  spacing: { after: 180, line: 320 },
                  bullet: tag === 'li' ? { level: 0 } : undefined,
                  children: runs
                })
              );
            }
          } else if (tag === 'ul' || tag === 'ol') {
            Array.from(el.children).forEach(child => {
              result.push(...processNode(child));
            });
          } else {
            // Traverse children
            Array.from(el.childNodes).forEach(child => {
              result.push(...processNode(child));
            });
          }
        }
        return result;
      };

      const extracted = processNode(root);
      if (extracted.length > 0) return extracted;
    } catch (e) {
      console.warn('DOMParser failed, falling back to regex parser', e);
    }
  }

  // Regex fallback: split by <p>, <br>, <div>, </li>
  const cleanBlocks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split(/\n\s*\n/)
    .map(t => t.trim())
    .filter(t => t.length > 0);

  return cleanBlocks.map(block => {
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 180, line: 320 },
      children: [
        new TextRun({
          text: block,
          font: 'Calibri',
          size: 22 // 11pt
        })
      ]
    });
  });
}

function extractTextRuns(element: HTMLElement): TextRun[] {
  const runs: TextRun[] = [];

  const walk = (node: Node, isBold = false, isItalic = false, isUnderline = false) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const txt = node.textContent || '';
      if (txt) {
        runs.push(
          new TextRun({
            text: txt,
            bold: isBold,
            italics: isItalic,
            underline: isUnderline ? {} : undefined,
            font: 'Calibri',
            size: 22, // 11pt
            color: '1E293B' // Slate-800
          })
        );
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const boldNow = isBold || tag === 'strong' || tag === 'b';
      const italicNow = isItalic || tag === 'em' || tag === 'i';
      const underNow = isUnderline || tag === 'u';

      Array.from(el.childNodes).forEach(child => {
        walk(child, boldNow, italicNow, underNow);
      });
    }
  };

  walk(element);
  return runs;
}

/**
 * Generates an authentic, formatted Microsoft Office Word (.docx) letter document
 */
export async function exportLetterToWord(
  letter: Letter,
  profile: EnterpriseProfileDetails,
  enterpriseName: string,
  letterhead?: LetterheadTemplate | null
): Promise<void> {
  const companyTitle = (profile?.legalName || enterpriseName || 'EMA CORPORATE ENTERPRISE').toUpperCase();
  const tradingTitle = (profile?.tradingName || 'Logistics & Heavy Engineering Solutions').toUpperCase();

  // Cell border style presets
  const subtleBorder = {
    style: BorderStyle.SINGLE,
    size: 4, // 0.5 pt
    color: 'CBD5E1'
  };

  const headerBorders = {
    top: subtleBorder,
    bottom: subtleBorder,
    left: subtleBorder,
    right: subtleBorder
  };

  const noneBorder = {
    style: BorderStyle.NONE,
    size: 0,
    color: 'FFFFFF'
  };

  // 1. Corporate Header Block
  const headerParagraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: companyTitle,
          bold: true,
          font: 'Calibri',
          size: 28, // 14pt
          color: '0F172A'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: tradingTitle,
          bold: true,
          font: 'Calibri',
          size: 18, // 9pt
          color: '047857' // Emerald-700
        }),
        new TextRun({
          text: `  |  Reg No: ${profile?.registrationNumber || 'PV-89214'}  |  VAT: ${profile?.vatNumber || '102938475-7000'}  |  TIN: ${profile?.tinNumber || '200192837'}  |  CIDA: ${profile?.cidaGrade || 'C1'}`,
          font: 'Calibri',
          size: 16, // 8pt
          color: '64748B'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 140 },
      children: [
        new TextRun({
          text: `Head Office: ${profile?.registeredAddress || 'Level 14 & 16, World Trade Centre, Echelon Square, Colombo 01, Sri Lanka'}`,
          font: 'Calibri',
          size: 16,
          color: '475569'
        }),
        new TextRun({
          text: `  •  Tel: ${profile?.telephone || '+94 11 289 4000'}  •  Email: ${profile?.email || 'contact@ema-corp.lk'}  •  Web: ${profile?.website || 'www.ema-corp.lk'}`,
          font: 'Calibri',
          size: 16,
          color: '475569'
        })
      ]
    }),
    // Colored rule divider line
    new Paragraph({
      alignment: AlignmentType.LEFT,
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 16, // 2pt thick
          color: '047857' // Emerald accent
        }
      },
      spacing: { after: 240 },
      children: []
    })
  ];

  // 2. Structured Dual Boxes: Recipient Details (Left) & Correspondence Particulars (Right)
  // Standard A4 width = 11906 twips; with 2x1134 margins = 9638 twips usable width.
  // Each column = ~4819 twips.
  const columnWidth = 4800;

  const dualBoxesTable = new Table({
    width: {
      size: 9600,
      type: WidthType.DXA
    },
    rows: [
      // Box Headers Row
      new TableRow({
        children: [
          new TableCell({
            width: { size: columnWidth, type: WidthType.DXA },
            shading: {
              fill: 'F1F5F9', // Slate-100
              type: ShadingType.CLEAR
            },
            borders: headerBorders,
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'TO: RECIPIENT & ADDRESSEE',
                    bold: true,
                    font: 'Calibri',
                    size: 17, // 8.5pt
                    color: '334155'
                  })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: columnWidth, type: WidthType.DXA },
            shading: {
              fill: 'F1F5F9',
              type: ShadingType.CLEAR
            },
            borders: headerBorders,
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'CORRESPONDENCE PARTICULARS  •  ',
                    bold: true,
                    font: 'Calibri',
                    size: 17,
                    color: '334155'
                  }),
                  new TextRun({
                    text: letter.ourReference || letter.letterNumber,
                    bold: true,
                    font: 'Consolas',
                    size: 17,
                    color: '6B21A8' // Purple
                  })
                ]
              })
            ]
          })
        ]
      }),
      // Box Content Row
      new TableRow({
        children: [
          // Left Box: Recipient Info
          new TableCell({
            width: { size: columnWidth, type: WidthType.DXA },
            borders: headerBorders,
            margins: { top: 160, bottom: 160, left: 160, right: 160 },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: letter.recipientOrganization || 'General Addressee / Employer',
                    bold: true,
                    font: 'Calibri',
                    size: 22, // 11pt
                    color: '0F172A'
                  })
                ]
              }),
              ...(letter.attention
                ? [
                    new Paragraph({
                      spacing: { after: 60 },
                      children: [
                        new TextRun({
                          text: `Attention: ${letter.attention}`,
                          italics: true,
                          font: 'Calibri',
                          size: 19,
                          color: '475569'
                        })
                      ]
                    })
                  ]
                : []),
              new Paragraph({
                children: [
                  new TextRun({
                    text: letter.recipientAddress || 'Site Office / Corporate Headquarters',
                    font: 'Calibri',
                    size: 18,
                    color: '64748B'
                  })
                ]
              })
            ]
          }),
          // Right Box: Particulars
          new TableCell({
            width: { size: columnWidth, type: WidthType.DXA },
            borders: headerBorders,
            margins: { top: 140, bottom: 140, left: 160, right: 160 },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: 'Date: ', bold: true, font: 'Calibri', size: 19, color: '334155' }),
                  new TextRun({ text: letter.date, font: 'Calibri', size: 19, color: '0F172A' })
                ]
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: 'Our Ref: ', bold: true, font: 'Calibri', size: 19, color: '334155' }),
                  new TextRun({
                    text: letter.ourReference || letter.letterNumber,
                    bold: true,
                    font: 'Consolas',
                    size: 19,
                    color: '6B21A8'
                  })
                ]
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: 'Your Ref: ', bold: true, font: 'Calibri', size: 19, color: '334155' }),
                  new TextRun({ text: letter.theirReference || '—', font: 'Calibri', size: 19, color: '475569' })
                ]
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: 'Project: ', bold: true, font: 'Calibri', size: 19, color: '334155' }),
                  new TextRun({
                    text: `[${letter.projectAffix || letter.projectCode || 'GEN'}] ${letter.projectName || 'Corporate Logistics & Operations'}`,
                    font: 'Calibri',
                    size: 19,
                    color: '047857'
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Classification: ', bold: true, font: 'Calibri', size: 19, color: '334155' }),
                  new TextRun({
                    text: `${letter.category} (${letter.confidentiality || 'Normal'})`,
                    font: 'Calibri',
                    size: 18,
                    color: '64748B'
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  // 3. Structured Subject Box Table (Full width callout box with thick left border)
  const subjectTable = new Table({
    width: {
      size: 9600,
      type: WidthType.DXA
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 9600, type: WidthType.DXA },
            shading: {
              fill: 'F8FAFC',
              type: ShadingType.CLEAR
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
              right: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
              left: { style: BorderStyle.SINGLE, size: 28, color: '0F172A' } // 3.5pt dark accent border
            },
            margins: { top: 160, bottom: 160, left: 240, right: 200 },
            children: [
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: 'OFFICIAL SUBJECT MATTER:',
                    bold: true,
                    font: 'Calibri',
                    size: 16,
                    color: '64748B'
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `SUBJECT: ${letter.subject.toUpperCase()}`,
                    bold: true,
                    font: 'Calibri',
                    size: 22, // 11pt
                    color: '0F172A'
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  // 4. Letter Body Paragraphs (parsed & justified)
  const bodyParagraphs = parseHtmlToWordParagraphs(letter.bodyHtml);

  // 5. Formal Sign-off & Seal Block
  const signOffParagraphs: Paragraph[] = [
    new Paragraph({
      spacing: { before: 360, after: 80 },
      children: [
        new TextRun({
          text: 'Yours faithfully,',
          font: 'Calibri',
          size: 22,
          color: '334155'
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: companyTitle,
          bold: true,
          font: 'Calibri',
          size: 22,
          color: '0F172A'
        })
      ]
    }),
    // Authentication badge / Signature container
    new Paragraph({
      spacing: { after: 120 },
      border: {
        left: { style: BorderStyle.SINGLE, size: 16, color: '047857' }
      },
      children: [
        new TextRun({
          text:
            letter.status === 'Approved'
              ? '  [✔ OFFICIALLY SIGNED & SEALED - CERTIFIED CORPORATE RECORD]'
              : '  [PENDING BOARD EXECUTIVE SIGNATURE]',
          bold: true,
          font: 'Consolas',
          size: 18,
          color: letter.status === 'Approved' ? '047857' : '94A3B8'
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: letter.approvedBy || letter.preparedBy || 'Authorized Signatory',
          bold: true,
          font: 'Calibri',
          size: 22,
          color: '0F172A'
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'Authorized Signatory  •  Executive Directorate & Secretariat',
          font: 'Calibri',
          size: 18,
          color: '64748B'
        })
      ]
    })
  ];

  // 6. Build Document with Sections & Margins
  const topMarginTwips = convertMillimetersToTwip(letterhead?.contentTopMargin || 25);
  const bottomMarginTwips = convertMillimetersToTwip(letterhead?.contentBottomMargin || 20);
  const leftMarginTwips = convertMillimetersToTwip(letterhead?.contentLeftMargin || 20);
  const rightMarginTwips = convertMillimetersToTwip(letterhead?.contentRightMargin || 20);

  const doc = new Document({
    creator: 'EMA Enterprise Cloud System',
    title: `${letter.letterNumber} - ${letter.subject}`,
    description: `Official Correspondence ${letter.letterNumber}`,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: topMarginTwips,
              bottom: bottomMarginTwips,
              left: leftMarginTwips,
              right: rightMarginTwips
            }
          }
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' }
                },
                spacing: { before: 120 },
                children: [
                  new TextRun({
                    text: `${companyTitle}  |  Ref: ${letter.letterNumber}  |  Page `,
                    font: 'Calibri',
                    size: 16,
                    color: '94A3B8'
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Calibri',
                    size: 16,
                    color: '64748B'
                  }),
                  new TextRun({
                    text: ' of ',
                    font: 'Calibri',
                    size: 16,
                    color: '94A3B8'
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: 'Calibri',
                    size: 16,
                    color: '64748B'
                  })
                ]
              })
            ]
          })
        },
        children: [
          ...headerParagraphs,
          dualBoxesTable,
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          subjectTable,
          new Paragraph({ spacing: { after: 240 }, children: [] }),
          ...bodyParagraphs,
          ...signOffParagraphs
        ]
      }
    ]
  });

  // 7. Pack and Trigger Download
  const blob = await Packer.toBlob(doc);
  const cleanFilename = `${letter.letterNumber.replace(/[\/\\]/g, '_')}_Official_Correspondence.docx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = cleanFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
