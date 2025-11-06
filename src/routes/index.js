const express = require("express");
const authRoutes = require("./auth.routes");
const mqttRoutes = require("./mqtt.routes");
const potRoutes = require("./pot.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/mqtt", mqttRoutes);
router.use("/mypot", potRoutes);

// Health check
router.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

module.exports = router;
