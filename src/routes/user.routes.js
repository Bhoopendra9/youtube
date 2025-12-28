const express = require("express");
const {
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
} = require("../controllers/user.controller");
const upload = require("../middlewares/multer.middleware");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

//router.post("/register", registerUser);
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(logInUser);
router.route("/logout").get(authMiddleware, logOutUser);
router.route("/refresh-token").get(getAccessToken);
router.route("/change-password").post(authMiddleware, changePassword);
router.route("/profile").get(authMiddleware, getCurrentUserProfile);
router.route("/update-account").patch(authMiddleware, updateAccountDetails);
router
  .route("/update-profile-image")
  .patch(authMiddleware, upload.single("avatar"), updateUserProfileImage);
router
  .route("/update-cover-image")
  .patch(authMiddleware, upload.single("coverImage"), updateUserCoverImage);

router.route("/channel/:username").get(authMiddleware, getUserChannelProfile);
router.route("/watch-history").get(authMiddleware, getUserWatchHistory);

module.exports = router;
