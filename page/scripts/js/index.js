var loggedin = false

document.addEventListener('DOMContentLoaded', ()=>{
    if (JSON.parse(localStorage.getItem('dev'))) { loggedin = true }

    if (loggedin) {
        document.getElementById('order').style.display = ''
        document.getElementById('login').remove()
    } else {
        
    }
})