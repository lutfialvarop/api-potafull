const express = require("express");
const PotController = require("../controllers/pot.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// All pot routes are protected
router.use(authMiddleware);

// Get type pots (available pot types)
router.get("/types", PotController.getTypePots);

// Get all user's pots with latest data
router.get("/", PotController.getMyPots);

router.get("/hydration", PotController.getAllHydrationPots);

// Add new pot
router.post("/add", PotController.addPot);

// Get specific pot detail data
router.get("/:pot_id/data", PotController.getPotData);

// Control watering
router.post("/:pot_id/watering", PotController.watering);

module.exports = router;
