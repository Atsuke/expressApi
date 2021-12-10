/**
 * JournalAPI
 *
 * An API for storing journal entries along with
 * location data, mood data, and weather data.
 *
 * CIS 371 - Fall 2021
 *
 */

/**********
 * Load all the libraries we need.
 **********/
var createError = require('http-errors');
var crypto = require('crypto');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var winston = require('winston');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');


/**********
 * Setup the logger.
 * We will store errors in error.log, combined info and errors
 * in combined, and if not in production mode we will also
 * output to the console.
 **********/
const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	defaultMeta: { service: 'JournalAPI' },
	transports: [
		new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
		new winston.transports.File({ filename: './logs/combined.log' }),
	],
});

if(process.env.NODE_ENV !== 'production'){
	logger.add(new winston.transports.Console({
		format: winston.format.simple(),
	}));
}

/**********
 * Connect to the mongodb instance.
 * If this fails, we should stop the process.
 * Notice that using +srv on the protocol causes the 
 * connection to use ssl by default.
 **********/
const uri = 'mongodb+srv://mrwoodring:badpassword@cluster0.lfzod.mongodb.net/Notes?retryWrites=true&w=majority'
mongoose.connect(uri).
	catch( error => 
		{ 
			logger.error('Cannot connect to mongo instance.');
			logger.error(error);
			logger.error('Shutting down API.');
			process.exit(1);
	}
);

mongoose.connection.on('error', err => {
	logger.error('Problem with the database connection...');
	logger.error(err);
});


/**********
 * Load the routes from the route files.
 **********/
var indexRouter = require('./routes/index.js');
var usersRouter = require('./routes/users.js');
var entriesRouter = require('./routes/entries.js');

/**********
 * Create an express app instance and setup all
 * the middleware and configurations.
 **********/
var app = express();
var secret = crypto.randomBytes(32).toString('hex');
// We want to save information in a session
// for the web interface.
app.use(session({
    secret: secret,
    resave: true,
    saveUninitialized: true
}));

// view engine setup (for later!)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Start passport and Ensure that the user information
// is saved to the session.
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure the user object (if there is one logged in)
// is available as a local var so templates can use it.
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter.router);
app.use('/entries', entriesRouter.router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler middleware
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
