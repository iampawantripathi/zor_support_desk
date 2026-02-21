class ResponseService {
    static success(res, data = {}, status = 200) {
        return res.status(status).json({
            success: true,
            data,
            status
        });
    }

    static error(res, data = {}, status = 500) {
        return res.status(status).json({
            success: false,
            data,
            status
        });
    }
}

module.exports = ResponseService;
