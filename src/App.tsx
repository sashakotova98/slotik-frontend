import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import SplashPage from "./pages/SplashPage";
import LoginPage from "./pages/LoginPage";
import ClientHomePage from "./pages/ClientHomePage";
import CatalogPage from "./pages/CatalogPage";
import MasterProfilePage from "./pages/MasterProfilePage";
import MasterCabinetPage from "./pages/MasterCabinetPage";
import AdminPage from "./pages/AdminPage";

function App() {
  const { token } = useAuth();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={token ? <ClientHomePage /> : <SplashPage />} />
        <Route path="/catalog" element={<CatalogPage />} />

        <Route path="/m/:slug" element={<MasterProfilePage />} />


        <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />


        <Route path="/cabinet" element={token ? <MasterCabinetPage /> : <Navigate to="/login" replace />} />
        <Route path="/admin" element={token ? <AdminPage /> : <Navigate to="/login" replace />} />


        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );

}

export default App
