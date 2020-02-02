/* Import the puppeteer and expect functionality of chai library for configuraing the Puppeteer */
const puppeteer = require('puppeteer');
const chai = require('chai');
const { expect } = require('chai');
const should = chai.should();
const server = require("../../server");
const db = require("../../sql-model.js");

// const globalVariables = {browser:global.browser, expect:global.expect};

let page;
const host = 'http://localhost:8080/';

// open a new browser tab and set the page variable to point at it
before (async function () {
    global.expect = expect;
    global.browser = await puppeteer.launch( { headless: false } );
    page = await browser.newPage();
    page.setViewport({width: 1187, height: 1000});
});

// close the browser when the tests are finished
after (async function () {
    await page.close();
    await browser.close();
    db.shutDown();
    server.close();
});

describe('Client test suite', async function () {
    this.timeout(4000);
    it('homepage loads and has correct page title', async function () {
        const [response] = await Promise.all([
            page.goto(host, {timeout: 0}),
            page.waitForNavigation({timeout: 0}),
            page.waitForRequest('http://localhost:8080/users/Test'),
            page.waitForRequest('http://localhost:8080/issues/1'),
        ]);
        function logRequest(interceptedRequest) {
            console.log('A request was made:', interceptedRequest.url());
        }
        page.on('request', logRequest);

        expect(await page.title()).to.eql('Issue Tracker');
    });
    it('Check issues load', async function () {
        let issuesTitles = await page.$$('.card-title');
        issuesTitles.should.have.lengthOf(12);
    });
    it('Check users load', async function () {
        const text = await page.evaluate(element => element.innerText, await page.$('#dropdown-button'));
        text.should.include('Test');
    });
});
