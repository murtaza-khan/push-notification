// Imports
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

// Import API Routes
const notificationRoutes = require("./routes/api/notifications");
const userRoutes = require("./routes/api/users");
const bodyParser = require("body-parser");
const fs = require("fs");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const { rateLimit } = require("express-rate-limit");
// Create an instance of express app
const app = express();
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 500, // limit each IP to 500 requests per Minute
});

app.use(limiter);
// Set port
const port = process.env.PORT || "3000";

// express.urlencoded()
app.use(express.urlencoded({ extended: true }));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("[STATUS] Connected to Database"));

// Register API Routes
app.use("/notification", notificationRoutes);
app.use("/user", userRoutes);

// Listen app on given port
app.listen(port, () => {
  console.info(`[STATUS] App listening on port ${port}`);
});
