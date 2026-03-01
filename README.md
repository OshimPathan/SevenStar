# 🏫 Seven Star English Boarding School — ERP & Website

> A **production-ready**, full-stack **School Enterprise Resource Planning (ERP)** system and public website for **Seven Star English Boarding School**, Devdaha, Rupandehi (Lumbini Province, Nepal). Quality English-medium education from **Nursery to +2**, NEB-affiliated programs in Management, Computer Science & Education. Established **2063 B.S.**

**🌐 Live URL:** [https://frontend-nu-eosin-89.vercel.app](https://frontend-nu-eosin-89.vercel.app)

### At a Glance

| Metric | Count |
|--------|-------|
| Database Tables | **55** (all with Row Level Security) |
| API Functions | **165** exported async functions |
| API Code | **2,952** lines (`api.js`) |
| Dashboard Pages | **37** (27 Admin + 4 Student + 3 Teacher + 3 Student-extras) |
| Landing Sections | **24** responsive components |
| Public Routes | **8** (landing, login, admission, exam schedule, results, etc.) |
| Dashboard Routes | **34** protected routes |
| User Roles | **5** (Admin, Teacher, Student, Parent, Accountant) |
| Auth Accounts | **130** seeded |
| Total Users | **1,341** |
| Students | **1,286** across **15** classes |
| Teachers | **54** |
| Subjects | **33** with **113** class-subject mappings |
| Exams | **4** with **46** exam-class links, **452** routines, **28,332** marks |
| Attendance Records | **51,440** |
| Fee Payments | **7,572** |
| Salary Records | **550** |

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Database Schema](#database-schema)
- [Features — Landing Page (Public)](#features--landing-page-public)
- [Features — Authentication](#features--authentication)
- [Features — Admin Dashboard](#features--admin-dashboard)
- [Features — Teacher Dashboard](#features--teacher-dashboard)
- [Features — Student / Parent Dashboard](#features--student--parent-dashboard)
- [API Layer (165 Functions)](#api-layer-165-functions)
- [Routing & Access Control](#routing--access-control)
- [Design System](#design-system)
- [Storage & File Uploads](#storage--file-uploads)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Future Roadmap](#future-roadmap)
- [Known Limitations](#known-limitations)
- [License](#license)

---

## Project Overview

This project is a **complete digital platform** for managing all aspects of a K-12 school with +2 programs. It combines:

1. **A public-facing website** — 24-component landing page showcasing the school's identity, programs, facilities, gallery, testimonials, fee structure, admissions, exam schedules, and contact.
2. **A role-based ERP dashboard** — Full school management system with **37 dashboard pages** supporting five user roles: **Admin**, **Teacher**, **Student**, **Parent**, and **Accountant**, each with dedicated views and capabilities.
3. **A Backend-as-a-Service (BaaS) layer** — All data persistence, authentication, storage, and security powered by **Supabase** (PostgreSQL 17.6 + Row Level Security + Storage + SDK), hosted in `ap-south-1` (Mumbai).

### What Problems It Solves

| Problem | Solution |
|---------|----------|
| Paper-based attendance tracking | Digital daily attendance with teacher-marked records, class-wise filtering, admin attendance reports |
| Manual exam result compilation | Multi-class exam management, bulk mark entry, auto grade computation, exam routines with per-subject full/pass marks |
| Fee collection opacity | Digital fee ledger with PAID/UNPAID/PARTIAL tracking, overdue detection, accounting module |
| No online school presence | 24-section responsive landing page with live data from database |
| Disconnected parent communication | Parent portal with real-time access to child's results, fees, notices, routine, and assignments |
| Admission paper forms | Online admission application with status tracking (PENDING/ACCEPTED/REJECTED), admin management |
| Photo/document management | Cloud storage for student photos, certificates, and gallery images (Supabase Storage) |
| Scattered notice boards | Digital notice system with role-based targeting (ALL/TEACHER/STUDENT/PARENT/ADMIN) |
| No salary/HR tracking | Staff salary management with base salary, deductions, net pay, and payment history |
| Library/inventory chaos | Digital library catalog with book management and inventory tracking system |
| Transport management | Bus route management, student transport assignment, fee tracking |
| No exam scheduling | Exam routine builder with per-class, per-subject scheduling (date, time, room, marks) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│            React 18 + Vite 5 + Tailwind CSS 3.4             │
│                                                             │
│  ┌──────────┐  ┌─────────────┐  ┌────────────────────────┐  │
│  │  Landing  │  │  VTOP-Style │  │   Role-Based Dashboard │  │
│  │  (24 sec) │  │    Login    │  │  (37 pages, 5 roles)   │  │
│  └──────────┘  └─────────────┘  └────────────────────────┘  │
│                        │                                     │
│               ┌────────┴────────┐                            │
│               │    api.js       │                            │
│               │ (165 functions) │                            │
│               │  (2,952 lines)  │                            │
│               └────────┬────────┘                            │
└────────────────────────┼────────────────────────────────────┘
                         │  Supabase SDK
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               SUPABASE (ap-south-1, Mumbai)                 │
│                                                             │
│  ┌──────────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │  PostgreSQL   │  │  Storage  │  │  Authentication      │  │
│  │  (55 tables)  │  │ (buckets) │  │  (130 accounts)      │  │
│  │  RLS on all   │  │           │  │  (JWT + Supabase)    │  │
│  └──────────────┘  └───────────┘  └──────────────────────┘  │
│                                                             │
│  Base URL: https://egzhmzsntrlabfkdvngk.supabase.co        │
│  Postgres 17.6 │ ~107K+ records │ Active: 2025-2026       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Express.js — secondary)                │
│                                                             │
│  • Health check endpoint                                    │
│  • Route stubs for auth, admin, teacher, student            │
│  • PostgreSQL direct connection via pg                      │
│  • Helmet + CORS security                                  │
│  • NOT the primary data path (frontend uses Supabase SDK)   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

The **primary data path** is:

```
User → React Frontend → api.js → Supabase SDK → PostgreSQL (Supabase-hosted)
```

The Express backend exists as a **secondary/legacy API layer** with its own route structure. The frontend communicates exclusively through the Supabase SDK for all database queries, storage uploads, and authentication.

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **UI Framework** | React | 18.2 | Component-based UI rendering |
| **Build Tool** | Vite | 5.2 | Fast HMR development & production builds |
| **Routing** | React Router | 6.22 | Client-side routing with protected routes |
| **Styling** | Tailwind CSS | 3.4 | Utility-first CSS with custom design tokens |
| **Icons** | Lucide React | 0.368 | Consistent SVG icon system |
| **Charts** | Recharts | 2.12 | Dashboard data visualization (area, pie, bar) |
| **Auth Hashing** | bcryptjs | 3.0 | Client-side password hashing |
| **BaaS SDK** | @supabase/supabase-js | 2.x | Database queries, storage, authentication |
| **Backend** | Express | 4.19 | Secondary API layer |
| **Security** | Helmet | 7.1 | HTTP security headers |
| **DB Driver** | pg | 8.11 | PostgreSQL connection (backend) |
| **JWT** | jsonwebtoken | 9.0 | Token-based auth (backend) |
| **Database** | PostgreSQL | — | Hosted on Supabase |
| **Hosting** | Vercel | — | Frontend deployment + CDN |

---

## Folder Structure

```
collegewebsite/
├── README.md                          # This file
├── AGENTS.md                          # Supabase MCP agent instructions
│
├── backend/                           # Express.js backend (secondary)
│   ├── package.json
│   ├── schema.sql                     # Complete PostgreSQL schema
│   ├── seed.sql                       # Database seed data
│   ├── rls_policies.sql               # Row Level Security policies
│   ├── storage_policies.sql           # Storage bucket policies
│   └── src/
│       ├── index.js                   # Express server entry (port 5000)
│       ├── db.js                      # PostgreSQL pool connection
│       ├── seed.js                    # Database seeding script
│       ├── controllers/
│       │   ├── adminController.js     # Admin CRUD operations
│       │   ├── authController.js      # Login/register handlers
│       │   ├── studentController.js   # Student data handlers
│       │   └── teacherController.js   # Teacher data handlers
│       ├── middleware/
│       │   └── auth.js                # JWT verification middleware
│       └── routes/
│           ├── adminRoutes.js         # /api/admin/*
│           ├── authRoutes.js          # /api/auth/*
│           ├── studentRoutes.js       # /api/student/*
│           └── teacherRoutes.js       # /api/teacher/*
│
└── frontend/                          # React + Vite frontend (primary)
    ├── package.json
    ├── index.html                     # Vite entry HTML
    ├── vite.config.js                 # Vite configuration
    ├── tailwind.config.js             # Custom colors, fonts
    ├── postcss.config.js              # PostCSS + Tailwind + Autoprefixer
    ├── public/                        # Static assets
    └── src/
        ├── main.jsx                   # React root + Router + AuthProvider
        ├── App.jsx                    # 42 route definitions + ProtectedRoute
        ├── api.js                     # 🔑 ALL API functions (165 exports, 2,952 lines)
        ├── index.css                  # Tailwind directives + custom utilities
        │
        ├── context/
        │   └── AuthContext.jsx        # Auth state (user, token, login, logout)
        │
        ├── hooks/
        │   └── useScrollReveal.js     # Intersection Observer scroll animations
        │
        ├── layouts/
        │   └── DashboardLayout.jsx    # Sidebar + header + role-based nav
        │
        ├── lib/
        │   ├── supabase.js            # Supabase client (env vars)
        │   └── insforge.js            # Utility helpers
        │
        ├── components/
        │   ├── ErrorBoundary.jsx      # Global error boundary
        │   ├── FormField.jsx          # Reusable form field component
        │   ├── CSVImportModal.jsx     # CSV bulk import modal
        │   └── landing/               # 24 landing page components
        │       ├── Navbar.jsx         # Sticky nav with mobile drawer
        │       ├── Hero.jsx           # Image carousel with school branding
        │       ├── NoticeTicker.jsx   # Scrolling notice ticker
        │       ├── NoticeBoard.jsx    # Live notices from DB
        │       ├── QuickInfoBar.jsx   # Quick info strip
        │       ├── About.jsx          # School history & mission
        │       ├── AchievementsStrip.jsx # Achievements showcase
        │       ├── Highlights.jsx     # School highlights
        │       ├── Programs.jsx       # NEB programs + subjects from DB
        │       ├── ClassesSections.jsx # Classes & sections overview
        │       ├── Stats.jsx          # Animated counter stats
        │       ├── Facilities.jsx     # Campus facilities grid
        │       ├── Gallery.jsx        # Photo gallery with lightbox
        │       ├── UpcomingExams.jsx   # Upcoming exam schedule
        │       ├── WhyChooseUs.jsx    # USP cards
        │       ├── AdmissionBanner.jsx # Admission CTA banner
        │       ├── Admissions.jsx     # Admission info & form
        │       ├── FeeStructure.jsx   # Fee breakdown by class
        │       ├── Team.jsx           # Faculty showcase
        │       ├── Testimonials.jsx   # Student/parent reviews from DB
        │       ├── Contact.jsx        # Contact form + map
        │       ├── FloatingActions.jsx # Floating action buttons
        │       ├── ScrollReveal.jsx   # Scroll animation wrapper
        │       └── Footer.jsx         # Site footer with links
        │
        ├── utils/
        │   └── generateReportCard.js  # PDF report card generation
        │
        └── pages/
            ├── Landing.jsx            # Assembles all landing sections
            ├── Login.jsx              # VTOP-style login with spotlight
            ├── AdmissionForm.jsx      # Public admission application
            ├── ExamSchedule.jsx       # Public exam schedule viewer
            ├── ResultChecker.jsx      # Public result checker
            ├── ForgotPassword.jsx     # Password reset request
            ├── ResetPassword.jsx      # Password reset form
            ├── PendingApprovalPage.jsx # Pending account approval
            └── dashboard/             # 37 dashboard pages
                ├── AdminDashboard.jsx       # Role-aware stats + charts
                ├── AdminStudents.jsx        # Student CRUD + photo/cert upload
                ├── AdminTeachers.jsx        # Teacher CRUD + subject assignment
                ├── AdminClasses.jsx         # Class CRUD + subject management
                ├── AdminParents.jsx         # Parent account management
                ├── AdminNotices.jsx         # Notice CRUD (role-targeted)
                ├── AdminEvents.jsx          # Event CRUD
                ├── AdminGallery.jsx         # Gallery photo upload/manage
                ├── AdminPrograms.jsx        # Program subjects & syllabus
                ├── AdminExams.jsx           # Multi-class exam management + routines
                ├── AdminMarkEntry.jsx       # Bulk mark entry per class/exam
                ├── AdminResults.jsx         # View/publish results with grades
                ├── AdminReviews.jsx         # Review moderation
                ├── AdminAdmissions.jsx      # Admission application management
                ├── AdminFees.jsx            # Fee management & tracking
                ├── AdminSalary.jsx          # Staff salary management
                ├── AdminAccounting.jsx      # Accounting & financial reports
                ├── AdminAttendance.jsx      # Attendance reports & analytics
                ├── AdminUsers.jsx           # User account management
                ├── AdminApprovals.jsx       # Account approval workflow
                ├── AdminSettings.jsx        # Site settings & configuration
                ├── AdminClassAnalytics.jsx  # Per-class analytics
                ├── AdminClassBrowser.jsx    # Class browser overview
                ├── AdminLibrary.jsx         # Library catalog management
                ├── AdminTransport.jsx       # Transport route management
                ├── AdminInventory.jsx       # Inventory tracking
                ├── AdminTimetable.jsx       # Timetable builder
                ├── TeacherAttendance.jsx    # Daily attendance marking
                ├── TeacherMarks.jsx         # Exam marks entry
                ├── TeacherStudents.jsx      # View assigned students
                ├── TeacherAssignments.jsx   # Assignment management
                ├── StudentNotices.jsx       # View notices
                ├── StudentResults.jsx       # View exam results & grades
                ├── StudentFees.jsx          # View fee details & status
                ├── StudentSubjects.jsx      # View enrolled subjects
                ├── StudentRoutine.jsx       # View exam routine
                └── StudentAssignments.jsx   # View assignments
```

---

## Database Schema

### Overview

The database consists of **55 PostgreSQL tables** hosted on Supabase (Postgres 17.6), all protected with **Row Level Security (RLS)** policies. The active academic year is **2025-2026**.

### Entity-Relationship Overview

```
users ──┬── staff ──── salary_payments
        │
        ├── teachers ──── teacher_subjects ──── subjects ──── class_subjects ──── classes
        │                                                                          │
        ├── students ─── enrollments ─┬── attendance                               │
        │                             ├── exam_marks ── exam_routines ── exams ── exam_classes
        │                             ├── fee_payments                              │
        │                             ├── result_summaries                          │
        │                             └── student_assignments ── assignments ───────┘
        │
        └── (created_by) ── notices
                             events
                             admission_applications
                             gallery_photos
                             program_subjects
                             site_settings
                             reviews
                             academic_years
                             timetable_entries
                             library_books
                             transport_routes / vehicles / student_transport
                             inventory_items / inventory_transactions
```

### Core Tables (55 total, all with RLS)

| Table | Records | Purpose |
|-------|---------|---------|
| **users** | 1,341 | Central auth for all roles (ADMIN/TEACHER/STUDENT/PARENT) |
| **students** | 1,286 | Student profiles with extended fields |
| **enrollments** | 1,286 | Class enrollment with roll numbers per academic year |
| **teachers** | 54 | Teacher profiles with qualifications |
| **staff** | 55 | All staff records (teachers + admin) |
| **classes** | 15 | Nursery → +2 (Science/Mgmt/Education) |
| **subjects** | 33 | Subject catalog |
| **class_subjects** | 113 | Class ↔ Subject mappings |
| **teacher_subjects** | — | Teacher ↔ Subject assignments |
| **academic_years** | 1 | Active: 2025-2026 |
| **exams** | 4 | Exam definitions (Unit Test/Mid-term/Final/Pre-board) |
| **exam_classes** | 46 | Multi-class ↔ Exam linkage |
| **exam_routines** | 452 | Per-class, per-subject exam schedules (date, time, room, marks) |
| **exam_marks** | 28,332 | Student marks with grade_point |
| **result_summaries** | — | Per-student per-exam aggregated results with GPA |
| **attendance** | 51,440 | Daily: PRESENT/ABSENT/LATE/HALF_DAY |
| **fee_payments** | 7,572 | Fee tracking with PAID/UNPAID/PARTIAL |
| **salary_payments** | 550 | Staff salary: base_salary, deductions, net_salary |
| **notices** | 18 | Role-targeted announcements |
| **events** | 12 | School calendar events |
| **admission_applications** | 20 | Online admission pipeline (PENDING/ACCEPTED/REJECTED) |
| **gallery_photos** | 15 | School photo gallery |
| **program_subjects** | — | Academic program catalog |
| **assignments** | 30 | Teacher-created assignments |
| **student_assignments** | — | Student assignment submissions |
| **library_books** | 50 | Library catalog |
| **inventory_items** | 30 | School inventory |
| **inventory_transactions** | — | Inventory movement tracking |
| **transport_routes** | 8 | Bus routes |
| **vehicles** | — | Transport vehicles |
| **student_transport** | — | Student transport assignments |
| **timetable_entries** | — | Weekly class timetable |
| **site_settings** | — | Key-value site configuration |
| **reviews** | — | Student/parent testimonials |

### Key Relationships

- A **User** can be linked to exactly one **Teacher**, **Student**, or **Parent** profile
- A **Student** has an **Enrollment** record per academic year (containing `roll_number`, `class_id`)
- **Teachers** are assigned to **Subjects** via the `teacher_subjects` join table
- **Exam routines** have UNIQUE constraint on `(exam_id, class_id, subject_id)` with per-subject `full_marks` and `pass_marks`
- **Exams** support multiple classes via `exam_classes` (one exam → many classes)
- **Attendance** records are per-student per-date (unique constraint)
- **Exam marks** reference `grade_point` (not GPA); `result_summaries` has `gpa`
- **Students → Users** FK requires disambiguation: `users!students_user_id_fkey`

---

## Features — Landing Page (Public)

The landing page consists of **24 responsive components**, many data-driven from the database:

| # | Component | Description | Data Source |
|---|-----------|-------------|-------------|
| 1 | **Navbar** | Sticky navigation with mobile hamburger drawer, smooth-scroll to sections | Static |
| 2 | **Hero** | Full-screen image carousel with school branding, CTA buttons | Static slides |
| 3 | **NoticeTicker** | Horizontal scrolling notice ticker bar | `notices` table via API |
| 4 | **NoticeBoard** | Live scrolling notices with date badges | `notices` table via API |
| 5 | **QuickInfoBar** | Quick info strip with key school details | Static |
| 6 | **About** | School history (est. 2063 B.S.), mission, vision, core values | Static |
| 7 | **AchievementsStrip** | Achievement highlights showcase | Static |
| 8 | **Highlights** | School highlights and key differentiators | Static |
| 9 | **Programs** | NEB-affiliated +2 programs with expandable subject lists | `program_subjects` table via API |
| 10 | **ClassesSections** | Classes & sections overview | `classes` table via API |
| 11 | **Stats** | Animated counters (students, teachers, years, programs) | Static |
| 12 | **Facilities** | Grid of campus facilities (labs, library, sports, etc.) | Static |
| 13 | **Gallery** | Photo grid with category filtering and lightbox zoom | `gallery_photos` table + Supabase Storage |
| 14 | **UpcomingExams** | Upcoming exam schedules from DB | `exam_routines` table via API |
| 15 | **WhyChooseUs** | USP cards highlighting differentiators | Static |
| 16 | **AdmissionBanner** | Admission CTA banner with link to form | Static |
| 17 | **Admissions** | Admission process steps and online application | `admission_applications` table |
| 18 | **FeeStructure** | Fee breakdown by class level | Static |
| 19 | **Team** | Faculty cards with qualifications | Static |
| 20 | **Testimonials** | Student/parent reviews with star ratings | `reviews` table (approved only) |
| 21 | **Contact** | Contact form, school address, phone, email, embedded map | Static |
| 22 | **FloatingActions** | Floating action buttons (phone, scroll-top) | Static |
| 23 | **ScrollReveal** | Intersection Observer animation wrapper | Utility |
| 24 | **Footer** | Quick links, social media, copyright | Static |

### Additional Public Pages

| Page | Path | Description |
|------|------|-------------|
| **AdmissionForm** | `/admission` | Standalone online admission application form |
| **ExamSchedule** | `/exam-schedule` | Public exam routine viewer |
| **ResultChecker** | `/results` | Public result lookup by student |
| **ForgotPassword** | `/forgot-password` | Password reset request |
| **ResetPassword** | `/reset-password` | Password reset form |

---

## Features — Authentication

### VTOP-Style Login Page

- **Split-screen design**: Left panel with rotating spotlight of school notices (fetched from DB), right panel with login form
- **Role-based routing**: After login, users are redirected to `/dashboard` with role-appropriate content
- **Password security**: Client-side bcrypt hashing before comparison
- **Session persistence**: JWT token + user object stored in `localStorage`
- **Remember Me**: Functional checkbox for session persistence
- **4 User Roles**: Admin, Teacher, Student, Parent — each with unique dashboard experience

### Auth Flow

```
1. User enters email + password
2. api.js login() queries 'users' table by email
3. bcryptjs compares password with stored hash
4. On match: resolves role-specific data (teacher_id, student info, parent children)
5. Returns user object + mock JWT token
6. AuthContext stores in state + localStorage
7. ProtectedRoute checks user.role before rendering dashboard pages
```

---

## Features — Admin Dashboard

Admins have **full control** over all school data across **27 dedicated pages**:

### Dashboard Home (`/dashboard`)
- **Stat Cards**: Total Students, Total Teachers, Today's Attendance %, Pending Fees — all from real DB queries
- **Weekly Attendance Chart**: Area chart showing last 7 days attendance trends (real data)
- **Fee Distribution Pie Chart**: Paid vs Pending vs Overdue breakdown (real counts)
- **Recent Notices**: Latest 5 notices from DB
- **Upcoming Events**: Next 5 events from DB
- **Recent Students**: Latest 5 enrolled students
- **Loading skeletons**: Pulse animation on stat cards while data loads
- **Empty states**: Graceful messaging when no data exists

### Student Management (`/dashboard/students`)
- Full CRUD: Create, Read, Update, Delete students
- **Photo upload**: Student photos stored in `student-documents` bucket (Supabase Storage)
- **Certificate upload**: Academic certificates stored alongside photos
- **Extended fields**: Gender, nationality, religion, blood group, mother info, emergency contact, previous school details
- **Class assignment**: Dropdown to assign students to classes
- **Parent linking**: Associate students with parent user accounts

### Teacher Management (`/dashboard/teachers`)
- Full CRUD for teacher profiles
- **Subject assignment**: Multi-select interface to assign teachers to subjects across classes
- Employee ID, qualification, phone, address, join date tracking

### Class & Subject Management (`/dashboard/classes`)
- Create/delete classes with name, section, stream
- Per-class subject management (add/remove subjects with codes)
- Cascading subject deletion when class is removed

### Exam Management (`/dashboard/manage-exams`)
- **Multi-class exam creation**: Create exams linked to multiple classes simultaneously
- **Exam routine builder**: Per-class, per-subject scheduling with date, start/end time, room, full marks, pass marks
- **Bulk routine save**: Save all routines for an exam at once
- **View/filter by class**: Class picker in schedule and results modals
- **Exam types**: Unit Test, Mid-term, Final, Pre-board

### Mark Entry (`/dashboard/mark-entry`)
- Select class → exam → subject flow
- Bulk mark entry for all students in a class
- Auto-loads existing marks for editing
- Per-subject full_marks and pass_marks from exam_routines

### Results Management (`/dashboard/admin-results`)
- View results by class and exam
- Grade auto-computation with grade_point
- Result summaries with GPA calculation
- FK disambiguation for complex student→user joins

### Attendance Reports (`/dashboard/manage-attendance`)
- Admin-level attendance analytics
- Class-wise and date-range attendance reports

### Fee Management (`/dashboard/manage-fees`)
- Fee creation and tracking across students
- PAID/UNPAID/PARTIAL status management

### Salary Management (`/dashboard/salary`)
- Staff salary records: base_salary, deductions, net_salary
- Payment history tracking

### Accounting (`/dashboard/accounting`)
- Financial overview and reports
- Available to ADMIN and ACCOUNTANT roles

### Library Management (`/dashboard/library`)
- Book catalog management (50 books seeded)
- Add/edit/delete library books

### Transport Management (`/dashboard/transport`)
- Bus route management (8 routes seeded)
- Vehicle tracking and student transport assignments

### Inventory Management (`/dashboard/inventory`)
- School inventory tracking (30 items seeded)
- Inventory transaction logging

### Timetable Builder (`/dashboard/timetable`)
- Weekly class timetable management
- Period ↔ subject ↔ teacher mapping

### Additional Admin Pages
- **Parent Management** (`/dashboard/parents`): Create/delete parent accounts, link to students
- **Notice Management** (`/dashboard/manage-notices`): CRUD with role targeting
- **Event Management** (`/dashboard/manage-events`): School calendar events
- **Gallery Management** (`/dashboard/manage-gallery`): Photo upload to Supabase Storage
- **Program Management** (`/dashboard/manage-programs`): Academic program catalog
- **Review Moderation** (`/dashboard/manage-reviews`): Approve/reject testimonials
- **Admission Management** (`/dashboard/admissions`): Application pipeline (PENDING/ACCEPTED/REJECTED)
- **User Management** (`/dashboard/users`): All user account management
- **Account Approvals** (`/dashboard/approvals`): Approve pending registrations
- **Class Analytics** (`/dashboard/class-analytics`): Per-class performance analytics
- **Class Browser** (`/dashboard/class-browser`): Browse classes with details
- **Settings** (`/dashboard/settings`): Site-wide configuration

---

## Features — Teacher Dashboard

### Dashboard Home (`/dashboard`)
- **Stat Cards**: My Classes count, Total Students (in assigned classes), Today's Attendance %, My Subjects count
- All stats computed from teacher's actual assignments (not school-wide)

### Attendance (`/dashboard/attendance`)
- Select class → view enrolled students
- Mark attendance: PRESENT / ABSENT / LATE / HALF_DAY
- Date picker for historical records
- Bulk save attendance for entire class

### Exams & Marks (`/dashboard/exams`)
- Select class → select subject (filtered to teacher's assigned subjects only)
- Select exam → enter marks per student
- Grade auto-computation, remarks field
- Bulk save marks

### Assignments (`/dashboard/assignments-manage`)
- Create and manage assignments per class/subject
- Track student submissions

### My Students (`/dashboard/my-students`)
- View all students in teacher's assigned classes
- Photo thumbnails in student table
- **Detailed student modal** with 3 tabs:
  - **Personal**: Gender, DOB, nationality, religion, blood group, emergency contact
  - **Guardian**: Father name/phone, mother name/phone, parent email
  - **Academic**: Admission number, roll number, class, previous school, certificate link

---

## Features — Student / Parent Dashboard

### Dashboard Home (`/dashboard`)
- **Stat Cards**: Class Name, Attendance %, GPA (computed from results grades), Pending Fees
- Parent accounts see their linked child's data

### Results (`/dashboard/results`)
- View exam-wise results with marks, grades, and grade points
- Subject-by-subject breakdown with full_marks and pass_marks per subject

### Subjects (`/dashboard/subjects`)
- View enrolled subjects for current class

### Exam Routine (`/dashboard/routine`)
- View upcoming exam schedule with dates, times, and rooms

### Assignments (`/dashboard/assignments`)
- View assignments posted by teachers
- Track submission status

### Fee Details (`/dashboard/fees`)
- View all fee records with amount, due date, payment status
- Track paid vs unpaid vs partial amounts

### Notices (`/dashboard/notices`)
- View role-appropriate notices (ALL + own role)
- Date-sorted, latest first

---

## API Layer (165 Functions)

All API communication is centralized in `frontend/src/api.js` (2,952 lines) using the Supabase SDK. No REST calls to the Express backend.

### Function Categories

<details>
<summary><strong>Authentication (1 function)</strong></summary>

| Function | Description |
|----------|-------------|
| `login(email, password)` | Authenticates user, resolves role-specific data (teacher_id, student info, parent children) |

</details>

<details>
<summary><strong>Students — CRUD (4 functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getStudents()` | List all students with class join |
| `createStudent(data)` | Create user + student record |
| `updateStudent(id, data)` | Update student fields |
| `deleteStudent(id)` | Delete student + user record |

</details>

<details>
<summary><strong>Teachers — CRUD (4 functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getTeachers()` | List all teachers with user join |
| `createTeacher(data)` | Create user + teacher record |
| `updateTeacher(id, data)` | Update teacher fields |
| `deleteTeacher(id)` | Delete teacher + user record |

</details>

<details>
<summary><strong>Parents — CRUD (3 functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getParents()` | List all parent accounts |
| `createParent(data)` | Create parent user account |
| `deleteParent(id)` | Delete parent account |

</details>

<details>
<summary><strong>Classes (4 functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getClasses()` | List classes with student count + subject list |
| `getAllClasses()` | Simple class list for dropdowns |
| `addClass(data)` | Create new class |
| `deleteClass(id)` | Delete class + cascade subjects |

</details>

<details>
<summary><strong>Notices — CRUD (4 functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getNotices()` | List all notices |
| `createNotice(data)` | Create notice with role targeting |
| `updateNotice(id, data)` | Update notice |
| `deleteNotice(id)` | Delete notice |

</details>

<details>
<summary><strong>Events — CRUD (4 functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getEvents()` | List all events |
| `createEvent(data)` | Create event |
| `updateEvent(id, data)` | Update event |
| `deleteEvent(id)` | Delete event |

</details>

<details>
<summary><strong>Exams & Routines (12+ functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getExams()` | List all exams with class_ids array via exam_classes |
| `getExamsByClass(classId)` | Exams for a specific class via exam_classes |
| `createExam(data)` | Create exam with multi-class support (classIds array) |
| `deleteExam(id)` | Delete exam + cascade exam_classes |
| `publishResults(examId)` | Publish results for an exam |
| `getExamRoutines(examId, classId)` | Get routines for exam+class combination |
| `saveBulkExamRoutines(routines)` | Bulk upsert exam routines (date, time, room, marks) |
| `getExamMarks(examId, classId, subjectId)` | Get marks for mark entry |
| `saveBulkExamMarks(marks)` | Bulk save student marks |
| `getResultsForClassExam(classId, examId)` | Results with FK disambiguation |
| `getResultSummaries(examId, classId)` | Aggregated results with GPA |
| `getExamRoutinesPublic()` | Public exam schedule for landing page |

</details>

<details>
<summary><strong>Gallery — with Storage (4 functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getGalleryPhotos()` | List all gallery photos |
| `uploadGalleryPhoto(file, data)` | Upload to `gallery` bucket + insert record |
| `updateGalleryPhoto(id, data)` | Update photo metadata |
| `deleteGalleryPhoto(id)` | Delete photo + storage file |

</details>

<details>
<summary><strong>Programs / Subjects (4 functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getProgramSubjects()` | List program catalog |
| `createProgramSubject(data)` | Add program subject |
| `updateProgramSubject(id, data)` | Update program subject |
| `deleteProgramSubject(id)` | Remove program subject |

</details>

<details>
<summary><strong>Dashboard Stats (3 functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getDashboardStats()` | Admin: totals, weekly attendance, fee distribution, recent notices/events/students |
| `getTeacherDashboardStats(teacherId)` | Teacher: assigned classes/students/subjects count, attendance % |
| `getStudentDashboardStats(studentId)` | Student: class, attendance %, GPA, pending fees |

</details>

<details>
<summary><strong>Teacher Operations (10 functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getTeacherClasses(teacherId)` | Classes assigned to teacher |
| `getStudentsByClass(classId)` | Students in a class |
| `getStudentsByClassDetailed(classId)` | Full student details with extended fields |
| `getAttendanceByDate(classId, date)` | Attendance records for a date |
| `saveAttendance(records)` | Bulk save attendance |
| `getSubjectsByClass(classId)` | All subjects in a class |
| `getTeacherSubjectsForClass(teacherId, classId)` | Only teacher's assigned subjects |
| `getTeacherSubjectsWithClasses(teacherId)` | All teacher subjects with class info |
| `getResultsForClassExam(classId, examId, subjectId)` | Results for marks entry |
| `saveBulkMarks(results)` | Bulk save exam marks |

</details>

<details>
<summary><strong>Student Academics (2 functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getStudentResults(studentId)` | All exam results for a student |
| `getStudentFees(studentId)` | All fee records for a student |

</details>

<details>
<summary><strong>Reviews (5 functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getApprovedReviews()` | Public: approved testimonials |
| `submitReview(data)` | Submit new review (pending approval) |
| `getAllReviews()` | Admin: all reviews |
| `approveReview(id)` | Admin: approve a review |
| `deleteReview(id)` | Admin: delete a review |

</details>

<details>
<summary><strong>File Uploads (2 functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `uploadStudentPhoto(studentId, file)` | Upload to `student-documents` bucket, update `photo_url` |
| `uploadStudentCertificate(studentId, file)` | Upload to `student-documents` bucket, update `certificate_url` |

</details>

<details>
<summary><strong>Teacher Subject Assignment (3 functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getAllSubjects()` | All subjects with class info |
| `getTeacherAssignedSubjectIds(teacherId)` | Currently assigned subject IDs |
| `assignTeacherSubjects(teacherId, subjectIds)` | Bulk assign subjects to teacher |

</details>

<details>
<summary><strong>Salary & Accounting (6+ functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getSalaryPayments()` | List all salary records |
| `createSalaryPayment(data)` | Create salary payment |
| `updateSalaryPayment(id, data)` | Update salary record |
| `deleteSalaryPayment(id)` | Delete salary record |
| `getAccountingStats()` | Financial overview stats |
| `getStaff()` | List all staff members |

</details>

<details>
<summary><strong>Library Management (4+ functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getLibraryBooks()` | List all books |
| `createLibraryBook(data)` | Add new book |
| `updateLibraryBook(id, data)` | Update book details |
| `deleteLibraryBook(id)` | Remove book from catalog |

</details>

<details>
<summary><strong>Transport Management (4+ functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getTransportRoutes()` | List all bus routes |
| `createTransportRoute(data)` | Add new route |
| `updateTransportRoute(id, data)` | Update route |
| `deleteTransportRoute(id)` | Delete route |

</details>

<details>
<summary><strong>Inventory Management (4+ functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getInventoryItems()` | List all inventory |
| `createInventoryItem(data)` | Add inventory item |
| `updateInventoryItem(id, data)` | Update item |
| `deleteInventoryItem(id)` | Remove item |

</details>

<details>
<summary><strong>Assignments (5+ functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getAssignments()` | List all assignments |
| `createAssignment(data)` | Create assignment |
| `updateAssignment(id, data)` | Update assignment |
| `deleteAssignment(id)` | Delete assignment |
| `getStudentAssignments(studentId)` | View student's assignments |

</details>

<details>
<summary><strong>Admissions, Users, Settings, Timetable (15+ functions)</strong></summary>

| Function | Description |
|----------|-------------|
| `getAdmissionApplications()` | List all admission applications |
| `updateAdmissionStatus(id, status)` | Accept/reject applications |
| `getUsers()` | List all user accounts |
| `updateUserStatus(id, status)` | Approve/disable users |
| `getSiteSettings()` | Get key-value settings |
| `updateSiteSetting(key, value)` | Update a setting |
| `getTimetableEntries(classId)` | Get timetable for a class |
| `saveTimetableEntry(data)` | Save timetable entry |
| `deleteTimetableEntry(id)` | Delete timetable entry |
| `getAcademicYears()` | List academic years |
| `getClassAnalytics(classId)` | Class performance data |
| `getEnrollments(classId)` | Enrollment records per class |
| ... | *And more — 165 total exports* |

</details>

---

## Routing & Access Control

### Route Map (42 routes total)

#### Public Routes (8)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Landing | Full school website |
| `/login` | Login | VTOP-style authentication |
| `/forgot-password` | ForgotPassword | Password reset request |
| `/reset-password` | ResetPassword | Password reset form |
| `/admission` | AdmissionForm | Online admission application |
| `/exam-schedule` | ExamSchedule | Public exam schedule viewer |
| `/results` | ResultChecker | Public result lookup |
| `/pending-approval` | PendingApprovalPage | Pending account status |

#### Dashboard Routes (34)

| Path | Component | Access |
|------|-----------|--------|
| `/dashboard` | AdminDashboard | All authenticated |
| `/dashboard/students` | AdminStudents | ADMIN |
| `/dashboard/teachers` | AdminTeachers | ADMIN |
| `/dashboard/classes` | AdminClasses | ADMIN |
| `/dashboard/parents` | AdminParents | ADMIN |
| `/dashboard/users` | AdminUsers | ADMIN |
| `/dashboard/approvals` | AdminApprovals | ADMIN |
| `/dashboard/manage-notices` | AdminNotices | ADMIN |
| `/dashboard/manage-events` | AdminEvents | ADMIN |
| `/dashboard/manage-gallery` | AdminGallery | ADMIN |
| `/dashboard/manage-programs` | AdminPrograms | ADMIN |
| `/dashboard/manage-exams` | AdminExams | ADMIN |
| `/dashboard/mark-entry` | AdminMarkEntry | ADMIN |
| `/dashboard/admin-results` | AdminResults | ADMIN |
| `/dashboard/manage-fees` | AdminFees | ADMIN |
| `/dashboard/salary` | AdminSalary | ADMIN |
| `/dashboard/manage-attendance` | AdminAttendance | ADMIN |
| `/dashboard/manage-reviews` | AdminReviews | ADMIN |
| `/dashboard/admissions` | AdminAdmissions | ADMIN |
| `/dashboard/class-analytics` | AdminClassAnalytics | ADMIN |
| `/dashboard/class-browser` | AdminClassBrowser | ADMIN |
| `/dashboard/library` | AdminLibrary | ADMIN |
| `/dashboard/transport` | AdminTransport | ADMIN |
| `/dashboard/inventory` | AdminInventory | ADMIN |
| `/dashboard/timetable` | AdminTimetable | ADMIN |
| `/dashboard/settings` | AdminSettings | ADMIN |
| `/dashboard/accounting` | AdminAccounting | ADMIN, ACCOUNTANT |
| `/dashboard/attendance` | TeacherAttendance | ADMIN, TEACHER |
| `/dashboard/exams` | TeacherMarks | ADMIN, TEACHER |
| `/dashboard/assignments-manage` | TeacherAssignments | TEACHER |
| `/dashboard/my-students` | TeacherStudents | TEACHER |
| `/dashboard/notices` | StudentNotices | All authenticated |
| `/dashboard/results` | StudentResults | ADMIN, STUDENT, PARENT |
| `/dashboard/fees` | StudentFees | ADMIN, STUDENT, PARENT |
| `/dashboard/subjects` | StudentSubjects | STUDENT, PARENT |
| `/dashboard/routine` | StudentRoutine | STUDENT, PARENT |
| `/dashboard/assignments` | StudentAssignments | STUDENT, PARENT |
| `*` | Redirect → `/` | Catch-all |

### ProtectedRoute Component

```jsx
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    if (loading) return <Spinner />;
    if (!user) return <Navigate to="/login" />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" />;
    return children;
};
```

### Sidebar Navigation (by Role)

| Role | Sidebar Links |
|------|---------------|
| **All** | Dashboard, Notices |
| **Admin** | + Students, Teachers, Classes, Parents, Users, Approvals, Attendance, Exams, Mark Entry, Results, Fees, Salary, Accounting, Notices, Events, Gallery, Programs, Reviews, Admissions, Library, Transport, Inventory, Timetable, Class Analytics, Settings |
| **Teacher** | + Attendance, Exams & Marks, Assignments, My Students |
| **Student / Parent** | + Results, Subjects, Exam Routine, Assignments, Fee Details |
| **Accountant** | + Accounting |

---

## Design System

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#b20000` | Headers, buttons, active states |
| `primary-light` | `#d43333` | Hover states, lighter accents |
| `primary-dark` | `#8a0000` | Sidebar gradient, deep emphasis |
| `accent` | `#fead16` | CTAs, highlights, badges |
| `accent-light` | `#ffc94d` | Hover on accent elements |
| `accent-dark` | `#ec9f10` | Deep accent emphasis |
| `background` | `#f8f8f8` | Page backgrounds |

### Typography

| Token | Font | Fallbacks |
|-------|------|-----------|
| `font-sans` | Inter | system-ui, sans-serif |
| `font-serif` | Palatino Linotype | Palatino, Georgia, serif |

### Custom CSS Utilities

| Class | Purpose |
|-------|---------|
| `.section-title` | Consistent section heading style |
| `.section-subtitle` | Lighter subheading text |
| `.section-divider` | Centered decorative line |
| `.btn-primary` | Primary red button |
| `.btn-outline` | Outlined button variant |
| `.btn-accent` | Gold accent button |
| `.animate-fade-in-up` | Scroll entrance animation |
| `.animate-fade-in` | Simple fade entrance |

### Sidebar Gradient

```
background: linear-gradient(to bottom, primary-dark, #0a1045)
```

### Role Badge Colors

| Role | Color |
|------|-------|
| Admin | Blue |
| Teacher | Green |
| Student | Purple |
| Parent | Orange |

---

## Storage & File Uploads

### Supabase Storage Buckets

| Bucket | Access | Contents |
|--------|--------|----------|
| `gallery` | Public | School gallery photos (uploaded via AdminGallery) |
| `student-documents` | Public | Student profile photos + academic certificates |

### Upload Flow

```
1. Admin selects file in UI
2. api.js calls supabase.storage.from('bucket').uploadAuto(file)
3. Supabase stores file, returns public URL
4. URL is saved to corresponding DB record (photo_url, certificate_url, image_url)
5. UI renders image using the stored URL
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **Supabase account** with a provisioned backend (or local PostgreSQL for backend-only dev)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd collegewebsite

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies (optional — frontend uses Supabase SDK directly)
cd ../backend
npm install
```

### Running the Frontend

```bash
cd frontend
npm run dev
# → Opens at http://localhost:5173
```

### Running the Backend (Optional)

```bash
cd backend
npm run dev
# → Starts on http://localhost:5000
```

### Building for Production

```bash
cd frontend
npm run build
# → Output in frontend/dist/
```

---

## Environment Variables

### Frontend

The Supabase client is configured in `src/lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://egzhmzsntrlabfkdvngk.supabase.co',
    '<your-anon-key>'
);
```

> **Note**: For production, move these to `.env` files:
> ```
> VITE_SUPABASE_URL=https://egzhmzsntrlabfkdvngk.supabase.co
> VITE_SUPABASE_ANON_KEY=your-anon-key-here
> ```

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Server port |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/seven_star_school` | PostgreSQL connection string |
| `JWT_SECRET` | (required) | Secret for JWT token signing |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin |

---

## Deployment

### Current Deployment

- **Platform**: Vercel
- **Live URL**: [https://frontend-nu-eosin-89.vercel.app](https://frontend-nu-eosin-89.vercel.app)
- **Method**: Source deployment (not pre-built)

### Deployment Configuration

```json
{
    "buildCommand": "npm run build",
    "installCommand": "npm install",
    "outputDirectory": "dist"
}
```

### Deploying Updates

Deploy from the **source directory** (`frontend/`), not the pre-built `dist/` folder:

```
Source Directory: /path/to/collegewebsite/frontend
Build Command:   npm run build
Install Command: npm install
Output Dir:      dist
```

> **⚠️ Important**: Deploying a pre-built `dist/` folder directly causes deployment failures. Always deploy from the source directory with build commands configured.

---

## Future Roadmap

### ✅ Completed (Previously Planned)

| Feature | Status |
|---------|--------|
| Row Level Security (RLS) on all 55 tables | ✅ Done |
| Environment variable externalization (VITE_*) | ✅ Done |
| Exam Management Admin Page | ✅ Built — `/dashboard/manage-exams` with multi-class support |
| Review Moderation Admin Page | ✅ Built — `/dashboard/manage-reviews` |
| Admission Application Management | ✅ Built — `/dashboard/admissions` |
| Report Card / Transcript Generation | ✅ Built — `generateReportCard.js` utility |
| Timetable Management | ✅ Built — `/dashboard/timetable` |
| Library Management Module | ✅ Built — `/dashboard/library` (50 books seeded) |
| Transport Management Module | ✅ Built — `/dashboard/transport` (8 routes seeded) |
| Bulk Data Operations | ✅ CSVImportModal component built |
| Lazy Loading Dashboard Pages | ✅ All 37 pages use `React.lazy` + `Suspense` |

---

### 🔴 Phase 1 — Security Enhancements (High Priority)

#### 1.1 Server-Side Password Hashing
- **Current**: Passwords are hashed client-side using `bcryptjs`
- **Target**: Move password hashing to a Supabase Edge Function or the Express backend
- **Why**: Client-side hashing means the hash itself becomes the password equivalent

#### 1.2 Proper JWT Authentication
- **Current**: JWT tokens are mock-generated client-side; not verified by any server
- **Target**: Implement proper JWT signing on the server, verify tokens on protected API calls
- **Implementation**: Sign JWT server-side, add Supabase RLS policies tied to JWT claims

---

### 🟡 Phase 2 — Feature Enhancements (Medium Priority)

#### 2.1 Fee Payment Integration
- **Current**: Fee tracking is read-only (no payment processing)
- **Target**: Integrate payment gateway (Khalti / eSewa for Nepal)

#### 2.2 SMS / Email Notifications
- **Target**: Automated notifications for fee reminders, attendance alerts, results published
- **Implementation**: Supabase Edge Functions triggering email (Resend) or SMS (Sparrow SMS)

#### 2.3 Hostel Management Module
- **New tables**: `hostels`, `rooms`, `room_assignments`
- **Features**: Room allocation, hostel fee tracking

#### 2.4 Real-Time Features (Supabase WebSocket)
- **Target**: Live attendance updates, real-time notice push, dashboard auto-refresh

---

### 🟢 Phase 3 — Advanced Features (Lower Priority)

#### 3.1 Multi-Language Support (i18n)
- English (default) + Nepali (नेपाली)

#### 3.2 Mobile App (React Native)
- Parent app + Teacher app, reusing `api.js` functions

#### 3.3 AI-Powered Features
- Automated report card remarks, performance prediction, chatbot

#### 3.4 Analytics & Reporting Dashboard
- Student performance trends, attendance heatmaps, fee collection trends

---

### 🔵 Phase 4 — Infrastructure & DevOps

#### 4.1 Testing Suite
- Unit Tests (Vitest), Component Tests (Testing Library), E2E Tests (Playwright)

#### 4.2 CI/CD Pipeline
- GitHub Actions: lint, build, auto-deploy to Vercel

#### 4.3 TypeScript Migration
- Gradual migration: `api.js` → `api.ts`, typed contexts

#### 4.4 Error Monitoring
- Sentry integration for frontend error tracking

---

## Known Limitations

| Area | Limitation | Status |
|------|-----------|--------|
| **Authentication** | Password hashing is client-side (bcryptjs) | Planned fix: server-side Edge Function |
| **JWT** | Tokens are mock-generated client-side | Planned fix: server-signed JWTs |
| **RLS** | RLS policies enabled on all 55 tables (read for authenticated, write for admin) | ✅ Implemented |
| **Backend** | Express backend is not actively used; frontend uses Supabase SDK directly | Legacy — may be removed |
| **Payments** | Fee tracking is read-only (no payment processing) | Planned: Khalti/eSewa integration |
| **Notifications** | No email/SMS notifications | Planned: Supabase Edge Functions |
| **Pagination** | Most lists load all records at once | Consider cursor-based pagination for scale |
| **Offline** | No offline support / PWA | Consider service workers for future |

---

## License

This project is proprietary software developed for **Seven Star English Boarding School**, Devdaha, Rupandehi, Nepal.

All rights reserved. Unauthorized copying, modification, or distribution is prohibited.

---

<div align="center">

**Built with ❤️ for Seven Star English Boarding School**

*Devdaha, Rupandehi, Lumbini Province, Nepal*

*Established 2063 B.S.*

</div>
