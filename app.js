var drop = document.getElementById("dropdownClick");

function dropdownMenu(){
    if (drop.className === "nav-tabs"){
        drop.className += " responsive";
    }
    else{
        drop.className = "nav-tabs";
    }
}