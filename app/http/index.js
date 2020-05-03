const logger = console;

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const server = require("./server").listen();

server.on("error", (err) => {
  logger.error(`Server error: ${err}`);
});

process.on("uncaughtException", (err) => {
  logger.error(
    `Process uncaughtException: ${err.name}, with message: ${err.message} and stack: ${err.stack}`
  );
  process.exit(1);
});

process.on("SIGTERM", () => {
  server.close(() => {
    process.exit(0);
  });
});
