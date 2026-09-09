export const SEED_ACCOUNTS = [
  { code: '1001', name: 'Cash / Bank (Operating Account)', group: 'asset', type: 'Asset', dimensions: ['cost-center', 'location'], status: 'active', normalBalance: 'Debit', balance: 1790600 },
  { code: '1100', name: 'Premium Receivable', group: 'asset', type: 'Asset', dimensions: ['mga', 'state', 'lob', 'cost-center'], status: 'active', normalBalance: 'Debit', balance: 1241800 },
  { code: '1150', name: 'Reinsurance Recoverables', group: 'asset', type: 'Asset', dimensions: ['reinsurer', 'treaty'], status: 'active', normalBalance: 'Debit', balance: 342000 },
  // Generic multi-entity accounts (Pizza/franchise demo and beyond) — new
  // codes, deliberately not reusing 1100/2200/4100/5100 etc. so the existing
  // insurance PAS flow (still functional, just unlinked from nav) keeps
  // showing its own correct account names.
  { code: '1180', name: 'Due from Stores (Intercompany Receivable)', group: 'asset', type: 'Asset', dimensions: ['cost-center'], status: 'active', normalBalance: 'Debit', balance: 0 },
  { code: '1200', name: 'Accounts Receivable (Trade / General)', group: 'asset', type: 'Asset', dimensions: ['cost-center'], status: 'active', normalBalance: 'Debit', balance: 154000 },
  { code: '1400', name: 'Prepaid Expenses & Other Current Assets', group: 'asset', type: 'Asset', dimensions: ['cost-center'], status: 'active', normalBalance: 'Debit', balance: 48000 },
  { code: '2001', name: 'Accounts Payable (Trade)', group: 'liability', type: 'Liability', dimensions: ['cost-center'], status: 'active', normalBalance: 'Credit', balance: 842100 },
  { code: '2050', name: 'Due to Main Hub (Intercompany Payable)', group: 'liability', type: 'Liability', dimensions: ['cost-center'], status: 'active', normalBalance: 'Credit', balance: 0 },
  { code: '2100', name: 'Ceded Reinsurance Premium Payable', group: 'liability', type: 'Liability', dimensions: ['reinsurer', 'treaty'], status: 'active', normalBalance: 'Credit', balance: 295000 },
  { code: '2200', name: 'Net Premium Payable to Carrier', group: 'liability', type: 'Liability', dimensions: ['carrier-dim', 'lob'], status: 'active', normalBalance: 'Credit', balance: 485000 },
  { code: '2300', name: 'Surplus Lines Taxes & Regulatory Fees Payable', group: 'liability', type: 'Liability', dimensions: ['state'], status: 'active', normalBalance: 'Credit', balance: 67200 },
  { code: '2400', name: 'Unearned Premium Reserve (UPR)', group: 'liability', type: 'Liability', dimensions: ['lob', 'treaty'], status: 'active', normalBalance: 'Credit', balance: 890000 },
  { code: '3001', name: 'Common Stock / Paid-In Capital', group: 'equity', type: 'Equity', dimensions: [], status: 'active', normalBalance: 'Credit', balance: 1000000 },
  { code: '3100', name: 'Retained Earnings', group: 'equity', type: 'Equity', dimensions: [], status: 'active', normalBalance: 'Credit', balance: 450000 },
  { code: '4001', name: 'Gross Written Premium (GWP)', group: 'revenue', type: 'Revenue', dimensions: ['lob', 'mga', 'state'], status: 'active', normalBalance: 'Credit', balance: 2450000 },
  { code: '4100', name: 'MGA Program Override & Policy Fee Revenue', group: 'revenue', type: 'Revenue', dimensions: ['mga', 'lob'], status: 'active', normalBalance: 'Credit', balance: 245000 },
  { code: '4200', name: 'Producer / Broker Commission Revenue', group: 'revenue', type: 'Revenue', dimensions: ['broker', 'lob'], status: 'active', normalBalance: 'Credit', balance: 68000 },
  { code: '4500', name: 'Sales Revenue', group: 'revenue', type: 'Revenue', dimensions: ['class', 'location', 'customer-job', 'product-line'], status: 'active', normalBalance: 'Credit', balance: 0 },
  { code: '4600', name: 'Franchise Revenue Share Income', group: 'revenue', type: 'Revenue', dimensions: ['cost-center'], status: 'active', normalBalance: 'Credit', balance: 0 },
  { code: '5001', name: 'Incurred Losses & LAE', group: 'expense', type: 'Expense', dimensions: ['lob', 'treaty'], status: 'active', normalBalance: 'Debit', balance: 680000 },
  { code: '5100', name: 'Acquisition Costs & Broker Commissions', group: 'expense', type: 'Expense', dimensions: ['broker', 'lob'], status: 'active', normalBalance: 'Debit', balance: 210000 },
  { code: '5200', name: 'General & Administrative Expenses', group: 'expense', type: 'Expense', dimensions: ['cost-center', 'location'], status: 'active', normalBalance: 'Debit', balance: 185000 },
  { code: '5300', name: 'Revenue Share Expense', group: 'expense', type: 'Expense', dimensions: ['cost-center'], status: 'active', normalBalance: 'Debit', balance: 0 }
];

export const SEED_PERIODS = [
  { id: '2026-01', month: 'January', year: 2026, status: 'hard_locked', softClose: true, hardLock: true, closedAt: '2026-02-05', closedBy: 'Sarah Jenkins (Controller)' },
  { id: '2026-02', month: 'February', year: 2026, status: 'hard_locked', softClose: true, hardLock: true, closedAt: '2026-03-05', closedBy: 'Sarah Jenkins (Controller)' },
  { id: '2026-03', month: 'March', year: 2026, status: 'hard_locked', softClose: true, hardLock: true, closedAt: '2026-04-05', closedBy: 'Sarah Jenkins (Controller)' },
  { id: '2026-04', month: 'April', year: 2026, status: 'in_progress', softClose: true, hardLock: false, closedAt: null },
  { id: '2026-05', month: 'May', year: 2026, status: 'open', softClose: false, hardLock: false, closedAt: null },
  { id: '2026-06', month: 'June', year: 2026, status: 'open', softClose: false, hardLock: false, closedAt: null },
  { id: '2026-07', month: 'July', year: 2026, status: 'open', softClose: false, hardLock: false, closedAt: null },
  { id: '2026-08', month: 'August', year: 2026, status: 'open', softClose: false, hardLock: false, closedAt: null },
  { id: '2026-09', month: 'September', year: 2026, status: 'open', softClose: false, hardLock: false, closedAt: null },
  { id: '2026-10', month: 'October', year: 2026, status: 'open', softClose: false, hardLock: false, closedAt: null },
  { id: '2026-11', month: 'November', year: 2026, status: 'open', softClose: false, hardLock: false, closedAt: null },
  { id: '2026-12', month: 'December', year: 2026, status: 'open', softClose: false, hardLock: false, closedAt: null }
];

// entity/account mirror FinanceContext's INITIAL_BANK_TRANSACTIONS exactly —
// Bank Reconciliation filters the feed to the logged-in role's own account
// by these two fields, so a synced transaction missing them never matches
// any account and the page shows empty regardless of what's seeded here.
// Only genuinely external/unrelated bank activity — the PAS lifecycle rows
// (Ayushi's deposit, the wire to NTA, Southlake's net remittance) used to
// be hardcoded here too, but that meant "Get Transactions"/"Auto-Sync"
// would keep restoring the original Match-scenario amounts even after an
// Extra Pay or Pay Short run posted different ones. Those three are now
// generated live client-side from posted PAS journal entries instead — see
// `pasBankFeedTransactions` in react/src/context/FinanceContext.jsx.
export const SEED_BANK_TRANSACTIONS = [
  { id: 'TXN-9023', date: '2026-09-01', description: 'Texas Dept of Insurance Stamping Fee Q3', amount: -350.00, type: 'Debit', status: 'Unallocated Suspense', contraAccount: null, entity: 'ENT-MGA-01', account: 'mgaOperating' },
  { id: 'TXN-9025', date: '2026-09-03', description: 'AWS Cloud Hosting Monthly Infrastructure', amount: -1240.00, type: 'Debit', status: 'Matched', contraAccount: '2001', entity: 'ENT-MGA-01', account: 'mgaOperating' }
];

// Intentionally empty: journal entries for this scenario (POL-V8NHT) are now
// created dynamically — via the PAS Event Injector's Stage 1-5 presets, or
// Quick Simulate — rather than pre-baked here. A pre-completed narrative in
// seed data meant every fresh reseed showed "already collected/already
// settled" figures before any real action had happened.
export const SEED_JOURNAL_ENTRIES = [];

export const SEED_USERS = [
  {
    email: 'carrier@gmail.com',
    name: 'Southlake Insurance Co.',
    password: 'admin@123',
    role: 'carrier',
    roleLabel: 'Risk Carrier Underwriting',
    entityId: 'ENT-CAR-01',
    entityName: 'Southlake Risk Carriers Ltd',
    businessType: 'carrier',
    businessLabel: 'Risk Underwriting Carrier',
    avatarColor: '#2563EB',
    initials: 'SO',
    status: 'Active',
    twoFactorEnabled: true
  },
  {
    email: 'mga@gmail.com',
    name: 'NTA Program Administrators',
    password: 'admin@123',
    role: 'mga',
    roleLabel: 'Managing General Agent (MGA)',
    entityId: 'ENT-MGA-01',
    entityName: 'NTA Delegated Underwriters',
    businessType: 'mga',
    businessLabel: 'MGA / Program Manager',
    avatarColor: '#F97316',
    initials: 'NTA',
    status: 'Active',
    twoFactorEnabled: true
  },
  {
    email: 'broker@gmail.com',
    name: 'HIT Agency Group',
    password: 'admin@123',
    role: 'broker',
    roleLabel: 'Retail Broker & Producer',
    entityId: 'ENT-AGY-01',
    entityName: 'HIT Retail Producers Inc.',
    businessType: 'agency',
    businessLabel: 'Retail Insurance Agency',
    avatarColor: '#10B981',
    initials: 'HIT',
    status: 'Active',
    twoFactorEnabled: true
  },
  {
    email: 'insured@gmail.com',
    name: 'Ayushi Fleet Logistics',
    password: 'admin@123',
    role: 'insured',
    roleLabel: 'Commercial Policyholder',
    entityId: 'INS-AYUSHI',
    entityName: 'Ayushi Transport & Hauling Corp',
    businessType: 'general-business',
    businessLabel: 'Commercial Trucking Fleet',
    avatarColor: '#8B5CF6',
    initials: 'AY',
    status: 'Active',
    twoFactorEnabled: true
  },
  {
    email: 'admin@veridex.com',
    name: 'Jordan Blake',
    password: 'admin@123',
    role: 'owner',
    roleLabel: 'Business Owner / Principal',
    entityId: 'ENT-MINE',
    entityName: 'My Business',
    businessType: 'mga',
    businessLabel: 'MGA / Program Manager',
    avatarColor: '#0369A1',
    initials: 'JB',
    status: 'Active',
    twoFactorEnabled: true
  },
  {
    email: 'sjenkins@veridex.com',
    name: 'Sarah Jenkins',
    password: 'admin@123',
    role: 'Controller',
    roleLabel: 'Corporate Controller',
    department: 'Finance & Accounting',
    status: 'Active',
    twoFactorEnabled: true
  },
  {
    email: 'mvance@veridex.com',
    name: 'Marcus Vance',
    password: 'admin@123',
    role: 'Super Admin',
    roleLabel: 'Platform Administrator',
    department: 'Information Technology',
    status: 'Active',
    twoFactorEnabled: true
  },
  // Generic multi-entity demo (Pizza franchise scenario) — added alongside
  // the insurance demo users above, not replacing them.
  {
    email: 'hub@pizza.demo',
    name: 'Jordan Blake',
    password: 'admin@123',
    role: 'hub-admin',
    roleLabel: 'Main Hub Administrator',
    entityId: 'ENT-HUB-01',
    entityName: 'Main Hub',
    businessType: 'hub',
    businessLabel: 'Franchise Main Hub',
    avatarColor: '#0369A1',
    initials: 'MH',
    status: 'Active',
    twoFactorEnabled: true
  },
  {
    email: 'franchise@pizza.demo',
    name: 'Marco Rossi',
    password: 'admin@123',
    role: 'franchise-owner',
    roleLabel: 'Franchise Store Owner',
    entityId: 'ENT-FRN-01',
    entityName: 'Franchise Store #12',
    businessType: 'franchise',
    businessLabel: 'Franchise-Owned Store',
    avatarColor: '#F97316',
    initials: 'FS',
    status: 'Active',
    twoFactorEnabled: true
  },
  {
    email: 'ownstore@pizza.demo',
    name: 'Priya Nair',
    password: 'admin@123',
    role: 'ownstore-manager',
    roleLabel: 'Own Store Manager',
    entityId: 'ENT-OWN-01',
    entityName: 'Own Store #1',
    businessType: 'ownstore',
    businessLabel: 'Company-Owned Store',
    avatarColor: '#10B981',
    initials: 'OS',
    status: 'Active',
    twoFactorEnabled: true
  }
];

export const SEED_INVOICES = [
  {
    id: 'INV-AP-001', invoiceNumber: 'INV-AP-001', direction: 'AP',
    partnerName: 'Southlake Risk Carriers Ltd', partnerType: 'Carrier',
    policyNumber: 'POL-V8NHT', entity: 'ENT-MGA-01',
    amount: 29757.00, paidAmount: 0, balance: 29757.00, dueDate: '2026-09-02',
    status: 'Pending Remittance', matchStatus: '3-Way Matched',
    description: 'Carrier Net Remittance on POL-V8NHT (Gross $33,257 less $3,500 MGA fee)', category: 'Carrier Remittance'
  },
  {
    id: 'INV-AP-002', invoiceNumber: 'INV-AP-002', direction: 'AP',
    partnerName: 'Texas State Comptroller', partnerType: 'Vendor',
    policyNumber: 'POL-V8NHT', entity: 'ENT-MGA-01',
    amount: 3503.00, paidAmount: 0, balance: 3503.00, dueDate: '2026-09-15',
    status: 'Accrued', matchStatus: 'Approved',
    description: 'Texas Surplus Lines Tax (4.85%) & Stamping Fee escrow', category: 'Statutory Tax'
  },
  {
    id: 'INV-AP-003', invoiceNumber: 'INV-AP-003', direction: 'AP',
    partnerName: 'NTA Delegated Underwriters', partnerType: 'MGA',
    policyNumber: 'POL-V8NHT', entity: 'ENT-AGY-01',
    amount: 36760.00, paidAmount: 0, balance: 36760.00, dueDate: '2026-08-30',
    status: 'Awaiting Settlement', matchStatus: '3-Way Matched',
    description: 'Retail Broker Net Remittance to MGA ($39,260 gross less $2,500 retained commission)', category: 'Broker Remittance'
  },
  {
    id: 'INV-AP-004', invoiceNumber: 'INV-AP-004', direction: 'AP',
    partnerName: 'Amazon Web Services', partnerType: 'Vendor',
    policyNumber: 'N/A', entity: 'ENT-CORP',
    amount: 1240.00, paidAmount: 0, balance: 1240.00, dueDate: '2026-09-10',
    status: 'Approved', matchStatus: 'Auto-Matched',
    description: 'Monthly Cloud Infrastructure & Database Hosting', category: 'IT & SaaS'
  },
  {
    id: 'INV-AR-001', invoiceNumber: 'INV-AR-001', direction: 'AR',
    partnerName: 'Ayushi Fleet Logistics Corp', partnerType: 'Insured',
    policyNumber: 'POL-V8NHT', entity: 'ENT-AGY-01',
    amount: 39260.00, paidAmount: 0, balance: 39260.00, dueDate: '2026-08-28',
    status: 'Open', agingBucket: '0-30 Days',
    description: 'Gross Commercial Trucking Premium Invoice', category: 'Premium'
  },
  {
    id: 'INV-AR-002', invoiceNumber: 'INV-AR-002', direction: 'AR',
    partnerName: 'NTA Program Administrators', partnerType: 'MGA',
    policyNumber: 'POL-V8NHT', entity: 'ENT-CAR-01',
    amount: 29757.00, paidAmount: 0, balance: 29757.00, dueDate: '2026-09-05',
    status: 'Pending Bordereau Ingestion', agingBucket: 'Current',
    description: 'Carrier Monthly Inbound Bordereau Receivable', category: 'Bordereau'
  },
  {
    id: 'INV-AR-003', invoiceNumber: 'INV-AR-003', direction: 'AR',
    partnerName: 'Lone Star Hauling LLC', partnerType: 'Insured',
    policyNumber: 'POL-LS-992', entity: 'ENT-AGY-01',
    amount: 14850.00, paidAmount: 0, balance: 14850.00, dueDate: '2026-07-15',
    status: 'Past Due', agingBucket: '31-60 Days',
    description: 'Commercial Auto Liability Endorsement Premium', category: 'Premium'
  }
];
