async function fetchUserName(user){
    const response = await fetch(`/users?username=${user}`)
    const Json = await response.json()
    console.log(Json);
    
}



