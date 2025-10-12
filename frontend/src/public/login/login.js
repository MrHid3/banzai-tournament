const loginForm = document.querySelector('#login-form')
const roleSelect = document.querySelector('#role-select')
const passwordInput = document.querySelector('#password-input')

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const response = await fetch(`${backendURL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            role: roleSelect.value,
            password: passwordInput.value,
        })
    })
    const consumed = await response.json()
    if(consumed.error == true) {
        let alertMessage;
        if (consumed.errorType == "InvalidCredentials")
            alertMessage = "Złe hasło"
        alert(alertMessage)
    }else{
        localStorage.setItem('token', consumed.token)
        localStorage.setItem('role', roleSelect.value)
        window.location = "/menu"
    }
})