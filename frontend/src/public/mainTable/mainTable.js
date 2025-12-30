async function getResource(resourceName, token=null) {
    try{
        const request = await fetch(resourceName + (token? `/?token=${token}` : ''));
        return await request.json();
    }catch(err){
        return null
    }
}

const locations = await getResource(`${backendURL}/resources/locations.json`);
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
        competitor.innerText = `${data.competitors[i].place} miejsce - ${data.competitors[i].name} ${data.competitors[i].surname} ${data.competitors[i].location? "- " + (locations.find(l => l.value = data.competitors[i].location).name) : ""}`;
        if(data.competitors[i].absent)
            competitor.classList.add("absent");
        competitorContainer.append(competitor);
    }
    container.appendChild(competitorContainer);
    const destroy = document.createElement("div");
    destroy.classList.add("delete");
    destroy.innerText = `X`;
    destroy.addEventListener("click", (e) => {
        container.classList.add("magic");
        setTimeout(() => {
            awardsDiv.removeChild(container)
        }, 200);
        socket.emit("delete", data.category)
    })
    container.appendChild(destroy);
    awardsDiv.append(container);
})

socket.on("call", (data) => {
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
        competitor.innerText = `${data.competitors[i].name} ${data.competitors[i].surname} ${data.competitors[i].location? "- " + (locations.find(l => l.value = data.competitors[i].location).name) : ""}`;
        competitorContainer.append(competitor);
    }
    container.appendChild(competitorContainer);
    const destroy = document.createElement("div");
    destroy.classList.add("delete");
    destroy.innerText = `X`;
    destroy.addEventListener("click", (e) => {
        // callDiv.removeChild(container)
        container.classList.add("magic");
        container.style.marginBottom = container.style.height;
        setTimeout(() => {
            callDiv.removeChild(container)
        }, 199);
    })
    container.appendChild(destroy);
    callDiv.append(container);
})

socket.emit("getOld");