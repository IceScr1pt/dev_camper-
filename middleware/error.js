const ErrorResponse = require('../utils/ErrorResponse');
//If an error accurs when we pass the err to next(), err is actually a ErrorResponse object
//which has access to statusCode and message we passed
const errorHandler = (err, req, res, next) => {
  let error = { ...err };

  error.message = err.message;
  console.log(err);
  //Log errors to dev in order to built a custom handler for each error
  //   console.log(err);

  /**Mongoose Error Handling**/
  //Mongoose bad objectId, we get 'CastError if id is not found from mongoose
  if (err.name === 'CastError') {
    //set new message and cast the error to be an ErrorResponse
    const message = `Resource not found with the id of ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  //Mongoose duplicate key error handler to check if a key value is  already in the DB
  if (err.code === 11000) {
    const message = `Duplicate field value entered!`;
    error = new ErrorResponse(message, 400);
  }

  //Mongoose validation error to check if all required field are filled from the user, if any missing we get which are missing.
  if (err.name === 'ValidationError') {
    //get the values from the object and get only the error.message property from each error object, err.erros is an array of object which contain an object with each error message
    const messages = Object.values(err.errors).map((error) => error.message);
    error = new ErrorResponse(messages, 400);
  }

  res
    .status(error.statusCode || 500)
    .json({ success: false, error: error.message || 'Server error' });
};

module.exports = errorHandler;
