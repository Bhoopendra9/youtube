const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/user.models");
const ApiError = require("../utils/apiError");

const authMiddleware = asyncHandler(async (req, _, next) => {
  try {
    // get token
    const accessToken =
      req.cookies?.accessToken ||
      req.headers("authorization")?.replace("Bearer ", "");
    if (!accessToken) {
      logger.error("Token missing in request");
      throw new ApiError(401, "Not authorized, token missing");
    }

    // verify token
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    if (!decoded) {
      logger.error("Invalid token");
      throw new ApiError(401, "Not authorized, invalid token");
    }

    // get user from token
    const user = await User.findById(decoded._id).select(
      "-refreshToken -password -publicIdAvatar -publicIdCoverImage"
    );
    if (!user) {
      logger.error("User not found for given token");
      throw new ApiError(401, "Not authorized, user not found");
    }

    // attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error("Authentication error: " + error.message);
    throw new ApiError(401, "Not authorized, authentication failed");
  }
});

module.exports = authMiddleware;
