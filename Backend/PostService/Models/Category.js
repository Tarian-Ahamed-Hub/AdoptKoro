const mongoose = require('mongoose')


const categoryShcema = new mongoose.Schema(
    {
       name:{
          type:String,
          required:true,
          index:true
       }
    },
    {timestamps:true}
)

const Category = mongoose.model("Category",categoryShcema);

module.exports = {Category}