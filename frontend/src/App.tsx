import { Navigate, Route, Routes } from "react-router-dom";

import { PublicLayout } from "@/layouts/PublicLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from "@/routes/guards";

import { LandingPage } from "@/pages/LandingPage";
import { ExplorePage } from "@/pages/ExplorePage";
import { CityDetailPage } from "@/pages/CityDetailPage";
import { PublicTripPage } from "@/pages/PublicTripPage";
import { CommunityPage } from "@/pages/community/CommunityPage";

import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";

import { DashboardPage } from "@/pages/DashboardPage";
import { TripsPage } from "@/pages/trips/TripsPage";
import { NewTripPage } from "@/pages/trips/NewTripPage";
import { TripDetailPage } from "@/pages/trips/TripDetailPage";
import { TripSettingsPage } from "@/pages/trips/TripSettingsPage";
import { ProfilePage } from "@/pages/ProfilePage";

import { AdminPage } from "@/pages/admin/AdminPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      {/* Public, browsable */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/cities/:id" element={<CityDetailPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/trips/shared/:slug" element={<PublicTripPage />} />
      </Route>

      {/* Auth (redirects away if already signed in) */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Authenticated app */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trips/new" element={<NewTripPage />} />
          <Route path="/trips/:id" element={<TripDetailPage />} />
          <Route path="/trips/:id/settings" element={<TripSettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Admin */}
      <Route element={<AdminRoute />}>
        <Route element={<AppLayout noBottomNav />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
