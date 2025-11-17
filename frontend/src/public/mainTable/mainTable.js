const awardsDiv = document.querySelector("#awards");
const callDiv = document.querySelector("#calls");

socket.on("award", (data) => {
    const container = document.createElement("div");
    container.classList.add("awardContainer");
    const p = document.createElement("p");
    p.innerText = `Kategoria ${data.category}`;
    container.appendChild(p);
    const competitorContainer = document.createElement("div");
    competitorContainer.classList.add("competitorContainer")
    for(let i = 0; i < data.competitors.length; i++){
        const competitor = document.createElement("p");
        competitor.classList.add("competitor");
        competitor.innerText = `${data.competitors[i].place} miejsce - ${data.competitors[i].name} ${data.competitors[i].surname} ${data.competitors[i].school? "- " + data.competitors[i].school : ""}`;
        competitorContainer.append(competitor);
    }
    container.appendChild(competitorContainer);
    const destroy = document.createElement("div");
    destroy.classList.add("delete");
    destroy.innerText = `X`;
    destroy.addEventListener("click", (e) => {
        awardsDiv.removeChild(container)
    })
    container.appendChild(destroy);
    awardsDiv.append(container);
})

socket.on("call", (data) => {
    console.log(data);
    const container = document.createElement("div");
    container.classList.add("callContainer");
    const p = document.createElement("p");
    p.innerText = `Mata ${data.matNumber}`;
    container.appendChild(p);
    const competitorContainer = document.createElement("div");
    competitorContainer.classList.add("competitorContainer")
    for(let i = 0; i < data.competitors.length; i++){
        const competitor = document.createElement("p");
        competitor.classList.add("competitor");
        competitor.innerText = `${data.competitors[i].name} ${data.competitors[i].surname} ${data.competitors[i].school? "- " + data.competitors[i].school : ""}`;
        competitorContainer.append(competitor);
    }
    container.appendChild(competitorContainer);
    const destroy = document.createElement("div");
    destroy.classList.add("delete");
    destroy.innerText = `X`;
    destroy.addEventListener("click", (e) => {
        callDiv.removeChild(container)
    })
    container.appendChild(destroy);
    callDiv.append(container);
})
