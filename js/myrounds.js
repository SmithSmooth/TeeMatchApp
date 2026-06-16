const token =localStorage.getItem("token");
document.addEventListener("DOMContentLoaded",loadRounds);

let currentRoundId = null;
let allRounds = [];

async function loadRounds(){
    try{

        const response =await fetch("http://localhost:3000/my-rounds",
        { headers:{
            Authorization:
            `Bearer ${token}`
            }
        });
        
        allRounds =await response.json();
        displayRounds(allRounds);

    }catch(error){
        console.error(error);
    }

}

function displayRounds(rounds){
    const container =document.getElementById("created-rounds");
    container.innerHTML = "";

    rounds.forEach(round=>{

        container.innerHTML +=
        `
        <div class="round-card">

            <h4>${round.course_name}</h4>
            <p>Round Date: ${formatPgDate(round.round_date)}</p>
            <p>Tee Time: ${round.tee_time}</p>

            <div class="card-buttons">
                <button class="edit-btn" onclick="editRound('${round.id}')"> Edit </button>
                <button class="delete-btn" onclick="deleteRound('${round.id}')"> Delete </button>
            </div>
        </div>
        `;

    })

}

async function deleteRound(roundId){

    const confirmed =confirm("Delete this round?");

    if(!confirmed){
        return;
    }
    try{
        const response =await fetch(`http://localhost:3000/rounds/${roundId}`,
        {
            method:"DELETE",
            headers:{
                Authorization:
                `Bearer ${token}`
            }
        });

        const data =await response.json();
        alert(data.message);
        loadRounds();

    }
    catch(error){
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

function editRound(id){

    const round =allRounds.find(r => r.id === id);
    currentRoundId = id;
    
    let d=new Date(round.round_date)
    let datestring = d.getFullYear().toString().padStart(4, '0') + '-' + (d.getMonth()+1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0');

    document.getElementById("edit-course").value =round.course_name;
    document.getElementById("edit-date").value =datestring;
    document.getElementById("edit-time").value =round.tee_time;
    document.getElementById("edit-players").value =round.players_needed;
    document.getElementById( "edit-notes").value =round.notes || "";
    document.getElementById( "edit-modal").style.display ="flex";

}

document.getElementById("save-round-btn").addEventListener("click",saveRoundChanges);

async function saveRoundChanges(){

    try{
        const response =await fetch(`http://localhost:3000/rounds/${currentRoundId}`,
        {
            method:"PUT",
            headers:{
                "Content-Type":
                "application/json",
                Authorization:
                `Bearer ${token}`
            },body:JSON.stringify({
                courseName:document.getElementById("edit-course").value,
                roundDate:document.getElementById("edit-date").value,
                teeTime:document.getElementById("edit-time").value,
                playersNeeded:document.getElementById("edit-players").value,
                notes:document.getElementById( "edit-notes").value
            })
        });

        const data =await response.json();

        alert(data.message);

        document.getElementById("edit-modal").style.display ="none";
        loadRounds();
    }
    catch(error){
        console.error(error);
    }
}

document.getElementById("cancel-edit-btn").addEventListener("click",()=>{
    document.getElementById("edit-modal").style.display ="none";
});