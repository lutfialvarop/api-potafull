class ApiResponse {
    static success(res, data, message = "Berhasil", statusCode = 200) {
        return res.status(statusCode).json({
            status: "SUCCESS",
            message,
            data,
        });
    }

    static error(res, message = "Gagal", statusCode = 500, errors = null) {
        const response = {
            status: "FAILED",
            message,
        };

        if (errors) {
            response.data = errors;
        }

        return res.status(statusCode).json(response);
    }
}

module.exports = ApiResponse;
