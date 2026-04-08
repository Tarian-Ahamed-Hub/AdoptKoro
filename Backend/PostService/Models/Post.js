const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required:true
    },

    content: {
      type: String,
      required:true
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default:"Point",
        required: true,
      },
      coordinates: {
        type: [Number], 
        required: true,
      },
    },
      category:{
        type:String,
        required:true
    },  
    district:{
        type:String,
        required:true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"User",
      index: true,
    },
    pics:{
        type:[String],
        required:true
    },
    active:{
      type:Boolean,
      default:true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
  },
  {
    timestamps: true,
  }
);


 

PostSchema.index({
  location: "2dsphere",
  _id: -1,
});
const Post = mongoose.model("Post", PostSchema);
module.exports = {Post};
