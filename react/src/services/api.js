/**
 * Veridex Finance System - API Service Client
 * Connects React frontend to Express + MongoDB backend via Vite proxy (/api)
 */

const BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` 
  : '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    console.warn(`[API Client] Error on ${options.method || 'GET'} ${url}:`, error.message);
    throw error;
  }
}

export const api = {
  // System & Health
  checkHealth: () => request('/health'),
  seedDatabase: (clean = false) => request(`/seed?clean=${clean}`, { method: 'POST' }),
  resetData: () => request('/seed/reset-data', { method: 'POST' }),
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),

  // Chart of Accounts
  getAccounts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/accounts${query ? `?${query}` : ''}`);
  },
  getAccount: (code) => request(`/accounts/${encodeURIComponent(code)}`),
  createAccount: (accountData) => request('/accounts', {
    method: 'POST',
    body: JSON.stringify(accountData),
  }),
  updateAccount: (code, accountData) => request(`/accounts/${encodeURIComponent(code)}`, {
    method: 'PUT',
    body: JSON.stringify(accountData),
  }),
  deleteAccount: (code) => request(`/accounts/${encodeURIComponent(code)}`, { method: 'DELETE' }),

  // Journal Entries
  getJournalEntries: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/journal-entries${query ? `?${query}` : ''}`);
  },
  getJournalEntry: (id) => request(`/journal-entries/${encodeURIComponent(id)}`),
  createJournalEntry: (entryData) => request('/journal-entries', {
    method: 'POST',
    body: JSON.stringify(entryData),
  }),
  postJournalEntry: (id) => request(`/journal-entries/${encodeURIComponent(id)}/post`, {
    method: 'PATCH',
  }),

  // Fiscal Periods
  getPeriods: () => request('/periods'),
  updatePeriod: (id, updates) => request(`/periods/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),

  // Users (User Management)
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/users${query ? `?${query}` : ''}`);
  },
  createUser: (userData) => request('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  updateUser: (id, userData) => request(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  // Invoices (AR / AP)
  getInvoices: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/invoices${query ? `?${query}` : ''}`);
  },
  createInvoice: (invoiceData) => request('/invoices', {
    method: 'POST',
    body: JSON.stringify(invoiceData),
  }),
  payInvoice: (id, paymentAmount, status) => request(`/invoices/${encodeURIComponent(id)}/pay`, {
    method: 'PATCH',
    body: JSON.stringify({ paymentAmount, status }),
  }),
  updateInvoice: (id, updates) => request(`/invoices/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),

  // Bank Transactions
  getBankTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/bank-transactions${query ? `?${query}` : ''}`);
  },
  matchBankTransaction: (id, matchData) => request(`/bank-transactions/${id}/match`, {
    method: 'PATCH',
    body: JSON.stringify(matchData),
  }),
  seedBankTransactions: () => request('/bank-transactions/seed', { method: 'POST' }),

  // Commission Engine
  getCommissionPlans: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/commission-plans${query ? `?${query}` : ''}`);
  },
  createCommissionPlan: (planData) => request('/commission-plans', {
    method: 'POST',
    body: JSON.stringify(planData),
  }),
  getCommissionTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/commission-transactions${query ? `?${query}` : ''}`);
  },
  createCommissionTransaction: (txnData) => request('/commission-transactions', {
    method: 'POST',
    body: JSON.stringify(txnData),
  }),
  deleteCommissionPlan: (id) => request(`/commission-plans/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  deleteCommissionTransaction: (id) => request(`/commission-transactions/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // PAS Event Data Injector
  getPasEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/pas-events${query ? `?${query}` : ''}`);
  },
  createPasEvent: (eventData) => request('/pas-events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  })
};

export default api;
