const axios = require("axios");
const { oauth2client } = require("../../Configs/googleConfig");
const { Session } = require("../../Models/Session");
const jwt = require("jsonwebtoken");
const User = require("../../Models/User");
const { dbHandler } = require("../../HelperFuncs/dbHelper");
const { createToken } = require("../../HelperFuncs/GlobalHelper");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { cacheRedis, getRedisClient } = require("../../Configs/cacheRedis");
const {autheticateUserHelper} = require("../../HelperFuncs/authenticate");
const  mongoose = require("mongoose");
const { getKafkaProducer } = require("../../Kafka/KafkaProducer");
 const { CompressionTypes } = require("kafkajs");
const OTP  = require("../../Models/Otp");
const { sendOTPEmail } = require("../../HelperFuncs/Email");
const signInWithGoogle = async (req, res) => {
  try {
    const { code } = req.query;
    const googleRes = await oauth2client.getToken(code);
    oauth2client.setCredentials(googleRes.tokens);

    const userDetails = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
    );

    const { email, name, picture } = userDetails.data;

      dbHandler(res, async () => {
      const userExists = await User.findOne({ email });
      const existingUser = await User.findOneAndUpdate(
        {
          email: email,
        },
        {
          $setOnInsert: {
            email,
            name,
            pic: "",
            roles: ["user"],
            password: uuidv4(),
          },
        },
        {
          new: true,
          upsert: true,
        }
      );

      const payload = {
        tokenId:uuidv4(),
        userId: existingUser._id,
        roles: existingUser.roles,
        userName:existingUser.name,
        pic:existingUser.pic
      };

      const token = createToken(payload, "30d");

       await Session.create({
        token,
        userId: new mongoose.Types.ObjectId(existingUser._id)
      });

      const user = {
        name:existingUser.name,
        pic:existingUser.pic,
        roles:existingUser.roles,
        userId:existingUser._id   
      }

       
  
      if(!userExists){
         const producer = getKafkaProducer();
           
        const Kafka_User = {
            userId:existingUser._id,
            name:existingUser.name,
            pic:existingUser.pic,
            address:existingUser.address,
            roles:existingUser.roles,
            email:existingUser.email,
            phone:existingUser.phone,
            verified:existingUser.verified,
         }
         await producer.send({
          topic: "registration",  
          compression: CompressionTypes.GZIP, 
          messages: [
            {
              key: "partition-1",  
              value: JSON.stringify(Kafka_User),  
            },
          ],
          });
 

       

         console.log(`Registered : ${existingUser.email}`)
      }
      else{
        console.log(`Logged In : ${existingUser.email}`)
      }
          
      
     return res.status(200).json({
                message:"Logged In",
                user:user,
                token: token
            })
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

const loginInitiate = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const email_lower = email.toLowerCase();

    const user = await User.findOne({ email: email_lower });
    if (!user) {
      return res.status(404).json({
        error: "Email is not registered",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(404).json({
        error: "Wrong Credentials",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = uuidv4();

    await OTP.deleteOne({ email: email_lower, type: "login" });

    await OTP.create({
      email: email_lower,
      otp,
      type: "login",
      token,
      verified: false,
    });

    sendOTPEmail(email_lower, otp, "login");

    return res.status(200).json({
      message: "OTP sent to your email",
      token,
      intent: "login",
    });
  } catch (error) {
    console.error("Login initiate failed:", error);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};
const loginVerify = async (req, res) => {
  try {
    const { otp, token } = req.body;

    if (!otp || !token) {
      return res.status(400).json({ error: "OTP and token are required" });
    }

    const otpRecord = await OTP.findOne({
      otp,
      token,
      type: "login",
      verified: false,
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: "OTP has expired" });
    }

    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res
        .status(400)
        .json({ error: "Too many attempts. Request new OTP." ,redirect:"/login"});
    }

    const user = await User.findOne({ email: otpRecord.email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    const payload = {
      tokenId: uuidv4(),
      userId: user._id.toString(),
      userName: user.name,
      roles: user.roles,
      profile_complete: user.profile_complete,
    };

    const sessionToken = createToken(payload, "30d");

    await Session.create({
      token: sessionToken,
      userId: new mongoose.Types.ObjectId(user._id),
    });

    const responseUser = {
      userName: user.name,
      roles: user.roles,
      userId: user._id.toString(),
      profile_complete: user.profile_complete,
    };

    return res.status(200).json({
      message: "Login successful",
      user: responseUser,
      token: sessionToken,
    });
  } catch (error) {
    console.error("Login verify failed:", error);
    return res.status(500).json({ error: "Login failed" });
  }
};

const registerInitiate = async (req, res) => {
  try {
    const { email, name, password, confirmPassword } = req.body;

    if (!email || !name || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    if (name.trim().length < 1) {
      return res.status(400).json({ error: "Name is required" });
    }

    const email_lower = email.toLowerCase();

    const existingUser = await User.findOne({
      email: email_lower,
      verified: true,
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Email already exists. Please login." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.findOneAndUpdate(
      { email: email_lower },
      {
        $setOnInsert: {
          email: email_lower,
          name: name.trim(),
          password: hashedPassword,
          roles: ["user"],
          verified: false,
     
        },
      },
      {
        upsert: true,
      },
    );

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = uuidv4();

    await OTP.deleteOne({ email: email_lower, type: "registration" });

    await OTP.create({
      email: email_lower,
      otp,
      type: "registration",
      token
    });

    sendOTPEmail(email_lower, otp, "registration");

    return res.status(200).json({
      message: "OTP sent to your email",
      token,
      intent: "registration",
    });
  } catch (error) {
    console.error("Register initiate failed:", error);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};

const registerVerify = async (req, res) => {
  try {
    const { otp, token } = req.body;

    if (!otp || !token) {
      return res.status(400).json({ error: "OTP and token are required" });
    }

    const otpRecord = await OTP.findOne({
      otp,
      token,
      type:"registration",
      verified:false
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: "OTP has expired" });
    }

    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res
        .status(400)
        .json({ error: "Too many attempts. Request new OTP." });
    }

    const user = await User.findOneAndUpdate(
      { email: otpRecord.email },
      { verified: true },
      { new: true },
    );

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

   
       
    

    otpRecord.verified = true;
    await otpRecord.save();

    const payload = {
      tokenId: uuidv4(),
      userId: user._id.toString(),
      userName: user.name,
      roles: user.roles,
    };

    const sessionToken = createToken(payload, "30d");

    await Session.create({
      token: sessionToken,
      userId: new mongoose.Types.ObjectId(user._id),
    });

    const responseUser = {
      name: user.name,
      roles: user.roles,
      userId: user._id.toString(),
      profile_complete: false,
    };

      const producer = getKafkaProducer();
           
        const Kafka_User = {
            userId:user._id,
            name:user.name,
            pic:user.pic,
            address:user.address,
            roles:user.roles,
            email:user.email,
            phone:user.phone,
            verified:user.verified,
         }
         await producer.send({
          topic: "registration",  
          compression: CompressionTypes.GZIP, 
          messages: [
            {
              key: "partition-1",  
              value: JSON.stringify(Kafka_User),  
            },
          ],
          });

         console.log(`Registered : ${user.email}`)

    return res.status(200).json({
      message: "Registration successful",
      user: responseUser,
      token: sessionToken,
    });
  } catch (error) {
    console.error("Register verify failed:", error);
    return res.status(500).json({ error: "Registration failed" });
  }
};


const forgotPasswordInitiate = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const email_lower = email.toLowerCase();

    const user = await User.findOne({ email: email_lower });
    if (!user) {
      return res.status(200).json({
        message: "If email exists, OTP has been sent",
        token: uuidv4(),
        intent: "forgot_password",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = uuidv4();

    await OTP.deleteOne({ email: email_lower, type: "forgot_password" });

    await OTP.create({
      email: email_lower,
      otp,
      type: "forgot_password",
      token,
      verified: false,
    });

    sendOTPEmail(email_lower, otp, "forgot_password");

    return res.status(200).json({
      message: "OTP sent to your email",
      token,
      intent: "forgot_password",
    });
  } catch (error) {
    console.error("Forgot password initiate failed:", error);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};

const forgotPasswordVerifyOTP = async (req, res) => {
  try {
    const { otp, token } = req.body;

    if (!otp || !token) {
      return res.status(400).json({ error: "OTP and token are required" });
    }

    const otpRecord = await OTP.findOne({
      otp,
      token,
      type: "forgot_password",
      verified: false,
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: "OTP has expired" });
    }

    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res
        .status(400)
        .json({ error: "Too many attempts. Request new OTP." });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    return res.status(200).json({
      message: "OTP verified. Please set your new password.",
      token,
    });
  } catch (error) {
    console.error("Forgot password verify OTP failed:", error);
    return res.status(500).json({ error: "OTP verification failed" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const otpRecord = await OTP.findOne({
      token,
      type: "forgot_password",
      verified: true,
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const user = await User.findOne({ email: otpRecord.email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    await OTP.deleteOne({ _id: otpRecord._id });

    return res.status(200).json({
      message:
        "Password reset successful. Please login with your new password.",
    });
  } catch (error) {
    console.error("Reset password failed:", error);
    return res.status(500).json({ error: "Password reset failed" });
  }
};



const logout = async(req,res)=>{
  try{
    const authHeader = req.headers.authorization;
    const sessionToken = authHeader.split(" ")[1];
    if(sessionToken){
       const decoded = jwt.verify(sessionToken,process.env.JWT_SECRET);
       
       const ttl = decoded.exp - Math.floor(Date.now()/1000);
     
       if(ttl>0){
          const cacheRedis = getRedisClient();

          await cacheRedis.set(
            `tokenBlock:${decoded.tokenId}`,
            "1",
            "EX",
            ttl
          );
       }
      
   
       return res.status(200).json({
          message:"logged out"
       })

    }
    else{
      throw new Error("Logged out already")
    }
    
    }
    catch(err){
         return res.status(200).json({
          message:`logged out . ${err.message}`
          
       })
    }
  

}
 

const authenticateUser = async (req, res) => {
  try {
    const roles = req.body.roles;
    autheticateUserHelper(req, res, roles);
  } catch (err) {
    return res.status(403).json({
      message: "Roles were not provided",
      err: err,
    });
  }
};


module.exports = { 
  signInWithGoogle ,
  logout,
  authenticateUser,
  registerInitiate,
  registerVerify,
  loginInitiate,
  loginVerify,
  forgotPasswordInitiate,
  forgotPasswordVerifyOTP,
  resetPassword,
  authenticateUser
};
