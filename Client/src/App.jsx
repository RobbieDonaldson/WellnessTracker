import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Activities from "./pages/Activities";
import Meals from "./pages/Meals";
import SleepPage from "./pages/SleepPage";
import Goals from "./pages/Goals";
import Vitals from "./pages/Vitals";
import WaterIntake from "./pages/WaterIntake";
import Profile from "./pages/Profile";
import Account from "./pages/Account";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Wizard from "./pages/Wizard";
import ForgotPassword from "./pages/ForgotPassword";
import Journal from "./pages/Journal";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-center py-20 text-gray-400">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.wizardCompleted) return <Navigate to="/wizard" replace />;
  return children;
}

function WizardRoute() {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-center py-20 text-gray-400">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.wizardCompleted) return <Navigate to="/" replace />;
  return <Wizard />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user && user.wizardCompleted) return <Navigate to="/" replace />;
  if (user && !user.wizardCompleted) return <Navigate to="/wizard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/wizard" element={<WizardRoute />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/activities" element={<Activities />} />
                <Route path="/meals" element={<Meals />} />
                <Route path="/sleep" element={<SleepPage />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/vitals" element={<Vitals />} />
                <Route path="/water" element={<WaterIntake />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/account" element={<Account />} />
                <Route path="/journal" element={<Journal />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}
