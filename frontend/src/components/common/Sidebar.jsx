import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  GitBranch,
  ShieldCheck,
  BookOpen,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const NAV_SECTIONS = [
  {
    label: 'Operations',
    items: [
      { label: 'Dashboard',          path: '/dashboard',  icon: LayoutDashboard },
      { label: 'Incidents',          path: '/incidents',  icon: AlertTriangle,   badge: 'incidents' },
      { label: 'Agent Workflows',    path: '/workflow',   icon: GitBranch },
      { label: 'Approval Queue',     path: '/approvals',  icon: ShieldCheck,     badge: 'approvals' },
      { label: 'Audit & Compliance', path: '/audit',      icon: BookOpen },
      { label: 'Analytics',          path: '/analytics',  icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings',           path: '/settings',   icon: Settings },
    ],
  },
];

export const Sidebar = ({ collapsed = false, onToggle }) => {
  const { pendingApprovalsCount, activeIncidentsCount } = useApp();
  const [localCollapsed, setLocalCollapsed] = useState(false);

  const isCollapsed = collapsed ?? localCollapsed;
  const handleToggle = onToggle ?? (() => setLocalCollapsed((c) => !c));

  const getBadgeCount = (key) => {
    if (key === 'approvals') return pendingApprovalsCount;
    if (key === 'incidents') return activeIncidentsCount;
    return 0;
  };

  return (
    <aside
      className={`
        flex-shrink-0 flex flex-col border-r border-border bg-surface-nav
        transition-[width] duration-200 ease-in-out
        hidden md:flex
        ${isCollapsed ? 'w-14' : 'w-56'}
      `}
    >
      {/* Logo / Brand */}
      <div className={`h-14 flex items-center border-b border-border flex-shrink-0 ${isCollapsed ? 'justify-center px-0' : 'px-4 justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded bg-brand flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-primary truncate leading-tight">AgentOps</p>
              <p className="text-2xs text-ink-muted truncate leading-tight">Recovery Platform</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-7 h-7 rounded bg-brand flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!isCollapsed && (
              <p className="px-2 mb-1 text-2xs font-semibold uppercase tracking-widest text-ink-disabled">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const badgeCount = item.badge ? getBadgeCount(item.badge) : 0;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) => `
                      group flex items-center gap-2.5 px-2 py-2 rounded-md text-sm
                      transition-all duration-100 relative
                      ${isCollapsed ? 'justify-center' : 'justify-between'}
                      ${isActive
                        ? 'bg-surface-panel text-ink-primary font-medium border-l-2 border-brand pl-[6px]'
                        : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-panel/60 border-l-2 border-transparent pl-[6px]'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="truncate text-sm">{item.label}</span>
                      )}
                    </div>
                    {!isCollapsed && badgeCount > 0 && (
                      <span className={`
                        flex-shrink-0 min-w-[18px] h-[18px] flex items-center justify-center
                        rounded-full text-2xs font-bold px-1
                        ${item.badge === 'approvals'
                          ? 'bg-warn/20 text-warn-text border border-warn/30'
                          : 'bg-danger/20 text-danger-text border border-danger/30'
                        }
                      `}>
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                    {isCollapsed && badgeCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-warn border border-surface-nav" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <button
          onClick={handleToggle}
          className="w-full flex items-center justify-center p-2 rounded-md text-ink-muted hover:text-ink-secondary hover:bg-surface-panel transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
};

