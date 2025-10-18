const rolesAccess = {
    "admin": ["adding", "clock", "categories"],
    "adder": ["adding"],
    "referee": ["clock"]
}

const role = localStorage.getItem("role");

rolesAccess[role].forEach((role) => {
    document.querySelector(`#${role}`).style.display = "block";
})