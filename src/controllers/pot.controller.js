const PotService = require("../services/pot.service");
const potValidator = require("../validators/pot.validator");
const ApiResponse = require("../utils/apiResponse");
const logger = require("../utils/logger");
const { HTTP_STATUS } = require("../config/constants");

class PotController {
    // Add new pot
    static async addPot(req, res) {
        try {
            const { error } = potValidator.addPot(req.body);
            if (error) {
                return ApiResponse.error(res, "Data tidak valid", HTTP_STATUS.BAD_REQUEST, error.details[0].message);
            }

            const userId = req.user.id;
            const result = await PotService.addPot(userId, req.body);

            return ApiResponse.success(res, result, "Pot berhasil ditambahkan", HTTP_STATUS.CREATED);
        } catch (error) {
            logger.error("Add pot error", error);

            if (error.message.includes("sudah terdaftar")) {
                return ApiResponse.error(res, error.message, HTTP_STATUS.CONFLICT);
            }

            if (error.message.includes("tidak ditemukan")) {
                return ApiResponse.error(res, error.message, HTTP_STATUS.NOT_FOUND);
            }

            return ApiResponse.error(res, "Gagal menambahkan pot", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    static async getAllHydrationPots(req, res) {
        try {
            const userId = req.user.id;
            const pots = await PotService.getAllHydrationPots(userId);

            return ApiResponse.success(res, { pots, total: pots.length }, "Data hidrasi pot berhasil diambil");
        } catch (error) {
            logger.error("Get hydration pots error", error);
            return ApiResponse.error(res, "Gagal mengambil data hidrasi pot", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    // Get all user's pots
    static async getMyPots(req, res) {
        try {
            const userId = req.user.id;
            const pots = await PotService.getUserPots(userId);

            return ApiResponse.success(res, { pots, total: pots.length }, "Data pot berhasil diambil");
        } catch (error) {
            logger.error("Get pots error", error);
            return ApiResponse.error(res, "Gagal mengambil data pot", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    // Get pot detail
    static async getPotData(req, res) {
        try {
            const userId = req.user.id;
            const { pot_id } = req.params;

            const data = await PotService.getPotDetail(userId, pot_id);

            return ApiResponse.success(res, data, "Data pot berhasil diambil");
        } catch (error) {
            logger.error("Get pot data error", error);

            if (error.message.includes("tidak ditemukan") || error.message.includes("bukan milik")) {
                return ApiResponse.error(res, error.message, HTTP_STATUS.NOT_FOUND);
            }

            if (error.message.includes("Belum ada data")) {
                return ApiResponse.error(res, error.message, HTTP_STATUS.NOT_FOUND);
            }

            return ApiResponse.error(res, "Gagal mengambil data pot", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    // Control watering
    static async watering(req, res) {
        try {
            const userId = req.user.id;
            const { pot_id } = req.params;

            const result = await PotService.wateringControl(userId, pot_id);

            return ApiResponse.success(res, result, "Perintah penyiraman berhasil dikirim");
        } catch (error) {
            logger.error("Watering control error", error);

            if (error.message.includes("tidak ditemukan") || error.message.includes("bukan milik")) {
                return ApiResponse.error(res, error.message, HTTP_STATUS.NOT_FOUND);
            }

            return ApiResponse.error(res, "Gagal mengirim perintah penyiraman", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    // Get type pots
    static async getTypePots(req, res) {
        try {
            const types = await PotService.getTypePots();

            return ApiResponse.success(res, { types, total: types.length }, "Tipe pot berhasil diambil");
        } catch (error) {
            logger.error("Get type pots error", error);
            return ApiResponse.error(res, "Gagal mengambil tipe pot", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = PotController;
