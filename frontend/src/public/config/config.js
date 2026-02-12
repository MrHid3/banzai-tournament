const config = await (await fetch(`${backendURL}/getConfig?token=${token}`)).json();
const beginButton = document.getElementById('beginButton');
const tableSpan = document.getElementById('numberOnSlider');
const tableSlider = document.getElementById('tableSlider');
const halfSelect = document.getElementById('half');
const sendButton = document.getElementById('send');
const resetButton = document.getElementById('resetButton');

updateTables(config.numberOfTables);
tableSlider.value = config.numberOfTables;
tableSlider.addEventListener('input', (event) => {
    updateTables(event.target.value);
})
halfSelect.value = config.half;

if(config.fightsEnabled == 1){
    beginButton.style.display = "none";
    tableSlider.style.display = "none";
    resetButton.style.display = "block";
}else{
    resetButton.style.display = "none";
}

beginButton.addEventListener('click', async (event) => {
    if(confirm("Czy na pewno chcesz zacząć walki? Nie będziesz mógł już dodawać zawodników ani edytować kategorii")){
        const zawodnicyBezKategorii = (await (await fetch(`${backendURL}/getCompetitorsWithoutCategories?token=${token}`)).json()).length

        if(zawodnicyBezKategorii == 0 || confirm(`Czy na pewno chcesz zacząć walki? ${zawodnicyBezKategorii} zawodników nie ma jeszcze kategorii`)){
            await fetch(`${backendURL}/config?token=${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    key: "fightsEnabled",
                    value: 1
                })
            })
            window.location.reload();
        }
    }
})


resetButton.addEventListener('click', async (event) => {
    if(confirm("Czy na pewno chcesz zatrzymać walki? Wszystkie wyniki zostaną usunięte")){
        await fetch(`${backendURL}/config?token=${token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                key: "fightsEnabled",
                value: 0
            })
        })
        await fetch(`${backendURL}/resetFights?token=${token}`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            }
        });
        window.location.reload();
    }
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