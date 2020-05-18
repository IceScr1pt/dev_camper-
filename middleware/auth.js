const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/ErrorResponse');
const User = require('../models/User');

//Protect routes, check if the user has the authorization token
exports.protect = async (req, res, next) => {
  let token;
  /*req.headers get me access to the headers fields
  I'm checkong if we have a authorization header and if it starts with 'Bearer'
  */

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    //extract the token from the req.headers.authorization value by turning it into an array and select the suitable index
    token = req.headers.authorization.split(' ')[1];
    // console.log(token);
  }
  //   else if(req.cookies.token) {
  //       token = req.cookies.token
  //   }

  //Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
  try {
    //Veryify token, jwt.veryify('what to verify',the secret key), if it verifies we get object containing the id,exp and iat values > { id: '5eb3682e5de7973a40ac258f', iat: 1588898636, exp: 1591490636 }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log('token', decodedToken);

    //find the user Document that the token belong to him because he logged in and got encrypted token that contain the user id
    req.user = await User.findById(decodedToken.id);
    console.log(req.user);

    next();
  } catch (error) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};

///Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    //checking if thr roles we pass in doesn't include the user role
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          401
        )
      );
    }
    next();
  };
};
