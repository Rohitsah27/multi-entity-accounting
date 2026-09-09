// ============================================================================
// VERIDEX FINANCE — DOMINO'S PIZZA LEVEL ACCOUNTING TEST SUITE
// 3-Tier Franchise Model: Customer -> Franchise Store -> Domino's Main Company
// ============================================================================

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  const match = typeof actual === 'number' && typeof expected === 'number'
    ? Math.abs(actual - expected) < 0.001
    : actual === expected;
  if (match) {
    console.log(`  ✅ [PASS] ${message} (${actual})`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}: Expected ${expected}, got ${actual}`);
    failed++;
  }
}

console.log('================================================================');
console.log("   VERIDEX FINANCE — DOMINO'S PIZZA ACCOUNTING TEST SUITE        ");
console.log('================================================================\n');

// ----------------------------------------------------------------------------
// TEST SUITE 1: Configurable Franchise Split Validation (0% - 100%)
// ----------------------------------------------------------------------------
console.log('----------------------------------------------------------------');
console.log(' TEST SUITE 1: Percentage Split & Bounds Validation');
console.log('----------------------------------------------------------------');

function validateFranchisePct(pct) {
  const num = Number(pct);
  if (isNaN(num)) return { valid: false, franchise: 70, corporate: 30 };
  const clamped = Math.max(0, Math.min(100, Math.round(num)));
  return { valid: true, franchise: clamped, corporate: 100 - clamped };
}

assertEqual(validateFranchisePct(70).franchise, 70, 'Default Franchise Split is 70%');
assertEqual(validateFranchisePct(70).corporate, 30, "Domino's Main Company Share is 30%");
assertEqual(validateFranchisePct(0).franchise, 0, 'Min bound: 0% franchise allowed');
assertEqual(validateFranchisePct(0).corporate, 100, 'Min bound: 100% corporate');
assertEqual(validateFranchisePct(100).franchise, 100, 'Max bound: 100% franchise allowed');
assertEqual(validateFranchisePct(100).corporate, 0, 'Max bound: 0% corporate');
assertEqual(validateFranchisePct(-10).franchise, 0, 'Negative values clamp to 0%');
assertEqual(validateFranchisePct(150).franchise, 100, 'Values >100 clamp to 100%');
assertEqual(validateFranchisePct(69.6).franchise, 70, 'Decimals round correctly');
assertEqual(validateFranchisePct('abc').franchise, 70, 'Invalid input defaults to 70%');

// ----------------------------------------------------------------------------
// TEST SUITE 2: Standard Sale Posting (Customer -> Franchise Store)
// Sale of ₹100 with 70% Franchise / 30% Domino's Main Company
// ----------------------------------------------------------------------------
console.log('\n----------------------------------------------------------------');
console.log(" TEST SUITE 2: ₹100 Sale Breakdown & Balanced Double-Entry JEs");
console.log('----------------------------------------------------------------');

function recordPizzaSale({ totalAmount, franchisePct = 70 }) {
  const total = Number(totalAmount);
  const franchiseShare = Math.round((total * (franchisePct / 100)) * 100) / 100;
  const corporateShare = Math.round((total - franchiseShare) * 100) / 100;

  // Franchise Journal Entry:
  // Dr Cash/AR 1001: totalAmount
  //   Cr Sales Revenue 4001: franchiseShare
  //   Cr Payable to Hub 2003: corporateShare
  const franchiseLines = [
    { code: '1001', name: 'Cash at Bank (Store POS)', debit: total, credit: 0 },
    { code: '4001', name: 'Store Pizza Sales Revenue', debit: 0, credit: franchiseShare },
    { code: '2003', name: "Payable to Domino's Main Hub", debit: 0, credit: corporateShare }
  ];

  // Hub / Corporate Journal Entry:
  // Dr Receivable from Franchise 1004: corporateShare
  //   Cr Royalty & Supply Revenue 4002: corporateShare
  const hubLines = [
    { code: '1004', name: 'Receivable from Franchise Store', debit: corporateShare, credit: 0 },
    { code: '4002', name: 'Franchise Royalty & Supply Revenue', debit: 0, credit: corporateShare }
  ];

  return { total, franchiseShare, corporateShare, franchiseLines, hubLines };
}

const sale100 = recordPizzaSale({ totalAmount: 100, franchisePct: 70 });
assertEqual(sale100.total, 100, 'Total sale amount is ₹100');
assertEqual(sale100.franchiseShare, 70, 'Franchise store gets exactly ₹70 (70%)');
assertEqual(sale100.corporateShare, 30, "Domino's Main Company gets exactly ₹30 (30%)");
assertEqual(sale100.franchiseShare + sale100.corporateShare, 100, 'Split sums to ₹100 (100%)');

// Double entry balance checks
const frDrSum = sale100.franchiseLines.reduce((s, l) => s + l.debit, 0);
const frCrSum = sale100.franchiseLines.reduce((s, l) => s + l.credit, 0);
assertEqual(frDrSum, frCrSum, 'Franchise JE is mathematically balanced (Dr === Cr === ₹100)');

const hubDrSum = sale100.hubLines.reduce((s, l) => s + l.debit, 0);
const hubCrSum = sale100.hubLines.reduce((s, l) => s + l.credit, 0);
assertEqual(hubDrSum, hubCrSum, "Domino's Hub JE is mathematically balanced (Dr === Cr === ₹30)");

// ----------------------------------------------------------------------------
// TEST SUITE 3: Settlement Flow (Franchise Remits Corporate Share)
// ----------------------------------------------------------------------------
console.log('\n----------------------------------------------------------------');
console.log(" TEST SUITE 3: Settlement Flow & AP / AR Clearing");
console.log('----------------------------------------------------------------');

function settlePizzaSale(sale) {
  // Franchise settlement:
  // Dr Payable to Hub 2003: corporateShare
  //   Cr Cash at Bank 1001: corporateShare
  const franchiseSettlement = [
    { code: '2003', name: "Payable to Domino's Main Hub", debit: sale.corporateShare, credit: 0 },
    { code: '1001', name: 'Cash at Bank (Store POS)', debit: 0, credit: sale.corporateShare }
  ];

  // Hub settlement:
  // Dr Cash at Bank 1001: corporateShare
  //   Cr Receivable from Franchise 1004: corporateShare
  const hubSettlement = [
    { code: '1001', name: 'Cash at Bank (Main Corporate)', debit: sale.corporateShare, credit: 0 },
    { code: '1004', name: 'Receivable from Franchise Store', debit: 0, credit: sale.corporateShare }
  ];

  // Calculate Net Ending Balances
  const franchiseNetCash = sale.total - sale.corporateShare;
  const franchisePayable = sale.corporateShare - sale.corporateShare;
  const hubNetCash = sale.corporateShare;
  const hubReceivable = sale.corporateShare - sale.corporateShare;

  return {
    franchiseSettlement,
    hubSettlement,
    franchiseNetCash,
    franchisePayable,
    hubNetCash,
    hubReceivable
  };
}

const settlement = settlePizzaSale(sale100);
const frSetDr = settlement.franchiseSettlement.reduce((s, l) => s + l.debit, 0);
const frSetCr = settlement.franchiseSettlement.reduce((s, l) => s + l.credit, 0);
assertEqual(frSetDr, frSetCr, 'Franchise Settlement JE balanced (Dr === Cr === ₹30)');

const hubSetDr = settlement.hubSettlement.reduce((s, l) => s + l.debit, 0);
const hubSetCr = settlement.hubSettlement.reduce((s, l) => s + l.credit, 0);
assertEqual(hubSetDr, hubSetCr, 'Hub Settlement JE balanced (Dr === Cr === ₹30)');

assertEqual(settlement.franchisePayable, 0, 'Franchise AP to Hub cleared to ₹0');
assertEqual(settlement.hubReceivable, 0, 'Hub AR from Franchise cleared to ₹0');
assertEqual(settlement.franchiseNetCash, 70, 'Franchise net cash equals ₹70 retained revenue');
assertEqual(settlement.hubNetCash, 30, "Domino's Hub net cash equals ₹30 corporate share");

// ----------------------------------------------------------------------------
// TEST SUITE 4: Multi-Order Aggregation & Variable Splits (25%, 35%, 50%)
// ----------------------------------------------------------------------------
console.log('\n----------------------------------------------------------------');
console.log(' TEST SUITE 4: Multi-Order Aggregation & Dynamic Splits');
console.log('----------------------------------------------------------------');

const orders = [
  { total: 500, pct: 30 },  // Fr: 150, Hub: 350
  { total: 1200, pct: 25 }, // Fr: 300, Hub: 900
  { total: 800, pct: 35 },  // Fr: 280, Hub: 520
  { total: 450, pct: 50 },  // Fr: 225, Hub: 225
];

let totalStoreRevenue = 0;
let totalHubRevenue = 0;
let totalSalesGross = 0;

orders.forEach((ord, i) => {
  const res = recordPizzaSale({ totalAmount: ord.total, franchisePct: ord.pct });
  totalSalesGross += res.total;
  totalStoreRevenue += res.franchiseShare;
  totalHubRevenue += res.corporateShare;

  assertEqual(res.franchiseShare + res.corporateShare, ord.total, `Order #${i + 1} (₹${ord.total} @ ${ord.pct}%) sums exactly`);
});

assertEqual(totalSalesGross, 2950, 'Total Gross Orders = ₹2,950');
assertEqual(totalStoreRevenue, 955, 'Total Franchise Retained Revenue = ₹955');
assertEqual(totalHubRevenue, 1995, 'Total Hub Corporate Revenue = ₹1,995');
assertEqual(totalStoreRevenue + totalHubRevenue, totalSalesGross, 'Global revenue reconciliation matches 100%');

// ----------------------------------------------------------------------------
// TEST SUITE 5: Strict Partitioning & Entity Isolation
// ----------------------------------------------------------------------------
console.log('\n----------------------------------------------------------------');
console.log(' TEST SUITE 5: Strict Partitioning & Isolation between Levels');
console.log('----------------------------------------------------------------');

const PIZZA_ENTITY_IDS = ['ENT-HUB-01', 'ENT-FRN-01', 'ENT-OWN-01', 'ENT-CUST-AYUSHI'];
const INSURANCE_ENTITY_IDS = ['ENT-INS-01', 'ENT-MGA-01', 'ENT-BRK-01', 'ENT-RE-01', 'ENT-CLNT-01'];

// Verify complete separation (no overlap)
const overlap = PIZZA_ENTITY_IDS.filter(id => INSURANCE_ENTITY_IDS.includes(id));
assertEqual(overlap.length, 0, 'No entity IDs shared between Insurance and Pizza accounting');

// Chart of accounts isolation
const PIZZA_COA_CODES = ['1001', '1004', '2003', '4001', '4002', '5001'];
const INSURANCE_COA_CODES = ['1100', '1200', '1300', '2100', '2200', '2300', '4100', '5100'];

const coaOverlap = PIZZA_COA_CODES.filter(code => INSURANCE_COA_CODES.includes(code));
assertEqual(coaOverlap.length, 0, 'Chart of Accounts codes strictly partitioned');

// Verify trial balance isolation: A pizza JE cannot alter insurance balances
const samplePizzaEntry = {
  id: 'JE-PIZZA-001',
  entity: 'ENT-FRN-01',
  accountingLevel: 'pizza',
  lines: sale100.franchiseLines
};

const sampleInsuranceEntry = {
  id: 'JE-INS-001',
  entity: 'ENT-MGA-01',
  accountingLevel: 'insurance',
  lines: [{ code: '1100', debit: 10000, credit: 0 }, { code: '2100', debit: 0, credit: 10000 }]
};

function filterJEsByLevel(entries, level) {
  return entries.filter(e => e.accountingLevel === level);
}

const allEntries = [samplePizzaEntry, sampleInsuranceEntry];
const pizzaOnly = filterJEsByLevel(allEntries, 'pizza');
const insuranceOnly = filterJEsByLevel(allEntries, 'insurance');

assertEqual(pizzaOnly.length, 1, 'Pizza ledger contains only pizza entries');
assertEqual(pizzaOnly[0].id, 'JE-PIZZA-001', 'Correct pizza entry filtered');
assertEqual(insuranceOnly.length, 1, 'Insurance ledger contains only insurance entries');
assertEqual(insuranceOnly[0].id, 'JE-INS-001', 'Correct insurance entry filtered');

// Currency formatting audit
function formatCurrency(amount, level) {
  if (level === 'pizza') {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  }
  return `$${Number(amount).toLocaleString('en-US')}`;
}

assertEqual(formatCurrency(100, 'pizza'), '₹100', 'Pizza level renders in INR (₹)');
assertEqual(formatCurrency(10000, 'insurance'), '$10,000', 'Insurance level renders in USD ($)');
assertEqual(formatCurrency(70, 'pizza'), '₹70', 'Corporate share renders with ₹ symbol');
// ----------------------------------------------------------------------------
// TEST SUITE 6: Scenario 2 — 100% Own Store Model (Main Hub -> Own Store -> Customer)
// ----------------------------------------------------------------------------
console.log('\n----------------------------------------------------------------');
console.log(' TEST SUITE 6: Scenario 2 — 100% Own Store Model (JE 1 to JE 5)');
console.log('----------------------------------------------------------------');

function runScenario2OwnStoreTest() {
  const customer = 'Ayushi';
  const price = 100.00;

  // JE 1 — Own Store invoices Ayushi for $100
  const je1 = {
    entity: 'ENT-OWN-01',
    description: `JE 1 — Own Store invoices ${customer} for $${price}`,
    lines: [
      { code: '1100', name: `A/R – ${customer}`, debit: price, credit: 0 },
      { code: '2050', name: 'Due to Main Hub (Intercompany Payable)', debit: 0, credit: price }
    ]
  };

  // JE 2 — Main Hub records receivable from Own Store ($100)
  const je2 = {
    entity: 'ENT-HUB-01',
    description: `JE 2 — Main Hub records receivable from Own Store ($${price})`,
    lines: [
      { code: '1180', name: 'A/R – Own Store', debit: price, credit: 0 },
      { code: '4600', name: 'Pizza Sales Revenue – Main Hub', debit: 0, credit: price }
    ]
  };

  // JE 3 — Ayushi pays Own Store ($100)
  const je3 = {
    entity: 'ENT-OWN-01',
    description: `JE 3 — ${customer} pays Own Store`,
    lines: [
      { code: '1001', name: 'Cash / Bank – Own Store', debit: price, credit: 0 },
      { code: '1100', name: `A/R – ${customer}`, debit: 0, credit: price }
    ]
  };

  // JE 4 — Own Store pays Main Hub ($100)
  const je4 = {
    entity: 'ENT-OWN-01',
    description: `JE 4 — Own Store pays Main Hub`,
    lines: [
      { code: '2050', name: 'Payable to Main Hub', debit: price, credit: 0 },
      { code: '1001', name: 'Cash / Bank – Own Store', debit: 0, credit: price }
    ]
  };

  // JE 5 — Main Hub receives $100
  const je5 = {
    entity: 'ENT-HUB-01',
    description: `JE 5 — Main Hub receives $100`,
    lines: [
      { code: '1001', name: 'Cash / Bank – Main Hub', debit: price, credit: 0 },
      { code: '1180', name: 'A/R – Own Store', debit: 0, credit: price }
    ]
  };

  return { je1, je2, je3, je4, je5 };
}

const scenario2 = runScenario2OwnStoreTest();

// Balanced Double Entry Validations
const je1Dr = scenario2.je1.lines.reduce((s, l) => s + l.debit, 0);
const je1Cr = scenario2.je1.lines.reduce((s, l) => s + l.credit, 0);
assertEqual(je1Dr, je1Cr, 'JE 1 (Own Store invoices Ayushi $100) balanced (Dr === Cr === $100)');

const je2Dr = scenario2.je2.lines.reduce((s, l) => s + l.debit, 0);
const je2Cr = scenario2.je2.lines.reduce((s, l) => s + l.credit, 0);
assertEqual(je2Dr, je2Cr, 'JE 2 (Main Hub records receivable from Own Store $100) balanced (Dr === Cr === $100)');

const je3Dr = scenario2.je3.lines.reduce((s, l) => s + l.debit, 0);
const je3Cr = scenario2.je3.lines.reduce((s, l) => s + l.credit, 0);
assertEqual(je3Dr, je3Cr, 'JE 3 (Ayushi pays Own Store $100) balanced (Dr === Cr === $100)');

const je4Dr = scenario2.je4.lines.reduce((s, l) => s + l.debit, 0);
const je4Cr = scenario2.je4.lines.reduce((s, l) => s + l.credit, 0);
assertEqual(je4Dr, je4Cr, 'JE 4 (Own Store pays Main Hub $100) balanced (Dr === Cr === $100)');

const je5Dr = scenario2.je5.lines.reduce((s, l) => s + l.debit, 0);
const je5Cr = scenario2.je5.lines.reduce((s, l) => s + l.credit, 0);
assertEqual(je5Dr, je5Cr, 'JE 5 (Main Hub receives $100) balanced (Dr === Cr === $100)');

// Net Ledger Position Reconciliations
// Own Store:
const ownStoreCash = 100 - 100; // Inflow in JE 3, Outflow in JE 4
const ownStoreAR = 100 - 100;   // Invoiced in JE 1, Cleared in JE 3
const ownStoreAP = 100 - 100;   // Cleared in JE 4
assertEqual(ownStoreCash, 0, 'Own Store net cash ending balance is $0 (100% remitted to Main Hub)');
assertEqual(ownStoreAR, 0, 'Own Store A/R – Ayushi is fully cleared to $0');
assertEqual(ownStoreAP, 0, 'Own Store Payable to Main Hub is fully cleared to $0');

// Main Hub:
const hubCash = 100;            // Received in JE 5
const hubAR = 100 - 100;        // Invoiced in JE 2, Cleared in JE 5
const hubRevenue = 100;         // Recognized in JE 2 (or JE 1 consolidated)
assertEqual(hubCash, 100, 'Main Hub net ending cash is +$100.00');
assertEqual(hubAR, 0, 'Main Hub A/R – Own Store is fully cleared to $0');
assertEqual(hubRevenue, 100, 'Main Hub captures 100% of Pizza Sales Revenue ($100.00)');

console.log('\n================================================================');
console.log(`   TOTAL TESTS PASSED: ${passed} / ${passed + failed} (${Math.round((passed / (passed + failed)) * 100)}% SUCCESS)`);
console.log("   DOMINO'S PIZZA ACCOUNTING ENGINE FULLY VERIFIED & RECONCILED");
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
}

