import express from "express";
import { db, nowTs } from "../firebase.js";
import requireAuth from "../middlewares/requireAuth.js";
import { nanoid } from "nanoid";

const router = express.Router();

// Generate new API key
router.post("/generate", requireAuth, async (req, res) => {
  const { uid } = req.user;
  const keyId = db.ref(`/apikeys/${uid}`).push().key;
  const apiKey = nanoid(32);
  const createdAt = nowTs();

  await db.ref(`/apikeys/${uid}/${keyId}`).set({ apiKey, createdAt, active: true });
  await db.ref(`/apikeyIndex/${apiKey}`).set({ uid, keyId });

  return res.json({ keyId, apiKey, createdAt });
});

// List API keys
router.get("/list", requireAuth, async (req, res) => {
  const { uid } = req.user;
  const snap = await db.ref(`/apikeys/${uid}`).get();
  return res.json(snap.val() || {});
});

// Delete/revoke API key
router.delete("/:id", requireAuth, async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;
  const keySnap = await db.ref(`/apikeys/${uid}/${id}`).get();
  if (!keySnap.exists()) return res.status(404).json({ error: "Key not found" });

  const keyData = keySnap.val();
  await db.ref(`/apikeys/${uid}/${id}/active`).set(false);
  await db.ref(`/apikeyIndex/${keyData.apiKey}`).remove();

  return res.json({ success: true });
});

export default router;
