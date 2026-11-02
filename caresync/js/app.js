// =============================================================================
// CareSync - app.js : Role-based Navigation, Dashboards & Pages
// =============================================================================
// This file builds the sidebar, top navigation, and pages for all 4 roles:
// 1. Admin        - Full clinic oversight, analytics, doctor capacity & settings
// 2. Doctor       - Clinical console, consultation room, my queue & schedule
// 3. Receptionist - Front desk intake, rapid walk-in tokens & check-ins
// 4. Patient      - Personal health portal, live queue token tracker & bookings
// =============================================================================

const $ = s => document.querySelector(s);
const PAGE = document.body.dataset.page;
window.rerenderCurrentPage = () => {
  if (typeof pages !== "undefined" && pages[PAGE]) pages[PAGE]();
};

// 1. Check logged-in user (redirect to index.html if not logged in)
const user = JSON.parse(localStorage.getItem("user") || "null");
if (!user) location.href = "index.html";

// Ensure role default if missing
if (!user.role) user.role = "Admin";

// 2. Navigation menus tailored for each role
const ROLE_NAV = {
  Admin: [
    ["speedometer2", "Dashboard", "dashboard"],
    ["people", "Patients", "patients"],
    ["person-badge", "Doctors", "doctors"],
    ["calendar-check", "Appointments", "appointments"],
    ["calendar-plus", "Book Appointment", "book"],
    ["list-ol", "Queue Management", "queue"],
    ["bar-chart-steps", "Capacity", "capacity"],
    ["graph-up-arrow", "Reports", "reports"],
    ["gear", "Settings", "settings"]
  ],
  Doctor: [
    ["speedometer2", "Doctor Console", "dashboard"],
    ["list-ol", "My Queue", "queue"],
    ["calendar-check", "My Appointments", "appointments"],
    ["people", "Patient Records", "patients"],
    ["calendar-plus", "Book Follow-up", "book"]
  ],
  Receptionist: [
    ["speedometer2", "Front Desk", "dashboard"],
    ["list-ol", "Queue & Tokens", "queue"],
    ["calendar-plus", "Book Walk-in", "book"],
    ["people", "Patient Registry", "patients"],
    ["calendar-check", "All Appointments", "appointments"],
    ["bar-chart-steps", "Doctor Capacity", "capacity"]
  ],
  Patient: [
    ["speedometer2", "My Health Portal", "dashboard"],
    ["calendar-plus", "Book Appointment", "book"],
    ["calendar-check", "My Visits", "appointments"],
    ["person-badge", "Find Doctors", "doctors"]
  ]
};

// Pages allowed per role (security / role boundary)
const ROLE_ALLOWED_PAGES = {
  Admin: ["dashboard", "patients", "doctors", "appointments", "book", "queue", "capacity", "reports", "settings"],
  Doctor: ["dashboard", "queue", "appointments", "patients", "book"],
  Receptionist: ["dashboard", "queue", "book", "patients", "appointments", "capacity"],
  Patient: ["dashboard", "book", "appointments", "doctors"]
};

const COLORS = ["#0e9f9a", "#3b9ae1", "#2fbf7a", "#f4b740", "#8b7cf6", "#ef6a5b"];
if (window.Chart) Chart.defaults.font.family = "Figtree";

// =============================================================================
// Reusable UI Helpers
// =============================================================================
const badge = s => `<span class="badge ${s.replace(" ", "")}">${s}</span>`;
const initials = n => (n || "User").replace("Dr. ", "").split(" ").map(w => w[0]).join("").slice(0, 2);
const avatar = (n, i = 0) => `<div class="avatar" style="--c:${COLORS[i % 6]}">${initials(n)}</div>`;

const table = (heads, rows) => `
  <div class="scroll">
    <table>
      <thead><tr>${heads.map(h => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.join("") || `<tr><td class="empty" colspan="${heads.length}">Nothing here yet.</td></tr>`}</tbody>
    </table>
  </div>`;

const statCard = (icon, label, n, c) => `
  <div class="card stat lift" style="--c:${c}">
    <div class="ico"><i class="bi bi-${icon}"></i></div>
    <div><b data-to="${n}">0</b><span>${label}</span></div>
  </div>`;

function modal(html) {
  const o = document.createElement("div");
  o.className = "overlay";
  o.innerHTML = `<div class="modal">${html}</div>`;
  o.onclick = e => { if (e.target === o) o.remove(); };
  document.body.appendChild(o);
}

function closeModal() {
  const o = $(".overlay");
  if (o) o.remove();
}

// Micro-animation for numbers & bars
function animate() {
  document.querySelectorAll("[data-to]").forEach(el => {
    const to = +el.dataset.to;
    let n = 0;
    (function step() {
      n += Math.max(1, to / 25);
      if (n >= to) { el.textContent = to; return; }
      el.textContent = Math.round(n);
      requestAnimationFrame(step);
    })();
  });
  setTimeout(() => {
    document.querySelectorAll("[data-w]").forEach(b => b.style.width = b.dataset.w + "%");
  }, 80);
}

// =============================================================================
// App Shell : Sidebar, Topbar with Role Switcher, and Main Content Container
// =============================================================================
function shell(title, sub, body) {
  const navItems = ROLE_NAV[user.role] || ROLE_NAV.Admin;

  $("#root").innerHTML = `
  <aside class="sidebar">
    <div class="brand">
      <span class="logo"><i class="bi bi-heart-pulse-fill"></i></span>
      <span class="serif">CareSync</span>
    </div>
    <nav>
      ${navItems.map(n => `
        <a href="${n[2]}.html" class="${n[2] === PAGE ? "active" : ""}">
          <i class="bi bi-${n[0]}"></i>
          <span>${n[1]}</span>
        </a>`).join("")}
    </nav>
    <a href="#" id="logout" class="logout"><i class="bi bi-box-arrow-left"></i><span>Logout</span></a>
  </aside>
  <main class="main">
    <header class="topbar">
      <button class="iconbtn" id="menuBtn" aria-label="Toggle menu"><i class="bi bi-list"></i></button>
      <div>
        <h1>${title}</h1>
        <p>${sub}</p>
      </div>

      <div class="who">
        <!-- Live MySQL Backend Status Indicator -->
        <div id="backendStatusPill" class="backend-pill ${isBackendConnected ? 'connected' : 'disconnected'}" title="${isBackendConnected ? 'Connected to MySQL: caresyncjava' : 'Local Storage Mode (Backend Offline)'}">
          <span class="backend-dot"></span>
          <span>${isBackendConnected ? 'MySQL: <b>caresyncjava</b>' : 'Local Mode'}</span>
        </div>

        <!-- Quick Role Switcher for learners and demo testing -->
        <div class="role-switcher-wrap" title="Switch role to see its dedicated UI">
          <label><i class="bi bi-person-gear"></i> Role:</label>
          <select id="quickRoleSwitch" class="role-switcher-select">
            <option value="Admin" ${user.role === "Admin" ? "selected" : ""}>Admin</option>
            <option value="Doctor" ${user.role === "Doctor" ? "selected" : ""}>Doctor</option>
            <option value="Receptionist" ${user.role === "Receptionist" ? "selected" : ""}>Receptionist</option>
            <option value="Patient" ${user.role === "Patient" ? "selected" : ""}>Patient</option>
          </select>
        </div>

        <span class="role-badge role-${user.role.toLowerCase()}">${user.role}</span>

        <div style="text-align:right">
          <b>${user.name}</b><br>
          <span class="muted tiny">${user.email || user.role}</span>
        </div>
        ${avatar(user.name, 0)}
      </div>
    </header>
    <section id="content">${body}</section>
  </main>`;

  // Handle collapsed sidebar state
  if (localStorage.getItem("collapsed") === "1") document.body.classList.add("collapsed");
  $("#menuBtn").onclick = () => {
    if (innerWidth <= 900) document.body.classList.toggle("open");
    else {
      document.body.classList.toggle("collapsed");
      localStorage.setItem("collapsed", document.body.classList.contains("collapsed") ? "1" : "0");
    }
  };

  // Logout handler
  $("#logout").onclick = e => {
    e.preventDefault();
    localStorage.removeItem("user");
    location.href = "index.html";
  };

  // Quick Role Switcher dropdown logic
  $("#quickRoleSwitch").onchange = e => {
    const newRole = e.target.value;
    const presets = {
      Admin: { name: "Alex Morgan", role: "Admin", email: "admin@caresync.com" },
      Doctor: { name: "Dr. Ananya Rao", role: "Doctor", doctorId: 1, email: "dr.ananya@caresync.com" },
      Receptionist: { name: "Sarah Collins", role: "Receptionist", email: "reception@caresync.com" },
      Patient: { name: "Aarav Mehta", role: "Patient", patientId: 1, email: "patient.aarav@caresync.com" }
    };
    localStorage.setItem("user", JSON.stringify(presets[newRole]));
    toast("Switched to " + newRole + " view");
    setTimeout(() => location.href = "dashboard.html", 350);
  };
}

const pages = {};

// =============================================================================
// ROLE 1: ADMIN DASHBOARD
// =============================================================================
function renderAdminDashboard() {
  const appts = state.appointments.filter(a => a.date === today);
  const free = state.doctors.filter(d => d.avail).reduce((n, d) => n + freeSlots(d.id, today).length, 0);
  const waiting = state.queue.filter(q => q.status === "Waiting");
  const confirmed = appts.filter(a => a.status === "Confirmed").length;
  const totalCap = state.doctors.reduce((sum, d) => sum + d.cap, 0);

  const stats = [
    ["people", "Registered Patients", state.patients.length, "#0e9f9a"],
    ["person-badge", "Doctors On Duty", state.doctors.filter(d => d.avail).length, "#3b9ae1"],
    ["calendar-check", "Today's Appointments", appts.length, "#2fbf7a"],
    ["grid-3x3-gap", "Available Slots", free, "#8b7cf6"],
    ["people-fill", "Patients Waiting", waiting.length, "#f4b740"],
    ["stopwatch", "Avg Wait (min)", avgWait(), "#ef6a5b"]
  ];

  const recent = [...appts].sort((a, b) => b.id - a.id).slice(0, 6).map(a => `
    <tr>
      <td><b>${pat(a.patient)?.name || "Walk-in"}</b></td>
      <td>${doc(a.doctor)?.name || "Doctor"}</td>
      <td>${a.time}</td>
      <td>${badge(a.status)}</td>
    </tr>`);

  shell("Admin Command Center", "Clinic Oversight & System Analytics", `
    <div class="hero hero-admin">
      <h1>Executive Clinic Overview</h1>
      <p>Welcome back, ${user.name}. All departments operating normally with ${waiting.length} patients in live queues.</p>
      <div class="hero-meta">
        <span class="hero-tag"><i class="bi bi-shield-check"></i> Administrator Access</span>
        <span class="hero-tag"><i class="bi bi-calendar3"></i> ${new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        <span class="hero-tag"><i class="bi bi-pie-chart"></i> Total Capacity: ${totalCap} slots/day</span>
      </div>
      <div class="row" style="margin-top:16px">
        <a class="btn light" href="queue.html"><i class="bi bi-list-ol"></i> Open Live Queue</a>
        <a class="btn outline-light" href="capacity.html"><i class="bi bi-bar-chart-steps"></i> Doctor Capacity</a>
        <a class="btn outline-light" href="reports.html"><i class="bi bi-graph-up"></i> Reports & CSV</a>
      </div>
      <svg class="ecg" viewBox="0 0 400 80"><path d="M0 40 H110 L130 40 L145 8 L165 72 L182 40 H260 L275 22 L290 40 H400"/></svg>
    </div>

    <div class="grid stats">${stats.map(s => statCard(...s)).join("")}</div>

    <div class="grid two">
      <div class="card">
        <h3>Today's Appointment Breakdown</h3>
        <canvas id="cStatus" height="200"></canvas>
      </div>
      <div class="card">
        <h3>Hourly Patient Traffic Flow</h3>
        <canvas id="cFlow" height="200"></canvas>
      </div>
    </div>

    <div class="card">
      <div class="row" style="justify-content:space-between; margin-bottom:12px">
        <h3 style="margin:0">Recent Clinic Appointments</h3>
        <a href="appointments.html" class="btn sm ghost">View All <i class="bi bi-arrow-right"></i></a>
      </div>
      ${table(["Patient", "Doctor", "Time", "Status"], recent)}
    </div>
  `);

  // Render Admin Charts
  const sts = ["Confirmed", "Completed", "Cancelled"];
  new Chart($("#cStatus"), {
    type: "doughnut",
    data: {
      labels: sts,
      datasets: [{
        data: sts.map(s => appts.filter(a => a.status === s).length),
        backgroundColor: ["#0e9f9a", "#2fbf7a", "#ef6a5b"],
        borderWidth: 0
      }]
    },
    options: { cutout: "68%", plugins: { legend: { position: "bottom" } } }
  });

  const hours = [9, 10, 11, 12, 14, 15, 16, 17];
  new Chart($("#cFlow"), {
    type: "line",
    data: {
      labels: hours.map(h => h + ":00"),
      datasets: [{
        label: "Patients",
        data: hours.map(h => appts.filter(a => a.status !== "Cancelled" && +a.time.slice(0, 2) === h).length),
        borderColor: "#3b9ae1",
        backgroundColor: "rgba(59,154,225,.15)",
        fill: true,
        tension: 0.4
      }]
    },
    options: { plugins: { legend: { display: false } } }
  });

  animate();
}

// =============================================================================
// ROLE 2: DOCTOR DASHBOARD (Clinical Consultation Desk)
// =============================================================================
function renderDoctorDashboard() {
  const doctorId = user.doctorId || 1;
  const myDoc = doc(doctorId) || state.doctors[0];
  const myAppts = state.appointments.filter(a => a.doctor === myDoc.id && a.date === today);
  const myQueue = state.queue.filter(q => q.doctor === myDoc.id);
  const curPatient = myQueue.find(q => q.status === "In Progress");
  const waitPatients = myQueue.filter(q => q.status === "Waiting");
  const doneCount = myQueue.filter(q => q.status === "Completed").length;
  const free = freeSlots(myDoc.id, today).length;

  const doctorStats = [
    ["calendar-check", "My Appointments Today", myAppts.length, "#0e9f9a"],
    ["people-fill", "Waiting Outside", waitPatients.length, "#f4b740"],
    ["check2-circle", "Consultations Done", doneCount, "#2fbf7a"],
    ["stopwatch", "Avg Consult (min)", state.settings.avg, "#3b9ae1"]
  ];

  const queueRows = myQueue.map(q => `
    <tr>
      <td><b>${q.token}</b></td>
      <td>${q.name}</td>
      <td>${badge(q.status)}</td>
      <td>${q.status === "Waiting" ? "~" + waitFor(q) + " mins" : "-"}</td>
      <td>
        ${q.status === "Waiting" ? `<button class="btn sm sky" data-doc-call="${q.token}">Call</button>` : ""}
        ${q.status === "In Progress" ? `<span class="pill ok">Inside Room</span>` : ""}
      </td>
    </tr>`);

  shell("Doctor Console", `${myDoc.name} · ${myDoc.dept}`, `
    <div class="hero hero-doctor">
      <h1>Consultation Room · ${myDoc.name}</h1>
      <p>Specialization: <b>${myDoc.dept}</b> · Room 3 · ${waitPatients.length} patient(s) currently waiting in line.</p>
      <div class="hero-meta">
        <span class="hero-tag"><i class="bi bi-heart-pulse"></i> ${myDoc.dept}</span>
        <span class="hero-tag"><i class="bi bi-clock-history"></i> ${free} free slots available today</span>
        <label class="hero-tag" style="cursor:pointer">
          <input type="checkbox" id="docAvailToggle" ${myDoc.avail ? "checked" : ""} style="margin-right:6px">
          ${myDoc.avail ? "Status: Available On Duty" : "Status: On Break / Leave"}
        </label>
      </div>
      <svg class="ecg" viewBox="0 0 400 80"><path d="M0 40 H110 L130 40 L145 8 L165 72 L182 40 H260 L275 22 L290 40 H400"/></svg>
    </div>

    <!-- Active Patient Consultation Card -->
    <div class="consult-card">
      <div class="row" style="justify-content:space-between">
        <h3 style="margin:0"><i class="bi bi-person-workspace" style="color:var(--sky)"></i> Current Consultation Room</h3>
        <span class="badge ${curPatient ? "InProgress" : "Waiting"}">${curPatient ? "Patient Inside Room" : "Room Ready for Next Patient"}</span>
      </div>

      ${curPatient ? `
        <div class="patient-spotlight">
          <div class="token-badge">${curPatient.token}</div>
          <div style="flex:1">
            <h2 style="font-size:22px; margin-bottom:4px">${curPatient.name}</h2>
            <p class="muted tiny">Reason for visit: Routine consultation & clinical examination</p>
          </div>
          <div class="row">
            <button class="btn sky" id="docDoneBtn"><i class="bi bi-check2-all"></i> Complete Visit</button>
            <button class="btn danger" id="docSkipBtn"><i class="bi bi-skip-forward"></i> Skip</button>
          </div>
        </div>

        <div class="vitals-grid">
          <div class="vital-box"><small>Blood Pressure</small><b>120/80</b></div>
          <div class="vital-box"><small>Heart Rate</small><b>76 bpm</b></div>
          <div class="vital-box"><small>Oxygen (SpO2)</small><b>99%</b></div>
          <div class="vital-box"><small>Body Temp</small><b>98.6 °F</b></div>
        </div>

        <label style="margin-top:14px">Clinical Diagnosis & Prescription Notes</label>
        <textarea id="docNotes" class="clinical-notes" placeholder="Enter clinical notes, prescription or advice for ${curPatient.name}..."></textarea>
        <div class="rx-chips">
          <button type="button" class="rx-chip" data-rx="Paracetamol 500mg (1-0-1 after meals)">+ Paracetamol 500mg</button>
          <button type="button" class="rx-chip" data-rx="Amoxicillin 250mg (1-0-1 for 5 days)">+ Amoxicillin 250mg</button>
          <button type="button" class="rx-chip" data-rx="Complete Blood Count (CBC) Lab Test">+ Order CBC Lab Test</button>
          <button type="button" class="rx-chip" data-rx="Review in 7 days with test reports">+ Follow-up in 1 Week</button>
        </div>
      ` : `
        <div class="patient-spotlight" style="justify-content:space-between">
          <div>
            <b>No patient is currently inside the consultation room.</b>
            <p class="muted tiny">${waitPatients.length ? `Next patient in line is <b>${waitPatients[0].name}</b> (${waitPatients[0].token}).` : "All waiting patients have been attended to."}</p>
          </div>
          ${waitPatients.length ? `
            <button class="btn sky" id="docCallNextBtn"><i class="bi bi-megaphone"></i> Call Next (${waitPatients[0].token})</button>
          ` : `<span class="pill ok">Queue Clear</span>`}
        </div>
      `}
    </div>

    <!-- Doctor's KPIs -->
    <div class="grid stats">${doctorStats.map(s => statCard(...s)).join("")}</div>

    <!-- Doctor's Live Patient Queue -->
    <div class="card">
      <div class="row" style="justify-content:space-between; margin-bottom:12px">
        <h3 style="margin:0">My Queue for Today (${myDoc.name})</h3>
        <span class="muted tiny">${waitPatients.length} waiting · ${doneCount} completed</span>
      </div>
      ${table(["Token", "Patient", "Status", "Est. Wait", "Action"], queueRows)}
    </div>
  `);

  // Availability Toggle
  const toggle = $("#docAvailToggle");
  if (toggle) {
    toggle.onchange = () => {
      API.toggleDoctor(myDoc.id, toggle.checked);
      toast(myDoc.name + (myDoc.avail ? " is now marked Available" : " is marked On Break"));
      renderDoctorDashboard();
    };
  }

  // Prescription chip helper
  document.querySelectorAll(".rx-chip").forEach(btn => {
    btn.onclick = () => {
      const notes = $("#docNotes");
      if (notes) {
        notes.value = (notes.value ? notes.value + "\n• " : "• ") + btn.dataset.rx;
      }
    };
  });

  // Complete Consultation
  if ($("#docDoneBtn")) {
    $("#docDoneBtn").onclick = () => {
      API.updateQueueToken(curPatient.token, { status: "Completed" });
      toast("Consultation completed for " + curPatient.name);
      renderDoctorDashboard();
    };
  }

  // Skip Patient
  if ($("#docSkipBtn")) {
    $("#docSkipBtn").onclick = () => {
      API.updateQueueToken(curPatient.token, { status: "Skipped" });
      toast("Patient " + curPatient.token + " skipped", "error");
      renderDoctorDashboard();
    };
  }

  // Call Next Patient
  if ($("#docCallNextBtn")) {
    $("#docCallNextBtn").onclick = () => {
      if (!waitPatients.length) return toast("No patients waiting in line.", "error");
      API.updateQueueToken(waitPatients[0].token, { status: "In Progress" });
      toast("Calling " + waitPatients[0].token + " (" + waitPatients[0].name + ")");
      renderDoctorDashboard();
    };
  }

  // Inline call button
  document.querySelectorAll("[data-doc-call]").forEach(btn => {
    btn.onclick = () => {
      if (curPatient) return toast("Please complete or skip the current patient first.", "error");
      const target = myQueue.find(q => q.token === btn.dataset.docCall);
      if (target) {
        API.updateQueueToken(target.token, { status: "In Progress" });
        toast("Calling " + target.token);
        renderDoctorDashboard();
      }
    };
  });

  animate();
}

// =============================================================================
// ROLE 3: RECEPTIONIST DASHBOARD (Front Desk Terminal)
// =============================================================================
function renderReceptionistDashboard() {
  const apptsToday = state.appointments.filter(a => a.date === today);
  const checkedInAppts = apptsToday.filter(a => a.checkedIn);
  const uncheckAppts = apptsToday.filter(a => !a.checkedIn && a.status === "Confirmed");
  const waitingQueue = state.queue.filter(q => q.status === "Waiting");
  const totalFreeSlots = state.doctors.reduce((n, d) => n + freeSlots(d.id, today).length, 0);

  const receptionStats = [
    ["check2-square", "Checked-in Today", checkedInAppts.length, "#0e9f9a"],
    ["people-fill", "Waiting in Lobby", waitingQueue.length, "#f4b740"],
    ["calendar-check", "Unverified Visits", uncheckAppts.length, "#3b9ae1"],
    ["grid-3x3-gap", "Doctor Free Slots", totalFreeSlots, "#2fbf7a"]
  ];

  const uncheckRows = uncheckAppts.slice(0, 6).map(a => `
    <tr>
      <td><b>${pat(a.patient)?.name || "Patient"}</b></td>
      <td>${doc(a.doctor)?.name || "Doctor"}</td>
      <td>${a.time}</td>
      <td>
        <button class="btn sm sky" data-checkin-id="${a.id}">
          <i class="bi bi-box-arrow-in-right"></i> Check-in &amp; Issue Token
        </button>
      </td>
    </tr>`);

  shell("Front Desk Terminal", "Patient Check-ins & Walk-in Token Dispenser", `
    <div class="hero hero-receptionist">
      <h1>CareSync Front Desk Intake</h1>
      <p>Terminal 1 · Quick walk-in registration, appointment verification, and token printing.</p>
      <div class="hero-meta">
        <span class="hero-tag"><i class="bi bi-person-badge"></i> Receptionist: ${user.name}</span>
        <span class="hero-tag"><i class="bi bi-ticket-perforated"></i> Lobby Queue: ${waitingQueue.length} waiting</span>
      </div>
      <div class="row" style="margin-top:16px">
        <a class="btn light" href="queue.html"><i class="bi bi-display"></i> View Waiting Lobby Screen</a>
        <a class="btn outline-light" href="patients.html"><i class="bi bi-person-plus"></i> Register Patient</a>
      </div>
      <svg class="ecg" viewBox="0 0 400 80"><path d="M0 40 H110 L130 40 L145 8 L165 72 L182 40 H260 L275 22 L290 40 H400"/></svg>
    </div>

    <!-- Two Main Action Panels for Front Desk -->
    <div class="intake-grid">
      <!-- 1. Rapid Walk-in Token Dispenser -->
      <div class="card">
        <h3><i class="bi bi-ticket-perforated-fill" style="color:var(--teal)"></i> Fast Walk-in Token Dispenser</h3>
        <p class="muted tiny">Instantly issue a live token for unbooked walk-in patients.</p>

        <form id="fastWalkInForm" style="margin-top:14px">
          <label>Assign to Doctor / Department</label>
          <select id="walkDoc" class="input">
            ${state.doctors.map(d => `
              <option value="${d.id}" ${d.avail ? "" : "disabled"}>
                ${d.name} (${d.dept}) ${d.avail ? "- " + freeSlots(d.id, today).length + " slots free" : "(Unavailable)"}
              </option>`).join("")}
          </select>

          <label>Walk-in Patient Name</label>
          <input id="walkName" class="input" placeholder="e.g. Rahul Sharma" required>

          <button type="submit" class="btn big" style="margin-top:16px">
            <i class="bi bi-printer"></i> Generate &amp; Print Token
          </button>
        </form>
      </div>

      <!-- 2. Today's Doctor Availability Roster -->
      <div class="card">
        <h3><i class="bi bi-person-lines-fill" style="color:var(--sky)"></i> Live Doctor Availability Board</h3>
        <p class="muted tiny">Real-time doctor queue load and clinic room occupancy.</p>
        <div style="display:grid; gap:10px; margin-top:14px">
          ${state.doctors.map((d, i) => {
            const docQ = state.queue.filter(q => q.doctor === d.id && q.status === "Waiting").length;
            const inProg = state.queue.find(q => q.doctor === d.id && q.status === "In Progress");
            return `
              <div class="roster-card">
                <div class="row">
                  ${avatar(d.name, i)}
                  <div>
                    <b>${d.name}</b><br>
                    <small class="muted">${d.dept}</small>
                  </div>
                </div>
                <div style="text-align:right">
                  <span class="pill ${d.avail ? "ok" : "off"}">${d.avail ? "Available" : "On Leave"}</span><br>
                  <small class="muted">${docQ} in queue ${inProg ? "· Serving " + inProg.token : ""}</small>
                </div>
              </div>`;
          }).join("")}
        </div>
      </div>
    </div>

    <!-- Front Desk Stats -->
    <div class="grid stats">${receptionStats.map(s => statCard(...s)).join("")}</div>

    <!-- Quick Check-in Table -->
    <div class="card">
      <div class="row" style="justify-content:space-between; margin-bottom:12px">
        <h3 style="margin:0">Patients Arriving Today (Pending Check-in)</h3>
        <span class="muted tiny">${uncheckAppts.length} appointments pending</span>
      </div>
      ${table(["Patient", "Assigned Doctor", "Scheduled Time", "Front Desk Action"], uncheckRows)}
    </div>
  `);

  // Fast Walk-in Submission
  $("#fastWalkInForm").onsubmit = e => {
    e.preventDefault();
    const docId = +$("#walkDoc").value;
    const name = $("#walkName").value.trim();
    if (!name) return toast("Enter patient name.", "error");

    const token = addQueue(name, docId);
    toast(`Walk-in Token ${token} generated for ${name}!`);
    $("#walkName").value = "";
    renderReceptionistDashboard();
  };

  // Fast Check-in Button on Appointment Row
  document.querySelectorAll("[data-checkin-id]").forEach(btn => {
    btn.onclick = () => {
      const apptId = +btn.dataset.checkinId;
      const appt = state.appointments.find(a => a.id === apptId);
      if (appt) {
        appt.checkedIn = true;
        const patientName = pat(appt.patient)?.name || "Patient";
        const token = addQueue(patientName, appt.doctor);
        save();
        toast(`Checked in ${patientName}! Token issued: ${token}`);
        renderReceptionistDashboard();
      }
    };
  });

  animate();
}

// =============================================================================
// ROLE 4: PATIENT DASHBOARD (Personal Health Portal & Live Queue Tracker)
// =============================================================================
function renderPatientDashboard() {
  const patientId = user.patientId || 1;
  const myPat = pat(patientId) || { id: 1, name: user.name, phone: "98450 11000", age: 28 };

  // Look for this patient's active token in the queue
  let myToken = state.queue.find(q =>
    q.name.toLowerCase() === user.name.toLowerCase() &&
    (q.status === "Waiting" || q.status === "In Progress")
  );

  // If learner logged in as patient and has no token yet, link them to the first waiting token so they see the live tracker!
  if (!myToken) {
    myToken = state.queue.find(q => q.status === "Waiting" && q.doctor === 1);
    if (myToken) {
      myToken.name = user.name;
      save();
    }
  }

  const assignedDoc = myToken ? doc(myToken.doctor) : null;
  const servingToken = assignedDoc ? (state.queue.find(q => q.doctor === assignedDoc.id && q.status === "In Progress")?.token || "None") : "-";

  // Calculate position in queue
  let aheadCount = 0;
  let estWaitMins = 0;
  if (myToken && myToken.status === "Waiting") {
    const doctorLine = state.queue.filter(q => q.doctor === myToken.doctor && q.status === "Waiting");
    aheadCount = Math.max(0, doctorLine.findIndex(q => q.token === myToken.token));
    estWaitMins = (aheadCount + 1) * state.settings.avg;
  }

  // Patient's appointments
  const myAppts = state.appointments.filter(a =>
    a.patient === myPat.id || (pat(a.patient)?.name.toLowerCase() === user.name.toLowerCase())
  );

  const visitRows = myAppts.map(a => `
    <tr>
      <td><b>${doc(a.doctor)?.name || "Specialist"}</b></td>
      <td>${doc(a.doctor)?.dept || "General"}</td>
      <td>${a.date}</td>
      <td>${a.time}</td>
      <td>${badge(a.status)}</td>
      <td>
        <span class="muted tiny">${a.status === "Confirmed" ? "Scheduled" : "Concluded"}</span>
      </td>
    </tr>`);

  shell("Patient Health Portal", `Welcome, ${user.name}`, `
    <div class="hero hero-patient">
      <h1>Hello, ${user.name.split(" ")[0]}!</h1>
      <p>Welcome to your CareSync Health Portal. Track your queue live, book doctors, and view your appointments.</p>
      <div class="hero-meta">
        <span class="hero-tag"><i class="bi bi-person-heart"></i> Patient ID: #P-${1000 + myPat.id}</span>
        <span class="hero-tag"><i class="bi bi-telephone"></i> Registered Phone: ${myPat.phone || "Active"}</span>
      </div>
      <div class="row" style="margin-top:16px">
        <a class="btn light" href="book.html"><i class="bi bi-calendar-plus"></i> Book New Doctor Visit</a>
        <a class="btn outline-light" href="doctors.html"><i class="bi bi-search"></i> Find Specialist</a>
      </div>
      <svg class="ecg" viewBox="0 0 400 80"><path d="M0 40 H110 L130 40 L145 8 L165 72 L182 40 H260 L275 22 L290 40 H400"/></svg>
    </div>

    <!-- LIVE QUEUE TRACKER CARD -->
    <div class="token-tracker-card">
      <div class="tracker-header">
        <div>
          <h2 style="font-size:22px; margin-bottom:2px">
            <i class="bi bi-broadcast" style="color:var(--teal)"></i> Your Live Queue Status
          </h2>
          <p class="muted tiny">Real-time tracking for your consultation today</p>
        </div>
        <span class="live-pill">LIVE TRACKER</span>
      </div>

      ${myToken ? `
        <div class="tracker-main">
          <div class="token-hero-box">
            <small style="color:var(--muted); text-transform:uppercase; font-weight:700">Your Token Number</small>
            <div class="token-num">${myToken.token}</div>
            <span class="badge ${myToken.status === "In Progress" ? "InProgress" : "Waiting"}">
              ${myToken.status === "In Progress" ? "Consultation in Progress" : "Waiting in Queue"}
            </span>
          </div>

          <div>
            <div style="margin-bottom:14px">
              <small class="muted">Doctor &amp; Room</small>
              <h3 style="font-size:18px; margin:2px 0">${assignedDoc?.name || "Doctor"}</h3>
              <span class="pill ok">${assignedDoc?.dept || "Clinic"} · Room 3</span>
            </div>
            <div class="row" style="justify-content:center; gap:20px">
              <div>
                <small class="muted">Now Serving</small>
                <div style="font-size:22px; font-weight:700; color:var(--sky)">${servingToken}</div>
              </div>
              <div style="border-left:1px solid var(--line); padding-left:20px">
                <small class="muted">Estimated Wait</small>
                <div style="font-size:22px; font-weight:700; color:var(--coral)">~${estWaitMins || 5} mins</div>
              </div>
            </div>
          </div>

          <div style="background:#fff; border:1px solid var(--line); border-radius:14px; padding:16px">
            <small class="muted">People ahead of you</small>
            <div style="font-size:32px; font-weight:700; color:var(--ink); margin:4px 0">${aheadCount}</div>
            <small class="muted">Please take a seat in Waiting Lounge B</small>
          </div>
        </div>

        <!-- Visual Progress Timeline -->
        <div class="queue-progress">
          <div class="prog-step done">
            <div class="prog-dot"><i class="bi bi-check-lg"></i></div>
            <span>Check-in</span>
          </div>
          <div class="prog-step ${myToken.status === "Waiting" ? "active" : "done"}">
            <div class="prog-dot"><i class="bi bi-hourglass-split"></i></div>
            <span>Waiting Lobby</span>
          </div>
          <div class="prog-step ${myToken.status === "In Progress" ? "active" : ""}">
            <div class="prog-dot"><i class="bi bi-door-open"></i></div>
            <span>Consultation</span>
          </div>
          <div class="prog-step">
            <div class="prog-dot"><i class="bi bi-clipboard2-check"></i></div>
            <span>Completed</span>
          </div>
        </div>
      ` : `
        <div style="text-align:center; padding:30px 10px">
          <i class="bi bi-ticket-perforated" style="font-size:48px; color:var(--muted)"></i>
          <h3 style="margin-top:10px">You don't have an active queue token today.</h3>
          <p class="muted">Ready to see a doctor? Book an appointment or request check-in at the front desk.</p>
          <a class="btn" href="book.html" style="margin-top:16px"><i class="bi bi-calendar-plus"></i> Book Appointment Now</a>
        </div>
      `}
    </div>

    <!-- Patient's Appointment History -->
    <div class="card">
      <div class="row" style="justify-content:space-between; margin-bottom:12px">
        <h3 style="margin:0">My Consultations &amp; Appointments</h3>
        <a href="book.html" class="btn sm"><i class="bi bi-plus-lg"></i> Book New</a>
      </div>
      ${table(["Doctor", "Department", "Date", "Time", "Status", "Note"], visitRows)}
    </div>

    <!-- Quick Health Tips & Clinic Contact -->
    <div class="grid two">
      <div class="card">
        <h3><i class="bi bi-telephone-inbound" style="color:var(--teal)"></i> Need Assistance?</h3>
        <p class="muted">Front desk hotline: <b>+1 (800) 555-CARE</b></p>
        <p class="muted" style="margin-top:6px">Clinic Hours: Mon - Sat: 8:00 AM - 7:00 PM</p>
      </div>
      <div class="card">
        <h3><i class="bi bi-shield-plus" style="color:var(--green)"></i> Emergency Services</h3>
        <p class="muted">For urgent medical attention, proceed directly to CareSync Emergency Wing (Gate 2).</p>
      </div>
    </div>
  `);

  animate();
}

// =============================================================================
// Central Dashboard Router
// =============================================================================
pages.dashboard = () => {
  if (user.role === "Doctor") {
    renderDoctorDashboard();
  } else if (user.role === "Receptionist") {
    renderReceptionistDashboard();
  } else if (user.role === "Patient") {
    renderPatientDashboard();
  } else {
    renderAdminDashboard();
  }
};

// =============================================================================
// PATIENTS PAGE
// =============================================================================
pages.patients = (q = "") => {
  const rows = state.patients
    .filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
    .map((p, i) => `
      <tr>
        <td><div class="row">${avatar(p.name, i)}<b>${p.name}</b></div></td>
        <td>${p.age}</td>
        <td>${p.phone}</td>
        <td><a class="btn sm ghost" href="book.html">Book</a></td>
      </tr>`);

  shell("Patients", `${state.patients.length} registered patients`, `
    <div class="grid two">
      <div class="card">
        <h3>All Registered Patients</h3>
        <input id="search" class="input" placeholder="Search by name..." value="${q}">
        <div style="margin-top:12px">${table(["Patient", "Age", "Phone", ""], rows)}</div>
      </div>
      <div class="card">
        <h3>Register New Patient</h3>
        <form id="regForm" class="form-grid">
          <div class="full">
            <label>Full Name</label>
            <input id="pn" class="input" placeholder="e.g. Maya Singh" required>
          </div>
          <div>
            <label>Age</label>
            <input id="pa" class="input" type="number" min="0" max="120" required>
          </div>
          <div>
            <label>Phone Number</label>
            <input id="pp" class="input" placeholder="98xxx xxxxx" required>
          </div>
          <div class="full" style="margin-top:18px">
            <button class="btn big"><i class="bi bi-person-plus"></i> Register Patient</button>
          </div>
        </form>
      </div>
    </div>`);

  $("#search").oninput = e => {
    pages.patients(e.target.value);
    const s = $("#search");
    s.focus();
    s.setSelectionRange(99, 99);
  };

  $("#regForm").onsubmit = async e => {
    e.preventDefault();
    const name = $("#pn").value.trim(), age = +$("#pa").value, phone = $("#pp").value.trim();
    if (!name || !age || !phone) return toast("Fill in name, age and phone.", "error");
    await API.addPatient({ name, age, phone });
    toast(name + " registered successfully");
    pages.patients();
  };
};

// =============================================================================
// DOCTORS PAGE
// =============================================================================
pages.doctors = () => {
  const depts = [...new Set(state.doctors.map(d => d.dept))];
  shell("Doctors", "Find a specialist and check today's availability", `
    <div class="row">
      <input id="dq" class="input" style="max-width:320px" placeholder="Search doctor or specialty...">
      <select id="dd" class="input" style="max-width:220px">
        <option value="">All Departments</option>
        ${depts.map(d => `<option>${d}</option>`).join("")}
      </select>
    </div>
    <div class="grid three" id="dlist" style="margin-top:20px"></div>`);

  const draw = () => {
    const q = $("#dq").value.toLowerCase(), dep = $("#dd").value;
    const list = state.doctors.filter(d => (d.name + d.dept).toLowerCase().includes(q) && (!dep || d.dept === dep));
    $("#dlist").innerHTML = list.map((d, i) => {
      const f = freeSlots(d.id, today).length;
      return `
      <div class="card lift dcard">
        <div class="top">${avatar(d.name, i)}
          <div><b>${d.name}</b><br><span class="muted">${d.dept}</span></div>
        </div>
        <div class="row">
          <span class="pill ${d.avail ? "ok" : "off"}">${d.avail ? "Available" : "On leave"}</span>
          <span class="muted">${f} of ${d.cap} slots free today</span>
        </div>
        <a class="btn ${d.avail ? "" : "ghost"}" href="${d.avail ? "book.html?doctor=" + d.id : "#"}">
          <i class="bi bi-calendar-plus"></i> Book Appointment
        </a>
      </div>`;
    }).join("") || `<p class="empty">No doctors match your search.</p>`;
  };

  $("#dq").oninput = draw;
  $("#dd").onchange = draw;
  draw();
};

// =============================================================================
// APPOINTMENTS PAGE (Role-filtered)
// =============================================================================
let apTab = "Today";
pages.appointments = () => {
  let list = state.appointments;

  // Filter if Doctor or Patient
  if (user.role === "Doctor") {
    const docId = user.doctorId || 1;
    list = list.filter(a => a.doctor === docId);
  } else if (user.role === "Patient") {
    const patId = user.patientId || 1;
    list = list.filter(a => a.patient === patId || pat(a.patient)?.name.toLowerCase() === user.name.toLowerCase());
  }

  // Filter by Tab
  list = list.filter(a =>
    apTab === "Today" ? a.date === today :
    apTab === "Upcoming" ? (a.date > today && a.status === "Confirmed") :
    (a.date < today || (a.date === today && a.status !== "Confirmed"))
  ).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const rows = list.map(a => {
    const open = a.status === "Confirmed";
    return `
      <tr>
        <td><b>${pat(a.patient)?.name || "Patient"}</b></td>
        <td>${doc(a.doctor)?.name || "Doctor"}</td>
        <td>${a.date}</td>
        <td>${a.time}</td>
        <td>${badge(a.status)}</td>
        <td class="row" style="border:0">
          ${open ? `
            ${a.date === today && !a.checkedIn ? `<button class="btn sm sky" data-act="in" data-id="${a.id}">Check in</button>` : ""}
            <button class="btn sm ghost" data-act="move" data-id="${a.id}">Reschedule</button>
            <button class="btn sm danger" data-act="cancel" data-id="${a.id}">Cancel</button>
          ` : `<span class="muted tiny">No action</span>`}
        </td>
      </tr>`;
  });

  shell("Appointments", user.role === "Patient" ? "Your scheduled visits" : "Manage appointments, check-ins and schedules", `
    <div class="tabs">
      ${["Today", "Upcoming", "History"].map(t => `<button class="${t === apTab ? "on" : ""}" data-tab="${t}">${t}</button>`).join("")}
    </div>
    <div class="card">${table(["Patient", "Doctor", "Date", "Time", "Status", "Actions"], rows)}</div>`);

  document.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => {
    apTab = b.dataset.tab;
    pages.appointments();
  });

  document.querySelectorAll("[data-act]").forEach(b => b.onclick = () => {
    const a = state.appointments.find(x => x.id === +b.dataset.id);
    if (!a) return;

    if (b.dataset.act === "cancel") {
      API.updateAppointment(a.id, { status: "Cancelled" });
      toast("Appointment cancelled. Slot freed up.");
      pages.appointments();
    }
    if (b.dataset.act === "in") {
      a.checkedIn = true;
      const t = addQueue(pat(a.patient)?.name || "Patient", a.doctor);
      toast(`Checked in. Token ${t} generated.`);
      pages.appointments();
    }
    if (b.dataset.act === "move") {
      const opts = freeSlots(a.doctor, a.date).map(t => `<option>${t}</option>`).join("");
      if (!opts) return toast("No free slots left on that day.", "error");
      modal(`
        <h3>Reschedule Appointment</h3>
        <p class="muted">${pat(a.patient)?.name} with ${doc(a.doctor)?.name} on ${a.date}</p>
        <label>Pick New Time Slot</label>
        <select id="newTime" class="input">${opts}</select>
        <div class="row" style="margin-top:16px">
          <button class="btn ghost" onclick="closeModal()">Close</button>
          <button class="btn" id="saveTime">Save New Time</button>
        </div>`);
      $("#saveTime").onclick = () => {
        API.updateAppointment(a.id, { time: $("#newTime").value });
        closeModal();
        toast("Appointment rescheduled successfully");
        pages.appointments();
      };
    }
  });
};

// =============================================================================
// BOOK APPOINTMENT PAGE
// =============================================================================
pages.book = () => {
  const depts = [...new Set(state.doctors.map(d => d.dept))];
  const pre = doc(+new URLSearchParams(location.search).get("doctor"));
  let chosen = "";

  // Prefill patient name if user is Patient
  const defaultPatientName = user.role === "Patient" ? user.name : "";

  shell("Book Appointment", "Choose a specialist, date and available slot", `
    <div class="grid two">
      <div class="card">
        <h3>Appointment Details</h3>
        <div class="form-grid">
          <div>
            <label>Department</label>
            <select id="bd" class="input">
              ${depts.map(d => `<option ${pre && pre.dept === d ? "selected" : ""}>${d}</option>`).join("")}
            </select>
          </div>
          <div>
            <label>Doctor</label>
            <select id="bdoc" class="input"></select>
          </div>
          <div class="full">
            <label>Date</label>
            <input id="bdate" class="input" type="date" min="${today}" value="${today}">
          </div>
          <div class="full">
            <label>Patient Name</label>
            <input id="bn" class="input" list="plist" placeholder="Choose or type patient name" value="${defaultPatientName}">
            <datalist id="plist">${state.patients.map(p => `<option value="${p.name}">`).join("")}</datalist>
          </div>
          <div class="full">
            <label>Reason for Consultation</label>
            <input id="br" class="input" placeholder="e.g. Chest pain, skin allergy, routine checkup">
          </div>
        </div>
      </div>

      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Available Time Slots</h3>
          <button class="btn sm ghost" id="smart"><i class="bi bi-stars"></i> Suggest Earliest</button>
        </div>
        <p class="muted tiny" id="cap" style="margin:6px 0 12px"></p>
        <div class="slots" id="slots"></div>
        <button class="btn big" id="confirm" style="margin-top:22px">
          <i class="bi bi-check2-circle"></i> Confirm Booking
        </button>
      </div>
    </div>
    <div id="done"></div>`);

  const fillDocs = () => {
    const list = state.doctors.filter(d => d.dept === $("#bd").value && d.avail);
    $("#bdoc").innerHTML = list.length
      ? list.map(d => `<option value="${d.id}" ${pre && pre.id === d.id ? "selected" : ""}>${d.name}</option>`).join("")
      : `<option value="">No doctor available in this department</option>`;
    drawSlots();
  };

  const drawSlots = () => {
    chosen = "";
    const id = $("#bdoc").value, date = $("#bdate").value;
    if (!id) {
      $("#slots").innerHTML = "";
      $("#cap").textContent = "No doctor available.";
      return;
    }
    const free = freeSlots(id, date);
    $("#cap").textContent = `${free.length} of ${doc(id).cap} slots free on ${date}`;
    $("#slots").innerHTML = TIMES.slice(0, doc(id).cap).map(t => `
      <button class="slot" data-t="${t}" ${free.includes(t) ? "" : "disabled"}>
        ${t}<small>${free.includes(t) ? "Free" : "Booked"}</small>
      </button>`).join("");

    document.querySelectorAll(".slot").forEach(b => b.onclick = () => pick(b.dataset.t));
  };

  const pick = t => {
    chosen = t;
    document.querySelectorAll(".slot").forEach(b => b.classList.toggle("on", b.dataset.t === t));
  };

  $("#bd").onchange = fillDocs;
  $("#bdoc").onchange = drawSlots;
  $("#bdate").onchange = drawSlots;

  $("#smart").onclick = () => {
    const free = $("#bdoc").value ? freeSlots($("#bdoc").value, $("#bdate").value) : [];
    if (!free.length) return toast("Doctor is fully booked on that date.", "error");
    pick(free[0]);
    toast("Earliest free slot: " + free[0]);
  };

  $("#confirm").onclick = async () => {
    const id = +$("#bdoc").value, date = $("#bdate").value, name = $("#bn").value.trim(), reason = $("#br").value.trim();
    if (!id || !name || !reason || !chosen) return toast("Select a slot and fill in patient name and reason.", "error");
    if (date < today) return toast("Pick today or a future date.", "error");
    if (!freeSlots(id, date).includes(chosen)) return toast("Slot just got booked. Please pick another.", "error");

    let p = state.patients.find(x => x.name.toLowerCase() === name.toLowerCase());
    if (!p) {
      p = await API.addPatient({ name, age: 25, phone: "98000 12345" });
    }

    const appt = await API.bookAppointment({ patient: p.id, doctor: id, date, time: chosen, status: "Confirmed", reason });
    const ref = appt.id || state.appointments.length;

    toast("Appointment booked successfully!");
    $("#done").innerHTML = `
      <div class="card confirm" style="margin-top:20px">
        <i class="bi bi-patch-check-fill"></i>
        <h2>Booking Confirmed!</h2>
        <p>${p.name} with ${doc(id).name} on ${date} at ${chosen}.<br>Reference APT-${1000 + ref}. Token will be issued upon check-in.</p>
      </div>`;
    $("#done").scrollIntoView({ behavior: "smooth" });
    drawSlots();
  };

  fillDocs();
};

// =============================================================================
// QUEUE MANAGEMENT PAGE
// =============================================================================
let qDoc = user.doctorId || 1, simOn = false;
pages.queue = () => {
  const list = state.queue.filter(q => q.doctor === qDoc);
  const cur = list.find(q => q.status === "In Progress");
  const wait = list.filter(q => q.status === "Waiting");

  const rows = list.map(q => `
    <tr class="${user.name && q.name.toLowerCase() === user.name.toLowerCase() ? "highlight-row" : ""}">
      <td><b>${q.token}</b></td>
      <td>
        ${q.name}
        ${user.name && q.name.toLowerCase() === user.name.toLowerCase() ? `<span class="badge Confirmed" style="margin-left:6px">YOU</span>` : ""}
      </td>
      <td>${badge(q.status)}</td>
      <td>${q.status === "Waiting" ? "~" + waitFor(q) + " min" : "-"}</td>
    </tr>`);

  shell("Queue Management", `<span class="ring"></span>Live hospital queue monitor`, `
    <div class="row" style="margin-bottom:12px">
      <select id="qd" class="input" style="max-width:300px">
        ${state.doctors.slice(0, 5).map(d => `
          <option value="${d.id}" ${d.id === qDoc ? "selected" : ""}>
            ${d.name} (${d.dept})
          </option>`).join("")}
      </select>
    </div>

    <div class="grid stats">
      <div class="card serving">
        <span class="muted">Now Serving</span>
        <div class="token">${cur ? cur.token : "-"}</div>
        <b>${cur ? cur.name : "Nobody yet"}</b>
      </div>
      <div class="card serving">
        <span class="muted">Next in Line</span>
        <div class="token" style="color:var(--sky)">${wait[0] ? wait[0].token : "-"}</div>
        <b>${wait[0] ? wait[0].name : "Queue is clear"}</b>
      </div>
      ${statCard("people-fill", "Waiting Patients", wait.length, "#f4b740")}
      ${statCard("stopwatch", "Avg Wait (min)", wait.length ? Math.round(wait.reduce((n, q) => n + waitFor(q), 0) / wait.length) : 0, "#ef6a5b")}
    </div>

    <div class="card">
      <div class="row">
        <button class="btn" id="call"><i class="bi bi-megaphone"></i> Call Next</button>
        <button class="btn danger" id="skip"><i class="bi bi-skip-forward"></i> Skip</button>
        <button class="btn sky" id="done"><i class="bi bi-check2-all"></i> Complete Consultation</button>
        <button class="btn ghost" id="walk"><i class="bi bi-person-plus"></i> Walk-in Token</button>
      </div>
      <div style="margin-top:16px">${table(["Token", "Patient", "Status", "Est. Wait"], rows)}</div>
    </div>`);

  $("#qd").onchange = e => {
    qDoc = +e.target.value;
    pages.queue();
  };

  $("#call").onclick = () => {
    if (cur) return toast("Complete or skip current patient first.", "error");
    if (!wait.length) return toast("No patients waiting.", "error");
    API.updateQueueToken(wait[0].token, { status: "In Progress" });
    toast("Calling token " + wait[0].token);
    pages.queue();
  };

  $("#skip").onclick = () => {
    const t = cur || wait[0];
    if (!t) return toast("Nobody to skip.", "error");
    API.updateQueueToken(t.token, { status: "Skipped" });
    toast(t.token + " skipped", "error");
    pages.queue();
  };

  $("#done").onclick = () => {
    if (!cur) return toast("No consultation in progress.", "error");
    API.updateQueueToken(cur.token, { status: "Completed" });
    toast("Consultation completed");
    pages.queue();
  };

  $("#walk").onclick = () => {
    modal(`
      <h3>Walk-in Token Generator</h3>
      <label>Patient Full Name</label>
      <input id="wn" class="input" placeholder="e.g. Diya Kapoor">
      <div class="row" style="margin-top:16px">
        <button class="btn ghost" onclick="closeModal()">Close</button>
        <button class="btn" id="wgo">Generate Token</button>
      </div>`);
    $("#wgo").onclick = () => {
      const n = $("#wn").value.trim();
      if (!n) return toast("Enter patient name.", "error");
      const t = addQueue(n, qDoc);
      closeModal();
      toast("Token " + t + " generated successfully");
      pages.queue();
    };
  };

  animate();
};

// =============================================================================
// CAPACITY MANAGEMENT PAGE (Admin & Receptionist)
// =============================================================================
pages.capacity = () => {
  if (user.role === "Patient") {
    shell("Restricted", "Access Control", `
      <div class="restricted-card">
        <i class="bi bi-shield-lock-fill"></i>
        <h2>Restricted Area</h2>
        <p>This page is reserved for Clinic Staff. As a patient, you can book visits from your portal.</p>
        <a href="dashboard.html" class="btn"><i class="bi bi-house"></i> Return to Patient Portal</a>
      </div>`);
    return;
  }

  const info = state.doctors.map(d => {
    const b = bookedCount(d.id, today);
    return {
      d, b,
      c: state.appointments.filter(a => a.doctor === d.id && a.date === today && a.status === "Cancelled").length,
      pct: Math.round(b / d.cap * 100)
    };
  });

  const cap = info.reduce((n, x) => n + x.d.cap, 0);
  const bk = info.reduce((n, x) => n + x.b, 0);

  shell("Capacity Management", "Doctor capacity & workload allocation for today", `
    <div class="grid stats">
      ${statCard("grid", "Daily Capacity", cap, "#3b9ae1")}
      ${statCard("calendar-check", "Booked Slots", bk, "#0e9f9a")}
      ${statCard("grid-3x3-gap", "Available Slots", cap - bk, "#2fbf7a")}
      ${statCard("percent", "Utilization Rate", Math.round(bk / cap * 100), "#f4b740")}
    </div>
    <div class="grid three">
      ${info.map(({ d, b, c, pct }, i) => `
        <div class="card lift dcard">
          <div class="top">${avatar(d.name, i)}
            <div><b>${d.name}</b><br><span class="muted">${d.dept}</span></div>
          </div>
          <div class="bar"><i class="${pct > 85 ? "hot" : ""}" data-w="${pct}"></i></div>
          <div class="row" style="justify-content:space-between">
            <span><b>${pct}%</b> used</span>
            <span class="muted">${b} booked · ${d.cap - b} free · ${c} cancelled</span>
          </div>
          <div class="row" style="justify-content:space-between">
            <span>Available Today</span>
            <label class="switch" style="margin:0">
              <input type="checkbox" data-id="${d.id}" ${d.avail ? "checked" : ""}><span></span>
            </label>
          </div>
        </div>`).join("")}
    </div>
    <div class="card" style="margin-top:20px">
      <h3>Booked vs Available Slots by Doctor</h3>
      <canvas id="cCap" height="110"></canvas>
    </div>`);

  document.querySelectorAll(".switch input").forEach(i => i.onchange = () => {
    API.toggleDoctor(i.dataset.id, i.checked);
    toast(doc(i.dataset.id).name + (i.checked ? " marked Available" : " marked Unavailable"));
  });

  new Chart($("#cCap"), {
    type: "bar",
    data: {
      labels: info.map(x => x.d.name),
      datasets: [
        { label: "Booked", data: info.map(x => x.b), backgroundColor: "#0e9f9a", borderRadius: 6 },
        { label: "Free", data: info.map(x => x.d.cap - x.b), backgroundColor: "#bfeadf", borderRadius: 6 },
        { label: "Cancelled", data: info.map(x => x.c), backgroundColor: "#ef6a5b", borderRadius: 6 }
      ]
    },
    options: { scales: { x: { stacked: true }, y: { stacked: true } } }
  });

  animate();
};

// =============================================================================
// REPORTS PAGE (Admin only)
// =============================================================================
pages.reports = () => {
  if (user.role !== "Admin") {
    shell("Restricted", "Access Control", `
      <div class="restricted-card">
        <i class="bi bi-shield-lock-fill"></i>
        <h2>Restricted Area</h2>
        <p>Reports and data exports are reserved for Clinic Administrators.</p>
        <a href="dashboard.html" class="btn"><i class="bi bi-house"></i> Return to Dashboard</a>
      </div>`);
    return;
  }

  const all = state.appointments, depts = [...new Set(state.doctors.map(d => d.dept))];
  const rate = s => Math.round(all.filter(a => a.status === s).length / all.length * 100);

  shell("Reports", "Clinic Analytics & Data Export", `
    <div class="grid stats">
      ${statCard("check2-circle", "Completion Rate", rate("Completed") + "%", "#2fbf7a")}
      ${statCard("x-circle", "Cancellation Rate", rate("Cancelled") + "%", "#ef6a5b")}
      ${statCard("calendar3", "Total Consultations", all.length, "#3b9ae1")}
    </div>
    <div class="grid two">
      <div class="card"><h3>Appointments by Department</h3><canvas id="r1"></canvas></div>
      <div class="card"><h3>Weekly Patient Trend</h3><canvas id="r2"></canvas></div>
    </div>
    <button class="btn" id="csv" style="width:fit-content; margin-top:20px">
      <i class="bi bi-download"></i> Download Appointments (CSV)
    </button>`);

  new Chart($("#r1"), {
    type: "bar",
    data: {
      labels: depts,
      datasets: [{
        data: depts.map(d => all.filter(a => doc(a.doctor)?.dept === d).length),
        backgroundColor: COLORS,
        borderRadius: 8
      }]
    },
    options: { plugins: { legend: { display: false } } }
  });

  new Chart($("#r2"), {
    type: "line",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{
        label: "Patients",
        data: [42, 55, 48, 63, 58, 31, 27],
        borderColor: "#0e9f9a",
        backgroundColor: "rgba(14,159,154,.15)",
        fill: true,
        tension: 0.4
      }]
    },
    options: { plugins: { legend: { display: false } } }
  });

  $("#csv").onclick = () => {
    const csv = "Patient,Doctor,Date,Time,Status\n" + all.map(a =>
      [pat(a.patient)?.name || "Patient", doc(a.doctor)?.name || "Doctor", a.date, a.time, a.status].join(",")
    ).join("\n");

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "caresync-appointments.csv";
    link.click();
    toast("Appointments CSV downloaded");
  };

  animate();
};

// =============================================================================
// SETTINGS PAGE (Admin only)
// =============================================================================
pages.settings = () => {
  if (user.role !== "Admin") {
    shell("Restricted", "Access Control", `
      <div class="restricted-card">
        <i class="bi bi-shield-lock-fill"></i>
        <h2>Restricted Area</h2>
        <p>Clinic settings are reserved for Clinic Administrators.</p>
        <a href="dashboard.html" class="btn"><i class="bi bi-house"></i> Return to Dashboard</a>
      </div>`);
    return;
  }

  const s = state.settings;
  shell("Settings", "Clinic configuration & preferences", `
    <div class="card" style="max-width:560px">
      <h3>Clinic Configuration</h3>
      <form id="sForm">
        <label>Clinic Name</label>
        <input id="sc" class="input" value="${s.clinic}" required>

        <label>Average Consultation Duration (Minutes)</label>
        <input id="sa" class="input" type="number" min="1" max="60" value="${s.avg}" required>

        <label class="row" style="margin-top:14px">
          <input id="sn" type="checkbox" ${s.notify ? "checked" : ""}>
          Send SMS / Email appointment reminders
        </label>

        <div class="row" style="margin-top:24px">
          <button class="btn">Save Settings</button>
          <button type="button" class="btn ghost" id="reset">Reset Demo Data</button>
        </div>
      </form>
    </div>`);

  $("#sForm").onsubmit = e => {
    e.preventDefault();
    const a = +$("#sa").value;
    if (!$("#sc").value.trim() || a < 1) return toast("Enter clinic name and valid duration.", "error");
    s.clinic = $("#sc").value.trim();
    s.avg = a;
    s.notify = $("#sn").checked;
    API.saveSettings(s);
    toast("Settings saved successfully");
  };

  $("#reset").onclick = async () => {
    toast("Resetting demo data from MySQL...");
    await API.resetData();
    location.reload();
  };
};

// =============================================================================
// Launch current page
// =============================================================================
if (pages[PAGE]) {
  pages[PAGE]();
} else {
  pages.dashboard();
}
