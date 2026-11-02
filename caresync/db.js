const mysql = require('mysql2/promise');

// MySQL Connection Pool configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'tiger',
  database: process.env.DB_NAME || 'caresyncjava',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true // Return date & time as plain strings (YYYY-MM-DD, HH:mm:ss)
};

const pool = mysql.createPool(dbConfig);

// Helper for date calculation matching data.js
function dayOffset(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('en-CA');
}

const TIMES = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
];

// Verify and ensure tables and columns exist
async function initDatabase() {
  const conn = await pool.getConnection();
  try {
    // 1. Ensure doctors table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        department VARCHAR(60) NOT NULL,
        daily_slots INT NOT NULL DEFAULT 10,
        available TINYINT(1) NOT NULL DEFAULT 1,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check available column
    const [docCols] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'doctors' AND COLUMN_NAME = 'available'`,
      [dbConfig.database]
    );
    if (docCols.length === 0) {
      await conn.query(`ALTER TABLE doctors ADD COLUMN available TINYINT(1) NOT NULL DEFAULT 1`);
    }

    // 2. Ensure patients table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        age INT DEFAULT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Ensure appointments table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT NOT NULL AUTO_INCREMENT,
        patient_id INT NOT NULL,
        doctor_id INT NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        reason VARCHAR(255) DEFAULT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Confirmed',
        PRIMARY KEY (id),
        KEY patient_id (patient_id),
        KEY doctor_id (doctor_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check status column
    const [apptCols] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'appointments' AND COLUMN_NAME = 'status'`,
      [dbConfig.database]
    );
    if (apptCols.length === 0) {
      await conn.query(`ALTER TABLE appointments ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'Confirmed'`);
    }

    // 4. Ensure queue_tokens table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS queue_tokens (
        id INT NOT NULL AUTO_INCREMENT,
        doctor_id INT NOT NULL,
        patient_name VARCHAR(100) NOT NULL,
        token VARCHAR(10) NOT NULL,
        queue_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Waiting',
        PRIMARY KEY (id),
        KEY doctor_id (doctor_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Ensure clinic_settings table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS clinic_settings (
        setting_key VARCHAR(50) NOT NULL PRIMARY KEY,
        setting_value VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check if doctors table has records; if not, seed sample data
    const [docs] = await conn.query('SELECT COUNT(*) AS cnt FROM doctors');
    if (docs[0].cnt === 0) {
      console.log('Database tables are empty. Seeding initial CareSync demo data...');
      await seedDatabase(conn);
      console.log('✓ Initial CareSync demo data seeded successfully!');
    }
  } finally {
    conn.release();
  }
}

// Seed function to populate demo data
async function seedDatabase(externalConn) {
  const conn = externalConn || await pool.getConnection();
  try {
    // Disable foreign key checks for clean wipe
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('TRUNCATE TABLE queue_tokens');
    await conn.query('TRUNCATE TABLE appointments');
    await conn.query('TRUNCATE TABLE patients');
    await conn.query('TRUNCATE TABLE doctors');
    await conn.query('TRUNCATE TABLE clinic_settings');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    // Default settings
    await conn.query(`
      INSERT INTO clinic_settings (setting_key, setting_value) VALUES 
      ('clinic', 'CareSync Clinic'),
      ('avg', '8'),
      ('notify', 'true')
    `);

    // Doctors
    const sampleDoctors = [
      [1, "Dr. Ananya Rao", "Cardiology", 12, 1],
      [2, "Dr. Rohan Iyer", "Dermatology", 10, 1],
      [3, "Dr. Meera Nair", "Neurology", 8, 1],
      [4, "Dr. Kabir Shah", "Pediatrics", 14, 1],
      [5, "Dr. Sana Khan", "General Medicine", 16, 0]
    ];
    for (const d of sampleDoctors) {
      await conn.query(
        'INSERT INTO doctors (id, name, department, daily_slots, available) VALUES (?, ?, ?, ?, ?)',
        d
      );
    }

    // Patients
    const names = [
      "Aarav Mehta", "Diya Kapoor", "Vihaan Reddy", "Isha Menon", "Arjun Patel",
      "Kavya Sharma", "Rahul Verma", "Neha Joshi", "Sameer Khan", "Priya Nair"
    ];
    for (let i = 0; i < names.length; i++) {
      await conn.query(
        'INSERT INTO patients (id, name, age, phone) VALUES (?, ?, ?, ?)',
        [i + 1, names[i], 24 + i * 4, "98450 " + (11000 + i * 1371)]
      );
    }

    // Appointments
    const today = dayOffset(0);
    const booked = [9, 7, 6, 11, 5];
    let apptId = 1;

    for (let di = 0; di < sampleDoctors.length; di++) {
      const docId = sampleDoctors[di][0];
      for (let i = 0; i < booked[di]; i++) {
        let status = i < 3 ? "Completed" : "Confirmed";
        if (i === booked[di] - 1 && di % 2 === 0) status = "Cancelled";
        const patientId = ((i + di) % 10) + 1;
        await conn.query(
          'INSERT INTO appointments (id, patient_id, doctor_id, date, time, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [apptId++, patientId, docId, today, TIMES[i] + ":00", "Consultation", status]
        );
      }
    }

    // Past appointments
    const pastOffsets = [-5, -3, -1];
    for (let i = 0; i < pastOffsets.length; i++) {
      await conn.query(
        'INSERT INTO appointments (id, patient_id, doctor_id, date, time, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [apptId++, i + 2, i + 1, dayOffset(pastOffsets[i]), "10:00:00", "Follow-up", "Completed"]
      );
    }

    // Future appointments
    const futureOffsets = [1, 2, 3];
    for (let i = 0; i < futureOffsets.length; i++) {
      await conn.query(
        'INSERT INTO appointments (id, patient_id, doctor_id, date, time, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [apptId++, i + 5, i + 1, dayOffset(futureOffsets[i]), "11:30:00", "Check-up", "Confirmed"]
      );
    }

    // Queue tokens
    const queueOrder = ["Completed", "In Progress", "Waiting", "Waiting", "Waiting"];
    const docDepts = { 1: "C", 2: "D", 3: "N", 4: "P" };
    let qTokenSeq = { 1: 101, 2: 101, 3: 101, 4: 101 };

    for (const did of [1, 2, 3, 4]) {
      for (let i = 0; i < queueOrder.length; i++) {
        const token = docDepts[did] + (qTokenSeq[did]++);
        const patientName = names[(did * 2 + i) % 10];
        const status = queueOrder[i];
        await conn.query(
          'INSERT INTO queue_tokens (doctor_id, patient_name, token, queue_date, status) VALUES (?, ?, ?, ?, ?)',
          [did, patientName, token, today, status]
        );
      }
    }

    // Skipped token for doc 1
    await conn.query(
      'INSERT INTO queue_tokens (doctor_id, patient_name, token, queue_date, status) VALUES (?, ?, ?, ?, ?)',
      [1, "Neha Joshi", "C106", today, "Skipped"]
    );

  } finally {
    if (!externalConn) conn.release();
  }
}

// Queries for frontend state
async function getFullState() {
  const [docRows] = await pool.query('SELECT * FROM doctors ORDER BY id ASC');
  const [patRows] = await pool.query('SELECT * FROM patients ORDER BY id ASC');
  const [apptRows] = await pool.query('SELECT * FROM appointments ORDER BY date ASC, time ASC');
  const [qRows] = await pool.query('SELECT * FROM queue_tokens ORDER BY id ASC');
  const [setRows] = await pool.query('SELECT * FROM clinic_settings');

  const settings = { clinic: "CareSync Clinic", avg: 8, notify: true };
  setRows.forEach(r => {
    if (r.setting_key === 'avg') settings.avg = parseInt(r.setting_value, 10);
    else if (r.setting_key === 'notify') settings.notify = (r.setting_value === 'true');
    else settings[r.setting_key] = r.setting_value;
  });

  const doctors = docRows.map(d => ({
    id: d.id,
    name: d.name,
    dept: d.department,
    cap: d.daily_slots,
    avail: Boolean(d.available)
  }));

  const patients = patRows.map(p => ({
    id: p.id,
    name: p.name,
    age: p.age,
    phone: p.phone
  }));

  const appointments = apptRows.map(a => ({
    id: a.id,
    patient: a.patient_id,
    doctor: a.doctor_id,
    date: a.date,
    time: typeof a.time === 'string' ? a.time.slice(0, 5) : a.time,
    status: a.status || 'Confirmed',
    reason: a.reason || 'Consultation'
  }));

  const queue = qRows.map(q => ({
    id: q.id,
    token: q.token,
    name: q.patient_name,
    doctor: q.doctor_id,
    date: q.queue_date,
    status: q.status
  }));

  return { settings, doctors, patients, appointments, queue };
}

// Write operations
async function addPatient({ name, age, phone }) {
  const [res] = await pool.query(
    'INSERT INTO patients (name, age, phone) VALUES (?, ?, ?)',
    [name, age, phone]
  );
  return { id: res.insertId, name, age, phone };
}

async function addAppointment({ patient, doctor, date, time, reason, status }) {
  const timeFormatted = time.length === 5 ? time + ":00" : time;
  const [res] = await pool.query(
    'INSERT INTO appointments (patient_id, doctor_id, date, time, reason, status) VALUES (?, ?, ?, ?, ?, ?)',
    [patient, doctor, date, timeFormatted, reason || 'Consultation', status || 'Confirmed']
  );
  return { id: res.insertId, patient, doctor, date, time, reason, status: status || 'Confirmed' };
}

async function updateAppointment(id, { status, reason, time, date }) {
  const fields = [];
  const vals = [];
  if (status !== undefined) { fields.push('status = ?'); vals.push(status); }
  if (reason !== undefined) { fields.push('reason = ?'); vals.push(reason); }
  if (time !== undefined) {
    fields.push('time = ?');
    vals.push(time.length === 5 ? time + ":00" : time);
  }
  if (date !== undefined) { fields.push('date = ?'); vals.push(date); }

  if (fields.length === 0) return { success: true };
  vals.push(id);
  await pool.query(`UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`, vals);
  return { success: true };
}

async function addQueueToken({ doctor, name, token, status, date }) {
  const queueDate = date || dayOffset(0);
  const [res] = await pool.query(
    'INSERT INTO queue_tokens (doctor_id, patient_name, token, queue_date, status) VALUES (?, ?, ?, ?, ?)',
    [doctor, name, token, queueDate, status || 'Waiting']
  );
  return { id: res.insertId, doctor, name, token, date: queueDate, status: status || 'Waiting' };
}

async function updateQueueToken(tokenOrId, { status }) {
  if (typeof tokenOrId === 'number' || /^\d+$/.test(tokenOrId)) {
    await pool.query('UPDATE queue_tokens SET status = ? WHERE id = ?', [status, tokenOrId]);
  } else {
    await pool.query('UPDATE queue_tokens SET status = ? WHERE token = ?', [status, tokenOrId]);
  }
  return { success: true };
}

async function updateDoctor(id, { avail, cap, name, dept }) {
  const fields = [];
  const vals = [];
  if (avail !== undefined) { fields.push('available = ?'); vals.push(avail ? 1 : 0); }
  if (cap !== undefined) { fields.push('daily_slots = ?'); vals.push(cap); }
  if (name !== undefined) { fields.push('name = ?'); vals.push(name); }
  if (dept !== undefined) { fields.push('department = ?'); vals.push(dept); }

  if (fields.length === 0) return { success: true };
  vals.push(id);
  await pool.query(`UPDATE doctors SET ${fields.join(', ')} WHERE id = ?`, vals);
  return { success: true };
}

async function saveSettings(settings) {
  for (const [key, val] of Object.entries(settings)) {
    await pool.query(
      `INSERT INTO clinic_settings (setting_key, setting_value) VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [key, String(val), String(val)]
    );
  }
  return { success: true };
}

module.exports = {
  pool,
  dbConfig,
  initDatabase,
  seedDatabase,
  getFullState,
  addPatient,
  addAppointment,
  updateAppointment,
  addQueueToken,
  updateQueueToken,
  updateDoctor,
  saveSettings
};
