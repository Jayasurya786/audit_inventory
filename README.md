## Audit Log Dashboard
A simple full-stack dashboard to upload and explore security audit logs.
This project has:
- Backend: Node.js + Express + MongoDB
- Frontend: React + Vite
Main goal is to make it easy to:
- Upload logs in bulk JSON array
- Search and filter logs
- Sort and paginate results
- View audit records in a clean table UI
## Project Structure
backend/
  package.json
  server.js
  controllers/
  models/
  routes/
frontend/
  package.json
  vite.config.js
  src/
## Features
- Bulk upload endpoint for log ingestion
- Server-side filtering (severity, status, actor, role, action, region, etc.)
- Search across common log fields
- Server-side pagination
- Server-side sorting
- Health check endpoint
- MongoDB indexes for better query performance
## Tech Stack
### Backend
- Express
- Node
- Mongoose
- CORS
- dotenv
- nodemon
### Frontend
- React
- Vite
## Environment Variables
Create a .env file inside backend folder.
## Setup and Run
Open two terminals from project root.
### 1 Start Backend
bash
cd backend
npm install
npm start
Backend runs on:
- http://localhost:5000
### 2 Start Frontend
bash
cd frontend
npm install
npm run dev
Frontend runs on:
- http://localhost:5173
## API Endpoints
Base URL:
- http://localhost:5000
### Health Check
- GET /api/health
Response example:
{
  "status": "ok",
  "message": "Server is Running"
}
### Upload Logs (Bulk)
- POST /api/logs/upload
- Body: JSON array of log objects
Sample payload:
[
  {
    "actor": "priya.nair@company.com",
    "role": "admin",
    "action": "DELETE_USER",
    "resource": "/api/users/334",
    "resourceType": "USER",
    "ipAddress": "192.168.1.45",
    "region": "ap-south-1",
    "severity": "HIGH",
    "status": "Unresolved",
    "timestamp": "2025-06-14T08:32:11Z"
  }
]
### Get Logs
- GET /api/logs
Supported query params:
- search
- actor
- role
- action
- resource
- resourceType
- ipAddress
- region
- severity
- status
- page
- limit
- sortBy
- sortOrder (asc or desc)
Example:
GET /api/logs?search=admin&severity=HIGH&page=1&limit=25&sortBy=timestamp&sortOrder=desc
## Log Schema (Important Fields)
Each log includes:
- actor
- role
- action
- resource
- resourceType
- ipAddress
- region
- severity: LOW | MEDIUM | HIGH | CRITICAL
- status: Unresolved | Resolved | Investigating
- timestamp
## Author Note
This project is built as a practical audit-log viewer for learning and demo purposes. Feel free to improve structure, validation, and testing as next steps.
