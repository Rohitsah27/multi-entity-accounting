import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import './accounts-receivable.css';

const AR_TABS = ['ar-register', 'ar-aging', 'ar-statements'];
const hashToTab = (hash) => {
  const id = hash.replace('#', '');
  return AR_TABS.includes(id) ? id : 'ar-register';
};

export function AccountsReceivablePage() {
  const { addArInvoice, collectArInvoice, entityArInvoices } = useFinance();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation & View State — derived from the URL hash so sidebar sub-links
  // like /accounts-receivable#ar-aging switch this tab automatically.
  const activeTab = hashToTab(location.hash); // 'ar-register' | 'ar-aging' | 'ar-statements'

  const selectTab = (tab) => {
    navigate(tab === 'ar-register' ? '/accounts-receivable' : `/accounts-receivable#${tab}`, { replace: true });
  };
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Invoices Data State
  const [invoices, setInvoices] = useState(() => {
    try {
      if (localStorage.getItem('v_data_reset') === '1') return [];
      const saved = localStorage.getItem('v_ar_invoices_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    const handleReset = () => {
      setInvoices([]);
      try { localStorage.removeItem('v_ar_invoices_data'); } catch {}
    };
    window.addEventListener('veridex:data-reset', handleReset);
    return () => window.removeEventListener('veridex:data-reset', handleReset);
  }, []);

  // Merge in receivables raised dynamically elsewhere (e.g. the PAS Event
  // Injector's Stage 1 POLICY_BINDING_INVOICED, which raises a real
  // "Insured owes Broker" invoice the moment a policy is bound) on top of
  // the locally-managed rows. Only invoices tagged source: 'PAS' are
  // merged, so pre-existing static demo rows in FinanceContext are left
  // alone. Derived at render time (not synced via an effect) so a dynamic
  // invoice's status — e.g. flipping to paid after collectArInvoice runs —
  // is always read live off context, never stale. Matching by id also
  // means re-running the default demo preset (same invoice number) updates
  // the existing row instead of stacking a duplicate.
  const displayInvoices = useMemo(() => {
    const existingIds = new Set(invoices.map(p => p.id));
    const dynamicRows = (entityArInvoices || [])
      .filter(inv => inv.source === 'PAS' && !existingIds.has(inv.id))
      .map(inv => ({
        id: inv.id,
        policyNum: inv.policyNumber || '',
        customer: inv.customer,
        amount: inv.amount,
        paidAmount: inv.status === 'Paid in Full' ? inv.amount : 0,
        status: inv.status === 'Paid in Full' ? 'Paid' : 'Sent',
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: inv.dueDate
      }));
    return [...dynamicRows, ...invoices];
  }, [invoices, entityArInvoices]);

  // Modals
  const [paymentModal, setPaymentModal] = useState({ open: false, invId: '', customer: '', balance: 0, amount: '' });
  const [newInvoiceModal, setNewInvoiceModal] = useState({ open: false, partner: 'RSA Partners', amount: '15000', policy: '', due: '2026-06-20' });

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

  // Calculations for KPI Cards & Pipeline
  const { totalAR, collectedMTD, overdueAmt, totalInvoiced, openCount, overdueCount, partialCount } = useMemo(() => {
    let ar = 0;
    let coll = 0;
    let over = 0;
    let invTot = 0;
    let oCount = 0;
    let overCount = 0;
    let partCount = 0;

    displayInvoices.forEach(inv => {
      const amt = Number(inv.amount || 0);
      const paid = Number(inv.paidAmount || 0);
      const bal = amt - paid;

      invTot += amt;
      coll += paid;

      if (bal > 0) {
        ar += bal;
        oCount++;
        const due = new Date(inv.dueDate);
        const isOverdue = due < new Date() || inv.status === 'Overdue';
        if (isOverdue) {
          over += bal;
          overCount++;
        }
      }

      if (inv.status === 'Partial') {
        partCount++;
      }
    });

    return {
      totalAR: ar,
      collectedMTD: coll,
      overdueAmt: over,
      totalInvoiced: invTot,
      openCount: oCount,
      overdueCount: overCount,
      partialCount: partCount
    };
  }, [displayInvoices]);

  const collectionRate = totalInvoiced > 0 ? ((collectedMTD / totalInvoiced) * 100).toFixed(1) : '0.0';

  // Aging by partner — bucketed the same way as the AP Aging tab, computed
  // live from real receivables instead of a static demo table.
  const agingPartners = useMemo(() => {
    const byPartner = {};
    displayInvoices.forEach(inv => {
      const amt = Number(inv.amount || 0);
      const paid = Number(inv.paidAmount || 0);
      const bal = amt - paid;
      if (bal <= 0) return;

      const key = inv.customer || 'Unknown';
      if (!byPartner[key]) {
        byPartner[key] = { name: key, a0_30: 0, a31_60: 0, a61_90: 0, a90_plus: 0, total: 0 };
      }

      const due = new Date(inv.dueDate);
      const diffDays = Math.ceil((new Date() - due) / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) byPartner[key].a0_30 += bal;
      else if (diffDays <= 60) byPartner[key].a31_60 += bal;
      else if (diffDays <= 90) byPartner[key].a61_90 += bal;
      else byPartner[key].a90_plus += bal;
      byPartner[key].total += bal;
    });
    return Object.values(byPartner);
  }, [displayInvoices]);

  const agingPartnersTotal = agingPartners.reduce((acc, p) => ({
    a0_30: acc.a0_30 + p.a0_30,
    a31_60: acc.a31_60 + p.a31_60,
    a61_90: acc.a61_90 + p.a61_90,
    a90_plus: acc.a90_plus + p.a90_plus,
    total: acc.total + p.total
  }), { a0_30: 0, a31_60: 0, a61_90: 0, a90_plus: 0, total: 0 });

  // Handle Payment Modal Submission
  const handleRecordPayment = (e) => {
    e.preventDefault();
    const paidVal = parseFloat(paymentModal.amount) || 0;
    if (paidVal <= 0) {
      showToast('Payment amount must be greater than zero', 'error');
      return;
    }

    const updated = invoices.map(inv => {
      if (inv.id === paymentModal.invId) {
        const newPaid = (inv.paidAmount || 0) + paidVal;
        const newBal = inv.amount - newPaid;
        const newStatus = newBal <= 0.01 ? 'Paid' : 'Partial';
        return { ...inv, paidAmount: newPaid, status: newStatus };
      }
      return inv;
    });

    setInvoices(updated);
    try {
      localStorage.setItem('v_ar_invoices_data', JSON.stringify(updated));
      collectArInvoice(paymentModal.invId);
    } catch (err) {}

    showToast(`Payment of $${paidVal.toLocaleString()} posted. General ledger updated.`, 'success');
    setPaymentModal({ open: false, invId: '', customer: '', balance: 0, amount: '' });
  };

  // Handle New Invoice Submission
  const handleCreateInvoice = (e) => {
    e.preventDefault();
    const amt = parseFloat(newInvoiceModal.amount) || 0;
    if (!newInvoiceModal.partner || amt <= 0) {
      showToast('Please enter a valid partner and invoice amount', 'error');
      return;
    }

    const nextId = `AR-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newInv = {
      id: nextId,
      policyNum: newInvoiceModal.policy || `POL-TX-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      customer: newInvoiceModal.partner,
      amount: amt,
      paidAmount: 0,
      status: 'Sent',
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: newInvoiceModal.due || '2026-06-20'
    };

    const updated = [newInv, ...invoices];
    setInvoices(updated);
    try {
      localStorage.setItem('v_ar_invoices_data', JSON.stringify(updated));
      addArInvoice({
        id: nextId,
        customer: newInvoiceModal.partner,
        policyNumber: newInv.policyNum,
        amount: amt,
        dueDate: newInv.dueDate,
        status: 'Open'
      });
    } catch (err) {}

    showToast(`Invoice ${nextId} created for ${newInvoiceModal.partner}`, 'success');
    setNewInvoiceModal({ open: false, partner: 'RSA Partners', amount: '15000', policy: '', due: '2026-06-20' });
  };

  // Filtered Invoices
  const filteredInvoices = displayInvoices.filter(inv => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (inv.id && inv.id.toLowerCase().includes(term)) ||
      (inv.customer && inv.customer.toLowerCase().includes(term)) ||
      (inv.policyNum && inv.policyNum.toLowerCase().includes(term))
    );
  });

  return (
    <div className="ar-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`veridex-toast veridex-toast-${toastMessage.type}`}>
          <span>{toastMessage.type === 'error' ? '✕' : '✓'}</span>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModal.open && (
        <div className="v-modal-overlay">
          <div className="v-modal-card">
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)', marginBottom: '16px' }}>
              Record Cash Receipt
            </div>
            <form onSubmit={handleRecordPayment}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Invoice ID</label>
                  <input className="form-ctrl" style={{ width: '100%' }} value={paymentModal.invId} disabled />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Customer / Partner</label>
                  <input className="form-ctrl" style={{ width: '100%' }} value={paymentModal.customer} disabled />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Outstanding Balance ($)</label>
                  <input className="form-ctrl" style={{ width: '100%' }} value={paymentModal.balance.toFixed(2)} disabled />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Amount Received ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-ctrl"
                    style={{ width: '100%' }}
                    value={paymentModal.amount}
                    onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Payment Method</label>
                  <select className="form-ctrl" style={{ width: '100%' }}>
                    <option>ACH Wire Transfer</option>
                    <option>Check / E-Check</option>
                    <option>Direct Deposit</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setPaymentModal({ open: false, invId: '', customer: '', balance: 0, amount: '' })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">Post Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Invoice Modal */}
      {newInvoiceModal.open && (
        <div className="v-modal-overlay">
          <div className="v-modal-card">
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)', marginBottom: '16px' }}>
              Create New AR Invoice
            </div>
            <form onSubmit={handleCreateInvoice}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Partner / Agent *</label>
                  <input
                    className="form-ctrl"
                    style={{ width: '100%' }}
                    value={newInvoiceModal.partner}
                    onChange={(e) => setNewInvoiceModal({ ...newInvoiceModal, partner: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Policy Reference</label>
                  <input
                    className="form-ctrl"
                    style={{ width: '100%' }}
                    placeholder="e.g. POL-TX-2026-99210"
                    value={newInvoiceModal.policy}
                    onChange={(e) => setNewInvoiceModal({ ...newInvoiceModal, policy: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Invoice Amount ($) *</label>
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
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Due Date</label>
                  <input
                    type="date"
                    className="form-ctrl"
                    style={{ width: '100%' }}
                    value={newInvoiceModal.due}
                    onChange={(e) => setNewInvoiceModal({ ...newInvoiceModal, due: e.target.value })}
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
                <button type="submit" className="btn btn-primary btn-sm">Issue Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <div className="page-title">Accounts Receivable</div>
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
              const csv = "Invoice #,Partner,Amount,Paid,Balance,DueDate,Status\n" +
                displayInvoices.map(i => `${i.id},"${i.customer}",${i.amount},${i.paidAmount},${i.amount - i.paidAmount},${i.dueDate},${i.status}`).join("\n");
              downloadCSV('ar-register.csv', csv);
              showToast('AR export ready for download', 'success');
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
          {/* KPI Strip 5 */}
          <div className="kpi-strip-5">
            <div className="kpi-tile">
              <div className="kpi-tile-lbl">Outstanding AR</div>
              <div className="kpi-tile-val">{fmtM(totalAR)}</div>
              <div className="kpi-tile-sub">{openCount} open invoices</div>
            </div>
            <div className="kpi-tile">
              <div className="kpi-tile-lbl">Collected MTD</div>
              <div className="kpi-tile-val" style={{ color: '#2e7d32' }}>{fmtM(collectedMTD)}</div>
            </div>
            <div className="kpi-tile">
              <div className="kpi-tile-lbl">Overdue &gt; 60 Days</div>
              <div className="kpi-tile-val" style={{ color: '#c62828' }}>{fmtM(overdueAmt)}</div>
              <div className="kpi-tile-sub warn">{overdueCount} accounts</div>
            </div>
            <div className="kpi-tile">
              <div className="kpi-tile-lbl">Collection Rate</div>
              <div className="kpi-tile-val" style={{ color: '#2e7d32' }}>{collectionRate}%</div>
            </div>
          </div>

          {/* Collection Pipeline */}
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '8px' }}>
            Collection Pipeline
          </div>
          <div className="pipeline">
            <div className="pipe-step active-pipe">
              <div className="pipe-step-lbl">Invoiced</div>
              <div className="pipe-step-val">{displayInvoices.length}</div>
              <div className="pipe-step-amt">{fmtM(totalInvoiced)}</div>
            </div>
            <div className="pipe-step active-pipe">
              <div className="pipe-step-lbl">Partial Payment</div>
              <div className="pipe-step-val">{partialCount}</div>
            </div>
            <div className="pipe-step done-pipe">
              <div className="pipe-step-lbl">Collected</div>
              <div className="pipe-step-amt">{fmtM(collectedMTD)} MTD</div>
            </div>
            <div className="pipe-step warn-pipe">
              <div className="pipe-step-lbl">Overdue</div>
              <div className="pipe-step-val">{overdueCount}</div>
              <div className="pipe-step-amt">{fmtM(overdueAmt)}</div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
            {/* Monthly Collections Trend */}
            <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: '9px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)' }}>Monthly Collections - 2026</div>
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
                <rect x="42" y="50" width="44" height="36" rx="3" fill="#1565c0" opacity=".75"/>
                <rect x="108" y="46" width="44" height="40" rx="3" fill="#1565c0" opacity=".8"/>
                <rect x="174" y="37" width="44" height="49" rx="3" fill="#1565c0" opacity=".85"/>
                <rect x="240" y="32" width="44" height="54" rx="3" fill="#1565c0" opacity=".9"/>
                <rect x="306" y="27" width="44" height="59" rx="3" fill="#2e7d32"/>
                <polyline points="64,50 130,46 196,37 262,32 328,27" fill="none" stroke="#2e7d32" strokeWidth="1.5" strokeDasharray="3,2" opacity=".6"/>
                <text x="64" y="47" textAnchor="middle" fontSize="9" fill="#6b7280">$280K</text>
                <text x="130" y="43" textAnchor="middle" fontSize="9" fill="#6b7280">$318K</text>
                <text x="196" y="34" textAnchor="middle" fontSize="9" fill="#6b7280">$385K</text>
                <text x="262" y="29" textAnchor="middle" fontSize="9" fill="#6b7280">$425K</text>
                <text x="328" y="24" textAnchor="middle" fontSize="9" fontWeight="700" fill="#2e7d32">$469K</text>
                <text x="64" y="100" textAnchor="middle" fontSize="10" fill="#6b7280">Jan</text>
                <text x="130" y="100" textAnchor="middle" fontSize="10" fill="#6b7280">Feb</text>
                <text x="196" y="100" textAnchor="middle" fontSize="10" fill="#6b7280">Mar</text>
                <text x="262" y="100" textAnchor="middle" fontSize="10" fill="#6b7280">Apr</text>
                <text x="328" y="100" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2e7d32">May</text>
              </svg>
              <div style={{ display: 'flex', gap: '14px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'var(--gray-500)' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#1565c0', display: 'inline-block' }}></span>Prior months
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'var(--gray-500)' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#2e7d32', display: 'inline-block' }}></span>Current month
                </div>
              </div>
            </div>

            {/* AR Aging Distribution + DSO Trend */}
            <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: '9px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)', marginBottom: '14px' }}>
                AR Aging Distribution &amp; DSO Trend
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '16px' }}>
                <svg viewBox="0 0 130 130" width="130" height="130" style={{ flexShrink: 0 }}>
                  <circle cx="65" cy="65" r="46" fill="none" stroke="#2e7d32" strokeWidth="22" strokeDasharray="167.6 289.0" strokeDashoffset="72.3" transform="rotate(-90 65 65)"/>
                  <circle cx="65" cy="65" r="46" fill="none" stroke="#e65100" strokeWidth="22" strokeDasharray="63.6 289.0" strokeDashoffset="-95.3" transform="rotate(-90 65 65)"/>
                  <circle cx="65" cy="65" r="46" fill="none" stroke="#c62828" strokeWidth="22" strokeDasharray="37.6 289.0" strokeDashoffset="-231.2" transform="rotate(-90 65 65)"/>
                  <circle cx="65" cy="65" r="46" fill="none" stroke="#6a1b9a" strokeWidth="22" strokeDasharray="20.2 289.0" strokeDashoffset="-268.8" transform="rotate(-90 65 65)"/>
                  <text x="65" y="61" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0d1b4b">{fmtM(totalAR)}</text>
                  <text x="65" y="75" textAnchor="middle" fontSize="8.5" fill="#9ca3af">Total AR</text>
                </svg>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', marginBottom: '8px' }}>
                    <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#2e7d32', flexShrink: 0 }}></span>
                    <span style={{ flex: 1 }}>0–30 days</span>
                    <span style={{ fontWeight: 700 }}>58% · $720K</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', marginBottom: '8px' }}>
                    <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#e65100', flexShrink: 0 }}></span>
                    <span style={{ flex: 1 }}>31–60 days</span>
                    <span style={{ fontWeight: 700 }}>22% · $273K</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', marginBottom: '8px' }}>
                    <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#c62828', flexShrink: 0 }}></span>
                    <span style={{ flex: 1 }}>61–90 days</span>
                    <span style={{ fontWeight: 700 }}>13% · $161K</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}>
                    <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#6a1b9a', flexShrink: 0 }}></span>
                    <span style={{ flex: 1 }}>90+ days</span>
                    <span style={{ fontWeight: 700 }}>7% · $87K</span>
                  </div>
                </div>
              </div>

              {/* DSO Trend mini bar chart */}
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: '8px' }}>
                DSO Trend (Days Sales Outstanding)
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ background: '#1565c0', borderRadius: '3px 3px 0 0', height: '28px', opacity: '.6' }}></div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px' }}>Jan<br/><b style={{ color: '#0d1b4b' }}>29</b></div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ background: '#1565c0', borderRadius: '3px 3px 0 0', height: '26px', opacity: '.7' }}></div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px' }}>Feb<br/><b style={{ color: '#0d1b4b' }}>27</b></div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ background: '#1565c0', borderRadius: '3px 3px 0 0', height: '25px', opacity: '.8' }}></div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px' }}>Mar<br/><b style={{ color: '#0d1b4b' }}>26</b></div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ background: '#1565c0', borderRadius: '3px 3px 0 0', height: '24px', opacity: '.9' }}></div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px' }}>Apr<br/><b style={{ color: '#0d1b4b' }}>25</b></div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ background: '#2e7d32', borderRadius: '3px 3px 0 0', height: '23px' }}></div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px' }}>May<br/><b style={{ color: '#2e7d32' }}>24</b></div>
                </div>
                <div style={{ fontSize: '10px', color: '#6b7280', paddingBottom: '20px' }}>days</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tabs Navigation */}
      <div className="sub-tabbar">
        <button
          className={`sub-tab ${activeTab === 'ar-register' ? 'active' : ''}`}
          onClick={() => selectTab('ar-register')}
        >
          Receivables Register
        </button>
        <button
          className={`sub-tab ${activeTab === 'ar-aging' ? 'active' : ''}`}
          onClick={() => selectTab('ar-aging')}
        >
          AR Aging
        </button>
        <button
          className={`sub-tab ${activeTab === 'ar-statements' ? 'active' : ''}`}
          onClick={() => selectTab('ar-statements')}
        >
          Statements
        </button>
      </div>

      {/* TAB 1: RECEIVABLES REGISTER */}
      {activeTab === 'ar-register' && (
        <div className="tbl-wrap">
          <div className="tbl-hdr">
            <span className="tbl-hdr-title">Receivables Register</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="form-ctrl form-ctrl-sm"
                placeholder="Search invoice or partner…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '220px' }}
              />
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  const csv = "Invoice #,Partner,Amount,Paid,Balance,DueDate,Status\n" +
                    filteredInvoices.map(i => `${i.id},"${i.customer}",${i.amount},${i.paidAmount},${i.amount - i.paidAmount},${i.dueDate},${i.status}`).join("\n");
                  downloadCSV('ar-register.csv', csv);
                  showToast('Exported ar-register.csv', 'success');
                }}
              >
                Export
              </button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Partner / Agent</th>
                <th style={{ textAlign: 'right' }}>Invoice Amt</th>
                <th style={{ textAlign: 'right' }}>Paid</th>
                <th style={{ textAlign: 'right' }}>Balance</th>
                <th>Due Date</th>
                <th>Days Out</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--gray-400)', fontSize: '12.5px' }}>
                    {searchTerm ? 'No invoices match your search.' : 'No invoices to display yet. Use "+ New Invoice" to create one.'}
                  </td>
                </tr>
              ) : filteredInvoices.map(inv => {
                const amt = Number(inv.amount || 0);
                const paid = Number(inv.paidAmount || 0);
                const bal = amt - paid;

                let chipClass = 'chip-blue';
                let statusLabel = inv.status;
                if (bal <= 0) { chipClass = 'chip-green'; statusLabel = 'Paid'; }
                else if (paid > 0) { chipClass = 'chip-orange'; statusLabel = 'Partial'; }
                else if (inv.status === 'Overdue') { chipClass = 'chip-red'; statusLabel = 'Overdue'; }
                else {
                  const dueDate = new Date(inv.dueDate);
                  if (dueDate < new Date()) { chipClass = 'chip-red'; statusLabel = 'Overdue'; }
                  else { chipClass = 'chip-blue'; statusLabel = 'Current'; }
                }

                let daysOut = ' - ';
                if (bal > 0) {
                  const due = new Date(inv.dueDate);
                  const diffDays = Math.ceil((new Date() - due) / (1000 * 60 * 60 * 24));
                  daysOut = diffDays > 0 ? diffDays : ' - ';
                }

                return (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600 }}>{inv.id}</td>
                    <td><b>{inv.customer}</b></td>
                    <td style={{ textAlign: 'right' }}>{fmtM(amt)}</td>
                    <td style={{ textAlign: 'right' }}>{fmtM(paid)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: bal === 0 ? '#2e7d32' : paid > 0 ? '#e65100' : '#c62828' }}>
                      {fmtM(bal)}
                    </td>
                    <td>{inv.dueDate}</td>
                    <td>{daysOut}</td>
                    <td><span className={`chip ${chipClass}`}>{statusLabel}</span></td>
                    <td>
                      {bal > 0 ? (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => setPaymentModal({
                            open: true,
                            invId: inv.id,
                            customer: inv.customer,
                            balance: bal,
                            amount: bal.toFixed(2)
                          })}
                        >
                          Record Pay
                        </button>
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
      )}

      {/* TAB 2: AR AGING */}
      {activeTab === 'ar-aging' && (
        <div className="tbl-wrap">
          <div className="tbl-hdr">
            <span className="tbl-hdr-title">AR Aging Summary by Partner</span>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                const csv = "Partner,0-30 Days,31-60 Days,61-90 Days,90+ Days,Total\n" +
                  agingPartners.map(p => `"${p.name}",${p.a0_30},${p.a31_60},${p.a61_90},${p.a90_plus},${p.total}`).join("\n");
                downloadCSV('ar-aging-summary.csv', csv);
                showToast('Exported ar-aging-summary.csv', 'success');
              }}
            >
              Export
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Partner / Agent</th>
                <th style={{ textAlign: 'right' }}>0–30 Days</th>
                <th style={{ textAlign: 'right' }}>31–60 Days</th>
                <th style={{ textAlign: 'right' }}>61–90 Days</th>
                <th style={{ textAlign: 'right' }}>90+ Days</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {agingPartners.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--gray-400)', fontSize: '12.5px' }}>
                    No outstanding balances to age yet.
                  </td>
                </tr>
              ) : (
                <>
                  {agingPartners.map(p => (
                    <tr key={p.name}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ textAlign: 'right', color: p.a0_30 > 0 ? '#2e7d32' : '#9ca3af' }}>{fmtM(p.a0_30)}</td>
                      <td style={{ textAlign: 'right', color: p.a31_60 > 0 ? '#e65100' : '#9ca3af' }}>{fmtM(p.a31_60)}</td>
                      <td style={{ textAlign: 'right', color: p.a61_90 > 0 ? '#c62828' : '#9ca3af' }}>{fmtM(p.a61_90)}</td>
                      <td style={{ textAlign: 'right', color: p.a90_plus > 0 ? '#6a1b9a' : '#9ca3af' }}>{fmtM(p.a90_plus)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtM(p.total)}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 700, background: '#f8f9fb', borderTop: '2px solid var(--border)' }}>
                    <td style={{ color: 'var(--navy)' }}>Total</td>
                    <td style={{ textAlign: 'right', color: '#2e7d32' }}>{fmtM(agingPartnersTotal.a0_30)}</td>
                    <td style={{ textAlign: 'right', color: '#e65100' }}>{fmtM(agingPartnersTotal.a31_60)}</td>
                    <td style={{ textAlign: 'right', color: '#c62828' }}>{fmtM(agingPartnersTotal.a61_90)}</td>
                    <td style={{ textAlign: 'right', color: '#6a1b9a' }}>{fmtM(agingPartnersTotal.a90_plus)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--navy)' }}>{fmtM(agingPartnersTotal.total)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: STATEMENTS */}
      {activeTab === 'ar-statements' && (
        <div className="tbl-wrap">
          <div className="tbl-hdr">
            <span className="tbl-hdr-title">Account Statements</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => showToast('Statements compiled for all accounts', 'success')}
              >
                Generate All
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => showToast('Statements emailed to all active partners', 'success')}
              >
                Email All
              </button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Partner</th>
                <th>Statement Period</th>
                <th style={{ textAlign: 'right' }}>Opening Balance</th>
                <th style={{ textAlign: 'right' }}>Invoiced</th>
                <th style={{ textAlign: 'right' }}>Payments</th>
                <th style={{ textAlign: 'right' }}>Closing Balance</th>
                <th>Generated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {agingPartners.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--gray-400)', fontSize: '12.5px' }}>
                    No account statements to display yet.
                  </td>
                </tr>
              ) : agingPartners.map(p => (
                <tr key={p.name}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>May 2026</td>
                  <td style={{ textAlign: 'right' }}>$0</td>
                  <td style={{ textAlign: 'right' }}>{fmtM(p.total)}</td>
                  <td style={{ textAlign: 'right', color: '#2e7d32' }}>{fmtM(p.a0_30)}</td>
                  <td style={{ textAlign: 'right', color: p.total - p.a0_30 > 0 ? '#e65100' : '#2e7d32', fontWeight: 700 }}>
                    {fmtM(p.total - p.a0_30)}
                  </td>
                  <td>{new Date().toLocaleDateString('en-US')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ padding: '2px 6px', fontSize: '11px' }}
                        onClick={() => showToast(`Opening statement for ${p.name}`, 'info')}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ padding: '2px 6px', fontSize: '11px' }}
                        onClick={() => showToast(`Account statement sent to ${p.name}`, 'success')}
                      >
                        Email
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AccountsReceivablePage;
