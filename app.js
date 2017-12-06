//requirements
var express = require("express"),
logger = require('morgan'),
Request = require('request'),
fs = require('fs'),
readline = require('readline'),
google = require('googleapis'),
googleAuth = require('google-auth-library');

var netIDsNumberIDs = [];
var netIDsChecks = [];
var values = [];
var client_secrets;
var spreadsheetId = "1KqcGo_Tt4i8i_iuyX1XHhW_cNNh8yy_XdQLyAMt9e6Y";

var body = {
  values: values
};

var ranges = ['attendance system!B2:C1000', 'attendance checks!A2:B200'];

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
  if(inDatabase != false){
    body.values = [];
    for( var i = 0; i < netIDsChecks.length; i++){
      body.values.push([netIDsChecks[i].netID, netIDsChecks[i].check]);
      console.log(values);
    }
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


function getSheetData(auth) {
  var sheets = google.sheets('v4');
  sheets.spreadsheets.values.batchGet({
    auth: auth,
    spreadsheetId: spreadsheetId,
    ranges: ranges,
  }, function(err, response) {
    var attendanceSheet = response.valueRanges[0].values;
    var attendanceCheck = response.valueRanges[1].values; //delete this soon
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }

    if (attendanceSheet.length == 0) {
      console.log('No data found.');
    } else {

      //Populate the attendance sheet with netIDs, no x's yet
      for (var i = 0; i < attendanceSheet.length; i++) {
        var row = attendanceSheet[i];
        netIDsNumberIDs.push(new netIDnumberIDpair(row[0], row[1]));
        values.push([row[0], ""]);
        authorize(client_secrets, netIDSheetPopulation);
      }

      values = [];


      if (attendanceCheck != undefined){
        for (var i = 0; i < attendanceCheck.length; i++){
          var row = attendanceCheck[i];
          netIDsChecks.push(new netIDCheckPair(row[0], " "));
        }
      }
      console.log(netIDsChecks);
    }
  });
}

function netIDSheetPopulation(auth){
  var sheets = google.sheets('v4');
  sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    auth: auth,
    range: 'attendance checks!A2:B',
    valueInputOption: "RAW",
    resource: body
  }, function(err, result){
    if(err){
      console.log(err);
    }else{
      console.log("Cells have been updated.");
    }
  })
}

function updateSheetData(auth){
  console.log(body);
  var sheets = google.sheets('v4');
  sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    auth: auth,
    range: 'attendance checks!A2:B',
    valueInputOption: "RAW",
    resource: body
  }, function(err, result){
    if(err){
      console.log(err);
    }else{
      console.log("Cells have been updated.");
    }
  })
}


function checkDatabase(currentID){
  for(var i = 0; i < netIDsNumberIDs.length; i++){
    if (currentID == netIDsNumberIDs[i].numberID){
      netIDsChecks[i].check = "x";
      return netIDsNumberIDs[i].netID;
    }
  }
  return false;
}

function netIDCheckPair(netID, check){
  this.netID = netID;
  this.check = check;
}

function netIDnumberIDpair(netID, numberID){
  this.netID = netID;
  this.numberID = numberID;
}