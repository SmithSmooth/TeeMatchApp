const token = localStorage.getItem("token");
const requestsContainer = document.getElementById("requests-container");
const profileModal = document.getElementById("profile-modal");

const closeModal = document.getElementById("close-modal");

let requests = [];

document.addEventListener("DOMContentLoaded", loadRequests);

closeModal.addEventListener("click",() => {profileModal.style.display = "none";});

window.addEventListener("click", (event) => {
    if (event.target === profileModal) {
         profileModal.style.display = "none";
    }
    }
);

async function loadRequests() {
    try {
        const response = await fetch("/requests",
            {
                headers: {Authorization: `Bearer ${token}`}
            }
        );

        const data = await response.json();
        if (!data.success) {
            
            throw new Error(
                data.message
            );

        }

        requests = data.requests;
        console.log(requests)

        displayRequests();

    }
    catch (error) {
        console.error("Load Requests Error:", error);
        requestsContainer.innerHTML =
            `<div class="empty-state">
            Failed to load requests.
        </div>
        `;

    }

}

function displayRequests() {

    requestsContainer.innerHTML = "";
    
    requests.forEach(request => {

        const requestCard = `<div class="request-card">
            <h3> ${request.full_name} </h3>

            <div class="request-info">
                <p>
                    <strong>Course:</strong>
                    ${request.course_name}
                </p>
                <p>
                    <strong>Handicap:</strong>
                    ${request.handicap || "N/A"}
                </p>

                <p>
                    <strong>Skill:</strong>
                    ${request.skill_level || "N/A"}
                </p>

                <p>
                    <strong>Requested:</strong>

                    ${timeAgo(request.created_at)}

                </p>

            </div>

            <div class="request-actions">

                <button  class="profile-btn" onclick="viewProfile('${request.request_id}')">
                    View Profile
                </button>

                <button class="accept-btn" onclick="acceptRequest('${request.request_id}')">
                    Accept
                </button>

                <button class="reject-btn" onclick="rejectRequest('${request.request_id}')">
                    Reject
                </button>

            </div>

        </div>
        `;

        requestsContainer.insertAdjacentHTML(

            "beforeend",

            requestCard

        );

    });

}

function viewProfile(requestId) {

    const request = requests.find(

        request =>

            request.request_id === requestId

    );

    if (!request) {

        return;

    }

    document.getElementById(
        "modal-name"
    ).textContent =
        request.full_name;

    document.getElementById(
        "modal-handicap"
    ).textContent =
        request.handicap || "N/A";

    document.getElementById(
        "modal-skill"
    ).textContent =
        request.skill_level || "N/A";

    document.getElementById(
        "modal-bio"
    ).textContent =
        request.bio || "No bio provided.";

    profileModal.style.display =
        "flex";

}

function timeAgo(dateString){

    const seconds =Math.floor((Date.now() - new Date(dateString)) / 1000);
    const hours =Math.floor(seconds / 3600);
    const days =Math.floor(hours / 24);

    if(days > 0){return `${days} day(s) ago`;}

    if(hours > 0){ return `${hours} hour(s) ago`;}

    return "Just now";

}

async function acceptRequest(requestId) {

    try {

        const response = await fetch(

            `/requests/${requestId}/accept`,

            {
                method: "PUT",
                headers: {Authorization: `Bearer ${token}`

                }
            }
        );

        const data =await response.json();

        if (data.success) {
            loadRequests();
        }

    }
    catch (error) {

        console.error(error);

    }

}

async function rejectRequest(requestId) {

    try {

        const response = await fetch(

            `/requests/${requestId}/reject`,

            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`
                }

            }

        );

        const data = await response.json();

        if (data.success) {
            loadRequests();
        }
    }
    catch (error) {
        console.error(error);
    }
}