//middleware it just functions that has access to the request and response cycle

//@desc   Logs request to console.
const logger = (req, res, next) => {
  console.log(
    `${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl}}`
  );
  //we call next beacsue we need to tell the middleware to move on to the next piece of middlwware
  next();
};

//export the function like that allow to export the function to use in other files
module.exports = logger;
