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

const CONDITION = {
    SAFE: 67,
    WARNING: 34,
    URGENT: 0,
    MAX: 100,
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
        const soilHealth = Math.round((1 - totalDiff / 6) * 10000) / 100;

        // Ensure soil health is between 0 and 100
        return Math.max(0, Math.min(100, soilHealth));
    }

    static calculateSoilHydration(data) {
        const { ph, moisture } = data;

        // Formula: ((Current Moisture / Optimal Moisture) + (Optimal pH / Current pH)) × 50%
        const moistureHydration = moisture / OPTIMAL.moisture;
        const phHydration = OPTIMAL.ph / ph;
        const totalHydration = (moistureHydration + phHydration) * 50;

        // Ensure soil hydration is between 0 and 100
        return Math.max(0, Math.min(100, totalHydration));
    }

    static async getAllHydrationPots(UserId) {
        try {
            const data = await PotModel.findByUserId(UserId);

            const resultHydration = data.map((pot) => {
                const soilHydration = PotService.calculateSoilHydration(pot);

                if (soilHydration > CONDITION.SAFE && soilHydration <= CONDITION.MAX) {
                    pot.condition = "SAFE";
                } else if (soilHydration > CONDITION.WARNING && soilHydration <= CONDITION.SAFE) {
                    pot.condition = "WARNING";
                } else {
                    pot.condition = "URGENT";
                }

                pot.soil_hydration = soilHydration || 0;

                return pot;
            });

            resultHydration.sort((a, b) => b.soil_hydration - a.soil_hydration);

            return resultHydration;
        } catch (error) {
            logger.error("Error getting hydration pots", { error: error.message });
            throw error;
        }
    }

    static async addPot(userId, potData) {
        const { pot_id } = potData;

        // Check if pot_id already exists
        const existingPot = await PotModel.findById(pot_id);
        if (!existingPot["type_pot_id"]) {
            throw new Error("Pot ID tidak ditemukan");
        }

        if (existingPot["user_id"]) {
            throw new Error("Pot ID sudah terdaftar");
        }

        // Update pot
        const pot = await PotModel.update(pot_id, userId);
        if (!pot) {
            throw new Error("Gagal menambahkan pot. Pastikan Pot ID benar.");
        }

        const typePot = await TypePotModel.findById(pot.type_pot_id);
        if (!typePot) {
            throw new Error("Pot ID tidak ditemukan");
        }

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
                    soil_health: latestData ? latestData.soil_health : 0,
                    last_update: latestData ? latestData.created_at : new Date(),
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

        const sensorData = {
            n: 0,
            p: 0,
            k: 0,
            temperature: 0,
            moisture: 0,
            ph: 0,
            salinity: 0,
            conductivity: 0,
            water_level: 0,
            soil_health: 0,
        };

        if (latestData) {
            Object.keys(sensorData).forEach((key) => {
                sensorData[key] = latestData[key];
            });
        }

        return {
            pot_id: pot.id,
            type_name: pot.type_name,
            max_water: pot.max_water,
            sensor_data: sensorData,
            timestamp: latestData ? latestData.created_at : new Date(),
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
