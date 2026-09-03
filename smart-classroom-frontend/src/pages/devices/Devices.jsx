import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search, Plus, Power, Pencil, Trash2, Loader2, RefreshCw, Zap } from "lucide-react";
import { fetchDevices, createDevice, updateDevice, deleteDevice, controlDevice, selectDevices } from "../../store/slices/deviceSlice";
import { fetchClassrooms, selectClassrooms } from "../../store/slices/classroomSlice";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { PageLoader } from "../../components/common/Spinner";
import { usePermissions } from "../../hooks/usePermissions";

const DEVICE_TYPES   = ["CAMERA","ESP32","PROJECTOR","SPEAKER","MICROPHONE","SENSOR","RELAY"];
const DEVICE_STATUSES = ["ONLINE","OFFLINE","ERROR","MAINTENANCE"];
const EMPTY = { deviceId:"", deviceName:"", deviceType:"", classroomId:"", ipAddress:"", macAddress:"", firmwareVersion:"" };

export default function Devices() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(selectDevices);
  const { list: classrooms } = useSelector(selectClassrooms);
  const { canManageDevices, canControlDevices } = usePermissions();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { dispatch(fetchDevices()); dispatch(fetchClassrooms()); }, [dispatch]);

  const filtered = list.filter((d) => {
    const matchSearch = `${d.deviceName} ${d.deviceId} ${d.roomNumber||""}`.toLowerCase().includes(search.toLowerCase());
    const matchType   = !filterType   || d.deviceType   === filterType;
    const matchStatus = !filterStatus || d.status       === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (d) => {
    setEditing(d);
    setForm({ deviceId: d.deviceId||"", deviceName: d.deviceName||"", deviceType: d.deviceType||"", classroomId: d.classroomId||"", ipAddress: d.ipAddress||"", macAddress: d.macAddress||"", firmwareVersion: d.firmwareVersion||"" });
    setModalOpen(true);
  };
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, classroomId: Number(form.classroomId) };
    if (editing) await dispatch(updateDevice({ id: editing.id, data: payload }));
    else await dispatch(createDevice(payload));
    setSaving(false); setModalOpen(false);
  };
  const handleDelete = async () => { setDeleting(true); await dispatch(deleteDevice(deleteId)); setDeleting(false); setDeleteId(null); };
  const handleControl = (deviceId, action) => dispatch(controlDevice({ deviceId, action }));

  const onlineCount  = list.filter((d) => d.status === "ONLINE").length;
  const offlineCount = list.filter((d) => d.status === "OFFLINE").length;

  const statusBadge = { ONLINE: "bg-green-100 text-green-700", OFFLINE: "bg-red-100 text-red-600", ERROR: "bg-orange-100 text-orange-700", MAINTENANCE: "bg-yellow-100 text-yellow-700" };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Devices</h1><p className="text-sm text-gray-500 mt-0.5">Monitor and control all classroom IoT devices.</p></div>
        <div className="flex gap-3">
          <button onClick={() => dispatch(fetchDevices())} className="p-2 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"><RefreshCw size={16} /></button>
          {canManageDevices && (
            <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"><Plus size={16} /> Add Device</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label:"Total",   value: list.length,     color:"text-blue-600",   bg:"bg-blue-50" },
          { label:"Online",  value: onlineCount,     color:"text-green-600",  bg:"bg-green-50" },
          { label:"Offline", value: offlineCount,    color:"text-red-600",    bg:"bg-red-50" },
          { label:"Error",   value: list.filter((d) => d.status==="ERROR").length, color:"text-orange-600", bg:"bg-orange-50" },
          { label:"Maint.",  value: list.filter((d) => d.status==="MAINTENANCE").length, color:"text-yellow-600", bg:"bg-yellow-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-100`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 flex flex-wrap gap-3 border-b border-gray-100">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or ID..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
            <option value="">All Types</option>{DEVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
            <option value="">All Status</option>{DEVICE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-2">
            <option value="">All Classrooms</option>{classrooms.map((c) => <option key={c.id} value={c.id}>{c.roomNumber}</option>)}
          </select>
        </div>

        {loading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500 text-xs uppercase bg-gray-50 border-b border-gray-100">
                {["#","Device Name","ID","Type","Location","Status","IP Address","Last Seen","Action"].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
              </tr></thead>
              <tbody>
                {filtered.length === 0 ? <tr><td colSpan={9} className="text-center py-12 text-gray-400">No devices found.</td></tr>
                : filtered.map((d, i) => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-500">{i+1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{d.deviceName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.deviceId}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{d.deviceType}</span></td>
                    <td className="px-4 py-3 text-gray-600">{d.roomNumber || "—"}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[d.status] || "bg-gray-100 text-gray-600"}`}>{d.status}</span></td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.ipAddress || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{d.lastSeen ? new Date(d.lastSeen).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3"><div className="flex gap-1">
                      {canControlDevices && <button onClick={() => handleControl(d.deviceId, d.status === "ONLINE" ? "OFF" : "ON")} className={`p-1 rounded hover:bg-green-50 ${d.status === "ONLINE" ? "text-green-500" : "text-gray-400"}`} title="Toggle Power"><Power size={14} /></button>}
                      {canManageDevices  && <button onClick={() => openEdit(d)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Pencil size={14} /></button>}
                      {canManageDevices  && <button onClick={() => setDeleteId(d.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Device" : "Register Device"} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Device ID *</label><input name="deviceId" value={form.deviceId} onChange={handleChange} required placeholder="ESP32-001" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Device Name *</label><input name="deviceName" value={form.deviceName} onChange={handleChange} required placeholder="LED Lights – Room 101" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Device Type *</label>
              <select name="deviceType" value={form.deviceType} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                <option value="">Select Type</option>{DEVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Classroom *</label>
              <select name="classroomId" value={form.classroomId} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                <option value="">Select Classroom</option>{classrooms.map((c) => <option key={c.id} value={c.id}>{c.roomNumber}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">IP Address</label><input name="ipAddress" value={form.ipAddress} onChange={handleChange} placeholder="192.168.1.100" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">MAC Address</label><input name="macAddress" value={form.macAddress} onChange={handleChange} placeholder="AA:BB:CC:DD:EE:FF" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
          </div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Firmware Version</label><input name="firmwareVersion" value={form.firmwareVersion} onChange={handleChange} placeholder="v1.0.0" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving..." : editing ? "Update" : "Register"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Device" message="This will permanently remove the device from the system." />
    </div>
  );
}
