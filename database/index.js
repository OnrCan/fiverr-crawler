const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  "auth": {
    "authSource": "admin" // If you set auth on the mongodb server
  },
  "user": "##username##",
  "pass": "##password##"
};

const database = mongoose.connect(process.env.DATABASE_URL || '[SERVER ADDRESS & DATABASE NAME GOES HERE]', options)
  .then(() => console.log('Connected to database.'))
  .catch(err => console.error('Error connecting to database:', err.message));

module.exports = database;