const MQTTService = require("../services/mqtt.service");
const mqttValidator = require("../validators/mqtt.validator");
const ApiResponse = require("../utils/apiResponse");
const logger = require("../utils/logger");
const { HTTP_STATUS } = require("../config/constants");

// Store for received messages (in-memory, you can use Redis in production)
const messageStore = new Map();

class MQTTController {
    // Subscribe to a topic
    static async subscribe(req, res) {
        try {
            const { error } = mqttValidator.subscribe(req.body);
            if (error) {
                return ApiResponse.error(res, "Data tidak valid", HTTP_STATUS.BAD_REQUEST, error.details[0].message);
            }

            const { topic } = req.body;

            // Define callback for received messages
            const callback = (receivedTopic, message) => {
                // Store message in memory
                if (!messageStore.has(receivedTopic)) {
                    messageStore.set(receivedTopic, []);
                }

                const messages = messageStore.get(receivedTopic);
                messages.push({
                    message,
                    timestamp: new Date().toISOString(),
                });

                // Keep only last 100 messages per topic
                if (messages.length > 100) {
                    messages.shift();
                }

                logger.info("Message stored from topic:", { topic: receivedTopic, message });
            };

            MQTTService.subscribeToTopic(topic, callback);

            return ApiResponse.success(res, { topic }, `Berhasil subscribe ke topic: ${topic}`);
        } catch (error) {
            logger.error("Subscribe error", error);
            return ApiResponse.error(res, "Gagal subscribe ke topic", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    // Unsubscribe from a topic
    static async unsubscribe(req, res) {
        try {
            const { error } = mqttValidator.subscribe(req.body);
            if (error) {
                return ApiResponse.error(res, "Data tidak valid", HTTP_STATUS.BAD_REQUEST, error.details[0].message);
            }

            const { topic } = req.body;

            MQTTService.unsubscribeFromTopic(topic);

            // Clear stored messages for this topic
            messageStore.delete(topic);

            return ApiResponse.success(res, { topic }, `Berhasil unsubscribe dari topic: ${topic}`);
        } catch (error) {
            logger.error("Unsubscribe error", error);
            return ApiResponse.error(res, "Gagal unsubscribe dari topic", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    // Publish message to a topic
    static async publish(req, res) {
        try {
            const { error } = mqttValidator.publish(req.body);
            if (error) {
                return ApiResponse.error(res, "Data tidak valid", HTTP_STATUS.BAD_REQUEST, error.details[0].message);
            }

            const { topic, message, qos, retain } = req.body;

            await MQTTService.publishMessage(topic, message, { qos, retain });

            return ApiResponse.success(res, { topic, message }, "Pesan berhasil dipublikasikan");
        } catch (error) {
            logger.error("Publish error", error);
            return ApiResponse.error(res, "Gagal mempublikasikan pesan", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    // Get messages from a subscribed topic
    static async getMessages(req, res) {
        try {
            const { topic } = req.params;

            if (!topic) {
                return ApiResponse.error(res, "Topic tidak boleh kosong", HTTP_STATUS.BAD_REQUEST);
            }

            const messages = messageStore.get(topic) || [];

            return ApiResponse.success(res, { topic, messages, count: messages.length }, "Berhasil mengambil pesan");
        } catch (error) {
            logger.error("Get messages error", error);
            return ApiResponse.error(res, "Gagal mengambil pesan", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    // Get MQTT connection status
    static async getStatus(req, res) {
        try {
            const status = MQTTService.getConnectionStatus();

            return ApiResponse.success(res, status, "Status koneksi MQTT berhasil diambil");
        } catch (error) {
            logger.error("Get status error", error);
            return ApiResponse.error(res, "Gagal mengambil status koneksi", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    // Clear all messages from a topic
    static async clearMessages(req, res) {
        try {
            const { topic } = req.params;

            if (!topic) {
                return ApiResponse.error(res, "Topic tidak boleh kosong", HTTP_STATUS.BAD_REQUEST);
            }

            messageStore.delete(topic);

            return ApiResponse.success(res, { topic }, "Pesan berhasil dihapus");
        } catch (error) {
            logger.error("Clear messages error", error);
            return ApiResponse.error(res, "Gagal menghapus pesan", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = MQTTController;
