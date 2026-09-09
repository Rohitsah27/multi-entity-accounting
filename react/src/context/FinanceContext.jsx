import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MOCK_ACCOUNTS } from '../data/mockAccounts';
import { REFERENCE_POLICY, INITIAL_JOURNAL_ENTRIES } from '../data/mockPolicies';
import { useAuth } from './AuthContext';
import api from '../services/api';

const FinanceContext = createContext(null);

// Initial FY 2026 Periods matching period-locking.html (Jan-Mar Hard-Locked, Apr In-Progress, May-Dec Open)
const INITIAL_PERIODS = [
  { id: '2026-01', month: 'January', year: 2026, status: 'hard_locked', softClose: true, hardLock: true, closedAt: '2026-02-05' },
  { id: '2026-02', month: 'February', year: 2026, status: 'hard_locked', softClose: true, hardLock: true, closedAt: '2026-03-05' },
  { id: '2026-03', month: 'March', year: 2026, status: 'hard_locked', softClose: true, hardLock: true, closedAt: '2026-04-05' },
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


// Initial Bank Feed Transactions — each is tagged with the real entity and
// cash account (see `cashBalances`) it actually posted against, derived
// from the same cash movements the PAS Event Injector stages perform (see
// `executeStageAction` below), so Bank Reconciliation can show each role
// (broker/MGA/carrier) only the transactions that hit their own bank
// account instead of one shared, un-scoped list.
// Only genuinely external/unrelated bank activity lives here now — the
// three PAS lifecycle rows (Ayushi's deposit, the wire to NTA, Southlake's
// net remittance) used to be hardcoded here too, but that meant they never
// changed no matter what the PAS Event Injector actually posted (Match,
// Extra Pay, Pay Short, or any future variant). Those are now generated
// live from posted PAS journal entries — see `pasBankFeedTransactions` in
// FinanceProvider below — so this seed only needs to cover activity that
// has no journal entry driving it.
const INITIAL_BANK_TRANSACTIONS = [
  { id: 'TXN-9023', date: '2026-09-01', description: 'Texas Dept of Insurance Stamping Fee Q3', amount: -350.00, type: 'Debit', status: 'Unallocated Suspense', contraAccount: null, entity: 'ENT-MGA-01', account: 'mgaOperating' },
  { id: 'TXN-9025', date: '2026-09-03', description: 'AWS Cloud Hosting Monthly Infrastructure', amount: -1240.00, type: 'Debit', status: 'Matched', contraAccount: '2001', entity: 'ENT-MGA-01', account: 'mgaOperating' }
];

export function FinanceProvider({ children }) {
  // Each role (Broker/MGA/Carrier/...) keeps its own separate book — a
  // journal entry belongs to one entity (je.entity), and account balances,
  // ledgers, and financial statements are scoped to whichever entity is
  // currently logged in. This is what makes "switch role, see different
  // numbers" actually true, matching the multi-entity lifecycle documented
  // in finance-and-accounting-main/README.md.
  const { currentUser, activeEntity, accountingLevel } = useAuth();
  const currentAccountingLevel = accountingLevel || currentUser?.accountingLevel || (() => {
    try {
      return sessionStorage.getItem('v_accounting_level') || localStorage.getItem('v_accounting_level') || 'insurance';
    } catch {
      return 'insurance';
    }
  })() || 'insurance';

  const PIZZA_ENTITY_IDS = ['ENT-HUB-01', 'ENT-FRN-01', 'ENT-OWN-01', 'ENT-CUST-AYUSHI'];
  const INSURANCE_ENTITY_IDS = ['ENT-CAR-01', 'ENT-MGA-01', 'ENT-AGY-01', 'ENT-RE-01', 'INS-AYUSHI', 'ENT-MINE'];

  const isJeForCurrentLevel = useCallback((je) => {
    if (!je) return false;
    if (je.accountingLevel) {
      return je.accountingLevel === currentAccountingLevel;
    }
    if (currentAccountingLevel === 'pizza') {
      return PIZZA_ENTITY_IDS.includes(je.entity);
    }
    return !PIZZA_ENTITY_IDS.includes(je.entity);
  }, [currentAccountingLevel]);

  const belongsToActiveEntity = useCallback(
    (je) => {
      if (!isJeForCurrentLevel(je)) return false;
      return !activeEntity?.id || je.entity === activeEntity.id;
    },
    [activeEntity, isJeForCurrentLevel]
  );

  // When true, a "Reset Data" wipe is in effect: trust whatever's cached
  // (including empty) instead of falling back to demo mock data.
  const isDataReset = () => {
    try {
      return localStorage.getItem('v_data_reset') === '1';
    } catch (e) {
      return false;
    }
  };

  // Accounts
  const [accounts, setAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('v_gl_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isDataReset() && Array.isArray(parsed)) {
          return parsed;
        }
        if (Array.isArray(parsed) && parsed.length >= 16 && parsed.some(a => a.code === '1400')) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    const seed = MOCK_ACCOUNTS.map(a => ({ ...a, status: a.status || 'active' }));
    try {
      localStorage.setItem('v_gl_accounts', JSON.stringify(seed));
    } catch (e) {}
    return seed;
  });

  // Opening Balances Map: { [code]: { debit: number, credit: number } }
  const [openingBalances, setOpeningBalances] = useState(() => {
    try {
      const saved = localStorage.getItem('v_gl_opening_balances');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isDataReset() && parsed && typeof parsed === 'object') {
          return parsed;
        }
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length >= 16 && !parsed['1002']) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    const initial = {};
    MOCK_ACCOUNTS.forEach(a => {
      initial[a.code] = { debit: 0, credit: 0 };
    });
    try {
      localStorage.setItem('v_gl_opening_balances', JSON.stringify(initial));
    } catch (e) {}
    return initial;
  });

  // Journal Entries
  const [journalEntries, setJournalEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('v_gl_journal_entries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isDataReset() && Array.isArray(parsed)) {
          return parsed;
        }
        if (Array.isArray(parsed) && parsed.length > 0 && !parsed.some(j => (j.lines || []).some(l => l.accountCode === '1002' || l.acct === '1002'))) {
          // Condition-based correction for Franchise Remittance (JE 4 & JE 5):
          // Scenario 1 (Franchise 70/30): Franchise retains $70 (70%) and pays Main Hub $30 (30% corporate royalty).
          // Scenario 2 (Own Store 100%): Own Store is 100% owned by Main Hub, so it remits $100.
          const corrected = parsed.map(j => {
            const desc = j.description || '';
            const isFranchiseRemit = desc.includes('JE 4') && desc.includes('Franchise pays Main Hub');
            const isFranchiseHubReceipt = desc.includes('JE 5') && desc.includes('Franchise');
            if (isFranchiseRemit || isFranchiseHubReceipt) {
              const hasHundred = (j.lines || []).some(l => Number(l.debit) === 100 || Number(l.credit) === 100);
              if (hasHundred) {
                return {
                  ...j,
                  lines: (j.lines || []).map(l => ({
                    ...l,
                    debit: Number(l.debit) > 0 ? 30 : 0,
                    credit: Number(l.credit) > 0 ? 30 : 0
                  }))
                };
              }
            }
            return j;
          });
          try {
            localStorage.setItem('v_gl_journal_entries', JSON.stringify(corrected));
          } catch (e) {}
          return corrected;
        }
      }
    } catch (e) {
      console.error(e);
    }
    try {
      localStorage.setItem('v_gl_journal_entries', JSON.stringify(INITIAL_JOURNAL_ENTRIES));
    } catch (e) {}
    return INITIAL_JOURNAL_ENTRIES;
  });

  // Monotonic counter for generating new JE ids. journalEntries.length alone
  // isn't safe for this: seeded ids aren't gapless (e.g. ...0002, 0003, 0006),
  // so a count-based guess can land on one that already exists, and React
  // batches state updates — two addJournalEntry() calls made back-to-back in
  // the same tick (e.g. posting several stage entries in a simulation loop)
  // would both read the same stale length and collide on the same id. This
  // ref instead tracks the highest JE-2026-NNNN number seen so far and always
  // moves forward from there, regardless of gaps or when state updates land.
  const highestJeNumber = (entries) => entries.reduce((max, je) => {
    const match = /JE-\d{4}-(\d+)/.exec(je.id || je.number || '');
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  const jeCounterRef = useRef(highestJeNumber(journalEntries));
  useEffect(() => {
    jeCounterRef.current = Math.max(jeCounterRef.current, highestJeNumber(journalEntries));
  }, [journalEntries]);

  // Fiscal Periods
  const [fiscalPeriods, setFiscalPeriods] = useState(() => {
    try {
      const saved = localStorage.getItem('v_gl_periods');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isDataReset() && Array.isArray(parsed)) {
          return parsed;
        }
        if (Array.isArray(parsed) && parsed.length === 12 && parsed.filter(p => p.hardLock).length === 3) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    try {
      localStorage.setItem('v_gl_periods', JSON.stringify(INITIAL_PERIODS));
    } catch (e) {}
    return INITIAL_PERIODS;
  });


  // Bank Transactions — the "real" external feed (synced from Atlas /
  // seeded demo entries like the stamping fee and AWS hosting charge).
  // Renamed from `bankTransactions` because that name is now the merged
  // view exposed below (this feed plus the PAS-derived rows) — see
  // `pasBankFeedTransactions` and the `bankTransactions` memo further down.
  const [rawBankTransactions, setRawBankTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('v_bank_transactions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_BANK_TRANSACTIONS;
  });

  // Policy & Simulator
  const [policy, setPolicy] = useState(REFERENCE_POLICY);
  const [lifecycleStage, setLifecycleStage] = useState(1);

  // Bank Balances
  const [cashBalances, setCashBalances] = useState(() => {
    try {
      const saved = localStorage.getItem('v_cash_balances');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      carrierOperating: 540200.00,
      mgaTrust: 480300.00,
      mgaOperating: 185000.00,
      brokerTrust: 142000.00,
      brokerOperating: 98000.00
    };
  });

  // AP Invoices
  const [apInvoices, setApInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem('v_ap_invoices');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'INV-AP-001',
        vendor: 'Southlake Risk Carriers Ltd',
        policyNumber: 'POL-V8NHT',
        amount: 29757.00,
        dueDate: '2026-09-02',
        status: 'Pending Remittance',
        description: 'Carrier Net Remittance on POL-V8NHT (Gross $33,257 less $3,500 MGA fee)',
        entity: 'ENT-MGA-01',
        matchStatus: '3-Way Matched'
      },
      {
        id: 'INV-AP-002',
        vendor: 'Texas State Comptroller',
        policyNumber: 'POL-V8NHT',
        amount: 3503.00,
        dueDate: '2026-09-15',
        status: 'Accrued',
        description: 'Texas Surplus Lines Tax (4.85%) & Stamping Fee escrow',
        entity: 'ENT-MGA-01',
        matchStatus: 'Approved'
      },
      {
        id: 'INV-AP-003',
        vendor: 'NTA Delegated Underwriters',
        policyNumber: 'POL-V8NHT',
        amount: 36760.00,
        dueDate: '2026-08-30',
        status: 'Awaiting Settlement',
        description: 'Retail Broker Net Remittance to MGA ($39,260 gross less $2,500 retained commission)',
        entity: 'ENT-AGY-01',
        matchStatus: '3-Way Matched'
      },
      {
        id: 'INV-AP-004',
        vendor: 'Amazon Web Services',
        policyNumber: 'N/A',
        amount: 1240.00,
        dueDate: '2026-09-10',
        status: 'Approved',
        description: 'Monthly Cloud Infrastructure & Database Hosting',
        entity: 'ENT-CORP',
        matchStatus: 'Auto-Matched'
      }
    ];
  });

  // AR Invoices
  const [arInvoices, setArInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem('v_ar_invoices');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'INV-AR-001',
        customer: 'Ayushi Fleet Logistics Corp',
        policyNumber: 'POL-V8NHT',
        amount: 39260.00,
        dueDate: '2026-08-28',
        status: 'Open',
        description: 'Gross Commercial Trucking Premium Invoice',
        entity: 'ENT-AGY-01',
        agingBucket: '0-30 Days'
      },
      {
        id: 'INV-AR-002',
        customer: 'NTA Program Administrators',
        policyNumber: 'POL-V8NHT',
        amount: 29757.00,
        dueDate: '2026-09-05',
        status: 'Pending Bordereau Ingestion',
        description: 'Carrier Monthly Inbound Bordereau Receivable',
        entity: 'ENT-CAR-01',
        agingBucket: 'Current'
      },
      {
        id: 'INV-AR-003',
        customer: 'Lone Star Hauling LLC',
        policyNumber: 'POL-LS-992',
        amount: 14850.00,
        dueDate: '2026-07-15',
        status: 'Past Due',
        description: 'Commercial Auto Liability Endorsement Premium',
        entity: 'ENT-AGY-01',
        agingBucket: '31-60 Days'
      }
    ];
  });

  // Synchronize to localStorage
  useEffect(() => {
    localStorage.setItem('v_gl_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('v_gl_opening_balances', JSON.stringify(openingBalances));
  }, [openingBalances]);

  useEffect(() => {
    localStorage.setItem('v_gl_journal_entries', JSON.stringify(journalEntries));
  }, [journalEntries]);

  useEffect(() => {
    localStorage.setItem('v_gl_periods', JSON.stringify(fiscalPeriods));
  }, [fiscalPeriods]);

  useEffect(() => {
    localStorage.setItem('v_cash_balances', JSON.stringify(cashBalances));
  }, [cashBalances]);

  useEffect(() => {
    localStorage.setItem('v_ap_invoices', JSON.stringify(apInvoices));
  }, [apInvoices]);

  useEffect(() => {
    localStorage.setItem('v_ar_invoices', JSON.stringify(arInvoices));
  }, [arInvoices]);

  useEffect(() => {
    localStorage.setItem('v_bank_transactions', JSON.stringify(rawBankTransactions));
  }, [rawBankTransactions]);

  // MongoDB Atlas Live Database State
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [dbInfo, setDbInfo] = useState(null);

  // Synchronize state with MongoDB Atlas backend
  const syncWithBackend = useCallback(async () => {
    try {
      const health = await api.checkHealth();
      if (health && health.database?.isConnected) {
        setIsDbConnected(true);
        setDbInfo({
          database: health.database.stats?.database || 'veridex_finance',
          host: health.database.stats?.host,
          collectionsCount: health.database.stats?.collectionsCount,
          uptimeSeconds: health.uptimeSeconds
        });

        // Load accounts from Atlas. Once connected, Atlas is the source of
        // truth — including a legitimately empty collection (e.g. right
        // after Reset Data) — so these no longer skip on a zero-length
        // response; that guard used to mean a real reset-to-empty could
        // never actually clear a stale non-empty localStorage cache.
        const dbAccounts = await api.getAccounts().catch(() => null);
        if (Array.isArray(dbAccounts)) {
          setAccounts(dbAccounts);
        }

        // Load periods from Atlas
        const dbPeriods = await api.getPeriods().catch(() => null);
        if (Array.isArray(dbPeriods)) {
          setFiscalPeriods(dbPeriods);
        }

        // Load journal entries from Atlas
        const dbJEs = await api.getJournalEntries().catch(() => null);
        if (dbJEs && Array.isArray(dbJEs.entries)) {
          setJournalEntries(dbJEs.entries);
        }

        // Load bank transactions from Atlas
        const dbTxns = await api.getBankTransactions().catch(() => null);
        if (Array.isArray(dbTxns)) {
          setRawBankTransactions(dbTxns);
        }

        // Load AP invoices (bills) from Atlas
        const dbApInvoices = await api.getInvoices({ direction: 'AP' }).catch(() => null);
        if (Array.isArray(dbApInvoices)) {
          setApInvoices(dbApInvoices.map(inv => ({
            id: inv.id || inv.invoiceNumber,
            vendor: inv.partnerName,
            policyNumber: inv.policyNumber,
            amount: inv.amount,
            dueDate: inv.dueDate,
            status: inv.status,
            category: inv.category,
            description: inv.description,
            entity: inv.entity,
            entityName: inv.entityName,
            matchStatus: inv.matchStatus,
            counterpartyEntity: inv.counterpartyEntity,
            glAcct: inv.glAcct,
            counterpartyReceivableAcct: inv.counterpartyReceivableAcct,
            method: inv.method,
            source: inv.source,
            nextBill: inv.nextBill
          })));
        }

        // Load AR invoices from Atlas
        const dbArInvoices = await api.getInvoices({ direction: 'AR' }).catch(() => null);
        if (Array.isArray(dbArInvoices)) {
          setArInvoices(dbArInvoices.map(inv => ({
            id: inv.id || inv.invoiceNumber,
            customer: inv.partnerName,
            policyNumber: inv.policyNumber,
            amount: inv.amount,
            dueDate: inv.dueDate,
            status: inv.status,
            description: inv.description,
            entity: inv.entity,
            entityName: inv.entityName,
            agingBucket: inv.agingBucket,
            source: inv.source
          })));
        }
      } else {
        setIsDbConnected(false);
      }
    } catch (e) {
      // Backend offline or unreachable, retain localStorage cache
      setIsDbConnected(false);
    }
  }, []);

  useEffect(() => {
    syncWithBackend();
    const interval = setInterval(() => {
      syncWithBackend();
    }, 12000);
    return () => clearInterval(interval);
  }, [syncWithBackend]);

  // ============================================================
  // ACCOUNT & COA CRUD METHODS
  // ============================================================
  const addAccount = (newAcc) => {
    if (accounts.some(a => a.code === newAcc.code)) {
      throw new Error(`Account code ${newAcc.code} already exists.`);
    }
    const created = {
      id: `ACC-${newAcc.code}`,
      code: newAcc.code,
      name: newAcc.name,
      parentCode: newAcc.parentCode || '',
      type: newAcc.type || 'Asset',
      subtype: newAcc.subtype || (newAcc.type === 'Asset' ? 'Current Assets' : 'Operating'),
      normalBalance: newAcc.normalBalance || (['Asset', 'Expense'].includes(newAcc.type) ? 'Debit' : 'Credit'),
      dimensions: newAcc.dimensions || ['mga', 'state', 'lob'],
      status: newAcc.status || 'active',
      balance: parseFloat(newAcc.balance) || 0,
      description: newAcc.description || ''
    };
    setAccounts(prev => [...prev, created]);
    setOpeningBalances(prev => ({
      ...prev,
      [created.code]: {
        debit: created.normalBalance === 'Debit' ? created.balance : 0,
        credit: created.normalBalance === 'Credit' ? created.balance : 0
      }
    }));

    // Async push to MongoDB Atlas
    api.createAccount({
      code: created.code,
      name: created.name,
      parentCode: created.parentCode,
      group: (created.type || 'Asset').toLowerCase(),
      type: created.type,
      dimensions: created.dimensions,
      normalBalance: created.normalBalance,
      balance: created.balance,
      status: created.status,
      description: created.description
    }).catch(err => console.warn('[Atlas Account Sync]:', err.message));

    return created;
  };

  const updateAccount = (code, updates) => {
    setAccounts(prev => prev.map(a => a.code === code ? { ...a, ...updates } : a));
  };

  const toggleAccountStatus = (code) => {
    setAccounts(prev => prev.map(a => {
      if (a.code === code) {
        return { ...a, status: a.status === 'active' ? 'inactive' : 'active' };
      }
      return a;
    }));
  };

  // Permanently removes one account — unlike Reset Data (which wipes every
  // transaction in the database), this only touches the single account the
  // caller asked for. Refuses when the account has posted journal activity
  // against it, since deleting it out from under real ledger history would
  // leave those postings pointing at a GL code that no longer exists;
  // deactivating is the right move for an account that's actually been used.
  const deleteAccount = (code) => {
    const hasActivity = journalEntries.some(je =>
      (je.lines || []).some(line => line.accountCode === code || line.acct === code)
    );
    if (hasActivity) {
      throw new Error(`${code} has posted journal activity and can't be deleted — deactivate it instead.`);
    }

    setAccounts(prev => prev.filter(a => a.code !== code));
    setOpeningBalances(prev => {
      const next = { ...prev };
      delete next[code];
      return next;
    });

    api.deleteAccount(code).catch(err => console.warn('[Atlas Account Delete]:', err.message));
  };

  const setOpeningBalance = (code, debit, credit) => {
    const d = parseFloat(debit) || 0;
    const c = parseFloat(credit) || 0;
    setOpeningBalances(prev => ({
      ...prev,
      [code]: { debit: d, credit: c, setAt: new Date().toISOString() }
    }));
  };

  // Dynamically compute live balance for an account code
  const getAccountBalance = (code) => {
    const ob = currentAccountingLevel === 'pizza' ? { debit: 0, credit: 0 } : (openingBalances[code] || { debit: 0, credit: 0 });
    let totalDebit = ob.debit || 0;
    let totalCredit = ob.credit || 0;

    journalEntries
      .filter(j => (j.status === 'Posted' || j.status === 'posted') && belongsToActiveEntity(j))
      .forEach(je => {
        (je.lines || []).forEach(line => {
          if (line.accountCode === code || line.acct === code) {
            totalDebit += parseFloat(line.debit) || 0;
            totalCredit += parseFloat(line.credit) || 0;
          }
        });
      });

    const net = totalDebit - totalCredit;
    return {
      debit: totalDebit,
      credit: totalCredit,
      net,
      balance: Math.abs(net)
    };
  };

  // Get chronological transaction audit trail
  const getAccountLedger = (code) => {
    const ob = currentAccountingLevel === 'pizza' ? { debit: 0, credit: 0 } : (openingBalances[code] || { debit: 0, credit: 0 });
    const openingNet = (ob.debit || 0) - (ob.credit || 0);
    const rows = [];

    journalEntries
      .filter(j => (j.status === 'Posted' || j.status === 'posted') && belongsToActiveEntity(j))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach(je => {
        (je.lines || []).forEach(line => {
          if (line.accountCode === code || line.acct === code) {
            rows.push({
              jeId: je.id,
              date: je.date,
              reference: je.reference,
              description: line.description || je.description,
              debit: parseFloat(line.debit) || 0,
              credit: parseFloat(line.credit) || 0,
              entity: je.entityName || je.entity
            });
          }
        });
      });

    let running = openingNet;
    rows.forEach(r => {
      running += r.debit - r.credit;
      r.runningBalance = running;
    });

    return {
      accountCode: code,
      openingNet,
      rows,
      closingNet: running,
      closing: { debit: Math.max(running, 0), credit: Math.max(-running, 0) }
    };
  };

  // ============================================================
  // JOURNAL ENTRY CRUD METHODS
  // ============================================================
  const addJournalEntry = (newEntry) => {
    // Default to whichever role is currently logged in — each entity keeps
    // its own book, so an entry created without an explicit entity belongs
    // to the person creating it, not a hardcoded default.
    const entity = newEntry.entity || activeEntity?.id || (currentAccountingLevel === 'pizza' ? 'ENT-FRN-01' : 'ENT-MGA-01');
    const entityName = newEntry.entityName || activeEntity?.name || (currentAccountingLevel === 'pizza' ? "Domino's Franchise Store #12" : 'NTA Program Administrators');
    const entryAccountingLevel = newEntry.accountingLevel || currentAccountingLevel;

    const entry = {
      ...newEntry,
      id: newEntry.id || `JE-2026-${String(++jeCounterRef.current).padStart(4, '0')}`,
      status: newEntry.status || 'Posted',
      date: newEntry.date || new Date().toISOString().slice(0, 10),
      entity,
      entityName,
      accountingLevel: entryAccountingLevel,
      createdAt: new Date().toISOString()
    };
    setJournalEntries(prev => [entry, ...prev]);

    // Async push to MongoDB Atlas
    api.createJournalEntry({
      id: entry.id,
      number: entry.number || entry.id,
      date: entry.date,
      description: entry.description || 'Journal Entry',
      entity,
      entityName,
      reference: entry.reference || '',
      status: (entry.status || 'draft').toLowerCase(),
      lines: entry.lines || []
    }).catch(err => console.warn('[Atlas JE Sync]:', err.message));

    return entry;
  };

  const postJournalEntry = (id) => {
    setJournalEntries(prev => prev.map(je => je.id === id ? { ...je, status: 'Posted', postedAt: new Date().toISOString() } : je));

    // Async push to MongoDB Atlas — this is what actually applies the entry's
    // lines to the Chart of Accounts balances server-side.
    api.postJournalEntry(id).catch(err => console.warn('[Atlas JE Post Sync]:', err.message));
  };

  const reverseJournalEntry = (id) => {
    const target = journalEntries.find(j => j.id === id);
    if (!target) return null;

    const reversalLines = (target.lines || []).map(line => ({
      ...line,
      debit: line.credit || 0,
      credit: line.debit || 0,
      description: `Reversal of: ${line.description || line.accountName || ''}`
    }));

    const reversalEntry = {
      id: `REV-${target.id}`,
      date: new Date().toISOString().slice(0, 10),
      entity: target.entity,
      entityName: target.entityName,
      reference: `Reversal of ${target.id}`,
      description: `Auto-reversing entry for ${target.id}: ${target.description}`,
      status: 'Posted',
      lines: reversalLines,
      createdAt: new Date().toISOString()
    };

    setJournalEntries(prev => [reversalEntry, ...prev]);
    return reversalEntry;
  };

  // ============================================================
  // DOMINO'S PIZZA & MULTI-LEVEL ACCOUNTING ENGINE
  // ============================================================
  const [franchiseSharePct, setFranchiseSharePctState] = useState(() => {
    try {
      const saved = localStorage.getItem('v_pizza_franchise_share_pct');
      if (saved !== null && saved !== '30') {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0 && val <= 100) return val;
      }
    } catch {}
    return 70; // Default 70% franchise ($70) / 30% Domino's Main Hub ($30)
  });

  const setFranchiseSharePct = useCallback((val) => {
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) throw new Error('Franchise share must be a valid number');
    if (num < 0 || num > 100) throw new Error('Franchise share must be between 0% and 100%');
    setFranchiseSharePctState(num);
    try {
      localStorage.setItem('v_pizza_franchise_share_pct', String(num));
    } catch {}
  }, []);

  const dominosSharePct = useMemo(() => Math.max(0, Math.min(100, 100 - franchiseSharePct)), [franchiseSharePct]);

  const recordPizzaSale = useCallback(({
    customerName = 'Ayushi',
    pizzaItem = 'Large Pepperoni & Cheese Farmhouse Pizza',
    saleAmount = 100.00,
    franchiseEntityId = 'ENT-FRN-01',
    franchiseName = "Domino's Franchise Store #12",
    dominosEntityId = 'ENT-HUB-01',
    dominosName = "Domino's Main Company"
  } = {}) => {
    const today = new Date().toISOString().slice(0, 10);
    const franchiseShare = Math.round((saleAmount * franchiseSharePct / 100) * 100) / 100;
    const dominosShare = Math.round((saleAmount * dominosSharePct / 100) * 100) / 100;

    // 1. Franchise Store Journal Entry:
    const franchiseSaleJe = addJournalEntry({
      date: today,
      reference: `POS-SALE-${customerName.toUpperCase()}`,
      description: `POS Pizza Sale to ${customerName} (${pizzaItem}) — Store #12`,
      entity: franchiseEntityId,
      entityName: franchiseName,
      accountingLevel: 'pizza',
      status: 'Posted',
      lines: [
        { accountCode: '1001', accountName: 'Cash / Bank (Operating Account)', debit: saleAmount, credit: 0, description: `Customer ${customerName} cash receipt` },
        { accountCode: '4500', accountName: 'Pizza Sales Revenue', debit: 0, credit: saleAmount, description: `Gross sale revenue: ${pizzaItem}` },
        { accountCode: '5300', accountName: 'Franchise Revenue Share Expense', debit: dominosShare, credit: 0, description: `Dominos Main Company ${dominosSharePct}% revenue share expense` },
        { accountCode: '2050', accountName: `Due to ${dominosName}`, debit: 0, credit: dominosShare, description: `Intercompany payable due to ${dominosName}` }
      ]
    });

    // 2. Domino's Main Company Journal Entry:
    const dominosIncomeJe = addJournalEntry({
      date: today,
      reference: `REV-SHARE-${customerName.toUpperCase()}`,
      description: `Revenue Share (${dominosSharePct}%) recognized from ${franchiseName} on customer sale`,
      entity: dominosEntityId,
      entityName: dominosName,
      accountingLevel: 'pizza',
      status: 'Posted',
      lines: [
        { accountCode: '1180', accountName: `Due from ${franchiseName}`, debit: dominosShare, credit: 0, description: `Intercompany receivable due from ${franchiseName}` },
        { accountCode: '4600', accountName: 'Franchise Revenue Share Income', debit: 0, credit: dominosShare, description: `Dominos Main Company revenue share income (${dominosSharePct}%)` }
      ]
    });

    // 3. Create Franchise Store AP invoice payable to Domino's Main Company
    const shareBill = {
      id: `INV-AP-FRN-SHARE-${Date.now()}`,
      vendor: dominosName,
      policyNumber: '',
      amount: dominosShare,
      dueDate: today,
      status: 'Awaiting Settlement',
      description: `Franchise Revenue Share payable to ${dominosName} (${dominosSharePct}% of ₹${saleAmount})`,
      entity: franchiseEntityId,
      entityName: franchiseName,
      counterpartyEntity: { id: dominosEntityId, name: dominosName },
      glAcct: '2050',
      counterpartyReceivableAcct: '1180',
      matchStatus: '3-Way Matched'
    };
    setApInvoices(prev => [shareBill, ...prev]);
    api.createInvoice({
      id: shareBill.id,
      invoiceNumber: shareBill.id,
      direction: 'AP',
      partnerName: shareBill.vendor,
      amount: shareBill.amount,
      dueDate: shareBill.dueDate,
      entity: shareBill.entity,
      entityName: shareBill.entityName,
      status: shareBill.status,
      matchStatus: shareBill.matchStatus
    }).catch(() => {});

    return {
      saleAmount,
      franchiseShare,
      dominosShare,
      franchiseSharePct,
      dominosSharePct,
      franchiseSaleJe,
      dominosIncomeJe,
      shareBill
    };
  }, [addJournalEntry, franchiseSharePct, dominosSharePct]);

  const settlePizzaSale = useCallback((targetBillId) => {
    const bill = targetBillId
      ? apInvoices.find(b => b.id === targetBillId)
      : apInvoices.find(b => b.id.startsWith('INV-AP-FRN-SHARE') && b.status !== 'Paid & Cleared');
    if (!bill) {
      throw new Error('No unsettled pizza sale bill found.');
    }
    if (bill.status === 'Paid & Cleared') {
      return { alreadySettled: true, bill };
    }

    const today = new Date().toISOString().slice(0, 10);
    const dominosName = bill.counterpartyEntity?.name || "Domino's Main Company";

    // 1. Franchise Store Settlement Entry:
    const franchiseSettlementJe = addJournalEntry({
      date: today,
      reference: `Bill Payment ${bill.id}`,
      description: `Settlement — ${bill.entityName} pays ${dominosName} ₹${bill.amount.toLocaleString()}`,
      entity: bill.entity,
      entityName: bill.entityName,
      accountingLevel: 'pizza',
      status: 'Posted',
      lines: [
        { accountCode: '2050', accountName: `Due to ${dominosName}`, debit: bill.amount, credit: 0, description: `Clear Due to ${dominosName}` },
        { accountCode: '1001', accountName: 'Cash / Bank (Operating Account)', debit: 0, credit: bill.amount, description: 'Cash Disbursed' }
      ]
    });

    // 2. Domino's Main Company Settlement Entry:
    const dominosSettlementJe = addJournalEntry({
      date: today,
      reference: `Bill Payment ${bill.id}`,
      description: `Cash Receipt from ${bill.entityName} — Settlement ${bill.id}`,
      entity: bill.counterpartyEntity?.id || 'ENT-HUB-01',
      entityName: dominosName,
      accountingLevel: 'pizza',
      status: 'Posted',
      lines: [
        { accountCode: '1001', accountName: 'Cash / Bank (Operating Account)', debit: bill.amount, credit: 0, description: 'Cash Received' },
        { accountCode: '1180', accountName: `Due from ${bill.entityName}`, debit: 0, credit: bill.amount, description: `Clear Due from ${bill.entityName}` }
      ]
    });

    setApInvoices(prev => prev.map(b => b.id === bill.id ? { ...b, status: 'Paid & Cleared', paidDate: today } : b));
    api.payInvoice(bill.id, bill.amount, 'Paid & Cleared').catch(() => {});

    return {
      bill,
      franchiseSettlementJe,
      dominosSettlementJe,
      amountSettled: bill.amount
    };
  }, [apInvoices, addJournalEntry]);

  // ============================================================
  // FINANCIAL STATEMENTS & CALCULATIONS ENGINE
  // ============================================================
  const PIZZA_ACCOUNT_CODES = ['1001', '1002', '1100', '1180', '1500', '2001', '2050', '3100', '3200', '4500', '4600', '5300', '5400', '5500'];
  const INSURANCE_ACCOUNT_CODES = ['1001', '1100', '1400', '1500', '2100', '2200', '2300', '2400', '3100', '3200', '4100', '4500', '5100', '5101', '5200', '5500'];

  const levelAccounts = useMemo(() => {
    if (currentAccountingLevel === 'pizza') {
      return accounts.filter(a => PIZZA_ACCOUNT_CODES.includes(a.code));
    }
    return accounts.filter(a => INSURANCE_ACCOUNT_CODES.includes(a.code));
  }, [accounts, currentAccountingLevel]);

  const getTrialBalance = () => {
    let totalDebit = 0;
    let totalCredit = 0;

    const rows = levelAccounts.map(a => {
      const bal = getAccountBalance(a.code);
      const isDebitNormal = a.normalBalance === 'Debit';
      const debitVal = isDebitNormal ? (bal.net >= 0 ? bal.net : 0) : 0;
      const creditVal = !isDebitNormal ? (bal.net <= 0 ? Math.abs(bal.net) : 0) : 0;

      totalDebit += debitVal;
      totalCredit += creditVal;

      return {
        code: a.code,
        name: a.name,
        type: a.type,
        debit: debitVal,
        credit: creditVal
      };
    });

    return {
      rows,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
    };
  };

  const getBalanceSheet = () => {
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    const assetRows = [];
    const liabilityRows = [];
    const equityRows = [];

    levelAccounts.forEach(a => {
      const bal = getAccountBalance(a.code);
      const amount = Math.abs(bal.net);

      if (a.type === 'Asset') {
        assetRows.push({ code: a.code, name: a.name, amount });
        totalAssets += bal.net >= 0 ? bal.net : -bal.net;
      } else if (a.type === 'Liability') {
        liabilityRows.push({ code: a.code, name: a.name, amount });
        totalLiabilities += Math.abs(bal.net);
      } else if (a.type === 'Equity') {
        equityRows.push({ code: a.code, name: a.name, amount });
        totalEquity += Math.abs(bal.net);
      }
    });

    return {
      assets: assetRows,
      liabilities: liabilityRows,
      equity: equityRows,
      totalAssets,
      totalLiabilities,
      totalEquity
    };
  };

  const getProfitAndLoss = () => {
    let totalRevenue = 0;
    let totalExpenses = 0;

    const revenueRows = [];
    const expenseRows = [];

    levelAccounts.forEach(a => {
      const bal = getAccountBalance(a.code);
      const amount = Math.abs(bal.net);

      if (a.type === 'Revenue') {
        revenueRows.push({ code: a.code, name: a.name, amount });
        totalRevenue += amount;
      } else if (a.type === 'Expense') {
        expenseRows.push({ code: a.code, name: a.name, amount });
        totalExpenses += amount;
      }
    });

    const netOperatingIncome = totalRevenue - totalExpenses;
    return {
      revenue: revenueRows,
      expenses: expenseRows,
      totalRevenue,
      totalExpenses,
      netOperatingIncome
    };
  };

  // ============================================================
  // PERIOD LOCKING & FISCAL CONTROLS
  // ============================================================
  const toggleSoftClose = (periodId) => {
    setFiscalPeriods(prev => prev.map(p => {
      if (p.id === periodId) {
        const nextSoft = !p.softClose;
        const updated = {
          ...p,
          softClose: nextSoft,
          status: p.hardLock ? 'hard_locked' : (nextSoft ? 'soft_closed' : 'open')
        };
        api.updatePeriod(periodId, { softClose: updated.softClose, status: updated.status })
          .catch(err => console.warn('[Atlas Period Sync]:', err.message));
        return updated;
      }
      return p;
    }));
  };

  const toggleHardLock = (periodId) => {
    setFiscalPeriods(prev => prev.map(p => {
      if (p.id === periodId) {
        const nextHard = !p.hardLock;
        const updated = {
          ...p,
          hardLock: nextHard,
          softClose: nextHard ? true : p.softClose,
          status: nextHard ? 'hard_locked' : (p.softClose ? 'soft_closed' : 'open')
        };
        api.updatePeriod(periodId, { hardLock: updated.hardLock, softClose: updated.softClose, status: updated.status })
          .catch(err => console.warn('[Atlas Period Sync]:', err.message));
        return updated;
      }
      return p;
    }));
  };

  const isPeriodLocked = (dateStr) => {
    if (!dateStr) return false;
    const prefix = dateStr.slice(0, 7);
    const p = fiscalPeriods.find(x => x.id === prefix);
    return Boolean(p && p.hardLock);
  };

  // ============================================================
  // AP BILLS & AR INVOICES WORKFLOWS
  // ============================================================
  const addApInvoice = (newBill) => {
    const bill = {
      ...newBill,
      id: newBill.id || `INV-AP-${String(apInvoices.length + 1).padStart(3, '0')}`,
      status: newBill.status || 'Pending Approval',
      matchStatus: newBill.matchStatus || '3-Way Matched'
    };
    setApInvoices(prev => [bill, ...prev]);

    // Async push to MongoDB Atlas
    api.createInvoice({
      id: bill.id,
      invoiceNumber: bill.id,
      direction: 'AP',
      partnerName: bill.vendor,
      partnerType: bill.partnerType || 'Vendor',
      policyNumber: bill.policyNumber || '',
      entity: bill.entity || 'ENT-MGA-01',
      entityName: bill.entityName || '',
      amount: bill.amount,
      dueDate: bill.dueDate,
      category: bill.category || 'General',
      description: bill.description || '',
      status: bill.status,
      matchStatus: bill.matchStatus,
      counterpartyEntity: bill.counterpartyEntity || undefined,
      glAcct: bill.glAcct || '',
      counterpartyReceivableAcct: bill.counterpartyReceivableAcct || '',
      method: bill.method || '',
      source: bill.source || '',
      nextBill: bill.nextBill || undefined
    }).catch(err => console.warn('[Atlas AP Invoice Sync]:', err.message));

    return bill;
  };

  const payApInvoice = (id, method = 'ACH Wire') => {
    const target = apInvoices.find(b => b.id === id);
    if (!target) return;

    setApInvoices(prev => prev.map(b => b.id === id ? { ...b, status: 'Paid & Cleared', paidDate: new Date().toISOString().slice(0, 10) } : b));
    setCashBalances(prev => ({ ...prev, carrierOperating: prev.carrierOperating - target.amount }));

    // Async push to MongoDB Atlas
    api.payInvoice(id, target.amount, 'Paid & Cleared').catch(err => console.warn('[Atlas AP Invoice Pay Sync]:', err.message));

    if (target.counterpartyEntity) {
      // Inter-entity settlement (e.g. Broker paying MGA their net premium) —
      // paying this bill must hit BOTH books at once: the payer disburses
      // cash against its own Payable, and the counterparty simultaneously
      // receives that cash against its own Receivable. Mirrors the Stage 3
      // BROKER_SETTLEMENT_COMPLETED split in the PAS Event Injector.
      addJournalEntry({
        date: new Date().toISOString().slice(0, 10),
        reference: `Bill Payment ${target.id}`,
        description: `Disbursement clearing AP for ${target.vendor} (${method})`,
        entity: target.entity,
        entityName: target.entityName || target.vendor,
        status: 'Draft',
        lines: [
          { accountCode: target.glAcct || '2001', accountName: 'Accounts Payable', debit: target.amount, credit: 0 },
          { accountCode: '1001', accountName: 'Operating Cash & Clearing', debit: 0, credit: target.amount }
        ]
      });
      addJournalEntry({
        date: new Date().toISOString().slice(0, 10),
        reference: `Bill Payment ${target.id}`,
        description: `Cash Receipt from ${target.entityName || target.vendor} — Settlement ${target.id}`,
        entity: target.counterpartyEntity.id,
        entityName: target.counterpartyEntity.name,
        status: 'Draft',
        lines: [
          { accountCode: '1001', accountName: 'Operating Cash & Clearing', debit: target.amount, credit: 0 },
          { accountCode: target.counterpartyReceivableAcct || '1100', accountName: 'Receivable', debit: 0, credit: target.amount }
        ]
      });

      // The counterparty now holds the cash and may itself owe the next
      // party in the chain (e.g. the MGA, having just been paid by the
      // Broker, owes the Carrier) — raise that bill directly in the
      // counterparty's own book so the settlement chain continues on its
      // own without a manual step.
      if (target.nextBill) {
        addApInvoice(target.nextBill);
      }

      // Paying the Broker's "owed to MGA" bill also clears the matching AR
      // invoice sitting in the MGA's own book (raised at Stage 1 binding
      // for the same receivable) — same clearing PAS's explicit
      // BROKER_SETTLEMENT_COMPLETED event performs, so both paths agree.
      if (target.category === 'MGA Settlement — Net Premium Payable' && target.policyNumber) {
        markArInvoicePaid(`INV-AR-MGA-${target.policyNumber}`, target.amount);
      }
    } else {
      // GL Journal Entry for payment (single-entity bill) — draft, same as
      // every other flow: it must be posted manually to hit the COA.
      addJournalEntry({
        id: `JE-PAY-${target.id}`,
        date: new Date().toISOString().slice(0, 10),
        reference: `Bill Payment ${target.id}`,
        description: `Disbursement clearing AP for ${target.vendor} (${method})`,
        entityName: target.vendor,
        status: 'Draft',
        lines: [
          { accountCode: '2001', accountName: 'Accounts Payable — Trade & Vendors', debit: target.amount, credit: 0 },
          { accountCode: '1001', accountName: 'Operating Cash & Clearing', debit: 0, credit: target.amount }
        ]
      });
    }
  };

  const addArInvoice = (newInv) => {
    const inv = {
      ...newInv,
      id: newInv.id || `INV-AR-${String(arInvoices.length + 1).padStart(3, '0')}`,
      status: newInv.status || 'Open',
      agingBucket: newInv.agingBucket || '0-30 Days'
    };
    setArInvoices(prev => [inv, ...prev]);

    // Async push to MongoDB Atlas
    api.createInvoice({
      id: inv.id,
      invoiceNumber: inv.id,
      direction: 'AR',
      partnerName: inv.customer,
      partnerType: inv.partnerType || 'Broker',
      policyNumber: inv.policyNumber || '',
      entity: inv.entity || 'ENT-AGY-01',
      entityName: inv.entityName || '',
      amount: inv.amount,
      dueDate: inv.dueDate,
      category: inv.category || 'General',
      description: inv.description || '',
      status: inv.status,
      agingBucket: inv.agingBucket,
      source: inv.source || ''
    }).catch(err => console.warn('[Atlas AR Invoice Sync]:', err.message));

    return inv;
  };

  const collectArInvoice = (id, amount, depositAccount = '1001') => {
    const target = arInvoices.find(inv => inv.id === id);
    if (!target) return;

    const amt = amount || target.amount;
    setArInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'Paid in Full', collectedDate: new Date().toISOString().slice(0, 10) } : inv));
    setCashBalances(prev => ({ ...prev, brokerTrust: prev.brokerTrust + amt }));

    // Async push to MongoDB Atlas
    api.payInvoice(id, amt, 'Paid in Full').catch(err => console.warn('[Atlas AR Invoice Collect Sync]:', err.message));

    // GL Journal Entry for Cash Receipt — draft; must be posted manually to
    // hit the COA, same as every other flow.
    addJournalEntry({
      id: `JE-RECV-${target.id}`,
      date: new Date().toISOString().slice(0, 10),
      reference: `Cash Receipt ${target.id}`,
      description: `Deposit settlement clearing open AR for ${target.customer}`,
      entity: target.entity,
      entityName: target.entityName || target.customer,
      status: 'Draft',
      lines: [
        { accountCode: depositAccount, accountName: 'Operating Cash & Clearing', debit: amt, credit: 0 },
        { accountCode: '1100', accountName: 'Accounts Receivable — Premium & Agency', debit: 0, credit: amt }
      ]
    });
  };

  // Marks an AR invoice paid WITHOUT posting its own cash-receipt JE — for
  // callers (like the PAS Event Injector's PAYMENT_RECEIVED handler) that
  // already post the matching Dr Cash / Cr Receivable entry themselves, so
  // collectArInvoice's JE would double-count the same receipt.
  const markArInvoicePaid = (id, amount) => {
    const target = arInvoices.find(inv => inv.id === id);
    if (!target) return null;

    const amt = amount || target.amount;
    setArInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'Paid in Full', paidAmount: amt, collectedDate: new Date().toISOString().slice(0, 10) } : inv));
    setCashBalances(prev => ({ ...prev, brokerTrust: prev.brokerTrust + amt }));

    api.payInvoice(id, amt, 'Paid in Full').catch(err => console.warn('[Atlas AR Invoice Mark-Paid Sync]:', err.message));
    return { ...target, status: 'Paid in Full', paidAmount: amt };
  };

  // Marks an AP bill paid WITHOUT posting payApInvoice's own disbursement/
  // receipt JE pair — for callers (like the PAS Event Injector's
  // BROKER_SETTLEMENT_COMPLETED / CARRIER_PAYMENT_COMPLETED handlers) that
  // already post the matching settlement entries themselves via
  // generateRulesEngineGroups, so payApInvoice's JEs would double-post them.
  const markApInvoicePaid = (id, amount) => {
    const target = apInvoices.find(b => b.id === id);
    if (!target) return null;

    const amt = amount || target.amount;
    setApInvoices(prev => prev.map(b => b.id === id ? { ...b, status: 'Paid & Cleared', paidDate: new Date().toISOString().slice(0, 10) } : b));

    api.payInvoice(id, amt, 'Paid & Cleared').catch(err => console.warn('[Atlas AP Invoice Mark-Paid Sync]:', err.message));
    return { ...target, status: 'Paid & Cleared' };
  };

  // ============================================================
  // BANK RECONCILIATION MATCHING
  // ============================================================
  const matchBankTransaction = (txId, contraAccount = '1001') => {
    setRawBankTransactions(prev => prev.map(tx => tx.id === txId ? { ...tx, status: 'Matched', contraAccount } : tx));

    // Async push to MongoDB Atlas
    api.matchBankTransaction(txId, { status: 'Matched', contraAccount }).catch(err => console.warn('[Atlas Bank Match Sync]:', err.message));
  };

  // Pulls the bank feed back down from Atlas — what "Get Transactions" and
  // "Auto-Sync" on Bank Reconciliation actually call (after asking the
  // server to (re)seed the baseline demo feed) so a collection wiped by
  // Reset Data can be restored from the page instead of staying empty
  // until a full database reseed.
  const refreshBankTransactions = async () => {
    const dbTxns = await api.getBankTransactions();
    if (Array.isArray(dbTxns)) setRawBankTransactions(dbTxns);
    return dbTxns;
  };

  // Which bank sub-account (see BankReconciliationPage's ROLE_CONFIG) each
  // DBA book's Cash/Bank (1001) activity actually lands in. Premium cash is
  // fiduciary money, so Broker/MGA both post it to their Trust account; the
  // Carrier only has one operating account in this demo.
  const PAS_CASH_ACCOUNT_BY_ENTITY = {
    'ENT-AGY-01': 'brokerTrust',
    'ENT-MGA-01': 'mgaTrust',
    'ENT-CAR-01': 'carrierOperating'
  };

  // Bank-feed rows synthesized from POSTED journal entries the PAS Event
  // Injector raised (identified by the "(EVT-...)" it always appends to a
  // JE's description — see PasPolicyPage's addJournalEntry call) that hit
  // Cash (1001). Without this, `rawBankTransactions` stayed hardcoded to
  // whichever amounts were seeded at demo setup — always the Stage 2
  // "Match" numbers ($39,260 / $36,760 / $29,757) — regardless of what the
  // injector actually posted. A Pay Short or Extra Pay run would then show
  // a stale, already-"Matched" bank row for an amount that never happened,
  // sitting right next to nothing representing what actually did. Pulling
  // these from the same posted-JE source of truth the GL side already uses
  // (and pre-marking them Matched, since there's no separate real bank feed
  // to diverge from in this demo) keeps the two sides honest by
  // construction instead of by two people remembering to update both.
  const pasBankFeedTransactions = useMemo(() => {
    const rows = [];
    journalEntries
      .filter(je => (je.status === 'Posted' || je.status === 'posted') && (je.description || '').includes('(EVT-'))
      .forEach(je => {
        const account = PAS_CASH_ACCOUNT_BY_ENTITY[je.entity];
        if (!account) return;
        (je.lines || []).forEach((line, i) => {
          const code = line.accountCode || line.acct;
          if (code !== '1001') return;
          const amount = (parseFloat(line.debit) || 0) - (parseFloat(line.credit) || 0);
          if (!amount) return;
          const contraLine = (je.lines || []).find(l => (l.accountCode || l.acct) !== '1001');
          rows.push({
            id: `${je.id}-BANK-L${i}`,
            date: je.date,
            description: line.description || je.description || je.id,
            amount,
            type: amount > 0 ? 'Credit' : 'Debit',
            status: 'Matched',
            contraAccount: contraLine ? (contraLine.accountCode || contraLine.acct) : null,
            entity: je.entity,
            account,
            origin: 'pas'
          });
        });
      });
    return rows;
  }, [journalEntries]);

  // What every consumer (Bank Reconciliation, the dashboards, …) actually
  // reads as "the bank feed" — the real/manually-synced feed above plus the
  // PAS-derived rows. `rawBankTransactions` stays the thing Reset Data,
  // localStorage, and Atlas sync all operate on; this merge is
  // recomputed, never stored.
  const bankTransactions = useMemo(
    () => [...rawBankTransactions, ...pasBankFeedTransactions],
    [rawBankTransactions, pasBankFeedTransactions]
  );

  // ============================================================
  // INSURANCE DEMO SIMULATOR STAGES
  // ============================================================
  const executeStageAction = (stage) => {
    if (stage === 2) {
      setArInvoices(prev => prev.map(inv => inv.id === 'INV-AR-001' ? { ...inv, status: 'Paid in Full' } : inv));
      setCashBalances(prev => ({ ...prev, brokerTrust: prev.brokerTrust + 39260.00 }));
      setLifecycleStage(2);
      setPolicy(prev => ({ ...prev, status: 'Customer Paid' }));
    } else if (stage === 3) {
      setApInvoices(prev => prev.map(inv => inv.id === 'INV-AP-003' ? { ...inv, status: 'Settled via ACH Wire' } : inv));
      setCashBalances(prev => ({
        ...prev,
        brokerTrust: prev.brokerTrust - 36760.00,
        brokerOperating: prev.brokerOperating + 2500.00,
        mgaTrust: prev.mgaTrust + 36760.00
      }));
      setLifecycleStage(3);
      setPolicy(prev => ({ ...prev, status: 'Broker Remitted to MGA' }));
    } else if (stage === 4) {
      setArInvoices(prev => prev.map(inv => inv.id === 'INV-AR-002' ? { ...inv, status: 'Ingested to Carrier GL' } : inv));
      setPolicy(prev => ({
        ...prev,
        status: 'Bordereau Ingested',
        carrier: { ...prev.carrier, bordereauStatus: 'Ingested to GL' }
      }));
      addJournalEntry({
        id: `JE-2026-${String(journalEntries.length + 1).padStart(4, '0')}`,
        date: '2026-08-30',
        entity: 'ENT-CAR-01',
        entityName: 'Southlake Insurance Co.',
        reference: 'POL-V8NHT Bordereau Production Ingestion',
        description: 'Bordereau ingestion establishing open receivable and recognizing $33,257 GWP and $3,500 acquisition override',
        status: 'Draft',
        lines: [
          { accountCode: '1150', accountName: 'Bordereau Ingestion Subledger AR (NTA)', debit: 29757.00, credit: 0 },
          { accountCode: '6101', accountName: 'MGA Program Override Expense', debit: 3500.00, credit: 0 },
          { accountCode: '4100', accountName: 'Gross Written Premium (GWP)', debit: 0, credit: 33257.00 }
        ]
      });
      setLifecycleStage(4);
    } else if (stage === 5) {
      setApInvoices(prev => prev.map(inv => inv.id === 'INV-AP-001' ? { ...inv, status: 'Wire Cleared' } : inv));
      setArInvoices(prev => prev.map(inv => inv.id === 'INV-AR-002' ? { ...inv, status: 'Wire Matched & Closed' } : inv));
      setCashBalances(prev => ({
        ...prev,
        mgaTrust: prev.mgaTrust - 29757.00,
        carrierOperating: prev.carrierOperating + 29757.00
      }));
      setPolicy(prev => ({
        ...prev,
        status: 'Fully Settled & Reconciled',
        carrier: { ...prev.carrier, wireStatus: 'Matched' }
      }));
      addJournalEntry({
        id: `JE-2026-${String(journalEntries.length + 2).padStart(4, '0')}`,
        date: '2026-09-02',
        entity: 'ENT-CAR-01',
        entityName: 'Southlake Insurance Co.',
        reference: 'POL-V8NHT Inbound Wire Cash Settlement',
        description: 'Matching incoming ACH wire $29,757 against Bordereau subledger receivable',
        status: 'Draft',
        lines: [
          { accountCode: '1001', accountName: 'Operating Cash & Clearing', debit: 29757.00, credit: 0 },
          { accountCode: '1150', accountName: 'Bordereau Ingestion Subledger AR (NTA)', debit: 0, credit: 29757.00 }
        ]
      });
      setLifecycleStage(5);
    }
  };

  const resetAll = () => {
    localStorage.clear();
    setLifecycleStage(1);
    setJournalEntries(INITIAL_JOURNAL_ENTRIES);
    setPolicy(REFERENCE_POLICY);
    setAccounts(MOCK_ACCOUNTS.map(a => ({ ...a, status: 'active' })));
    setFiscalPeriods(INITIAL_PERIODS);
    setRawBankTransactions(INITIAL_BANK_TRANSACTIONS);
    setCashBalances({
      carrierOperating: 540200.00,
      mgaTrust: 480300.00,
      mgaOperating: 185000.00,
      brokerTrust: 142000.00,
      brokerOperating: 98000.00
    });
  };

  // Wipe every piece of financial data to empty (Accounts, Journal Entries,
  // Periods, Bank Transactions, AP/AR Invoices). Pairs with api.resetData(),
  // which does the same against MongoDB. Login credentials are unaffected —
  // this only clears financial state, not AuthContext's users.
  const clearAllData = () => {
    try {
      localStorage.setItem('v_data_reset', '1');
      localStorage.setItem('v_pos_injected_events', '[]');
      localStorage.removeItem('v_pos_injected_events');
      localStorage.removeItem('v_ar_invoices_data');
      localStorage.removeItem('v_ap_invoices_data');
      localStorage.removeItem('v_commission_transactions');
      localStorage.removeItem('v_insurance_simulation_state');
      localStorage.removeItem('v_sim_policies');
      localStorage.removeItem('v_sim_parties');
      localStorage.removeItem('v_compliance_filings');
    } catch (e) {}
    // Keep the Chart of Accounts structure (code/name/type/dimensions) —
    // only clear what's posted against it. Emptying the accounts list
    // entirely breaks the app: there'd be nothing left for a new journal
    // entry to post against, and Chart of Accounts would show empty
    // until a reseed.
    setAccounts(prev => prev.map(a => ({ ...a, balance: 0 })));
    setOpeningBalances({});
    setJournalEntries([]);
    setFiscalPeriods([]);
    setRawBankTransactions([]);
    setApInvoices([]);
    setArInvoices([]);
    setCashBalances({
      carrierOperating: 0,
      mgaTrust: 0,
      mgaOperating: 0,
      brokerTrust: 0,
      brokerOperating: 0
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('veridex:data-reset'));
      window.dispatchEvent(new Event('veridex:pos-events-reset'));
      window.dispatchEvent(new Event('veridex:pas-events-reset'));
    }
  };

  // The current role's own book — what Journal Entry / Bulk Upload History
  // etc. should actually list, as opposed to `journalEntries` (every
  // entity's entries, the full underlying dataset).
  const entityJournalEntries = useMemo(
    () => journalEntries.filter(belongsToActiveEntity),
    [journalEntries, belongsToActiveEntity]
  );

  // Same idea for AP/AR — a bill or invoice belongs to whichever entity
  // owes/is owed the money (its own `entity` field), not to every entity
  // that happens to be a counterparty on it. Without this, e.g. the MGA
  // would see the Broker's own "owed to MGA" bill sitting in its own AP
  // register, which is wrong — that bill lives in the Broker's book only.
  const entityApInvoices = useMemo(
    () => apInvoices.filter(belongsToActiveEntity),
    [apInvoices, belongsToActiveEntity]
  );
  const entityArInvoices = useMemo(
    () => arInvoices.filter(belongsToActiveEntity),
    [arInvoices, belongsToActiveEntity]
  );

  return (
    <FinanceContext.Provider value={{
      // Core state
      accounts,
      setAccounts,
      addAccount,
      updateAccount,
      toggleAccountStatus,
      deleteAccount,
      openingBalances,
      setOpeningBalance,
      getAccountBalance,
      getAccountLedger,

      // Journal entries
      journalEntries,
      entityJournalEntries,
      setJournalEntries,
      addJournalEntry,
      postJournalEntry,
      reverseJournalEntry,

      // Financial Reports
      levelAccounts,
      getTrialBalance,
      getBalanceSheet,
      getProfitAndLoss,

      // Domino's Pizza & Multi-Level Accounting Engine
      currentAccountingLevel,
      accountingLevel: currentAccountingLevel,
      franchiseSharePct,
      setFranchiseSharePct,
      dominosSharePct,
      recordPizzaSale,
      settlePizzaSale,

      // Fiscal periods & locks
      fiscalPeriods,
      toggleSoftClose,
      toggleHardLock,
      isPeriodLocked,

      // Bank & Cash
      cashBalances,
      setCashBalances,
      bankTransactions,
      matchBankTransaction,
      refreshBankTransactions,

      // AP & AR Invoices
      apInvoices,
      entityApInvoices,
      addApInvoice,
      payApInvoice,
      markApInvoicePaid,
      arInvoices,
      entityArInvoices,
      addArInvoice,
      collectArInvoice,
      markArInvoicePaid,

      // Insurance demo simulator
      policy,
      lifecycleStage,
      executeStageAction,
      resetAll,
      clearAllData,

      // Live MongoDB Atlas
      isDbConnected,
      dbInfo,
      syncWithBackend
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
