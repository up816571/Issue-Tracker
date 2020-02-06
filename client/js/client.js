
'use strict';

/*
 * @TODO Use websockets
 * @TODO general error handling
 * @TODO Add teams button if user is in a team
 * @TODO Add create team button
 * @TODO submit time button
 * @TODO Hook up auto assignment feature
 * @TODO rewrite tags functionality to be server side
*/

//initialisation for materialize elements
document.addEventListener('DOMContentLoaded', async function() {
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

    document.getElementById('login-button').addEventListener('click', loginUser);
    document.getElementById('sign-up-button').addEventListener('click', signUpUser);
    //Testing
    document.getElementById('login-button').click();
    //

    document.getElementById('edit-issue-submit').addEventListener('click', patchIssue);
    document.getElementById('add-issue-button').addEventListener('click', addIssueModel);
    document.getElementById('add-issue-submit').addEventListener('click', addNewIssue);
    document.getElementById('confirm-user-button').addEventListener('click', patchUser);
});

//currently logged in user
//Would be changed to not use global var when auth is implemented
let userLoggedIn;

async function loginUser() {
    //let name = document.getElementById("login-user-name").value;
    //for testing
    let name = "Test";
    //
    if (name.length > 0) {
        let user = await updateUserData(name);
        if (user) {
            await updateIssues(user);
            document.getElementById("login-box").style.display = "none";
            userLoggedIn = user;
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
            .catch(function(error) {console.log(error);});
        if (!checkName) {
            await fetch('http://localhost:8080/users', {method: 'POST', headers:
                    {'Content-Type': 'application/json'}, body:JSON.stringify({name:name})})
                .then((response) => {return response;})
                .catch(function(error) {console.log(error);});
            await updateUserData(name);
            document.getElementById("login-box").style.display = "none";
        } else {
            console.log("Name taken");
        }
    } else {
        document.getElementById("login-user-name").focus();
        console.log("No inputted name");
    }
}

async function updateUserData(name) {
    let data = await requestUserData(name);
    document.getElementById('dropdown-button').innerHTML = data.user_name +
        "<i class='material-icons right small'>arrow_drop_down</i>";
    if (data.user_assignment_type === 1)
        document.getElementById('automatic').checked = true;
    else
        document.getElementById('suggested').checked = true;
    const userTags = await requestUsersTags(data.user_id);
    const userTagsElem = M.Chips.getInstance(document.getElementById('tags-list-developer'));
    userTags.forEach((tags) => {
        userTagsElem.addChip({tag:tags.tag_name});
    });
    return data;
}

async function requestUserData(name) {
    return fetch('http://localhost:8080/users/' + name)
        .then((response) => response.json())
        .catch(function(error) {console.log(error);});
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
    if (data.name !== null) {
        let newIssue = await fetch('http://localhost:8080/issues', {method: 'POST',
            headers: {'Content-Type': 'application/json'}, body:data })
            .then((response) => response.text())
            .then((data) =>  data.length ?  JSON.parse(data) : null)
            .catch(function(error) {console.log(error);});
        if (newIssue) {
            const issueChipsElem =  M.Chips.getInstance(document.getElementById('tags-list-issue'));
            const tags = issueChipsElem.chipsData;
            for (let i = 0; i < tags.length; i++) {
                //@Todo change server side code
                let tagID = await fetch('http://localhost:8080/tags/' + tags[i].tag)
                    .then((response) => response.text())
                    .then((data)  => data.length ?  JSON.parse(data) : null)
                    .catch(function(error) {console.log(error);});
                if (!tagID) {
                    tagID = await fetch('http://localhost:8080/tags', {method: 'POST', headers:
                            {'Content-Type': 'application/json'}, body:JSON.stringify({name:tags[i].tag})})
                        .then((response) => response.json())
                        .catch(function(error) {console.log(error);});
                }
                await fetch('http://localhost:8080/issues/tags', {method: 'POST', headers:
                        {'Content-Type': 'application/json'}, body:JSON.stringify({issueID:newIssue.issue_id,tagID:tagID.tag_id})})
                    .then((response) => {return response;})
                    .catch(function(error) {console.log(error);});
            }
        }
    } else {
        console.log('Issue name must have a value');
    }
}

async function updateIssues(user) {
    await fetch('http://localhost:8080/issues/' + user.user_id)
        .then((response) => {return response.json();})
        .then((data) => {
            clearIssuesList();
            data.forEach((issue) => {
                const cardTemplate = document.getElementById('issue-template').content.cloneNode(true);
                cardTemplate.querySelector('.card-title').textContent = issue.issue_name;
                cardTemplate.querySelector('.issue').addEventListener('click', () => {
                    populateIssueData(issue, user);
                });
                const state_map = ['backlog-issues', 'dev-issues', 'qa-issues', 'done-issues'];
                document.getElementById(state_map[issue.issue_state-1]).appendChild(cardTemplate);});
            })
        .catch(function(error) {console.log(error);});
}

async function getIssueModelData() {
    const issue_id = document.querySelector('.model-issue-title').getAttribute('data-id');
    const issue_name = document.getElementById('issue-name').value;
    const issue_description = document.getElementById('issue-desc').value;
    const issue_completion_time = document.getElementById('issue-time-input').value;
    const issue_state = document.getElementById('issue-state').value;
    const issue_priority = document.getElementById('issue-priority').value;
    const assigned_user = await requestUserData(document.getElementById('issue-assigned-user').value);
    return JSON.stringify({
        id: issue_id, name: issue_name, description: issue_description,
        state: issue_state, complete_time: issue_completion_time, issue_priority: issue_priority,
        user_assigned_id: assigned_user.user_id});
}

async function requestUsersTags(user_id) {
    return await fetch('http://localhost:8080/users/tags/' + user_id)
        .then((response) => {return response.json();})
        .then(async (tagData) => {return tagData;})
        .catch((error) => {console.log(error);});
}

async function populateIssueData(issue, user) {
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
    assignedUserElem.value = user.user_name;
    assignedUserElem.disabled = !user.user_team;
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

async function clearIssuesList() {
    const state_map = ['backlog-issues', 'dev-issues', 'qa-issues', 'done-issues'];
    state_map.forEach((state) => {
        document.getElementById(state).innerHTML = "";
    });
}

async function clearIssueModel() {
    document.getElementById('issue-name').value = "";
    document.getElementById('issue-desc').value = "";
    document.getElementById('issue-time-input').value = "";
    document.getElementById('issue-assigned-user').value = "";
    document.getElementById('issue-state').value = 1;
    document.getElementById('issue-priority').value = 1;
    M.FormSelect.init(document.getElementById('issue-state'));
    M.FormSelect.init(document.getElementById('issue-priority'));
    M.Chips.init(document.getElementById('tags-list-issue'));
    document.querySelector('.modified .chips-label').classList.remove('active');
    M.updateTextFields();
}


//app.patch('/issues/edit', updateIssue);
async function patchIssue() {
    let data = await getIssueModelData();
    await fetch('http://localhost:8080/issues/edit/', {method: 'PATCH',
        headers: {'Content-Type': 'application/json'}, body:data })
        .then((response) => {return response;})
        .catch(function(error) {console.log(error);});

    //Change some API functions
    const issueChipsElem =  M.Chips.getInstance(document.getElementById('tags-list-issue'));
    const tags = issueChipsElem.chipsData;
    let issueId = JSON.parse(data).id;
    let storedTags = await fetch('http://localhost:8080/issues/tags/' + issueId)
        .then((response) => {return response.json();})
        .catch(function(error) {console.log(error);});
    //@Todo change server side code
    for (let i = 0; i < tags.length; i++) {
        if (storedTags.filter(stored => stored.tag_name === tags[i].tag).length === 0) {
            let tagID = await fetch('http://localhost:8080/tags/' + tags[i].tag)
                .then((response) => response.text())
                .then((data)  => data.length ?  JSON.parse(data) : null)
                .catch(function(error) {console.log(error);});
            if (!tagID) {
                tagID = await fetch('http://localhost:8080/tags', {method: 'POST', headers:
                        {'Content-Type': 'application/json'}, body:JSON.stringify({name:tags[i].tag})})
                    .then((response) => {return response.json();})
                    .catch(function(error) {console.log(error);});
            }
            await fetch('http://localhost:8080/issues/tags', {method: 'POST', headers:
                    {'Content-Type': 'application/json'}, body:JSON.stringify({issueID:issueId,tagID:tagID.tag_id})})
                .then((response) => {return response;})
                .catch(function(error) {console.log(error);});
        }
    }
    for (let i = 0; i < storedTags.length; i++) {
        if (tags.filter(stored => stored.tag === storedTags[i].tag_name).length === 0) {
            let tagID = await fetch('http://localhost:8080/tags/' + storedTags[i].tag_name)
                .then((res) => res.text())
                .then((data) => data.length ?  JSON.parse(data) : null)
                .catch(function(error) {console.log(error);});
            await fetch('http://localhost:8080/issues/tags', {method: 'DELETE', headers:
                    {'Content-Type': 'application/json'}, body:JSON.stringify({issueID:issueId, tagID:tagID.tag_id})})
                .then((response) =>  response)
                .catch(function(error) {console.log(error);});
        }
    }
}
async function patchUser() {
    let user_id = userLoggedIn.user_id;
    let user_assignment_type;
    user_assignment_type = (document.getElementById('automatic').checked === true ? 1 : 2 );
    await fetch('http://localhost:8080/users/edit', {method: 'PATCH',  headers: {'Content-Type':
        'application/json'}, body:JSON.stringify({id:user_id,assignment_type:user_assignment_type})})
            .then((response) => response)
            .catch(function(error) {console.log(error);});

    const issueChipsElem =  M.Chips.getInstance(document.getElementById('tags-list-developer'));
    const tags = issueChipsElem.chipsData;
    let usersTags = await fetch('http://localhost:8080/users/tags/' + user_id)
        .then((response) => {return response.json();})
        .catch(function(error) {console.log(error);});

    // @TODO Change server API for tags
    for (let i = 0; i < tags.length; i++) {
        if (usersTags.filter(stored => stored.tag_name === tags[i].tag).length === 0) {
            let tagID = await fetch('http://localhost:8080/tags/' + tags[i].tag)
                .then((response) => response.text())
                .then((data)  => data.length ?  JSON.parse(data) : null)
                .catch(function(error) {console.log(error);});
            if (!tagID) {
                tagID = await fetch('http://localhost:8080/tags', {method: 'POST', headers:
                        {'Content-Type': 'application/json'}, body:JSON.stringify({name:tags[i].tag})})
                    .then((response) => {return response.json();})
                    .catch(function(error) {console.log(error);});
            }
            await fetch('http://localhost:8080/users/tags', {method: 'POST', headers:
                    {'Content-Type': 'application/json'}, body:JSON.stringify({userID:user_id,tagID:tagID.tag_id})})
                .then((response) => {return response;})
                .catch(function(error) {console.log(error);});
        }
    }
    for (let i = 0; i < usersTags.length; i++) {
        if (tags.filter(stored => stored.tag === usersTags[i].tag_name).length === 0) {
            let tagID = await fetch('http://localhost:8080/tags/' + usersTags[i].tag_name)
                .then((res) => res.text())
                .then((data) => data.length ?  JSON.parse(data) : null)
                .catch(function(error) {console.log(error);});
            await fetch('http://localhost:8080/users/tags', {method: 'DELETE', headers:
                    {'Content-Type': 'application/json'}, body:JSON.stringify({userID:user_id, tagID:tagID.tag_id})})
                .then((response) =>  response)
                .catch(function(error) {console.log(error);});
        }
    }
}
