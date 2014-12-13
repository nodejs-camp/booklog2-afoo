var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var mongoose = require('mongoose');
var passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy;
var session = require('express-session');

var routes = require('./routes/index');
var users = require('./routes/users');
var posts = require('./routes/posts');
var paypal = require('./routes/paypal')

var app = express();

mongoose.connect('mongodb://localhost/booklog2');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log('MongoDB: connected.');   
});

var postSchema = new mongoose.Schema({
    // connect with mongodb index
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String,
    content: String,
    wchars: { type: Number, default: 0 },
    orders: [{
        userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        paypal: { type: Object, select: false }
    }],
});

var userSchema = new mongoose.Schema({
    username: { type: String, unique: true, select: false },
    displayname: { type: String, unique: true },
    email: { type: String, unique: true, select: false },
    timeCreated: { type: Date, default: Date.now, select: false },
    facebook: { type: Object, select: false }
});



postSchema.index( { title: 1 } );
postSchema.index( { title: "text" } );
postSchema.index( { content: "text" } );

postSchema.plugin(require('./schema/countPlugin'));

postSchema.methods.sync = function() {
    console.log('sync');
}

app.db = {
    model: {
        Post: mongoose.model('post', postSchema),
        User: mongoose.model('User', userSchema)
    }
};

// view engine setup
app.set('views',path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: 'booklog store' }));

/** add passport initialize */
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.use(new FacebookStrategy({
    clientID: '645016182285791',
    clientSecret: '8bd109bfa17563368a9c923a73f9d3b7',
    callbackURL: "http://localhost:3000/auth/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done){
        app.db.model.User.findOne({"facebook._json.id": profile._json.id}, function(err, user){
            if (!user) {
                var obj = {
                    username: profile.username,
                    displayname: profile.displayname,
                    email: '',
                    facebook: profile
                };

                var doc = new app.db.model.User(obj);
                doc.save();

                user = doc;
            }

            return done(null, user); //verify
        });
    }
));

app.use(function(req, res, next) {
    res.locals.user = req.user;
    next();
});

app.use('/', routes);
app.use('/users', users);

app.use(paypal);

// middleware stophere if without next
/*app.get('/1/post', function(req, res, next) {
    console.log('stop here');
    next();
});*/

/** REST APIs */
app.get('/1/post', posts.list);
app.get('/1/post/:tag', posts.listByTag);
app.post('/1/post', posts.create);

/** Pages */
app.get('/login', passport.authenticate('facebook'));
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { successRedirect: '/',
                                        failureRedirect: '/login/fail'}
    )
);

/** PayPal APIs */
app.put('/1/post/:postId/pay');

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


http.createServer(app).listen(3000, function(){
    console.log('Express server listening on port 3000');
});

module.exports = app;
