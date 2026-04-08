const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/activityController");

router.get("/", ctrl.getAll);
router.post("/estimate", ctrl.estimate);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;
