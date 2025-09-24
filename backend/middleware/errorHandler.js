const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    try {
        fs.mkdirSync(logsDir, { recursive: true });
    } catch (error) {
        console.error('Failed to create logs directory:', error.message);
    }
}

// Log levels
const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

// Logger class
class Logger {
    constructor() {
        this.logFile = path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level}: ${message}${metaStr}`;
    }

    writeToFile(message) {
        try {
            // Ensure logs directory exists before writing
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }
            fs.appendFileSync(this.logFile, message + '\n');
        } catch (error) {
            // Fallback to console if file logging fails
            console.error('Failed to write to log file:', error.message);
            console.error('Log message:', message);
        }
    }

    log(level, message, meta = {}) {
        const formattedMessage = this.formatMessage(level, message, meta);

        // Console output
        console.log(formattedMessage);

        // File output
        this.writeToFile(formattedMessage);
    }

    error(message, meta = {}) {
        this.log(LOG_LEVELS.ERROR, message, meta);
    }

    warn(message, meta = {}) {
        this.log(LOG_LEVELS.WARN, message, meta);
    }

    info(message, meta = {}) {
        this.log(LOG_LEVELS.INFO, message, meta);
    }

    debug(message, meta = {}) {
        this.log(LOG_LEVELS.DEBUG, message, meta);
    }
}

const logger = new Logger();

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error('Unhandled Error', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body,
        params: req.params,
        query: req.query
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = { message, statusCode: 404 };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = { message, statusCode: 400 };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { message, statusCode: 400 };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = { message, statusCode: 401 };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };

        if (res.statusCode >= 400) {
            logger.error('HTTP Request Error', logData);
        } else {
            logger.info('HTTP Request', logData);
        }
    });

    next();
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation error handler
const validationErrorHandler = (errors) => {
    const formattedErrors = {};

    if (Array.isArray(errors)) {
        errors.forEach(error => {
            if (error.path) {
                formattedErrors[error.path] = error.message;
            }
        });
    } else if (typeof errors === 'object') {
        Object.keys(errors).forEach(key => {
            formattedErrors[key] = errors[key].message || errors[key];
        });
    }

    return formattedErrors;
};

// Custom error class
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {
    logger,
    errorHandler,
    requestLogger,
    asyncHandler,
    validationErrorHandler,
    AppError,
    LOG_LEVELS
};
