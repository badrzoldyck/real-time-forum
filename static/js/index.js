import {loginPage, loginHundler } from './functions/login.js'
import { clientPage, loadPosts } from './functions/client.js'
import {connect} from './functions/wb.js'

document.addEventListener("DOMContentLoaded", async () =>{
    const response = await fetch("/check-session")
    const reJson = await response.json()
    
    if (!reJson.loggedIn){
        loginPage()
        loginHundler()
    }else {
        connect(reJson.username)
        clientPage()
        loadPosts()
    }
})



document.getElementById("logoutButton").addEventListener("click",async () =>{
    const response = await fetch("/logout")
    if (!response.ok){
        const Json = await response.json();
        alert(Json.message);
        
    }else{
        document.getElementById("container1").innerHTML = ""
        loginPage()
        loginHundler()
    }
})






