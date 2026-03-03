//Dashboard.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("student");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("student");

  const [slots, setSlots] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [lessonPage, setLessonPage] = useState(1);
  const [lessonTotalPages, setLessonTotalPages] = useState(1);
  const [newLessonStudentId, setNewLessonStudentId] = useState("");
  const [newLessonInstructorId, setNewLessonInstructorId] = useState("");
  const [newLessonDate, setNewLessonDate] = useState("");
  const [newLessonSlotId, setNewLessonSlotId] = useState("");
  const [newLessonLocation, setNewLessonLocation] = useState("");
  const [newLessonNotes, setNewLessonNotes] = useState("");

  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editLesson, setEditLesson] = useState(null);
  const [editLessonStudentId, setEditLessonStudentId] = useState("");
  const [editLessonInstructorId, setEditLessonInstructorId] = useState("");
  const [editLessonDate, setEditLessonDate] = useState("");
  const [editLessonSlotId, setEditLessonSlotId] = useState("");
  const [editLessonLocation, setEditLessonLocation] = useState("");
  const [editLessonNotes, setEditLessonNotes] = useState("");
  const [editLessonStatus, setEditLessonStatus] = useState("scheduled");

  useEffect(() => {
    if (!token) navigate("/");
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchLessons();
  }, [page, lessonPage]);

  useEffect(() => {
    const f = async () => {
      try {
        const res = await api.get("/api/admin/schedules/slots");
        setSlots(res.data.slots || []);
      } catch (e) {
        console.error(e);
      }
    };
    f();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/api/admin/users?page=${page}`);
      setUsers(res.data.users);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/api/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLessons = async () => {
    try {
      const res = await api.get(`/api/admin/schedules?page=${lessonPage}&limit=10`);
      setLessons(res.data.lessons);
      setLessonTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================== USER ADD ================== */
  const handleAddUser = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(newEmail)) {
      alert("Geçerli email gir ❌");
      return;
    }

    if (newPassword.length < 8) {
      alert("Şifre en az 8 karakter ❌");
      return;
    }

    try {
      await api.post("/api/admin/users", {
        email: newEmail,
        password: newPassword,
        role: newRole,
      });

      alert("Kullanıcı eklendi ✅");

      setNewEmail("");
      setNewPassword("");
      setNewRole("student");

      fetchUsers();
      fetchStats();
    } catch {
      alert("Ekleme hatası ❌");
    }
  };

  /* ================== ROLE CHANGE ================== */
  const handleRoleChange = async (id, role) => {
    try {
      await api.put(`/api/admin/users/${id}/role`, { role });
      fetchUsers();
      fetchStats();
    } catch {
      alert("Rol güncellenemedi ❌");
    }
  };

  /* ================== UPDATE USER ================== */
  const handleUpdateUser = async () => {
    try {
      await api.put(`/api/admin/users/${editUser.id}`, {
        email: editEmail,
        password: editPassword,
        role: editRole,
      });

      setIsModalOpen(false);
      setEditPassword("");
      fetchUsers();
    } catch {
      alert("Güncelleme hatası ❌");
    }
  };

  const handleAddLesson = async () => {
    if (!newLessonStudentId || !newLessonInstructorId) {
      alert("Öğrenci ve eğitmen seç ❌");
      return;
    }
    if (!newLessonDate || !newLessonSlotId) {
      alert("Tarih ve saat slotu seç ❌");
      return;
    }
    try {
      await api.post("/api/admin/schedules", {
        studentId: Number(newLessonStudentId),
        instructorId: Number(newLessonInstructorId),
        date: newLessonDate,
        slotId: Number(newLessonSlotId),
        location: newLessonLocation,
        notes: newLessonNotes,
      });

      setNewLessonStudentId("");
      setNewLessonInstructorId("");
      setNewLessonDate("");
      setNewLessonSlotId("");
      setNewLessonLocation("");
      setNewLessonNotes("");
      fetchLessons();
    } catch (e) {
      alert(e?.response?.data?.error || "Program eklenemedi ❌");
    }
  };

  const handleDeleteLesson = async (id) => {
    try {
      await api.delete(`/api/admin/schedules/${id}`);
      fetchLessons();
    } catch {
      alert("Program silinemedi ❌");
    }
  };

  const openEditLesson = (l, slotsList) => {
    setEditLesson(l);
    setEditLessonStudentId(String(l.student_id));
    setEditLessonInstructorId(String(l.instructor_id));
    const startStr = (l.start_at || "").toString();
    const datePart = startStr.slice(0, 10);
    const timePart = startStr.slice(11, 16);
    setEditLessonDate(datePart);
    const matched = (slotsList || slots).find((s) => {
      const t = String(s.start_time).slice(0, 5);
      return t === timePart;
    });
    setEditLessonSlotId(matched ? String(matched.id) : "");
    setEditLessonLocation(l.location || "");
    setEditLessonNotes(l.notes || "");
    setEditLessonStatus(l.status || "scheduled");
    setIsLessonModalOpen(true);
  };

  const handleUpdateLesson = async () => {
    if (!editLesson) return;
    if (!editLessonStudentId || !editLessonInstructorId) {
      alert("Öğrenci ve eğitmen seç ❌");
      return;
    }
    if (!editLessonDate || !editLessonSlotId) {
      alert("Tarih ve saat slotu zorunlu ❌");
      return;
    }
    try {
      await api.put(`/api/admin/schedules/${editLesson.id}`, {
        studentId: Number(editLessonStudentId),
        instructorId: Number(editLessonInstructorId),
        date: editLessonDate,
        slotId: Number(editLessonSlotId),
        location: editLessonLocation,
        notes: editLessonNotes,
        status: editLessonStatus,
      });
      setIsLessonModalOpen(false);
      setEditLesson(null);
      fetchLessons();
      alert("Program güncellendi ✅");
    } catch (e) {
      alert(e?.response?.data?.error || "Program güncellenemedi ❌");
    }
  };

  /* ================== DELETE ================== */
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/admin/users/${id}`);
      fetchUsers();
      fetchStats();
    } catch {
      alert("Silme hatası ❌");
    }
  };

  /* ================== INSTRUCTOR POINT ================== */
  // Admin puan vermez; sadece puanları görüntüler.

  /* ================== FILTER ================== */
  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = stats
    ? [
        { name: "Admin", value: stats.adminCount },
        { name: "Instructor", value: stats.instructorCount || 0 },
        { name: "Student", value: stats.studentCount },
      ]
    : [];

  // Sıra: Admin, Instructor, Student — sayaçlarla aynı (kırmızı, cyan, yeşil)
  const COLORS = ["#ef4444", "#06b6d4", "#10b981"];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/30 to-slate-100">
      {/* SIDEBAR - giriş ile uyumlu koyu tema */}
      <div className="w-64 bg-slate-900 text-white p-6 flex flex-col justify-between shadow-xl">
        <div>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white text-xl font-bold shadow-lg mb-6">
            S
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Sürücü Kursu</h2>
          <p className="text-slate-400 text-sm mb-8">Admin Panel</p>
          <ul className="space-y-2">
            <li className="px-3 py-2 rounded-lg bg-blue-500/20 text-cyan-200 font-medium">Dashboard</li>
            <li className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300">Kullanıcılar</li>
            <li className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300">Öğrenciler</li>
          </ul>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/");
          }}
          className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-lg transition"
        >
          Çıkış Yap
        </button>
      </div>

      {/* MAIN */}
      <div className="flex-1 p-8 overflow-y-auto">

        {/* STATS - giriş kartları gibi */}
        {stats && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            <StatCard title="Toplam" value={stats.totalUsers} accent="blue" />
            <StatCard title="Admin" value={stats.adminCount} accent="red" />
            <StatCard title="Instructor" value={stats.instructorCount || 0} accent="cyan" />
            <StatCard title="Student" value={stats.studentCount} accent="green" />
          </div>
        )}

        {/* CHART */}
        {stats && (
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-white/50 p-6 mb-8">
            <PieChart width={400} height={300}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        )}

        {/* ADD USER */}
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-white/50 p-6 mb-8">
          <h3 className="mb-4 font-semibold text-slate-800">Yeni Kullanıcı</h3>
          <div className="flex gap-4 flex-wrap items-end">
            <input
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 min-w-[180px] px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
            <input
              type="password"
              placeholder="Şifre (min 8)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 min-w-[140px] px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition bg-white"
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={handleAddUser}
              className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg shadow-blue-500/25 transition"
            >
              Ekle
            </button>
          </div>
        </div>

        {/* LIST */}
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-white/50 p-6 overflow-hidden">
          <input
            placeholder="Kullanıcı ara..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition mb-4"
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="rounded-xl overflow-hidden border border-slate-200">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="px-4 py-3 text-slate-700 font-semibold">ID</th>
                  <th className="px-4 py-3 text-slate-700 font-semibold">Email</th>
                  <th className="px-4 py-3 text-slate-700 font-semibold">Rol</th>
                  <th className="px-4 py-3 text-slate-700 font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="px-4 py-3 text-slate-600">{u.id}</td>
                    <td className="px-4 py-3">
                      <span className="text-slate-800">{u.email}</span>
                      {u.role === "instructor" && (
                        <span className="ml-2 text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-lg">
                          ⭐ {(u.points_avg ?? 0).toFixed(2)} ({u.points_count ?? 0})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(u.id, e.target.value)
                        }
                        className="px-3 py-1.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none text-sm bg-white"
                      >
                        <option value="admin">Admin</option>
                        <option value="instructor">Instructor</option>
                        <option value="student">Student</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition"
                      >
                        Sil
                      </button>
                      <button
                        onClick={() => {
                          setEditUser(u);
                          setEditEmail(u.email);
                          setEditRole(u.role);
                          setEditPassword("");
                          setIsModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 transition"
                      >
                        Düzenle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* LESSON SCHEDULES */}
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-white/50 p-6 mt-8">
          <h3 className="mb-1 font-semibold text-slate-800">Direksiyon Programı</h3>
          <p className="text-sm text-slate-500 mb-4">Her ders 40 dakika. Öğrenci başına en fazla 8 ders. Tablodan tarih ve saat slotu seçin.</p>

          <div className="grid grid-cols-6 gap-3 mb-6">
            <select
              value={newLessonStudentId}
              onChange={(e) => setNewLessonStudentId(e.target.value)}
              className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
            >
              <option value="">Öğrenci seç</option>
              {users
                .filter((u) => u.role === "student")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
            </select>

            <select
              value={newLessonInstructorId}
              onChange={(e) => setNewLessonInstructorId(e.target.value)}
              className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
            >
              <option value="">Eğitmen seç</option>
              {users
                .filter((u) => u.role === "instructor")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
            </select>

            <input
              type="date"
              value={newLessonDate}
              onChange={(e) => setNewLessonDate(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
            <select
              value={newLessonSlotId}
              onChange={(e) => setNewLessonSlotId(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
            >
              <option value="">Saat (40 dk)</option>
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {String(s.start_time).slice(0, 5)} (40 dk)
                </option>
              ))}
            </select>
            <input
              placeholder="Konum"
              value={newLessonLocation}
              onChange={(e) => setNewLessonLocation(e.target.value)}
              className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
            <input
              placeholder="Not"
              value={newLessonNotes}
              onChange={(e) => setNewLessonNotes(e.target.value)}
              className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
            <button
              onClick={handleAddLesson}
              className="col-span-2 px-4 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-700 hover:to-cyan-600 shadow-lg transition"
            >
              Ders Ekle
            </button>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-200">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="px-4 py-3 text-slate-700 font-semibold">ID</th>
                  <th className="px-4 py-3 text-slate-700 font-semibold">Öğrenci</th>
                  <th className="px-4 py-3 text-slate-700 font-semibold">Eğitmen</th>
                  <th className="px-4 py-3 text-slate-700 font-semibold">Başlangıç</th>
                  <th className="px-4 py-3 text-slate-700 font-semibold">Bitiş (saat)</th>
                  <th className="px-4 py-3 text-slate-700 font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="px-4 py-3 text-slate-600">{l.id}</td>
                    <td className="px-4 py-3 text-slate-800">{l.student_email}</td>
                    <td className="px-4 py-3 text-slate-800">{l.instructor_email}</td>
                    <td className="px-4 py-3 text-slate-600">{String(l.start_at).replace("T", " ").slice(0, 16)}</td>
                    <td className="px-4 py-3 text-slate-600">{String(l.end_at).slice(11, 16)} (40 dk)</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => openEditLesson(l, slots)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 transition"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(l.id)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-center gap-2">
            {[...Array(lessonTotalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setLessonPage(i + 1)}
                className={`px-4 py-2 rounded-xl font-medium transition ${
                  lessonPage === i + 1
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md"
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <EditUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleUpdateUser}
        email={editEmail}
        setEmail={setEditEmail}
        password={editPassword}
        setPassword={setEditPassword}
        role={editRole}
        setRole={setEditRole}
      />

      <EditLessonModal
        isOpen={isLessonModalOpen}
        onClose={() => { setIsLessonModalOpen(false); setEditLesson(null); }}
        onSave={handleUpdateLesson}
        users={users}
        slots={slots}
        studentId={editLessonStudentId}
        setStudentId={setEditLessonStudentId}
        instructorId={editLessonInstructorId}
        setInstructorId={setEditLessonInstructorId}
        date={editLessonDate}
        setDate={setEditLessonDate}
        slotId={editLessonSlotId}
        setSlotId={setEditLessonSlotId}
        location={editLessonLocation}
        setLocation={setEditLessonLocation}
        notes={editLessonNotes}
        setNotes={setEditLessonNotes}
        status={editLessonStatus}
        setStatus={setEditLessonStatus}
      />
    </div>
  );
}

{/* EDIT MODAL */}
function EditUserModal({
  isOpen,
  onClose,
  onSave,
  email,
  setEmail,
  password,
  setPassword,
  role,
  setRole,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-white/20 p-6 w-full max-w-md">
        <h3 className="font-semibold text-slate-800 mb-4">Kullanıcı Düzenle</h3>
        <div className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            placeholder="Email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            placeholder="Yeni şifre (opsiyonel)"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition">
            İptal
          </button>
          <button onClick={onSave} className="px-4 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg transition">
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

function EditLessonModal({
  isOpen,
  onClose,
  onSave,
  users,
  slots,
  studentId,
  setStudentId,
  instructorId,
  setInstructorId,
  date,
  setDate,
  slotId,
  setSlotId,
  location,
  setLocation,
  notes,
  setNotes,
  status,
  setStatus,
}) {
  if (!isOpen) return null;
  const students = users.filter((u) => u.role === "student");
  const instructors = users.filter((u) => u.role === "instructor");
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-white/20 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="font-semibold text-slate-800 text-lg mb-1">Program Düzenle</h3>
        <p className="text-sm text-slate-500 mb-4">Bitiş saati otomatik (başlangıç + 40 dk).</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Öğrenci</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
            >
              <option value="">Seçin</option>
              {students.map((u) => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Eğitmen</label>
            <select
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
            >
              <option value="">Seçin</option>
              {instructors.map((u) => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Tarih</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Saat (40 dk)</label>
            <select
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
            >
              <option value="">Seçin</option>
              {(slots || []).map((s) => (
                <option key={s.id} value={s.id}>{String(s.start_time).slice(0, 5)} (40 dk)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Konum</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              placeholder="Konum"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Not</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              placeholder="Not"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Durum</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
            >
              <option value="scheduled">Planlandı</option>
              <option value="done">Tamamlandı</option>
              <option value="cancelled">İptal</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition">
            İptal
          </button>
          <button onClick={onSave} className="px-4 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg transition">
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

const ACCENT_BORDER = {
  blue: "border-l-blue-500",
  red: "border-l-red-500",
  cyan: "border-l-cyan-500",
  green: "border-l-emerald-500",
};

function StatCard({ title, value, accent = "blue" }) {
  return (
    <div className={`bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-white/50 p-6 border-l-4 ${ACCENT_BORDER[accent] || ACCENT_BORDER.blue}`}>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h2 className="text-3xl font-bold text-slate-800 mt-1">{value}</h2>
    </div>
  );
}