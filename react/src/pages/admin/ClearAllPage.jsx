import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { api } from '../../services/api';

export default function ClearAllPage() {
  const navigate = useNavigate();
  const { resetAll, clearAllData, syncWithBackend } = useFinance();
  const [logs, setLogs] = useState([
    'Veridex Ledger Diagnostics v1.7.0 initialized.',
    'Connected to Local Database Storage [Active].',
    'Ready for diagnostic maintenance or seed re-initialization.'
  ]);
  const [inProgress, setInProgress] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const addLog = (line) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`]);
  };

  // Actually wipes and reseeds MongoDB Atlas (server/seed-cli.js
  // seedDatabase(clean=true) deletes every collection, including any
  // manually-added accounts, then re-inserts the standard demo dataset),
  // then resets local state and re-syncs from Atlas so the UI reflects
  // the fresh baseline instead of a stale local cache.
  const handleResetSeeds = async () => {
    setInProgress(true);
    addLog('Initiating ledger state reset...');
    try {
      addLog('Wiping Atlas collections (Accounts, Journal Entries, Periods, Bank Txns, Invoices, Users)...');
      await api.seedDatabase(true);
      addLog('Rebuilding Chart of Accounts standard catalog and demo dataset...');
      resetAll();
      addLog('Re-syncing local state from MongoDB Atlas...');
      await syncWithBackend();
      window.dispatchEvent(new Event('veridex:pas-events-reset'));
      addLog('SUCCESS: System restored to baseline demonstration state.');
      showToast('Database reset complete!');
    } catch (err) {
      addLog(`ERROR: ${err.message || 'Reset failed — is the server running?'}`);
      showToast('Reset failed — check server connection', 'error');
    } finally {
      setInProgress(false);
    }
  };

  // Wipes transactional collections on Atlas but keeps the Chart of
  // Accounts structure and login users (server/seed-cli.js
  // resetDataKeepUsers) — so a custom account added by hand is retained
  // here by design, only its balance and postings are cleared.
  const handlePurgeTransactions = async () => {
    setInProgress(true);
    addLog('Purging all journal vouchers, payments, and invoice transactions...');
    try {
      await api.resetData();
      addLog('Retaining Chart of Accounts and master profiles intact.');
      clearAllData();
      addLog('Re-syncing local state from MongoDB Atlas...');
      await syncWithBackend();
      window.dispatchEvent(new Event('veridex:pas-events-reset'));
      window.dispatchEvent(new Event('veridex:pos-events-reset'));
      window.dispatchEvent(new Event('veridex:data-reset'));
      addLog('SUCCESS: All subledger transactions purged cleanly.');
      showToast('Transactions purged cleanly!');
    } catch (err) {
      addLog(`ERROR: ${err.message || 'Purge failed — is the server running?'}`);
      showToast('Purge failed — check server connection', 'error');
    } finally {
      setInProgress(false);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      {toast && (
        <div className={`veridex-toast veridex-toast-${toast.type}`}>
          <span>{toast.type === 'error' ? '✕' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="card" style={{ maxWidth: '560px', width: '100%', padding: '36px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          padding: '4px 12px',
          background: 'rgba(16, 42, 46, 0.08)',
          color: 'var(--navy)',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '16px'
        }}>
          System Maintenance &bull; DevTools
        </div>

        <div style={{ fontSize: '42px', marginBottom: '12px' }}>🗄️</div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--gray-900)', margin: '0 0 8px 0' }}>
          Database Reset &amp; Seed Engine
        </h2>
        <p style={{ fontSize: '13.5px', color: 'var(--gray-500)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          Restore mock transactions, purge transactional queues, or re-initialize Chart of Accounts presets for test demonstrations.
        </p>

        {/* Terminal Log Box */}
        <div style={{
          background: '#0f172a',
          color: '#38bdf8',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'left',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          height: '140px',
          overflowY: 'auto',
          lineHeight: '1.6',
          marginBottom: '24px',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)'
        }}>
          {logs.map((l, i) => (
            <div key={i} style={{ color: l.includes('SUCCESS') ? '#4ade80' : '#38bdf8' }}>
              {l}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            className="btn btn-primary"
            disabled={inProgress}
            onClick={handleResetSeeds}
            style={{ width: '100%', padding: '12px', fontSize: '13.5px' }}
          >
            {inProgress ? 'Executing Maintenance Tasks...' : 'Reset to Fresh Demo Seeds (Recommended)'}
          </button>
          <button
            className="btn btn-outline"
            disabled={inProgress}
            onClick={handlePurgeTransactions}
            style={{ width: '100%', padding: '10px', color: 'var(--coral)', borderColor: 'var(--coral)' }}
          >
            Purge Transactions Only (Retain COA &amp; Master Data)
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/dashboard')}
            style={{ width: '100%', marginTop: '8px' }}
          >
            &larr; Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
