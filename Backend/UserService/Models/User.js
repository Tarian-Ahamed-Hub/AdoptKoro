const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    pic: {
      type: String,
      default: "",  
    },
    address: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    role: {
      type: Number,
      default: 0,  
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }  
);

module.exports = mongoose.model("User", userSchema);
