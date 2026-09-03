import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useMediaQuery } from '@shared/hooks/useMediaQuery';
import { cn } from '@shared/lib/cn';
import { BrandLogo, Button, Icon, ThemeToggle } from '@shared/components';
import { Home, LogOut, Gift, QrCode, Settings, ShoppingBag, Users, BarChart3, CalendarClock, UserCog } from 'lucide-react';
import { isSuperAdmin, useAuth } from '@/features/auth';
import { useLogoSrc, useSettingsQuery } from '@/features/settings';
import { APP_NAME } from '@/config/env';
import brandLogo from '@/assets/app-icon.png';
import { WorkspaceSwitcher } from '@/features/admin/components/WorkspaceSwitcher';
import { MobileBottomNav } from './MobileBottomNav';

function resolvePageTitle(pathname: string): string {
  if (pathname === '/') return 'لوحة التحكم';
  if (pathname === '/customers') return 'العملاء';
  if (pathname === '/customers/new') return 'إضافة عميل';
  if (/^\/customers\/[^/]+\/edit$/.test(pathname)) return 'تعديل العميل';
  if (/^\/customers\/[^/]+$/.test(pathname)) return 'تفاصيل العميل';
  if (pathname === '/purchases') return 'المشتريات';
  if (pathname === '/purchases/new') return 'إضافة مشترى';
  if (/^\/purchases\/[^/]+\/edit$/.test(pathname)) return 'تعديل المشترى';
  if (pathname === '/gifts') return 'الهدايا';
  if (pathname === '/reports') return 'التقارير';
  if (pathname === '/gifts/types' || pathname === '/settings/gift-types') return 'أنواع الهدايا';
  if (pathname === '/settings') return 'الإعدادات';
  if (pathname === '/users') return 'المستخدمون';
  if (/^\/users\/[^/]+$/.test(pathname)) return 'تفاصيل الحساب';
  if (pathname === '/bookings') return 'الحجوزات';
  if (pathname === '/scan') return 'مسح رمز العميل';
  return 'نظام الولاء';
}

const CAFE_NAV = [
  { to: '/', label: 'الرئيسية', icon: Home, end: true },
  { to: '/customers', label: 'العملاء', icon: Users },
  { to: '/scan', label: 'مسح QR', icon: QrCode },
  { to: '/purchases', label: 'المشتريات', icon: ShoppingBag },
  { to: '/gifts', label: 'الهدايا', icon: Gift },
  { to: '/reports', label: 'التقارير', icon: BarChart3 },
  { to: '/settings', label: 'الإعدادات', icon: Settings },
] as const;

const SUPER_NAV = [
  { to: '/', label: 'الرئيسية', icon: Home, end: true, group: 'التشغيل' },
  { to: '/customers', label: 'العملاء', icon: Users, group: 'التشغيل' },
  { to: '/scan', label: 'مسح QR', icon: QrCode, group: 'التشغيل' },
  { to: '/purchases', label: 'المشتريات', icon: ShoppingBag, group: 'التشغيل' },
  { to: '/gifts', label: 'الهدايا', icon: Gift, group: 'التشغيل' },
  { to: '/reports', label: 'التقارير', icon: BarChart3, group: 'التشغيل' },
  { to: '/settings', label: 'الإعدادات', icon: Settings, group: 'التشغيل' },
  { to: '/users', label: 'المستخدمون', icon: UserCog, group: 'الإدارة' },
  { to: '/bookings', label: 'الحجوزات', icon: CalendarClock, group: 'الإدارة' },
] as const;

export function AppLayout() {
  const isLgUp = useMediaQuery('(min-width: 1024px)');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLoggingOut } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const { data: settings } = useSettingsQuery();
  const logoSrc = useLogoSrc();
  const pageTitle = useMemo(() => resolvePageTitle(location.pathname), [location.pathname]);
  const brandTitle = settings?.cafe_name?.trim() || APP_NAME;
  const isScanPage = location.pathname === '/scan';
  const showMobileBottomNav = !isLgUp && !isScanPage;

  const handleLogout = () => {
    logout(undefined, {
      onSettled: () => navigate('/login', { replace: true }),
    });
  };

  const displayName = user?.full_name || 'المستخدم';
  const displayEmail = user?.email || '';
  const initial = displayName.trim().charAt(0) || 'م';

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-surface font-sans" dir="rtl">
      {isLgUp && (
        <aside className="sidebar-shell z-40 flex w-[280px] shrink-0 flex-col overflow-hidden">
          <div className="border-b border-white/10 px-4 py-5">
            <BrandLogo
              size="md"
              inverted
              subtitle={superAdmin ? 'إدارة النظام' : 'نظام الولاء'}
              title={brandTitle}
              logoSrc={logoSrc}
            />
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            {superAdmin ? (
              (['التشغيل', 'الإدارة'] as const).map((group) => (
                <div key={group} className="mb-4">
                  <p className="mx-6 mb-1 text-[10px] font-extrabold tracking-wide text-white/45">
                    {group}
                  </p>
                  {SUPER_NAV.filter((item) => item.group === group).map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        cn(
                          'mx-3 my-1 flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all',
                          isActive
                            ? 'bg-white font-bold text-wheat shadow-sm ring-2 ring-umber/80'
                            : 'text-white/85 hover:bg-white/10 hover:text-white'
                        )
                      }
                    >
                      <Icon icon={item.icon} size="sm" className="opacity-90" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              ))
            ) : (
              CAFE_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'mx-3 my-1 flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all',
                      isActive
                        ? 'bg-white font-bold text-wheat shadow-sm ring-2 ring-umber/80'
                        : 'text-white/85 hover:bg-white/10 hover:text-white'
                    )
                  }
                >
                  <Icon icon={item.icon} size="sm" className="opacity-90" />
                  <span>{item.label}</span>
                </NavLink>
              ))
            )}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 font-bold text-white">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-white">{displayName}</div>
                <div className="truncate text-[11px] text-white/60">
                  {superAdmin ? 'مشرف عام' : displayEmail}
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-white/30 text-white hover:bg-white/10 hover:text-white"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <Icon icon={LogOut} size="sm" />
              {isLoggingOut ? 'جاري الخروج...' : 'تسجيل الخروج'}
            </Button>
          </div>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {isScanPage ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Outlet />
          </div>
        ) : (
          <>
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-panel px-3 py-3 sm:gap-3 sm:px-4 sm:py-4 lg:px-6">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                {!isLgUp && (
                  <img
                    src={logoSrc ?? brandLogo}
                    alt={brandTitle}
                    className="h-9 w-9 shrink-0 rounded-xl object-cover"
                  />
                )}
                <h1 className="m-0 truncate text-base font-semibold text-header-title sm:text-lg">
                  {pageTitle}
                </h1>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {superAdmin && <WorkspaceSwitcher />}
                {!isLgUp && (
                  <>
                    {superAdmin && (
                      <button
                        type="button"
                        onClick={() => navigate('/bookings')}
                        className="rounded-lg border border-line p-2 text-muted transition-colors hover:border-wheat/40 hover:text-wheat"
                        aria-label="الحجوزات"
                      >
                        <Icon icon={CalendarClock} size="sm" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate('/reports')}
                      className="rounded-lg border border-line p-2 text-muted transition-colors hover:border-wheat/40 hover:text-wheat"
                      aria-label="التقارير"
                    >
                      <Icon icon={BarChart3} size="sm" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/settings')}
                      className="rounded-lg border border-line p-2 text-muted transition-colors hover:border-wheat/40 hover:text-wheat"
                      aria-label="الإعدادات"
                    >
                      <Icon icon={Settings} size="sm" />
                    </button>
                  </>
                )}
                <ThemeToggle />
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-wheat/30 bg-wheat-light text-sm font-bold text-wheat">
                  {initial}
                </div>
                <span className="hidden text-sm text-ink sm:inline">{displayName}</span>
              </div>
            </header>

            <main
              className={cn(
                'flex-1 overflow-y-auto overflow-x-hidden bg-surface p-3 sm:p-4 lg:p-6',
                showMobileBottomNav && 'pb-[calc(4.75rem+env(safe-area-inset-bottom))]'
              )}
            >
              <Outlet />
            </main>

            {showMobileBottomNav && <MobileBottomNav />}
          </>
        )}
      </div>
    </div>
  );
}
