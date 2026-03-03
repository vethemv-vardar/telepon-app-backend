//admin.js
const express = require("express");
const router = express.Router();
const pool = require("../config/database");

const {
  authenticateToken,
  authorizeAdmin,
} = require("../middleware/auth");

const bcrypt = require("bcrypt");



/* ===============================
   TÜM KULLANICILARI GETİR (PAGINATION)
================================= */
router.get(
  "/users",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 5;
      const offset = (page - 1) * limit;

      const usersRes = await pool.query(
        `
        SELECT
          u.id,
          u.email,
          u.role,
          COALESCE(AVG(up.value), 0)::float AS points_avg,
          COUNT(up.id)::int AS points_count
        FROM users u
        LEFT JOIN user_points up ON up.to_user_id = u.id
        GROUP BY u.id
        ORDER BY u.id DESC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      );

      const countRes = await pool.query(
        "SELECT COUNT(*) FROM users"
      );

      res.json({
        users: usersRes.rows,
        total: parseInt(countRes.rows[0].count),
        page,
        totalPages: Math.ceil(countRes.rows[0].count / limit),
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server hatası ❌" });
    }
  }
);



/* ===============================
   ROL GÜNCELLE
================================= */
router.put(
  "/users/:id/role",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      // Frontend'deki rollere (admin, instructor, student) izin ver
      if (!["admin", "instructor", "student"].includes(role)) {
        return res.status(400).json({
          error: "Geçersiz rol ❌",
        });
      }

      await pool.query(
        "UPDATE users SET role = $1 WHERE id = $2",
        [role, id]
      );

      res.json({ message: "Rol güncellendi ✅" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Rol güncelleme hatası ❌" });
    }
  }
);



/* ===============================
   KULLANICI SİL
================================= */
router.delete(
  "/users/:id",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Admin kendini silemesin
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          error: "Kendinizi silemezsiniz ❌",
        });
      }

      const result = await pool.query(
        "DELETE FROM users WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Kullanıcı bulunamadı ❌",
        });
      }

      res.json({ message: "Kullanıcı silindi ✅" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Silme hatası ❌" });
    }
  }
);

// YENİ KULLANICI EKLE
router.post("/users", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Email doğrulama
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: "Geçerli bir email girin" });
    }

    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ error: "Şifre en az 8 karakter olmalı" });
    }

    // Frontend ile uyumlu roller
    if (!role || !["admin", "instructor", "student"].includes(role)) {
      return res.status(400).json({ error: "Geçersiz rol" });
    }

    // Email zaten kayıtlı mı?
    const existRes = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existRes.rows.length > 0) {
      return res.status(400).json({ error: "Bu email zaten kayıtlı" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Tablo şemasına uygun: password_hash kolonu kullanılıyor
    const insertRes = await pool.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      [email, hashedPassword, role]
    );

    res
      .status(201)
      .json({ message: "Kullanıcı eklendi ✅", user: insertRes.rows[0] });
  } catch (err) {
    console.error("USER CREATE ERROR:", err);
    res.status(500).json({ error: "Ekleme hatası" });
  }
});

// KULLANICI GÜNCELLE
router.put(
  "/users/:id",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { email, password, role } = req.body;

      let query;
      let values;

      if (password && password.length >= 8) {
        const bcrypt = require("bcrypt");
        const hashedPassword = await bcrypt.hash(password, 10);

        query = `
          UPDATE users
          SET email = $1,
              password_hash = $2,
              role = $3
          WHERE id = $4
          RETURNING id, email, role
        `;

        values = [email, hashedPassword, role, id];
      } else {
        // Şifre değiştirilmez
        query = `
          UPDATE users
          SET email = $1,
              role = $2
          WHERE id = $3
          RETURNING id, email, role
        `;

        values = [email, role, id];
      }

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }

      res.json({ message: "Güncellendi ✅", user: result.rows[0] });

    } catch (err) {
      console.error("UPDATE ERROR:", err);
      res.status(500).json({ error: "Güncelleme hatası ❌" });
    }
  }
);
/* ===============================
   İSTATİSTİKLER
================================= */
router.get(
  "/stats",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const totalRes = await pool.query(
        "SELECT COUNT(*) FROM users"
      );

      const adminRes = await pool.query(
        "SELECT COUNT(*) FROM users WHERE role = 'admin'"
      );

      const instructorRes = await pool.query(
        "SELECT COUNT(*) FROM users WHERE role = 'instructor'"
      );

      const studentRes = await pool.query(
        "SELECT COUNT(*) FROM users WHERE role = 'student'"
      );

      res.json({
        totalUsers: parseInt(totalRes.rows[0].count),
        adminCount: parseInt(adminRes.rows[0].count),
        instructorCount: parseInt(instructorRes.rows[0].count),
        studentCount: parseInt(studentRes.rows[0].count),
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "İstatistik hatası ❌" });
    }
  }
);

const LESSON_DURATION_MINUTES = 40;
const MAX_LESSONS_PER_STUDENT = 8;

/* ===============================
   DERS SLOTLARI (40 dk, saat cinsi)
================================= */
router.get(
  "/schedules/slots",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const slots = await pool.query(
        "SELECT id, start_time, duration_minutes FROM lesson_slots ORDER BY start_time"
      );
      res.json({ slots: slots.rows });
    } catch (err) {
      console.error("SLOTS ERROR:", err);
      res.status(500).json({ error: "Slot listesi hatası ❌" });
    }
  }
);

/* ===============================
   DİREKSİYON DERS PROGRAMLARI (ADMIN CRUD)
================================= */
router.get(
  "/schedules",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const result = await pool.query(
        `
        SELECT
          dl.*,
          s.email AS student_email,
          i.email AS instructor_email
        FROM driving_lessons dl
        JOIN users s ON s.id = dl.student_id
        JOIN users i ON i.id = dl.instructor_id
        ORDER BY dl.start_at DESC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      );

      const countRes = await pool.query("SELECT COUNT(*) FROM driving_lessons");

      res.json({
        lessons: result.rows,
        page,
        totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit),
      });
    } catch (err) {
      console.error("ADMIN SCHEDULE LIST ERROR:", err);
      res.status(500).json({ error: "Program listesi hatası ❌" });
    }
  }
);

router.post(
  "/schedules",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { studentId, instructorId, date, slotId, location, notes } =
        req.body;

      const sId = Number(studentId);
      const iId = Number(instructorId);
      const slotIdNum = Number(slotId);
      if (!Number.isInteger(sId) || !Number.isInteger(iId)) {
        return res.status(400).json({ error: "Öğrenci/eğitmen hatalı ❌" });
      }
      if (!date || !Number.isInteger(slotIdNum)) {
        return res.status(400).json({ error: "Tarih ve slot zorunlu ❌" });
      }

      const roleCheck = await pool.query(
        "SELECT id, role FROM users WHERE id IN ($1, $2)",
        [sId, iId]
      );
      const roles = new Map(roleCheck.rows.map((r) => [r.id, r.role]));
      if (!roles.has(sId) || !roles.has(iId)) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı ❌" });
      }
      if (roles.get(sId) !== "student") {
        return res.status(400).json({ error: "Öğrenci rolü yanlış ❌" });
      }
      if (roles.get(iId) !== "instructor") {
        return res.status(400).json({ error: "Eğitmen rolü yanlış ❌" });
      }

      const slotRes = await pool.query(
        "SELECT start_time FROM lesson_slots WHERE id = $1",
        [slotIdNum]
      );
      if (slotRes.rows.length === 0) {
        return res.status(400).json({ error: "Geçersiz slot ❌" });
      }
      const timeStr = String(slotRes.rows[0].start_time).slice(0, 5);
      const startAt = `${date}T${timeStr}:00`;

      const countRes = await pool.query(
        `SELECT COUNT(*) AS cnt FROM driving_lessons WHERE student_id = $1 AND status != 'cancelled'`,
        [sId]
      );
      if (parseInt(countRes.rows[0].cnt) >= MAX_LESSONS_PER_STUDENT) {
        return res.status(400).json({
          error: `Bir öğrenci en fazla ${MAX_LESSONS_PER_STUDENT} ders alabilir ❌`,
        });
      }

      const startAtTs = new Date(startAt);
      const endAtTs = new Date(startAtTs.getTime() + LESSON_DURATION_MINUTES * 60 * 1000);
      const endAt = endAtTs.toISOString().slice(0, 19).replace("T", " ");

      const conflictRes = await pool.query(
        `
        SELECT id FROM driving_lessons
        WHERE status != 'cancelled'
          AND (instructor_id = $1 OR student_id = $2)
          AND start_at < $4::timestamptz AND end_at > $3::timestamptz
        `,
        [iId, sId, startAt, endAtTs.toISOString()]
      );
      if (conflictRes.rows.length > 0) {
        return res.status(400).json({ error: "Bu saatte çakışan ders var (eğitmen veya öğrenci meşgul) ❌" });
      }

      const insertRes = await pool.query(
        `
        INSERT INTO driving_lessons (student_id, instructor_id, start_at, end_at, location, notes)
        VALUES ($1, $2, $3::timestamptz, $4::timestamptz, $5, $6)
        RETURNING *
        `,
        [sId, iId, startAt, endAtTs.toISOString(), location || null, notes || null]
      );

      res.status(201).json({ message: "Program eklendi ✅", lesson: insertRes.rows[0] });
    } catch (err) {
      console.error("ADMIN SCHEDULE CREATE ERROR:", err);
      res.status(500).json({ error: "Program ekleme hatası ❌" });
    }
  }
);

router.put(
  "/schedules/:id",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const lessonId = Number(req.params.id);
      if (!Number.isInteger(lessonId)) {
        return res.status(400).json({ error: "Geçersiz program ❌" });
      }

      const { studentId, instructorId, date, slotId, location, notes, status } =
        req.body;

      const sId = Number(studentId);
      const iId = Number(instructorId);
      const slotIdNum = date && slotId != null ? Number(slotId) : null;
      if (!Number.isInteger(sId) || !Number.isInteger(iId)) {
        return res.status(400).json({ error: "Öğrenci/eğitmen hatalı ❌" });
      }
      if (!date || !Number.isInteger(slotIdNum)) {
        return res.status(400).json({ error: "Tarih ve slot zorunlu ❌" });
      }

      const roleCheck = await pool.query(
        "SELECT id, role FROM users WHERE id IN ($1, $2)",
        [sId, iId]
      );
      const roles = new Map(roleCheck.rows.map((r) => [r.id, r.role]));
      if (!roles.has(sId) || !roles.has(iId)) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı ❌" });
      }
      if (roles.get(sId) !== "student") {
        return res.status(400).json({ error: "Öğrenci rolü yanlış ❌" });
      }
      if (roles.get(iId) !== "instructor") {
        return res.status(400).json({ error: "Eğitmen rolü yanlış ❌" });
      }

      const allowedStatus = ["scheduled", "done", "cancelled"];
      const st = status ? String(status) : "scheduled";
      if (!allowedStatus.includes(st)) {
        return res.status(400).json({ error: "Geçersiz status ❌" });
      }

      const slotRes = await pool.query(
        "SELECT start_time FROM lesson_slots WHERE id = $1",
        [slotIdNum]
      );
      if (slotRes.rows.length === 0) {
        return res.status(400).json({ error: "Geçersiz slot ❌" });
      }
      const timeStr = String(slotRes.rows[0].start_time).slice(0, 5);
      const startAt = `${date}T${timeStr}:00`;
      const startAtTs = new Date(startAt);
      const endAtTs = new Date(startAtTs.getTime() + LESSON_DURATION_MINUTES * 60 * 1000);

      const countRes = await pool.query(
        `SELECT COUNT(*) AS cnt FROM driving_lessons WHERE student_id = $1 AND status != 'cancelled' AND id != $2`,
        [sId, lessonId]
      );
      if (parseInt(countRes.rows[0].cnt) >= MAX_LESSONS_PER_STUDENT) {
        return res.status(400).json({
          error: `Bir öğrenci en fazla ${MAX_LESSONS_PER_STUDENT} ders alabilir ❌`,
        });
      }

      const conflictRes = await pool.query(
        `
        SELECT id FROM driving_lessons
        WHERE status != 'cancelled' AND id != $1
          AND (instructor_id = $2 OR student_id = $3)
          AND start_at < $5::timestamptz AND end_at > $4::timestamptz
        `,
        [lessonId, iId, sId, startAt, endAtTs.toISOString()]
      );
      if (conflictRes.rows.length > 0) {
        return res.status(400).json({ error: "Bu saatte çakışan ders var ❌" });
      }

      const updateRes = await pool.query(
        `
        UPDATE driving_lessons
        SET student_id = $1,
            instructor_id = $2,
            start_at = $3::timestamptz,
            end_at = $4::timestamptz,
            location = $5,
            notes = $6,
            status = $7,
            updated_at = now()
        WHERE id = $8
        RETURNING *
        `,
        [sId, iId, startAt, endAtTs.toISOString(), location || null, notes || null, st, lessonId]
      );

      if (updateRes.rows.length === 0) {
        return res.status(404).json({ error: "Program bulunamadı ❌" });
      }

      res.json({ message: "Program güncellendi ✅", lesson: updateRes.rows[0] });
    } catch (err) {
      console.error("ADMIN SCHEDULE UPDATE ERROR:", err);
      res.status(500).json({ error: "Program güncelleme hatası ❌" });
    }
  }
);

router.delete(
  "/schedules/:id",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const lessonId = Number(req.params.id);
      if (!Number.isInteger(lessonId)) {
        return res.status(400).json({ error: "Geçersiz program ❌" });
      }

      const delRes = await pool.query(
        "DELETE FROM driving_lessons WHERE id = $1 RETURNING id",
        [lessonId]
      );
      if (delRes.rows.length === 0) {
        return res.status(404).json({ error: "Program bulunamadı ❌" });
      }

      res.json({ message: "Program silindi ✅" });
    } catch (err) {
      console.error("ADMIN SCHEDULE DELETE ERROR:", err);
      res.status(500).json({ error: "Program silme hatası ❌" });
    }
  }
);



module.exports = router;