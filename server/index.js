const express = require('express');
const app = express();
const cors = require('cors')
const bodyParser = require('body-parser')
app.use(cors());
app.use(bodyParser.json());
const routerApi = require('./routes/api.js')
app.use("/api" , routerApi);



app.listen(3000 , () => {
    console.log("server started on port 3000")
});
