//Login.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/api/users/login", { email, password });
      const { token, user } = response.data || {};
      if (user?.role !== "admin") {
        alert("Sadece admin bu panele giriş yapabilir.");
        setLoading(false);
        return;
      }
      localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));
      alert("Giriş başarılı ✅");
      navigate("/dashboard");
    } catch (error) {
      const msg = error?.response?.data?.error || "Giriş başarısız ❌";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Dekoratif daireler */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute bottom-20 right-1/3 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white text-2xl font-bold shadow-lg mb-4">
              S
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Sürücü Kursu</h1>
            <p className="text-slate-500 text-sm mt-1">Admin panele giriş</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ornek.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg shadow-blue-500/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Sadece admin yetkili kullanıcılar giriş yapabilir.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
