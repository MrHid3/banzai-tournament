const configed = await (await fetch(`${backendURL}/getConfig?token=${token}`)).json();
const config = {};
for(const key of configed){
    config[key.key] = key.value;
}
console.log(config)

const beginButton = document.getElementById('beginButton');
const tableSpan = document.getElementById('numberOnSlider');
const tableSlider = document.getElementById('tableSlider');
const halfSelect = document.getElementById('half');
const sendButton = document.getElementById('send');

updateTables(config.numberOfTables);
tableSlider.value = config.numberOfTables;
tableSlider.addEventListener('input', (event) => {
    updateTables(event.target.value);
})
halfSelect.value = config.half;

if(config.fightsEnabled == 1){
    beginButton.style.display = "none";
}

beginButton.addEventListener('click', (event) => {
    if(confirm("Czy na pewno chcesz zacząć walki? Nie będziesz mógł już dodawać zawodników ani edytować kategorii")){
        fetch(`${backendURL}/config?token=${token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                key: "fightsEnabled",
                value: 1
            })
        })
    }
    window.location.reload();
})

sendButton.addEventListener("click", event => {
    fetch(`${backendURL}/config?token=${token}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            key: "numberOfTables",
            value: config.numberOfTables,
        })
    })
    fetch(`${backendURL}/config?token=${token}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            key: "half",
            value: halfSelect.value,
        })
    })
    window.location.reload();
})

function updateTables (num) {
    config.numberOfTables = num;
    tableSpan.innerText = num;
}