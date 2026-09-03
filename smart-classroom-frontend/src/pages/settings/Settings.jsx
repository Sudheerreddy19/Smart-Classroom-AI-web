import { useState } from "react";
import {
  Settings as SettingsIcon, User, Shield, Bell, Palette, Calendar, Database,
  Puzzle, HardDrive, Cpu, RefreshCw, Pencil, ExternalLink, Mail
} from "lucide-react";
import { usePermissions } from "../../hooks/usePermissions";
import AccessDenied from "../../components/common/AccessDenied";

const sidebarItems = [
  { icon: SettingsIcon, label: "General", sub: "Basic system settings", active: true },
  { icon: User, label: "Profile", sub: "Manage your profile" },
  { icon: Shield, label: "Account", sub: "Security & login" },
  { icon: Bell, label: "Notifications", sub: "Notification preferences" },
  { icon: Palette, label: "Appearance", sub: "Theme & display" },
  { icon: Calendar, label: "Calendar", sub: "Academic calendar" },
  { icon: Database, label: "Data & Privacy", sub: "Data management" },
  { icon: Puzzle, label: "Integrations", sub: "Connected services" },
  { icon: HardDrive, label: "Backup & Restore", sub: "Backup system data" },
  { icon: Cpu, label: "System", sub: "System configuration" },
];

export default function Settings() {
  const { canAccessSettings } = usePermissions();
  const [activeSection, setActiveSection] = useState("General");
  const [darkMode, setDarkMode] = useState(false);

  if (!canAccessSettings) return <AccessDenied message="Settings are accessible only by Administrators." />;
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showTips, setShowTips] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);
  const [allowStudents, setAllowStudents] = useState(true);
  const [dayStarts, setDayStarts] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your account, preferences, and system configurations.</p>
        </div>
        <button className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg px-3 py-2">
          <RefreshCw size={14} /> Reset to Default
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="xl:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => setActiveSection(item.label)}
                className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition mb-0.5 ${activeSection === item.label ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <Icon size={16} className={`mt-0.5 flex-shrink-0 ${activeSection === item.label ? "text-blue-600" : "text-gray-400"}`} />
                <div>
                  <div className={`text-sm font-medium ${activeSection === item.label ? "text-blue-700" : "text-gray-700"}`}>{item.label}</div>
                  <div className="text-xs text-gray-400">{item.sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">General Settings</h2>
          <p className="text-sm text-gray-500 mb-6">Configure basic system preferences and defaults.</p>

          {/* Institution */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Institution Name</label>
              <input defaultValue="Smart Classroom Hub" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Institution Code</label>
              <input defaultValue="SCH-2025" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Timezone</label>
              <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                <option>(UTC+05:30) Asia/Kolkata</option>
                <option>(UTC+00:00) UTC</option>
                <option>(UTC-05:00) America/New_York</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Date Format</label>
              <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                <option>May 18, 2025 (MMM DD, YYYY)</option>
                <option>18/05/2025 (DD/MM/YYYY)</option>
                <option>05/18/2025 (MM/DD/YYYY)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Time Format</label>
              <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                <option>12 Hour (AM/PM)</option>
                <option>24 Hour</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Language</label>
              <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                <option>English (US)</option>
                <option>Hindi</option>
              </select>
            </div>
          </div>

          <div className="mb-5">
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Default Academic Term</label>
            <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
              <option>2024-2025 Term 2</option>
              <option>2024-2025 Term 1</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Week starts on</label>
              <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
                <option>Monday</option>
                <option>Sunday</option>
              </select>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={dayStarts} onChange={() => setDayStarts(!dayStarts)} className="rounded border-gray-300 text-blue-600" />
                Enable day starts at
              </label>
              <input type="time" defaultValue="08:00" className="text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          {/* System Preferences */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">System Preferences</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Enable dark mode", state: darkMode, setter: setDarkMode },
                { label: "Enable two-factor authentication for admins", state: twoFactor, setter: setTwoFactor },
                { label: "Auto-refresh dashboard data", state: autoRefresh, setter: setAutoRefresh },
                { label: "Allow students to view their performance", state: allowStudents, setter: setAllowStudents },
                { label: "Show tips and suggestions", state: showTips, setter: setShowTips },
                { label: "Enable offline mode for devices", state: offlineMode, setter: setOfflineMode },
              ].map((item) => (
                <label key={item.label} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.state}
                    onChange={() => item.setter(!item.state)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-2.5 rounded-lg">
              Save Changes
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Your Profile */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Your Profile</h3>
            <div className="flex items-center gap-3 mb-4">
              <img src="https://i.pravatar.cc/60?img=12" alt="admin" className="w-12 h-12 rounded-full" />
              <div>
                <div className="font-semibold text-gray-800">Admin</div>
                <div className="text-xs text-gray-500">System Administrator</div>
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Online</span>
              </div>
            </div>
            <button className="w-full text-sm border border-gray-200 rounded-lg py-2 hover:bg-gray-50 flex items-center justify-center gap-2">
              <Pencil size={14} /> Edit Profile
            </button>
          </div>

          {/* Quick Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Quick Settings</h3>
            {[
              { label: "Academic Year", value: "2024-2025", color: "text-blue-600" },
              { label: "Current Term", value: "Term 2", color: "text-green-600" },
              { label: "Grading System", value: "Percentage", color: "text-orange-600" },
              { label: "Attendance Threshold", value: "75%", color: "text-purple-600" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-600">{s.label}</span>
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-semibold ${s.color}`}>{s.value}</span>
                  <span className="text-gray-400 text-xs">›</span>
                </div>
              </div>
            ))}
          </div>

          {/* Security Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Security Summary</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <div><div className="font-medium text-gray-700">Password</div><div className="text-gray-400">Last changed 25 days ago</div></div>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Strong</span>
              </div>
              <div className="flex justify-between items-center">
                <div><div className="font-medium text-gray-700">Two-Factor Authentication</div><div className="text-gray-400">Enabled</div></div>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">On</span>
              </div>
              <div className="flex justify-between items-center">
                <div><div className="font-medium text-gray-700">Active Sessions</div><div className="text-gray-400">3 active sessions</div></div>
                <button className="text-blue-600 font-medium">View</button>
              </div>
              <div className="flex justify-between items-center">
                <div><div className="font-medium text-gray-700">Login History</div><div className="text-gray-400">Last login: 18 May 2025, 9:15 AM</div></div>
                <button className="text-blue-600 font-medium">View</button>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-1">Support</h3>
            <p className="text-xs text-gray-500 mb-3">Need help with settings? Visit our help center or contact support.</p>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1 text-xs border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 text-gray-600">
                <ExternalLink size={13} /> Help Center
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 text-xs border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 text-gray-600">
                <Mail size={13} /> Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
