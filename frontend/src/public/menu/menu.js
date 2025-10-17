const rolesAccess = {
    "admin": ["dodawanie", "zegar"],
    "adder": ["dodawanie"],
    "referee": ["zegar"]
}

const role = localStorage.getItem("role");

rolesAccess[role].forEach((role) => {
    document.querySelector(`#${role}`).style.display = "block";
})