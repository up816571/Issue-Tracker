'use strict';

const express = require('express');
const app = express();
const db = require('./sql-model.js');
const bodyParser = require('body-parser');
const cors = require('cors');
const server = require("http").createServer(app);
const io = require('socket.io')(server);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/', express.static('client'));

//Routes
app.get('/users/:name', getUser);
app.get('/users/id/:id', getUserById);
app.get('/issues/:id', getIssues);
app.get('/tags/:name', getTag);
app.get('/users/tags/:id', getUserTags);
app.get('/issues/tags/:id', getIssueTags);
app.get('/teams/:id', getTeam);
app.get('/teams/users/:id', getTeamMembers);
app.get('/teams/issues/:id', getTeamIssues);
app.post('/users', addUser);
app.post('/issues', addIssue);
app.post('/tags', addTag);
app.put('/users/tags', setUserTagLink);
app.put('/issues/tags', setIssueTagLink);
app.patch('/users/edit', updateUser);
app.patch('/issues/edit', updateIssue);
app.patch('/tags/edit', updateTag);
app.patch('/users/assign', automaticAssignIssues);
app.patch('/teams/assign',automaticTeamAssignIssues);
app.patch('/teams/edit', updateTeam);
app.delete('/users/tags', deleteUserTagLink);
app.delete('/issues/tags', deleteIssueTagLink);

server.listen(8080);
io.on('connection', (socket) => {
    socket.on('login', (user) => {
        let roomName = getRoomName(user);
        socket.join(roomName);
    });
});

module.exports = server;

//Get functions

//get user by their id
async function getUserById(req, res) {
    const id = req.params.id;
    const sqlReturn = await db.getUserById(id);
    if (sqlReturn)
        res.send(sqlReturn);
    else
        res.send(null);
}

//get user by their name
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

//get tag by name
async function getTag(req, res) {
    const name = req.params.name;
    const sqlReturn = await db.getTag(name);
    if (sqlReturn)
        res.send(sqlReturn);
    else
        res.send(null);
}

//get tags assigned to user
async function getUserTags(req, res) {
    const userName = req.params.id;
    res.send(await db.getUserTags(userName));
}

//get tags assigned to an issue
async function getIssueTags(req, res) {
    const issueID = req.params.id;
    res.send(await db.getIssueTags(issueID));
}

//get a team by team id
async function getTeam(req, res) {
    const team_id = req.params.id;
    const sqlReturn = await db.getTeam(team_id);
    if (sqlReturn)
        res.send(sqlReturn);
    else
        res.send(null);
}

//get team members of a team by id
async function getTeamMembers(req, res) {
    const team_id = req.params.id;
    res.send(await db.getTeamMembers(team_id));
}

//get all issue assigned to a team
async function getTeamIssues(req, res) {
    const team_id = req.params.id;
    res.send(await db.getTeamIssues(team_id));
}

//Post functions

//add user
async function addUser(req, res) {
    const name = req.body.name;
    res.send(await db.addUser(name));
}

//add issue
async function addIssue(req, res) {
    let {name, description, state, complete_time, issue_priority, user_assigned_id, team_assigned_id} = req.body;
    //prevents the database being overwritten with blank strings, should be validated properly
    if (complete_time === "")
        complete_time = null;
    if (user_assigned_id === "")
        user_assigned_id = null;
    if (team_assigned_id === "")
        team_assigned_id = null;
    await db.addIssue(name,description,state,complete_time, issue_priority,user_assigned_id, team_assigned_id);
    if (user_assigned_id)
        await refreshColumn(user_assigned_id);
    else
        await refreshColumnNoUser(team_assigned_id);
    res.send();
}

//add tag
async function addTag(req, res) {
    const name = req.body.name;
    res.send(await db.addTag(name));
}

//set a database link between a tag and a user
async function setUserTagLink(req, res) {
    const {userID, tags} = req.body;
    let usersTags = await db.getUserTags(userID);
    //loop through each tag provided and add tag links
    for (let i = 0; i < tags.length; i++) {
        if (usersTags.filter(stored => stored.tag_name === tags[i].tag).length === 0) {
            let tagID = await db.addTag(tags[i].tag);
            //If tag does not exist create new
            if (!tagID)
                tagID = await db.addTag(tags[i].tag);
            await db.setUserTagLink(userID,tagID.tag_id);
        }
    }
    //loop through each tag provided and remove tags missing from the tag list
    for (let i = 0; i < usersTags.length; i++) {
        if (tags.filter(stored => stored.tag === usersTags[i].tag_name).length === 0) {
            let tagID = await db.getTag(usersTags[i].tag_name);
            await db.deleteUserTagLink(userID,tagID.tag_id)
        }
    }
    res.send("Success");
}

//set a database link between a tag and a issue
async function setIssueTagLink(req, res) {
    const {issueID, tags} = req.body;
    let issueTags = await db.getIssueTags(issueID);
    //loop through each tag provided and add tag links
    for (let i = 0; i < tags.length; i++) {
        if (issueTags.filter(stored => stored.tag_name === tags[i].tag).length === 0) {
            let tagID = await db.addTag(tags[i].tag);
            //If tag does not exist create new
            if (!tagID)
                tagID = await db.addTag(tags[i].tag);
            await db.setIssueTagLink(issueID,tagID.tag_id)
        }
    }
    //loop through each tag provided and remove tags missing from the tag list
    for (let i = 0; i < issueTags.length; i++) {
        if (tags.filter(stored => stored.tag === issueTags[i].tag_name).length === 0) {
            let tagID = await db.getTag(issueTags[i].tag_name);
            await db.deleteIssueTagLink(issueID, tagID.tag_id);
        }
    }
    res.send("Success");
}

//Patch update functions

//update user
async function updateUser(req, res) {
    const {id, assignment_type, free_time} = req.body;
    res.send(await db.updateUser(id, assignment_type, free_time));
}

//update issue
async function updateIssue(req, res) {
    let {id,name,description,state,complete_time, issue_priority, user_assigned_id, team_assigned_id} = req.body;
    //stops db overwrite, needs to be rewritten
    if (complete_time === "")
        complete_time = null;
    if (user_assigned_id === "")
        user_assigned_id = null;
    if (team_assigned_id === "")
        team_assigned_id = null;
    await db.updateIssue(id, name, description, state, complete_time, issue_priority, user_assigned_id, team_assigned_id);
    if (user_assigned_id)
        await refreshColumn(user_assigned_id);
    else
        await refreshColumnNoUser(team_assigned_id);
    res.send();
}

//update tag - not used
async function updateTag(req, res) {
    const {id, name} = req.body;
    res.send(await db.updateTag(id, name));
}

//update team
async function updateTeam(req, res) {
    const {team_id, team_name} = req.body;
    res.send(await db.updateTeam(team_id, team_name));
}

//Delete functions

//remove user to tag link
async function deleteUserTagLink(req, res) {
    const {userID, tagID} = req.body;
    res.send(await db.deleteUserTagLink(userID, tagID));
}

//remove issue to tag link
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

//assign issues for a single user
async function automaticAssignIssues(req, res) {
    let name = req.body.name;
    let user = await db.getUser(name);
    let issues = await db.getBacklogIssues(user.user_id);
    let issuesShortlist = [];
    //get issues for assigment
    issues.forEach((issue) => {
        if(user.user_free_time >= issue.issue_completion_time) {
            issuesShortlist.push(issue);
        }
    });
    //get team backlog issues if in team
    if (user.user_team) {
        let teamIssues = await db.getTeamBacklogIssues(user.user_team);
        teamIssues.forEach((issue) => {
            if(user.user_free_time >= issue.issue_completion_time && !issue.user_assigned_id)
                issuesShortlist.push(issue);
        });
    }
    //sort by priority
    issuesShortlist.sort(compare);
    //check each issue and assign if enough free time
    issuesShortlist.forEach((issue) => {
        if (user.user_free_time >= issue.issue_completion_time) {
            user.user_free_time -= issue.issue_completion_time;
            issue.issue_state = 2;
            db.updateIssue(issue.issue_id, issue.issue_name, issue.issue_description, issue.issue_state,
               issue.issue_completion_time, issue.issue_priority ,issue.user_assigned_id);
        }
    });
    await db.updateUser(user.user_id, user.user_assignment_type, user.user_free_time);
    await refreshColumn(user.user_id);
    res.send();
}

//automatic assign for teams
async function automaticTeamAssignIssues(req, res) {
    let users = req.body.users;
    let allIssues = [];
    for (let i = 0; i < users.length; i++) {
        let issues = await db.getBacklogIssues(users[i].user_id);
        issues.forEach((issue) => {
            allIssues.push(issue);
        });
    }
    let user_team = (await db.getUserById(users[0].user_id)).user_team;
    let teamIssues = await db.getTeamBacklogIssues(user_team);
    teamIssues.forEach((issue) => {
        if (!issue.user_assigned_id)
            allIssues.push(issue);
    });

    allIssues.sort(compare);
    //get tags of all users and tags
    let userTagList = [];
    for(const user of users) {
        let userTags = await db.getUserTags(user.user_id);
        let tagList = [];
        for(const tag of userTags)
            tagList.push(tag.tag_name);
        userTagList.push({user_id:user.user_id, tags:tagList});
    }

    let IssueTagList = [];
    for(const issue of allIssues) {
        let issueTags = await db.getIssueTags(issue.issue_id);
        let tagList = [];
        for(const tag of issueTags)
            tagList.push(tag.tag_name);
        IssueTagList.push({issue_id:issue.issue_id, tags:tagList});
    }

    for(const user of users) {
        let uTag = userTagList.find(u => u.user_id === user.user_id).tags;
        for(const issue of allIssues) {
            let iTag = IssueTagList.find(i => i.issue_id === issue.issue_id).tags;
            //Check all tags for an issues are a subset of the users tags
            if (iTag.every(tag => uTag.includes(tag))) {
                //Check if issue is already assigned to a user then check if the user has time to complete the issue
                if ((parseInt(issue.user_assigned_id) === parseInt(user.user_id) || !issue.user_assigned_id) &&
                    parseInt(user.user_free_time) >= parseInt(issue.issue_completion_time)) {
                    user.user_free_time -= issue.issue_completion_time;
                    issue.issue_state = 2;
                    await db.updateIssue(issue.issue_id, issue.issue_name, issue.issue_description, issue.issue_state,
                        issue.issue_completion_time, issue.issue_priority, user.user_id, issue.team_assigned_id);
                }
            }
        }
    }
    await refreshColumn(users[0].user_id);
    res.send();
}

//Socket functions
//get room name for socket
function getRoomName(user) {
    let roomName;
    if (user.user_team) {
        roomName = "team " + user.user_team;
    } else {
        roomName =  "user " + user.user_id;
    }
    return roomName;
}

//refresh main page
async function refreshColumn(user_assigned_id) {
    let user = await db.getUserById(user_assigned_id);
    let roomName = getRoomName(user);
    io.in(roomName).emit('refresh column');
}

//refresh for team
async function refreshColumnNoUser(team_assigned_id) {
    let roomName = "team " + team_assigned_id;
    io.in(roomName).emit('refresh column');
}