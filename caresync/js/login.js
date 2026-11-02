// ===== login.js : handles role selection, demo pre-fills, and sign-in =====

// 1. Demo presets for each role so learners can test each role easily
const ROLE_PRESETS = {
  Admin: {
    email: "admin@caresync.com",
    name: "Alex Morgan",
    desc: "Full clinic operations, analytics, doctor capacity & system settings"
  },
  Doctor: {
    email: "dr.ananya@caresync.com",
    name: "Dr. Ananya Rao",
    doctorId: 1,
    desc: "Doctor consultation desk, my patient queue, vitals & prescriptions"
  },
  Receptionist: {
    email: "reception@caresync.com",
    name: "Sarah Collins",
    desc: "Front desk intake, rapid walk-in token generation & patient check-ins"
  },
  Patient: {
    email: "patient.aarav@caresync.com",
    name: "Aarav Mehta",
    patientId: 1,
    desc: "Personal patient portal, live queue token tracker & doctor booking"
  }
};

let currentRole = "Admin";

// 2. When clicking any of the 4 role buttons
function selectRole(roleName) {
  currentRole = roleName;
  document.querySelectorAll(".role").forEach(b => {
    b.classList.toggle("on", b.dataset.role === roleName);
  });

  const preset = ROLE_PRESETS[roleName];
  const emailInput = document.getElementById("email");
  const passInput = document.getElementById("pass");
  const descEl = document.getElementById("roleDesc");

  if (emailInput) emailInput.value = preset.email;
  if (passInput) passInput.value = "password123";
  if (descEl) descEl.textContent = preset.desc;
}

document.querySelectorAll(".role").forEach(btn => {
  btn.onclick = () => selectRole(btn.dataset.role);
});

// Set initial role state
selectRole("Admin");

const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// 3. Form submission
document.getElementById("loginForm").onsubmit = e => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("pass").value;

  document.getElementById("emailErr").textContent = emailOk(email) ? "" : "Enter a valid email, like you@clinic.com.";
  document.getElementById("passErr").textContent = pass.length >= 6 ? "" : "Password needs at least 6 characters.";

  if (!emailOk(email) || pass.length < 6) {
    const box = document.querySelector(".loginbox");
    box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake");
    return;
  }

  // Derive user name
  const preset = ROLE_PRESETS[currentRole];
  let userName = preset.name;
  if (email !== preset.email) {
    userName = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    if (currentRole === "Doctor" && !userName.toLowerCase().startsWith("dr.")) {
      userName = "Dr. " + userName;
    }
  }

  // Save the logged-in user to localStorage
  const userData = {
    name: userName,
    role: currentRole,
    email: email,
    doctorId: preset.doctorId || (currentRole === "Doctor" ? 1 : null),
    patientId: preset.patientId || (currentRole === "Patient" ? 1 : null)
  };
  localStorage.setItem("user", JSON.stringify(userData));

  toast("Signed in as " + currentRole + " (" + userName + ")");
  setTimeout(() => location.href = "dashboard.html", 600);
};

document.getElementById("forgot").onclick = e => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  if (emailOk(email)) toast("Reset link sent to " + email);
  else toast("Type your email first, then click Forgot password.", "error");
};
