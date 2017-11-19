//requirements
var express = require("express"),
logger = require('morgan'),
Request = require('request'),
fs = require('fs'),
readline = require('readline'),
google = require('googleapis'),
googleAuth = require('google-auth-library');




var daveID = "21142230523404",
luisID = "21142229562587";





var SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';




//Create an 'express' object
var app = express();

//Some Middleware - log requests to the terminal console
app.use(logger('dev'));

//Set up the views directory
app.set("views", __dirname + '/views');
//Set EJS as templating language WITH html as an extension
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
//Add connection to the public folder for css & js files
app.use(express.static(__dirname + '/public'));

/*-----
ROUTES
-----*/

//Main Page Route - NO data
app.get("/", function(req, res){
  res.render('index');
});


//JSON Serving route
app.get("/api/:id", function(req, res){
  //CORS enable this route - http://enable-cors.org/server.html
  res.header('Access-Control-Allow-Origin', "*");
  var currentID = req.params.id;
  var requestURL = "";
  /*Request(requestURL, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      //console.log(body);
      var theData = JSON.parse(body);
      //console.log(theData);
      //send all the data
      res.json(theData);
    }
  });*/
  res.json("success");
});

//Catch All Route
app.get("*", function(req, res){
  res.send('Sorry, nothing doing here.');
});

// Start the server
app.listen(3000);
console.log('Express started on port 3000');
















/*
//load client secrets from a local file.
fs.readFile("client_secret.json", function processClientSecrets(err, content){
    if(err){
        console.log("Error loading client secret file: " + err);
        return;
    }
    authorize(JSON.parse(content), doSomeShit);
});*/

function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}


function doSomeShit(auth) {
  var sheets = google.sheets('v4');
  sheets.spreadsheets.values.get({
    auth: auth,
    spreadsheetId: '1S0jdWWeC9C_3gVxkteeG-Ovj0r5d6q7v5bKvR7p77h8',
    range: 'AM',
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var rows = response.values;
    if (rows.length == 0) {
      console.log('No data found.');
    } else {
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if(row[0] == "dss441"){
            console.log("do something");
        }
      }
    }
  });
}