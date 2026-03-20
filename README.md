# AMS - Attendance Management System

AMS is a premium, next-generation attendance management solution built with Next.js 15, AI facial recognition, and real-time geo-tracking. It's designed to automate and simplify attendance workflows for modern institutions and workplaces.

## 🚀 Key Features

- **AI-Powered Face Authentication**: Secure and instant verification using advanced facial recognition models to eliminate buddy-punching.
- **Precision Geo-fencing**: Restrict attendance logging to authorized GPS coordinates, ensuring users are physically present at the required location.
- **Role-Based Access Control**:
  - **Admin**: Full control over users (Teachers/Students), LMS settings, and global analytics.
  - **Teacher**: Manage lectures, subjects, and view student participation records.
  - **Student**: Effortless check-ins and personal attendance tracking.
- **Integrated LMS**: A built-in Learning Management System to handle subjects, classes, and academic scheduling.
- **Real-Time Analytics Dashboard**: Beautifully designed interactive dashboards providing deep insights into participation trends.
- **Automated Administrative Reporting**: Export comprehensive attendance data as Excel/CSV for payroll or academic compliance.
- **Responsive & Modern UI**: A high-end, animated interface built with Tailwind CSS and Framer Motion for a premium user experience.

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript.
- **Styling**: Tailwind CSS, Lucide React (Icons).
- **Animation**: Framer Motion, Lenis (Smooth Scroll).
- **Auth**: NextAuth.js.
- **State/Data**: Strapi (implied from lib/sdk), SWR/React Query patterns.

## 🛠 Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

- `/app`: Next.js App Router pages (Admin, Teacher, Student portals).
- `/components`: Reusable UI components including the new animated Home page.
- `/lib/sdk`: Integration layer for backend services and Strapi.
- `/face-recognition`: Core logic for AI-based face registration and verification.

---
© 2026 AMS Inc. All rights reserved.
