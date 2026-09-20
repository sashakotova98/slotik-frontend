import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import SplashPage from "./pages/SplashPage";
import LoginPage from "./pages/LoginPage";
import ClientHomePage from "./pages/ClientHomePage";
import PublicHomePage from "./pages/PublicHomePage";
import MasterProfilePage from "./pages/MasterProfilePage";
import MasterCabinetPage from "./pages/MasterCabinetPage";
import AdminPage from "./pages/AdminPage";
import CatalogPage from "./pages/CatalogPage";

function App() {
  const { token, role } = useAuth();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          !token ? <SplashPage />
            : role === "Master" ? <Navigate to="/cabinet" replace />
              : role === "Superadmin" ? <Navigate to="/admin" replace />
                : <ClientHomePage />
        } />
        <Route path="/home" element={<PublicHomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />

        <Route path="/m/:slug" element={<MasterProfilePage />} />

        <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />

        <Route path="/cabinet" element={token && role === "Master" ? <MasterCabinetPage /> : <Navigate to="/login" replace />} />
        <Route path="/admin" element={token && role === "Superadmin" ? <AdminPage /> : <Navigate to="/login" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
