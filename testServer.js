var http = require('http');
var express = require('express');

var app = express();
var server = http.createServer(app);

app.use(express.static(__dirname + "/index"));

app.get('/', function(req, res, err) {
	res.send(200, "Success");
});

//(Temp variable), for Weather Information
var cityname, citylon, citylat, cityweather, weatherid, weathermain, citytemp, cityhumi, citytemp_min, citytemp_max, citywind, cityclouds, temp, humi;
//var weatherArr = new Array();

//(Temp variable2), for today weather Information
var citytime9, citytemp9, cityhumi9, citymain9, cityid9;
var citytime12, citytemp12, cityhumi12, citymain12, cityid12;
var citytime15, citytemp15, cityhumi15, citymain15, cityid15;
var citytime18, citytemp18, cityhumi18, citymain18, cityid18;
var citytime21, citytemp21, cityhumi21, citymain21, cityid21;

function currentInfo() {	
	var urlCurr = 'http://api.openweathermap.org/data/2.5/weather?q=Seoul&mode=json&units=metric&APPID=9b257482945770720bba08e66b3dcfac';

	http.get(urlCurr, function(res) {
		var body = '';
		res.on('data', function(chunk) {
			body += chunk.toString();
		});

		res.on('end', function() {
			try {
				var fbResponse = JSON.parse(body);

				cityname = fbResponse.name;
				citylon = fbResponse.coord.lon;
				citylat = fbResponse.coord.lat;
				weatherid = fbResponse.weather[0].id;
				weathermain = fbResponse.weather[0].main;
				citytemp = fbResponse.main.temp;
				cityhumi = fbResponse.main.humidity;
				citytemp_min = fbResponse.main.temp_min;
				citytemp_max = fbResponse.main.temp_max;
				citywind = fbResponse.wind.speed;
				cityclouds = fbResponse.clouds.all;
				
				console.log("cityname=", cityname);
				console.log("weatherid=", weatherid);
				console.log("weathermain=", weathermain);
				console.log("citytemp=", citytemp);
			} catch (e) {
				console.log(e);
				currentInfo();
			}
		});
		res.on('error', function(e) {
			console.log("Got an error: ", e);
		});
	});
}
//Active Once. (First)
currentInfo();
//After, repeat Active (After), - (period 1Hour, for update)
var curi = setInterval(currentInfo, 3600000);


//request for 5Days(forecast)
function weeksInfo() {
	var urlWeek = 'http://api.openweathermap.org/data/2.5/forecast?q=Seoul&mode=json&units=metric&APPID=9b257482945770720bba08e66b3dcfac';
	
	http.get(urlWeek, function(res) {
		var body2 = '';
		res.on('data', function(chunk2) {
			body2 += chunk2.toString();
		});

		res.on('end', function() {
			try {
				var fbResponse2 = JSON.parse(body2);

				citytemp9 = fbResponse2.list[0].main.temp;
				cityhumi9 = fbResponse2.list[0].main.humidity;
				cityid9 = fbResponse2.list[0].weather[0].id;
				citymain9 = fbResponse2.list[0].weather[0].main;
				
				citytemp12 = fbResponse2.list[1].main.temp;
				cityhumi12 = fbResponse2.list[1].main.humidity;
				cityid12 = fbResponse2.list[1].weather[0].id;
				citymain12 = fbResponse2.list[1].weather[0].main;

				citytemp15 = fbResponse2.list[2].main.temp;
				cityhumi15 = fbResponse2.list[2].main.humidity;
				cityid15 = fbResponse2.list[2].weather[0].id;
				citymain15 = fbResponse2.list[2].weather[0].main;

				citytemp18 = fbResponse2.list[3].main.temp;
				cityhumi18 = fbResponse2.list[3].main.humidity;
				cityid18 = fbResponse2.list[3].weather[0].id;
				citymain18 = fbResponse2.list[3].weather[0].main;

				citytemp21 = fbResponse2.list[4].main.temp;
				cityhumi21 = fbResponse2.list[4].main.humidity;
				cityid21 = fbResponse2.list[4].weather[0].id;
				citymain21 = fbResponse2.list[4].weather[0].main;
				
				console.log("citymain in 9(Morning)=", citymain9);
				console.log("citymain in 21(Evening)=", citymain9);
			} catch (e) {
				console.log(e);
				weeksInfo();
			}
		});
		res.on('error', function(e) {
			console.log("Got an error: ", e);
		});
	});	
}
weeksInfo();
var weeki = setInterval(weeksInfo, 86400000); //86400sec = 1 day,(period 1day, for update)

server.listen(8888, function(req, res) {
	console.log("server running on 8888.");
});