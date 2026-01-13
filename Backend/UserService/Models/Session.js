const mongoose = require('mongoose')

const SessionSchema = new mongoose.Schema(
    {
      token:{
        type:String,
        required:true,
        index:true
      },
      userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
      }
      
    }
)

const Session = mongoose.model("Session",SessionSchema)

module.exports = {Session}