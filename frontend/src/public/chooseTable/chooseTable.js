//todo: pull ts from server
const numberOfTables = 6;
const tableContainer = document.querySelector("#tableButtonsContainer");

for(let i = 1; i <= numberOfTables; i++) {
    const tableButton = document.createElement("a");
    tableButton.classList.add("tableButton");
    tableButton.href = "/stolikMaly"
    tableContainer.appendChild(tableButton);
}