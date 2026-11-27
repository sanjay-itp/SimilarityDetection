# Origyn · Front end

Origyn is a similarity detection system for coursework. Each institution hosts it on its own server, and the person who hosts it becomes the **administrator**.

This repository contains the **front end only** (React + Vite). It follows the "v2 · Minimal" Figma design: white, minimal, one blue accent, no icons.

> **Important: there is no backend yet.**
> `src/services/api.js` is a mock that keeps all data in the browser's `localStorage`. That means:
> - Data is **not shared between computers**. A teacher on one PC will not see a student's submission made on another PC.
> - Uploaded files are not stored. Only the file name and size are saved.
> - The similarity scores in the demo are fixed sample values. New submissions get a placeholder score the moment they arrive, not a real one.
> - Passwords are stored in plain text in the mock.
>
> All of this goes away once `api.js` is pointed at the real Origyn server (see [Connecting the backend](#connecting-the-backend)).

---

## Requirements

- Node.js 20 or newer
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

## Account emails

When an admin adds a student or teacher (one at a time, or by CSV import), Origyn emails them their name, email and temporary password. The browser cannot send email by itself, so a small mail service in `server/mail-server.js` does it.

1. Copy `.env.example` to `.env` and fill in your institution's SMTP server, user, password and sender address. `.env` is never committed.
2. Run the mail service next to the app, in its own terminal:

```bash
npm run mail
```

The dev server (`npm run dev`) and the hosted app (`npm run host`) forward `/api/mail/*` to it. If the mail service is not running or SMTP is not set up, the account is still created, the popup says the email was not sent and why, and the temporary password is shown so the admin can hand it over.

The mail service only listens on `127.0.0.1` and allows 60 emails a minute by default (`MAIL_RATE_PER_MIN`). It is a stopgap: once the real backend exists, it should send this email itself as part of creating the account.

## First run: the host becomes the admin

1. Open Origyn in a browser. With no administrator yet, it shows **Set up Origyn**.
2. Enter the institution name, your name, email and a password (8+ characters). This account is the administrator.
3. Leave **Load demo data** ticked to try Origyn out with sample courses, teachers and students. Untick it for a clean start.
4. As admin you then:
   - add faculties and semesters, then courses, under **Courses & terms**
   - add students under **Students** (Add student opens a popup form), or import them from a CSV file (`name, email, student_id, programme, semester`)
   - add teachers under **Teachers** (Add teacher opens a popup form where you can also assign courses)
   - add more administrators under **System settings → Administrators**
   - each new student and teacher is emailed their temporary password (see [Account emails](#account-emails)); the popup also shows it once
   - click a name in the Students or Teachers list to see that person's details

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
server/
  mail-server.js           sends "account created" emails over SMTP (npm run mail)
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
    student/               Dashboard, Courses, Assignments, SubmitAssignment (also the "View only" page)
    teacher/               Dashboard, Courses, Course (+ AssignmentForm), ReviewQueue, Submissions, Report
    admin/                 Dashboard, Students, Teachers, AccountModal (add-account popup), UserDetails, CoursesTerms, SystemSettings
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

### Phase 1 changes

Student
- Dashboard: Submit and Open all buttons are blue; no Teacher notes card or note activity; no Notifications menu item.
- My Courses: no semester button and no help note under an empty list.
- Semesters show as Roman numerals (I to VIII) everywhere.
- My Assignments: "View receipt" is now "View only", a read-only page with the brief and the files handed in.
- Submit assignment: several files at once, up to the upload limit (10 MB by default) in total. No "Before you submit" panel, no confirmation checkbox. After submitting or cancelling, the student goes straight back to My Assignments. The receipt page is gone.

Teacher
- Dashboard: title is "Good morning/afternoon/evening, <name>" with no line under it; no Run comparison button (submissions are checked as they arrive); no Confirmed concerns card; no "Across ..." line on Active assignments.
- Course page: no View roster button.

Admin
- Dashboard: Export semester report, Add teacher and Add student buttons are replaced by **Add new course**, which opens the course form on Courses & terms.
- Students and Teachers: click a row to see that person's details.
- New student and teacher accounts are emailed their details (see [Account emails](#account-emails)).

Not built yet (shown greyed out in the menus): Profile, Analytics, teacher Settings, Audit log.
