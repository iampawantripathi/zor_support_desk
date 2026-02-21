

class ErrorHandler {
    static handle(err, req, res, next) {
        console.error('💥 ERROR:', err.stack || err.message);

        res.status(err.statusCode || 500).json({
            status: err.status || 'error',
            message: err.message || 'Something went wrong'
        });
    }
}

module.exports = ErrorHandler;
