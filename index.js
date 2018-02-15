const express = require('express'); //this is commonJS module. ES2015 modules use import x from y instead of require. nodejs doesn't have support for ES2015 as of now. Workarounds make tasks tougher.
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const app = express();
const keys = require('./config/keys');

passport.use(
  new GoogleStrategy(
    {
      clientID: keys.googleClientID,
      clientSecret: keys.googleClientSecret,
      callbackURL: '/auth/google/callback'
    },
    (accessToken, refreshToken, profile, done) => {
      console.log('access token: ', accessToken);
      console.log('refresh token: ', refreshToken);
      console.log('profile: ', profile);
    }
  )
);

app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

app.get('/auth/google/callback', passport.authenticate('google'));

const PORT = process.env.PORT || 5000;
app.listen(PORT);
