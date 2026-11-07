const express = require("express");
const c = require("../controllers/productionController");
const { requireAuth, allowRoles } = require("../middleware/auth");

const router = express.Router();
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

router.use(requireAuth);

router.get("/", wrap(c.getProduction));                                        // all roles
router.get("/:id", wrap(c.getProductionOne));                                  // all roles
router.post("/", allowRoles("Admin", "Manager"), wrap(c.createProduction));
router.put("/:id/status", wrap(c.updateProductionStatus));                     // all roles

module.exports = router;