const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const createToken = (payload, expiresIn) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
    algorithm: "HS256",
  });
  return token;
};

const hashPassword = async (plainPassword) => {
  try {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    return hashedPassword;
  } catch (err) {
    console.log("BCRYPT Error while hashing password ", err.message);
    let error = new Error("BCRYPT Error while hashing password ", err.message);
    error.name = "service error";
    throw error;
  }
};

const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    const valid = await bcrypt.compare(plainPassword, hashedPassword);
    return valid;
  } catch (err) {
    console.log("BCRYPT Error while comparing password ", err.message);
    let error = new Error("BCRYPT Error while comparing password");
    error.name = "service error";
    throw error;
  }
};

const encrypt = (text) => {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  const ALGORITHM = "aes-256-cbc";

  const iv = crypto.randomBytes(16);  
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    iv: iv.toString("hex"),
    encryptedContent: encrypted,
  };
};

const decrypt = (ivHex, encryptedContent) => {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  const ALGORITHM = "aes-256-cbc";

  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );

  let decrypted = decipher.update(encryptedContent, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

module.exports = {
  encrypt,
  decrypt,
  createToken,
  hashPassword,
  comparePassword,
};
