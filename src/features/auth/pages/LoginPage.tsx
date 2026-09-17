import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Lock, User } from 'lucide-react';
import { BrandLogo, Button, Icon, Input } from '@shared/components';
import { AuthShell } from '../components/AuthShell';
import { loginSchema, type LoginSchema } from '../schemas/login.schema';
import { useAuth } from '../hooks/useAuth';
import {
  getRememberedUsername,
  isRememberAccountEnabled,
  setRememberAccount,
} from '../lib/rememberAccount';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, isLoggingIn } = useAuth();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberAccount, setRememberAccountChecked] = useState(() =>
    isRememberAccountEnabled()
  );
  const accessReason = searchParams.get('reason');
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ||
    '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: getRememberedUsername(),
      password: '',
    },
  });

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = (data: LoginSchema) => {
    login(data, {
      onSuccess: () => {
        setRememberAccount(rememberAccount, data.username);
        navigate(from, { replace: true });
      },
    });
  };

  return (
    <AuthShell>
      <div className="mb-8 flex flex-col items-center text-center">
        <BrandLogo
          size="lg"
          inverted
          showText={false}
          className="flex-col !gap-4"
        />
        <div className="mt-4 text-center">
          <p className="text-lg font-bold text-white">ولاء</p>
          <p className="mt-4 text-sm text-white/75">
            نظام ولاء للمقاهي والمتاجر — سجّل الدخول للمتابعة
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="panel gold-glow space-y-5 border-wheat/30 bg-panel/95 p-6 backdrop-blur-md sm:p-8"
      >
        <div className="mb-1">
          <h1 className="text-lg font-bold text-ink">تسجيل الدخول</h1>
          <p className="mt-1 text-xs text-muted">أدخل بيانات حسابك للمتابعة</p>
        </div>

        {accessReason === 'expired' && (
          <div className="rounded-xl border border-umber/25 bg-umber/8 px-3 py-3 text-sm font-bold text-ink">
            انتهى حجز النظام. سجّل الدخول بعد تجديد المدة من الإدارة.
          </div>
        )}
        {accessReason === 'inactive' && (
          <div className="rounded-xl border border-danger/20 bg-danger-soft px-3 py-3 text-sm font-bold text-ink">
            هذا الحساب معطّل ولا يمكن استخدام النظام.
          </div>
        )}
        {accessReason === 'idle' && (
          <div className="rounded-xl border border-wheat/30 bg-wheat/10 px-3 py-3 text-sm font-bold text-ink">
            تم تسجيل الخروج تلقائياً بسبب عدم استخدام الموقع لفترة طويلة. سجّل الدخول للمتابعة.
          </div>
        )}

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
            <Icon icon={User} size="sm" className="text-muted" />
            اسم المستخدم
          </label>
          <Input
            type="text"
            autoComplete="username"
            placeholder="admin"
            error={errors.username?.message}
            {...register('username')}
          />
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
            <Icon icon={Lock} size="sm" className="text-muted" />
            كلمة المرور
          </label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pl-11"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
              aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              aria-pressed={showPassword}
            >
              <Icon icon={showPassword ? EyeOff : Eye} size="sm" />
            </button>
          </div>
          {errors.password?.message && (
            <p className="mt-1.5 text-sm text-danger">{errors.password.message}</p>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 select-none">
          <input
            type="checkbox"
            checked={rememberAccount}
            onChange={(e) => setRememberAccountChecked(e.target.checked)}
            className="h-4 w-4 rounded border-line accent-wheat"
          />
          <span className="text-sm font-medium text-ink">تذكر الحساب</span>
          <span className="text-xs text-muted">(يحفظ اسم المستخدم ويبقي الجلسة أطول)</span>
        </label>

        <Button type="submit" className="w-full" size="lg" disabled={isLoggingIn}>
          <Icon icon={LogIn} size="sm" />
          {isLoggingIn ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
        </Button>
      </form>
    </AuthShell>
  );
};
