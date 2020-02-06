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
        });
        describe('/PATCH user', () => {
            it('Patch update user with both assignment and time', (done) => {
                chai.request(server).patch("/users/edit").send({name:"Test 2", free_time:"3",
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
            it('Patch update user with just time', (done) => {
                chai.request(server).patch("/users/edit").send({name:"Test 2", free_time:"5"})
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
            it('Patch update user with just assignment type', (done) => {
                chai.request(server).patch("/users/edit").send({name:"Test 2", assignment_type: "1"})
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
                    .send({name: "Test issue", state: "2", user_assigned_id: "1"}).end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
            });
            it('Post issues all fields', (done) => {
                chai.request(server).post("/issues")
                    .send({
                        name: "Test issue 2", description: "There's a bug in my boot",
                        state: "3", complete_time: "8", user_assigned_id: "1"
                    }).end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
            });
        });
        describe('/PATCH issues', () => {
            it('Patch updating all fields on an issue', (done) => {
                chai.request(server).patch("/issues/edit")
                    .send({id: "12", name:"Updated test issue 2", description: "New Desc",
                        state:"4", complete_time: "0", issue_priority: "1",user_assigned_id:"1"}).end((err,res) => {
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
            it('Patch updating some fields on an issue', (done) => {
                chai.request(server).patch("/issues/edit")
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
                chai.request(server).post("/tags").send({name: "New Tag"}).end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
            });
        });
        describe('/PATCH tags', () => {
            it('Patch update tags', (done) => {
                chai.request(server).patch("/tags/edit").send({id: "5", name:"Changed Tag"}).end((err,res) => {
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
    describe('Teams', function() {
        describe('/GET team', () => {
            it('Get team', (done) => {
                chai.request(server).get("/teams/1").end((err, res) => {
                    res.should.have.status(200);
                    res.should.be.a('object');
                    res.body.team_name.should.be.eql("Team 1");
                    done();
                });
            });
            it('Get team memebers', (done) => {
                chai.request(server).get("/teams/users/1").end((err, res) => {
                    res.should.have.status(200);
                    res.should.be.a('object');
                    res.body[0].user_id.should.be.eql(2);
                    done();
                });
            })
        });
        describe('/PATCH team', () => {
            it('edit team', (done) => {
                chai.request(server).patch("/teams/edit").send({team_id: "1", team_name:"New team 1"}).end((err,res) => {
                    res.should.have.status(200);
                });
                chai.request(server).get("/teams/1").end((err,res) => {
                    res.should.have.status(200);
                    res.should.be.a('object');
                    res.body.team_name.should.be.eql("New team 1");
                    done();
                });
            });
        });
    });
    describe('Assignment', function() {
        describe('Automatic', () => {
            it('Assign issues automatically', (done) => {
                let issues = [
                    {
                        issue_id: 1,
                        issue_name: 'Backlog 1',
                        issue_description: 'Desc',
                        issue_state: 1,
                        issue_completion_time: 5,
                        issue_created_at: '2020-02-03T20:11:43.000Z',
                        issue_priority: 1,
                        user_assigned_id: 1,
                        team_assigned_id: null
                    },
                    {
                        issue_id: 2,
                        issue_name: 'Backlog 2',
                        issue_description: 'Desc',
                        issue_state: 1,
                        issue_completion_time: 3,
                        issue_created_at: '2020-02-03T20:11:43.000Z',
                        issue_priority: 2,
                        user_assigned_id: 1,
                        team_assigned_id: null
                    },
                    {
                        issue_id: 3,
                        issue_name: 'Backlog 3',
                        issue_description: null,
                        issue_state: 1,
                        issue_completion_time: 12,
                        issue_created_at: '2020-02-03T20:11:43.000Z',
                        issue_priority: 3,
                        user_assigned_id: 1,
                        team_assigned_id: null
                    },
                    {
                        issue_id: 4,
                        issue_name: 'In Dev 1',
                        issue_description: 'Desc',
                        issue_state: 2,
                        issue_completion_time: 4,
                        issue_created_at: '2020-02-03T20:11:43.000Z',
                        issue_priority: 4,
                        user_assigned_id: 1,
                        team_assigned_id: null
                    },
                    {
                        issue_id: 5,
                        issue_name: 'In Dev 2',
                        issue_description: 'Something else',
                        issue_state: 2,
                        issue_completion_time: 7,
                        issue_created_at: '2020-02-03T20:11:43.000Z',
                        issue_priority: 1,
                        user_assigned_id: 1,
                        team_assigned_id: null
                    },
                    {
                        issue_id: 6,
                        issue_name: 'In QA 1',
                        issue_description: 'Big DESC blah blah blah',
                        issue_state: 4,
                        issue_completion_time: 1,
                        issue_created_at: '2020-02-03T20:11:43.000Z',
                        issue_priority: 1,
                        user_assigned_id: 1,
                        team_assigned_id: null
                    },
                    {
                        issue_id: 7,
                        issue_name: 'In QA 2',
                        issue_description: 'Desc',
                        issue_state: 3,
                        issue_completion_time: 2,
                        issue_created_at: '2020-02-03T20:11:43.000Z',
                        issue_priority: 1,
                        user_assigned_id: 1,
                        team_assigned_id: null
                    },
                    {
                        issue_id: 8,
                        issue_name: 'Closed 1',
                        issue_description: '',
                        issue_state: 4,
                        issue_completion_time: 7,
                        issue_created_at: '2020-02-03T20:11:43.000Z',
                        issue_priority: 2,
                        user_assigned_id: 1,
                        team_assigned_id: null
                    },
                    {
                        issue_id: 9,
                        issue_name: 'Closed 2',
                        issue_description: 'Desc',
                        issue_state: 4,
                        issue_completion_time: 2,
                        issue_created_at: '2020-02-03T20:11:43.000Z',
                        issue_priority: 3,
                        user_assigned_id: 1,
                        team_assigned_id: null
                    },
                    {
                        issue_id: 10,
                        issue_name: 'Closed 3',
                        issue_description: null,
                        issue_state: 4,
                        issue_completion_time: 3,
                        issue_created_at: '2020-02-03T20:11:43.000Z',
                        issue_priority: 1,
                        user_assigned_id: 1,
                        team_assigned_id: null
                    },
                    {
                        issue_id: 11,
                        issue_name: 'Test issue',
                        issue_description: null,
                        issue_state: 2,
                        issue_completion_time: null,
                        issue_created_at: '2020-02-03T20:11:44.000Z',
                        issue_priority: null,
                        user_assigned_id: 1,
                        team_assigned_id: null
                    },
                    {
                        issue_id: 12,
                        issue_name: 'Updated test issue 2',
                        issue_description: 'New Desc',
                        issue_state: 4,
                        issue_completion_time: 0,
                        issue_created_at: '2020-02-03T20:11:44.000Z',
                        issue_priority: null,
                        user_assigned_id: 1,
                        team_assigned_id: null
                    }
                ];
                let user = {
                    user_id: 1,
                    user_name: 'Test',
                    user_assignment_type: 1,
                    user_free_time: 10,
                    user_team: null
                };
                chai.request(server).patch("/users/assign").send({user:user, issues:issues}).end((err, res) => {
                    res.should.have.status(200);
                });
                chai.request(server).get("/users/Test").end((err, res) => {
                    res.should.have.status(200);
                    res.body.user_free_time.should.be.eql(2);
                });
                chai.request(server).get("/issues/1").end((err, res) => {
                    res.should.have.status(200);
                    res.body[0].issue_state.should.eql(2);
                    res.body[1].issue_state.should.eql(2);
                    res.body[2].issue_state.should.eql(1);
                    done();
                });
            });
        });
    });
});