const express = require("express");
const AuthController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// Email authentication
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

// Google OAuth flow
router.get("/google", AuthController.getGoogleAuthUrl);
router.get("/google/callback", AuthController.googleCallback);
router.post("/google/exchange", AuthController.exchangeGoogleCode);

// Protected routes
router.get("/profile", authMiddleware, AuthController.getProfile);

module.exports = router;
