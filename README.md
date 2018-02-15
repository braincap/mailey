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
  * Create credentials > OAuth Client ID > Create a consent screen (is shown to users while authenticating) > Web Application
    * Authorized Javascript Origins: http://localhost:5000
    * Authorized redirect URIs: http://localhost:5000/*
      * Change it to the path that is being sent to GoogleStrategy as 1st argument 3rd option (http://localhost:5000/auth/google/callback)
    * Create
    * Copy and save Client ID and Client Secret
* Secure API keys _(this is temporary solution)_
  * Make config > keys.js
  * module.exports variables googleClientID and googleClientSecret
  * Include keys.js in .gitignore
* Import secured keys into index.js
* Configuring GoogleStrategy object
  * Pass as first argument an object made of
    * Client ID and Secret Key
    * Path (aka callback URL) (localhost:5000/auth/google/callback) where Google will return user to after permission is granted. This should match the path that is set in google console's _Authorized redirect URIs_ option
  * Pass as second argument an arrow function with accessToken as parameter
* Add a route (/auth/google) to listen to client authentication requests
  * Unlike regular route handling, tell express to involve passport by passing `passport.authenticate('google', {scope: ['profile','email']})` as second argument
  * String 'google' is already coded internally in GoogleStrategy code which passport uses to without any specific declaration from our end
  * Whenever any user comes to this path, we kick them to the OAuth flow managed entirely by passport
  * Scope specifies google which details we need. Profile and Email in this case
  * Accessing /auth/google throws user to Google for Auth. After user accepts, google redirects user to redirect URI with a **code**
* Add a second route handler for redirect URI /auth/google/callback and let passport handle it using GoogleStrategy by passing 'google' string as argument

  * Passport sees the **code** that was sent by google on callback URI and then does a follow-up request automatically with google using the code to fetch profile of the user. After the return of follow-up request and fetching user profile, the function on second argument of GoogleStrategy configuration is executed
  * Access Token is like certificate that can be shown to google again in future to regain same privileges on user's behalf
  * Refresh Token allows to automatically update Access Token which expires after some time
