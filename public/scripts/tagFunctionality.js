let changed = false;

let mainFunc = () => {
    let selectBtns = document.getElementsByClassName('select');
    let deselectBtns = document.getElementsByClassName('deselect');
    let current = [];
    populateCurrent(current);
    updateForm(current);
    updateSelectOnClick(current, selectBtns, deselectBtns);
    updateDeselectOnClick(current, deselectBtns);
};

// we get all of our elements with class "tag" and add on click events
let updateSelectOnClick = (current, selBtns, deselBtns) => {
    for(let i = 0; i < selBtns.length; i++) {
        let selBtn = selBtns[i];
        selBtn.addEventListener('click', () => {
            updateCurrent(current, selBtn, deselBtns);
        });
    };
};

let updateDeselectOnClick = (curr, deselBtn) => {
    for(let i = 0; i < deselBtn.length; i++) {
        deselBtn[i].addEventListener('click', (e) => {
            let elemIndex = curr.findIndex(val => JSON.stringify(val) === JSON.stringify({name: e.target.textContent, _id: e.target.getAttribute('value')}));
            curr.splice(elemIndex, 1);
            updateSelected(curr);
            updateForm(curr);
            updateDeselectOnClick(curr, deselBtn);
        });
    };
};

// for every element with the class "selected-tag" we update our current in order to not be able to select tags already present
let populateCurrent = (curr) => {
    const selectedTags = document.getElementsByClassName('selected-tag') || [];
    for(let i = 0; i < selectedTags.length; i++) {
        let tag = selectedTags[i];
        curr.push({name: tag.textContent, _id: tag.getAttribute('value')});
    };
};

// if our current variable doesn't have an object key called "name" equal to tag.textContent then we push it into the current variable
let updateCurrent = (curr, selBtn, deselBtns) => {
    if(!curr.filter(item => item.name === selBtn.textContent).length > 0) {
        // value on a list item for some reason uses parseInt, so you have to call getAttribute in order to get letters
        curr.push({name: selBtn.textContent, _id: selBtn.getAttribute('value')});
        updateSelected(curr);
        updateForm(curr);
        if(changed === true) {
            updateDeselectOnClick(curr, deselBtns);
            changed = false;
        };
    };
};

// update the "selected" unordered list with the items from current
let updateSelected = (curr) => {
    let selected = document.querySelector('.selected');
    selected.innerHTML = '';
    curr.forEach(item => {
        selected.innerHTML += `<li class="deselect" value=${item._id}>${item.name}</li>`;
    });
    changed = true;
};

// push every value from our "current" variable into the value of the "tags" input
let updateForm = (curr) => {
    let inputTags = document.getElementById('tags');
    let listOfIds = [];
    curr.forEach(item => {
        listOfIds.push(item._id);
    });
    let idsToStr = listOfIds.join(', ');
    inputTags.value = idsToStr;
};

mainFunc();