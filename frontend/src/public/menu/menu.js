const rolesAccess = {
    "test": ["adding", "categories", "mainTable", "smallTable", "chooseTable", "results", "config", "test"],
    "adder": ["adding"],
    "bigReferee": ["mainTable"],
    "referee": ["chooseTable"],
    "admin": ["categories", "results", "config"],
}

const role = localStorage.getItem("role");
if(rolesAccess[role].length === 1)
    document.querySelectorAll(".menu-item").forEach((item) => {
        item.style.borderRadius = "10px 10px 10px 10px";
    })
else{
    document.querySelector(`#${rolesAccess[role][0]}`).style.borderRadius = "5px 5px 0 0";
    document.querySelector(`#${rolesAccess[role][rolesAccess[role].length - 1]}`).style.borderRadius = "0 0 5px 5px";
}

rolesAccess[role].forEach((role) => {
    try{
        document.querySelector(`#${role}`).style.display = "block";
    }catch{}
})