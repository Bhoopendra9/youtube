const joi = require("joi");

// User registration validation schema

const validateUserRegistration = (data) => {
  const schema = joi.object({
    username: joi.string().alphanum().min(3).max(30).required(),
    email: joi.string().email().required(),
    fullName: joi.string().min(3).max(100).required(),
    password: joi.string().min(6).required(),
  });
  return schema.validate(data);
};

module.exports = {
  validateUserRegistration,
};
