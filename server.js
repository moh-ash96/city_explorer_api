"use strict";
// Load environment variables
const dotenv = require("dotenv"); //dotenv allows us to load environment variables from a .env file
dotenv.config();

const express = require("express"); // load express module, used to create a web server
const superagent = require('superagent');
const cors = require("cors"); // load the cors library, it allows our server to accept APIs calls from other domains
const pg = require('pg');
const NODE_ENV = process.env.NODE_ENV;


const app = express(); // create an express application which we'll use as our web server
app.use(cors());
const DATABASE_URL = process.env.DATABASE_URL;

const PORT = process.env.PORT || 3030; // get the port from the environment

const options = NODE_ENV === 'production' ? { connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } } : { connectionString: DATABASE_URL };
// dataBase connection setup
const client = new pg.Client(DATABASE_URL);
client.on('error', err => { throw err; });

app.get('/', (request, response) => {
  response.status(200).send('ok');
});

// it will only start our webserver if we can successfully cnnect to database 
client.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
  })
}).catch(err => {
  console.log('ERROR', err);
});



app.get("/location", handleLocation); // handle GET calls to the /location path using handleLocation route handler
app.get("/weather", handleWeather); // handle GET calls to the /weather path using handleWeather route handler
app.get("/parks", handlePark);
app.get("/movies", handleMovies);
app.use("*", handleErrors); // handle any other route using handleErrors route handler






function Locations(city, formatted_query, latitude, longitude) {
  this.search_query = city;
  this.formatted_query = formatted_query;
  this.latitude = latitude;
  this.longitude = longitude;
}

const locations = {};

function handleLocation(req, res) {
  const city = req.query.city; // assign the value found in the city query parameter to search
  const key = process.env.GEOCODE_API_KEY;
  const sql = "SELECT * FROM locations WHERE search_query = $1";
  // const sqlArray = [city];
  // console.log();
  client.query(sql, [city])
    .then((data) => {
      // console.log(data);
      if (data.rowCount === 0) {
        // creates url variable and loads the content of the url
        const url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;
        superagent.get(url)
          .then(data => {
            const geoData = data.body[0]; // gets the first object in the obj array
            let location = new Locations(city, geoData.display_name, geoData.lat, geoData.lon); // declare a variable called newLocation and assign to it new Location instatnce
            const sql = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);';
            const cleanValues = [city, location.formatted_query, location.latitude, location.longitude];

            client.query(sql, cleanValues)
              .then((data) => {
                console.log('adding');
                res.json(data.rows[0]);
              });
          })

      } else {
        res.send(data.rows[0]);
        console.log('added');
        
      }
    })
    .catch(() => {
      res.status(404).send("Something Went Wrong");
      console.log(search_query);
    })
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

function Park(name, address, fee, description, url) {
  this.name = name;
  this.address = address;
  this.fee = fee;
  this.description = description;
  this.url = url;
}

async function handlePark(req, res) {
  try {
    const key = process.env.PARKS_API_KEY;
    let lat = req.query.latitude;
    let lon = req.query.longitude;
    const url = `https://developer.nps.gov/api/v1/parks?lat=${lat}&lon=${lon}&parkCode=acad&api_key=${key}`
    let parkData = await superagent.get(url);
    let dataArray = parkData.body.data;
    let reformattedArray = dataArray.map(obj => {
      let name = obj.fullName;
      let addressArr = Object.values(obj.addresses[0]);
      let address = addressArr.toString();
      let feeObj = obj.entranceFees[0];
      let fee = feeObj[Object.keys(feeObj)[0]];
      let description = obj.description;
      let url = obj.url;
      return new Park(name, address, fee, description, url);
    })
    res.json(reformattedArray);

  } catch (error) {

    res.status(500).send("Something Went Wrong");
  }
}

function Movies(title, overview, average_votes, total_votes, image_url, popularity, released_on){
  this.title= title;
  this.overview= overview;
  this.average_votes= average_votes;
  this.total_votes= total_votes;
  this.image_url= image_url;
  this.popularity= popularity;
  this.released_on= released_on;
};

async function handleMovies(req, res){

  let city = req.query.city;
  try{
    const key = process.env.MOVIE_API_KEY;
    const url = `https://api.themoviedb.org/3/movie/76341?city=${city}&api_key=${key}`;
    let movieData = await superagent.get(url);
    console.log(movieData);
    const movieArr = [movieData.body];
    let newMovie = movieArr.map(obj=>{
      return new Movies(obj.title, obj.overview, obj.vote_average, obj.vote_count, obj.belongs_to_collection.poster_path, obj.popularity, obj.release_date);
    })
    res.send(newMovie);

  }catch(error) {

    res.status(500).send("Something Went Wrong");
  }
}


function handleErrors(req, res) {
  res.status(404).send({
    status: 500,
    responseText: "Sorry, something went wrong",

  });
};
