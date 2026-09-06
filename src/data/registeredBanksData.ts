import { RegisteredBank } from '../types/bankingTypes';

export const DEFAULT_REGISTERED_BANKS: RegisteredBank[] = [
  {
    id: 'rb-7010',
    bankName: 'Commercial Bank of Ceylon PLC',
    bankCode: '7010',
    shortName: 'COMBANK',
    swiftCode: 'CCEYLKFX',
    category: 'Licensed Commercial Bank',
    headOffice: 'Commercial House, 21 Sir Razik Fareed Mawatha, Colombo 01',
    branches: [
      'World Trade Centre Branch',
      'Head Office / Corporate Branch',
      'Kollupitiya Branch',
      'Bambalapitiya Branch',
      'Fort Main Branch',
      'Kandy Metro Branch',
      'Galle Fort Branch',
      'Kurunegala City Branch',
      'Negombo Main Branch',
      'Jaffna City Branch',
      'Ratnapura Branch'
    ],
    contactNumber: '+94 11 248 6000',
    website: 'https://www.combank.lk',
    status: 'Active',
    notes: 'Primary clearing bank with nationwide branch and ATM network.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7047',
    bankName: 'Bank of Ceylon',
    bankCode: '7047',
    shortName: 'BOC',
    swiftCode: 'BCEYLKLX',
    category: 'Licensed Commercial Bank',
    headOffice: 'BOC Square, No. 01 Bank of Ceylon Mawatha, Colombo 01',
    branches: [
      'Corporate Branch Colombo 01',
      'BOC Tower Fort Branch',
      'Kollupitiya Branch',
      'Kandy Super Grade Branch',
      'Galle City Branch',
      'Anuradhapura Central',
      'Batticaloa Main',
      'Jaffna Main Branch',
      'Kurunegala Corporate',
      'Gampaha Metro'
    ],
    contactNumber: '+94 11 220 4000',
    website: 'https://www.boc.lk',
    status: 'Active',
    notes: 'State-owned premier commercial bank and government project depository.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7083',
    bankName: 'Hatton National Bank PLC',
    bankCode: '7083',
    shortName: 'HNB',
    swiftCode: 'HBLILKLX',
    category: 'Licensed Commercial Bank',
    headOffice: 'HNB Towers, 479 T.B. Jayah Mawatha, Colombo 10',
    branches: [
      'HNB Towers Corporate Branch',
      'Colombo 04 Corporate',
      'Fort City Office',
      'Kollupitiya Branch',
      'Kandy Main Branch',
      'Galle Fort',
      'Negombo Metro',
      'Kurunegala Main',
      'Matara City'
    ],
    contactNumber: '+94 11 266 4664',
    website: 'https://www.hnb.net',
    status: 'Active',
    notes: 'Approved commercial bank for advance payment guarantees and tenders.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7278',
    bankName: 'Sampath Bank PLC',
    bankCode: '7278',
    shortName: 'SAMPATH',
    swiftCode: 'BSAMLKLX',
    category: 'Licensed Commercial Bank',
    headOffice: 'Sampath Centre, 110 Sir James Peiris Mawatha, Colombo 02',
    branches: [
      'Head Office Branch Colombo 02',
      'Colombo Fort Branch',
      'Kollupitiya Metro',
      'Kandy Central',
      'Galle Corporate Branch',
      'Gampaha Metro',
      'Matara Central',
      'Kurunegala City',
      'Panadura Branch'
    ],
    contactNumber: '+94 11 230 3050',
    website: 'https://www.sampath.lk',
    status: 'Active',
    notes: 'High-tech corporate settlement and electronic RTGS provider.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7135',
    bankName: 'People\'s Bank',
    bankCode: '7135',
    shortName: 'PEOPLES',
    swiftCode: 'PSBKLKLX',
    category: 'Licensed Commercial Bank',
    headOffice: 'No. 75 Sir Chittampalam A. Gardiner Mawatha, Colombo 02',
    branches: [
      'Corporate Banking Division Colombo 02',
      'Queen\'s Branch Fort',
      'Kandy Metro Branch',
      'Galle Branch',
      'Kurunegala Main',
      'Jaffna Main Branch',
      'Ratnapura Branch',
      'Anuradhapura City'
    ],
    contactNumber: '+94 11 248 1481',
    website: 'https://www.peoplesbank.lk',
    status: 'Active',
    notes: 'Nationalized commercial bank serving public sector contracts & tenders.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7162',
    bankName: 'Nations Trust Bank PLC',
    bankCode: '7162',
    shortName: 'NTB',
    swiftCode: 'NTBLLKLX',
    category: 'Licensed Commercial Bank',
    headOffice: 'No. 242 Union Place, Colombo 02',
    branches: [
      'Nawam Mawatha Corporate Centre',
      'Millennium Branch Colombo 07',
      'Kollupitiya Branch',
      'Kandy City Centre',
      'Galle Fort',
      'Kurunegala Branch'
    ],
    contactNumber: '+94 11 471 1411',
    website: 'https://www.nationstrust.com',
    status: 'Active',
    notes: 'Corporate treasury and specialized trade services.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7287',
    bankName: 'Seylan Bank PLC',
    bankCode: '7287',
    shortName: 'SEYLAN',
    swiftCode: 'SEYBLKLX',
    category: 'Licensed Commercial Bank',
    headOffice: 'Seylan Towers, No. 90 Galle Road, Colombo 03',
    branches: [
      'Seylan Towers Corporate Branch',
      'Fort Main Office',
      'Bambalapitiya Branch',
      'Kandy Branch',
      'Galle City',
      'Negombo Branch'
    ],
    contactNumber: '+94 11 245 6789',
    website: 'https://www.seylan.lk',
    status: 'Active',
    notes: 'Commercial bank with extensive trade finance solutions.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7214',
    bankName: 'National Development Bank PLC',
    bankCode: '7214',
    shortName: 'NDB',
    swiftCode: 'NDBLLKLX',
    category: 'Licensed Commercial Bank',
    headOffice: 'NDB EDB Tower, No. 40 Nawam Mawatha, Colombo 02',
    branches: [
      'Nawam Mawatha Corporate Branch',
      'Fort Corporate Office',
      'Kollupitiya Branch',
      'Kandy Branch',
      'Galle Branch'
    ],
    contactNumber: '+94 11 244 8448',
    website: 'https://www.ndbbank.com',
    status: 'Active',
    notes: 'Project finance and industrial development banking specialist.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7056',
    bankName: 'DFCC Bank PLC',
    bankCode: '7056',
    shortName: 'DFCC',
    swiftCode: 'DFCCLKLX',
    category: 'Licensed Commercial Bank',
    headOffice: 'No. 73/5 Galle Road, Colombo 03',
    branches: [
      'Head Office Corporate Branch',
      'Fort Branch',
      'Kollupitiya Branch',
      'Kandy Metro',
      'Galle City Branch'
    ],
    contactNumber: '+94 11 235 0000',
    website: 'https://www.dfcc.lk',
    status: 'Active',
    notes: 'Pioneering infrastructure and industrial credit institution.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7206',
    bankName: 'Standard Chartered Bank',
    bankCode: '7206',
    shortName: 'SCB',
    swiftCode: 'SCBLIKLX',
    category: 'Foreign Bank',
    headOffice: 'No. 37 York Street, Fort, Colombo 01',
    branches: [
      'Fort Main Branch Colombo 01',
      'Kollupitiya Priority Banking Centre',
      'World Trade Centre Office'
    ],
    contactNumber: '+94 11 248 0000',
    website: 'https://www.sc.com/lk',
    status: 'Active',
    notes: 'International banking facility for cross-border transactions and heavy equipment LC.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7092',
    bankName: 'The Hongkong and Shanghai Banking Corporation Limited (HSBC)',
    bankCode: '7092',
    shortName: 'HSBC',
    swiftCode: 'HSBCLKHX',
    category: 'Foreign Bank',
    headOffice: 'No. 24 Sir Baron Jayatilaka Mawatha, Fort, Colombo 01',
    branches: [
      'Main Office Fort Colombo 01',
      'Union Place Premier Centre',
      'Pelawatte Branch',
      'Kandy Branch'
    ],
    contactNumber: '+94 11 447 2200',
    website: 'https://www.hsbc.lk',
    status: 'Active',
    notes: 'Multinational commercial banking partner for multinational joint ventures.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7302',
    bankName: 'Pan Asia Banking Corporation PLC',
    bankCode: '7302',
    shortName: 'PAN ASIA',
    swiftCode: 'PABCLLKX',
    category: 'Licensed Commercial Bank',
    headOffice: 'No. 450 Galle Road, Colombo 03',
    branches: [
      'Head Office Kollupitiya',
      'Fort Branch',
      'Bambalapitiya Branch',
      'Kandy Branch'
    ],
    contactNumber: '+94 11 466 7222',
    website: 'https://www.pabcbank.com',
    status: 'Active',
    notes: 'Domestic commercial bank with business trade credit.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7311',
    bankName: 'Union Bank of Colombo PLC',
    bankCode: '7311',
    shortName: 'UNION',
    swiftCode: 'UBLILKLX',
    category: 'Licensed Commercial Bank',
    headOffice: 'No. 64 Galle Road, Colombo 03',
    branches: [
      'Head Office Corporate Branch',
      'Pettah Commercial Branch',
      'Kandy Branch',
      'Galle Branch'
    ],
    contactNumber: '+94 11 237 4100',
    website: 'https://www.unionb.com',
    status: 'Active',
    notes: 'Commercial bank offering SME & corporate banking facilities.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7463',
    bankName: 'Amana Bank PLC',
    bankCode: '7463',
    shortName: 'AMANA',
    swiftCode: 'AMNALKLX',
    category: 'Licensed Commercial Bank',
    headOffice: 'No. 486 Galle Road, Colombo 03',
    branches: [
      'Head Office Branch Colombo 03',
      'Pettah Branch',
      'Kandy Branch',
      'Dehiwala Branch',
      'Galle Branch'
    ],
    contactNumber: '+94 11 775 6756',
    website: 'https://www.amanabank.lk',
    status: 'Active',
    notes: 'Participatory banking institution operating under CBSL regulations.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7472',
    bankName: 'Cargills Bank Limited',
    bankCode: '7472',
    shortName: 'CARGILLS',
    swiftCode: 'CAGLLKLX',
    category: 'Licensed Commercial Bank',
    headOffice: 'No. 696 Galle Road, Colombo 03',
    branches: [
      'Head Office Colombo 03',
      'Maitland Crescent Branch',
      'Kandy Branch',
      'Kurunegala Branch'
    ],
    contactNumber: '+94 11 764 0640',
    website: 'https://www.cargillsbank.com',
    status: 'Active',
    notes: 'Retail & commercial bank with retail supermarket network integration.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7719',
    bankName: 'National Savings Bank (NSB)',
    bankCode: '7719',
    shortName: 'NSB',
    swiftCode: 'NSBLLKLX',
    category: 'Licensed Specialized Bank',
    headOffice: 'NSB Head Office, 255 Galle Road, Colombo 03',
    branches: [
      'Head Office Kollupitiya',
      'Fort Branch',
      'Bambalapitiya Branch',
      'Kandy Metro',
      'Galle Central'
    ],
    contactNumber: '+94 11 237 9379',
    website: 'https://www.nsb.lk',
    status: 'Active',
    notes: '100% government guaranteed savings and fixed deposit specialized bank.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7728',
    bankName: 'Regional Development Bank (RDB)',
    bankCode: '7728',
    shortName: 'RDB',
    swiftCode: 'RDBLLKLX',
    category: 'Licensed Specialized Bank',
    headOffice: 'No. 933 Kandy Road, Wedamulla, Kelaniya',
    branches: [
      'Kelaniya Head Office',
      'Colombo Regional Office',
      'Kandy Regional Office',
      'Kurunegala Regional Office'
    ],
    contactNumber: '+94 11 203 5454',
    website: 'https://www.rdb.lk',
    status: 'Active',
    notes: 'State-owned specialized development bank for regional enterprise financing.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7737',
    bankName: 'Sanasa Development Bank PLC (SDB bank)',
    bankCode: '7737',
    shortName: 'SDB',
    swiftCode: 'SANALKLX',
    category: 'Licensed Specialized Bank',
    headOffice: 'No. 12 Maitland Crescent, Colombo 07',
    branches: [
      'Head Office Colombo 07',
      'Kirulapone Branch',
      'Gampaha Branch',
      'Kandy Branch',
      'Matara Branch'
    ],
    contactNumber: '+94 11 541 1411',
    website: 'https://www.sdb.lk',
    status: 'Active',
    notes: 'Licensed specialized bank focusing on cooperative and SME development.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7108',
    bankName: 'Habib Bank Limited',
    bankCode: '7108',
    shortName: 'HBL',
    swiftCode: 'HBBLLKLX',
    category: 'Foreign Bank',
    headOffice: 'No. 70 A, Dharmapala Mawatha, Colombo 03',
    branches: [
      'Colombo Main Branch',
      'Pettah Branch'
    ],
    contactNumber: '+94 11 242 1888',
    website: 'https://www.hbl.com/srilanka',
    status: 'Active',
    notes: 'Licensed foreign bank branch operating in Sri Lanka.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7223',
    bankName: 'State Bank of India',
    bankCode: '7223',
    shortName: 'SBI',
    swiftCode: 'SBINLKLX',
    category: 'Foreign Bank',
    headOffice: 'No. 16 Sir Baron Jayatilaka Mawatha, Fort, Colombo 01',
    branches: [
      'Fort Main Office Colombo 01',
      'FCBU Branch',
      'Kandy Branch'
    ],
    contactNumber: '+94 11 232 6133',
    website: 'https://lk.statebank',
    status: 'Active',
    notes: 'Foreign bank facilitating Indo-Lanka trade credit and LC transactions.',
    createdAt: '2024-01-01'
  },
  {
    id: 'rb-7038',
    bankName: 'CitiBank N.A.',
    bankCode: '7038',
    shortName: 'CITI',
    swiftCode: 'CITILKLX',
    category: 'Foreign Bank',
    headOffice: 'No. 65 C Dharmapala Mawatha, Colombo 07',
    branches: [
      'Colombo Main Corporate Branch'
    ],
    contactNumber: '+94 11 479 4700',
    website: 'https://www.citigroup.com',
    status: 'Active',
    notes: 'Global institutional and corporate banking partner in Colombo.',
    createdAt: '2024-01-01'
  }
];

export const SAMPLE_BANK_CSV_CONTENT = `bank_name,bank_code,swift_code,short_name,branches,category,head_office
Commercial Bank of Ceylon PLC,7010,CCEYLKFX,COMBANK,"World Trade Centre;Head Office;Kollupitiya;Kandy Metro;Galle Fort",Licensed Commercial Bank,"Commercial House, Colombo 01"
Bank of Ceylon,7047,BCEYLKLX,BOC,"Corporate Branch;BOC Tower Fort;Kandy Super Grade;Galle City",Licensed Commercial Bank,"BOC Square, Colombo 01"
Hatton National Bank PLC,7083,HBLILKLX,HNB,"HNB Towers;Colombo 04;Fort;Kandy Main;Galle",Licensed Commercial Bank,"HNB Towers, Colombo 10"
Sampath Bank PLC,7278,BSAMLKLX,SAMPATH,"Head Office Colombo 02;Fort;Kollupitiya;Kandy",Licensed Commercial Bank,"Sampath Centre, Colombo 02"
People's Bank,7135,PSBKLKLX,PEOPLES,"Corporate Banking;Queen's Branch Fort;Kandy Metro;Galle",Licensed Commercial Bank,"Sir Chittampalam Mawatha, Colombo 02"
Nations Trust Bank PLC,7162,NTBLLKLX,NTB,"Nawam Mawatha;Colombo 07;Kollupitiya;Kandy",Licensed Commercial Bank,"Union Place, Colombo 02"
Seylan Bank PLC,7287,SEYBLKLX,SEYLAN,"Seylan Towers;Fort;Bambalapitiya;Kandy",Licensed Commercial Bank,"Seylan Towers, Colombo 03"
National Development Bank PLC,7214,NDBLLKLX,NDB,"Nawam Mawatha;Fort;Kollupitiya;Kandy",Licensed Commercial Bank,"NDB Tower, Colombo 02"
DFCC Bank PLC,7056,DFCCLKLX,DFCC,"Head Office;Fort;Kollupitiya;Kandy",Licensed Commercial Bank,"Galle Road, Colombo 03"
Standard Chartered Bank,7206,SCBLIKLX,SCB,"Fort Main Branch;Kollupitiya;World Trade Centre",Foreign Bank,"York Street, Colombo 01"
The Hongkong and Shanghai Banking Corp (HSBC),7092,HSBCLKHX,HSBC,"Main Office Fort;Union Place;Pelawatte",Foreign Bank,"Baron Jayatilaka Mawatha, Colombo 01"
`;

/**
 * Utility to parse CSV/TSV text into an array of RegisteredBank items
 */
export function parseBankCsvData(rawText: string): {
  success: boolean;
  banks: Array<Omit<RegisteredBank, 'id'>>;
  errors: string[];
} {
  const errors: string[] = [];
  const banks: Array<Omit<RegisteredBank, 'id'>> = [];

  if (!rawText || !rawText.trim()) {
    return { success: false, banks: [], errors: ['No data supplied to parse.'] };
  }

  // Try JSON first in case user pasted JSON
  const trimmed = rawText.trim();
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      const parsed = JSON.parse(trimmed);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      items.forEach((item, idx) => {
        const name = item.bankName || item.bank_name || item.name || item.bank;
        const code = String(item.bankCode || item.bank_code || item.code || '').trim();
        if (!name) {
          errors.push(`JSON Item #${idx + 1}: Missing bank name.`);
          return;
        }
        if (!code) {
          errors.push(`JSON Item #${idx + 1} (${name}): Missing bank code.`);
          return;
        }
        let branchesList: string[] = [];
        if (Array.isArray(item.branches)) {
          branchesList = item.branches.map(String);
        } else if (typeof item.branches === 'string') {
          branchesList = item.branches.split(/[,;|]/).map((s: string) => s.trim()).filter(Boolean);
        }
        banks.push({
          bankName: String(name).trim(),
          bankCode: code,
          shortName: item.shortName || item.short_name || item.code,
          swiftCode: item.swiftCode || item.swift_code || item.swift,
          category: item.category || 'Licensed Commercial Bank',
          headOffice: item.headOffice || item.head_office || '',
          branches: branchesList.length > 0 ? branchesList : ['Head Office'],
          contactNumber: item.contactNumber || item.contact || item.telephone,
          website: item.website,
          status: item.status === 'Inactive' ? 'Inactive' : 'Active',
          notes: item.notes || 'Imported via Bank Directory'
        });
      });
      return { success: banks.length > 0, banks, errors };
    } catch {
      // Continue to CSV parsing if JSON parse fails
    }
  }

  // Split into lines
  const lines = trimmed.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return { success: false, banks: [], errors: ['Data is empty.'] };
  }

  // Check delimiter (comma, tab, semicolon)
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : (firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',');

  // Check header
  let startIndex = 0;
  const headerLower = firstLine.toLowerCase();
  const hasHeader = headerLower.includes('bank') || headerLower.includes('code') || headerLower.includes('swift') || headerLower.includes('name');
  if (hasHeader) {
    startIndex = 1;
  }

  // Helper to parse line handling quotes
  const parseLine = (line: string, delim: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delim && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const cells = parseLine(line, delimiter);
    if (cells.length === 0 || (cells.length === 1 && !cells[0])) continue;

    // Fields expected: bank_name, bank_code, [swift_code], [short_name], [branches], [category], [head_office]
    const bankName = cells[0]?.trim();
    const bankCode = cells[1]?.trim();

    if (!bankName) {
      errors.push(`Row ${i + 1}: Empty bank name.`);
      continue;
    }
    if (!bankCode) {
      errors.push(`Row ${i + 1} (${bankName}): Missing bank code.`);
      continue;
    }

    const swiftCode = cells[2]?.trim() || '';
    const shortName = cells[3]?.trim() || '';
    const rawBranches = cells[4]?.trim() || '';
    const categoryRaw = cells[5]?.trim() || '';
    const headOffice = cells[6]?.trim() || '';

    const branches = rawBranches
      ? rawBranches.split(/[,;|]/).map(s => s.trim()).filter(Boolean)
      : ['Head Office / Main Branch'];

    let category: RegisteredBank['category'] = 'Licensed Commercial Bank';
    const catLower = categoryRaw.toLowerCase();
    if (catLower.includes('foreign')) category = 'Foreign Bank';
    else if (catLower.includes('special')) category = 'Licensed Specialized Bank';
    else if (catLower.includes('other')) category = 'Other';

    banks.push({
      bankName,
      bankCode,
      shortName: shortName || undefined,
      swiftCode: swiftCode || undefined,
      category,
      headOffice: headOffice || undefined,
      branches: branches.length > 0 ? branches : ['Head Office'],
      status: 'Active',
      notes: 'Imported via CSV/File batch parser'
    });
  }

  return {
    success: banks.length > 0,
    banks,
    errors
  };
}
