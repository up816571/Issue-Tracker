
'use strict';

let sqlPromise = null;

const mysql = require('mysql2/promise');
const config = require('./config.json');

// create connection to the database
async function init() {
    if (sqlPromise) return sqlPromise;

    sqlPromise = newConnection();
    return sqlPromise;
}

async function shutDown() {
    if (!sqlPromise) return;
    const stashed = sqlPromise;
    sqlPromise = null;
    await releaseConnection(await stashed);
}

async function newConnection() {
    const sql = await mysql.createConnection(config.mysql);

    // handle unexpected errors by just logging them
    sql.on('error', (err) => {
        console.error(err);
        sql.end();
    });

    return sql;
}

async function releaseConnection(connection) {
    await connection.end();
}

async function getUserById(user_id) {
    const sql = await init();
    const getQuery = sql.format('SELECT * FROM users WHERE ? ;', {user_id});
    const [user] = await sql.query(getQuery);
    return user[0];
}

async function getUser(user_name) {
    const sql = await init();
    const getQuery = sql.format('SELECT * FROM users WHERE ? ;', {user_name});
    const [user] = await sql.query(getQuery);
    return user[0];
}

async function getIssues(user_assigned_id) {
    const sql = await init();
    const getQuery = sql.format('SELECT * FROM issues WHERE ? ;', {user_assigned_id});
    const [issues] = await sql.query(getQuery);
    return issues;
}

async function getBacklogIssues(user_assigned_id) {
    const sql = await init();
    console.log(user_assigned_id);
    const getQuery = sql.format('SELECT * FROM issues WHERE user_assigned_id = ? AND issue_state = 1;', [user_assigned_id]);
    const [issues] = await sql.query(getQuery);
    return issues;
}

async function getTag(tag_name) {
    const sql = await init();
    const getQuery = sql.format('SELECT * FROM tags WHERE ? ;', {tag_name});
    const [tag] = await sql.query(getQuery);
    return tag[0];
}

async function getUserTags(user_id) {
    const sql = await init();
    const getQuery = sql.format('SELECT tag_name FROM tags JOIN user_tags AS ut ON ' +
        'tags.tag_id = ut.t_id WHERE ut.u_id = ?', [user_id]);
    const [tags] = await sql.query(getQuery);
    return tags;
}

async function getIssueTags(issue_id) {
    const sql = await init();
    const getQuery = sql.format('SELECT tag_name FROM tags JOIN issue_tags AS it ON ' +
        'tags.tag_id = it.t_id WHERE it.i_id = ?', [issue_id]);
    const [tags] = await sql.query(getQuery);
    return tags;
}

async function getTeam(team_id) {
    const sql = await init();
    const getQuery = sql.format('SELECT team_name FROM teams WHERE team_id = ? ;', [team_id]);
    const [team] = await sql.query(getQuery);
    return team[0];
}

async function getTeamMembers(user_team) {
    const sql = await init();
    const getQuery = sql.format('SELECT * FROM users WHERE user_team = ? ;', [user_team]);
    const [users] = await sql.query(getQuery);
    return users;
}

async function getTeamIssues(user_team) {
    const sql = await init();
    const getQuery = sql.format('SELECT issues.* FROM issues INNER JOIN users on users.user_id = ' +
        'issues.user_assigned_id WHERE user_team = ? ;', [user_team]);
    const [issues] = await sql.query(getQuery);
    return issues;
}

async function getTeamBacklogIssues(user_team) {
    const sql = await init();
    const getQuery = sql.format('SELECT issues.* FROM issues INNER JOIN users on users.user_id = ' +
        'issues.user_assigned_id WHERE user_team = ? AND issue_State = 1 ;', [user_team]);
    const [issues] = await sql.query(getQuery);
    return issues;
}

async function addUser(user_name) {
    const user_assignment_type = 2;
    const user_free_time = 0;
    const sql = await init();
    const insertQuery = sql.format('INSERT INTO users SET ? ;', {user_name, user_assignment_type, user_free_time});
    await sql.query(insertQuery);
}

async function addIssue(issue_name,issue_description,issue_state,issue_completion_time, issue_priority, user_assigned_id) {
    const sql = await init();
    let issue_created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const insertQuery = sql.format('INSERT INTO issues SET ? ;', {issue_name,issue_description,issue_state,
        issue_completion_time, issue_created_at, issue_priority, user_assigned_id});
    await sql.query(insertQuery);
    let [issue] = await sql.query(sql.format('SELECT * FROM issues WHERE issue_id = LAST_INSERT_ID() ;'));
    if (issue)
        return (issue[0]);
    else
        return null;
}

async function addTag(tag_name) {
    const sql = await init();
    const insertQuery = sql.format('INSERT INTO tags SET ? ;', {tag_name});
    await sql.query(insertQuery);
    const [newID] = await sql.query(sql.format('SELECT * FROM tags WHERE ? ;', {tag_name}));
    return newID[0];
}

async function setUserTagLink(u_id, t_id) {
    const sql = await init();
    const insertQuery = sql.format('INSERT INTO user_tags SET ? ;', {u_id, t_id});
    await sql.query(insertQuery);
}

async function setIssueTagLink(i_id, t_id) {
    const sql = await init();
    const insertQuery = sql.format('INSERT INTO issue_tags SET ? ;', {i_id, t_id});
    await sql.query(insertQuery);
}

async function updateUser(user_id, user_assignment_type, user_free_time) {
    const sql = await init();
    const insertQuery = sql.format('UPDATE users SET user_assignment_type = COALESCE(?, user_assignment_type),' +
        ' user_free_time = COALESCE(?, user_free_time) WHERE user_id = ? ;', [user_assignment_type, user_free_time, user_id]);
    await sql.query(insertQuery);
}

async function updateIssue(issue_id,issue_name,issue_description,issue_state,issue_completion_time,issue_priority,user_assigned_id) {
    const sql = await init();
    const insertQuery = sql.format("UPDATE issues SET issue_name = COALESCE(?, issue_name), issue_description = " +
        "COALESCE(?, issue_description), issue_state = COALESCE(?, issue_state), issue_completion_time = COALESCE(?, " +
        "issue_completion_time), issue_priority = COALESCE(?, issue_priority), user_assigned_id = COALESCE(?, user_assigned_id) WHERE issue_id = ? ;",
        [issue_name,issue_description,issue_state, issue_completion_time, issue_priority, user_assigned_id, issue_id]);
    await sql.query(insertQuery);
}

async function updateTag(tag_id, tag_name) {
    const sql = await init();
    const insertQuery = sql.format("UPDATE tags SET tag_name = ? WHERE tag_id = ? ;", [tag_name, tag_id]);
    await sql.query(insertQuery);
}

async function updateTeam(team_id, team_name) {
    const sql = await init();
    const insertQuery = sql.format("UPDATE teams SET team_name = ? WHERE team_id = ? ;", [team_name, team_id]);
    await sql.query(insertQuery);
}

async function deleteUserTagLink(u_id, t_id) {
    const sql = await init();
    const deleteQuery = sql.format("DELETE FROM user_tags WHERE u_id = ? AND t_id = ? ;", [u_id, t_id]);
    await sql.query(deleteQuery);
}

async function deleteIssueTagLink(i_id, t_id) {
    const sql = await init();
    const deleteQuery = sql.format("DELETE FROM issue_tags WHERE i_id = ? AND t_id = ? ;", [i_id, t_id]);
    await sql.query(deleteQuery);
}

module.exports = {
    getUserById,
    getUser,
    getIssues,
    getBacklogIssues,
    getTag,
    getUserTags,
    getIssueTags,
    getTeam,
    getTeamMembers,
    getTeamIssues,
    getTeamBacklogIssues,
    addUser,
    addIssue,
    addTag,
    setUserTagLink,
    setIssueTagLink,
    updateUser,
    updateIssue,
    updateTag,
    updateTeam,
    deleteUserTagLink,
    deleteIssueTagLink,
    shutDown
};