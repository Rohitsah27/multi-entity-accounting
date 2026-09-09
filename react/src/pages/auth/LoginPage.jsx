import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const authContext = useAuth();
  const login = authContext?.login;
  const setAccountingLevel = authContext?.setAccountingLevel;

  const [selectedLevel, setSelectedLevel] = useState(() => {
    try {
      return sessionStorage.getItem('v_accounting_level') || localStorage.getItem('v_accounting_level') || 'insurance';
    } catch {
      return 'insurance';
    }
  });

  const [email, setEmail] = useState(() => {
    return selectedLevel === 'pizza' ? 'hub@pizza.demo' : 'carrier@gmail.com';
  });
  const [password, setPassword] = useState('admin@123');
  const [rememberMe, setRememberMe] = useState(true);
  const [skipOnboarding, setSkipOnboarding] = useState(true);
  const [errorToast, setErrorToast] = useState(null);
  const [infoToast, setInfoToast] = useState(null);

  const handleSelectLevel = (level) => {
    setSelectedLevel(level);
    if (setAccountingLevel) {
      setAccountingLevel(level);
    }
    if (level === 'insurance') {
      setEmail('carrier@gmail.com');
    } else {
      setEmail('hub@pizza.demo');
    }
  };

  const insuranceDemoUsers = [
    { label: '🛡️ Carrier (Southlake)', email: 'carrier@gmail.com' },
    { label: '🧾 MGA (NTA Underwriters)', email: 'mga@gmail.com' },
    { label: '💼 Broker (HIT Agency)', email: 'broker@gmail.com' },
    { label: '🚛 Insured (Ayushi Fleet)', email: 'insured@gmail.com' },
    { label: '👑 Owner / Admin', email: 'admin@veridex.com' }
  ];

  const pizzaDemoUsers = [
    { label: '🏢 Domino\'s Main Company', email: 'hub@pizza.demo' },
    { label: '🍕 Franchise Store #12', email: 'franchise@pizza.demo' },
    { label: '🏪 Own Store #1', email: 'ownstore@pizza.demo' }
  ];

  const activeDemoUsers = selectedLevel === 'pizza' ? pizzaDemoUsers : insuranceDemoUsers;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorToast(null);

    const allowed = [
      'admin@veridex.com', 'carrier@gmail.com', 'mga@gmail.com', 'broker@gmail.com', 'insured@gmail.com', 'reinsurer@gmail.com',
      'hub@pizza.demo', 'franchise@pizza.demo', 'ownstore@pizza.demo', 'customer@pizza.demo'
    ];
    const trimmed = email.trim().toLowerCase();

    if (!allowed.includes(trimmed) || password !== 'admin@123') {
      setErrorToast('Invalid email or password. Please use admin@123.');
      setTimeout(() => setErrorToast(null), 3500);
      return;
    }

    sessionStorage.setItem('login_email', trimmed);
    sessionStorage.setItem('login_remember', rememberMe ? '1' : '0');
    sessionStorage.setItem('skip_onboarding', skipOnboarding ? '1' : '0');
    sessionStorage.setItem('v_accounting_level', selectedLevel);
    localStorage.setItem('v_accounting_level', selectedLevel);

    if (login) {
      await login(trimmed, password, rememberMe, selectedLevel);
    }
    navigate('/otp');
  };

  const handleForgotPassword = () => {
    setInfoToast('Password reset link sent (simulated)');
    setTimeout(() => setInfoToast(null), 3000);
  };

  return (
    <div className="auth-wrap">
      {errorToast && (
        <div className="veridex-toast veridex-toast-error">
          <span>✕</span>
          <span>{errorToast}</span>
        </div>
      )}
      {infoToast && (
        <div className="veridex-toast veridex-toast-info">
          <span>ⓘ</span>
          <span>{infoToast}</span>
        </div>
      )}      <div className="auth-panel" style={{ width: '1060px', maxWidth: '96vw', minHeight: '620px', borderRadius: '16px', display: 'flex', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        {/* Left Brand Panel */}
        <div className="auth-left" style={{ flex: '0 0 360px', width: '360px', padding: '40px 32px' }}>
          <div className="auth-left-content">
            <svg width="68" height="68" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="authVdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="7" fill="#1e232b" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
              <path d="M7 10L13 22L17 14" stroke="url(#authVdGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 10H21C23.76 10 26 12.24 26 15C26 17.76 23.76 20 21 20H17V10Z" stroke="url(#authVdGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#FFFFFF' }}>Veri</span>
                <span style={{ color: 'var(--color-brand)' }}>Dex</span>
              </div>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', letterSpacing: '2px', marginTop: '4px' }}>
                FINANCE &amp; ACCOUNTING ENGINE
              </div>
            </div>
            <div className="auth-left-tagline" style={{ fontSize: '12px', lineHeight: 1.5 }}>
              Multi-Entity Architecture · Dual Business Accounting
            </div>
          </div>
        </div>

        {/* Right Sign-in Form */}
        <div className="auth-right" style={{ flex: '1', width: 'auto', minWidth: '0', padding: '38px 46px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="auth-title" style={{ textAlign: 'left', fontSize: '24px', marginBottom: '4px' }}>Welcome to VeriDex</div>
          <div className="auth-subtitle" style={{ textAlign: 'left', fontSize: '13px', color: '#94a3b8', marginBottom: '18px' }}>
            Select your accounting level and credentials to begin
          </div>

          {/* TWO BUSINESS / ACCOUNTING LEVEL OPTIONS */}
          <div style={{ margin: '0 0 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                Accounting Level *
              </label>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Click to toggle mode</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Option 1: Insurance Level Accounting (Default) */}
              <div
                id="opt-insurance-level"
                onClick={() => handleSelectLevel('insurance')}
                style={{
                  border: selectedLevel === 'insurance' ? '2px solid #2563EB' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: selectedLevel === 'insurance' ? 'linear-gradient(180deg, rgba(37, 99, 235, 0.16) 0%, rgba(37, 99, 235, 0.06) 100%)' : 'rgba(255, 255, 255, 0.025)',
                  boxShadow: selectedLevel === 'insurance' ? '0 0 20px rgba(37, 99, 235, 0.22)' : 'none',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13.5px', fontWeight: 700, color: '#f8fafc' }}>
                    <span style={{ fontSize: '16px' }}>🛡️</span> Insurance
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '8px',
                      background: selectedLevel === 'insurance' ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      letterSpacing: '0.4px'
                    }}>
                      DEFAULT
                    </span>
                    <span style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: selectedLevel === 'insurance' ? '4px solid #2563eb' : '1.5px solid rgba(255, 255, 255, 0.3)',
                      background: selectedLevel === 'insurance' ? '#ffffff' : 'transparent',
                      display: 'inline-block'
                    }}></span>
                  </div>
                </div>

                <div style={{
                  display: 'inline-block',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  color: selectedLevel === 'insurance' ? '#93c5fd' : '#94a3b8',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  marginBottom: '6px'
                }}>
                  Broker → MGA → Carrier
                </div>

                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.45 }}>
                  Multi-tier insurance distribution, statutory COA, unearned premium &amp; NAIC GL.
                </div>
              </div>

              {/* Option 2: Domino's Pizza Level Accounting */}
              <div
                id="opt-pizza-level"
                onClick={() => handleSelectLevel('pizza')}
                style={{
                  border: selectedLevel === 'pizza' ? '2px solid #F97316' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: selectedLevel === 'pizza' ? 'linear-gradient(180deg, rgba(249, 115, 22, 0.16) 0%, rgba(249, 115, 22, 0.06) 100%)' : 'rgba(255, 255, 255, 0.025)',
                  boxShadow: selectedLevel === 'pizza' ? '0 0 20px rgba(249, 115, 22, 0.22)' : 'none',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13.5px', fontWeight: 700, color: '#f8fafc' }}>
                    <span style={{ fontSize: '16px' }}>🍕</span> Domino's Pizza
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '8px',
                      background: selectedLevel === 'pizza' ? '#f97316' : 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      letterSpacing: '0.4px'
                    }}>
                      FRANCHISE
                    </span>
                    <span style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: selectedLevel === 'pizza' ? '4px solid #f97316' : '1.5px solid rgba(255, 255, 255, 0.3)',
                      background: selectedLevel === 'pizza' ? '#ffffff' : 'transparent',
                      display: 'inline-block'
                    }}></span>
                  </div>
                </div>

                <div style={{
                  display: 'inline-block',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  color: selectedLevel === 'pizza' ? '#fdba74' : '#94a3b8',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  marginBottom: '6px'
                }}>
                  Customer → Franchise → Domino's
                </div>

                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.45 }}>
                  Ayushi ₹100 sale. 70% Franchise (₹70) &amp; 30% Domino's Main Hub (₹30).
                </div>
              </div>
            </div>
          </div>

          {/* Quick Demo Credentials for Active Level */}
          <div style={{
            margin: '0 0 16px 0',
            padding: '11px 14px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.035)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                ⚡ Quick Demo Users ({selectedLevel === 'pizza' ? "Domino's Pizza Flow" : 'Insurance Flow'}):
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                Password: <code style={{ color: '#f97316', fontWeight: 700, background: 'rgba(249, 115, 22, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>admin@123</code>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {activeDemoUsers.map(demo => {
                const isActive = email.toLowerCase() === demo.email;
                return (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => {
                      setEmail(demo.email);
                      setPassword('admin@123');
                    }}
                    style={{
                      background: isActive ? (selectedLevel === 'pizza' ? '#f97316' : '#2563eb') : 'rgba(255, 255, 255, 0.06)',
                      color: isActive ? '#ffffff' : '#cbd5e1',
                      border: isActive ? '1px solid transparent' : '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: isActive ? (selectedLevel === 'pizza' ? '0 2px 8px rgba(249, 115, 22, 0.35)' : '0 2px 8px rgba(37, 99, 235, 0.35)') : 'none',
                      borderRadius: '7px',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {demo.label}
                  </button>
                );
              })}
            </div>
          </div>

          <form id="login-form" onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="email">Email *</label>
              <input
                className="auth-input"
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-label" htmlFor="password">Password *</label>
              <input
                className="auth-input"
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="auth-form-group" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-brand)', cursor: 'pointer' }}
              />
              <label htmlFor="remember-me" style={{ color: 'var(--color-muted)', fontSize: '12px', cursor: 'pointer', margin: 0 }}>
                Remember me for 30 days
              </label>
            </div>

            <div className="auth-form-group" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <input
                type="checkbox"
                id="skip-onboarding"
                checked={skipOnboarding}
                onChange={(e) => setSkipOnboarding(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-brand)', cursor: 'pointer' }}
              />
              <label htmlFor="skip-onboarding" style={{ color: 'var(--color-muted)', fontSize: '12px', cursor: 'pointer', margin: 0 }}>
                Don't show onboarding screen (Go directly to dashboard)
              </label>
            </div>

            <button type="submit" className="auth-btn">Sign In →</button>
          </form>

          <div className="auth-link" onClick={handleForgotPassword}>
            Forgot Password?
          </div>
        </div>
      </div>
    </div>
  );
}
