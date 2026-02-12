const tableNumber = localStorage.getItem("tableNumber");

if (!tableNumber) window.location.href = "/wybierzStolik";

const divTableNumber = document.getElementById('table-number');
divTableNumber.classList.add('TableText');
divTableNumber.textContent = "Stolik: "+tableNumber;
const butZawolaj = document.getElementById('Zawolaj');
const niepot = document.getElementById("niepotrzebne");
let Zawodnicy = [];

//                Wypełnianie Tabeli

function fillTable(tableId, categoryId, competitors){
    const table = document.getElementById(tableId);

    const th = table.querySelector("thead th");
    th.colSpan = 2;
    th.innerHTML = `Kategoria: ${categoryId}
    <span class="level-right">Level ${competitors[0].level+1}</span>
    `;

    const tbody = table.querySelector("tbody");
    tbody.innerHTML ="";
    competitors.forEach(tab => {
        const tr = document.createElement("tr");

        const tdName = document.createElement("td");
        tdName.textContent = tab.name;

        const tdSurname = document.createElement("td");
        tdSurname.textContent = tab.surname;

        tr.appendChild(tdName);
        tr.appendChild(tdSurname);
        tbody.appendChild(tr);

        Zawodnicy.push(tab.id);
        tr.addEventListener("click", () =>{
            tr.classList.toggle("selected");
            let cc = Zawodnicy.findIndex(cc => cc == tab.id);
            if(cc==-1){
                Zawodnicy.push(tab.id);
            }else{
                Zawodnicy.splice(cc, 1);
            }
            if(Zawodnicy.length == 0){
                butZawolaj.classList.add("brak");
            }else{
                butZawolaj.classList.remove("brak");
            }
        });
    });
}

async function fillList(categoryId, competitors) {
    const listDiv = document.getElementById("fightlist");

    const categoryDiv = document.createElement("div");
    categoryDiv.classList.add("fight-category");
    categoryDiv.id = `category-${categoryId}`;

    const header = document.createElement("div");
    header.classList.add("fight-list-header");
    header.textContent = `Kategoria: ${categoryId}`;

    if (competitors[0] && competitors[0].level !== undefined) {
        const levelSpan = document.createElement("span");
        levelSpan.classList.add("level-right");
        levelSpan.textContent = `Level: ${competitors[0].level + 1}`;
        header.appendChild(levelSpan);
    }

    categoryDiv.appendChild(header);

    let fightResults = {};
    try {
        const result = await fetch(`${backendURL}/getCategoryResults/${categoryId}?token=${token}`);
        const data = await result.json();
        fightResults = data;
    } catch (err) {
        console.error("Błąd pobierania wyników walk:", err);1
    }

    let allMatchesDone = (competitors.length * (competitors.length -1) / 2 == fightResults.length); // flaga sprawdzająca, czy wszystkie walki zakończone

    for (let i = 0; i < competitors.length; i++) {
        for (let j = i + 1; j < competitors.length; j++) {
            const rowDiv = document.createElement("div");
            rowDiv.classList.add("fight-row");

            const leftSpan = document.createElement("span");
            leftSpan.classList.add("fighter");
            leftSpan.textContent = `${competitors[i].name} ${competitors[i].surname}`;

            const separatorSpan = document.createElement("span");
            separatorSpan.classList.add("separator");
            separatorSpan.textContent = "vs";

            const rightSpan = document.createElement("span");
            rightSpan.classList.add("fighter");
            rightSpan.textContent = `${competitors[j].name} ${competitors[j].surname}`;

            rowDiv.appendChild(leftSpan);
            rowDiv.appendChild(separatorSpan);
            rowDiv.appendChild(rightSpan);

            let Szukaj = fightResults.filter(fightResult => {
                return competitors[i].id == fightResult.winner_id || competitors[i].id == fightResult.loser_id
            });

            Szukaj = Szukaj.filter(fightResult => {
                return competitors[j].id == fightResult.winner_id || competitors[j].id == fightResult.loser_id
            });
            const matchDone = Szukaj.length>0;

            if(matchDone){
                rowDiv.classList.add("Walczył");
            }else{
                rowDiv.classList.remove("Walczył");
            }


            let clickedOnce = false;

            rowDiv.addEventListener("click", () => {
                if (matchDone) {
                    if (confirm("Ta walka już się rozegrała. Czy na pewno chcesz ją powtórzyć?")) {
                        window.location.href = `/zegar?id1=${competitors[i].id}&id2=${competitors[j].id}&category=${categoryId}`;
                    }
                } else {
                    window.location.href = `/zegar?id1=${competitors[i].id}&id2=${competitors[j].id}&category=${categoryId}`;
                }
            });

            categoryDiv.appendChild(rowDiv);
        }
    }

    // jeśli wszystkie walki zakończone, dodaj przycisk "Zakończ grupę"
    if (allMatchesDone) {
        const endBtn = document.createElement("button");
        endBtn.textContent = "Zakończ grupę";
        endBtn.classList.add("fight-row");
        endBtn.classList.add("endButton")
        endBtn.addEventListener("click", async () => {
            try {
                const response = await fetch(`${backendURL}/endCategory`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ token: token, category_id: categoryId })
                });

                if (response.status === 400) {
                    alert("Nie można zakończyć grupy – musisz najpierw rozegrać wszystkie walki.");
                } else if (response.ok) {
                    location.reload(); // przeładowanie strony po sukcesie
                } else {
                    alert("Wystąpił błąd przy zakończeniu grupy.");
                }
            } catch (err) {
                console.error("Błąd wysyłania requestu:", err);
            }
        });
        categoryDiv.appendChild(endBtn);
    }

    listDiv.appendChild(categoryDiv);
}



//           Guzik Zawołąj

butZawolaj.addEventListener("click", async() => {
    if (Zawodnicy.length == 0) return;
    const request = await fetch(`${backendURL}/callCompetitors`,{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            token: token,
            matNumber: tableNumber,
            competitors: Zawodnicy
        })
    })
    if(request.ok){
        alert("Zawołanie wysłane");
        // butZawolaj.disabled=true;
        butZawolaj.classList.add("martwy");
        setTimeout(()=> {
            // butZawolaj.disabled=false;
            butZawolaj.classList.remove("martwy");
        },20000);
    }else{
        alert("Błąd zawołania");
    }
});

//          Pobieranie danych

fetch(`${backendURL}/getGroups/?tableNumber=${tableNumber}&token=${token}`)
    .then(odp => odp.json())
    .then(async (data) => {
        const [idFirst, idSecound] = data;
        if(idFirst)
            await fetch(`${backendURL}/getCategory/${idFirst}?token=${token}`)
                .then(odp => odp.json())
                .then(data => {
                    fillTable("TableFirst", idFirst, data);
                    fillList(idFirst, data);
                })
                .catch(err => {
                    console.error(`Błąd kategorie ${idFirst}`, err);
                });
        else
            document.getElementById("TableFirst").style.display = "none";
        if(idSecound)
            await fetch(`${backendURL}/getCategory/${idSecound}?token=${token}`)
                .then(odp => odp.json())
                .then(data => {
                    fillTable("TableSecound", idSecound, data);
                    fillList(idSecound, data);
                })
                .catch(err => {
                    console.error(`Błąd kategorie ${idSecound}`, err);
                });
        else{
            document.getElementById("TableSecound").style.display = "none";
        }
        if(!idFirst && !idSecound){
            butZawolaj.style.display = "none";
            alert("Skończyły się kategorie na tę połowę");
        }

    })
    .catch(err => {
        console.error("Błąd grupy", err);
    });


