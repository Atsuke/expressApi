/**
 * JournalAPI
 *
 * An API for storing journal entries along with
 * location data, mood data, and weather data.
 *
 * This file handles all the journal entry information routes,
 * and should enable our users to create update, get, and delete
 * their entries.
 *
 * CIS 371 - Fall 2021
 *
 */

/**********
 * Load all the libraries we need.
 **********/

var express = require('express');
var router = express.Router();
var user = require('./users.js');
var checkAuth = user.checkAuth;

/**
 * Create the schemas we will need.
 * Point is just a GEOJson lat/long coordinate.
 * Entry is a journal entry.
 */

// Pull in the mongoose library
const mongoose = require('mongoose');
const { Schema } = mongoose;

const pointSchema = new Schema({
	type: {
		type: String,
		enum: ['Point'],
		required: true
	},
	coordinates: {
		type: [Number],
		required: true
	}
});

const entrySchema = new Schema({
	userId: mongoose.ObjectId,
        date: {
		type: Date,
		default: Date.now
	},
	mood: {
		type: String,
		required: true
	},
	entry: {
		type: String,
		required: true
	},
	location: {
		type: pointSchema,
		required: false
	},
	weather: String
});

// Really don't need the one for Point, but eh...
const Point = mongoose.model('Point', pointSchema);
const Entry = mongoose.model('Entry', entrySchema);

/* GET full entry listing for logged in user. */
router.get('/', checkAuth, async function(req, res, next) {
	var entries = await Entry.find({ userId: req.user._id });
	res.status(200);
	res.json(entries);
});

/**
 * Get single entry for logged in user
 */

router.get('/:entryId', checkAuth, async function(req, res, next){
	var entry = await Entry.findOne({
		_id : req.params.entryId
	});
	if(entry.userId == req.user._id || req.user.admin == true){
		res.json(entry);
	} else {
		var error = new Error("Not found.");
		error.status = 404;
			throw error;
	}
});

/**
 * Allow logged in user to create new entry.
 */
router.post('/', checkAuth, async function(req, res, next){
	if(!(req.body.entry && req.body.mood && req.body.location)){
		var error = new Error('Missing required information.');
		error.status = 400;
		throw error;
	}
	var entry = new Entry({
		userId: req.user._id,
		entry: req.body.entry,
		mood: req.body.mood,
		location: req.body.location
	});
	entry.save();
	res.status(200).send("Entry saved.");
});

/**
 * Allow a user to modify their own entry.
 */
router.put('/:entryId', checkAuth, async function(req, res, next){
	var entry = await Entry.findOne({
		userId : req.user._id,
		_id : req.params.entryId
	});

	if(!entry){
		var error = new Error('Entry not found.');
		error.status = 404;
		throw error;
	}

	if(!(req.body.entry && req.body.mood && req.body.location && req.body.weather)){
		console.log(req.body);
		var error = new Error('Missing required information.');
		error.status = 400;
		throw error;
	}

	entry.entry = req.body.entry;
	entry.mood = req.body.mood;
	entry.location = req.body.location;
	entry.weather = req.body.weather;
	entry.save();
	res.status(200).send('Entry saved.');
});

/**
 * Allow a user to delete one of their own entries.
 */
router.delete('/:entryId', checkAuth, async function(req, res,next){
	const entry = Entry.deleteOne({
		userId : req.users._id,
		_id : req.params.entryId
	});

	if(!entry){
		res.status(404).send("Not found.");
		next();
	}
});

module.exports = { router, Entry };
