//winston is used to log application activities and errors
const winston = require("winston");

const logger = winston.createLogger({
  //leve is used to specify the log level
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  //format is used to specify the log format
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    //splat is used to format messages with parameters
    winston.format.splat(),
    winston.format.json()
  ),
  //defaultMeta is used to specify default metadata for all logs
  defaultMeta: { service: "node app" },
  // transports is used to specify where the logs should be sent
  transports: [
    //this line will log to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    //creating error log file and combined log file for all logs using transports
    new winston.transports.File({
      filename: "src/logs/error.log",
      level: "error",
    }),
    new winston.transports.File({ filename: "src/logs/combined.log" }),
  ],
});

module.exports = logger;