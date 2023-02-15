require('dotenv').config();
const mongoose = require('mongoose');

module.exports = async () => {

const dbHost = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;
const dbPort = process.env.DB_PORT;
const additionalQuery = process.env.ADD_QUERY;
 
const uri = "mongodb://" + dbUser + ":" + dbPassword + "@" + dbHost + ":" + dbPort + "/" + dbName + additionalQuery;
// const uri = "mongodb://localhost:27017/rekondb";

  await mongoose
    .connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log('Mongodb connected....');
    })
    .catch(err => console.log(err.message));

  mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to db...');
  });

  mongoose.connection.on('error', err => {
    console.log(err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose connection is disconnected...');
  });

  process.on('SIGINT', () => {
    mongoose.connection.close(() => {
      console.log(
        'Mongoose connection is disconnected due to app termination...'
      );
      process.exit(0);
    });
  });
};
