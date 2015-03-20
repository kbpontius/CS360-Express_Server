var express = require('express');
var basicAuth = require('basic-auth-connect');
var https = require('https');
var http = require('http');
var fs = require('fs');
var url = require('url');

var app = express();

var bodyParser = require('body-parser');

var options = {
    host: '127.0.0.1',
    key: fs.readFileSync('ssl/server.key'),
    cert: fs.readFileSync('ssl/server.crt')
};

var ROOT_DIR = "/home/ec2-user/cs360/html/";

var auth = basicAuth(function(user, pass) {
	return((user ==='cs360')&&(pass === 'test'));
});

app.use(bodyParser());
app.use('/', express.static('/home/ec2-user/cs360/html/', {maxAge: 60*60*1000}));
app.get('/', function (req, res) {
	res.send("Get Index");
});

app.get('/mongo', function (req, res) {
	var MongoClient = require('mongodb').MongoClient;
    MongoClient.connect("mongodb://localhost/commentAPI", function(err, db) {
        if(err) {
            throw err;
        }

        db.collection("comments", function(err, comments){
            if(err) {
                throw err;
            }

            comments.find(function(err, items){
                items.toArray(function(err, itemArr){
                    res.writeHead(200);
                    res.end(JSON.stringify(itemArr));
                });
            });
        });
    });
});

app.post('/mongo', auth, function (req, res) {	
	console.log("POST comment route");

    var MongoClient = require('mongodb').MongoClient;
    MongoClient.connect("mongodb://localhost/commentAPI", function (err, db) {
        if (err) {
            throw err;
        }

        db.collection('comments').insert(req.body, function (err, records) {
            console.log("Document recorded as: " + records[0]._id);
            res.status(200);
			res.end();
        })
    });
});

app.get('/getcity', function (req, res) {
	var urlObj = url.parse(req.url, true, false);

	fs.readFile(ROOT_DIR + "cities.txt", function (err, data) {
      if (err) {
        throw err;
      }

      var queryCity = urlObj.query.q;
      var cities = data.toString().split("\n");

      var preJSON = [];

      cities.forEach(function(city) {
        if (city.toLowerCase().indexOf(queryCity.toLowerCase()) == 0) {
          console.log("PICKED: " + city);
          preJSON.push(city.toString());
        };
      });

      res.status(200);
      res.end(JSON.stringify(preJSON));
    });
});

http.createServer(app).listen(80);

https.createServer(options, app).listen(443);