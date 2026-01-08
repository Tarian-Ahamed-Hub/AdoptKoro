const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    attempts:{
        type:Number,
        default:0
    },
     expiresAt: {
      type: Date,
      default: () => Date.now() + 5 * 60 * 1000,  
      index: { expires: 0 }  
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OTP", otpSchema);
