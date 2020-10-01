const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// const database = mongoose.connect(process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/crawler', options)
const database = mongoose.connect(process.env.DATABASE_URL || 'mongodb://149.28.58.54:27017/fiverr-crawler', options)
  .then(() => console.log('Connected to database.'))
  .catch(err => console.error('Error connecting to database:', err.message));

module.exports = database;