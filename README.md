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

- Install nodemon
- Add in package.json > "scripts" - "dev": "nodemon index.js"

---

Refactoring

* Changing project structure

  * | Folder Name     | Purpose                                |
    | --------------- | -------------------------------------- |
    | config          | Protected API keys and settings        |
    | routes          | All route handlers, grouped by purpose |
    | services        | Helper modules and business logic      |
    | file > index.js | Helper modules and business logic      |

* Move all authentication routes to authRoutes.js file
* Move passport configuration to passport.js file
* require the ./services/passport.js file on top of index file so that it gets executed and hence configured. Since nothing is being returned, just keep the require and don't assign it to anything
* import passport (original) in the authRoutes file
* To make all routes available to the "app" object in index.js, wrap all routes inside an arrow function with "app" object as parameter and then module.exports()
* In index.js, call this authRoutes function by passing "app" as a parameter

---

* Using cookies on client<->server connection for authentication. Server after OAuth will send cookie in header which the browser will automatically set and resend in future server calls on its own
* In email/password system, email can be used to uniquely identify users. But in social logins, emails are replaceable and hence cannot be used. Because if user comes back after sometime, and the email ID is a new one on the same profile, our server will identify this as a new user. Hence profile.id will be used as the unique user identifier
* A new user '123' comes to our server with a Profile ID. We go to Mongo DB and create a record for him. After coming from MongoDB, we generate a cookie for user '123' and send this cookie back to client. User then logs out where we then unset the cookie on client. When same user comes back with his Profile ID, we check our MongoDB for this ID's existence. If yes, set cookie back in the client

---

Setting up Mongo DB

* Mongoose makes using MongoDB easier
* Mongo has
  * Collections (users, posts, payments) has
    * Records ({id: 1, name: "anna", height: 150} => 1 record of users collection)
* Mongo is schemaless and so each record can have different properties (unlike rdbms)
* JS world (Mongoose) has
  * Model Classes has
    * Model Instances
* | JS World (Mongoose) | MongoDB World |
  | ------------------- | ------------- |
  | Model Class         | Collection    |
  | Model Instance      | Record        |
  | Model Instance      | Record        |
  | Model Instance      | Record        |
* Creating a new record or searching all records are done using Model Class

* Open mlab.com > Create New > name "emaily-dev" > Submit Order
* Open new connection's dashboard and add a "database user"
* Install mongoose
* Import mongoose in index.js
* Instruct mongoose to connect to MongoDB server using MongoDB URI given by mlab
* Store mlab address in secured keys.js file

* We need to create Model class in order to create Collections in MongoDB. Collection of users who are OAuth'd after google login
* Create new folder "models" to hold all model classes
* Create models > User.js

  * Require mongoose library
  * Extract Schema from mongoose
  * Mongoose requires us to define all properties of records ahead of time hence making MongoDB non schemaless. Tradeoff for using mongoose to manage MongoDB
  * Create a Schema for user records. Currently it will have only google ID that we need to store
  * Create a model for 'users' collection with
    * Argument 1: name of collection 'users' and
    * Argument 2: schema to be used for this model / collection
  * Creating a file in project structure doesn't mean it will get executed. It needs to be "require"d somewhere. index.js in this case

* Storing google profile ID in MongoDB
  * Mongoose's user model is required in passport file in order to use it in the passport callback
  * Don't require mongoose model directly using exports from model file. It messes up during testing
  * Require original 'mongoose' and then get model using mongoose.model('users');
    * One argument means we're fetching from mongoose. Two arguments means we're creating
  * Create an instance (record) of mongoose User model with data of google ID in passport callback
  * Order of require statements in index.js for execution (passport.js, users.js) should have model file executed first to register the schema
* Bypass user creation if already exists (new profile ID)
  * Use model class to search all its instances
  * All query to MongoDB are async calls and returns promise.
* Use Done to tell passport that we're done using OAuth process and proceed with the flow
  * Argument 1: error object. null if no error
  * Argument 2: user record (existing user or new user) to tell passport the user we just created after saving the user in MongoDB if new
    * Use .then() after .save() to call done() with no error and saved "user" after save call
  * Passing user object to done allows passport to pass on this user object forward
* Serialize user model instance (id of the MongoDB record) to generate a unique identifier which will be passed to the client in a cookie. It can be de-serialized in later calls from the client to server and get back the user model
  * Using user's record ID (MongoDB id) instead of Google ID because there could be multiple social IDs if we add FB and Twitter logins for same user
* In passport.js, add code to serialize user model instance to id
* | Google OAuth Flow                                  | Incoming request with cookie                    |
  | -------------------------------------------------- | ----------------------------------------------- |
  | V                                                  | V                                               |
  | Google Profile ID                                  | User model instance ID                          |
  | Identifier a user coming to us from the OAuth flow | Identifies a user who is stored in the database |
* OAuth's only purpose is to allow someone to sign in. After that, we use our own internal IDs
* In passport.js, add code to deserialize id back to user model
* Tell passport to use cookies to handle authentication by adding middlewares. Middlewares modify incoming request before they are sent to route handlers.
  * Install `install --save cookie-session`
  * Require cookie-session and passport in index.js
  * 1st tell express to use cookies using app.use(). Configure cookies for maxAge in ms and encryption keys (random string)
    * Cookie session library extracts data out of the cookie and assigns it to req.session property
    * Passport then uses req.session (and not cookies) to get its data
  * 2nd tell passport to use cookies to handle authentication
    * app.use(passport.initialize())
    * app.use(passport.session())
* Request comes in > Cookie Session extract Cookie data and decrypt using "keys" and sets cookie value to req.session > Passport pulls user id out from this req.session which it set during serializing > deserializeUser function turns user id into a User model instance (called by passport.session() middleware) > User model instance is added to req object as req.user (by middleware passport.initialize())
* Outgoing response of signin calls (/auth/google) > serializeUser takes user object and serialize user.id and stores in the request.session as `req.session.passport.user = {user_mongo_id}` > Cookie Session encrypts the session in cookie using "keys" before responding back to client

---

Dev vs Prod

* Dev keys can remain in personal laptops whereas Prod keys should be in Heroku server
* Create new prod accounts

  * new MLab (emaily-prod) with new user account
  * new Google API credentials
    * Authorized redirect URIs to Heroku url/auth/google/callback
      * Heroku open
      * Copy opened URL to this field with /auth/google/callback
    * Authorized JS origins to Heroku url as it is
    * For callback paths that are relative: Google doesn't trust proxied request (Heroku's load balancer in this case). So it returns the callback not to https but to http, which is different from our original Heroku server. We have to tell GoogleStrategy to trust all proxies between our server and Google
      * add `proxy: true` to GoogleStrategy config object
  * Start committing keys.js which will now not contain keys but logic to choose dev.js or prod.js
  * Make config > dev.js and move contents from keys.js to dev.js
  * Add logic in keys.js to return proper keys file based on node environment
  * In prod.js, export variables from heroku environment and do commit it

* Update Heroku's env variables with Prod keys
  * www.heroku.com > settings > Config Variables
  * NODE_ENV is already set to 'production' in Heroku
  * Set Google, Mongo and Cookie keys in Heroku's variables
* Commit and Push to Heroku and then `heroku open`
