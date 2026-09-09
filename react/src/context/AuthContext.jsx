import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { MOCK_USERS, DEMO_PASSWORD } from '../data/mockUsers';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('v_platform_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && ['insured@gmail.com', 'mga@gmail.com', 'broker@gmail.com', 'carrier@gmail.com'].every(email => parsed.some(u => u.email === email))) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return MOCK_USERS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('v_user') || localStorage.getItem('v_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return MOCK_USERS[0]; // Default to Southlake Carrier
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(sessionStorage.getItem('v_auth') || localStorage.getItem('v_auth') || true);
  });

  useEffect(() => {
    localStorage.setItem('v_platform_users', JSON.stringify(users));
  }, [users]);

  // Hydrate users list from MongoDB Atlas backend on load
  useEffect(() => {
    api.getUsers().then(dbUsers => {
      if (Array.isArray(dbUsers) && dbUsers.length > 0) {
        setUsers(dbUsers.map(u => ({
          id: u._id,
          email: u.email,
          name: u.name,
          role: u.role,
          roleLabel: u.roleLabel,
          entityId: u.entityId,
          entityName: u.entityName,
          businessType: u.businessType,
          businessLabel: u.businessLabel,
          avatarColor: u.avatarColor,
          initials: u.initials,
          department: u.department,
          status: u.status,
          twoFactorEnabled: u.twoFactorEnabled,
          createdAt: u.createdAt
        })));
      }
    }).catch(err => console.warn('[Atlas Users Sync]:', err.message));
  }, []);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('v_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  const [accountingLevel, setAccountingLevelState] = useState(() => {
    try {
      return sessionStorage.getItem('v_accounting_level') || localStorage.getItem('v_accounting_level') || 'insurance';
    } catch {
      return 'insurance';
    }
  });

  const setAccountingLevel = (level) => {
    const nextLevel = level === 'pizza' ? 'pizza' : 'insurance';
    setAccountingLevelState(nextLevel);
    sessionStorage.setItem('v_accounting_level', nextLevel);
    localStorage.setItem('v_accounting_level', nextLevel);

    if (nextLevel === 'pizza') {
      const pizzaEmails = ['hub@pizza.demo', 'franchise@pizza.demo', 'ownstore@pizza.demo', 'customer@pizza.demo'];
      if (!pizzaEmails.includes(currentUser?.email?.toLowerCase())) {
        const defaultPizzaUser = users.find(u => u.email === 'hub@pizza.demo') || users.find(u => u.accountingLevel === 'pizza') || MOCK_USERS.find(u => u.email === 'hub@pizza.demo');
        if (defaultPizzaUser) {
          setCurrentUser(defaultPizzaUser);
          sessionStorage.setItem('v_user', JSON.stringify(defaultPizzaUser));
        }
      }
    } else {
      const pizzaEmails = ['hub@pizza.demo', 'franchise@pizza.demo', 'ownstore@pizza.demo', 'customer@pizza.demo'];
      if (pizzaEmails.includes(currentUser?.email?.toLowerCase())) {
        const defaultInsuranceUser = users.find(u => u.email === 'carrier@gmail.com') || users.find(u => u.accountingLevel === 'insurance') || MOCK_USERS[1];
        if (defaultInsuranceUser) {
          setCurrentUser(defaultInsuranceUser);
          sessionStorage.setItem('v_user', JSON.stringify(defaultInsuranceUser));
        }
      }
    }
  };

  // Derived Active Entity
  const activeEntity = useMemo(() => {
    const isPizza = accountingLevel === 'pizza';
    const fallbackId = isPizza ? 'ENT-HUB-01' : 'ENT-CAR-01';
    const fallbackName = isPizza ? "Domino's Main Company" : 'Southlake Insurance Co.';
    const fallbackRole = isPizza ? 'Main Company Controller' : 'Carrier Executive';

    let businessType = currentUser?.businessType;
    if (!businessType) {
      businessType = (currentUser?.role || '').toLowerCase().includes('mga')
        ? 'mga'
        : (currentUser?.role || '').toLowerCase().includes('broker') || (currentUser?.role || '').toLowerCase().includes('agency')
        ? 'agency'
        : isPizza ? 'hub' : 'carrier';
    }

    return {
      id: currentUser?.entityId || fallbackId,
      name: currentUser?.entityName || fallbackName,
      role: currentUser?.roleLabel || currentUser?.role || fallbackRole,
      businessType
    };
  }, [currentUser, accountingLevel]);

  const login = async (email, password, remember = false, targetLevel = null) => {
    const trimmed = (email || '').trim().toLowerCase();

    // Determine target accounting level
    let detectedLevel = targetLevel;
    if (!detectedLevel) {
      const pizzaEmails = ['hub@pizza.demo', 'franchise@pizza.demo', 'ownstore@pizza.demo', 'customer@pizza.demo'];
      detectedLevel = pizzaEmails.includes(trimmed) ? 'pizza' : 'insurance';
    }
    setAccountingLevelState(detectedLevel);
    sessionStorage.setItem('v_accounting_level', detectedLevel);
    localStorage.setItem('v_accounting_level', detectedLevel);

    // Try backend authentication first
    try {
      const res = await api.login(trimmed, password);
      if (res && res.success) {
        const found = users.find(u => u.email.toLowerCase() === trimmed) || res.user;
        setCurrentUser(found);
        setIsAuthenticated(true);
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('v_auth', '1');
        storage.setItem('v_user', JSON.stringify(found));
        return { success: true, user: found };
      }
    } catch (e) {
      console.warn('[AuthContext] Backend login check fallback:', e.message);
    }

    // Local fallback
    const found = users.find(u => u.email.toLowerCase() === trimmed);
    if (!found || password !== DEMO_PASSWORD) {
      return { success: false, message: 'Invalid credentials. Please use admin@123' };
    }
    setCurrentUser(found);
    setIsAuthenticated(true);
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('v_auth', '1');
    storage.setItem('v_user', JSON.stringify(found));
    return { success: true, user: found };
  };

  const switchRole = (emailOrRole) => {
    const target = users.find(u => u.email === emailOrRole || u.role === emailOrRole || u.entityId === emailOrRole);
    if (target) {
      if (target.accountingLevel) {
        setAccountingLevelState(target.accountingLevel);
        sessionStorage.setItem('v_accounting_level', target.accountingLevel);
        localStorage.setItem('v_accounting_level', target.accountingLevel);
      }
      setCurrentUser(target);
      sessionStorage.setItem('v_user', JSON.stringify(target));
      localStorage.setItem('v_user', JSON.stringify(target));
    }
  };

  const logout = () => {
    sessionStorage.removeItem('v_auth');
    sessionStorage.removeItem('v_user');
    localStorage.removeItem('v_auth');
    localStorage.removeItem('v_user');
    setIsAuthenticated(false);
  };

  // User Management CRUD
  const addUser = (userData) => {
    const created = {
      ...userData,
      id: `USR-${Date.now().toString().slice(-4)}`,
      status: 'Active',
      createdAt: new Date().toISOString().slice(0, 10),
      avatarColor: userData.avatarColor || '#F97316'
    };
    setUsers(prev => [...prev, created]);

    // Async push to MongoDB Atlas
    api.createUser({
      name: created.name,
      email: created.email,
      role: created.role,
      department: created.department,
      status: created.status,
      twoFactorEnabled: created.twoFactorEnabled
    }).catch(err => console.warn('[Atlas User Create Sync]:', err.message));

    return created;
  };

  const updateUser = (email, updates) => {
    setUsers(prev => prev.map(u => u.email === email ? { ...u, ...updates } : u));
    if (currentUser.email === email) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }

    // Async push to MongoDB Atlas
    api.updateUser(email, updates).catch(err => console.warn('[Atlas User Update Sync]:', err.message));
  };

  const toggleUserStatus = (email) => {
    const target = users.find(u => u.email === email);
    if (!target) return;
    const nextStatus = target.status === 'Active' ? 'Inactive' : 'Active';

    setUsers(prev => prev.map(u => u.email === email ? { ...u, status: nextStatus } : u));

    // Async push to MongoDB Atlas
    api.updateUser(email, { status: nextStatus }).catch(err => console.warn('[Atlas User Status Sync]:', err.message));
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      activeEntity,
      isAuthenticated,
      accountingLevel,
      setAccountingLevel,
      login,
      logout,
      switchRole,
      allUsers: users,
      users,
      addUser,
      updateUser,
      toggleUserStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
