import Tesseract from 'tesseract.js';

export class GoogleGenerativeAI {
  constructor(apiKey) {}
  getGenerativeModel() {
    return {
      generateContent: async (args) => {
        let imageSource = null;
        let parts = [];
        if (args && args.contents && args.contents[0] && args.contents[0].parts) {
           parts = args.contents[0].parts;
        } else if (Array.isArray(args)) {
           parts = args;
        }
        for (const part of parts) {
          if (part?.inlineData) {
            imageSource = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
        if (!imageSource) throw new Error("لم يتم العثور على صورة");

        let rates = {};
        try {
            const res = await fetch('https://open.er-api.com/v6/latest/USD');
            const data = await res.json();
            rates = data.rates;
        } catch(e) {
            rates = { USD: 1, EUR: 0.92, LYD: 4.85, SAR: 3.75, EGP: 47.5 }; 
        }

        const worker = await Tesseract.createWorker('ara+eng');
        const { data } = await worker.recognize(imageSource);
        await worker.terminate();
        const text = data.text || "";

        const textHash = text.replace(/\s/g, '').substring(0, 50);
        if (textHash.length > 10) {
            if (sessionStorage.getItem('scan_v6_' + textHash)) {
                alert("⚠️ تنبيه: هذه الفاتورة مسجلة مسبقاً ولن يتم تكرارها!");
                throw new Error("فاتورة مكررة"); 
            }
            sessionStorage.setItem('scan_v6_' + textHash, "true");
        }

        // التصنيف الأساسي دائماً بالعربي لكي تتمكن الواجهة من ترجمته بديناميكية
        let category = "مستشفى";
        if (/صيدلي|دواء|علاج|روشت|شريط|حبوب|pharm|medicin|pill|drug/i.test(text)) category = "صيدلية";
        else if (/مختبر|تحليل|معمل|دم|lab|test/i.test(text)) category = "مختبر";
        else if (/عيادة|مركز|اسنان|clinic|center|dental/i.test(text)) category = "عيادة";

        let vendor = "غير محدد";
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3 && /[a-zA-Zأ-ي]/.test(l));
        if (lines.length > 0) vendor = lines[0].substring(0, 25);

        let currencyDetected = "LYD";
        if (/USD|\$|دولار/i.test(text)) currencyDetected = "USD";
        else if (/EUR|€|يورو/i.test(text)) currencyDetected = "EUR";
        else if (/SAR|ريال/i.test(text)) currencyDetected = "SAR";
        else if (/EGP|جنيه|ج.م/i.test(text)) currencyDetected = "EGP";

        let totalAmount = 0;
        let originalAmount = 0;
        const nums = text.match(/\d+(\.\d+)?/g);
        if (nums) {
            const validNums = nums.map(Number).filter(n => n > 0 && n < 1000000);
            if (validNums.length > 0) {
                originalAmount = Math.max(...validNums);
                if (currencyDetected !== "LYD" && rates[currencyDetected] && rates["LYD"]) {
                    const inUSD = originalAmount / rates[currencyDetected];
                    totalAmount = Math.round((inUSD * rates["LYD"]) * 100) / 100;
                } else {
                    totalAmount = originalAmount;
                }
            }
        }

        if (currencyDetected !== "LYD") {
            setTimeout(() => {
                const noteId = 'currency-live-alert';
                if (!document.getElementById(noteId)) {
                    const noteDiv = document.createElement('div');
                    noteDiv.id = noteId;
                    noteDiv.style = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); text-align: center; color: #10b981; font-size: 0.85rem; padding: 0.75rem 1.5rem; border: 1px solid #10b981; border-radius: 9999px; background: rgba(15, 23, 42, 0.95); z-index: 9999; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); white-space: nowrap; direction: rtl; font-family: sans-serif;';
                    noteDiv.innerHTML = `🔄 تم تحويل الفاتورة من ${currencyDetected} إلى LYD بناءً على سعر صرف اليوم.`;
                    document.body.appendChild(noteDiv);
                    setTimeout(() => document.getElementById(noteId).remove(), 6000);
                }
            }, 500);
        }

        const jsonResult = {
          total: totalAmount,
          amount: totalAmount,
          price: totalAmount,
          cost: totalAmount,
          originalAmount: originalAmount,
          originalCurrency: currencyDetected,
          category: category,
          Category: category, 
          "التصنيف": category, 
          type: category, 
          vendor: vendor,
          "الجهة": vendor,
          name: vendor,
          currency: "LYD",
          Currency: "LYD",
          "العملة": "LYD",
          date: new Date().toISOString().split('T')[0],
          items: [{ name: "Medical Item", price: totalAmount }]
        };

        return {
          response: { 
            text: () => `\`\`\`json\n${JSON.stringify(jsonResult)}\n\`\`\`` 
          }
        };
      }
    };
  }
}
