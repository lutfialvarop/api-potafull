const AuthService = require("../services/auth.service");
const UserModel = require("../models/user.model");
const ApiResponse = require("../utils/apiResponse");
const { HTTP_STATUS } = require("../config/constants");

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return ApiResponse.error(res, "No token provided", HTTP_STATUS.UNAUTHORIZED);
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = AuthService.verifyToken(token);

        // Get user from database
        const user = await UserModel.findById(decoded.userId);

        if (!user) {
            return ApiResponse.error(res, "User not found", HTTP_STATUS.UNAUTHORIZED);
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        return ApiResponse.error(res, "Invalid or expired token", HTTP_STATUS.UNAUTHORIZED);
    }
};

module.exports = authMiddleware;
