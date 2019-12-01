'use strict';

const express = require('express');
const app = express();
const db = require('./sql-model.js');
const bodyParser = require('body-parser');

const server = require("http").createServer(app);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// this will serve the HTML file shown below
app.use('/', express.static('webpage'));

//Routes
app.get('/data/users', getUser);
app.get('/data/issues', getIssues);
app.post('/data/users', addUser);

const PORT = process.env.PORT || 8080;
server.listen(PORT, async () => {
    console.log(`App listening on port ${PORT}!`);
});

module.exports = server;

//Get functions
async function getUser(req, res) {
    const userName = req.body.name;
    res.send(await db.getUser(userName));
}

async function getIssues(req, res) {
    const userID = req.body.id;
    res.send(await db.getIssues(userID));
}

//Post functions
async function addUser(req, res) {
    const name = req.query.name;
    res.send(await db.addUser(name));
}