const emailPattern =/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const loginToggleBtn =
    document.getElementById("login-toggle-btn");

const signupToggleBtn =
    document.getElementById("signup-toggle-btn");

const loginForm =
    document.getElementById("login-form");

const signupForm =
    document.getElementById("signup-form");

loginToggleBtn.addEventListener("click", () => {

    loginForm.classList.remove("hidden-form");
    signupForm.classList.add("hidden-form");

    loginToggleBtn.classList.add("active-toggle");
    signupToggleBtn.classList.remove("active-toggle");

});

signupToggleBtn.addEventListener("click", () => {

    signupForm.classList.remove("hidden-form");
    loginForm.classList.add("hidden-form");

    signupToggleBtn.classList.add("active-toggle");
    loginToggleBtn.classList.remove("active-toggle");

});

// LOGIN

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email =document.getElementById("login-email").value;
    const password =document.getElementById("login-password").value;
    const errorBox =document.getElementById("error-message-container");
    const errorText =document.getElementById("error-message-text");

        if(!emailPattern.test(email)){

            errorText.textContent = "Please enter a valid email address";
            errorBox.classList.remove("hidden-message");
            showError("Please enter a valid email" );
        
            return;
        }

    try {

        const response = await fetch(
            "http://localhost:3000/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await response.json();
        if (!response.ok) {
            errorText.textContent = data.message;
            errorBox.classList.remove("hidden-message");
            return;
        }

        localStorage.setItem("token", data.token);
        window.location.href = "http://127.0.0.1:5500/src/dashboard.html";


    } catch (error) {

        console.error(error);

    }

});

// SIGNUP

signupForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const name =document.getElementById("signup-name").value;
    const email =document.getElementById("signup-email").value;
    const password =document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const errorBox =document.getElementById("error-message-container");
    const errorText =document.getElementById("error-message-text");

    if(!emailPattern.test(email)){
        errorText.textContent ="Please enter a valid email address";
        errorBox.classList.remove("hidden-message");
        showError( "Please enter a valid email");
    
        return;
    }

    if (password !== confirmPassword) {

        errorText.textContent = "Passwords do not match";
        errorBox.classList.remove("hidden-message");
        showError("Passwords do not match");
        return;
    }

    if(password.length < 8){

        errorText.textContent ="Password must be at least 8 characters";
        errorBox.classList.remove("hidden-message");
        showError("Password must be at least 8 characters");
        return;
    }
    

    try {

        const response = await fetch(
            "http://localhost:3000/signup",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            }
        );

        const data = await response.json();
        
        
        if(data.success){
            localStorage.setItem("token", data.token);
            window.location.href = "http://127.0.0.1:5500/src/dashboard.html"
        }else if(!data.success){
            errorText.textContent = data.message;
            errorBox.classList.remove("hidden-message");
            return;
        }
        console.log(data);

    } catch (error) {

        console.error(error);

    }

});
