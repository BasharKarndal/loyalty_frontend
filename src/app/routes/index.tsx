import { Routes, Route } from 'react-router-dom';

import { AppLayout } from '../layout/AppLayout';
import { LoginPage, ProtectedRoute, SuperAdminRoute } from '@/features/auth';
import { HomePage } from '@/features/home';
import { BookingsPage, UserDetailsPage, UsersPage } from '@/features/admin';
import {
  CustomersPage,
  CustomerDetailsPage,
  CustomerFormPage,
  ScanCustomerPage,
} from '@/features/customers';
import { PurchasesPage, PurchaseFormPage } from '@/features/purchases';
import { GiftsPage, GiftTypesPage } from '@/features/gifts';
import { ReportsPage } from '@/features/reports';
import { SettingsPage } from '@/features/settings';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />

          <Route element={<SuperAdminRoute />}>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/:id" element={<UserDetailsPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
          </Route>

          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/new" element={<CustomerFormPage />} />
          <Route path="/customers/:id" element={<CustomerDetailsPage />} />
          <Route path="/customers/:id/edit" element={<CustomerFormPage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/purchases/new" element={<PurchaseFormPage />} />
          <Route path="/purchases/:id/edit" element={<PurchaseFormPage />} />
          <Route path="/gifts" element={<GiftsPage />} />
          <Route path="/gifts/types" element={<GiftTypesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings/gift-types" element={<GiftTypesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/scan" element={<ScanCustomerPage />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <div className="page-shell py-16 text-center text-muted">
            404 — الصفحة غير موجودة
          </div>
        }
      />
    </Routes>
  );
};
