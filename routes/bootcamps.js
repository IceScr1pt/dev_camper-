const express = require('express');

//getting the controll methods by desctrutring from the controller file
const {
  getBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcampsInRadius,
  bootcampPhotoUpload,
} = require('../controllers/bootcamps');

const advancedResults = require('../middleware/advancedResult');
const Bootcamp = require('../models/Bootcamp');

//Include other resoruce routers
const courseRouter = require('./courses');

//define that i want to use the Router libraray
const router = express.Router();

//getting the protect middleware
const { protect, authorize } = require('../middleware/auth');

//if there a route to this endpoint we re-route that into the courseRouter because it goes to /api/1v1/bootcamps
router.use('/:bootcampId/courses', courseRouter);

//Define and expose the methods for the specified route and method, for exmaple routes with '/api/v1/bootcamps' have 2 methods expose to them.
router
  .route('/')
  .get(advancedResults(Bootcamp, 'courses'), getBootcamps)
  .post(protect, authorize('publisher', 'admin'), createBootcamp);

router
  .route('/:id')
  .get(getBootcamp)
  .put(protect, authorize('publisher', 'admin'), updateBootcamp)
  .delete(protect, authorize('publisher', 'admin'), deleteBootcamp);

router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius);

router
  .route('/:id/photo')
  .put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload);

module.exports = router;
