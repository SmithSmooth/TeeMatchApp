const token = localStorage.getItem("token");
document.addEventListener("DOMContentLoaded", loadRounds);

let activeTab = "created";
let createdRounds = [];
let joinedRounds = [];
let historyRounds = [];
let currentRoundId = null;
//let allRounds = [];
let showErrorMessageP=document.getElementById("showErrorMessage")

function showMessage(message,status){
    showErrorMessageP.textContent="";
    //showErrorMessageP.style="visibility: none;"
    if(status){
        showErrorMessageP.textContent=message
        showErrorMessageP.style="color :green;"
        return;
    }
    if(!status){
        showErrorMessageP.textContent=message
        showErrorMessageP.style="color :red;"
        return
    }

}



document.querySelectorAll(".tab-button").forEach(button => {
    button.addEventListener("click", () => {

        document.querySelectorAll(".tab-button").forEach(btn =>
            btn.classList.remove("active-tab"));

        button.classList.add("active-tab");
        activeTab = button.dataset.tab;
        renderCurrentTab();
    }

    );

});

function renderCurrentTab() {

    switch (activeTab) {

        case "created":
            displayCreatedRounds(createdRounds, true);
            break;

        case "joined":
            displayJoinedRounds(joinedRounds);
            break;

        case "history":
            displayRounds(historyRounds, false);
            break;

    }

}

async function loadRounds() {
    try {

        const response = await fetch("/my-rounds",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

        const data = await response.json()

        createdRounds = data.created;
        joinedRounds = data.joined;

        historyRounds = data.history;
        //console.log(createdRounds)


        renderCurrentTab();
    } catch (error) {
        console.error(error);
    }

}

function displayCreatedRounds(rounds, allowEditing) {
    const container = document.getElementById("rounds-container");
    container.innerHTML = "";

    if (rounds.length === 0) {

        container.innerHTML =`
        <div class="round-card">
            <p>
                No rounds found.
            </p>
        </div>
        `;

        return;

    }

    rounds.forEach(round => {
        let buttons = "";
        const joined = parseInt(round.joined_count);
        const pending = parseInt(round.pending_count);
        const spotsLeft = round.players_needed - joined - pending;

        if (allowEditing) {
            buttons = `
            <div class="card-buttons">
                <button class="edit-btn" onclick="editRound('${round.id}')">Edit</button>
    
                <button class="delete-btn"  onclick="deleteRound('${round.id}')"> Delete </button>
            </div>
            `;

        }

        container.innerHTML += `<div class="round-card">

            <h4>${round.course_name}</h4>
            <p><strong>Round Date:</strong> ${formatPgDate(round.round_date)}</p>
            <p><Strong>Tee Time:</strong> ${round.tee_time}</p>

            <div class="round-stats">
                <div class="stat-box">
                    <span class="stat-number">${spotsLeft}</span>
                    <span>Spots Left</span>

                </div>

            <div class="stat-box">
                <span class="stat-number">${joined}</span>
                <span>Joined</span>

            </div>

            <div class="stat-box">
                <span class="stat-number">${pending}</span>
                <span>Pending</span>

            </div>

        </div>
            ${buttons}
        </div>
        `;

    })

}


function displayRounds(rounds, allowEditing) {
    const container = document.getElementById("rounds-container");
    container.innerHTML = "";

    if (rounds.length === 0) {
        container.innerHTML = `
        <div class="round-card">
            <p>
                No rounds found.
            </p>
        </div>
        `;

        return;

    }

    rounds.forEach(round => {
        let buttons = "";
        if (allowEditing) {
            buttons = `
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
            <p><strong>Round Date:</strong> ${formatPgDate(round.round_date)}</p>
            <p><Strong>Tee Time:</strong> ${round.tee_time}</p>

            ${buttons}
        </div>
        `;

    })

}
function displayJoinedRounds(rounds) {
    const container = document.getElementById("rounds-container");
    container.innerHTML = "";


    if (rounds.length === 0) {
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
        let details = "";

        if (round.status === "accepted") {
            details = `
            <div class="card-buttons">
                <div class="hostDetailsJoinedTab">
                <h4>Host Details</h4>
                     <p><em>Host: </em>${round.creator_name} </p>
                     <p><em>Contact: </em> ${round.phone_number} </p>
                     <p><em>IG Handle: </em> ${round.instagram_handle} </p>
                </div>
    
                <button class="delete-btn"  onclick="leaveRound('${round.round_id}','${"Leave Round ?? "}')"> Leave Round </button>
            </div>
            `;
        } else if (round.status === "rejected") {
            details = `
            <div class="card-buttons">
                <button class="delete-btn"  onclick="leaveRound('${round.round_id}','${"Remove Round ?? "}')"> Remove </button>
            </div>
            `;
        } else if (round.status === "pending") {
            details = `
            <div class="card-buttons">
                <button class="delete-btn"  onclick="leaveRound('${round.round_id}','${"Cancel Request ?? "}')"> Cancel Request</button>
            </div>
            `;
        }

        container.innerHTML += `<div class="round-card">

            <h4><u>${round.course_name}</u></h4>
            <p><strong>Status: </strong>${round.status.charAt(0).toUpperCase() + round.status.slice(1)}</p>
            <p><strong>Round Date:</strong> ${formatPgDate(round.round_date)}</p>
            <p><Strong>Tee Time:</strong> ${round.tee_time}</p>

            ${details}
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
        const response = await fetch(`/rounds/${roundId}`,
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

async function leaveRound(roundId, mm) {

    const confirmed = confirm(mm);

    if (!confirmed) {
        return;
    }
    try {
        const response = await fetch(`/rounds/${roundId}/leave-round`,
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

    showErrorMessageP.textContent=""


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

    const validation = validateRoundData(
        document.getElementById("edit-course").value,
        document.getElementById("edit-date").value,
        document.getElementById("edit-time").value,
        document.getElementById("edit-players").value,
        document.getElementById("edit-notes").value
    )

    if (!validation.valid) {
        showMessage(validation.message,false)
        return
    }
    

    try {
        const response = await fetch(`/rounds/${currentRoundId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }, body: JSON.stringify({
                    courseName: document.getElementById("edit-course").value,
                    roundDate: document.getElementById("edit-date").value,
                    teeTime: document.getElementById("edit-time").value,
                    playersNeeded: document.getElementById("edit-players").value,
                    notes: document.getElementById("edit-notes").value
                })
            });

        const data = await response.json();

        if(!data.success){
            showMessage(data.message,false)
            return
        }else{
            showMessage(data.message,true)
            
        }

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


function validateRoundData(bio,courseName, roundDate, teeTime, playersNeeded) {
    if (!courseName.trim()) {
        return {
            valid: false,
            message: "Please enter a course name."
        };
    }
    if(bio.length > 300){
        return{
            valid:false,
            message:"Bio cannot exceed 300 characters."
        }
    }
    if (courseName.length > 150) {
        return {
            valid: false,
            message: "Course name is too long."
        };
    }
    if (!roundDate) {
        return {
            valid: false,
            message: "Please select a date."
        };
    }
    if (!teeTime) {
        return {
            valid: false,
            message: "Please select a tee time."
        };
    }

    const playerCount = parseInt(playersNeeded);
    if (isNaN(playerCount) || playerCount < 1 || playerCount > 3) {
        return {
            valid: false,
            message: "Players needed must be between 1 and 3."
        };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(roundDate);

    if (selectedDate < today) {
        return {
            valid: false,
            message: "Date cannot be in the past."
        };
    }

    const hour = parseInt(teeTime.split(":")[0]);

    if (hour < 6 || hour >= 18) {
        return {
            valid: false,
            message: "Tee time must be between 06:00 and 18:00."
        };
    }
    return { valid: true };
}