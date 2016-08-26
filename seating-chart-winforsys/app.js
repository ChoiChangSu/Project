const express = require("express");
var cfenv = require('cfenv');
const expressSession = require('express-session');
const bodyParser = require("body-parser");
//const expressLayouts = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const router = require("./router");

const app = express();

//cyberccs
console.log("[DEBUG] Include SUCCESS");

app.use(cookieParser());
app.use(expressSession({secret:'winforsys'}));
app.use(bodyParser());
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(__dirname + '/public'));

//cyberccs
console.log("[DEBUG] Dir Name : " + __dirname);

//app.use(expressLayouts);
var appEnv = cfenv.getAppEnv();
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', router.index);

app.post('/login', router.login);

app.get('/logout', router.logout);

app.post('/register', router.register);
app.get('/register', router.register);

var server = app.listen(appEnv.port, '0.0.0.0', () => {
  //var host = server.address().address;
  //var port = server.address().port;

  console.log("Seating Chart app listening on " + appEnv.url);
});

/*
1. bluemix File Upload

cd code level folder
bluemix api https://api.au-syd.bluemix.net
bluemix login -u cschoi@winforsys.com -o winforsys -s winforsys
cf push seating-chart-winforsys
*/