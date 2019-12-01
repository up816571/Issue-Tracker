
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

async function addUser(user_name) {
    const sql = await init();
    const insertQuery = sql.format('INSERT INTO users SET ? ;', {user_name});
    await sql.query(insertQuery);
}

async function getIssues(user_assigned_id) {
    const sql = await init();
    const getQuery = sql.format('SELECT * FROM issues WHERE ? ;', {user_assigned_id});
    const [issues] = await sql.query(getQuery);
    return  issues;
}

async function getUser(user_name) {
    const sql = await init();
    const getQuery = sql.format('SELECT * FROM users WHERE ? ;', {user_name});
    const [user] = await sql.query(getQuery);
    return user[0];
}

async function addIssue() {

}

module.exports = {
    getUser,
    getIssues,
    addUser,
    addIssue,
    shutDown
};