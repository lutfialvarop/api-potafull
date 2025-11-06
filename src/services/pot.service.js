const { PotModel, DetailPotModel, TypePotModel } = require("../models/pot.model");
const mqttClient = require("../config/mqtt");
const logger = require("../utils/logger");

// Optimal parameters for soil health calculation
const OPTIMAL = {
    ph: 6.2,
    moisture: 67,
    n: 40,
    p: 15,
    k: 180,
    ec: 1.8,
};

class PotService {
    // Calculate soil health based on the formula from image
    static calculateSoilHealth(sensorData) {
        const { ph, moisture, n, p, k, conductivity } = sensorData;

        // Formula: 1 - ((|pH-opt| / opt) + (|Hum-opt| / opt) + ... ) × 100%
        const phDiff = Math.abs(ph - OPTIMAL.ph) / OPTIMAL.ph;
        const moistureDiff = Math.abs(moisture - OPTIMAL.moisture) / OPTIMAL.moisture;
        const nDiff = Math.abs(n - OPTIMAL.n) / OPTIMAL.n;
        const pDiff = Math.abs(p - OPTIMAL.p) / OPTIMAL.p;
        const kDiff = Math.abs(k - OPTIMAL.k) / OPTIMAL.k;
        const ecDiff = Math.abs(conductivity - OPTIMAL.ec) / OPTIMAL.ec;

        const totalDiff = phDiff + moistureDiff + nDiff + pDiff + kDiff + ecDiff;
        const soilHealth = (1 - totalDiff / 6) * 100;

        // Ensure soil health is between 0 and 100
        return Math.max(0, Math.min(100, soilHealth));
    }

    static async addPot(userId, potData) {
        const { pot_id, type_pot_id } = potData;

        // Check if pot_id already exists
        const existingPot = await PotModel.findById(pot_id);
        if (existingPot) {
            throw new Error("Pot ID sudah terdaftar");
        }

        // Check if type_pot exists
        const typePot = await TypePotModel.findById(type_pot_id);
        if (!typePot) {
            throw new Error("Tipe pot tidak ditemukan");
        }

        // Create pot
        const pot = await PotModel.create({
            id: pot_id,
            user_id: userId,
            type_pot_id,
        });

        logger.info("Pot added successfully", { potId: pot_id, userId });

        return {
            pot_id: pot.id,
            type_pot_id: pot.type_pot_id,
            type_name: typePot.name,
            max_water: typePot.max_water,
            created_at: pot.created_at,
        };
    }

    static async getUserPots(userId) {
        const pots = await PotModel.findByUserId(userId);

        // Get latest data for each pot
        const potsWithData = await Promise.all(
            pots.map(async (pot) => {
                const latestData = await DetailPotModel.getLatestByPotId(pot.id);

                return {
                    pot_id: pot.id,
                    type_name: pot.type_name,
                    max_water: pot.max_water,
                    soil_health: latestData ? latestData.soil_health : null,
                    last_update: latestData ? latestData.created_at : null,
                };
            })
        );

        return potsWithData;
    }

    static async getPotDetail(userId, potId) {
        // Check if pot belongs to user
        const pot = await PotModel.findByIdAndUserId(potId, userId);
        if (!pot) {
            throw new Error("Pot tidak ditemukan atau bukan milik Anda");
        }

        // Get latest sensor data
        const latestData = await DetailPotModel.getLatestByPotId(potId);
        if (!latestData) {
            throw new Error("Belum ada data sensor untuk pot ini");
        }

        return {
            pot_id: pot.id,
            type_name: pot.type_name,
            max_water: pot.max_water,
            sensor_data: {
                n: latestData.n,
                p: latestData.p,
                k: latestData.k,
                temperature: latestData.temperature,
                moisture: latestData.moisture,
                ph: latestData.ph,
                salinity: latestData.salinity,
                conductivity: latestData.conductivity,
                water_level: latestData.water_level,
                soil_health: latestData.soil_health,
            },
            timestamp: latestData.created_at,
        };
    }

    static async wateringControl(userId, potId) {
        try {
            // Check if pot belongs to user
            const pot = await PotModel.findByIdAndUserId(potId, userId);
            if (!pot) {
                throw new Error("Pot tidak ditemukan atau bukan milik Anda");
            }

            // Publish to MQTT
            const topic = `potafull/${potId}/control`;
            const message = { watering: "ON" };

            // Get MQTT client instance
            const mqtt = require("../config/mqtt");

            // Ensure client is connected
            if (!mqtt.isConnected) {
                throw new Error("MQTT client is not connected");
            }

            // Publish using the client's publish method with Promise
            await new Promise((resolve, reject) => {
                mqtt.client.publish(topic, JSON.stringify(message), { qos: 2 }, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            logger.info("Watering control published", { userId, potId });

            return {
                pot_id: potId,
                action: "watering",
                status: "sent",
            };
        } catch (error) {
            logger.error("Failed to publish watering control", { error: error.message });
            throw new Error("Gagal mengirim perintah penyiraman");
        }
    }

    static async saveSensorData(potId, sensorData) {
        try {
            // Check if pot exists
            const pot = await PotModel.findById(potId);
            if (!pot) {
                logger.warn("Pot not found, ignoring data", { potId });
                return null;
            }

            logger.info("Saving sensor data", { potId, sensorData });
            // Calculate soil health - Fixed by using PotService instead of this
            const soilHealth = PotService.calculateSoilHealth(sensorData);

            // Save to database
            const detailData = {
                pot_id: potId,
                n: sensorData.n,
                p: sensorData.p,
                k: sensorData.k,
                temperature: sensorData.temperature,
                moisture: sensorData.moisture,
                ph: sensorData.ph,
                salinity: sensorData.salinity,
                conductivity: sensorData.conductivity,
                water_level: sensorData.water_level,
                soil_health: soilHealth,
            };

            const savedData = await DetailPotModel.create(detailData);
            logger.info("Sensor data saved", { potId, soilHealth });

            return savedData;
        } catch (error) {
            logger.error("Error saving sensor data", { potId, error: error.message });
            throw error;
        }
    }

    static async getTypePots() {
        return await TypePotModel.findAll();
    }
}

module.exports = PotService;
