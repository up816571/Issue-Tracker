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
app.get('/users/tags/:id', getUserTags);
app.get('/issues/tags/:id', getIssueTags);
app.get('/teams/:id', getTeam);
app.get('/teams/users/:id', getTeamMembers);
app.post('/users', addUser);
app.post('/issues', addIssue);
app.post('/tags', addTag);
app.put('/users/tags', setUserTagLink);
app.put('/issues/tags', setIssueTagLink);
app.patch('/users/edit', updateUser);
app.patch('/issues/edit', updateIssue);
app.patch('/tags/edit', updateTag);
app.patch('/users/assign', automaticAssignIssues);
app.patch('/teams/edit', updateTeam);
app.delete('/users/tags', deleteUserTagLink);
app.delete('/issues/tags', deleteIssueTagLink);

server.listen(8080);

module.exports = server;

//Get functions
async function getUser(req, res) {
    const userName = req.params.name;
    const sqlReturn = await db.getUser(userName);
    if (sqlReturn)
        res.send(sqlReturn);
    else
        res.send(null);
}

//Get issues by user assigned ID
async function getIssues(req, res) {
    const userID = req.params.id;
    res.send(await db.getIssues(userID));
}

async function getTag(req, res) {
    const name = req.params.name;
    const sqlReturn = await db.getTag(name);
    if (sqlReturn)
        res.send(sqlReturn);
    else
        res.send(null);
}

async function getUserTags(req, res) {
    const userName = req.params.id;
    res.send(await db.getUserTags(userName));
}

async function getIssueTags(req, res) {
    const issueID = req.params.id;
    res.send(await db.getIssueTags(issueID));
}

async function getTeam(req, res) {
    const team_id = req.params.id;
    const sqlReturn = await db.getTeam(team_id);
    if (sqlReturn)
        res.send(sqlReturn);
    else
        res.send(null);
}

async function getTeamMembers(req, res) {
    const team_id = req.params.id;
    res.send(await db.getTeamMembers(team_id));
}

//Post functions
async function addUser(req, res) {
    const name = req.body.name;
    res.send(await db.addUser(name));
}

async function addIssue(req, res) {
    let {name, description, state, complete_time, user_assigned_id} = req.body;
    if (complete_time === "")
        complete_time = null;
    res.send(await db.addIssue(name,description,state,complete_time,user_assigned_id));
}

async function addTag(req, res) {
    const name = req.body.name;
    res.send(await db.addTag(name));
}

async function setUserTagLink(req, res) {
    const {userID, tags} = req.body;
    let usersTags = await db.getUserTags(userID);

    for (let i = 0; i < tags.length; i++) {
        if (usersTags.filter(stored => stored.tag_name === tags[i].tag).length === 0) {
            let tagID = await db.addTag(tags[i].tag);
            //If tag does not exist create new
            if (!tagID)
                tagID = await db.addTag(tags[i].tag);
            await db.setUserTagLink(userID,tagID.tag_id);
        }
    }
    for (let i = 0; i < usersTags.length; i++) {
        if (tags.filter(stored => stored.tag === usersTags[i].tag_name).length === 0) {
            let tagID = await db.getTag(usersTags[i].tag_name);
            await db.deleteUserTagLink(userID,tagID.tag_id)
        }
    }
    res.send("Success");
}

async function setIssueTagLink(req, res) {
    const {issueID, tags} = req.body;
    console.log(tags);
    let issueTags = await db.getIssueTags(issueID);
    for (let i = 0; i < tags.length; i++) {
        if (issueTags.filter(stored => stored.tag_name === tags[i].tag).length === 0) {
            let tagID = await db.addTag(tags[i].tag);
            //If tag does not exist create new
            if (!tagID)
                tagID = await db.addTag(tags[i].tag);
            await db.setIssueTagLink(issueID,tagID.tag_id)
        }
    }
    for (let i = 0; i < issueTags.length; i++) {
        if (tags.filter(stored => stored.tag === issueTags[i].tag_name).length === 0) {
            let tagID = await db.getTag(issueTags[i].tag_name);
            await db.deleteIssueTagLink(issueID, tagID.tag_id);
        }
    }
    res.send("Success");
}

//Patch update functions

async function updateUser(req, res) {
    const {id, assignment_type, free_time} = req.body;
    res.send(await db.updateUser(id, assignment_type, free_time));
}

async function updateIssue(req, res) {
    const {id,name,description,state,complete_time, issue_priority, user_assigned_id} = req.body;
    res.send(await db.updateIssue(id, name, description, state, complete_time, issue_priority, user_assigned_id));
}

async function updateTag(req, res) {
    const {id, name} = req.body;
    res.send(await db.updateTag(id, name));
}

async function updateTeam(req, res) {
    const {team_id, team_name} = req.body;
    res.send(await db.updateTeam(team_id, team_name));
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
//Sort function to order by priority
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
    let name = req.body.name;
    let user = await db.getUser(name);
    let issues = await db.getIssues(user.user_id);
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
               issue.issue_completion_time, issue.issue_priority ,issue.user_assigned_id);
        }
    });
    res.send(await db.updateUser(user.user_id, user.user_assignment_type, user.user_free_time));
}