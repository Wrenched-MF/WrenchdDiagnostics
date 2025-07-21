import { Router } from "express";

const router = Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  // 🧪 Mock authentication logic
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Simulated successful login
  return res.json({
    user: {
      id: 1,
      name: "Luke Preece",
      email,
    },
    token: "mock-token-123", // 🔐 optional fake token
  });
});

export default router;
