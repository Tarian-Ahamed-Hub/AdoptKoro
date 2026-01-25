const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
            index:true
    },
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
