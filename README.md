* Initialize npm and set npm and node engine version
* Install express and setup server
* Use process.env.PORT || 5000
* Install Heroku and deploy

* Install passport and passport-google-oauth20
  * 20 is the latest and is short for oauth2.0. regular -oauth is for backward compatibility
* Import passport and GoogleStrategy into the script
* Take passport object and tell it what strategy to use using passport.use(new GoogleStrategy());
* Google strategy need client ID and secret
  * Go to console.developers.google.com and create a new project named "emaily-dev"
  * Enable google oauth API using Google+ api
  * Create credentials > OAuth CLient ID > Create a consent screen (is shown to users while authenticating) > Web Application
    * Authorized Javascript Origins: http://localhost:5000
    * Authorized redirect URIs: http://localhost:5000/*
    * Create
    * Copy and save Client ID and Client Secret
* Secure API keys _(this is temporary solution)_
  * Make config > keys.js
  * module.exports googleClientID and googleClientSecret
  * Include keys.js in .gitignore
