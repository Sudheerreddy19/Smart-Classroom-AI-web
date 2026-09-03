import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import AIAssistant from "../AIAssistant";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      {/* Voice AI Assistant — always visible, say "Hey Smart" to activate */}
      <AIAssistant />
    </div>
  );
}
