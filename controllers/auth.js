const ErrorResponse = require('../utils/ErrorResponse');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Register User
// @route   POST /api/v1/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    //Create a user Document
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    //Create token, we call this method to sign in
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

//  @desc   Login User
// @route   POST /api/v1/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    //Validate if the there is email,password
    if (!email || !password) {
      return next(
        new ErrorResponse(`Please provide an email and a password`, 400)
      );
    }
    /*check if the email exists in the DB, if not the user is not exists in the db.
    .select -> Specifies which document fields to include or exclude (also known as the query "projection")
    */
    const user = await User.findOne({ email: email }).select('+password');

    //if no response user not exists
    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }
    //checking if the password the user entered is valid which means it matches the hashed password in the database
    const isPassMatch = await user.matchPassword(password);
    console.log(isPassMatch);
    if (!isPassMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    //SEND RESPONSE WITH COOKIE INSIDE
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

//  @desc   Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  /*if we are in protected routes i have access to the req.user obj which contain 
  all data about the cuurently logged user
  */
  try {
    console.log('req', req);
    //find the user that has the id of the token in the User collection
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
    next();
  } catch (error) {
    console.error(error);
  }
};

//  @desc   Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    //find the user in db that matches the req.body email
    const user = await User.findOne({ email: req.body.email });
    console.log(user);
    //if the user is not exists
    if (!user) {
      return next(new ErrorResponse(`There is no user with that email`, 404));
    }

    //Get reset token if user exists
    const resetToken = user.getRestPasswordToken();

    /*save the user with the new restToken and expireToken field 
    created by the middleware above and save it without validation
    */
    await user.save({ validateBeforeSave: false });

    //Create rest url -> http://localhost:5000/api/v1/restpassword/token
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/auth/resetpassword/${resetToken}`;

    //define the message i want to sent in the email
    const message = `You are receiving this email because you or someone else has requested 
    the rest of a password. Please make a PUT request to : \n\n ${resetUrl}`;

    //send the email with my sendEmail util passing the options
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password rest token :]',
        message: message,
      });

      res
        .status(200)
        .json({ success: true, data: 'Email has been sent successfully :]!' });
    } catch (error) {
      console.log(error);
      //If something goes wrong i set both field to undefied
      user.resetPasswordToken = undefined;
      user.restPasswordExpire = undefined;
      //save the changes to db without validation
      await user.save({ validateBeforeSave: false });
      return next(ErrorResponse("Email couldn't be sent ", 500));
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//  @desc   Rest Password
// @route   PUT /api/v1/auth/resetpassword/:resetToken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    //hash the restToken i get from the email in order to check if it's identical to the restPasswordToken field in my db
    const resetToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');
    console.log(resetToken);

    //search in the db the user with the same reset token
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      restPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      return next(new ErrorResponse(`Invalid token`, 400));
    }

    /*If the token is exists and didn't expired yet, i set the user password
    to the new password in the req.body and save into the db the changes.
    */
    user.password = req.body.password;
    console.log('password without hash', user.password);
    //setting this fields to undefined will result that they wont be in the db anymore because we are done with that specific tokens.
    user.resetPasswordToken = undefined;
    user.restPasswordExpire = undefined;

    await user.save();

    console.log('password has been hashed', user.password);

    sendTokenResponse(
      user,
      200,
      res,
      'Password has been chnaged sucessfuly :D'
    );
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//Get token from model, create cookie and send response to the api, the response contains a cookie
const sendTokenResponse = (user, statusCode, res, msg = null) => {
  //create token
  const token = user.getSignedJwtToken();
  const options = {
    //setting the token to expire in 30 days
    expires: new Date(
      Date.now().toLocaleString() +
        process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    //we want the cookie to be accesed only by the client side script
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options['secure'] = true;
  }

  //i can define custom msg for the api if i want.
  const resObj = msg ? { success: true, token, msg } : { success: true, token };

  res
    .status(statusCode)
    //to send a cookie in our response we use .cookie('name of cookie', the value of the cookie, options(expire date, etc..))
    .cookie('token', token, options)
    .json(resObj);
};
