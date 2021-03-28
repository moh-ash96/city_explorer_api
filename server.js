const express = require('express');


const app = express();
const PORT = process.env.PORT || 3000;
const handleRequest = (request, response)=>{
    console.log(request.query);
    response.send('ok');
}

app.get('/', handleRequest)

app.listen(PORT, () =>{
    console.log(`server is listening to port ${PORT}`)
})