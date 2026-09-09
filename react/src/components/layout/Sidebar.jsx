import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NAV_CONFIG, isGroupVisibleForType, isChildVisibleForType } from '../../data/navigation';
import {
  MonogramLogo,
  ChevronIcon,
  CollapseIcon,
  NavIcon
} from '../common/Icons';

export function Sidebar({ isCollapsed, onToggleCollapse }) {
  const location = useLocation();
  const { activeEntity, currentUser, accountingLevel } = useAuth();
  const { showGlSimulation } = useTheme();
  const bType = currentUser?.businessType || activeEntity?.businessType || 'mga';

  // Insurance Flow Simulator's role default — hidden for carrier, shown for
  // everyone else — unless the user has explicitly picked a preference via
  // the Density & Sizing panel (showGlSimulation is then true/false, not
  // null, and wins regardless of role).
  const glSimVisible = showGlSimulation === null ? bType !== 'carrier' : showGlSimulation;

  // Visible groups based on business type and accounting level
  const visibleGroups = NAV_CONFIG.filter(group => isGroupVisibleForType(group.id, bType, accountingLevel));

  // Keep track of which nav groups are expanded. Only the group that
  // actually contains the page you're on starts open — groups used to be
  // hardcoded open ('dashboard' and 'gl' always true) regardless of where
  // you were, which is why "Platform & Dashboards" kept showing expanded
  // and clicking it to collapse never stuck across a reload/navigation.
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const initial = {};
    NAV_CONFIG.forEach(group => {
      initial[group.id] = group.children.some(c => {
        const [cPath] = c.href.split('#');
        return window.location.pathname === cPath;
      });
    });
    return initial;
  });

  // Auto-expand group containing current route
  useEffect(() => {
    visibleGroups.forEach(group => {
      const hasMatch = group.children.some(c => location.pathname === c.href);
      if (hasMatch) {
        setExpandedGroups(prev => ({ ...prev, [group.id]: true }));
      }
    });
  }, [location.pathname]);

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <aside className="sidebar" aria-label="Primary Navigation">
      {/* Brand Logo */}
      <div className="sidebar-logo">
        <Link to="/" className="sidebar-logo-link" title="VeriDex Home">
          <MonogramLogo />
          <div className="logo-wordmark">
            <span className="logo-wordmark-veri">Veri</span>
            <span className="logo-wordmark-dex">Dex</span>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {visibleGroups.map((group) => {
          const visibleChildren = group.children.filter(c =>
            isChildVisibleForType(c.id, bType, accountingLevel) && (c.id !== 'gl-simulation' || glSimVisible)
          );
          if (!visibleChildren.length) return null;

          const hasActiveChild = visibleChildren.some(c => {
            const [cPath] = c.href.split('#');
            return location.pathname === cPath;
          });
          const isExpanded = Boolean(expandedGroups[group.id]) || hasActiveChild;

          return (
            <div className="nav-group" key={group.id}>
              <div
                className={`nav-item parent ${isExpanded ? 'expanded' : ''}`}
                data-label={group.label}
                title={group.label}
                onClick={() => toggleGroup(group.id)}
              >
                <span className="nav-icon">
                  <NavIcon id={group.id} />
                </span>
                <span className="nav-label">{group.label}</span>
                <ChevronIcon />
              </div>

              <div className={`nav-sub ${isExpanded ? 'open' : ''}`} id={`sub-${group.id}`}>
                {visibleChildren.map((child) => {
                  const [childPath, childHash] = child.href.split('#');
                  const currentPath = location.pathname;
                  const currentHash = location.hash.replace('#', '');

                  const pathMatches = currentPath === childPath ||
                    (currentPath === '/' && childPath === '/dashboard') ||
                    (currentPath === '/dashboard' && childPath === '/');

                  let isActive = false;
                  if (pathMatches) {
                    if (childHash) {
                      isActive = currentHash === childHash;
                    } else {
                      isActive = !currentHash || currentHash === '';
                    }
                  }

                  return (
                    <Link
                      key={child.id}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      to={child.href}
                      data-label={child.label}
                      title={child.label}
                    >
                      <span className="nav-icon">
                        <NavIcon id={child.id} />
                      </span>
                      <span className="nav-label">{child.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Collapse Sidebar Button */}
      <button
        type="button"
        className="nav-collapse-btn"
        onClick={onToggleCollapse}
        aria-label="Collapse navigation sidebar"
      >
        <CollapseIcon />
        <span className="nav-collapse-text">
          {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        </span>
      </button>
    </aside>
  );
}
