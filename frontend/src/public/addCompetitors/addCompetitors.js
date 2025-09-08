//TODO: deleting
//TODO: loading twice
//TODO: reloading after saving
//TODO:
async function getResource(resourceName) {
    try{
        const request = await fetch(resourceName);
        return await request.json();
    }catch(err){
        return null
    }
}
const locations = await getResource(`${backendURL}/resources/locations.json`);

const locationSelect = document.querySelector('#location-select');
const competitorsTable = document.querySelector("#competitors-table");
const saveButton = document.querySelector("#send-button");
const addCompetitorButton = document.querySelector("#add-competitor-button");
const topBar = document.querySelector("#top-bar");

try{
    locations.forEach(location => {
        const option = document.createElement("option");
        option.value = location.value;
        option.text = location.name;
        locationSelect.appendChild(option);
    })
}catch(err){
    alert("Coś poszło nie tak. Spróbuj ponownie później");
}

let locationCompetitors = [];
locationSelect.addEventListener("change", async () => {
    locationCompetitors = await getResource(`${backendURL}/getCompetitors/school/${locationSelect.value}`) ?? [];
    locationCompetitors.forEach(competitor => {
        addCompetitor(competitor.id, competitor.name, competitor.surname, competitor.age, competitor.weight, competitor.level);
    })
    addCompetitorButton.style.display = "block";
    topBar.classList.remove("before-location");
    saveButton.classList.remove("hidden");
})

let changes = [];
let competitors = [];
function addCompetitor(id=-1, name="", surname="", age="", weight="", level=-1) {
    const competitorNumber = competitors.length;
    competitors.push({id: id, name:name, surname: surname, age: age, weight: weight, level: level})
    const inputs = [['text', 'name', name], ['text', 'surname', surname], ['number', 'age', age], ['number', 'weight', weight]];
    const tr = document.createElement("tr");
    tr.classList.add(`competitor-${competitors.length}`);
    tr.classList.add("competitor");
    const idTd = document.createElement("td");
    idTd.classList.add("hidden");
    const idInput = document.createElement("input");
    idInput.name = "id";
    idInput.value = id;
    idInput.type = "hidden";
    idTd.appendChild(idInput);
    tr.appendChild(idTd);
    for (let i = 0; i < inputs.length; i++) {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.type = inputs[i][0];
        input.name = inputs[i][1];
        input.value = inputs[i][2];
        input.autocomplete = "off";
        input.addEventListener("change", e => {
            input.classList.remove("error");
            changeCompetitor(id, e.target.name, e.target.value, competitorNumber);
        })
        td.appendChild(input);
        tr.appendChild(td);
    }
    let levelTd = document.createElement("td");
    let levelSelect = document.createElement("select");
    levelSelect.name = "level";
    levelSelect.autocomplete = "off";
    levelSelect.classList.add(`level-${competitors.length}`);
    levelSelect.classList.add("level");
    const defaultOption = document.createElement("option");
    defaultOption.text = "Wybierz poziom";
    defaultOption.value = "-1";
    defaultOption.selected = true;
    defaultOption.disabled = true;
    levelSelect.appendChild(defaultOption);
    const levels = ["1 (<1 rok)", "2 (1-3 lata)", "3 (3+ lat)"]
    for (let i = 0; i < levels.length; i++) {
        const option = document.createElement("option");
        option.value = String(i);
        option.text = levels[i];
        levelSelect.appendChild(option);
    }
    levelSelect.addEventListener("change", e => {
        levelSelect.classList.remove("error");
        changeCompetitor(id, "level", e.target.value, competitorNumber);
    })
    levelSelect.value = level;
    levelTd.appendChild(levelSelect);
    tr.appendChild(levelTd);
    const deleteButtonTd = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-button")
    deleteButton.innerHTML = "&#88;";
    deleteButton.onclick = () => deleteCompetitor(competitorNumber);
    deleteButtonTd.appendChild(deleteButton);
    tr.appendChild(deleteButtonTd);
    competitorsTable.appendChild(tr);
}

function deleteCompetitor(competitorNumber){
    competitorsTable.removeChild(competitorsTable.children[competitorNumber + 1]);
    competitors.splice(competitorNumber, 1);
}

addCompetitorButton.addEventListener("click", () => addCompetitor());

function deactivateSave(){
    saveButton.classList.add("disabled");
    saveButton.innerText = "BRAK ZMIAN";
}

function activateSave(){
    saveButton.classList.remove("disabled");
    saveButton.innerText = "ZAPISZ";
}

function compareCompetitors(){
    if(JSON.stringify(locationCompetitors) === JSON.stringify(competitors)){
        deactivateSave();
    }else{
        activateSave();
    }
}

function changeCompetitor(competitorID, name, value, competitorNumber){
    if(competitorID !== -1){
        changes = [{id: competitorID, name: name, value: value}, ... changes];
    }
    competitors[competitorNumber][name] = value;
    compareCompetitors();
}

deactivateSave();
async function save(){
    if(locationSelect.value == 0){
        alert("Wybierz lokalizację");
        return;
    }
    //TODO: verify all rows are completed
    let invalidInputs = [];
    const competitorInputs = document.querySelectorAll(".competitor td input");
    for (let i = 0; i < competitorInputs.length; i++){
        if(competitorInputs[i].value === ""){
            invalidInputs.push(i);
        }
    }
    let invalidSelects = [];
    const levelSelects = document.querySelectorAll(".level");
    for(let i = 0; i < levelSelects.length; i++){
        if(levelSelects[i].value === "-1"){
            invalidSelects.push(i);
        }
    }
    if(invalidSelects.length > 0 || invalidInputs.length > 0){
        alert("Uzupełnij wszystkie pola");
        invalidInputs.forEach(number => {
            competitorInputs[number].classList.add("error");
        });
        invalidSelects.forEach(number => {
            levelSelects[number].classList.add("error");
        })
        return
    }
    if(confirm("Na pewno?")){
        //TODO: send competitors to server
        let competitorsCopy = competitors.slice();
        competitorsCopy.splice(0, locationCompetitors.length);
        //TODO: only keep the latest changes
        for(let i = 0; i < changes.length; i++){
            for(let j = i + 1; j < changes.length; j++){
                if(changes[i]["id"] === changes[j]["id"]
                && changes[i]["name"] === changes[j]["name"]){
                    changes.splice(j, 1);
                }
            }
        }
        const res = await fetch(`${backendURL}/addCompetitors`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                location: locationSelect.value,
                changes: changes,
                newCompetitors: competitorsCopy,
            })
        })
        // if(res.error){
        //     res.wrong.forEach(el => {
        //         competitorsTable.children[el + 1].classList.add("error");
        //     })
        // }
    }
}
saveButton.addEventListener("click", save);