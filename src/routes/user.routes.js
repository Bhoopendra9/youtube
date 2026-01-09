const express = require("express");
const {
  registerUser,
  verifyEmailHandler,
  logInUser,
  logOutUser,
  getAccessToken,
  changePassword,
  forgetPassword,
  resetPassword,
  getCurrentUserProfile,
  updateAccountDetails,
  updateUserProfileImage,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
} = require("../controllers/user.controller");
const upload = require("../middlewares/multer.middleware");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  googleAuthStartHandler,
  googleAuthCallbackHandler,
} = require("../controllers/google.controller");

const router = express.Router();

//router.post("/register", registerUser);
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
//user's email verification route
router.route("/verify-email").get(verifyEmailHandler);
router.route("/login").post(logInUser);
router.route("/logout").get(authMiddleware, logOutUser);
router.route("/refresh-token").get(getAccessToken);
router.route("/change-password").post(authMiddleware, changePassword);
router.route("/forget-password").post(forgetPassword);
router.route("/reset-password").post(resetPassword);
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

//google auth
router.route("/google-auth").get(googleAuthStartHandler);
router.route("/google/callback").get(googleAuthCallbackHandler);

module.exports = router;
