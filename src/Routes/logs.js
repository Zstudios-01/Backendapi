import express from "express";
import { db } from "../firebase.js";
import requireAuth from "../middlewares/requireAuth.js";

const router = express.Router();

// GET /logs (with optional filters)
router.get("/", requireAuth, async (req, res) => {
  const { uid } = req.user;
  const { email, date } = req.query;

  const snap = await db.ref(`/logs/${uid}`).get();
  if (!snap.exists()) return res.json([]);

  let logs = Object.values(snap.val());
  if (email) logs = logs.filter((l) => l.email === email);
  if (date) logs = logs.filter((l) => new Date(l.timestamp).toISOString().startsWith(date));

  return res.json(logs);
});

export default router;
