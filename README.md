# 🚗 DAD - Drink and Drive Safety System (Backend + Admin Portal)

A full-stack application built with **Next.js 16**, **TypeScript**, **Prisma ORM**, and **SQLite** that helps intoxicated drivers get home safely by connecting them with verified drivers, riders, and partner hotels.

## 📋 Features (Stage 1)

| Feature | Description |
|---------|-------------|
| ✅ **Driver Registration** | Signup with license details, 2-side license photos (front/back), vehicle information |
| ✅ **Rider Registration** | Signup with personal details + emergency contact information |
| ✅ **Hotel Registration** | Signup with hotel details, license number, and hotel image |
| ✅ **Admin Portal** | Review and approve/reject all registrations |
| ✅ **Authentication** | Login, signup, logout with JWT tokens |
| ✅ **File Uploads** | License and hotel images uploaded to `/public/uploads` |
| ✅ **Role-based Access** | Admins have restricted access; all users start as PENDING |

## 🏗️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** SQLite (via Prisma ORM)
- **Authentication:** JWT (jsonwebtoken)
- **Password Security:** bcryptjs (hashed passwords)
- **Styling:** Tailwind CSS 4

## 📁 Project Structure

```
DAD_Backend/
├── prisma/
│   ├── schema.prisma          # Database models
│   ├── seed.ts               # Creates default admin
│   └── migrations/           # SQL migrations
├── public/
│   └── uploads/              # Uploaded license/hotel images
└── src/
    ├── app/
    │   ├── page.tsx          # Home screen (landing page)
    │   ├── layout.tsx        # Root layout
    │   ├── login/            # Login page
    │   ├── signup/           # Registration page (driver/rider/hotel)
    │   ├── admin/
    │   │   ├── layout.tsx    # Admin layout with sidebar navigation
    │   │   ├── page.tsx      # Dashboard (overview + review)
    │   │   ├── drivers/      # Drivers table page
    │   │   ├── riders/       # Riders table page
    │   │   └── hotels/       # Hotels table page
    │   ├── api/
    │   │   ├── auth/
    │   │   │   ├── signup/   # POST - Register user
    │   │   │   ├── login/    # POST - Login user
    │   │   │   ├── logout/   # POST - Logout user
    │   │   │   └── me/       # GET  - Current user
    │   │   ├── admin/
    │   │   │   ├── users/    # GET  - List users (role/status/search filters)
    │   │   │   ├── users/[id] # PATCH - Edit user, DELETE - Delete user
    │   │   │   └── review/   # PATCH - Approve/Reject user
    │   │   └── upload/       # POST - Upload image file
    │   └── globals.css       # Global styles
    ├── components/
    │   ├── UsersTable.tsx    # Reusable table (search, filters, actions)
    │   └── EditUserModal.tsx # Edit modal for all user types
    ├── context/
    │   └── AuthContext.tsx   # Global auth state
    └── lib/
        ├── prisma.ts         # Prisma client singleton
        ├── jwt.ts            # JWT sign/verify utilities
        ├── auth.ts           # Auth middleware
        ├── api-response.ts   # API response helpers
        └── api.ts            # Frontend API client
```

## 🚀 How to Run the Project

### Prerequisites
- **Node.js** 18+ installed
- **npm** installed

### Step 1: Navigate to the project
```bash
cd DAD_Backend
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Set up the environment file
The `.env` file is already created. It contains:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="dad-super-secret-key-change-me-in-production-2024"
```
> **Important:** Change `JWT_SECRET` in production!

### Step 4: Create the database
```bash
npx prisma migrate dev --name init
```
This creates the SQLite database with all tables.

### Step 5: Seed the admin account
```bash
npm run db:seed
```
This creates the default admin:
- **Email:** `admin@dad.com`
- **Password:** `admin123`

### Step 6: Start the development server
```bash
npm run dev
```

Open [**http://localhost:3000**](http://localhost:3000) in your browser.

## 🌐 Pages & Routes

| URL | Description |
|-----|-------------|
| `/` | Home screen with registration options |
| `/login` | Login page (admin + users) |
| `/signup` | Registration (role selector: Driver, Rider, Hotel) |
| `/signup?role=driver` | Driver registration pre-selected |
| `/signup?role=rider` | Rider registration pre-selected |
| `/signup?role=hotel` | Hotel registration pre-selected |
| `/admin` | Admin dashboard (overview + approve/reject) |
| `/admin/drivers` | **Drivers table** - search, edit, delete, approve/reject |
| `/admin/riders` | **Riders table** - search, edit, delete, approve/reject |
| `/admin/hotels` | **Hotels table** - search, edit, delete, approve/reject |

## 🖥️ Admin Portal Features

| Feature | Description |
|---------|-------------|
| **📊 Dashboard** | Statistics cards + expandable user cards with full details |
| **🚗 Drivers Table** | Detailed table: name, email, phone, license no, vehicle, city, status |
| **🙋 Riders Table** | Detailed table: name, email, phone, address, city, emergency contact |
| **🏨 Hotels Table** | Detailed table: name, email, phone, hotel name, license no, city |
| **🔍 Search Bar** | Search by name, email, phone, license number, vehicle, city, etc. |
| **🔽 Status Filter** | Filter by PENDING / APPROVED / REJECTED |
| **✏️ Edit User** | Modal form to edit all user details (role-specific) |
| **🗑️ Delete User** | With confirmation dialog |
| **✅ Approve/❌ Reject** | Quick actions for pending registrations directly in tables |

## 🔌 API Endpoints (REST)

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register a new user (driver/rider/hotel) |
| `POST` | `/api/auth/login` | Login with email + password |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/auth/me` | Get current logged-in user |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users?role=DRIVER&status=PENDING&search=John` | List users with role/status/search filters |
| `PATCH` | `/api/admin/users/[id]` | Edit user details (basic + role-specific) |
| `DELETE` | `/api/admin/users/[id]` | Delete a user permanently |
| `PATCH` | `/api/admin/review` | Approve/Reject user `{ userId, action }` |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload image (multipart/form-data, field: `file`) |

### Example: Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dad.com","password":"admin123"}'
```

### Example: Admin Approves a User
```bash
curl -X PATCH http://localhost:3000/api/admin/review \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","action":"APPROVE"}'
```

## 🔄 How the Workflow Works

1. **User Registers** → Creates account with `status = PENDING`
2. **Admin Reviews** → Admin logs in and sees pending registrations with full details (including license photos)
3. **Admin Approves/Rejects** → User's status becomes `APPROVED` or `REJECTED`
4. **User Can Use App** → Approved users can participate in the service

## 🛠️ Useful Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run db:migrate` | Run new migrations |
| `npm run db:seed` | Create default admin |
| `npm run db:studio` | Open Prisma Studio (visual DB editor) |
| `npm run lint` | Check for lint issues |

## 📊 Database Schema

- **User** - Base table (email, password, role, status)
- **DriverProfile** - License + vehicle details (linked to User)
- **RiderProfile** - Address + emergency contact (linked to User)
- **HotelProfile** - Hotel details + license (linked to User)

## 🔒 Security Notes

- Passwords are hashed with **bcryptjs** (never stored in plain text)
- All admin routes require a valid **JWT token** with `ADMIN` role
- API responses never include passwords
- File uploads are validated by type and size (max 5MB)

## 📝 License

Private project - All rights reserved.