const express = require("express");
const { login } = require("../controllers/authController");
const { requireAuth, allowRoles } = require("../middleware/auth");

const router = express.Router();
router.post("/login", login);

router.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));
router.get("/admin-only", requireAuth, allowRoles("Admin"), (req, res) =>
  res.json({ message: "Welcome, Admin" })
);

module.exports = router;