// Test setup file
const mongoose = require('mongoose');

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/Qwipro';
});

// Global test teardown
afterAll(async () => {
    // Clean up any global resources
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
});

// Suppress console.log during tests (optional)
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

