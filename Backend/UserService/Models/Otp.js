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
    type: {
      type: String,
      enum: ['registration', 'login', 'forgot_password'],
      required: true
    },
     verified: {
      type: Boolean,
      default: false
    },
    attempts:{
        type:Number,
        default:0
    },
     expiresAt: {
      type: Date,
      required:true,
      default:() => new Date(Date.now() + 5 * 60 * 1000),
    },
  },
  { timestamps: true }
);

otpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model("OTP", otpSchema);
