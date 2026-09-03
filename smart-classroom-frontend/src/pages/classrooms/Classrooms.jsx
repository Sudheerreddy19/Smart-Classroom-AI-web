import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search, Plus, Eye, Pencil, Trash2, Loader2, RefreshCw } from "lucide-react";
import { fetchClassrooms, createClassroom, updateClassroom, deleteClassroom, selectClassrooms } from "../../store/slices/classroomSlice";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { PageLoader } from "../../components/common/Spinner";

const EMPTY = { roomNumber:"", capacity:"", cameraId:"", esp32Id:"", projectorId:"", microphoneId:"", speakerId:"", active: true };

export default function Classrooms() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(selectClassrooms);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  useEffect(() => { dispatch(fetchClassrooms()); }, [dispatch]);

  const filtered = list.filter((c) => `${c.roomNumber}`.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ roomNumber: c.roomNumber||"", capacity: c.capacity||"", cameraId: c.cameraId||"", esp32Id: c.esp32Id||"", projectorId: c.projectorId||"", microphoneId: c.microphoneId||"", speakerId: c.speakerId||"", active: c.active });
    setModalOpen(true);
  };
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, capacity: Number(form.capacity) };
    if (editing) await dispatch(updateClassroom({ id: editing.id, data: payload }));
    else await dispatch(createClassroom(payload));
    setSaving(false); setModalOpen(false);
  };
  const handleDelete = async () => {
    setDeleting(true); await dispatch(deleteClassroom(deleteId)); setDeleting(false); setDeleteId(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Classrooms</h1><p className="text-sm text-gray-500 mt-0.5">Manage classrooms and their IoT device assignments.</p></div>
        <div className="flex gap-3">
          <button onClick={() => dispatch(fetchClassrooms())} className="p-2 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"><RefreshCw size={16} /></button>
          <button onClick={() => window.location.href="/classrooms/capacity"} className="flex items-center gap-2 text-sm border border-orange-200 text-orange-700 bg-orange-50 rounded-lg px-3 py-2 hover:bg-orange-100">
            📊 Capacity Report
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"><Plus size={16} /> Add Classroom</button>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        {[
          { label:"Total",    value: list.length },
          { label:"Active",   value: list.filter((c) => c.active).length },
          { label:"Inactive", value: list.filter((c) => !c.active).length },
          { label:"Configured (Camera)", value: list.filter((c) => c.cameraId).length },
          { label:"With ESP32", value: list.filter((c) => c.esp32Id).length },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 flex gap-3 border-b border-gray-100">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by room number..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400" />
          </div>
        </div>

        {loading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500 text-xs uppercase bg-gray-50 border-b border-gray-100">
                {["#","Room No.","Capacity","Camera","ESP32","Projector","Total Devices","Status","Action"].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
              </tr></thead>
              <tbody>
                {filtered.length === 0 ? <tr><td colSpan={9} className="text-center py-12 text-gray-400">No classrooms found.</td></tr>
                : filtered.map((c, i) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-500">{i+1}</td>
                    <td className="px-4 py-3 font-bold text-gray-800">{c.roomNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{c.capacity}</td>
                    <td className="px-4 py-3 text-xs">{c.cameraId ? <span className="text-green-600 font-medium">{c.cameraId}</span> : <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3 text-xs">{c.esp32Id ? <span className="text-blue-600 font-medium">{c.esp32Id}</span> : <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3 text-xs">{c.projectorId ? <span className="text-purple-600 font-medium">{c.projectorId}</span> : <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{c.totalDevices ?? "—"}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{c.active ? "Active" : "Inactive"}</span></td>
                    <td className="px-4 py-3"><div className="flex gap-1">
                      <button onClick={() => setViewItem(c)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Eye size={14} /></button>
                      <button onClick={() => openEdit(c)} className="p-1 text-green-500 hover:bg-green-50 rounded"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteId(c.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Classroom" : "Add Classroom"} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Room Number *</label><input name="roomNumber" value={form.roomNumber} onChange={handleChange} required placeholder="Room 101" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Capacity *</label><input name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} required placeholder="60" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Camera ID</label><input name="cameraId" value={form.cameraId} onChange={handleChange} placeholder="CAM-001" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">ESP32 ID</label><input name="esp32Id" value={form.esp32Id} onChange={handleChange} placeholder="ESP32-001" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Projector ID</label><input name="projectorId" value={form.projectorId} onChange={handleChange} placeholder="PROJ-001" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Speaker ID</label><input name="speakerId" value={form.speakerId} onChange={handleChange} placeholder="SPK-001" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
          </div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Microphone ID</label><input name="microphoneId" value={form.microphoneId} onChange={handleChange} placeholder="MIC-001" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"><input type="checkbox" name="active" checked={form.active} onChange={handleChange} className="rounded border-gray-300 text-blue-600" /> Active</label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Classroom Details">
        {viewItem && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[{l:"Room Number",v:viewItem.roomNumber},{l:"Capacity",v:viewItem.capacity},{l:"Camera ID",v:viewItem.cameraId||"Not configured"},{l:"ESP32 ID",v:viewItem.esp32Id||"Not configured"},{l:"Projector ID",v:viewItem.projectorId||"Not configured"},{l:"Speaker ID",v:viewItem.speakerId||"Not configured"},{l:"Microphone ID",v:viewItem.microphoneId||"Not configured"},{l:"Total Devices",v:viewItem.totalDevices??0},{l:"Today's Classes",v:viewItem.todayClasses??0},{l:"Status",v:viewItem.active?"Active":"Inactive"}].map((item) => (
              <div key={item.l} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400 font-medium">{item.l}</div>
                <div className="text-gray-800 mt-0.5 font-medium">{item.v}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Classroom" message="This will remove the classroom and all associated timetable and attendance data." />
    </div>
  );
}
