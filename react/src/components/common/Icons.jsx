import React from 'react';

export function MonogramLogo({ width = 28, height = 28, className = 'logo-vd-mark' }) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vdMonogramGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="6" fill="#22262E" />
      <path d="M7 10L13 22L17 14" stroke="url(#vdMonogramGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 10H21C23.76 10 26 12.24 26 15C26 17.76 23.76 20 21 20H17V10Z" stroke="url(#vdMonogramGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronIcon({ className = 'nav-chevron', width = 12, height = 12 }) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 256 256" fill="none">
      <path d="M208 96l-80 80-80-80" stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SearchIcon({ width = 14, height = 14, className = '' }) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 256 256" fill="none">
      <circle cx="112" cy="112" r="80" stroke="currentColor" strokeWidth="22" />
      <path d="M168.5 168.5L224 224" stroke="currentColor" strokeWidth="22" strokeLinecap="round" />
    </svg>
  );
}

export function BellIcon({ width = 16, height = 16, className = '' }) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 256 256" fill="none">
      <path d="M128 24a64 64 0 00-64 64v44.8L44.8 160h166.4L192 132.8V88a64 64 0 00-64-64z" stroke="currentColor" strokeWidth="20" strokeLinejoin="round" />
      <path d="M104 200a24 24 0 0048 0" stroke="currentColor" strokeWidth="20" />
    </svg>
  );
}

export function DensityIcon({ width = 14, height = 14, className = '' }) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 256 256" fill="none">
      <path d="M40 80h176M40 128h176M40 176h176" stroke="currentColor" strokeWidth="22" strokeLinecap="round" />
    </svg>
  );
}

export function CollapseIcon({ width = 16, height = 16, className = '' }) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 256 256" fill="none">
      <path d="M160 208l-80-80 80-80" stroke="currentColor" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NavIcon({ id, width = 18, height = 18 }) {
  switch (id) {
    case 'dashboard':
    case 'home':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <path d="M218.83 103.77l-80-75.48a16 16 0 00-21.66 0l-80 75.48A16 16 0 0032 115.55V208a16 16 0 0016 16h48a8 8 0 008-8v-48a8 8 0 018-8h32a8 8 0 018 8v48a8 8 0 008 8h48a16 16 0 0016-16v-92.45a16 16 0 00-5.17-11.78z" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'my-dashboard':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <rect x="32" y="48" width="80" height="64" rx="8" stroke="currentColor" strokeWidth="18" />
          <rect x="144" y="48" width="80" height="96" rx="8" stroke="currentColor" strokeWidth="18" />
          <rect x="32" y="144" width="80" height="64" rx="8" stroke="currentColor" strokeWidth="18" />
          <rect x="144" y="176" width="80" height="32" rx="8" stroke="currentColor" strokeWidth="18" />
        </svg>
      );
    case 'explore-industries':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <circle cx="128" cy="128" r="96" stroke="currentColor" strokeWidth="18" />
          <path d="M32 128h192M128 32a134 134 0 00-40 96 134 134 0 0040 96M128 32a134 134 0 0140 96 134 134 0 01-40 96" stroke="currentColor" strokeWidth="18" />
        </svg>
      );
    case 'gl':
    case 'chart-of-accounts':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <path d="M48 40h160a16 16 0 0116 16v144a16 16 0 01-16 16H48a16 16 0 01-16-16V56a16 16 0 0116-16z" stroke="currentColor" strokeWidth="18" />
          <path d="M80 88h96M80 128h64M80 168h96" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
        </svg>
      );
    case 'journal-entry':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <path d="M160 32H56a16 16 0 00-16 16v160a16 16 0 0016 16h144a16 16 0 0016-16V88z" stroke="currentColor" strokeWidth="18" strokeLinejoin="round" />
          <path d="M160 32v56h56M80 128h96M80 168h64" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
        </svg>
      );
    case 'financial-statements':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <path d="M40 208l64-64 48 48 64-80" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M176 112h40v40" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'period-locking':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <rect x="40" y="88" width="176" height="128" rx="16" stroke="currentColor" strokeWidth="18" />
          <path d="M80 88V64a48 48 0 0196 0v24" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
        </svg>
      );
    case 'accounts-receivable':
    case 'ar-aging':
    case 'ar-collections':
    case 'ar-statements':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <rect x="32" y="48" width="192" height="160" rx="16" stroke="currentColor" strokeWidth="18" />
          <path d="M80 104h96M80 152h64M168 24l24 24-24 24" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'billing':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <rect x="48" y="24" width="160" height="208" rx="16" stroke="currentColor" strokeWidth="18" />
          <path d="M88 80h80M88 120h80M88 160h48" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
        </svg>
      );
    case 'accounts-payable':
    case 'ap-ach':
    case 'ap-echecks':
    case 'ap-aging':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <rect x="32" y="48" width="192" height="160" rx="16" stroke="currentColor" strokeWidth="18" />
          <path d="M80 104h96M80 152h64M128 24v24" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
        </svg>
      );
    case 'bank':
    case 'bank-reconciliation':
    case 'recon-approvals':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <path d="M24 96L128 32l104 64H24z" stroke="currentColor" strokeWidth="18" strokeLinejoin="round" />
          <path d="M40 96v80M96 96v80M160 96v80M216 96v80M24 176h208v32H24z" stroke="currentColor" strokeWidth="18" strokeLinejoin="round" />
        </svg>
      );
    case 'commission':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <circle cx="128" cy="128" r="96" stroke="currentColor" strokeWidth="18" />
          <path d="M96 160l64-64M104 104a8 8 0 100-16 8 8 0 000 16zM152 168a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
        </svg>
      );
    case 'tax':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <rect x="32" y="48" width="192" height="160" rx="16" stroke="currentColor" strokeWidth="18" />
          <path d="M80 96h24M152 96h24M80 144h32M152 144h24M120 96v64" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
        </svg>
      );
    case 'reporting':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <rect x="48" y="24" width="160" height="208" rx="16" stroke="currentColor" strokeWidth="18" />
          <path d="M96 80h64M96 128h64M96 176h32" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
        </svg>
      );
    case 'workflow':
    case 'approval-chains':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <rect x="36" y="40" width="64" height="48" rx="8" stroke="currentColor" strokeWidth="18" />
          <rect x="156" y="104" width="64" height="48" rx="8" stroke="currentColor" strokeWidth="18" />
          <rect x="36" y="168" width="64" height="48" rx="8" stroke="currentColor" strokeWidth="18" />
          <path d="M100 64h24a20 20 0 0120 20v44M100 192h24a20 20 0 0020-20v-44" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'pas-policy':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <path d="M160 32H56a16 16 0 00-16 16v160a16 16 0 0016 16h144a16 16 0 0016-16V88z" stroke="currentColor" strokeWidth="18" strokeLinejoin="round" />
          <path d="M160 32v56h56M96 144l20 20 44-44" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'pos-operations':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <rect x="40" y="32" width="176" height="192" rx="16" stroke="currentColor" strokeWidth="18" />
          <rect x="64" y="56" width="128" height="64" rx="8" stroke="currentColor" strokeWidth="18" />
          <circle cx="80" cy="160" r="12" fill="currentColor" />
          <circle cx="128" cy="160" r="12" fill="currentColor" />
          <circle cx="176" cy="160" r="12" fill="currentColor" />
          <circle cx="80" cy="192" r="12" fill="currentColor" />
          <circle cx="128" cy="192" r="12" fill="currentColor" />
          <circle cx="176" cy="192" r="12" fill="currentColor" />
        </svg>
      );
    case 'statutory-reports':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <rect x="48" y="24" width="160" height="208" rx="16" stroke="currentColor" strokeWidth="18" />
          <path d="M96 80h64M96 128h64M96 176h32" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
        </svg>
      );
    case 'mga-operations':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <path d="M32 224V96l96-72 96 72v128H32z" stroke="currentColor" strokeWidth="18" strokeLinejoin="round" />
          <rect x="96" y="136" width="64" height="88" rx="8" stroke="currentColor" strokeWidth="18" />
        </svg>
      );
    case 'admin-config':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <circle cx="128" cy="128" r="40" stroke="currentColor" strokeWidth="18" />
          <path d="M128 24v24M128 208v24M24 128h24M208 128h24M54.34 54.34l17 17M184.66 184.66l17 17M54.34 201.66l17-17M184.66 71.34l17-17" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
        </svg>
      );
    case 'identity':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <circle cx="96" cy="80" r="40" stroke="currentColor" strokeWidth="18" />
          <path d="M24 208c0-44 36-72 80-72s80 28 80 72" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
          <path d="M176 120l24 24 48-48" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'dictionary':
    case 'docs':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <path d="M32 64a24 24 0 0124-24h152a16 16 0 0116 16v160H56a24 24 0 00-24 24z" stroke="currentColor" strokeWidth="18" strokeLinejoin="round" />
          <path d="M32 192a24 24 0 0124-24h168" stroke="currentColor" strokeWidth="18" />
        </svg>
      );
    case 'entity-hierarchy':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <circle cx="128" cy="48" r="24" stroke="currentColor" strokeWidth="18"/>
          <circle cx="48" cy="192" r="24" stroke="currentColor" strokeWidth="18"/>
          <circle cx="208" cy="192" r="24" stroke="currentColor" strokeWidth="18"/>
          <path d="M128 72v48M48 168v-24a24 24 0 0124-24h112a24 24 0 0124 24v24" stroke="currentColor" strokeWidth="18" strokeLinecap="round"/>
        </svg>
      );
    case 'payroll':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <circle cx="96" cy="80" r="36" stroke="currentColor" strokeWidth="18"/>
          <path d="M24 200c0-40 32-64 72-64s72 24 72 64" stroke="currentColor" strokeWidth="18" strokeLinecap="round"/>
          <path d="M168 56h56M168 96h56M168 136h36" stroke="currentColor" strokeWidth="18" strokeLinecap="round"/>
        </svg>
      );
    case 'inventory':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <path d="M32 80l96-48 96 48-96 48-96-48z" stroke="currentColor" strokeWidth="18" strokeLinejoin="round"/>
          <path d="M32 80v96l96 48 96-48V80" stroke="currentColor" strokeWidth="18" strokeLinejoin="round"/>
          <path d="M128 128v96" stroke="currentColor" strokeWidth="18"/>
        </svg>
      );
    case 'fixed-assets':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <rect x="32" y="96" width="192" height="128" rx="16" stroke="currentColor" strokeWidth="18"/>
          <path d="M80 96V64a32 32 0 0164 0v32M128 144v48" stroke="currentColor" strokeWidth="18" strokeLinecap="round"/>
        </svg>
      );
    case 'projects':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <rect x="32" y="48" width="192" height="160" rx="16" stroke="currentColor" strokeWidth="18"/>
          <path d="M32 96h192M80 144h48M80 176h80" stroke="currentColor" strokeWidth="18" strokeLinecap="round"/>
        </svg>
      );
    case 'fx':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <circle cx="128" cy="128" r="96" stroke="currentColor" strokeWidth="18"/>
          <path d="M32 128h192M128 32a134 134 0 00-40 96 134 134 0 0040 96M128 32a134 134 0 0140 96 134 134 0 01-40 96" stroke="currentColor" strokeWidth="18"/>
        </svg>
      );
    case 'budgeting':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <path d="M32 208l56-64 48 40 48-80 40 32M32 48h192" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'subledger':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <rect x="32" y="160" width="192" height="48" rx="8" stroke="currentColor" strokeWidth="18"/>
          <rect x="32" y="104" width="192" height="48" rx="8" stroke="currentColor" strokeWidth="18"/>
          <rect x="32" y="48" width="192" height="48" rx="8" stroke="currentColor" strokeWidth="18"/>
        </svg>
      );
    case 'reinsurance':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <path d="M224 128a96 96 0 01-192 0" stroke="currentColor" strokeWidth="18" strokeLinecap="round"/>
          <path d="M32 128a96 96 0 01192 0" stroke="currentColor" strokeWidth="18" strokeLinecap="round"/>
          <path d="M176 88l48 40-48 40M80 88L32 128l48 40" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'compliance-filings':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <circle cx="128" cy="128" r="96" stroke="currentColor" strokeWidth="18"/>
          <path d="M88 128l28 28 52-52" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'premium-claims':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <path d="M128 24L32 64v64c0 52 40 100 96 112 56-12 96-60 96-112V64L128 24z" stroke="currentColor" strokeWidth="18" strokeLinejoin="round"/>
          <path d="M88 128l28 28 52-52" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'premium-tax':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <rect x="32" y="48" width="192" height="160" rx="16" stroke="currentColor" strokeWidth="18"/>
          <path d="M80 96h24M152 96h24M80 144h32M152 144h24M120 96v64" stroke="currentColor" strokeWidth="18" strokeLinecap="round"/>
        </svg>
      );
    case 'audit-trail':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <path d="M128 32a96 96 0 1096 96 96 96 0 00-96-96zm0 48v48l36 36" stroke="currentColor" strokeWidth="18" strokeLinecap="round"/>
        </svg>
      );
    case 'integration':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <circle cx="64" cy="64" r="32" stroke="currentColor" strokeWidth="18"/>
          <circle cx="192" cy="64" r="32" stroke="currentColor" strokeWidth="18"/>
          <circle cx="128" cy="192" r="32" stroke="currentColor" strokeWidth="18"/>
          <path d="M88 88l28 72M168 88l-28 72" stroke="currentColor" strokeWidth="18"/>
        </svg>
      );
    case 'documents':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <path d="M64 24h96l56 56v152a16 16 0 01-16 16H64a16 16 0 01-16-16V40a16 16 0 0116-16z" stroke="currentColor" strokeWidth="18" strokeLinejoin="round"/>
          <path d="M160 24v56h56" stroke="currentColor" strokeWidth="18" strokeLinejoin="round"/>
        </svg>
      );
    case 'gl-simulation':
    case 'insurance-flow-simulator':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <circle cx="64" cy="64" r="24" stroke="currentColor" strokeWidth="18"/>
          <circle cx="192" cy="64" r="24" stroke="currentColor" strokeWidth="18"/>
          <circle cx="128" cy="192" r="24" stroke="currentColor" strokeWidth="18"/>
          <path d="M84 76l32 92M172 76l-32 92" stroke="currentColor" strokeWidth="18"/>
        </svg>
      );
    case 'sales-transactions':
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <path d="M40 48h24l32 112h112l24-80H72" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="104" cy="196" r="16" stroke="currentColor" strokeWidth="18"/>
          <circle cx="192" cy="196" r="16" stroke="currentColor" strokeWidth="18"/>
        </svg>
      );
    default:
      return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none">
          <rect x="32" y="48" width="80" height="64" rx="8" stroke="currentColor" strokeWidth="18" />
          <rect x="144" y="48" width="80" height="96" rx="8" stroke="currentColor" strokeWidth="18" />
          <rect x="32" y="144" width="80" height="64" rx="8" stroke="currentColor" strokeWidth="18" />
          <rect x="144" y="176" width="80" height="32" rx="8" stroke="currentColor" strokeWidth="18" />
        </svg>
      );
  }
}
