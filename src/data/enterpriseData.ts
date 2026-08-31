import { Enterprise, EnterpriseUser, EnterpriseInvitation } from '../types';

export const initialEnterprises: Enterprise[] = [
  {
    id: 'ent-apex',
    name: 'Apex Global Logistics Corp',
    code: 'APEX-8902',
    industry: 'Freight & Supply Chain Logistics',
    plan: 'Enterprise Fleet',
    adminEmail: 'cmbogahawatta@gmail.com',
    adminName: 'Samantha Perera (Admin)',
    adminPin: '1234',
    city: 'Colombo & Regional Hubs',
    country: 'Sri Lanka & Asia-Pacific',
    createdAt: '2024-01-15',
    autoApproveJoiners: false,
    logoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'ent-metro',
    name: 'Metro Express Couriers & Freight',
    code: 'METRO-4120',
    industry: 'Last-Mile Delivery & E-Commerce Cargo',
    plan: 'Professional Fleet',
    adminEmail: 'fleet.admin@metroexpress.com',
    adminName: 'David Miller',
    adminPin: '1234',
    city: 'Metro City Center',
    country: 'United Kingdom',
    createdAt: '2024-03-20',
    autoApproveJoiners: true,
    logoUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'ent-pacific',
    name: 'Pacific Field Engineering & Utilities',
    code: 'PACIFIC-7351',
    industry: 'Energy, Mining & Field Maintenance',
    plan: 'Standard Logistics',
    adminEmail: 'operations@pacificfield.com',
    adminName: 'Elena Rostova',
    adminPin: '1234',
    city: 'Western Industrial Hub',
    country: 'Australia / Pacific',
    createdAt: '2024-06-10',
    autoApproveJoiners: false,
    logoUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=150&auto=format&fit=crop&q=80'
  }
];

export const initialEnterpriseUsers: EnterpriseUser[] = [
  // Apex Users
  {
    id: 'usr-1',
    enterpriseId: 'ent-apex',
    name: 'Samantha Perera',
    email: 'cmbogahawatta@gmail.com',
    role: 'admin',
    status: 'active',
    phone: '+94 77 123 4567',
    department: 'Fleet HQ & Operations',
    joinedAt: '2024-01-15'
  },
  {
    id: 'usr-2',
    enterpriseId: 'ent-apex',
    name: 'Kasun Bandara',
    email: 'kasun.b@companyfleet.com',
    role: 'driver',
    status: 'active',
    assignedDriverId: 'drv-2',
    phone: '+94 71 987 6543',
    department: 'Operations',
    joinedAt: '2024-02-01'
  },
  {
    id: 'usr-3',
    enterpriseId: 'ent-apex',
    name: 'Nalaka Wickrama',
    email: 'nalaka.w@apexlogistics.com',
    role: 'dispatcher',
    status: 'active',
    phone: '+94 77 444 8899',
    department: 'Central Dispatch',
    joinedAt: '2024-03-12'
  },
  {
    id: 'usr-4',
    enterpriseId: 'ent-apex',
    name: 'Nuwan Jayasinghe',
    email: 'nuwan.j@driver-network.com',
    role: 'driver',
    status: 'pending-approval',
    phone: '+94 72 881 2345',
    department: 'Regional Route Pool',
    joinedAt: '2024-08-25'
  },

  // Metro Users
  {
    id: 'usr-5',
    enterpriseId: 'ent-metro',
    name: 'David Miller',
    email: 'fleet.admin@metroexpress.com',
    role: 'admin',
    status: 'active',
    phone: '+44 20 7946 0912',
    department: 'Management',
    joinedAt: '2024-03-20'
  },
  {
    id: 'usr-6',
    enterpriseId: 'ent-metro',
    name: 'Oliver Clarke',
    email: 'oliver.c@metroexpress.com',
    role: 'dispatcher',
    status: 'active',
    phone: '+44 20 7946 0883',
    department: 'Urban Routing',
    joinedAt: '2024-04-05'
  },

  // Pacific Users
  {
    id: 'usr-7',
    enterpriseId: 'ent-pacific',
    name: 'Elena Rostova',
    email: 'operations@pacificfield.com',
    role: 'admin',
    status: 'active',
    phone: '+61 2 9876 5432',
    department: 'Field Operations',
    joinedAt: '2024-06-10'
  }
];

export const initialInvitations: EnterpriseInvitation[] = [
  {
    id: 'inv-1',
    enterpriseId: 'ent-apex',
    email: 'chathura.dispatch@apexlogistics.com',
    role: 'dispatcher',
    code: 'APEX-DISP-88',
    createdAt: '2024-08-20',
    status: 'pending'
  },
  {
    id: 'inv-2',
    enterpriseId: 'ent-apex',
    email: 'shanaka.driver@freightteam.lk',
    role: 'driver',
    code: 'APEX-DRV-42',
    createdAt: '2024-08-24',
    status: 'pending'
  }
];
