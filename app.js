const express    = require('express');
const exphbs     = require('express-handlebars');
const bodyParser = require('body-parser');
const path       = require('path');
// const fileUpload = require('express-fileupload');
var passport     = require("./config/passport");

var cookieParser = require('cookie-parser');
var session      = require('express-session');
var flash        = require('express-flash');

const apiRouter = require('./apis');

const app = express(); 

var sessionStore = new session.MemoryStore;

const PORT = process.env.PORT || 3000;

// app.use(fileUpload());
app.use(cookieParser('secret'));
app.use(session({
  cookie: { maxAge: (365 * 24 * 60 * 60 * 1000) },
  store: sessionStore,
  saveUninitialized: true,
  resave: 'true',
  secret: 'secret'
}));
app.use(flash());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.text({ type: 'text/*' })); //  to parse text/plain requests
//  set static folder
app.use(express.static(path.join(__dirname, '/static')));
console.log('path is: ' + __dirname);

// We need to use sessions to keep track of our user's login status
app.use(session({ secret: "keyboard cat", resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

require("./apis")(app);

//  init database
const db = require('./config/db');
db.authenticate()
.then(() => {
  console.log   ('Main Database connected...');
  //  start server
  app.listen(PORT, console.log(`Server running on port ${PORT} ...`));
})
.catch(err => console.log('Error: ' + err));
