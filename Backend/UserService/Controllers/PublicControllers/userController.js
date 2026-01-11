const axios = require("axios");
const { oauth2client } = require("../../Configs/googleConfig");
const { Session } = require("../../Models/Session");
const jwt = require("jsonwebtoken");
const User = require("../../Models/User");
const { dbHandler } = require("../../HelperFuncs/dbHelper");
const { createToken } = require("../../HelperFuncs/GlobalHelper");
const { v4: uuidv4 } = require("uuid");

const signInWithGoogle = async (req, res) => {
  try {
    const { code } = req.query;
    const googleRes = await oauth2client.getToken(code);
    oauth2client.setCredentials(googleRes.tokens);

    const userDetails = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
    );

    const { email, name, picture } = userDetails.data;

     await dbHandler(res, async () => {
      const existingUser = await User.findOneAndUpdate(
        {
          email: email,
        },
        {
          $setOnInsert: {
            email,
            name,
            pic: picture,
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
        userId: existingUser._id,
        role: existingUser.roles,
      };

      const token = createToken(payload, "30d");

      const sessionData = await Session.create({
        email: existingUser.email,
        token,
      });
      const user = {
        name:existingUser.name,
        pic:existingUser.pic,
        roles:existingUser.roles   
      }
     return res.status(200)
            .cookie("sessionToken",token,{
                httpOnly: true,
                secure: process.env.PRODUCTION==="true"?true:false, // true in production (HTTPS)
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000, 
            })
            .json({
                message:"Logged In",
                data:user
            })
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

module.exports = { signInWithGoogle };
