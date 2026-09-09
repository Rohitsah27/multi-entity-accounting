import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { highlightJson } from '../../utils/jsonHighlight';
import './pos-operations.css';

// Dedicated Customer Presets for Ayushi Retail Lifecycle Flow
const POS_PRESETS = {
  // === SCENARIO 1: FRANCHISE STORE (70% Store / 30% Hub) ===
  stage1_invoice: {
    scenario: 'franchise',
    eventType: 'CUSTOMER_INVOICE',
    label: 'Scenario 1 (Franchise) — 1st Inject: Franchise invoices Ayushi for $100 (JE 1 & JE 2)',
    orderId: 'INV-AYU-101',
    customerName: 'Ayushi',
    pizzaItem: 'Large Pepperoni & Cheese Farmhouse Pizza',
    saleAmount: 100.00,
    franchisePct: 70,
    storeEntity: 'ENT-FRN-01',
    paymentMethod: 'Awaiting Customer Payment',
    notes: 'First Inject: Franchise invoices Ayushi for $100 (JE 1) & Main Hub records $30 receivable (JE 2)'
  },
  stage2_payment: {
    scenario: 'franchise',
    eventType: 'CUSTOMER_PAYMENT_RECEIVED',
    label: 'Scenario 1 (Franchise) — 2nd Inject: Ayushi pays Franchise $100 (JE 3)',
    orderId: 'INV-AYU-101',
    customerName: 'Ayushi',
    pizzaItem: 'Large Pepperoni & Cheese Farmhouse Pizza',
    saleAmount: 100.00,
    franchisePct: 70,
    storeEntity: 'ENT-FRN-01',
    paymentMethod: 'UPI / Cash POS Payment',
    notes: 'Second Inject: Ayushi pays Franchise $100 (JE 3: Dr Cash / Bank – Franchise $100, Cr A/R – Ayushi $100)'
  },
  stage3_remittance: {
    scenario: 'franchise',
    eventType: 'FRANCHISE_ROYALTY_REMITTANCE',
    label: 'Scenario 1 (Franchise) — 3rd Inject: Franchise pays Main Hub $30 (JE 4 & JE 5)',
    orderId: 'INV-AYU-101',
    customerName: 'Domino\'s Main Company',
    pizzaItem: 'Corporate 30% Royalty Remittance',
    saleAmount: 30.00,
    franchisePct: 0,
    storeEntity: 'ENT-FRN-01',
    paymentMethod: 'Interbank ACH Wire',
    notes: 'Third Inject: Franchise pays Main Hub $30 (JE 4) & Main Hub receives payment (JE 5)'
  },

  // === SCENARIO 2: 100% OWN STORE MODEL (Main Hub -> Own Store -> Customer) ===
  own_stage1_invoice: {
    scenario: 'own_store',
    eventType: 'CUSTOMER_INVOICE',
    label: 'Scenario 2 (Own Store) — 1st Inject: Own Store invoices Ayushi for $100 (JE 1 & JE 2)',
    orderId: 'INV-AYU-OWN-101',
    customerName: 'Ayushi',
    pizzaItem: 'Large Pepperoni & Cheese Farmhouse Pizza',
    saleAmount: 100.00,
    franchisePct: 0,
    storeEntity: 'ENT-OWN-01',
    paymentMethod: 'Awaiting Customer Payment',
    notes: 'First Inject: Own Store invoices Ayushi for $100 (JE 1) & Main Hub records $100 receivable from Own Store (JE 2)'
  },
  own_stage2_payment: {
    scenario: 'own_store',
    eventType: 'CUSTOMER_PAYMENT_RECEIVED',
    label: 'Scenario 2 (Own Store) — 2nd Inject: Ayushi pays Own Store $100 (JE 3)',
    orderId: 'INV-AYU-OWN-101',
    customerName: 'Ayushi',
    pizzaItem: 'Large Pepperoni & Cheese Farmhouse Pizza',
    saleAmount: 100.00,
    franchisePct: 0,
    storeEntity: 'ENT-OWN-01',
    paymentMethod: 'UPI / Cash POS Payment',
    notes: 'Second Inject: Ayushi pays Own Store $100 (JE 3: Dr Cash / Bank – Own Store $100, Cr A/R – Ayushi $100)'
  },
  own_stage3_remittance: {
    scenario: 'own_store',
    eventType: 'FRANCHISE_ROYALTY_REMITTANCE',
    label: 'Scenario 2 (Own Store) — 3rd Inject: Own Store pays Main Hub $100 (JE 4 & JE 5)',
    orderId: 'INV-AYU-OWN-101',
    customerName: 'Domino\'s Main Company',
    pizzaItem: '100% Own Store Inter-Entity Remittance',
    saleAmount: 100.00,
    franchisePct: 0,
    storeEntity: 'ENT-OWN-01',
    paymentMethod: 'Corporate ACH Wire',
    notes: 'Third Inject: Own Store pays Main Hub $100 (JE 4) & Main Hub receives $100 (JE 5)'
  }
};

// Default to empty array — no dummy/mock transactions exist after database reset or initial state
const INITIAL_INJECTED_EVENTS = [];

export function PosOperationsPage() {
  const {
    addJournalEntry,
    recordPizzaSale,
    settlePizzaSale,
    getAccountBalance,
    franchiseSharePct,
    setFranchiseSharePct,
    dominosSharePct,
    apInvoices
  } = useFinance();

  const { currentUser, activeEntity } = useAuth();
  const location = useLocation();

  // Active Tab: 'injector' | 'events' | 'catalog' | 'simulator'
  const [activeTab, setActiveTab] = useState('injector');

  // Active preset — defaults to Stage 1: Share Invoice to Ayushi
  const [selectedPreset, setSelectedPreset] = useState('stage1_invoice');

  // Active business operating scenario: 'franchise' | 'own_store'
  const [selectedScenario, setSelectedScenario] = useState('franchise');

  // Form Fields
  const [eventType, setEventType] = useState(POS_PRESETS.stage1_invoice.eventType);
  const [orderId, setOrderId] = useState(POS_PRESETS.stage1_invoice.orderId);
  const [customerName, setCustomerName] = useState(POS_PRESETS.stage1_invoice.customerName);
  const [pizzaItem, setPizzaItem] = useState(POS_PRESETS.stage1_invoice.pizzaItem);
  const [saleAmount, setSaleAmount] = useState(POS_PRESETS.stage1_invoice.saleAmount);
  const [formFranchisePct, setFormFranchisePct] = useState(POS_PRESETS.stage1_invoice.franchisePct);
  const [paymentMethod, setPaymentMethod] = useState(POS_PRESETS.stage1_invoice.paymentMethod);
  const [storeEntity, setStoreEntity] = useState('ENT-FRN-01');
  const [hubEntity, setHubEntity] = useState('ENT-HUB-01');
  const [notes, setNotes] = useState(POS_PRESETS.stage1_invoice.notes);

  // Injected events stream — empty if reset or no orders injected yet
  const [injectedEvents, setInjectedEvents] = useState(() => {
    try {
      if (localStorage.getItem('v_data_reset') === '1') {
        return [];
      }
      const saved = localStorage.getItem('v_pos_injected_events');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  const [expandedEventId, setExpandedEventId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  // Sync injected events to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('v_pos_injected_events', JSON.stringify(injectedEvents));
    } catch {}
  }, [injectedEvents]);

  // Listen for database and local data reset events — instantly empties the audit stream and KPIs
  useEffect(() => {
    const handleReset = () => {
      setInjectedEvents([]);
      try {
        localStorage.setItem('v_pos_injected_events', '[]');
      } catch {}
    };

    window.addEventListener('veridex:pos-events-reset', handleReset);
    window.addEventListener('veridex:data-reset', handleReset);
    window.addEventListener('veridex:pas-events-reset', handleReset);

    return () => {
      window.removeEventListener('veridex:pos-events-reset', handleReset);
      window.removeEventListener('veridex:data-reset', handleReset);
      window.removeEventListener('veridex:pas-events-reset', handleReset);
    };
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Handle Preset Change
  const handleApplyPreset = (presetKey) => {
    setSelectedPreset(presetKey);
    const p = POS_PRESETS[presetKey];
    if (!p) return;
    setEventType(p.eventType);
    setOrderId(p.orderId);
    setCustomerName(p.customerName);
    setPizzaItem(p.pizzaItem);
    setSaleAmount(p.saleAmount);
    setFormFranchisePct(p.franchisePct);
    setPaymentMethod(p.paymentMethod);
    setNotes(p.notes);
    if (p.storeEntity) {
      setStoreEntity(p.storeEntity);
    }
    if (p.scenario) {
      setSelectedScenario(p.scenario);
    }
  };

  // Quick switch between Scenario 1 (Franchise 70/30) and Scenario 2 (100% Own Store)
  const handleSelectScenario = (scenario) => {
    setSelectedScenario(scenario);
    if (scenario === 'own_store') {
      setStoreEntity('ENT-OWN-01');
      handleApplyPreset('own_stage1_invoice');
      showToast('Switched to Scenario 2: 100% Own Store Model (Main Hub → Own Store → Customer)', 'info');
    } else {
      setStoreEntity('ENT-FRN-01');
      handleApplyPreset('stage1_invoice');
      showToast('Switched to Scenario 1: Franchise Store Model (70% Store / 30% Hub)', 'info');
    }
  };

  const handleStoreEntityChange = (entity) => {
    setStoreEntity(entity);
    if (entity === 'ENT-OWN-01') {
      setSelectedScenario('own_store');
      setFormFranchisePct(0);
      showToast("Selected Domino's Own Store #1 (100% Owned by Hub)", 'info');
    } else {
      setSelectedScenario('franchise');
      setFormFranchisePct(70);
      showToast("Selected Domino's Franchise Store #12 (70/30 Split)", 'info');
    }
  };

  const handleEventTypeChange = (newType) => {
    setEventType(newType);
    if (newType === 'FRANCHISE_ROYALTY_REMITTANCE') {
      if (storeEntity === 'ENT-OWN-01') {
        setSaleAmount(100);
        setCustomerName("Domino's Main Company");
        setPizzaItem('100% Own Store Inter-Entity Remittance');
        setNotes('Third Inject: Own Store pays Main Hub $100 (JE 4) & Main Hub receives $100 (JE 5)');
      } else {
        setSaleAmount(30);
        setCustomerName("Domino's Main Company");
        setPizzaItem('Corporate 30% Royalty Remittance');
        setNotes('Third Inject: Franchise pays Main Hub $30 (JE 4) & Main Hub receives payment (JE 5)');
      }
    } else if (newType === 'CUSTOMER_INVOICE') {
      setSaleAmount(100);
      setCustomerName('Ayushi');
      setPizzaItem('Large Pepperoni & Cheese Farmhouse Pizza');
      if (storeEntity === 'ENT-OWN-01') {
        setNotes('First Inject: Own Store invoices Ayushi for $100 (JE 1) & Main Hub records $100 receivable from Own Store (JE 2)');
      } else {
        setNotes('First Inject: Franchise invoices Ayushi for $100 (JE 1) & Main Hub records $30 receivable (JE 2)');
      }
    } else if (newType === 'CUSTOMER_PAYMENT_RECEIVED') {
      setSaleAmount(100);
      setCustomerName('Ayushi');
      setPizzaItem('Large Pepperoni & Cheese Farmhouse Pizza');
      if (storeEntity === 'ENT-OWN-01') {
        setNotes('Second Inject: Ayushi pays Own Store $100 (JE 3: Dr Cash $100, Cr A/R $100)');
      } else {
        setNotes('Second Inject: Ayushi pays Franchise $100 (JE 3: Dr Cash $100, Cr A/R $100)');
      }
    }
  };

  // Calculated shares
  const numericAmount = parseFloat(saleAmount) || 0;
  const isOwnStore = storeEntity === 'ENT-OWN-01';
  const numericPct = isOwnStore ? 0 : Math.max(0, Math.min(100, parseFloat(formFranchisePct) || 0));
  const franchiseShare = isOwnStore ? 0 : Math.round((numericAmount * (numericPct / 100)) * 100) / 100;
  const corporateShare = isOwnStore ? numericAmount : Math.round((numericAmount - franchiseShare) * 100) / 100;

  // Live JSON Payload
  const currentPayload = useMemo(() => {
    return {
      event_id: `EVT-POS-${Date.now().toString().slice(-6)}`,
      event_type: eventType,
      business_scenario: isOwnStore ? '100% Own Store (No Franchise)' : 'Franchise Store (70/30 Revenue Split)',
      order: {
        order_number: orderId,
        item_description: pizzaItem,
        currency: 'USD',
        gross_amount: numericAmount,
        tax_included: true
      },
      parties: {
        customer_name: customerName,
        store_id: storeEntity,
        store_name: isOwnStore ? "Domino's Own Store #1 (100% Owned by Hub)" : "Domino's Franchise Store #12",
        corporate_hub_id: hubEntity,
        corporate_hub_name: "Domino's Main Company"
      },
      distribution_breakdown: {
        store_share_pct: numericPct,
        corporate_share_pct: 100 - numericPct,
        store_retained_amount: franchiseShare,
        corporate_remittance_amount: corporateShare
      },
      settlement: {
        payment_method: paymentMethod,
        pos_terminal: isOwnStore ? 'POS-TERM-OWN-01' : 'POS-TERM-HYD-04',
        status: eventType === 'FRANCHISE_ROYALTY_REMITTANCE' ? 'SETTLED' : 'AWAITING_SETTLEMENT'
      },
      metadata: {
        source_system: 'DOMINOS_POS_SUITE',
        notes: notes,
        timestamp: new Date().toISOString()
      }
    };
  }, [eventType, orderId, pizzaItem, numericAmount, customerName, storeEntity, hubEntity, numericPct, franchiseShare, corporateShare, paymentMethod, notes, isOwnStore]);

  // Execute Event Injection into Double-Entry Accounting Engine
  const handleInjectEvent = () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const isOwn = storeEntity === 'ENT-OWN-01';
      const storeName = isOwn ? "Domino's Own Store #1" : "Domino's Franchise Store #12";
      const hubName = "Domino's Main Company";
      let postedJe = null;
      let hubJe = null;
      let eventStatus = 'POSTED';

      if (eventType === 'CUSTOMER_INVOICE') {
        if (isOwn) {
          // Scenario 2: JE 1 — Own Store invoices Ayushi for $100
          postedJe = addJournalEntry({
            date: today,
            reference: orderId,
            description: `JE 1 — Own Store invoices ${customerName} for $${numericAmount.toFixed(0)}`,
            entity: storeEntity,
            entityName: storeName,
            accountingLevel: 'pizza',
            status: 'Posted',
            lines: [
              { accountCode: '1100', accountName: `A/R – ${customerName}`, debit: numericAmount, credit: 0, description: `A/R – ${customerName}` },
              { accountCode: '4600', accountName: 'Pizza Sales Revenue – Main Hub', debit: 0, credit: numericAmount, description: 'Pizza Sales Revenue – Main Hub' }
            ]
          });

          // Scenario 2: JE 2 — Main Hub records receivable from Own Store ($100)
          hubJe = addJournalEntry({
            date: today,
            reference: orderId,
            description: `JE 2 — Main Hub records receivable from Own Store ($${numericAmount.toFixed(0)})`,
            entity: hubEntity,
            entityName: hubName,
            accountingLevel: 'pizza',
            status: 'Posted',
            lines: [
              { accountCode: '1180', accountName: 'A/R – Own Store', debit: numericAmount, credit: 0, description: 'A/R – Own Store' },
              { accountCode: '4600', accountName: 'Pizza Sales Revenue – Main Hub', debit: 0, credit: numericAmount, description: 'Pizza Sales Revenue – Main Hub' }
            ]
          });

          // Create Customer AR invoice in Subledger
          api.createInvoice({
            id: `INV-AR-${orderId}`,
            invoiceNumber: `INV-AR-${orderId}`,
            direction: 'AR',
            partnerName: customerName,
            amount: numericAmount,
            dueDate: today,
            entity: storeEntity,
            entityName: storeName,
            status: 'Sent / Unpaid',
            matchStatus: 'Awaiting Customer Payment',
            description: `Customer retail pizza invoice for ${pizzaItem}`
          }).catch(() => {});

          // Create Intercompany AP bill in Subledger
          api.createInvoice({
            id: `INV-AP-OWN-${orderId}`,
            invoiceNumber: `INV-AP-OWN-${orderId}`,
            direction: 'AP',
            partnerName: hubName,
            amount: numericAmount,
            dueDate: today,
            entity: storeEntity,
            entityName: storeName,
            status: 'Awaiting Settlement',
            matchStatus: 'Payable to Main Hub (100%)',
            description: `100% Intercompany Remittance payable to ${hubName}`
          }).catch(() => {});

          eventStatus = 'INVOICED';

        } else {
          // Scenario 1: JE 1 — Franchise invoices Ayushi for $100
          postedJe = addJournalEntry({
            date: today,
            reference: orderId,
            description: `JE 1 — Franchise invoices ${customerName} for $${numericAmount.toFixed(0)} (${pizzaItem})`,
            entity: storeEntity,
            entityName: storeName,
            accountingLevel: 'pizza',
            status: 'Posted',
            lines: [
              { accountCode: '1100', accountName: `A/R – ${customerName}`, debit: numericAmount, credit: 0, description: `A/R – ${customerName}` },
              { accountCode: '4500', accountName: 'Franchise Pizza Revenue', debit: 0, credit: franchiseShare, description: 'Franchise Pizza Revenue' },
              { accountCode: '2050', accountName: 'Payable to Main Hub', debit: 0, credit: corporateShare, description: 'Payable to Main Hub' }
            ]
          });

          // Scenario 1: JE 2 — Main Hub records receivable from Franchise ($30)
          hubJe = addJournalEntry({
            date: today,
            reference: orderId,
            description: `JE 2 — Main Hub records receivable from Franchise ($${corporateShare.toFixed(0)})`,
            entity: hubEntity,
            entityName: hubName,
            accountingLevel: 'pizza',
            status: 'Posted',
            lines: [
              { accountCode: '1180', accountName: 'A/R – Franchise', debit: corporateShare, credit: 0, description: 'A/R – Franchise' },
              { accountCode: '4600', accountName: 'Main Hub Pizza Revenue', debit: 0, credit: corporateShare, description: 'Main Hub Pizza Revenue' }
            ]
          });

          // Create Customer AR invoice in Subledger
          api.createInvoice({
            id: `INV-AR-${orderId}`,
            invoiceNumber: `INV-AR-${orderId}`,
            direction: 'AR',
            partnerName: customerName,
            amount: numericAmount,
            dueDate: today,
            entity: storeEntity,
            entityName: storeName,
            status: 'Sent / Unpaid',
            matchStatus: 'Awaiting Customer Payment',
            description: `Customer retail pizza invoice for ${pizzaItem}`
          }).catch(() => {});

          // Create Corporate AP bill in Subledger
          api.createInvoice({
            id: `INV-AP-FRN-${orderId}`,
            invoiceNumber: `INV-AP-FRN-${orderId}`,
            direction: 'AP',
            partnerName: hubName,
            amount: corporateShare,
            dueDate: today,
            entity: storeEntity,
            entityName: storeName,
            status: 'Awaiting Settlement',
            matchStatus: 'Payable to Main Hub',
            description: `30% Corporate Royalty Share payable to ${hubName}`
          }).catch(() => {});

          eventStatus = 'INVOICED';
        }

      } else if (eventType === 'CUSTOMER_PAYMENT_RECEIVED' || eventType === 'ORDER_PLACED_POS') {
        if (isOwn) {
          // Scenario 2: JE 3 — Ayushi pays Own Store ($100)
          postedJe = addJournalEntry({
            date: today,
            reference: orderId,
            description: `JE 3 — ${customerName} pays Own Store for ${orderId}`,
            entity: storeEntity,
            entityName: storeName,
            accountingLevel: 'pizza',
            status: 'Posted',
            lines: [
              { accountCode: '1001', accountName: 'Cash / Bank – Own Store', debit: numericAmount, credit: 0, description: `Cash collected from ${customerName} via ${paymentMethod}` },
              { accountCode: '1100', accountName: `A/R – ${customerName}`, debit: 0, credit: numericAmount, description: `Clear A/R – ${customerName}` }
            ]
          });
        } else {
          // Scenario 1: JE 3 — Ayushi pays Franchise ($100)
          postedJe = addJournalEntry({
            date: today,
            reference: orderId,
            description: `JE 3 — ${customerName} pays Franchise for ${orderId}`,
            entity: storeEntity,
            entityName: storeName,
            accountingLevel: 'pizza',
            status: 'Posted',
            lines: [
              { accountCode: '1001', accountName: 'Cash / Bank – Franchise', debit: numericAmount, credit: 0, description: `Cash collected from ${customerName} via ${paymentMethod}` },
              { accountCode: '1100', accountName: `A/R – ${customerName}`, debit: 0, credit: numericAmount, description: `Clear A/R – ${customerName}` }
            ]
          });
        }

        // Settle Customer AR Invoice to Paid in Full
        api.createInvoice({
          id: `INV-AR-${orderId}`,
          invoiceNumber: `INV-AR-${orderId}`,
          direction: 'AR',
          partnerName: customerName,
          amount: numericAmount,
          dueDate: today,
          entity: storeEntity,
          entityName: storeName,
          status: 'Paid in Full',
          matchStatus: 'Payment Cleared',
          description: `Customer Pizza Payment Cleared: ${pizzaItem}`
        }).catch(() => {});

        eventStatus = 'AYUSHI PAID (JE 3)';

      } else if (eventType === 'FRANCHISE_ROYALTY_REMITTANCE') {
        if (isOwn) {
          // Scenario 2: JE 4 — Own Store pays Main Hub ($100)
          postedJe = addJournalEntry({
            date: today,
            reference: orderId,
            description: `JE 4 — Own Store pays Main Hub for ${orderId}`,
            entity: storeEntity,
            entityName: storeName,
            accountingLevel: 'pizza',
            status: 'Posted',
            lines: [
              { accountCode: '2050', accountName: 'Payable to Main Hub', debit: numericAmount, credit: 0, description: 'Payable to Main Hub' },
              { accountCode: '1001', accountName: 'Cash / Bank – Own Store', debit: 0, credit: numericAmount, description: 'Cash / Bank – Own Store' }
            ]
          });

          // Scenario 2: JE 5 — Main Hub receives $100 from Own Store
          hubJe = addJournalEntry({
            date: today,
            reference: orderId,
            description: `JE 5 — Main Hub receives $100 from Own Store`,
            entity: hubEntity,
            entityName: hubName,
            accountingLevel: 'pizza',
            status: 'Posted',
            lines: [
              { accountCode: '1001', accountName: 'Cash / Bank – Main Hub', debit: numericAmount, credit: 0, description: 'Cash / Bank – Main Hub' },
              { accountCode: '1180', accountName: 'A/R – Own Store', debit: 0, credit: numericAmount, description: 'A/R – Own Store' }
            ]
          });

          // Settle Intercompany AP bill in Subledger
          api.createInvoice({
            id: `INV-AP-OWN-${orderId}`,
            invoiceNumber: `INV-AP-OWN-${orderId}`,
            direction: 'AP',
            partnerName: hubName,
            amount: numericAmount,
            dueDate: today,
            entity: storeEntity,
            entityName: storeName,
            status: 'Paid & Cleared',
            matchStatus: 'Settled to Main Hub (100%)',
            description: `100% Intercompany Remittance paid to ${hubName}`
          }).catch(() => {});

        } else {
          // Scenario 1: JE 4 — Franchise pays Main Hub ($30)
          // Condition: Franchise retains $70 (70%) and pays Main Hub $30 (30% corporate royalty)
          const franchiseRemittanceAmount = (numericAmount === 30 || numericAmount !== 100)
            ? numericAmount
            : (corporateShare > 0 ? corporateShare : 30);

          postedJe = addJournalEntry({
            date: today,
            reference: orderId,
            description: `JE 4 — Franchise pays Main Hub for ${orderId}`,
            entity: storeEntity,
            entityName: storeName,
            accountingLevel: 'pizza',
            status: 'Posted',
            lines: [
              { accountCode: '2050', accountName: 'Payable to Main Hub', debit: franchiseRemittanceAmount, credit: 0, description: `JE 4 — Franchise pays Main Hub for ${orderId}` },
              { accountCode: '1001', accountName: 'Cash / Bank – Franchise', debit: 0, credit: franchiseRemittanceAmount, description: `JE 4 — Franchise pays Main Hub for ${orderId}` }
            ]
          });

          // Scenario 1: JE 5 — Main Hub receives payment from Franchise ($30)
          hubJe = addJournalEntry({
            date: today,
            reference: orderId,
            description: `JE 5 — Main Hub receives payment from Franchise`,
            entity: hubEntity,
            entityName: hubName,
            accountingLevel: 'pizza',
            status: 'Posted',
            lines: [
              { accountCode: '1001', accountName: 'Cash / Bank – Main Hub', debit: franchiseRemittanceAmount, credit: 0, description: 'Cash / Bank – Main Hub' },
              { accountCode: '1180', accountName: 'A/R – Franchise', debit: 0, credit: franchiseRemittanceAmount, description: 'A/R – Franchise' }
            ]
          });

          // Settle Corporate AP bill in Subledger ($30)
          api.createInvoice({
            id: `INV-AP-FRN-${orderId}`,
            invoiceNumber: `INV-AP-FRN-${orderId}`,
            direction: 'AP',
            partnerName: hubName,
            amount: franchiseRemittanceAmount,
            dueDate: today,
            entity: storeEntity,
            entityName: storeName,
            status: 'Paid & Cleared',
            matchStatus: 'Settled to Main Hub',
            description: `Corporate Royalty Share paid to ${hubName}`
          }).catch(() => {});
        }

        eventStatus = isOwn ? 'REMITTED (JE 4 & JE 5 - 100%)' : 'REMITTED (JE 4 & JE 5 - 30%)';
      }

      // Add to audit event log
      const newEvent = {
        id: currentPayload.event_id,
        eventType: eventType,
        orderId: orderId,
        customer: customerName,
        pizzaItem: pizzaItem,
        totalAmount: numericAmount,
        franchiseShare: franchiseShare,
        corporateShare: corporateShare,
        franchisePct: numericPct,
        paymentMethod: paymentMethod,
        timestamp: new Date().toISOString(),
        status: eventStatus,
        entity: storeEntity,
        entityName: storeName,
        counterparty: hubName,
        jeNumber: postedJe ? (postedJe.id || `JE-PZ-${Date.now().toString().slice(-4)}`) : 'JE-PZ-999',
        hubJeNumber: hubJe ? (hubJe.id || `JE-HUB-${Date.now().toString().slice(-4)}`) : null,
        jeLines: postedJe?.lines || (isOwn ? [
          { code: '1100', name: `A/R – ${customerName}`, debit: numericAmount, credit: 0 },
          { code: '4600', name: 'Pizza Sales Revenue – Main Hub', debit: 0, credit: numericAmount }
        ] : [
          { code: '1100', name: `A/R – ${customerName}`, debit: numericAmount, credit: 0 },
          { code: '4500', name: 'Franchise Pizza Revenue', debit: 0, credit: franchiseShare },
          { code: '2050', name: 'Payable to Main Hub', debit: 0, credit: corporateShare }
        ]),
        hubJeLines: hubJe?.lines || (eventType === 'CUSTOMER_INVOICE' ? [
          { code: '1180', name: isOwn ? 'A/R – Own Store' : 'A/R – Franchise', debit: isOwn ? numericAmount : corporateShare, credit: 0 },
          { code: '4600', name: isOwn ? 'Pizza Sales Revenue – Main Hub' : 'Main Hub Pizza Revenue', debit: 0, credit: isOwn ? numericAmount : corporateShare }
        ] : null)
      };

      setInjectedEvents(prev => [newEvent, ...prev]);
      try {
        localStorage.removeItem('v_data_reset');
      } catch {}

      if (eventType === 'CUSTOMER_INVOICE') {
        if (isOwn) {
          showToast(`JE 1 & JE 2 posted: Own Store invoices ${customerName} $${numericAmount.toFixed(0)} (A/R Dr $${numericAmount.toFixed(0)}, Pizza Sales Revenue – Main Hub Cr $${numericAmount.toFixed(0)}). Main Hub records A/R – Own Store Dr $${numericAmount.toFixed(0)}, Pizza Sales Revenue Cr $${numericAmount.toFixed(0)}.`);
        } else {
          showToast(`JE 1 & JE 2 posted: Invoiced ${customerName} $${numericAmount.toFixed(0)} (Store Revenue $${franchiseShare.toFixed(0)}, Payable to Hub $${corporateShare.toFixed(0)}). Main Hub recorded $${corporateShare.toFixed(0)} A/R.`);
        }
      } else if (eventType === 'CUSTOMER_PAYMENT_RECEIVED' || eventType === 'ORDER_PLACED_POS') {
        if (isOwn) {
          showToast(`JE 3 posted: ${customerName} pays Own Store $${numericAmount.toFixed(0)}! Cash / Bank – Own Store Dr $${numericAmount.toFixed(0)}, A/R – ${customerName} Cr $${numericAmount.toFixed(0)}.`);
        } else {
          showToast(`JE 3 posted: ${customerName} pays Franchise $${numericAmount.toFixed(0)}! Cash / Bank – Franchise Dr $${numericAmount.toFixed(0)}, A/R – ${customerName} Cr $${numericAmount.toFixed(0)}.`);
        }
      } else if (eventType === 'FRANCHISE_ROYALTY_REMITTANCE') {
        if (isOwn) {
          showToast(`JE 4 & JE 5 posted: Own Store pays Main Hub $${numericAmount.toFixed(0)} (JE 4: Dr Payable $${numericAmount.toFixed(0)}, Cr Cash $${numericAmount.toFixed(0)}). Main Hub receives $${numericAmount.toFixed(0)} cash (JE 5: Dr Cash $${numericAmount.toFixed(0)}, Cr A/R – Own Store $${numericAmount.toFixed(0)})!`);
        } else {
          const remAmt = (numericAmount === 30 || numericAmount !== 100) ? numericAmount : (corporateShare > 0 ? corporateShare : 30);
          showToast(`JE 4 & JE 5 posted: Franchise remitted $${remAmt.toFixed(0)} to Main Hub (JE 4: Dr Payable $${remAmt.toFixed(0)}, Cr Cash $${remAmt.toFixed(0)}). Main Hub received $${remAmt.toFixed(0)} cash!`);
        }
      } else {
        showToast(`Event [${eventType}] successfully injected!`);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(currentPayload, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    showToast('JSON Payload copied to clipboard!');
  };

  return (
    <div className="pos-page">
      {toastMessage && (
        <div className={`veridex-toast veridex-toast-${toastMessage.type === 'error' ? 'error' : 'success'}`}>
          <span>{toastMessage.type === 'error' ? '✕' : '✓'}</span>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="pos-badge-icon">🍕</div>
            <div>
              <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Point of Sale (POS) – Order &amp; Event Injection Hub
                <span className="pos-mode-pill">⚡ Rules Engine Live</span>
              </div>
              <div className="page-subtitle">
                Inject retail orders, franchise revenue splits, store settlements, and commissary supplies directly into Domino's Double-Entry Accounting Engine
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="pos-tab-nav">
        <button
          type="button"
          className={`pos-tab-btn ${activeTab === 'injector' ? 'active' : ''}`}
          onClick={() => setActiveTab('injector')}
        >
          <span>⚡</span> POS Event Data Injector
        </button>

        <button
          type="button"
          className={`pos-tab-btn ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <span>📋</span> Injected Orders Stream &amp; Audit Log
          <span className="pos-tab-badge">{injectedEvents.length}</span>
        </button>

        <button
          type="button"
          className={`pos-tab-btn ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulator')}
        >
          <span>🔄</span> 3-Tier Distribution Pipeline Simulator
        </button>
      </div>

      {/* TAB 1: POS EVENT DATA INJECTOR */}
      {activeTab === 'injector' && (
        <div>
          {/* Scenario / Operating Model Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '10px',
            padding: '12px 18px',
            marginBottom: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                🎯 Select Operating Scenario:
              </span>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                ({selectedScenario === 'own_store' ? '100% Owned by Main Hub — Entire $100 belongs to Main Hub' : 'Franchise 70/30 Revenue Split'})
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleSelectScenario('own_store')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '7px',
                  fontSize: '12.5px',
                  fontWeight: selectedScenario === 'own_store' ? 700 : 600,
                  cursor: 'pointer',
                  background: selectedScenario === 'own_store' ? '#0284c7' : '#f8fafc',
                  color: selectedScenario === 'own_store' ? '#ffffff' : '#334155',
                  border: selectedScenario === 'own_store' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                  boxShadow: selectedScenario === 'own_store' ? '0 2px 8px rgba(2, 132, 199, 0.28)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                🏢 Scenario 2: 100% Own Store (Main Hub → Own Store → Customer)
              </button>

              <button
                type="button"
                onClick={() => handleSelectScenario('franchise')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '7px',
                  fontSize: '12.5px',
                  fontWeight: selectedScenario === 'franchise' ? 700 : 600,
                  cursor: 'pointer',
                  background: selectedScenario === 'franchise' ? '#ea580c' : '#f8fafc',
                  color: selectedScenario === 'franchise' ? '#ffffff' : '#334155',
                  border: selectedScenario === 'franchise' ? '1px solid #ea580c' : '1px solid #cbd5e1',
                  boxShadow: selectedScenario === 'franchise' ? '0 2px 8px rgba(234, 88, 12, 0.28)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                🏪 Scenario 1: Franchise Store (70% Franchise / 30% Main Hub)
              </button>
            </div>
          </div>

          {/* Preset Selector Banner */}
          <div className="pos-preset-bar">
            <div className="pos-preset-left">
              <span className="pos-preset-label">⚡ Load POS Event Preset:</span>
              <select
                className="pos-preset-select"
                value={selectedPreset}
                onChange={(e) => handleApplyPreset(e.target.value)}
              >
                <optgroup label="🏢 Scenario 2: 100% Own Store (No Franchise Involved)">
                  <option value="own_stage1_invoice">{POS_PRESETS.own_stage1_invoice.label}</option>
                  <option value="own_stage2_payment">{POS_PRESETS.own_stage2_payment.label}</option>
                  <option value="own_stage3_remittance">{POS_PRESETS.own_stage3_remittance.label}</option>
                </optgroup>
                <optgroup label="🏪 Scenario 1: Franchise Model (70/30 Split)">
                  <option value="stage1_invoice">{POS_PRESETS.stage1_invoice.label}</option>
                  <option value="stage2_payment">{POS_PRESETS.stage2_payment.label}</option>
                  <option value="stage3_remittance">{POS_PRESETS.stage3_remittance.label}</option>
                </optgroup>
              </select>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '7px 14px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => handleApplyPreset(selectedPreset)}
            >
              Reset to Preset Values
            </button>
          </div>

          {/* 2-Column Injector Layout */}
          <div className="pos-injector-layout">
            {/* Left Column: Form Controls */}
            <div className="pos-card">
              <div className="pos-card-title">
                <span>Configure &amp; Inject Custom POS Event</span>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>Double-Entry Rules Engine</span>
              </div>

              <div className="pos-form-grid">
                <div className="pos-form-group">
                  <label className="pos-label">Business Event Type</label>
                  <select
                    className="pos-select"
                    value={eventType}
                    onChange={(e) => handleEventTypeChange(e.target.value)}
                  >
                    {isOwnStore ? (
                      <>
                        <option value="CUSTOMER_INVOICE">First Inject: JE 1 &amp; JE 2 (Own Store invoices Ayushi $100)</option>
                        <option value="CUSTOMER_PAYMENT_RECEIVED">Second Inject: JE 3 (Ayushi pays Own Store $100)</option>
                        <option value="FRANCHISE_ROYALTY_REMITTANCE">Third Inject: JE 4 &amp; JE 5 (Own Store pays Main Hub $100)</option>
                      </>
                    ) : (
                      <>
                        <option value="CUSTOMER_INVOICE">First Inject: JE 1 &amp; JE 2 (Franchise invoices Ayushi $100)</option>
                        <option value="CUSTOMER_PAYMENT_RECEIVED">Second Inject: JE 3 (Ayushi pays Franchise $100)</option>
                        <option value="FRANCHISE_ROYALTY_REMITTANCE">Third Inject: JE 4 &amp; JE 5 (Franchise pays Main Hub $30)</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="pos-form-group">
                  <label className="pos-label">Order / Transaction ID</label>
                  <input
                    type="text"
                    className="pos-input"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>

                <div className="pos-form-group">
                  <label className="pos-label">Customer / Counterparty</label>
                  <input
                    type="text"
                    className="pos-input"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div className="pos-form-group">
                  <label className="pos-label">Gross Order Amount ($)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="pos-input"
                    value={saleAmount}
                    onChange={(e) => setSaleAmount(e.target.value)}
                  />
                </div>

                <div className="pos-form-group full-width">
                  <label className="pos-label">Pizza Item / Menu Description</label>
                  <input
                    type="text"
                    className="pos-input"
                    value={pizzaItem}
                    onChange={(e) => setPizzaItem(e.target.value)}
                  />
                </div>

                <div className="pos-form-group">
                  <label className="pos-label">{isOwnStore ? 'Store Entity (100% Owned)' : 'Franchise Store Entity'}</label>
                  <select
                    className="pos-select"
                    value={storeEntity}
                    onChange={(e) => handleStoreEntityChange(e.target.value)}
                  >
                    <option value="ENT-OWN-01">Domino's Own Store #1 (ENT-OWN-01) — 100% Owned by Hub</option>
                    <option value="ENT-FRN-01">Domino's Franchise Store #12 (ENT-FRN-01) — 70/30 Split</option>
                  </select>
                </div>

                <div className="pos-form-group">
                  <label className="pos-label">Corporate Entity</label>
                  <select
                    className="pos-select"
                    value={hubEntity}
                    onChange={(e) => setHubEntity(e.target.value)}
                  >
                    <option value="ENT-HUB-01">Domino's Main Company (ENT-HUB-01)</option>
                  </select>
                </div>

                <div className="pos-form-group">
                  <label className="pos-label">Payment Method</label>
                  <select
                    className="pos-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="UPI / GPay POS">UPI / GPay QR Scan</option>
                    <option value="POS Card Swipe">POS Debit / Credit Card</option>
                    <option value="POS Cash">Cash at Register</option>
                    <option value="Interbank ACH Wire">ACH / NEFT Bank Remittance</option>
                    <option value="Corporate NEFT">Corporate Net Banking</option>
                  </select>
                </div>

                <div className="pos-form-group">
                  <label className="pos-label">
                    {isOwnStore ? 'Store Retention % (Own Store = 0%)' : 'Franchise Share % (0–100%)'}
                  </label>
                  {isOwnStore ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '12.5px', color: '#0369a1', fontWeight: 600 }}>
                      <span>🏢 0% Retained (100% Owned by Main Hub — Entire ${numericAmount.toFixed(0)} belongs to Main Hub)</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formFranchisePct}
                        onChange={(e) => setFormFranchisePct(e.target.value)}
                        style={{ flex: 1, accentColor: '#f97316' }}
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="pos-input"
                        style={{ width: '70px', padding: '6px 8px', textAlign: 'center' }}
                        value={formFranchisePct}
                        onChange={(e) => setFormFranchisePct(e.target.value)}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#f97316' }}>%</span>
                    </div>
                  )}
                </div>

                <div className="pos-form-group full-width">
                  <label className="pos-label">Internal POS Notes</label>
                  <input
                    type="text"
                    className="pos-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Action Button (Docked to bottom for equal card heights) */}
              <div style={{ marginTop: 'auto', paddingTop: '14px' }}>
                <button
                  type="button"
                  className="pos-inject-btn"
                  onClick={handleInjectEvent}
                >
                  <span>⚡</span> Inject POS Event into Rules Engine
                </button>

                <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.4, textAlign: 'center' }}>
                  Injecting triggers balanced debit/credit posting across Store &amp; Hub general ledgers with instant AP/AR synchronization.
                </div>
              </div>
            </div>

            {/* Right Column: Live JSON Payload */}
            <div className="pos-card">
              <div className="pos-card-title">
                <span>Real-Time Event JSON Payload</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 10px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}
                  onClick={handleCopyJson}
                >
                  {isCopied ? '✓ Copied' : 'Copy JSON'}
                </button>
              </div>

              <div className="pos-code-wrapper">
                <div className="pos-code-header">
                  <span>payload.json</span>
                  <span style={{ color: '#10b981' }}>VALID SCHEMA</span>
                </div>
                <pre
                  className="pos-code-block"
                  dangerouslySetInnerHTML={{ __html: highlightJson(currentPayload) }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INJECTED ORDERS STREAM & AUDIT LOG */}
      {activeTab === 'events' && (
        <div className="pos-card">
          <div className="pos-card-title">
            <span>Injected POS Event Stream &amp; GL Audit Log</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Showing {injectedEvents.length} events
              </span>
              {injectedEvents.length > 0 && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '3px 10px', color: '#ef4444', borderColor: '#fca5a5' }}
                  onClick={() => {
                    if (window.confirm('Clear all injected POS orders from the audit log?')) {
                      setInjectedEvents([]);
                      try { localStorage.setItem('v_pos_injected_events', '[]'); } catch {}
                      showToast('Injected POS orders stream cleared.');
                    }
                  }}
                >
                  🗑️ Clear POS Log
                </button>
              )}
            </div>
          </div>

          <div className="pos-table-wrap">
            <table className="pos-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Type</th>
                  <th>Order Ref</th>
                  <th>Customer</th>
                  <th>Menu Item</th>
                  <th>Gross ($)</th>
                  <th>Store Share</th>
                  <th>Corporate Share</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {injectedEvents.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>🍃</div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                        No POS Orders Injected Yet
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '6px', color: '#64748b', maxWidth: '440px', margin: '6px auto 16px auto' }}>
                        All order and transaction data is clean. Go to the <strong>"POS Event Data Injector"</strong> tab and click <strong>"Inject POS Event into Rules Engine"</strong> to record live retail sales.
                      </div>
                      <button
                        type="button"
                        className="pos-btn-primary"
                        style={{ padding: '8px 18px', fontSize: '12px', margin: '0 auto', display: 'inline-flex' }}
                        onClick={() => setActiveTab('injector')}
                      >
                        ⚡ Open POS Event Injector
                      </button>
                    </td>
                  </tr>
                ) : (
                  injectedEvents.map((evt) => {
                  const isExpanded = expandedEventId === evt.id;
                  return (
                    <React.Fragment key={evt.id}>
                      <tr>
                        <td style={{ fontFamily: 'monospace', color: '#ea580c', fontWeight: 700 }}>{evt.id}</td>
                        <td>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                            {evt.eventType}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', color: '#475569' }}>{evt.orderId}</td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{evt.customer}</td>
                        <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#334155' }}>
                          {evt.pizzaItem}
                        </td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>${evt.totalAmount.toLocaleString()}</td>
                        <td style={{ color: '#16a34a', fontWeight: 600 }}>${evt.franchiseShare.toLocaleString()}</td>
                        <td style={{ color: '#0284c7', fontWeight: 600 }}>${evt.corporateShare.toLocaleString()}</td>
                        <td>
                          <span className={`pos-badge ${evt.status.toLowerCase()}`}>
                            {evt.status === 'POSTED' ? '✓ POSTED' : evt.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                            onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                          >
                            {isExpanded ? 'Hide GL' : 'Inspect GL'}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan="10" style={{ background: '#0b0e14', padding: '16px 20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f97316' }}>
                                Double-Entry GL Records Posted for {evt.orderId}:
                              </span>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                Timestamp: {new Date(evt.timestamp).toLocaleString()}
                              </span>
                            </div>

                            {/* Store Entry (JE 1, JE 3, or JE 4) */}
                            <div style={{ marginBottom: evt.hubJeLines ? '12px' : '0' }}>
                              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                                {evt.eventType === 'CUSTOMER_INVOICE' && `JE 1 — Franchise invoices ${evt.customer} for $${evt.totalAmount} (${evt.jeNumber}):`}
                                {evt.eventType === 'CUSTOMER_PAYMENT_RECEIVED' && `JE 3 — ${evt.customer} pays Franchise ($${evt.totalAmount}) (${evt.jeNumber}):`}
                                {evt.eventType === 'FRANCHISE_ROYALTY_REMITTANCE' && `JE 4 — Franchise pays Main Hub ($${evt.totalAmount}) (${evt.jeNumber}):`}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                                {evt.jeLines.map((line, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      background: '#181d24',
                                      padding: '8px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid rgba(255, 255, 255, 0.06)',
                                      fontSize: '11.5px'
                                    }}
                                  >
                                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                                      Acct {line.code || line.accountCode} - {line.name || line.accountName || line.desc}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                      <span style={{ color: '#10b981' }}>Debit: ${line.debit.toLocaleString()}</span>
                                      <span style={{ color: '#ef4444' }}>Credit: ${line.credit.toLocaleString()}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Hub Entry (JE 2 or JE 5) */}
                            {evt.hubJeLines && (
                              <div style={{ marginTop: '10px' }}>
                                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                                  {evt.eventType === 'CUSTOMER_INVOICE' && `JE 2 — Main Hub records receivable from Franchise ($${evt.corporateShare}) (${evt.hubJeNumber || 'JE-HUB'}):`}
                                  {evt.eventType === 'FRANCHISE_ROYALTY_REMITTANCE' && `JE 5 — Main Hub receives payment ($${evt.totalAmount}) (${evt.hubJeNumber || 'JE-HUB'}):`}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                                  {evt.hubJeLines.map((line, idx) => (
                                    <div
                                      key={idx}
                                      style={{
                                        background: '#181d24',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(56, 189, 248, 0.2)',
                                        fontSize: '11.5px'
                                      }}
                                    >
                                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                                        Acct {line.code || line.accountCode} - {line.name || line.accountName || line.desc}
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                        <span style={{ color: '#10b981' }}>Debit: ${line.debit.toLocaleString()}</span>
                                        <span style={{ color: '#ef4444' }}>Credit: ${line.credit.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: 3-TIER DISTRIBUTION SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="pos-card">
          <div className="pos-card-title">
            <span>Domino's Pizza Distribution Lifecycle Simulator</span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              {selectedScenario === 'own_store'
                ? 'Scenario 2: Main Hub → Own Store → Customer (100% Owned by Main Hub)'
                : 'Scenario 1: Customer Ayushi → Franchise Store #12 → Domino\'s Main Company (70/30 Split)'}
            </span>
          </div>

          {/* Scenario toggle for Simulator */}
          <div style={{ display: 'flex', gap: '10px', margin: '12px 0 20px 0', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Operating Scenario:</span>
            <button
              type="button"
              onClick={() => handleSelectScenario('own_store')}
              style={{
                padding: '7px 16px',
                borderRadius: '7px',
                fontSize: '12.5px',
                fontWeight: selectedScenario === 'own_store' ? 700 : 600,
                cursor: 'pointer',
                background: selectedScenario === 'own_store' ? '#0284c7' : '#f8fafc',
                color: selectedScenario === 'own_store' ? '#ffffff' : '#334155',
                border: selectedScenario === 'own_store' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                boxShadow: selectedScenario === 'own_store' ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              🏢 Scenario 2: 100% Own Store (Main Hub → Own Store → Customer)
            </button>
            <button
              type="button"
              onClick={() => handleSelectScenario('franchise')}
              style={{
                padding: '7px 16px',
                borderRadius: '7px',
                fontSize: '12.5px',
                fontWeight: selectedScenario === 'franchise' ? 700 : 600,
                cursor: 'pointer',
                background: selectedScenario === 'franchise' ? '#ea580c' : '#f8fafc',
                color: selectedScenario === 'franchise' ? '#ffffff' : '#334155',
                border: selectedScenario === 'franchise' ? '1px solid #ea580c' : '1px solid #cbd5e1',
                boxShadow: selectedScenario === 'franchise' ? '0 2px 6px rgba(234, 88, 12, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              🏪 Scenario 1: Franchise Store (70/30 Split)
            </button>
          </div>

          <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 24px 0' }}>
            {selectedScenario === 'own_store'
              ? 'The Own Store is 100% owned by Main Hub, so the entire $100 belongs to Main Hub. Visualized through balanced double-entry JEs 1 to 5.'
              : 'Visual demonstration of the complete customer retail payment, franchise revenue retention (70%), and corporate royalty remittance (30%).'}
          </p>

          {selectedScenario === 'own_store' ? (
            /* Scenario 2 Pipeline */
            <div className="pos-flow-pipeline">
              <div className="pos-flow-step active" style={{ borderColor: '#bae6fd', background: '#f0f9ff' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>👤</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>1. Retail Customer</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Customer Ayushi pays $100.00 for pizza</div>
                <div style={{ marginTop: '12px', color: '#16a34a', fontWeight: 700, fontSize: '13px' }}>- $100.00 Outflow</div>
              </div>

              <div className="pos-flow-arrow" style={{ color: '#0284c7' }}>➔</div>

              <div className="pos-flow-step active" style={{ borderColor: '#bae6fd', background: '#f0f9ff' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏪</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>2. Domino's Own Store #1</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>100% Owned by Main Hub. Collects $100, remits $100 to Hub</div>
                <div style={{ marginTop: '12px', color: '#64748b', fontWeight: 700, fontSize: '13px' }}>$0 Net Retained (100% to Hub)</div>
              </div>

              <div className="pos-flow-arrow" style={{ color: '#0284c7' }}>➔</div>

              <div className="pos-flow-step active" style={{ borderColor: '#bae6fd', background: '#f0f9ff' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏢</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>3. Domino's Main Hub</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>100% Owner. Receives full $100 remittance</div>
                <div style={{ marginTop: '12px', color: '#0284c7', fontWeight: 700, fontSize: '13px' }}>+ $100.00 Pizza Sales Revenue</div>
              </div>
            </div>
          ) : (
            /* Scenario 1 Pipeline */
            <div className="pos-flow-pipeline">
              <div className="pos-flow-step active">
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>👤</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>1. Retail Customer</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Customer Ayushi pays $100.00 at POS counter</div>
                <div style={{ marginTop: '12px', color: '#16a34a', fontWeight: 700, fontSize: '13px' }}>- $100.00 Outflow</div>
              </div>

              <div className="pos-flow-arrow">➔</div>

              <div className="pos-flow-step active">
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🍕</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>2. Franchise Store #12</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Collects $100 POS cash, retains 70% revenue ($70.00)</div>
                <div style={{ marginTop: '12px', color: '#ea580c', fontWeight: 700, fontSize: '13px' }}>+ $70.00 Net Income</div>
              </div>

              <div className="pos-flow-arrow">➔</div>

              <div className="pos-flow-step active">
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏢</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>3. Domino's Main Company</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Receives 30% remittance ($30.00) via ACH</div>
                <div style={{ marginTop: '12px', color: '#0284c7', fontWeight: 700, fontSize: '13px' }}>+ $30.00 Royalty Revenue</div>
              </div>
            </div>
          )}

          {/* Quick Preset Injection Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
            {selectedScenario === 'own_store' ? (
              <>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '10px 22px', fontSize: '13px', background: '#0284c7', borderColor: '#38bdf8' }}
                  onClick={() => {
                    handleApplyPreset('own_stage1_invoice');
                    setActiveTab('injector');
                  }}
                >
                  1. First Inject: Own Store Invoices Ayushi (JE 1 &amp; JE 2)
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '10px 22px', fontSize: '13px' }}
                  onClick={() => {
                    handleApplyPreset('own_stage2_payment');
                    setActiveTab('injector');
                  }}
                >
                  2. Second Inject: Ayushi Pays Own Store (JE 3)
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '10px 22px', fontSize: '13px', borderColor: '#38bdf8', color: '#38bdf8' }}
                  onClick={() => {
                    handleApplyPreset('own_stage3_remittance');
                    setActiveTab('injector');
                  }}
                >
                  3. Third Inject: Own Store Pays Main Hub (JE 4 &amp; JE 5)
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '10px 22px', fontSize: '13px' }}
                  onClick={() => {
                    handleApplyPreset('stage1_invoice');
                    setActiveTab('injector');
                  }}
                >
                  1. First Inject: Franchise Invoices Ayushi (JE 1 &amp; JE 2)
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '10px 22px', fontSize: '13px' }}
                  onClick={() => {
                    handleApplyPreset('stage2_payment');
                    setActiveTab('injector');
                  }}
                >
                  2. Second Inject: Ayushi Pays Franchise (JE 3)
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '10px 22px', fontSize: '13px', borderColor: '#38bdf8', color: '#38bdf8' }}
                  onClick={() => {
                    handleApplyPreset('stage3_remittance');
                    setActiveTab('injector');
                  }}
                >
                  3. Third Inject: Franchise Pays Main Hub (JE 4 &amp; JE 5)
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default PosOperationsPage;
