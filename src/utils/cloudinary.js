const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//cloudinary helper
const uploadToCloudinary = async (filePath) => {
  try {
    if (!filePath) {
      throw new Error("File path is required");
    }

    // Uploads file to cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto", // Automatically detect the file type
    });
    //file uploaded successfully
    console.log("File uploaded to Cloudinary:", result);
    // Remove file from local uploads folder
    fs.unlinkSync(filePath);
    return result;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    // Optionally remove the file from local uploads folder in case of error
    fs.unlinkSync(filePath);
    throw new Error("Cloudinary upload failed");
  }
};
module.exports = uploadToCloudinary;
