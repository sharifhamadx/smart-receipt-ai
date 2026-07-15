const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

if(!code.includes('const [trash, setTrash]')) {
  code = code.replace(/(const \[receipts, setReceipts\].*;)/, `$1\n  const [trash, setTrash] = useState(() => JSON.parse(localStorage.getItem('trash') || '[]'));\n  const [showTrash, setShowTrash] = useState(false);`);
}

const trashFuncs = `
  useEffect(() => {
    const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;
    const validTrash = trash.filter(r => (Date.now() - r.deletedAt) < ONE_YEAR);
    if(trash.length !== validTrash.length) {
       localStorage.setItem('trash', JSON.stringify(validTrash));
       setTrash(validTrash);
    }
  }, [trash]);

  const moveToTrash = (id) => {
    if(window.confirm(lang === 'ar' ? 'نقل الفاتورة إلى سلة المهملات؟' : 'Move to trash?')) {
      const item = receipts.find(r => r.id === id);
      if(item) {
        item.deletedAt = Date.now();
        const newReceipts = receipts.filter(r => r.id !== id);
        const newTrash = [...trash, item];
        setReceipts(newReceipts); setTrash(newTrash);
        localStorage.setItem('receipts', JSON.stringify(newReceipts));
        localStorage.setItem('trash', JSON.stringify(newTrash));
      }
    }
  };

  const restoreItem = (id) => {
    const item = trash.find(r => r.id === id);
    if(item) {
      const newTrash = trash.filter(r => r.id !== id);
      delete item.deletedAt;
      const newReceipts = [...receipts, item];
      setReceipts(newReceipts); setTrash(newTrash);
      localStorage.setItem('receipts', JSON.stringify(newReceipts));
      localStorage.setItem('trash', JSON.stringify(newTrash));
    }
  };

  const permDelete = (id) => {
    if(window.confirm(lang === 'ar' ? 'حذف نهائي (لا يمكن التراجع)؟' : 'Delete permanently?')) {
      const newTrash = trash.filter(r => r.id !== id);
      setTrash(newTrash);
      localStorage.setItem('trash', JSON.stringify(newTrash));
    }
  };
`;
if(!code.includes('moveToTrash')) {
  code = code.replace(/const analyzeReceipt/g, trashFuncs + '\n  const analyzeReceipt');
}

code = code.replace(/deleteReceipt\(r\.id\)/g, 'moveToTrash(r.id)');

if(!code.includes('setShowTrash(true)')) {
    code = code.replace(/(<span style=\{\{fontSize: '1\.1rem', fontWeight: 'bold'\}\}>\{t\.dashboard\}<\/span>)/, `<div style={{display:'flex', alignItems:'center', gap:'10px'}}>\n          $1\n          <button onClick={() => setShowTrash(true)} style={{padding: '5px 10px', background: theme.cardBg, border: \`1px solid \${theme.border}\`, borderRadius: '8px', color: theme.text, fontSize: '0.8rem', cursor: 'pointer'}}>🗑️ المهملات ({trash.length})</button>\n        </div>`);
}

const trashModal = `
  {showTrash && (
    <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center'}}>
      <div style={{background:theme.cardBg, padding:'20px', borderRadius:'15px', width:'95%', maxWidth:'500px', maxHeight:'80vh', overflowY:'auto', border:\`1px solid \${theme.border}\`}}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
          <h3 style={{margin:0, color:theme.text}}>🗑️ سلة المهملات</h3>
          <button onClick={() => setShowTrash(false)} style={{background:'none', border:'none', color:theme.text, fontSize:'1.2rem', cursor:'pointer'}}>✖</button>
        </div>
        <p style={{fontSize:'0.8rem', color:'#888', marginBottom:'15px'}}>يتم الاحتفاظ بالفواتير هنا لمدة سنة (365 يوماً) قبل حذفها تلقائياً.</p>
        {trash.length === 0 ? <p style={{textAlign:'center', color:theme.text}}>السلة فارغة</p> : (
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {trash.map(r => (
              <div key={r.id} style={{padding:'10px', border:\`1px solid \${theme.border}\`, borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', background:theme.bg}}>
                <div style={{color:theme.text}}>
                  <div style={{fontWeight:'bold'}}>{r.vendor}</div>
                  <div style={{fontSize:'0.8rem'}}>{r.total} {r.currency}</div>
                </div>
                <div style={{display:'flex', gap:'5px'}}>
                  <button onClick={() => restoreItem(r.id)} style={{background:'#10b981', color:'white', border:'none', borderRadius:'4px', padding:'5px 10px', cursor:'pointer'}}>استعادة</button>
                  <button onClick={() => permDelete(r.id)} style={{background:'#ef4444', color:'white', border:'none', borderRadius:'4px', padding:'5px 10px', cursor:'pointer'}}>حذف نهائي</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )}
`;
if(!code.includes('سلة المهملات</h3>')) {
    code = code.replace(/(<\/div>\s*<\/div>\s*\);\s*};)/, trashModal + '\n$1');
}

fs.writeFileSync('src/App.jsx', code);
