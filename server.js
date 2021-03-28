const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

function Locations(search, format, lat, lon){
    this.search_query = search;
    this.formatted_query = format;
    this.latitude = lat;
    this.longitude = lon;
}

    // "search_query": "seattle",
    // "formatted_query": "Seattle, WA, USA",
    // "latitude": "47.606210",
    // "longitude": "-122.332071"
  
  


app.get('/location', (req, res) =>{

    let search = req.query.search
    const location = require('./data/location.json');
    let obj = location[0];
    let newLocation = new Locations(search, obj.display_name, obj.lat, obj.lon);
    
    let foundLocation = null;
    location.forEach(place =>{
        if (location.display_name === req.query.name){
            foundLocation = place;
        }
    });
    if (foundLocation){
        // res.status(200).json(foundLocation);
        // res.json(`${newLocation.lon}, ${newLocation.lat}`);
        res.send(newLocation);
    } else{
        res.status(404).send('location not found');
    }
})

app.listen(PORT, () =>{
    console.log(`server is listening to port ${PORT}`)
})