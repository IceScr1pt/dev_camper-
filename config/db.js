//Connect to db

//require mongoose library
const mongoose = require('mongoose');

//async function to connect to our DB
const connectDB = async () => {
  //wait until the connect returns a resolve/reject promise and then continue.
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });

  console.log(`MongoDb Connected ${conn.connection.host}`.cyan.underline.bold);
};

module.exports = connectDB;
