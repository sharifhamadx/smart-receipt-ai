const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// أ. إظهار جميع البيانات افتراضياً (إلغاء فلتر الشهر الحالي)
code = code.replace(/useState\('This Month'\)/g, "useState('All')");
code = code.replace(/useState\('الشهر الحالي'\)/g, "useState('All')");

// ب. إضافة دالة الحذف النهائي من قاعدة البيانات
if(!code.includes('deleteReceipt')) {
    const deleteFunc = `
  const deleteReceipt = (id) => {
    if(window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الفاتورة نهائياً من قاعدة البيانات؟' : 'Permanently delete this receipt?')) {
      const newReceipts = receipts.filter(r => r.id !== id);
      setReceipts(newReceipts);
      localStorage.setItem('receipts', JSON.stringify(newReceipts));
    }
  };
`;
    code = code.replace(/const analyzeReceipt/g, deleteFunc + '  const analyzeReceipt');
}

// ج. إضافة زر الحذف في واجهة المستخدم (بجانب التاريخ أو المبلغ)
if(!code.includes('deleteReceipt(r.id)')) {
    code = code.replace(/(<div[^>]*>)\s*\{r\.date\}/g, `$1 <button onClick={(e) => { e.stopPropagation(); deleteReceipt(r.id); }} style={{background:'#ef4444', color:'white', border:'none', borderRadius:'4px', padding:'3px 8px', fontSize:'0.75rem', cursor:'pointer', margin:'0 5px'}}>🗑️ حذف</button> {r.date}`);
}

fs.writeFileSync('src/App.jsx', code);
