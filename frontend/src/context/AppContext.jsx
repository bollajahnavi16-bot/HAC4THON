import React, { createContext, useContext, useState, useEffect } from 'react';
import { approvalAPI, incidentAPI, metricsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [activeIncidentsCount, setActiveIncidentsCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  const addToast = ({ title, message, type = 'info' }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshBadges = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await metricsAPI.getDashboard();
      if (res.data?.success && res.data.data?.kpis) {
        setPendingApprovalsCount(res.data.data.kpis.pendingApprovalsCount ?? 0);
        setActiveIncidentsCount(res.data.data.kpis.activeIncidents ?? 0);
      }
    } catch {
      // Ignore background badge errors
    }
  };

  useEffect(() => {
    refreshBadges();
    const interval = setInterval(refreshBadges, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <AppContext.Provider
      value={{
        pendingApprovalsCount,
        activeIncidentsCount,
        refreshBadges,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all transform translate-y-0 text-sm ${
              toast.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/80 border-rose-500/30 text-rose-200'
                : toast.type === 'warning'
                ? 'bg-amber-950/80 border-amber-500/30 text-amber-200'
                : 'bg-navy-850/90 border-cyan-500/30 text-cyan-200'
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <h4 className="font-semibold">{toast.title}</h4>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white font-mono text-xs"
              >
                ✕
              </button>
            </div>
            {toast.message && <p className="mt-1 text-xs opacity-90">{toast.message}</p>}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
