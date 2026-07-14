const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// A. إضافة الفرنسية للقائمة المنسدلة
if (!code.includes('value="fr"')) {
    code = code.replace('<option value="en">🇬🇧 English</option>', '<option value="en">🇬🇧 English</option>\n          <option value="fr">🇫🇷 Français</option>');
}

// B. إضافة القاموس الفرنسي
if (!code.includes('fr: {')) {
    const frCode = `,\n  fr: {\n    title: "Smart Health Receipts", subtitle: "Suivi des dépenses par IA", uploadBtn: "📁 Sélectionner le reçu", analyzeBtn: "✨ Analyser & Sauvegarder", processing: "⏳ Traitement...", selectAlert: "Veuillez d'abord sélectionner un reçu !", dashboard: "Tableau de Bord", totalSpent: "Total Dépensé", currency: "LYD", totalRecords: "Total des Enregistrements", receipts: "Reçus", distribution: "Répartition des Dépenses", recentHistory: "Historique Récent", searchPlaceholder: "🔍 Rechercher marchand ou catégorie...", unknownDate: "Inconnu", noMatches: "Aucun résultat", noReceipts: "Aucun reçu", viewReports: "👁️ Voir Rapports", close: "❌ Fermer", startDate: "De:", endDate: "À:", categoryFilter: "Catégorie:", all: "Tout", exportPDF: "📄 Exporter PDF", invoiceDate: "Date Facture:", uploadDate: "Date Téléchargement:", globalMode: "🌍 Total Global (LYD)"\n  }`;
    code = code.replace(/en:\s*\{[^\}]+\}/, match => match + frCode);
}

// C. تحديث خريطة الترجمة لتشمل الصيدلية والمختبر والفرنسية
code = code.replace(
  /const map = \{[\s\S]*?\};/m,
  `const map = {
    'أدوية': lang === 'fr' ? 'Médicament' : 'Medicine',
    'مستشفى': lang === 'fr' ? 'Hôpital' : 'Hospital',
    'عيادة': lang === 'fr' ? 'Clinique' : 'Clinic',
    'خدمات طبية': lang === 'fr' ? 'Services Médicaux' : 'Medical Services',
    'كشف طبي': lang === 'fr' ? 'Bilan' : 'Checkup',
    'تحاليل': lang === 'fr' ? 'Analyses' : 'Lab Tests',
    'مواد بناء': lang === 'fr' ? 'Matériaux' : 'Building Materials',
    'أخرى': lang === 'fr' ? 'Autre' : 'Other',
    'غير مصنف': lang === 'fr' ? 'Non classé' : 'Uncategorized',
    'صيدلية': lang === 'fr' ? 'Pharmacie' : 'Pharmacy',
    'مختبر': lang === 'fr' ? 'Laboratoire' : 'Laboratory'
  };`
);

fs.writeFileSync('src/App.jsx', code);
