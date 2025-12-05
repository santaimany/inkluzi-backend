# Inkluzi MBG Backend API

[![NestJS](https://img.shields.io/badge/NestJS-v11-E0234E?logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-v7-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker)](https://www.docker.com/)

Backend API untuk platform **Inkluzi** - Sistem monitoring dan manajemen makanan bergizi untuk anak berkebutuhan khusus di sekolah.

## 🚀 Features

- **Authentication & Authorization** - JWT-based auth dengan role-based access control (Admin, SPPG, Sekolah)
- **User Management** - Manajemen user SPPG dan Sekolah dengan approval system
- **School Assignment** - Assignment sekolah ke SPPG untuk monitoring
- **Menu Management** - CRUD menu makanan dengan kandungan gizi lengkap
- **Nutrition Analysis** - AI-powered nutrition analysis menggunakan Google Gemini
- **Food Scanning** - Upload dan analisis foto makanan
- **Reporting System** - Sistem pelaporan untuk monitoring makanan sekolah
- **Email Notifications** - Email activation/deactivation menggunakan SendGrid
- **API Documentation** - Interactive Swagger/OpenAPI documentation

## 🛠️ Tech Stack

- **Framework**: NestJS v11
- **Database**: PostgreSQL 16 dengan Prisma ORM v7
- **Authentication**: JWT (Access & Refresh Token)
- **File Upload**: Cloudinary
- **Email Service**: SendGrid SMTP / Nodemailer
- **AI Integration**: Google Gemini API
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Reverse Proxy**: NGINX with SSL (Let's Encrypt)

## 📋 Prerequisites

- Node.js v20+
- PostgreSQL 16
- Docker & Docker Compose (for production)
- Google Gemini API Key
- Cloudinary Account
- SendGrid Account (for email)

## 🔧 Installation

### 1. Clone Repository
```bash
git clone https://github.com/santaimany/inkluzi-backend.git
cd inkluzi-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy `.env.example` ke `.env` dan isi dengan credentials Anda

### 4. Database Setup
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npm run db:seed
```

### 5. Run Development Server
```bash
npm run start:dev
```

API akan berjalan di `http://localhost:3000`

Swagger docs: `http://localhost:3000/api/docs`

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
# Build image
docker build -t inkluzi-backend .

# Run dengan docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 API Endpoints

### Authentication
```
POST   /auth/register/sppg      - Register SPPG user
POST   /auth/register/sekolah   - Register school user
POST   /auth/login              - Login
POST   /auth/refresh            - Refresh access token
POST   /auth/logout             - Logout
```

### Admin - User Management
```
GET    /admin/users             - Get all users (with filters)
GET    /admin/users/:id         - Get user detail
PATCH  /admin/users/:id         - Update user status
DELETE /admin/users/:id         - Delete user
POST   /admin/sppg/:id          - Assign schools to SPPG
DELETE /admin/schools/:id        - Unassign school from SPPG
```

### SPPG - Menu Management
```
GET    /sppg/menus              - Get all menus created by SPPG
GET    /sppg/menus/:id          - Get menu detail
POST   /sppg/menus              - Create menu for all assigned schools
PUT    /sppg/menus/:id          - Update menu
DELETE /sppg/menus/:id          - Delete menu
```

### SPPG - Schools
```
GET    /sppg/schools            - Get assigned schools list
GET    /sppg/schools/:id        - Get school detail
```

### School - Menus
```
GET    /school/menus            - Get menus assigned to school
GET    /school/menus/:id        - Get menu detail
```

### Nutrition Analysis
```
GET    /nutrition/menus/:id     - Get AI-generated nutrition analysis
```

### Food Scan
```
POST   /food-scan               - Upload & analyze food image
GET    /food-scan               - Get scan history
GET    /food-scan/:id           - Get scan detail
```

### SPPG - Reports
```
GET    /sppg/reports            - Get reports from assigned schools
GET    /sppg/reports/:id        - Get report detail
PATCH  /sppg/reports/:id        - Update report status
```

### School - Reports
```
POST   /school/reports          - Submit new report
GET    /school/reports          - Get own reports history
GET    /school/reports/:id      - Get report detail
```

### Profile
```
GET    /profile                 - Get own profile
PUT    /profile                 - Update profile
POST   /profile/photo           - Update profile photo
```

Full API documentation tersedia di `/api/docs` setelah server running.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run specific test file
npm test auth.service.spec.ts

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

## 📁 Project Structure

```
src/
├── config/                 # Configuration files
├── core/                   # Core modules (Prisma, etc)
├── modules/               
│   ├── admin/             # Admin management
│   ├── auth/              # Authentication & Authorization
│   ├── food-scan/         # Food scanning feature
│   ├── menus/             # Menu CRUD & nutrition
│   ├── profile/           # User profile management
│   ├── reports/           # Reporting system
│   └── schools/           # School management
├── shared/                # Shared services
│   ├── cloudinary/        # Image upload service
│   ├── email/             # Email service
│   └── ml/                # AI/ML services (Gemini)
├── app.module.ts          # Root module
└── main.ts                # Application entry point

prisma/
├── schema.prisma          # Database schema
├── migrations/            # Database migrations
└── seed.ts               # Database seeding

test/                      # E2E tests
```

## 🔒 Security Features

- ✅ **HTTPS/SSL** - Let's Encrypt certificate
- ✅ **JWT Authentication** - Access & refresh token strategy
- ✅ **Rate Limiting** - Prevent brute force & DDoS
- ✅ **CORS** - Whitelist domain yang diizinkan
- ✅ **Helmet** - Security headers (XSS, clickjacking protection)
- ✅ **Input Validation** - class-validator untuk semua DTOs
- ✅ **Password Hashing** - bcrypt dengan salt rounds
- ✅ **Role-based Access Control** - Guard untuk setiap endpoint

## 🚀 Deployment

Project ini menggunakan **GitHub Actions CI/CD** untuk automated deployment ke VPS.

### Production URL
- API: `https://api.inkluzi.my.id/api/v1`
- Docs: `https://api.inkluzi.my.id/api/docs`

### CI/CD Pipeline
1. Push ke branch `main` → trigger GitHub Actions
2. Build Docker image
3. Push image ke Docker Hub / Registry
4. Deploy ke VPS via SSH
5. Run migrations & restart containers

## 👨‍💻 Author

**Santaimany**
- GitHub: [@santaimany](https://github.com/santaimany)
- Email: santaimany@gmail.com

---

**Made with ❤️ for MBG Gizi Inklusif**
