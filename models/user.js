'use strict';

var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var jwt = require('jwt-simple');

const JWT_SECRET = 'this is my secret. TELL NOBODY. this can be as long as you would like';

var User;

var userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

userSchema.statics.authMiddleware = function(req, res, next) {
  var token = req.cookies.cadecookie;
  try {
    var payload = jwt.decode(token, JWT_SECRET);
  } catch(err) {
    return res.clearCookie('cadecookie').status(401).send();
  }
  // we have a valid token

  User.findById(payload.userId, function(err, user) {
    if(err || !user) {
      return res.clearCookie('cadecookie').status(401).send(err);
    }
    // the user exists!
    req.user = user; // making the user document availble to the route
    next(); // everything is good, and the request can continue
  });
};

userSchema.statics.authenticate = function(userObj, cb) {
  User.findOne({username: userObj.username}, function(err, dbUser) {
    if(err || !dbUser) {
      return cb("Authentication failed.");
    }
    bcrypt.compare(userObj.password, dbUser.password, function(err, isGood) {
      if(err || !isGood) {
        return cb("Authentication failed.");
      }

      var payload = {
        userId: dbUser._id,
        iat: Date.now()  // issued at time
      };
      // generate a token
      var token = jwt.encode(payload, JWT_SECRET);
      cb(null, token);
    });
  });
};

userSchema.statics.register = function(userObj, cb) {
  bcrypt.hash(userObj.password, 10, function(err, hash) {
    if(err) {
      return cb(err);
    }
    User.create({
      username: userObj.username,
      password: hash
    }, function(err) {
      cb(err);
    });
  });
};

User = mongoose.model('User', userSchema);

module.exports = User;
