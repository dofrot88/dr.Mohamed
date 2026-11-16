// باك اند بسيط: Express + ملف JSON كقاعدة بيانات
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const DB = path.join(__dirname, 'db.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // غيّرها!

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const seed = {
  courses: [
    // ===== كورسات شهرية =====
    { id: 1, title: 'أساسيات البرمجة - شهري', plan: 'month', price: 150, desc: 'مقدمة في التفكير البرمجي والخوارزميات ولغة Python.' },
    { id: 2, title: 'HTML و CSS من الصفر - شهري', plan: 'month', price: 150, desc: 'ابني أول صفحات ويب متجاوبة.' },
    { id: 3, title: 'JavaScript للمبتدئين - شهري', plan: 'month', price: 180, desc: 'اتعلم الجافاسكريبت وتفاعل الصفحات.' },
    // ===== كورسات الترم =====
    { id: 4, title: 'فرونت إند: HTML / CSS / JS - ترم', plan: 'term', price: 600, desc: 'ابني مواقعك من الصفر لحد مشروع كامل.' },
    { id: 5, title: 'باك إند: Node.js وقواعد البيانات - ترم', plan: 'term', price: 650, desc: 'السيرفر وال API وقواعد البيانات.' },
    { id: 6, title: 'برمجة Python وحل المشكلات - ترم', plan: 'term', price: 550, desc: 'من الأساسيات لحد الدوال والكائنات ومشاريع صغيرة.' },
    // ===== كورسات السنة =====
    { id: 7, title: 'منهج البرمجة الكامل - سنة', plan: 'year', price: 1500, desc: 'فرونت إند + باك إند + مشروع تخرج.' },
    { id: 8, title: 'مطوّر ويب شامل (Full Stack) - سنة', plan: 'year', price: 1800, desc: 'من HTML لحد موقع كامل بقاعدة بيانات ومتابعة مستمرة.' }
  ],
  students: [], enrollments: []
};
const load = () => { if (!fs.existsSync(DB)) save(seed); return JSON.parse(fs.readFileSync(DB, 'utf8')); };
const save = d => fs.writeFileSync(DB, JSON.stringify(d, null, 2));
const tokens = new Map(); // token -> studentId

const auth = (req, res, next) => {
  const id = tokens.get((req.headers.authorization || '').replace('Bearer ', ''));
  if (!id) return res.status(401).json({ error: 'سجّل دخولك الأول' });
  req.studentId = id; next();
};
const hash = p => crypto.createHash('sha256').update(p).digest('hex');

// الكورسات (ممكن فلترة بالخطة)
app.get('/api/courses', (req, res) => {
  const { plan } = req.query;
  res.json(load().courses.filter(c => !plan || c.plan === plan));
});

// تسجيل حساب
app.post('/api/register', (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({ error: 'البيانات ناقصة (الباسورد 6 حروف على الأقل)' });
  const db = load();
  if (db.students.find(s => s.email === email)) return res.status(400).json({ error: 'الإيميل مستخدم' });
  const s = { id: Date.now(), name, email, phone: phone || '', password: hash(password) };
  db.students.push(s); save(db);
  const t = crypto.randomUUID(); tokens.set(t, s.id);
  res.json({ token: t, name });
});

// تسجيل دخول
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const s = load().students.find(x => x.email === email && x.password === hash(password || ''));
  if (!s) return res.status(401).json({ error: 'بيانات غلط' });
  const t = crypto.randomUUID(); tokens.set(t, s.id);
  res.json({ token: t, name: s.name });
});

// الاشتراك في كورس
app.post('/api/enroll', auth, (req, res) => {
  const db = load(); const courseId = +req.body.courseId;
  if (!db.courses.find(c => c.id === courseId)) return res.status(404).json({ error: 'الكورس مش موجود' });
  if (db.enrollments.find(e => e.studentId === req.studentId && e.courseId === courseId))
    return res.status(400).json({ error: 'أنت مشترك بالفعل' });
  db.enrollments.push({ studentId: req.studentId, courseId, date: new Date().toISOString() });
  save(db); res.json({ ok: true });
});

// كورساتي
app.get('/api/my-courses', auth, (req, res) => {
  const db = load();
  const ids = db.enrollments.filter(e => e.studentId === req.studentId).map(e => e.courseId);
  res.json(db.courses.filter(c => ids.includes(c.id)));
});

// لوحة الدكتور: إضافة كورس
app.post('/api/admin/courses', (req, res) => {
  if (req.headers['x-admin-password'] !== ADMIN_PASSWORD) return res.status(403).json({ error: 'غير مسموح' });
  const { title, plan, price, desc } = req.body;
  if (!title || !['month', 'term', 'year'].includes(plan)) return res.status(400).json({ error: 'بيانات غلط' });
  const db = load();
  const c = { id: Date.now(), title, plan, price: +price || 0, desc: desc || '' };
  db.courses.push(c); save(db); res.json(c);
});

app.listen(process.env.PORT || 3000, () => console.log('http://localhost:3000'));
