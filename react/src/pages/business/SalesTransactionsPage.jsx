import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';

export function SalesTransactionsPage() {
  const {
    currentAccountingLevel,
    franchiseSharePct,
    setFranchiseSharePct,
    dominosSharePct,
    recordPizzaSale,
    settlePizzaSale,
    getAccountBalance,
    apInvoices
  } = useFinance();

  const { currentUser } = useAuth();

  const [customerName, setCustomerName] = useState('Ayushi');
  const [pizzaItem, setPizzaItem] = useState('Large Pepperoni & Cheese Farmhouse Pizza');
  const [saleAmount, setSaleAmount] = useState(100.00);
  const [pctInput, setPctInput] = useState(String(franchiseSharePct || 70));
  const [pctError, setPctError] = useState(null);
  const [lastTxn, setLastTxn] = useState(null);
  const [settleStatus, setSettleStatus] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleFranchisePctChange = (e) => {
    const val = e.target.value;
    setPctInput(val);
    const num = parseFloat(val);
    if (isNaN(num)) {
      setPctError('Please enter a valid number');
      return;
    }
    if (num < 0 || num > 100) {
      setPctError('Percentage must be between 0% and 100%');
      return;
    }
    setPctError(null);
    try {
      setFranchiseSharePct(num);
    } catch (err) {
      setPctError(err.message);
    }
  };

  const franchiseShareVal = Math.round((saleAmount * (franchiseSharePct / 100)) * 100) / 100;
  const dominosShareVal = Math.round((saleAmount * (dominosSharePct / 100)) * 100) / 100;

  const handleRecordSale = (e) => {
    e.preventDefault();
    if (pctError) {
      showToast('Fix percentage error before recording sale', 'error');
      return;
    }
    try {
      const result = recordPizzaSale({
        customerName,
        pizzaItem,
        saleAmount: parseFloat(saleAmount) || 100.00,
        franchiseEntityId: 'ENT-FRN-01',
        franchiseName: "Domino's Franchise Store #12",
        dominosEntityId: 'ENT-HUB-01',
        dominosName: "Domino's Main Company"
      });
      setLastTxn(result);
      setSettleStatus(null);
      showToast(`Sale of ₹${saleAmount} to ${customerName} recorded! Double-entry JEs posted to both ledgers.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSettle = () => {
    try {
      const res = settlePizzaSale();
      setSettleStatus(res);
      showToast(`Intercompany settlement completed! ₹${dominosShareVal} remitted to Domino's Main Company.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Balances
  const frnCash = getAccountBalance('1001');
  const frnPayable = getAccountBalance('2050');
  const hubReceivable = getAccountBalance('1180');
  const frnSales = getAccountBalance('4500');
  const hubRev = getAccountBalance('4600');

  const pendingBills = apInvoices.filter(b => b.id.startsWith('INV-AP-FRN-SHARE') && b.status !== 'Paid & Cleared');

  return (
    <div className="page-wrap" style={{ padding: '24px 32px' }}>
      {toastMessage && (
        <div className={`veridex-toast veridex-toast-${toastMessage.type}`}>
          <span>{toastMessage.type === 'error' ? '✕' : '✓'}</span>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '22px' }}>🍕</span>
            <h1 className="page-title" style={{ margin: 0 }}>Domino's Pizza Accounting &amp; Revenue Share</h1>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'rgba(249, 115, 22, 0.15)',
              color: '#ea580c',
              border: '1px solid rgba(249, 115, 22, 0.3)'
            }}>
              Customer → Franchise → Domino's Main
            </span>
          </div>
          <div className="page-subtitle">
            Point-of-Sale customer pizza orders, real-time franchise revenue share calculation, intercompany clearing, and general ledger synchronization.
          </div>
        </div>
      </div>

      {/* 3-Tier Distribution Flow Visual Banner */}
      <div style={{
        background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px' }}>👤</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>Customer Ayushi</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Pays ₹{saleAmount} Cash</div>
          </div>
          <div style={{ color: '#ea580c', fontSize: '18px', fontWeight: 700 }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px' }}>🍕</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>Franchise Store #12</div>
            <div style={{ fontSize: '11px', color: '#22c55e' }}>Retains {franchiseSharePct}% (₹{franchiseShareVal})</div>
          </div>
          <div style={{ color: '#ea580c', fontSize: '18px', fontWeight: 700 }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px' }}>🏢</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>Domino's Main Co.</div>
            <div style={{ fontSize: '11px', color: '#38bdf8' }}>Receives {dominosSharePct}% (₹{dominosShareVal})</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pending Remittance
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: pendingBills.length > 0 ? '#f97316' : '#22c55e' }}>
              {pendingBills.length > 0 ? `₹${pendingBills.reduce((s, b) => s + b.amount, 0).toFixed(2)}` : '₹0.00 Cleared'}
            </div>
          </div>

          {pendingBills.length > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSettle}
              style={{
                background: '#ea580c',
                color: '#fff',
                padding: '10px 18px',
                fontWeight: 700,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              💸 Settle &amp; Remit ₹{pendingBills.reduce((s, b) => s + b.amount, 0).toFixed(2)} →
            </button>
          )}
        </div>
      </div>

      {/* Two Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Left Column: Transaction Input & Configuration */}
        <div style={{
          background: 'var(--color-surface, #1e293b)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginTop: 0, marginBottom: '16px' }}>
            Point-of-Sale Order &amp; Share Configuration
          </h2>

          <form onSubmit={handleRecordSale}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Customer Name
              </label>
              <input
                type="text"
                className="input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }}
                required
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Pizza Menu Selection
              </label>
              <input
                type="text"
                className="input"
                value={pizzaItem}
                onChange={(e) => setPizzaItem(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Customer Pays (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  className="input"
                  value={saleAmount}
                  onChange={(e) => setSaleAmount(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Franchise Share % (0%–100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  className="input"
                  value={pctInput}
                  onChange={handleFranchisePctChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#0f172a',
                    border: pctError ? '1px solid #ef4444' : '1px solid #334155',
                    color: '#fff'
                  }}
                  required
                />
                {pctError && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                    {pctError}
                  </div>
                )}
              </div>
            </div>

            {/* Live Calculation Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '8px',
              marginBottom: '18px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Franchise Retains ({franchiseSharePct}%):</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#22c55e' }}>₹{franchiseShareVal.toFixed(2)}</div>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>Store Operating Profit</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Domino's Receives ({dominosSharePct}%):</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8' }}>₹{dominosShareVal.toFixed(2)}</div>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>Main Co. Revenue Share</div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 700,
                background: '#ea580c',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#fff'
              }}
            >
              🍕 Record ₹{saleAmount} Customer Sale &amp; Post Double-Entry JEs →
            </button>
          </form>
        </div>

        {/* Right Column: Live General Ledger Summary */}
        <div style={{
          background: 'var(--color-surface, #1e293b)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginTop: 0, marginBottom: '16px' }}>
            Live General Ledger Positions (₹)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>Franchise Cash / Bank (1001)</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Ending cash in Store #12</div>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>
                ₹{frnCash.net >= 0 ? frnCash.net.toLocaleString() : `(${Math.abs(frnCash.net).toLocaleString()})`}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>Pizza Sales Revenue (4500)</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Gross customer revenue</div>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8' }}>
                ₹{frnSales.credit.toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>Due to Domino's Main (2050)</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Intercompany payable</div>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: frnPayable.credit > frnPayable.debit ? '#ea580c' : '#22c55e' }}>
                ₹{(frnPayable.credit - frnPayable.debit).toFixed(2)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>Due from Franchise (1180)</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Domino's intercompany receivable</div>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: hubReceivable.debit > hubReceivable.credit ? '#ea580c' : '#22c55e' }}>
                ₹{(hubReceivable.debit - hubReceivable.credit).toFixed(2)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>Franchise Share Income (4600)</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Domino's Main recognized income</div>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8' }}>
                ₹{hubRev.credit.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '16px',
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            fontSize: '11.5px',
            color: '#86efac',
            lineHeight: 1.5
          }}>
            ✓ Fully balanced double-entry accounting. When settlement occurs, Due to/from clears to ₹0.00 while Cash and Income balances persist permanently on each entity's book.
          </div>
        </div>
      </div>
    </div>
  );
}
