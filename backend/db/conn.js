const mongoose = require("mongoose");

const DB = process.env.MONGODB_URI;

mongoose.connect(DB)
    .then(() => {
        console.log("DataBase Connected");
    })
    .catch((err) => {
        console.log("Database connection error:", err);
    });
