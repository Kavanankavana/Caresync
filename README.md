# 🏥 CareSync

> **Shorter waits. Calmer clinics.**  
> An integrated healthcare appointment booking, doctor capacity planning, and live queue management system.

---

## 📸 Screenshots & Previews

### 📊 Admin Command Center
Full clinic oversight, patient traffic flow, department workload, and executive analytics.
![Admin Dashboard](screenshots/dashboard.png)

---

### 🎟️ Real-Time Queue Management & Token System
Live token tracker with instant status updates, walk-in token generation, and consultation controls.
![Live Queue Monitor](screenshots/queue.png)

---

### 👨‍⚕️ Doctor Capacity & Workload Allocation
Track booked vs. available slots by doctor and department with automatic availability toggles.
![Doctor Capacity](screenshots/capacity.png)

---

### 🔐 Multi-Role Authentication
Role-tailored interfaces and permissions for **Admin**, **Doctor**, **Receptionist**, and **Patient**.
![CareSync Sign In](screenshots/login.png)

---

## 🌟 Key Features

- **Multi-Role Portals**:
  - **Admin**: Executive clinic overview, real-time analytics, capacity planning, and system configurations.
  - **Doctor**: Consultation console, personal patient queue, vitals tracking, and follow-up booking.
  - **Receptionist**: Front desk intake, instant walk-in token issuance, and patient check-ins.
  - **Patient**: Personal health portal, live token tracker with estimated wait times, and appointment scheduling.
- **Dynamic Token & Live Queue Engine**: Automatic token generation (e.g., `C101`, `C102`), consultation timers, and queue status transitions (*Waiting*, *In Progress*, *Completed*, *Skipped*).
- **Interactive Analytics**: Dynamic Chart.js visualizations for appointment status breakdown and hourly patient traffic flow.
- **Offline / Local Mode Support**: Built-in mock data engine using browser `localStorage` allows instant demo usage without mandatory database configuration.
- **Full Backend Support**:
  - **Spring Boot & Hibernate Backend**: Enterprise-grade Java backend using Spring Boot 3, Spring Data JPA, Hibernate ORM, and MySQL.
  - **Node.js**: Express server with MySQL connection pooling and RESTful API endpoints.
  - **Legacy Core Java**: Standalone Java HTTP server with raw JDBC connectivity preserved for comparison.

---

## 📁 Project Structure

```text
caresync/
├── screenshots/                  # Project screenshots for documentation
│   ├── dashboard.png
│   ├── queue.png
│   ├── capacity.png
│   └── login.png
├── caresync/                     # Web Application
│   ├── css/
│   │   └── style.css             # Unified modern clinical UI stylesheet
│   ├── js/
│   │   ├── app.js                # Role navigation, rendering, and UI logic
│   │   ├── data.js               # Demo dataset & localStorage state management
│   │   └── login.js              # Authentication and role switcher
│   ├── java-backend/             # Spring Boot & Hibernate Backend
│   │   ├── pom.xml               # Maven configuration (Spring Boot 3 + JPA/Hibernate)
│   │   ├── run-backend.bat       # Quick-launch script for Windows
│   │   ├── legacy-raw-jdbc/      # Reference raw JDBC server
│   │   │   ├── CareSyncServer.java
│   │   │   └── DBConnection.java
│   │   └── src/main/
│   │       ├── java/com/caresync/
│   │       │   ├── CareSyncApplication.java   # @SpringBootApplication
│   │       │   ├── config/CorsConfig.java     # Global CORS configuration
│   │       │   ├── model/                     # Hibernate @Entity mappings
│   │       │   │   ├── Doctor.java
│   │       │   │   ├── Patient.java
│   │       │   │   ├── Appointment.java
│   │       │   │   ├── QueueToken.java
│   │       │   │   └── ClinicSetting.java
│   │       │   ├── repository/                # Spring Data JPA Repositories
│   │       │   │   ├── DoctorRepository.java
│   │       │   │   ├── PatientRepository.java
│   │       │   │   ├── AppointmentRepository.java
│   │       │   │   ├── QueueTokenRepository.java
│   │       │   │   └── ClinicSettingRepository.java
│   │       │   ├── service/                   # Business Service & Data Seeder
│   │       │   │   ├── ClinicService.java
│   │       │   │   └── DataSeederService.java
│   │       │   └── controller/                # REST Controllers (@RestController)
│   │       │       ├── StatusController.java
│   │       │       ├── StateController.java
│   │       │       ├── DoctorController.java
│   │       │       ├── PatientController.java
│   │       │       ├── AppointmentController.java
│   │       │       ├── QueueController.java
│   │       │       └── SettingsController.java
│   │       └── resources/
│   │           └── application.properties     # Spring datasource & Hibernate settings
│   ├── index.html                # Sign-in portal
│   ├── dashboard.html            # Main clinic dashboard
│   ├── queue.html                # Live queue & token tracker
│   ├── appointments.html         # Appointments management
│   ├── book.html                 # Book appointment / walk-in
│   ├── capacity.html             # Doctor workload and capacity
│   ├── patients.html             # Patient records registry
│   ├── doctors.html              # Doctor directory & profiles
│   ├── reports.html              # Clinic reports & analytics
│   ├── settings.html             # System configuration
│   └── server.js                 # Express server & API endpoints
├── server.js                     # Root entry point
├── package.json                  # Node.js dependencies
└── README.md                     # Project documentation
```

---

## 🚀 Getting Started

### 1. Instant Preview (Frontend Standalone)
You can test the frontend immediately without setting up a backend or database:
1. Open [`caresync/index.html`](caresync/index.html) in any modern browser.
2. Select any role (**Admin**, **Doctor**, **Receptionist**, or **Patient**).
3. The demo credentials are auto-filled—click **Sign in** to enter the portal.

---

### 2. Node.js Backend (Optional)
To run the Node.js API server:

```bash
# Install dependencies
npm install

# Start the server
npm start
```
The server will start on `http://localhost:3000`.

---

### 3. Spring Boot & Hibernate Backend (Java)
To run the enterprise Spring Boot & Hibernate API server:

```bash
cd caresync/java-backend
mvn spring-boot:run
```
*Or double-click `run-backend.bat` / run `CareSyncApplication.java` in IntelliJ IDEA or Eclipse.*  
The Spring Boot server will start on `http://localhost:8080` with automatic table schema updates via Hibernate (`spring.jpa.hibernate.ddl-auto=update`) and auto-seed demo data if tables are empty.

---

### 4. Legacy Core Java Backend (Reference)
To run the standalone raw JDBC HTTP server:

```bash
cd caresync/java-backend/legacy-raw-jdbc
javac -d ../bin *.java
java -cp ../bin com.caresync.CareSyncServer
```

---

## 🛠️ Built With

- **Frontend**: HTML5, Modern CSS3, JavaScript (ES6+), [Chart.js](https://www.chartjs.org/), [Bootstrap Icons](https://icons.getbootstrap.com/)
- **Spring Boot & Hibernate Backend**: Spring Boot 3, Spring Data JPA, Hibernate 6, MySQL Connector/J
- **Node.js Backend**: Express.js, MySQL2
- **Database**: MySQL (`caresyncjava`)

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
