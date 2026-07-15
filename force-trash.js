const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Force state variables
if (!code.includes('const [trash, setTrash]')) {
  code = code.replace(/const\s+\[receipts,\s*setReceipts\]\s*=\s*useState\([^)]*\);/g, "$&\n  const [trash, setTrash] = useState(() => JSON.parse(localStorage.getItem('trash') || '[]'));\n  const [showTrash, setShowTrash] = useState(false);");
}

// 2. Add functions
if (!code.includes('const moveToTrash')) {
  const funcs = `
  const moveToTrash = (id) => { if(window.confirm(lang === 'ar' ? 'نقل لسلة المهملات؟' : 'Move to trash?')) { const item = receipts.find(r => r.id === id); if(item) { item.deletedAt = Date.now(); const newReceipts = receipts.filter(r => r.id !== id); const newTrash = [...trash, item]; setReceipts(newReceipts); setTrash(newTrash); localStorage.setItem('receipts', JSON.stringify(newReceipts)); localStorage.setItem('trash', JSON.stringify(newTrash)); } } };
  const restoreItem = (id) => { const item = trash.find(r => r.id === id); if(item) { const newTrash = trash.filter(r => r.id !== id); delete item.deletedAt; const newReceipts = [...receipts, item]; setReceipts(newReceipts); setTrash(newTrash); localStorage.setItem('receipts', JSON.stringify(newReceipts)); localStorage.setItem('trash', JSON.stringify(newTrash)); } };
  const permDelete = (id) => { if(window.confirm('حذف نهائي؟')) { const newTrash = trash.filter(r => r.id !== id); setTrash(newTrash); localStorage.setItem('trash', JSON.stringify(newTrash)); } };
  `;
  if (code.includes('const handleFileUpload')) {
    code = code.replace(/const\s+handleFileUpload\s*=\s*/g, funcs + "\n  const handleFileUpload = ");
  } else {
    code = code.replace(/const\s+analyzeReceipt\s*=\s*/g, funcs + "\n  const analyzeReceipt = ");
  }
}

// 3. UI - Dashboard button
if (!code.includes('🗑️ المهملات')) {
  code = code.replace(/\{t\.dashboard\}<\/span>/g, "{t.dashboard}</span> <button onClick={() => setShowTrash(true)} style={{padding:'5px 10px', background:theme.cardBg, border:`1px solid ${theme.border}`, borderRadius:'8px', color:theme.text, fontSize:'0.8rem', cursor:'pointer', marginLeft:'10px'}}>🗑️ المهملات ({trash?.length || 0})</button>");
}

// 4. UI - Delete button on receipt
if (!code.includes('moveToTrash(r.id)')) {
  code = code.replace(/\{r\.date\}<\/div>/g, "{r.date} <button onClick={(e) => { e.stopPropagation(); moveToTrash(r.id); }} style={{background:'#ef4444', color:'white', border:'none', borderRadius:'4px', padding:'3px 8px', fontSize:'0.75rem', cursor:'pointer', margin:'0 5px'}}>🗑️ حذف</button></div>");
}

// 5. Modal
if (!code.includes('سلة المهملات</h3>')) {
  const modal = `{showTrash && (<div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center'}}><div style={{background:theme.cardBg, padding:'20px', borderRadius:'15px', width:'95%', maxWidth:'500px', maxHeight:'80vh', overflowY:'auto', border:\`1px solid \${theme.border}\`}}><div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}><h3 style={{margin:0, color:theme.text}}>🗑️ سلة المهملات</h3><button onClick={() => setShowTrash(false)} style={{background:'none', border:'none', color:theme.text, fontSize:'1.2rem', cursor:'pointer'}}>✖</button></div>{trash.length === 0 ? <p style={{textAlign:'center', color:theme.text}}>السلة فارغة</p> : (<div style={{display:'flex', flexDirection:'column', gap:'10px'}}>{trash.map(r => (<div key={r.id} style={{padding:'10px', border:\`1px solid \${theme.border}\`, borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', background:theme.bg}}><div style={{color:theme.text}}><div style={{fontWeight:'bold'}}>{r.vendor}</div><div style={{fontSize:'0.8rem'}}>{r.total} {r.currency}</div></div><div style={{display:'flex', gap:'5px'}}><button onClick={() => restoreItem(r.id)} style={{background:'#10b981', color:'white', border:'none', borderRadius:'4px', padding:'5px 10px', cursor:'pointer'}}>استعادة</button><button onClick={() => permDelete(r.id)} style={{background:'#ef4444', color:'white', border:'none', borderRadius:'4px', padding:'5px 10px', cursor:'pointer'}}>حذف نهائي</button></div></div>))}</div>)}</div></div>)}`;
  code = code.replace(/(<\/div>\s*<\/div>\s*\);\s*\};?)/, modal + "\n$1");
}

// 6. Fix "This Month" filter to "All" to show ALL data
code = code.replace(/useState\('This Month'\)/g, "useState('All')");
code = code.replace(/useState\('الشهر الحالي'\)/g, "useState('All')");

fs.writeFileSync('src/App.jsx', code);
