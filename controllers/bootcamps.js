/**Controllers ***/
/* 
gt > greater than
gte >=
lt <
lte <=
in: in let us search in array by a value, if the value is in the array we get a match.
*/

const ErrorResponse = require('../utils/ErrorResponse');
const Bootcamp = require('../models/Bootcamp');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const path = require('path');
const crypto = require('crypto');

//exporting all functions to use in the routes

// @desc    Get all bootcamps
// @route   GET /api/v1.bootcamps
// @access  Public
exports.getBootcamps = async (req, res, next) => {
  // const token = crypto.randomBytes(20).toString('hex');
  console.log('TEST TOKEN:', token);
  // console.log(res);
  res.status(200).json(res.advancedResults);
};

// @desc    Get single bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  Public
exports.getBootcamp = async (req, res, next) => {
  try {
    //search a bootcamp by id with findById function, req.params.id gives me the url param id.
    const bootcamp = await Bootcamp.findById(req.params.id);

    //validate if the id is in the formatted id but not in the db., it will return null
    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
      );
    }
    res.status(200).json({ success: true, data: bootcamp });
  } catch (error) {
    //the error being handled in the error.js middleware
    next(error);
  }
};

// @desc    Create bootcamp
// @route   POST /api/v1/bootcamps
// @access  Private
exports.createBootcamp = async (req, res, next) => {
  //add a new bootcamp to the db from the req.body
  try {
    //Add user to req.body
    req.body.user = req.user.id;

    //Checking if the user has already published a bootcamp
    const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

    /*If the user is not an admin and he is alrteady published a boot camp,
     we return an error because only admins can add multiple bootcamps*/
    if (publishedBootcamp && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `User with ID of ${req.user.id} has already published a bootcamp, only admins can add more.`,
          400
        )
      );
    }
    //if the user is an admin/ didnt published a bootcamp uet we create the bootcamp
    const bootcamp = await Bootcamp.create(req.body);

    res.status(201).json({
      success: true,
      data: bootcamp,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update bootcamp
// @route   PUT /api/v1/bootcamps/:id
// @access  Private
exports.updateBootcamp = async (req, res, next) => {
  try {
    //first param is the id we search, the second is what we want to insert and the third is if we want to get back the updated bootcamp which we set to true.
    let bootcamp = await Bootcamp.findById(req.params.id);

    //checking if the bootcamp exists
    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
      );
    }

    //Make sure the user who try to update the bootcamp info is the bootcamp owner(user field in bootcamp = user id ) and he has to be an admin
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authozrized to update this bootcamp`,
          401
        )
      );
    }

    //if the user owns the bootcamp and he is an admin we allow the update
    bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: bootcamp });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete bootcamp
// @route   DELETE /api/v1/bootcamps/:id
// @access  Private
exports.deleteBootcamp = async (req, res, next) => {
  try {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
      );
    }

    //making sure if the logged in user is the owner of the bootcamp and if he is an admin
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authozrized to delete this bootcamp`,
          401
        )
      );
    }
    /*we call this method because we need to activate the middleware that deletes 
    the courses which associate with this bootcamp as well.
    the user who can delet this is an admin/publisher which have the same id
    */
    bootcamp.remove();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bootcamps within a radius
// @route   GET/api/v1/bootcamps/radius/:zipcode/:distance
// @access  Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  //Get lat/lng from geocoder, give me info about a place using zipcode
  const locationInfo = await geocoder.geocode(zipcode);
  const [loc] = locationInfo;
  const latitude = loc.latitude;
  const longitude = loc.longitude;

  //Calculate radius using radians
  //We can calcluate that by divide distance by radius of earth
  //Earth radius = 6378.1 kilometers / 3963 miles
  const radius = distance / 3963;

  //then we do a custom query from the MONGODB docs, to find all bootcamps by location
  const bootcamps = await Bootcamp.find({
    location: {
      $geoWithin: { $centerSphere: [[longitude, latitude], radius] },
    },
  });

  console.log(bootcamps);
  res
    .status(200)
    .json({ success: true, count: bootcamps.length, data: bootcamps });
});

// @desc    Upload photo for bootcamp
// @route   PUT /api/v1/bootcamps/:id/photo
// @access  Private
exports.bootcampPhotoUpload = async (req, res, next) => {
  try {
    //check if bootcamp exists
    const bootcamp = await Bootcamp.findById(req.params.id);
    // console.log(bootcamp);
    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
      );
    }

    //making sure if the logged in user is the owner of the bootcamp and if he is an admin
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authozrized to update this bootcamp`,
          401
        )
      );
    }

    /*if req.files is not found we didn't upload a file because if we 
    did uploaded we gain access to the obj req.files
    */
    if (!req.files) {
      return next(new ErrorResponse('Please upload a file', 400));
    }

    //getting the file data we upload that contain useful info like name,size and more.
    const file = req.files.file;

    /*make sure the image is a photo, all photos like gif,png 
    starts with image, if it doesn't it's not a photo.
    */
    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse('Please upload an image file', 400));
    }

    //check file size, we can change the max file in config.env
    if (file.size > process.env.MAX_FILE_UPLOAD_SIZE) {
      return next(
        new ErrorResponse(
          `Please upload an image less than ${process.env.MAX_FILE_UPLOAD_SIZE}`,
          400
        )
      );
    }
    console.log(file);
    console.log(path.parse(file.name));

    /*Create custom filename path.
    parse(file.name) gives me an obj with info about the file name such as ext,name,base
    that is how we get the ext of evrey file wheter if it's a gif,jpg,png
    */
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

    //save the photo file in the db
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
      if (err) {
        console.error(err);
        return next(new ErrorResponse('Problem with file upload', 500));
      }
      //update the bootcamp photo property with the new file.name we builted
      await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
      res.status(200).json({ success: true, data: file.name });
    });
  } catch (error) {
    next(error);
  }
};
