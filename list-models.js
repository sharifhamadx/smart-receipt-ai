import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const keyMatch = env.match(/VITE_GEMINI_API_KEY=(.*)/);
const key = keyMatch ? keyMatch[1].trim() : null;

console.log("⏳ جاري سؤال خوادم جوجل عن النماذج المتاحة لمفتاحك...");

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
.then(res => res.json())
.then(data => {
  if (data.models) {
    console.log("\n✅ النماذج المتاحة والتي تدعم تحليل البيانات هي:");
    const validModels = data.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'));
    validModels.forEach(m => console.log("👉 " + m.name.replace('models/', '')));
  } else if (data.error) {
    console.log("\n❌ خطأ من جوجل:", data.error.message);
  }
})
.catch(err => console.log("\n❌ خطأ في الاتصال:", err.message));
