const mongoose = require('mongoose');

//building a Course Schema to add to my DB
const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Please add a course title'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  weeks: {
    type: String,
    required: [true, 'Please add number of weeks'],
  },
  tuition: {
    type: Number,
    required: [true, 'Please add tuition cost'],
  },
  minimumSkill: {
    type: String,
    required: [true, 'Please add a minimum skill'],
    enum: ['beginner', 'intermediate', 'advanced'],
  },
  scholarhipsAvailable: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: String,
    default: Date.now,
  },

  bootcamp: {
    /*type of mongoose.Schema.Types.ObjectId. 
    This tells Mongoose “Hey, I’m gonna be referencing other documents from other collections*/
    type: mongoose.Schema.Types.ObjectId,
    // The ref tells Mongoose “Those docs are going to be in the  Bootcamp collection.”
    ref: 'Bootcamp',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

//static method to get avg of course tutions
CourseSchema.statics.getAverageCost = async function (bootcampId) {
  const avgObj = await this.aggregate([
    /*the match select the documents where the bootcamp field matches  the objectId
    and then calculate the avg based on the tuition, $avg is built it method.
    */
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        _id: '$bootcamp',
        averageCost: { $avg: '$tuition' },
      },
    },
  ]);

  try {
    //creating an instance of the Bootcamp model and update the sepcfied bootcamp(bootcampId) with the avgCost field
    await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
      averageCost: Math.ceil(avgObj[0].averageCost / 10) * 10,
    });
  } catch (error) {
    console.error(error);
  }
};

//Call getAverageCost after the db has been saved and calculate the avg, the function invokes beforem db is savedx
CourseSchema.post('save', function () {
  this.constructor.getAverageCost(this.bootcamp);
});

//calculate avg again before we remove a Course from the db this function invokes
CourseSchema.pre('remove', function () {
  this.constructor.getAverageCost(this.bootcamp);
});

/*MongoDb stores dates in UTC by default so before the course get saved into the Course collection
 i will change the date to be correct to my timezone*/
CourseSchema.pre('save', function (next) {
  this.createdAt = new Date().toLocaleString();
  next();
});

module.exports = mongoose.model('Course', CourseSchema);
