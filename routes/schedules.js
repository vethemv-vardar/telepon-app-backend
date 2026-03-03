const express = require("express");
const router = express.Router();
const pool = require("../config/database");

const { authenticateToken } = require("../middleware/auth");

// Admin hariç kullanıcılar kendi programını görsün:
// - student: student_id = me
// - instructor: instructor_id = me
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId || !role) {
      return res.status(401).json({ error: "Token gerekli ❌" });
    }

    if (role === "admin") {
      return res.status(403).json({ error: "Admin için bu endpoint yok ❌" });
    }

    const where =
      role === "student"
        ? "dl.student_id = $1"
        : role === "instructor"
          ? "dl.instructor_id = $1"
          : null;

    if (!where) {
      return res.status(400).json({ error: "Geçersiz rol ❌" });
    }

    const result = await pool.query(
      `
      SELECT
        dl.*,
        s.email AS student_email,
        i.email AS instructor_email
      FROM driving_lessons dl
      JOIN users s ON s.id = dl.student_id
      JOIN users i ON i.id = dl.instructor_id
      WHERE ${where}
      ORDER BY dl.start_at DESC
      `,
      [userId]
    );

    res.json({ lessons: result.rows });
  } catch (err) {
    console.error("SCHEDULE ME ERROR:", err);
    res.status(500).json({ error: "Program çekme hatası ❌" });
  }
});

module.exports = router;
