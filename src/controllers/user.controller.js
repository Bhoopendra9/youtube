const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/user.models");
const logger = require("../utils/logger");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const uploadToCloudinary = require("../utils/cloudinary");
const { validateUserRegistration } = require("../utils/validation");

//Register new user
const registerUser = asyncHandler(async (req, res) => {
  // get user details from frantend
  // validate user details and not emapty
  // check if user already exists
  // check for image, check for avatar
  // upload image to cloudinary
  // create user in db
  // remove password and refresh token from response
  // send welcome email
  // send response to frontend
  logger.info("Registering new user");
  const { username, email, fullName, password } = req.body;

  // validate user input
  const { error } = validateUserRegistration(req.body);
  if (error) {
    logger.error("Validation error: " + error.details[0].message);
    throw new ApiError(400, error.details[0].message);
  }

  // check if user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    logger.error("User already exists with email or username");
    throw new ApiError(409, "User already exists with given email or username");
  }

  // check for avatar and coverImage files
  const avatarlocalPath = req.files.avatar[0]?.path;
  const coverImagelocalPath = req.files.coverImage[0]?.path;
  if (!avatarlocalPath || !coverImagelocalPath) {
    logger.error("Avatar and Cover Image are required");
    throw new ApiError(400, "Avatar and Cover Image are required");
  }

  // upload images to cloudinary
  console.log(uploadToCloudinary);
  const avatarUploadResult = await uploadToCloudinary(avatarlocalPath);
  const coverImageUploadResult = await uploadToCloudinary(coverImagelocalPath);
  if (!avatarUploadResult || !coverImageUploadResult) {
    logger.error("Failed to upload images to Cloudinary");
    throw new ApiError(500, "Failed to upload images");
  }

  
  // create new user
  const newUser = await User.create({
    username,
    email,
    fullName,
    avatar: avatarUploadResult.url,
    coverImage: coverImageUploadResult.url,
    password,
  });

  // remove sensitive data before sending response
  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    logger.error("User creation failed");
    throw new ApiError(500, "User creation failed");
  }

  // send response
  return res
    .status(201)
    .json(new ApiResponse(201, "User registered successfully", createdUser));
});

module.exports = {
  registerUser,
};
