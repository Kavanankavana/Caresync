// ===== data.js : sample data, backend API sync, and helper functions =====
// Connects to MySQL backend ('caresyncjava') at http://localhost:3000
// Automatically falls back to localStorage if the backend server is offline.

const BACKEND_URL = (window.location.protocol === 'http:' || window.location.protocol === 'https:') && window.location.port === '3000'
  ? ''
  : 'http://localhost:3000';

const API_BASE = BACKEND_URL + '/api';

const TIMES = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30",
               "14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"];

function dayOffset(n) { // date as YYYY-MM-DD, n days from today
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toLocaleDateString("en-CA");
}
const today = dayOffset(0);

function makeSample() {
  const names = ["Aarav Mehta","Diya Kapoor","Vihaan Reddy","Isha Menon","Arjun Patel",
                 "Kavya Sharma","Rahul Verma","Neha Joshi","Sameer Khan","Priya Nair"];
  const s = {
    settings: { clinic: "CareSync Clinic", avg: 8, notify: true },
    doctors: [
      { id: 1, name: "Dr. Ananya Rao",  dept: "Cardiology",       cap: 12, avail: true },
      { id: 2, name: "Dr. Rohan Iyer",  dept: "Dermatology",      cap: 10, avail: true },
      { id: 3, name: "Dr. Meera Nair",  dept: "Neurology",        cap: 8,  avail: true },
      { id: 4, name: "Dr. Kabir Shah",  dept: "Pediatrics",       cap: 14, avail: true },
      { id: 5, name: "Dr. Sana Khan",   dept: "General Medicine", cap: 16, avail: false }
    ],
    patients: names.map((n, i) => ({ id: i + 1, name: n, age: 24 + i * 4, phone: "98450 " + (11000 + i * 1371) })),
    appointments: [], queue: []
  };

  const booked = [9, 7, 6, 11, 5]; let id = 1;
  s.doctors.forEach((d, di) => {
    for (let i = 0; i < booked[di]; i++) {
      let status = i < 3 ? "Completed" : "Confirmed";
      if (i === booked[di] - 1 && di % 2 === 0) status = "Cancelled";
      s.appointments.push({ id: id++, patient: (i + di) % 10 + 1, doctor: d.id, date: today,
                            time: TIMES[i], status, reason: "Consultation" });
    }
  });

  [-5, -3, -1].forEach((n, i) => s.appointments.push({ id: id++, patient: i + 2, doctor: i + 1,
      date: dayOffset(n), time: "10:00", status: "Completed", reason: "Follow-up" }));
  [1, 2, 3].forEach((n, i) => s.appointments.push({ id: id++, patient: i + 5, doctor: i + 1,
      date: dayOffset(n), time: "11:30", status: "Confirmed", reason: "Check-up" }));

  const order = ["Completed", "In Progress", "Waiting", "Waiting", "Waiting"];
  [1, 2, 3, 4].forEach(did => order.forEach((st, i) => s.queue.push({
      token: s.doctors[did - 1].dept[0] + (101 + s.queue.filter(q => q.doctor === did).length),
      name: names[(did * 2 + i) % 10], doctor: did, status: st })));
  s.queue.push({ token: "C106", name: "Neha Joshi", doctor: 1, status: "Skipped" });
  return s;
}

let state = JSON.parse(localStorage.getItem("careSync") || "null") || makeSample();

function save() {
  localStorage.setItem("careSync", JSON.stringify(state));
}

// ----- Backend Connection State -----
let isBackendConnected = false;

function updateBackendPill(connected, dbName = "caresyncjava") {
  isBackendConnected = connected;
  const pill = document.getElementById("backendStatusPill");
  if (!pill) return;
  if (connected) {
    pill.className = "backend-pill connected";
    pill.innerHTML = `<span class="backend-dot"></span><span>MySQL: <b>${dbName}</b></span>`;
    pill.title = "Connected to MySQL database (" + dbName + ") via http://localhost:3000";
  } else {
    pill.className = "backend-pill disconnected";
    pill.innerHTML = `<span class="backend-dot"></span><span>Local Mode</span>`;
    pill.title = "Backend server offline. Using local browser storage. Run 'npm start' to connect MySQL.";
  }
}

// Fetch live state from MySQL on startup
async function fetchBackendState(andReRender = false) {
  try {
    const res = await fetch(`${API_BASE}/state`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Backend returned status " + res.status);
    const data = await res.json();
    if (data.success && data.state) {
      state = data.state;
      save();
      updateBackendPill(true, "caresyncjava");
      if (andReRender && typeof window.rerenderCurrentPage === "function") {
        window.rerenderCurrentPage();
      }
      return true;
    }
  } catch (e) {
    console.warn("CareSync Backend offline, running in Local Mode:", e.message);
    updateBackendPill(false);
    return false;
  }
}

// Trigger initial backend sync asynchronously
fetchBackendState(true);

// ----- small helpers -----
const doc = id => state.doctors.find(d => d.id == id);
const pat = id => state.patients.find(p => p.id == id);

function freeSlots(doctorId, date) {
  const d = doc(doctorId);
  if (!d) return [];
  return TIMES.slice(0, d.cap).filter(t => !state.appointments.some(a =>
    a.doctor == doctorId && a.date == date && a.time == t && a.status != "Cancelled"));
}

function bookedCount(doctorId, date) {
  return state.appointments.filter(a => a.doctor == doctorId && a.date == date && a.status != "Cancelled").length;
}

function waitFor(q) {
  const line = state.queue.filter(x => x.doctor == q.doctor && x.status == "Waiting");
  return (line.indexOf(q) + 1) * (state.settings?.avg || 8);
}

function avgWait() {
  const w = state.queue.filter(q => q.status == "Waiting");
  return w.length ? Math.round(w.reduce((n, q) => n + waitFor(q), 0) / w.length) : 0;
}

// Automatic token generator and registration
function addQueue(name, doctorId) {
  const doctorObj = doc(doctorId);
  const deptInitial = doctorObj ? doctorObj.dept[0] : "Q";
  const token = deptInitial + (101 + state.queue.filter(q => q.doctor == doctorId).length);
  const item = { token, name, doctor: Number(doctorId), status: "Waiting", date: today };
  state.queue.push(item);
  save();

  // Sync to MySQL in background
  if (isBackendConnected) {
    fetch(`${API_BASE}/queue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    }).catch(err => console.error("MySQL queue sync error:", err));
  }
  return token;
}

// API helper functions for MySQL synchronization
const API = {
  async addPatient({ name, age, phone }) {
    if (isBackendConnected) {
      try {
        const res = await fetch(`${API_BASE}/patients`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, age, phone })
        });
        const data = await res.json();
        if (data.success && data.patient) {
          state.patients.push(data.patient);
          save();
          return data.patient;
        }
      } catch (err) {
        console.warn("Failed to sync patient to backend, saving locally:", err);
      }
    }
    const newP = { id: state.patients.length + 1, name, age, phone };
    state.patients.push(newP);
    save();
    return newP;
  },

  async bookAppointment({ patient, doctor, date, time, reason, status = "Confirmed" }) {
    if (isBackendConnected) {
      try {
        const res = await fetch(`${API_BASE}/appointments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patient, doctor, date, time, reason, status })
        });
        const data = await res.json();
        if (data.success && data.appointment) {
          state.appointments.push(data.appointment);
          save();
          return data.appointment;
        }
      } catch (err) {
        console.warn("Failed to sync appointment to backend, saving locally:", err);
      }
    }
    const newA = { id: state.appointments.length + 1, patient, doctor, date, time, reason, status };
    state.appointments.push(newA);
    save();
    return newA;
  },

  async updateAppointment(id, updates) {
    const a = state.appointments.find(x => x.id === Number(id));
    if (a) {
      Object.assign(a, updates);
      save();
    }
    if (isBackendConnected) {
      try {
        await fetch(`${API_BASE}/appointments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates)
        });
      } catch (err) {
        console.warn("Failed to sync appointment update to backend:", err);
      }
    }
  },

  async updateQueueToken(tokenOrId, updates) {
    const q = state.queue.find(x => x.token === tokenOrId || x.id === Number(tokenOrId));
    if (q) {
      Object.assign(q, updates);
      save();
    }
    if (isBackendConnected) {
      try {
        const key = q ? (q.token || tokenOrId) : tokenOrId;
        await fetch(`${API_BASE}/queue/${key}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates)
        });
      } catch (err) {
        console.warn("Failed to sync queue update to backend:", err);
      }
    }
  },

  async toggleDoctor(id, avail) {
    const d = doc(id);
    if (d) {
      d.avail = avail;
      save();
    }
    if (isBackendConnected) {
      try {
        await fetch(`${API_BASE}/doctors/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avail })
        });
      } catch (err) {
        console.warn("Failed to sync doctor update to backend:", err);
      }
    }
  },

  async saveSettings(settings) {
    state.settings = settings;
    save();
    if (isBackendConnected) {
      try {
        await fetch(`${API_BASE}/settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings)
        });
      } catch (err) {
        console.warn("Failed to sync settings to backend:", err);
      }
    }
  },

  async resetData() {
    if (isBackendConnected) {
      try {
        const res = await fetch(`${API_BASE}/reset`, { method: "POST" });
        const data = await res.json();
        if (data.success && data.state) {
          state = data.state;
          save();
          return;
        }
      } catch (err) {
        console.warn("Backend reset failed, resetting locally:", err);
      }
    }
    localStorage.removeItem("careSync");
  }
};

function toast(msg, type) {
  let box = document.getElementById("toasts");
  if (!box) { box = document.createElement("div"); box.id = "toasts"; document.body.appendChild(box); }
  const t = document.createElement("div");
  t.className = "toast " + (type || "");
  t.innerHTML = `<i class="bi bi-${type === "error" ? "exclamation-circle-fill" : "check-circle-fill"}"></i>${msg}`;
  box.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
