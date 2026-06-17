const token = localStorage.getItem("token");
document.addEventListener("DOMContentLoaded", loadRounds);

let activeTab = "created";
let createdRounds = [];
let joinedRounds = [];
let historyRounds = [];
let currentRoundId = null;
//let allRounds = [];

document.querySelectorAll(".tab-button").forEach(button => {
    button.addEventListener("click", () => {

        document.querySelectorAll(".tab-button").forEach(btn =>
            btn.classList.remove("active-tab"));

        button.classList.add("active-tab");
        activeTab =button.dataset.tab;
        renderCurrentTab();
    }

    );

});

function renderCurrentTab(){

    switch(activeTab){

        case "created":
            displayRounds(createdRounds,true);
            break;

        case "joined":
            displayRounds(joinedRounds,false);
            break;

        case "history":
            displayRounds(historyRounds,false);

            break;

    }

}

async function loadRounds() {
    try {

        const response = await fetch("http://localhost:3000/my-rounds",
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            });

        const data=await response.json()

        createdRounds =data.created;
        joinedRounds =data.joined;
        historyRounds =data.history;

        renderCurrentTab();
    } catch (error) {
        console.error(error);
    }

}

function displayRounds(rounds,allowEditing) {
    const container = document.getElementById("rounds-container");
    container.innerHTML = "";

    if(rounds.length === 0){

        container.innerHTML =
    
        `
        <div class="round-card">
            <p>
                No rounds found.
            </p>
        </div>
        `;
    
        return;
    
    }

    rounds.forEach(round => {
        let buttons="";
        if(allowEditing){
            buttons=`
            <div class="card-buttons">
                <button class="edit-btn" onclick="editRound('${round.id}')">Edit</button>
    
                <button class="delete-btn"  onclick="deleteRound('${round.id}')"> Delete </button>
            </div>
            `;
    
        }

        container.innerHTML +=
            `
        <div class="round-card">

            <h4>${round.course_name}</h4>
            <p>Round Date: ${formatPgDate(round.round_date)}</p>
            <p>Tee Time: ${round.tee_time}</p>

            ${buttons}
        </div>
        `;

    })

}

async function deleteRound(roundId) {

    const confirmed = confirm("Delete this round?");

    if (!confirmed) {
        return;
    }
    try {
        const response = await fetch(`http://localhost:3000/rounds/${roundId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            });

        const data = await response.json();
        alert(data.message);
        loadRounds();

    }
    catch (error) {
        console.error(error);
    }

}

// Function to safely format PostgreSQL ISO date strings
function formatPgDate(pgDateString) {
    try {
        if (typeof pgDateString !== "string") {
            throw new Error("Input must be a string");
        }

        const date = new Date(pgDateString);

        // Check for invalid dates
        if (isNaN(date.getTime())) {
            throw new Error("Invalid date format");
        }

        // Create readable output: dd-mm-yyyy hh:mm
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Months start at 0
        const year = date.getFullYear();

        //const hours = String(date.getHours()).padStart(2, "0");
        //const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${day}-${month}-${year} `//${hours}:${minutes}`;
    } catch (err) {
        console.error("Date formatting error:", err.message);
        return null;
    }
}

function editRound(id) {
    
    const round = createdRounds.find(r => r.id === id);
    currentRoundId = id;


    let d = new Date(round.round_date)
    let datestring = d.getFullYear().toString().padStart(4, '0') + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0');

    document.getElementById("edit-course").value = round.course_name;
    document.getElementById("edit-date").value = datestring;
    document.getElementById("edit-time").value = round.tee_time;
    document.getElementById("edit-players").value = round.players_needed;
    document.getElementById("edit-notes").value = round.notes || "";
    document.getElementById("edit-modal").style.display = "flex";

}

document.getElementById("save-round-btn").addEventListener("click", saveRoundChanges);

async function saveRoundChanges() {
    const confirmed = confirm("Edit this round?");

    if (!confirmed) {
        return;
    }

    const validation=validateRoundData(
         document.getElementById("edit-course").value,
         document.getElementById("edit-date").value,
         document.getElementById("edit-time").value,
         document.getElementById("edit-players").value,
        document.getElementById("edit-notes").value
    )

    if(!validation.valid){
        alert(validation.message)
        return
    }

    try {
        const response = await fetch(`http://localhost:3000/rounds/${currentRoundId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type":"application/json",
                    Authorization:`Bearer ${token}`
                }, body: JSON.stringify({
                    courseName: document.getElementById("edit-course").value,
                    roundDate: document.getElementById("edit-date").value,
                    teeTime: document.getElementById("edit-time").value,
                    playersNeeded: document.getElementById("edit-players").value,
                    notes: document.getElementById("edit-notes").value
                })
            });

        const data = await response.json();

        alert(data.message);

        document.getElementById("edit-modal").style.display = "none";
        loadRounds();
    }
    catch (error) {
        console.error(error);
    }
}




document.getElementById("cancel-edit-btn").addEventListener("click", () => {
    document.getElementById("edit-modal").style.display = "none";
});


function validateRoundData(courseName,roundDate,teeTime,playersNeeded){
    if(!courseName.trim()){
        return{
            valid:false,
            message:"Please enter a course name."
        };
    }
    if(courseName.length > 150){
        return{
            valid:false,
            message:"Course name is too long."
        };
    }
    if(!roundDate){
        return{
            valid:false,
            message:"Please select a date."
        };
    }
    if(!teeTime){
        return{
            valid:false,
            message:"Please select a tee time."
        };
    }

    const playerCount =parseInt(playersNeeded);
    if(isNaN(playerCount)||playerCount < 1 || playerCount > 3){
        return{
            valid:false,
            message:"Players needed must be between 1 and 3."
        };
    }

    const today =new Date();
    today.setHours( 0,0,0,0);

    const selectedDate =new Date(roundDate);

    if(selectedDate < today){
        return{
            valid:false,
            message:"Date cannot be in the past."
        };
    }

    const hour =parseInt( teeTime.split(":")[0]);

    if(hour < 6 || hour >= 18){
        return{
            valid:false,
            message:"Tee time must be between 06:00 and 18:00."
        };
    }
    return{valid:true};
}