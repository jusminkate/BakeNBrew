/* ==========================
   AUTH SYSTEM (FIXED)
========================== */

/* SIGNUP */
document.getElementById("signupBtn")?.addEventListener("click", async () => {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) return alert("Enter email and password");

    const { error } = await supabaseClient.auth.signUp({
        email,
        password
    });

    if (error) return alert(error.message);

    alert("Account created. Check your email for verification.");
});


/* LOGIN */
document.getElementById("loginBtn")?.addEventListener("click", async () => {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) return alert(error.message);

    window.location.replace("home.html");
});


/* PASSWORD TOGGLE (FIXED) */
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {

        const isHidden = passwordInput.type === "password";

        passwordInput.type = isHidden ? "text" : "password";

        togglePassword.textContent = isHidden ? "🙈" : "👁️";
    });
}


/* LOGOUT */
document.addEventListener("click", async (e) => {

    if (e.target && e.target.id === "logoutBtn") {

        e.preventDefault();

        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            alert("Logout failed: " + error.message);
            return;
        }

        window.location.replace("login.html");
    }
});


/* SESSION CHECK */
async function checkUser() {

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        window.location.replace("login.html");
    }
}

if (window.location.pathname.includes("home.html")) {
    checkUser();
}


/* FORCE SYNC LOGOUT */
supabaseClient.auth.onAuthStateChange((event) => {

    if (event === "SIGNED_OUT") {
        window.location.replace("login.html");
    }

});