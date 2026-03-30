# 🚀 Job Portal Backend (Node.js + Express + MongoDB)

## 📌 Overview

This is a **production-level backend system** for a Job Portal application built using Node.js, Express, and MongoDB.
It supports authentication, role-based access control, job management, job applications, and resume uploads using Cloudinary.

---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas (Mongoose)
* **Authentication:** JWT (JSON Web Tokens)
* **Password Hashing:** bcrypt
* **File Upload:** Multer
* **Cloud Storage:** Cloudinary
* **Error Handling:** Custom global error handler

---

## ⚙️ Features Implemented

### 🔐 Authentication (Module 1 & 2)

* User registration (seeker / recruiter)
* User login with JWT
* Protected routes using middleware
* Role-based access control

---

### 💼 Job Management (Module 3)

* Recruiters can:

  * Create jobs
  * Update jobs
  * Delete jobs (only their own)
* Public can:

  * View all jobs
  * View job by ID

---

### 📄 Applications System (Module 4)

* Job seekers can:

  * Apply for jobs
  * View their applications
* Recruiters can:

  * View applicants for their jobs
  * Accept / reject applications

---

### 🔍 Search & Filtering (Module 5)

* Keyword search (title, company, description)
* Filter by:

  * Location
  * Company
  * Salary range
* Pagination support
* Sorting:

  * Latest
  * Oldest
  * Salary (ascending/descending)

---

### 📤 Resume Upload (Module 6)

* Upload resume (PDF only)
* File size limit: 2MB
* Stored in Cloudinary
* Resume linked to application

---

### ⚠️ Error Handling (Module 7)

* Global error handler
* Consistent JSON error responses:

```json
{
  "success": false,
  "message": "Error message"
}
```

* Async wrapper (no repeated try/catch)

---

## 📁 Project Structure

```
server/
│
├── config/
│   ├── db.js
│   ├── cloudinary.js
│
├── controllers/
│   ├── authController.js
│   ├── jobController.js
│   ├── applicationController.js
│
├── middleware/
│   ├── auth.js
│   ├── upload.js
│   ├── errorHandler.js
│
├── models/
│   ├── User.js
│   ├── Job.js
│   ├── Application.js
│
├── routes/
│   ├── authRoutes.js
│   ├── jobRoutes.js
│   ├── applicationRoutes.js
│   ├── adminRoutes.js
│
├── utils/
│   ├── generateToken.js
│   ├── AppError.js
│   ├── asyncHandler.js
│
├── app.js
└── server.js
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

## ▶️ How to Run the Project

### 1. Install dependencies

```
npm install
```

### 2. Start server

```
npm run dev
```

### 3. Server will run on:

```
http://localhost:5000
```

---

## 📮 API Endpoints

### 🔐 Auth

* POST `/api/auth/register`
* POST `/api/auth/login`
* GET `/api/auth/me`

---

### 💼 Jobs

* POST `/api/jobs` (Recruiter only)
* GET `/api/jobs`
* GET `/api/jobs/:id`
* PUT `/api/jobs/:id` (Owner only)
* DELETE `/api/jobs/:id` (Owner only)

---

### 📄 Applications

* POST `/api/applications/:jobId` (Seeker)
* GET `/api/applications/my` (Seeker)
* GET `/api/applications/job/:jobId` (Recruiter)
* PUT `/api/applications/:id` (Recruiter)

---

## 📸 Project Screenshots

### 🔐 Login

![Login](screenshots/login.png)

### 💼 Create Job

![Create Job](screenshots/create-job.png)

### 📄 Apply Job

![Apply Job](screenshots/apply-job.png)

### ☁️ Resume Upload (Cloudinary)

![Cloudinary](screenshots/cloudinary-upload.png)

### 🗄️ MongoDB Data

![MongoDB](screenshots/mongodb-data.png)

---

## 🧪 Testing

Tested using:

* Postman

Includes:

* Auth token verification
* Role-based access validation
* File upload testing
* Error handling validation

---

## ⚠️ Notes

* `.env` file is **not included** for security reasons
* Resume upload supports only PDF files
* Duplicate job applications are prevented

---

## 📌 Future Improvements

* Frontend integration (React)
* Email notifications
* Resume parsing
* Admin dashboard
* Deployment (AWS / Render / Vercel)

---

## 👤 Author

**Harish S**
Backend Developer (Node.js | MongoDB)

---

## 📄 License

This project is developed for educational and internship submission purposes.
