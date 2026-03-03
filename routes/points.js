//points.js
const express = require("express");
const router = express.Router();
const pool = require("../config/database");

const { authenticateToken } = require("../middleware/auth");

// Puan ver (student <-> instructor). Admin puan veremez, admin puan alamaz.
// Body: { toUserId: number, value: 1..5 }
router.post("/give", authenticateToken, async (req, res) => {
  try {
    const fromUserId = req.user?.id;
    const fromRole = req.user?.role;
    const { toUserId, value } = req.body;

    if (!fromUserId || !fromRole) {
      return res.status(401).json({ error: "Token gerekli ❌" });
    }

    if (fromRole === "admin") {
      return res.status(403).json({ error: "Admin puan veremez ❌" });
    }

    const toId = Number(toUserId);
    const v = Number(value);

    if (!Number.isInteger(toId) || !Number.isInteger(v)) {
      return res.status(400).json({ error: "Hatalı veri ❌" });
    }
    if (toId === fromUserId) {
      return res.status(400).json({ error: "Kendinize puan veremezsiniz ❌" });
    }
    if (v < 1 || v > 5) {
      return res.status(400).json({ error: "Puan 1-5 arası olmalı ❌" });
    }

    const toUserRes = await pool.query(
      "SELECT id, role FROM users WHERE id = $1",
      [toId]
    );
    if (toUserRes.rows.length === 0) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı ❌" });
    }

    const toRole = toUserRes.rows[0].role;

    if (toRole === "admin") {
      return res.status(403).json({ error: "Admin'e puan verilemez ❌" });
    }

    const allowed =
      (fromRole === "student" && toRole === "instructor") ||
      (fromRole === "instructor" && toRole === "student");

    if (!allowed) {
      return res.status(403).json({
        error: "Sadece öğrenci ↔ eğitmen arasında puan verilebilir ❌",
      });
    }

    // Aynı kişiye tekrar puan verirse güncelle (upsert)
    const upsertRes = await pool.query(
      `
      INSERT INTO user_points (from_user_id, to_user_id, value)
      VALUES ($1, $2, $3)
      ON CONFLICT (from_user_id, to_user_id)
      DO UPDATE SET value = EXCLUDED.value, updated_at = now()
      RETURNING id, from_user_id, to_user_id, value, updated_at
      `,
      [fromUserId, toId, v]
    );

    return res.status(200).json({
      message: "Puan kaydedildi ✅",
      point: upsertRes.rows[0],
    });
  } catch (err) {
    console.error("POINT GIVE ERROR:", err);
    return res.status(500).json({ error: "Puan kaydetme hatası ❌" });
  }
});

// Kullanıcının aldığı puan ortalaması/adet
router.get("/summary/:userId", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId)) {
      return res.status(400).json({ error: "Geçersiz kullanıcı ❌" });
    }

    const agg = await pool.query(
      `
      SELECT
        COALESCE(AVG(value), 0)::float AS avg,
        COUNT(*)::int AS count
      FROM user_points
      WHERE to_user_id = $1
      `,
      [userId]
    );

    res.json({
      userId,
      avg: agg.rows[0].avg,
      count: agg.rows[0].count,
    });
  } catch (err) {
    console.error("POINT SUMMARY ERROR:", err);
    res.status(500).json({ error: "Puan özet hatası ❌" });
  }
});

module.exports = router;
