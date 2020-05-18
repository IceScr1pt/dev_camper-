/*statics will be called on the model itself, 
'methods' will be called on the actual document(user) and beacuse
 of that we have actually have access to the user's fields
*/

const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please Add a username :]'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please add a valid email',
    ],
  },
  role: {
    type: String,
    enum: ['user', 'publisher'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please add a password :]'],
    minlength: 6,
    //when we get the usef from the api we wont see the password if we set this field to false
    select: false,
  },
  resetPasswordToken: String,
  restPasswordExpire: Date,
  createdAt: {
    type: String,
    default: new Date(),
  },
});

//Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  /*Returns true if this document was modified ,else false
  we pass into isModified() the field that we want to check if we change him
  */
  if (!this.isModified('password')) {
    //we go to the next middleware
    next();
  }
  // this will run only when we modify a password we use genSalt() in order to hash the password, the higher the salt the better the secure
  const salt = await bcrypt.genSalt(10);
  //set the password field to the be hashed, we use has
  this.password = await bcrypt.hash(this.password, salt);
});

//save the creat at method in my timezone
UserSchema.pre('save', function (next) {
  this.createdAt = new Date().toLocaleString();
  next();
});

UserSchema.methods.getSignedJwtToken = function () {
  /*sign it to jwt, we have access to this._id because this method is being 
  activated on the user(which is a document), and that document has a _id field so we gain access
  */
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

//Match user entered password to the hased password in the database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  //bcrypt.compare(the password the user entreed, the pass from the db) and check if they are the same
  return await bcrypt.compare(enteredPassword, this.password);
};

//Generate and hash password token
UserSchema.methods.getRestPasswordToken = function () {
  /*Generate random token using the built in crypto libraray
  crypto.randomBytes give me random data, in order to turn it into a readable thing
  i use toString() and then i specify that i want to get the data in hex format
  */
  const restToken = crypto.randomBytes(20).toString('hex');

  /*Hash token and set restPasswordToken field
  createHash returns an hash object with the specified hash algo,
  inside update() we define the var we want to be hashed.
  digest('hex') -> we want to digest it as a string in a hex string
  */
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(restToken)
    .digest('hex');

  //Set expire date to expire in 10 minutes
  this.restPasswordExpire = Date.now() + 10 * 60 * 1000;
  console.log('from db', this.resetPasswordToken);

  return restToken;
};

//exports the User Schema and the methods
module.exports = mongoose.model('User', UserSchema);
