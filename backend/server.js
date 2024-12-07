require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const transactionRoutes = require("./routes/transaction");
const authRoutes = require("./routes/auth"); // Import authentication routes
const errorHandler = require("./middleware/errorHandler");
const dbConfig = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Database connection
mongoose
  .connect(dbConfig.url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/transactions", transactionRoutes);
app.use("/api/auth", authRoutes); // Use authentication routes

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
