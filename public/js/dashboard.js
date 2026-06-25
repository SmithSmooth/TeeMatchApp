const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "/index.html";
}

document.getElementById("logout-btn").addEventListener("click",logout);

const homeButton = document.getElementById("nav-home");

homeButton.addEventListener("click", () => {
    window.location.href = ""//"http://127.0.0.1:5500/src/dashboard.html"
});

const createRoundButton = document.getElementById("nav-create");
const createRoundButton2 = document.getElementById("create-round-btn");

createRoundButton.addEventListener("click", () => {
    window.location.href = "/public/src/createround.html"//"http://127.0.0.1:5500/src/createround.html"
});
createRoundButton2.addEventListener("click", () => {
    window.location.href = "/public/src/createround.html"//"http://127.0.0.1:5500/src/createround.html"
});

const myroundsButton= document.getElementById("nav-rounds");
const myroundsButton2= document.getElementById("my-rounds-btn");

myroundsButton.addEventListener("click", () => {
    window.location.href = "http://127.0.0.1:5500/src/myrounds.html"
});
myroundsButton2.addEventListener("click", () => {
    window.location.href = "http://127.0.0.1:5500/src/myrounds.html"
});

const browserRoundsButton=document.getElementById("browse-rounds-btn")
const browserRoundsButton2=document.getElementById("nav-browse")
browserRoundsButton.addEventListener("click",()=>{
    window.location.href = "http://127.0.0.1:5500/src/browserounds.html"
})
browserRoundsButton2.addEventListener("click",()=>{
    window.location.href = "http://127.0.0.1:5500/src/browserounds.html"
})

const requestPageBtn=document.getElementById("requests-btn")
requestPageBtn.addEventListener("click",()=>{
    window.location.href = "http://127.0.0.1:5500/src/requests.html"
})


const userName = document.getElementById("user-name");
const saveButton = document.getElementById("save-profile-btn");

const phoneNumber = document.getElementById("phone-number")
const instagramHandle = document.getElementById("instagram-handle")
const postcode = document.getElementById("postcode")
const homeCourse = document.getElementById("home-course")
const handicap = document.getElementById("handicap")
const skillLevel = document.getElementById("skill-level")
const availability = document.getElementById("availability")
const bio = document.getElementById("bio")

saveButton.addEventListener("click", saveProfile);


async function loadDashboardData() {
    try {
        const response = await fetch("http://localhost:3000/dashboard", { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) {
            throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        console.log("Dashboard data:", data);

        userName.textContent = data.full_name;

        phoneNumber.value = data.phone_number || "";
        instagramHandle.value = data.instagram_handle || "";
        postcode.value = data.postcode || "";
        homeCourse.value = data.home_course || "";
        handicap.value = data.handicap || "";
        skillLevel.value = data.skill_level || "";
        availability.value = data.availability || "";
        bio.value = data.bio || "";


    } catch (error) {
        console.error("Error loading dashboard data:", error);
    }
}


function logout() {
    localStorage.removeItem("token");
    window.location.href = "/public/index.html";
}

async function saveProfile() {
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const validationResult =validateProfile();
        if(!validationResult.valid){
            showMessage(validationResult.message,"error");
            saveButton.disabled = false;
            saveButton.textContent = "Save Profile";
            return;
        }

        const handicapValue =handicap.value === ""? null: parseFloat(handicap.value);
        const cleanPhone =phoneNumber.value.trim() || null;
        const cleanInstagram =instagramHandle.value.trim() || null;
        const cleanPostcode =postcode.value.trim() || null;
        const cleanCourse =homeCourse.value.trim() || null;
        const cleanSkill =skillLevel.value.trim() || null;
        const cleanAvailability =availability.value.trim() || null;
        const cleanBio =bio.value.trim() || null;


        const response = await fetch("http://localhost:3000/profile", {
            method: "PUT",
            headers: {
                "Content-Type":"application/json",
                Authorization:`Bearer ${token}`
            },

            body: JSON.stringify({
                phoneNumber: cleanPhone,
                instagramHandle: cleanInstagram,
                postcode: cleanPostcode,
                homeCourse: cleanCourse,
                handicap: handicapValue,
                skillLevel: cleanSkill,
                availability: cleanAvailability,
                bio: cleanBio
            })
        });


        const data = await response.json();
        //console.log("Profile update response:", data);


        if (data.success) {
            saveButton.disabled = false;
            saveButton.textContent = "Save Profile";
            showMessage(data.message, "success");
        }else {
            saveButton.disabled = false;
            saveButton.textContent = "Save Profile";
            showMessage(data.message || "Error saving profile", "error");
        }


    } catch (error) {
        console.error("Error saving profile:", error);
        showMessage(error.message || "Error saving profile", "error");
        saveButton.disabled = false;
        saveButton.textContent = "Save Profile";
    }
}


function validateProfile(){

    const phoneNumber1 =document.getElementById("phone-number").value.trim();
    const postcode1 =document.getElementById("postcode").value.trim();
    const handicap1 =document.getElementById("handicap").value.trim();
    const bio1= document.getElementById("bio").value.trim();
    const instagramHandle1 =document.getElementById("instagram-handle").value.trim();

    //ig handle
    if(instagramHandle1.length > 30){
        return {
            valid:false,
            message: "Instagram handle too long."
    
        };
    
    }
    // bio
    if(bio1.length > 300){
        return {
            valid:false,
            message:"Bio cannot exceed 300 characters."
    
        };
    
    }

    // Phone Number
    if(phoneNumber1 !== ""){
        const phoneRegex =/^[0-9+\s()-]{10,15}$/;

        if(!phoneRegex.test(phoneNumber1)){

            return {
                valid:false,
                message:"Please enter a valid phone number."}
        }
    }

    // Postcode

    if(postcode1 !== ""){
        const postcodeRegex =/^[A-Za-z]{1,2}[0-9][A-Za-z0-9]?\s?[0-9][A-Za-z]{2}$/;
        if(!postcodeRegex.test(postcode1)){

            return {
                valid:false,
                message:"Please enter a valid UK postcode."
            }}

    }

    // Handicap

    if(handicap1 !== ""){
        const handicapValue =parseFloat(handicap1);
        //+10 handicap is the least handicap we could go on to
        if(isNaN(handicapValue) || handicapValue < -10 || handicapValue > 54){
            return {
                valid:false,
                message:"Handicap must be between -10 and 54."

            }}
    }

    return {valid:true};

}


function showMessage(message,type){

    const messageBox =document.getElementById("profile-message");
    messageBox.textContent =message;

    messageBox.classList.remove("profile-error","profile-success");

    if(type === "error"){
        messageBox.classList.add(
            "profile-error"
        );

    }
    else{
        messageBox.classList.add(
            "profile-success"
        );

    }

}

loadDashboardData();