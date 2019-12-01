const chai = require('chai');
const assert = require('assert');
const chaiHttp = require('chai-http');
const server = require("../server");
const should = chai.should();
const db = require("../sql-model.js");

chai.use(chaiHttp);
after(()=> {
    db.shutDown();
    server.close();
});

describe('All Test', function() {
    describe('User', function() {
        describe('/GET user', () => {
            it('Get user', (done) => {
                chai.request(server).get("/data/users").send({"name":"Josh"}).end((err, res) => {
                    res.should.have.status(200);
                    res.should.be.a('object');
                    res.body.user_id.should.be.eql(1);
                    done();
                });
            });
        });
        // describe('/POST user', () => {
        //    let user = {user_name: "Josh 2"};
        //    chai.request
        // });
    });

    describe('Issues', function() {
        describe('/GET issues', () => {
            it('Get issues', (done) => {
                chai.request(server).get("/data/issues").send({"id":"1"}).end((err, res) => {
                    res.should.have.status(200);
                    res.body[0].should.be.a('object');
                    res.body[0].issue_id.should.be.eql(1);
                    done();
                });
            });
        });
    });
});