"use strict";
// Load environment variables
const dotenv = require("dotenv"); //dotenv allows us to load environment variables from a .env file
dotenv.config();

const express = require("express"); // load express module, used to create a web server
const superagent = require('superagent');
const cors = require("cors"); // load the cors library, it allows our server to accept APIs calls from other domains
const pg = require('pg');

const app = express(); // create an express application which we'll use as our web server
app.use(cors());
const DATABASE_URL = process.env.DATABASE_URL;

const PORT = process.env.PORT || 3001; // get the port from the environment

// dataBase connection setup
const client = new pg.Client(DATABASE_URL);
client.on('error', err=>{throw err;});



app.get("/location", handleLocation); // handle GET calls to the /location path using handleLocation route handler
app.get("/weather", handleWeather); // handle GET calls to the /weather path using handleWeather route handler
app.get("/parks", handlePark);
app.use("*", handleErrors); // handle any other route using handleErrors route handler

app.listen(PORT, () => {
  console.log(`server is listening to port ${PORT}`);
});





function Locations(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData.display_name;
  this.latitude = geoData.lat;
  this.longitude = geoData.lon;
}

const locations = {};

function handleLocation(req, res) {
  let city = req.query.city; // assign the value found in the city query parameter to search
  let key = process.env.GEOCODE_API_KEY;
  const url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;

  if (locations[url]) {
    res.send(locations[url]);
    // console.log(locations[url]);
  } else {
    superagent.get(url)
      .then(data => {
        // const location = require("./data/location.json"); // creates location variable and loads the content of the location.json
        const geoData = data.body[0]; // gets the first object in the obj array
        let location = new Locations(city, geoData); // declare a variable called newLocation and assign to it new Location instatnce
        locations[url] = location;
        res.status(200).send(location);
        // console.log(location);
      })
      .catch(() => {
        res.status(404).send("Something Went Wrong");

      })
  }
}


function Weather(forecast, datetime) {
  this.forecast = forecast;
  this.time = datetime;
}
const weatherInfo = [];

async function handleWeather(req, res) {
  try {
    let key = process.env.WEATHER_API_KEY;
    let lat = req.query.latitude;
    let lon = req.query.longitude;
    
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${key}`
    const rawWeatherData = await superagent.get(url);

    let dataArray = JSON.parse(rawWeatherData.text).data;

    let reformattedArray = dataArray.map(obj => {
      let description = obj.weather.description;
      let dates = obj.datetime;
      return new Weather(description, dates);
    })
    res.send(reformattedArray);
  }
  catch (error) {

    res.status(500).send("Something Went Wrong");
  }
}

function Park(name, address, fee, description, url){
  this.name = name;
  this.address = address;
  this.fee = fee;
  this.description = description;
  this.url = url;
}

async function handlePark(req, res){
  try{
    const key = process.env.PARKS_API_KEY;
    let lat = req.query.latitude;
    let lon = req.query.longitude;
    const url =`https://developer.nps.gov/api/v1/parks?lat=${lat}&lon=${lon}&parkCode=acad&api_key=${key}`
    let parkData = await superagent.get(url);
    let dataArray = parkData.body.data;
    let reformattedArray = dataArray.map(obj => {
      let name = obj.fullName;
      let addressArr = Object.values(obj.addresses[0]);
      let address = addressArr.toString();
      console.log(address);
      let feeObj = obj.entranceFees[0];
      let fee = feeObj[Object.keys(feeObj)[0]];
      let description = obj.description;
      let url = obj.url;
      return new Park(name, address, fee, description, url);
    })
    res.json(reformattedArray);

  }catch (error) {

    res.status(500).send("Something Went Wrong");
  }
}

// it will only start our webserver if we can successfully cnnect to database 
// client.connect().then(()=>{
//   app.listen(PORT, ()=> {
//     console.log(`App listening on port ${PORT}`);
//   })
// })


function handleErrors(req, res) {
  res.status(404).send({
    status: 500,
    responseText: "Sorry, something went wrong",

  });
};
