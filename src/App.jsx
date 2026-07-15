import React, { useState, useEffect } from 'react';
import Chart from 'chart.js/auto';

export default function App() {
  const [receipts, setReceipts] = useState(() => JSON.parse(localStorage.getItem('receipts') || '[]'));
  const [trash, setTrash] = useState(() => JSON.parse(localStorage.getItem('trash') || '[]'));
  const [showTrash, setShowTrash] = useState(false);

  const moveToTrash = (id) => {
    const item = receipts.find(r => r.id === id);
    if (item) {
      item.deletedAt = Date.now();
      setReceipts(receipts.filter(r => r.id !== id));
      setTrash([...trash, item]);
      localStorage.setItem('receipts', JSON.stringify(receipts.filter(r => r.id !== id)));
      localStorage.setItem('trash', JSON.stringify([...trash, item]));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Smart Health Receipts</h2>
        <button onClick={() => setShowTrash(true)}>🗑️ المهملات ({trash.length})</button>
      </div>

      {receipts.map(r => (
        <div key={r.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
          <p>{r.vendor} - {r.total} - {r.date}</p>
          <button onClick={() => moveToTrash(r.id)} style={{ background: 'red', color: 'white' }}>حذف</button>
        </div>
      ))}

      {showTrash && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#fff' }}>
          <h3>🗑️ سلة المهملات</h3>
          <button onClick={() => setShowTrash(false)}>إغلاق</button>
          {trash.map(r => (
            <div key={r.id}>{r.vendor} <button onClick={() => { setTrash(trash.filter(t => t.id !== r.id)); localStorage.setItem('trash', JSON.stringify(trash.filter(t => t.id !== r.id))); }}>حذف نهائي</button></div>
          ))}
        </div>
      )}
    </div>
  );
}
