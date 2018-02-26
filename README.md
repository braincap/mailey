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

# Summary

* User clicks login in their browser. Our server makes a get request to /auth/google (an address specified in the Google developer console).
* Passport forwards the request to Google using the client ID and client secret we set up to register our app.
* Google will then ask the user if they grant permission to our app to access their profile. If they grant permission, Google will send a response back to the server at /auth/google/callback (a URI specified in the Google developer console and which matches the redirect route in the passport set up). The URI will also contain a code.
* Passport again handles this route, pulling the code out of the URI and sending a request back to Google with the same code.
* Google then responds with details about this user.
* At this point, the callback in the Google strategy set up fires, giving us the user’s profile data.
* We check if there is a user in the database with the Google ID we have just got back. If there is none, we create a new user using that Google ID.
* We call done to inform passport that we can resume authenticating.
* Passport calls serializeUser , which takes the user just authenticated and determines that we want to store the MongoDB ID to identify the user in the session. This is passed to cookie session which encodes the ID and sends it to the browser in the response header.
* Whenever the user makes a follow-up request, the browser sends the cookie back with the same encoded token. Cookie session extracts and decodes the cookie data, assigning it to the session property on the request object. The request flows down to passport, which looks up req.session and takes the MongoDB ID out and uses it in the deserializeUser function. The user is found in the database using this ID. Passport then attaches this user to the request object as req.user .
* Passport also attaches a logout function to the request object which expires the cookie whenever the user accesses the logout route.

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

---

Client side setup

* Install CRA inside maily > server folder
* CRA has its own server
  * Express server uses MongoDB and Node and Passport and stuff to serve json files for http request calls
  * React server takes react components and uses Babel/Webpack to give a single bundles js file to client to show in the frontend

Figuring out how to make both servers work together

* **In server** > package.json, add in "scripts" > "client": "npm run start --prefix client". Means on `npm run client` run the `npm run start` command from within the "client" directory
* Change old "dev" to "server" and add a new "dev": "concurrently \"npm run server\" \"npm run client\""
* npm install --save concurrently
* `npm run dev` will now run both server and client concurrently

* **In client** All relative paths (hrefs) will direct user to client's relative location. A href of /auth/google will lead to client's 3000 (and not server's 5000)
* Giving an absolute path as href (localhost:5000/auth/google) will work only on Dev environment and will need to be changed when deploying in production. We need to keep it relative path for ease
* In package.json > `"proxy" : {"/auth/google": {"target": "http://localhost:5000"}}`
* In production, CRAE doesn't exist. Hence no proxy side-effects. `npm run build` builds the react app using Babel/Webpack and places final bundled html/js/css files in build directory which is then served to client by node/express

---

Behind the scenes

* Why one final server (node/express that will serve up React's bundled files to client) and now two different servers, one each for react client and node/express API?
* Requests from 3000 to 3000 includes cookies in all calls by default. Requests from 3000 to 5000 doesn't include cookies by default for security issues. An ajax call from google.com to airbnb.com won't include any cookie. In Dev, browser doesn't know that React will proxy its requests to another server. React includes cookies in its proxy call to the proxy server (5000). In Prod, there is no react. Browser won't send cookies from client site to server site since they are on separate domains
* No CORS issue when same client / server domains. A 3000 to 5000 call is a CORS request. In Dev, browser thinks it makes request to 3000 hence no issue. React forwards it to 5000. In Prod, domain is same hence no issue

* All requests end at the origin and not at the proxy. So, a request from 3000 which was proxied to 5000 will end to 3000

---

Refactoring

* In passport.js > use async await in GoogleStrategy's callback

---

Setting React Router and Redux

* **In client** Delete everything from src\ except registerServiceWorker.js
* 2 essential root (1 real) files
  * index.js it the real root for booting up react and mainly **redux** logic
  * App.js component under index.js is the rendering (react) layer. This is for setting up **react router** logic and all other components
  * index > App > Landing, Header, Dashboard ( > SurveyList > SurveyListItem), Survey/New ( > SurveyField)
* `npm install --save redux react-redux react-router-dom`
* Create src > index.js
* Setup React Root boilerplate
  * Import React and ReactDOM and setup ReactDOM.render()
* Create src > components > App.js
  * If file is exporting a Class or Component, filename starts with Capital
* Setup React component boilerplate
  * Create and Export a dummy functional react component
* In index.js, `ReactDOM.render(<App/>, document.querySelector('#root'))`

* React Component, calls > Action Creator, returns > Action, sent to > Reducers, updates state in > Store, sends state back to component causing them to Rerender
* Provider is a component that makes the store accessible to every component of in the app. Store is redux stuff. Provider is react component that knows how to read changes to redux store on changes and inform all its children components
* Redux store and provider setup

  * In index.js, import Provider from react-redux
  * Import createStore, applyMiddleware from redux
  * Create a new instance of the redux store using createStore
    * 1st arg: Reducer (dummy first that returns an array)
    * 2nd arg: Needed when SSR. Is initial state
    * 3rd arg: Middleware we want to hookup. Thunk later on
  * Setup Provider tag as parent of the entire app
    * Create new `<Provider></Provider>` tag. Supply newly created store that it will provide all components access to and put `<App/>` in ReactDOM.render() as its child

* Redux Reducer setup

  * 2 reducers: 1 for auth and 1 for surveys
  * combineReducer will combine all reducers and pass everything to redux store
  * Create src > reducers > authReducer.js, index.js
  * In authReducer.js, we create and export a reducer (a function)
    * function takes previous state (default empty object) and action as arguments
    * runs through types of action and returns new state as applicable
  * In index.js, we import authReducer, combine it using combineReducer provided by redux and immediately export it
    * Keys provided in combineReducer are available as keys in the store
  * In main index.js, import reducers from reducer/index.js and replace dummy array from the store creator

* React Router Setup

  * In App.js, import react-router-dom > BrowserRouter (brains), Route (used to setup rules for routing)
  * Make BrowserRouter tags and place a collection of Routes inside it
    * BrowserRouter should have at max 1 child. So pass only 1 <div></div> inside BrowserRouter and then place routing rules inside this div.
    * Since "/" is included in all routes as its the first character of all routes after ".com", use the exact property to match "/" exactly with "/" and not "contains /"
    * Routes are just like regular components which are visible/invisible based on route matching rules and hence can be nested with other components inside <BrowserRouter>

* Focussing on individual components
  * **Header**
  * New file components > Header.js
  * import React and Component, create a Component class, Header and then export it
  * Import this in App.js as Header
  * _Styling_
    * npm install --save materialize-css
    * Webpack combines all js and css files (and modules) before deployment. If we import css directly into js file, webpack will include it in our project output as the actual css
    * Go to node_modules > materialize-css > min.css and import it into project structure. It will be included automatically in final bundle. Import it one anywhere. Root index.js is good option. Webpack goes directly to npm_modules when no relative path is given in the import statement. CSS files aren't assigned to any variable so no need for `import x from filepath`. Just do `import filepath`
    * Materialize assumes we have 1 higher level element as "container" class. Make uppermost div as the "container"
* Determining user's logged in status

  * Action creator will call `api/current_user` to get status and then dispatch forward
  * React App Boots up > App component calls action creator >> fetchUser {axios.get('/api/current_user') > Express API > returns user > dispatch(action)} >> Redux Store {authReducer > new 'auth' piece of state } > Header
  * `npm install --save axios redux-thunk`
  * In index.js, import redux-thunk and pass it to applyMiddleware
  * In src, make actions folder > index.js and types.js

    * Import axios library in index.js and export const FETCH_USER = 'fetch_user' in types.js and then import it back to index.js
    * Call to `/api/current_user` using axios
    * In package.json, add proxy for route "/api/\*"
    * An action creator always returns an action which is a javascript object with a type and optional payload
    * **Redux Thunk :** Allow us to write action creators which breaks the rule of "we have to immediately return an action from every action creator we create
      * By default, dispatcher sends action to reducers behind the scenes. Redux thunk gives us access to Dispatch function
    * Usually, we do a `return {type: FETCH_USER, payload: data}` for actions which automatically gets dispatched to reducers
    * With thunk, we return a **function**. When we set redux-thunk as a middleware, it keeps checking if any action creator is returning a function instead of a regular action, it will automatically call this function and pass in the dispatch function as an argument. We can now instead of immediately returning an action, wait for stuffs to complete (ajax or async-await) and then later on pass the action to dispatch
    * Return a function from action creator which takes "dispatch" as argument and from the function being returned from action creator, use `dispatch({type: FETCH_USER, payload: data})` to dispatch action at any time. In this case, after axios is resolved
    * **FLOW v1:** Whenever action creator is called, it will return a function. Redux thunk will see we return a function and it will call it with the dispatch. We then make a request and wait for our api's response. Only after our response is complete, we then call dispatch with the action object as argument
    * Since user's auth status is required by entire app, call this action creator in App.js
    * _Refactor:_ App.js to class based from function based
    * Import `connect from react-redux` to connect React's App component with redux and call actions thereafter
    * Import `* as actions` from `../actions` to assign all actions to actions object
    * Change export to `export default connect(null, actions)(App)`
      * All actions are now available in App component as `Props`
    * In CDM (preferred over CWM because CWM is called many times)
      * call actions as `this.props.fetchUser()`

    ---

    Refactoring action creator

    * Remove curly braces and return keyword together from arrow function (when no other expression is there)
    * Return arrow function as action
    * Change await call to async-await

    ---

    * In authReducer.js, import { FETCH_USER } from types.js and add switch to watch for FETCH_USER action type
    * User's logged in status could either be logged in, logged out **or** unknown (if /api/current_user) is slow by some seconds. We can't show in / out based header without knowing exact user's status as it will flip as soon as we get results from the api. So we need a status of "unknown" as well
    * Default user's logged in status of state to null for "unknown" condition
    * Add `case FETCH_USER: return action.payload`. Add `|| false` to ensure false condition for empty payload instead of empty string
    * User's auth status now have either null, user model or false as value

    ---

    Connect Header to Redux store

    * import connect helper from react-redux
    * Setup connect() with Header using mapStateToProps
    * define mapStateToProps function which takes in state (deconstructed to auth key only) and returns an object of state keys required (again { auth: auth } only)


    * User's login status is now available in props.auth. We can use this to show/hide header items accordingly
    * Make a helper function `renderContent() {}` and use switch to run through this.props.auth. Use this inside render() as a function call inside {}
    * Using "Login with Google" redirects the user to `/auth/google/callback`. We need to send user to proper location after login
    * `app.get('/auth/google/callback', passport.authenticate('google'))`: Here 2nd argument is middleware where the return from google with the "code" is handled by passport's google strategy. The strategy then gets user's profile using this "code" and then runs the callback function in passport.js file. However, it doesn't know what to do with the req further and hence closes the response then and there. We need to a 3rd argument which will be res,res function and redirect the request to any route as per us. `/surveys` in this case. passport.authenticate('google') middleware now processes the call and then forwards it to 3rd argument
    * Link logout route in Header and tell backend route to redirect user to the root route

Improving landing page

* New components > Landing.js
* Create and Export a Welcome page using a stateless react component
* Make Emaily logo clicky. `<a>` tag navigates to a completely different HTML document. <Link> tags navigate to a different route rendered by React Router
* Import Link from react-router-dom. Replace logo's anchor tag with Link tag. Use to={} tell destination based on user's logged in status

---

Payments

* Using Stripe for payments
* **Flow:** User clicks "Add Credits" > Tell Stripe to show a credit card form > User enters credit card details > Details sent directly from the form to stripe > Stripe sends back a token representing the charge > We send token to our API > Our API confirms the charge was successful with Stripe > Add credits to user's account
* Make account in stripe and get keys for the api
* `npm install --save react-stripe-checkout`
* Create account in Stripe and get keys
* Add publishable and secret keys in dev.js
* Add both in prod.js for Heroku and add the same in Heroku website
* All these keys will be for use in Server side only. If we export this to client end, all keys here will be exposed to public via client side
* Client side only cares about publishable key and can freely be exposed
* To store and make available keys everywhere in react client side, make .env.development and .env.production files inside the client directory. All variable names should start with REACT _APP _
  * Make a variable REACT_APP_STRIPE_KEY=stripe's_publishable_key inside .env.dev and .env.prop files
  * All these variables are now available as process.env.REACT_APP_STRIPE_KEY
* New components > Payments.js
* Create and export react class component which render returns stripe checkout component
* Stripe defaults to USD cents. Send amount as props in the component. Set token props to the callback function after we receive the authentication from stripe. Set stripeKey to process.env.REACT_APP_STRIPE_KEY
* Show this component in Header
* After "Pay Card" action, Stripe sends back a token in the callback function
* Add name and description to Payments component for user's clarity
* We can pass a custom button as a child to StripeComponent for better styled button

* **Flow :** App boots up > Fetch current user > Header up to date. User pays money > Response sends back user > Header up to date
* Create new action creator: handleToken, which makes a post request to api `/api/stripe` with the token
* This action creator will dispatch updated user model. We can reuse FETCH_USER action here
* We need to hook this token dispatcher up with Payment component using connect and import actions
* Call action creator handleToken from 'token received' callback of stripe
* **In server :** Create a route to handle post request from stripe's callback's action creator
* Make a new folder for "Billing" routes and write a route for `/api/stripe`
* `npm install --save stripe`. This is used in backend to take token from client and create a charge for stripe api. Token is like a source of money
* Express doesn't by default parses payload of POST requests. We need `body-parser` middleware to do so. Payload is then available in req.body. `npm install --save body-parser`. Add it as middleware in index.js
* Create a stripe charges object using amount, currency, description and source which is the token that was passed from client's post call
* Above is an async method so use async-await
* Add "Credits" property to user model to keep track of user's credits
* Get current user (req.user) and update current user model, save it, and send it back as response
* We need to protect this route for logged in users only. We can add `if(!req.user) {res.status(401).send({error: 'You must logged in'})}` at the very start of the block. Not very reusable though
* We create a new middleware which checks for some paths that the user is logged in

  * Create middlewares > requireLogin.js
  * Define and export an arrow function
  * Since middlewares are functions that takes the incoming request and has the ability to modify it, we take in req, res and next arguments in this function. next is a function that we call after the middleware is complete. Calling next passes req on to the next middleware in the chain
  * Use this middleware in stripe post route before passing on to the stripe charge creation code

* **In client :** Show credits in header of the application
* In header.js, show a text to show user's credits from `this.props.auth.credits`

---

Deploying to Heroku (this time with react)

* In production, there are 3 types of routes
  * 1st: API routes like /auth/google, /api/current_user. Express must handle this like it always does. No change needed.
  * 2nd: Client routes like /surveys, /surverys/new. These are react router routes and Express must send back the index.html file which knows how to handle these since index.html **is** the client
  * 3rd: Client side file which resides in "/client/build/static/js/main.js" and are required by index.html for its processes. These are the JS/CSS files bundled by react on `npm run build`. Express must return them as it is
* We have to tell express to be aware of these other 2 options
* In server root index.js, before starting listening to requests, add codes as below
  * `if (process.env.NODE_ENV) === 'production') {}`: We need to do this only for production since client and server and served from same server in production
  * Add `app.use(express.static('client/build'))`. For every route in express that doesn't have any route handler setup, lookup in client/build folder and try to see if there's any file that matches the request file name
  * Add `app.get('*',res.sendFile-html)`. For any non-matching route, just serve up the html document
  * Express first sends the file if it exists in client/build. Else, index.html is the catch-all situation
* Need to push all code to Heroku and tell it to deploy the code
  * **Flow :** Push to Heroku > Heroku installs server deps > Heroku runs `heroku-postbuild` > We tell Heroku to install client deps > We tell Heroku to run `npm run build`
  * Heroku doesn't care about Client's package.json. Only about server. We thus tell Heroku explicitly to install client modules by using --prefix client
  * **In server :** In scripts, add `"heroku-postbuild": "NPM_CONFIG_PRODUCTION=false npm install --prefix client && npm run build --prefix client"`
    * This tells Heroku that after regular npm install of server after deployment, go inside client and run a npm install there. And then, again inside client, do a npm run build. Setting the config_production=false tells Heroku to install dev dependencies as well (instead of just the production dependencies which is default)
    * Commit and Push

---

Building Surveys

* Create a model class to define a new Survey
* New file: models > Survey.js
* Users will have Surveys documents. Surveys document will have Recipients sub-documents which is a list of email ids and a clicked? flag
* New file: models > Recipients.js
* Recipients is a sub-document and hence won't be registered with mongoose as a model
  * Export this sub-document and import it into Surveys.js model
* Since surveys are of each user, define an attribute `_user: {type: Schema.Types.ObjectId, ref: 'User'}`
  * With this, we tell SurveySchema that every survey will belong to a particular user. Every schema will be saved with the id of the user. 'ref' tells a reference to the 'User' model
  * `_user` exact variable name is not required but is good convention to denote a field that links other models (i.e. references)

API endpoint to create and save surveys

* New routes > surveyRoutes.js. Module.exports all routes and then add this route configuration in index.js
* Add a `/api/surveys` post route and ensure user is logged in, and user has enough credits
* Make and add a middleware to check if a user has enough credits (similar to check if user is logged in)
* Extract post's body properties
* Import 'surveys' model, create a survey instance from Survey class
  * Convert array of strings (emails) to array of objects for Sub-document
* **Flow :** Survey Instance + Email template = Mailer (Email Generation helper) -(http request)-> Send 'Mailer' to Email Provider

---

## Basic setup is done here. Only important pointers will be noted now

---

* Can't have destructing with arrow functions without the parenthesis
* Forms
  * Using React only for forms can create problems if we need to use the form's data in other components. We need to pass field inputs to a common parent and then pass the data on to target component
  * Redux is a good alternative but then we will need to create many action creators, a reducer, form validation and stuffs
  * Redux-forms makes is easier to handle forms with multiple fields with connecting it to redux store and validation logic
* Wiring up redux-form

  * **In client :** Install redux-form. Writing wizard form. Multiple pages
  * Redux form brings its own reducer
  * In reducers > index.js, `import reducer from 'redux-form'` and alias it to something unambiguous (reduxForm)
  * Add this reduxForm in combineReducer with a key to save it in redux store
  * Import a helper (reduxForm) from redux-form in the form component
  * Redux form needs to ability to connect to the Redux store. reduxForm is similar to the connect helper of redux library and uses the same signature for export default. reduxForm however takes only 1 argument to customize how our form behaves
  * Also import, Field component. Its a helper by reduxForm to render any type of traditional HTML component, TextArea, Checkbox etc. We need to provide a set of number minimum props to display any element
  * type, name and component: name is any string and tells redux form to store its data under that name inside 'form' key. component is the field type and type is the exact type (text, checkbox, radio button etc)
  * `component='input'` can be replaced with traditional "input" with custom react component
  * Wrap field with `<form>` tag and give it an onSubmit function that is provided by redux-form. reduxForm connected to SurveyForm is plugging its own props to SurveyForm. One of those props is handleSubmit. It calls the arrow function we give it with "values" we enter in the form. Values will have the "key" that we specify in the "name" property of the field
  * When giving custom react component to Field helper, it passes on its helper functions like onBlur, onChange as props so that we can implement them in the underlying custom component using ...
  * **Validation :** Provide `validate` command in reduxForm connector which is a user defined function. It takes a single argument of values which is an object of all values in our form. Is called when there is any change in any field of the form. Returning an empty object indicates no errors in the form. For every field in form with error, assign the same field name as key with error name as value to the error object. This error object is passed to respective FIELD based on same key inside "meta" prop. "meta" has other properties like touched? active? etc. We can use "touched" in conjunction with "error" attributes of meta in FIELD to show the error from redux-form
  * Redux-form discards all values from the store as soon as the form is unmounted or navigated away from. reduxForm helper (connector) takes an option property `destroyOnUnmount: false` to tell redux-form not to delete the values of the form