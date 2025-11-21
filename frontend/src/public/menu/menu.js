const rolesAccess = {
    "test": ["adding", "clock", "categories", "mainTable", "test", "smallTable", "chooseTable", "categoryResults", "config"],
    "adder": ["adding"],
    "bigReferee": ["mainTable"],
    "referee": ["chooseTable", "smallTable", "clock"],
    "admin": ["categories", "config", "categoryResults"],
}

const role = localStorage.getItem("role");

if(rolesAccess[role].length === 1){
    document.querySelectorAll(".menu-item").forEach((item) => {
        item.style.borderRadius = "10px 10px 10px 10px";
    })
}

rolesAccess[role].forEach((role) => {
    try{
        document.querySelector(`#${role}`).style.display = "block";
    }catch{}
})