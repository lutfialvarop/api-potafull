const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const UserModel = require("../models/user.model");
const logger = require("../utils/logger");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);

class AuthService {
    static async registerWithEmail(userData) {
        const { email, password, first_name, last_name } = userData;

        // Check if user exists
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
            throw new Error("Email already registered");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await UserModel.create({
            first_name,
            last_name,
            email,
            password: hashedPassword,
            auth_type: "email",
        });

        // Generate token
        const token = this.generateToken(user.id);

        logger.info("User registered successfully", { userId: user.id });

        return {
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
            },
            token,
        };
    }

    static async loginWithEmail(email, password) {
        // Find user
        const user = await UserModel.findByEmail(email);
        if (!user) {
            throw new Error("Invalid email or password");
        }

        if (user.auth_type !== "email") {
            throw new Error(`This account uses ${user.auth_type} authentication`);
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error("Invalid email or password");
        }

        // Update last login
        await UserModel.updateLastLogin(user.id);

        // Generate token
        const token = this.generateToken(user.id);

        logger.info("User logged in successfully", { userId: user.id });

        return {
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
            },
            token,
        };
    }

    // Generate Google OAuth URL for mobile app to open
    static getGoogleAuthUrl() {
        const scopes = ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"];

        logger.info("Generating Google auth URL with redirect_uri:", process.env.GOOGLE_REDIRECT_URI);

        const authUrl = googleClient.generateAuthUrl({
            access_type: "offline",
            scope: scopes,
            prompt: "consent",
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        });

        logger.info("Generated auth URL:", authUrl);

        return authUrl;
    }

    // Handle Google OAuth callback from redirect
    static async handleGoogleCallback(code) {
        try {
            // Exchange code for tokens
            const { tokens } = await googleClient.getToken(code);
            googleClient.setCredentials(tokens);

            // Get user info
            const ticket = await googleClient.verifyIdToken({
                idToken: tokens.id_token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            const { sub: googleId, email, given_name, family_name, picture } = payload;

            // Check if user exists by Google ID
            let user = await UserModel.findByGoogleId(googleId);
            let isNewUser = false;

            if (!user) {
                // Check if email already exists with different auth type
                const existingUser = await UserModel.findByEmail(email);
                if (existingUser && existingUser.auth_type !== "google") {
                    throw new Error(`This email is already registered with ${existingUser.auth_type} authentication`);
                }

                // Create new user (REGISTER)
                user = await UserModel.create({
                    first_name: given_name || "User",
                    last_name: family_name || "",
                    email,
                    password: null,
                    auth_type: "google",
                    google_id: googleId,
                    url_photo: picture || null,
                });

                isNewUser = true;
                logger.info("New user created via Google", { userId: user.id });
            } else {
                // Existing user (LOGIN)
                await UserModel.updateLastLogin(user.id);
                logger.info("User logged in via Google", { userId: user.id });
            }

            // Generate token
            const token = this.generateToken(user.id);

            return {
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    url_photo: user.url_photo || null,
                },
                token,
                isNewUser,
            };
        } catch (error) {
            logger.error("Google callback failed", error); // Ini sudah bagus, tetap pertahankan

            // Cek jika ini error dari Google (GaxiosError)
            if (error.response && error.response.data && error.response.data.error) {
                const googleError = error.response.data.error;

                // 'invalid_grant' adalah error Google untuk 'invalid authorization code'
                if (googleError === "invalid_grant") {
                    throw new Error("Invalid or expired authorization code.");
                }

                // Melempar error spesifik dari Google
                throw new Error(`Google API Error: ${googleError}`);
            }

            // Cek jika ini error jaringan (seperti ETIMEDOUT)
            if (error.code) {
                throw new Error(`Network Error: ${error.code}`);
            }

            // Error tidak dikenal
            throw new Error("An unknown error occurred: " + error.message);
        }
    }

    static generateToken(userId) {
        return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    }

    static verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error("Invalid or expired token");
        }
    }
}

module.exports = AuthService;
