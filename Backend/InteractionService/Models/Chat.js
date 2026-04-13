const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    conversationName: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    iv: { type: String, required: true },
    name: {
      type: String,
      required: true,
    },

    pic: {
      type: String,
      default: "",
    },

    text: {
      type: String,
      required: true,
    },

    seen: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Chat", chatSchema);
