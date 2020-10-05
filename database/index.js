const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  "auth": {
    "authSource": "admin"
  },
  "user": "ankush",
  "pass": "p94En4mQuq7BM2q"
};

const database = mongoose.connect(process.env.DATABASE_URL || 'mongodb://142.93.248.194:27017/fiverr-crawler-mirror', options)
  .then(() => console.log('Connected to database.'))
  .catch(err => console.error('Error connecting to database:', err.message));

module.exports = database;