const express = require("express");
const c = require("../controllers/reportsController");
const { requireAuth, allowRoles } = require("../middleware/auth");

const router = express.Router();
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

router.get("/summary", requireAuth, allowRoles("Admin", "Manager"), wrap(c.getSummary));

module.exports = router;