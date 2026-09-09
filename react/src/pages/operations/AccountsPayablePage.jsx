import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import './accounts-payable.css';

const AP_TABS = ['ap-invoices', 'ap-ach', 'ap-echecks', 'ap-aging'];
const hashToTab = (hash) => {
  const id = hash.replace('#', '');
  return AP_TABS.includes(id) ? id : 'ap-invoices';
};

export function AccountsPayablePage() {
  const { addApInvoice, payApInvoice, entityApInvoices } = useFinance();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation & View State — derived from the URL hash so sidebar sub-links
  // like /accounts-payable#ap-ach switch this tab automatically.
  const activeTab = hashToTab(location.hash); // 'ap-invoices' | 'ap-ach' | 'ap-echecks' | 'ap-aging'

  const selectTab = (tab) => {
    navigate(tab === 'ap-invoices' ? '/accounts-payable' : `/accounts-payable#${tab}`, { replace: true });
  };
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [vendorFilter, setVendorFilter] = useState('All Vendors');
  const [amountFilter, setAmountFilter] = useState('All Amounts');
  const [fromDate, setFromDate] = useState('2026-05-01');
  const [toDate, setToDate] = useState('2026-05-31');
  const [toastMessage, setToastMessage] = useState(null);

  // Core AP Invoices State
  const [payables, setPayables] = useState(() => {
    try {
      if (localStorage.getItem('v_data_reset') === '1') return [];
      const saved = localStorage.getItem('v_ap_invoices_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    const handleReset = () => {
      setPayables([]);
      try { localStorage.removeItem('v_ap_invoices_data'); } catch {}
    };
    window.addEventListener('veridex:data-reset', handleReset);
    return () => window.removeEventListener('veridex:data-reset', handleReset);
  }, []);

  // Merge in inter-entity settlement bills raised dynamically elsewhere (e.g.
  // the PAS Event Injector's Stage 2 PAYMENT_RECEIVED, which raises a real
  // "Broker owes MGA" bill) on top of the locally-managed rows. Only bills
  // carrying a counterpartyEntity are merged — that flags them as belonging
  // to this dynamic settlement flow, so pre-existing static demo rows in
  // FinanceContext are left alone. Derived at render time (not synced via
  // an effect) so a dynamic bill's status — e.g. flipping to paid after
  // payApInvoice runs — is always read live off context, never stale.
  const displayPayables = useMemo(() => {
    const existingIds = new Set(payables.map(p => p.id));
    const dynamicRows = (entityApInvoices || [])
      .filter(b => b.counterpartyEntity && !existingIds.has(b.id))
      .map(b => ({
        id: b.id,
        policyNum: b.policyNumber || '',
        customer: b.vendor,
        type: 'Inter-Entity Settlement',
        amount: b.amount,
        paidAmount: b.status === 'Paid & Cleared' ? b.amount : 0,
        status: b.status === 'Paid & Cleared' ? 'Paid' : (b.status === 'Pending Approval' ? 'Pending Approval' : 'Approved'),
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: b.dueDate,
        category: b.category || 'Inter-Entity Settlement',
        glAcct: b.glAcct || '2200',
        method: b.method || 'ACH'
      }));
    return [...dynamicRows, ...payables];
  }, [payables, entityApInvoices]);

  // Selected row checkboxes
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [newInvoiceModal, setNewInvoiceModal] = useState({
    open: false,
    vendor: 'Crawford & Co. Claims',
    policy: 'POL-2026-0428',
    amount: '18500',
    category: 'Claims LAE',
    glAcct: '5800',
    method: 'ACH',
    dueDate: '2026-06-15'
  });

  const [paymentModal, setPaymentModal] = useState({
    open: false,
    invId: '',
    vendor: '',
    balance: 0,
    method: 'ACH'
  });

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fmtM = (n) => '$' + Math.round(n || 0).toLocaleString('en-US');

  const downloadCSV = (filename, content) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // KPI & Analytics Calculations
  const {
    totalAP,
    pendingApproval,
    dueThisWeek,
    paidMTD,
    onHoldCount,
    openCount,
    pendingCount,
    weekCount,
    pipePending,
    pipeApproved,
    pipeScheduled,
    aging0_30,
    aging31_60,
    aging61_90,
    aging90_plus,
    aging0_30_c,
    aging31_60_c,
    aging61_90_c,
    aging90_plus_c
  } = useMemo(() => {
    let totAP = 0;
    let pendApp = 0;
    let dueWk = 0;
    let pMTD = 0;
    let oHold = 0;
    let oCount = 0;
    let pCount = 0;
    let wCount = 0;

    let pPend = 0;
    let pAppr = 0;
    let pSched = 0;

    let a0 = 0, a31 = 0, a61 = 0, a90 = 0;
    let c0 = 0, c31 = 0, c61 = 0, c90 = 0;

    displayPayables.forEach(inv => {
      const amt = Number(inv.amount || 0);
      const paid = Number(inv.paidAmount || 0);
      const bal = amt - paid;

      pMTD += paid;

      if (bal > 0) {
        totAP += bal;
        oCount++;

        if (inv.status === 'Pending Approval') {
          pendApp += bal;
          pCount++;
          pPend++;
        } else if (inv.status === 'Approved') {
          pAppr++;
        } else if (inv.status === 'On Hold') {
          oHold++;
        }

        const due = new Date(inv.dueDate);
        const diffDays = Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
          dueWk += bal;
          wCount++;
        }

        const diffTimeRef = new Date() - due;
        const diffDaysRef = Math.ceil(diffTimeRef / (1000 * 60 * 60 * 24));

        if (diffDaysRef <= 30) {
          a0 += bal; c0++;
        } else if (diffDaysRef <= 60) {
          a31 += bal; c31++;
        } else if (diffDaysRef <= 90) {
          a61 += bal; c61++;
        } else {
          a90 += bal; c90++;
        }
      }
    });

    return {
      totalAP: totAP,
      pendingApproval: pendApp,
      dueThisWeek: dueWk,
      paidMTD: pMTD,
      onHoldCount: oHold,
      openCount: oCount,
      pendingCount: pCount,
      weekCount: wCount,
      pipePending: pPend,
      pipeApproved: pAppr,
      pipeScheduled: pSched,
      aging0_30: a0,
      aging31_60: a31,
      aging61_90: a61,
      aging90_plus: a90,
      aging0_30_c: c0,
      aging31_60_c: c31,
      aging61_90_c: c61,
      aging90_plus_c: c90
    };
  }, [displayPayables]);

  // Handle Approve Invoice
  const handleApprove = (id) => {
    const updated = payables.map(inv => inv.id === id ? { ...inv, status: 'Approved' } : inv);
    setPayables(updated);
    try {
      localStorage.setItem('v_ap_invoices_data', JSON.stringify(updated));
    } catch (e) {}
    showToast(`Invoice ${id} approved - ready for payment`, 'success');
  };

  // Handle Reject / Void Invoice
  const handleReject = (id) => {
    const updated = payables.map(inv => inv.id === id ? { ...inv, status: 'Voided' } : inv);
    setPayables(updated);
    try {
      localStorage.setItem('v_ap_invoices_data', JSON.stringify(updated));
    } catch (e) {}
    showToast(`Invoice ${id} rejected and voided`, 'warning');
  };

  // Handle Disbursement
  const handleExecutePayment = () => {
    const { invId, balance, method } = paymentModal;
    const updated = payables.map(inv => {
      if (inv.id === invId) {
        return { ...inv, paidAmount: (inv.paidAmount || 0) + balance, status: 'Paid' };
      }
      return inv;
    });

    setPayables(updated);
    try {
      localStorage.setItem('v_ap_invoices_data', JSON.stringify(updated));
      payApInvoice(invId, method);
    } catch (e) {}

    showToast(`Disbursed payment of $${balance.toLocaleString()} via ${method}. Ledger updated.`, 'success');
    setPaymentModal({ open: false, invId: '', vendor: '', balance: 0, method: 'ACH' });
  };

  // Handle Bulk Approve
  const handleBulkApprove = () => {
    let count = 0;
    const updated = payables.map(inv => {
      if (inv.status === 'Pending Approval' && (selectedIds.length === 0 || selectedIds.includes(inv.id))) {
        count++;
        return { ...inv, status: 'Approved' };
      }
      return inv;
    });

    setPayables(updated);
    setSelectedIds([]);
    try {
      localStorage.setItem('v_ap_invoices_data', JSON.stringify(updated));
    } catch (e) {}
    showToast(`${count} invoice(s) approved for payment`, 'success');
  };

  // Handle Create Invoice
  const handleCreateInvoice = (e) => {
    e.preventDefault();
    const amt = parseFloat(newInvoiceModal.amount) || 0;
    if (!newInvoiceModal.vendor || amt <= 0) {
      showToast('Vendor name and valid amount are required', 'error');
      return;
    }

    const nextId = `PAY-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInv = {
      id: nextId,
      policyNum: newInvoiceModal.policy || `POL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customer: newInvoiceModal.vendor,
      type: 'Carrier Payable',
      amount: amt,
      paidAmount: 0,
      status: 'Pending Approval',
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: newInvoiceModal.dueDate || '2026-06-15',
      category: newInvoiceModal.category,
      glAcct: newInvoiceModal.glAcct,
      method: newInvoiceModal.method
    };

    const updated = [newInv, ...payables];
    setPayables(updated);
    try {
      localStorage.setItem('v_ap_invoices_data', JSON.stringify(updated));
      addApInvoice({
        id: nextId,
        vendor: newInv.customer,
        amount: amt,
        dueDate: newInv.dueDate,
        category: newInv.category,
        status: 'Pending Approval'
      });
    } catch (e) {}

    showToast(`Invoice ${nextId} generated and queued for approval`, 'success');
    setNewInvoiceModal({
      open: false,
      vendor: 'Crawford & Co. Claims',
      policy: 'POL-2026-0428',
      amount: '18500',
      category: 'Claims LAE',
      glAcct: '5800',
      method: 'ACH',
      dueDate: '2026-06-15'
    });
  };

  // Filtered Table Data
  const filteredPayables = displayPayables.filter(inv => {
    if (statusFilter !== 'All Status' && inv.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match = (inv.id && inv.id.toLowerCase().includes(term)) ||
                    (inv.customer && inv.customer.toLowerCase().includes(term)) ||
                    (inv.category && inv.category.toLowerCase().includes(term));
      if (!match) return false;
    }
    return true;
  });

  const totalAgingSum = aging0_30 + aging31_60 + aging61_90 + aging90_plus;
  const totalAgingCounts = aging0_30_c + aging31_60_c + aging61_90_c + aging90_plus_c;
  const agingPct = (n) => totalAgingSum > 0 ? (n / totalAgingSum * 100).toFixed(0) : '0';

  return (
    <div className="ap-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`veridex-toast veridex-toast-${toastMessage.type}`}>
          <span>{toastMessage.type === 'error' ? '✕' : '✓'}</span>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {paymentModal.open && (
        <div className="v-modal-overlay">
          <div className="v-modal-card">
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)', marginBottom: '16px' }}>
              Execute AP Disbursement
            </div>
            <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '16px', lineHeight: 1.5 }}>
              Confirm settlement payment of <b>${paymentModal.balance.toLocaleString()}</b> to <b>{paymentModal.vendor}</b> ({paymentModal.invId}) via <b>{paymentModal.method}</b>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setPaymentModal({ open: false, invId: '', vendor: '', balance: 0, method: 'ACH' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleExecutePayment}
              >
                Confirm &amp; Disburse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Invoice Modal */}
      {newInvoiceModal.open && (
        <div className="v-modal-overlay">
          <div className="v-modal-card">
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)', marginBottom: '16px' }}>
              Create New AP Bill / Invoice
            </div>
            <form onSubmit={handleCreateInvoice}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Vendor / Payee *</label>
                  <input
                    className="form-ctrl"
                    style={{ width: '100%' }}
                    value={newInvoiceModal.vendor}
                    onChange={(e) => setNewInvoiceModal({ ...newInvoiceModal, vendor: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Policy Reference</label>
                  <input
                    className="form-ctrl"
                    style={{ width: '100%' }}
                    value={newInvoiceModal.policy}
                    onChange={(e) => setNewInvoiceModal({ ...newInvoiceModal, policy: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-ctrl"
                    style={{ width: '100%' }}
                    value={newInvoiceModal.amount}
                    onChange={(e) => setNewInvoiceModal({ ...newInvoiceModal, amount: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Category</label>
                    <select
                      className="form-ctrl"
                      style={{ width: '100%' }}
                      value={newInvoiceModal.category}
                      onChange={(e) => setNewInvoiceModal({ ...newInvoiceModal, category: e.target.value })}
                    >
                      <option>Claims LAE</option>
                      <option>Carrier Settlement</option>
                      <option>Reinsurance Ceded</option>
                      <option>Legal</option>
                      <option>IT / SaaS</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Payment Method</label>
                    <select
                      className="form-ctrl"
                      style={{ width: '100%' }}
                      value={newInvoiceModal.method}
                      onChange={(e) => setNewInvoiceModal({ ...newInvoiceModal, method: e.target.value })}
                    >
                      <option>ACH</option>
                      <option>E-Check</option>
                      <option>Wire</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Due Date</label>
                  <input
                    type="date"
                    className="form-ctrl"
                    style={{ width: '100%' }}
                    value={newInvoiceModal.dueDate}
                    onChange={(e) => setNewInvoiceModal({ ...newInvoiceModal, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setNewInvoiceModal({ ...newInvoiceModal, open: false })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">Create Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <div className="page-title">Accounts Payable</div>
          <div className="page-subtitle">Veridex Finance System · Period: May 2026</div>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              const csv = "Invoice No.,Vendor,Inv Date,DueDate,Amount,Category,GL Acct,Method,Status\n" +
                displayPayables.map(i => `${i.id},"${i.customer}",${i.issueDate},${i.dueDate},${i.amount},"${i.category}",${i.glAcct},${i.method},${i.status}`).join("\n");
              downloadCSV('ap-invoices.csv', csv);
              showToast('AP export ready for download', 'success');
            }}
          >
            Export
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setNewInvoiceModal({ ...newInvoiceModal, open: true })}
          >
            + New Invoice
          </button>
        </div>
      </div>

      {/* Collapsible Analytics Section */}
      {showAnalytics && (
        <div style={{ marginTop: '16px', marginBottom: '20px' }}>
          {/* KPI Strip 6 */}
          <div className="kpi-strip-6">
            <div className="kpi-tile" style={{ borderTop: '3px solid #0d1b4b' }}>
              <div className="kpi-tile-lbl">AP Outstanding</div>
              <div className="kpi-tile-val" style={{ fontSize: '18px' }}>{fmtM(totalAP)}</div>
              <div className="kpi-tile-sub">{openCount} open invoices</div>
            </div>
            <div className="kpi-tile" style={{ borderTop: '3px solid #e65100' }}>
              <div className="kpi-tile-lbl">Pending Approval</div>
              <div className="kpi-tile-val" style={{ fontSize: '18px', color: '#e65100' }}>{fmtM(pendingApproval)}</div>
              <div className="kpi-tile-sub warn">{pendingCount} invoices</div>
            </div>
            <div className="kpi-tile" style={{ borderTop: '3px solid #c62828' }}>
              <div className="kpi-tile-lbl">Due This Week</div>
              <div className="kpi-tile-val" style={{ fontSize: '18px', color: '#c62828' }}>{fmtM(dueThisWeek)}</div>
              <div className="kpi-tile-sub warn">{weekCount} invoices</div>
            </div>
            <div className="kpi-tile" style={{ borderTop: '3px solid #2e7d32' }}>
              <div className="kpi-tile-lbl">Paid MTD</div>
              <div className="kpi-tile-val" style={{ fontSize: '18px', color: '#2e7d32' }}>{fmtM(paidMTD)}</div>
            </div>
            <div className="kpi-tile" style={{ borderTop: '3px solid #6a1b9a' }}>
              <div className="kpi-tile-lbl">On Hold</div>
              <div className="kpi-tile-val" style={{ fontSize: '18px', color: '#6a1b9a' }}>{onHoldCount}</div>
              <div className="kpi-tile-sub">Missing W9 / docs</div>
            </div>
          </div>

          {/* Payment Lifecycle Pipeline */}
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '8px' }}>
            Payment Lifecycle Pipeline
          </div>
          <div className="pipeline">
            <div className="pipe-step warn-pipe">
              <div className="pipe-step-lbl">Pending Approval</div>
              <div className="pipe-step-val">{pipePending}</div>
              <div className="pipe-step-amt">{fmtM(pendingApproval)}</div>
            </div>
            <div className="pipe-step active-pipe">
              <div className="pipe-step-lbl">Approved</div>
              <div className="pipe-step-val">{pipeApproved}</div>
            </div>
            <div className="pipe-step active-pipe">
              <div className="pipe-step-lbl">Scheduled</div>
              <div className="pipe-step-val">{pipeScheduled}</div>
            </div>
            <div className="pipe-step done-pipe">
              <div className="pipe-step-lbl">Paid</div>
              <div className="pipe-step-amt">{fmtM(paidMTD)} MTD</div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
            {/* Monthly Payment Trend */}
            <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: '9px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)' }}>Monthly Payments - 2026</div>
                <div style={{ fontSize: '10.5px', color: 'var(--gray-400)' }}>Jan – May</div>
              </div>
              <svg viewBox="0 0 380 110" width="100%" height="110" style={{ overflow: 'visible' }}>
                <line x1="36" y1="10" x2="36" y2="86" stroke="#e5e7eb" strokeWidth="1"/>
                <line x1="36" y1="10" x2="368" y2="10" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,3"/>
                <line x1="36" y1="34" x2="368" y2="34" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,3"/>
                <line x1="36" y1="58" x2="368" y2="58" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,3"/>
                <line x1="36" y1="86" x2="368" y2="86" stroke="#e5e7eb" strokeWidth="1"/>
                <text x="30" y="14" textAnchor="end" fontSize="9" fill="#9ca3af">600K</text>
                <text x="30" y="38" textAnchor="end" fontSize="9" fill="#9ca3af">400K</text>
                <text x="30" y="62" textAnchor="end" fontSize="9" fill="#9ca3af">200K</text>
                <text x="30" y="90" textAnchor="end" fontSize="9" fill="#9ca3af">0</text>
                <rect x="42" y="45" width="44" height="41" rx="3" fill="#0d1b4b" opacity=".8"/>
                <rect x="108" y="50" width="44" height="36" rx="3" fill="#0d1b4b" opacity=".8"/>
                <rect x="174" y="34" width="44" height="52" rx="3" fill="#0d1b4b" opacity=".8"/>
                <rect x="240" y="23" width="44" height="63" rx="3" fill="#0d1b4b" opacity=".85"/>
                <rect x="306" y="19" width="44" height="67" rx="3" fill="#e05470"/>
                <text x="64" y="42" textAnchor="middle" fontSize="9" fill="#6b7280">$320K</text>
                <text x="130" y="47" textAnchor="middle" fontSize="9" fill="#6b7280">$285K</text>
                <text x="196" y="31" textAnchor="middle" fontSize="9" fill="#6b7280">$412K</text>
                <text x="262" y="20" textAnchor="middle" fontSize="9" fill="#6b7280">$498K</text>
                <text x="328" y="16" textAnchor="middle" fontSize="9" fontWeight="700" fill="#e05470">$530K</text>
                <text x="64" y="100" textAnchor="middle" fontSize="10" fill="#6b7280">Jan</text>
                <text x="130" y="100" textAnchor="middle" fontSize="10" fill="#6b7280">Feb</text>
                <text x="196" y="100" textAnchor="middle" fontSize="10" fill="#6b7280">Mar</text>
                <text x="262" y="100" textAnchor="middle" fontSize="10" fill="#6b7280">Apr</text>
                <text x="328" y="100" textAnchor="middle" fontSize="10" fontWeight="700" fill="#e05470">May</text>
              </svg>
              <div style={{ display: 'flex', gap: '14px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'var(--gray-500)' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#0d1b4b', display: 'inline-block' }}></span>Prior months
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'var(--gray-500)' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#e05470', display: 'inline-block' }}></span>Current month
                </div>
              </div>
            </div>

            {/* Spend by Category */}
            <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: '9px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)', marginBottom: '14px' }}>
                Spend by Category - YTD
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>Claims / LAE</span>
                    <span style={{ fontWeight: 700, color: '#0d1b4b' }}>$624,800 <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(26%)</span></span>
                  </div>
                  <div style={{ background: 'var(--gray-100)', borderRadius: '4px', height: '9px' }}>
                    <div style={{ width: '26%', height: '9px', borderRadius: '4px', background: '#0d1b4b' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>Reinsurance Ceded</span>
                    <span style={{ fontWeight: 700, color: '#1565c0' }}>$578,500 <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(24%)</span></span>
                  </div>
                  <div style={{ background: 'var(--gray-100)', borderRadius: '4px', height: '9px' }}>
                    <div style={{ width: '24%', height: '9px', borderRadius: '4px', background: '#1565c0' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>IT &amp; SaaS</span>
                    <span style={{ fontWeight: 700, color: '#2e7d32' }}>$398,200 <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(17%)</span></span>
                  </div>
                  <div style={{ background: 'var(--gray-100)', borderRadius: '4px', height: '9px' }}>
                    <div style={{ width: '17%', height: '9px', borderRadius: '4px', background: '#2e7d32' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>Legal &amp; Compliance</span>
                    <span style={{ fontWeight: 700, color: '#e65100' }}>$318,400 <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(13%)</span></span>
                  </div>
                  <div style={{ background: 'var(--gray-100)', borderRadius: '4px', height: '9px' }}>
                    <div style={{ width: '13%', height: '9px', borderRadius: '4px', background: '#e65100' }}></div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 700, color: 'var(--navy)' }}>
                  <span>Total YTD Spend</span>
                  <span>$2.4M</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tabs Navigation */}
      <div className="sub-tabbar">
        <button
          className={`sub-tab ${activeTab === 'ap-invoices' ? 'active' : ''}`}
          onClick={() => selectTab('ap-invoices')}
        >
          All Invoices
        </button>
        <button
          className={`sub-tab ${activeTab === 'ap-ach' ? 'active' : ''}`}
          onClick={() => selectTab('ap-ach')}
        >
          ACH Payments
        </button>
        <button
          className={`sub-tab ${activeTab === 'ap-echecks' ? 'active' : ''}`}
          onClick={() => selectTab('ap-echecks')}
        >
          E-Checks
        </button>
        <button
          className={`sub-tab ${activeTab === 'ap-aging' ? 'active' : ''}`}
          onClick={() => selectTab('ap-aging')}
        >
          AP Aging
        </button>
      </div>

      {/* TAB 1: ALL INVOICES */}
      {activeTab === 'ap-invoices' && (
        <div>
          {/* Form Filter Strip */}
          <div className="form-strip">
            <div className="form-field">
              <label className="form-label">Status</label>
              <select
                className="form-ctrl form-ctrl-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All Status</option>
                <option>Pending Approval</option>
                <option>Approved</option>
                <option>Paid</option>
                <option>On Hold</option>
                <option>Voided</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Vendor Type</label>
              <select
                className="form-ctrl form-ctrl-sm"
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
              >
                <option>All Vendors</option>
                <option>Claims Handlers</option>
                <option>Legal</option>
                <option>IT / SaaS</option>
                <option>Reinsurance</option>
                <option>Professional</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Amount</label>
              <select
                className="form-ctrl form-ctrl-sm"
                value={amountFilter}
                onChange={(e) => setAmountFilter(e.target.value)}
              >
                <option>All Amounts</option>
                <option>Under $10K</option>
                <option>$10K–$100K</option>
                <option>$100K–$1M</option>
                <option>Over $1M</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">From</label>
              <input
                type="date"
                className="form-ctrl form-ctrl-sm"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">To</label>
              <input
                type="date"
                className="form-ctrl form-ctrl-sm"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">Search</label>
              <input
                className="form-ctrl"
                placeholder="Search invoice, vendor…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="tbl-wrap">
            <div className="tbl-hdr">
              <span className="tbl-hdr-title">Invoice Register</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline btn-sm" onClick={handleBulkApprove}>Bulk Approve</button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    const csv = "Invoice No.,Vendor,Inv Date,DueDate,Amount,Category,GL Acct,Method,Status\n" +
                      filteredPayables.map(i => `${i.id},"${i.customer}",${i.issueDate},${i.dueDate},${i.amount},"${i.category}",${i.glAcct},${i.method},${i.status}`).join("\n");
                    downloadCSV('ap-invoices.csv', csv);
                    showToast('Exported ap-invoices.csv', 'success');
                  }}
                >
                  Export
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setNewInvoiceModal({ ...newInvoiceModal, open: true })}>
                  + New Invoice
                </button>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{ width: '32px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredPayables.length && filteredPayables.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(filteredPayables.map(i => i.id));
                        else setSelectedIds([]);
                      }}
                    />
                  </th>
                  <th>Invoice No.</th>
                  <th>Vendor</th>
                  <th>Inv Date</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Category</th>
                  <th>GL Acct</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayables.length === 0 && (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--gray-400)' }}>
                      No invoices found for the selected filters.
                    </td>
                  </tr>
                )}
                {filteredPayables.map(inv => {
                  const amt = Number(inv.amount || 0);
                  const paid = Number(inv.paidAmount || 0);
                  const bal = amt - paid;

                  let chipClass = 'chip-blue';
                  if (bal === 0) chipClass = 'chip-green';
                  else if (inv.status === 'Pending Approval') chipClass = 'chip-orange';
                  else if (inv.status === 'Approved') chipClass = 'chip-green';
                  else if (inv.status === 'On Hold') chipClass = 'chip-red';

                  return (
                    <tr key={inv.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(inv.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds([...selectedIds, inv.id]);
                            else setSelectedIds(selectedIds.filter(x => x !== inv.id));
                          }}
                        />
                      </td>
                      <td style={{ fontWeight: 600 }}>{inv.id}</td>
                      <td><b>{inv.customer}</b></td>
                      <td>{inv.issueDate}</td>
                      <td>{inv.dueDate}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtM(amt)}</td>
                      <td>{inv.category || 'Carrier Settlement'}</td>
                      <td>{inv.glAcct || '2200'}</td>
                      <td><span className="chip chip-blue">{inv.method || 'ACH'}</span></td>
                      <td><span className={`chip ${chipClass}`}>{inv.status}</span></td>
                      <td>
                        {bal > 0 ? (
                          inv.status === 'Pending Approval' ? (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                className="btn btn-sm"
                                style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #2e7d32', fontSize: '11px', padding: '2px 8px' }}
                                onClick={() => handleApprove(inv.id)}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ fontSize: '11px', padding: '2px 6px' }}
                                onClick={() => handleReject(inv.id)}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ fontSize: '11px', padding: '2px 8px' }}
                                onClick={() => setPaymentModal({ open: true, invId: inv.id, vendor: inv.customer, balance: bal, method: inv.method || 'ACH' })}
                              >
                                Pay Now
                              </button>
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ fontSize: '11px', padding: '2px 6px' }}
                                onClick={() => showToast(`Opening invoice detail for ${inv.id}`, 'info')}
                              >
                                View
                              </button>
                            </div>
                          )
                        ) : (
                          <span style={{ color: 'var(--gray-400)', fontSize: '11px' }}>Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ACH PAYMENTS */}
      {activeTab === 'ap-ach' && (
        <div className="tbl-wrap">
          <div className="tbl-hdr">
            <span className="tbl-hdr-title">ACH Payments</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="form-ctrl form-ctrl-sm"
                placeholder="Search vendor…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '180px' }}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setNewInvoiceModal({ ...newInvoiceModal, open: true, method: 'ACH' })}
              >
                + New ACH
              </button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Vendor</th>
                <th>GL Acct</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Method</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayPayables.filter(p => p.method === 'ACH').length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--gray-400)' }}>
                    No ACH payments found.
                  </td>
                </tr>
              )}
              {displayPayables.filter(p => p.method === 'ACH').map(inv => {
                const bal = inv.amount - (inv.paidAmount || 0);
                return (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600 }}>{inv.id}</td>
                    <td><b>{inv.customer}</b></td>
                    <td>{inv.glAcct || '2200'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtM(inv.amount)}</td>
                    <td><span className="chip chip-blue">ACH</span></td>
                    <td>{inv.dueDate}</td>
                    <td>
                      <span className={`chip ${bal === 0 ? 'chip-green' : inv.status === 'Pending Approval' ? 'chip-orange' : 'chip-blue'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ padding: '2px 8px', fontSize: '11px' }}
                        onClick={() => bal > 0 ? setPaymentModal({ open: true, invId: inv.id, vendor: inv.customer, balance: bal, method: 'ACH' }) : showToast(`Viewing cleared payment for ${inv.id}`, 'info')}
                      >
                        {bal > 0 ? 'Pay' : 'View'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: E-CHECKS */}
      {activeTab === 'ap-echecks' && (
        <div className="tbl-wrap">
          <div className="tbl-hdr">
            <span className="tbl-hdr-title">E-Check Payments</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="form-ctrl form-ctrl-sm"
                placeholder="Search payee…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '180px' }}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setNewInvoiceModal({ ...newInvoiceModal, open: true, method: 'E-Check' })}
              >
                + New E-Check
              </button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Check #</th>
                <th>Payee</th>
                <th>GL Acct</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Method</th>
                <th>Issue Date</th>
                <th>Cleared Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayPayables.filter(p => p.method === 'E-Check' || p.method === 'Check').length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--gray-400)' }}>
                    No e-check payments found.
                  </td>
                </tr>
              )}
              {displayPayables.filter(p => p.method === 'E-Check' || p.method === 'Check').map(inv => {
                const bal = inv.amount - (inv.paidAmount || 0);
                return (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600 }}>{inv.id.replace('PAY-', 'EC-')}</td>
                    <td><b>{inv.customer}</b></td>
                    <td>{inv.glAcct || '2200'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtM(inv.amount)}</td>
                    <td><span className="chip chip-purple">E-Check</span></td>
                    <td>{inv.issueDate}</td>
                    <td>{bal === 0 ? inv.dueDate : ' - '}</td>
                    <td>
                      <span className={`chip ${bal === 0 ? 'chip-green' : 'chip-blue'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ padding: '2px 8px', fontSize: '11px' }}
                        onClick={() => bal > 0 ? setPaymentModal({ open: true, invId: inv.id, vendor: inv.customer, balance: bal, method: 'E-Check' }) : showToast(`Viewing cleared check ${inv.id}`, 'info')}
                      >
                        {bal > 0 ? 'Clear' : 'View'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: AP AGING */}
      {activeTab === 'ap-aging' && (
        <div className="tbl-wrap">
          <div className="tbl-hdr">
            <span className="tbl-hdr-title">AP Aging Summary</span>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                const csv = "Aging Bucket,Amount,Invoices,% of Total\n" +
                  `Current (0-30 days),${aging0_30},${aging0_30_c},${agingPct(aging0_30)}%\n` +
                  `31-60 days,${aging31_60},${aging31_60_c},${agingPct(aging31_60)}%\n` +
                  `61-90 days,${aging61_90},${aging61_90_c},${agingPct(aging61_90)}%\n` +
                  `90+ days,${aging90_plus},${aging90_plus_c},${agingPct(aging90_plus)}%\n`;
                downloadCSV('ap-aging-summary.csv', csv);
                showToast('Exported ap-aging-summary.csv', 'success');
              }}
            >
              Export
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Aging Bucket</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'right' }}>Invoices</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Current (0–30 days)</td>
                <td style={{ textAlign: 'right', color: '#2e7d32', fontWeight: 600 }}>{fmtM(aging0_30)}</td>
                <td style={{ textAlign: 'right' }}>{aging0_30_c}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, background: 'var(--gray-100)', borderRadius: '4px', height: '8px' }}>
                      <div style={{ width: `${agingPct(aging0_30)}%`, height: '8px', borderRadius: '4px', background: '#2e7d32' }}></div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#2e7d32' }}>{agingPct(aging0_30)}%</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td>31–60 days</td>
                <td style={{ textAlign: 'right', color: '#e65100', fontWeight: 600 }}>{fmtM(aging31_60)}</td>
                <td style={{ textAlign: 'right' }}>{aging31_60_c}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, background: 'var(--gray-100)', borderRadius: '4px', height: '8px' }}>
                      <div style={{ width: `${agingPct(aging31_60)}%`, height: '8px', borderRadius: '4px', background: '#e65100' }}></div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#e65100' }}>{agingPct(aging31_60)}%</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td>61–90 days</td>
                <td style={{ textAlign: 'right', color: '#c62828', fontWeight: 600 }}>{fmtM(aging61_90)}</td>
                <td style={{ textAlign: 'right' }}>{aging61_90_c}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, background: 'var(--gray-100)', borderRadius: '4px', height: '8px' }}>
                      <div style={{ width: `${agingPct(aging61_90)}%`, height: '8px', borderRadius: '4px', background: '#c62828' }}></div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#c62828' }}>{agingPct(aging61_90)}%</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td>90+ days</td>
                <td style={{ textAlign: 'right', color: '#6a1b9a', fontWeight: 600 }}>{fmtM(aging90_plus)}</td>
                <td style={{ textAlign: 'right' }}>{aging90_plus_c}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, background: 'var(--gray-100)', borderRadius: '4px', height: '8px' }}>
                      <div style={{ width: `${agingPct(aging90_plus)}%`, height: '8px', borderRadius: '4px', background: '#6a1b9a' }}></div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#6a1b9a' }}>{agingPct(aging90_plus)}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                <td style={{ color: 'var(--navy)' }}>Total</td>
                <td style={{ textAlign: 'right', color: 'var(--navy)' }}>{fmtM(totalAgingSum)}</td>
                <td style={{ textAlign: 'right', color: 'var(--navy)' }}>{totalAgingCounts}</td>
                <td style={{ color: 'var(--navy)' }}>100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default AccountsPayablePage;
