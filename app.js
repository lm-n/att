//requirements
var express = require("express"),
logger = require('morgan'),
Request = require('request'),
fs = require('fs'),
readline = require('readline'),
google = require('googleapis'),
googleAuth = require('google-auth-library');

var spreadsheetId = "1KqcGo_Tt4i8i_iuyX1XHhW_cNNh8yy_XdQLyAMt9e6Y";
var ranges = ['attendance system!B2:C1000', 'attendance checks!A2:B200'];

var netIDs_numberIDs = [], netIDs_checks = [];

var initialNetIDPopulation = {
  values: values = []
}
var updatedNetIDCheckPairs = {
  values: values = []
}


var SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
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
  var inDatabase =  checkDatabase(currentID);

  updatedNetIDCheckPairs.values = [];
  if(inDatabase != false){
    for( var i = 0; i < netIDs_checks.length; i++){
      updatedNetIDCheckPairs.values.push([netIDs_checks[i].netID, netIDs_checks[i].check]);
    }
    console.log(updatedNetIDCheckPairs.values);
    authorize(client_secrets, updateSheetData);
    console.log("added");
  }else{
    console.log("Not in attendance database, ask student to submit form");
  }
  Request(requestURL, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var theData = JSON.parse(body);
      //send all the data
      res.json(theData);
    }
  });
  res.json("success");
});

//Catch All Route
app.get("*", function(req, res){
  res.send('Sorry, nothing doing here.');
});

// Start the server
app.listen(3000);
console.log('Express started on port 3000');

//load client secrets from a local file.
fs.readFile("client_secret.json", function processClientSecrets(err, content){
    if(err){
        console.log("Error loading client secret file: " + err);
        return;
    }
    client_secrets = JSON.parse(content);
    authorize(JSON.parse(content), getSheetData);
});



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
      console.log("error");
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

//Initial grab of the sheet data only done on server initialization
//sheet data is not expected to be grabbed again while the server is up
function getSheetData(auth) {
  var sheets = google.sheets('v4');
  sheets.spreadsheets.values.batchGet({
    auth: auth,
    spreadsheetId: spreadsheetId,
    ranges: ranges,
  }, function(err, response) {
    //get all sheet data from the attendance database
    var attendanceDatabase = response.valueRanges[0].values;
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    if (attendanceDatabase == undefined) {
      console.log('No data found.');
    } else {
      //The netIDs are the most important bit here, and we can just grab
      //them and also the number IDs all at one from the attendance dataBase.
      for (var i = 0; i < attendanceDatabase.length; i++) {
        var row = attendanceDatabase[i];
        netIDs_numberIDs.push(new netIDNumberIDPairs(row[0], row[1]));
        netIDs_checks.push(new netIDCheckPair(row[0],""));
        initialNetIDPopulation.values.push([row[0], ""]);
        authorize(client_secrets, netIDSheetPopulation);
      }
      console.log(netIDs_checks);
    }
  });
}

//for the initial population of the attendance sheet
function netIDSheetPopulation(auth){
  var sheets = google.sheets('v4');
  sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    auth: auth,
    range: 'attendance checks!A2:B',
    valueInputOption: "RAW",
    resource: initialNetIDPopulation
  }, function(err, result){
    if(err){
      console.log(err);
    }else{
      console.log("Cells have been updated.");
    }
  })
}

//update the sheet after initial population
function updateSheetData(auth){
  var sheets = google.sheets('v4');
  sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    auth: auth,
    range: 'attendance checks!A2:B',
    valueInputOption: "RAW",
    resource: updatedNetIDCheckPairs
  }, function(err, result){
    if(err){
      console.log(err);
    }else{
      console.log("Cells have been updated.");
    }
  })
}

//check if the student is in the database via their number ID
//formatted as a 14 digit number formated like so: 88888888888888
//if they are, then you place an 'x' in the check member of the netIDCheckPair
function checkDatabase(currentID){
  console.log(netIDs_numberIDs);
  for(var i = 0; i < netIDs_numberIDs.length; i++){
    if (currentID == netIDs_numberIDs[i].numberID){
      netIDs_checks[i].check = "x";
      return true;
    }
  }
  return false;
}

function netIDCheckPair(netID, check){
  this.netID = netID;
  this.check = check;
}

function netIDNumberIDPairs(netID, numberID){
  this.netID = netID;
  this.numberID = numberID;
}