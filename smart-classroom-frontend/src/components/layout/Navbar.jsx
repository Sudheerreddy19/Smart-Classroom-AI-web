import { Bell, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { selectUser, logoutUser } from "../../store/slices/authSlice";
import { selectNotifications } from "../../store/slices/notificationSlice";

export default function Navbar() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const user       = useSelector(selectUser);
  const { unreadCount } = useSelector(selectNotifications);

  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/");
  };

  const initials = user ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() : "A";
  const fullName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "Admin";
  const role     = user?.role ?? "ADMIN";

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-20">
      {/* Left side — breadcrumb placeholder */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="font-medium text-gray-700">Smart Classroom Hub</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications Bell */}
        <button
          onClick={() => navigate("/notifications")}
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
          title="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center leading-none font-semibold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDropOpen(!dropOpen)}
            className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-gray-100 rounded-lg transition"
          >
            {/* Avatar */}
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-semibold text-gray-800 leading-tight">{fullName}</div>
              <div className="text-xs text-gray-400 leading-tight capitalize">{role.toLowerCase()}</div>
            </div>
            <ChevronDown size={15} className={`text-gray-400 transition-transform ${dropOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown */}
          {dropOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-sm font-semibold text-gray-900">{fullName}</div>
                <div className="text-xs text-gray-400 truncate">{user?.email ?? ""}</div>
                <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium capitalize">
                  {role.toLowerCase()}
                </span>
              </div>

              <button onClick={() => { navigate("/settings"); setDropOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                <User size={15} className="text-gray-400" /> My Profile
              </button>
              <button onClick={() => { navigate("/settings"); setDropOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                <Settings size={15} className="text-gray-400" /> Settings
              </button>

              <div className="border-t border-gray-100 my-1" />

              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
