const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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
    roles: {
      type: [String],
      default:[],  
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }  
);

module.exports = mongoose.model("User", userSchema);
