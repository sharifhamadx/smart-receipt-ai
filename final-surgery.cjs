const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. إضافة متغيرات السلة
if (!code.includes('const [trash')) {
  code = code.replace(/(const \[.*?, set.*?\] = useState\(.*?\))/m, 
  `$1\n  const [trash, setTrash] = useState(() => JSON.parse(localStorage.getItem('trash') || '[]'));`);
}

// 2. زر المهملات بجانب زر التقارير
if (!code.includes('🗑️ المهملات')) {
  code = code.replace(/(<button.*?\{t\.viewReports\}.*?<\/button>)/m,
  `$1\n            <button onClick={() => { /* سنضيف لاحقاً منطق فتح السلة */ }} style={{background: isDarkMode ? '#334155' : '#f1f5f9', color: '#e11d48', border: 'none', padding: '12px 24px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px'}}>🗑️ المهملات ({trash.length})</button>`);
}

// 3. زر الحذف بجانب التاريخ
if (!code.includes('moveToTrash')) {
  code = code.replace(/(📅 \{t\.invoiceDate\}.*?<\/span>)/m, 
  `$1\n                        <button onClick={() => { const newR = records.filter(r=>r.id!==item.id); setRecords(newR); localStorage.setItem('trash', JSON.stringify([...trash, item])); setTrash([...trash, item]); }} style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'0.7rem'}}>🗑️ حذف</button>`);
}

fs.writeFileSync('src/App.jsx', code);
console.log("✅ تمت الجراحة بنجاح!");
