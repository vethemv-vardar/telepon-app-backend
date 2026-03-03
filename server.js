const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin'); 
const pointRoutes = require("./routes/points");
const scheduleRoutes = require("./routes/schedules");

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/points", pointRoutes);
app.use("/api/schedules", scheduleRoutes);

app.get('/', (req, res) => {
  res.send('Sürücü Kursu API Çalışıyor 🚀');
});

const PORT = process.env.PORT || 8880;

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});
// GEÇİCİ olarak ekleniyor, sonra kaldırılacak. Admin kullanıcı girişi için.
const bcrypt = require("bcrypt");
const pool = require("./config/database");

(async () => {
  const hashed = await bcrypt.hash("Admin123!", 10);

  await pool.query(
    "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING",
    ["admin@panel.com", hashed, "admin"]
  );

  console.log("Geçici admin oluşturuldu");
})();

