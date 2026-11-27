/* ==========================================================================
   Origyn API layer
   --------------------------------------------------------------------------
   MOCK IMPLEMENTATION. Everything is stored in this browser's localStorage so
   the front end runs on its own while the backend is being built.

   Every function is async and returns plain objects, exactly like a fetch()
   call would. To connect the real backend, replace each function body with a
   request to your server and keep the same names and return shapes. Pages
   and components never touch localStorage directly.

   IMPORTANT: because this mock lives in one browser, data is NOT shared
   between computers. Passwords are stored in plain text here; the real
   backend must hash them.
   ========================================================================== */

import { seedDemoData } from "./mockData.js";
import { roman } from "../utils/format.js";

const KEY = "origyn.db.v1";
const DAY = 86400000;

const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const reply = (v) => new Promise((resolve) => setTimeout(() => resolve(clone(v)), 60));
const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

function emptyDb() {
  return {
    version: 1,
    institution: null,
    settings: { threshold: 35, maxUploadMb: 10, formats: [".docx", ".pdf", ".txt"], backupTime: "02:00" },
    faculties: [],
    users: [],
    courses: [],
    assignments: [],
    submissions: [],
    pairs: [],
    activity: [],
  };
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : emptyDb();
  } catch {
    return emptyDb();
  }
}

function write(d) {
  localStorage.setItem(KEY, JSON.stringify(d));
}

function fail(message) {
  throw new Error(message);
}

function log(d, title, meta) {
  d.activity.unshift({ id: uid("act"), title, meta, at: now() });
  d.activity = d.activity.slice(0, 100);
}

function safeUser(u) {
  if (!u) return null;
  const { password, ...rest } = u; // eslint-disable-line no-unused-vars
  return rest;
}

const userName = (d, id) => d.users.find((u) => u.id === id)?.name ?? "Unknown";
const ext = (name) => "." + String(name).split(".").pop().toLowerCase();
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());

export function makeReceiptId() {
  const n = String(Math.floor(Math.random() * 99999) + 1).padStart(5, "0");
  const s = Math.random().toString(36).slice(2, 4).toUpperCase();
  return `OG-${n}-${s}`;
}

function tempPassword() {
  const part = () => Math.random().toString(36).slice(2, 6);
  return `${part()}-${part()}`;
}

function dueAt(a) {
  return new Date(`${a.dueDate}T${a.dueTime || "23:59"}`);
}

function isOpen(a) {
  return a.status === "open" && dueAt(a) > new Date();
}

function coursesForStudent(d, s) {
  return d.courses.filter((c) => c.programme === s.programme && Number(c.semester) === Number(s.semester));
}

function studentsInCourse(d, c) {
  return d.users.filter(
    (u) => u.role === "student" && u.programme === c.programme && Number(u.semester) === Number(c.semester)
  );
}

function withCourse(d, a) {
  if (!a) return null;
  const c = d.courses.find((x) => x.id === a.courseId);
  return { ...a, isOpen: isOpen(a), course: c ? { ...c, teacherName: userName(d, c.teacherId) } : null };
}

function pairSide(d, side) {
  if (side.submissionId) {
    const s = d.submissions.find((x) => x.id === side.submissionId);
    return { name: userName(d, s?.studentId), fileName: s?.fileName ?? "" };
  }
  return { name: side.label, fileName: side.fileName ?? "" };
}

function pairView(d, p) {
  return {
    ...p,
    aView: pairSide(d, p.a),
    bView: pairSide(d, p.b),
    assignment: withCourse(d, d.assignments.find((a) => a.id === p.assignmentId)),
  };
}

function submissionStatus(d, s, assignment) {
  if (s.highestMatch == null) return "Not checked";
  const pairs = d.pairs.filter(
    (p) => p.a.submissionId === s.id || p.b.submissionId === s.id
  );
  if (pairs.some((p) => p.status === "concern")) return "Concern";
  if (pairs.some((p) => p.status === "pending")) return "Pending";
  if (s.highestMatch >= assignment.threshold && pairs.length === 0) return "Pending";
  return "Cleared";
}

function ownCourse(d, teacherId, courseId) {
  const c = d.courses.find((x) => x.id === courseId && x.teacherId === teacherId);
  if (!c) fail("Course not found.");
  return c;
}

function ownAssignment(d, teacherId, assignmentId) {
  const a = d.assignments.find((x) => x.id === assignmentId);
  if (!a) fail("Assignment not found.");
  ownCourse(d, teacherId, a.courseId);
  return a;
}

function checkUserInput(d, input) {
  if (!input.name?.trim()) fail("Enter the person's full name.");
  if (!isEmail(input.email)) fail("Enter a valid email address.");
  const email = input.email.trim().toLowerCase();
  if (d.users.some((u) => u.email === email)) fail(`An account already uses ${email}.`);
  if (input.role === "student") {
    if (!input.programme) fail("Choose a programme.");
    if (!input.semester) fail("Choose a semester.");
  }
  return email;
}

function buildUser(d, input) {
  const email = checkUserInput(d, input);
  const password = tempPassword();
  const user = {
    id: uid("usr"),
    role: input.role,
    name: input.name.trim(),
    email,
    password,
    status: "invited",
    createdAt: now(),
  };
  if (input.role === "student") {
    user.studentId = input.studentId?.trim() || "";
    user.programme = input.programme;
    user.semester = Number(input.semester);
  }
  if (input.role === "teacher") user.faculty = input.faculty || "";
  return { user, password };
}

/**
 * MOCK similarity check: gives the submission a placeholder score and flags it
 * for review when it reaches the threshold. The real backend runs the
 * similarity engine here, automatically, when a submission arrives.
 */
function scoreSubmission(d, a, s) {
  const hash = [...s.id].reduce((n, ch) => n + ch.charCodeAt(0), 0);
  s.highestMatch = 5 + (hash % 26);
  if (s.highestMatch >= a.threshold) {
    d.pairs.push({
      id: uid("pair"), assignmentId: a.id, a: { submissionId: s.id },
      b: { label: "Earlier submissions", fileName: "" }, score: s.highestMatch,
      status: "pending", textA: "", textB: "", passages: [], createdAt: now(),
    });
  }
}

function parseCsv(text) {
  const rows = [];
  for (const line of String(text).split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i += 1; }
      else if (ch === '"') quoted = !quoted;
      else if (ch === "," && !quoted) { cells.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    cells.push(cur.trim());
    rows.push(cells);
  }
  return rows;
}

/* ========================================================================== */

export const api = {
  /* ---------- Setup & sign-in ---------- */

  async getSetupStatus() {
    const d = read();
    return reply({ needsSetup: !d.users.some((u) => u.role === "admin"), institution: d.institution });
  },

  async completeSetup({ institutionName, department, adminName, email, password, loadDemo }) {
    if (read().users.some((u) => u.role === "admin")) fail("Origyn is already set up on this server.");
    if (!institutionName?.trim()) fail("Enter your institution's name.");
    if (!adminName?.trim()) fail("Enter your full name.");
    if (!isEmail(email)) fail("Enter a valid email address.");
    if (!password || password.length < 8) fail("Use a password with at least 8 characters.");

    const d = emptyDb();
    d.institution = {
      name: institutionName.trim(),
      department: department?.trim() || "",
      demo: Boolean(loadDemo),
      createdAt: now(),
    };
    const admin = {
      id: uid("usr"),
      role: "admin",
      name: adminName.trim(),
      email: email.trim().toLowerCase(),
      password,
      status: "active",
      createdAt: now(),
    };
    d.users.push(admin);
    if (loadDemo) seedDemoData(d);
    log(d, "Origyn set up", `${d.institution.name} · by ${admin.name}`);
    write(d);
    return reply(safeUser(admin));
  },

  async login(email, password) {
    const d = read();
    const u = d.users.find((x) => x.email === String(email).trim().toLowerCase());
    if (!u || u.password !== password) fail("Email or password is incorrect.");
    if (u.status === "invited") {
      u.status = "active";
      write(d);
    }
    return reply(safeUser(u));
  },

  async getUser(id) {
    const u = read().users.find((x) => x.id === id);
    if (!u) fail("Account not found.");
    return reply(safeUser(u));
  },

  /* ---------- Student ---------- */

  async getStudentHome(studentId) {
    const d = read();
    const me = d.users.find((u) => u.id === studentId && u.role === "student");
    if (!me) fail("Account not found.");

    const courses = coursesForStudent(d, me);
    const courseIds = courses.map((c) => c.id);
    const assignments = d.assignments
      .filter((a) => courseIds.includes(a.courseId) && a.status !== "draft")
      .map((a) => ({
        ...withCourse(d, a),
        mySubmission: d.submissions.find((s) => s.assignmentId === a.id && s.studentId === me.id) || null,
      }))
      .sort((x, y) => dueAt(x) - dueAt(y));

    const submissions = d.submissions
      .filter((s) => s.studentId === me.id)
      .map((s) => ({ ...s, assignment: withCourse(d, d.assignments.find((a) => a.id === s.assignmentId)) }))
      .sort((x, y) => y.submittedAt.localeCompare(x.submittedAt));

    const courseCards = courses.map((c) => {
      const list = assignments.filter((a) => a.courseId === c.id);
      const todo = list.filter((a) => a.isOpen && !a.mySubmission);
      return { ...c, teacherName: userName(d, c.teacherId), assignmentCount: list.length, nextDue: todo[0] || null };
    });

    return reply({ me: safeUser(me), courses: courseCards, assignments, submissions });
  },

  async getAssignmentForStudent(studentId, assignmentId) {
    const d = read();
    const me = d.users.find((u) => u.id === studentId);
    const a = d.assignments.find((x) => x.id === assignmentId && x.status !== "draft");
    if (!me || !a || !coursesForStudent(d, me).some((c) => c.id === a.courseId)) fail("Assignment not found.");
    const mySubmission = d.submissions.find((s) => s.assignmentId === a.id && s.studentId === me.id) || null;
    const { formats, maxUploadMb } = d.settings;
    return reply({ ...withCourse(d, a), mySubmission, settings: { formats, maxUploadMb } });
  },

  /** files: one or more { name, size }. Their combined size must stay under settings.maxUploadMb. */
  async submitAssignment({ studentId, assignmentId, files }) {
    const d = read();
    const a = d.assignments.find((x) => x.id === assignmentId);
    if (!a) fail("Assignment not found.");
    if (!isOpen(a)) fail("This assignment is closed.");
    if (!files?.length) fail("Choose at least one file.");
    const bad = files.find((f) => !d.settings.formats.includes(ext(f.name)));
    if (bad) fail(`${bad.name}: allowed formats are ${d.settings.formats.join(", ")}.`);
    const total = files.reduce((n, f) => n + f.size, 0);
    if (total > d.settings.maxUploadMb * 1048576) fail(`Your files can add up to ${d.settings.maxUploadMb} MB in total.`);

    const replaced = d.submissions.filter((s) => s.assignmentId === assignmentId && s.studentId === studentId).map((s) => s.id);
    d.submissions = d.submissions.filter((s) => !replaced.includes(s.id));
    // A resubmission drops flags still waiting for review; decided ones stay on record.
    d.pairs = d.pairs.filter(
      (p) => p.status !== "pending" || (!replaced.includes(p.a.submissionId) && !replaced.includes(p.b.submissionId))
    );
    const submission = {
      id: uid("sub"),
      assignmentId,
      studentId,
      files: files.map((f) => ({ name: f.name, size: f.size })),
      fileName: files.map((f) => f.name).join(", "),
      fileSize: total,
      submittedAt: now(),
      receiptId: makeReceiptId(),
      highestMatch: null,
      teacherNote: null,
    };
    d.submissions.push(submission);
    scoreSubmission(d, a, submission);
    log(d, "Submission received", `${a.title.split(":")[0]} · ${userName(d, studentId)}`);
    write(d);
    return reply(submission);
  },

  /* ---------- Teacher ---------- */

  async getTeacherHome(teacherId) {
    const d = read();
    const courses = d.courses.filter((c) => c.teacherId === teacherId);
    const courseIds = courses.map((c) => c.id);
    const assignments = d.assignments.filter((a) => courseIds.includes(a.courseId));
    const assignmentIds = assignments.map((a) => a.id);
    const subs = d.submissions.filter((s) => assignmentIds.includes(s.assignmentId));
    const pairs = d.pairs.filter((p) => assignmentIds.includes(p.assignmentId));
    const since = Date.now() - DAY;

    return reply({
      courses,
      assignments: assignments
        .filter((a) => a.status !== "draft")
        .map((a) => ({ ...withCourse(d, a), submitted: subs.filter((s) => s.assignmentId === a.id).length }))
        .sort((x, y) => dueAt(y) - dueAt(x)),
      activeAssignments: assignments.filter(isOpen).length,
      submissionCount: subs.length,
      newSubmissions: subs.filter((s) => new Date(s.submittedAt).getTime() > since).length,
      unchecked: subs.filter((s) => s.highestMatch == null).length,
      pending: pairs
        .filter((p) => p.status === "pending")
        .sort((x, y) => y.score - x.score)
        .map((p) => pairView(d, p)),
    });
  },

  async getTeacherCourse(teacherId, courseId) {
    const d = read();
    const course = ownCourse(d, teacherId, courseId);
    const students = studentsInCourse(d, course);
    const assignments = d.assignments
      .filter((a) => a.courseId === course.id)
      .map((a) => ({ ...a, isOpen: isOpen(a), submitted: d.submissions.filter((s) => s.assignmentId === a.id).length }))
      .sort((x, y) => y.createdAt.localeCompare(x.createdAt));
    return reply({
      course,
      courses: d.courses.filter((c) => c.teacherId === teacherId),
      students: students.map(safeUser),
      assignments,
      settings: d.settings,
    });
  },

  /** Create (no id) or update (with id) an assignment. publish: true makes it visible to students. */
  async saveAssignment(teacherId, input) {
    const d = read();
    const course = ownCourse(d, teacherId, input.courseId);
    if (!input.title?.trim()) fail("Give the assignment a title.");
    if (!input.dueDate) fail("Pick a due date.");
    if (input.file && ![".pdf", ".docx"].includes(ext(input.file.name))) {
      fail("The assignment file must be a .pdf or .docx file.");
    }
    if (input.file && input.file.size > d.settings.maxUploadMb * 1048576) {
      fail(`The maximum file size is ${d.settings.maxUploadMb} MB.`);
    }

    const fields = {
      title: input.title.trim(),
      instructions: input.instructions?.trim() || "",
      dueDate: input.dueDate,
      dueTime: input.dueTime || "23:59",
      threshold: Math.min(100, Math.max(0, Number(input.threshold) || d.settings.threshold)),
      file: input.file ? { name: input.file.name, size: input.file.size } : null,
      references: (input.references || []).map((f) => ({ name: f.name, size: f.size })),
    };

    let saved;
    if (input.id) {
      saved = ownAssignment(d, teacherId, input.id);
      Object.assign(saved, fields);
      if (input.publish) saved.status = "open";
      log(d, "Assignment updated", `${course.code} · ${saved.title}`);
    } else {
      saved = { id: uid("asg"), courseId: course.id, status: input.publish ? "open" : "draft", createdAt: now(), ...fields };
      d.assignments.push(saved);
      log(d, input.publish ? "Assignment published" : "Assignment saved as draft", `${course.code} · ${saved.title}`);
    }
    write(d);
    return reply(saved);
  },

  async deleteAssignment(teacherId, assignmentId) {
    const d = read();
    const a = ownAssignment(d, teacherId, assignmentId);
    d.assignments = d.assignments.filter((x) => x.id !== a.id);
    d.submissions = d.submissions.filter((s) => s.assignmentId !== a.id);
    d.pairs = d.pairs.filter((p) => p.assignmentId !== a.id);
    log(d, "Assignment deleted", a.title);
    write(d);
    return reply(true);
  },

  async getAssignmentSubmissions(teacherId, assignmentId) {
    const d = read();
    const a = ownAssignment(d, teacherId, assignmentId);
    const course = d.courses.find((c) => c.id === a.courseId);
    const students = studentsInCourse(d, course);
    const subs = d.submissions.filter((s) => s.assignmentId === a.id);
    const rows = subs
      .map((s) => ({ ...s, studentName: userName(d, s.studentId), status: submissionStatus(d, s, a) }))
      .sort((x, y) => (y.highestMatch ?? -1) - (x.highestMatch ?? -1));
    const missing = students.filter((st) => !subs.some((s) => s.studentId === st.id)).map((st) => st.name);
    return reply({
      assignment: withCourse(d, a),
      studentCount: students.length,
      rows,
      missing,
      pairs: d.pairs.filter((p) => p.assignmentId === a.id).map((p) => pairView(d, p)),
    });
  },

  async getPair(teacherId, pairId) {
    const d = read();
    const p = d.pairs.find((x) => x.id === pairId);
    if (!p) fail("Report not found.");
    ownAssignment(d, teacherId, p.assignmentId);
    return reply(pairView(d, p));
  },

  async decidePair(teacherId, pairId, decision, note) {
    const d = read();
    const p = d.pairs.find((x) => x.id === pairId);
    if (!p) fail("Report not found.");
    const a = ownAssignment(d, teacherId, p.assignmentId);
    p.status = decision === "concern" ? "concern" : "dismissed";
    p.note = note?.trim() || "";
    p.decidedAt = now();
    if (p.note) {
      for (const side of [p.a, p.b]) {
        const s = side.submissionId && d.submissions.find((x) => x.id === side.submissionId);
        if (s) s.teacherNote = p.note;
      }
    }
    log(d, p.status === "concern" ? "Concern confirmed" : "Flag dismissed", `${a.title.split(":")[0]} · ${p.score}%`);
    write(d);
    return reply(p);
  },

  /* ---------- Admin ---------- */

  async getAdminHome() {
    const d = read();
    const count = (role) => d.users.filter((u) => u.role === role).length;
    const flaggedSubs = d.submissions.filter((s) => {
      const a = d.assignments.find((x) => x.id === s.assignmentId);
      return a && s.highestMatch != null && s.highestMatch >= a.threshold;
    });
    const flagRate = d.courses.map((c) => {
      const ids = d.assignments.filter((a) => a.courseId === c.id).map((a) => a.id);
      const total = d.submissions.filter((s) => ids.includes(s.assignmentId)).length;
      const flagged = flaggedSubs.filter((s) => ids.includes(s.assignmentId)).length;
      return { code: c.code, total, rate: total ? Math.round((flagged / total) * 100) : 0 };
    });
    return reply({
      institution: d.institution,
      users: { total: d.users.length, students: count("student"), teachers: count("teacher"), admins: count("admin") },
      submissions: d.submissions.length,
      flaggedShare: d.submissions.length ? (flaggedSubs.length / d.submissions.length) * 100 : 0,
      pending: d.pairs.filter((p) => p.status === "pending").length,
      concerns: d.pairs.filter((p) => p.status === "concern").length,
      dismissed: d.pairs.filter((p) => p.status === "dismissed").length,
      flagRate,
      activity: d.activity.slice(0, 6),
    });
  },

  async listUsers() {
    const d = read();
    return reply({
      users: d.users
        .map((u) => ({
          ...safeUser(u),
          courses: u.role === "teacher" ? d.courses.filter((c) => c.teacherId === u.id).map((c) => c.code) : [],
        }))
        .sort((x, y) => x.name.localeCompare(y.name)),
      faculties: d.faculties,
      courses: d.courses.map((c) => ({ ...c, teacherName: c.teacherId ? userName(d, c.teacherId) : "" })),
    });
  },

  /** Returns the new user and a one-time temporary password to hand over. */
  async createUser(input) {
    const d = read();
    const { user, password } = buildUser(d, input);
    d.users.push(user);
    if (user.role === "teacher" && Array.isArray(input.courseIds)) {
      for (const c of d.courses) if (input.courseIds.includes(c.id)) c.teacherId = user.id;
    }
    log(d, `${user.role[0].toUpperCase()}${user.role.slice(1)} account created`, user.email);
    write(d);
    return reply({ user: safeUser(user), tempPassword: password });
  },

  /**
   * REAL CALL (not mocked): emails a new student or teacher their name, email
   * and temporary password through the mail service (server/mail-server.js).
   * Resolves { sent: true } or throws with the reason it was not sent.
   */
  async sendAccountEmail({ role, name, email, tempPassword }) {
    const institution = read().institution?.name || "";
    let res;
    try {
      res = await fetch("/api/mail/account-created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, name, email, tempPassword, institution, loginUrl: `${window.location.origin}/login` }),
      });
    } catch {
      fail("The mail service is not reachable. Start it with npm run mail.");
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) fail(body.error || (res.status === 404 || res.status >= 500 ? "The mail service is not running. Start it with npm run mail." : `Email failed (${res.status}).`));
    return { sent: true };
  },

  /** CSV columns: name, email, student_id, programme, semester (header row optional). */
  async importStudents(csvText) {
    const d = read();
    const rows = parseCsv(csvText);
    if (rows.length && /name/i.test(rows[0][0]) && /mail/i.test(rows[0][1] || "")) rows.shift();
    const created = [];
    const skipped = [];
    rows.forEach((cells, i) => {
      const [name, email, studentId, programme, semester] = cells;
      try {
        const { user, password } = buildUser(d, { role: "student", name, email, studentId, programme, semester });
        d.users.push(user);
        created.push({ name: user.name, email: user.email, tempPassword: password });
      } catch (err) {
        skipped.push({ line: i + 1, reason: err.message });
      }
    });
    if (created.length) log(d, "Students imported", `${created.length} from CSV`);
    write(d);
    return reply({ created, skipped });
  },

  async getCoursesAndTerms() {
    const d = read();
    return reply({
      faculties: d.faculties,
      teachers: d.users.filter((u) => u.role === "teacher").map(safeUser),
      courses: d.courses
        .map((c) => ({ ...c, teacherName: c.teacherId ? userName(d, c.teacherId) : "Unassigned", studentCount: studentsInCourse(d, c).length }))
        .sort((x, y) => x.code.localeCompare(y.code)),
    });
  },

  async createCourse({ code, name, programme, semester, teacherId }) {
    const d = read();
    if (!code?.trim() || !name?.trim()) fail("Enter a course code and name.");
    if (!programme || !semester) fail("Choose a programme and semester.");
    const id = code.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (d.courses.some((c) => c.id === id)) fail(`${code.trim()} already exists.`);
    const course = { id, code: code.trim().toUpperCase(), name: name.trim(), programme, semester: Number(semester), teacherId: teacherId || "" };
    d.courses.push(course);
    log(d, "Course created", `${course.code} · ${course.name}`);
    write(d);
    return reply(course);
  },

  async createFaculty({ code, name, semesters }) {
    const d = read();
    if (!code?.trim() || !name?.trim()) fail("Enter a faculty code and name.");
    const c = code.trim().toUpperCase();
    if (d.faculties.some((f) => f.code === c)) fail(`${c} already exists.`);
    const faculty = { code: c, name: name.trim(), semesters: Math.max(1, Number(semesters) || 8), current: 1 };
    d.faculties.push(faculty);
    log(d, "Faculty added", `${faculty.code} · ${faculty.name}`);
    write(d);
    return reply(faculty);
  },

  /** Moves the faculty to its next semester and every student in it forward by one. */
  async openNextSemester(facultyCode) {
    const d = read();
    const f = d.faculties.find((x) => x.code === facultyCode);
    if (!f) fail("Faculty not found.");
    if (f.current >= f.semesters) fail(`${f.code} is already in its final semester.`);
    f.current += 1;
    for (const u of d.users) {
      if (u.role === "student" && u.programme === f.code && u.semester < f.semesters) u.semester += 1;
    }
    log(d, `Semester ${roman(f.current)} opened`, f.code);
    write(d);
    return reply(f);
  },

  async getSettings() {
    const d = read();
    return reply({ settings: d.settings, institution: d.institution });
  },

  async updateSettings({ institutionName, department, threshold, maxUploadMb, formats, backupTime }) {
    const d = read();
    if (!institutionName?.trim()) fail("Enter your institution's name.");
    if (!formats?.length) fail("Allow at least one file format.");
    d.institution = { ...d.institution, name: institutionName.trim(), department: department?.trim() || "" };
    d.settings = {
      threshold: Math.min(100, Math.max(0, Number(threshold) || 35)),
      maxUploadMb: Math.min(100, Math.max(1, Number(maxUploadMb) || 10)),
      formats,
      backupTime: backupTime || "02:00",
    };
    log(d, "System settings changed", `Threshold ${d.settings.threshold}% · max ${d.settings.maxUploadMb} MB`);
    write(d);
    return reply(d.settings);
  },

  /** Backup of everything except passwords. */
  async exportData() {
    const d = read();
    return reply({ ...d, users: d.users.map(safeUser), exportedAt: now() });
  },

  /** Wipes this server's Origyn data. The next visit goes back to first-run setup. */
  async resetAll() {
    localStorage.removeItem(KEY);
    return reply(true);
  },
};
