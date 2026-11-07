const express = require("express");
const c = require("../controllers/ordersController");
const { requireAuth, allowRoles } = require("../middleware/auth");

const router = express.Router();
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

router.use(requireAuth, allowRoles("Admin", "Manager"));

router.get("/", wrap(c.getOrders));
router.post("/", wrap(c.createOrder));
router.put("/:id/status", wrap(c.updateOrderStatus));
router.get("/:id/timeline", wrap(c.getTimeline));
module.exports = router;