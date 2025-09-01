import { verifyJwt } from "../utils/jwt.js";

export default function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = verifyJwt(token);
    req.user = decoded; // { uid, email, name }
    return next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
