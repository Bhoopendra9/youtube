const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const logger = require("../utils/logger");
const uploadToCloudinary = require("../utils/cloudinary");

const Video = require("../models/video.models");
const { default: mongoose } = require("mongoose");

const getAllVideos = asyncHandler(async (req, res) => {
  const {query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  
  const allVideos = await Video.aggregate([
    {
      $match: {
        $or: ["title", "description"].map((field) => ({
          [field]: { $regex: query, $options: "i" },
        })),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "uploadedBy",
        foreignField: "_id",
        as: "uploadedBy",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        uploadedBy: { $arrayElemAt: ["$uploadedBy", 0] },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, "Videos fetched successfully", allVideos));
});

const publishAVideo = asyncHandler(async (req, res) => {
  logger.info("Publish a video request received");
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  //get video and thumbnail from req.files
  const videoFile = req.files.videoFile[0]?.path;
  const thumbnail = req.files.thumbnail[0]?.path;
  if (!videoFile && !thumbnail) {
    logger.error("Video file and thumbnail are missing in the request");
    throw new ApiError(400, "Video file and thumbnail are required");
  }

  // Upload video to Cloudinary
  const videoResult = await uploadToCloudinary(videoFile);
  const thumbnailResult = await uploadToCloudinary(thumbnail);
  if (!videoResult || !thumbnailResult) {
    logger.error("Failed to upload video or thumbnail to Cloudinary");
    throw new ApiError(500, "Video upload failed");
  }

  // Create new video document
  const newVideo = await Video.create({
    title,
    description,
    videoFile: videoResult.secure_url,
    duration: videoResult.duration,
    thumbnail: thumbnailResult.secure_url,
    uploadedBy: req.user._id,
  });
  if (!newVideo) {
    logger.error("Failed to create video document in database");
    throw new ApiError(500, "Video creation failed");
  }

  logger.info(`Video published successfully with ID: ${newVideo._id}`);
  return res
    .status(201)
    .json(new ApiResponse(201, "Video published successfully", newVideo));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!videoId) {
    logger.info("video Id is requred!");
    throw new ApiError(400, "video Id is requred!");
  }
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "uploadedBy",
        foreignField: "_id",
        as: "uploadedBy",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        uploadedBy: { $arrayElemAt: ["$uploadedBy", 0] },
      },
    },
  ]);
  if (!video || video.length === 0) {
    logger.info("Video not found with given Id");
    throw new ApiError(400, "Video not found with given Id!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Video has been fatched successfully", video));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId) {
    logger.info("Please provide valid video ID");
    throw new ApiError(400, "Please provide valid video ID");
  }
  //fatch video from databse
  const deletedVideo = await Video.findByIdAndDelete({ videoId });
  if (!deletedVideo) {
    logger.info("Provide video ID does not exit");
    throw new ApiError(400, "Provide video ID does not exit");
  }

  //delet video from cloudinary
  return res
    .status(200)
    .json(new ApiResponse(200, "Video has been deleted succesfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

module.exports = {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
