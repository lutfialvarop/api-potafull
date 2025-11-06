const logger = require("../utils/logger");
const ApiResponse = require("../utils/apiResponse");
const { HTTP_STATUS } = require("../config/constants");

const errorMiddleware = (err, req, res, next) => {
    logger.error("Unhandled error", err);

    return ApiResponse.error(res, err.message || "Internal server error", err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR);
};

module.exports = errorMiddleware;
