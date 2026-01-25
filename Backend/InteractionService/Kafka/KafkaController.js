 
 
 
const User = require("../Models/User")

const addUsers = async(users)=>{

     try{
        const operations = users.map((user)=>(
      { 
        updateOne:{
            filter:{email:user.email},
            update:{
                $setOnInsert:{
                    userId:user.userId,
                    name:user.name,
                    pic:user.pic,
                    address:user.address,
                    roles:user.roles,
                    email:user.email,
                    phone:user.phone,
                    verified:user.verified,
                }
            },
            upsert:true
       }
     }
     )
    )

    const result = await User.bulkWrite(operations);
    console.log("Users added to post service")
    }
    catch(err){
        console.log("Failed to add Users to post service ",err.message)
    }
    
}

 

module.exports ={addUsers}