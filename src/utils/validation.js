const joi = require("joi");

// User registration validation schema
const validateUserRegistration = (data) => {
  const schema = joi
    .object({
      username: joi.string().alphanum().min(3).max(30).required(),
      email: joi.string().email().required(),
      fullName: joi.string().min(3).max(100).required(),
      password: joi.string().min(6).required(),
      role: joi.string().valid("user", "admin").default("user"),
    })
    .unknown(false); // blocks extra injected fields
  return schema.validate(data);
};

//Login Validation schema
const validateUserLogin = (data) => {
  const schema = joi
    .object({
      username: joi.string().alphanum().min(3).max(30).messages({
        "string.min": "Username must be at least 3 characters long",
      }),
      email: joi.string().email().messages({
        "string.email": "Please enter a valid email address",
      }),
      password: joi.string().min(6).required().messages({
        "string.min": "Password must be at least 6 characters long",
        "any.required": "Password is required",
      }),
    })
    .xor("email", "username")
    .messages({
      "object.xor": "Please provide either email OR username (not both)",
    }); // only one accepted

  return schema.validate(data);
};

//Password change
const changeCurrentPassword = (data) => {
  const schema = joi
    .object({
      currentPassword: joi.string().min(6).required(),
      newPassword: joi.string().min(6).required(),
    })
    .unknown(false);

  return schema.validate(data);
};

//Search / Filter Validation

//user submits only email
const forgetPasswordSchema = (data) => {
  const forgotSchema = joi
    .object({
      email: joi.string().email().required().messages({
        "string.email": "Please enter a valid email address",
      }),
    })
    .unknown(false);
  return forgotSchema.validate(data);
};

//user submits only email
const resetPasswordSchema = (data) => {
  const forgotSchema = joi
    .object({
      token: joi.string().required(),
      newPassword: joi.string().min(6).required().messages({
        "string.min": "Password must be at least 6 characters long",
        "any.required": "New password is required",
      }),
      confirmPassword: joi.string().min(6).required().messages({
        "string.min": "Password must be at least 6 characters long",
        "any.required": "New password is required",
      }),
    })
    .unknown(false);
  return forgotSchema.validate(data);
};

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  changeCurrentPassword,
  forgetPasswordSchema,
  resetPasswordSchema,
};
