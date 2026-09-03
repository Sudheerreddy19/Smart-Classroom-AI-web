import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSelector as useReduxSelector } from "react-redux";
import { CheckCircle, Filter, AlertTriangle, Info, Megaphone, Settings, BookOpen, Monitor, Cpu, Bell, Trash2, RefreshCw } from "lucide-react";
import { fetchNotifications, markAllRead, markRead, deleteNotification, selectNotifications } from "../../store/slices/notificationSlice";
import { selectUser } from "../../store/slices/authSlice";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { PageLoader } from "../../components/common/Spinner";

const typeIcon = {
  INFO:         { icon: Info,         color: "text-blue-500 bg-blue-50" },
  SUCCESS:      { icon: CheckCircle,  color: "text-green-500 bg-green-50" },
  WARNING:      { icon: AlertTriangle,color: "text-yellow-500 bg-yellow-50" },
  ALERT:        { icon: AlertTriangle,color: "text-red-500 bg-red-50" },
  ATTENDANCE:   { icon: BookOpen,     color: "text-purple-500 bg-purple-50" },
  DEVICE:       { icon: Monitor,      color: "text-cyan-500 bg-cyan-50" },
  EXAM:         { icon: BookOpen,     color: "text-orange-500 bg-orange-50" },
  ANNOUNCEMENT: { icon: Megaphone,    color: "text-blue-500 bg-blue-50" },
};

const typeTagColor = {
  INFO: "bg-blue-100 text-blue-700",
  SUCCESS: "bg-green-100 text-green-700",
  WARNING: "bg-yellow-100 text-yellow-700",
  ALERT: "bg-red-100 text-red-700",
  ATTENDANCE: "bg-purple-100 text-purple-700",
  DEVICE: "bg-cyan-100 text-cyan-700",
  EXAM: "bg-orange-100 text-orange-700",
  ANNOUNCEMENT: "bg-blue-100 text-blue-700",
};

const tabs = ["All", "Unread", "Alerts", "Announcements", "System"];

export default function Notifications() {
  const dispatch = useDispatch();
  const user = useReduxSelector(selectUser);
  const { list, unreadCount, loading } = useSelector(selectNotifications);

  const [activeTab, setActiveTab] = useState("All");
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.userId) dispatch(fetchNotifications(user.userId));
    else dispatch(fetchNotifications());
  }, [dispatch, user]);

  const filtered = list.filter((n) => {
    if (activeTab === "All") return true;
    if (activeTab === "Unread") return !n.read;
    if (activeTab === "Alerts") return n.type === "ALERT" || n.type === "WARNING";
    if (activeTab === "Announcements") return n.type === "ANNOUNCEMENT";
    if (activeTab === "System") return n.type === "INFO" || n.type === "SUCCESS";
    return true;
  });

  const handleMarkAllRead = () => {
    if (user?.userId) dispatch(markAllRead(user.userId));
  };

  const handleMarkRead = (id) => dispatch(markRead(id));

  const handleDelete = async () => {
    setDeleting(true);
    await dispatch(deleteNotification(deleteId));
    setDeleting(false);
    setDeleteId(null);
  };

  const summaryPie = [
    { name: "Alerts",        value: list.filter((n) => n.type === "ALERT" || n.type === "WARNING").length, color: "#ef4444" },
    { name: "Announcements", value: list.filter((n) => n.type === "ANNOUNCEMENT").length, color: "#3b82f6" },
    { name: "System",        value: list.filter((n) => n.type === "INFO" || n.type === "SUCCESS").length, color: "#10b981" },
    { name: "Other",         value: list.filter((n) => !["ALERT","WARNING","ANNOUNCEMENT","INFO","SUCCESS"].includes(n.type)).length, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  const tabCounts = {
    "All": list.length,
    "Unread": list.filter((n) => !n.read).length,
    "Alerts": list.filter((n) => n.type === "ALERT" || n.type === "WARNING").length,
    "Announcements": list.filter((n) => n.type === "ANNOUNCEMENT").length,
    "System": list.filter((n) => n.type === "INFO" || n.type === "SUCCESS").length,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">Stay updated with important alerts and announcements.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => user?.userId ? dispatch(fetchNotifications(user.userId)) : dispatch(fetchNotifications())} className="p-2 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"><RefreshCw size={16} /></button>
          <button onClick={handleMarkAllRead} disabled={unreadCount === 0} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-gray-700 text-sm px-4 py-2 rounded-lg">
            <CheckCircle size={15} /> Mark all as read
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${activeTab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t}
            {tabCounts[t] > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === t ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                {tabCounts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* List */}
        <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100">
          {loading ? <PageLoader /> : (
            <div className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Bell size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No notifications in this category.</p>
                </div>
              ) : filtered.map((n) => {
                const ti = typeIcon[n.type] || typeIcon.INFO;
                const Icon = ti.icon;
                return (
                  <div key={n.id} className={`flex items-start gap-4 p-4 hover:bg-gray-50 transition cursor-pointer ${!n.read ? "bg-blue-50/30" : ""}`} onClick={() => !n.read && handleMarkRead(n.id)}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${ti.color}`}>
                      <Icon size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-800 truncate">{n.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {n.createdAt ? new Date(n.createdAt).toLocaleString() : "—"}
                          </span>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>}
                          <button onClick={(e) => { e.stopPropagation(); setDeleteId(n.id); }} className="p-1 text-gray-300 hover:text-red-500 rounded">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeTagColor[n.type] || "bg-gray-100 text-gray-600"}`}>{n.type}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {filtered.length > 0 && (
            <div className="p-4 border-t border-gray-100 text-sm text-gray-500">
              Showing {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Summary Donut */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Notification Summary</h3>
            <div className="flex justify-center">
              <div className="relative">
                <PieChart width={120} height={120}>
                  <Pie data={summaryPie.length ? summaryPie : [{name:"None",value:1,color:"#e5e7eb"}]} cx={55} cy={55} innerRadius={30} outerRadius={50} dataKey="value" strokeWidth={0}>
                    {(summaryPie.length ? summaryPie : [{color:"#e5e7eb"}]).map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                </PieChart>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-base font-bold text-gray-800">{list.length}</div>
                    <div className="text-xs text-gray-400">Total</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-1.5 mt-2">
              {summaryPie.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }}></span>
                  <span className="text-gray-600 flex-1">{d.name}</span>
                  <span className="font-semibold">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Quick Filters</h3>
            <div className="space-y-1">
              {[
                { label: "Unread",         count: unreadCount,    icon: Bell },
                { label: "Priority Alerts",count: list.filter((n) => n.type==="ALERT").length, icon: AlertTriangle },
                { label: "Attendance",     count: list.filter((n) => n.type==="ATTENDANCE").length, icon: CheckCircle },
                { label: "Device Alerts",  count: list.filter((n) => n.type==="DEVICE").length, icon: Monitor },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <button key={f.label} className="w-full flex items-center gap-3 text-sm hover:bg-gray-50 rounded-lg px-2 py-2">
                    <Icon size={15} className="text-gray-400" />
                    <span className="text-gray-600 flex-1 text-left">{f.label}</span>
                    <span className="text-gray-400 font-medium text-xs">{f.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferences hint */}
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 text-xs text-gray-600">
            <div className="font-semibold text-gray-800 mb-1 flex items-center gap-1"><Settings size={13} /> Notification Settings</div>
            Configure preferences in <span className="text-blue-600 cursor-pointer hover:underline">Settings → Notifications</span>
          </div>
        </div>
      </div>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Notification" message="Remove this notification permanently?" />
    </div>
  );
}
