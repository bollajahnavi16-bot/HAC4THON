import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Scan, LogOut, Bell, ChevronRight, Loader2, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { incidentAPI } from '../../services/api';

// Breadcrumb mapping
const BREADCRUMBS = {
  '/dashboard':  [{ label: 'Dashboard' }],
  '/incidents':  [{ label: 'Operations' }, { label: 'Incidents' }],
  '/workflow':   [{ label: 'Operations' }, { label: 'Agent Workflows' }],
  '/approvals':  [{ label: 'Operations' }, { label: 'Approval Queue' }],
  '/audit':      [{ label: 'Compliance' }, { label: 'Audit Log' }],
  '/analytics':  [{ label: 'Analytics' }],
  '/settings':   [{ label: 'System' }, { label: 'Settings' }],
};

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { pendingApprovalsCount, refreshBadges, addToast } = useApp();
  const [scanning, setScanning] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Resolve breadcrumbs from path
  const pathKey = Object.keys(BREADCRUMBS)
    .sort((a, b) => b.length - a.length)
    .find((k) => location.pathname.startsWith(k));
  const crumbs = BREADCRUMBS[pathKey] || [{ label: 'Dashboard' }];

  const handleScan = async () => {
    if (scanning) return;
    setScanning(true);
    try {
      const res = await incidentAPI.scanAnomalies();
      if (res.data.success) {
        addToast({
          title: 'Anomaly Scan Complete',
          message: res.data.message,
          type: res.data.newlyCreatedCount > 0 ? 'warning' : 'success',
        });
        refreshBadges();
      }
    } catch (err) {
      addToast({
        title: 'Scan Failed',
        message: err.response?.data?.error || 'Unable to reach monitor service',
        type: 'error',
      });
    } finally {
      setScanning(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'OP';

  return (
    <header className="h-14 flex-shrink-0 border-b border-border bg-surface-nav flex items-center justify-between px-4 md:px-6 z-40 sticky top-0">
      {/* Left: Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-ink-disabled flex-shrink-0" />
            )}
            <span
              className={`truncate ${
                i < crumbs.length - 1
                  ? 'text-ink-muted'
                  : 'text-ink-primary font-medium'
              }`}
            >
              {crumb.label}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* Right: Actions + User */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Anomaly Scan */}
        <button
          onClick={handleScan}
          disabled={scanning}
          title="Trigger monitor agent to scan all operational records"
          className="
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
            bg-surface-raised border border-border
            text-ink-secondary hover:text-ink-primary hover:border-border-strong
            transition-all duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {scanning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Scan className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">{scanning ? 'Scanning…' : 'Scan'}</span>
        </button>

        {/* Approval queue bell */}
        <Link
          to="/approvals"
          title="Approval Queue"
          className="
            relative p-2 rounded-md
            text-ink-secondary hover:text-ink-primary hover:bg-surface-raised
            transition-colors duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60
          "
        >
          <Bell className="w-4 h-4" />
          {pendingApprovalsCount > 0 && (
            <span className="
              absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5
              flex items-center justify-center
              rounded-full bg-warn text-ink-inverse text-2xs font-bold
            ">
              {pendingApprovalsCount > 9 ? '9+' : pendingApprovalsCount}
            </span>
          )}
        </Link>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-xs font-medium text-ink-primary">{user?.name || 'Operator'}</span>
            <span className="text-2xs text-ink-muted capitalize">{user?.role || 'operator'}</span>
          </div>
          <div className="w-8 h-8 rounded-md bg-surface-overlay border border-border flex items-center justify-center">
            <span className="text-xs font-semibold text-ink-secondary">{initials}</span>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="
              p-1.5 rounded-md text-ink-muted hover:text-danger-text hover:bg-danger/10
              transition-colors duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60
            "
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

