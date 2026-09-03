const students = [
  {
    id: 1,
    roll: "CSE001",
    name: "Sudheer",
    department: "CSE",
    semester: 6,
    attendance: "92%",
  },
  {
    id: 2,
    roll: "CSE002",
    name: "Rahul",
    department: "CSE",
    semester: 6,
    attendance: "95%",
  },
];

export default function StudentTable() {
  return (
    <div className="mt-8 bg-slate-900 rounded-xl overflow-hidden shadow-lg">

      <table className="w-full text-slate-200">

        <thead className="bg-slate-800 text-white">

          <tr>
            <th className="p-5">Roll No</th>
            <th>Name</th>
            <th>Department</th>
            <th>Semester</th>
            <th>Attendance</th>
            <th>Action</th>
          </tr>

        </thead>

        <tbody>

          {students.map((student) => (

            <tr
              key={student.id}
              className="border-b border-slate-700 hover:bg-slate-800 transition text-center"
            >

              <td className="p-5 text-slate-300">{student.roll}</td>

              <td className="font-semibold text-white">
                {student.name}
              </td>

              <td className="text-slate-300">
                {student.department}
              </td>

              <td className="text-slate-300">
                {student.semester}
              </td>

              <td>
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-semibold">
                  {student.attendance}
                </span>
              </td>

              <td>
                <button className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg text-white transition">
                  View
                </button>
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}