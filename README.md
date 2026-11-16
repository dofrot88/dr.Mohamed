# منصة د. محمد رمضان

## التشغيل
1. نزّل Node.js
2. في الفولدر: `npm install` ثم `npm start`
3. افتح http://localhost:3000

## لوحة الدكتور (إضافة كورس)
POST /api/admin/courses مع هيدر x-admin-password
غيّر الباسورد: `ADMIN_PASSWORD=كلمة_سر npm start`

## الهيكل
- server.js: الباك اند (API + حفظ في db.json)
- public/index.html: الفرونت اند
