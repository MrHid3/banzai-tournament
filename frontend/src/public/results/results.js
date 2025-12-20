
const main = document.querySelector("#container");
const results = await (await fetch(`${backendURL}/getAllResults?token=${token}`)).json();
const locations = await (await fetch(`${backendURL}/resources/locations.json`)).json();
let categoryResults = {};

for(const r of results){
    if(categoryResults[r.category_id] != undefined)
        categoryResults[r.category_id] = [...categoryResults[r.category_id], r];
    else
        categoryResults[r.category_id] = [r];
}

for(const [c, competitors] of Object.entries(categoryResults)) {
    competitors.sort((a, b) => a.place - b.place);
    const container = document.createElement("div");
    container.classList.add("awardContainer");
    const p = document.createElement("p");
    p.innerText = `Kategoria ${c}`;
    container.appendChild(p);
    const competitorContainer = document.createElement("div");
    competitorContainer.classList.add("competitorContainer")
    for(let i = 0; i < competitors.length; i++){
        const competitor = document.createElement("p");
        competitor.classList.add("competitor");
        competitor.innerText = /*${competitors[i].place} miejsce - */ `${competitors[i].name} ${competitors[i].surname} ${competitors[i].is_name_duplicate? "- " + (locations.find(l => l.value = competitors[i].location).name) : ""}`;
        if(competitors[i].absent)
            competitor.classList.add("absent");
        competitorContainer.append(competitor);
    }
    container.appendChild(competitorContainer);
    main.append(container);
}