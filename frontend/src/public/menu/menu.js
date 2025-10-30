const rolesAccess = {
    "admin": ["adding", "clock", "categories", "test"],
    "adder": ["adding"],
    "referee": ["clock"]
}

const role = localStorage.getItem("role");

if(rolesAccess[role].length === 1){
    document.querySelectorAll(".menu-item").forEach((item) => {
        item.style.borderRadius = "10px 10px 10px 10px";
    })
}

rolesAccess[role].forEach((role) => {
    document.querySelector(`#${role}`).style.display = "block";
})