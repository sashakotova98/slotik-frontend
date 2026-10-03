import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import SplashPage from "./pages/SplashPage";
import LoginPage from "./pages/LoginPage";
import ClientHomePage from "./pages/ClientHomePage";
import PublicHomePage from "./pages/PublicHomePage";
import MasterProfilePage from "./pages/MasterProfilePage";
import MasterCabinetPage from "./pages/MasterCabinetPage";
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
              <Navigate to="/cabinet/setup" replace />
            ) : role === "Superadmin" ? (
              <Navigate to="/admin" replace />
            ) : (
              <ClientHomePage />
            )
          }
        />
        <Route path="/home" element={<PublicHomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />

        <Route path="/terms" element={<TermsPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/support" element={<SupportPage />} />

        <Route path="/m/:slug" element={<MasterProfilePage />} />

        <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />

        <Route path="/cabinet" element={token && role === "Master" ? <MasterCabinetPage /> : <Navigate to="/login" replace />} />

        <Route path="/admin" element={isAdmin ? <AdminDashboardPage /> : <Navigate to="/login" replace />} />
        <Route path="/admin/masters" element={isAdmin ? <AdminMastersPage /> : <Navigate to="/login" replace />} />
        <Route path="/admin/finance" element={isAdmin ? <AdminFinancePage /> : <Navigate to="/login" replace />} />
        <Route path="/admin/categories" element={isAdmin ? <AdminCategoriesPage /> : <Navigate to="/login" replace />} />

        <Route path="/cabinet/setup" element={token && role === "Master" ? <MasterOnboardingPage /> : <Navigate to="/login" replace />} />
        <Route path="/cabinet/plans" element={token && role === "Master" ? <MasterPlansPage /> : <Navigate to="/login" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
