import { Search, Filter } from "lucide-react";

export default function StudentToolbar() {
  return (
    <div className="flex justify-between items-center mb-6">

      {/* Search */}

      <div className="relative w-96">

        <Search
          className="absolute left-4 top-3.5 text-slate-400"
          size={18}
        />

        <input
          type="text"
          placeholder="Search Student..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
        />

      </div>

      {/* Filters */}

      <div className="flex gap-4">

        <select className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">

          <option>Department</option>
          <option>CSE</option>
          <option>ECE</option>
          <option>EEE</option>
          <option>MECH</option>

        </select>

        <select className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">

          <option>Semester</option>
          <option>1</option>
          <option>2</option>
          <option>3</option>
          <option>4</option>
          <option>5</option>
          <option>6</option>
          <option>7</option>
          <option>8</option>

        </select>

        <button className="bg-cyan-500 hover:bg-cyan-600 px-5 rounded-xl flex items-center gap-2">

          <Filter size={18} />

          Filter

        </button>

      </div>

    </div>
  );
}