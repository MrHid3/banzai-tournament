let zawodnicy = [];
let aktualniePrzeciągany = null;
let canEdit = true;

const showTable = document.querySelector('#showTable');
const showCategories = document.querySelector("#showCategories");
const edition = document.querySelector("#edition");
const categories = document.querySelector("#grupy");
const table = document.querySelector("#zawodnicy-container");
showTable.addEventListener('input', (e) => {
    if(e.target.checked) {
       table.style.display = "block";
    }else{
        table.style.display = "none";
    }
})

showCategories.addEventListener('input', (e) => {
    if(e.target.checked) {
        categories.style.display = "block";
        table.style.width = "50%";
    }else{
        categories.style.display = "none";
        table.style.width = "100%";
    }
})

edition.addEventListener('input', (e) => {
    const pluses = document.querySelectorAll(".plus")
    if(e.target.checked) {
        for(let i = 0; i < pluses.length; i++) {
            pluses[i].style.display = "block";
        }
    }else{
        for(let i = 0; i < pluses.length; i++) {
            pluses[i].style.display = "none";
        }
    }
    canEdit = e.target.checked;
})

//****************************************************Kategorie********************************************************//

function KategoriaWagowa(waga1, waga2){
    const diff = Math.abs(waga1 - waga2);
    const bigger = waga1 > waga2 ? waga2 : waga1;
    return diff/bigger * 100 <= 10;
}

fetch(`${backendURL}/getCompetitors?token=${token}`)
    .then(response => response.json())
    .then(data => {
        zawodnicy = data.sort((a,b) => {
            const nameA = a.name.toUpperCase(); // ignore upper and lowercase
            const nameB = b.name.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            const surnameA = a.surname.toUpperCase();
            const surnameB = b.surname.toUpperCase();
            if (surnameA > surnameB) {
                return 1;
            }
            if (surnameA > surnameB) {
                return 1;
            }
            return 0;});
        const tbody = document.getElementById('zawodnicy').querySelector('tbody');

        data.forEach(zawodnik => {
            const tr = document.createElement('tr');
            const waga = Math.round(zawodnik.weight *10) / 10 + " Kg";

            tr.innerHTML = `
                <td>${zawodnik.name}</td>
                <td>${zawodnik.surname}</td>
                <td>${zawodnik.age}</td>
                <td>${waga}</td>
                <td>${zawodnik.level + 1}</td>
                <td>${zawodnik.location}</td>
                `;

            tbody.appendChild(tr);
        });
    })
    .catch(eror => console.error(eror));

//****************************************************Podział na Grupy********************************************************//

async function podzialNaGrupy(){


    try {
        const res = await fetch(`${backendURL}/getCategories?token=${token}`);
        const existing = await res.json();
        if (Array.isArray(existing) && existing.length > 0) {
            wyswietlGrupy(existing.map((g, i) => g));
            document.getElementById('zapisz').classList.remove('hidden');

            const resBez = await fetch(`${backendURL}/getCompetitorsWithoutCategories?token=${token}`);
            const bezKat = await resBez.json();
            if (bezKat.length > 0) {
                wyswietlZawodnikowBezKategorii(bezKat);
            }else {
                const staryDiv = document.querySelector('.bez-kategorii');
                if(staryDiv) staryDiv.remove()
            }
        } else {

            let nieprzydzieleni = [...zawodnicy];
            let grupy = [];

            nieprzydzieleni.sort((a, b) =>
                String(a.level).localeCompare(String(b.level)) ||
                KategoriaWagowa(a.weight, b.weight) ||
                a.age - b.age
            );
            while(nieprzydzieleni.length > 0) {
                const pierwszy = nieprzydzieleni.shift();
                const grupa = [pierwszy];
                const minAge = pierwszy.age;
                const pozostali = [];

                for (const kandydat of nieprzydzieleni) {
                    if (grupa.length < 4 &&
                        kandydat.level === pierwszy.level &&
                        KategoriaWagowa(kandydat.weight, pierwszy.weight) &&
                        Math.abs(kandydat.age - minAge) <= 2
                    ) {
                        grupa.push(kandydat);
                    } else {
                        pozostali.push(kandydat);
                    }
                }

                nieprzydzieleni = pozostali;
                grupy.push(grupa);
            }
            grupy.sort((a, b) => a[0].age  - b[0].age);
            wyswietlGrupy(grupy)
            document.getElementById('zapisz').classList.remove('hidden');
        }

    } catch (err) {
        console.error(err);
        alert("Błąd podczas pobierania z bazy danych");
    }
}

//****************************************************Wyświetl Grupy********************************************************//

function wyswietlGrupy(listaGrup){
    const divGrupy = document.getElementById('grupy');
    divGrupy.innerHTML = "";
    listaGrup = listaGrup
        .map(g => Array.isArray(g) ? g : g.zawodnicy || [])
        .filter(grupa => grupa.length > 0);

    listaGrup.forEach((grupaZawodnikow, numerGrupy) => {
        const blokGrupy = document.createElement('div');
        blokGrupy.classList.add('grupa');
        blokGrupy.dataset.katId = numerGrupy + 1;

        blokGrupy.innerHTML = `<h3>Kategoria ${numerGrupy+1}</h3>`;

        addDragDropListener(blokGrupy);

        grupaZawodnikow.forEach((zawodnik) =>{
            const zawodnikDiv = document.createElement('div');
            zawodnikDiv.classList.add('zawodnik');
            zawodnikDiv.draggable = true;
            zawodnikDiv.dataset.id = zawodnik.id;
            zawodnikDiv.innerHTML += `
                        ${zawodnik.name} ${zawodnik.surname}, 
                        ${zawodnik.age} lat, 
                        ${Math.round(zawodnik.weight * 10) / 10} kg, 
                        poziom ${zawodnik.level}, 
                        ${zawodnik.location}
                    `;

            zawodnikDiv.addEventListener('dragstart', event =>{
                aktualniePrzeciągany = zawodnikDiv;
                zawodnikDiv.classList.add('dragging');

            });

            zawodnikDiv.addEventListener('dragend', event=> {
                zawodnikDiv.classList.remove('dragging');
                aktualniePrzeciągany = null;
                sprawdzBezKategorii();
            })

            blokGrupy.appendChild(zawodnikDiv);
        });
        divGrupy.appendChild(blokGrupy);
    });
}

//****************************************************getDragAfterElement********************************************************//

function getDragAfterElement(container, y) {
    if(!canEdit) return;
    const draggableElements = [...container.querySelectorAll('.zawodnik:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if(offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else{
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

//****************************************************odswiezNumeracje********************************************************//

function odswiezNumeracje(){
    const divGrupy = document.getElementById('grupy');

    divGrupy.querySelectorAll('.grupa').forEach(blok => {
        if(!blok.classList.contains('nowa') && blok.querySelectorAll('.zawodnik').length === 0){
            const next = blok.nextElementSibling;
            if(next && next.classList.contains('plus')){
                next.remove();
            }
            blok.remove();
        }
    });

    const grupy = Array.from(divGrupy.querySelectorAll('.grupa'));
    let licznik = 1;
    grupy.forEach((blok) => {
        if(!blok.classList.contains('nowa')){
            let span = blok.querySelector('.tyt-grupy');
            if(!span){
                const h3 = blok.querySelector('h3');
                if(h3){
                    span = document.createElement('span');
                    span.classList.add('tyt-grupy');
                    h3.textContent = '';
                    h3.appendChild(span);
                }
            }
            if(span){
                span.textContent = `Kategoria ${licznik}`;
                licznik++;
            }
        }

    });
}

//****************************************************addDragDropListener********************************************************//

function addDragDropListener(grupa) {
    grupa.addEventListener('dragover', event => {
        if(!canEdit) return;
        event.preventDefault();

        let placeholder = grupa.querySelector('.placeholder');
        if (!placeholder) {
            placeholder = document.createElement('div');
            placeholder.classList.add('placeholder');
            grupa.appendChild(placeholder);
        }

        const afterElement = getDragAfterElement(grupa, event.clientY);
        if(afterElement == null) {
            grupa.appendChild(placeholder);
        } else{
            grupa.insertBefore(placeholder, afterElement);
        }
    });

    grupa.addEventListener('dragleave', event => {
        if(!canEdit) return;
        const related = event.relatedTarget;
        if(!grupa.contains(related)){
            grupa.querySelectorAll('.placeholder').forEach(p => p.remove());
        }
    })

    grupa.addEventListener('drop', event => {
        if(!canEdit) return;
        event.preventDefault();
        const zawodnik = aktualniePrzeciągany;
        if(!zawodnik) return
        const placeholder = grupa.querySelector('.placeholder');

        if(placeholder) {
            placeholder.replaceWith(zawodnik);
        } else{
            grupa.appendChild(zawodnik);
        }

        zawodnik.classList.remove('dragging');

        if(grupa.classList.contains('nowa')) {
            grupa.classList.remove('nowa');
            const closeBtn = grupa.querySelector('button.close');
            if(closeBtn) closeBtn.remove();
        }

        odswiezNumeracje();

        if(grupa.classList.contains('bez-kategorii')) {
            const zawodnicy = grupa.querySelectorAll('.zawodnik');
            if(zawodnicy.length === 0) {
                grupa.remove();
            }
        }
    });
}


//****************************************************utworzPlus********************************************************//

function utworzPlus() {
    const plus = document.createElement('div');
    plus.classList.add('plus');
    plus.textContent = "➕ Dodaj kategorię";
    plus.addEventListener('click', () => {
        dodajNowaKategorie(plus);
    });
    return plus;
}

//****************************************************dodajNowaKategorie********************************************************//

function dodajNowaKategorie(plusKlikniety) {
    const divGrupy = document.getElementById('grupy');

    const nowaGrupa = document.createElement('div');
    nowaGrupa.classList.add('grupa', 'nowa');

    const h3 = document.createElement('h3');
    h3.style.position = "relative";

    const span = document.createElement('span');
    span.classList.add('tyt-grupy');
    span.textContent = 'Nowa kategoria';
    h3.appendChild(span);

    const closeBtn = document.createElement('button');
    closeBtn.classList.add('close');
    closeBtn.textContent = "❌";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "0";
    closeBtn.style.right = "0";
    closeBtn.style.background = "none";
    closeBtn.style.border = "none";
    closeBtn.style.color = "var(--highlight)";
    closeBtn.style.fontSize = "18px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.padding = "2px 5px";

    h3.appendChild(closeBtn);
    nowaGrupa.appendChild(h3);

    addDragDropListener(nowaGrupa);
    divGrupy.insertBefore(nowaGrupa, plusKlikniety.nextSibling);

    const nowyPlus = utworzPlus();
    divGrupy.insertBefore(nowyPlus, nowaGrupa.nextSibling);

    odswiezNumeracje();

    closeBtn.addEventListener('click', () =>{
        const nextPlus = nowaGrupa.nextElementSibling;
        if(nextPlus && nextPlus.classList.contains('plus')){
            nextPlus.remove();
        }
        nowaGrupa.remove();
        odswiezNumeracje();
    });
}

//****************************************************dodajPlusy********************************************************//

function dodajPlusy() {
    const divGrupy = document.getElementById('grupy');
    const grupy = Array.from(divGrupy.querySelectorAll('.grupa'));

    divGrupy.innerHTML = "";

    divGrupy.appendChild(utworzPlus());

    grupy.forEach(grupa => {
        divGrupy.appendChild(grupa);
        divGrupy.appendChild(utworzPlus());
    });
}

const staraWyswietlGrupy = wyswietlGrupy;
wyswietlGrupy = function(listaGrup) {
    staraWyswietlGrupy(listaGrup);
    dodajPlusy();
};

document.getElementById('zapisz').addEventListener('click', async () => {
    const grupyDiv = document.getElementById('grupy');
    const grupy = Array.from(grupyDiv.querySelectorAll('.grupa'));

    const daneDoWyslania = grupy
        .filter(g => !g.classList.contains('plus'))
        .map((grupa, index) => {
            const zawodnicy = Array.from(grupa.querySelectorAll('.zawodnik')).map(z => z.dataset.id);
            return {
                kategoria: index + 1,
                zawodnicy: zawodnicy
            };
        })
        .filter(k => k.zawodnicy.length > 0);

    if(daneDoWyslania.length === 0) {
        alert("Brak zawodników do zapisania!");
        return;
    }
    try {
        const response = await fetch(`${backendURL}/saveCategories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                categories: daneDoWyslania,
                token: token
            })
        });

        if(response.ok) {
            alert("Grupy zostały zapisane w bazie!");
            // window.location.reload();
        }else{
            alert("Błąd podczas zapisywania grup.");
        }
    } catch (err) {
        console.error(err);
        alert("Nie udało się połączyć z serwerem.")
    }
});

//****************************************************wyswietlZawodnikowBezKategorii********************************************************//

function wyswietlZawodnikowBezKategorii(bezKat) {
    if(bezKat.length === 0) return;

    const divBezKat = document.querySelector('div.bez-kategorii');

    const h3 = document.createElement('h3');
    h3.textContent = 'Zawodnicy bez kategorii';
    divBezKat.appendChild(h3);

    bezKat.forEach(zawodnik => {
        const zawodnikDiv = document.createElement('div');
        zawodnikDiv.classList.add('zawodnik');
        zawodnikDiv.draggable = true;
        zawodnikDiv.dataset.id = zawodnik.id;
        zawodnikDiv.textContent = `${zawodnik.name} ${zawodnik.surname}, 
            ${zawodnik.age} lat, 
            ${Math.round(zawodnik.weight * 10) / 10} kg, 
            poziom ${zawodnik.level + 1}, ${zawodnik.location}
            `;

        zawodnikDiv.addEventListener('dragstart', event => {
            aktualniePrzeciągany = zawodnikDiv;
            zawodnikDiv.classList.add('dragging');
        });

        zawodnikDiv.addEventListener('dragend', event => {
            zawodnikDiv.classList.remove('dragging');
            aktualniePrzeciągany = null;
            sprawdzBezKategorii();
        });

        divBezKat.appendChild(zawodnikDiv);
    });

    addDragDropListener(divBezKat);
}

//****************************************************sprawdzBezKategorii********************************************************//

function sprawdzBezKategorii() {
    const bezKat = document.querySelector('.bez-kategorii');
    if(bezKat) {
        const zawodnicy = bezKat.querySelectorAll('.zawodnik');
        if(zawodnicy.length === 0) {
            bezKat.remove();
        }
    }
}

podzialNaGrupy();
sprawdzBezKategorii()