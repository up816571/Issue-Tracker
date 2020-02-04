
'use strict';

/*
 * @TODO Use websockets
 * @TODO error handle for when name is not in database
 * @TODO Update issue population to include priority and assignee
 * @TODO Add teams button if user is in a team
 * @TODO Add create team button
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

    //document.getElementById("login-button").addEventListener('click', loginUser);
    //For testing
    document.getElementById("login-box").style.display = "none";
    let user = await requestUserData("Test");
    await updateIssues(user);

    //document.getElementById("issue-submit").addEventListener("click", patchIssue);
    document.getElementById("add-issue-button").addEventListener("click", function() {addIssue(user)} );
});

async function loginUser() {
    let name = document.getElementById("login-user-name").value;
    if (name.length > 0) {
        let user = await requestUserData(name);
        if (user) {
            await updateIssues(user);
            document.getElementById("login-box").style.display = "none";
        } else {
            document.getElementById("login-user-name").focus();
        }
    } else {
        document.getElementById("login-user-name").focus();
        console.log("No inputted name");
    }
}

async function requestUserData(name) {
    return fetch('http://localhost:8080/users/' + name).then((response) => {
        return response.json();
    }).then(async (data) => {
        document.getElementById('dropdown-button').innerHTML = data.user_name +
            "<i class='material-icons right small'>arrow_drop_down</i>";
        if (data.user_assignment_type === 1) {
            document.getElementById('automatic').checked = true;
        } else {
            document.getElementById('suggested').checked = true;
        }
        const userTags = await requestUsersTags(name);
        const userTagsElem = M.Chips.getInstance(document.getElementById('tags-list-developer'));
        userTags.forEach((tags) => {
            userTagsElem.addChip({tag:tags.tag_name});
        });
        return data;
    }).catch(function(error) {
        console.log(error);
    })
}

async function addIssue(user) {
    await clearIssueModel();
    if (user.user_team === null) {
        let assignedUserElem = document.getElementById('issue-assigned-user');
        assignedUserElem.value = user.user_name;
        assignedUserElem.disabled = true;
        M.updateTextFields();
    } else {
        // @TODO Team stuff here
    }
}

async function updateIssues(user) {
    return fetch('http://localhost:8080/issues/' + user.user_id).then((response) => {
        return response.json();
    }).then((data) => {
        clearIssuesList();
        data.forEach((issue) => {
            const cardTemplate = document.getElementById('issue-template').content.cloneNode(true);
            cardTemplate.querySelector('.card-title').textContent = issue.issue_name;
            cardTemplate.querySelector('.issue').addEventListener('click', () => {
                populateIssueData(issue, user);
            });
            const state_map = ['backlog-issues', 'dev-issues', 'qa-issues', 'done-issues'];
            document.getElementById(state_map[issue.issue_state-1]).appendChild(cardTemplate);
        });
    }).catch(function(error) {
        console.log(error);
    });
}

async function requestUsersTags(name) {
    return await fetch('http://localhost:8080/users/tags/' + name).then((response) => {
        return response.json();
    }).then(async (tagData) => {
        return tagData;
    }).catch((error) => {
        console.log(error);
    })
}

async function populateIssueData(issue, user) {
    document.getElementById('issue-name').value = issue.issue_name;
    document.getElementById('issue-desc').value = issue.issue_description;
    document.getElementById('issue-time-input').value = issue.issue_completion_time;
    const issuesTags = await requestIssueTags(issue.issue_id);
    if  (issuesTags.length > 0) {
        M.Chips.init(document.getElementById('tags-list-issue'));
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
    if (user.user_team === null) {
        let assignedUserElem = document.getElementById('issue-assigned-user');
        assignedUserElem.value = user.user_name;
        assignedUserElem.disabled = true;
    } else {
        // @TODO Team stuff here
    }
    M.updateTextFields();
}

async function requestIssueTags(id) {
    return await fetch('http://localhost:8080/issues/tags/' + id).then((response) => {
        return response.json();
    }).then(async (tagData) => {
        return tagData;
    }).catch((error) => {
        console.log(error);
    })
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
    const issueChipsElem =  M.Chips.getInstance(document.getElementById('tags-list-issue'));
    const tags = issueChipsElem.chipsData;

    const issue_id = "1";
    const issue_name = document.getElementById('issue-name').value;
    const issue_description = document.getElementById('issue-desc').value;
    const issue_completion_time = document.getElementById('issue-time-input').value;
    const issue_state = document.getElementById('issue-state').value;
    const data = {issue_id: issue_id, issue_name: issue_name, issue_description: issue_description,
        issue_completion_time: issue_completion_time, issue_state: issue_state};
    console.log(JSON.stringify(data));

    fetch('http://localhost:8080/issues/edit', {method: 'PATCH',
        headers: {'Content-Type': 'application/json'}, body:JSON.stringify({id:1})}).then((response) => {
        return response.json();
    }).then((data) => {
       return "done"
    }).catch(function(error) {
        console.log(error);
    });
}