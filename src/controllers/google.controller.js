const crypto = require("crypto");

const { OAuth2Client } = require("google-auth-library");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const User = require("../models/user.models");

//Google OAuth configuration
function getGoogleClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URL;

  if (!clientId || !clientSecret) {
    throw new ApiError(500, "Google clent Id and secret both are missing");
  }

  return new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri,
  });
}

//controller
const googleAuthStartHandler = asyncHandler(async (req, res) => {
  try {
    const client = getGoogleClient();
    const url = client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["openid", "email", "profile"],
    });

    return res.redirect(url);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

//google auth callback handler
const googleAuthCallbackHandler = asyncHandler(async (req, res) => {
  try {
    //google sends code in query
    const code = req.query.code;
    if (!code) {
      return res
        .status(400)
        .json(new ApiResponse(400, "Missing code in callback"));
    }

    const client = getGoogleClient();
    const { tokens } = await client.getToken(code);
    console.log("code:", code, tokens);
    if (!tokens.id_token) {
      return res
        .status(400)
        .json(new ApiResponse(400, "No google id_token is present"));
    }

    //verify id token and read the user info from it
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    console.log("payload :", payload);
    const email = payload?.email;
    const emailVerified = payload?.email_verified;
    if (!email || !emailVerified) {
      return res
        .status(400)
        .json(new ApiResponse(400, "Google email account is not verified"));
    }

    const normalizedEmail = email.toLowerCase().trim();
    // try to find user by email Id
    let user = await User.findOne({ email: normalizedEmail }).select(
      "-password -refreshToken"
    );
    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString("hex");

      user = await User.create({
        username: payload?.given_name,
        email: normalizedEmail,
        fullName: payload?.name,
        password: randomPassword,
        role: "user",
        isEmailVerified: emailVerified,
        twoFactoreEnabled: false,
      });
    } else {
      if (!user.isEmailVerified) {
        usre.isEmailVerified = true;
        await user.save();
      }
    }
    //genrate access and refresh token
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    //save refreshtoken in db
    user.refreshToken = refreshToken;
    await user.save();

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
          user: user,
          accessToken,
          refreshToken,
        })
      );
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = { googleAuthStartHandler, googleAuthCallbackHandler };
