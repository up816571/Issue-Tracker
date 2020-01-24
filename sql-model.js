
'use strict';

// create one connection to the database
let sqlPromise = null;

const mysql = require('mysql2/promise');
const config = require('./config.json');

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

async function getUser(user_name) {
    const sql = await init();
    const getQuery = sql.format('SELECT * FROM users WHERE ? ;', {user_name});
    const [user] = await sql.query(getQuery);
    return user[0];
}

async function getIssue(user_assigned_id) {
    const sql = await init();
    const getQuery = sql.format('SELECT * FROM issues WHERE ? ;', {user_assigned_id});
    const [issues] = await sql.query(getQuery);
    return  issues;
}

async function getTag(tag_name) {
    const sql = await init();
    const getQuery = sql.format('SELECT * FROM tags WHERE ? ;', {tag_name});
    const [tag] = await sql.query(getQuery);
    return tag[0];
}

async function getUserTags(user_name) {
    const sql = await init();
    const userData = (await getUser(user_name)).user_id;
    const getQuery = sql.format('SELECT tag_name FROM tags JOIN user_tags AS ut ON tags.tag_id = ut.t_id WHERE ut.u_id = ?', [userData]);
    const [tags] = await sql.query(getQuery);
    return tags;
}

async function getIssueTags(issue_id) {
    const sql = await init();
    const getQuery = sql.format('SELECT tag_name FROM tags JOIN issue_tags AS it ON tags.tag_id = it.t_id WHERE it.i_id = ?', [issue_id]);
    const [tags] = await sql.query(getQuery);
    return tags;
}

//default to auto assignment
async function addUser(user_name) {
    const user_assignment_type = 2;
    const user_free_time = 0;
    const sql = await init();
    const insertQuery = sql.format('INSERT INTO users SET ? ;', {user_name, user_assignment_type, user_free_time});
    await sql.query(insertQuery);
}

async function addIssue(issue_name,issue_description,issue_state,issue_completion_time,user_assigned_id) {
    const sql = await init();
    let issue_created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const insertQuery = sql.format('INSERT INTO issues SET ? ;', {issue_name,issue_description,issue_state,
        issue_completion_time, issue_created_at, user_assigned_id});
    await sql.query(insertQuery);
}

async function addTag(tag_name) {
    const sql = await init();
    const insertQuery = sql.format('INSERT INTO tags SET ? ;', {tag_name});
    await sql.query(insertQuery);
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

async function updateUser(user_name, user_assignment_type, user_free_time) {
    const sql = await init();
    const insertQuery = sql.format('UPDATE users SET user_assignment_type = COALESCE(?, user_assignment_type),' +
        ' user_free_time = COALESCE(?, user_free_time) WHERE user_name = ? ;', [user_assignment_type, user_free_time, user_name]);
    await sql.query(insertQuery);
}

async function updateIssue(issue_id, issue_name,issue_description,issue_state,issue_completion_time,user_assigned_id) {
    const sql = await init();
    const insertQuery = sql.format("UPDATE issues SET issue_name = COALESCE(?, issue_name), issue_description = " +
        "COALESCE(?, issue_description), issue_state = COALESCE(?, issue_state), issue_completion_time = COALESCE(?, " +
        "issue_completion_time), user_assigned_id = COALESCE(?, user_assigned_id) WHERE issue_id = ?",
        [issue_name,issue_description,issue_state, issue_completion_time, user_assigned_id, issue_id]);
    await sql.query(insertQuery);
}

async function updateTag(tag_id, tag_name) {
    const sql = await init();
    const insertQuery = sql.format("UPDATE tags SET tag_name = ? WHERE tag_id = ?", [tag_name, tag_id]);
    await sql.query(insertQuery);
}

module.exports = {
    getUser,
    getIssue,
    getTag,
    getUserTags,
    getIssueTags,
    addUser,
    addIssue,
    addTag,
    setUserTagLink,
    setIssueTagLink,
    updateUser,
    updateIssue,
    updateTag,
    shutDown
};