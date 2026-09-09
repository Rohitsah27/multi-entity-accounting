export const NAV_CONFIG = [
  {
    id: 'dashboard',
    label: 'Platform & Dashboards',
    moduleId: null,
    children: [
      { id: 'home', label: 'Home Dashboard', href: '/' }
    ]
  },
  {
    id: 'gl',
    label: 'General Ledger',
    moduleId: 'gl',
    children: [
      { id: 'chart-of-accounts', label: 'Chart of Accounts', href: '/chart-of-accounts' },
      { id: 'journal-entry', label: 'Journal Entry', href: '/journal-entry' },
      { id: 'financial-statements', label: 'Financial Statements', href: '/financial-statements' },
      { id: 'period-locking', label: 'Period Close', href: '/period-close' },
      { id: 'gl-simulation', label: 'Insurance Flow Simulator', href: '/insurance-flow-simulator' }
    ]
  },
  {
    id: 'accounts-receivable',
    label: 'Accounts Receivable',
    moduleId: 'ar',
    children: [
      { id: 'accounts-receivable', label: 'AR Register', href: '/accounts-receivable' },
      { id: 'ar-aging', label: 'AR Aging', href: '/accounts-receivable#ar-aging' },
      { id: 'ar-statements', label: 'Statements', href: '/accounts-receivable#ar-statements' }
    ]
  },
  {
    id: 'billing',
    label: 'Billing & Invoicing',
    moduleId: 'billing',
    children: [
      { id: 'billing', label: 'Invoices & Billing Plans', href: '/billing-invoicing' }
    ]
  },
  {
    id: 'accounts-payable',
    label: 'Accounts Payable',
    moduleId: 'ap',
    children: [
      { id: 'accounts-payable', label: 'All Invoices', href: '/accounts-payable' },
      { id: 'ap-ach', label: 'ACH Payments', href: '/accounts-payable#ap-ach' },
      { id: 'ap-echecks', label: 'E-Checks', href: '/accounts-payable#ap-echecks' },
      { id: 'ap-aging', label: 'AP Aging', href: '/accounts-payable#ap-aging' }
    ]
  },
  {
    id: 'bank',
    label: 'Bank & Cash Management',
    moduleId: 'bank',
    children: [
      { id: 'bank-reconciliation', label: 'Bank Reconciliation', href: '/bank-reconciliation' },
      { id: 'recon-approvals', label: 'Recon Approvals', href: '/bank-reconciliation#recon-approvals' }
    ]
  },
  {
    id: 'payroll',
    label: 'Payroll',
    moduleId: 'payroll',
    children: [
      { id: 'payroll', label: 'Payroll & Employees', href: '/payroll' }
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory & Costing',
    moduleId: 'inventory',
    children: [
      { id: 'inventory', label: 'Inventory & Manufacturing', href: '/inventory-costing' }
    ]
  },
  {
    id: 'fixed-assets',
    label: 'Fixed Assets',
    moduleId: 'fixed-assets',
    children: [
      { id: 'fixed-assets', label: 'Asset Register & Depreciation', href: '/fixed-assets' }
    ]
  },

  {
    id: 'reporting',
    label: 'Reporting & Analytics',
    moduleId: 'reporting',
    children: [
      { id: 'reporting', label: 'Report & Dashboard Builder', href: '/reporting-analytics' }
    ]
  },
  {
    id: 'pas-policy',
    label: 'Policy Admin (PAS)',
    moduleId: 'insurance',
    children: [
      { id: 'pas-policy', label: 'Policy Admin & Lifecycle', href: '/pas-policy' }
    ]
  },
  {
    id: 'pos-operations',
    label: 'POS Order Admin (POS)',
    moduleId: 'pizza',
    children: [
      { id: 'pos-operations', label: 'POS Event Injector', href: '/pos-operations' }
    ]
  },
  {
    id: 'subledger',
    label: 'Subledger Processing',
    moduleId: 'insurance',
    children: [
      { id: 'subledger', label: 'Subledger Processing', href: '/subledger-processing' }
    ]
  },
  {
    id: 'audit-trail',
    label: 'Audit & Controls',
    moduleId: null,
    children: [
      { id: 'audit-trail', label: 'Audit Trail', href: '/audit-trail' }
    ]
  },
  {
    id: 'admin-config',
    label: 'Administration',
    moduleId: 'admin-config',
    children: [
      { id: 'admin-config', label: 'Configuration Centre', href: '/admin-config' },
      { id: 'setup-wizard', label: 'Setup Wizard', href: '/setup-wizard' },
      { id: 'excel-onboarding', label: 'Excel Onboarding', href: '/excel-onboarding' }
    ]
  },
  {
    id: 'integration',
    label: 'API & Integration',
    moduleId: 'integration',
    children: [
      { id: 'integration', label: 'API & Webhook Hub', href: '/api-integration-hub' }
    ]
  },
  {
    id: 'documents',
    label: 'Document Management',
    moduleId: 'documents',
    children: [
      { id: 'documents', label: 'Templates & Attachments', href: '/document-management' }
    ]
  },
  {
    id: 'identity',
    label: 'Identity & Security',
    moduleId: 'identity',
    children: [
      { id: 'identity', label: 'User Management', href: '/user-management' }
    ]
  }
];

export const BUSINESS_TYPES = [
  { id: 'agency', label: 'Insurance Agency / Broker', group: 'insurance', icon: '🏢', desc: 'Retail agency placing business with Insureds & MGAs, earning commission.' },
  { id: 'broker', label: 'Insurance Agency / Broker', group: 'insurance', icon: '🏢', desc: 'Retail agency placing business with Insureds & MGAs, earning commission.' },
  { id: 'mga', label: 'MGA / Program Manager', group: 'insurance', icon: '🧾', desc: 'Managing General Agent with binding authority, bordereaux, and carrier settlement.' },
  { id: 'carrier', label: 'Insurance Carrier', group: 'insurance', icon: '🛡️', desc: 'Risk-bearing insurer - statutory (NAIC SAP) + GAAP books, premium & claims accounting.' },
  { id: 'reinsurer', label: 'Reinsurer', group: 'insurance', icon: '🌐', desc: 'Assumes ceded risk from carriers under treaty/facultative arrangements.' },
  { id: 'general-business', label: 'General Business / Insured', group: 'general', icon: '🚛', desc: 'Commercial policyholder tracking premium spend, COIs, and vendor expenses.' }
];

export const ROLE_CATALOG = [
  { id: 'owner', label: 'Business Owner / Principal', dashboard: '/dashboard-owner', businessTypes: ['agency', 'broker', 'general-business', 'other'] },
  { id: 'cfo', label: 'CFO / Finance Executive', dashboard: '/dashboard-cfo', businessTypes: '*' },
  { id: 'controller', label: 'Financial Controller', dashboard: '/dashboard-controller', businessTypes: '*' },
  { id: 'accountant', label: 'Staff Accountant', dashboard: '/dashboard-accountant', businessTypes: '*' },
  { id: 'ap-ar-clerk', label: 'AP / AR Clerk', dashboard: '/dashboard-accountant', businessTypes: '*' },
  { id: 'payroll-admin', label: 'Payroll Administrator', dashboard: '/dashboard-accountant', businessTypes: '*' },
  { id: 'auditor', label: 'Internal / External Auditor', dashboard: '/dashboard-auditor', businessTypes: '*' },
  { id: 'agency-principal', label: 'Agency Principal / Retail Broker', dashboard: '/dashboard-agency', businessTypes: ['agency', 'broker'] },
  { id: 'broker-producer', label: 'Retail Broker / Producer', dashboard: '/dashboard-agency', businessTypes: ['broker', 'agency'] },
  { id: 'mga-ops', label: 'MGA Operations Manager', dashboard: '/dashboard-mga', businessTypes: ['mga'] },
  { id: 'carrier-controller', label: 'Carrier Controller / Actuary', dashboard: '/dashboard-carrier', businessTypes: ['carrier'] },
  { id: 'reinsurance-analyst', label: 'Reinsurance Analyst', dashboard: '/dashboard-reinsurer', businessTypes: ['reinsurer'] },
  { id: 'admin', label: 'System Administrator', dashboard: '/dashboard-admin', businessTypes: '*' },
  { id: 'insured', label: 'Commercial Policyholder', dashboard: '/dashboard-general-business', businessTypes: ['general-business'] }
];

export function rolesForBusinessType(bType) {
  return ROLE_CATALOG.filter(r => r.businessTypes === '*' || (Array.isArray(r.businessTypes) && r.businessTypes.includes(bType)));
}

export const COA_TEMPLATES = [
  { id: 'us-gaap-standard', label: 'US GAAP Standard', businessTypes: ['manufacturing', 'wholesale', 'retail', 'services', 'other', 'insured'], accounts: 84 },
  { id: 'manufacturing', label: 'Manufacturing (Raw Material / WIP / FG)', businessTypes: ['manufacturing'], accounts: 96 },
  { id: 'wholesale-retail', label: 'Wholesale / Retail (Inventory & COGS)', businessTypes: ['wholesale', 'retail'], accounts: 88 },
  { id: 'naic-statutory', label: 'NAIC Statutory (SAP)', businessTypes: ['carrier'], accounts: 142 },
  { id: 'insurance-carrier', label: 'Insurance Carrier (GAAP + Stat)', businessTypes: ['carrier'], accounts: 156 },
  { id: 'mga-template', label: 'MGA / Program Manager', businessTypes: ['mga', 'agency', 'broker'], accounts: 72 },
  { id: 'broker-template', label: 'Insurance Broker / Agency (Retail)', businessTypes: ['broker', 'agency'], accounts: 72 },
  { id: 'reinsurer-template', label: 'Reinsurer (Assumed Business)', businessTypes: ['reinsurer'], accounts: 68 },
];

export function coaTemplatesForBusinessType(businessTypeId) {
  return COA_TEMPLATES.filter(t => t.businessTypes.includes(businessTypeId));
}

export function modulesForBusinessType(businessTypeId) {
  const bt = BUSINESS_TYPES.find(b => b.id === businessTypeId);
  if (!bt) return MODULE_CATALOG;
  return MODULE_CATALOG.filter(m => {
    const isInsuranceModule = ['pas-policy', 'statutory-reports', 'mga-operations', 'reinsurance'].includes(m.id);
    if (isInsuranceModule && bt.group !== 'insurance') return false;
    return true;
  });
}

export function isGroupVisibleForType(groupId, businessType, accountingLevel = 'insurance') {
  // Hide Payroll, Inventory & Costing, and Fixed Assets from sidebar navigation
  if (['payroll', 'inventory', 'fixed-assets'].includes(groupId)) {
    return false;
  }

  if (accountingLevel === 'pizza') {
    if (groupId === 'pos-operations') return true;
    const insuranceGroups = ['pas-policy', 'premium-claims', 'subledger', 'reinsurance', 'statutory-reports', 'mga-operations', 'compliance-filings'];
    if (insuranceGroups.includes(groupId)) return false;
    return true;
  }

  if (groupId === 'pos-operations') return false;

  if (businessType === 'agency' || businessType === 'broker') {
    const allowed = [
      'dashboard', 'pas-policy', 'commission',
      'gl', 'accounts-receivable', 'billing', 'accounts-payable', 'bank',
      'tax', 'reporting', 'workflow',
      'audit-trail', 'identity', 'admin-config', 'integration'
    ];
    return allowed.includes(groupId);
  }

  if (groupId === 'docs') return true;
  const insuranceGroups = ['pas-policy', 'premium-claims', 'subledger', 'reinsurance', 'statutory-reports', 'mga-operations', 'compliance-filings'];

  if (businessType === 'mga') {
    const allowed = [
      'dashboard', 'pas-policy', 'premium-claims', 'subledger', 'mga-operations',
      'gl', 'accounts-receivable', 'billing', 'accounts-payable', 'bank',
      'commission', 'tax', 'budgeting', 'reporting', 'workflow',
      'audit-trail', 'documents', 'identity', 'admin-config', 'integration', 'docs'
    ];
    return allowed.includes(groupId);
  }
  if (businessType === 'carrier') {
    const allowed = [
      'dashboard', 'pas-policy', 'premium-claims', 'subledger',
      'reinsurance', 'statutory-reports', 'mga-operations', 'compliance-filings',
      'gl', 'accounts-receivable', 'billing', 'accounts-payable', 'bank',
      'commission', 'tax', 'budgeting', 'reporting', 'workflow',
      'audit-trail', 'documents', 'identity', 'admin-config', 'integration', 'docs'
    ];
    return allowed.includes(groupId);
  }
  if (businessType === 'reinsurer') {
    const allowed = [
      'dashboard', 'reinsurance', 'statutory-reports', 'compliance-filings',
      'gl', 'accounts-receivable', 'billing', 'accounts-payable', 'bank',
      'tax', 'budgeting', 'reporting', 'workflow',
      'audit-trail', 'documents', 'identity', 'admin-config', 'integration', 'docs'
    ];
    return allowed.includes(groupId);
  }
  if (insuranceGroups.includes(groupId)) return false;
  return true;
}

/* Nav children hidden for the broker/agency sidebar specifically (not full-group
   hides, just individual sub-items that don't apply to a retail broker). */
const BROKER_HIDDEN_CHILD_IDS = ['explore-industries', 'entity-hierarchy', 'manual-entry', 'gl-simulation', 'clear-all'];

// Insurance Flow Simulator ('gl-simulation') is deliberately NOT hardcoded
// here for carrier — it defaults to hidden for that business type, but as a
// user-toggleable default (Header's Density & Sizing panel /
// ThemeContext's showGlSimulation), not a permanent rule. See Sidebar.jsx,
// which combines this function's result with that toggle.
export function isChildVisibleForType(childId, businessType, accountingLevel = 'insurance') {
  if (accountingLevel === 'pizza') {
    if (childId === 'gl-simulation') return false;
  } else {
    if (childId === 'sales-transactions') return false;
  }
  if ((businessType === 'agency' || businessType === 'broker') && BROKER_HIDDEN_CHILD_IDS.includes(childId)) {
    return false;
  }
  return true;
}

export const MODULE_CATALOG = [
  { id: 'gl', no: '01', label: 'General Ledger', desc: 'Chart of Accounts, Journal Entries, Period Close, Multi-Entity, Trial Balance.', href: '/chart-of-accounts' },
  { id: 'ar', no: '02', label: 'Accounts Receivable', desc: 'Invoicing, collections, receipts, ageing, dunning, statements, disputes.', href: '/accounts-receivable' },
  { id: 'billing', no: '03', label: 'Billing & Invoicing', desc: 'Recurring, milestone, retainer billing; credit & debit notes.', href: '/billing-invoicing' },
  { id: 'ap', no: '04', label: 'Accounts Payable', desc: 'Vendor master, bills, 3-way match, ACH/check/wire payments, 1099/W-9.', href: '/accounts-payable' },
  { id: 'bank', no: '05', label: 'Bank & Cash Management', desc: 'Bank feeds, reconciliation, petty cash, cash position, FX, trust accounts.', href: '/bank-reconciliation' },
  { id: 'payments', no: '06', label: 'Payments & Money Movement', desc: 'Inbound/outbound payments, allocation, refunds, provider integrations.', href: '/bank-reconciliation' },
  { id: 'payroll', no: '07', label: 'Payroll & People', desc: 'Salary, hourly, commission payroll, tax withholding, payslips, benefits.', href: '/payroll' },
  { id: 'inventory', no: '08', label: 'Inventory & Costing', desc: 'FIFO/LIFO/weighted avg, stock takes, reorder levels, landed cost.', href: '/inventory-costing' },
  { id: 'fixed-assets', no: '09', label: 'Fixed Assets', desc: 'Asset register, straight-line/declining depreciation, disposal.', href: '/fixed-assets' },
  { id: 'projects', no: '10', label: 'Projects & Job Costing', desc: 'Project P&L, WIP, time & material billing, cost centers.', href: '/projects-job-costing' },
  { id: 'commission', no: '11', label: 'Commission Engine', desc: 'Tiered, split, clawback, carrier/broker schedules, statements.', href: '/commission-engine' },
  { id: 'fx', no: '12', label: 'Multi-Currency & FX', desc: 'Real-time rates, unrealised/realised gain-loss, revaluation.', href: '/multi-currency-fx' },
  { id: 'tax', no: '13', label: 'Tax Engine', desc: 'Sales tax, VAT, GST, surplus lines, withholding, tax reports.', href: '/tax-engine' },
  { id: 'budgeting', no: '14', label: 'Budgeting & Forecasting', desc: 'Annual budgets, variance analysis, rolling forecasts, what-if.', href: '/budgeting-forecasting' },
  { id: 'reporting', no: '15', label: 'Reporting & Analytics', desc: 'P&L, Balance Sheet, Cash Flow, aging reports, KPI builder.', href: '/reporting-analytics' },
  { id: 'workflow', no: '16', label: 'Workflow & Approvals', desc: 'Multi-tier approval chains, threshold rules, audit sign-off.', href: '/workflow-approvals' },
  { id: 'pas-policy', no: '17', label: 'Policy Admin (PAS)', desc: 'Policy binding, endorsements, cancellations, premium schedules.', href: '/pas-policy' },
  { id: 'statutory-reports', no: '18', label: 'Statutory Reports', desc: 'NAIC Schedule P, Surplus Lines State Stamping, Yellow Book filings.', href: '/statutory-reports' },
  { id: 'mga-operations', no: '19', label: 'MGA Operations', desc: 'Delegated authority (DUAA), bordereaux submission, carrier settlement.', href: '/mga-operations' },
  { id: 'reinsurance', no: '20', label: 'Reinsurance Accounting', desc: 'Treaty master, quota share / excess of loss cessions, settlement statements.', href: '/reinsurance-accounting' },
  { id: 'admin-config', no: '21', label: 'Configuration Centre', desc: 'Tenant setup, custom dimensions, COA templates, industry workspaces.', href: '/admin-config' },
  { id: 'identity', no: '22', label: 'User Management', desc: 'RBAC security, user invitations, role definitions, access logs.', href: '/user-management' },
  { id: 'dictionary', no: '23', label: 'Insurance Dictionary', desc: 'Authoritative dictionary of insurance, accounting, and NAIC terminology.', href: '/dictionary' }
];

/* MODULE_CATALOG ids that don't share their id with a NAV_CONFIG group. */
const MODULE_TO_GROUP_ID = {
  ar: 'accounts-receivable',
  ap: 'accounts-payable',
  dictionary: 'docs'
};

/* Filters MODULE_CATALOG down to what a business type actually sees in the
   sidebar, so the Home Dashboard's module tiles never show something the
   sidebar itself hides. 'payments' has no dedicated sidebar group (it lives
   under Bank & Cash Management there), so it's dropped from the tile grid too. */
export function visibleModulesForBusinessType(businessTypeId) {
  return MODULE_CATALOG.filter(m => {
    if (m.id === 'payments') return false;
    const groupId = MODULE_TO_GROUP_ID[m.id] || m.id;
    return isGroupVisibleForType(groupId, businessTypeId);
  });
}

export const HOME_CHECKLIST_ITEMS = [
  { id: 'review-coa', label: 'Review your Chart of Accounts', href: '/chart-of-accounts' },
  { id: 'import-data', label: 'Import your opening balances or existing data', href: '/excel-onboarding' },
  { id: 'invite-team', label: 'Invite your accountant or team', href: '/user-management' },
  { id: 'connect-bank', label: 'Connect a bank account', href: '/bank-reconciliation' },
  { id: 'first-invoice', label: 'Create your first invoice', href: '/billing-invoicing' },
  { id: 'first-je', label: 'Post your first journal entry', href: '/journal-entry' },
  { id: 'setup-wizard', label: 'Fine-tune setup in the full wizard', href: '/setup-wizard' }
];
