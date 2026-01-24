const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { handleMulterErrors } = require("../../HelperFuncs/multerErrorCatch");
 
 
 
cloudinary.config({
  cloud_name: process.env.X_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.Y_CLOUDINARY_API_KEY,
  api_secret: process.env.Z_CLOUDINARY_API_SECRET,
});

 
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "adoptKoro/posts",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"]
     
  },
  
});

 
const uploadMultiple = (fieldName = "pics", maxFiles = 5) => {
  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } 
  }).array(fieldName, maxFiles);

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (handleMulterErrors(err, res)) return;
       
      next();
    });
  };
};

 
const uploadSingle = (fieldName = "pic") => {
  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }  
  }).single(fieldName);

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (handleMulterErrors(err, res)) return;
   
      next();
    });
  };
};

module.exports = { uploadMultiple, uploadSingle };
