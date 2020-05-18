const fs = require('fs');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');

//Load env vars to get access to mongoose uri
dotenv.config({ path: './config/config.env' });

//Load
const Bootcamp = require('./models/Bootcamp');
const Course = require('./models/Course');
const User = require('./models/User');

//Connect to DB with mongoose uri
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});

//Read JSON FILES , bootcamps contains all the bootcamps data from the bootcamps.json file
const bootcamps = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/bootcamps.json`, 'utf-8')
);

const courses = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/courses.json`, 'utf-8')
);

const users = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8')
);

//Import into DB
const importData = async () => {
  try {
    //add the bootcamp schema to db
    await Bootcamp.create(bootcamps);
    //add the Course schema to db
    await Course.create(courses);

    //add User doucments to db
    await User.create(users);

    console.log('Data imported'.green);
    //end the process
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

//Delete data
const deleteData = async () => {
  try {
    //Delete all data -> deleteMany delete all data from the db,
    await Bootcamp.deleteMany();
    await Course.deleteMany();
    await User.deleteMany();
    console.log('Data Destroyed'.red);
    process.exit();
  } catch (error) {
    console.error(error);
  }
};

//decide which function to run, argv give me access to the cli argument
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
}
