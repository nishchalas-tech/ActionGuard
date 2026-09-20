import React from 'react';
import {
  ShieldAlert,
  Activity,
  Zap,
  Bot,
  UserCheck,
  Flame,
  Sliders,
  FileCode2,
  History,
  BarChart3,
  Briefcase,
  Layers,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export type NavItem =
  | 'overview'
  | 'simulator'
  | 'agent_sim'
  | 'approvals'
  | 'attack_lab'
  | 'what_if'
  | 'policies'
  | 'policy_builder'
  | 'audit'
  | 'analytics'
  | 'use_cases'
  | 'architecture'
  | 'benchmarks';

interface SidebarProps {
  currentView: NavItem;
  onNavigate?: (view: NavItem) => void;
  onSelectView?: (view: NavItem) => void;
  pendingApprovalsCount?: number;
  threatsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onSelectView,
  pendingApprovalsCount = 0,
  threatsCount = 0
}) => {
  const handleSelect = onNavigate || onSelectView || (() => {});

  const navItems: { id: NavItem; label: string; icon: React.ReactNode; badge?: number | string; badgeColor?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { id: 'simulator', label: 'Action Simulator', icon: <Zap className="w-4 h-4" /> },
    { id: 'agent_sim', label: 'Agent Simulator', icon: <Bot className="w-4 h-4" /> },
    {
      id: 'approvals',
      label: 'Approval Center',
      icon: <UserCheck className="w-4 h-4" />,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold'
    },
    {
      id: 'attack_lab',
      label: 'Security Lab',
      icon: <Flame className="w-4 h-4" />,
      badge: threatsCount > 0 ? `${threatsCount} Alerts` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
    },
    { id: 'what_if', label: 'What-If Simulator', icon: <Sliders className="w-4 h-4" /> },
    { id: 'policies', label: 'Policy Engine', icon: <FileCode2 className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit Trail', icon: <History className="w-4 h-4" /> },
    { id: 'use_cases', label: 'Enterprise Framework', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'benchmarks', label: '10 Verification Tests', icon: <CheckCircle2 className="w-4 h-4" /> }
  ];

  return (
    <aside
      id="actionguard-sidebar"
      className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col shrink-0 min-h-screen select-none"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">ACTIONGUARD</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-none mt-1">
              AI Agent Action Control Plane
            </p>
          </div>
        </div>

        {/* Protection Active Indicator */}
        <div className="mt-4 px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-400">PROTECTION ACTIVE</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">42ms</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Core Navigation
        </div>
        {navItems.map(item => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-blue-400' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Status & Demo Guarantee */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 text-[11px] space-y-2">
        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-200 font-semibold mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sandbox Isolation</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            All tools operate in safe simulated mode. No real payment, bank, or database credentials are ever exposed.
          </p>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-1 font-mono">
          <span>DEMO ENVIRONMENT</span>
          <span className="text-emerald-500">READY</span>
        </div>
      </div>
    </aside>
  );
};
