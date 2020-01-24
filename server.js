'use strict';

const express = require('express');
const app = express();
const db = require('./sql-model.js');
const bodyParser = require('body-parser');

const server = require("http").createServer(app);

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.use('/', express.static('webpage'));

//Routes
app.get('/users', getUser);
app.get('/issues', getIssue);
app.get('/tags', getTag);
app.get('/users/tags', getUserTags);
app.get('/issues/tags', getIssueTags);
app.post('/users', addUser);
app.post('/issues', addIssue);
app.post('/tags', addTag);
app.post('/users/tags', setUserTagLink);
app.post('/issues/tags', setIssueTagLink);
app.post('/users/edit', updateUser);
app.post('/issues/edit', updateIssue);
app.post('/tags/edit', updateTag);

server.listen(8080);

module.exports = server;

//Get functions
async function getUser(req, res) {
    const userName = req.body.name;
    res.send(await db.getUser(userName));
}

//Get issues by user assigned ID
async function getIssue(req, res) {
    const userID = req.body.id;
    res.send(await db.getIssue(userID));
}

async function getTag(req, res) {
    const name = req.body.name;
    res.send(await db.getTag(name));
}

async function getUserTags(req, res) {
    const userName = req.body.name;
    res.send(await db.getUserTags(userName));
}

async function getIssueTags(req, res) {
    const issueID = req.body.id;
    res.send(await db.getIssueTags(issueID));
}

//Post functions
async function addUser(req, res) {
    const name = req.body.name;
    res.send(await db.addUser(name));
}

async function addIssue(req, res) {
    const name = req.body.name;
    const desc = req.body.description;
    const state = req.body.state;
    const time = req.body.complete_time;
    const assigned = req.body.user_assigned_id;
    res.send(await db.addIssue(name,desc,state,time,assigned));
}

async function addTag(req, res) {
    const name = req.body.name;
    res.send(await db.addTag(name));
}

async function setUserTagLink(req, res) {
    const userID = req.body.userID;
    const tagID = req.body.tagID;
    res.send(await db.setUserTagLink(userID,tagID));
}

async function setIssueTagLink(req, res) {
    const issueID = req.body.issueID;
    const tagID = req.body.tagID;
    res.send(await db.setIssueTagLink(issueID,tagID));
}

//Post update functions

async function updateUser(req, res) {
    const name = req.body.name;
    const time = req.body.free_time;
    const assignmentType = req.body.assignment_type;
    res.send(await db.updateUser(name, assignmentType, time));
}

async function updateIssue(req, res) {
    const userID = req.body.id;
    const name = req.body.name;
    const desc = req.body.description;
    const state = req.body.state;
    const time = req.body.complete_time;
    const assigned = req.body.user_assigned_id;
    res.send(await db.updateIssue(userID, name,desc,state,time,assigned));
}

async function updateTag(req, res) {
    const tagID = req.body.id;
    const name = req.body.name;
    res.send(await db.updateTag(tagID, name));
}