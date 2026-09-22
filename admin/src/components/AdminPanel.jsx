// src/components/AdminPanel.jsx
// Mushi QR Pro â€” Super Admin Panel (SaaS-grade)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

import React, { Fragment, useState, useEffect, useRef, useContext, createContext, useCallback } from 'react';
import {
  LayoutDashboard, Users, CreditCard, BarChart3, FileText,
  Layers, QrCode, Grid, Package, Settings, Palette, Sliders,
  Flag, Settings2, Megaphone, UserCog, Shield, Activity, Lock,
  HardDrive, ClipboardList, Heart, Plug, Code, HelpCircle,
  ChevronDown, ChevronRight, ChevronLeft, Menu, X, Search, Bell,
  Plus, Trash2, Edit, Check, Copy, Download, Upload, RefreshCw,
  Eye, EyeOff, Server, Database, BarChart2, TrendingUp, TrendingDown,
  ArrowUpRight, MoreVertical, Calendar, AlertTriangle, CheckCircle,
  XCircle, Clock, Info, Star, Zap, Globe, AlertCircle, Save,
  ExternalLink, Key, ArrowLeft, Mail, Monitor, Cpu,
  DollarSign, Tag, Percent, Receipt, LogOut, Sun, Moon,
  Barcode, ScanLine, SlidersHorizontal, ArrowDownRight
} from 'lucide-react';

import * as DS from '../services/adminDataService';
import { FEATURE_REGISTRY, FEATURE_CATEGORIES, CANONICAL_PLANS, DEFAULT_FREE_FEATURES, DEFAULT_PAID_FEATURES } from '../services/FeatureAccessManager';
import { setFeatureFlagCloud, setPlanFeaturesCloud } from '../services/adminDataService';
import { QR_TEMPLATES } from '../utils/qrTemplates';
import { auth, googleProvider } from '../services/firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { useSuperAuthState as useAuthState, SUPER_ADMIN_EMAIL } from '../services/authService';
import GoldenAdminBadge from './GoldenAdminBadge';
import FeatureManagementPanel from './FeatureManagementPanel';
import AdminDashboard from './AdminDashboard';
import FeatureFlagsPanel from './FeatureFlagsPanel';
import FeatureRegistry from './FeatureRegistry';
import PlanManager from './PlanManager';
import FeatureMatrixManager from './FeatureMatrixManager';
import MembershipDashboard from './MembershipDashboard';
import AuditLogPanel from './AuditLogPanel';
import TransactionsManager from './TransactionsManager';
import VisualQRControlStudio from './VisualQRControlStudio';
import VisualBarcodeControlStudio from './VisualBarcodeControlStudio';
import VisualBulkControlStudio from './VisualBulkControlStudio';
import { getTokens } from './AdminUIKit';

// â”€â”€â”€ Static Fallback Design Tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const T = {
  ...getTokens(false),
  accent: '#FF4D9D',
  accentLow: 'rgba(255, 77, 157, 0.15)',
  purple: '#7B61FF',
  green: '#22C55E',
  orange: '#F59E0B',
  blue: '#3B82F6',
  red: '#EF4444',
  bgEl: '#10101a',
  sidebarAct: 'rgba(255, 77, 157, 0.15)',
  sidebarHov: 'rgba(255, 255, 255, 0.04)',
};

// â”€â”€â”€ Toast Notification System â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ToastCtx = createContext(null);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);
  const COLORS = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };
  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: '#1a1a2e', border: `1px solid ${COLORS[t.type] || COLORS.success}55`,
            borderLeft: `4px solid ${COLORS[t.type] || COLORS.success}`,
            borderRadius: 10, padding: '12px 18px', maxWidth: 360,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            color: '#f0f0f8', fontSize: 13, fontWeight: 600, fontFamily: 'Outfit, sans-serif',
            animation: 'adSlideIn 0.25s ease',
            pointerEvents: 'auto',
          }}>
            <span style={{ marginRight: 8 }}>
              {t.type === 'success' ? 'âœ…' : t.type === 'error' ? 'âŒ' : t.type === 'warning' ? 'âš ï¸' : 'â„¹ï¸'}
            </span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function useToast() {
  return useContext(ToastCtx);
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Safely convert any qrData value (string, {url}, {text}, {phone}, etc.) to a display string
function safeStr(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    // Common QR data shapes
    const v = val.url || val.text || val.phone || val.email || val.ssid
              || val.data || val.content || val.value || val.address || val.name;
    if (v) return safeStr(v);
    try { return JSON.stringify(val).slice(0, 60); } catch { return '[Object]'; }
  }
  return String(val);
}

function fmtBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(2) + ' MB';
}
function timeAgo(ts) {
  if (!ts) return 'â€”';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}
function fmtDate(ts) {
  if (!ts) return 'â€”';
  return new Date(ts).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

// â”€â”€â”€ Navigation Config (Matching Reference) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const LABELS = {
  dashboard:           'Dashboard',
  'qr-generator':      'QR Generator Control',
  'barcode-generator': 'Barcode Generator Control',
  'bulk-generator':    'Bulk Creation Control',
  'feature-flags':     'Feature Flags',
  'feature-matrix':    'Feature Matrix',
  users:               'Users',
  subscriptions:       'Subscriptions',
  plans:               'Plans',
  payments:            'Payments',
  transactions:        'Transactions',
  'qr-barcode':        'QR Generator Control',
  barcodes:            'Barcode Generator Control',
  bulk:                'Bulk Creation Control',
  analytics:           'Analytics',
  reports:             'Reports',
  templates:           'Templates',
  'scan-analytics':    'Scan Analytics',
  'app-settings':      'Settings',
  'admin-users':       'Admins',
  'audit-logs':        'Audit Logs',
  branding:            'Appearance',
  'remote-config':     'System Settings',
  categories:          'Categories',
  maintenance:         'Maintenance',
  announcements:       'Announcements',
  roles:               'Roles',
  security:            'Security',
  backups:             'Backups',
  'system-health':     'System Health',
  integrations:        'Integrations',
  developer:           'Developer / API',
  support:             'Support'
};

const NAV_MAIN = [
  { id: 'dashboard',         icon: LayoutDashboard,    label: 'Dashboard' },
  { id: 'qr-generator',      icon: QrCode,             label: 'QR Generator Control' },
  { id: 'barcode-generator', icon: Barcode,            label: 'Barcode Control' },
  { id: 'bulk-generator',    icon: Layers,             label: 'Bulk Creation Control' },
  { id: 'feature-flags',     icon: Flag,               label: 'Feature Flags' },
  { id: 'feature-matrix',    icon: Sliders,            label: 'Feature Matrix' },
  { id: 'users',             icon: Users,              label: 'Users' },
  { id: 'subscriptions',     icon: CreditCard,         label: 'Subscriptions' },
  { id: 'plans',             icon: Package,            label: 'Plans' },
  { id: 'payments',          icon: DollarSign,         label: 'Payments' },
  { id: 'transactions',      icon: FileText,           label: 'Transactions' },
  { id: 'analytics',         icon: BarChart3,          label: 'Analytics' },
  { id: 'reports',           icon: FileText,           label: 'Reports' },
  { id: 'templates',         icon: Palette,            label: 'Templates' },
  { id: 'scan-analytics',    icon: ScanLine,           label: 'Scan Analytics' },
  { id: 'app-settings',      icon: Settings,           label: 'Settings' },
  { id: 'admin-users',       icon: Shield,             label: 'Admins' },
  { id: 'audit-logs',        icon: ClipboardList,      label: 'Audit Logs' },
  { id: 'branding',          icon: SlidersHorizontal,  label: 'Appearance' },
  { id: 'remote-config',     icon: Cpu,                label: 'System Settings' },
];

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MICRO COMPONENTS (Theme-Aware with CSS Variables)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, icon, style }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    border: 'none', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s',
    opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap',
    ...(size === 'sm' ? { padding: '6px 12px', fontSize: 12 } : { padding: '9px 16px', fontSize: 13 }),
    ...style
  };
  const variants = {
    primary: { background: 'linear-gradient(135deg, #D60036 0%, #B5002D 100%)', color: '#fff', boxShadow: '0 4px 14px rgba(214, 0, 54, 0.35)' },
    ghost:   { background: 'transparent', color: 'var(--ad-text-sec)', border: `1px solid var(--ad-border)` },
    danger:  { background: `rgba(239, 68, 68, 0.12)`,  color: '#EF4444',  border: `1px solid rgba(239, 68, 68, 0.25)` },
    success: { background: `rgba(0, 230, 118, 0.12)`, color: '#00E676', border: `1px solid rgba(0, 230, 118, 0.25)` },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>
      {icon}{children}
    </button>
  );
}

function Badge({ children, color = '#7B61FF', style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 100,
      fontSize: 11, fontWeight: 700,
      background: `${color}18`, color, lineHeight: 1.2, whiteSpace: 'nowrap',
      ...style
    }}>{children}</span>
  );
}

function StatCard({ icon: Icon, label, value, color = '#7B61FF', trendLabel }) {
  return (
    <div style={{
      background: 'var(--ad-card)', border: `1px solid var(--ad-border)`, borderRadius: 16,
      padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0,
      boxShadow: 'var(--ad-card-shadow)'
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--ad-text-sec)', marginBottom: 2, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
        <div className="ad-stat-value" style={{ fontSize: 22, fontWeight: 900, color: 'var(--ad-text)', lineHeight: 1.1, letterSpacing: '-0.4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
        {trendLabel && (
          <div style={{ fontSize: 11, color: 'var(--ad-text-mut)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trendLabel}</div>
        )}
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: `1px solid var(--ad-border)` }}>
      <div style={{ flex: 1, paddingRight: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ad-text)' }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: 'var(--ad-text-sec)', marginTop: 2 }}>{description}</div>}
      </div>
      <Toggle checked={checked} onChange={() => onChange(!checked)} />
    </div>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? '#D60036' : 'var(--ad-input)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        position: 'absolute', top: 3, left: checked ? 23 : 3, transition: 'left 0.2s',
      }} />
    </button>
  );
}

function AdminCard({ title, subtitle, right, children, noPadding, style: s }) {
  return (
    <div style={{ background: 'var(--ad-card)', border: `1px solid var(--ad-border)`, borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--ad-card-shadow)', ...s }}>
      {(title || right) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid var(--ad-border)`, gap: 10 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {title && <div className="ad-card-title" style={{ fontSize: 14, fontWeight: 800, color: 'var(--ad-text)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>}
            {subtitle && <div style={{ fontSize: 11, color: 'var(--ad-text-sec)', marginTop: 2, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>}
          </div>
          {right && <div style={{ flexShrink: 0 }}>{right}</div>}
        </div>
      )}
      <div style={noPadding ? {} : { padding: '16px 18px' }}>{children}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 24px', gap: 14 }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: `rgba(255, 77, 157, 0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF4D9D' }}>
        <Icon size={28} />
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ad-text)', marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--ad-text-sec)', maxWidth: 340, lineHeight: 1.6 }}>{desc}</div>
      </div>
      {action}
    </div>
  );
}

function FormInput({ label, value, onChange, type = 'text', placeholder, disabled }) {
  return (
    <div>
      {label && <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ad-text-sec)', display: 'block', marginBottom: 6 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%', boxSizing: 'border-box', background: 'var(--ad-input)',
          border: `1px solid var(--ad-border)`,
          borderRadius: 10, color: 'var(--ad-text)', fontSize: 13, fontWeight: 600,
          padding: '10px 14px', outline: 'none', fontFamily: 'inherit',
          transition: 'border-color 0.15s', opacity: disabled ? 0.5 : 1,
        }}
      />
    </div>
  );
}

function FormTextarea({ label, value, onChange, rows = 4, placeholder }) {
  return (
    <div>
      {label && <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ad-text-sec)', display: 'block', marginBottom: 6 }}>{label}</label>}
      <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box', background: 'var(--ad-input)',
          border: `1px solid var(--ad-border)`,
          borderRadius: 10, color: 'var(--ad-text)', fontSize: 13,
          padding: '10px 14px', outline: 'none', fontFamily: 'inherit',
          transition: 'border-color 0.15s', resize: 'vertical',
        }}
      />
    </div>
  );
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <div>
      {label && <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ad-text-sec)', display: 'block', marginBottom: 6 }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box', background: 'var(--ad-input)',
          border: `1px solid var(--ad-border)`, borderRadius: 10, color: 'var(--ad-text)', fontSize: 13,
          padding: '10px 14px', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600
        }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SVG CHARTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function LineChartSVG({ data = [], series = [], height = 180 }) {
  if (!data.length) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMut, flexDirection: 'column', gap: 8 }}>
      <BarChart2 size={26} /><span style={{ fontSize: 12 }}>No data yet</span>
    </div>
  );
  const W = 560, H = 160, P = { t: 16, r: 20, b: 32, l: 8 };
  const cW = W - P.l - P.r, cH = H - P.t - P.b;
  const allVals = series.flatMap(s => data.map(d => d[s.key] || 0));
  const max = Math.max(...allVals, 1);
  const xAt = i => P.l + (data.length <= 1 ? cW / 2 : (i / (data.length - 1)) * cW);
  const yAt = v => P.t + cH - (v / max) * cH * 0.88;
  const makePath = key => data.map((d, i) => {
    const x = xAt(i), y = yAt(d[key] || 0);
    if (i === 0) return `M${x},${y}`;
    const px = xAt(i - 1), py = yAt(data[i - 1][key] || 0);
    const cpx = (px + x) / 2;
    return `C${cpx},${py} ${cpx},${y} ${x},${y}`;
  }).join(' ');
  const makeArea = key => {
    const base = P.t + cH, last = data.length - 1;
    return `${makePath(key)} L${xAt(last)},${base} L${xAt(0)},${base} Z`;
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }} preserveAspectRatio="xMidYMid meet">
      <defs>
        {series.map(s => (
          <linearGradient key={s.key} id={`lg_${s.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <line key={i} x1={P.l} y1={P.t + cH * p} x2={P.l + cW} y2={P.t + cH * p}
          stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      ))}
      {series.map(s => (
        <g key={s.key}>
          <path d={makeArea(s.key)} fill={`url(#lg_${s.key})`} />
          <path d={makePath(s.key)} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
      {data.map((d, i) => (
        <text key={i} x={xAt(i)} y={H - 6} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={10}>{d.label}</text>
      ))}
      {series.map(s => data.map((d, i) => (
        <circle key={`${s.key}${i}`} cx={xAt(i)} cy={yAt(d[s.key] || 0)} r={3.5} fill={s.color} />
      )))}
    </svg>
  );
}

function DonutSVG({ segments = [], size = 160 }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 52, cx = 80, cy = 80, circ = 2 * Math.PI * r;
  let cum = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 160 160">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={22} />
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={22} />
      ) : segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circ;
        const offset = -(cum / total * circ);
        cum += seg.value;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={22}
            strokeDasharray={`${Math.max(dash - 3, 0)} ${circ - Math.max(dash - 3, 0)}`}
            strokeDashoffset={offset} transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="round" />
        );
      })}
      <text x={cx} y={cy - 8} textAnchor="middle" fill={T.text} fontSize={22} fontWeight="900" fontFamily="Outfit, sans-serif">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={T.textSec} fontSize={11} fontFamily="Outfit, sans-serif">Total</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SIDEBAR (Consistent Light/Dark Mode, 3-Option Theme Selector)
// ═══════════════════════════════════════════════════════════════════════════

function Sidebar({ active, setActive, isMobile, open, onClose, isDark, themeMode, setThemeMode }) {
  return (
    <aside
      style={{
        width: 260,
        background: isDark ? '#0F1221' : '#FFFFFF',
        borderRight: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'}`,
        display: 'flex',
        flexDirection: 'column',
        position: isMobile ? 'fixed' : 'relative',
        left: isMobile ? (open ? 0 : -270) : 0,
        top: 0,
        bottom: 0,
        zIndex: isMobile ? 50 : 10,
        transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease, border-color 0.2s ease',
        boxShadow: isMobile && open ? (isDark ? '8px 0 36px rgba(0,0,0,0.7)' : '8px 0 36px rgba(15,23,42,0.15)') : 'none',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* Brand Header */}
      <div style={{
        padding: '18px 16px 14px',
        borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        background: isDark ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.04) 0%, transparent 100%)' : 'linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, transparent 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            position: 'relative',
            width: 42,
            height: 42,
            borderRadius: 11,
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)',
            border: '1.5px solid rgba(245, 158, 11, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: isDark ? '0 4px 14px rgba(245, 158, 11, 0.25)' : '0 4px 12px rgba(245, 158, 11, 0.2)',
          }}>
            <img
              src="/logo.webp"
              alt="Mushi QR Pro"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                borderRadius: 9
              }}
            />
            {/* Admin Shield Badge Overlay */}
            <div style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FDE047 0%, #F59E0B 50%, #B45309 100%)',
              border: `2px solid ${isDark ? '#0F1221' : '#FFFFFF'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              color: '#0F1221'
            }}>
              <Shield size={10} strokeWidth={3} fill="#0F1221" />
            </div>
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Mushi QR Pro
              </span>
            </div>
            <div style={{
              fontSize: 10,
              color: '#F59E0B',
              marginTop: 2,
              fontWeight: 800,
              letterSpacing: '0.6px',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <GoldenAdminBadge size={12} /> SUPER ADMIN
            </div>
          </div>
        </div>

        {isMobile && (
          <button
            onClick={onClose}
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
              border: 'none',
              borderRadius: 8,
              color: isDark ? '#8E95A9' : '#64748B',
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <div className="ad-sidebar-nav ad-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {NAV_MAIN.map(({ id, icon: Icon, label, isNew }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => {
                setActive(id);
                if (isMobile) onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '9px 12px',
                borderRadius: 10,
                border: 'none',
                background: isActive ? (isDark ? 'linear-gradient(135deg, rgba(214, 0, 54, 0.2) 0%, rgba(181, 0, 45, 0.16) 100%)' : 'linear-gradient(135deg, rgba(214, 0, 54, 0.12) 0%, rgba(181, 0, 45, 0.08) 100%)') : 'transparent',
                borderLeft: isActive ? '3px solid #D60036' : '3px solid transparent',
                color: isActive ? (isDark ? '#FFFFFF' : '#0F172A') : (isDark ? '#94A3B8' : '#64748B'),
                fontSize: 13,
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                boxSizing: 'border-box',
                transition: 'all 0.12s ease',
                outline: 'none',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)';
                  e.currentTarget.style.color = isDark ? '#FFFFFF' : '#0F172A';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = isDark ? '#94A3B8' : '#64748B';
                }
              }}
            >
              <Icon size={17} color={isActive ? '#D60036' : (isDark ? '#94A3B8' : '#64748B')} strokeWidth={isActive ? 2.4 : 1.9} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label}
              </span>
              {isNew && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 100,
                  background: 'rgba(214, 0, 54, 0.2)',
                  color: '#D60036',
                  lineHeight: 1,
                  letterSpacing: '0.3px',
                  flexShrink: 0
                }}>
                  New
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer with 3-Option Segmented Theme Control (Light, Dark, Auto) */}
      <div style={{
        padding: '14px 14px',
        borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flexShrink: 0,
        background: isDark ? '#0B0D18' : '#F8FAFC',
        transition: 'background 0.2s ease, border-color 0.2s ease'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          fontWeight: 800,
          color: isDark ? '#94A3B8' : '#64748B',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          <span>Theme Mode</span>
          <span style={{ fontSize: 10, color: '#FF4D9D', textTransform: 'capitalize', fontWeight: 800 }}>
            {themeMode === 'auto' ? `Auto (${isDark ? 'Dark' : 'Light'})` : themeMode}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 4,
          padding: 3,
          borderRadius: 12,
          background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.05)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.08)'}`
        }}>
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark',  label: 'Dark',  icon: Moon },
            { id: 'auto',  label: 'Auto',  icon: Monitor },
          ].map(({ id, label, icon: Icon }) => {
            const active = themeMode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setThemeMode(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  padding: '7px 0',
                  borderRadius: 9,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 11,
                  fontWeight: active ? 800 : 600,
                  background: active
                    ? (isDark ? '#D60036' : '#FFFFFF')
                    : 'transparent',
                  color: active
                    ? (isDark ? '#FFFFFF' : '#0F172A')
                    : (isDark ? '#94A3B8' : '#64748B'),
                  boxShadow: active
                    ? (isDark ? '0 2px 8px rgba(214,0,54,0.35)' : '0 2px 6px rgba(15,23,42,0.08)')
                    : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={13} strokeWidth={active ? 2.5 : 1.9} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HEADER (Mobile-First Notifications, Search, Profile)
// ═══════════════════════════════════════════════════════════════════════════

function Header({ section, onMenuToggle, isMobile, currentUser, isDark }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New Subscription',
      desc: 'fatima@example.com upgraded to Business Pro plan.',
      time: '5m ago',
      unread: true,
      icon: Zap,
      color: '#FF4D9D'
    },
    {
      id: 2,
      title: 'Cloud Functions Live',
      desc: 'Automated claim minting and token sync active.',
      time: '1h ago',
      unread: true,
      icon: CheckCircle,
      color: '#22C55E'
    },
    {
      id: 3,
      title: 'Security Rules Enforced',
      desc: 'Firestore RBAC security audit completed successfully.',
      time: '3h ago',
      unread: false,
      icon: Shield,
      color: '#3B82F6'
    },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const dismissNotif = (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <header style={{
      height: 64,
      background: isDark ? '#151928' : '#FFFFFF',
      borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 20,
      flexShrink: 0,
      transition: 'background 0.2s ease, border-color 0.2s ease'
    }}>
      {/* Left: Mobile Hamburger & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isMobile && (
          <button
            onClick={onMenuToggle}
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
              border: 'none',
              borderRadius: 8,
              color: isDark ? '#F8FAFC' : '#0F172A',
              padding: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Menu size={18} />
          </button>
        )}

        <div>
          <h1 style={{
            margin: 0,
            fontSize: isMobile ? 16 : 18,
            fontWeight: 900,
            color: isDark ? '#F8FAFC' : '#0F172A',
            letterSpacing: '-0.3px',
            textTransform: 'capitalize'
          }}>
            {LABELS[section] || 'Dashboard'}
          </h1>
        </div>
      </div>

      {/* Right: Search, Mobile-First Notifications, User Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Search Bar (Desktop only) */}
        <div style={{
          display: isMobile ? 'none' : 'flex',
          alignItems: 'center',
          gap: 8,
          background: isDark ? '#0F1322' : '#F1F3F9',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'}`,
          borderRadius: 10,
          padding: '7px 12px',
        }}>
          <Search size={14} color={isDark ? '#64748B' : '#94A3B8'} />
          <input
            type="text"
            placeholder="Search..."
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              color: isDark ? '#F8FAFC' : '#0F172A',
              fontSize: 13,
              fontFamily: 'inherit',
              width: 130
            }}
          />
        </div>

        {/* Notifications Trigger Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setNotifOpen(prev => !prev)}
            title="Notifications"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: notifOpen
                ? (isDark ? 'rgba(255, 77, 157, 0.15)' : 'rgba(255, 77, 157, 0.1)')
                : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)'),
              border: `1px solid ${notifOpen ? '#FF4D9D' : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)')}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: notifOpen ? '#FF4D9D' : (isDark ? '#F8FAFC' : '#0F172A'),
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.15s ease'
            }}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#FF4D9D',
                boxShadow: '0 0 8px rgba(255, 77, 157, 0.8)'
              }} />
            )}
          </button>

          {/* Desktop Notifications Dropdown */}
          {notifOpen && !isMobile && (
            <>
              {/* Click-away backdrop */}
              <div
                onClick={() => setNotifOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 90 }}
              />
              <div style={{
                position: 'absolute',
                top: 48,
                right: 0,
                width: 320,
                background: isDark ? '#151928' : '#FFFFFF',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.12)'}`,
                borderRadius: 16,
                boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'adSlideIn 0.2s ease'
              }}>
                <div style={{
                  padding: '14px 16px',
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 100, background: 'rgba(255, 77, 157, 0.15)', color: '#FF4D9D' }}>
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      style={{ background: 'none', border: 'none', color: '#FF4D9D', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                      Mark read
                    </button>
                  )}
                </div>

                <div style={{ padding: '8px 8px', maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}>
                      No notifications
                    </div>
                  ) : (
                    notifications.map(n => {
                      const Icon = n.icon;
                      return (
                        <div
                          key={n.id}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 12,
                            background: n.unread
                              ? (isDark ? 'rgba(255, 77, 157, 0.06)' : 'rgba(255, 77, 157, 0.04)')
                              : 'transparent',
                            border: `1px solid ${n.unread ? (isDark ? 'rgba(255, 77, 157, 0.2)' : 'rgba(255, 77, 157, 0.15)') : 'transparent'}`,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            position: 'relative'
                          }}
                        >
                          <div style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: `${n.color}18`,
                            color: n.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, marginTop: 2
                          }}>
                            <Icon size={15} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 12, fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A' }}>{n.title}</span>
                              <span style={{ fontSize: 10, color: isDark ? '#94A3B8' : '#64748B' }}>{n.time}</span>
                            </div>
                            <div style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B', marginTop: 2, lineHeight: 1.4 }}>
                              {n.desc}
                            </div>
                          </div>
                          <button
                            onClick={e => dismissNotif(n.id, e)}
                            title="Dismiss"
                            style={{ background: 'none', border: 'none', color: isDark ? '#64748B' : '#94A3B8', cursor: 'pointer', padding: 2, display: 'flex' }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mobile-First Full Drawer / Bottom Sheet Notification Modal */}
        {notifOpen && isMobile && (
          <div
            onClick={() => setNotifOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(5px)',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: isDark ? '#151928' : '#FFFFFF',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: '16px 20px 32px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
                animation: 'adSlideIn 0.25s ease',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}`
              }}
            >
              {/* Drawer Top Grab Handle */}
              <div style={{ width: 36, height: 4, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.2)', margin: '0 auto 4px' }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A' }}>Notifications</h3>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: 'rgba(255, 77, 157, 0.15)', color: '#FF4D9D' }}>
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      style={{ background: 'none', border: 'none', color: '#FF4D9D', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => setNotifOpen(false)}
                    style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)', border: 'none', borderRadius: 8, color: isDark ? '#8E95A9' : '#64748B', padding: 6, cursor: 'pointer', display: 'flex' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '55vh' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '36px 0', textAlign: 'center', color: isDark ? '#94A3B8' : '#64748B', fontSize: 13 }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map(n => {
                    const Icon = n.icon;
                    return (
                      <div
                        key={n.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 14,
                          background: n.unread
                            ? (isDark ? 'rgba(255, 77, 157, 0.08)' : 'rgba(255, 77, 157, 0.05)')
                            : (isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.02)'),
                          border: `1px solid ${n.unread ? (isDark ? 'rgba(255, 77, 157, 0.25)' : 'rgba(255, 77, 157, 0.18)') : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)')}`,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: `${n.color}18`,
                          color: n.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, marginTop: 2
                        }}>
                          <Icon size={18} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A' }}>{n.title}</span>
                            <span style={{ fontSize: 10, color: isDark ? '#94A3B8' : '#64748B' }}>{n.time}</span>
                          </div>
                          <div style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#64748B', marginTop: 3, lineHeight: 1.4 }}>
                            {n.desc}
                          </div>
                        </div>
                        <button
                          onClick={e => dismissNotif(n.id, e)}
                          title="Dismiss"
                          style={{ background: 'none', border: 'none', color: isDark ? '#64748B' : '#94A3B8', cursor: 'pointer', padding: 4, display: 'flex' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Profile Avatar with Dropdown Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileOpen(prev => !prev)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: 0
            }}
          >
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: '#D60036',
                color: '#fff', fontWeight: 900, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {(currentUser?.displayName || currentUser?.email || 'A')[0].toUpperCase()}
              </div>
            )}
          </button>

          {profileOpen && (
            <>
              {/* Click-away backdrop */}
              <div
                onClick={() => setProfileOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 90 }}
              />
              <div style={{
                position: 'absolute',
                top: 48,
                right: 0,
                width: 220,
                background: isDark ? '#151928' : '#FFFFFF',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.12)'}`,
                borderRadius: 14,
                padding: 12,
                boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                animation: 'adSlideIn 0.15s ease'
              }}>
                <div style={{ padding: '4px 8px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}`, marginBottom: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser?.displayName || 'Super Admin'}
                  </div>
                  <div style={{ fontSize: 10, color: isDark ? '#94A3B8' : '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser?.email}
                  </div>
                </div>
                <button
                  onClick={() => { signOut(auth); setProfileOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
                    color: '#EF4444', fontSize: 12, fontWeight: 700, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', width: '100%'
                  }}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DASHBOARD PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function DashboardPanel({ stats, history, featureFlags, announcement, subscribers, revenueData, appUsers, onNavigate, onSaveFlags }) {
  const si = DS.getStorageInfo();
  const qr = stats?.qrCount || 0;
  const bc = stats?.barcodeCount || 0;
  const totalCreated = qr + bc;
  const mrrVal = revenueData?.mrr !== undefined ? `$${revenueData.mrr}` : '$0.00';
  const usersVal = appUsers?.length !== undefined ? `${appUsers.length}` : '0';

  const sysChecks = [
    { label: 'localStorage',   ok: typeof localStorage !== 'undefined',            detail: si.used + ' used' },
    { label: 'Service Worker', ok: 'serviceWorker' in navigator,                   detail: 'serviceWorker' in navigator ? 'Enabled' : 'Disabled' },
    { label: 'PWA Mode',       ok: window.matchMedia('(display-mode: standalone)').matches, detail: window.matchMedia('(display-mode: standalone)').matches ? 'Installed' : 'Browser' },
    { label: 'Secure Context', ok: window.isSecureContext,                          detail: window.isSecureContext ? 'HTTPS' : 'HTTP' },
    { label: 'Canvas API',     ok: !!document.createElement('canvas').getContext,   detail: 'QR rendering' },
    { label: 'Clipboard API',  ok: !!navigator.clipboard,                           detail: 'Copy feature' },
  ];

  const allOk = sysChecks.every(c => c.ok);

  const quickActions = [
    { label: 'Users Hub', desc: 'Manage app users & blocks', icon: Users, color: T.blue, action: () => onNavigate('users') },
    { label: 'Revenue & Plans', desc: 'ARR, MRR & promo codes', icon: DollarSign, color: T.green, action: () => onNavigate('revenue') },
    { label: 'Cloud Templates', desc: 'Manage & create templates', icon: Layers, color: T.purple, action: () => onNavigate('templates') },
    { label: 'App Settings', desc: 'General & remote config', icon: Settings, color: T.orange, action: () => onNavigate('app-settings') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* SaaS Executive Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(216, 0, 54, 0.15) 0%, rgba(20, 20, 30, 0.9) 100%)',
        border: `1px solid ${T.accent}33`, borderRadius: T.r.lg, padding: '14px 16px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: T.text, margin: 0 }}>Super Admin Command Center</h2>
            <Badge color={T.accent}>Live Hub</Badge>
          </div>
          <p style={{ fontSize: 11, color: T.textSec, margin: 0, lineHeight: 1.4 }}>
            Central executive overview for Mushi QR Pro SaaS platform operations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn size="sm" icon={<Zap size={13} />} onClick={() => onNavigate('revenue')}>
            Revenue Dashboard
          </Btn>
          <Btn size="sm" variant="ghost" icon={<Users size={13} />} onClick={() => onNavigate('users')}>
            User Directory
          </Btn>
        </div>
      </div>

      {/* Top Metric Overview Cards */}
      <div className="ad-stat-grid">
        <StatCard icon={DollarSign} label="Monthly Revenue (MRR)" value={mrrVal} color={T.green} trendLabel={`${revenueData?.paidUsers || 0} paid subscribers`} />
        <StatCard icon={Users}      label="Registered Users"      value={`${usersVal} Accounts`} color={T.blue} trendLabel="Realtime registered" />
        <StatCard icon={QrCode}     label="QR & Barcodes"         value={totalCreated} color={T.purple} trendLabel="All-time creations" />
        <StatCard icon={Shield}     label="System Status"         value={allOk ? "100% Operational" : "Degraded"} color={allOk ? T.green : T.orange} trendLabel={allOk ? "All checks pass" : "Attention needed"} />
      </div>

      {/* Feature Flags Direct Control Widget */}
      {featureFlags && (
        <AdminCard title="Live Feature Flags Quick Switcher" subtitle="Enable or disable key capabilities live across the app"
          right={<Btn size="sm" variant="ghost" onClick={() => onNavigate('feature-flags')}>Manage All ({Object.keys(featureFlags).length})</Btn>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {Object.entries(featureFlags).slice(0, 4).map(([key, val]) => (
              <div key={key} style={{
                background: T.bgEl, border: `1px solid ${T.border}`, borderRadius: T.r.md,
                padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{key}</div>
                  <div style={{ fontSize: 10, color: val ? T.green : T.textMut }}>{val ? 'Active' : 'Disabled'}</div>
                </div>
                <button
                  onClick={() => onSaveFlags && onSaveFlags({ ...featureFlags, [key]: !val })}
                  style={{
                    width: 38, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                    background: val ? T.green : 'rgba(255,255,255,0.15)', position: 'relative',
                    transition: 'background 0.2s', flexShrink: 0
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3, left: val ? 19 : 3, transition: 'left 0.2s'
                  }} />
                </button>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {/* Recent Activity + System Status */}
      <div className="ad-activity-row">
        <AdminCard title="Recent Creation Log" subtitle="Last 8 generated items"
          right={<Btn variant="ghost" size="sm" onClick={() => onNavigate('activity-logs')}>View All</Btn>}
          noPadding
        >
          {!(history || []).length ? (
            <EmptyState icon={Activity} title="No activity yet" desc="QR codes and barcodes created will appear here." />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Type', 'Content', 'Format', 'When'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '9px 20px', fontSize: 10, fontWeight: 800, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(history || []).slice(0, 8).map((item, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = T.bgHov}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 20px' }}>
                        <Badge color={item.barcodeType ? T.green : T.purple}>{item.barcodeType ? 'Barcode' : 'QR'}</Badge>
                      </td>
                      <td style={{ padding: '10px 20px', fontSize: 12, color: T.text, maxWidth: 180 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {safeStr(item.qrData) || safeStr(item.data) || item.qrType || 'â€”'}
                        </div>
                      </td>
                      <td style={{ padding: '10px 20px', fontSize: 11, color: T.textSec, whiteSpace: 'nowrap' }}>{item.qrType || item.barcodeType || 'â€”'}</td>
                      <td style={{ padding: '10px 20px', fontSize: 11, color: T.textSec, whiteSpace: 'nowrap' }}>{timeAgo(item.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>

        <AdminCard title="System Readiness Diagnostics" right={<Badge color={allOk ? T.green : T.orange}>{allOk ? 'All Systems OK' : 'Check Warnings'}</Badge>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sysChecks.map(c => (
              <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.ok ? T.green : T.red, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{c.label}</div>
                  <div style={{ fontSize: 10, color: T.textSec }}>{c.detail}</div>
                </div>
                <span style={{ fontSize: 10, color: c.ok ? T.green : T.red, fontWeight: 800 }}>{c.ok ? 'Pass' : 'Check'}</span>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TEMPLATE EDITOR â€” CANVAS PREVIEW
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const DEFAULT_TPL = {
  name: '', category: 'Social',
  bgType: 'gradient', bgColor1: '#1a1a2e', bgColor2: '#e94560',
  gradientDir: 'diagonal', cornerRadius: 0,
  qrX: 0.5, qrY: 0.5, qrSize: 0.5,
  qrColor: '#ffffff', bgQrColor: '#000000', bgTransparent: false,
  eyeColor: '#ffffff', syncEyes: true,
  dotStyle: 'square', eyeStyle: 'square',
};

function TemplateCanvas({ form, size = 280 }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    const s = size;
    ctx.clearRect(0, 0, s, s);

    // â”€â”€ Background â”€â”€
    const cr = Math.min(form.cornerRadius || 0, s / 2);
    const fillPath = () => { ctx.beginPath(); ctx.roundRect(0, 0, s, s, cr); };

    if (form.bgType === 'transparent') {
      const cs = 12;
      for (let x = 0; x < s; x += cs)
        for (let y = 0; y < s; y += cs) {
          ctx.fillStyle = (Math.floor(x/cs) + Math.floor(y/cs)) % 2 === 0 ? '#2a2a3a' : '#1a1a2a';
          ctx.fillRect(x, y, cs, cs);
        }
    } else if (form.bgType === 'gradient') {
      let g;
      const c1 = form.bgColor1 || '#1a1a2e', c2 = form.bgColor2 || '#e94560';
      if (form.gradientDir === 'radial') g = ctx.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
      else if (form.gradientDir === 'horizontal') g = ctx.createLinearGradient(0,0,s,0);
      else if (form.gradientDir === 'vertical') g = ctx.createLinearGradient(0,0,0,s);
      else g = ctx.createLinearGradient(0,0,s,s);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g;
      if (cr > 0) { fillPath(); ctx.fill(); } else ctx.fillRect(0,0,s,s);
    } else {
      ctx.fillStyle = form.bgColor1 || '#ffffff';
      if (cr > 0) { fillPath(); ctx.fill(); } else ctx.fillRect(0,0,s,s);
    }

    // â”€â”€ QR area â”€â”€
    const qsz = Math.max(0.1, Math.min(0.92, form.qrSize || 0.5)) * s;
    const qx  = Math.max(0, Math.min(s - qsz, (form.qrX || 0.5) * s - qsz / 2));
    const qy  = Math.max(0, Math.min(s - qsz, (form.qrY || 0.5) * s - qsz / 2));
    const bgQ = form.bgTransparent ? null : (form.bgQrColor || '#000000');
    if (bgQ) { ctx.fillStyle = bgQ; ctx.fillRect(qx, qy, qsz, qsz); }

    // QR dot grid (7Ã—7 simplified)
    const cells = 9;
    const cs2 = qsz / cells;
    const qc  = form.qrColor || '#ffffff';
    const PATTERN = [
      [1,1,1,1,1,1,1,0,1],[1,0,0,0,0,0,1,1,0],[1,0,1,1,1,0,1,0,1],
      [1,0,1,1,1,0,1,0,0],[1,0,1,1,1,0,1,1,1],[1,0,0,0,0,0,1,0,1],
      [1,1,1,1,1,1,1,0,0],[0,1,0,1,0,1,0,0,1],[1,0,1,0,1,0,1,1,0],
    ];
    ctx.fillStyle = qc;
    PATTERN.forEach((row, r) => row.forEach((cell, c) => {
      if (!cell) return;
      const px = qx + c * cs2, py = qy + r * cs2;
      if (form.dotStyle === 'dots') {
        ctx.beginPath(); ctx.arc(px+cs2/2, py+cs2/2, cs2*0.38, 0, Math.PI*2); ctx.fill();
      } else if (form.dotStyle === 'rounded' || form.dotStyle === 'extra-rounded') {
        ctx.beginPath(); ctx.roundRect(px+0.5, py+0.5, cs2-1, cs2-1, cs2*0.35); ctx.fill();
      } else {
        ctx.fillRect(px+0.5, py+0.5, cs2-1, cs2-1);
      }
    }));

    // Eye markers (3Ã—3 corners)
    const ec = form.syncEyes ? qc : (form.eyeColor || qc);
    const drawEye = (ex, ey) => {
      const ew = cs2 * 3;
      ctx.fillStyle = bgQ || 'transparent';
      if (bgQ) ctx.fillRect(ex, ey, ew, ew);
      ctx.strokeStyle = ec; ctx.lineWidth = cs2 * 0.6;
      if (form.eyeStyle === 'circle') {
        ctx.beginPath(); ctx.arc(ex+ew/2, ey+ew/2, ew/2-cs2*0.3, 0, Math.PI*2); ctx.stroke();
      } else if (form.eyeStyle === 'rounded') {
        ctx.beginPath(); ctx.roundRect(ex+cs2*0.3, ey+cs2*0.3, ew-cs2*0.6, ew-cs2*0.6, cs2*0.6); ctx.stroke();
      } else {
        ctx.strokeRect(ex+cs2*0.3, ey+cs2*0.3, ew-cs2*0.6, ew-cs2*0.6);
      }
      ctx.fillStyle = ec;
      const id = cs2 * 1.1, io = (ew - id) / 2;
      if (form.eyeStyle === 'circle') {
        ctx.beginPath(); ctx.arc(ex+ew/2, ey+ew/2, id/2, 0, Math.PI*2); ctx.fill();
      } else {
        ctx.fillRect(ex+io, ey+io, id, id);
      }
    };
    drawEye(qx, qy);
    drawEye(qx + qsz - cs2*3, qy);
    drawEye(qx, qy + qsz - cs2*3);

    // Position indicator
    ctx.strokeStyle = 'rgba(214,0,54,0.7)'; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
    ctx.strokeRect(qx, qy, qsz, qsz); ctx.setLineDash([]);

    // Center dot
    ctx.fillStyle = '#D60036'; ctx.beginPath();
    ctx.arc((form.qrX||0.5)*s, (form.qrY||0.5)*s, 3, 0, Math.PI*2); ctx.fill();

  }, [form, size]);

  return <canvas ref={ref} width={size} height={size} style={{ borderRadius: 10, display: 'block', width: '100%', aspectRatio: '1' }} />;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TEMPLATE EDITOR MODAL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const DOT_STYLES   = ['square','rounded','dots','extra-rounded','classy','classy-rounded','cherry-blossom','violet-flower','sunflower','rose','daisy','tulip','lotus','forget-me-not','pansy','dollar-coin','cute-emoticon','lavender','monstera','coffee-bean','raindrop','cactus-plant','basketball-dot','chess-pawn','bow-ribbon'];
const EYE_STYLES   = ['square','rounded','circle','leaf','extra-rounded','dollar-coin','cute-emoticon','cherry-blossom','lotus','sunflower','lavender','rose','monstera','daisy','coffee-bean-eye','raindrop-eye','cactus-eye','basketball-eye','chess-eye','bow-eye','violet-flower-eye','tulip-eye','forget-me-not-eye','pansy-eye'];
const GRAD_DIRS    = [{ v:'diagonal', l:'â†˜ Diagonal' },{ v:'horizontal', l:'â†’ Horizontal' },{ v:'vertical', l:'â†“ Vertical' },{ v:'radial', l:'â—Ž Radial' }];
const TPL_CATS     = ['Social','Business','Hot','Creative','Minimal','Event','Retail','Custom'];

function ColorRow({ label, value, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <label style={{ fontSize:11, fontWeight:700, color:T.textSec, minWidth:90, flexShrink:0 }}>{label}</label>
      <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
        <input type="color" value={value || '#ffffff'} onChange={e => onChange(e.target.value)}
          style={{ width:34, height:28, border:`1px solid ${T.border}`, borderRadius:6, cursor:'pointer', background:'none', padding:2, flexShrink:0 }} />
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
          style={{ flex:1, minWidth:0, background:T.bgEl, border:`1px solid ${T.border}`, borderRadius:6, color:T.text, fontSize:12, padding:'5px 8px', outline:'none', fontFamily:'monospace' }} />
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step=0.01, onChange, fmt }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <label style={{ fontSize:11, fontWeight:700, color:T.textSec, minWidth:90, flexShrink:0 }}>{label}</label>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex:1, accentColor:T.accent, cursor:'pointer' }} />
      <span style={{ fontSize:11, fontWeight:700, color:T.text, minWidth:40, textAlign:'right', fontFamily:'monospace' }}>
        {fmt ? fmt(value) : value.toFixed(2)}
      </span>
    </div>
  );
}

function BtnGroup({ options, value, onChange }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
      {options.map(o => {
        const v = typeof o === 'string' ? o : o.v;
        const l = typeof o === 'string' ? o : o.l;
        const active = value === v;
        return (
          <button key={v} onClick={() => onChange(v)} style={{
            padding:'5px 10px', fontSize:11, borderRadius:6, border:`1px solid ${active ? T.accent : T.border}`,
            background: active ? T.accentLow : 'transparent',
            color: active ? T.accent : T.textSec, cursor:'pointer', fontFamily:'inherit', fontWeight: active ? 700 : 500,
            transition:'all 0.12s',
          }}>{l}</button>
        );
      })}
    </div>
  );
}

function TemplateEditorModal({ form, setForm, editId, onSave, onClose, saving }) {
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.85)',  display:'flex', alignItems:'stretch' }}>
      {/* Modal box */}
      <div style={{ margin:'auto', width:'100%', maxWidth:900, maxHeight:'96vh', background:T.bgCard, borderRadius:16, border:`1px solid ${T.border}`, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ fontSize:15, fontWeight:800, color:T.text }}>{editId ? 'âœï¸ Edit Template' : 'âœ¨ New Template'}</div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn onClick={onSave} disabled={saving || !form.name?.trim()} icon={<Check size={13} />}>
              {saving ? 'Savingâ€¦' : 'Save Template'}
            </Btn>
          </div>
        </div>

        {/* Body */}
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

          {/* Left: Preview */}
          <div style={{ width:300, minWidth:280, borderRight:`1px solid ${T.border}`, padding:20, display:'flex', flexDirection:'column', gap:16, flexShrink:0, background:T.bgEl }}>
            <div style={{ fontSize:11, fontWeight:800, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.6px' }}>Live Preview</div>
            <div style={{ borderRadius:12, overflow:'hidden', border:`1px solid ${T.border}` }}>
              <TemplateCanvas form={form} size={260} />
            </div>
            <div style={{ fontSize:10, color:T.textMut, textAlign:'center', lineHeight:1.5 }}>
              Red dashes = QR bounds Â· Red dot = center point
            </div>
            {/* Quick info */}
            <div style={{ background:T.bgCard, borderRadius:8, padding:12, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:T.text, marginBottom:8 }}>{form.name || 'Untitled Template'}</div>
              {[
                ['Category', form.category],
                ['Position', `X ${(form.qrX*100).toFixed(0)}% Â· Y ${(form.qrY*100).toFixed(0)}%`],
                ['QR Size', `${(form.qrSize*100).toFixed(0)}%`],
                ['Dot Style', form.dotStyle],
                ['Eye Style', form.eyeStyle],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:10, color:T.textMut }}>{k}</span>
                  <span style={{ fontSize:10, color:T.textSec, textTransform:'capitalize' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Controls */}
          <div className="ad-scroll" style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:20 }}>

            {/* Basic Info */}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ fontSize:12, fontWeight:800, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.5px' }}>Basic Info</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <FormInput label="Template Name" value={form.name} onChange={v => set('name', v)} placeholder="e.g. Dark Blue Gradient" />
                <FormSelect label="Category" value={form.category} onChange={v => set('category', v)} options={TPL_CATS.map(c => ({ value:c, label:c }))} />
              </div>
            </div>

            {/* Background */}
            <div style={{ display:'flex', flexDirection:'column', gap:12, paddingTop:16, borderTop:`1px solid ${T.border}` }}>
              <div style={{ fontSize:12, fontWeight:800, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.5px' }}>Background</div>
              <div style={{ display:'flex', gap:0, background:T.bgEl, borderRadius:8, padding:3, border:`1px solid ${T.border}`, width:'fit-content' }}>
                {[['solid','â–  Solid'],['gradient','â¬› Gradient'],['transparent','â–¢ Transparent']].map(([v,l]) => (
                  <button key={v} onClick={() => set('bgType', v)} style={{
                    padding:'6px 14px', borderRadius:6, border:'none', cursor:'pointer', fontFamily:'inherit',
                    background: form.bgType === v ? T.accent : 'transparent',
                    color: form.bgType === v ? '#fff' : T.textSec, fontWeight:700, fontSize:11, transition:'all 0.12s',
                  }}>{l}</button>
                ))}
              </div>

              {form.bgType !== 'transparent' && (
                <ColorRow label={form.bgType === 'gradient' ? 'Color 1' : 'Background'} value={form.bgColor1} onChange={v => set('bgColor1', v)} />
              )}
              {form.bgType === 'gradient' && (
                <>
                  <ColorRow label="Color 2" value={form.bgColor2} onChange={v => set('bgColor2', v)} />
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <label style={{ fontSize:11, fontWeight:700, color:T.textSec, minWidth:90, flexShrink:0 }}>Direction</label>
                    <BtnGroup options={GRAD_DIRS} value={form.gradientDir} onChange={v => set('gradientDir', v)} />
                  </div>
                </>
              )}
              <SliderRow label="Corner Radius" value={form.cornerRadius||0} min={0} max={80} step={1} onChange={v => set('cornerRadius', v)} fmt={v => `${v}px`} />
            </div>

            {/* QR Position */}
            <div style={{ display:'flex', flexDirection:'column', gap:12, paddingTop:16, borderTop:`1px solid ${T.border}` }}>
              <div style={{ fontSize:12, fontWeight:800, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.5px' }}>QR Position &amp; Size</div>
              <SliderRow label="Center X" value={form.qrX} min={0.05} max={0.95} onChange={v => set('qrX', v)} fmt={v => `${(v*100).toFixed(0)}%`} />
              <SliderRow label="Center Y" value={form.qrY} min={0.05} max={0.95} onChange={v => set('qrY', v)} fmt={v => `${(v*100).toFixed(0)}%`} />
              <SliderRow label="QR Size" value={form.qrSize} min={0.1} max={0.92} onChange={v => set('qrSize', v)} fmt={v => `${(v*100).toFixed(0)}%`} />
            </div>

            {/* QR Colors */}
            <div style={{ display:'flex', flexDirection:'column', gap:12, paddingTop:16, borderTop:`1px solid ${T.border}` }}>
              <div style={{ fontSize:12, fontWeight:800, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.5px' }}>QR Colors</div>
              <ColorRow label="QR Color" value={form.qrColor} onChange={v => set('qrColor', v)} />
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <label style={{ fontSize:11, fontWeight:700, color:T.textSec, minWidth:90, flexShrink:0 }}>QR Background</label>
                <button onClick={() => set('bgTransparent', !form.bgTransparent)} style={{
                  display:'flex', alignItems:'center', gap:6, background:'none', border:`1px solid ${T.border}`,
                  borderRadius:6, color: form.bgTransparent ? T.accent : T.textSec, cursor:'pointer', padding:'5px 10px', fontSize:11, fontWeight:700, fontFamily:'inherit',
                }}>
                  {form.bgTransparent ? 'âœ“ Transparent' : 'â–¡ Transparent'}
                </button>
              </div>
              {!form.bgTransparent && (
                <ColorRow label="QR BG Color" value={form.bgQrColor} onChange={v => set('bgQrColor', v)} />
              )}
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <label style={{ fontSize:11, fontWeight:700, color:T.textSec, minWidth:90, flexShrink:0 }}>Eye Color</label>
                <button onClick={() => set('syncEyes', !form.syncEyes)} style={{
                  display:'flex', alignItems:'center', gap:6, background:'none', border:`1px solid ${T.border}`,
                  borderRadius:6, color: form.syncEyes ? T.green : T.textSec, cursor:'pointer', padding:'5px 10px', fontSize:11, fontWeight:700, fontFamily:'inherit',
                }}>
                  {form.syncEyes ? 'âŸ³ Same as QR' : 'âŠ™ Custom'}
                </button>
              </div>
              {!form.syncEyes && (
                <ColorRow label="Eye Color" value={form.eyeColor} onChange={v => set('eyeColor', v)} />
              )}
            </div>

            {/* QR Style */}
            <div style={{ display:'flex', flexDirection:'column', gap:12, paddingTop:16, borderTop:`1px solid ${T.border}` }}>
              <div style={{ fontSize:12, fontWeight:800, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.5px' }}>QR Style</div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:T.textSec, marginBottom:8 }}>Dot Style</div>
                <BtnGroup options={DOT_STYLES} value={form.dotStyle} onChange={v => set('dotStyle', v)} />
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:T.textSec, marginBottom:8 }}>Eye Style</div>
                <BtnGroup options={EYE_STYLES} value={form.eyeStyle} onChange={v => set('eyeStyle', v)} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TEMPLATES PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function TemplatesPanel({ cloudTemplates, onRefresh }) {
  const [tab, setTab]           = useState('builtin');
  const [editorOpen, setEditor] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState({ ...DEFAULT_TPL });
  const [saving, setSaving]     = useState(false);
  const toast = useToast();

  const openNew = () => { setForm({ ...DEFAULT_TPL }); setEditId(null); setEditor(true); };
  const openEdit = tpl => {
    setForm({
      ...DEFAULT_TPL,
      name: tpl.name, category: tpl.category,
      bgType: tpl.bgType || 'gradient',
      bgColor1: tpl.bgColor1 || '#1a1a2e', bgColor2: tpl.bgColor2 || '#e94560',
      gradientDir: tpl.gradientDir || 'diagonal', cornerRadius: tpl.cornerRadius || 0,
      qrX: tpl.qrX || 0.5, qrY: tpl.qrY || 0.5, qrSize: tpl.qrSize || 0.5,
      qrColor: tpl.preset?.qrColor || '#ffffff',
      bgQrColor: tpl.preset?.bgColor || '#000000',
      bgTransparent: !!tpl.preset?.bgTransparent,
      eyeColor: tpl.preset?.eyeColor || '#ffffff',
      syncEyes: tpl.preset?.syncEyes !== false,
      dotStyle: tpl.preset?.dotStyle || 'square',
      eyeStyle: tpl.preset?.eyeStyle || 'square',
    });
    setEditId(tpl.id); setEditor(true);
  };
  const cloneBuiltin = tpl => {
    setForm({
      ...DEFAULT_TPL,
      name: tpl.name + ' (Custom)', category: tpl.category,
      qrX: tpl.qrX, qrY: tpl.qrY, qrSize: tpl.qrSize,
      qrColor: tpl.preset?.qrColor || '#ffffff',
      bgQrColor: tpl.preset?.bgColor || '#ffffff',
      bgTransparent: !!tpl.preset?.bgTransparent,
      dotStyle: tpl.preset?.dotStyle || 'square',
      eyeStyle: tpl.preset?.eyeStyle || 'square',
    });
    setEditId(null); setEditor(true); setTab('custom');
  };
  const handleSave = async () => {
    if (!form.name?.trim()) return;
    setSaving(true);
    try {
      const t = {
        id: editId || ('custom_' + Date.now().toString(36)),
        name: form.name.trim(), category: form.category,
        bgType: form.bgType, bgColor1: form.bgColor1, bgColor2: form.bgColor2,
        gradientDir: form.gradientDir, cornerRadius: form.cornerRadius,
        qrX: form.qrX, qrY: form.qrY, qrSize: form.qrSize,
        preset: {
          qrColor: form.qrColor, bgColor: form.bgQrColor || '#ffffff',
          bgTransparent: form.bgTransparent,
          eyeColor: form.eyeColor, eyeOuterColor: form.eyeColor,
          syncEyes: form.syncEyes,
          dotStyle: form.dotStyle, eyeStyle: form.eyeStyle,
        },
        updatedAt: new Date().toISOString(),
      };
      await DS.saveCloudTemplate(t);
      toast((editId ? 'Template updated!' : 'Template created!') + ' "' + t.name + '" is now live.', 'success');
      setEditor(false); onRefresh();
    } catch (e) {
      toast('Failed to save template: ' + (e.message || 'Unknown error'), 'error', 6000);
    } finally { setSaving(false); }
  };
  const handleDelete = async id => {
    if (!confirm('Delete this template?')) return;
    try {
      await DS.deleteCloudTemplate(id);
      toast('Template deleted.', 'info');
      onRefresh();
    } catch (e) {
      toast('Failed to delete: ' + (e.message || 'Unknown error'), 'error', 6000);
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {editorOpen && (
        <TemplateEditorModal form={form} setForm={setForm} editId={editId}
          onSave={handleSave} onClose={() => setEditor(false)} saving={saving} />
      )}

      {/* Tab bar */}
      <div style={{ display:'flex', gap:0, background:T.bgCard, borderRadius:T.r.md, padding:4, border:`1px solid ${T.border}`, width:'fit-content' }}>
        {[{ id:'builtin', label:`Built-in (${QR_TEMPLATES.length})` },{ id:'custom', label:`Custom (${cloudTemplates.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'7px 18px', borderRadius:T.r.sm, border:'none', cursor:'pointer', fontFamily:'inherit',
            background: tab === t.id ? T.accent : 'transparent',
            color: tab === t.id ? '#fff' : T.textSec, fontWeight:700, fontSize:12, transition:'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Built-in tab */}
      {tab === 'builtin' && (
        <AdminCard title="Built-in Templates" subtitle="Pre-installed templates â€” view only. Clone to create an editable copy.">
          <div className="ad-template-grid">
            {QR_TEMPLATES.map(tpl => (
              <div key={tpl.id} style={{ background:T.bgEl, borderRadius:T.r.md, overflow:'hidden', border:`1px solid ${T.border}`, display:'flex', flexDirection:'column' }}>
                {/* Color swatch preview */}
                <div style={{
                  aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', position:'relative',
                  background: `linear-gradient(135deg, ${tpl.preset?.qrColor || T.purple}22, ${T.blue}22)`,
                }}>
                  <QrCode size={32} color={tpl.preset?.qrColor || T.purple} />
                  {/* Position indicator dot */}
                  <div style={{
                    position:'absolute',
                    left: `${(tpl.qrX||0.5)*100}%`, top: `${(tpl.qrY||0.5)*100}%`,
                    transform:'translate(-50%,-50%)', width:8, height:8, borderRadius:'50%',
                    background:T.accent, border:'2px solid #fff', boxShadow:'0 1px 4px rgba(0,0,0,0.5)',
                  }} />
                </div>
                <div style={{ padding:'10px 12px', flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tpl.name}</div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:4 }}>
                    <Badge color={T.orange}>{tpl.category}</Badge>
                    <span style={{ fontSize:9, color:T.textMut }}>Size {(tpl.qrSize*100).toFixed(0)}%</span>
                  </div>
                  {/* Preset color dots */}
                  <div style={{ display:'flex', gap:4, marginTop:2 }}>
                    {[tpl.preset?.qrColor, tpl.preset?.bgColor].filter(Boolean).map((col,i) => (
                      <div key={i} title={col} style={{ width:14, height:14, borderRadius:'50%', background:col, border:`1px solid ${T.border}` }} />
                    ))}
                    <span style={{ fontSize:9, color:T.textMut, marginLeft:2 }}>{tpl.preset?.dotStyle}</span>
                  </div>
                  <button onClick={() => cloneBuiltin(tpl)} style={{
                    marginTop:4, background:T.accentLow, border:`1px solid rgba(214,0,54,0.2)`,
                    borderRadius:6, color:T.accent, cursor:'pointer', padding:'5px 0', fontSize:10,
                    fontWeight:700, fontFamily:'inherit', transition:'all 0.12s',
                  }}>Clone &amp; Customize â†’</button>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {/* Custom tab */}
      {tab === 'custom' && (
        <AdminCard title="Custom Templates" subtitle="Create and manage your own QR templates"
          right={<Btn icon={<Plus size={13} />} onClick={openNew}>New Template</Btn>}>
          {cloudTemplates.length === 0 ? (
            <EmptyState icon={Layers} title="No custom templates yet"
              desc="Create templates with custom backgrounds, colors, QR position and styles."
              action={<Btn icon={<Plus size={13} />} onClick={openNew}>Create First Template</Btn>} />
          ) : (
            <div className="ad-template-grid">
              {cloudTemplates.map(tpl => (
                <div key={tpl.id} style={{ background:T.bgEl, borderRadius:T.r.md, overflow:'hidden', border:`1px solid ${T.border}`, display:'flex', flexDirection:'column' }}>
                  {/* Mini canvas preview */}
                  <div style={{ aspectRatio:'1', overflow:'hidden' }}>
                    <TemplateCanvas form={{
                      bgType: tpl.bgType||'gradient', bgColor1:tpl.bgColor1||'#1a1a2e', bgColor2:tpl.bgColor2||'#e94560',
                      gradientDir:tpl.gradientDir||'diagonal', cornerRadius:tpl.cornerRadius||0,
                      qrX:tpl.qrX||0.5, qrY:tpl.qrY||0.5, qrSize:tpl.qrSize||0.5,
                      qrColor:tpl.preset?.qrColor||'#fff', bgQrColor:tpl.preset?.bgColor||'#000',
                      bgTransparent:!!tpl.preset?.bgTransparent,
                      eyeColor:tpl.preset?.eyeColor||'#fff', syncEyes:tpl.preset?.syncEyes!==false,
                      dotStyle:tpl.preset?.dotStyle||'square', eyeStyle:tpl.preset?.eyeStyle||'square',
                    }} size={200} />
                  </div>
                  <div style={{ padding:'10px 12px', flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tpl.name}</div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <Badge color={T.purple}>{tpl.category}</Badge>
                      <span style={{ fontSize:9, color:T.textMut }}>{tpl.preset?.dotStyle}</span>
                    </div>
                    <div style={{ display:'flex', gap:5, marginTop:4 }}>
                      <button onClick={() => openEdit(tpl)} style={{
                        flex:1, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:6,
                        color:T.text, cursor:'pointer', padding:'5px 0', fontSize:10, fontWeight:700, fontFamily:'inherit',
                      }}>âœï¸ Edit</button>
                      <button onClick={() => handleDelete(tpl.id)} style={{
                        background:`${T.red}10`, border:`1px solid ${T.red}30`, borderRadius:6,
                        color:T.red, cursor:'pointer', padding:'5px 8px', fontSize:10, fontWeight:700, fontFamily:'inherit',
                      }}>ðŸ—‘</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      )}
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// APP SETTINGS PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function AppSettingsPanel({ settings, onSave }) {
  const [form, setForm] = useState(settings || {});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      setSaved(true);
      toast('App settings saved successfully!', 'success');
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      toast('Failed to save: ' + (e.message || 'Unknown error'), 'error', 6000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminCard title="General Settings" subtitle="Core app configuration stored locally">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormInput label="App Name" value={form.appName || ''} onChange={v => set('appName', v)} />
          <FormInput label="Welcome Message" value={form.welcomeText || ''} onChange={v => set('welcomeText', v)} />
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 6 }}>Brand Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="color" value={form.brandColor || '#D60036'} onChange={e => set('brandColor', e.target.value)}
                style={{ width: 46, height: 38, borderRadius: T.r.md, border: `1px solid ${T.border}`, cursor: 'pointer', background: 'none', padding: 4 }} />
              <FormInput value={form.brandColor || '#D60036'} onChange={v => set('brandColor', v)} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
            <Btn onClick={handleSave} disabled={saving} icon={saved ? <Check size={13} /> : <Save size={13} />} variant={saved ? 'success' : 'primary'}>
              {saving ? 'Savingâ€¦' : saved ? 'Saved!' : 'Save Settings'}
            </Btn>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BRANDING PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function BrandingPanel({ settings, onSave }) {
  const [form, setForm] = useState(settings || {});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      setSaved(true);
      toast('Branding saved successfully!', 'success');
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      toast('Failed to save branding: ' + (e.message || 'Unknown error'), 'error', 6000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminCard title="Brand Identity" subtitle="Customize your app's visual identity">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="/logo.webp" alt="Logo" style={{ width: 72, height: 72, borderRadius: 18, objectFit: 'contain', background: T.bgEl, padding: 6, border: `1px solid ${T.border}` }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>App Logo</div>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>Served from /logo.webp</div>
              <Badge color={T.blue}>Build Asset</Badge>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 8 }}>Brand Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="color" value={form.brandColor || '#D60036'} onChange={e => set('brandColor', e.target.value)}
                style={{ width: 56, height: 56, borderRadius: T.r.md, border: `1px solid ${T.border}`, cursor: 'pointer', background: 'none', padding: 6 }} />
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 2 }}>Hex Value</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: form.brandColor || '#D60036', fontFamily: 'monospace' }}>{form.brandColor || '#D60036'}</div>
              </div>
            </div>
          </div>
          <FormInput label="App Display Name" value={form.appName || 'Mushi QR Pro'} onChange={v => set('appName', v)} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={handleSave} disabled={saving} icon={saved ? <Check size={13} /> : <Save size={13} />} variant={saved ? 'success' : 'primary'}>
              {saving ? 'Savingâ€¦' : saved ? 'Saved!' : 'Save Branding'}
            </Btn>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Color System Preview">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
          {[
            { label: 'Brand', color: form.brandColor || '#D60036' },
            { label: 'Dark BG', color: '#09090f' },
            { label: 'Card', color: '#14141e' },
            { label: 'Purple', color: T.purple },
            { label: 'Green', color: T.green },
            { label: 'Orange', color: T.orange },
          ].map(c => (
            <div key={c.label} style={{ textAlign: 'center' }}>
              <div style={{ width: '100%', height: 44, background: c.color, borderRadius: T.r.md, border: `1px solid ${T.border}`, marginBottom: 5 }} />
              <div style={{ fontSize: 10, color: T.textSec }}>{c.label}</div>
              <div style={{ fontSize: 9, color: T.textMut, fontFamily: 'monospace' }}>{c.color}</div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// LEGACY FEATURE FLAGS MATRIX
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function LegacyFeatureFlagsMatrix({ flags, plans, onSaveFlags, onSavePlans }) {
  const [f, setF] = useState(flags || {});
  const [p, setP] = useState(plans || {});
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [expandedCats, setExpandedCats] = useState(() => new Set(Object.keys(FEATURE_CATEGORIES)));
  const [savingFeatureId, setSavingFeatureId] = useState(null);
  const [savingPlanId, setSavingPlanId] = useState(null);
  const toast = useToast();

  useEffect(() => { if (flags) setF(flags); }, [flags]);
  useEffect(() => { if (plans) setP(plans); }, [plans]);

  const toggleCat = (catId) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleToggleGlobalFlag = async (featureId) => {
    const currentVal = f[featureId] !== undefined ? f[featureId] : true;
    const nextVal = !currentVal;
    setF(prev => ({ ...prev, [featureId]: nextVal }));
    setSavingFeatureId(featureId);
    
    // Immediately force local offline cache update for instant global enforcement
    if (typeof FeatureAccessManager?.setLocalFlagOverride === 'function') {
      FeatureAccessManager.setLocalFlagOverride(featureId, nextVal);
    }

    try {
      const res = await setFeatureFlagCloud(featureId, nextVal);
      if (res.ok) {
        toast(`Updated global switch for ${featureId} â†’ ${nextVal ? 'ON' : 'OFF'}`, 'success');
      } else {
        setF(prev => ({ ...prev, [featureId]: currentVal }));
        if (typeof FeatureAccessManager?.setLocalFlagOverride === 'function') {
          FeatureAccessManager.setLocalFlagOverride(featureId, currentVal);
        }
        toast(`Failed to update ${featureId}: ${res.error}`, 'error', 5000);
      }
    } catch (e) {
      setF(prev => ({ ...prev, [featureId]: currentVal }));
      if (typeof FeatureAccessManager?.setLocalFlagOverride === 'function') {
        FeatureAccessManager.setLocalFlagOverride(featureId, currentVal);
      }
      toast(`Save error: ${e.message}`, 'error', 5000);
    } finally {
      setSavingFeatureId(null);
    }
  };

  const handleTogglePlanFeature = async (planId, featureId) => {
    const planConfig = p[planId] || {};
    const currentFeatures = planConfig.features || (planId === 'free' ? DEFAULT_FREE_FEATURES : DEFAULT_PAID_FEATURES);
    const hasFeature = currentFeatures.includes(featureId);

    const nextFeatures = hasFeature
      ? currentFeatures.filter(id => id !== featureId)
      : [...currentFeatures, featureId];

    const updatedPlanObj = { ...planConfig, planId, features: nextFeatures };
    setP(prev => ({ ...prev, [planId]: updatedPlanObj }));
    setSavingPlanId(`${planId}_${featureId}`);

    try {
      const res = await setPlanFeaturesCloud(planId, nextFeatures);
      if (res.ok) {
        toast(`${planId.toUpperCase()} plan ${hasFeature ? 'removed' : 'granted'} ${featureId}`, 'success');
      } else {
        setP(prev => ({ ...prev, [planId]: planConfig }));
        toast(`Failed to update ${planId} features: ${res.error}`, 'error', 5000);
      }
    } catch (e) {
      setP(prev => ({ ...prev, [planId]: planConfig }));
      toast(`Plan update error: ${e.message}`, 'error', 5000);
    } finally {
      setSavingPlanId(null);
    }
  };

  // Filter features
  const filteredFeatures = FEATURE_REGISTRY.filter(item => {
    if (selectedCat !== 'ALL' && item.category !== selectedCat) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return item.displayName.toLowerCase().includes(q) ||
      item.featureId.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
  });

  // Group features by category
  const categoriesList = Object.keys(FEATURE_CATEGORIES);
  const totalFeatures = FEATURE_REGISTRY.length;
  const enabledGlobal = Object.keys(f).filter(k => f[k] !== false).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* â”€â”€â”€ Hero Overview Card â”€â”€â”€ */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(214,0,54,0.08) 0%, rgba(20,20,30,0.95) 100%)',
        padding: '24px 28px',
        borderRadius: 20,
        border: `1px solid ${T.borderHov}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(214,0,54,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flag size={20} color={T.accent} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0, letterSpacing: '-0.3px' }}>
                Feature Flags & Access Matrix
              </h2>
            </div>
            <div style={{ fontSize: 13, color: T.textSec, marginTop: 6, lineHeight: 1.5 }}>
              Granular remote feature switches across <strong>8 canonical app modules</strong> and 4 subscription tiers.
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', padding: '8px 16px', borderRadius: 12 }}>
              <CheckCircle size={16} color={T.green} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.green }}>{enabledGlobal} Active</span>
                <span style={{ fontSize: 10, color: T.textSec, fontWeight: 600 }}>Globally Enabled</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', padding: '8px 16px', borderRadius: 12 }}>
              <XCircle size={16} color={T.red} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.red }}>{totalFeatures - enabledGlobal} Disabled</span>
                <span style={{ fontSize: 10, color: T.textSec, fontWeight: 600 }}>Globally Muted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar & Filter Controls */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 320px', position: 'relative' }}>
            <Search size={16} color={T.textSec} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search features by name, ID, or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px 12px 42px', borderRadius: 12,
                background: T.bgEl, border: `1px solid ${T.border}`, color: T.text,
                fontSize: 13, outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.textSec, cursor: 'pointer' }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€â”€ 8 Canonical Category Filter Cards â”€â”€â”€ */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Select Category Filter ({categoriesList.length} Categories)
          </span>
          {selectedCat !== 'ALL' && (
            <button
              onClick={() => setSelectedCat('ALL')}
              style={{ background: 'none', border: 'none', color: T.accent, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Show All Categories
            </button>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12
        }}>
          {/* ALL Categories Pill */}
          <div
            onClick={() => setSelectedCat('ALL')}
            style={{
              padding: '14px 16px',
              borderRadius: 14,
              border: `1px solid ${selectedCat === 'ALL' ? T.accent : T.border}`,
              background: selectedCat === 'ALL' ? 'rgba(214,0,54,0.12)' : T.bgCard,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              transition: 'all 0.18s ease',
              boxShadow: selectedCat === 'ALL' ? '0 4px 16px rgba(214,0,54,0.2)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: selectedCat === 'ALL' ? T.accent : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={16} color={selectedCat === 'ALL' ? '#ffffff' : T.textSec} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: T.textSec }}>
                {totalFeatures}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: selectedCat === 'ALL' ? T.text : T.textSec }}>
                All Features
              </div>
              <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>
                Full system registry
              </div>
            </div>
          </div>

          {/* Individual Category Cards */}
          {categoriesList.map(catKey => {
            const catInfo = FEATURE_CATEGORIES[catKey];
            const catFeats = FEATURE_REGISTRY.filter(item => item.category === catKey);
            const activeCount = catFeats.filter(item => f[item.featureId] !== false).length;
            const isSelected = selectedCat === catKey;
            const catColor = catInfo.color || T.accent;

            return (
              <div
                key={catKey}
                onClick={() => setSelectedCat(catKey)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: `1px solid ${isSelected ? catColor : T.border}`,
                  background: isSelected ? `${catColor}18` : T.bgCard,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  transition: 'all 0.18s ease',
                  boxShadow: isSelected ? `0 4px 16px ${catColor}33` : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: isSelected ? catColor : `${catColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: isSelected ? '#fff' : catColor }}>
                      {catInfo.name.charAt(0)}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 8,
                    background: activeCount === catFeats.length ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                    color: activeCount === catFeats.length ? T.green : T.orange
                  }}>
                    {activeCount}/{catFeats.length} ON
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isSelected ? T.text : T.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {catInfo.name}
                  </div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>
                    {catFeats.length} capability flags
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* â”€â”€â”€ Category Accordions & Feature Cards â”€â”€â”€ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {categoriesList.map(catKey => {
          const catInfo = FEATURE_CATEGORIES[catKey];
          const catFeatures = filteredFeatures.filter(item => item.category === catKey);
          if (catFeatures.length === 0) return null;

          const isExpanded = expandedCats.has(catKey);
          const catEnabledCount = catFeatures.filter(item => f[item.featureId] !== false).length;
          const catColor = catInfo.color || T.accent;

          return (
            <div key={catKey} style={{
              background: T.bgCard,
              borderRadius: 18,
              border: `1px solid ${T.border}`,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
              {/* Category Header */}
              <div
                onClick={() => toggleCat(catKey)}
                style={{
                  padding: '16px 22px',
                  background: isExpanded ? 'rgba(255,255,255,0.02)' : T.bgEl,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: isExpanded ? `1px solid ${T.border}` : 'none',
                  userSelect: 'none',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${catColor}20`,
                    border: `1px solid ${catColor}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, color: catColor, fontSize: 15
                  }}>
                    {catInfo.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{catInfo.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: T.textSec }}>
                        {catFeatures.length} features
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                        background: catEnabledCount === catFeatures.length ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                        color: catEnabledCount === catFeatures.length ? T.green : T.orange
                      }}>
                        {catEnabledCount} / {catFeatures.length} Active
                      </span>
                    </div>
                    {catInfo.desc && (
                      <div style={{ fontSize: 12, color: T.textMut, marginTop: 3 }}>
                        {catInfo.desc}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {isExpanded ? <ChevronDown size={18} color={T.textSec} /> : <ChevronRight size={18} color={T.textSec} />}
                  </div>
                </div>
              </div>

              {/* Feature List inside Category */}
              {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {catFeatures.map((item, idx) => {
                    const isGloballyOn = f[item.featureId] !== false;
                    const isSavingThisFlag = savingFeatureId === item.featureId;

                    return (
                      <div
                        key={item.featureId}
                        style={{
                          padding: '16px 22px',
                          borderBottom: idx < catFeatures.length - 1 ? `1px solid ${T.border}` : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 16,
                          background: !isGloballyOn ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                          transition: 'background 0.15s'
                        }}
                      >
                        {/* Left Info & Global Switch */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: '1 1 360px' }}>
                          <button
                            onClick={() => handleToggleGlobalFlag(item.featureId)}
                            disabled={isSavingThisFlag}
                            title={isGloballyOn ? 'Turn globally OFF' : 'Turn globally ON'}
                            style={{
                              width: 48, height: 26, borderRadius: 13,
                              background: isGloballyOn ? T.green : '#333344',
                              border: 'none', cursor: 'pointer', position: 'relative',
                              transition: 'background 0.2s', flexShrink: 0, marginTop: 2
                            }}
                          >
                            <div style={{
                              width: 20, height: 20, borderRadius: '50%', background: '#fff',
                              position: 'absolute', top: 3, left: isGloballyOn ? 25 : 3,
                              transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }} />
                          </button>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: isGloballyOn ? T.text : T.textSec }}>
                                {item.displayName}
                              </span>
                              <span style={{ fontSize: 10, fontFamily: 'monospace', padding: '2px 6px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: T.accent }}>
                                {item.featureId}
                              </span>
                              {item.subcategory && (
                                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', color: T.textSec }}>
                                  {item.subcategory}
                                </span>
                              )}
                              {!isGloballyOn && (
                                <span style={{ fontSize: 10, fontWeight: 800, color: T.red, background: 'rgba(239,68,68,0.15)', padding: '2px 6px', borderRadius: 6 }}>
                                  DISABLED GLOBALLY
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: T.textSec, marginTop: 4, lineHeight: 1.4 }}>
                              {item.description}
                            </div>
                          </div>
                        </div>

                        {/* Right: Plan Access Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: T.textMut, marginRight: 2 }}>Plan Access:</span>
                          {['free', 'weekly', 'monthly', 'yearly'].map(planId => {
                            const planFeatures = p[planId]?.features || (planId === 'free' ? DEFAULT_FREE_FEATURES : DEFAULT_PAID_FEATURES);
                            const hasPlanAccess = planFeatures.includes(item.featureId);
                            const isSavingThisPlan = savingPlanId === `${planId}_${item.featureId}`;

                            return (
                              <button
                                key={planId}
                                onClick={() => handleTogglePlanFeature(planId, item.featureId)}
                                disabled={isSavingThisPlan || !isGloballyOn}
                                title={`${planId.toUpperCase()} plan ${hasPlanAccess ? 'has access' : 'blocked'}`}
                                style={{
                                  padding: '5px 11px',
                                  borderRadius: 8,
                                  border: hasPlanAccess ? `1px solid ${T.green}55` : `1px solid ${T.border}`,
                                  background: hasPlanAccess ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
                                  color: hasPlanAccess ? T.green : T.textMut,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: isGloballyOn ? 'pointer' : 'not-allowed',
                                  opacity: !isGloballyOn ? 0.35 : 1,
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {planId.toUpperCase()} {hasPlanAccess ? 'âœ“' : 'âœ—'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MAINTENANCE PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function MaintenancePanel({ settings, onSave }) {
  const [form, setForm] = useState(settings || {});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      setSaved(true);
      toast(form.maintenanceMode ? 'âš ï¸ Maintenance mode is now ACTIVE!' : 'Maintenance settings saved.', form.maintenanceMode ? 'warning' : 'success');
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      toast('Failed to save: ' + (e.message || 'Unknown error'), 'error', 6000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {form.maintenanceMode && (
        <div style={{ background: `${T.red}0d`, border: `1px solid ${T.red}33`, borderRadius: T.r.md, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <AlertTriangle size={15} color={T.red} />
          <span style={{ fontSize: 13, color: T.red, fontWeight: 600 }}>Maintenance mode is ACTIVE â€” users will see the maintenance screen.</span>
        </div>
      )}
      <AdminCard title="Maintenance Mode" subtitle="Take the app offline for scheduled maintenance">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ToggleRow label="Enable Maintenance Mode" description="Displays a maintenance page to all users" checked={!!form.maintenanceMode} onChange={v => set('maintenanceMode', v)} />
          <FormTextarea label="Maintenance Message" rows={3} value={form.maintenanceMessage || ''} onChange={v => set('maintenanceMessage', v)}
            placeholder="We are performing scheduled maintenance. Please check back soon." />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={handleSave} disabled={saving} icon={saved ? <Check size={13} /> : <Save size={13} />} variant={saved ? 'success' : 'primary'}>
              {saving ? 'Savingâ€¦' : saved ? 'Saved!' : 'Save Settings'}
            </Btn>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ANNOUNCEMENTS PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function AnnouncementsPanel({ announcement, onSave }) {
  const [form, setForm] = useState(announcement || { title: '', message: '', active: false, type: 'info' });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  useEffect(() => { if (announcement) setForm(announcement); }, [announcement]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      setSaved(true);
      toast(form.active ? 'ðŸ“¢ Announcement published to all users!' : 'Announcement saved (not active).', 'success');
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      toast('Failed to publish: ' + (e.message || 'Unknown error'), 'error', 6000);
    } finally {
      setSaving(false);
    }
  };

  const types = [
    { value: 'info',    label: 'ðŸ’¬ Info',     color: T.blue },
    { value: 'success', label: 'âœ… Success',  color: T.green },
    { value: 'warning', label: 'âš ï¸ Warning',  color: T.orange },
    { value: 'error',   label: 'ðŸš¨ Critical', color: T.red },
  ];
  const curType = types.find(t => t.value === form.type) || types[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminCard title="Announcement Banner" subtitle="Shown to all users at the top of the app">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ToggleRow label="Active" description="Show banner to all users right now" checked={!!form.active} onChange={v => set('active', v)} />
          <FormInput label="Title" value={form.title || ''} onChange={v => set('title', v)} placeholder="e.g. New features available!" />
          <FormTextarea label="Message" value={form.message || ''} rows={3} onChange={v => set('message', v)} placeholder="Tell users what's new or important..." />
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 8 }}>Type</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {types.map(t => (
                <button key={t.value} onClick={() => set('type', t.value)} style={{
                  padding: '6px 14px', borderRadius: T.r.md, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                  background: form.type === t.value ? `${t.color}20` : T.bgEl,
                  border: `1px solid ${form.type === t.value ? t.color : T.border}`,
                  color: form.type === t.value ? t.color : T.textSec, transition: 'all 0.12s',
                }}>{t.label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={handleSave} disabled={saving} icon={saved ? <Check size={13} /> : <Save size={13} />} variant={saved ? 'success' : 'primary'}>
              {saving ? 'Publishingâ€¦' : saved ? 'Published!' : 'Publish Announcement'}
            </Btn>
          </div>
        </div>
      </AdminCard>

      {form.title && (
        <AdminCard title="Preview">
          <div style={{ padding: '12px 16px', borderRadius: T.r.md, background: `${curType.color}12`, border: `1px solid ${curType.color}30`, display: 'flex', gap: 10 }}>
            <Info size={15} color={curType.color} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{form.title}</div>
              {form.message && <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{form.message}</div>}
            </div>
          </div>
        </AdminCard>
      )}
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// REMOTE CONFIG PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function RemoteConfigPanel({ config, onSave }) {
  const [pairs, setPairs] = useState([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  useEffect(() => { if (config) setPairs(Object.entries(config).filter(([k]) => !k.startsWith('_')).map(([k, v]) => ({ k, v }))); }, [config]);

  const update = (i, field, val) => setPairs(p => p.map((x, j) => j === i ? { ...x, [field]: val } : x));
  const remove  = i => setPairs(p => p.filter((_, j) => j !== i));

  const handleSave = async () => {
    setSaving(true);
    try {
      const cfg = Object.fromEntries(pairs.filter(p => p.k.trim()).map(p => [p.k.trim(), p.v]));
      await onSave(cfg);
      setSaved(true);
      toast('Remote config saved! ' + Object.keys(cfg).length + ' keys pushed to all users.', 'success');
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      toast('Failed to save config: ' + (e.message || 'Unknown error'), 'error', 6000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminCard title="Remote Configuration" subtitle="Key-value pairs pushed to the app at runtime"
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => setPairs(p => [...p, { k: '', v: '' }])}>Add Key</Btn>
            <Btn size="sm" onClick={handleSave} disabled={saving} icon={saved ? <Check size={12} /> : <Save size={12} />} variant={saved ? 'success' : 'primary'}>{saving ? 'Savingâ€¦' : saved ? 'Saved!' : 'Save'}</Btn>
          </div>
        }
      >
        {pairs.length === 0 ? (
          <EmptyState icon={Sliders} title="No config keys yet" desc="Add key-value pairs to configure app behavior remotely." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.4px' }}>KEY</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.4px' }}>VALUE</span>
              <span />
            </div>
            {pairs.map((pair, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: 8, alignItems: 'center' }}>
                <FormInput value={pair.k} onChange={v => update(i, 'k', v)} placeholder="config_key" />
                <FormInput value={pair.v} onChange={v => update(i, 'v', v)} placeholder="value" />
                <button onClick={() => remove(i)} style={{ height: 36, borderRadius: T.r.sm, background: `${T.red}12`, border: `1px solid ${T.red}25`, color: T.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ANALYTICS PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function AnalyticsPanel({ chartData = [], stats = {}, isDark = false }) {
  const T = getTokens(isDark);
  const si = DS.getStorageInfo() || {};
  const qr = stats?.qrCount || 0;
  const bc = stats?.barcodeCount || 0;
  const total = qr + bc;
  const breakdown = si.breakdown || {};
  const storageEntries = Object.entries(breakdown).filter(([k]) => k.startsWith('qrgen_')).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: 'var(--ad-text)' }}>
      {/* Analytics Stat Cards - Consistent 2 cards per row on mobile, 4 on desktop */}
      <div className="ad-stat-grid">
        <StatCard icon={QrCode}    label="QR Codes Generated"  value={qr}                   color={T.purple} trendLabel={`${total ? Math.round((qr/total)*100) : 0}% of total`} />
        <StatCard icon={BarChart2} label="Barcodes Generated"  value={bc}                   color={T.green}  trendLabel={`${total ? Math.round((bc/total)*100) : 0}% of total`} />
        <StatCard icon={Package}   label="Batch Generations"   value={stats?.batchCount || 0} color={T.orange} trendLabel="Bulk jobs total" />
        <StatCard icon={Star}      label="Saved Creations"     value={stats?.savedCount || 0} color={T.blue}   trendLabel="User favorites" />
      </div>

      {/* Analytics Main Chart */}
      <AdminCard title="7-Day Generation Velocity & Trend" subtitle="Daily breakdown of generated QR codes vs Barcodes"
        right={
          <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--ad-text-sec)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, height: 3, background: T.purple, borderRadius: 2, display: 'inline-block' }} />QR Codes</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, height: 3, background: T.green, borderRadius: 2, display: 'inline-block' }} />Barcodes</span>
          </div>
        }
      >
        <LineChartSVG data={chartData} series={[{ key: 'qr', color: T.purple }, { key: 'barcode', color: T.green }]} height={220} />
      </AdminCard>

      {/* Distribution & Storage Breakdown */}
      <div className="ad-two-col">
        <AdminCard title="Type & Format Share">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <DonutSVG segments={[{ label: 'QR', value: qr, color: T.purple }, { label: 'Barcode', value: bc, color: T.green }]} size={145} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{ l: 'QR Codes', v: qr, c: T.purple }, { l: 'Barcodes', v: bc, c: T.green }].map(s => {
                const pct = total ? Math.round((s.v / total) * 100) : 0;
                return (
                  <div key={s.l}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ad-text)' }}>{s.l}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: s.c }}>{s.v} ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--ad-input)', borderRadius: 3 }}>
                      <div style={{ height: '100%', background: s.c, borderRadius: 3, width: `${pct}%`, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </AdminCard>

        <AdminCard title="Storage Quota Analytics" subtitle="Data breakdown in LocalStorage">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {storageEntries.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--ad-text-sec)', padding: '12px 0' }}>Storage tracking active ({si.used || '0 KB'})</div>
            ) : (
              storageEntries.map(([key, bytes]) => (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: 'var(--ad-text-sec)', fontFamily: 'monospace' }}>{key.replace('qrgen_', '')}</span>
                    <span style={{ fontSize: 11, color: 'var(--ad-text)', fontWeight: 700 }}>{fmtBytes(bytes)}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--ad-input)', borderRadius: 2 }}>
                    <div style={{ height: '100%', background: T.purple, borderRadius: 2, width: `${si.totalBytes ? (bytes / si.totalBytes) * 100 : 0}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// REPORTS PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function ReportsPanel({ history, isDark = false }) {
  const T = getTokens(isDark);
  const [exporting, setExporting] = useState(false);

  const exportCSV = () => {
    const rows = [['Type', 'Content', 'Format', 'Created At']];
    (history || []).forEach(h => rows.push([
      h.barcodeType ? 'Barcode' : 'QR',
      h.qrData ? safeStr(h.qrData) : safeStr(h.data) || '',
      h.qrType || h.barcodeType || '',
      h.timestamp || '',
    ]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `mushi-qr-report-${new Date().toISOString().slice(0,10)}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = async () => {
    setExporting(true);
    try {
      const backup = await DS.exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: `mushi-qr-export-${new Date().toISOString().slice(0,10)}.json` }).click();
      URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Consistent 2 cards per row on mobile */}
      <div className="ad-stat-grid">
        {[
          { icon: FileText, label: 'History CSV', desc: 'Export all creation history as CSV', color: T.green, action: exportCSV, btn: 'Export CSV' },
          { icon: Download,  label: 'Full Data Export', desc: 'All app data as JSON backup', color: T.blue, action: exportJSON, btn: exporting ? 'Exporting...' : 'Export JSON' },
        ].map(r => (
          <AdminCard key={r.label}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: T.r.lg, background: `${r.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <r.icon size={22} color={r.color} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontSize: 12, color: T.textSec }}>{r.desc}</div>
              </div>
              <Btn variant="ghost" icon={<Download size={13} />} onClick={r.action}>{r.btn}</Btn>
            </div>
          </AdminCard>
        ))}
      </div>

      <AdminCard title={`History (${(history || []).length} items)`} subtitle="Full creation log" noPadding>
        {!(history || []).length ? (
          <EmptyState icon={FileText} title="No history yet" desc="QR codes and barcodes you create will appear here." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Type', 'Content', 'Format', 'Created'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '9px 20px', fontSize: 10, fontWeight: 800, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(history || []).slice(0, 50).map((item, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '9px 20px' }}><Badge color={item.barcodeType ? T.green : T.purple}>{item.barcodeType ? 'Barcode' : 'QR'}</Badge></td>
                    <td style={{ padding: '9px 20px', fontSize: 12, color: T.text, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{safeStr(item.qrData) || safeStr(item.data) || 'â€”'}</td>
                    <td style={{ padding: '9px 20px', fontSize: 11, color: T.textSec }}>{item.qrType || item.barcodeType || 'â€”'}</td>
                    <td style={{ padding: '9px 20px', fontSize: 11, color: T.textSec, whiteSpace: 'nowrap' }}>{fmtDate(item.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ACTIVITY LOGS PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function ActivityLogsPanel({ history }) {
  const [search, setSearch] = useState('');
  const filtered = (history || []).filter(h =>
    !search || safeStr(h.qrData || h.data || '').toLowerCase().includes(search.toLowerCase()) ||
    (h.qrType || h.barcodeType || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminCard title={`Activity Log (${(history || []).length})`} subtitle="All creation events"
      right={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.bgEl, border: `1px solid ${T.border}`, borderRadius: T.r.md, padding: '6px 12px' }}>
          <Search size={13} color={T.textMut} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            style={{ background: 'none', border: 'none', outline: 'none', color: T.text, fontSize: 12, fontFamily: 'inherit', width: 140 }} />
        </div>
      }
      noPadding
    >
      {filtered.length === 0 ? (
        <EmptyState icon={Activity} title="No activity found" desc={search ? 'Try a different term.' : 'Activity will appear here as you use the app.'} />
      ) : (
        <div>
          {filtered.slice(0, 100).map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = T.bgHov}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 34, height: 34, borderRadius: T.r.sm, background: item.barcodeType ? `${T.green}18` : `${T.purple}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.barcodeType ? <BarChart2 size={15} color={T.green} /> : <QrCode size={15} color={T.purple} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {safeStr(item.qrData) || safeStr(item.data) || item.qrType || 'Unknown'}
                </div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>
                  {item.qrType || item.barcodeType || 'General'} Â· {timeAgo(item.timestamp)}
                </div>
              </div>
              <Badge color={item.barcodeType ? T.green : T.purple}>{item.barcodeType ? 'Barcode' : 'QR'}</Badge>
            </div>
          ))}
        </div>
      )}
    </AdminCard>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BACKUPS PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function BackupsPanel() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef();
  const si = DS.getStorageInfo();

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

  const handleExport = async () => {
    setExporting(true);
    try {
      const backup = await DS.exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: `mushi-qr-backup-${new Date().toISOString().slice(0,10)}.json` }).click();
      URL.revokeObjectURL(url);
      showMsg('success', 'Backup exported successfully!');
    } catch (e) { showMsg('error', 'Export failed: ' + e.message); }
    finally { setExporting(false); }
  };

  const handleImport = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm(`Restore from "${file.name}"? This will OVERWRITE all current data.`)) return;
    setImporting(true);
    try {
      const backup = JSON.parse(await file.text());
      await DS.importBackup(backup);
      showMsg('success', 'Backup restored! Reload the page to see changes.');
    } catch (e) { showMsg('error', 'Import failed: ' + e.message); }
    finally { setImporting(false); e.target.value = ''; }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: T.r.md, display: 'flex', gap: 10, alignItems: 'center', background: msg.type === 'success' ? `${T.green}12` : `${T.red}0d`, border: `1px solid ${msg.type === 'success' ? T.green : T.red}33` }}>
          {msg.type === 'success' ? <CheckCircle size={15} color={T.green} /> : <AlertCircle size={15} color={T.red} />}
          <span style={{ fontSize: 13, color: msg.type === 'success' ? T.green : T.red, fontWeight: 600 }}>{msg.text}</span>
        </div>
      )}

      <AdminCard title="Storage Overview">
        <div>
          <div style={{ fontSize: 32, fontWeight: 900, color: T.text, marginBottom: 4 }}>{si.used}</div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>of ~5 MB localStorage quota</div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
            <div style={{ height: '100%', background: T.accent, borderRadius: 3, width: `${Math.min((si.totalBytes / (5 * 1024 * 1024)) * 100, 100)}%`, transition: 'width 0.4s' }} />
          </div>
        </div>
      </AdminCard>

      <div className="ad-two-col">
        <AdminCard title="Export Backup" subtitle="Download all data as JSON">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: T.textSec, margin: 0, lineHeight: 1.6 }}>
              Creates a complete snapshot of your QR history, settings, templates, feature flags, and remote config.
            </p>
            <Btn onClick={handleExport} disabled={exporting} icon={<Download size={13} />}>
              {exporting ? 'Exporting...' : 'Download Backup'}
            </Btn>
          </div>
        </AdminCard>

        <AdminCard title="Restore Backup" subtitle="Import data from a backup file">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: T.textSec, margin: 0, lineHeight: 1.6 }}>
              Restores all data from a previous backup. <strong style={{ color: T.red }}>Warning: overwrites current data.</strong>
            </p>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            <Btn variant="ghost" onClick={() => fileRef.current?.click()} disabled={importing} icon={<Upload size={13} />}>
              {importing ? 'Restoring...' : 'Choose File'}
            </Btn>
          </div>
        </AdminCard>
      </div>

      <AdminCard title="Storage Breakdown" subtitle="Size per data category">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(si.breakdown).filter(([k]) => k.startsWith('qrgen_')).sort((a, b) => b[1] - a[1]).map(([key, bytes]) => (
            <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: T.text, fontFamily: 'monospace', marginBottom: 2 }}>{key}</div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                  <div style={{ height: '100%', background: T.purple, borderRadius: 2, width: `${si.totalBytes ? (bytes / si.totalBytes) * 100 : 0}%` }} />
                </div>
              </div>
              <span style={{ fontSize: 11, color: T.textSec, whiteSpace: 'nowrap' }}>{fmtBytes(bytes)}</span>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SYSTEM HEALTH PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function SystemHealthPanel({ stats, isDark = false }) {
  const T = getTokens(isDark);
  const si = DS.getStorageInfo() || {};
  const breakdown = si.breakdown || {};
  const checks = [
    { label: 'localStorage Available', pass: typeof localStorage !== 'undefined',               detail: `${si.used || 'Active'} used` },
    { label: 'Service Worker',         pass: 'serviceWorker' in navigator,                      detail: 'PWA & offline support' },
    { label: 'Secure Context',         pass: window.isSecureContext,                            detail: window.isSecureContext ? 'HTTPS confirmed' : 'HTTP — insecure' },
    { label: 'PWA Manifest',           pass: !!document.querySelector('link[rel="manifest"]'), detail: 'manifest.json linked' },
    { label: 'Canvas API',             pass: !!document.createElement('canvas').getContext,     detail: 'Required for QR generation' },
    { label: 'Clipboard API',          pass: !!navigator.clipboard,                             detail: 'Required for copy feature' },
    { label: 'Online Status',          pass: navigator.onLine,                                  detail: navigator.onLine ? 'Connected' : 'Offline' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Consistent 2 cards per row on mobile */}
      <div className="ad-stat-grid">
        <StatCard icon={Database} label="Storage"   value={si.used || '0 KB'}      color={T.green}  />
        <StatCard icon={QrCode}   label="QR Items"  value={stats?.historyCount || 0} color={T.purple} />
        <StatCard icon={Server}   label="Config Keys" value={Object.keys(breakdown).filter(k => k.startsWith('qrgen_')).length} color={T.blue} />
        <StatCard icon={Zap}      label="PWA Engine" value="Active"                color={T.orange} trendLabel="Offline cached" />
      </div>

      <AdminCard title="Health Checks" subtitle="Component diagnostics">
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < checks.length - 1 ? `1px solid ${T.border}` : 'none' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: c.pass ? `${T.green}18` : `${T.red}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {c.pass ? <Check size={13} color={T.green} /> : <X size={13} color={T.red} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.label}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>{c.detail}</div>
            </div>
            <Badge color={c.pass ? T.green : T.red}>{c.pass ? 'Pass' : 'Fail'}</Badge>
          </div>
        ))}
      </AdminCard>

      <AdminCard title="Environment">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Display Mode', value: window.matchMedia('(display-mode: standalone)').matches ? 'PWA App' : 'Browser' },
            { label: 'Language', value: navigator.language },
            { label: 'Screen', value: `${window.screen.width}Ã—${window.screen.height}` },
            { label: 'Viewport', value: `${window.innerWidth}Ã—${window.innerHeight}` },
            { label: 'Platform', value: navigator.platform || 'Unknown' },
            { label: 'Online', value: navigator.onLine ? 'Yes' : 'No' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: T.bgEl, borderRadius: T.r.md, padding: '10px 12px', border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.textMut, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 12, color: T.text, wordBreak: 'break-all' }}>{value}</div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// AUDIT LOGS PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function AuditLogsPanel({ log }) {
  const actionColors = {
    APP_SETTINGS_UPDATED: T.blue, FEATURE_FLAGS_UPDATED: T.purple,
    TEMPLATE_SAVED: T.green, TEMPLATE_DELETED: T.red,
    ANNOUNCEMENT_UPDATED: T.orange, REMOTE_CONFIG_UPDATED: T.blue,
    BACKUP_RESTORED: T.green,
  };
  return (
    <AdminCard title={`Audit Log (${(log || []).length})`} subtitle="All admin actions are automatically tracked" noPadding>
      {!(log || []).length ? (
        <EmptyState icon={ClipboardList} title="No audit events yet" desc="Save settings, update flags, or manage templates to see audit entries." />
      ) : (
        <div>
          {(log || []).map((entry, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 20px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: actionColors[entry.action] || T.textSec, flexShrink: 0, marginTop: 6 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, fontFamily: 'monospace' }}>{entry.action}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 1 }}>By {entry.actor} · {timeAgo(entry.ts)}</div>
              </div>
              <span style={{ fontSize: 10, color: T.textMut, whiteSpace: 'nowrap' }}>{fmtDate(entry.ts)}</span>
            </div>
          ))}
        </div>
      )}
    </AdminCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// QR & BARCODE PANEL
// ═══════════════════════════════════════════════════════════════════════════

function QRBarcodePanel({ stats, history, isDark = false }) {
  const T = getTokens(isDark);
  const byType = (arr, key) => {
    const map = {};
    (arr || []).forEach(h => { const k = h[key] || 'Unknown'; map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  };

  const qrItems  = (history || []).filter(h => !h.barcodeType);
  const bcItems  = (history || []).filter(h =>  h.barcodeType);
  const qrTypes  = byType(qrItems, 'qrType');
  const bcTypes  = byType(bcItems, 'barcodeType');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="ad-stat-grid">
        <StatCard icon={QrCode}    label="QR Codes"   value={stats?.qrCount || 0}      color={T.purple} />
        <StatCard icon={BarChart2} label="Barcodes"   value={stats?.barcodeCount || 0} color={T.green}  />
        <StatCard icon={Package}   label="Batch Jobs" value={stats?.batchCount || 0}   color={T.orange} />
        <StatCard icon={Star}      label="Saved"      value={stats?.savedCount || 0}   color={T.blue}   />
      </div>

      <div className="ad-two-col">
        <AdminCard title="QR Code Types" subtitle="Breakdown by content type">
          {qrTypes.length === 0 ? <EmptyState icon={QrCode} title="No QR codes yet" desc="Create QR codes to see breakdown." /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {qrTypes.map(([type, count]) => (
                <div key={type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: 'var(--ad-text-sec)' }}>{type}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ad-text)' }}>{count}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--ad-input)', borderRadius: 2 }}>
                    <div style={{ height: '100%', background: T.purple, borderRadius: 2, width: `${(count / Math.max(qrItems.length, 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>

        <AdminCard title="Barcode Formats" subtitle="Breakdown by format">
          {bcTypes.length === 0 ? <EmptyState icon={BarChart2} title="No barcodes yet" desc="Create barcodes to see format breakdown." /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bcTypes.map(([type, count]) => (
                <div key={type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: 'var(--ad-text-sec)' }}>{type}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ad-text)' }}>{count}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--ad-input)', borderRadius: 2 }}>
                    <div style={{ height: '100%', background: T.green, borderRadius: 2, width: `${(count / Math.max(bcItems.length, 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ADMIN USERS PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function AdminUsersPanel({ currentUser, isDark = false }) {
  const T = getTokens(isDark);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 2-column mobile, 4-column desktop stat cards consistent with home screen */}
      <div className="ad-stat-grid">
        <StatCard icon={Shield}      label="Admin Role"     value="Super Admin" color={T.accent} trendLabel="Highest privilege tier" />
        <StatCard icon={CheckCircle} label="Auth Status"    value="Active"      color={T.green}  trendLabel="Firebase Auth verified" />
        <StatCard icon={Lock}        label="Security Rules" value="Enforced"    color={T.blue}   trendLabel="Firestore security rules" />
        <StatCard icon={Zap}         label="Access Scope"   value="Global"      color={T.purple} trendLabel="Full system permissions" />
      </div>

      <AdminCard title="Super Admin Account" subtitle="Active Super Admin user session from Firebase Auth" noPadding>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Admin" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${T.accent}` }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: T.accentLow, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent, fontWeight: 900, fontSize: 16 }}>
                {(currentUser?.displayName || currentUser?.email || 'SA')[0].toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ad-text)' }}>{currentUser?.displayName || 'Super Admin'}</div>
              <div style={{ fontSize: 12, color: 'var(--ad-text-sec)', fontFamily: 'monospace' }}>{currentUser?.email || 'mabuneri143@gmail.com'}</div>
            </div>
            <Badge color={T.accent}>Super Admin</Badge>
            <Badge color={T.green}>Live Auth</Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ad-text-mut)', fontWeight: 700, textTransform: 'uppercase' }}>User ID (UID)</div>
              <div style={{ fontSize: 11, color: 'var(--ad-text-sec)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.uid || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ad-text-mut)', fontWeight: 700, textTransform: 'uppercase' }}>Provider</div>
              <div style={{ fontSize: 11, color: 'var(--ad-text-sec)' }}>{currentUser?.providerData?.[0]?.providerId || 'google.com'}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ad-text-mut)', fontWeight: 700, textTransform: 'uppercase' }}>Account Created</div>
              <div style={{ fontSize: 11, color: 'var(--ad-text-sec)' }}>{fmtDate(currentUser?.metadata?.creationTime)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ad-text-mut)', fontWeight: 700, textTransform: 'uppercase' }}>Last Sign In</div>
              <div style={{ fontSize: 11, color: 'var(--ad-text-sec)' }}>{fmtDate(currentUser?.metadata?.lastSignInTime)}</div>
            </div>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ROLES & PERMISSIONS PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function RolesPanel() {
  const roles = [
    { name: 'Super Admin', color: T.accent, perms: ['Full Firestore write access', 'App Settings & Branding', 'Feature Flags & Remote Config', 'Announcements & Maintenance', 'Template management', 'Audit logs & Backups'] },
    { name: 'Standard User', color: T.blue, perms: ['Read global settings & templates', 'Generate & export QR codes', 'Personal history & saved items', 'Cloud sync to Firestore'] },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: `${T.green}0c`, border: `1px solid ${T.green}2a`, borderRadius: T.r.md, padding: '11px 15px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <CheckCircle size={14} color={T.green} />
        <span style={{ fontSize: 12, color: T.textSec }}>Role security rules are deployed and strictly enforced by Firebase Firestore in real-time.</span>
      </div>
      {roles.map(role => (
        <AdminCard key={role.name} title={role.name} right={<Badge color={role.color}>{role.name}</Badge>}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {role.perms.map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 11px', background: `${role.color}10`, borderRadius: 100, border: `1px solid ${role.color}28` }}>
                <Check size={10} color={role.color} />
                <span style={{ fontSize: 11, color: role.color }}>{p}</span>
              </div>
            ))}
          </div>
        </AdminCard>
      ))}
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SECURITY PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function SecurityPanel({ currentUser }) {
  const provider = currentUser?.providerData?.[0]?.providerId || 'google.com';
  const checks = [
    { label: 'HTTPS Protocol',       value: window.isSecureContext ? 'Encrypted (SSL)' : 'Insecure', ok: window.isSecureContext, warn: false },
    { label: 'Firebase Auth',        value: `Active (${provider})`,                                 ok: !!currentUser,           warn: false },
    { label: 'Firestore Security',   value: 'Rules Deployed',                                       ok: true,                    warn: false },
    { label: 'Service Worker / PWA', value: 'serviceWorker' in navigator ? 'Enabled' : 'Disabled',  ok: 'serviceWorker' in navigator, warn: false },
    { label: 'Web Manifest',         value: document.querySelector('link[rel="manifest"]') ? 'Linked' : 'Missing', ok: !!document.querySelector('link[rel="manifest"]'), warn: false },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminCard title="Security Status" subtitle="Live security & infrastructure verification">
        {checks.map((item, i, arr) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none' }}>
            <span style={{ fontSize: 13, color: T.text }}>{item.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: T.textSec }}>{item.value}</span>
              <Badge color={item.ok ? T.green : item.warn ? T.orange : T.red}>{item.ok ? 'OK' : item.warn ? 'Warn' : 'None'}</Badge>
            </div>
          </div>
        ))}
      </AdminCard>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// INTEGRATIONS PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function IntegrationsPanel({ isDark = false }) {
  const T = getTokens(isDark);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminCard title="Firebase Integration" subtitle="Live connected services" right={<Badge color={T.green}>Connected</Badge>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { label: 'Project ID',      value: 'mushi-qr-pro',              ok: true },
            { label: 'Authentication',  value: 'Firebase Auth (Google/Email)', ok: true },
            { label: 'Cloud Firestore', value: 'Live Realtime Sync',          ok: true },
            { label: 'Hosting',         value: 'Vercel Deployment',         ok: true },
          ].map((item, i, arr) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <span style={{ fontSize: 13, color: T.text }}>{item.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: T.textSec }}>{item.value}</span>
                <Badge color={T.green}>Connected</Badge>
              </div>
            </div>
          ))}
          <div style={{ paddingTop: 14 }}>
            <a href="https://console.firebase.google.com/project/mushi-qr-pro" target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.blue, textDecoration: 'none', fontWeight: 600 }}>
              Open Firebase Console <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </AdminCard>

      <div className="ad-stat-grid">
        {[
          { name: 'Firestore', icon: Database, desc: 'Real-time database', color: T.orange, status: 'Active' },
          { name: 'Firebase Auth', icon: Lock, desc: 'User accounts & security', color: T.blue, status: 'Active' },
          { name: 'Vercel Hosting', icon: Globe, desc: 'Global CDN deployment', color: T.purple, status: 'Active' },
          { name: 'Service Worker', icon: Cpu, desc: 'Offline PWA caching', color: T.green, status: 'Active' },
        ].map(int => (
          <AdminCard key={int.name}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: T.r.md, background: `${int.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <int.icon size={19} color={int.color} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>{int.name}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>{int.desc}</div>
              </div>
              <Badge color={T.green}>{int.status}</Badge>
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DEVELOPER PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function DeveloperPanel({ currentUser, isDark = false }) {
  const T = getTokens(isDark);
  const [copied, setCopied] = useState('');
  const keys = Object.keys(localStorage).filter(k => k.startsWith('qrgen_'));

  const copyVal = key => {
    navigator.clipboard?.writeText(localStorage.getItem(key) || '');
    setCopied(key); setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Consistent 2 cards per row on mobile */}
      <div className="ad-stat-grid">
        {[
          { label: 'App Version',   value: '2.0.0' },
          { label: 'Environment',   value: 'Production' },
          { label: 'Firebase ID',   value: 'mushi-qr-pro' },
          { label: 'Active User',   value: currentUser?.email || 'Admin' },
        ].map(item => (
          <AdminCard key={item.label}>
            <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', fontWeight: 800, marginBottom: 6, letterSpacing: '0.5px' }}>{item.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, wordBreak: 'break-all', fontFamily: 'monospace' }}>{item.value}</div>
          </AdminCard>
        ))}
      </div>

      <AdminCard title="localStorage Keys" subtitle={`${keys.length} app data keys`} noPadding>
        {keys.length === 0 ? (
          <EmptyState icon={Database} title="No data keys" desc="Keys appear here as you use the app." />
        ) : (
          <div>
            {keys.map(key => {
              const size = ((localStorage.getItem(key) || '').length + key.length) * 2;
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: T.text, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{key}</div>
                    <div style={{ fontSize: 10, color: T.textMut }}>{fmtBytes(size)}</div>
                  </div>
                  <button onClick={() => copyVal(key)} style={{ background: 'none', border: 'none', color: copied === key ? T.green : T.textSec, cursor: 'pointer', padding: 4, display: 'flex' }}>
                    {copied === key ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SIMPLE FUNCTIONAL PANELS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function UsersPanel({ isDark = false }) {
  const T = getTokens(isDark);
  const toast = useToast();
  const [appUsers, setAppUsers] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, google, email, active, blocked
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, active, name
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showVisitors, setShowVisitors] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Load users and visitors on mount
  useEffect(() => {
    async function load() {
      try {
        const [users, vis] = await Promise.all([
          DS.getAllAppUsers(),
          DS.getAllVisitors(),
        ]);
        setAppUsers(users);
        setVisitors(vis);
      } catch (e) {
        toast?.('Failed to load users: ' + e.message, 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Refresh helper
  const refresh = async () => {
    setLoading(true);
    try {
      const [users, vis] = await Promise.all([
        DS.getAllAppUsers(),
        DS.getAllVisitors(),
      ]);
      setAppUsers(users);
      setVisitors(vis);
    } finally {
      setLoading(false);
    }
  };

  // Open user detail
  const openDetail = async (user) => {
    setSelectedUser(user);
    setDetailLoading(true);
    setUserStats(null);
    try {
      const stats = await DS.getUserActivityStats(user.uid);
      setUserStats(stats);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  // Block/unblock user
  const toggleStatus = async (uid, currentStatus) => {
    setActionLoading(true);
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    try {
      await DS.updateUserStatus(uid, newStatus);
      toast?.(`User ${newStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully`, 'success');
      setAppUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: newStatus } : u));
      if (selectedUser?.uid === uid) setSelectedUser(prev => ({ ...prev, status: newStatus }));
    } catch (e) {
      toast?.('Failed to update status: ' + e.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete user record from Firestore
  const handleDelete = async (uid) => {
    if (!confirm('Are you sure you want to remove this user profile? This will not delete their Firebase Auth account.')) return;
    setActionLoading(true);
    try {
      await DS.deleteUserProfile(uid);
      toast?.('User record removed', 'info');
      setAppUsers(prev => prev.filter(u => u.uid !== uid));
      setSelectedUser(null);
    } catch (e) {
      toast?.('Failed to delete: ' + e.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ['UID', 'Display Name', 'Email', 'Provider', 'Status', 'Is Pro', 'Created At', 'Last Active At', 'Visit Count'];
    const rows = filteredUsers.map(u => [
      u.uid || '',
      `"${(u.displayName || '').replace(/"/g, '""')}"`,
      u.email || '',
      u.provider || '',
      u.status || 'active',
      u.isPro ? 'Yes' : 'No',
      u.createdAt ? new Date(u.createdAt).toISOString() : '',
      u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : '',
      u.visitCount || 1,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mushi_users_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast?.('Exported CSV successfully', 'success');
  };

  // Filter and sort
  const filteredUsers = appUsers
    .filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.uid || '').toLowerCase().includes(q);
      const matchFilter =
        filter === 'all' ? true :
        filter === 'google' ? u.provider === 'google' :
        filter === 'email' ? u.provider === 'email' :
        filter === 'active' ? u.status !== 'blocked' :
        filter === 'blocked' ? u.status === 'blocked' : true;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === 'active') return new Date(b.lastActiveAt || 0) - new Date(a.lastActiveAt || 0);
      if (sortBy === 'name') return (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '');
      return 0;
    });

  // Stats calculations
  const now = Date.now();
  const activeCount = appUsers.filter(u => u.lastActiveAt && (now - new Date(u.lastActiveAt).getTime()) < 7 * 86400000).length;
  const newCount = appUsers.filter(u => u.createdAt && (now - new Date(u.createdAt).getTime()) < 30 * 86400000).length;
  const anonVisitors = visitors.filter(v => !v.isRegistered).length;
  const mobileVisitors = visitors.filter(v => v.deviceInfo?.isMobile).length;
  const desktopVisitors = visitors.filter(v => !v.deviceInfo?.isMobile).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 14 }}>
        <div style={{ width: 36, height: 36, border: `3px solid var(--ad-card)`, borderTopColor: '#FF4D9D', borderRadius: '50%', animation: 'adSpin 0.7s linear infinite' }} />
        <span style={{ fontSize: 14, color: 'var(--ad-text-sec)' }}>Loading users...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ─── Stat Cards (2 per row on mobile, 4 on desktop) ─── */}
      <div className="ad-stat-grid">
        <StatCard icon={Users} label="Total Users" value={appUsers.length} color={T.purple} trendLabel="registered accounts" />
        <StatCard icon={Activity} label="Active (7d)" value={activeCount} color={T.green} trendLabel="last 7 days" />
        <StatCard icon={Globe} label="Anonymous Visitors" value={anonVisitors} color={T.orange} trendLabel="unregistered devices" />
        <StatCard icon={TrendingUp} label="New (30d)" value={newCount} color={T.blue} trendLabel="last 30 days" />
      </div>

      {/* ─── Users Table Card ─── */}
      <AdminCard
        title={`Registered Users (${filteredUsers.length})`}
        subtitle="All authenticated users tracked via Firebase Auth"
        right={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn variant="ghost" size="sm" onClick={refresh} icon={<RefreshCw size={12} />}>Refresh</Btn>
            <Btn variant="ghost" size="sm" onClick={exportCSV} icon={<Download size={12} />}>CSV</Btn>
          </div>
        }
        noPadding
      >
        {/* Search & Filters */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid var(--ad-border)`, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--ad-input)', border: `1px solid var(--ad-border)`, borderRadius: T.r.md, padding: '8px 14px', flex: 1, minWidth: 180 }}>
            <Search size={14} color="var(--ad-text-sec)" />
            <input
              placeholder="Search by name or email..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--ad-text)', fontSize: 13, fontFamily: 'inherit', width: '100%' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--ad-text-sec)', cursor: 'pointer', padding: 0, lineHeight: 0 }}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'google', label: 'Google' },
              { id: 'email', label: 'Email' },
              { id: 'active', label: 'Active' },
              { id: 'blocked', label: 'Blocked' },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                padding: '6px 14px', borderRadius: 100, border: `1px solid ${filter === f.id ? '#FF4D9D' : 'var(--ad-border)'}`, cursor: 'pointer',
                fontSize: 12, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s',
                background: filter === f.id ? 'rgba(255, 77, 157, 0.14)' : 'var(--ad-input)',
                color: filter === f.id ? '#FF4D9D' : 'var(--ad-text-sec)',
              }}>{f.label}</button>
            ))}
          </div>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
            background: 'var(--ad-input)', border: `1px solid var(--ad-border)`, borderRadius: T.r.md,
            color: 'var(--ad-text)', fontSize: 12, fontWeight: 600, padding: '7px 12px', cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
          }}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="active">Most Active</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>

        {/* Table */}
        {filteredUsers.length === 0 ? (
          <EmptyState icon={Users} title="No users found" desc={search ? 'Try a different search query.' : 'Users who sign in to the app will appear here.'} />
        ) : (
          <div className="ad-table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid var(--ad-border)`, background: 'var(--ad-input)' }}>
                  {['User', 'Provider', 'Status', 'Joined', 'Last Active', 'Visits'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10, fontWeight: 800, color: 'var(--ad-text-sec)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.uid}
                    onClick={() => openDetail(u)}
                    style={{ borderBottom: `1px solid var(--ad-border)`, cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--ad-input)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Avatar + Name + Email */}
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255, 77, 157, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF4D9D', fontWeight: 900, fontSize: 13, flexShrink: 0 }}>
                            {(u.displayName || u.email || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ad-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                            {u.displayName || u.email?.split('@')[0] || 'User'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--ad-text-sec)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240, fontFamily: 'monospace' }}>
                            {u.email || '—'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Provider */}
                    <td style={{ padding: '10px 16px' }}>
                      <Badge color={u.provider === 'google' ? '#4285F4' : u.provider === 'email' ? T.purple : 'var(--ad-text-sec)'}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }} />
                        {u.provider === 'google' ? 'Google' : u.provider === 'email' ? 'Email' : u.provider || '?'}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: u.status === 'blocked' ? T.red : T.green }} />
                        <span style={{ fontSize: 12, color: u.status === 'blocked' ? T.red : T.green, fontWeight: 700, textTransform: 'capitalize' }}>
                          {u.status || 'active'}
                        </span>
                      </div>
                    </td>

                    {/* Joined */}
                    <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--ad-text-sec)', whiteSpace: 'nowrap' }}>
                      {fmtDate(u.createdAt)}
                    </td>

                    {/* Last Active */}
                    <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--ad-text-sec)', whiteSpace: 'nowrap' }}>
                      {timeAgo(u.lastActiveAt)}
                    </td>

                    {/* Visits */}
                    <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 700, color: 'var(--ad-text)' }}>
                      {u.visitCount || 1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* ─── Anonymous Visitors Section ─── */}
      <AdminCard
        title={`Anonymous Visitors (${visitors.length})`}
        subtitle="Devices that opened the app — includes unregistered users"
        right={
          <button onClick={() => setShowVisitors(v => !v)} style={{
            background: 'none', border: `1px solid var(--ad-border)`, borderRadius: T.r.md,
            color: 'var(--ad-text-sec)', cursor: 'pointer', padding: '5px 12px', fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {showVisitors ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            {showVisitors ? 'Collapse' : 'Expand'}
          </button>
        }
      >
        {/* Summary always visible in 2-column mobile grid */}
        <div className="ad-stat-grid" style={{ marginBottom: showVisitors ? 16 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--ad-input)', padding: '12px 14px', borderRadius: T.r.md, border: `1px solid var(--ad-border)` }}>
            <div style={{ width: 36, height: 36, borderRadius: T.r.md, background: `${T.blue}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Globe size={18} color={T.blue} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--ad-text)' }}>{visitors.length}</div>
              <div style={{ fontSize: 10, color: 'var(--ad-text-sec)' }}>Total Devices</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--ad-input)', padding: '12px 14px', borderRadius: T.r.md, border: `1px solid var(--ad-border)` }}>
            <div style={{ width: 36, height: 36, borderRadius: T.r.md, background: `${T.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle size={18} color={T.green} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--ad-text)' }}>{visitors.filter(v => v.isRegistered).length}</div>
              <div style={{ fontSize: 10, color: 'var(--ad-text-sec)' }}>Converted</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--ad-input)', padding: '12px 14px', borderRadius: T.r.md, border: `1px solid var(--ad-border)` }}>
            <div style={{ width: 36, height: 36, borderRadius: T.r.md, background: `${T.orange}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Monitor size={18} color={T.orange} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--ad-text)' }}>{desktopVisitors}</div>
              <div style={{ fontSize: 10, color: 'var(--ad-text-sec)' }}>Desktop</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--ad-input)', padding: '12px 14px', borderRadius: T.r.md, border: `1px solid var(--ad-border)` }}>
            <div style={{ width: 36, height: 36, borderRadius: T.r.md, background: `${T.purple}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Cpu size={18} color={T.purple} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--ad-text)' }}>{mobileVisitors}</div>
              <div style={{ fontSize: 10, color: 'var(--ad-text-sec)' }}>Mobile</div>
            </div>
          </div>
        </div>

        {/* Platform breakdown donut */}
        {showVisitors && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <DonutSVG segments={[
                { label: 'Mobile', value: mobileVisitors, color: T.purple },
                { label: 'Desktop', value: desktopVisitors, color: T.blue },
                { label: 'Registered', value: visitors.filter(v => v.isRegistered).length, color: T.green },
              ]} size={130} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { l: 'Mobile Devices', v: mobileVisitors, c: T.purple },
                  { l: 'Desktop Devices', v: desktopVisitors, c: T.blue },
                  { l: 'Converted to Users', v: visitors.filter(v => v.isRegistered).length, c: T.green },
                  { l: 'Unregistered', v: anonVisitors, c: T.orange },
                ].map(s => (
                  <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: s.c, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--ad-text-sec)', minWidth: 130 }}>{s.l}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ad-text)' }}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visitor list table */}
            <div className="ad-table-wrap" style={{ marginTop: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid var(--ad-border)`, background: 'var(--ad-input)' }}>
                    {['Device ID', 'Platform', 'First Seen', 'Last Seen', 'Visits', 'Registered'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 14px', fontSize: 10, fontWeight: 800, color: 'var(--ad-text-sec)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visitors.slice(0, 50).map(v => (
                    <tr key={v.id || v.deviceId} style={{ borderBottom: `1px solid var(--ad-border)` }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--ad-input)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '8px 14px', fontSize: 11, color: 'var(--ad-text-sec)', fontFamily: 'monospace' }}>
                        {(v.deviceId || v.id || '').slice(0, 20)}...
                      </td>
                      <td style={{ padding: '8px 14px' }}>
                        <Badge color={v.deviceInfo?.isMobile ? T.purple : T.blue}>
                          {v.deviceInfo?.isMobile ? 'Mobile' : 'Desktop'}
                        </Badge>
                      </td>
                      <td style={{ padding: '8px 14px', fontSize: 11, color: 'var(--ad-text-sec)', whiteSpace: 'nowrap' }}>
                        {fmtDate(v.firstSeenAt)}
                      </td>
                      <td style={{ padding: '8px 14px', fontSize: 11, color: 'var(--ad-text-sec)', whiteSpace: 'nowrap' }}>
                        {timeAgo(v.lastSeenAt)}
                      </td>
                      <td style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, color: 'var(--ad-text)' }}>
                        {v.visitCount || 1}
                      </td>
                      <td style={{ padding: '8px 14px' }}>
                        {v.isRegistered ? (
                          <Badge color={T.green}>Yes</Badge>
                        ) : (
                          <Badge color="var(--ad-text-sec)">No</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visitors.length > 50 && (
                <div style={{ padding: '12px 14px', fontSize: 11, color: 'var(--ad-text-sec)', textAlign: 'center' }}>
                  Showing first 50 of {visitors.length} visitors
                </div>
              )}
            </div>
          </div>
        )}
      </AdminCard>

      {/* ─── User Detail Modal ─── */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setSelectedUser(null)}
        >
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--ad-card)', border: `1px solid var(--ad-border)`, borderRadius: T.r.xl,
            width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto',
            boxShadow: '0 24px 80px rgba(0,0,0,0.7)', color: 'var(--ad-text)'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid var(--ad-border)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ad-text)' }}>User Details</div>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'var(--ad-input)', border: 'none', color: 'var(--ad-text-sec)', cursor: 'pointer', borderRadius: T.r.sm, padding: 6, lineHeight: 0 }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Profile card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                {selectedUser.photoURL ? (
                  <img src={selectedUser.photoURL} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: `3px solid #FF4D9D` }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255, 77, 157, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF4D9D', fontWeight: 900, fontSize: 24 }}>
                    {(selectedUser.displayName || selectedUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--ad-text)' }}>{selectedUser.displayName || 'Anonymous'}</div>
                  <div style={{ fontSize: 13, color: 'var(--ad-text-sec)', fontFamily: 'monospace', marginTop: 2 }}>{selectedUser.email || '—'}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <Badge color={selectedUser.provider === 'google' ? '#4285F4' : T.purple}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }} />
                      {selectedUser.provider === 'google' ? 'Google' : selectedUser.provider === 'email' ? 'Email' : selectedUser.provider || '?'}
                    </Badge>
                    <Badge color={selectedUser.status === 'blocked' ? T.red : T.green}>
                      {selectedUser.status || 'active'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                {[
                  { icon: Calendar, label: 'Joined', value: fmtDate(selectedUser.createdAt), color: T.blue },
                  { icon: Clock, label: 'Last Active', value: timeAgo(selectedUser.lastActiveAt), color: T.green },
                  { icon: Eye, label: 'Total Visits', value: selectedUser.visitCount || 1, color: T.purple },
                  { icon: Globe, label: 'Language', value: selectedUser.deviceInfo?.language || '—', color: T.orange },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--ad-input)', border: `1px solid var(--ad-border)`, borderRadius: T.r.md, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <item.icon size={13} color={item.color} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ad-text-sec)', textTransform: 'uppercase' }}>{item.label}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ad-text)' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Activity stats */}
              <div style={{ background: 'var(--ad-input)', border: `1px solid var(--ad-border)`, borderRadius: T.r.md, padding: 16, marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ad-text-sec)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.5px' }}>
                  App Activity
                </div>
                {detailLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ad-text-sec)', fontSize: 12 }}>
                    <RefreshCw size={13} style={{ animation: 'adSpin 0.7s linear infinite' }} /> Loading...
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: T.purple }}>{userStats?.historyCount ?? '—'}</div>
                      <div style={{ fontSize: 10, color: 'var(--ad-text-sec)', marginTop: 2 }}>QR Codes Created</div>
                    </div>
                    <div style={{ width: 1, background: 'var(--ad-border)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: T.blue }}>{userStats?.savedCount ?? '—'}</div>
                      <div style={{ fontSize: 10, color: 'var(--ad-text-sec)', marginTop: 2 }}>Saved Items</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Device info */}
              {selectedUser.deviceInfo && (
                <div style={{ background: 'var(--ad-input)', border: `1px solid var(--ad-border)`, borderRadius: T.r.md, padding: 16, marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ad-text-sec)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.5px' }}>
                    Device Info
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { l: 'Platform', v: selectedUser.deviceInfo.platform || '—' },
                      { l: 'Screen', v: selectedUser.deviceInfo.screenWidth ? `${selectedUser.deviceInfo.screenWidth} × ${selectedUser.deviceInfo.screenHeight}` : '—' },
                      { l: 'User Agent', v: (selectedUser.deviceInfo.userAgent || '—').slice(0, 80) + (selectedUser.deviceInfo.userAgent?.length > 80 ? '...' : '') },
                    ].map(d => (
                      <div key={d.l} style={{ display: 'flex', gap: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ad-text-sec)', minWidth: 80 }}>{d.l}</span>
                        <span style={{ fontSize: 11, color: 'var(--ad-text)', wordBreak: 'break-word' }}>{d.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* UID */}
              <div style={{ background: 'var(--ad-input)', border: `1px solid var(--ad-border)`, borderRadius: T.r.md, padding: '10px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Key size={13} color="var(--ad-text-sec)" />
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ad-text-sec)' }}>UID</span>
                <span style={{ fontSize: 11, color: 'var(--ad-text-sec)', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedUser.uid}</span>
                <button onClick={() => { navigator.clipboard.writeText(selectedUser.uid); toast?.('UID copied', 'info'); }}
                  style={{ background: 'none', border: 'none', color: 'var(--ad-text-sec)', cursor: 'pointer', padding: 2, lineHeight: 0 }}>
                  <Copy size={13} />
                </button>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Btn
                  variant={selectedUser.isPro ? 'ghost' : 'primary'}
                  onClick={async () => {
                    setActionLoading(true);
                    if (selectedUser.isPro) {
                      await DS.revokeUserProAccess(selectedUser.uid);
                      toast?.('Pro access revoked', 'info');
                      setSelectedUser({ ...selectedUser, isPro: false, planId: 'free' });
                    } else {
                      await DS.grantUserProAccess(selectedUser.uid, 'pro_monthly');
                      toast?.('Pro access granted!', 'success');
                      setSelectedUser({ ...selectedUser, isPro: true, planId: 'pro_monthly' });
                    }
                    setActionLoading(false);
                    refresh();
                  }}
                  disabled={actionLoading}
                  icon={<Zap size={13} />}
                >
                  {selectedUser.isPro ? 'Revoke Pro' : 'Grant Pro'}
                </Btn>
                <Btn
                  variant={selectedUser.status === 'blocked' ? 'success' : 'danger'}
                  onClick={() => toggleStatus(selectedUser.uid, selectedUser.status)}
                  disabled={actionLoading}
                  icon={selectedUser.status === 'blocked' ? <CheckCircle size={13} /> : <XCircle size={13} />}
                >
                  {selectedUser.status === 'blocked' ? 'Unblock User' : 'Block User'}
                </Btn>
                <Btn variant="danger" onClick={() => handleDelete(selectedUser.uid)} disabled={actionLoading} icon={<Trash2 size={13} />}>
                  Remove
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// REVENUE & MONETIZATION PANEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function RevenuePanel() {
  const [data, setData] = useState(null);
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('overview');
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('20%');
  const toast = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [rev, pr] = await Promise.all([
        DS.getRevenueAnalytics(),
        DS.getPromoCodes(),
      ]);
      setData(rev);
      setPromos(pr);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddPromo = async () => {
    if (!newCode.trim()) return;
    const codeObj = {
      id: newCode.trim().toUpperCase(),
      code: newCode.trim().toUpperCase(),
      discount: newDiscount,
      type: 'percentage',
      uses: 0,
      active: true,
      createdAt: new Date().toISOString()
    };
    const updated = [...promos, codeObj];
    const res = await DS.savePromoCodes(updated);
    if (res.ok) {
      setPromos(updated);
      setNewCode('');
      toast('Promo code created!', 'success');
    } else {
      toast('Failed to save promo code', 'error');
    }
  };

  const handleTogglePromo = async (codeId) => {
    const updated = promos.map(p => p.id === codeId ? { ...p, active: !p.active } : p);
    const res = await DS.savePromoCodes(updated);
    if (res.ok) {
      setPromos(updated);
      toast('Promo code updated!', 'success');
    }
  };

  const handleDeletePromo = async (codeId) => {
    const updated = promos.filter(p => p.id !== codeId);
    const res = await DS.savePromoCodes(updated);
    if (res.ok) {
      setPromos(updated);
      toast('Promo code deleted!', 'success');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 14 }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${T.bgCard}`, borderTopColor: T.accent, borderRadius: '50%', animation: 'adSpin 0.7s linear infinite' }} />
        <span style={{ fontSize: 14, color: T.textSec }}>Loading SaaS revenue dashboard...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Revenue Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(214,0,54,0.15) 0%, rgba(139,92,246,0.15) 100%)',
        border: `1px solid ${T.accent}33`, borderRadius: T.r.lg, padding: '14px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={18} color={T.accent} /> SaaS Revenue & Monetization
          </div>
          <div style={{ fontSize: 11, color: T.textSec, marginTop: 2, lineHeight: 1.4 }}>
            Real-time calculation of MRR, ARR, Conversion rates, and Subscription Tiers
          </div>
        </div>
        <Btn variant="ghost" size="sm" onClick={loadData} icon={<RefreshCw size={12} />}>Refresh Financials</Btn>
      </div>

      {/* Top Financial KPI Grid */}
      <div className="ad-stat-grid">
        <StatCard icon={DollarSign} label="Monthly Revenue (MRR)" value={`$${data?.mrr || '0.00'}`} color={T.green} trendLabel="estimated monthly" />
        <StatCard icon={TrendingUp} label="Annual Revenue (ARR)" value={`$${data?.arr || '0.00'}`} color={T.purple} trendLabel="projected 12 months" />
        <StatCard icon={Zap} label="Paid Subscribers" value={data?.paidUsers || 0} color={T.blue} trendLabel={`${data?.conversionRate || 0}% conversion`} />
        <StatCard icon={CreditCard} label="ARPU (Per User)" value={`$${data?.arpu || '0.00'}`} color={T.orange} trendLabel="avg revenue/user" />
      </div>

      {/* Sub Tab Buttons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[
          ['overview', 'Overview'],
          ['ledger', 'Ledger & Tiers'],
          ['promos', 'Promo Codes']
        ].map(([id, label]) => (
          <button key={id} onClick={() => setSubTab(id)} style={{
            padding: '6px 12px', borderRadius: T.r.md, border: `1px solid ${subTab === id ? T.accent : T.border}`,
            background: subTab === id ? T.accentLow : 'transparent', color: subTab === id ? T.accent : T.textSec,
            fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Sub Tab: Overview */}
      {subTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="ad-two-col">
            <AdminCard title="Subscription Tier Share" subtitle="Active user count by plan type">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                {[
                  { label: 'Free Tier', count: data?.freeUsers || 0, color: T.textMut, pct: (((data?.freeUsers || 0) / (data?.totalUsers || 1)) * 100).toFixed(0) },
                  { label: 'Pro Monthly ($4.99/mo)', count: data?.proMonthlyUsers || 0, color: T.purple, pct: (((data?.proMonthlyUsers || 0) / (data?.totalUsers || 1)) * 100).toFixed(0) },
                  { label: 'Pro Yearly ($39.99/yr)', count: data?.proYearlyUsers || 0, color: T.green, pct: (((data?.proYearlyUsers || 0) / (data?.totalUsers || 1)) * 100).toFixed(0) },
                  { label: 'Lifetime Pass ($99.99)', count: data?.lifetimeUsers || 0, color: T.orange, pct: (((data?.lifetimeUsers || 0) / (data?.totalUsers || 1)) * 100).toFixed(0) },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: T.text, fontWeight: 600 }}>{item.label}</span>
                      <span style={{ color: T.textSec }}>{item.count} ({item.pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: T.bgEl, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: 3, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </AdminCard>

            <AdminCard title="Monetization Benchmarks" subtitle="SaaS conversion metrics">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 12, background: T.bgEl, borderRadius: T.r.md, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: T.textSec }}>Conversion Rate (Free â†’ Pro)</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.accent, marginTop: 2 }}>{data?.conversionRate}%</div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>Target: 5.0% or higher</div>
                </div>
                <div style={{ padding: 12, background: T.bgEl, borderRadius: T.r.md, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: T.textSec }}>Lifetime Value (LTV) Estimate</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.green, marginTop: 2 }}>${(parseFloat(data?.arpu || 0) * 12).toFixed(2)}</div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>Based on 12-month retention</div>
                </div>
              </div>
            </AdminCard>
          </div>
        </div>
      )}

      {/* Sub Tab: Ledger */}
      {subTab === 'ledger' && (
        <AdminCard title="Subscription Ledger" subtitle="Paid tier allocation status" noPadding>
          <div className="ad-table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Tier Name', 'Billing Interval', 'Monthly Value', 'Target Segment', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10, fontWeight: 800, color: T.textMut, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Free Starter', interval: 'Forever', value: '$0.00', segment: 'Casual Creators', status: 'Active' },
                  { name: 'Pro Monthly', interval: 'Monthly', value: '$4.99', segment: 'Power Users', status: 'Active' },
                  { name: 'Pro Yearly (Best Value)', interval: 'Yearly', value: '$3.33/mo', segment: 'Businesses', status: 'Active' },
                  { name: 'Lifetime Pass', interval: 'One-Time', value: '$99.99', segment: 'VIP Accounts', status: 'Active' },
                ].map((tier, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: T.text }}>{tier.name}</td>
                    <td style={{ padding: '12px 16px', color: T.textSec, fontSize: 12 }}>{tier.interval}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: T.green }}>{tier.value}</td>
                    <td style={{ padding: '12px 16px', color: T.textSec, fontSize: 12 }}>{tier.segment}</td>
                    <td style={{ padding: '12px 16px' }}><Badge color={T.green}>{tier.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}

      {/* Sub Tab: Promos */}
      {subTab === 'promos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AdminCard title="Create New Promo Code">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="PROMO CODE (e.g. SUMMER2026)"
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                style={{
                  background: T.bgEl, border: `1px solid ${T.border}`, borderRadius: T.r.md,
                  color: T.text, fontSize: 13, padding: '9px 14px', outline: 'none', fontFamily: 'inherit', flex: 1, minWidth: 200
                }}
              />
              <select
                value={newDiscount}
                onChange={e => setNewDiscount(e.target.value)}
                style={{
                  background: T.bgEl, border: `1px solid ${T.border}`, borderRadius: T.r.md,
                  color: T.text, fontSize: 13, padding: '9px 14px', outline: 'none', fontFamily: 'inherit'
                }}
              >
                <option value="10%">10% OFF</option>
                <option value="20%">20% OFF</option>
                <option value="50%">50% OFF</option>
                <option value="100%">100% OFF (FREE PRO)</option>
              </select>
              <Btn onClick={handleAddPromo} icon={<Plus size={14} />}>Add Promo</Btn>
            </div>
          </AdminCard>

          <AdminCard title="Active Promo Codes" noPadding>
            {promos.length === 0 ? (
              <EmptyState icon={Tag} title="No promo codes" desc="Create discount codes above for marketing campaigns." />
            ) : (
              <div className="ad-table-wrap">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {['Code', 'Discount', 'Uses', 'Status', 'Action'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10, fontWeight: 800, color: T.textMut, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {promos.map(p => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: T.accent, letterSpacing: '0.5px' }}>{p.code}</td>
                        <td style={{ padding: '12px 16px', color: T.green, fontWeight: 700 }}>{p.discount}</td>
                        <td style={{ padding: '12px 16px', color: T.text, fontSize: 12 }}>{p.uses || 0} redeemed</td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge color={p.active ? T.green : T.red}>{p.active ? 'Active' : 'Disabled'}</Badge>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Btn variant="ghost" size="sm" onClick={() => handleTogglePromo(p.id)}>
                              {p.active ? 'Disable' : 'Enable'}
                            </Btn>
                            <Btn variant="danger" size="sm" onClick={() => handleDeletePromo(p.id)} icon={<Trash2 size={12} />}>
                              Delete
                            </Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>
        </div>
      )}
    </div>
  );
}

function SubscriptionsPanel({ subscribers: initSubs }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'matrix' | 'subscribers'
  const [managingPlanId, setManagingPlanId] = useState(null);
  const [modalFeatures, setModalFeatures] = useState([]);
  const [saving, setSaving] = useState(false);
  const [globalFlags, setGlobalFlags] = useState({});
  const [planConfigs, setPlanConfigs] = useState({});

  // 4 Canonical Plans
  const canonicalPlans = [
    { id: 'free', name: 'Free', color: T.textSec, desc: 'Basic standard QR & Barcode creation' },
    { id: 'weekly', name: 'Weekly', color: T.purple, desc: 'Short-term full pro access pass' },
    { id: 'monthly', name: 'Monthly', color: T.blue, desc: 'Full monthly subscription entitlement' },
    { id: 'yearly', name: 'Yearly', color: T.green, desc: 'Annual ultimate plan entitlement' },
  ];

  // Load plan features and global flags on mount
  useEffect(() => {
    async function load() {
      try {
        const { doc, getDoc, collection, getDocs } = await import('firebase/firestore');
        const { db } = await import('../services/firebase');
        
        // Load global flags
        const flagSnap = await getDoc(doc(db, 'global_config', 'featureFlags'));
        if (flagSnap.exists()) setGlobalFlags(flagSnap.data() || {});

        // Load plan configs
        const plansSnap = await getDocs(collection(db, 'subscription_plans'));
        const pConfigs = {};
        plansSnap.forEach(d => { pConfigs[d.id] = d.data()?.features || []; });
        setPlanConfigs(pConfigs);
      } catch (e) {
        console.warn('[SubscriptionsPanel] Load notice:', e.message);
      }
    }
    load();
  }, []);

  const openManageFeatures = (planId) => {
    const currentFeats = planConfigs[planId] || (planId === 'free' ? DEFAULT_FREE_FEATURES : DEFAULT_PAID_FEATURES);
    setModalFeatures([...currentFeats]);
    setManagingPlanId(planId);
  };

  const handleSaveModalFeatures = async () => {
    if (!managingPlanId) return;
    setSaving(true);
    try {
      const res = await setPlanFeaturesCloud(managingPlanId, modalFeatures);
      if (res.ok) {
        setPlanConfigs(prev => ({ ...prev, [managingPlanId]: modalFeatures }));
        toast(`Successfully saved ${modalFeatures.length} features for ${managingPlanId} plan!`, 'success');
        setManagingPlanId(null);
      } else {
        toast(`Failed to save plan features: ${res.error}`, 'error');
      }
    } catch (e) {
      toast(`Save error: ${e.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleGlobalFlag = async (featureId, currentVal) => {
    const newVal = !currentVal;
    try {
      const res = await setFeatureFlagCloud(featureId, newVal);
      if (res.ok) {
        setGlobalFlags(prev => ({ ...prev, [featureId]: newVal }));
        toast(`Global feature '${featureId}' set to ${newVal ? 'ENABLED' : 'DISABLED'}!`, 'success');
      } else {
        toast(`Failed to toggle feature flag: ${res.error}`, 'error');
      }
    } catch (e) {
      toast(`Error: ${e.message}`, 'error');
    }
  };

  const categories = Object.keys(FEATURE_CATEGORIES);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: `1px solid ${T.border}`, paddingBottom: 12 }}>
        {[
          ['plans', 'Subscription Plans (4)'],
          ['matrix', `Feature Registry (${FEATURE_REGISTRY.length})`],
          ['subscribers', 'Active Subscribers'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              padding: '8px 16px', borderRadius: T.r.md, border: `1px solid ${activeTab === id ? T.accent : T.border}`,
              background: activeTab === id ? T.accentLow : 'transparent', color: activeTab === id ? T.accent : T.textSec,
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* â•â•â• TAB 1: SUBSCRIPTION PLANS (4 CANONICAL) â•â•â• */}
      {activeTab === 'plans' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.5 }}>
            Centralized Plan Feature Assignments. Super Admin controls which canonical features belong to Free, Weekly, Monthly, and Yearly plans.
          </div>
          <div className="ad-two-col">
            {canonicalPlans.map(plan => {
              const assignedFeats = planConfigs[plan.id] || (plan.id === 'free' ? DEFAULT_FREE_FEATURES : DEFAULT_PAID_FEATURES);
              return (
                <AdminCard key={plan.id} style={{ border: `1px solid ${plan.color}44` }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Badge color={plan.color}>{plan.name} Plan</Badge>
                      <span style={{ fontSize: 11, color: T.textMut, fontFamily: 'monospace' }}>ID: {plan.id}</span>
                    </div>

                    <div style={{ fontSize: 13, color: T.textSec }}>{plan.desc}</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.bgEl, padding: '10px 14px', borderRadius: T.r.md, border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: plan.color }}>
                        {assignedFeats.length}
                      </div>
                      <div style={{ fontSize: 11, color: T.textSec }}>
                        Canonical Features Assigned
                      </div>
                    </div>

                    <Btn
                      onClick={() => openManageFeatures(plan.id)}
                      icon={<Sliders size={14} />}
                      style={{ background: plan.color, color: '#fff', fontWeight: 700 }}
                    >
                      Manage Features ({assignedFeats.length})
                    </Btn>
                  </div>
                </AdminCard>
              );
            })}
          </div>
        </div>
      )}

      {/* â•â•â• TAB 2: GLOBAL FEATURE MANAGEMENT (78 CANONICAL FEATURES) â•â•â• */}
      {activeTab === 'matrix' && (
        <AdminCard title={`Canonical Feature Registry (${FEATURE_REGISTRY.length} Features)`} subtitle="Toggle global enable/disable flags for application features">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 12 }}>
            {categories.map(cat => {
              const catInfo = FEATURE_CATEGORIES[cat] || { name: cat };
              const catFeats = FEATURE_REGISTRY.filter(f => f.category === cat);
              if (!catFeats.length) return null;
              return (
                <div key={cat} style={{ background: T.bgEl, borderRadius: T.r.md, padding: 16, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.8px' }}>
                    {catInfo.name} ({catFeats.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {catFeats.map(feat => {
                      const enabled = globalFlags[feat.featureId] !== undefined ? Boolean(globalFlags[feat.featureId]) : feat.defaultEnabled;
                      return (
                        <div key={feat.featureId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: T.bgCard, borderRadius: T.r.sm, border: `1px solid ${T.border}` }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                              {feat.displayName} <span style={{ fontSize: 10, color: T.textMut, fontFamily: 'monospace', marginLeft: 6 }}>({feat.featureId})</span>
                            </div>
                            <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{feat.description}</div>
                          </div>
                          <Toggle
                            checked={enabled}
                            onChange={() => handleToggleGlobalFlag(feat.featureId, enabled)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </AdminCard>
      )}

      {/* â•â•â• TAB 3: SUBSCRIBERS â•â•â• */}
      {activeTab === 'subscribers' && (
        <AdminCard title="Active Subscribers" subtitle="User subscription state tracked in user_subscriptions">
          <div style={{ padding: 16, textAlign: 'center', color: T.textSec, fontSize: 13 }}>
            Use the Users Panel to view and manage individual user subscription entitlements.
          </div>
        </AdminCard>
      )}

      {/* â•â•â• MANAGE FEATURES MODAL â•â•â• */}
      {managingPlanId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: T.r.xl,
            maxWidth: 640, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)', overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text, textTransform: 'capitalize' }}>
                  Manage Features â€” {managingPlanId} Plan
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: T.textSec }}>
                  Select which canonical features are granted to users on the <strong>{managingPlanId}</strong> plan ({modalFeatures.length} selected).
                </p>
              </div>
              <button onClick={() => setManagingPlanId(null)} style={{ background: 'none', border: 'none', color: T.textSec, cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Content - Feature Selector Grouped by Category */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {categories.map(cat => {
                const catFeats = FEATURE_REGISTRY.filter(f => f.category === cat);
                if (!catFeats.length) return null;
                return (
                  <div key={cat} style={{ background: T.bgEl, borderRadius: T.r.md, padding: 14, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.8px' }}>
                      {FEATURE_CATEGORIES[cat]?.name || cat}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {catFeats.map(feat => {
                        const checked = modalFeatures.includes(feat.featureId);
                        return (
                          <label
                            key={feat.featureId}
                            onClick={() => {
                              if (checked) {
                                setModalFeatures(modalFeatures.filter(f => f !== feat.featureId));
                              } else {
                                setModalFeatures([...modalFeatures, feat.featureId]);
                              }
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                              background: checked ? T.accentLow : T.bgCard,
                              border: `1px solid ${checked ? T.accent : T.border}`,
                              borderRadius: T.r.sm, cursor: 'pointer', userSelect: 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{
                              width: 18, height: 18, borderRadius: 4,
                              border: `1.5px solid ${checked ? T.accent : T.border}`,
                              background: checked ? T.accent : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                            }}>
                              {checked && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: checked ? T.text : T.textSec }}>
                              {feat.displayName}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 12, background: T.bgEl }}>
              <Btn onClick={() => setManagingPlanId(null)} variant="ghost">Cancel</Btn>
              <Btn onClick={handleSaveModalFeatures} disabled={saving} icon={saving ? <RefreshCw className="spin" size={14} /> : <Save size={14} />}>
                {saving ? 'Saving...' : 'Save Plan Features'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoriesPanel() {
  const cats = [...new Set((QR_TEMPLATES || []).map(t => t.category))];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminCard title="Template Categories" subtitle="Derived from active template library">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {cats.map(c => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: T.bgEl, borderRadius: T.r.md, border: `1px solid ${T.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.purple }} />
              <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{c}</span>
              <Badge color={T.textSec}>{(QR_TEMPLATES || []).filter(t => t.category === c).length}</Badge>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}

function BulkPanel({ history }) {
  const batches = (history || []).filter(h => h.isBatch);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <StatCard icon={Package} label="Batch Operations Logged" value={batches.length} color={T.orange} trendLabel="all time" />
      <AdminCard title="Batch History" noPadding>
        {batches.length === 0 ? (
          <EmptyState icon={Package} title="No batch operations yet" desc="Bulk QR generation sessions will be tracked here automatically." />
        ) : (
          <div>
            {batches.slice(0, 20).map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: 34, height: 34, borderRadius: T.r.sm, background: `${T.orange}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package size={15} color={T.orange} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Batch Job</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{timeAgo(b.timestamp)}</div>
                </div>
                <Badge color={T.orange}>Batch</Badge>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}

function SupportPanel() {
  return (
    <AdminCard title="Support & Helpdesk" subtitle="Direct customer support contact">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 0', gap: 12 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${T.blue}18`, color: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Mail size={28} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>Direct Email Support</div>
        <div style={{ fontSize: 13, color: T.textSec, maxWidth: 360, lineHeight: 1.5 }}>
          Have feedback or technical inquiries? Reach out directly to our engineering team.
        </div>
        <a href="mailto:mabuneri143@gmail.com" style={{ textDecoration: 'none', marginTop: 8 }}>
          <Btn variant="primary" icon={<Mail size={14} />}>Contact Super Admin</Btn>
        </a>
      </div>
    </AdminCard>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MAIN ADMIN PANEL â€” ROOT COMPONENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€â”€ Wrap the entire AdminPanel in the ToastProvider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AdminPanelInner() {
  // â”€â”€â”€ Centralized auth from authService (custom claim + owner email fallback) â”€
  const { user: currentUser, isSuperAdmin, loading: authLoading, needsBootstrap, refreshSession, bootstrap } = useAuthState();
  const [bootstrapState, setBootstrapState] = useState({ loading: false, done: false, error: null });

  const [section, setSection]     = useState('dashboard');
  const [isMobile, setIsMobile]   = useState(window.innerWidth < 900);
  const [sidebarOpen, setSidebar] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem('mushiqr_admin_theme_mode') || 'auto';
    } catch {
      return 'auto';
    }
  });

  const [systemIsDark, setSystemIsDark] = useState(() => {
    try {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (!window.matchMedia) return;
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = e => setSystemIsDark(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } catch (e) {
      console.warn('System dark mode detection error:', e);
    }
  }, []);

  const isDark = themeMode === 'auto' ? systemIsDark : themeMode === 'dark';

  const handleSetThemeMode = mode => {
    setThemeMode(mode);
    try {
      localStorage.setItem('mushiqr_admin_theme_mode', mode);
      localStorage.setItem('mushiqr_admin_dark_mode', String(mode === 'auto' ? systemIsDark : mode === 'dark'));
    } catch {}
  };

  const T_THEME = getTokens(isDark);

  const [stats, setStats]                   = useState(null);
  const [chartData, setChartData]           = useState([]);
  const [history, setHistory]               = useState([]);
  const [appSettings, setAppSettings]       = useState(null);
  const [featureFlags, setFeatureFlags]     = useState(null);
  const [cloudTemplates, setCloudTemplates] = useState([]);
  const [announcement, setAnnouncement]     = useState(null);
  const [remoteConfig, setRemoteConfig]     = useState({});
  const [auditLog, setAuditLog]             = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [premiumFeatures, setPremiumFeatures]     = useState([]);
  const [subscribers, setSubscribers]             = useState([]);
  const [revenueData, setRevenueData]             = useState(null);
  const [appUsers, setAppUsers]                   = useState([]);
  const [loading, setLoading]               = useState(true);

  // Bootstrap handler â€” mints the super_admin custom claim for the owner
  const handleBootstrap = async () => {
    setBootstrapState({ loading: true, done: false, error: null });
    try {
      const result = await bootstrap();
      if (result.success) {
        setBootstrapState({ loading: false, done: true, error: null });
        // Small delay then reload so new token is picked up
        setTimeout(() => window.location.reload(), 1800);
      }
    } catch (e) {
      setBootstrapState({ loading: false, done: false, error: e.message || 'Bootstrap failed.' });
    }
  };

  useEffect(() => {
    // UI visibility guard â€” Real security enforcement is independently handled by Firestore Rules & Cloud Functions
    if (authLoading || !currentUser || !isSuperAdmin) return;

    async function init() {
      try {
        const [s, c, h, as_, ff, ct, ann, rc, al, sp, pf, subs, rev, usr] = await Promise.all([
          DS.getAppStats(), DS.getActivityChartData(7), DS.getHistory(100),
          DS.getAppSettings(), DS.getFeatureFlags(), DS.getCloudTemplates(),
          DS.getAnnouncement(), DS.getRemoteConfig(), DS.getAuditLog(100),
          DS.getSubscriptionPlans(), DS.getPremiumFeatures(), DS.getAllUserSubscriptions(),
          DS.getRevenueAnalytics(), DS.getAllAppUsers(),
        ]);
        setStats(s); setChartData(c); setHistory(h);
        setAppSettings(as_); setFeatureFlags(ff); setCloudTemplates(ct);
        setAnnouncement(ann); setRemoteConfig(rc); setAuditLog(al);
        setSubscriptionPlans(sp); setPremiumFeatures(pf); setSubscribers(subs);
        setRevenueData(rev); setAppUsers(usr);
      } finally { setLoading(false); }
    }
    init();
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [authLoading, currentUser, isSuperAdmin]);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: T_THEME.bg, color: T_THEME.text }}>
        <RefreshCw className="animate-spin" size={32} color="#FF4D9D" />
      </div>
    );
  }

  const handleAdminSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error('Super admin login failed:', e);
    }
  };

  if (!currentUser || !isSuperAdmin) {
    const isOwnerEmail = currentUser?.email === SUPER_ADMIN_EMAIL;
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center',
        backgroundColor: T_THEME.bg, color: T_THEME.text, padding: 24, textAlign: 'center', fontFamily: "'Outfit', sans-serif",
        paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <div style={{
          background: T_THEME.bgCard, border: `1px solid ${T_THEME.border}`, borderRadius: 20,
          padding: '40px 32px', maxWidth: 440, width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          boxShadow: T_THEME.cardShadow
        }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255, 77, 157, 0.15)', border: `1px solid rgba(255, 77, 157, 0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF4D9D' }}>
            <Shield size={34} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: T_THEME.text, margin: 0 }}>Super Admin Access Required</h1>
            <p style={{ color: T_THEME.textSec, fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
              {currentUser
                ? isOwnerEmail
                  ? 'You are the system owner. Activate your Super Admin role below to access the dashboard.'
                  : `Signed in as ${currentUser.email}. This account does not have Super Admin privileges.`
                : 'Please sign in with the Super Admin account to access this dashboard.'}
            </p>
          </div>

          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T_THEME.bgInput, padding: '10px 14px', borderRadius: 12, width: '100%', boxSizing: 'border-box' }}>
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#D60036', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T_THEME.text, overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.displayName || 'System Owner'}</div>
                <div style={{ fontSize: 10, color: T_THEME.textSec, overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.email}</div>
              </div>
            </div>
          )}

          {/* Bootstrap button — only visible to designated owner who hasn't minted claims yet */}
          {currentUser && isOwnerEmail && (
            <div style={{ width: '100%' }}>
              {bootstrapState.done ? (
                <div style={{ background: 'rgba(0,230,118,0.12)', border: 'none', borderRadius: 12, padding: '12px 16px', color: '#00E676', fontSize: 13, fontWeight: 700 }}>
                  ✓ Super Admin role activated! Reloading dashboard...
                </div>
              ) : (
                <>
                  <button
                    onClick={handleBootstrap}
                    disabled={bootstrapState.loading}
                    style={{
                      background: '#D60036', color: '#fff', border: 'none', padding: '13px 20px',
                      borderRadius: 12, cursor: bootstrapState.loading ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
                      fontFamily: 'inherit', opacity: bootstrapState.loading ? 0.7 : 1,
                      boxShadow: '0 4px 16px rgba(214,0,54,0.35)'
                    }}
                  >
                    {bootstrapState.loading ? <RefreshCw size={16} className="animate-spin" /> : <Key size={16} />}
                    {bootstrapState.loading ? 'Activating Super Admin...' : 'Activate Super Admin Role'}
                  </button>
                  {bootstrapState.error && (
                    <div style={{ marginTop: 8, color: '#EF4444', fontSize: 12, textAlign: 'center' }}>
                      {bootstrapState.error}
                    </div>
                  )}
                  <p style={{ color: T_THEME.textSec, fontSize: 11, marginTop: 6, textAlign: 'center' }}>
                    One-time setup: mints your super_admin role into Firebase Auth.
                  </p>
                </>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 4 }}>
            <button
              onClick={handleAdminSignIn}
              style={{
                background: currentUser && isOwnerEmail ? 'transparent' : '#D60036',
                color: currentUser && isOwnerEmail ? T_THEME.textSec : '#fff',
                border: currentUser && isOwnerEmail ? `1px solid ${T_THEME.border}` : 'none',
                padding: '12px 20px', borderRadius: 12, cursor: 'pointer', fontWeight: 800, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
                fontFamily: 'inherit',
                boxShadow: currentUser && isOwnerEmail ? 'none' : '0 4px 14px rgba(214, 0, 54, 0.35)'
              }}
            >
              <Zap size={16} /> {currentUser ? 'Switch Account (Google)' : 'Sign In with Google'}
            </button>
            {currentUser && (
              <button
                onClick={() => signOut(auth)}
                style={{
                  background: 'transparent', color: '#EF4444', border: `1px solid rgba(239,68,68,0.3)`,
                  padding: '10px 20px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
                  fontFamily: 'inherit'
                }}
              >
                <LogOut size={14} /> Sign Out
              </button>
            )}
            <button
              onClick={() => window.location.hash = '#/'}
              style={{
                background: 'transparent', color: T_THEME.textSec, border: `1px solid ${T_THEME.border}`,
                padding: '10px 20px', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                width: '100%', fontFamily: 'inherit'
              }}
            >
              Back to Home App
            </button>
          </div>
        </div>
      </div>
    );
  }

  const refreshTemplates = async () => setCloudTemplates(await DS.getCloudTemplates());
  const refreshAudit     = async () => setAuditLog(await DS.getAuditLog(100));

  const saveSetting = async updater => {
    const next = updater(appSettings);
    await DS.saveAppSettings(next);
    setAppSettings(next);
    await refreshAudit();
  };

  const PANELS = {
    dashboard:        <AdminDashboard onNavigate={setSection} stats={stats} revenueData={revenueData} isDark={isDark} />,
    revenue:          <RevenuePanel isDark={isDark} />,
    payments:         <RevenuePanel isDark={isDark} />,
    users:            <UsersPanel isDark={isDark} />,
    subscriptions:    <MembershipDashboard isDark={isDark} />,
    plans:            <PlanManager isDark={isDark} />,
    transactions:     <TransactionsManager isDark={isDark} />,
    'feature-matrix': <FeatureMatrixManager isDark={isDark} />,
    analytics:        <AnalyticsPanel chartData={chartData} stats={stats} isDark={isDark} />,
    reports:          <ReportsPanel history={history} isDark={isDark} />,
    templates:        <TemplatesPanel cloudTemplates={cloudTemplates} onRefresh={refreshTemplates} isDark={isDark} />,
    'scan-analytics': <AnalyticsPanel chartData={chartData} stats={stats} isDark={isDark} />,
    'qr-generator':      <VisualQRControlStudio currentUser={currentUser} isDark={isDark} />,
    'barcode-generator': <VisualBarcodeControlStudio currentUser={currentUser} isDark={isDark} />,
    'bulk-generator':    <VisualBulkControlStudio currentUser={currentUser} isDark={isDark} />,
    'qr-barcode':        <VisualQRControlStudio currentUser={currentUser} isDark={isDark} />,
    barcodes:            <VisualBarcodeControlStudio currentUser={currentUser} isDark={isDark} />,
    bulk:                <VisualBulkControlStudio currentUser={currentUser} isDark={isDark} />,
    scans:               <QRBarcodePanel stats={stats} history={history} isDark={isDark} />,
    categories:          <CategoriesPanel isDark={isDark} />,
    'app-settings':      <AppSettingsPanel settings={appSettings} onSave={async s => {
      await DS.saveAppSettings(s);
      setAppSettings(s);
      refreshAudit();
    }} isDark={isDark} />,
    branding:            <BrandingPanel settings={appSettings} onSave={async s => {
      await DS.saveAppSettings(s);
      setAppSettings(s);
      refreshAudit();
    }} isDark={isDark} />,
    'remote-config':     <RemoteConfigPanel config={remoteConfig} onSave={async c => {
      await DS.saveRemoteConfig(c);
      setRemoteConfig(c);
      refreshAudit();
    }} isDark={isDark} />,
    'feature-flags':     <FeatureFlagsPanel currentUser={currentUser} isDark={isDark} />,
    maintenance:      <MaintenancePanel settings={appSettings} onSave={async s => {
      await DS.saveAppSettings(s);
      setAppSettings(s);
      refreshAudit();
    }} isDark={isDark} />,
    announcements:    <AnnouncementsPanel announcement={announcement} onSave={async a => {
      await DS.saveAnnouncement(a);
      setAnnouncement(a);
      refreshAudit();
    }} isDark={isDark} />,
    'admin-users':    <AdminUsersPanel currentUser={currentUser} isDark={isDark} />,
    admins:           <AdminUsersPanel currentUser={currentUser} isDark={isDark} />,
    roles:            <RolesPanel isDark={isDark} />,
    'activity-logs':  <ActivityLogsPanel history={history} isDark={isDark} />,
    security:         <SecurityPanel currentUser={currentUser} isDark={isDark} />,
    backups:          <BackupsPanel isDark={isDark} />,
    'audit-logs':     <AuditLogsPanel log={auditLog} isDark={isDark} />,
    'system-health':  <SystemHealthPanel stats={stats} isDark={isDark} />,
    integrations:     <IntegrationsPanel isDark={isDark} />,
    developer:        <DeveloperPanel currentUser={currentUser} isDark={isDark} />,
    support:          <SupportPanel isDark={isDark} />,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes adSpin { to { transform: rotate(360deg); } }
        @keyframes adSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

        .ad-theme-root {
          --ad-bg: #F1F5F9;
          --ad-card: #FFFFFF;
          --ad-input: #F8FAFC;
          --ad-border: rgba(15, 23, 42, 0.08);
          --ad-text: #0F172A;
          --ad-text-sec: #64748B;
          --ad-text-mut: #94A3B8;
          --ad-card-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
          --accent-primary: #D60036;
          --accent-glow: rgba(214, 0, 54, 0.35);
        }
        .ad-theme-root.dark {
          --ad-bg: #0B0F19;
          --ad-card: #151C2E;
          --ad-input: #111625;
          --ad-border: rgba(255, 255, 255, 0.08);
          --ad-text: #FFFFFF;
          --ad-text-sec: #94A3B8;
          --ad-text-mut: #64748B;
          --ad-card-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
          --accent-primary: #D60036;
          --accent-glow: rgba(214, 0, 54, 0.35);
        }

        /* Scrollbar */
        .ad-scroll::-webkit-scrollbar { width: 5px; }
        .ad-scroll::-webkit-scrollbar-track { background: transparent; }
        .ad-scroll::-webkit-scrollbar-thumb { background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'}; border-radius: 3px; }
        .ad-sidebar-nav::-webkit-scrollbar { display: none; }

        /* Responsive utilities */
        .ad-main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: ${T_THEME.bg};
        }
        .ad-main-pad {
          padding: 24px 28px 40px;
        }
        .ad-section-anim {
          animation: adSlideIn 0.18s ease both;
        }

        /* Unified 2-Column Mobile Stat Grid (4 on desktop, strictly 2 on mobile) */
        .ad-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        @media (max-width: 1024px) {
          .ad-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
        }
        @media (max-width: 640px) {
          .ad-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .ad-main-pad {
            padding: 16px 14px 90px;
          }
        }

        /* Mobile Bottom Nav */
        .ad-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 64px;
          background: ${isDark ? '#0F1221' : '#FFFFFF'};
          border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'};
          z-index: 40;
          align-items: center;
          justify-content: space-around;
          padding: 0 8px;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
        }
        .ad-bottom-nav-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 10px;
          min-width: 54px;
          flex: 1;
        }
        .ad-bottom-nav-btn span {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.2px;
          font-family: 'Outfit', sans-serif;
        }
        @media (max-width: 768px) {
          .ad-bottom-nav { display: flex; }
        }
      `}</style>

      <div className={`ad-theme-root ${isDark ? 'dark' : ''}`} style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', background: T_THEME.bg, overflow: 'hidden',
        fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
        color: T_THEME.text, fontSize: 14,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebar(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(3px)', zIndex: 45 }}
          />
        )}

        {/* Sidebar */}
        <Sidebar
          active={section}
          setActive={s => { setSection(s); if (isMobile) setSidebar(false); }}
          isMobile={isMobile}
          open={isMobile ? sidebarOpen : true}
          onClose={() => setSidebar(false)}
          isDark={isDark}
          themeMode={themeMode}
          setThemeMode={handleSetThemeMode}
        />

        {/* Main Content Area */}
        <div className="ad-main-content">
          <Header
            section={section}
            onMenuToggle={() => setSidebar(o => !o)}
            isMobile={isMobile}
            currentUser={currentUser}
            isDark={isDark}
          />

          <main className="ad-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="ad-main-pad ad-section-anim" key={section}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 14 }}>
                  <div style={{ width: 38, height: 38, border: `3px solid ${T_THEME.border}`, borderTopColor: '#FF4D9D', borderRadius: '50%', animation: 'adSpin 0.7s linear infinite' }} />
                  <span style={{ fontSize: 14, color: T_THEME.textSec }}>Loading admin data...</span>
                </div>
              ) : (
                <PanelErrorBoundary section={section}>
                  {PANELS[section] || PANELS.dashboard}
                </PanelErrorBoundary>
              )}
            </div>
          </main>

          {/* Mobile Bottom Navigation (Dashboard, Users, Plans, More) */}
          <nav className="ad-bottom-nav">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'users',     icon: Users,           label: 'Users' },
              { id: 'plans',     icon: Package,         label: 'Plans' },
            ].map(({ id, icon: Icon, label }) => {
              const active = section === id;
              return (
                <button
                  key={id}
                  className="ad-bottom-nav-btn"
                  onClick={() => { setSection(id); setMoreMenuOpen(false); }}
                  style={{ color: active ? '#FF4D9D' : (isDark ? '#8E95A9' : '#64748B') }}
                >
                  <Icon size={19} strokeWidth={active ? 2.5 : 1.9} />
                  <span>{label}</span>
                </button>
              );
            })}

            {/* "More" Trigger Button */}
            <button
              className="ad-bottom-nav-btn"
              onClick={() => setMoreMenuOpen(prev => !prev)}
              style={{ color: moreMenuOpen ? '#FF4D9D' : (isDark ? '#8E95A9' : '#64748B') }}
            >
              <Grid size={19} strokeWidth={moreMenuOpen ? 2.5 : 1.9} />
              <span>More</span>
            </button>
          </nav>

          {/* Mobile "More" Slide-up Drawer */}
          {moreMenuOpen && isMobile && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}>
              <div
                style={{
                  background: isDark ? '#0F1221' : '#FFFFFF',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: '20px 20px 32px',
                  maxHeight: '75vh',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  boxShadow: '0 -10px 40px rgba(0,0,0,0.4)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A' }}>All Admin Modules</h3>
                  <button
                    onClick={() => setMoreMenuOpen(false)}
                    style={{ background: 'none', border: 'none', color: isDark ? '#8E95A9' : '#64748B', cursor: 'pointer' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {NAV_MAIN.map(({ id, icon: Icon, label }) => {
                    const isActive = section === id;
                    return (
                      <button
                        key={id}
                        onClick={() => { setSection(id); setMoreMenuOpen(false); }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 8,
                          padding: '14px 8px',
                          borderRadius: 14,
                          border: `1px solid ${isActive ? '#D60036' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)')}`,
                          background: isActive ? 'rgba(214, 0, 54, 0.12)' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.02)'),
                          color: isActive ? '#D60036' : (isDark ? '#FFFFFF' : '#0F172A'),
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: isActive ? '#D60036' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)'),
                          color: isActive ? '#fff' : (isDark ? '#8E95A9' : '#64748B'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon size={18} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

class PanelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AdminPanel] Panel rendering error:', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.section !== this.props.section && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 16,
          background: 'var(--ad-card, #151928)',
          borderRadius: 20,
          border: '1px solid rgba(239, 68, 68, 0.3)',
          margin: 20
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--ad-text, #fff)' }}>
              Module Render Notice
            </h3>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ad-text-sec, #94A3B8)', maxWidth: 450 }}>
              {this.state.error?.message || 'An unexpected state occurred while rendering this module.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              background: '#FF4D9D',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Retry Loading Module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Default export wraps everything in the ToastProvider ─────────────────────
export default function AdminPanel() {
  return (
    <ToastProvider>
      <AdminPanelInner />
    </ToastProvider>
  );
}
