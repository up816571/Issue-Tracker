
'use strict';

/*
 * @TODO Use websockets
 * @TODO Nav right to be a text input to login/create user when loading page
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

    let name = "Test";
    let id = 1 ;

    await requestUserData(name);
    await updateIssues(id);
});

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

async function updateIssues(id) {
    return fetch('http://localhost:8080/issues/' + id).then((response) => {
        return response.json();
    }).then((data) => {
        clearIssuesList();
        data.forEach((issue) => {
            const cardTemplate = document.getElementById('issue-template').content.cloneNode(true);
            cardTemplate.querySelector('.card-title').textContent = issue.issue_name;
            cardTemplate.querySelector('.issue').addEventListener('click', () => {
                populateIssueData(issue);
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

async function populateIssueData(issue) {
    document.getElementById('issue_name').value = issue.issue_name;
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
    }
    document.getElementById('issue-state').value = issue.issue_state;
    M.FormSelect.init(document.getElementById('issue-state'));
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
    document.getElementById('issue_name').value = "";
    document.getElementById('issue-desc').value = "";
    document.getElementById('issue-time-input').value = "";
    document.getElementById('issue-state').value = "";
    M.FormSelect.init(document.getElementById('issue-state'));
    M.updateTextFields();
}