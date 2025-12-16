//we use this to wrap async functions with try catch block to avoid repetitive code

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err)=> next(err));
}

module.exports = asyncHandler;