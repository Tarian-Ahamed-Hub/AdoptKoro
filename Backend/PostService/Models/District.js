const mongoose = require("mongoose");

const districtSchema = new mongoose.Schema(
  {
    district: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("District", districtSchema);
