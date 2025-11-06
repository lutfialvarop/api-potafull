const express = require("express");
const MQTTController = require("../controllers/mqtt.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// All MQTT routes are protected (require authentication)
router.use(authMiddleware);

// Subscribe to a topic
router.post("/subscribe", MQTTController.subscribe);

// Unsubscribe from a topic
router.post("/unsubscribe", MQTTController.unsubscribe);

// Publish message to a topic
router.post("/publish", MQTTController.publish);

// Get messages from a topic
router.get("/messages/:topic", MQTTController.getMessages);

// Clear messages from a topic
router.delete("/messages/:topic", MQTTController.clearMessages);

// Get MQTT connection status
router.get("/status", MQTTController.getStatus);

module.exports = router;
