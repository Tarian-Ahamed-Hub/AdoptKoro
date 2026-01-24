const handleMulterErrors = (err, res) =>{
  if (!err) return false;  

   
  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ error: "One or more files are too large. Max 5MB per file." });
    return true;
  }
 
  if (err.code === "LIMIT_FILE_TYPE") {
    res.status(400).json({ error: "Invalid file type. Only jpg, jpeg, png, gif, webp allowed." });
    return true;
  }
 
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    res.status(400).json({ error: "Too many files or unexpected file field." });
    return true;
  }

 
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: `Multer error: ${err.message}` });
    return true;
  }

 
  res.status(500).json({ error: err.message || "Unknown error during file upload." });
  return true;
}

module.exports = {handleMulterErrors}
