# Origyn · Front end

Origyn is a similarity detection system for coursework. Each institution hosts it on its own server, and the person who hosts it becomes the **administrator**.

This repository contains the **front end only** (React + Vite). It follows the "v2 · Minimal" Figma design: white, minimal, one blue accent, no icons.

> **Important: there is no backend yet.**
> `src/services/api.js` is a mock that keeps all data in the browser's `localStorage`. That means:
> - Data is **not shared between computers**. A teacher on one PC will not see a student's submission made on another PC.
> - Uploaded files are not stored. Only the file name and size are saved.
> - The similarity scores in the demo are fixed sample values. "Run comparison" gives placeholder scores, not real ones.
> - Passwords are stored in plain text in the mock.
>
> All of this goes away once `api.js` is pointed at the real Origyn server (see [Connecting the backend](#connecting-the-backend)).

---

## Requirements

- Node.js 18 or newer
- npm

## Run it on your computer (development)

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173. Other computers on the same network can use `http://<this-computer's-IP>:5173`.

## Host it for your institution

```bash
npm install
```

```bash
npm run build
```

```bash
npm run host
```

This serves the built app on port **8080** to the whole network: `http://<server-IP>:8080`.

To use your own web server instead, copy the `dist/` folder to it. Origyn uses normal URLs such as `/teacher/review`, so the server must send `index.html` for every path. For nginx:

```nginx
location / {
  root /var/www/origyn/dist;
  try_files $uri /index.html;
}
```

## First run: the host becomes the admin

1. Open Origyn in a browser. With no administrator yet, it shows **Set up Origyn**.
2. Enter the institution name, your name, email and a password (8+ characters). This account is the administrator.
3. Leave **Load demo data** ticked to try Origyn out with sample courses, teachers and students. Untick it for a clean start.
4. As admin you then:
   - add faculties and semesters, then courses, under **Courses & terms**
   - add students under **Students** (Add student opens a popup form), or import them from a CSV file (`name, email, student_id, programme, semester`)
   - add teachers under **Teachers** (Add teacher opens a popup form where you can also assign courses)
   - add more administrators under **System settings → Administrators**
   - hand each person the **temporary password** Origyn shows in the popup right after the account is created

Students see every course for their programme and semester. They cannot join courses themselves.

**System settings → Reset Origyn** wipes everything and returns to first-run setup.

### Demo accounts (only if demo data was loaded)

All demo teachers and students use the password `origyn123`.

| Role | Email |
|---|---|
| Teacher | c.thapa@ics.dev (ENGL 210) |
| Teacher | r.suri@ics.dev (CACS 101) |
| Student | priya@student.ics.dev |
| Student | daniel@student.ics.dev |

The admin is the account you created during setup.

---

## Project structure

```
src/
  main.jsx                 entry point, loads base.css
  App.jsx                  all routes
  services/
    api.js                 data layer (mock); swap for real API calls
    mockData.js            demo data loaded at setup
  context/AuthContext.jsx  signed-in user, login / logout
  hooks/useAsync.js        loading / error state for api calls
  utils/format.js          dates, file sizes, CSV download
  components/              shared UI: AppShell (sidebar), FileUpload, Modal (popup), ui.jsx
  layouts/                 StudentLayout, TeacherLayout, AdminLayout
  pages/
    auth/                  Login, Setup
    student/               Dashboard, Courses, Assignments, SubmitAssignment, Receipt
    teacher/               Dashboard, Courses, Course (+ AssignmentForm), ReviewQueue, Submissions, Report
    admin/                 Dashboard, Students, Teachers, AccountModal (add-account popup), CoursesTerms, SystemSettings
  styles/
    base.css               tokens + shared components (all roles)
    auth.css               sign-in and setup only
    student.css            student pages only
    teacher.css            teacher pages only
    admin.css              admin pages only
```

### CSS: one file per role

| File | Loaded by | Scoped with |
|---|---|---|
| `styles/base.css` | `main.jsx` | global |
| `styles/auth.css` | `pages/auth/*` | `.role-auth` |
| `styles/student.css` | `layouts/StudentLayout.jsx` | `.role-student` |
| `styles/teacher.css` | `layouts/TeacherLayout.jsx` | `.role-teacher` |
| `styles/admin.css` | `layouts/AdminLayout.jsx` | `.role-admin` |

Shared parts (buttons, cards, tables, forms, colours) live only in `base.css`, so a colour or spacing change is made once. Each role file holds only that role's page styles, prefixed with its role class so it cannot affect another role. Colours are CSS variables at the top of `base.css`.

## Connecting the backend

Pages never touch storage directly; they only call functions on `api` in `src/services/api.js`. To connect the real server:

1. Replace each function body with a `fetch()` to your endpoint, keeping the same name, arguments and return shape.
2. Send the real files (`File` objects from the upload fields) as `multipart/form-data`. The mock keeps only `{ name, size }`.
3. Replace the session handling in `AuthContext.jsx` (currently a user id in `localStorage`) with your server's session cookie or token.
4. Delete `mockData.js` once the server seeds its own data.

## Changes from the original design

1. Login: no side colour panel; white page with the sign-in card in the middle.
2. Fewer colours: white and grey, one blue accent.
3. New theme and name: **Origyn**.
4. Students cannot join courses and see no auto-enrolment messages.
5. Teacher dashboard: no "comparison jobs" panel.
6. Teachers can attach the assignment as a **.pdf or .docx** file.
7. Admin "Add student": no "joins courses automatically" message. Adding students and teachers uses a centred popup, and students and teachers have separate lists.
8. Admin dashboard: no "Submissions processed" card.
9. Admin user list: no Reset password or Disable actions.
10. No icons.

Not built yet (shown greyed out in the menus): Notifications, Profile, Analytics, teacher Settings, Audit log.
