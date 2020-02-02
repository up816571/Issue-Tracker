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

describe('All Tests', function() {
    describe('User', function() {
        describe('/GET user', () => {
            it('Get user', (done) => {
                chai.request(server).get("/users/Test").end((err, res) => {
                    res.should.have.status(200);
                    res.should.be.a('object');
                    res.body.user_id.should.be.eql(1);
                    done();
                });
            });
        });
        describe('/POST user', () => {
            it('Post user', (done) => {
                chai.request(server).post("/users").send({name:"Test 2"}).end((err,res) => {
                    res.should.have.status(200);
                    done();
                });
            });
            it('Post update user with both assignment and time', (done) => {
                chai.request(server).post("/users/edit").send({name:"Test 2", free_time:"3",
                assignment_type: "2"}).end((err,res) => {
                    res.should.have.status(200);
                });
                chai.request(server).get("/users/Test 2").end((err, res) => {
                    res.should.have.status(200);
                    res.body.user_assignment_type.should.be.eql(2);
                    res.body.user_free_time.should.be.eql(3);
                    done();
                });
            });
            it('Post update user with just time', (done) => {
                chai.request(server).post("/users/edit").send({name:"Test 2", free_time:"5"})
                .end((err,res) => {
                    res.should.have.status(200);
                });
                chai.request(server).get("/users/Test 2").end((err, res) => {
                    res.should.have.status(200);
                    res.body.user_free_time.should.be.eql(5);
                    res.body.user_assignment_type.should.be.eql(2);
                    done();
                });
            });
            it('Post update user with just assignment type', (done) => {
                chai.request(server).post("/users/edit").send({name:"Test 2", assignment_type: "1"})
                .end((err,res) => {
                    res.should.have.status(200);
                });
                chai.request(server).get("/users/Test 2").end((err, res) => {
                    res.should.have.status(200);
                    res.body.user_free_time.should.be.eql(5);
                    res.body.user_assignment_type.should.be.eql(1);
                    done();
                });
            });
        });
    });

    describe('Issues', function() {
        describe('/GET issues', () => {
            it('Get issues', (done) => {
                chai.request(server).get("/issues/1").end((err, res) => {
                    res.should.have.status(200);
                    res.body[0].should.be.a('object');
                    res.body[0].issue_id.should.be.eql(1);
                    done();
                });
            });
        });
        describe('/POST issues', () => {
            it('Post issues with minimum fields', (done) => {
                chai.request(server).post("/issues")
                .send({name:"Test issue", state:"2", user_assigned_id:"1"}).end((err,res) => {
                    res.should.have.status(200);
                    done();
                });
            });
            it('Post issues all fields', (done) => {
                chai.request(server).post("/issues")
                    .send({name:"Test issue 2", description: "There's a bug in my boot",
                        state:"3", complete_time: "8",user_assigned_id:"1"}).end((err,res) => {
                    res.should.have.status(200);
                    done();
                });
            });
            it('Post updating all fields on an issue', (done) => {
                chai.request(server).post("/issues/edit")
                    .send({id: "12", name:"Updated test issue 2", description: "New Desc",
                        state:"4", complete_time: "0",user_assigned_id:"1"}).end((err,res) => {
                    res.should.have.status(200);
                });
                chai.request(server).get("/issues/1").end((err, res) => {
                    res.should.have.status(200);
                    res.body[11].should.be.a('object');
                    res.body[11].issue_completion_time.should.be.eql(0);
                    res.body[11].issue_state.should.be.eql(4);
                    res.body[11].issue_description.should.be.eql("New Desc");
                    done();
                });
            });
            it('Post updating some fields on an issue', (done) => {
                chai.request(server).post("/issues/edit")
                    .send({id: "6", description: "Big DESC blah blah blah", state:"4"}).end((err,res) => {
                    res.should.have.status(200);
                });
                chai.request(server).get("/issues/1").end((err, res) => {
                    res.should.have.status(200);
                    res.body[5].should.be.a('object');
                    res.body[5].issue_completion_time.should.be.eql(1);
                    res.body[5].issue_state.should.be.eql(4);
                    done();
                });
            });
        });
    });

    describe('Tags', function() {
        describe('/GET tags', () => {
            it('Get tags', (done) => {
                chai.request(server).get("/tags/Java").end((err,res) => {
                    res.should.have.status(200);
                    res.should.be.a('object');
                    res.body.tag_id.should.be.eql(1);
                    done();
                });
            });
            it('Get users tags', (done) => {
                chai.request(server).get("/users/tags/Test").end((err,res) => {
                    res.should.have.status(200);
                    res.body[0].tag_name.should.be.eql("Java");
                    res.body[1].tag_name.should.be.eql("Dev");
                    res.should.be.a('object');
                    done();
                });
            });
            it('Get issue tags', (done) => {
                chai.request(server).get("/issues/tags/1").end((err,res) => {
                    res.should.have.status(200);
                    res.body[0].tag_name.should.be.eql("C");
                    res.should.be.a('object');
                    done();
                });
            });
        });
        describe('/POST tags', () => {
            it('Post tags', (done) => {
                chai.request(server).post("/tags").send({name:"New Tag"}).end((err,res) => {
                    res.should.have.status(200);
                    done();
                });
            });
            it('Post update tags', (done) => {
                chai.request(server).post("/tags/edit").send({id: "5", name:"Changed Tag"}).end((err,res) => {
                    res.should.have.status(200);
                    done();
                });
            });
        });
        describe('/POST tags links', () => {
            it('Adding link between tag and user', (done) => {
               chai.request(server).post("/users/tags").send({userID: "1", tagID:"5"}).end((err,res) => {
                   res.should.have.status(200);
                   done();
               });
            });
            it('Adding link between tag and issue', (done) => {
               chai.request(server).post("/issues/tags").send({issueID: "12", tagID:"5"}).end((err,res) => {
                   res.should.have.status(200);
                   done();
               });
            });
        });
        describe('/DELETE tag links', () => {
            it('Remove link between tag and user', (done) => {
                chai.request(server).delete("/users/tags").send({userID: "1", tagID:"3"}).end((err,res) => {
                    res.should.have.status(200);
                });
                chai.request(server).get("/users/tags/Test").end((err,res) => {
                    res.should.have.status(200);
                    res.body.should.not.include({tag_name: "Dev"});
                    done();
                });
           });
           it('Remove link between tag and issue', (done) => {
                chai.request(server).delete("/issues/tags").send({issueID: "12", tagID:"5"}).end((err,res) => {
                    res.should.have.status(200);
                });
                chai.request(server).get("/issues/tags/12").end((err,res) => {
                    res.should.have.status(200);
                    res.body.should.not.include({tag_name: "Changed Tag"});
                    done();
                });
            });
        });
    });
});