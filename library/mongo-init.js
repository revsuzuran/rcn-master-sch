const mongoose = require('mongoose');

module.exports = () => {

const dbHost = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;
 
// const uri = "mongodb://" + dbUser + ":" + dbPassword + "@" + dbHost + "/" + dbName;
const uri = "mongodb://localhost:27017/rekondb";

  mongoose
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
