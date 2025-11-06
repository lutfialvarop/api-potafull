const mqtt = require("mqtt");
const logger = require("../utils/logger");
const { saveSensorData } = require("../services/pot.service");

class MQTTClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.subscriptions = new Map();
    }

    connect() {
        const options = {
            clientId: process.env.MQTT_CLIENT_ID || "express-api-" + Math.random().toString(16).substr(2, 8),
            clean: true,
            connectTimeout: 4000,
            reconnectPeriod: 1000,
        };

        // Add username and password if provided
        if (process.env.MQTT_USERNAME) {
            options.username = process.env.MQTT_USERNAME;
        }
        if (process.env.MQTT_PASSWORD) {
            options.password = process.env.MQTT_PASSWORD;
        }

        const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com";

        logger.info("Connecting to MQTT broker...", { broker: brokerUrl });

        this.client = mqtt.connect(brokerUrl, options);

        this.client.on("connect", () => {
            this.isConnected = true;
            logger.info("✅ MQTT Connected successfully");

            // Resubscribe to topics after reconnect
            this.subscriptions.forEach((callback, topic) => {
                this.subscribe(topic, callback);
            });
        });

        this.client.on("error", (error) => {
            logger.error("❌ MQTT Connection error:", error);
            this.isConnected = false;
        });

        this.client.on("offline", () => {
            logger.warn("⚠️ MQTT Client offline");
            this.isConnected = false;
        });

        this.client.on("reconnect", () => {
            logger.info("🔄 MQTT Reconnecting...");
        });

        // ...existing code...

        this.client.on("message", (topic, message) => {
            try {
                const potId = topic.split("/")[1]; // Get potId from topic
                let sensorData = message.toString();

                logger.info("📩 MQTT Message received", { potId, message: sensorData });

                try {
                    sensorData = JSON.parse(sensorData);
                    logger.info("Parsed sensor data", { potId, sensorData });
                    saveSensorData(potId, sensorData);
                } catch (error) {
                    logger.error("Error parsing sensor data:", error);
                }

                // Call registered callback for this topic
                const callback = this.subscriptions.get(topic);
                if (callback) {
                    callback(potId, sensorData);
                }
            } catch (error) {
                logger.error("Error processing MQTT message:", error);
            }
        });

        return this;
    }

    subscribe(topic, callback) {
        if (!this.client) {
            logger.error("MQTT client not initialized");
            return false;
        }

        this.client.subscribe(topic, { qos: 1 }, (error) => {
            if (error) {
                logger.error("❌ MQTT Subscribe error:", { topic, error });
            } else {
                logger.info("✅ MQTT Subscribed to topic:", topic);
                this.subscriptions.set(topic, callback);
            }
        });

        return true;
    }

    unsubscribe(topic) {
        if (!this.client) {
            logger.error("MQTT client not initialized");
            return false;
        }

        this.client.unsubscribe(topic, (error) => {
            if (error) {
                logger.error("❌ MQTT Unsubscribe error:", { topic, error });
            } else {
                logger.info("✅ MQTT Unsubscribed from topic:", topic);
                this.subscriptions.delete(topic);
            }
        });

        return true;
    }

    publish(topic, message, options = {}) {
        return new Promise((resolve, reject) => {
            if (!this.client || !this.isConnected) {
                const error = "MQTT client not connected";
                logger.error(error);
                return reject(new Error(error));
            }

            const payload = typeof message === "object" ? JSON.stringify(message) : message.toString();

            const publishOptions = {
                qos: options.qos || 1,
                retain: options.retain || false,
            };

            this.client.publish(topic, payload, publishOptions, (error) => {
                if (error) {
                    logger.error("❌ MQTT Publish error:", { topic, error });
                    reject(error);
                } else {
                    logger.info("✅ MQTT Message published", { topic, payload });
                    resolve();
                }
            });
        });
    }

    disconnect() {
        if (this.client) {
            this.client.end();
            this.isConnected = false;
            logger.info("MQTT Client disconnected");
        }
    }

    getStatus() {
        return {
            connected: this.isConnected,
            subscriptions: Array.from(this.subscriptions.keys()),
        };
    }
}

// Create singleton instance
const mqttClient = new MQTTClient();

module.exports = mqttClient;
