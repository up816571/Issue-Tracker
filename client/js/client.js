'use strict';

//initialisation for materialize elements
document.addEventListener('DOMContentLoaded', function() {
    let dropdownOptions = {hover:true, alignment:'right', coverTrigger:false, inDuration:100, outDuration:100,
        closeOnClick: false, constrainWidth: false};
    M.Dropdown.init(document.querySelectorAll('.dropdown-trigger'), dropdownOptions);

    let issueChipsElem = document.getElementById('tags-list-issue');
    let issueChipOptions = {data:[{tag: 'Test'}, {tag: 'Tag 2'}], placeholder:"Tags"};
    M.Chips.init(issueChipsElem, issueChipOptions);

    let developerChipsElem = document.getElementById('tags-list-developer');
    //rewrite inner functions later
    let developerChipOptions = {data:[{tag: 'Test'}, {tag: 'Tag 2'}], onChipAdd: () => {
            let instance = M.Dropdown.getInstance(document.getElementById('dropdown-button'));
            instance.recalculateDimensions();
        }, onChipDelete: () => {
            let instance = M.Dropdown.getInstance(document.getElementById('dropdown-button'));
            instance.recalculateDimensions();
        }};
    M.Chips.init(developerChipsElem, developerChipOptions);

    let modalOptions = {inDuration:100, outDuration:100, startingTop:'5%' , endingTop:'15%' };
    M.Modal.init(document.querySelectorAll('.modal'), modalOptions);

    M.CharacterCounter.init(document.querySelectorAll('.has-character-counter'));
    M.FormSelect.init(document.querySelectorAll('select'));
});

