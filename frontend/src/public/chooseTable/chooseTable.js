const tableContainer = document.querySelector("#tableButtonsContainer");

for(let i = 1; i <= numberOfTables; i++) {
    const tableButton = document.createElement("a");
    tableButton.classList.add("tableButton");
    tableButton.href = "/stolikMaly";
    tableButton.textContent = i;
    tableButton.addEventListener("click", () => {
        localStorage.setItem("tableNumber", i);
    })
    tableContainer.appendChild(tableButton);
}