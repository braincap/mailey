const express = require('express'); //this is commonJS module. ES2015 modules use import x from y instead of require. nodejs doesn't have support for ES2015 as of now. Workarounds make tasks tougher.
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const passport = require('passport');
const keys = require('./config/keys');
require('./models/User');
require('./services/passport');

mongoose.connect(keys.mongoURI);

const app = express();

app.use(
  cookieSession({
    maxAge: 30 * 24 * 60 * 60 * 1000,
    keys: [keys.cookieKey]
  })
);
app.use(passport.initialize()); // this line makes passport as middleware and let it alter req object
app.use(passport.session()); // this line calls deserialize function

require('./routes/authRoutes')(app);

const PORT = process.env.PORT || 5000;
app.listen(PORT);
