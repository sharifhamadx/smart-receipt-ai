import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const keyMatch = env.match(/VITE_GEMINI_API_KEY=(.*)/);
const key = keyMatch ? keyMatch[1].trim() : null;

if (!key) {
  console.log("❌ لم يتم العثور على المفتاح في ملف .env");
  process.exit(1);
}

console.log("🔑 المفتاح المستخدم للاختبار:", key.substring(0, 15) + "...");
console.log("⏳ جاري الاتصال بخوادم جوجل...");

fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contents: [{ parts: [{ text: "اختبار اتصال" }] }] })
})
.then(res => res.json())
.then(data => {
  if (data.error) {
    console.log("\n❌ فشل الاتصال! رسالة الخطأ من جوجل:");
    console.log("السبب:", data.error.message);
    console.log("الحالة:", data.error.status);
  } else {
    console.log("\n✅ المفتاح سليم ويعمل بكفاءة 100%!");
  }
})
.catch(err => console.log("\n❌ خطأ في شبكة الاتصال:", err.message));
