import React, { useState, useMemo } from 'react';

const INITIAL_ASSETS = [
  { tag: 'FA-1001', desc: 'CNC Sheet Metal Press', category: 'Machinery & Equipment', acquired: '03/15/2021', cost: 420000, method: 'Straight-Line', methodBadge: 'badge-navy', life: '10 yrs', accumDep: 210000, nbv: 210000, status: 'In Use', statusBadge: 'badge-green' },
  { tag: 'FA-1014', desc: 'Fleet Delivery Truck - Ford F-650', category: 'Vehicles', acquired: '06/01/2023', cost: 86000, method: 'Declining Balance (20%)', methodBadge: 'badge-orange', life: '5 yrs', accumDep: 30960, nbv: 55040, status: 'In Use', statusBadge: 'badge-green' },
  { tag: 'FA-1027', desc: 'Server Rack - ERP Data Center', category: 'IT Equipment', acquired: '01/10/2024', cost: 96500, method: 'Double Declining', methodBadge: 'badge-orange', life: '5 yrs', accumDep: 38600, nbv: 57900, status: 'In Use', statusBadge: 'badge-green' },
  { tag: 'FA-1033', desc: 'Injection Molding Machine', category: 'Machinery & Equipment', acquired: '09/22/2022', cost: 310000, method: 'Sum-of-Years-Digits', methodBadge: 'badge-orange', life: '8 yrs', accumDep: 120972, nbv: 189028, status: 'In Use', statusBadge: 'badge-green' },
  { tag: 'FA-1041', desc: 'Assembly Line Robotics Arm', category: 'Machinery & Equipment', acquired: '02/14/2023', cost: 248000, method: 'Units of Production', methodBadge: 'badge-orange', life: '500,000 units', accumDep: 86800, nbv: 161200, status: 'In Use', statusBadge: 'badge-green' },
  { tag: 'FA-1052', desc: 'Workstation & Laptop Refresh - Finance Dept.', category: 'IT Equipment', acquired: '04/01/2025', cost: 64200, method: 'MACRS 5-Year', methodBadge: 'badge-orange', life: '5 yrs (IRS)', accumDep: 12840, nbv: 51360, status: 'In Use', statusBadge: 'badge-green' },
  { tag: 'FA-1002', desc: 'Plant Warehouse Addition - Bldg C', category: 'Buildings', acquired: '07/01/2019', cost: 1850000, method: 'MACRS 7-Year', methodBadge: 'badge-orange', life: '7 yrs (IRS)', accumDep: 1320714, nbv: 529286, status: 'In Use', statusBadge: 'badge-green' },
  { tag: 'FA-0918', desc: 'Corporate Office Furniture Set', category: 'Furniture & Fixtures', acquired: '05/12/2018', cost: 42000, method: 'Straight-Line', methodBadge: 'badge-navy', life: '7 yrs', accumDep: 42000, nbv: 0, status: 'Disposed', statusBadge: 'badge-gray' },
  { tag: 'FA-0975', desc: 'Legacy Stamping Press (Retired Line)', category: 'Machinery & Equipment', acquired: '11/03/2016', cost: 180000, method: 'Declining Balance (15%)', methodBadge: 'badge-orange', life: '10 yrs', accumDep: 142600, nbv: 37400, status: 'Impaired', statusBadge: 'badge-red' },
];

export function FixedAssetsPage() {
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  
  // Disposal Panel
  const [disposeTarget, setDisposeTarget] = useState(null);
  const [disposeDate, setDisposeDate] = useState('2026-08-20');
  const [disposeMethod, setDisposeMethod] = useState('Sale');
  const [disposeProceeds, setDisposeProceeds] = useState('$0.00');

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const totalCost = 8642000;
  const accumDep = useMemo(() => {
    return assets.reduce((sum, a) => sum + a.accumDep, 0) + 1212474; // baseline + active
  }, [assets]);

  const nbvTotal = useMemo(() => {
    return totalCost - accumDep;
  }, [accumDep]);

  const filteredAssets = useMemo(() => {
    const q = search.toLowerCase();
    return assets.filter(a => {
      if (categoryFilter && a.category !== categoryFilter) return false;
      if (methodFilter && !a.method.includes(methodFilter)) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      if (q && !a.tag.toLowerCase().includes(q) && !a.desc.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [assets, categoryFilter, methodFilter, statusFilter, search]);

  // Filtered Totals for Footer Reconciliation
  const filteredTotals = useMemo(() => {
    return filteredAssets.reduce(
      (acc, a) => {
        acc.cost += a.cost || 0;
        acc.accumDep += a.accumDep || 0;
        acc.nbv += a.nbv || 0;
        return acc;
      },
      { cost: 0, accumDep: 0, nbv: 0 }
    );
  }, [filteredAssets]);

  // Export CSV Action
  const handleExportCsv = () => {
    let csv = 'Asset Tag,Description,Category,Acquired Date,Cost ($),Depreciation Method,Useful Life,Accumulated Depreciation ($),Net Book Value ($),Status\n';
    filteredAssets.forEach(a => {
      csv += `"${a.tag}","${a.desc}","${a.category}","${a.acquired}",${a.cost},"${a.method}","${a.life}",${a.accumDep},${a.nbv},"${a.status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fixed_assets_register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Asset register CSV downloaded successfully!', 'success');
  };

  // Helper for clean method pill styling
  const getMethodBadge = (method) => {
    if (method.includes('Straight-Line')) {
      return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    }
    if (method.includes('Declining')) {
      return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
    }
    if (method.includes('Sum-of-Years')) {
      return { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' };
    }
    if (method.includes('Units')) {
      return { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' };
    }
    if (method.includes('MACRS')) {
      return { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' };
    }
    return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
  };

  // Helper for clean status pill styling
  const getStatusBadge = (status) => {
    if (status === 'In Use') {
      return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', dot: '#16a34a' };
    }
    if (status === 'Disposed') {
      return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', dot: '#94a3b8' };
    }
    if (status === 'Impaired') {
      return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', dot: '#dc2626' };
    }
    return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', dot: '#64748b' };
  };

  const handleRunDepreciation = () => {
    showToast('Running scheduled depreciation batch for August 2026...', 'info');
    setTimeout(() => {
      setAssets(prev => prev.map(a => {
        if (a.tag === 'FA-1001' && a.status === 'In Use') {
          const monthlyDep = 3500;
          return {
            ...a,
            accumDep: a.accumDep + monthlyDep,
            nbv: Math.max(0, a.nbv - monthlyDep)
          };
        }
        return a;
      }));
      showToast('Depreciation posted - FA-1001 NBV reduced by $3,500', 'success');
    }, 800);
  };

  const handleConfirmDisposal = () => {
    if (!disposeTarget) return;
    setAssets(prev => prev.map(a => {
      if (a.tag === disposeTarget.tag) {
        return { ...a, status: 'Disposed', statusBadge: 'badge-gray', nbv: 0 };
      }
      return a;
    }));
    showToast(`${disposeTarget.tag} disposed - proceeds ${disposeProceeds} recorded, gain/loss posted to GL`, 'success');
    setDisposeTarget(null);
  };

  return (
    <>
      {toast && (
        <div className={`veridex-toast veridex-toast-${toast.type}`}>
          <span>{toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠️' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ═══ PAGE HEADER ═══ */}
      <div className="page-header">
        <div>
          <div className="page-title">Fixed Assets</div>
          <div className="page-subtitle">
            Asset register, depreciation methods (Straight-Line, Declining Balance, MACRS, and more), and disposals
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => showToast('Exporting asset register...', 'info')}>
            Export
          </button>
          <button className="btn btn-primary" onClick={() => showToast('New asset form opened', 'info')}>
            + New Asset
          </button>
        </div>
      </div>

      {/* ═══ STATS ROW ═══ */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon si-navy">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="6" width="14" height="9" rx="1" stroke="#102a2e" strokeWidth="1.5"/>
              <path d="M6 6V4a4 4 0 0 1 8 0v2" stroke="#102a2e" strokeWidth="1.4"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">${totalCost.toLocaleString()}</div>
            <div className="stat-label">Total Asset Cost</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-orange">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 5v6M10 14v1" stroke="#e65100" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="10" cy="10" r="7.5" stroke="#e65100" strokeWidth="1.4"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">${accumDep.toLocaleString()}</div>
            <div className="stat-label">Accumulated Depreciation</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-green">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 12l4-5 3 3 6-7" stroke="#2e7d32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">${nbvTotal.toLocaleString()}</div>
            <div className="stat-label">Net Book Value</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-coral">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3v14M3 10h14" stroke="#c9791f" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">14</div>
            <div className="stat-label">Assets Added This Year</div>
          </div>
        </div>
      </div>

      {/* ═══ FILTERS ═══ */}
      <div className="filter-bar">
        <span className="filter-bar-label">Filters:</span>
        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Machinery & Equipment">Machinery &amp; Equipment</option>
          <option value="Vehicles">Vehicles</option>
          <option value="Buildings">Buildings</option>
          <option value="Furniture & Fixtures">Furniture &amp; Fixtures</option>
          <option value="IT Equipment">IT Equipment</option>
        </select>
        <select
          className="filter-select"
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
        >
          <option value="">All Depreciation Methods</option>
          <option value="Straight-Line">Straight-Line</option>
          <option value="Declining Balance">Declining Balance</option>
          <option value="Double Declining">Double Declining Balance</option>
          <option value="Sum-of-Years-Digits">Sum-of-Years-Digits</option>
          <option value="Units of Production">Units of Production</option>
          <option value="MACRS">MACRS</option>
        </select>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="In Use">In Use</option>
          <option value="Disposed">Disposed</option>
          <option value="Impaired">Impaired</option>
        </select>
        <div className="filter-spacer"></div>
        <input
          type="text"
          className="filter-input"
          placeholder="Search asset tag, description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '220px' }}
        />
      </div>

      {/* ═══ ASSET REGISTER CARD & TABLE ═══ */}
      <div
        className="table-wrap"
        style={{
          background: '#ffffff',
          border: '1.5px solid var(--gray-200, #e2e8f0)',
          borderRadius: '12px',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          marginBottom: '28px'
        }}
      >
        {/* Table Card Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1.5px solid #e2e8f0',
            background: '#ffffff',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🏷️</span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--navy, #0d1b4b)', letterSpacing: '-0.2px' }}>
                Asset Register
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#eff6ff',
                  color: '#0284c7',
                  border: '1px solid #bfdbfe'
                }}
              >
                {filteredAssets.length} Assets
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Capitalized equipment, vehicles, real estate, and IT assets with active depreciation schedules
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleExportCsv}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                borderColor: '#cbd5e1',
                padding: '6px 12px',
                borderRadius: '6px'
              }}
            >
              <span>📥</span> Export CSV
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleRunDepreciation}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ea580c, #c2410c)',
                border: 'none',
                color: '#ffffff',
                padding: '7px 16px',
                borderRadius: '6px',
                boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)',
                cursor: 'pointer'
              }}
            >
              <span>⚡</span> Run Depreciation
            </button>
          </div>
        </div>

        {/* Dedicated Horizontal Scroll Container (prevents text clipping & squishing) */}
        <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
          <table
            className="data-table"
            style={{
              width: '100%',
              minWidth: '1220px',
              borderCollapse: 'collapse',
              fontSize: '12.5px'
            }}
          >
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '12px 16px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '110px', whiteSpace: 'nowrap' }}>Asset Tag</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: '240px' }}>Description</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: '160px', whiteSpace: 'nowrap' }}>Category</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '110px', whiteSpace: 'nowrap' }}>Acquired</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '120px', whiteSpace: 'nowrap' }}>Cost</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: '180px', whiteSpace: 'nowrap' }}>Method</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '110px', whiteSpace: 'nowrap' }}>Useful Life</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '120px', whiteSpace: 'nowrap' }}>Accum. Dep.</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '130px', whiteSpace: 'nowrap' }}>Net Book Value</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '110px', whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '110px', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔍</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>No fixed assets found</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      Try adjusting your category, depreciation method, or search query.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((a) => {
                  const methodStyle = getMethodBadge(a.method);
                  const statusStyle = getStatusBadge(a.status);

                  return (
                    <tr
                      key={a.tag}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* Asset Tag */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            fontSize: '12px',
                            fontWeight: 700,
                            background: '#f1f5f9',
                            color: '#1e293b',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          {a.tag}
                        </span>
                      </td>

                      {/* Description */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>
                          {a.desc}
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontSize: '11.5px',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            color: '#334155',
                            fontWeight: 600
                          }}
                        >
                          {a.category}
                        </span>
                      </td>

                      {/* Acquired */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#475569', fontSize: '12px' }}>
                        {a.acquired}
                      </td>

                      {/* Cost */}
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        ${a.cost.toLocaleString()}
                      </td>

                      {/* Method */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: '4px',
                            background: methodStyle.bg,
                            color: methodStyle.color,
                            border: `1px solid ${methodStyle.border}`,
                            letterSpacing: '0.2px'
                          }}
                        >
                          {a.method}
                        </span>
                      </td>

                      {/* Useful Life */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#475569', fontSize: '12px' }}>
                        {a.life}
                      </td>

                      {/* Accum. Dep. */}
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        ${a.accumDep.toLocaleString()}
                      </td>

                      {/* Net Book Value */}
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: a.nbv === 0 ? '#94a3b8' : '#0369a1', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        ${a.nbv.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: '12px',
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <span style={{ fontSize: '9px', color: statusStyle.dot }}>●</span>
                          {a.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {a.status !== 'Disposed' ? (
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => setDisposeTarget(a)}
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 600,
                              padding: '4px 11px',
                              background: '#fff7ed',
                              border: '1px solid #fed7aa',
                              color: '#ea580c',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>🗑️</span> Dispose
                          </button>
                        ) : (
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 600,
                              padding: '4px 11px',
                              background: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              color: '#94a3b8',
                              borderRadius: '5px'
                            }}
                          >
                            Disposed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredAssets.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: 700, color: '#0f172a' }}>
                  <td colSpan="4" style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155' }}>
                      Total Filtered Portfolio ({filteredAssets.length} Assets)
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 800 }}>
                    ${filteredTotals.cost.toLocaleString()}
                  </td>
                  <td colSpan="2" style={{ padding: '13px 14px' }}></td>
                  <td style={{ padding: '13px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 800, color: '#64748b' }}>
                    ${filteredTotals.accumDep.toLocaleString()}
                  </td>
                  <td style={{ padding: '13px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 800, color: '#0369a1' }}>
                    ${filteredTotals.nbv.toLocaleString()}
                  </td>
                  <td colSpan="2" style={{ padding: '13px 16px' }}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ═══ MODAL: ASSET DISPOSAL ═══ */}
      {disposeTarget && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--navy, #0d1b4b)' }}>
                  Dispose Capital Asset
                </h3>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                  {disposeTarget.tag} — {disposeTarget.desc}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDisposeTarget(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Original Cost</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>${disposeTarget.cost.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Accum. Depr.</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', marginTop: '2px' }}>${disposeTarget.accumDep.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Current NBV</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>${disposeTarget.nbv.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', marginBottom: '20px' }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="field-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Disposal Date
                </label>
                <input
                  type="date"
                  className="field-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  value={disposeDate}
                  onChange={(e) => setDisposeDate(e.target.value)}
                />
              </div>

              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="field-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Disposal Method
                </label>
                <select
                  className="field-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  value={disposeMethod}
                  onChange={(e) => setDisposeMethod(e.target.value)}
                >
                  <option value="Sale">Sale (Proceeds to Cash)</option>
                  <option value="Scrap">Scrap (Write-off Remaining NBV)</option>
                  <option value="Trade-In">Trade-In (Exchange for New Asset)</option>
                  <option value="Write-Off">Write-Off (Impairment / Loss)</option>
                </select>
              </div>

              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="field-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Disposal Proceeds ($)
                </label>
                <input
                  type="text"
                  className="field-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  placeholder="$0.00"
                  value={disposeProceeds}
                  onChange={(e) => setDisposeProceeds(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}
                onClick={() => setDisposeTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#ea580c', color: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}
                onClick={handleConfirmDisposal}
              >
                Confirm Disposal &amp; Post to GL
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default FixedAssetsPage;
