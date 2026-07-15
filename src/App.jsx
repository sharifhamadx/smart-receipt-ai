import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { GoogleGenerativeAI } from './LocalAI.js'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './App.css'

const translations = {
  ar: {
    title: "المساعد الطبي الذكي", subtitle: "متتبع المصروفات الطبية بالذكاء الاصطناعي", uploadBtn: "📁 اختيار صورة الفاتورة", analyzeBtn: "✨ تحليل وحفظ الفاتورة", processing: "⏳ جاري المعالجة...", selectAlert: "الرجاء اختيار صورة الفاتورة أولاً!", dashboard: "لوحة التحكم", totalSpent: "إجمالي المصروفات", currency: "د.ل", totalRecords: "عدد السجلات", receipts: "فاتورة", distribution: "توزيع المصروفات", recentHistory: "السجل الحديث", searchPlaceholder: "🔍 بحث عن مستشفى أو تصنيف...", unknownDate: "غير محدد", noMatches: "لا توجد نتائج", noReceipts: "لا توجد فواتير", viewReports: "👁️ عرض السجلات والتقارير", close: "❌ إغلاق", startDate: "من تاريخ:", endDate: "إلى تاريخ:", categoryFilter: "التصنيف:", all: "الكل", exportPDF: "📄 تصدير تقرير PDF", invoiceDate: "تاريخ الفاتورة:", uploadDate: "تاريخ الرفع:", globalMode: "🌍 دمج الكل (بـ LYD)"
  },
  en: {
    title: "Smart Health Receipts", subtitle: "AI-Powered Expense Tracker", uploadBtn: "📁 Select Receipt", analyzeBtn: "✨ Analyze & Save", processing: "⏳ Processing...", selectAlert: "Please select a receipt first!", dashboard: "Dashboard", totalSpent: "Total Spent", currency: "LYD", totalRecords: "Total Records", receipts: "Receipts", distribution: "Expenses Distribution", recentHistory: "Recent History", searchPlaceholder: "🔍 Search merchant or category...", unknownDate: "Unknown", noMatches: "No matches found", noReceipts: "No receipts yet", viewReports: "👁️ View History & Reports", close: "❌ Close", startDate: "From:", endDate: "To:", categoryFilter: "Category:", all: "All", exportPDF: "📄 Export PDF Report", invoiceDate: "Invoice Date:", uploadDate: "Upload Date:", globalMode: "🌍 Global Total (LYD)"
  }
};

const translateCategory = (cat, lang) => {
  if (lang === 'ar') return cat;
  const map = {
    'أدوية': 'Medicine', 'مستشفى': 'Hospital', 'عيادة': 'Clinic', 'خدمات طبية': 'Medical Services', 'كشف طبي': 'Checkup', 'تحاليل': 'Lab Tests', 'مواد بناء': 'Building Materials', 'أخرى': 'Other', 'غير مصنف': 'Uncategorized'
  };
  for (let key in map) {
    if (cat && cat.includes(key)) return map[key];
  }
  return cat;
};

// 💱 أسعار الصرف التقريبية للتحويل التلقائي (يمكنك تعديلها)
const EXCHANGE_RATES = {
  LYD: 1,
  USD: 4.85,
  EUR: 5.25,
  GBP: 6.20,
  EGP: 0.10,
  AED: 1.32,
  SAR: 1.29
};

const printStyles = `
  @media print {
    body * { visibility: hidden; }
    #printable-report, #printable-report * { visibility: visible; }
    #printable-report { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
    .no-print { display: none !important; }
  }
`;

function App() {
  const [lang, setLang] = useState('ar');
  const t = translations[lang] || translations['en'];

  // 🌑 حالة الوضع الليلي
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [history, setHistory] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  
  const [selectedCurrency, setSelectedCurrency] = useState('')
  // 🌍 حالة الدمج الشامل (تحويل كل العملات لـ LYD)
  const [globalMode, setGlobalMode] = useState(false)
  
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterCat, setFilterCat] = useState('All')

  // ألوان الثيم (Theme Variables)
  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    cardBg: isDarkMode ? '#1e293b' : 'white',
    text: isDarkMode ? '#f8fafc' : '#0f172a',
    subText: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    inputBg: isDarkMode ? '#0f172a' : 'white',
    boxShadow: isDarkMode ? '0 10px 25px rgba(0,0,0,0.3)' : '0 10px 25px rgba(0,0,0,0.05)',
    modalBg: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(15, 23, 42, 0.6)'
  };

  useEffect(() => {
    document.body.style.backgroundColor = theme.bg;
  }, [isDarkMode, theme.bg]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  const fetchHistory = async () => {
    const { data, error } = await supabase.from('receipts').select('*').order('created_at', { ascending: false })
    if (data) setHistory(data)
  }

  useEffect(() => { fetchHistory() }, [lang])

  const availableCurrencies = [...new Set(history.map(item => {
    return String(item.total || '').replace(/[\d.]+/g, '').trim().toUpperCase() || 'LYD';
  }))].filter(Boolean);

  const activeCurrency = availableCurrencies.includes(selectedCurrency) ? selectedCurrency : (availableCurrencies[0] || 'LYD');

  // 🌟 المنطق الذكي لتحديد البيانات المعروضة (حسب عملة واحدة أو دمج الكل)
  const displayHistory = globalMode ? history : history.filter(item => {
    const cur = String(item.total || '').replace(/[\d.]+/g, '').trim().toUpperCase() || 'LYD';
    return cur === activeCurrency;
  });

  let totalSpent = 0;
  const categoryTotals = {};
  
  displayHistory.forEach(curr => {
    let num = parseFloat(String(curr.total || '0').match(/[\d.]+/)?.[0] || 0);
    const cur = String(curr.total || '').replace(/[\d.]+/g, '').trim().toUpperCase() || 'LYD';
    
    // 💱 التحويل التلقائي إذا كان الدمج الشامل مفعلاً
    if (globalMode && cur !== 'LYD') {
      const rate = EXCHANGE_RATES[cur] || 1;
      num = num * rate;
    }

    totalSpent += num;
    let cat = translateCategory(curr.category && curr.category !== 'null' ? curr.category : 'غير مصنف', lang);
    categoryTotals[cat] = (categoryTotals[cat] || 0) + num;
  });
  
  const chartData = Object.keys(categoryTotals).map(key => ({ name: key, value: categoryTotals[key] })).sort((a,b) => b.value - a.value);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0])
  }

  const fileToGenerativePart = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ inlineData: { data: reader.result.split(',')[1], mimeType: file.type }});
      reader.readAsDataURL(file);
    });
  }

  const handleAnalyze = async () => {
    if (!file) return alert(t.selectAlert);
    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, file)
      if (uploadError) throw uploadError

      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })
      const imagePart = await fileToGenerativePart(file)
      
      // 🤖 الذكاء التنبؤي للتصنيف (Predictive Categorization)
      const prompt = "قم بتحليل صورة الفاتورة واستخرج البيانات بدقة بصيغة JSON فقط: merchant (اسم الجهة), receipt_number (رقم الإيصال), total (المبلغ كرقم فقط بدون العملة), currency (رمز العملة القياسي مثل LYD, USD, EUR, EGP. ضع LYD إذا لم تجدها), date (التاريخ بصيغة YYYY-MM-DD), category (استنتج التصنيف بذكاء من اسم الجهة: إذا كان يحتوي على صيدلية أو pharmacy فهو 'أدوية'، مختبر أو lab فهو 'تحاليل'، مستشفى أو hospital فهو 'مستشفى'، عيادة أو clinic فهو 'عيادة'، إذا لم تكن متأكداً ضع 'أخرى'). لا تكتب أي نص خارج הـ JSON."

      const aiResult = await model.generateContent([prompt, imagePart])
      const text = (await aiResult.response).text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("AI Format Error")

      const parsedData = JSON.parse(jsonMatch[0])
      
      let finalMerchant = parsedData.merchant || 'Unknown';
      const isUnknown = ['unknown', 'غير محدد', 'جهة غير معروفة', 'null', ''].includes(finalMerchant.toLowerCase().trim());
      
      if (isUnknown) {
        const recNum = parsedData.receipt_number;
        const cat = parsedData.category || 'أخرى';
        if (recNum && !['unknown', 'غير محدد', 'null', '', '0'].includes(String(recNum).toLowerCase().trim())) {
          finalMerchant = `${cat} ${recNum}`;
        } else {
          finalMerchant = 'غير محدد';
        }
      }

      const finalCurrency = (parsedData.currency || 'LYD').toUpperCase().trim();
      const finalTotalWithCurrency = `${parsedData.total || '0'} ${finalCurrency}`;

      await supabase.from('receipts').insert([{ 
            merchant: finalMerchant, 
            total: finalTotalWithCurrency, 
            date: parsedData.date || 'Unknown', 
            category: parsedData.category || 'أخرى'
      }])

      fetchHistory()
      setFile(null)
      if (!globalMode) setSelectedCurrency(finalCurrency)
    } catch (error) {
      alert("Error: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const filteredModalHistory = displayHistory.filter(item => {
    const matchSearch = (item.merchant?.toLowerCase().includes(searchTerm.toLowerCase())) || 
                        (translateCategory(item.category, lang).toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = filterCat === 'All' || item.category === filterCat || translateCategory(item.category, lang) === filterCat;
    
    let matchDate = true;
    if (startDate && endDate && item.created_at) {
      const itemDate = new Date(item.created_at);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchDate = itemDate >= start && itemDate <= end;
    }
    return matchSearch && matchCat && matchDate;
  });

  const uniqueCategories = ['All', ...new Set(displayHistory.map(item => item.category))].filter(Boolean);

  const handleChartClick = (data) => setActiveCategory(activeCategory === data.name ? null : data.name);
  const handleLegendClick = (data) => setActiveCategory(activeCategory === data.value ? null : data.value);

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="container" style={{maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: '"Inter", sans-serif', background: theme.bg, minHeight: '100vh', transition: 'background 0.3s ease'}}>
      <style>{printStyles}</style>

      {/* 🌐 أزرار العرض العلوية (لغة + وضع ليلي) */}
      <div className="no-print" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <button onClick={() => setIsDarkMode(!isDarkMode)} style={{background: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', transition: 'all 0.3s'}}>
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        
        <select value={lang} onChange={(e) => setLang(e.target.value)} style={{padding: '8px 12px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.text, cursor: 'pointer', fontWeight: 'bold', outline: 'none', transition: 'all 0.3s'}}>
          <option value="ar">🇸🇦 العربية</option>
          <option value="en">🇬🇧 English</option>
        </select>
      </div>

      <div className="no-print" style={{background: theme.cardBg, padding: '30px', borderRadius: '24px', boxShadow: theme.boxShadow, marginBottom: '20px', transition: 'all 0.3s ease'}}>
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
          <h1 style={{color: theme.text, fontWeight: '900', fontSize: '2rem', margin: '0 0 5px 0'}}>{t.title}</h1>
          <p style={{color: theme.subText, margin: 0, fontSize: '0.9rem'}}>{t.subtitle}</p>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center'}}>
          <input type="file" accept="image/*" onChange={handleFileChange} id="file-upload" style={{display: 'none'}} />
          <label htmlFor="file-upload" style={{width: '100%', textAlign: 'center', padding: '16px', background: isDarkMode ? '#0f172a' : '#f1f5f9', color: theme.text, borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', border: `2px dashed ${theme.border}`, transition: 'all 0.3s'}}>
            {file ? file.name : t.uploadBtn}
          </label>
          <button onClick={handleAnalyze} disabled={!file || uploading} style={{width: '100%', padding: '16px', background: uploading ? theme.subText : '#0052cc', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: uploading ? 'not-allowed' : 'pointer', boxShadow: uploading ? 'none' : '0 4px 15px rgba(0,82,204,0.3)', transition: 'all 0.3s'}}>
            {uploading ? t.processing : t.analyzeBtn}
          </button>
        </div>
      </div>

      <div className="no-print" style={{display: 'flex', gap: '15px', marginBottom: '20px'}}>
         <div style={{flex: 1, background: theme.cardBg, padding: '20px', borderRadius: '20px', boxShadow: theme.boxShadow, textAlign: 'center', transition: 'all 0.3s', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
            <h4 style={{margin: '0 0 5px 0', color: theme.subText, fontSize: '0.9rem'}}>{t.totalRecords}</h4>
            <h2 style={{margin: 0, color: theme.text, fontSize: '2rem', fontWeight: '900'}}>{displayHistory.length}</h2>
         </div>
         <div style={{flex: 2, background: 'linear-gradient(135deg, #0052cc, #2563eb)', padding: '20px', borderRadius: '20px', boxShadow: '0 8px 20px rgba(0,82,204,0.3)', textAlign: 'center', position: 'relative'}}>
            
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '5px'}}>
              <h4 style={{margin: 0, color: '#ffffff', opacity: 0.9, fontSize: '0.9rem'}}>{t.totalSpent}</h4>
              
              <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                {/* 💱 زر دمج العملات (Global Mode) */}
                {availableCurrencies.length > 1 && (
                  <button onClick={() => setGlobalMode(!globalMode)} style={{background: globalMode ? '#10b981' : 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: '8px', padding: '4px 8px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s'}}>
                    {t.globalMode}
                  </button>
                )}
                
                {/* 💱 محدد العملة (يختفي إذا كان الدمج مفعلاً) */}
                {!globalMode && availableCurrencies.length > 0 && (
                  <select value={activeCurrency} onChange={(e) => setSelectedCurrency(e.target.value)} style={{background: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '4px 8px', outline: 'none', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer'}}>
                    {availableCurrencies.map(c => <option key={c} value={c} style={{color: '#000'}}>{c}</option>)}
                  </select>
                )}
              </div>
            </div>
            
            <h2 style={{margin: 0, fontSize: '2.5rem', fontWeight: '900', color: '#ffffff', wordBreak: 'break-word'}}>
              {totalSpent.toFixed(2)} <span style={{fontSize: '1.2rem', opacity: 0.8}}>{globalMode ? t.currency : activeCurrency}</span>
            </h2>
         </div>
      </div>

      {chartData.length > 0 && (
        <div className="no-print" style={{background: theme.cardBg, borderRadius: '24px', padding: '20px', boxShadow: theme.boxShadow, transition: 'all 0.3s'}}>
          <h3 style={{color: theme.text, textAlign: 'center', margin: '0 0 10px 0', fontSize: '1.1rem'}}>{t.distribution} {globalMode ? `(${t.currency})` : `(${activeCurrency})`}</h3>
          
          <div style={{position: 'relative', height: '260px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={chartData} cx="50%" cy="45%" innerRadius={70} outerRadius={100} 
                  dataKey="value" stroke="none"
                  onClick={handleChartClick}
                  style={{cursor: 'pointer', outline: 'none'}}
                >
                  {chartData.map((e, i) => (
                    <Cell 
                      key={`cell-${i}`} 
                      fill={activeCategory && activeCategory !== e.name ? (isDarkMode ? '#334155' : '#e2e8f0') : COLORS[i % COLORS.length]} 
                      style={{ transition: 'all 0.3s ease', outline: 'none' }}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} ${globalMode ? t.currency : activeCurrency}`} cursor={false} contentStyle={{background: theme.cardBg, border: `1px solid ${theme.border}`, color: theme.text, borderRadius: '8px'}} />
                <Legend 
                  verticalAlign="bottom" height={40} iconType="circle" 
                  onClick={handleLegendClick} 
                  wrapperStyle={{cursor: 'pointer', color: theme.text}}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div style={{position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', width: '120px'}}>
              {activeCategory ? (
                <>
                  <div style={{fontSize: '0.85rem', color: theme.subText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold'}}>{activeCategory}</div>
                  <div style={{fontSize: '1.2rem', fontWeight: '900', color: '#0052cc'}}>{(chartData.find(d => d.name === activeCategory)?.value || 0).toFixed(0)}</div>
                </>
              ) : (
                <>
                  <div style={{fontSize: '0.85rem', color: theme.subText}}>{t.totalSpent}</div>
                  <div style={{fontSize: '1.2rem', fontWeight: '900', color: theme.text}}>{totalSpent.toFixed(0)}</div>
                </>
              )}
            </div>
          </div>
          
          <div style={{display: 'flex', justifyContent: 'center', marginTop: '10px'}}>
            <button onClick={() => setShowModal(true)} style={{background: isDarkMode ? '#334155' : '#f1f5f9', color: isDarkMode ? '#60a5fa' : '#0052cc', border: 'none', padding: '12px 24px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: 'all 0.3s'}}>
              {t.viewReports}
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: theme.modalBg, backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', padding: '0', transition: 'all 0.3s'}}>
          <div id="printable-report" style={{background: theme.cardBg, width: '100%', maxWidth: '600px', height: '90vh', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', padding: '25px', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)', overflowY: 'auto'}}>
            
            <div className="no-print" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0, color: theme.text}}>{t.recentHistory} {globalMode ? `(${t.currency})` : `(${activeCurrency})`}</h2>
              <button onClick={() => setShowModal(false)} style={{background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: theme.text}}>❌</button>
            </div>

            <div className="no-print" style={{display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px', background: theme.bg, padding: '15px', borderRadius: '16px', border: `1px solid ${theme.border}`}}>
              <div style={{display: 'flex', gap: '10px'}}>
                <input type="text" placeholder={t.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{flex: 2, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, outline: 'none', textAlign: lang === 'ar' ? 'right' : 'left'}} />
                <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, outline: 'none'}}>
                  {uniqueCategories.map(c => <option key={c} value={c}>{c === 'All' ? t.all : translateCategory(c, lang)}</option>)}
                </select>
              </div>
              <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <span style={{fontSize: '0.85rem', color: theme.subText, whiteSpace: 'nowrap'}}>{t.startDate}</span>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text}} />
                <span style={{fontSize: '0.85rem', color: theme.subText, whiteSpace: 'nowrap'}}>{t.endDate}</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text}} />
              </div>
              <button onClick={() => window.print()} style={{width: '100%', padding: '14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)'}}>{t.exportPDF}</button>
            </div>

            <h2 style={{display: 'none', textAlign: 'center', marginBottom: '20px', color: 'black'}} className="print-only">تقرير المصروفات الطبية - {startDate || 'بداية'} إلى {endDate || 'نهاية'}</h2>

            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {filteredModalHistory.map((item) => (
                <div key={item.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: theme.inputBg, borderRadius: '12px', border: `1px solid ${theme.border}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
                   <div style={{textAlign: lang === 'ar' ? 'right' : 'left'}}>
                     <strong style={{display: 'block', color: theme.text, fontSize: '1.05rem', marginBottom: '6px'}}>{item.merchant}</strong>
                     <span style={{fontSize: '0.75rem', color: isDarkMode ? '#cbd5e1' : '#4b5563', background: isDarkMode ? '#334155' : '#f1f5f9', padding: '4px 10px', borderRadius: '8px', margin: lang==='ar'?'0 0 0 8px':'0 8px 0 0', fontWeight: 'bold'}}>{translateCategory(item.category, lang)}</span>
                     <div style={{marginTop: '8px', fontSize: '0.75rem', color: theme.subText}}>
                        <span style={{display: 'block', marginBottom: '3px'}}>📅 {t.invoiceDate} {item.date && item.date !== 'Unknown' && item.date !== 'null' ? item.date : t.unknownDate}</span>
                        <span style={{display: 'block'}}>☁️ {t.uploadDate} {new Date(item.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                     </div>
                   </div>
                   <strong style={{color: isDarkMode ? '#60a5fa' : '#0052cc', fontSize: '1.3rem', direction: 'ltr'}}>{item.total && item.total !== 'null' ? item.total : '0.00'}</strong>
                </div>
              ))}
              {filteredModalHistory.length === 0 && <div style={{textAlign: 'center', padding: '40px', color: theme.subText, fontWeight: 'bold', fontSize: '1.1rem'}}>{t.noMatches}</div>}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default App
