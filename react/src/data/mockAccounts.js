export const DIMENSION_MAP = {
  'cost-center': 'Cost Centre',
  'location': 'Location / Department',
  'mga': 'MGA',
  'broker': 'Broker / Producer',
  'state': 'State / Jurisdiction',
  'lob': 'Line of Business (LOB)',
  'treaty': 'Treaty / Program',
  'reinsurer': 'Reinsurer',
  'product-line': 'Product / SKU Line',
  'carrier-dim': 'Carrier',
  'class': 'Class',
  'customer-job': 'Customer:Job'
};

export const MOCK_ACCOUNTS = [
  // 1100 Series: ASSETS
  {
    code: '1001',
    name: 'Cash / Bank',
    group: 'asset',
    type: 'Asset',
    dimensions: ['cost-center', 'location'],
    status: 'active',
    normalBalance: 'Debit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  },
  {
    code: '1100',
    name: 'Premium Receivable',
    group: 'asset',
    type: 'Asset',
    dimensions: ['mga', 'state', 'lob', 'cost-center'],
    status: 'active',
    normalBalance: 'Debit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  },
  {
    code: '1400',
    name: 'Reinsurance Recoverable',
    group: 'asset',
    type: 'Asset',
    dimensions: ['treaty', 'reinsurer', 'lob'],
    status: 'active',
    normalBalance: 'Debit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  },
  {
    code: '1500',
    name: 'Raw Material Inventory',
    group: 'asset',
    type: 'Asset',
    dimensions: ['cost-center', 'product-line', 'location'],
    status: 'active',
    normalBalance: 'Debit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  },

  // 2100 Series: LIABILITIES
  {
    code: '2100',
    name: 'Unearned Premium',
    group: 'liability',
    type: 'Liability',
    dimensions: ['mga', 'state', 'lob'],
    status: 'active',
    normalBalance: 'Credit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  },
  {
    code: '2200',
    name: 'Premium Payable',
    group: 'liability',
    type: 'Liability',
    dimensions: ['cost-center'],
    status: 'active',
    normalBalance: 'Credit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  },
  {
    code: '2300',
    name: 'Premium Taxes Payable',
    group: 'liability',
    type: 'Liability',
    dimensions: ['state'],
    status: 'active',
    normalBalance: 'Credit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  },
  {
    code: '2400',
    name: 'IBNR Reserve',
    group: 'liability',
    type: 'Liability',
    dimensions: ['lob', 'state'],
    status: 'active',
    normalBalance: 'Credit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  },

  // 3100 Series: EQUITY
  {
    code: '3100',
    name: 'Retained Earnings',
    group: 'equity',
    type: 'Equity',
    dimensions: ['cost-center'],
    status: 'active',
    normalBalance: 'Credit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  },
  {
    code: '3200',
    name: 'Common Stock / Capital Surplus',
    group: 'equity',
    type: 'Equity',
    dimensions: ['cost-center'],
    status: 'active',
    normalBalance: 'Credit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  },

  // Generic multi-entity accounts (Pizza/franchise demo and beyond) — new
  // codes, deliberately not reusing 4100/5100 etc. so the existing insurance
  // PAS flow (still functional, just unlinked from nav) keeps showing its
  // own correct account names.
  {
    code: '1180',
    name: 'Due from Stores (Intercompany Receivable)',
    group: 'asset',
    type: 'Asset',
    dimensions: ['cost-center'],
    status: 'active',
    normalBalance: 'Debit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  },
  {
    code: '2050',
    name: 'Due to Main Hub (Intercompany Payable)',
    group: 'liability',
    type: 'Liability',
    dimensions: ['cost-center'],
    status: 'active',
    normalBalance: 'Credit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  },
  {
    code: '4600',
    name: 'Franchise Revenue Share Income',
    group: 'revenue',
    type: 'Revenue',
    dimensions: ['cost-center'],
    status: 'active',
    normalBalance: 'Credit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  },
  {
    code: '5300',
    name: 'Revenue Share Expense',
    group: 'expense',
    type: 'Expense',
    dimensions: ['cost-center'],
    status: 'active',
    normalBalance: 'Debit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  },

  // 4100 Series: REVENUE
  {
    code: '4100',
    name: 'Net Written Premium',
    group: 'revenue',
    type: 'Revenue',
    dimensions: ['mga', 'state', 'lob', 'carrier-dim'],
    status: 'active',
    normalBalance: 'Credit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  },
  {
    code: '4500',
    name: 'Sales Revenue',
    group: 'revenue',
    type: 'Revenue',
    dimensions: ['class', 'location', 'customer-job', 'product-line'],
    status: 'active',
    normalBalance: 'Credit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  },

  // 5100 Series: EXPENSES
  {
    code: '5100',
    name: 'Commission Expense / Revenue',
    group: 'expense',
    type: 'Expense',
    dimensions: ['mga', 'cost-center', 'lob'],
    status: 'active',
    normalBalance: 'Debit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  },
  {
    code: '5101',
    name: 'Commission Expense — MGA Override',
    group: 'expense',
    type: 'Expense',
    dimensions: ['mga', 'cost-center', 'lob'],
    status: 'active',
    normalBalance: 'Debit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  },
  {
    code: '5200',
    name: 'Claims Expense',
    group: 'expense',
    type: 'Expense',
    dimensions: ['lob', 'state', 'carrier-dim'],
    status: 'active',
    normalBalance: 'Debit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  },
  {
    code: '5500',
    name: 'Payroll Expense',
    group: 'expense',
    type: 'Expense',
    dimensions: ['cost-center', 'location'],
    status: 'active',
    normalBalance: 'Debit',
    balance: 0,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'System (seed)'
  }
];
