import { useEffect, useRef, useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AdminLayout from "./components/admin/AdminLayout";
import AdminNotificationsPage from "./components/admin/AdminNotificationsPage";
import AdminOverviewPage from "./components/admin/AdminOverviewPage";
import AdminUsersPage from "./components/admin/AdminUsersPage";
import DashboardPage from "./components/DashboardPage";
import Footer from "./components/Footer";
import LoginPage from "./components/LoginPage";
import Navbar from "./components/Navbar";
import SignupPage from "./components/SignupPage";
import SupportPage from "./components/SupportPage";
import UploadComponent from "./components/UploadComponent";
import type { AppPage } from "./types/scan";

const ADMIN_PAGES = new Set<AppPage>([
  "dashboard",
  "users",
  "notifications",
]);

function AppShell() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState<AppPage>("home");
  const isAdmin = !loading && user?.role === "admin";
  const didSetAdminHome = useRef(false);

  useEffect(() => {
    if (isAdmin && !didSetAdminHome.current) {
      didSetAdminHome.current = true;
      setActivePage("dashboard");
    }
    if (!isAdmin) {
      didSetAdminHome.current = false;
    }
  }, [isAdmin]);

  if (isAdmin) {
    const adminPage = ADMIN_PAGES.has(activePage) ? activePage : "dashboard";

    return (
      <AdminLayout activePage={adminPage} onNavigate={setActivePage}>
        {adminPage === "dashboard" && (
          <AdminOverviewPage onNavigate={setActivePage} />
        )}
        {adminPage === "users" && <AdminUsersPage />}
        {adminPage === "notifications" && <AdminNotificationsPage />}
      </AdminLayout>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950">
      <Navbar activePage={activePage} onNavigate={setActivePage} />
      {activePage === "home" && (
        <UploadComponent onNavigate={setActivePage} />
      )}
      {activePage === "support" && <SupportPage />}
      {activePage === "login" && <LoginPage onNavigate={setActivePage} />}
      {activePage === "signup" && <SignupPage onNavigate={setActivePage} />}
      {activePage === "dashboard" && (
        <DashboardPage onNavigate={setActivePage} />
      )}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
