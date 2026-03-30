# 🚀 Job Portal Backend (Node.js + Express + MongoDB)

## 📌 Overview

This is a **production-level backend system** for a Job Portal application.
It supports authentication, job management, applications, resume uploads, and role-based access control.

The system is built using **Node.js, Express, MongoDB Atlas, and Cloudinary**.

---

## 🧠 Key Features

### 🔐 Authentication & Authorization

* User registration and login
* JWT-based authentication
* Role-based access control (Seeker / Recruiter)

### 💼 Job Management

* Recruiters can create, update, delete jobs
* Public job listing and job details
* Ownership-based access control

### 📄 Applications System

* Job seekers can apply to jobs
* Prevents duplicate applications
* Recruiters can view applicants
* Recruiters can accept/reject applications

### ☁️ Resume Upload

* Upload PDF resumes using Multer
* Files stored in Cloudinary
* Resume linked to application

### 🔎 Search & Filtering

* Keyword search (title, company, description)
* Location & company filtering
* Salary range filtering
* Pagination & sorting

### ⚙️ Error Handling

* Global error handler
* Async wrapper for clean controllers
* Standardized JSON error responses

---

## 🏗️ Tech Stack

* **Backend:** Node.js, Express
* **Database:** MongoDB Atlas (Mongoose)
* **Authentication:** JWT, bcrypt
* **File Upload:** Multer
* **Cloud Storage:** Cloudinary

---

## 📁 Project Structure

```
server/
├── config/         # DB & Cloudinary config
├── controllers/    # Business logic
├── middleware/     # Auth, error handling, upload
├── models/         # Mongoose schemas
├── routes/         # API routes
├── utils/          # Helpers (JWT, async handler)
└── server.js       # Entry point
```

---

## 🔑 Environment Variables

Create a `.env` file in the root:

```
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## ▶️ Running the Project

```
npm install
npm run dev
```

Server runs at:

```
http://localhost:5000
```

---

## 📡 API Endpoints

### Auth

* POST `/api/auth/register`
* POST `/api/auth/login`
* GET `/api/auth/me`

### Jobs

* POST `/api/jobs` (Recruiter)
* GET `/api/jobs`
* GET `/api/jobs/:id`
* PUT `/api/jobs/:id` (Owner)
* DELETE `/api/jobs/:id` (Owner)

### Applications

* POST `/api/applications/:jobId` (Seeker)
* GET `/api/applications/my`
* GET `/api/applications/job/:jobId` (Recruiter)
* PUT `/api/applications/:id` (Recruiter)

---

## 📸 Project Screenshots

### 🔐 Authentication

![Login](screenshots/login.png)

### 🧑‍💼 Job Creation (Recruiter)

![Create Job](screenshots/create-job.png)

### 📄 Apply Job (Resume Upload)

![Apply Job](screenshots/apply-job.png)

### ☁️ Cloudinary Resume Upload

![Cloudinary](screenshots/cloudinary-upload.png)

### 🗄️ MongoDB Data

![MongoDB](screenshots/mongodb-data.png)

---

## 📊 Current Status

✅ Authentication Module
✅ Job Module
✅ Application Module
✅ Resume Upload (Cloudinary)
✅ Search & Filtering
✅ Global Error Handling

🚧 Further improvements possible:

* Frontend integration
* Notifications system
* Admin dashboard

---

## 👨‍💻 Author

**Harish S**

---

## 📌 Note

This project was developed as part of the **RISE Internship Program**.
The implementation focuses on backend architecture, scalability, and real-world practices.
