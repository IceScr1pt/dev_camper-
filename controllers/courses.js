const Course = require('../models/Course');
const Bootcamp = require('../models/Bootcamp');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Get Courses
// @route   GET /api/v1/courses
// @route   GET /api/v1/bootcamp/:bootcampId/courses
// @access  Public

//get course by bootcampId or all courses
exports.getCourses = async (req, res, next) => {
  try {
    //checking if the url param bootcampId is exists in order to get all courses that have the same bootcamp id
    if (req.params.bootcampId) {
      //we search in the DB course by bootcamp id and we get all courses that this id accosiate with
      const courses = await Course.find({ bootcamp: req.params.bootcampId });
      return res.status(200).json({
        success: true,
        count: courses.length,
        data: courses,
      });
    } else {
      res.status(200).json(res.advancedResults);
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Get Single course
// @route   GET /api/v1/courses/:courseId
// @access  Public

exports.getSingleCourse = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const course = await Course.findById(courseId).populate({
      path: 'bootcamp',
      select: 'name description',
    });

    if (!course) {
      return next(
        new ErrorResponse(`No course with the id of ${courseId}`, 404)
      );
    }
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

// @desc    Add course
// @route   POST /api/v1/bootcamps/:bootcampId/courses
// @access  Private

exports.addCourse = async (req, res, next) => {
  try {
    //define that the req.body.bootcamp field in  a post request will be the id of the bootcamp
    req.body.bootcamp = req.params.bootcampId;

    //setting a new field into req.body that has the user id who creates the course
    req.body.user = req.user.id;

    //check if the bootcamp we want to add a course to him exists in Db
    const bootcamp = await Bootcamp.findById(req.params.bootcampId);
    if (!bootcamp) {
      return next(
        new ErrorResponse(
          `No bootcamp with the id of ${req.params.bootcampId}`,
          404
        )
      );
    }

    //checking if the user he is the owner of the bootcamp which holds the course
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `User with ID of ${req.user.id} not authorized to add a course to bootcamp ${bootcamp._id}(${bootcamp.name})`,
          401
        )
      );
    }
    //if the bootcamp exists and if the user that is logged in owns the bootcamp we create the course for that bootcamp
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course info
// @route   PUT /api/v1/courses/:courseId
// @access  Private

exports.updateCourse = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    //check if course exists in the db
    let course = await Course.findById(courseId);
    if (!course) {
      return next(
        new ErrorResponse(`Can't find course with id of ${courseId}`, 404)
      );
    }

    if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `User with ID of ${req.user.id} not authorized to update a course to bootcamp ${course.bootcamp}`,
          401
        )
      );
    }
    //if course exists we update the course with req.body propeties
    course = await Course.findByIdAndUpdate(courseId, req.body, {
      new: true,
      runValidators: true,
    });
    res
      .status(200)
      .json({ success: true, data: course, msg: 'Course updated!' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course
// @route   DELETE /api/v1/courses/:courseId
// @access  Private

exports.deleteCourse = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    //find the course we want to remove
    let course = await Course.findById(courseId);
    if (!course) {
      return new ErrorResponse(`Can't find course with id of ${courseId}`, 404);
    }

    //Make sure only the owner of the course(the user who created him) can delete the course
    if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `User with ID of ${req.user.id} not authorized to update a course to bootcamp ${course.bootcamp}`,
          401
        )
      );
    }

    //remove the course from the db
    await course.remove();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
