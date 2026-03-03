//database.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});

pool.connect((err) => {
  if (err) {
    console.error('Database bağlantı hatası:', err);
  } else {
    console.log('✅ PostgreSQL bağlantısı başarılı!');
  }
});

// Basit "schema ensure" (küçük projeler için pratik).
// Tablo zaten varsa hata vermez.
pool
  .query(`
    CREATE TABLE IF NOT EXISTS user_points (
      id SERIAL PRIMARY KEY,
      from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      value INTEGER NOT NULL CHECK (value BETWEEN 1 AND 5),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (from_user_id, to_user_id)
    );

    CREATE TABLE IF NOT EXISTS lesson_slots (
      id SERIAL PRIMARY KEY,
      start_time TIME NOT NULL UNIQUE,
      duration_minutes INT NOT NULL DEFAULT 40
    );

    CREATE TABLE IF NOT EXISTS driving_lessons (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      start_at TIMESTAMPTZ NOT NULL,
      end_at TIMESTAMPTZ NOT NULL,
      location TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)
  .catch((e) => {
    console.error("Schema ensure error:", e.message);
  });

// Ders slotları: 40 dk, 08:00'dan 17:20'ye (saat cinsi)
pool
  .query(`
    INSERT INTO lesson_slots (start_time, duration_minutes)
    SELECT t.start_time, t.duration_minutes FROM (VALUES
      ('08:00'::time, 40), ('08:40'::time, 40), ('09:20'::time, 40), ('10:00'::time, 40),
      ('10:40'::time, 40), ('11:20'::time, 40), ('12:00'::time, 40), ('12:40'::time, 40),
      ('13:20'::time, 40), ('14:00'::time, 40), ('14:40'::time, 40), ('15:20'::time, 40),
      ('16:00'::time, 40), ('16:40'::time, 40), ('17:20'::time, 40)
    ) AS t(start_time, duration_minutes)
    WHERE (SELECT COUNT(*) FROM lesson_slots) = 0
  `)
  .catch((e) => {
    if (!e.message.includes("duplicate")) console.error("Lesson slots seed:", e.message);
  });

// Seed admin: uygulama ayağa kalktığında tek seferlik kontrol.
async function ensureSeedAdmin() {
  try {
    const email =
      process.env.SEED_ADMIN_EMAIL || "admin@surucu-kursu.local";
    const plainPassword =
      process.env.SEED_ADMIN_PASSWORD || "Admin123!";

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      console.log(
        `Seed admin zaten var (email=${email}, id=${existing.rows[0].id})`
      );
      return;
    }

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const insertRes = await pool.query(
      `INSERT INTO users (email, password_hash, role, full_name, phone, tc_kimlik_no)
       VALUES ($1, $2, 'admin', $3, $4, $5)
       RETURNING id`,
      [email, passwordHash, "Seed Admin", null, null]
    );

    console.log(
      `Seed admin oluşturuldu ✅ email=${email} password=${plainPassword} id=${insertRes.rows[0].id}`
    );
  } catch (e) {
    console.error("Seed admin oluşturma hatası:", e.message);
  }
}

ensureSeedAdmin();

module.exports = pool;
