const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const router = require("./Routes/router");
const { requestLogger } = require("./middleware/errorHandler");
require("./db/conn");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Request logging middleware
app.use(requestLogger);

// Routes
app.use("/api", router);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Start server
const PORT = process.env.PORT || 6010;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
