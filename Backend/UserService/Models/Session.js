const mongoose = require('mongoose')

const SessionSchema = new mongoose.Schema(
    {
      token:{
        type:String,
        required:true,
        index:true
      },
      email:{
        type:String,
        required:true,
        index:true
      }
    }
)

const Session = mongoose.model("Session",SessionSchema)

module.exports = {Session}