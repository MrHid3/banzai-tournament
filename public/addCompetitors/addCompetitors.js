async function getResource(resourceName) {
    const request = await fetch(resourceName);
    return await request.json();
}
const belts = [];
console.log(`${backendURL}/resources/locations.json`)
const locations = await getResource(`${backendURL}/resources/locations.json`);
// const locations = [];

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

let competitorNumber = 0;
function addCompetitor() {
    competitorNumber++;
    const inputs = [['text', 'name'], ['text', 'surname'], ['number', 'age'], ['number', 'weight']];
    const tr = document.createElement("tr");
    tr.classList.add(`competitor-${competitorNumber}`);
    tr.classList.add("competitor");
    for (let i = 0; i < inputs.length; i++) {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.type = inputs[i][0];
        input.name = inputs[i][1];
        td.appendChild(input);
        tr.appendChild(td);
    }
    let beltTd = document.createElement("td");
    let beltSelect = document.createElement("select");
    beltSelect.name = "belt";
    for (let i = 0; i < belts.length; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.text = belts[i].polish;
        beltSelect.appendChild(option);
        beltSelect.classList.add(`belt-${competitorNumber}`)
        beltSelect.oninput = showStripes;
    }
    beltTd.appendChild(beltSelect);
    tr.appendChild(beltTd);
    const stripeTd = document.createElement("td");
    const stripeSelect = document.createElement("select");
    stripeSelect.name = "stripe";
    stripeSelect.classList.add(`stripe-${competitorNumber}`);
    stripeTd.appendChild(stripeSelect);
    tr.appendChild(stripeTd);
    const deleteButtonTd = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-button")
    deleteButton.innerHTML = "&#88;";
    deleteButton.onclick = deleteCompetitor;
    deleteButtonTd.appendChild(deleteButton);
    tr.appendChild(deleteButtonTd);
    competitorsTable.appendChild(tr);
    showStripes({target: beltSelect})
}

function showStripes(e){
    const stripeForm = e.target.parentElement.parentElement.children[5].children[0];
    const beltForm = e.target;
    while (stripeForm.length > 0)
         stripeForm.removeChild(stripeForm.firstChild);
}

function deleteCompetitor(e){
    e.target.parentElement.parentElement.remove();
    competitorNumber--;
}

addCompetitor();
addCompetitorButton.addEventListener("click", addCompetitor);

async function send(){
    if(locationSelect.value == 0){
        alert("Wybierz lokalizację");
        return;
    }
    if(confirm("Na pewno?")){
        let competitors = [];
        const categories = ["name", "surname", "age", "weight"];
        for(let i = 0; i < competitorNumber; i++){
            competitors.push([]);
        }
        categories.forEach(category => {
            const inputs = document.querySelectorAll(`input[name="${category}"]`);
            inputs.forEach((input, j) => {
                competitors[j].push(input.value);
            })
        })
        let wrong = [];
        competitors = competitors.filter((competitor, index) => {
            let keep = true;
            competitor.forEach(el => {
                if (el == ""){
                    keep = false;
                }
            })
            if(!keep){
                wrong.push(index)
            }
            return keep;
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