const fs = require('fs');
try {
  const code = fs.readFileSync('src/App.jsx', 'utf8');
  console.log('\n🔍 === تقرير الفحص الشامل لملف App.jsx === 🔍\n');
  console.log('1️⃣ متغيرات سلة المهملات (State): \t' + (code.includes('const [trash') ? '✅ موجودة' : '❌ مفقودة'));
  console.log('2️⃣ دالة الحذف (moveToTrash): \t\t' + (code.includes('moveToTrash') ? '✅ موجودة' : '❌ مفقودة'));
  console.log('3️⃣ زر سلة المهملات في الواجهة: \t' + (code.includes('سلة المهملات') ? '✅ موجود' : '❌ مفقود'));
  
  console.log('\n🛠️ === تفاصيل تقنية للتشخيص (انسخها للمساعد الذكي) === 🛠️\n');
  
  const stateMatch = code.match(/.*const\s*\[receipts.*/g);
  console.log('🔹 سطر الـ receipts عندك مكتوب كالتالي:\n', stateMatch ? stateMatch[0].trim() : 'غير موجود');
  
  const btnMatch = code.match(/.*عرض السجلات والتقارير.*/g);
  console.log('\n🔹 سطر زر التقارير عندك مكتوب كالتالي:\n', btnMatch ? btnMatch[0].trim() : 'غير موجود');
  
  const dateMatch = code.match(/.*تاريخ الفاتورة.*/g);
  console.log('\n🔹 سطر تاريخ الفاتورة عندك مكتوب كالتالي:\n', dateMatch ? dateMatch[0].trim() : 'غير موجود');
  
  console.log('\n');
} catch (e) {
  console.log('❌ خطأ: لم أتمكن من العثور على ملف App.jsx');
}
