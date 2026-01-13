const mongoose = require("mongoose");

module.exports.dbHandler = async (res, fn) => {
  try {
    const result = await fn();
    return result;
  } catch (err) {
    console.error("Database error:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        message: "Data exists",
      });
    }

    // Invalid ObjectId
    if (err.name === "CastError") {
      return res.status(400).json({
        message: "Invalid ID or field type",
      });
    }

    // Validation error (required, min, max, enum, etc.)
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }

    // Document not found (custom throw)
    if (err.name === "DocumentNotFoundError") {
      return res.status(404).json({
        message: "Data not found",
      });
    }

    // Mongo server selection / connection timeout
    if (
      err.name === "MongoServerSelectionError" ||
      err.name === "MongoNetworkError"
    ) {
      return res.status(504).json({
        message: "Database connection timeout",
      });
    }

    return res.status(500).json({
      message: err.message || "Internal server error",
    });
  }
};

module.exports.dbTransactionHandler = async (res, fn, maxRetries = 5) => {
  let attempt = 0;

  while (attempt < maxRetries) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await fn(session);
      await session.commitTransaction();
      session.endSession();

      return result;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();

     
      if (err.errorLabels?.includes("TransientTransactionError")) {
        attempt++;
        console.warn(
          `TransientTransactionError, retrying attempt ${attempt}...`
        );
        if (attempt === maxRetries) {
          return res.status(503).json({
            message:
              "Could not process after multiple retries. Please try again.",
          });
        }
        continue; 
      } else if (err.name === "BusinessError") {
        return res.status(400).json({
           message: err.message });
      } else if (err.name === "ValidationError") {
        return res.status(400).json({
          message: Object.values(err.errors)
            .map((e) => e.message)
            .join(", "),
        });
      } else if (err.code === 11000) {
        return res.status(409).json({
           message: "Duplicate data" });
      } else if (err.name === "CastError") {
        return res.status(400).json({
          message: "Invalid ID or field type",
        });
      } else if (err.name === "DocumentNotFoundError") {
        return res.status(404).json({
          message: "Data not found",
        });
      } else if ( err.name === "MongoServerSelectionError" ||   err.name === "MongoNetworkError"  ) {
        return res.status(504).json({
          message: "Database connection timeout",
        });
      } else {
        return res.status(500).json({
          message: err.message || "Internal server error",
        });
      }
    }
  }
};
