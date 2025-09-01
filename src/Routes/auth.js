import express from "express";
import bcrypt from "bcryptjs";
import { db, nowTs } from "../firebase.js";
import { signJwt } from "../utils/jwt.js";

const router = express.Router();

// POST /auth/signup
router.post("/signup", async (req, res) => {
  const { email, password, name = "" } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email & password required" });

  // Check existing
  const existingSnap = await db.ref("/users").orderByChild("email").equalTo(email).get();
  if (existingSnap.exists()) return res.status(409).json({ error: "Email already in use" });

  const uid = db.ref("/users").push().key;
  const passwordHash = await bcrypt.hash(password, 12);
  const createdAt = nowTs();

  await db.ref(`/users/${uid}`).set({ email, name, passwordHash, createdAt, lastLogin: null });

  const logId = db.ref(`/logs/${uid}`).push().key;
  await db.ref(`/logs/${uid}/${logId}`).set({
    action: "signup",
    email,
    timestamp: createdAt,
    ip: req.ip || req.headers["x-forwarded-for"] || null,
  });

  const token = signJwt({ uid, email, name });
  return res.json({ token, uid, email, name });
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email & password required" });

  const snap = await db.ref("/users").orderByChild("email").equalTo(email).get();
  if (!snap.exists()) return res.status(401).json({ error: "Invalid credentials" });

  let uid, user;
  snap.forEach((s) => {
    uid = s.key;
    user = s.val();
  });

  const ok = await bcrypt.compare(password, user.passwordHash || "");
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signJwt({ uid, email: user.email, name: user.name || "" });
  const now = nowTs();

  await db.ref(`/users/${uid}/lastLogin`).set(now);

  const logId = db.ref(`/logs/${uid}`).push().key;
  await db.ref(`/logs/${uid}/${logId}`).set({
    action: "login",
    email,
    timestamp: now,
    ip: req.ip || req.headers["x-forwarded-for"] || null,
  });

  return res.json({ token, uid, email: user.email, name: user.name || "" });
});

export default router;
