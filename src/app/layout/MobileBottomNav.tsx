import { NavLink, useLocation } from 'react-router-dom';
import { Gift, Home, QrCode, ShoppingBag, UserCog, Users } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { Icon } from '@shared/components';
import { isSuperAdmin, useAuth } from '@/features/auth';

interface TabItem {
  key: string;
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
  isScan?: boolean;
}

const CAFE_TABS: TabItem[] = [
  { key: 'home', to: '/', label: 'الرئيسية', icon: Home, end: true },
  { key: 'customers', to: '/customers', label: 'العملاء', icon: Users },
  { key: 'scan', to: '/scan', label: 'مسح', icon: QrCode, isScan: true },
  { key: 'purchases', to: '/purchases', label: 'المشتريات', icon: ShoppingBag },
  { key: 'gifts', to: '/gifts', label: 'الهدايا', icon: Gift },
];

const SUPER_TABS: TabItem[] = [
  { key: 'home', to: '/', label: 'الرئيسية', icon: Home, end: true },
  { key: 'users', to: '/users', label: 'المستخدمون', icon: UserCog },
  { key: 'customers', to: '/customers', label: 'العملاء', icon: Users },
  { key: 'purchases', to: '/purchases', label: 'المشتريات', icon: ShoppingBag },
  { key: 'gifts', to: '/gifts', label: 'الهدايا', icon: Gift },
];

function isTabActive(pathname: string, tab: TabItem): boolean {
  if (tab.key === 'home') return pathname === '/';
  if (tab.key === 'scan') return pathname === '/scan';
  if (tab.key === 'customers') {
    return pathname.startsWith('/customers') && pathname !== '/scan';
  }
  return pathname === tab.to || pathname.startsWith(`${tab.to}/`);
}

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const tabs = isSuperAdmin(user) ? SUPER_TABS : CAFE_TABS;
  const columns = tabs.length;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-panel/95 shadow-[0_-8px_32px_rgba(26,59,112,0.08)] backdrop-blur-md lg:hidden"
      aria-label="التنقل السريع"
    >
      <div
        className="mx-auto grid h-[4.25rem] max-w-lg items-end px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => {
          const active = isTabActive(pathname, tab);

          if (tab.isScan) {
            return (
              <NavLink
                key={tab.key}
                to={tab.to}
                className="relative flex flex-col items-center justify-end"
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
              >
                <span
                  className={cn(
                    'absolute -top-5 flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-panel shadow-lg transition-transform',
                    active
                      ? 'scale-105 bg-wheat text-white ring-2 ring-wheat/40'
                      : 'bg-wheat text-white hover:scale-105'
                  )}
                >
                  <Icon icon={tab.icon} size="md" />
                </span>
                <span
                  className={cn(
                    'mt-7 text-[10px] font-bold',
                    active ? 'text-wheat' : 'text-muted'
                  )}
                >
                  {tab.label}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={tab.key}
              to={tab.to}
              end={tab.end}
              className="flex min-w-0 flex-col items-center justify-end gap-1 px-1 pb-0.5"
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                  active ? 'bg-wheat/15 text-wheat' : 'text-muted'
                )}
              >
                <Icon icon={tab.icon} size="sm" />
              </span>
              <span
                className={cn(
                  'truncate text-[10px] font-bold',
                  active ? 'text-wheat' : 'text-muted'
                )}
              >
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
