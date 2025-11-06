const mqttClient = require("../config/mqtt");
const logger = require("../utils/logger");

class MQTTService {
    static subscribeToTopic(topic, callback) {
        try {
            mqttClient.subscribe(topic, callback);
            logger.info("Service: Subscribed to MQTT topic", { topic });
            return true;
        } catch (error) {
            logger.error("Service: Failed to subscribe to MQTT topic", error);
            throw new Error("Failed to subscribe to topic");
        }
    }

    static unsubscribeFromTopic(topic) {
        try {
            mqttClient.unsubscribe(topic);
            logger.info("Service: Unsubscribed from MQTT topic", { topic });
            return true;
        } catch (error) {
            logger.error("Service: Failed to unsubscribe from MQTT topic", error);
            throw new Error("Failed to unsubscribe from topic");
        }
    }

    static async publishMessage(topic, message, options = {}) {
        try {
            await mqttClient.publish(topic, message, options);
            logger.info("Service: Published message to MQTT topic", { topic, message });
            return true;
        } catch (error) {
            logger.error("Service: Failed to publish MQTT message", error);
            throw new Error("Failed to publish message");
        }
    }

    static getConnectionStatus() {
        return mqttClient.getStatus();
    }
}

module.exports = MQTTService;
