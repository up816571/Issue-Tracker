drop database if exists issue_tracker;
create database if not exists issue_tracker;
use issue_tracker;

CREATE TABLE assignment_type (
    assignment_type_id smallint PRIMARY KEY NOT NULL,
    assignment_type_name varchar(7)
);

INSERT INTO assignment_type VALUES(1, "Auto");
INSERT INTO assignment_type VALUES(2, "Suggest");

CREATE TABLE users (
  user_id int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  user_name varchar(50) NOT NULL,
  user_assignment_type smallint,
  user_free_time int,
  FOREIGN KEY (user_assignment_type) REFERENCES assignment_type(assignment_type_id)
);

CREATE TABLE state_type (
    state_id smallint PRIMARY KEY NOT NULL,
    state_name varchar(10)
);

INSERT INTO state_type VALUES(1, "Backlog");
INSERT INTO state_type VALUES(2, "In Dev");
INSERT INTO state_type VALUES(3, "In QA");
INSERT INTO state_type VALUES(4, "Closed");

CREATE TABLE issues (
  issue_id int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  issue_name varchar(100) NOT NULL,
  issue_description varchar(500),
  issue_state smallint NOT NULL,
  issue_completion_time int,
  issue_created_at datetime,
  user_assigned_id int NOT NULL,
  FOREIGN KEY (user_assigned_id) REFERENCES users(user_id),
  FOREIGN KEY (issue_state) REFERENCES state_type(state_id)
);

CREATE TABLE tags (
  tag_id int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  tag_name varchar(50) NOT NULL
);

CREATE TABLE user_tags (
  u_id int,
  t_id int,
  FOREIGN KEY (u_id) REFERENCES users(user_id),
  FOREIGN KEY (t_id) REFERENCES tags(tag_id)
);

CREATE TABLE issue_tags (
  i_id int,
  t_id int,
  FOREIGN KEY (i_id) REFERENCES issues(issue_id),
  FOREIGN KEY (t_id) REFERENCES tags(tag_id)
);

-- Test data

INSERT INTO users VALUES(NULL, "Josh", 1, NULL);
INSERT INTO users VALUES(NULL, "User 2", 2, NULL);

INSERT INTO issues VALUES(null, "Backlog 1", "Desc", 1, 5, SYSDATE(), 1);
INSERT INTO issues VALUES(null, "Backlog 2", "Desc", 1, 3, SYSDATE(), 1);
INSERT INTO issues VALUES(null, "Backlog 3", Null, 1, 12, SYSDATE(), 1);
INSERT INTO issues VALUES(null, "In Dev 1", "Desc", 2, 4, SYSDATE(), 1);
INSERT INTO issues VALUES(null, "In Dev 2", "Yeet", 2, 7, SYSDATE(), 1);
INSERT INTO issues VALUES(null, "In QA 1", "", 3, 1, SYSDATE(), 1);
INSERT INTO issues VALUES(null, "In QA 2", "Desc", 3, 2, SYSDATE(), 1);
INSERT INTO issues VALUES(null, "Closed 1", "", 4, 7, SYSDATE(), 1);
INSERT INTO issues VALUES(null, "Closed 2", "Desc", 4, 2, SYSDATE(), 1);
INSERT INTO issues VALUES(null, "Closed 3", NULL, 4, 3, SYSDATE(), 1);

INSERT INTO tags VALUES(NULL, "Java");
INSERT INTO tags VALUES(NULL, "C");
INSERT INTO tags VALUES(NULL, "Dev");
INSERT INTO tags VALUES(NULL, "QA");

INSERT INTO user_tags VALUES(1, 1);
INSERT INTO user_tags VALUES(1, 3);

INSERT INTO issue_tags VALUES(1, 2);
INSERT INTO issue_tags VALUES(2, 3);
INSERT INTO issue_tags VALUES(3, 1);
INSERT INTO issue_tags VALUES(4, 2);
INSERT INTO issue_tags VALUES(5, 3);
INSERT INTO issue_tags VALUES(6, 4);
