# IPBlogs

A full-stack blogging platform where users can create, view, and manage blog posts. Built with a modern tech stack using Node.js, Express, and Next.js, with Docker support for easy deployment.

---

## Features
- User authentication and profile management
- Create, edit, and delete blog posts
- Comment on posts
- Responsive UI with dark mode toggle
- Cloudinary integration for image uploads

---

## Tech Stack
- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** (Configured in backend, e.g., SQLite/MySQL/PostgreSQL)
- **Image Hosting:** Cloudinary
- **Containerization:** Docker, Docker Compose

---

## Project Structure
```
IPBlogs/
  backend/         # Express backend API
    src/
      config/      # Database config
      data/        # SQL scripts and seed data
      middleware/  # Express middlewares
      models/      # Database models
      routes/      # API routes (auth, posts)
      utils/       # Utility functions (e.g., Cloudinary)
  frontend/        # Next.js frontend app
    src/
      app/         # App pages and layout
      components/  # React components
      context/     # React context (e.g., Theme)
  docker-compose.yml
  README.md
```

---

## Setup & Installation

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- Docker (optional, for containerized setup)

### 1. Clone the repository
```bash
git clone <repo-url>
cd IPBlogs
```

### 2. Install dependencies
#### Backend
```bash
cd backend
npm install
```
#### Frontend
```bash
cd ../frontend
npm install
```

### 3. Configure Environment Variables
- Backend: Create a `.env` file in `backend/` for DB and Cloudinary config.
- Frontend: Add any required environment variables in `frontend/`.

### 4. Run the app locally
#### Backend
```bash
cd backend
npm start
```
#### Frontend
```bash
cd frontend
npm run dev
```

---

## Usage
- Access the frontend at `http://localhost:3000`
- Backend API runs at `http://localhost:5000` (default)

---

## Docker & Deployment

### Using Docker Compose
```bash
docker-compose up --build
```
- This will start both frontend and backend containers.
- Configure environment variables in `docker-compose.yml` as needed.

---

## Contributing
1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---
