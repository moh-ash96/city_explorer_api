"use strict";

const dotenv = require("dotenv"); //dotenv allows us to load environment variables from a .env file
dotenv.config();
const PORT = process.env.PORT || 3000; // get the port from the environment

const express = require("express"); // load express module, used to create a web server
const app = express(); // create an express application which we'll use as our web server
const { response } = require("express");

const cors = require("cors"); // load the cors library, it allows our server to accept APIs calls from other domains
app.use(cors());
// Request -> cors -> handle -> *... -> responses

app.get("/location", handleLocation); // handle GET calls to the /location path using handleLocation route handler

app.get("/weather", handleWeather); // handle GET calls to the /weather path using handleWeather route handler

app.get("*", handleErrors); // handle any other route using handleErrors route handler

app.listen(PORT, () => {
  console.log(`server is listening to port ${PORT}`);
});

function Locations(search, format, lat, lon) {
  this.search_query = search;
  this.formatted_query = format;
  this.latitude = lat;
  this.longitude = lon;
}

function handleLocation(req, res) {
  let search = req.query.city; // assign the value found in the city query parameter to search

  try {
    const location = require("./data/location.json"); // creates location variable and loads the content of the location.json
    let obj = location[0]; // gets the first object in the obj array
    let newLocation = new Locations(search, obj.display_name, obj.lat, obj.lon); // declare a variable called newLocation and assign to it new Location instatnce
    res.status(200).send(newLocation);
  } catch {
    res.status(404).send("Something Went Wrong");
  }
}

function Weather(search, forecast, time) {
  this.search_query = search;
  this.forecast = forecast;
  this.time = time;
}

function handleWeather(req, res) {
  let search = req.query.city;
  let weatherObj = require("./data/weather.json");
  let newArr = [];
  let dataArray = weatherObj.data;
  dataArray.forEach((section) => {
    let description = section.weather["description"];
    let dates = section.datetime;
    let newWeather = new Weather(search, description, dates);
    newArr.push(newWeather);
  });

  try {
    res.status(200).send(newArr);
  } catch {
    res.status(500).send("Something Went Wrong");
  }
}
function handleErrors(req,res) {
  res.status(500).send({status: 500, responseText:`This page doesn't exist`});
}
