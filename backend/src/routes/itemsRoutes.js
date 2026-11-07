const express = require("express");
const c = require("../controllers/itemsController");
const { requireAuth, allowRoles } = require("../middleware/auth");

const router = express.Router();
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

router.use(requireAuth);

router.get("/", wrap(c.getItems));
router.get("/low-stock", wrap(c.getLowStock)); // must be before /:id routes
router.post("/", allowRoles("Admin", "Manager"), wrap(c.createItem));
router.put("/:id", allowRoles("Admin", "Manager"), wrap(c.updateItem));
router.put("/:id/stock", wrap(c.changeItemStock));   // all roles
router.get("/:id/history", wrap(c.getHistory));      // all roles
module.exports = router;