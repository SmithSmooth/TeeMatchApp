const token = localStorage.getItem("token");

let allRounds = [];

document.addEventListener("DOMContentLoaded", () => {
    loadRounds();

    setupSearch();

});

async function loadRounds() {
    try {

        const response = await fetch("/rounds",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const rounds = await response.json();
        allRounds = rounds;
        console.log(allRounds)

        displayRounds(allRounds);

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


function setupSearch() {
    const searchInput = document.getElementById("search-input");

    searchInput.addEventListener("input", () => {
        const searchValue = searchInput.value.toLowerCase().trim();
        const filteredRounds = allRounds.filter(round => round.course_name.toLowerCase().includes(searchValue));

        displayRounds(filteredRounds);

    });
}


function displayRounds(rounds) {
    const container = document.getElementById("rounds-container");
    container.innerHTML = "";

    rounds.forEach(round => {
        let requestButton = "";
        const acceptedCount =parseInt(round.accepted_count);
        const pendingCount =parseInt(round.pending_count);
        const spotsLeft =round.players_needed -acceptedCount -pendingCount;

        //console.log(("spotsleft: "+spotsLeft),("Players joined: "+ acceptedCount),("pending requests: "+pendingCount))

        if (!round.request_status) {
            requestButton = `<button class="request-btn" onclick="requestToJoin('${round.id}')"> Request To Join</button>`;

        } else if (round.request_status === "pending") {

            requestButton = `<button disabled class="req-pending-btn"> Request Pending </button>`;
        } else if (round.request_status === "accepted") {
            requestButton = `<button disabled class='req-joined-btn'> Joined Round</button>`;
        } else if (round.request_status === "rejected") {
            requestButton = `<button disabled class='req-rejected-btn'> Rejected</button>`;
        }

        container.innerHTML +=
            `<div class="round-card">
            <h3>${round.course_name}</h3>

            <div id="roundDetailsOnBrowser">
            <p><em>Spots Left: </em> ${spotsLeft}</p>
            </div>
            <p>Date: ${formatPgDate(round.round_date)} </p>
            <p>Tee Time: ${round.tee_time} </p>
            
            <p> Host: ${round.host_name}</p>
            <p> Handicap: ${round.handicap}</p>
            <p> Skill: ${round.skill_level}</p>

            

            <button class="view-host-btn" onclick="viewHost('${round.id}')"> View Host</button>
             ${requestButton}

        </div>`;

    });

}

function viewHost(roundId) {

    const round = allRounds.find(r => r.id === roundId);

    document.getElementById("host-name").textContent = round.host_name;
    document.getElementById("host-skill").textContent = `Skill: ${round.skill_level}`;
    document.getElementById("host-handicap").textContent = `Handicap: ${round.handicap}`;
    document.getElementById("host-bio").textContent = `Bio: ${round.bio}` || "No bio added.";
    document.getElementById("host-modal").style.display = "flex";


}

document.getElementById("close-modal-btn").addEventListener("click", () => {
    document.getElementById("host-modal").style.display = "none";
});

async function requestToJoin(roundId) {

    try {

        const response = await fetch("/requests", {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ roundId })

        }

        );

        const data =
            await response.json();

        alert(data.message);

        loadRounds();

    }
    catch (error) {

        console.error(error);

    }

}