const express = require('express'); //this is commonJS module. ES2015 modules use import x from y instead of require. nodejs doesn't have support for ES2015 as of now. Workarounds make tasks tougher.
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const app = express();

passport.use(new GoogleStrategy());

const PORT = process.env.PORT || 5000;
app.listen(PORT);
