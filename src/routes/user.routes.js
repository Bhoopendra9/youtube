const express = require("express");
const {
  registerUser,
  logInUser,
  logOutUser,
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

module.exports = router;
