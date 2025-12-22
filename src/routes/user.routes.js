const express = require("express");
const { registerUser, logInUser } = require("../controllers/user.controller");
const upload = require("../middlewares/multer.middleware");

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

module.exports = router;
