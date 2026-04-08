import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Dumbbell,
  UtensilsCrossed,
  Moon,
  Target,
  HeartPulse,
  Droplets,
  UserCircle,
  LogOut,
  User,
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/activities", label: "Activities", icon: Dumbbell },
  { to: "/meals", label: "Meals", icon: UtensilsCrossed },
  { to: "/sleep", label: "Sleep", icon: Moon },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/vitals", label: "Vitals", icon: HeartPulse },
  { to: "/water", label: "Water Intake", icon: Droplets },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-700 text-white flex flex-col shrink-0">
        <div className="px-6 py-5 text-xl font-bold tracking-wide border-b border-indigo-600">
          WellnessTracker
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-800 text-white"
                    : "text-indigo-100 hover:bg-indigo-600"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        {/* User footer */}
        <div className="px-4 py-4 border-t border-indigo-600">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-indigo-400 shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center border-2 border-indigo-400 shrink-0">
                <User size={18} className="text-indigo-200" />
              </div>
            )}
            <div className="text-sm truncate flex-1">
              <p className="font-medium">{user?.name}</p>
              <p className="text-indigo-300 text-xs">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="text-indigo-200 hover:text-white p-1.5 rounded-lg hover:bg-indigo-600" title="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
