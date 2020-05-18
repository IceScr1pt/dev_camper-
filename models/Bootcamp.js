const mongoose = require('mongoose');

//a libraray to easilt create a slugs
const slugify = require('slugify');

const geocoder = require('../utils/geocoder');

const BootcampSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      unique: true,
      trim: true,
      maxlength: [50, 'Name can not be more than 50 chars'],
    },
    slug: String,
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [500, 'Description can not be more than 500 characters'],
    },
    website: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        'Please use a valid URL with HTTP or HTTPS',
      ],
    },
    phone: {
      type: String,
      maxlength: [20, 'Phone number can not be longer than 20 characters'],
    },
    email: {
      type: String,
      match: [
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please add a valid email',
      ],
    },
    address: {
      type: String,
      required: [true, 'Please enter an address!'],
    },
    location: {
      //GeoJSON Point
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        index: '2dsphere',
      },
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String,
    },
    careers: {
      type: [String],
      required: true,
      //which carreers a bootcamp can have
      enum: [
        'Web Development',
        'Mobile Development',
        'UI/UX',
        'Game Developer',
        'Data Science',
        'Cyber',
        'Business',
        'Other',
      ],
    },
    averageRating: {
      type: Number,
      min: [1, 'Rating must be  at least 1'],
      max: [10, 'Rating must can not be more than 10'],
    },
    averageCost: Number,
    photo: {
      type: String,
      default: 'no-photo.jpg',
    },
    housing: {
      type: Boolean,
      default: false,
    },
    jobAssistance: {
      type: Boolean,
      default: false,
    },
    jobGuarantee: {
      type: Boolean,
      default: false,
    },
    acceptGi: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: String,
      default: new Date().toLocaleString(),
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: {
      virtuals: true,
    },
  }
);

/*Mongoose middleware*/
//if we do document middleware like 'save' we have access to the document field itsef
//which give me access to the field value in the Schema

//Create bootcamp slug from the name before we save the data to the db
BootcampSchema.pre('save', function (next) {
  //refer to the slug field in the schema
  this.slug = slugify(this.name, { lower: true });
  next();
});

//Geocode && create location field
BootcampSchema.pre('save', async function (next) {
  //locationInfo is an object that contains info about the address from the db i passed to the geocode function
  const locationInfo = await geocoder.geocode(this.address);
  const [loc] = locationInfo;
  this.location = {
    type: 'Point',
    coordinates: [loc.longitude, loc.latitude],
    formattedAddress: loc.formattedAddress,
    street: loc.streetName,
    city: loc.city,
    state: loc.stateCode,
    zipcode: loc.zipcode,
    country: loc.countryCode,
  };

  //Do not save addrsss in DB in order to do that we set the adress to be undefined
  this.address = undefined;
  next();
});

BootcampSchema.pre('remove', async function (next) {
  console.log(`Course being remove from bootcamp ${this._id}`);
  //this.model give to us an instance of the Course model and on that instance i delelete
  //all enteries that match the id of the bootcamp we are handling
  await this.model('Course').deleteMany({ bootcamp: this._id });
  next();
});

BootcampSchema.pre('save', function (next) {
  this.createdAt = new Date().toLocaleString();
  next();
});

//Reverse populate with virtuals
BootcampSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'bootcamp',
  justOne: false,
});

//exporting the schema and convert it to a model in order to use it, 'model' is a class which construct documents
module.exports = mongoose.model('Bootcamp', BootcampSchema);

//
