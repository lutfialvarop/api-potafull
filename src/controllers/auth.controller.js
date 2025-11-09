const AuthService = require("../services/auth.service");
const authValidator = require("../validators/auth.validator");
const ApiResponse = require("../utils/apiResponse");
const logger = require("../utils/logger");
const { HTTP_STATUS } = require("../config/constants");

class AuthController {
    static async register(req, res) {
        try {
            // Validate input
            const { error } = authValidator.register(req.body);
            if (error) {
                return ApiResponse.error(res, "Data tidak valid", HTTP_STATUS.BAD_REQUEST, error.details[0].message);
            }

            // Register user
            const result = await AuthService.registerWithEmail(req.body);

            return ApiResponse.success(res, result, "Pendaftaran berhasil", HTTP_STATUS.CREATED);
        } catch (error) {
            logger.error("Registration error", error);

            if (error.message === "Email already registered") {
                return ApiResponse.error(res, "Email sudah terdaftar", HTTP_STATUS.CONFLICT);
            }

            return ApiResponse.error(res, "Pendaftaran gagal", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    static async login(req, res) {
        try {
            // Validate input
            const { error } = authValidator.login(req.body);
            if (error) {
                return ApiResponse.error(res, "Data tidak valid", HTTP_STATUS.BAD_REQUEST, error.details[0].message);
            }

            const { email, password } = req.body;

            // Login user
            const result = await AuthService.loginWithEmail(email, password);

            return ApiResponse.success(res, result, "Login berhasil");
        } catch (error) {
            logger.error("Login error", error);

            if (error.message.includes("Invalid email or password")) {
                return ApiResponse.error(res, "Email atau password salah", HTTP_STATUS.UNAUTHORIZED);
            }

            if (error.message.includes("authentication")) {
                return ApiResponse.error(res, `Akun ini menggunakan autentikasi ${error.message.includes("google") ? "Google" : "lain"}`, HTTP_STATUS.UNAUTHORIZED);
            }

            return ApiResponse.error(res, "Login gagal", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    // Step 1: Mobile app calls this to get Google auth URL
    static async getGoogleAuthUrl(req, res) {
        try {
            const authUrl = AuthService.getGoogleAuthUrl();

            return ApiResponse.success(res, { auth_url: authUrl }, "URL autentikasi Google berhasil dibuat");
        } catch (error) {
            logger.error("Get Google auth URL error", error);
            return ApiResponse.error(res, "Gagal membuat URL autentikasi Google", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    // Step 2: Google redirects here after user login
    static async googleCallback(req, res) {
        try {
            const { code } = req.query;

            if (!code) {
                return res.redirect(`${process.env.MOBILE_APP_DEEP_LINK}?status=FAILED&message=Kode autentikasi tidak ditemukan`);
            }

            // Handle Google callback and get user data
            const result = await AuthService.handleGoogleCallback(code);

            // Redirect back to mobile app with token
            const deepLink = `${process.env.MOBILE_APP_DEEP_LINK}?status=SUCCESS&token=${result.token}&isNewUser=${result.isNewUser}`;

            return res.redirect(deepLink);
        } catch (error) {
            logger.error("Google callback error", error);

            const deepLink = `${process.env.MOBILE_APP_DEEP_LINK}?status=FAILED&message=${encodeURIComponent(error.message)}`;
            return res.redirect(deepLink);
        }
    }

    static async exchangeGoogleCode(req, res) {
        // 1. Ambil 'code' dari JSON body
        const { code } = req.body;

        if (!code) {
            // --- Gunakan ApiResponse.error ---
            return ApiResponse.error(res, "Authorization code is required.", HTTP_STATUS.BAD_REQUEST);
        }

        try {
            // 2. Panggil Service (tidak berubah)
            const result = await AuthService.handleGoogleCallback(code);

            // 3. Tentukan status dan pesan berdasarkan hasil
            const statusCode = result.isNewUser ? HTTP_STATUS.CREATED : HTTP_STATUS.OK; // 201 atau 200
            const message = result.isNewUser ? "User registered successfully" : "Login successful";

            // --- Gunakan ApiResponse.success ---
            // 'result' berisi { user, token, isNewUser }
            return ApiResponse.success(res, result, message, statusCode);
        } catch (error) {
            logger.error("Failed to exchange Google code", error);

            // --- Gunakan ApiResponse.error ---
            // AuthService.handleGoogleCallback akan melempar error dgn pesan yg jelas
            // (Contoh: "Invalid or expired authorization code.")
            return ApiResponse.error(res, error.message || "Internal server error", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    static async getProfile(req, res) {
        try {
            return ApiResponse.success(res, { user: req.user }, "Profil berhasil diambil");
        } catch (error) {
            logger.error("Get profile error", error);
            return ApiResponse.error(res, "Gagal mengambil profil", HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = AuthController;
