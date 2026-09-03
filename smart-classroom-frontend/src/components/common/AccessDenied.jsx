import { ShieldOff, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AccessDenied({ message }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-8 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <ShieldOff size={36} className="text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">
        {message || "You don't have permission to view this page. Contact your administrator if you think this is a mistake."}
      </p>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition"
      >
        <ArrowLeft size={15} /> Go Back
      </button>
    </div>
  );
}
