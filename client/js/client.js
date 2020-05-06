
'use strict';

/*
 * @TODO general error handling
 * @TODO error handling on add and editing issues
 * @TODO assign issues to team
 * @TODO Add create team button
*/

const hostname = "localhost";
//const hostname = "up816571.myvm.port.ac.uk";

document.addEventListener('DOMContentLoaded', async function() {
    //initialisation for materialize elements
    let dropdownOptions = {hover:true, alignment:'right', coverTrigger:false, inDuration:100, outDuration:100,
        closeOnClick: false, constrainWidth: false};
    M.Dropdown.init(document.querySelectorAll('.dropdown-trigger'), dropdownOptions);
    M.Chips.init(document.getElementById('tags-list-issue'));

    //rewrite to get chips to look like other inputs
    let developerChipOptions = { onChipAdd: () => {
            let instance = M.Dropdown.getInstance(document.getElementById('dropdown-button'));
            instance.recalculateDimensions();
        }, onChipDelete: () => {
            let instance = M.Dropdown.getInstance(document.getElementById('dropdown-button'));
            instance.recalculateDimensions();
        }};
    M.Chips.init(document.getElementById('tags-list-developer'), developerChipOptions);

    //initialise models
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
    document.getElementById('add-issue-button').addEventListener('click', addIssueModel);
    document.getElementById('add-issue-submit').addEventListener('click', function(Event) {addNewIssue(Event)});
    document.getElementById('edit-issue-submit').addEventListener('click', function(Event) {patchIssue(Event)});
    document.getElementById('confirm-user-button').addEventListener('click', patchUser);
    document.getElementById('assign-issues-button').addEventListener('click', assignIssues);

    //need to hold states, may have been worth using react framework
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

//login a user
async function loginUser() {
    let loginNameBox = document.getElementById("login-user-name");
    let name = loginNameBox.value;
    if (name.length > 0) {
        let user = await requestUserData(name);
        //if user exists login display their information
        if (user) {
            document.getElementById("main-issue-content").hidden = false;
            userLoggedIn = user;
            if (user.user_team)
                document.getElementById('team-div').style.display = "flex";
            await updateUserData();
            await updateIssues(user);
            document.getElementById("login-box").style.display = "none";
            socket.emit('login', userLoggedIn);
        } else {
            loginNameBox.focus();
            loginNameBox.value = "";
            loginNameBox.placeholder = "not found";
        }
    } else {
        loginNameBox.focus();
        loginNameBox.placeholder = "Input a name";
        console.error("No inputted name");
    }
}

//sign up a user
async function signUpUser() {
    let loginNameBox = document.getElementById("login-user-name");
    let name = loginNameBox.value;
    if (name.length > 0 ) {
        let checkName = await requestUserData(name);
        //check a user does not already exists with this name
        if (!checkName) {
            // @TODO Need to change post method to return the created user so don't need to request again
            await fetch(`http://${hostname}:8080/users`, {method: 'POST', headers:
                    {'Content-Type': 'application/json'}, body:JSON.stringify({name:name})})
                .then((response) => response)
                .catch((error) => console.error(error));
            userLoggedIn = await requestUserData(name);
            await updateUserData();
            document.getElementById("login-box").style.display = "none";
            document.getElementById("main-issue-content").hidden = false;
            socket.emit('login', userLoggedIn);
        } else {
            loginNameBox.focus();
            loginNameBox.value = "";
            loginNameBox.placeholder = "name taken";
            console.error("Name taken");
        }
    } else {
        loginNameBox.focus();
        loginNameBox.placeholder = "Input a name";
        console.error("No inputted name");
    }
}

//get user data from their name
async function requestUserData(name) {
    return await fetch(`http://${hostname}:8080/users/` + name)
        .then((response) => response.text())
        .then((data) => data.length ? JSON.parse(data) : null)
        .catch((error) => console.error(error));
}

//get a users tags
async function requestUsersTags(user_id) {
    return await fetch(`http://${hostname}:8080/users/tags/` + user_id)
        .then((response) => response.json())
        .catch((error) => {console.error(error);});
}

//update user data
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

//create the issue model for adding an issue
async function addIssueModel() {
    await clearIssueModel();
    document.getElementById('add-issue-submit').style.display = "inline-block";
    document.getElementById('edit-issue-submit').style.display = "none";
    let assignedUserSelect = document.getElementById('issue-assigned-user-select');
    if (!userLoggedIn.user_team) {
        setNoTeamUser(assignedUserSelect);
    } else {
        await setTeamUsersSelect(assignedUserSelect);
        assignedUserSelect.value = 0;
    }
    M.FormSelect.init(document.getElementById('issue-assigned-user-select'));
    M.updateTextFields();
}

//set the assignee field to disabled when user is not on a team
function setNoTeamUser(selectBox) {
    let option = document.createElement("option");
    option.text = userLoggedIn.user_name;
    option.value = userLoggedIn.user_id;
    selectBox.appendChild(option);
    selectBox.disabled = true;
    selectBox.value = userLoggedIn.user_id;
}

//set up the assignee input when the user is on a team
async function setTeamUsersSelect(selectBox) {
    let teamOption = document.createElement("option");
    teamOption.text = "Assign to team";
    teamOption.value = 0;
    selectBox.appendChild(teamOption);
    let teamUsers = await fetch(`http://${hostname}:8080/teams/users/` + userLoggedIn.user_team)
        .then((response) => response.json())
        .catch((error) => console.error(error));
    teamUsers.forEach((user) => {
        let option = document.createElement("option");
        option.text = user.user_name;
        option.value = user.user_id;
        selectBox.appendChild(option);
    });
    selectBox.disabled = false;
}

//send a new issue data to the server
async function addNewIssue(Event) {
    let data = await getIssueModelData();
    let valid = validateIssueModal(data);
    if (valid) {
        let newIssue = await fetch(`http://${hostname}:8080/issues`, {method: 'POST',
            headers: {'Content-Type': 'application/json'}, body:JSON.stringify(data) })
            .then((response) => response.text())
            .then((data) =>  data.length ?  JSON.parse(data) : null)
            .catch((error) => console.error(error));
        //handle tags for the issue
        if (newIssue) {
            const issueChipsElem =  M.Chips.getInstance(document.getElementById('tags-list-issue'));
            const tags = issueChipsElem.chipsData;

            await fetch(`http://${hostname}:8080/issues/tags`, {method: 'PUT', headers:
                    {'Content-Type': 'application/json'}, body:JSON.stringify({issueID:newIssue.issue_id,tags:tags})})
                .then((response) => {return response;})
                .catch((error) => console.error(error));
        }
        M.Modal.getInstance(document.getElementById('issue-modal')).close();
    } else {
        M.updateTextFields();
        Event.preventDefault();
    }
}

//update and issue
async function patchIssue(Event) {
    let issue = await getIssueModelData();
    let valid = validateIssueModal(issue);
    if (valid) {
        await fetch(`http://${hostname}:8080/issues/edit/`, {method: 'PATCH',
            headers: {'Content-Type': 'application/json'}, body:JSON.stringify(issue) })
            .then((response) => response)
            .catch((error) => console.error(error));
        const issueChipsElem =  M.Chips.getInstance(document.getElementById('tags-list-issue'));
        const tags = issueChipsElem.chipsData;
        await fetch(`http://${hostname}:8080/issues/tags`, {method: 'PUT', headers:
                {'Content-Type': 'application/json'}, body:JSON.stringify({issueID:issue.id,tags:tags})})
            .then((response) => response)
            .catch((error) => console.error(error));
        M.Modal.getInstance(document.getElementById('issue-modal')).close();
    } else {
        M.updateTextFields();
        Event.preventDefault();
    }
}

//issue model validation
function validateIssueModal(data) {
    let valid = true;
    //data = JSON.parse(data);
    if (!data.name || data.name === "") {
        document.getElementById('issue-name').placeholder = "Please enter an issue name";
        valid = false;
    }
    if (!data.complete_time) {
        document.getElementById('issue-time-input').placeholder = "Please enter an issue complete time";
        valid = false;
    }
    return valid;
}

//update issues elements on the main page
async function updateIssues() {
    await fetch(`http://${hostname}:8080/issues/` + userLoggedIn.user_id)
        .then((response) => response.json())
        .then((data) => {
            createIssueElems(data);
        })
        .catch((error) => console.error(error));
}

//update issues elements on the main page
async function updateTeamIssues() {
    await fetch(`http://${hostname}:8080/teams/issues/` + userLoggedIn.user_team)
        .then((response) => response.json())
        .then((data) => {
            createIssueElems(data);
        })
        .catch((error) => console.error(error));
}

//create the issue element on the main page
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

//get input fields from the issue modal
async function getIssueModelData() {
    const issue_id = document.querySelector('.model-issue-title').getAttribute('data-id');
    const issue_name = document.getElementById('issue-name').value;
    const issue_description = document.getElementById('issue-desc').value;
    let issue_completion_time = document.getElementById('issue-time-input').value;
    if (issue_completion_time === "")
        issue_completion_time = null;
    const issue_state = document.getElementById('issue-state').value;
    const issue_priority = document.getElementById('issue-priority').value;
    let assignedUserSelectVal = (document.getElementById('issue-assigned-user-select')).value;
    let assigned_user = null;
    if(parseInt(assignedUserSelectVal) !== 0)
        assigned_user = assignedUserSelectVal;
    return {id: issue_id, name: issue_name, description: issue_description, state: issue_state,
        complete_time: issue_completion_time, issue_priority: issue_priority, user_assigned_id: assigned_user,
        team_assigned_id: userLoggedIn.user_team};
}

//populate the issue model
async function populateIssueData(issue) {
    clearIssueModel();
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

    let assignedUserSelect = document.getElementById('issue-assigned-user-select');
    if (!userLoggedIn.user_team) {
        setNoTeamUser(assignedUserSelect);
    } else {
        await setTeamUsersSelect(assignedUserSelect);
        if(issue.user_assigned_id != null) {
            assignedUserSelect.value = issue.user_assigned_id;
        } else {
            assignedUserSelect.value = 0;
        }
    }
    M.FormSelect.init(document.getElementById('issue-assigned-user-select'));
    M.updateTextFields();
    document.querySelector('.model-issue-title').setAttribute('data-id',issue.issue_id);
    document.getElementById('add-issue-submit').style.display = "none";
    document.getElementById('edit-issue-submit').style.display = "inline-block";
}

//get issue tags
async function requestIssueTags(id) {
    return await fetch(`http://${hostname}:8080/issues/tags/` + id).then((response) => {return response.json();})
        .then((tagData) => tagData)
        .catch((error) => {console.error(error);});
}

//clear issue from each state
function clearIssuesList() {
    const state_map = ['backlog-issues', 'dev-issues', 'qa-issues', 'done-issues'];
    state_map.forEach((state) => {
        document.getElementById(state).innerHTML = "";
    });
}

//clear data from issue modal
function clearIssueModel() {
    let issueNameInput = document.getElementById('issue-name');
    issueNameInput.value = "";
    issueNameInput.removeAttribute('placeholder');
    document.getElementById('issue-desc').value = "";
    let issueTimeInput = document.getElementById('issue-time-input');
    issueTimeInput.value = "";
    issueTimeInput.removeAttribute('placeholder');
    let assignedUserSelect = document.getElementById('issue-assigned-user-select');
    let length = assignedUserSelect.options.length;
    for (let i = length-1; i >= 0; i--) {
        assignedUserSelect.options[i] = null;
    }
    document.getElementById('issue-state').value = 1;
    M.FormSelect.init(document.getElementById('issue-state'));
    document.getElementById('issue-priority').value = 1;
    M.FormSelect.init(document.getElementById('issue-priority'));
    M.Chips.init(document.getElementById('tags-list-issue'));
    document.querySelector('.modified .chips-label').classList.remove('active');
    M.updateTextFields();
}

//update user data
async function patchUser() {
    let user_id = userLoggedIn.user_id;
    let user_assignment_type;
    user_assignment_type = (document.getElementById('automatic').checked === true ? 1 : 2 );
    await fetch(`http://${hostname}:8080/users/edit`, {method: 'PATCH',  headers: {'Content-Type':
        'application/json'}, body:JSON.stringify({id:user_id,assignment_type:user_assignment_type})})
            .then((response) => response)
            .catch((error) => console.error(error));

    const issueChipsElem =  M.Chips.getInstance(document.getElementById('tags-list-developer'));
    const tags = issueChipsElem.chipsData;
    await fetch(`http://${hostname}:8080/users/tags`, {method: 'PUT', headers:
            {'Content-Type': 'application/json'}, body:JSON.stringify({userID:user_id,tags:tags})})
        .then((response) => response)
        .catch((error) => console.error(error));
}

//automatic assign for single user
async function assignIssues() {
    let freeTime = document.getElementById('developer-time-input').value;
    await fetch(`http://${hostname}:8080/users/edit`, {method: 'PATCH',  headers: {'Content-Type':
                'application/json'}, body:JSON.stringify({id:userLoggedIn.user_id,free_time:freeTime})})
        .then((response) => response)
        .catch((error) => console.error(error));

    await fetch(`http://${hostname}:8080/users/assign`, {method: 'PATCH', headers:
            {'Content-Type': 'application/json'}, body:JSON.stringify({name:userLoggedIn.user_name})})
        .then((response) => response)
        .catch((error) => console.error(error));
}

//modal for inputting time for a team
async function openTeamModel() {
    cleanTeamModel();
    let teamMembers = await fetch(`http://${hostname}:8080/teams/users/` + userLoggedIn.user_team)
        .then((response) => response.json())
        .catch((error) => console.error(error));
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

//clear the team time input modal
function cleanTeamModel() {
    document.getElementById('model-time-content').innerHTML = "";
}

//auto assign issues for a team
async function assignTeamIssues() {
    let inputFields = document.getElementsByName("team-time-input");
    let userData = [];
    inputFields.forEach((input) => {
        if (input.value === "")
            input.value = 0;
        userData.push({user_id:input.getAttribute("data-id"), user_free_time:input.value})
    });
    await fetch(`http://${hostname}:8080/teams/assign/`, {method: 'PATCH', headers:
            {'Content-Type': 'application/json'}, body:JSON.stringify({users:userData})})
        .then((response) => response)
        .catch((error) => console.error(error));
}

//socket handling
const socket = io(`http://${hostname}:8080`);
//refresh the page using the websocket
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