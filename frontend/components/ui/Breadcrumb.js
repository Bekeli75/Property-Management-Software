'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, Building2, Users, FileText, CreditCard, Wrench, BarChart3, MessageSquare, Bell, Settings, User, Shield, LayoutDashboard } from 'lucide-react';

const pathLabels = {
  '/dashboard': { label: 'Dashboard', icon: LayoutDashboard },
  '/properties': { label: 'Properties', icon: Building2 },
  '/tenants': { label: 'Tenants', icon: Users },
  '/leases': { label: 'Leases', icon: FileText },
  '/payments': { label: 'Payments', icon: CreditCard },
  '/maintenance': { label: 'Maintenance', icon: Wrench },
  '/reports': { label: 'Reports', icon: BarChart3 },
  '/discussion': { label: 'Discussion', icon: MessageSquare },
  '/notifications': { label: 'Notifications', icon: Bell },
  '/settings': { label: 'Settings', icon: Settings },
  '/profile': { label: 'Profile', icon: User },
  '/admin/users': { label: 'User Access', icon: Shield },
  '/contact': { label: 'Contact', icon: Shield },
  '/privacy': { label: 'Privacy Policy', icon: Shield },
  '/terms': { label: 'Terms of Service', icon: Shield },
};

function getParentPath(path) {
  const parts = path.split('/').filter(Boolean);
  if (parts.length <= 1) return '/dashboard';
  parts.pop();
  return '/' + parts.join('/');
}

function getLabel(path) {
  return pathLabels[path] || { label: path.split('/').pop() || 'Page' };
}

export default function Breadcrumb() {
  const pathname = usePathname();
  
  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    currentPath += '/' + segments[i];
    const { label, icon } = getLabel(currentPath);
    breadcrumbs.push({ path: currentPath, label, icon });
  }

  return (
    <nav className="flex items-center gap-2 px-5 py-3 sm:px-8 text-sm" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 flex-wrap" role="list">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.path} className="flex items-center gap-2">
            {index > 0 && (
              <span className="text-slate-400 dark:text-slate-500">
                <ChevronRight size={14} />
              </span>
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-slate-900 dark:text-white" aria-current="page">
                {crumb.icon && <crumb.icon size={14} className="inline-block mr-1" />}
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.path}
                className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition"
              >
                {crumb.icon && <crumb.icon size={13} />}
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}