var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = require('./users.js').User;
var Entry = require('./entries.js').Entry;
var validPassword = require('./users.js').validPassword;

passport.use(new LocalStrategy(
  function(username, password, done){ 
    User.findOne({username: username }, function(err, user){
      if(err) { return done(err); }
      if(!user) { return done(null, false); }
      if(!validPassword(password, user.salt, user.password)){ return done(null, false); }
      return done(null, user);
    }
   )
 }));

var checkAuthLocal = passport.authenticate('local', { failureRedirect: '/', session: true });

/* GET home page. */
router.get('/', function(req, res, next) {
    var name;
  if(req.user){
    var name = req.user.email;
  }
  res.render('index', { title: 'MyJournal - Data Collection Device', name: name });
});

router.get('/about', function(req, res, next){
  res.render('about', { title: 'About MyJournal'});
});

router.post('/login', checkAuthLocal, function(req, res, next){
  res.redirect('/');
});

router.get('/addUser',  function(req, res, next){
  //if(!req.user.admin){
	res.render('addUser');
  //} else {
	//res.render('index');
  //}
});

router.get('/newEntry', function(req, res, next){
  if(req.isAuthenticated()){
  res.render('newEntry');
  } else {
    res.redirect('/login');
  }
});

router.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

//router.post('/newEntry', function(req, res, next){
  //console.log(req.body);
  //res.send(200);
//});

router.get('/journal', async function(req, res){
	if(!req.isAuthenticated()){
		res.redirect('/');
	} else {
		var entries = await Entry.find({ userId : req.user._id });
		res.render('journal', { entries : entries } );
	}
});

router.get('/editEntry', function(req, res, next){
  if(req.isAuthenticated()){
    res.render('editEntry' , {mood : mood, note : note} );
  } else {
    res.redirect('/login');  
  }
});

//edit an entry probably
router.get('/editEntry/:e_id', async function(req, res, next){

  console.log("GOT ID " + req.params.e_id);
  // FIND ENTRY WITH ID e_ID
  if(!req.isAuthenticated()){
    res.redirect('/');
  }else{
  const entry = await Entry.findOne({
    _id : req.params.e_id
  });
  console.log(entry);
  res.render('editEntry', {entry: entry});

}
  
}
);

//delete an entry maybe?
router.get('/delete/:e_id', async function(req, res, next){
  console.log("here");
  if(!req.isAuthenticated()){
    res.redirect('/');
  }else {
    const entry = await Entry.deleteOne({
      userId : req.user._id,
      _id : req.params.e_id
    });
    res.redirect('/journal');
  }
});

//Add a new user
router.post('/addUser', async function(req, res, next){
  var newUser = User();
  newUser.email = req.body.Email;
  newUser.password = req.body.password;
  newUser.save();
  res.redirect(307, '/welcome');

});


router.get('/welcome', async function(req, res, next){
  res.render('welcome');
  
});


//Add a new journal entry to the journal someday maybe?
router.post('/newEntry', async function(req, res, next){
	console.log(req.body);
	if(req.user){
		var newEntry = Entry();
    newEntry.userId = req.user._id;
		newEntry.mood = req.body.Mood;
    newEntry.entry = req.body.note;
    newEntry.save();
		res.redirect('/journal');
        } else {
		var error = new Error("Not authorized.");
		error.status = 401;
		throw error;
        }
});

module.exports = router;
