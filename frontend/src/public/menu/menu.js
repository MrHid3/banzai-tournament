const rolesAccess = {
    "admin": ["dodawanie", "test"],
    "adder": ["dodawanie"],
    "referee": []
}

const role = localStorage.getItem("role");

rolesAccess[role].forEach((role) => {
    document.querySelector(`#${role}`).style.display = "block";
})