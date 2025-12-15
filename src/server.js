require("dotenv").config();

const app = require("./app");
const logger = require("./utils/logger");
const connectDB = require("./db/db");

const PORT = process.env.PORT || 3000;

//Handling uncaught exceptions globally
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION 💥", err);
  process.exit(1); //let PM2 restart the app
});

//Connect to database
connectDB();

// ----------------------------
// 3️⃣ Start Server
// ----------------------------
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//Handling unhandled promise rejections globally
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION 💥", err);
  //shutting down the server gracefully
  server.close(() => process.exit(1)); //let PM2 restart the app "process.exit(1)"
});
