const form = document.getElementById("create-round-form");
const createButton = document.getElementById("create-round-btn");
const token = localStorage.getItem("token");

function showMessage(message, type) {
    const box = document.getElementById("round-message");

    box.textContent = message;

    box.classList.remove(
        "round-error",
        "round-success"
    );

    box.classList.add(type === "error" ? "round-error" : "round-success");

}

function validateRound() {
    const course = document.getElementById("course-name").value.trim();
    const date = document.getElementById("round-date").value;
    const time = document.getElementById("tee-time").value;

    if (!course) {
        return {
            valid: false, message: "Please enter a golf course."
        };

    }
    if (!date) {
        return {
            valid: false, message: "Please select a date."

        };
    }

    if (!time) {
        return {
            valid: false, message: "Please select a tee time."
        };

    }
    // -------------------------
    // DATE VALIDATION
    // -------------------------

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(date);

    if (selectedDate < today) {
        return {
            valid: false,
            message: "You cannot create a round in the past."
        };
    }

    // -------------------------
    // TIME VALIDATION
    // -------------------------

    const hour = parseInt(time.split(":")[0]);

    if (hour < 6 || hour > 18) {
        return {
            valid: false,
            message: "Tee times must be between 06:00 and 18:59."
        };
    }

    const now = new Date();

    const isToday =selectedDate.toDateString() ===now.toDateString();

    if (isToday) {
        const currentHour = now.getHours();
        const selectedHour =parseInt(teeTime.split(":")[0]);
        if (selectedHour <= currentHour) {
            return {
                valid: false,
                message:"Please select a future tee time."
            };
        }
    }


    return {
        valid: true
    };

}

async function createRound(event) {
    event.preventDefault();

    const validation = validateRound();

    if (!validation.valid) {
        showMessage(
            validation.message,
            "error"
        );
        return;
    }

    createButton.disabled = true;

    createButton.textContent = "Creating Round...";

    try {

        const courseName = document.getElementById("course-name").value.trim();
        const roundDate = document.getElementById("round-date").value;
        const teeTime = document.getElementById("tee-time").value;
        const playersNeeded = document.getElementById("players-needed").value;
        const notes = document.getElementById("round-notes").value.trim();

        const response = await fetch("/rounds",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                    Authorization:
                        `Bearer ${token}`

                },

                body: JSON.stringify({
                    courseName,
                    roundDate,
                    teeTime,
                    playersNeeded,
                    notes
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            showMessage(data.message, "success");
            form.reset();
            window.location.href = "/src/dashboard.html"
        }
        else {
            showMessage(data.message, "error");
        }

    }
    catch (error) {

        console.error(error);

        showMessage("Error creating round.", "error"
        );
    }

    createButton.disabled = false;
    createButton.textContent = "Create Round";

}


form.addEventListener("submit", createRound);