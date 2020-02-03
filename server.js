'use strict';

const express = require('express');
const app = express();
const db = require('./sql-model.js');
const bodyParser = require('body-parser');
const cors = require('cors');
const server = require("http").createServer(app);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/', express.static('client'));

//Routes
app.get('/users/:name', getUser);
app.get('/issues/:id', getIssues);
app.get('/tags/:name', getTag);
app.get('/users/tags/:name', getUserTags);
app.get('/issues/tags/:id', getIssueTags);
app.post('/users', addUser);
app.post('/issues', addIssue);
app.post('/tags', addTag);
app.post('/users/tags', setUserTagLink);
app.post('/issues/tags', setIssueTagLink);
app.patch('/users/edit', updateUser);
app.patch('/issues/edit', updateIssue);
app.patch('/tags/edit', updateTag);
app.patch('/users/assign', automaticAssignIssues);
app.delete('/users/tags', deleteUserTagLink);
app.delete('/issues/tags', deleteIssueTagLink);

server.listen(8080);

module.exports = server;

//Get functions
async function getUser(req, res) {
    const userName = req.params.name;
    res.send(await db.getUser(userName));
}

//Get issues by user assigned ID
async function getIssues(req, res) {
    const userID = req.params.id;
    res.send(await db.getIssues(userID));
}

async function getTag(req, res) {
    const name = req.params.name;
    res.send(await db.getTag(name));
}

async function getUserTags(req, res) {
    const userName = req.params.name;
    res.send(await db.getUserTags(userName));
}

async function getIssueTags(req, res) {
    const issueID = req.params.id;
    res.send(await db.getIssueTags(issueID));
}

//Post functions
async function addUser(req, res) {
    const name = req.body.name;
    res.send(await db.addUser(name));
}

async function addIssue(req, res) {
    const {name, description, state, complete_time, user_assigned_id} = req.body;
    res.send(await db.addIssue(name,description,state,complete_time,user_assigned_id));
}

async function addTag(req, res) {
    const name = req.body.name;
    res.send(await db.addTag(name));
}

async function setUserTagLink(req, res) {
    const {userID, tagID} = req.body;
    res.send(await db.setUserTagLink(userID,tagID));
}

async function setIssueTagLink(req, res) {
    const {issueID, tagID} = req.body;
    res.send(await db.setIssueTagLink(issueID,tagID));
}

//Patch update functions

async function updateUser(req, res) {
    const {name, assignment_type, free_time} = req.body;
    res.send(await db.updateUser(name, assignment_type, free_time));
}

async function updateIssue(req, res) {
    const {id,name,description,state,complete_time,user_assigned_id} = req.body;
    res.send(await db.updateIssue(id, name, description, state, complete_time, user_assigned_id));
}

async function updateTag(req, res) {
    const {id, name} = req.body;
    res.send(await db.updateTag(id, name));
}

//Delete functions

async function deleteUserTagLink(req, res) {
    const {userID, tagID} = req.body;
    res.send(await db.deleteUserTagLink(userID, tagID));
}

async function deleteIssueTagLink(req, res) {
    const {issueID, tagID} = req.body;
    res.send(await db.deleteIssueTagLink(issueID, tagID));
}

//Assignment feature

function compare( a, b ) {
    if (a.issue_priority > b.issue_priority) {
        return -1;
    }
    if (a.issue_priority < b.issue_priority) {
        return 1;
    }
    return 0;
}

async function automaticAssignIssues(req, res) {
    let user = req.body.user;
    const issues = req.body.issues;
    let issues_shortlist = [];

    //basic implementation without weighting
    issues.forEach((issue) => {
        if(issue.issue_state === 1 && user.user_free_time >= issue.issue_completion_time) {
            issues_shortlist.push(issue);
        }
    });
    issues_shortlist.sort(compare);
    issues_shortlist.forEach((issue) => {
        if (user.user_free_time >= issue.issue_completion_time) {
            user.user_free_time -= issue.issue_completion_time;
            issue.issue_state = 2;
            db.updateIssue(issue.issue_id, issue.issue_name, issue.issue_description, issue.issue_state,
                issue.issue_completion_time, issue.user_assigned_id);
        }
    });
    res.send(await db.updateUser(user.user_name, user.user_assignment_type, user.user_free_time));
}