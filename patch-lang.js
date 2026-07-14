const fs = require('fs');
try {
    let code = fs.readFileSync('src/App.jsx', 'utf8');
    // إضافة خيار الفرنسية للقائمة
    if (!code.includes('value="fr"')) {
        code = code.replace(/(<option[^>]*value=['"]en['"][^>]*>.*?<\/option>)/g, '$1\n          <option value="fr">Français 🇫🇷</option>');
    }
    // قاموس فرنسي جاهز
    const frDict = `fr: {
      title: "Assistant Médical",
      subtitle: "Suivi des dépenses médicales",
      selectReceipt: "Sélectionner le reçu",
      analyzeSave: "Analyser et Enregistrer",
      totalRecords: "Total des Enregistrements",
      totalSpent: "Total Dépensé",
      expensesDistribution: "Répartition des Dépenses (LYD)",
      viewHistory: "Voir Historique & Rapports",
      hospital: "Hôpital",
      pharmacy: "Pharmacie",
      lab: "Laboratoire",
      unknown: "Inconnu",
      currency: "LYD"
    },`;
    // حقن القاموس بذكاء قبل القاموس الإنجليزي
    if (!code.includes('fr: {') && !code.includes('fr:{')) {
        code = code.replace(/en:\s*\{/, frDict + '\n    en: {');
        code = code.replace(/"en":\s*\{/, frDict + '\n    "en": {');
    }
    fs.writeFileSync('src/App.jsx', code);
    console.log('✅ تم إضافة اللغة الفرنسية بنجاح!');
} catch(e) {
    console.log('⚠️ جاري تخطي الحقن، تأكد من اسم الملف.');
}
