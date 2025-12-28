const asyncHandler = require("../utils/asyncHandler");
const jwt = require("jsonwebtoken");
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
        refreshToken: null,
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

//get access token by refresh token
const getAccessToken = asyncHandler(async (req, res) => {
  //get refresh token from cookies
  const inComingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!inComingRefreshToken) {
    logger.error("Refresh token is required");
    throw new ApiErro(401, "Unauthorized! Refresh token is required");
  }

  try {
    //verify refresh token
    const decoded = jwt.verify(
      inComingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    //check if refresh token is in db
    const user = await User.findById(decoded._id);
    if (!user) {
      logger.error("User not found");
      throw new ApiError(401, "Invalid refresh token");
    }

    //check if refresh token matches
    if (user.refreshToken !== inComingRefreshToken) {
      logger.error("Invalid refresh token");
      throw new ApiError(401, "Refresh token is expired or invalid");
    }

    //generate new access token
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, "New access token generated successfully", {
          accessToken,
          refreshToken,
        })
      );
  } catch (error) {
    logger.error("Error in generating access token: " + error.message);
    throw new ApiError(500, "Error generating access token");
  }
});

//change current password of logged in user
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    logger.error("User not found");
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(currentPassword);
  if (!isPasswordValid) {
    logger.error("Current password is incorrect");
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully", null));
});

//reset my password
const resetPassword = asyncHandler(async (req, res) => {});

//get current user profile
const getCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = req.user; // fetched from auth middleware
  return res
    .status(200)
    .json(new ApiResponse(200, "User profile fetched successfully", user));
});

//update current user details
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!(fullName || email)) {
    logger.error("At least one field (fullName or bio) is required to update");
    throw new ApiError(
      400,
      "At least one field (fullName or email) is required"
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(200, "User details updated successfully", updatedUser)
    );
});

//update user profile picture and cover image
const updateUserProfileImage = asyncHandler(async (req, res) => {
  //getting one file at a time
  const avatarlocalPath = req.file?.path;
  if (!avatarlocalPath) {
    logger.error("Avatar image is required");
    throw new ApiError(400, "Avatar image is required");
  }

  // upload Profile image to cloudinary
  const avatarUploadResult = await uploadToCloudinary(avatarlocalPath);
  if (!avatarUploadResult.url) {
    logger.error("Failed to upload avatar image to Cloudinary");
    throw new ApiError(500, "Failed to upload avatar image");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatarUploadResult.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        " User profile image updated successecfuly",
        updatedUser
      )
    );
});

// upload cover image to cloudinary
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImagelocalPath = req.file?.path;
  if (!coverImagelocalPath) {
    logger.error("Cover image is required");
    throw new ApiError(400, "Cover image is required");
  }
  const coverImageUploadResult = await uploadToCloudinary(coverImagelocalPath);
  if (!coverImageUploadResult.url) {
    logger.error("Failed to upload cover image to Cloudinary");
    throw new ApiError(500, "Failed to upload cover image");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImageUploadResult.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        " User cover image updated successecfuly",
        updatedUser
      )
    );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    logger.error("Username is required");
    throw new ApiError(400, "Username is required");
  }

  const channel = await User.aggregate([
    { $match: { username: username.trim().toLowerCase() } },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedChannels",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        subscribedChannelsCount: { $size: "$subscribedChannels" },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        username: 1,
        fullName: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        subscribedChannelsCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel || channel.length === 0) {
    logger.error("Channel not found with given username");
    throw new ApiError(404, "Channel not found with given username");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Channel profile fetched successfully", channel[0])
    );
});

// get user watch history
const getUserWatchHistory = asyncHandler(async (req, res) => {
  //get user id from auth middleware
  //this gives us user id in string format
  const userId = req.user._id;

  const userWatchHistory = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistoryDetails",
        pipeline: [
          //in videos collection now i am matching with user id
          {
            $lookup: {
              from: "users",
              localField: "uploadedBy",
              foreignField: "_id",
              as: "uploaderDetails",
              pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }],
            },
          },
          {
            $addFields: {
              uploader: { $arrayElemAt: ["$uploaderDetails", 0] },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "User watch history fetched successfully",
        userWatchHistory[0].watchHistoryDetails
      )
    );
});

module.exports = {
  registerUser,
  logInUser,
  logOutUser,
  getAccessToken,
  changePassword,
  getCurrentUserProfile,
  updateAccountDetails,
  updateUserProfileImage,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
};
