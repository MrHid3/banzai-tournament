async function getResource(resourceName) {
    const request = await fetch(resourceName);
    return await request.json();
}

const locations = await getResource(`${backendURL}/resources/locations.json`);
const competitors = await getResource(`${backendURL}/getCompetitors`);

const locationSelect = document.querySelector('#location-select');
const competitorsTable = document.querySelector("#competitors-table");
const sendButton = document.querySelector("#send-button");
const addCompetitorButton = document.querySelector("#add-competitor-button");
locations.forEach(location => {
    const option = document.createElement("option");
    option.value = location.value;
    option.text = location.name;
    locationSelect.appendChild(option);
})

locationSelect.addEventListener("change", () => {
    const locationCompetitors = competitors.filter(competitor => competitor.location = locationSelect.value);
    console.log(locationCompetitors);
    locationCompetitors.forEach(competitor => {
        addCompetitor(competitor.name, competitor.surname, competitor.age, competitor.weight, competitor.level);
    })
})

let competitorNumber = 0;
function addCompetitor(name="", surname="", age="", weight="", level=1) {
    competitorNumber++;
    const inputs = [['text', 'name', name], ['text', 'surname', surname], ['number', 'age', age], ['number', 'weight', weight]];
    const tr = document.createElement("tr");
    tr.classList.add(`competitor-${competitorNumber}`);
    tr.classList.add("competitor");
    for (let i = 0; i < inputs.length; i++) {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.type = inputs[i][0];
        input.name = inputs[i][1];
        input.value = inputs[i][2];
        td.appendChild(input);
        tr.appendChild(td);
    }
    let levelTd = document.createElement("td");
    let levelSelect = document.createElement("select");
    levelSelect.name = "level";
    const levels = ["1 (<1 rok)", "2 (1-3 lata)", "3 (3+ lat)"]
    for (let i = 1; i <= levels.length; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.text = levels[i - 1];
        levelSelect.appendChild(option);
        levelSelect.classList.add(`level-${competitorNumber}`)
    }
    levelTd.appendChild(levelSelect);
    tr.appendChild(levelTd);
    const deleteButtonTd = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-button")
    deleteButton.innerHTML = "&#88;";
    deleteButton.onclick = deleteCompetitor;
    deleteButtonTd.appendChild(deleteButton);
    tr.appendChild(deleteButtonTd);
    competitorsTable.appendChild(tr);
}

function deleteCompetitor(e){
    e.target.parentElement.parentElement.remove();
    competitorNumber--;
}

addCompetitor();
addCompetitorButton.addEventListener("click", () => addCompetitor());

async function send(){
    if(locationSelect.value == 0){
        alert("Wybierz lokalizację");
        return;
    }
    if(confirm("Na pewno?")){
        let competitors = [];
        let wrong = [];
        const competitorRows = document.querySelectorAll("tr.competitor")
        for(let i = 0; i < competitorNumber; i++){
            competitors.push({});
        }
        for(let i = 0; i < competitorRows.length; i++){
            const children = competitorRows[i].children;
            for(let j = 0; j < 5; j++){
                if(children[j].children[0].value == ""){
                    wrong.push(i);
                    break;
                }
                competitors[i][children[j].children[0].name] = children[j].children[0].value;
            }
        }
        wrong.reverse()
        wrong.forEach((element) => {
            competitors.splice(element, 1);
        })
        const errors = document.querySelectorAll("#competitors-table .error");
        errors.forEach(el => {
            el.classList.remove("error")
        })
        wrong.forEach(el => {
            competitorsTable.children[el + 1].classList.add("error");
        })
        const res = await fetch(`${backendURL}/addCompetitors`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                location: locationSelect.value,
                competitors: competitors
            })
        })
        if(res.error){
            res.wrong.forEach(el => {
                competitorsTable.children[el + 1].classList.add("error");
            })
        }
    }
}
sendButton.addEventListener("click", send);