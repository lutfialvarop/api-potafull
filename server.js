const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

require("dotenv").config();
const app = require("./src/app");
const mqttClient = require("./src/config/mqtt");
const PotService = require("./src/services/pot.service");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 3000;

// Connect to MQTT broker
mqttClient.connect();

// Subscribe to all pot data topics using wildcard
// Topic pattern: potafull/+/data (+ is wildcard for any pot_id)
mqttClient.subscribe("potafull/+/data", async (topic, message) => {
    try {
        // Extract pot_id from topic: potafull/{pot_id}/data
        const topicParts = topic.split("/");
        const potId = topicParts[1];

        logger.info("Received sensor data from MQTT", { topic, potId });

        // Parse message
        const sensorData = JSON.parse(message);

        // Validate required fields
        const requiredFields = ["n", "p", "k", "temperature", "moisture", "ph", "salinity", "conductivity", "water_level"];
        const hasAllFields = requiredFields.every((field) => sensorData.hasOwnProperty(field));

        if (!hasAllFields) {
            logger.warn("Incomplete sensor data received", { potId, data: sensorData });
            return;
        }

        // Save sensor data to database
        await PotService.saveSensorData(potId, sensorData);

        logger.info("Sensor data saved to database", { potId });
    } catch (error) {
        logger.error("Error processing MQTT sensor data", { topic, error: error.message });
    }
});

logger.info("Subscribed to MQTT topic: potafull/+/data");

// Start Express server
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
    logger.info("Shutting down gracefully...");
    mqttClient.disconnect();
    process.exit(0);
});

process.on("SIGTERM", () => {
    logger.info("Shutting down gracefully...");
    mqttClient.disconnect();
    process.exit(0);
});
