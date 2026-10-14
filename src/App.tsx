import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import SplashPage from "./pages/SplashPage";
import LoginPage from "./pages/LoginPage";

import PublicHomePage from "./pages/PublicHomePage";
import MasterProfilePage from "./pages/MasterProfilePage";
import MasterCabinetPage from "./pages/master/MasterCabinetPage";
import MasterCabinetLayout from "./components/master/MasterCabinetLayout";
import MasterSchedulePage from "./pages/master/MasterSchedulePage";
import MasterCalendarPage from "./pages/master/MasterCalendarPage";
import MasterAccountPage from "./pages/master/MasterAccountPage";
import MasterBookingsPage from "./pages/master/MasterBookingsPage";
import MasterTariffPage from "./pages/master/MasterTariffPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminMastersPage from "./pages/admin/AdminMastersPage";
import AdminFinancePage from "./pages/admin/AdminFinancePage";
import CatalogPage from "./pages/CatalogPage";
import TermsPage from "./pages/info/TermsPage";
import FaqPage from "./pages/info/FaqPage";
import SupportPage from "./pages/info/SupportPage";
import MasterOnboardingPage from "./pages/master/MasterOnboardingPage";
import MasterPlansPage from "./pages/master/MasterPlansPage";
import ConfirmEmailPage from "./pages/ConfirmEmailPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PaymentResultPage from "./pages/master/PaymentResultPage";
import MasterEntryRedirect from "./components/master/MasterEntryRedirect";
import MasterCreatedPage from "./pages/master/MasterCreatedPage";
import MasterLocationPage from "./pages/master/MasterLocationPage";
import MasterServicesPage from "./pages/master/MasterServicesPage";
import MasterPortfolioPage from "./pages/master/MasterPortfolioPage";
import ServiceDetailsPage from "./pages/services/ServiceDetailsPage";
import ClientLayout from "./components/client/ClientLayout";
import ClientHomePage from "./pages/client/ClientHomePage";
import ClientSearchPage from "./pages/client/ClientSearchPage";
import ClientBookingsPage from "./pages/client/ClientBookingsPage";
import ClientAccountPage from "./pages/client/ClientAccountPage";
import ClientBookingDatePage from "./pages/client/ClientBookingDatePage";
import ClientBookingConfirmPage from "./pages/client/ClientBookingConfirmPage";
import ClientBookingSuccessPage from "./pages/client/ClientBookingSuccessPage";

//Збереження адреси результату платежу перед входом
function PaymentResultRoute() {
  const { token, role } = useAuth();
  const location = useLocation();

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        }}
      />
    );
  }

  if (role !== "Master") {
    return <Navigate to="/" replace />;
  }

  return <PaymentResultPage />;
}

function App() {
  const { token, role } = useAuth();

  const isAdmin = token && role === "Superadmin";
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            !token ? (
              <SplashPage />
            ) : role === "Master" ? (
              <MasterEntryRedirect key={token} />
            ) : role === "Superadmin" ? (
              <Navigate to="/admin" replace />
            ) : role === "Client" ? (
              <Navigate to="/client" replace />
            ) : (
              <Navigate to="/home" replace />
            )
          }
        />
        <Route path="/home" element={<PublicHomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />

        <Route path="/terms" element={<TermsPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/support" element={<SupportPage />} />

        <Route path="/m/:slug" element={<MasterProfilePage />} />
        <Route path="/m/:slug/services/:serviceId" element={<ServiceDetailsPage />} />

        <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />

        <Route path="/confirm-email" element={<ConfirmEmailPage />} />

        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/cabinet"
          element={
            token && role === "Master" ? (
              <MasterEntryRedirect key={token}>
                <MasterCabinetLayout />
              </MasterEntryRedirect>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<MasterCabinetPage />} />
          <Route path="schedule" element={<MasterSchedulePage />} />
          <Route path="calendar" element={<MasterCalendarPage />} />
          <Route path="account" element={<MasterAccountPage />} />
          <Route path="account/bookings" element={<MasterBookingsPage />} />
          <Route path="account/tariff" element={<MasterTariffPage />} />
          <Route path="account/location" element={<MasterLocationPage />} />
          <Route path="account/portfolio" element={<MasterPortfolioPage />} />
          <Route path="account/services" element={<MasterServicesPage />} />
        </Route>

        <Route path="/client" element={token && role === "Client" ? <ClientLayout /> : <Navigate to="/login" replace />}>
          <Route index element={<ClientHomePage />} />
          <Route path="search" element={<ClientSearchPage />} />
          <Route path="bookings" element={<ClientBookingsPage />} />
          <Route path="account" element={<ClientAccountPage />} />
        </Route>

        <Route
          path="/m/:slug/services/:serviceId/book"
          element={
            token && role === "Client"
              ? <ClientBookingDatePage />
              : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/m/:slug/services/:serviceId/book/confirm"
          element={token && role === "Client" ? <ClientBookingConfirmPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/client/bookings/:bookingId/success"
          element={token && role === "Client" ? <ClientBookingSuccessPage /> : <Navigate to="/login" replace />}
        />
        <Route path="/admin" element={isAdmin ? <AdminDashboardPage /> : <Navigate to="/login" replace />} />
        <Route path="/admin/masters" element={isAdmin ? <AdminMastersPage /> : <Navigate to="/login" replace />} />
        <Route path="/admin/finance" element={isAdmin ? <AdminFinancePage /> : <Navigate to="/login" replace />} />
        <Route path="/admin/categories" element={isAdmin ? <AdminCategoriesPage /> : <Navigate to="/login" replace />} />

        <Route path="/cabinet/setup" element={token && role === "Master" ? <MasterOnboardingPage /> : <Navigate to="/login" replace />} />
        <Route path="/cabinet/plans" element={token && role === "Master" ? <MasterPlansPage /> : <Navigate to="/login" replace />} />
        <Route path="/cabinet/created" element={token && role === "Master" ? <MasterCreatedPage /> : <Navigate to="/login" replace />} />

        <Route path="/payment/result" element={<PaymentResultRoute />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;



