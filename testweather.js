/*
 * Hankuk University of Foreign Studies
 * Made by Jinwoo-Choi, Sirius. 
 */

var http = require('http');
var fs = require('fs');
var express = require('express');
var os = require('os');
var networkInterfaces = os.networkInterfaces( );

var socketio = require('socket.io');
var Gpio = require("onoff").Gpio;
var sensorLib = require('node-dht-sensor');

//require for 'mp3' or 'wav' File!
var lame = require('lame');

//for TTS(play song)
var Player = require('player');

//for TTS(voice)
var asyncblock = require('asyncblock');
var exec = require('child_process').exec;

var app = express();
var server = http.createServer(app);

app.use(express.static(__dirname + "/sirius"));

// for DB(MySQL)Connection.
var mysql = require('mysql');
var connection = mysql.createConnection({
	connectionLimit : 10,
	host : '127.0.0.1',
	port : 3306,
	user : 'root',
	password : 'mysql',
	database : 'wcdb'
});

// GCM Push
var gcm = require('node-gcm');
var message = new gcm.Message();
var server_api_key = 'AIzaSyB7jsEM749hkWjjBTlwk76SuxuFrN6jpwA';
var sender = new gcm.Sender(server_api_key);
var registrationIds = [];

var token = 'eoa7lkPXwrk:APA91bHvPrnWYLUqJWjR8YzA_oQC6xgViCfJETWh7glMmR6xNBFS18EecHYqwMeAznQcFp7rFAcGeGut8p66FM3iywIqHvaa85VgVUBTtQ40B-b8Kl3niU10JM9bQAHsTvS8zjvqYFDM';

registrationIds.push(token);

//gcm_string - (for GCM PUSH)
var gcm_string = "";

// RGB LED Port Enable
var rled = new Gpio(5, 'out');
var gled = new Gpio(17, 'out'); // PWM control
var bled = new Gpio(6, 'out');

//Just LED Port Enable
var rrled = new Gpio(23, 'out');
var yyled = new Gpio(24, 'out');
var ggled = new Gpio(25, 'out');

// Drizzle Motor Port Enable
var dmotor = new Gpio(19, 'out');
dmotor.writeSync(0); // Initializing value 0(LOW)

// Water Motor Port Enable
var wmotor = new Gpio(12, 'out');
wmotor.writeSync(0); // Initializing value 0(LOW)

// PAN motor Port Enable
var pmotor = new Gpio(26, 'out');
pmotor.writeSync(0); // Initializing value 0(LOW)

// Socket Connection
var io = socketio(server);
var client;
io.on('connection', function(socket) {
	client = socket;
});

console.log("Current Your Server IP(Wifi) :"+networkInterfaces.wlan0[0].address);

//City Initialize "Seoul-korea"
var cityname;
cityname = "Seoul";

// (Temp variable), for Weather Information
var cityname, citylon, citylat, cityweather, weatherid, weathermain, citytemp, cityhumi, citytemp_min, citytemp_max, citywind, cityclouds, temp, humi;
//var weatherArr = new Array();
var weatherArr = [];

//weather Information for Today.
var arrcitytime9 = [];
var arrcitytime12 = [];
var arrcitytime15 = [];
var arrcitytime18 = [];
var arrcitytime21 = [];

//(Temp variable2), for today weather Information
var citytime9, citytemp9, cityhumi9, citymain9, cityid9;
var citytime12, citytemp12, cityhumi12, citymain12, cityid12;
var citytime15, citytemp15, cityhumi15, citymain15, cityid15;
var citytime18, citytemp18, cityhumi18, citymain18, cityid18;
var citytime21, citytemp21, cityhumi21, citymain21, cityid21;

// Store to variable. (by using openweather API)
//repeat http.get request (as setInterval)
function currentInfo() {	
	var urlCurr = 'http://api.openweathermap.org/data/2.5/weather?q=' + cityname + '&mode=json&units=metric&APPID=9b257482945770720bba08e66b3dcfac';

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

				weatherArr[0] = fbResponse.name;
				weatherArr[1] = fbResponse.coord.lon;
				weatherArr[2] = fbResponse.coord.lat;
				weatherArr[3] = fbResponse.weather[0].id;
				weatherArr[4] = fbResponse.weather[0].main;
				weatherArr[5] = fbResponse.main.temp;
				weatherArr[6] = fbResponse.main.humidity;
				weatherArr[7] = fbResponse.main.temp_min;
				weatherArr[8] = fbResponse.main.temp_max;
				weatherArr[9] = fbResponse.wind.speed;
				weatherArr[10] = fbResponse.clouds.all;				
			} catch (e) {
				//console.log(e);
				currentInfo();
			}
		});
		res.on('error', function(e) {
			//console.log("Got an error: ", e);
		});
	});
}
//Active Once. (First)
currentInfo();
//After, repeat Active (After), - (period 1Hour, for update)
var curi = setInterval(currentInfo, 3600000);

//request for 5Days(forecast)
function weeksInfo() {
	var urlWeek = 'http://api.openweathermap.org/data/2.5/forecast?q=' + cityname + '&mode=json&units=metric&APPID=9b257482945770720bba08e66b3dcfac';
	
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
			} catch (e) {
				//console.log(e);
				weeksInfo();
			}
		});
		res.on('error', function(e) {
			//console.log("Got an error: ", e);
		});
	});	
}
weeksInfo();
var weeki = setInterval(weeksInfo, 86400000); //86400sec = 1 day,(period 1day, for update)

//Select city in application,
app.get('/selcity', function(req, res) {			//Total 39 cities
	var id = req.param('id');
	
	if(id == 0) {		//"Seoul"
		cityname = "Seoul";
	} else if(id == 1) {
		cityname = "Suigen";
	} else if(id == 2) {
		cityname = "Incheon";
	} else if(id == 3) {
		cityname = "Daejeon";
	} else if(id == 4) {
		cityname = "Changwon";
	} else if(id == 5) {
		cityname = "Anseong";
	} else if(id == 6) {
		cityname = "Wabu";
	} else if(id == 7) {
		cityname = "Andong";
	} 
	else if(id == 8) {
		cityname = "Tokyo";
	} else if(id == 9) {
		cityname = "Osaka-shi";
	} else if(id == 10) {
		cityname = "Fukuoka-shi";
	} else if(id == 11) {
		cityname = "Yokohama-shi";
	} else if(id == 12) {
		cityname = "Kawagoe";
	} else if(id == 13) {
		cityname = "Kobe-shi";
	} else if(id == 14) {
		cityname = "Hadano";
	} else if(id == 15) {
		cityname = "Chiba-shi";
	} else if(id == 16) {
		cityname = "kagoshima";
	} else if(id == 17) {
		cityname = "Washington, D. C.";
	} else if(id == 18) {
		cityname = "Chicago";
	} else if(id == 19) {
		cityname = "Los Angeles";
	} else if(id == 20) {
		cityname = "San Francisco";
	} else if(id == 21) {
		cityname = "New York";
	} else if(id == 22) {
		cityname = "Seattle";
	} else if(id == 23) {
		cityname = "Boston";
	} else if(id == 24) {
		cityname = "Las Vegas";
	} 
	else if(id == 25) {
		cityname = "Beijing";
	} else if(id == 26) {
		cityname = "shanghai";
	} else if(id == 27) {
		cityname = "Tianjin";
	} else if(id == 28) {
		cityname = "Hong Kong";
	} else if(id == 29) {
		cityname = "Guangzhou";
	} else if(id == 30) {
		cityname = "Chongqing";
	} 
	else if(id == 31) {
		cityname = "London";
	} 
	else if(id == 32) {
		cityname = "Paris";
	} 
	else if(id == 33) {
		cityname = "Roma";
	} else if(id == 34) {
		cityname = "Milano";
	} 
	else if(id == 35) {
		cityname = "Venice";
	} 
	else if(id == 36) {
		cityname = "Madrid";
	} 
	else if(id == 37) {
		cityname = "Istanbul";
	} else if(id == 38) {
		cityname = "Bangkok";
	}
	
	//URLS for request about selected city.
	var currUrl = 'http://api.openweathermap.org/data/2.5/weather?q=' + cityname + '&mode=json&units=metric&APPID=9b257482945770720bba08e66b3dcfac';
	var weekUrl = 'http://api.openweathermap.org/data/2.5/forecast?q=' + cityname + '&mode=json&units=metric&APPID=9b257482945770720bba08e66b3dcfac';
	
	http.get(currUrl, function(res1) {
		var body = '';
		res1.on('data', function(chunk) {
			body += chunk.toString();
		});

		res1.on('end', function() {
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
				
				http.get(weekUrl, function(res2) {
					var body2 = '';
					res2.on('data', function(chunk2) {
						body2 += chunk2.toString();
					});

					res2.on('end', function() {
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
						} catch (e) {
							//console.log(e);
							weeksInfo();
						}
					});
					res2.on('error', function(e) {
						//console.log("Got an error: ", e);
					});
				});	
				
				//Use json type, response for application.
				var obj = {
						cityname : cityname,
						weatherid : weatherid,
						weathermain : weathermain,
						citytemp : citytemp,
						cityhumi : cityhumi,
						citytemp_min : citytemp_min,
						citytemp_max : citytemp_max,
						citywind : citywind,
						cityclouds : cityclouds,
						temp : temp,
						humi : humi,
						citytemp9 : citytemp9,
						cityhumi9 : cityhumi9,
						citymain9 : citymain9,
						cityid9 : cityid9,
						citytemp12 : citytemp12,
						cityhumi12 : cityhumi12,
						citymain12 : citymain12,
						cityid12 : cityid12,
						citytemp15 : citytemp15,
						cityhumi15 : cityhumi15,
						citymain15 : citymain15,
						cityid15 : cityid15,
						citytemp18 : citytemp18,
						cityhumi18 : cityhumi18,
						citymain18 : citymain18,
						cityid18 : cityid18,
						citytemp21 : citytemp21,
						cityhumi21 : cityhumi21,
					citymain21 : citymain21,
					cityid21 : cityid21
				};

				//GCM String setting about each weather code.
				// 200, 201, 202, 210, 211, 212, 221, 230, 231, 232 thunderstorm
				if (weatherid >= 200 && weatherid < 250) {
					gcm_string = "현재 천둥/번개가 치고있습니다";
				}

				// 300, 301, 302, 310, 311, 312, 313, 314, 321 Drizzle
				if (weatherid >= 300 && weatherid < 350) {
					gcm_string = "현재 안개가 뿌옇습니다. 주의하세요";
				}

				// 500, 501, 502, 503, 504, 511, 520, 521, 522, 531 Rain
				if (weatherid >= 500 && weatherid < 550) {
					gcm_string = "현재 비가 내리고 있습니다. 우산을 꼭 챙겨가세요!";
				}

				// 600, 601, 602, 611, 612, 615, 616, 620, 621, 622 Snow
				if (weatherid >= 600 && weatherid < 650) {
					gcm_string = "현재 눈이 내리고 있습니다. 눈길 조심하세요!";
				}

				// 701, 711, 721, 731, 741, 751, 761, 762, 771, 781 Atmosphere
				if (weatherid >= 700 && weatherid <= 800) {
					gcm_string = "현재 날씨가 아주 맑습니다. 즐거운 하루 되세요!";
				}

				// 800, 801, 802, 803, 804 Clouds
				if (weatherid > 800 && weatherid < 810) {
					gcm_string = "현재 구름이 다소 있습니다. 좋은 하루 되세요!";
				}

				// 900:tornado, 901:tropical storm, 902:hurricane, 903:cold,
				// 904:hot, 905:windy, 906:hail (Extreme)
				if (weatherid >= 900 && weatherid < 910) {
					gcm_string = "현재 기상상황이 좋지 않습니다. 매우 주의하세요!!";
				}

				//GCM message Send(to android)
				var message = new gcm.Message({
					collapseKey : 'demo',
					delayWhileIdle : true,
					timeToLive : 3,
					data : {
						title : 'PUSH by ViewTower',
						message : gcm_string, // 각 해당날씨일 때,gcm_string에는 해당 날씨에
												// 대한 문자열이 들어가 있게 됨.
						custom_key1 : 'custom data1',
						custom_key2 : 'custom data2'
					}
				});
				sender.send(message, registrationIds, 4, function(err, result) {
					console.log(result);
				});
				//response JSON object!
				res.json(200, obj);
			} catch (e) {
				//console.log(e);
				currentInfo();
			}
		});
		res1.on('error', function(e) {
			//console.log("Got an error: ", e);
		});
	});
});


//General LEDS, (Location : in Outside cloud model)
//Just periodly ON/OFF
var ledflag=0;
function ledstrip() {
	//First Interval Light
	if(ledflag == 0) {
		ggled.writeSync(0);
		rrled.writeSync(1);		
		ledflag = 1;
	}
	//Second Interval Light
	else if(ledflag == 1) {
		rrled.writeSync(0);
		yyled.writeSync(1);
		ledflag = 2;		
	}
	//Third Interval Light
	else if(ledflag == 2) {
		yyled.writeSync(0);
		ggled.writeSync(1);		
		ledflag = 0;
	}
	//if you want to leds all off
	else if(ledflag == 99) {
		rrled.writeSync(0);
		ggled.writeSync(0);
		yyled.writeSync(0);
		ledflag = 0;		//next state ready
	}
}
var generalled = setInterval(ledstrip, 1000);

////////////////////////////////////////////////////////////////////////////////
//Weather Flag for Music functions!
var sunflag=0, windflag=0, rainflag=0, snowflag=0, thunderflag=0, drizzleflag=0, extremeflag=0;

//Each DB functions interval flags!
var cloudint, cloudinner, rainw, light, lightinner, dbextr;


//Application Access.
//Control in Android request(under side)  // Applications Access interval flags!
var suninter, cloudinter, raininter, snowinter, thunderinter, drizzleinter, extremeinter;

//One Main_DB_function excute Flag! 
var dbf;

//For Interval Clear!! (Very Important for setInterval)
//(Weather Interval Clear) function
function clearInter() {
	clearInterval(dbf);	
	clearInterval(cloudint);
	clearInterval(cloudinner);
	clearInterval(rainw);
	clearInterval(light);
	clearInterval(lightinner);
	clearInterval(dbextr);
	clearInterval(suninter);
	clearInterval(drizzleinter);
	clearInterval(raininter);
	clearInterval(thunderinter);
	clearInterval(snowinter);
	clearInterval(cloudinter);
	clearInterval(extremeinter);
}


//(for Music Clear) function
function clearmusicflag() {
	sunflag = 0;
	windflag = 0;
	rainflag = 0;
	snowflag = 0;
	thunderflag = 0;
	drizzleflag = 0;
	extremeflag = 0;
}

//All devices LOW State( Value : 0 )
function unexit() {
	//RGB LED(LOW)
	rled.writeSync(0); // RGB LED
	gled.writeSync(0);
	bled.writeSync(0);

	// Motors(Drizzle, Waterpump, Pan) (LOW)
	dmotor.writeSync(0);
	wmotor.writeSync(0);
	pmotor.writeSync(0);
}

//////////////////////////////////////////////////////////////////////////////////

//Initialize each Players null.
var sunplayer = null;
function sunmusic(sunflag) {
	if (sunflag == 1) {
		//When sunmusic active, If Song of sun is not started,
		if (sunplayer == null) {
			var songs = [ './music/sunny.mp3', './music/sunny.mp3',
					'./music/sunny.mp3', './music/sunny.mp3',
					'./music/sunny.mp3', './music/sunny.mp3',
					'./music/sunny.mp3', './music/sunny.mp3' ];
			
			//Create object "sunplayer"
			sunplayer = new Player(songs);
			sunplayer.playing = false;

			// play now and callback when playend (Active sunplayer)
			sunplayer.play(function(err, sunplayer) {
			});

			// event: on playing
			//If event is playing, sunplayer.playing's state is true.(for playing)
			sunplayer.on('playing', function(item) {
				sunplayer.playing = true;
			});

			//If event is exited, sunplayer.playing's state is false.(not playing, Find next song)
			sunplayer.on('playend', function(item) {
				sunplayer.playing = false;
			});

			// event: on error
			sunplayer.on('error', function(err) {
				//console.log(err);
			});

		} else {
			//If sunplayer is not null, (Current sunplayer's state is not null. (sunplayer's state is playing'state)

			//If sunplayer already playing, console.log("already playing!");
			if (sunplayer.playing) {
				console.log("Already playing!");
			}

			//If sunplayer'state is not playing(but sunplayer is not null) (When Song is finished), change sunplayer's value(change null), re playing for repeat!
			else {
				sunplayer = null;
				sunplayer.play(function(err, sunplayer) {
				});
			}
		}
	}
	//If sunflag == 0, need finish;
	else {
		if(sunplayer != null) {
			sunplayer.playing = false;
			sunplayer.stop();
			sunplayer = null;
		} 
	}
}

var windplayer = null;
function windmusic(windflag) {
	if (windflag == 1) {
		if (windplayer == null) {
			var songs = [ './music/windy.mp3', './music/windy.mp3',
					'./music/windy.mp3', './music/windy.mp3',
					'./music/windy.mp3', './music/windy.mp3',
					'./music/windy.mp3', './music/windy.mp3' ];
			windplayer = new Player(songs);
			windplayer.playing = false;

			// play now and callback when playend
			windplayer.play(function(err, windplayer) {
			});

			// event: on playing
			windplayer.on('playing', function(item) {
				windplayer.playing = true;
			});

			windplayer.on('playend', function(item) {
				windplayer.playing = false;
			});

			// event: on error
			windplayer.on('error', function(err) {
				// when error occurs
				//console.log(err);
			});

		} else {
			if (windplayer.playing) {
				console.log("Already windy Playing!");
			}
			else {
				windplayer = null;
				windplayer.play(function(err, windplayer) {

				});
			}
		}
	} else {
		if (windplayer != null) {
			windplayer.playing = false;
			windplayer.stop();
			windplayer = null;
		}
	}
}

var rainplayer = null;
function rainmusic(rainflag) {
	if(rainflag == 1) {
		if(rainplayer == null) {
			var songs = [ './music/rain.mp3', './music/rain.mp3',
					'./music/rain.mp3', './music/rain.mp3', './music/rain.mp3',
					'./music/rain.mp3', './music/rain.mp3', './music/rain.mp3' ];
			rainplayer = new Player(songs);
			rainplayer.playing = false;

			//play now and callback when playend
			rainplayer.play(function(err, rainplayer) {
				
			});

			//event: on playing
			rainplayer.on('playing', function(item) {
				rainplayer.playing = true;
			});

			rainplayer.on('playend', function(item) {
				rainplayer.playing = false;
			});

			// event: on error
			rainplayer.on('error', function(err) {
				// when error occurs
				// console.log(err);
			});
		} else {
			if (rainplayer.playing) {
				console.log("Already Rain playing!");
			} else {
				rainplayer = null;
				rainplayer.play(function(err, rainplayer) {
				});
			}
		}
	} else {
		if (rainplayer != null) {
			rainplayer.playing = false;
			rainplayer.stop();
			rainplayer = null;
		}
	}
}

var snowplayer = null;
function snowmusic(snowflag) {
	if (snowflag == 1) {
		if (snowplayer == null) {
			var songs = [ './music/snow.mp3', './music/snow.mp3',
					'./music/snow.mp3', './music/snow.mp3', './music/snow.mp3',
					'./music/snow.mp3', './music/snow.mp3', './music/snow.mp3' ];

			snowplayer = new Player('./music/snow.mp3');
			snowplayer.playing = false;

			// play now and callback when playend
			snowplayer.play(function(err, snowplayer) {
			});

			// event: on playing
			snowplayer.on('playing', function(item) {
				snowplayer.playing = true;
			});

			snowplayer.on('playend', function(item) {
				snowplayer.playing = false;
			});

			// event: on error
			snowplayer.on('error', function(err) {
				// when error occurs
				//console.log(err);
			});
		} else {
			if (snowplayer.playing) {
				console.log("Already Snow playing!");
			}
			else {
				snowplayer = null;
				snowplayer.play(function(err, snowplayer) {
				});
			}
		}
	} else {
		if (snowplayer != null) {
			snowplayer.playing = false;
			snowplayer.stop();
			snowplayer = null;
		}
	}
}


var thunderplayer = null;
function thundermusic(thunderflag) {
	if (thunderflag == 1) {
		if (thunderplayer == null) {
			var songs = [ './music/thunder.mp3', './music/thunder.mp3',
					'./music/thunder.mp3', './music/thunder.mp3',
					'./music/thunder.mp3', './music/thunder.mp3',
					'./music/thunder.mp3', './music/thunder.mp3' ];

			thunderplayer = new Player(songs);
			thunderplayer.playing = false;

			// play now and callback when playend
			thunderplayer.play(function(err, thunderplayer) {
			});

			// event: on playing
			thunderplayer.on('playing', function(item) {
				thunderplayer.playing = true;
			});

			thunderplayer.on('playend', function(item) {
				thunderplayer.playing = false;
			});

			// event: on error
			thunderplayer.on('error', function(err) {
				// when error occurs
				//console.log(err);
			});

		} else {
			if (thunderplayer.playing) {
				console.log("Already Thunder playing!");
			}
			else {
				thunderplayer = null;
				thunderplayer.play(function(err, thunderplayer) {
				});
			}
		}
	} else {
		if (thunderplayer != null) {
			thunderplayer.playing = false;
			thunderplayer.stop();
			thunderplayer = null;
		}
	}
}

var drizzleplayer = null;
function drizzlemusic(drizzleflag) {
	if (drizzleplayer == 1) {
		if (drizzleplayer == null) {
			var songs = [ './music/windy.mp3', './music/windy.mp3',
					'./music/windy.mp3', './music/windy.mp3',
					'./music/windy.mp3', './music/windy.mp3',
					'./music/windy.mp3', './music/windy.mp3',
					'./music/windy.mp3' ];

			drizzleplayer = new Player(songs);
			drizzleplayer.playing = false;

			// play now and callback when playend
			drizzleplayer.play(function(err, drizzleplayer) {
			});

			// event: on playing
			drizzleplayer.on('playing', function(item) {
				drizzleplayer.playing = true;
			});

			drizzleplayer.on('playend', function(item) {
				drizzleplayer.playing = false;
			});

			// event: on error
			drizzleplayer.on('error', function(err) {
				// when error occurs
				//console.log(err);
			});

		} else {
			if (drizzleplayer.playing) {
				console.log("Already Drizzle Playing!");
			}
			else {
				drizzleplayer = null;
				drizzleplayer.play(function(err, drizzleplayer) {
				});
			}
		}
	} else {
		if (drizzleplayer != null) {
			drizzleplayer.playing = false;
			drizzleplayer.stop();
			drizzleplayer = null;
		}
	}
}


var extremeplayer = null;
function extrememusic(extremeflag) {
	if (extremeflag == 1) {
		if (extremeplayer == null) {
			var songs = [ './music/suspense.mp3', './music/suspense.mp3',
					'./music/suspense.mp3', './music/suspense.mp3',
					'./music/suspense.mp3', './music/suspense.mp3',
					'./music/suspense.mp3', './music/suspense.mp3',
					'./music/suspense.mp3' ];
			extremeplayer = new Player(songs);
			extremeplayer.playing = false;

			// play now and callback when playend
			extremeplayer.play(function(err, extremeplayer) {
			});

			// event: on playing
			extremeplayer.on('playing', function(item) {
				extremeplayer.playing = true;
			});

			extremeplayer.on('playend', function(item) {
				extremeplayer = null;
				extremeplayer.playing = false;
				extremeplayer = new Player(songs);
				extremeplayer.play(function(err, extremeplayer) {
				});
			});

			// event: on error
			extremeplayer.on('error', function(err) {
				// when error occurs
				//console.log(err);
			});
		} else {
			if (extremeplayer.playing) {
				console.log("Already extreme plaing!");
			}
			else {
				extremeplayer = null;
				extremeplayer.play(function(err, extremeplayer) {
				});
			}
		}
	} else {
		if (extremeplayer != null) {
			extremeplayer.playing = false;
			extremeplayer.stop();
			extremeplayer = null;
		}
	}
}

////////////////////////////////////////////////////////////////////////////////
var musicflag=0;
function musicsControl(musicflag) {
	sunmusic(musicflag);
	windmusic(musicflag);
	rainmusic(musicflag);
	snowmusic(musicflag);
	thundermusic(musicflag);
	drizzlemusic(musicflag);
	extrememusic(musicflag);
}


//very Important functions.
//DB connection, (LED, Motor) set by responsing data in each weather DB table.
function DbsunWeather() { // weather Code : 700
	connection.connect(function(err) {
		//sunny table connection!
		connection.query('select * from sunny', function(err, rows) {
			if (err) {
				console.error('mysql GET connection error');
				console.error("Sun Get error : " + err);
			}
			//RGB LED setting
			rled.writeSync(rows[0].rled);
			gled.writeSync(rows[0].gled);
			bled.writeSync(rows[0].bled);
			
			//Waterpump, Pan motor, drizzle motor setting
			wmotor.writeSync(rows[0].wpump);
			pmotor.writeSync(rows[0].pmotor);
			dmotor.writeSync(rows[0].dmotor);
		});
	});
	//Other Musics initialize LOW State (except sunmusic)!
	var musicflag = 0;
	musicsControl(musicflag);
	sunmusic(1);
}

function DbcloudWeather() { // weather Code : 801 ~ 810
	connection.connect(function(err) {
		//cloudy DB table
		connection.query('select * from cloudy', function(err, rows) {
			if (err) {
				console.error('mysql GET connection error');
				console.error("Cloudy Get error : " + err);
			}
			rled.writeSync(rows[0].rled);
			gled.writeSync(rows[0].gled);
			bled.writeSync(rows[0].bled);

			wmotor.writeSync(rows[0].wpump);
			pmotor.writeSync(rows[0].pmotor);
			//dmotor.writeSync(rows[0].dmotor);
			
			//If you want to periodly drizzle motor's state on/off, remove "/* */"!
			var flag = true;
			
			cloudint = setInterval(function() {
				if (flag) {
					cloudinner = setInterval(function() {
						dmotor.writeSync(rows[0].dmotor);
						flag = false;						
					}, 1000); // Math.radnom() 1.0 > x >=0.0
				} else {
					dmotor.writeSync(rows[0].dmotor);
					flag = true;
				}
			}, 1000);
		});
	});
	var musicflag = 0;
	musicsControl(musicflag);
	windmusic(1);
}

function DbrainWeather() { // weather Code : 500~
	connection.connect(function(err) {
		//DB connection rain table
		connection.query('select * from rain', function(err, rows) {
			if (err) {
				console.error('mysql GET connection error');
				console.error("Rain Get DB error : " + err);
			}
			rled.writeSync(rows[0].rled);
			gled.writeSync(rows[0].gled);
			bled.writeSync(rows[0].bled);

			wmotor.writeSync(rows[0].wpump);
			pmotor.writeSync(rows[0].pmotor);
			var flag = true;
			rainw = setInterval(function() {
				if (flag) {
					dmotor.writeSync(rows[0].dmotor);
					flag = false;
				} else {
					dmotor.writeSync(0);
					flag = true;
				}
			}, 1000);
		});
	});
	var musicflag=0;
	musicsControl(musicflag);
	rainmusic(1);
}

function DbsnowWeather() { // weather Code : 600
	connection.connect(function(err) {
		//DB connection snow table
		connection.query('select * from snow', function(err, rows) {
			if (err) {
				console.error('mysql GET connection error');
				console.error("Snow Get error : " + err);
			}
			rled.writeSync(rows[0].rled);
			gled.writeSync(rows[0].gled);
			bled.writeSync(rows[0].bled);

			wmotor.writeSync(rows[0].wpump);
			pmotor.writeSync(rows[0].pmotor);
			dmotor.writeSync(rows[0].dmotor);
		});
	});
	var musicflag = 0;
	musicsControl(musicflag);
	snowmusic(1);
}

function DbthunderWeather() { // weather Code : 200
	connection.connect(function(err) {
		//DB connection thunder table
		connection.query('select * from thunder', function(err, rows) {
			if (err) {
				console.error('mysql GET connection error');
				console.error("Thunder Get error : " + err);
			}

			var flag = true;
			// If thunder state is HIGH, Light's state is glitter.(setInterval in setInterval!)
			light = setInterval(function() {
				if (flag) {
					var inflag = true;
					lightinner = setInterval(function() {
						if (inflag) {
							rled.writeSync(rows[0].rled);
							gled.writeSync(rows[0].gled);
							bled.writeSync(rows[0].bled);
						}
						inflag = false;
					}, 500);
					flag = false;
				} else {
					rled.writeSync(0);
					gled.writeSync(0);
					bled.writeSync(0);
					flag = true;
				}
			}, 100);
			wmotor.writeSync(rows[0].wpump);
			pmotor.writeSync(rows[0].pmotor);
			dmotor.writeSync(rows[0].dmotor);
		});
	});
	var musicflag=0;
	musicsControl(musicflag);
	thundermusic(1);
}

function DbdrizzleWeather() { // weather Code : 300
	connection.connect(function(err) {
		//DB Connection drizzle table
		connection.query('select * from drizzle', function(err, rows) {
			if (err) {
				console.error('mysql GET connection error');
				console.error("Drizzle Get error : " + err);
			}
			rled.writeSync(rows[0].rled);
			gled.writeSync(rows[0].gled);
			bled.writeSync(rows[0].bled);

			wmotor.writeSync(rows[0].wpump);
			pmotor.writeSync(rows[0].pmotor);			
			dmotor.writeSync(rows[0].dmotor);
		});
	});
	var musicflag = 0;
	musicsControl(musicflag);
	drizzlemusic(1);
}

function DbextremeWeather() { // weather Code : 900
	connection.connect(function(err) {
		//DB Connection extreme table
		connection.query('select * from extreme', function(err, rows) {
			if (err) {
				console.error('mysql GET connection error');
				console.error("Extreme Get error : " + err);
			}

			//Extreme LEDs's state is warning.
			var flag = true;
			dbextr = setInterval(function() {
				if(flag) {
					rled.writeSync(rows[0].rled);
					gled.writeSync(rows[0].gled);
					bled.writeSync(rows[0].bled);

					wmotor.writeSync(rows[0].wpump);
					pmotor.writeSync(rows[0].pmotor);
					dmotor.writeSync(rows[0].dmotor);
					flag = false;
				} else {
					rled.writeSync(0);
					gled.writeSync(0);
					bled.writeSync(0);
					flag = true;
				}
			}, 300);
		});
	});	
	
	var musicflag = 0;
	musicsControl(musicflag);
	extrememusic(1);
}

////////////////////////////////////////////////////////////////////////////////

//Very important Main DB Function!
//Extract data in DB tables, Active Tower view!
//First, compare with weather code, and select DB Table.
function dbfunc() {	
		if (weatherid >= 200 && weatherid < 250) {
			var thunder = new DbthunderWeather();
		} else if (weatherid >= 300 && weatherid < 350) {
			var drizzle = new DbdrizzleWeather();
		} else if (weatherid >= 500 && weatherid < 550) {
			var rain = new DbrainWeather();
		} else if (weatherid >= 600 && weatherid < 650) {
			var snow = new DbsnowWeather();
		} else if (weatherid >= 700 && weatherid <= 800) {
			var sun = new DbsunWeather();
		} else if (weatherid > 800 && weatherid < 810) {
			var cloud = new DbcloudWeather();
		} else if (weatherid >= 900 && weatherid < 910) {
			var extreme = new DbextremeWeather();
		}
}
//First active, wait 2sec for HTTP.GET time(in Openweather API) 
var tempdb = setInterval(function() {
	dbfunc();
	clearInterval(tempdb);
}, 2000);

//And, update view tower's state by calling Every 5sec DB.
dbf = setInterval(dbfunc, 5000); //5초마다 db함수를 불러옴

////////////////////////////////////////////////////////////////////////////////

//Control in Android request(under side)
//Application Access.

//Case : android Temp button Click (Temporarily - 5SEC)
app.get('/direct', function(req, res) {
	var num = req.param('num');
	
	if(num == 0) {		//If weather is sunny,
		//All state is LOW( value : 0 )
		clearInter();
		unexit();
		clearmusicflag();
		
		//Active sun DB conntion!
		var sun = new DbsunWeather();
		
		//Period is 3Sec. and clear.
		suninter = setInterval(function() {
			//view is re clear.(State is LOW)
			clearInter();
			clearmusicflag();
			unexit();
			//replay original weather Function.
			dbfunc();
			dbf = setInterval(dbfunc, 5000);
			//5sec delay.
		} , 5000);
	} else if(num == 1) {			//If weather is cloudy,
		clearInter();		
		unexit();
		clearmusicflag();
		
		var cloud = new DbcloudWeather();
		
		cloudinter = setInterval(function() {
			clearInter();
			clearmusicflag();
			unexit();
			dbfunc();
			dbf = setInterval(dbfunc, 5000);
		}, 5000);
	} else if(num == 2) {			//If weather is rain,
		clearInter();	
		unexit();
		clearmusicflag();
		
		var rain = new DbrainWeather();
		
		raininter = setInterval(function() {
			clearInter();		
			clearmusicflag();
			unexit();
			dbfunc();
			dbf = setInterval(dbfunc, 5000);
		}, 5000);
	} else if(num == 3) {			//If weather is snow,
		clearInter();		
		unexit();
		clearmusicflag();
		
		var snow = new DbsnowWeather();
		
		snowinter = setInterval(function() {
			clearInter();					
			clearmusicflag();
			unexit();
			dbfunc();
			dbf = setInterval(dbfunc, 5000);
		}, 5000);
	} else if(num == 4) {			//If weather is thunder,
		clearInter();
		unexit();
		clearmusicflag();
		
		var thunder = new DbthunderWeather();
		
		thunderinter = setInterval(function() {
			clearInter();
			clearmusicflag();
			unexit();
			dbfunc();
			dbf = setInterval(dbfunc, 5000);
		}, 5000);
	} else if(num == 5) {			//If weather is drizzle,
		clearInter();
		unexit();
		clearmusicflag();
		
		var drizzle = new DbdrizzleWeather();
		
		drizzleinter = setInterval(function() {
			clearInter();				
			clearmusicflag();
			unexit();			
			dbfunc();
			dbf = setInterval(dbfunc, 5000);
		}, 5000);
	} else if(num == 6) {			//If weather is extreme,
		clearInter();		
		unexit();
		clearmusicflag();
		
		var extreme = new DbextremeWeather();
		
		extremeinter = setInterval(function() {
			clearInter();
			clearmusicflag();
			unexit();
			dbfunc();
			dbf = setInterval(dbfunc, 5000);
		}, 5000);
	}
});

////////////////////////////////////////////////////////////////////////////////

//If you want to show(Continuously)
app.get('/view', function(req, res) {
	var viewnum = req.param('viewnum');
	
	var musicflag;
	
	if(viewnum == 0) {		//Weather is sunny,
		clearInter();
		clearmusicflag();
		unexit();
		var sun = new DbsunWeather();
	} else if(viewnum == 1) {	//Weather is cloudy,
		clearInter();
		clearmusicflag();
		unexit();
		var cloud = new DbcloudWeather();
	} else if(viewnum == 2) {	//Weather is rain,
		clearInter();
		clearmusicflag();
		unexit();
		var rain = new DbrainWeather();
	} else if(viewnum == 3) {	//Weather is snow,
		clearInter();
		clearmusicflag();
		unexit();
		var snow = new DbsnowWeather();
	} else if(viewnum == 4) {	//Weather is thunder,
		clearInter();
		clearmusicflag();
		unexit();
		var thunder = new DbthunderWeather();
	} else if(viewnum == 5) {	//Weather is drizzle,
		clearInter();
		clearmusicflag();
		unexit();
		var drizzle = new DbdrizzleWeather();
	} else if(viewnum == 6) {	//Weather is extreme,
		clearInter();
		clearmusicflag();
		unexit();
		var extreme = new DbextremeWeather();
	}
	
	//All off state!
	else if(viewnum == 7) {
		clearmusicflag();
		clearInter();
		unexit();
		clearInterval(dbf);
		
		//all Sons's state is LOW(off)
		
		//Outer LED OFF(include Interval)
		clearInterval(generalled);
		ledflag = 99;
		ledstrip(ledflag);
		
		musicflag = 0;
		musicsControl(musicflag);
	}
	
	//replay The original Weather State
	else if(viewnum == 8) {
		clearmusicflag();
		clearInter();
		clearInterval(dbf);
		unexit();
		
		musicflag = 0;
		musicsControl(musicflag);
		
		//original weather play!(Delay is 3Sec).
		dbfunc();
		dbf = setInterval(dbfunc, 5000);
		
		clearInterval(generalled);
		ledflag = 0;
		ledstrip(ledflag);
		generalled = setInterval(ledstrip, 1000);
	}
});

////////////////////////////////////////////////////////////////////////////////

//If You want to control View Tower's setting, Access DB and Data Update.
app.get('/dbupdate', function(req, res) {
	var weathinfo, redflag, greenflag, blueflag, waterflag, windyflag, drizzleflag;
	var id = req.param('id');
	var red = req.param('red');
	var green = req.param('green');
	var blue = req.param('blue');
	var water = req.param('water');
	var windy = req.param('windy');
	var drizzle = req.param('drizzle');
	
	if(red == "true") {
		redflag=1;
	} else {
		redflag=0;
	}
	if(green == "true") {
		greenflag=1;
	} else {
		greenflag=0;
	}
	if(blue == "true") {
		blueflag=1;
	} else {
		blueflag=0;
	}
	if(water == "true") {
		waterflag=1;
	} else {
		waterflag=0;
	}
	if(windy == "true") {
		windyflag=1;
	} else {
		windyflag=0;
	}
	if(drizzle == "true") {
		drizzleflag=1;
	} else {
		drizzleflag=0;
	}
	/*
	(red === "true") ? redflag = 1 : redflag = 0;
	(green === "true") ? greenflag = 1 : greenflag = 0;
	(blue === "true") ? blueflag = 1 : blueflag = 0;
	(water === "true") ? waterflag = 1 : waterflag = 0;
	(windy === "true") ? windyflag = 1 : windyflag = 0;
	(drizzle === "true") ? drizzleflag = 1 : drizzleflag = 0;*/
	
	//Setting object is total devies state.
	var setting = {'rled':redflag, 'gled':greenflag, 'bled':blueflag, 'wpump':waterflag, 'pmotor':windyflag, 'dmotor':drizzleflag };
	
	//update DB
	if(id == 1) {
		connection.connect(function(err) {
			connection.query('UPDATE sunny SET ? ', setting , function(err, result, rows) {
				if (err) { 
					console.error('mysql SET connection error'); 
					console.error("SET" + "err : " + err); 
				} 
			});
		});
		var sunobj = new DbsunWeather();
	} else if(id == 2) {
		connection.connect(function(err) {
			connection.query('UPDATE cloudy SET ? ', setting , function(err, result, rows) {
				if (err) { 
					console.error('mysql SET connection error'); 
					console.error("SET" + "err : " + err); 
				} 
			});
		});
		var cloudobj = new DbcloudWeather();
	} else if(id == 3) {
		connection.connect(function(err) {
			connection.query('UPDATE rain SET ? ', setting , function(err, result, rows) {
				if (err) { 
					console.error('mysql SET connection error'); 
					console.error("SET" + "err : " + err); 
				} 
			});
		});
		var rain = new DbrainWeather();
	} else if(id == 4) {
		connection.connect(function(err) {
			connection.query('UPDATE snow SET ? ', setting , function(err, result, rows) {
				if (err) { 
					console.error('mysql SET connection error'); 
					console.error("SET" + "err : " + err); 
				} 
			});
		});
		var snowobj = new DbsnowWeather();
	} else if(id == 5) {
		connection.connect(function(err) {
			connection.query('UPDATE thunder SET ? ', setting , function(err, result, rows) {
				if (err) { 
					console.error('mysql SET connection error'); 
					console.error("SET" + "err : " + err); 
				} 
			});
		});
		var thunderobj = new DbthunderWeather();
	} else if(id == 6) {
		connection.connect(function(err) {
			connection.query('UPDATE drizzle SET ? ', setting , function(err, result, rows) {
				if (err) { 
					console.error('mysql SET connection error'); 
					console.error("SET" + "err : " + err); 
				} 
			});
		});
		var drizzleobj = new DbdrizzleWeather();
	} else if(id == 7) {
		connection.connect(function(err) {
			connection.query('UPDATE extreme SET ? ', setting , function(err, result, rows) {
				if (err) { 
					console.error('mysql SET connection error'); 
					console.error("SET" + "err : " + err); 
				} 
			});
		});
		var extremeobj = new DbextremeWeather();
	}
	console.log("DB update success!");
	res.send(200, "success!");
});

////////////////////////////////////////////////////////////////////////////////

//If have voice control in Android application, Show view Tower(during 10Sec).
app.get('/vcontrol', function(req, res) {
	var cmd = req.param('command');
	
	var musicflag;

	if (cmd == "sunny") {
		console.log("Sunny voice success!");
		clearInter();
		clearmusicflag();
		unexit();
		
		DbsunWeather();
		
		var sun_inter = setInterval(function() {
			clearmusicflag();
			clearInter();
			unexit();
			clearInterval(sun_inter);
			dbfunc();
			dbf = setInterval(dbfunc, 5000);
		} , 5000);
	} else if (cmd == "drizzle") {
		console.log("Drizzle voice success!");
		clearInter();
		clearmusicflag();
		unexit();
		
		DbdrizzleWeather();
		
		var drizzle_inter = setInterval(function() {
			clearmusicflag();
			clearInter();
			unexit();
			clearInterval(drizzle_inter);
			dbfunc();
			dbf = setInterval(dbfunc, 5000);
		}, 5000);
	} else if (cmd == "rain") {
		console.log("Rain voice success!");
		clearInter();
		clearmusicflag();
		unexit();
		
		DbrainWeather();
		
		var rain_inter = setInterval(function() {
			clearmusicflag();
			clearInter();
			unexit();
			clearInterval(rain_inter);
			dbfunc();
			dbf = setInterval(dbfunc, 5000);
		}, 5000);
	} else if (cmd == "thunder") {
		console.log("Thunder voice success!");
		clearInter();
		clearmusicflag();
		unexit();
		
		DbthunderWeather();
		
		var thunder_inter = setInterval(function() {
			clearmusicflag();
			clearInter();
			unexit();
			clearInterval(thunder_inter);
			dbfunc();
			dbf = setInterval(dbfunc, 5000);
		}, 5000);
	} else if (cmd == "snow") {
		console.log("Snow voice success!");
		clearInter();
		clearmusicflag();
		unexit();
		
		DbsnowWeather();
		
		var snow_inter = setInterval(function() {
			clearmusicflag();
			clearInter();
			unexit();
			clearInterval(snow_inter);
			dbfunc();
			dbf = setInterval(dbfunc, 5000);
		}, 5000);
	} else if (cmd == "cloudy") {
		console.log("Cloudy voice success!");
		clearInter();
		clearmusicflag();
		unexit();
		
		DbcloudWeather();
		
		var cloud_inter = setInterval(function() {
			clearmusicflag();
			clearInter();
			unexit();
			clearInterval(cloud_inter);
			dbfunc();
			dbf = setInterval(dbfunc, 5000);
		}, 5000);
	} else if (cmd == "extreme") {
		console.log("Extreme voice success!");
		clearInter();
		clearmusicflag();
		unexit();
		
		DbextremeWeather();
		
		var extreme_inter = setInterval(function() {
			clearmusicflag();
			clearInter();
			unexit();
			clearInterval(extreme_inter);
			dbfunc();
			dbf = setInterval(dbfunc, 5000);
		}, 5000);
	} else if(cmd == "hi") {			//If voice control is hello or hi, all Music is OFF and Out voice play(TTS)
		musicflag = 0;
		musicsControl(musicflag);
		
		asyncblock(function (flow) {
			//Have hello.wav (use pico2wave!), voice string is "Hello Sir". 
		    exec('pico2wave --wave hello.wav "Hello Sir"', flow.add());
		    var result = flow.wait();
		    //Play voice(TTS) in hello.wav file!
		    exec('aplay hello.wav', flow.add());
		    console.log(result);    // There'll be trailing \n in the output
		    console.log('More results like if it were sync...');
		});
	} else if(cmd == "who") {			//If voice control is Who? or Who are you?,
		musicflag = 0;
		musicsControl(musicflag);

		asyncblock(function (flow) {
			//Voice file have String "Hello I am View Tower".
		    exec('pico2wave --wave hello.wav "Hello I am View Tower"', flow.add());
		    var result = flow.wait();
		    exec('aplay hello.wav', flow.add());
		    console.log(result);    // There'll be trailing \n in the output
		    console.log('More results like if it were sync...');
		});
	} else if(cmd == "love") {			//If Voice control is who love? or your love? or Eunhye etc... it just my secret event.
		musicflag = 0;
		musicsControl(musicflag);

		asyncblock(function (flow) {
		    exec('pico2wave --wave lover.wav "Sirius loves her"', flow.add());
		    var result = flow.wait();
		    exec('aplay lover.wav', flow.add());
		    console.log(result);    // There'll be trailing \n in the output
		    console.log('More results like if it were sync...');
		});
	} else if(cmd == "weather") {			//If voice control is today weather? or current weather? etc..
		musicflag = 0;
		musicsControl(musicflag);
		
		asyncblock(function (flow) {
			//weathermain has current weather state.
		    exec('pico2wave --wave hello.wav ' + weathermain, flow.add());
		    var result = flow.wait();
		    exec('aplay hello.wav', flow.add());
		    console.log(result);    // There'll be trailing \n in the output
		    console.log('More results like if it were sync...');
		});
	} else if (cmd == "not") {			//If voice control is not corrected,
		console.log("Voice-input is not weather Code!");
	}
	res.send(200, "Weather Code success.");
});

////////////////////////////////////////////////////////////////////////////////
//var redflag, greenflag, blueflag, waterflag, drizzleflag, panflag;

//Access in Web browser
//If Setting sun state in Web browser
app.get('/suncmd.do', function(req, res){
	var redflag, greenflag, blueflag, waterflag, drizzleflag, panflag;
	
	var redsw = req.param('redled');
	var greensw = req.param('greenled');
	var bluesw = req.param('blueled');
	var watersw = req.param('water');
	var drizzlesw = req.param('drizzle');
	var pansw = req.param('pan');
	
	//Record button state. and store each flag.
	if(redsw == "on") {
		redflag=1;
	} else {
		redflag=0;
	}
	if(greensw == "on") {
		greenflag=1;
	} else {
		greenflag=0;
	}
	if(bluesw == "on") {
		blueflag=1;
	} else {
		blueflag=0;
	}
	if(watersw == "on") {
		waterflag=1;
	} else {
		waterflag=0;
	}
	if(pansw == "on") {
		panflag=1;
	} else {
		panflag=0;
	}
	if(drizzlesw == "on") {
		drizzleflag=1;
	} else {
		drizzleflag=0;
	}
	
	var setting = {
		'rled' : redflag,
		'gled' : greenflag,
		'bled' : blueflag,
		'wpump' : waterflag,
		'pmotor' : panflag,
		'dmotor' : drizzleflag
	};

	//Update to each DB Table
	connection.connect(function(err) {
		connection.query('UPDATE sunny SET ? ', setting, function(err, result,
				rows) {
			if (err) {
				console.error('mysql SET connection error');
				console.error("SET" + "err : " + err);
			}
		});
	});
	
	res.send(200, {"result":"ok"});
});

app.get('/cloudcmd.do', function(req, res){
	var redflag, greenflag, blueflag, waterflag, drizzleflag, panflag;
	
	var redsw = req.param('redled');
	var greensw = req.param('greenled');
	var bluesw = req.param('blueled');
	var watersw = req.param('water');
	var drizzlesw = req.param('drizzle');
	var pansw = req.param('pan');
	
	if(redsw == "on") {
		redflag=1;
	} else {
		redflag=0;
	}
	if(greensw == "on") {
		greenflag=1;
	} else {
		greenflag=0;
	}
	if(bluesw == "on") {
		blueflag=1;
	} else {
		blueflag=0;
	}
	if(watersw == "on") {
		waterflag=1;
	} else {
		waterflag=0;
	}
	if(pansw == "on") {
		panflag=1;
	} else {
		panflag=0;
	}
	if(drizzlesw == "on") {
		drizzleflag=1;
	} else {
		drizzleflag=0;
	}
	
	var setting = {
		'rled' : redflag,
		'gled' : greenflag,
		'bled' : blueflag,
		'wpump' : waterflag,
		'pmotor' : panflag,
		'dmotor' : drizzleflag
	};

	connection.connect(function(err) {
		connection.query('UPDATE cloudy SET ? ', setting, function(err, result, rows) {
			if (err) {
				console.error('mysql SET connection error');
				console.error("SET" + "err : " + err);
			}
		});
	});
	res.send(200, {"result":"ok"});
});

app.get('/raincmd.do', function(req, res){
	var redflag, greenflag, blueflag, waterflag, drizzleflag, panflag;
	
	var redsw = req.param('redled');
	var greensw = req.param('greenled');
	var bluesw = req.param('blueled');
	var watersw = req.param('water');
	var drizzlesw = req.param('drizzle');
	var pansw = req.param('pan');
	
	if(redsw == "on") {
		redflag=1;
	} else {
		redflag=0;
	}
	if(greensw == "on") {
		greenflag=1;
	} else {
		greenflag=0;
	}
	if(bluesw == "on") {
		blueflag=1;
	} else {
		blueflag=0;
	}
	if(watersw == "on") {
		waterflag=1;
	} else {
		waterflag=0;
	}
	if(pansw == "on") {
		panflag=1;
	} else {
		panflag=0;
	}
	if(drizzlesw == "on") {
		drizzleflag=1;
	} else {
		drizzleflag=0;
	}
	
	var setting = {
		'rled' : redflag,
		'gled' : greenflag,
		'bled' : blueflag,
		'wpump' : waterflag,
		'pmotor' : panflag,
		'dmotor' : drizzleflag
	};

	connection.connect(function(err) {
		connection.query('UPDATE rain SET ? ', setting, function(err, result, rows) {
			if (err) {
				console.error('mysql SET connection error');
				console.error("SET" + "err : " + err);
			}
		});
	});
	res.send(200, {"result":"ok"});
});

app.get('/snowcmd.do', function(req, res){
	var redflag, greenflag, blueflag, waterflag, drizzleflag, panflag;
	
	var redsw = req.param('redled');
	var greensw = req.param('greenled');
	var bluesw = req.param('blueled');
	var watersw = req.param('water');
	var drizzlesw = req.param('drizzle');
	var pansw = req.param('pan');
	
	if(redsw == "on") {
		redflag=1;
	} else {
		redflag=0;
	}
	if(greensw == "on") {
		greenflag=1;
	} else {
		greenflag=0;
	}
	if(bluesw == "on") {
		blueflag=1;
	} else {
		blueflag=0;
	}
	if(watersw == "on") {
		waterflag=1;
	} else {
		waterflag=0;
	}
	if(pansw == "on") {
		panflag=1;
	} else {
		panflag=0;
	}
	if(drizzlesw == "on") {
		drizzleflag=1;
	} else {
		drizzleflag=0;
	}
	
	var setting = {
		'rled' : redflag,
		'gled' : greenflag,
		'bled' : blueflag,
		'wpump' : waterflag,
		'pmotor' : panflag,
		'dmotor' : drizzleflag
	};

	connection.connect(function(err) {
		connection.query('UPDATE snow SET ? ', setting, function(err, result, rows) {
			if (err) {
				console.error('mysql SET connection error');
				console.error("SET" + "err : " + err);
			}

		});
	});
	res.send(200, {"result":"ok"});
});

app.get('/thundercmd.do', function(req, res){
	var redflag, greenflag, blueflag, waterflag, drizzleflag, panflag;
	
	var redsw = req.param('redled');
	var greensw = req.param('greenled');
	var bluesw = req.param('blueled');
	var watersw = req.param('water');
	var drizzlesw = req.param('drizzle');
	var pansw = req.param('pan');
	
	if(redsw == "on") {
		redflag=1;
	} else {
		redflag=0;
	}
	if(greensw == "on") {
		greenflag=1;
	} else {
		greenflag=0;
	}
	if(bluesw == "on") {
		blueflag=1;
	} else {
		blueflag=0;
	}
	if(watersw == "on") {
		waterflag=1;
	} else {
		waterflag=0;
	}
	if(pansw == "on") {
		panflag=1;
	} else {
		panflag=0;
	}
	if(drizzlesw == "on") {
		drizzleflag=1;
	} else {
		drizzleflag=0;
	}
	
	var setting = {
		'rled' : redflag,
		'gled' : greenflag,
		'bled' : blueflag,
		'wpump' : waterflag,
		'pmotor' : panflag,
		'dmotor' : drizzleflag
	};

	connection.connect(function(err) {
		connection.query('UPDATE thunder SET ? ', setting, function(err, result, rows) {
			if (err) {
				console.error('mysql SET connection error');
				console.error("SET" + "err : " + err);
			}
		});
	});
	res.send(200, {"result":"ok"});
});

app.get('/drizzlecmd.do', function(req, res){
	var redflag, greenflag, blueflag, waterflag, drizzleflag, panflag;
	
	var redsw = req.param('redled');
	var greensw = req.param('greenled');
	var bluesw = req.param('blueled');
	var watersw = req.param('water');
	var drizzlesw = req.param('drizzle');
	var pansw = req.param('pan');
	
	if(redsw == "on") {
		redflag=1;
	} else {
		redflag=0;
	}
	if(greensw == "on") {
		greenflag=1;
	} else {
		greenflag=0;
	}
	if(bluesw == "on") {
		blueflag=1;
	} else {
		blueflag=0;
	}
	if(watersw == "on") {
		waterflag=1;
	} else {
		waterflag=0;
	}
	if(pansw == "on") {
		panflag=1;
	} else {
		panflag=0;
	}
	if(drizzlesw == "on") {
		drizzleflag=1;
	} else {
		drizzleflag=0;
	}
	/*(redsw === "on") ? redflag = 1 : redflag = 0;
	(greensw === "on") ? greenflag = 1 : greenflag = 0;
	(bluesw === "on") ? blueflag = 1 : blueflag = 0;
	(watersw === "on") ? waterflag = 1 : waterflag = 0;
	(pansw === "on") ? panflag = 1 : panflag = 0;
	(drizzlesw === "on") ? drizzleflag = 1 : drizzleflag = 0;*/
	
	var setting = {
		'rled' : redflag,
		'gled' : greenflag,
		'bled' : blueflag,
		'wpump' : waterflag,
		'pmotor' : panflag,
		'dmotor' : drizzleflag
	};

	connection.connect(function(err) {
		connection.query('UPDATE drizzle SET ? ', setting, function(err, result, rows) {
			if (err) {
				console.error('mysql SET connection error');
				console.error("SET" + "err : " + err);
			}
		});
	});
	res.send(200, {"result":"ok"});
});

app.get('/extremecmd.do', function(req, res){
	var redflag, greenflag, blueflag, waterflag, drizzleflag, panflag;
	
	var redsw = req.param('redled');
	var greensw = req.param('greenled');
	var bluesw = req.param('blueled');
	var watersw = req.param('water');
	var drizzlesw = req.param('drizzle');
	var pansw = req.param('pan');
	
	if(redsw == "on") {
		redflag=1;
	} else {
		redflag=0;
	}
	if(greensw == "on") {
		greenflag=1;
	} else {
		greenflag=0;
	}
	if(bluesw == "on") {
		blueflag=1;
	} else {
		blueflag=0;
	}
	if(watersw == "on") {
		waterflag=1;
	} else {
		waterflag=0;
	}
	if(pansw == "on") {
		panflag=1;
	} else {
		panflag=0;
	}
	if(drizzlesw == "on") {
		drizzleflag=1;
	} else {
		drizzleflag=0;
	}
	
	var setting = {
		'rled' : redflag,
		'gled' : greenflag,
		'bled' : blueflag,
		'wpump' : waterflag,
		'pmotor' : panflag,
		'dmotor' : drizzleflag
	};

	connection.connect(function(err) {
		connection.query('UPDATE extreme SET ? ', setting, function(err, result, rows) {
			if (err) {
				console.error('mysql SET connection error');
				console.error("SET" + "err : " + err);
			}
		});
	});
	res.send(200, {"result":"ok"});
});


//If you want to show temperature and humidity, by using DHT11 temp/humi sensor.
app.get("/rpt.do", function(req, res){
	 var readout = sensorLib.read();
	 console.log('Temperature: ' + readout.temperature.toFixed(2) + 'C, ' +
	            'humidity: ' + readout.humidity.toFixed(2) + '%');
	 res.send(200, {"temp":readout.temperature.toFixed(2),
		 			"humi":readout.humidity.toFixed(2)});
});


//Send Openweather API's Total information to Web browser.
app.get('/main.do', function(req, res) {
	var obj = {
		cityname : cityname,
		weatherid : weatherid,
		weathermain : weathermain,
		citytemp : citytemp,
		cityhumi : cityhumi,
		citytemp_min : citytemp_min,
		citytemp_max : citytemp_max,
		citywind : citywind,
		cityclouds : cityclouds,
		temp : temp,
		humi : humi
	};
	console.log("Box.html - success!");
	res.json(200, obj);
});

//If 'each Tower view button' click,
app.get('/diview.do', function(req, res) {
	var id = req.param('id');
	
	//First, All state is OFF!! (LOW)
	clearmusicflag();
	clearInter();
	var musicflag = 0;
	musicsControl(musicflag);
	unexit();
	
	if(id == 0) {
		clearmusicflag();
		clearInter();
		unexit();
		var sunobj = new DbsunWeather();
	} else if(id == 1) {
		clearmusicflag();
		clearInter();
		unexit();
		var cloudobj = new DbcloudWeather();
	} else if(id == 2) {
		clearmusicflag();
		clearInter();
		unexit();
		var rainobj = new DbrainWeather();
	} else if(id == 3) {
		clearmusicflag();
		clearInter();
		unexit();
		var snowobj = new DbsnowWeather();
	} else if(id == 4) {
		clearmusicflag();
		clearInter();
		unexit();
		var thunderobj = new DbthunderWeather();
	} else if(id == 5) {
		clearmusicflag();
		clearInter();
		unexit();
		var drizzleobj = new DbdrizzleWeather();
	} else if(id == 6) {
		clearmusicflag();
		clearInter();
		unexit();
		var extremeobj = new DbextremeWeather();
	} else if(id == 7) {
		clearmusicflag();
		clearInter();
		unexit();
		
		musicflag = 0;
		musicsControl(musicflag);
	}
	res.send(200, "DataBase Viewing success");
});


//DHT11 Sensor use, And update 1minite(Periodly.
var sensor = {
	initialize : function() {
		return sensorLib.initialize(11, 16);
	},
	read : function() {
		var readout = sensorLib.read();
		console.log('Temperature: ' + readout.temperature.toFixed(2) + 'C, ' + 'humidity: ' + readout.humidity.toFixed(2) + '%');
		temp = readout.temperature.toFixed(2);
		humi = readout.humidity.toFixed(2);
		setTimeout(function() {
			sensor.read();
		}, 60000);
	}
};

if (sensor.initialize()) {
	sensor.read();
} else {
	console.warn('Failed to initialize sensor');
}

////////////////////////////////////////////////////////////////////////////////

// If ctrl+c (SIGNAL) input -> led, process unexport (if user want to exit,)
process.on('SIGINT', function() {
	// LED state is all off(Value : 0)
	rled.writeSync(0); // RGB LED
	gled.writeSync(0);
	bled.writeSync(0);

	rrled.writeSync(0); // General LED(in cloud model)
	yyled.writeSync(0);
	ggled.writeSync(0);

	// Motor state is all off(Value : 0)
	dmotor.writeSync(0); // drizzle motor
	wmotor.writeSync(0); // water pump
	pmotor.writeSync(0); // pan motor

	// all unexport gpio.
	rled.unexport();
	gled.unexport();
	bled.unexport();

	rrled.unexport();
	yyled.unexport();
	ggled.unexport();

	dmotor.unexport();
	wmotor.unexport();
	pmotor.unexport();

	process.exit();
});


////////////////////////////////////////////////////////////////////////////////

//Server connect 8087 port.
server.listen(8087, function(req, res) {
	console.log("server running on 8087.");
});