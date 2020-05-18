const express = require('express');

const {
  getCourses,
  getSingleCourse,
  addCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courses');

const Course = require('../models/Course');
const advancedResults = require('../middleware/advancedResult');

//You must pass {mergeParams: true} if i want the paremt router to access the params
const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

/*
we define a path to know where to know from which Schema we 
want to get data from and we select which fields and we return all the courses*/
router
  .route('/')
  .get(
    advancedResults(Course, {
      // path is the reference to the model from which  we populate the selected fields.
      path: 'bootcamp',
      select: 'name description',
    }),
    getCourses
  )
  .post(protect, authorize('publisher', 'admin'), addCourse);

router
  .route('/:courseId')
  .get(getSingleCourse)
  .put(protect, authorize('publisher', 'admin'), updateCourse)
  .delete(protect, authorize('publisher', 'admin'), deleteCourse);

module.exports = router;
