# 🎓 College Event Management System

A beginner-friendly, clean, and fully functional **College Event Management System** built with **HTML5, CSS3, Vanilla JavaScript, Node.js, Express.js, and MySQL**.

Designed specifically for college projects, mini-projects, or learning full-stack web development without complex frameworks or over-engineering.

---

## ✨ Features

### 👤 Student Features
- **Account Registration & Login**: Students can create an account with name, college email, roll number, and department.
- **Browse Upcoming Events**: View campus hackathons, workshops, fests, and sports matches with date, time, venue, and department.
- **Seat Availability Tracking**: Real-time display of booked and remaining seats with visual progress bars.
- **Event Registration**: Reserve seats with one click.
- **Duplicate Prevention**: Prevents students from registering twice for the same event.
- **Seat Capacity Limit**: Automatically closes registration and disables booking when seats are full.
- **Student Dashboard**: View all personal event registrations in one place, with an option to cancel seats (freeing them up for other students).

### 🛡️ Admin Features
- **Admin Authentication**: Dedicated administrator role and credentials.
- **Event Management (CRUD)**:
  - **Add Event**: Specify event name, department, date, time, venue, total seats, and description.
  - **Edit Event**: Modify details and seat capacity (prevents reducing capacity below currently registered student count).
  - **Delete Event**: Removes the event and automatically cleans up related registrations.
- **Student Attendee Rosters**: View a complete list of students registered for any specific event (Name, Email, Roll Number, Department, Registration Timestamp).
- **Live Statistics**: Summary counters for Total Events, Total Registrations, and Total Campus Seats.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (ES6) | Responsive layout, modern UI cards, modals, and fetch API without external frameworks. |
| **Backend** | Node.js & Express.js | Clean REST API routing, session management, and role-based middleware. |
| **Database** | MySQL (with `mysql2/promise`) | Relational database with foreign keys, unique composite keys, and transaction support. |
| **Authentication** | `bcryptjs` & `express-session` | Secure password hashing and server-side user sessions. |

---

## 📁 Project Directory Structure

```text
College-Event-Management/
├── .env                  # Environment variables (Database credentials & Port)
├── .env.example          # Template for environment settings
├── package.json          # Node.js project dependencies & run scripts
├── README.md             # Project documentation & instructions
├── database/
│   ├── schema.sql        # Raw SQL schema queries
│   └── init-db.js        # Automated script to create database, tables & seed data
├── src/
│   ├── config/
│   │   └── db.js         # MySQL connection pool configuration
│   ├── middleware/
│   │   └── auth.js       # Session check & role authorization (Admin / Student)
│   ├── routes/
│   │   ├── auth.js       # /api/auth (register, login, logout, me)
│   │   ├── events.js     # /api/events (CRUD & attendee roster)
│   │   └── registrations.js # /api/registrations (booking, duplicate check, seat limit)
│   └── server.js         # Express web server & static file hosting
└── public/
    ├── css/
    │   └── style.css     # Modern responsive styling, cards, tables, modals
    ├── js/
    │   └── api.js        # Reusable fetch client, auth session helper & toasts
    ├── index.html        # Public event catalog & seat booking
    ├── login.html        # Student & Admin login page (with 1-click demo fill)
    ├── register.html     # Student registration page
    ├── student-dashboard.html # Student dashboard with registered events
    └── admin-dashboard.html   # Admin dashboard with event CRUD & student lists
```

---

## 🚀 Quick Setup Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v16 or higher)
- **MySQL Server 8.0** (running locally on port 3306)

---

### 2. Configure Database Credentials

Open the `.env` file in the root folder and verify your MySQL root password:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_ROOT_PASSWORD
DB_NAME=college_event_db
DB_PORT=3306
SESSION_SECRET=college_event_management_super_secret_key_2026
```

> **Note**: If your MySQL `root` user has no password, leave `DB_PASSWORD=` empty.

---

### 3. Install Dependencies

In your terminal / PowerShell, navigate to the project directory and run:

```bash
npm install
```

---

### 4. Initialize Database & Seed Demo Data

Run the automated database initialization script:

```bash
npm run db:init
```

This single command will:
1. Create the `college_event_db` database if it doesn't already exist.
2. Create `users`, `events`, and `registrations` tables with foreign keys and unique constraints.
3. Seed the **Default Admin** account.
4. Seed a **Demo Student** account.
5. Populate **4 realistic college events** across Computer Science, Electronics, Cultural, and Sports.

---

### 5. Start the Application

Start the Express web server:

```bash
npm start
```

For automatic server reload during development, you can run:

```bash
npm run dev
```

---

### 6. Open in Browser

Visit **`http://localhost:3000`** in your web browser.

---

## 🔑 Default Demo Accounts

For easy testing, you can use these pre-seeded accounts:

| Role | Email | Password | What You Can Test |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@college.edu` | `admin123` | Add/Edit/Delete events, view registered students roster, monitor seats. |
| **Student** | `rahul@student.edu` | `student123` | Register for events, view dashboard, cancel seats. |

*(The login page also has handy "Quick Autofill" buttons to test both accounts instantly!)*

---

## 🌐 API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a student (`name`, `email`, `password`, `roll_number`, `department`).
- `POST /api/auth/login` - Authenticate student or admin (`email`, `password`).
- `POST /api/auth/logout` - Destroy session and log out.
- `GET /api/auth/me` - Get current logged-in user profile.

### Events (`/api/events`)
- `GET /api/events` - Get all events with remaining seats and registration status for current user.
- `GET /api/events/:id` - Get single event details.
- `POST /api/events` - *(Admin Only)* Create a new college event.
- `PUT /api/events/:id` - *(Admin Only)* Update an existing event.
- `DELETE /api/events/:id` - *(Admin Only)* Delete an event and clean up registrations.
- `GET /api/events/:id/attendees` - *(Admin Only)* View list of students registered for an event.

### Registrations (`/api/registrations`)
- `POST /api/registrations/:eventId` - *(Student Only)* Register for an event (checks seat limit & prevents duplicates).
- `DELETE /api/registrations/:eventId` - *(Student Only)* Cancel registration (frees up a seat).
- `GET /api/registrations/my-events` - *(Student Only)* Get list of events registered by the current student.

---

## 🛡️ Data Validation & Business Rules

1. **Duplicate Registration Prevention**:
   - The database enforces a `UNIQUE KEY (user_id, event_id)` constraint on the `registrations` table.
   - The registration endpoint also explicitly queries for existing registrations and returns a friendly `400 Bad Request` if duplicate.
2. **Capacity Enforcement**:
   - The registration transaction locks the event row, calculates current registrations against total capacity, and blocks registration if `count >= seats`.
3. **Safe Event Updates**:
   - Admins cannot reduce total seats below the number of students already registered for that event.

---

## 📄 License
This project is open-source and free to use for academic, college, and educational purposes.
