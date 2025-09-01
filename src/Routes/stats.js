import express from "express";
import { db } from "../firebase.js";
import requireAuth from "../middlewares/requireAuth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const usersSnap = await db.ref("/users").get();
  const apikeysSnap = await db.ref("/apikeys").get();

  const totalUsers = usersSnap.exists() ? Object.keys(usersSnap.val()).length : 0;
  let activeKeys = 0;
  if (apikeysSnap.exists()) {
    Object.values(apikeysSnap.val()).forEach((userKeys) => {
      Object.values(userKeys).forEach((k) => {
        if (k.active) activeKeys++;
      });
    });
  }

  return res.json({ totalUsers, activeKeys });
});

export default router;
				