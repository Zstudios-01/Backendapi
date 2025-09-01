import { db } from "../firebase.js";

const { DAILY_QUOTA = 1000 } = process.env;

export default async function requireApiKey(req, res, next) {
  try {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) return res.status(401).json({ error: "Missing x-api-key" });

    const idxSnap = await db.ref(`/apikeyIndex/${apiKey}`).get();
    if (!idxSnap.exists()) return res.status(401).json({ error: "Invalid API key" });

    const { uid, keyId } = idxSnap.val();
    const keySnap = await db.ref(`/apikeys/${uid}/${keyId}`).get();
    const keyData = keySnap.val();

    if (!keyData || keyData.active === false) {
      return res.status(403).json({ error: "API key revoked" });
    }

    // Quota check
    const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const usageRef = db.ref(`/usage/${apiKey}/${dateStr}`);
    const usageSnap = await usageRef.get();
    const count = usageSnap.exists() ? usageSnap.val().count || 0 : 0;

    if (count >= Number(DAILY_QUOTA)) {
      return res.status(429).json({ error: "Daily quota exceeded" });
    }

    await usageRef.set({ count: count + 1 });

    req.apiKey = { apiKey, uid, keyId };
    return next();
  } catch (e) {
    return res.status(500).json({ error: "API key validation failed" });
  }
}
