import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { DIMENSION_MAP } from '../../data/mockAccounts';

const PIZZA_ACCOUNT_NAMES = {
  '1001': 'Cash / Bank',
  '1002': 'Franchise Operating Bank Account',
  '1100': 'Accounts Receivable (A/R)',
  '1180': 'Due from Stores (Intercompany Receivable)',
  '1500': 'Raw Material Inventory',
  '2001': 'Accounts Payable (A/P)',
  '2050': 'Due to Main Hub (Intercompany Payable)',
  '3100': 'Common Stock / Capital',
  '3200': 'Retained Earnings',
  '4500': 'Franchise Pizza Revenue',
  '4600': 'Main Hub Pizza Revenue',
  '5300': 'Revenue Share Expense',
  '5400': 'Store Operating Expenses',
  '5500': 'General & Administrative Expenses'
};

export function JournalEntryPage() {
  const { journalEntries, entityJournalEntries, postJournalEntry, addJournalEntry, accounts, currentAccountingLevel } = useFinance();

  const [activeTab, setActiveTab] = useState('recent'); // 'recent' or 'history'
  const [searchTerm, setSearchTerm] = useState('');

  // Dimension filters matching screenshot 1
  const [filterLocation, setFilterLocation] = useState('');
  const [filterCostCenter, setFilterCostCenter] = useState('');
  const [filterBroker, setFilterBroker] = useState('');
  const [filterMGA, setFilterMGA] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterLOB, setFilterLOB] = useState('');
  const [filterTreaty, setFilterTreaty] = useState('');
  const [filterCarrier, setFilterCarrier] = useState('');
  const [filterReinsurer, setFilterReinsurer] = useState('');

  // Modals
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Manual JE form state
  const [manualDate, setManualDate] = useState('2026-08-20');
  const [manualDesc, setManualDesc] = useState('');
  const [manualLines, setManualLines] = useState([
    { acct: '1100', debit: '36760.00', credit: '0.00', desc: 'Premium Receivable' },
    { acct: '2200', debit: '0.00', credit: '29757.00', desc: 'Premium Payable' },
    { acct: '2300', debit: '0.00', credit: '3503.00', desc: 'Surplus Lines Tax' },
    { acct: '4100', debit: '0.00', credit: '3500.00', desc: 'MGA Override Revenue' }
  ]);

  // Bulk Upload History state
  const [bulkUploads, setBulkUploads] = useState([
    {
      id: 'UPL-2026-0820',
      fileName: 'MGA_Settlement_Accruals_August.xlsx',
      uploadedBy: 'Jordan Blake (Controller)',
      dateTime: '20/08/2026 09:15',
      status: 'Processed',
      rows: 4
    },
    {
      id: 'UPL-2026-0815',
      fileName: 'Treaty_Cessions_Q3_StarlightRe.csv',
      uploadedBy: 'Jordan Blake (Controller)',
      dateTime: '15/08/2026 14:30',
      status: 'Processed',
      rows: 2
    }
  ]);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const clearAllFilters = () => {
    setFilterLocation('');
    setFilterCostCenter('');
    setFilterBroker('');
    setFilterMGA('');
    setFilterState('');
    setFilterLOB('');
    setFilterTreaty('');
    setFilterCarrier('');
    setFilterReinsurer('');
    setSearchTerm('');
  };

  const filteredEntries = useMemo(() => {
    return entityJournalEntries.filter(je => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const inId = (je.id || je.number || '').toLowerCase().includes(q);
        const inDesc = (je.description || '').toLowerCase();
        if (!inId && !inDesc.includes(q)) return false;
      }
      return true;
    });
  }, [entityJournalEntries, searchTerm]);

  const handlePost = (id) => {
    postJournalEntry(id);
    showToast(`Journal entry ${id} successfully posted to General Ledger!`);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const dr = manualLines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
    const cr = manualLines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
    if (Math.abs(dr - cr) > 0.01) {
      showToast(`Entry is out of balance: Debits ($${dr.toFixed(2)}) must equal Credits ($${cr.toFixed(2)})`, 'error');
      return;
    }
    if (!manualDesc.trim()) {
      showToast('Enter a description', 'error');
      return;
    }
    const newJe = addJournalEntry({
      date: manualDate,
      description: manualDesc,
      status: 'posted',
      lines: manualLines.map(l => ({
        accountCode: l.acct,
        acct: l.acct,
        debit: parseFloat(l.debit) || 0,
        credit: parseFloat(l.credit) || 0,
        desc: l.desc
      }))
    });
    setIsManualModalOpen(false);
    setManualDesc('');
    showToast(`Created & posted ${newJe.id} to ledger`);
  };

  const exportCSV = () => {
    const headers = ['Journal No.', 'Date', 'Description', 'Debit ($)', 'Credit ($)', 'Status'];
    const rows = filteredEntries.map(je => {
      const dr = (je.lines || []).reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
      const cr = (je.lines || []).reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
      return [
        je.id || je.number,
        je.date,
        `"${je.description}"`,
        dr.toFixed(2),
        cr.toFixed(2),
        je.status.toUpperCase()
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = 'recent-journal-entries.csv';
    link.click();
    showToast('Exported recent journal entries', 'success');
  };

  const formatDateUK = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.slice(0, 10).split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="je-workspace">
      {toastMessage && (
        <div className={`veridex-toast veridex-toast-${toastMessage.type}`}>
          <span>{toastMessage.type === 'error' ? '✕' : '✓'}</span>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Top Header & Mode Switch */}
      <div className="je-ws-top">
        <div className="je-ws-title-row">
          <h1 className="je-ws-title">Journal Entry Workspace</h1>
        </div>
        <div className="je-ws-mode-switch">
          <button
            type="button"
            className="je-mode-btn"
            onClick={() => setIsManualModalOpen(true)}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
              <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
              <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
              <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            Manual Entry
          </button>
          <button
            type="button"
            className="je-mode-btn active"
            onClick={() => setIsBulkModalOpen(true)}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v8M5 9l3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Bulk Upload
          </button>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="page-tabs" id="je-workspace-tabs" style={{ margin: '20px 0 16px' }}>
        <button
          className={`page-tab ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          Recent Journal Entries
        </button>
        <button
          className={`page-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Bulk Upload History
        </button>
      </div>

      {/* TAB PANEL: Recent Journal Entries */}
      {activeTab === 'recent' && (
        <div className="tab-panel active">
          {/* Dimension Filter Bar matching Screenshot 1 */}
          <div className="filter-bar" id="je-dimension-filter-bar" style={{ marginTop: 0, marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <span className="filter-bar-label">Filter by dimension:</span>
            <select className="filter-select" value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
              <option value="">All Location / Department</option>
              <option value="HQ">HQ</option>
              <option value="Dallas">Branch - Dallas</option>
              <option value="Chicago">Branch - Chicago</option>
            </select>
            <select className="filter-select" value={filterCostCenter} onChange={e => setFilterCostCenter(e.target.value)}>
              <option value="">All Cost Centre</option>
              <option value="00">00 - Corporate</option>
              <option value="10">10 - Plant A</option>
              <option value="20">20 - Wholesale DC</option>
            </select>
            <select className="filter-select" value={filterBroker} onChange={e => setFilterBroker(e.target.value)}>
              <option value="">All Broker / Producer</option>
              <option value="HIT">HIT Agency Group</option>
              <option value="Links">Links Insurance Agency</option>
            </select>
            <select className="filter-select" value={filterMGA} onChange={e => setFilterMGA(e.target.value)}>
              <option value="">All MGA</option>
              <option value="NTA">NTA Program Administrators</option>
              <option value="FUT">FUT - Futuristic</option>
            </select>
            <select className="filter-select" value={filterState} onChange={e => setFilterState(e.target.value)}>
              <option value="">All State / Jurisdiction</option>
              <option value="TX">Texas (TX)</option>
              <option value="CA">California (CA)</option>
              <option value="FL">Florida (FL)</option>
            </select>
            <select className="filter-select" value={filterLOB} onChange={e => setFilterLOB(e.target.value)}>
              <option value="">All Line of Business (LOB)</option>
              <option value="Commercial Trucking">Commercial Trucking</option>
              <option value="General Liability">General Liability</option>
              <option value="Property">Property</option>
            </select>
            <select className="filter-select" value={filterTreaty} onChange={e => setFilterTreaty(e.target.value)}>
              <option value="">All Treaty / Program</option>
              <option value="QS-2026-01">QS-2026-01 (Starlight Re)</option>
              <option value="XL-2026-02">XL-2026-02 (Starlight Re)</option>
            </select>
            <select className="filter-select" value={filterCarrier} onChange={e => setFilterCarrier(e.target.value)}>
              <option value="">All Carrier</option>
              <option value="Southlake">Southlake Insurance Co.</option>
            </select>
            <select className="filter-select" value={filterReinsurer} onChange={e => setFilterReinsurer(e.target.value)}>
              <option value="">All Reinsurer</option>
              <option value="Starlight">Starlight Re</option>
              <option value="Everest">Everest Re</option>
            </select>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={clearAllFilters}
              style={{ color: 'var(--coral, #F97316)', fontWeight: 600, padding: '0 8px' }}
            >
              Clear
            </button>
          </div>

          {/* Table Wrap */}
          <div className="table-wrap">
            <div className="table-head-row">
              <div className="table-head-title">Recent Journal Entries</div>
              <div className="table-head-actions">
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '200px' }}
                />
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={exportCSV}
                >
                  Export
                </button>
              </div>
            </div>

            <table className="data-table" id="recent-je-table">
              <thead>
                <tr>
                  <th style={{ width: '38px' }}><input type="checkbox" className="table-check" /></th>
                  <th>JOURNAL NO.</th>
                  <th>DATE</th>
                  <th>DESCRIPTION</th>
                  <th style={{ textAlign: 'right' }}>DEBIT ($)</th>
                  <th style={{ textAlign: 'right' }}>CREDIT ($)</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody id="recent-je-tbody">
                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'var(--gray-400, #9CA3AF)', padding: '20px' }}>
                      {entityJournalEntries.length === 0
                        ? 'No journal entries yet on this book. Create one with Manual Entry or Bulk Upload.'
                        : 'No journal entries match these filters.'}
                    </td>
                  </tr>
                )}
                {filteredEntries.map((je) => {
                  const debitTotal = (je.lines || []).reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
                  const creditTotal = (je.lines || []).reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
                  const isDraft = (je.status || '').toLowerCase() === 'draft';

                  return (
                    <tr key={je.id}>
                      <td><input type="checkbox" className="table-check" /></td>
                      <td
                        className="cell-link"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedEntry(je)}
                      >
                        {je.number || je.id}
                      </td>
                      <td>{formatDateUK(je.date)}</td>
                      <td>{je.description}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {debitTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {creditTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`badge ${isDraft ? 'badge-gray' : 'badge-green'}`}>
                          {(je.status || 'posted').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {isDraft ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handlePost(je.id)}
                            style={{ padding: '2px 14px', fontSize: '11.5px', fontWeight: 600 }}
                          >
                            Post
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSelectedEntry(je)}
                          >
                            View
                          </button>
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

      {/* TAB PANEL: Bulk Upload History */}
      {activeTab === 'history' && (
        <div className="tab-panel active">
          <div className="table-wrap">
            <div className="table-head-row">
              <div className="table-head-title">Uploaded Files</div>
              <div className="table-head-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={exportCSV}>
                  Export
                </button>
              </div>
            </div>
            <table className="data-table" id="bulk-uploads-table">
              <thead>
                <tr>
                  <th>Upload ID</th>
                  <th>File Name</th>
                  <th>Uploaded By</th>
                  <th>Date &amp; Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bulkUploads.map((u) => (
                  <tr key={u.id}>
                    <td className="font-semibold">{u.id}</td>
                    <td>{u.fileName}</td>
                    <td>{u.uploadedBy}</td>
                    <td style={{ color: 'var(--color-muted)' }}>{u.dateTime}</td>
                    <td><span className="badge badge-green">{u.status}</span></td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => showToast(`Opening batch file ${u.fileName}`, 'info')}
                      >
                        View Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsBulkModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '10px',
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="sl-modal-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Bulk Upload Journal Entries</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsBulkModalOpen(false)}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div
                style={{
                  border: '2px dashed var(--gray-300, #D1D5DB)',
                  borderRadius: '12px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: 'var(--gray-50, #F9FAFB)',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.csv,.xlsx,.xls';
                  input.onchange = (e) => {
                    if (e.target.files && e.target.files[0]) {
                      showToast(`Selected ${e.target.files[0].name}. Ready for processing.`);
                    }
                  };
                  input.click();
                }}
              >
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>📁</div>
                <div style={{ fontSize: '13.5px', color: 'var(--gray-700, #374151)', lineHeight: 1.5 }}>
                  Drag and Drop your journal file or<br />
                  <span style={{ color: 'var(--coral, #F97316)', fontWeight: 600 }}>Browse file</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--gray-400, #9CA3AF)', marginTop: '8px' }}>
                  Supported formats: CSV, XLS, XLSX · Max 10MB
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setIsBulkModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  showToast('Bulk journal entries batch processed and uploaded.', 'success');
                }}
              >
                Upload &amp; Process
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {isManualModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsManualModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '10px',
              maxWidth: '780px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>New Manual Journal Entry</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsManualModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleManualSubmit} style={{ padding: '20px', overflowY: 'auto' }}>
              <div className="form-grid-3" style={{ marginBottom: '16px' }}>
                <div>
                  <label className="field-label">Date *</label>
                  <input
                    className="field-input"
                    type="date"
                    value={manualDate}
                    onChange={e => setManualDate(e.target.value)}
                    required
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="field-label">Description *</label>
                  <input
                    className="field-input"
                    placeholder="e.g. Endorsement premium adjustment for POL-V8NHT"
                    value={manualDesc}
                    onChange={e => setManualDesc(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>Line Items</div>
              <table className="data-table" style={{ marginBottom: '16px' }}>
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Line Memo</th>
                    <th style={{ textAlign: 'right', width: '130px' }}>Debit</th>
                    <th style={{ textAlign: 'right', width: '130px' }}>Credit</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {manualLines.map((l, idx) => (
                    <tr key={idx}>
                      <td>
                        <select
                          className="field-input"
                          style={{ height: '32px', fontSize: '12px' }}
                          value={l.acct}
                          onChange={e => {
                            const updated = [...manualLines];
                            updated[idx].acct = e.target.value;
                            setManualLines(updated);
                          }}
                        >
                          {accounts.map(a => (
                            <option key={a.code} value={a.code}>
                              {a.code} - {a.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          className="field-input"
                          style={{ height: '32px', fontSize: '12px' }}
                          value={l.desc}
                          onChange={e => {
                            const updated = [...manualLines];
                            updated[idx].desc = e.target.value;
                            setManualLines(updated);
                          }}
                        />
                      </td>
                      <td>
                        <input
                          className="field-input"
                          type="number"
                          step="0.01"
                          style={{ height: '32px', fontSize: '12px', textAlign: 'right' }}
                          value={l.debit}
                          onChange={e => {
                            const updated = [...manualLines];
                            updated[idx].debit = e.target.value;
                            setManualLines(updated);
                          }}
                        />
                      </td>
                      <td>
                        <input
                          className="field-input"
                          type="number"
                          step="0.01"
                          style={{ height: '32px', fontSize: '12px', textAlign: 'right' }}
                          value={l.credit}
                          onChange={e => {
                            const updated = [...manualLines];
                            updated[idx].credit = e.target.value;
                            setManualLines(updated);
                          }}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--red, #DC2626)' }}
                          onClick={() => {
                            if (manualLines.length <= 2) {
                              showToast('A balanced journal entry requires at least 2 lines', 'error');
                              return;
                            }
                            setManualLines(manualLines.filter((_, i) => i !== idx));
                          }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setManualLines([...manualLines, { acct: '1001', debit: '0.00', credit: '0.00', desc: '' }])}
                >
                  + Add Line
                </button>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>
                  Total Debits: ${manualLines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0).toFixed(2)} | Credits: ${manualLines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0).toFixed(2)}
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setIsManualModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save &amp; Post to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Journal Entry Detail Modal */}
      {selectedEntry && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedEntry(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  Journal Entry: {selectedEntry.number || selectedEntry.id}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '3px' }}>
                  {selectedEntry.description} &middot; Date: {formatDateUK(selectedEntry.date)}
                </div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedEntry(null)}>✕</button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Account Name</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Debit ($)</th>
                    <th style={{ textAlign: 'right' }}>Credit ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedEntry.lines || []).map((l, i) => {
                    const code = l.accountCode || l.acct;
                    const matchedAcct = accounts.find(a => a.code === code);
                    const isPizzaMode = selectedEntry.accountingLevel === 'pizza' || currentAccountingLevel === 'pizza';

                    let lineName = l.accountName;
                    if (isPizzaMode) {
                      if (!lineName || lineName === '—' || lineName.toLowerCase().includes('premium')) {
                        lineName = PIZZA_ACCOUNT_NAMES[code] || matchedAcct?.name || '—';
                      }
                    } else {
                      lineName = matchedAcct ? matchedAcct.name : (lineName || '—');
                    }

                    return (
                      <tr key={i}>
                        <td className="cell-link">{code}</td>
                        <td>{lineName}</td>
                        <td>{l.desc || l.description || selectedEntry.description}</td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {l.debit > 0 ? parseFloat(l.debit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {l.credit > 0 ? parseFloat(l.credit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                    <td colSpan="3" style={{ textAlign: 'right' }}>Totals</td>
                    <td style={{ textAlign: 'right' }}>
                      {(selectedEntry.lines || []).reduce((s, l) => s + (parseFloat(l.debit) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {(selectedEntry.lines || []).reduce((s, l) => s + (parseFloat(l.credit) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedEntry(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
