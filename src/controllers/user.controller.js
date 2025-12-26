const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/user.models");
const logger = require("../utils/logger");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const uploadToCloudinary = require("../utils/cloudinary");
const {
  validateUserRegistration,
  validateUserLogin,
} = require("../utils/validation");

// generate tokens
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    console.log(user);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    return { accessToken, refreshToken };
  } catch (error) {
    logger.error("Error generating tokens: " + error.message);
    throw new ApiError(500, "Error generating tokens");
  }
};

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
  //if cover image is not provided, use a default image
  // let coverImagelocalPath ="";
  // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
  //   coverImagelocalPath = req.files.coverImage[0]?.path;
  // }

  if (!avatarlocalPath) {
    logger.error("Avatar and Cover Image are required");
    throw new ApiError(400, "Avatar and Cover Image are required");
  }

  // upload images to cloudinary
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

const logInUser = asyncHandler(async (req, res) => {
  //get data from body
  // validation for username and password
  // check user
  // check password
  // generate access and refresh token
  // send response with token

  logger.info("Logging in user");

  const { username, email, password } = req.body;

  // const { error } = validateUserLogin(req.body);
  // if (error) {
  //   logger.error("Validation error: " + error.details[0].message);
  //   throw new ApiError(400, error.details[0].message);
  // }

  if (!username && !email) {
    logger.error("Username or email is required for login");
    throw new ApiError(400, "Username or email is required for login");
  }

  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    logger.error("User not found with given email or username");
    throw new ApiError(404, "User not found with given email or username");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    logger.error("Invalid password");
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // save refresh token in db
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const userData = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        user: userData,
        accessToken,
        refreshToken,
      })
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  // clear cookies
  logger.info("Logging out user");
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true, validateBeforeSave: false }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out successfully", null));
});

module.exports = {
  registerUser,
  logInUser,
  logOutUser,
};
