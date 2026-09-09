import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useFinance } from '../../context/FinanceContext';
import api from '../../services/api';
import { NAV_CONFIG } from '../../data/navigation';
import {
  SearchIcon,
  BellIcon,
  DensityIcon,
  ChevronIcon
} from '../common/Icons';

function entityAvatarEmoji(businessType) {
  switch (businessType) {
    case 'hub': return '🏢';
    case 'franchise': return '🍕';
    case 'ownstore': return '🏪';
    case 'customer': return '👤';
    case 'carrier': return '🛡️';
    case 'agency':
    case 'broker': return '🏢';
    default: return '📙';
  }
}

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, activeEntity, switchRole, allUsers, logout, accountingLevel, setAccountingLevel } = useAuth();
  const bType = currentUser?.businessType || activeEntity?.businessType || 'mga';
  const {
    currentTheme,
    changeTheme,
    density,
    applyDensity,
    scale,
    applyScale,
    stepScale,
    resetDensityDefaults,
    isZebra,
    toggleZebra,
    isGrid,
    toggleGrid,
    showGlSimulation,
    toggleGlSimulation
  } = useTheme();

  const { isDbConnected, dbInfo, syncWithBackend, clearAllData } = useFinance();
  const [isDensityOpen, setIsDensityOpen] = useState(false);
  const [isEntityOpen, setIsEntityOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [isDbMenuOpen, setIsDbMenuOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const densityRef = useRef(null);
  const entityRef = useRef(null);
  const userRef = useRef(null);
  const dbMenuRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (densityRef.current && !densityRef.current.contains(event.target)) {
        setIsDensityOpen(false);
      }
      if (entityRef.current && !entityRef.current.contains(event.target)) {
        setIsEntityOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setIsUserOpen(false);
      }
      if (dbMenuRef.current && !dbMenuRef.current.contains(event.target)) {
        setIsDbMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Alt+D shortcut to toggle density
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        setIsDensityOpen(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Determine section and page name for breadcrumbs
  const getBreadcrumbs = () => {
    const path = location.pathname;
    let sectionName = 'Platform & Dashboards';
    let pageName = 'Home';

    if (path === '/') {
      return { section: 'Platform & Dashboards', page: 'Home' };
    }
    if (path.startsWith('/dashboard-')) {
      const roleMap = {
        '/dashboard-owner': 'Business Owner Dashboard',
        '/dashboard-cfo': 'CFO Dashboard',
        '/dashboard-controller': 'Controller Dashboard',
        '/dashboard-accountant': 'Staff Accountant Dashboard',
        '/dashboard-auditor': 'Auditor Dashboard',
        '/dashboard-agency': 'Agency & Broker Dashboard',
        '/dashboard-mga': 'MGA Operations Dashboard',
        '/dashboard-carrier': 'Carrier Executive Dashboard',
        '/dashboard-reinsurer': 'Reinsurer Dashboard',
        '/dashboard-admin': 'System Administrator Dashboard',
        '/dashboard-general-business': 'Policyholder Expense Dashboard',
      };
      return { section: 'Platform & Dashboards', page: roleMap[path] || 'Role Dashboard' };
    }

    for (const group of NAV_CONFIG) {
      const match = group.children.find(c => c.href === path);
      if (match) {
        sectionName = group.label;
        pageName = match.label;
        break;
      }
    }
    return { section: sectionName, page: pageName };
  };

  const breadcrumbs = getBreadcrumbs();

  const handleEntitySelect = (user) => {
    switchRole(user.email);
    setIsEntityOpen(false);
    showToast(`Switched workspace to ${user.entityName}`);
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  const handleConfirmResetData = async () => {
    setIsResetConfirmOpen(false);
    try {
      setIsResetting(true);
      await api.resetData();
      clearAllData();
      await syncWithBackend();
      window.dispatchEvent(new Event('veridex:pas-events-reset'));
      window.dispatchEvent(new Event('veridex:pos-events-reset'));
      window.dispatchEvent(new Event('veridex:data-reset'));
      setToastMessage('Transactions cleared. Chart of Accounts and login credentials kept.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (e) {
      setToastMessage('Reset error: ' + e.message);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
    <header className="app-header" role="banner">
      {toastMessage && (
        <div className="veridex-toast veridex-toast-info">
          <span>ⓘ</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Left zone: Breadcrumb */}
      <div className="header-left-zone">
        <nav className="breadcrumb-nav" aria-label="Breadcrumb">
          <Link to="/" className="breadcrumb-item">VeriDex</Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-item">{breadcrumbs.section}</span>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-item current">{breadcrumbs.page}</span>
        </nav>
      </div>

      {/* Middle zone: Global search */}
      <div className="header-search">
        <SearchIcon />
        <input
          type="text"
          placeholder="Global search (Ctrl+K)"
          id="global-search"
          aria-label="Search platform data"
        />
      </div>

      {/* Right zone: Actions */}
      <div className="header-actions">
        {/* Accounting Level Switcher Badge (Insurance vs Domino's Pizza) */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            id="header-accounting-level-btn"
            onClick={() => {
              const next = (accountingLevel === 'pizza' ? 'insurance' : 'pizza');
              if (setAccountingLevel) setAccountingLevel(next);
              showToast(`Switched accounting context to: ${next === 'pizza' ? "Domino's Pizza Level" : "Insurance Level"}`);
            }}
            title={`Active Accounting Level: ${accountingLevel === 'pizza' ? "Domino's Pizza" : "Insurance"}. Click to switch context.`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11.5px',
              fontWeight: 700,
              border: accountingLevel === 'pizza' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid rgba(37, 99, 235, 0.4)',
              background: accountingLevel === 'pizza' ? 'rgba(249, 115, 22, 0.12)' : 'rgba(37, 99, 235, 0.12)',
              color: accountingLevel === 'pizza' ? '#ea580c' : '#2563eb',
              cursor: 'pointer',
              height: '32px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{accountingLevel === 'pizza' ? '🍕' : '🛡️'}</span>
            <span>{accountingLevel === 'pizza' ? "Domino's Pizza" : 'Insurance'}</span>
            <span style={{ fontSize: '10px', opacity: 0.7, padding: '1px 5px', borderRadius: '8px', background: 'rgba(0,0,0,0.06)' }}>
              ⇄ Switch
            </span>
          </button>
        </div>

        {/* MongoDB Atlas Live Database Badge */}
        <div className="v-db-status-wrap" ref={dbMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="v-db-badge-btn"
            onClick={() => setIsDbMenuOpen(!isDbMenuOpen)}
            title="MongoDB Atlas Database Status"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11.5px',
              fontWeight: 600,
              border: isDbConnected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
              background: isDbConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              color: isDbConnected ? '#059669' : '#d97706',
              cursor: 'pointer',
              height: '32px'
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: isDbConnected ? '#10b981' : '#f59e0b',
                boxShadow: isDbConnected ? '0 0 6px #10b981' : 'none',
                display: 'inline-block'
              }}
            />
            <span>{isDbConnected ? 'MongoDB Live' : 'DB Connecting'}</span>
            <ChevronIcon />
          </button>

          {isDbMenuOpen && (
            <div
              className="v-db-dropdown"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '280px',
                background: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                border: '1px solid var(--color-border, #e2e8f0)',
                padding: '14px',
                zIndex: 1000,
                fontSize: '12px',
                color: '#1e293b'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🍃</span> MongoDB Atlas
                </div>
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: '12px',
                  background: isDbConnected ? '#ecfdf5' : '#fffbeb',
                  color: isDbConnected ? '#065f46' : '#92400e'
                }}>
                  {isDbConnected ? 'Connected' : 'Offline'}
                </span>
              </div>

              <div style={{ color: '#64748b', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                <div><strong>Cluster:</strong> <code>cluster0.8kh4syh.mongodb.net</code></div>
                <div><strong>Database:</strong> <code>{dbInfo?.database || 'veridex_finance'}</code></div>
                <div><strong>Collections:</strong> {dbInfo?.collectionsCount || 6} (Accounts, JEs, Periods, Users, AR/AP, Bank)</div>
              </div>

              <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                  onClick={async () => {
                    await syncWithBackend();
                    setToastMessage('Synchronized state with MongoDB Atlas');
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                >
                  ↻ Refresh
                </button>
                <button
                  type="button"
                  disabled={isSeeding}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#ffffff',
                    cursor: isSeeding ? 'wait' : 'pointer'
                  }}
                  onClick={async () => {
                    try {
                      setIsSeeding(true);
                      localStorage.removeItem('v_data_reset');
                      await api.seedDatabase(false);
                      await syncWithBackend();
                      setToastMessage('Database seeded successfully from prototype data');
                      setTimeout(() => setToastMessage(null), 3500);
                    } catch (e) {
                      setToastMessage('Seeding error: ' + e.message);
                      setTimeout(() => setToastMessage(null), 4000);
                    } finally {
                      setIsSeeding(false);
                    }
                  }}
                >
                  {isSeeding ? 'Seeding...' : '⚡ Reseed'}
                </button>
              </div>
              <button
                type="button"
                disabled={isResetting}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid rgba(220, 38, 38, 0.35)',
                  background: 'rgba(220, 38, 38, 0.06)',
                  color: '#dc2626',
                  cursor: isResetting ? 'wait' : 'pointer'
                }}
                onClick={() => { setIsDbMenuOpen(false); setIsResetConfirmOpen(true); }}
              >
                {isResetting ? 'Resetting...' : '🗑 Reset Data'}
              </button>
            </div>
          )}
        </div>

        {/* Density & Sizing Controller */}
        <div className="v-density-wrap" ref={densityRef}>
          <button
            type="button"
            className="density-toggle-btn"
            onClick={() => setIsDensityOpen(!isDensityOpen)}
            title="Display Density & Size Settings (Alt+D)"
            aria-expanded={isDensityOpen}
          >
            <DensityIcon />
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>
              {density}
            </span>
            {scale !== 100 && (
              <span className="density-scale-badge">{scale}%</span>
            )}
            <ChevronIcon />
          </button>

          <div className={`v-density-menu ${isDensityOpen ? 'open' : ''}`} role="menu">
            <div className="v-density-menu-header">
              <div className="v-density-header-left">
                <DensityIcon />
                <span>Density &amp; Sizing</span>
              </div>
              <button
                type="button"
                className="v-density-reset-btn"
                onClick={resetDensityDefaults}
                title="Reset all display adjustments to default"
              >
                Reset
              </button>
            </div>

            <div className="v-density-section-title">Display Density Preset</div>
            <div className="v-density-options-list">
              <div
                className={`v-density-option ${density === 'spacious' ? 'active' : ''}`}
                onClick={() => applyDensity('spacious')}
              >
                <div className="v-density-opt-radio"></div>
                <div className="v-density-opt-body">
                  <div className="v-density-opt-title">Spacious</div>
                  <div className="v-density-opt-desc">54px rows · Generous air &amp; touch friendly</div>
                </div>
                <div className="v-density-opt-preview preview-spacious">
                  <span></span><span></span><span></span>
                </div>
              </div>

              <div
                className={`v-density-option ${density === 'comfortable' ? 'active' : ''}`}
                onClick={() => applyDensity('comfortable')}
              >
                <div className="v-density-opt-radio"></div>
                <div className="v-density-opt-body">
                  <div className="v-density-opt-title">
                    Comfortable <span className="v-density-badge-default">Default</span>
                  </div>
                  <div className="v-density-opt-desc">48px rows · Standard view &amp; spacing</div>
                </div>
                <div className="v-density-opt-preview preview-comfortable">
                  <span></span><span></span><span></span>
                </div>
              </div>

              <div
                className={`v-density-option ${density === 'compact' ? 'active' : ''}`}
                onClick={() => applyDensity('compact')}
              >
                <div className="v-density-opt-radio"></div>
                <div className="v-density-opt-body">
                  <div className="v-density-opt-title">Compact</div>
                  <div className="v-density-opt-desc">36px rows · High data density</div>
                </div>
                <div className="v-density-opt-preview preview-compact">
                  <span></span><span></span><span></span><span></span>
                </div>
              </div>

              <div
                className={`v-density-option ${density === 'condensed' ? 'active' : ''}`}
                onClick={() => applyDensity('condensed')}
              >
                <div className="v-density-opt-radio"></div>
                <div className="v-density-opt-body">
                  <div className="v-density-opt-title">
                    Condensed <span className="v-density-badge-max">Max Fit</span>
                  </div>
                  <div className="v-density-opt-desc">28px rows · Heavy finance &amp; ledgers</div>
                </div>
                <div className="v-density-opt-preview preview-condensed">
                  <span></span><span></span><span></span><span></span><span></span>
                </div>
              </div>
            </div>

            <div className="v-density-divider"></div>

            <div className="v-density-section-title">Interface &amp; Font Zoom</div>
            <div className="v-density-scale-row">
              <div className="v-scale-stepper">
                <button
                  type="button"
                  className="v-scale-btn"
                  onClick={() => stepScale(-5)}
                  title="Decrease Size (A-)"
                >
                  A−
                </button>
                <span className="v-scale-val">{scale}%</span>
                <button
                  type="button"
                  className="v-scale-btn"
                  onClick={() => stepScale(5)}
                  title="Increase Size (A+)"
                >
                  A+
                </button>
              </div>
              <div className="v-scale-presets">
                {[85, 90, 100, 110, 120].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`v-scale-chip ${scale === preset ? 'active' : ''}`}
                    onClick={() => applyScale(preset)}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>

            <div className="v-density-divider"></div>

            <div className="v-density-section-title">Data Grid View Enhancements</div>
            <div className="v-density-toggles-group">
              <label className="v-density-toggle-item">
                <div className="v-density-toggle-info">
                  <div className="v-toggle-title">Zebra Row Striping</div>
                  <div className="v-toggle-desc">Subtle alternating background for wide rows</div>
                </div>
                <input
                  type="checkbox"
                  className="v-density-checkbox"
                  checked={isZebra}
                  onChange={(e) => toggleZebra(e.target.checked)}
                />
                <span className="v-density-switch"></span>
              </label>

              <label className="v-density-toggle-item">
                <div className="v-density-toggle-info">
                  <div className="v-toggle-title">Column Grid Lines</div>
                  <div className="v-toggle-desc">Vertical borders between table columns</div>
                </div>
                <input
                  type="checkbox"
                  className="v-density-checkbox"
                  checked={isGrid}
                  onChange={(e) => toggleGrid(e.target.checked)}
                />
                <span className="v-density-switch"></span>
              </label>

              <label className="v-density-toggle-item">
                <div className="v-density-toggle-info">
                  <div className="v-toggle-title">Insurance Flow Simulator</div>
                  <div className="v-toggle-desc">Show the sidebar link under General Ledger{showGlSimulation === null ? ` (currently ${bType === 'carrier' ? 'hidden' : 'shown'} by default)` : ''}</div>
                </div>
                <input
                  type="checkbox"
                  className="v-density-checkbox"
                  checked={showGlSimulation === null ? bType !== 'carrier' : showGlSimulation}
                  onChange={(e) => toggleGlSimulation(e.target.checked)}
                />
                <span className="v-density-switch"></span>
              </label>
            </div>

            <div className="v-density-footer">
              <span>Shortcut: <kbd>Alt</kbd> + <kbd>D</kbd></span>
              <span>Saved per device</span>
            </div>
          </div>
        </div>

        {/* Entity Switcher */}
        <div className="v-entity-switcher-wrap" ref={entityRef}>
          <div
            className="v-entity-switch"
            onClick={() => setIsEntityOpen(!isEntityOpen)}
            title="Switch entity workspace"
          >
            <div className="v-entity-avatar">
              {entityAvatarEmoji(currentUser?.businessType)}
            </div>
            <div>
              <div className="v-entity-label">{currentUser?.entityName || 'My Business'}</div>
              <div className="v-entity-sub">{currentUser?.businessLabel || 'MGA / Program Manager'}</div>
            </div>
            <ChevronIcon />
          </div>

          <div className={`v-entity-menu ${isEntityOpen ? 'open' : ''}`}>
            {accountingLevel === 'pizza' ? (
              <>
                {[
                  { entityId: 'ENT-HUB-01', email: 'hub@pizza.demo', entityName: 'Main Hub', businessType: 'hub', businessLabel: 'Franchise Main Hub' },
                  { entityId: 'ENT-FRN-01', email: 'franchise@pizza.demo', entityName: 'Franchise Store #12', businessType: 'franchise', businessLabel: 'Franchise-Owned Store' },
                  { entityId: 'ENT-OWN-01', email: 'ownstore@pizza.demo', entityName: 'Own Store #1', businessType: 'ownstore', businessLabel: 'Company-Owned Store' }
                ].map(preset => {
                  const u = (allUsers || []).find(user =>
                    user.entityId === preset.entityId ||
                    user.email?.toLowerCase() === preset.email.toLowerCase()
                  ) || preset;

                  const isCurrentActive =
                    currentUser?.entityId === u.entityId ||
                    currentUser?.email?.toLowerCase() === u.email?.toLowerCase() ||
                    activeEntity?.id === u.entityId;

                  return (
                    <div
                      key={u.email || u.entityId}
                      className={`v-entity-menu-item ${isCurrentActive ? 'active' : ''}`}
                      onClick={() => handleEntitySelect(u)}
                    >
                      <div className="v-entity-avatar">{entityAvatarEmoji(u.businessType)}</div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)' }}>
                          {u.entityName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                          {u.businessLabel}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                {[
                  {
                    entityId: 'ENT-AGY-01',
                    email: 'broker@gmail.com',
                    entityName: 'HIT Retail Producers Inc.',
                    businessType: 'agency',
                    businessLabel: 'Retail Insurance Agency'
                  },
                  {
                    entityId: 'ENT-MGA-01',
                    email: 'mga@gmail.com',
                    entityName: 'NTA Delegated Underwriters',
                    businessType: 'mga',
                    businessLabel: 'MGA / Program Manager'
                  },
                  {
                    entityId: 'ENT-CAR-01',
                    email: 'carrier@gmail.com',
                    entityName: 'Southlake Risk Carriers Ltd',
                    businessType: 'carrier',
                    businessLabel: 'Risk Underwriting Carrier'
                  }
                ].map(preset => {
                  const u = (allUsers || []).find(user =>
                    user.entityId === preset.entityId ||
                    user.email?.toLowerCase() === preset.email.toLowerCase() ||
                    user.entityName?.toLowerCase() === preset.entityName.toLowerCase()
                  ) || preset;

                  const isCurrentActive =
                    currentUser?.entityId === u.entityId ||
                    currentUser?.email?.toLowerCase() === u.email?.toLowerCase() ||
                    activeEntity?.id === u.entityId;

                  return (
                    <div
                      key={u.email || u.entityId}
                      className={`v-entity-menu-item ${isCurrentActive ? 'active' : ''}`}
                      onClick={() => handleEntitySelect(u)}
                    >
                      <div className="v-entity-avatar">{entityAvatarEmoji(u.businessType)}</div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)' }}>
                          {u.entityName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                          {u.businessLabel}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Notifications Icon Button */}
        <button
          type="button"
          className="header-icon-btn"
          title="Platform notifications"
          onClick={() => showToast('All services operational. No new alerts.')}
          aria-label="Notifications"
        >
          <BellIcon />
        </button>

        {/* User Account Menu */}
        <div className="v-user-profile-wrap" ref={userRef}>
          <button
            type="button"
            className="header-avatar-btn"
            id="header-user-btn"
            onClick={() => setIsUserOpen(!isUserOpen)}
            title={`${currentUser?.name || 'Account'} (${currentUser?.roleLabel || 'User'}) — Account & Logout`}
            aria-label="User Account Menu"
            style={{ background: currentUser?.avatarColor || 'var(--color-brand)' }}
          >
            {currentUser?.initials || 'JB'}
          </button>

          <div className={`v-user-menu ${isUserOpen ? 'open' : ''}`}>
            <div className="v-user-menu-header">
              <div
                className="v-user-menu-avatar"
                style={{ background: currentUser?.avatarColor || 'var(--color-brand)' }}
              >
                {currentUser?.initials || 'JB'}
              </div>
              <div className="v-user-menu-info">
                <div className="v-user-menu-name">{currentUser?.name || 'Jordan Blake'}</div>
                <div className="v-user-menu-email">{currentUser?.email || 'admin@veridex.com'}</div>
                <div className="v-user-menu-role">{currentUser?.roleLabel || 'Business Owner'}</div>
              </div>
            </div>

            <div className="v-user-menu-divider"></div>

            <Link
              to="/workspaces"
              className="v-user-menu-item"
              onClick={() => setIsUserOpen(false)}
            >
              <svg width="15" height="15" viewBox="0 0 256 256" fill="none">
                <circle cx="128" cy="128" r="96" stroke="currentColor" strokeWidth="18" />
                <path d="M32 128h192M128 32a134 134 0 00-40 96 134 134 0 0040 96M128 32a134 134 0 0140 96 134 134 0 01-40 96" stroke="currentColor" strokeWidth="18" />
              </svg>
              <span>Switch Workspace</span>
            </Link>

            <Link
              to="/user-management"
              className="v-user-menu-item"
              onClick={() => setIsUserOpen(false)}
            >
              <svg width="15" height="15" viewBox="0 0 256 256" fill="none">
                <circle cx="96" cy="80" r="40" stroke="currentColor" strokeWidth="18" />
                <path d="M24 208c0-44 36-72 80-72s80 28 80 72" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
                <path d="M176 120l24 24 48-48" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Security &amp; Users</span>
            </Link>

            <Link
              to="/admin-config"
              className="v-user-menu-item"
              onClick={() => setIsUserOpen(false)}
            >
              <svg width="15" height="15" viewBox="0 0 256 256" fill="none">
                <circle cx="128" cy="128" r="40" stroke="currentColor" strokeWidth="18" />
                <path d="M128 24v24M128 208v24M24 128h24M208 128h24" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
              </svg>
              <span>Configuration Centre</span>
            </Link>

            <div className="v-user-menu-divider"></div>

            <div style={{ padding: '12px 16px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-ink-secondary)',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Company Theme
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className={`theme-swatch ${currentTheme === 'default' ? 'active' : ''}`}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: currentTheme === 'default' ? '2px solid #fff' : 'none',
                    outline: currentTheme === 'default' ? '2px solid #F97316' : 'none',
                    cursor: 'pointer',
                    background: '#F97316'
                  }}
                  onClick={() => changeTheme('default')}
                  title="Default Orange"
                />
                <button
                  type="button"
                  className={`theme-swatch ${currentTheme === 'blue' ? 'active' : ''}`}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: currentTheme === 'blue' ? '2px solid #fff' : 'none',
                    outline: currentTheme === 'blue' ? '2px solid #2563EB' : 'none',
                    cursor: 'pointer',
                    background: '#2563EB'
                  }}
                  onClick={() => changeTheme('blue')}
                  title="Ocean Blue"
                />
                <button
                  type="button"
                  className={`theme-swatch ${currentTheme === 'emerald' ? 'active' : ''}`}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: currentTheme === 'emerald' ? '2px solid #fff' : 'none',
                    outline: currentTheme === 'emerald' ? '2px solid #059669' : 'none',
                    cursor: 'pointer',
                    background: '#059669'
                  }}
                  onClick={() => changeTheme('emerald')}
                  title="Emerald Green"
                />
                <button
                  type="button"
                  className={`theme-swatch ${currentTheme === 'purple' ? 'active' : ''}`}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: currentTheme === 'purple' ? '2px solid #fff' : 'none',
                    outline: currentTheme === 'purple' ? '2px solid #7C3AED' : 'none',
                    cursor: 'pointer',
                    background: '#7C3AED'
                  }}
                  onClick={() => changeTheme('purple')}
                  title="Amethyst Purple"
                />
              </div>
            </div>

            <div className="v-user-menu-divider"></div>

            <button
              type="button"
              className="v-user-menu-item v-user-menu-logout"
              onClick={handleLogoutClick}
            >
              <svg width="15" height="15" viewBox="0 0 256 256" fill="none">
                <path d="M112 40H48a16 16 0 00-16 16v144a16 16 0 0016 16h64" stroke="currentColor" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M168 88l40 40-40 40M208 128H96" stroke="currentColor" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    {/* Reset Data Confirmation Modal — replaces window.confirm for a
        destructive action so it matches the app's own styling instead of
        the browser's native dialog chrome. Fully inline-styled (no
        external CSS class) since Header renders on every route and can't
        rely on any one page's stylesheet being loaded. */}
    {isResetConfirmOpen && (
      <div
        onClick={() => setIsResetConfirmOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '440px',
            maxWidth: '94vw',
            padding: '24px',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
            🗑 Reset Data
          </div>
          <p style={{ fontSize: '13px', color: '#475569', marginBottom: '20px', lineHeight: 1.6 }}>
            Reset Data will permanently delete all Journal Entries, Periods, Bank Transactions, AR/AP Invoices, and Policy Admin (PAS) injected events from MongoDB Atlas, and zero out every account balance. The Chart of Accounts itself (including any custom accounts you've added) and login credentials are kept. <strong>This cannot be undone.</strong> Continue?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(false)}
              style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 600, borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmResetData}
              style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 600, borderRadius: '6px', border: '1px solid #dc2626', background: '#dc2626', color: '#fff', cursor: 'pointer' }}
            >
              🗑 Reset Data
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
