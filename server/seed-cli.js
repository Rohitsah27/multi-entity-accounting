import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Account from './models/Account.js';
import JournalEntry from './models/JournalEntry.js';
import Period from './models/Period.js';
import BankTransaction from './models/BankTransaction.js';
import User from './models/User.js';
import Invoice from './models/Invoice.js';
import PasEvent from './models/PasEvent.js';
import CommissionTransaction from './models/CommissionTransaction.js';
import {
  SEED_ACCOUNTS,
  SEED_PERIODS,
  SEED_BANK_TRANSACTIONS,
  SEED_JOURNAL_ENTRIES,
  SEED_USERS,
  SEED_INVOICES
} from './data/seedData.js';

dotenv.config();

export async function seedDatabase(clean = false) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    console.log('[Seed] Starting database seed routine...');

    if (clean) {
      console.log('[Seed] Clean flag enabled. Clearing existing collections...');
      await Promise.all([
        Account.deleteMany({}),
        JournalEntry.deleteMany({}),
        Period.deleteMany({}),
        BankTransaction.deleteMany({}),
        User.deleteMany({}),
        Invoice.deleteMany({}),
        PasEvent.deleteMany({}),
        CommissionTransaction.deleteMany({})
      ]);
      console.log('[Seed] Existing collections cleared.');
    }

    // Seed Accounts (upsert by code)
    let seededAccounts = 0;
    for (const acc of SEED_ACCOUNTS) {
      await Account.findOneAndUpdate({ code: acc.code }, acc, { upsert: true, new: true });
      seededAccounts++;
    }
    console.log(`[Seed] Seeded ${seededAccounts} Accounts.`);

    // Seed Periods (upsert by id)
    let seededPeriods = 0;
    for (const p of SEED_PERIODS) {
      await Period.findOneAndUpdate({ id: p.id }, p, { upsert: true, new: true });
      seededPeriods++;
    }
    console.log(`[Seed] Seeded ${seededPeriods} Fiscal Periods.`);

    // Seed Bank Transactions (upsert by id)
    let seededTxns = 0;
    for (const txn of SEED_BANK_TRANSACTIONS) {
      await BankTransaction.findOneAndUpdate({ id: txn.id }, txn, { upsert: true, new: true });
      seededTxns++;
    }
    console.log(`[Seed] Seeded ${seededTxns} Bank Transactions.`);

    // Seed Journal Entries (upsert by id)
    let seededJEs = 0;
    for (const je of SEED_JOURNAL_ENTRIES) {
      await JournalEntry.findOneAndUpdate({ id: je.id }, je, { upsert: true, new: true });
      seededJEs++;
    }
    console.log(`[Seed] Seeded ${seededJEs} Journal Entries.`);

    // Seed Users (upsert by email)
    let seededUsers = 0;
    for (const u of SEED_USERS) {
      await User.findOneAndUpdate({ email: u.email }, u, { upsert: true, new: true });
      seededUsers++;
    }
    console.log(`[Seed] Seeded ${seededUsers} Users.`);

    // Seed Invoices (upsert by invoiceNumber)
    let seededInvoices = 0;
    for (const inv of SEED_INVOICES) {
      await Invoice.findOneAndUpdate({ invoiceNumber: inv.invoiceNumber }, inv, { upsert: true, new: true });
      seededInvoices++;
    }
    console.log(`[Seed] Seeded ${seededInvoices} Invoices.`);

    console.log('[Seed] Database seed completed successfully!');
    return {
      success: true,
      seededCounts: {
        accounts: seededAccounts,
        periods: seededPeriods,
        bankTransactions: seededTxns,
        journalEntries: seededJEs,
        users: seededUsers,
        invoices: seededInvoices
      }
    };
  } catch (error) {
    console.error('[Seed Error]:', error);
    throw error;
  }
}

// Wipe every transactional collection (Journal Entries, Periods, Bank
// Transactions, Invoices) but leave Users untouched — and guarantee the
// standard login credentials still exist. Used by the "Reset Data" DevTools
// action: empty out all financial data while keeping the app log-in-able.
//
// Accounts are a special case: they're the Chart of Accounts *structure*
// (code/name/type/dimensions), not transactional data. Deleting them
// outright breaks the app — there'd be nothing left for a new journal
// entry to post against, and Chart of Accounts would show empty forever
// until a reseed. So accounts are kept and only their balance is zeroed,
// same as clearing every posted transaction against them.
export async function resetDataKeepUsers() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  console.log('[Reset] Clearing transactional collections and zeroing account balances (Users & Chart of Accounts structure preserved)...');
  await Promise.all([
    Account.updateMany({}, { $set: { balance: 0 } }),
    JournalEntry.deleteMany({}),
    Period.deleteMany({}),
    BankTransaction.deleteMany({}),
    Invoice.deleteMany({}),
    PasEvent.deleteMany({}),
    CommissionTransaction.deleteMany({})
  ]);

  // Ensure the standard login accounts still exist so the app stays usable.
  let seededUsers = 0;
  for (const u of SEED_USERS) {
    await User.findOneAndUpdate({ email: u.email }, u, { upsert: true, setDefaultsOnInsert: true, new: true });
    seededUsers++;
  }

  const accountCount = await Account.countDocuments({});
  console.log('[Reset] Done. Transactional data cleared; Chart of Accounts and login credentials preserved.');
  return {
    success: true,
    message: 'All transactions cleared and account balances zeroed. Chart of Accounts and login credentials remain.',
    seededCounts: {
      accounts: accountCount,
      periods: 0,
      bankTransactions: 0,
      journalEntries: 0,
      invoices: 0,
      pasEvents: 0,
      commissionTransactions: 0,
      users: seededUsers
    }
  };
}

// If executed directly from command line
if (process.argv[1]?.endsWith('seed-cli.js')) {
  (async () => {
    try {
      await seedDatabase(process.argv.includes('--clean'));
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      process.exit(1);
    }
  })();
}
