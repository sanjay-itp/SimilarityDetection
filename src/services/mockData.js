/* ==========================================================================
   Demo data, loaded only when the admin ticks "Load demo data" during setup.
   Dates are relative to today so "due soon" items always look current.
   ========================================================================== */

export const DEMO_PASSWORD = "origyn123";

const DAY = 86400000;

function iso(offsetDays, hours = 10, minutes = 0) {
  const d = new Date(Date.now() + offsetDays * DAY);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function ymd(offsetDays) {
  const d = new Date(Date.now() + offsetDays * DAY);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const ESSAY_A =
  "Communication technology has changed how people form communities. Social platforms allow instant connection across borders, but they also create echo chambers where opinions are rarely challenged. As a result, public debate becomes more divided than before. Schools should teach students to question what they read online.";
const ESSAY_B =
  "Today, social platforms allow instant connection across borders, but they also create echo chambers where opinions are rarely challenged. Many students rely on these platforms for news. Public debate becomes more divided than before, which is why media literacy matters in every classroom.";
const ESSAY_PASSAGES = [
  "allow instant connection across borders, but they also create echo chambers where opinions are rarely challenged",
  "public debate becomes more divided than before",
];

const TOMAS =
  "The printing press and the internet share one effect: both made information cheap. When information becomes cheap, attention becomes the scarce resource, and whoever controls attention shapes public opinion.";
const ARCHIVE =
  "Every new medium makes information cheaper to copy. When information becomes cheap, attention becomes the scarce resource. Newspapers, radio and television each fought for that attention in turn.";

const NUM_A =
  "To convert a decimal number to binary, divide the number by two repeatedly and record the remainders. Reading the remainders from bottom to top gives the binary value.";
const NUM_B =
  "Converting decimal to binary is simple: divide the number by two repeatedly and record the remainders. The answer is the remainders read from bottom to top.";

export function seedDemoData(d) {
  d.faculties = [
    { code: "BCA", name: "Computer Application", semesters: 8, current: 2 },
    { code: "BIM", name: "Information Management", semesters: 8, current: 3 },
  ];

  const teacher = (id, name, email, faculty, status = "active") => ({
    id, role: "teacher", name, email, password: DEMO_PASSWORD, faculty, status, createdAt: iso(-60),
  });
  const student = (id, name, email, studentId) => ({
    id, role: "student", name, email, password: DEMO_PASSWORD, studentId,
    programme: "BCA", semester: 2, status: "active", createdAt: iso(-60),
  });

  d.users.push(
    teacher("t-thapa", "Chandra Thapa", "c.thapa@ics.dev", "BCA"),
    teacher("t-suri", "Richa Suri", "r.suri@ics.dev", "BCA"),
    teacher("t-bajra", "Bishakha Bajracharya", "b.bajra@ics.dev", "BCA"),
    teacher("t-magar", "Sanjay Magar", "s.magar@ics.dev", "BIM", "invited"),
    teacher("t-karn", "Aarati Karn", "a.karn@ics.dev", "BCA"),
    student("s-priya", "Priya Sharma", "priya@student.ics.dev", "KU-2026-014"),
    student("s-daniel", "Daniel Okafor", "daniel@student.ics.dev", "KU-2026-021"),
    student("s-mei", "Mei Lin", "mei@student.ics.dev", "KU-2026-027"),
    student("s-tomas", "Tomas Alvarez", "tomas@student.ics.dev", "KU-2026-033")
  );

  const course = (id, code, name, teacherId) => ({ id, code, name, teacherId, programme: "BCA", semester: 2 });
  d.courses = [
    course("engl-210", "ENGL 210", "Academic Writing", "t-thapa"),
    course("cacs-101", "CACS 101", "Computer Fundamentals & Applications", "t-suri"),
    course("dbms-120", "DBMS 120", "Database Management Systems", "t-bajra"),
    course("math-115", "MATH 115", "Discrete Mathematics", "t-magar"),
    course("comm-105", "COMM 105", "Communication Skills", "t-karn"),
  ];

  const assignment = (id, courseId, title, status, offset, extra = {}) => ({
    id, courseId, title, status, instructions: "", dueDate: ymd(offset), dueTime: "23:59",
    threshold: 35, file: null, references: [], createdAt: iso(-30 + Math.min(offset, 0)), ...extra,
  });
  d.assignments = [
    assignment("a-essay2", "engl-210", "Essay 2: How Communication Technology Shapes Society", "open", 3, {
      instructions: "Write a 600-word essay on how communication technology shapes the way communities form and debate. Use at least three sources and cite them in APA style.",
      file: { name: "Essay2_brief.pdf", size: 245760 },
      createdAt: iso(-7),
    }),
    assignment("a-lab4", "dbms-120", "Lab Report 4: Normalisation", "open", 6, {
      instructions: "Normalise the library schema to third normal form and explain each step.",
      file: { name: "Lab4_schema.docx", size: 88000 },
      createdAt: iso(-5),
    }),
    assignment("a-quiz", "cacs-101", "Quiz prep: Computer Basics", "open", 16, {
      instructions: "Answer the ten short questions on the attached sheet.",
      dueTime: "10:00",
      createdAt: iso(-3),
    }),
    assignment("a-essay1", "engl-210", "Essay 1: The Printing Press", "closed", -40),
    assignment("a-lab3", "dbms-120", "Lab Report 3: ER Diagrams", "closed", -10),
    assignment("a-numsys", "cacs-101", "Assignment 1: Number Systems", "closed", -20),
    assignment("a-mcluhan", "engl-210", "Reading response: McLuhan", "draft", 20, { threshold: 40, createdAt: iso(-1) }),
  ];

  const sub = (id, assignmentId, studentId, fileName, fileSize, offset, highestMatch, receiptId, extra = {}) => ({
    id, assignmentId, studentId, fileName, fileSize, submittedAt: iso(offset, 9, 30),
    receiptId, highestMatch, teacherNote: null, ...extra,
  });
  d.submissions = [
    sub("sub-1", "a-essay2", "s-daniel", "Daniel_Essay2.docx", 1150000, 0, 72, "OG-00031-K2"),
    sub("sub-2", "a-essay2", "s-mei", "MeiLin_Essay2.pdf", 980000, 0, 72, "OG-00032-M7"),
    sub("sub-3", "a-essay2", "s-tomas", "Tomas_Essay2.docx", 1020000, -1, 41, "OG-00029-T4"),
    sub("sub-4", "a-essay1", "s-priya", "Priya_Sharma_Essay1.docx", 1200000, -41, 18, "OG-00011-P3", {
      teacherNote: "Clear structure and a strong argument. Cite your second source in APA style.",
    }),
    sub("sub-5", "a-essay1", "s-daniel", "Daniel_Essay1.docx", 1100000, -41, 55, "OG-00012-D8"),
    sub("sub-6", "a-essay1", "s-tomas", "Tomas_Essay1.docx", 990000, -41, 55, "OG-00013-T1"),
    sub("sub-7", "a-lab3", "s-priya", "Priya_Sharma_Lab3.pdf", 840000, -11, 9, "OG-00024-A4"),
    sub("sub-8", "a-numsys", "s-priya", "Priya_Sharma_NumberSystems.docx", 400000, -21, 14, "OG-00018-P6"),
    sub("sub-9", "a-numsys", "s-daniel", "Daniel_NumberSystems.docx", 380000, -21, 38, "OG-00019-D2"),
    sub("sub-10", "a-numsys", "s-mei", "MeiLin_NumberSystems.pdf", 410000, -21, 38, "OG-00020-M5"),
  ];

  d.pairs = [
    { id: "pair-1", assignmentId: "a-essay2", a: { submissionId: "sub-1" }, b: { submissionId: "sub-2" },
      score: 72, status: "pending", textA: ESSAY_A, textB: ESSAY_B, passages: ESSAY_PASSAGES, createdAt: iso(0, 11) },
    { id: "pair-2", assignmentId: "a-essay2", a: { submissionId: "sub-3" },
      b: { label: "Archive 2024", fileName: "Archive_2024_Essay2_04.docx" },
      score: 41, status: "pending", textA: TOMAS, textB: ARCHIVE,
      passages: ["information becomes cheap, attention becomes the scarce resource"], createdAt: iso(-1, 11) },
    { id: "pair-3", assignmentId: "a-numsys", a: { submissionId: "sub-9" }, b: { submissionId: "sub-10" },
      score: 38, status: "pending", textA: NUM_A, textB: NUM_B,
      passages: ["divide the number by two repeatedly and record the remainders"], createdAt: iso(-20, 11) },
    { id: "pair-4", assignmentId: "a-essay1", a: { submissionId: "sub-5" }, b: { submissionId: "sub-6" },
      score: 55, status: "concern", note: "Discussed with both students.", decidedAt: iso(-35),
      textA: "", textB: "", passages: [], createdAt: iso(-40, 11) },
  ];

  d.activity.push(
    { id: "act-1", title: "Teacher account created", meta: "r.suri@ics.dev", at: iso(0, 10, 24) },
    { id: "act-2", title: "Threshold changed 35% to 40%", meta: "ENGL 210 · Reading response", at: iso(0, 9, 51) },
    { id: "act-3", title: "Concern confirmed", meta: "Essay 1 · ENGL 210", at: iso(-1, 15) },
    { id: "act-4", title: "Semester 2 opened", meta: "BCA", at: iso(-1, 9) },
    { id: "act-5", title: "Demo data loaded", meta: "Sample courses, teachers and students", at: iso(0, 8) }
  );
}
