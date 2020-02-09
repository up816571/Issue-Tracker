
'use strict';

/*
 * @TODO general error handling
 * @TODO error handling on add and editing issues
 * @TODO Add create team button
 * @TODO suggested issues
*/

document.addEventListener('DOMContentLoaded', async function() {
    //initialisation for materialize elements
    let dropdownOptions = {hover:true, alignment:'right', coverTrigger:false, inDuration:100, outDuration:100,
        closeOnClick: false, constrainWidth: false};
    M.Dropdown.init(document.querySelectorAll('.dropdown-trigger'), dropdownOptions);
    M.Chips.init(document.getElementById('tags-list-issue'));

    //rewrite inner functions later
    let developerChipOptions = { onChipAdd: () => {
            let instance = M.Dropdown.getInstance(document.getElementById('dropdown-button'));
            instance.recalculateDimensions();
        }, onChipDelete: () => {
            let instance = M.Dropdown.getInstance(document.getElementById('dropdown-button'));
            instance.recalculateDimensions();
        }};
    M.Chips.init(document.getElementById('tags-list-developer'), developerChipOptions);

    let modalOptions = {inDuration:100, outDuration:100, startingTop:'5%' , endingTop:'15%' };
    M.Modal.init(document.querySelectorAll('.modal'), modalOptions);
    M.CharacterCounter.init(document.querySelectorAll('.has-character-counter'));
    M.FormSelect.init(document.querySelectorAll('select'));

    //Code needed to get chips label to behave as other labels do
    if (document.querySelector('.modified .chips .chip') != null) {
        document.querySelector('.modified .chips-label').classList.add('active');
    }

    document.querySelector('.modified .chips .input').addEventListener('focus', function () {
        document.querySelector('.modified .chips-label').classList.add('active', 'focus');
    });

    document.querySelector('.modified .chips .input').addEventListener('blur', function() {
        if (document.querySelector('.modified .chips .chip') === null  && this.value.length === 0) {
            document.querySelector('.modified .chips-label').classList.remove('active');
        }
        document.querySelector('.modified .chips-label').classList.remove('focus');
    });

    //Event listeners
    document.getElementById('login-button').addEventListener('click', loginUser);
    document.getElementById('login-user-name').addEventListener('keyup', function(event) {
        if (event.key === "Enter") {
            document.getElementById('login-button').click();
        }
    });
    document.getElementById('sign-up-button').addEventListener('click', signUpUser);
    //Testing
    document.getElementById('login-button').click();
    //

    document.getElementById('edit-issue-submit').addEventListener('click', patchIssue);
    document.getElementById('add-issue-button').addEventListener('click', addIssueModel);
    document.getElementById('add-issue-submit').addEventListener('click', addNewIssue);
    document.getElementById('confirm-user-button').addEventListener('click', patchUser);
    document.getElementById('assign-issues-button').addEventListener('click', assignIssues);

    let myIssuesBtn = document.getElementById('team-my-issues');
    let teamIssuesBtn = document.getElementById('team-all-issues');
    myIssuesBtn.addEventListener('click', function() {
        this.classList.add('active');
        teamIssuesBtn.classList.remove('active');
        updateIssues();
    });
    teamIssuesBtn.addEventListener('click', function() {
        this.classList.add('active');
        myIssuesBtn.classList.remove('active');
        updateTeamIssues();
    });
    document.getElementById('assign-teams').addEventListener('click', openTeamModel);
    document.getElementById('team-assign-submit').addEventListener('click', assignTeamIssues);
});

//currently logged in user
//Would be changed to not use global var when auth is implemented
let userLoggedIn;

async function loginUser() {
    //let name = document.getElementById("login-user-name").value;
    //for testing
    let name = "User 2";
    //
    if (name.length > 0) {
        let user = await requestUserData(name);
        userLoggedIn = user;
        if (user) {
            if (user.user_team)
                document.getElementById('team-div').style.display = "flex";
            await updateUserData();
            await updateIssues(user);
            document.getElementById("login-box").style.display = "none";
            socket.emit('login', userLoggedIn);
        } else {
            document.getElementById("login-user-name").focus();
        }
    } else {
        document.getElementById("login-user-name").focus();
        console.log("No inputted name");
    }
}

async function signUpUser() {
    let name = document.getElementById("login-user-name").value;
    if (name.length > 0 ) {
        let checkName = await fetch('http://localhost:8080/users/' + name)
            .then((response) => response.text())
            .then((data) => data.length ?  JSON.parse(data) : null)
            .catch((error) => console.log(error));
        if (!checkName) {
            // @TODO Need to change post method to return the created user so don't need to request again
            await fetch('http://localhost:8080/users', {method: 'POST', headers:
                    {'Content-Type': 'application/json'}, body:JSON.stringify({name:name})})
                .then((response) => {return response;})
                .catch((error) => console.log(error));
            let data = await requestUserData(name);
            userLoggedIn = data;
            await updateUserData();
            document.getElementById("login-box").style.display = "none";
            socket.emit('login', userLoggedIn);
        } else {
            console.log("Name taken");
        }
    } else {
        document.getElementById("login-user-name").focus();
        console.log("No inputted name");
    }
}

async function updateUserData() {
    document.getElementById('dropdown-button').innerHTML = userLoggedIn.user_name +
        "<i class='material-icons right small'>arrow_drop_down</i>";
    if (userLoggedIn.user_assignment_type === 1)
        document.getElementById('automatic').checked = true;
    else
        document.getElementById('suggested').checked = true;
    const userTags = await requestUsersTags(userLoggedIn.user_id);
    const userTagsElem = M.Chips.getInstance(document.getElementById('tags-list-developer'));
    userTags.forEach((tags) => {
        userTagsElem.addChip({tag:tags.tag_name});
    });
}

async function requestUserData(name) {
    return fetch('http://localhost:8080/users/' + name)
        .then((response) => response.json())
        .catch((error) => console.log(error));
}

async function requestUsersTags(user_id) {
    return await fetch('http://localhost:8080/users/tags/' + user_id)
        .then((response) => {return response.json();})
        .then(async (tagData) => {return tagData;})
        .catch((error) => {console.log(error);});
}

async function addIssueModel() {
    await clearIssueModel();
    document.getElementById('add-issue-submit').style.display = "inline-block";
    document.getElementById('edit-issue-submit').style.display = "none";
    let assignedUserElem = document.getElementById('issue-assigned-user');
    if (userLoggedIn.user_team === null) {
        assignedUserElem.value = userLoggedIn.user_name;
        assignedUserElem.disabled = true;
        M.updateTextFields();
    } else {
        assignedUserElem.disabled = false;
        M.updateTextFields();
    }
}

async function addNewIssue() {
    let data = await getIssueModelData();
    let jsonData = JSON.stringify(data);
    if (data.name && data.name !== "") {
        let newIssue = await fetch('http://localhost:8080/issues', {method: 'POST',
            headers: {'Content-Type': 'application/json'}, body:jsonData })
            .then((response) => response.text())
            .then((data) =>  data.length ?  JSON.parse(data) : null)
            .catch((error) => console.log(error));
        if (newIssue) {
            const issueChipsElem =  M.Chips.getInstance(document.getElementById('tags-list-issue'));
            const tags = issueChipsElem.chipsData;

            await fetch('http://localhost:8080/issues/tags', {method: 'PUT', headers:
                    {'Content-Type': 'application/json'}, body:JSON.stringify({issueID:newIssue.issue_id,tags:tags})})
                .then((response) => {return response;})
                .catch((error) => console.log(error));
        }
    } else {
        console.log('Issue name must have a value');
    }
}

async function updateIssues() {
    await fetch('http://localhost:8080/issues/' + userLoggedIn.user_id)
        .then((response) => {return response.json();})
        .then((data) => {
            createIssueElems(data);
        })
        .catch((error) => console.log(error));
}

async function updateTeamIssues() {
    console.log(userLoggedIn);
    await fetch('http://localhost:8080/teams/issues/' + userLoggedIn.user_team)
        .then((response) => {return response.json();})
        .then((data) => {
            createIssueElems(data);
        })
        .catch((error) => console.log(error));
}

async function createIssueElems(data) {
    await clearIssuesList();
    data.forEach((issue) => {
        const cardTemplate = document.getElementById('issue-template').content.cloneNode(true);
        cardTemplate.querySelector('.card-title').textContent = issue.issue_name;
        cardTemplate.querySelector('.issue').addEventListener('click', () => {
            populateIssueData(issue);
        });
        const state_map = ['backlog-issues', 'dev-issues', 'qa-issues', 'done-issues'];
        document.getElementById(state_map[issue.issue_state-1]).appendChild(cardTemplate);
    });
}

async function getIssueModelData() {
    const issue_id = document.querySelector('.model-issue-title').getAttribute('data-id');
    const issue_name = document.getElementById('issue-name').value;
    const issue_description = document.getElementById('issue-desc').value;
    let issue_completion_time = document.getElementById('issue-time-input').value;
    if (issue_completion_time === "")
        issue_completion_time = null;
    const issue_state = document.getElementById('issue-state').value;
    const issue_priority = document.getElementById('issue-priority').value;
    const assigned_user = await requestUserData(document.getElementById('issue-assigned-user').value);
    return {id: issue_id, name: issue_name, description: issue_description, state: issue_state,
        complete_time: issue_completion_time, issue_priority: issue_priority, user_assigned_id: assigned_user.user_id};
}

async function populateIssueData(issue) {
    document.getElementById('issue-name').value = issue.issue_name;
    document.getElementById('issue-desc').value = issue.issue_description;
    document.getElementById('issue-time-input').value = issue.issue_completion_time;
    const issuesTags = await requestIssueTags(issue.issue_id);
    M.Chips.init(document.getElementById('tags-list-issue'));
    if  (issuesTags.length > 0) {
        const issueChipsElem =  M.Chips.getInstance(document.getElementById('tags-list-issue'));
        document.querySelector('.modified .chips-label').classList.add('active');
        issuesTags.forEach((tags) => {
            issueChipsElem.addChip({tag:tags.tag_name});
        });
    } else {
        document.querySelector('.modified .chips-label').classList.remove('active');
    }
    document.getElementById('issue-state').value = issue.issue_state;
    M.FormSelect.init(document.getElementById('issue-state'));
    document.getElementById('issue-priority').value = issue.issue_priority;
    M.FormSelect.init(document.getElementById('issue-priority'));
    let assignedUserElem = document.getElementById('issue-assigned-user');
    assignedUserElem.value = userLoggedIn.user_name;
    assignedUserElem.disabled = !userLoggedIn.user_team;
    M.updateTextFields();
    document.querySelector('.model-issue-title').setAttribute('data-id',issue.issue_id);
    document.getElementById('add-issue-submit').style.display = "none";
    document.getElementById('edit-issue-submit').style.display = "inline-block";
}

async function requestIssueTags(id) {
    return await fetch('http://localhost:8080/issues/tags/' + id).then((response) => {return response.json();})
        .then(async (tagData) => {return tagData;})
        .catch((error) => {console.log(error);});
}

function clearIssuesList() {
    const state_map = ['backlog-issues', 'dev-issues', 'qa-issues', 'done-issues'];
    state_map.forEach((state) => {
        document.getElementById(state).innerHTML = "";
    });
}

function clearIssueModel() {
    document.getElementById('issue-name').value = "";
    document.getElementById('issue-desc').value = "";
    document.getElementById('issue-time-input').value = "";
    document.getElementById('issue-assigned-user').value = "";
    document.getElementById('issue-state').value = 1;
    M.FormSelect.init(document.getElementById('issue-state'));
    document.getElementById('issue-priority').value = 1;
    M.FormSelect.init(document.getElementById('issue-priority'));
    M.Chips.init(document.getElementById('tags-list-issue'));
    document.querySelector('.modified .chips-label').classList.remove('active');
    M.updateTextFields();
}


//app.patch('/issues/edit', updateIssue);
async function patchIssue() {
    let issue = await getIssueModelData();
    let data = JSON.stringify(issue);
    await fetch('http://localhost:8080/issues/edit/', {method: 'PATCH',
        headers: {'Content-Type': 'application/json'}, body:data })
        .then((response) => {return response;})
        .catch((error) => console.log(error));

    //Change some API functions
    const issueChipsElem =  M.Chips.getInstance(document.getElementById('tags-list-issue'));
    const tags = issueChipsElem.chipsData;
    let issueId = JSON.parse(data).id;
    await fetch('http://localhost:8080/issues/tags', {method: 'PUT', headers:
            {'Content-Type': 'application/json'}, body:JSON.stringify({issueID:issueId,tags:tags})})
        .then((response) => {return response;})
        .catch((error) => console.log(error));
}

async function patchUser() {
    let user_id = userLoggedIn.user_id;
    let user_assignment_type;
    user_assignment_type = (document.getElementById('automatic').checked === true ? 1 : 2 );
    await fetch('http://localhost:8080/users/edit', {method: 'PATCH',  headers: {'Content-Type':
        'application/json'}, body:JSON.stringify({id:user_id,assignment_type:user_assignment_type})})
            .then((response) => response)
            .catch((error) => console.log(error));

    const issueChipsElem =  M.Chips.getInstance(document.getElementById('tags-list-developer'));
    const tags = issueChipsElem.chipsData;
    await fetch('http://localhost:8080/users/tags', {method: 'PUT', headers:
            {'Content-Type': 'application/json'}, body:JSON.stringify({userID:user_id,tags:tags})})
        .then((response) => {return response;})
        .catch((error) => console.log(error));
}

async function assignIssues() {
    let freeTime = document.getElementById('developer-time-input').value;
    await fetch('http://localhost:8080/users/edit', {method: 'PATCH',  headers: {'Content-Type':
                'application/json'}, body:JSON.stringify({id:userLoggedIn.user_id,free_time:freeTime})})
        .then((response) => response)
        .catch((error) => console.log(error));

    await fetch('http://localhost:8080/users/assign', {method: 'PATCH', headers:
            {'Content-Type': 'application/json'}, body:JSON.stringify({name:userLoggedIn.user_name})})
        .then((response) => response)
        .catch((error) => console.log(error));
}

async function openTeamModel() {
    cleanTeamModel();
    let teamMembers = await fetch('http://localhost:8080/teams/users/' + userLoggedIn.user_team)
        .then((response) => response.json())
        .catch((error) => console.log(error));
    teamMembers.forEach((member) => {
        const timeInputTemplate = document.getElementById('team-time-input').content.cloneNode(true);
        timeInputTemplate.querySelector('.input-field').innerHTML ='<input id="' + member.user_name +
            '" class="team-time-input" name ="team-time-input" type="number" min="0">' +
            '<label for="' + member.user_name + '">' + member.user_name + ' free time</label>' ;
        timeInputTemplate.querySelector('.team-time-input').setAttribute('data-id',member.user_id);
        document.getElementById('model-time-content').appendChild(timeInputTemplate);
    M.Modal.init(M.Modal.getInstance(document.getElementById('team-modal')));
    });
}

function cleanTeamModel() {
    document.getElementById('model-time-content').innerHTML = "";
}

async function assignTeamIssues() {
    let inputFields = document.getElementsByName("team-time-input");
    console.log(elems);
}

const socket = io('http://localhost:8080');
socket.on('refresh column', (data) => {
    if (userLoggedIn.user_team) {
        if (document.getElementById('team-my-issues').classList.contains('active')) {
            updateIssues();
        } else {
            updateTeamIssues();
        }
    } else {
        updateIssues();
    }
});