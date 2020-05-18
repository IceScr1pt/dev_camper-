const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
//Load env vars to enable the use of config variables
dotenv.config({ path: './config/config.env' });

//Connect to database
connectDB();

//Route files
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const auth = require('./routes/auth');

//initalize express
const app = express();

//Body parser that allow me to send json in the body of the requests > ask about it
app.use(express.json());

//Dev logging middleware, run only if we are in dev enviroment
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Enable file uploading
app.use(fileUpload());

app.use(cookieParser());

//set static folder that can serve img,css etc..
app.use(express.static(path.join(__dirname, 'public')));

//Forwards any requests we make to /api/v1/bootcamps to the bootcamps Router
app.use('/api/v1/bootcamps', bootcamps);

app.use('/api/v1/courses', courses);

app.use('/api/v1/auth', auth);

//enable error handling for to the errors we pass to next()
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

//run the server
const server = app.listen(PORT, () =>
  console.log(
    `Server running in ${process.env.NODE_ENV} on port ${PORT}`.yellow
  )
);

//Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error ${err.message}`.red.bold);
  /*Close server & exit process with server.close() that closes the connectin
   and process.exit(1) which will exit the app on failure.*/
  server.close(() => process.exit(1));
});
