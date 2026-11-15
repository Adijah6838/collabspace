# CollabSpace — Real-Time Collaborative Document Platform

A professional, full-stack collaborative document editor where multiple users can write, edit, and manage documents simultaneously. Built as part of the Advanced Full-Stack Software Engineering Challenge.

## 🚀 Tech Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Zustand (State), TipTap (Rich Text), Socket.IO Client.
- **Backend:** Node.js, Express.js, TypeScript, Socket.IO (Real-Time), Prisma ORM, Zod (Validation), JWT (Auth).
- **Database:** PostgreSQL (via Docker).
- **Testing:** Vitest, Supertest (Backend).

## ✨ Features Implemented
- **Authentication:** Secure JWT-based registration and login with bcrypt password hashing.
- **Workspaces:** Create workspaces and organize documents.
- **Document Editor:** Rich-text editor with headings, bold, italics, and lists (powered by TipTap).
- **Real-Time Collaboration:** Live document syncing, active collaborator indicators, and conflict prevention using a server-authoritative revision system.
- **Version History:** Every save creates a snapshot. Users can view and restore previous versions.
- **Comments:** Threaded discussion panel for document feedback.
- **Automated Testing:** Comprehensive backend integration tests covering authentication, workspaces, and documents.

## 📂 Project Structure
- `backend/` — Express + Socket.IO + Prisma API.
- `frontend/` — React single-page application.
- `docker-compose.yml` — PostgreSQL database container.

## ⚙️ Installation & Setup

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/) (v18+)

### 1. Start the Database
```bash
docker compose up -d