/**
 * JournalAPI
 *
 * An API for storing journal entries along with
 * location data, mood data, and weather data.
 *
 * This file handles all the user information routes,
 * and should enable our users to create (if they are
 * an admin), update, get, and delete user data.
 *
 * CIS 371 - Fall 2021
 *
 */

/**********
 * Load all the libraries we need.
 **********/
var crypto = require('crypto');
var express = require('express');
var passport = require('passport');
var Strategy = require('passport-http').BasicStrategy
var pbkdf2 = require('pbkdf2');
var router = express.Router();

/**
 * Pull in the mongoose library and create a schema
 * to base our user model off.
 */
const mongoose = require('mongoose');

// User schema
const { Schema } = mongoose;

const userSchema = new Schema({
    email: {
		type: String,
		required: true
	},
    password: {
		type: String,
		required: true
	},
    salt: String,
    date: { 
		type: Date,
		default: Date.now },
    admin: {
		type: Boolean,
		default: false }
	
});

// User model
const User = mongoose.model('User', userSchema);

/**
 * Create a function that will check the information passed
 * in from the client headers (through the Passport library)
 * to see if it is the same information we have stored for
 * the user in the database.
 */
const validPassword = function(password, salt, hash){
	let key = pbkdf2.pbkdf2Sync(password, salt, 1, 32, 'sha512');

	if(key.toString('hex') != hash){
		return false;
	}
	return true;
}

/**
 * Teach passport what authorization means for our app.  There are
 * so many different things people may want to do, so we specify
 * how it works with our API here.
 */
passport.use(new Strategy(
	function(username, password, done) {
	  User.findOne({ username: username }, function (err, user) {
		  // Can't connect to Db?  We're done.
		if (err) {
			return done(err);
		}
		// User doesn't exist?  We're done.
		if (!user) { 
			console.log("No user found.");
			return done(null, false);
		}
		// Got this far?  Check the password.
		if (!validPassword(password, user.salt, user.password)) { 
			console.log("Wrong password.");
			return done(null, false);
		}
		// Otherwise, let them in and store the user in req.
		return done(null, user);
	  });
	}
  )
);

// I don't want to type this passport.authenticate, blah, blah line
// every time, so I'm aliasing it.
const checkAuth = passport.authenticate('basic', { session: false });

/**
 * Routes
 */

/**
 * GET users listing.
 * This will get all users, and should only be usable by an admin.
 */
router.get('/', checkAuth, async function(req, res, next) {
	if(req.user.admin){
		var users = await User.find({})
		res.json(users);
	} else {
		var error = new Error("Not authorized.");
		error.status = 401;
		throw err;
	}
});


/**
 * GET a single user.
 * This function may be used by an administrator, or by a user
 * ONLY IF they are asking for their own information.
 */
router.get('/:userId', checkAuth, async function(req, res, next){
	if(req.user.admin || req.user._id == req.params.userId){
		var user = await User.findOne({ _id : req.params.userId });
		res.json(user);
	} else {
		var error = new Error("Not authorized.");
		error.status = 401;
		throw error;
	}
});

/**
 * POST a new user.
 * Only administrators can add new users.
 */
router.post('/', checkAuth, async function(req, res, next){
	console.log(req.body);
	if(req.user.admin){
		var newUser = User();
		newUser.email = req.body.username;
		newUser.salt = crypto.randomBytes(32).toString('hex');
		console.log("Received: " + req.body.password);
		newUser.password = pbkdf2.pbkdf2Sync(req.body.password, newUser.salt, 1, 32, 'sha512').toString('hex');
		newUser.admin = false;
		newUser.save();
		res.send(200);
        } else {
		var error = new Error("Not authorized.");
		error.status = 401;
		throw error;
        }
});


module.exports = { checkAuth, router, User, validPassword };
