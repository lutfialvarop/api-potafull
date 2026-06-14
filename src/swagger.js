const swaggerDocument = {
    openapi: "3.0.0",
    info: {
        title: "Potafull API",
        version: "1.0.0",
        description: "Swagger documentation for the Potafull API.",
    },
    servers: [
        {
            url: "/api",
            description: "API base path",
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
    paths: {
        "/health": {
            get: {
                summary: "Health check",
                description: "Return service health status.",
                responses: {
                    200: {
                        description: "Service is healthy",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string" },
                                        timestamp: { type: "string", format: "date-time" },
                                    },
                                },
                            },
                        },
                    },
                },
                security: [],
            },
        },
        "/auth/register": {
            post: {
                summary: "Register user",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    email: { type: "string", format: "email" },
                                    password: { type: "string" },
                                    name: { type: "string" },
                                },
                                required: ["email", "password", "name"],
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "User registered successfully",
                    },
                    400: { description: "Invalid request payload" },
                },
            },
        },
        "/auth/login": {
            post: {
                summary: "Login user",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    email: { type: "string", format: "email" },
                                    password: { type: "string" },
                                },
                                required: ["email", "password"],
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Login successful" },
                    401: { description: "Unauthorized" },
                },
            },
        },
        "/auth/google": {
            get: {
                summary: "Get Google auth URL",
                responses: {
                    200: { description: "Generated Google auth URL" },
                },
                security: [],
            },
        },
        "/auth/google/callback": {
            get: {
                summary: "Google OAuth callback",
                parameters: [
                    {
                        name: "code",
                        in: "query",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    302: { description: "Redirect to mobile app" },
                },
                security: [],
            },
        },
        "/auth/google/exchange": {
            post: {
                summary: "Exchange Google authorization code",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    code: { type: "string" },
                                },
                                required: ["code"],
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Token exchange successful" },
                },
                security: [],
            },
        },
        "/auth/profile": {
            get: {
                summary: "Get user profile",
                responses: {
                    200: { description: "Profile retrieved" },
                    401: { description: "Unauthorized" },
                },
            },
        },
        "/mypot/types": {
            get: {
                summary: "Get pot types",
                responses: {
                    200: { description: "Types retrieved" },
                },
            },
        },
        "/mypot": {
            get: {
                summary: "Get user pots",
                responses: {
                    200: { description: "Pot list retrieved" },
                },
            },
        },
        "/mypot/hydration": {
            get: {
                summary: "Get hydration data for user pots",
                responses: {
                    200: { description: "Hydration data retrieved" },
                },
            },
        },
        "/mypot/add": {
            post: {
                summary: "Add new pot",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    pot_id: { type: "string" },
                                },
                                required: ["pot_id"],
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "Pot added successfully" },
                    404: { description: "Pot not found" },
                },
            },
        },
        "/mypot/{pot_id}/data": {
            get: {
                summary: "Get pot detail data",
                parameters: [
                    {
                        name: "pot_id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: { description: "Pot detail retrieved" },
                    404: { description: "Pot not found" },
                },
            },
        },
        "/mypot/{pot_id}/watering": {
            post: {
                summary: "Send watering command",
                parameters: [
                    {
                        name: "pot_id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: { description: "Watering command sent" },
                    404: { description: "Pot not found or not owned by user" },
                },
            },
        },
        "/mqtt/subscribe": {
            post: {
                summary: "Subscribe to MQTT topic",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    topic: { type: "string" },
                                },
                                required: ["topic"],
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Subscribed successfully" },
                },
            },
        },
        "/mqtt/unsubscribe": {
            post: {
                summary: "Unsubscribe from MQTT topic",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    topic: { type: "string" },
                                },
                                required: ["topic"],
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Unsubscribed successfully" },
                },
            },
        },
        "/mqtt/publish": {
            post: {
                summary: "Publish MQTT message",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    topic: { type: "string" },
                                    message: { type: "object" },
                                },
                                required: ["topic", "message"],
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Message published successfully" },
                },
            },
        },
        "/mqtt/messages/{topic}": {
            get: {
                summary: "Get MQTT messages for a topic",
                parameters: [
                    {
                        name: "topic",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: { description: "Messages retrieved successfully" },
                },
            },
            delete: {
                summary: "Clear MQTT messages for a topic",
                parameters: [
                    {
                        name: "topic",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: { description: "Messages cleared successfully" },
                },
            },
        },
        "/mqtt/status": {
            get: {
                summary: "Get MQTT connection status",
                responses: {
                    200: { description: "MQTT status retrieved successfully" },
                },
            },
        },
    },
};

module.exports = swaggerDocument;
