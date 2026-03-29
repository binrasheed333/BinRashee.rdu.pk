import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  BookOpen, 
  Phone, 
  Mail, 
  MessageSquare, 
  Share2, 
  Compass, 
  Mic, 
  Settings, 
  Bell,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronRight,
  Globe,
  Volume2,
  Moon,
  Zap,
  Shield,
  LayoutDashboard,
  Cpu,
  Download,
  Menu,
  X,
  VolumeX,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { AnalogWatch } from './components/AnalogWatch';
import { getPrayerTimes, getIslamicDate, calculateQibla, getHijriMonthInfo } from './utils/islamicUtils';
import { generateLessonPlan, type LessonAttachment } from './services/gemini';
import { cn } from './utils/cn';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// --- Types ---
type Tab = 'dashboard' | 'namaz' | 'calendar' | 'lesson' | 'qibla' | 'settings';
type Language = 'en' | 'ur' | 'ar' | 'sd' | 'pa' | 'ps' | 'bl';
type AIModel = 'gemini' | 'openai' | 'claude' | 'deepseek';
const isRTL = (l: Language) => ['ur', 'ar', 'sd', 'pa', 'ps', 'bl'].includes(l);

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

// --- Translations ---
const translations = {
  en: {
    dashboard: "Dashboard",
    namaz: "Namaz Times",
    calendar: "Dual Calendar",
    lesson: "AI Lesson Planner",
    qibla: "Qibla Finder",
    settings: "Settings",
    prayerTimes: "Prayer Times",
    islamicDate: "Islamic Date",
    generate: "Generate Plan",
    downloadPdf: "Download PDF",
    voiceAssistant: "Voice Assistant",
    focusMode: "Focus Mode",
    azanAlerts: "Azan Alerts",
    hijriOffset: "Hijri Offset",
    selectAI: "Select AI Model",
    adjustPrayers: "Adjust Prayer Times",
    refreshLocation: "Refresh Location",
    minutes: "min",
  },
  sd: {
    dashboard: "ڊيش بورڊ",
    namaz: "نماز جا وقت",
    calendar: "ٻٽو ڪيلينڊر",
    lesson: "سبق جو منصوبو",
    qibla: "قبلي جي طرف",
    settings: "سيٽنگون",
    prayerTimes: "نماز جا وقت",
    islamicDate: "اسلامي تاريخ",
    generate: "منصوبو ٺاهيو",
    downloadPdf: "PDF ڊائون لوڊ ڪريو",
    voiceAssistant: "آواز وارو مددگار",
    focusMode: "فوڪس موڊ",
    azanAlerts: "اذان الرٽ",
    hijriOffset: "هجري آفيسٽ",
    selectAI: "AI ماڊل چونڊيو",
    adjustPrayers: "نماز جا وقت درست ڪريو",
    refreshLocation: "لوڪيشن ريفريش ڪريو",
    minutes: "منٽ",
  },
  ur: {
    dashboard: "ڈیش بورڈ",
    namaz: "نماز کے اوقات",
    calendar: "دوہرا کیلنڈر",
    lesson: "سبق کا منصوبہ",
    qibla: "قبلہ",
    settings: "ترتیبات",
    prayerTimes: "نماز کے اوقات",
    islamicDate: "اسلامی تاریخ",
    generate: "منصوبہ بنائیں",
    downloadPdf: "پی ڈی ایف",
    voiceAssistant: "وائس اسسٹنٹ",
    focusMode: "فوکس موڈ",
    azanAlerts: "اذان الرٹ",
    hijriOffset: "ہجری آفسیٹ",
    selectAI: "AI ماڈل منتخب کریں",
    adjustPrayers: "نماز کے اوقات درست کریں",
    refreshLocation: "لوکیشن ریفریش کریں",
    minutes: "منٹ",
  },
  ar: {
    dashboard: "لوحة القيادة",
    namaz: "أوقات الصلاة",
    calendar: "التقويم المزدوج",
    lesson: "خطة الدرس",
    qibla: "القبلة",
    settings: "إعدادات",
    prayerTimes: "أوقات الصلاة",
    islamicDate: "التاريخ الهجري",
    generate: "إنشاء",
    downloadPdf: "تحميل PDF",
    voiceAssistant: "مساعد صوتي",
    focusMode: "وضع التركيز",
    azanAlerts: "تنبيهات الأذان",
    hijriOffset: "تعديل الهجري",
    selectAI: "اختر نموذج AI",
    adjustPrayers: "تعديل أوقات الصلاة",
    refreshLocation: "تحديث الموقع",
    minutes: "دقيقة",
  },
  pa: {
    dashboard: "ڊيش بورڊ",
    namaz: "نماز دے اوقات",
    calendar: "دوہرا کیلنڈر",
    lesson: "سبق دا منصوبہ",
    qibla: "قبلہ",
    settings: "ترتیبات",
    prayerTimes: "نماز دے اوقات",
    islamicDate: "اسلامی تاریخ",
    generate: "منصوبہ بناؤ",
    downloadPdf: "پی ڈی ایف",
    voiceAssistant: "وائس اسسٹنٹ",
    focusMode: "فوکس موڊ",
    azanAlerts: "اذان الرٹ",
    hijriOffset: "ہجری آفسیٹ",
    selectAI: "AI ماڈل منتخب کرو",
    adjustPrayers: "نماز دے اوقات درست کرو",
    refreshLocation: "لوکیشن ریفریش کرو",
    minutes: "منٹ",
  },
  ps: {
    dashboard: "ډشبورډ",
    namaz: "د لمانځه وختونه",
    calendar: "دوه ګونی کیلنڈر",
    lesson: "د لوست پلان جوړونکی",
    qibla: "قبله",
    settings: "ترتیبات",
    prayerTimes: "د لمانځه وختونه",
    islamicDate: "اسلامي نیټه",
    generate: "پلان جوړ کړئ",
    downloadPdf: "PDF ډاونلوډ کړئ",
    voiceAssistant: "غږیز مرستیال",
    focusMode: "تمرکز حالت",
    azanAlerts: "د اذان خبرتیاوې",
    hijriOffset: "هجري تعدیل",
    selectAI: "د AI ماډل غوره کړئ",
    adjustPrayers: "د لمانځه وختونه تنظیم کړئ",
    refreshLocation: "ځای تازه کړئ",
    minutes: "دقیقې",
  },
  bl: {
    dashboard: "ډیش بورډ",
    namaz: "نماز ءِ وھد",
    calendar: "دو گونہ کیلنڈر",
    lesson: "سبق ءِ منصوبہ",
    qibla: "قبلہ",
    settings: "ترتیبات",
    prayerTimes: "نماز ءِ وھد",
    islamicDate: "اسلامی تاریخ",
    generate: "منصوبہ جوڑ کن",
    downloadPdf: "PDF ڈاؤن لوڈ کن",
    voiceAssistant: "توار ءِ کمک کار",
    focusMode: "فوکس موڈ",
    azanAlerts: "اذان ءِ الرٹ",
    hijriOffset: "ہجری آفسیٹ",
    selectAI: "AI ماڈل گچین کن",
    adjustPrayers: "نماز ءِ وھد درست کن",
    refreshLocation: "لوکیشن ریفریش کن",
    minutes: "منٹ",
  }
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [lang, setLang] = useState<Language>('en');
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const [azanEnabled, setAzanEnabled] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [hijriOffset, setHijriOffset] = useState(0);
  const [lastAlertedPrayer, setLastAlertedPrayer] = useState<string | null>(null);
  const [selectedAI, setSelectedAI] = useState<AIModel>('gemini');
  const [lessonPlan, setLessonPlan] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lessonAttachments, setLessonAttachments] = useState<LessonAttachment[]>([]);
  const [weeklyTopics, setWeeklyTopics] = useState<string[]>(['']);
  const [lessonFormat, setLessonFormat] = useState<'simple' | 'column' | 'weekly'>('simple');
  const [lessonLang, setLessonLang] = useState<Language>('en');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [calendarView, setCalendarView] = useState<'both' | 'islamic' | 'gregorian'>('both');
  const [profilePic, setProfilePic] = useState(() => {
    return localStorage.getItem('profilePic') || 'https://picsum.photos/seed/user/200/200';
  });

  useEffect(() => {
    localStorage.setItem('profilePic', profilePic);
  }, [profilePic]);
  const [prayerOffsets, setPrayerOffsets] = useState<Record<string, number>>({
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0
  });
  const lessonPlanRef = useRef<HTMLDivElement>(null);

  const t = translations[lang];

  // --- Effects ---
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Location error:", err)
    );
  }, []);

  useEffect(() => {
    const handleOrientation = (e: any) => {
      let heading = 0;
      if (e.webkitCompassHeading) {
        // iOS device
        heading = e.webkitCompassHeading;
      } else if (e.alpha !== null) {
        // Android or other devices
        // alpha is 0-360, but direction varies by browser implementation
        heading = e.absolute ? (360 - e.alpha) : (360 - e.alpha);
      }
      setDeviceHeading(heading);
    };

    if (window.DeviceOrientationEvent) {
      // Use absolute orientation if available (Android)
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      // Fallback for iOS
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const requestCompassPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          window.addEventListener('deviceorientation', (e: any) => {
            if (e.webkitCompassHeading) {
              setDeviceHeading(e.webkitCompassHeading);
            }
          }, true);
        }
      } catch (err) {
        console.error("Compass permission error:", err);
      }
    } else {
      alert("Compass calibration not required or not supported in this browser.");
    }
  };

  useEffect(() => {
    if (location) {
      setQiblaDirection(calculateQibla(location.lat, location.lng));
    }
  }, [location]);

  // Voice Assistant Logic
  const startVoiceAssistant = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice recognition not supported in this browser.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = lang === 'ur' ? 'ur-PK' : lang === 'ar' ? 'ar-SA' : lang === 'pa' ? 'pa-PK' : lang === 'ps' ? 'ps-AF' : lang === 'bl' ? 'bal-PK' : 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase();
      // English, Urdu, Arabic, Sindhi, Panjabi, Pashto, Balochi commands
      if (command.includes('dashboard') || command.includes('home') || command.includes('ڈیش بورڈ') || command.includes('گھر') || command.includes('ڊيش بورڊ') || command.includes('ډشبورډ')) setActiveTab('dashboard');
      else if (command.includes('namaz') || command.includes('prayer') || command.includes('نماز') || command.includes('وقت') || command.includes('صلو') || command.includes('لمانځه')) setActiveTab('namaz');
      else if (command.includes('calendar') || command.includes('کیلنڈر') || command.includes('ڪيلينڊر')) setActiveTab('calendar');
      else if (command.includes('lesson') || command.includes('planner') || command.includes('سبق') || command.includes('منصوبو')) setActiveTab('lesson');
      else if (command.includes('qibla') || command.includes('قبلہ') || command.includes('قبلي')) setActiveTab('qibla');
      else if (command.includes('settings') || command.includes('ترتیبات') || command.includes('سيٽنگون')) setActiveTab('settings');
    };
    recognition.start();
  };
  useEffect(() => {
    if (!location || focusMode) return;
    const prayers = getPrayerTimes(location.lat, location.lng, new Date(), prayerOffsets);
    const now = new Date();
    const currentMinute = `${now.getHours()}:${now.getMinutes()}`;
    
    Object.entries(prayers).forEach(([name, prayerTime]) => {
      const prayerMinute = `${prayerTime.getHours()}:${prayerTime.getMinutes()}`;
      
      if (currentMinute === prayerMinute && lastAlertedPrayer !== name) {
        setLastAlertedPrayer(name);
        if (vibrateEnabled && navigator.vibrate) {
          navigator.vibrate([500, 200, 500, 200, 500]);
        }
        if (azanEnabled) {
          new Notification(`Azan Time: ${name}`, { 
            body: `It's time for ${name} prayer.`,
            icon: '/favicon.ico'
          });
          const audio = new Audio('https://www.islamcan.com/audio/adhan/azan1.mp3');
          audio.play().catch(e => console.log("Audio play blocked:", e));
        }
      }
    });

    const timer = setTimeout(() => {
      const isStillPrayerTime = Object.values(prayers).some(p => {
        const pMin = `${p.getHours()}:${p.getMinutes()}`;
        return pMin === currentMinute;
      });
      if (!isStillPrayerTime) setLastAlertedPrayer(null);
    }, 60000);

    return () => clearTimeout(timer);
  }, [time, location, vibrateEnabled, azanEnabled, focusMode, lastAlertedPrayer]);

  // --- Handlers ---
  const handleGenerateLesson = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);
    const formData = new FormData(e.currentTarget);
    const isWeekly = lessonFormat === 'weekly';
    const params = {
      classLevel: formData.get('class') as string,
      subject: formData.get('subject') as string,
      topic: formData.get('topic') as string,
      topics: isWeekly ? weeklyTopics.filter(t => t.trim() !== '') : undefined,
      isWeekly,
      time: formData.get('time') as string,
      date: formData.get('date') as string,
      duration: formData.get('duration') as string,
      motivation: formData.get('motivation') as string,
      teachingMaterial: formData.get('teachingMaterial') as string,
      fiveE: formData.get('fiveE') as string,
      assessment: formData.get('assessment') as string,
      homework: formData.get('homework') as string,
      language: lessonLang,
      format: isWeekly ? 'column' : lessonFormat as 'simple' | 'column',
      attachments: lessonAttachments.length > 0 ? lessonAttachments : undefined
    };

    try {
      const plan = await generateLessonPlan(params);
      setLessonPlan(plan);
    } catch (err) {
      alert("Failed to generate lesson plan");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!lessonPlan) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(lessonPlan);
        alert("Lesson plan copied to clipboard!");
      } else {
        throw new Error("Clipboard API not available");
      }
    } catch (err) {
      console.error("Failed to copy:", err);
      try {
        const textArea = document.createElement("textarea");
        textArea.value = lessonPlan;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          alert("Lesson plan copied to clipboard!");
        } else {
          alert("Failed to copy. Please select and copy manually.");
        }
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
        alert("Failed to copy. Please select and copy manually.");
      }
    }
  };

  const handleShare = async () => {
    if (!lessonPlan) return;
    
    const shareData = {
      title: 'Lesson Plan - NOOR',
      text: lessonPlan.substring(0, 100) + '...',
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share({
          title: 'Lesson Plan',
          text: lessonPlan,
        });
      } else {
        await copyToClipboard();
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error("Share failed:", err);
        await copyToClipboard();
      }
    }
  };

  const downloadPdf = async () => {
    if (!lessonPlanRef.current || isDownloadingPdf || !lessonPlan) {
      console.error("Cannot download PDF: Ref or content missing", { ref: !!lessonPlanRef.current, content: !!lessonPlan });
      return;
    }
    
    setIsDownloadingPdf(true);
    console.log("Starting PDF generation process...");
    
    const isLandscape = lessonFormat === 'column' || lessonFormat === 'weekly';
    const pdf = new jsPDF({
      orientation: isLandscape ? 'l' : 'p',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    const element = lessonPlanRef.current;
    const tempContainer = document.createElement('div');
    const containerWidth = isLandscape ? 1400 : 900; // Slightly wider for better table fit
    
    // Setup temporary container for high-quality rendering
    tempContainer.style.width = `${containerWidth}px`;
    tempContainer.style.padding = '50px';
    tempContainer.style.backgroundColor = '#ffffff';
    tempContainer.style.color = '#000000';
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.zIndex = '9999';
    tempContainer.dir = isRTL(lessonLang) ? 'rtl' : 'ltr';
    tempContainer.className = 'markdown-body prose max-w-none pdf-export-container';
    
    // Clone the content
    const clone = element.cloneNode(true) as HTMLElement;
    clone.classList.remove('prose-invert', 'overflow-auto', 'custom-scrollbar');
    clone.style.minWidth = 'auto'; 
    clone.style.width = '100%';
    clone.style.height = 'auto';
    clone.style.overflow = 'visible';
    clone.style.backgroundColor = '#ffffff';
    clone.style.color = '#000000';
    
    // Force black text and visible borders for all elements in the clone
    const allElements = clone.querySelectorAll('*');
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.color = '#000000';
      htmlEl.style.borderColor = '#cccccc';
      htmlEl.style.backgroundColor = 'transparent';
      if (htmlEl.tagName === 'TABLE') {
        htmlEl.style.borderCollapse = 'collapse';
        htmlEl.style.width = '100%';
      }
    });
    
    const tables = clone.querySelectorAll('table');
    tables.forEach(table => {
      table.style.border = '1px solid #cccccc';
      table.querySelectorAll('th, td').forEach(cell => {
        const c = cell as HTMLElement;
        c.style.border = '1px solid #cccccc';
        c.style.padding = '10px';
        c.style.fontSize = isLandscape ? '10px' : '12px';
        c.style.textAlign = isRTL(lessonLang) ? 'right' : 'left';
      });
      table.querySelectorAll('th').forEach(th => {
        (th as HTMLElement).style.backgroundColor = '#f0f0f0';
      });
    });

    tempContainer.appendChild(clone);
    document.body.appendChild(tempContainer);

    try {
      // Wait for any rendering/fonts
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const canvas = await html2canvas(tempContainer, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: containerWidth,
        height: tempContainer.offsetHeight || tempContainer.scrollHeight,
        onclone: (clonedDoc) => {
          // Additional fixes inside the canvas clone
          const el = clonedDoc.querySelector('.pdf-export-container') as HTMLElement;
          if (el) {
            el.style.left = '0';
            el.style.position = 'relative';
          }

          // CRITICAL: Remove all existing stylesheets to avoid oklab/oklch parsing errors in html2canvas
          const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          styles.forEach(s => s.remove());

          // Add a safe stylesheet with standard colors only
          const styleTag = clonedDoc.createElement('style');
          styleTag.innerHTML = `
            .pdf-export-container {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #000000 !important;
              background-color: #ffffff !important;
              padding: 50px !important;
            }
            .pdf-export-container * {
              color: #000000 !important;
              border-color: #dddddd !important;
              background-color: transparent !important;
              box-shadow: none !important;
              text-shadow: none !important;
            }
            table { 
              border-collapse: collapse !important; 
              width: 100% !important; 
              margin-bottom: 20px !important; 
              border: 1px solid #dddddd !important;
            }
            th, td { 
              border: 1px solid #dddddd !important; 
              padding: 12px 8px !important; 
              text-align: ${isRTL(lessonLang) ? 'right' : 'left'} !important;
              vertical-align: top !important;
            }
            th { 
              background-color: #f8f9fa !important; 
              font-weight: bold !important;
            }
            h1, h2, h3, h4, h5, h6 { 
              color: #000000 !important; 
              margin-top: 24px !important; 
              margin-bottom: 16px !important; 
              font-weight: bold !important;
              line-height: 1.25 !important;
            }
            h1 { font-size: 2em !important; border-bottom: 1px solid #eeeeee !important; padding-bottom: 0.3em !important; }
            h2 { font-size: 1.5em !important; border-bottom: 1px solid #eeeeee !important; padding-bottom: 0.3em !important; }
            p { margin-top: 0 !important; margin-bottom: 16px !important; }
            ul, ol { margin-top: 0 !important; margin-bottom: 16px !important; padding-left: 2em !important; }
            li { margin-bottom: 4px !important; }
            blockquote {
              padding: 0 1em !important;
              color: #6a737d !important;
              border-left: 0.25em solid #dfe2e5 !important;
              margin: 0 0 16px 0 !important;
            }
            code {
              padding: 0.2em 0.4em !important;
              margin: 0 !important;
              font-size: 85% !important;
              background-color: rgba(27,31,35,0.05) !important;
              border-radius: 3px !important;
              font-family: monospace !important;
            }
            pre {
              padding: 16px !important;
              overflow: auto !important;
              font-size: 85% !important;
              line-height: 1.45 !important;
              background-color: #f6f8fa !important;
              border-radius: 3px !important;
              margin-bottom: 16px !important;
            }
            hr {
              height: 0.25em !important;
              padding: 0 !important;
              margin: 24px 0 !important;
              background-color: #e1e4e8 !important;
              border: 0 !important;
            }
          `;
          clonedDoc.head.appendChild(styleTag);
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = isLandscape ? 297 : 210;
      const pageHeight = isLandscape ? 210 : 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Add subsequent pages if content is long
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`LessonPlan_${new Date().getTime()}.pdf`);
      console.log("PDF saved successfully");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("PDF generation failed. Error: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
      setIsDownloadingPdf(false);
    }
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-50">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative"
        >
          <div className="w-32 h-32 bg-neon-blue rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(0,242,255,0.5)]">
            <Moon className="text-black fill-black" size={64} />
          </div>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-neon-blue rounded-[2rem] blur-2xl -z-10"
          />
        </motion.div>
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-4xl font-black tracking-tighter neon-text"
        >
          NOOR
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-2 text-slate-500 font-medium tracking-widest uppercase text-xs"
        >
          Your Spiritual Companion
        </motion.p>
      </div>
    );
  }

  return (
    <div className={cn("flex h-screen bg-[#050505] text-white font-sans overflow-hidden", isRTL(lang) ? "rtl" : "ltr")}>
      {/* Sidebar */}
      <aside className="w-20 lg:w-72 bg-white/5 backdrop-blur-2xl border-r border-white/10 flex flex-col z-40">
        <div className="p-8 flex items-center gap-4">
          <div className="relative group">
            <div className="w-12 h-12 bg-neon-blue rounded-2xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.3)] overflow-hidden">
              <span className="text-[10px] font-black text-black leading-none">{time.getDate()}</span>
              <div className="w-full h-[1px] bg-black/20 my-0.5" />
              <span className="text-[8px] font-bold text-black leading-none opacity-70">
                {getIslamicDate(time, hijriOffset).split(' ')[0]}
              </span>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-neon-purple rounded-full flex items-center justify-center animate-pulse">
              <Moon size={8} className="text-white fill-white" />
            </div>
          </div>
          <div className="hidden lg:block">
            <h2 className="font-black text-2xl tracking-tighter neon-text">NOOR</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Life Assistant</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
              {[
                { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
                { id: 'namaz', icon: Clock, label: t.namaz },
                { id: 'calendar', icon: CalendarIcon, label: t.calendar },
                { id: 'lesson', icon: BookOpen, label: t.lesson },
                { id: 'qibla', icon: Compass, label: t.qibla },
                { id: 'settings', icon: Settings, label: t.settings },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group",
                    activeTab === item.id 
                      ? "bg-neon-blue text-black shadow-[0_0_20px_rgba(0,242,255,0.4)]" 
                      : "bg-slate-800/50 text-neon-blue hover:bg-slate-700/50 hover:text-white border border-white/5"
                  )}
                >
                  <item.icon size={22} className={cn(activeTab === item.id ? "text-black" : "text-neon-blue group-hover:scale-110 transition-transform")} />
                  <span className="hidden lg:block font-bold tracking-tight">{item.label}</span>
                </button>
              ))}
        </nav>

        <div className="p-6 space-y-4">
          <button 
            onClick={startVoiceAssistant}
            className={cn(
              "w-full flex items-center justify-center gap-3 p-4 rounded-2xl transition-all font-bold text-sm",
              isListening ? "bg-neon-blue text-black shadow-[0_0_20px_rgba(0,242,255,0.4)]" : "bg-white/5 text-slate-400 border border-white/5"
            )}
          >
            <Mic size={18} className={isListening ? "animate-pulse" : ""} />
            <span className="hidden lg:block">{t.voiceAssistant}</span>
          </button>
          <button 
            onClick={() => setFocusMode(!focusMode)}
            className={cn(
              "w-full flex items-center justify-center gap-3 p-4 rounded-2xl transition-all font-bold text-sm",
              focusMode ? "bg-red-500/20 text-red-500 border border-red-500/50" : "bg-white/5 text-slate-400 border border-white/5"
            )}
          >
            {focusMode ? <Shield size={18} /> : <Zap size={18} />}
            <span className="hidden lg:block">{t.focusMode}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Focus Mode Overlay */}
        <AnimatePresence>
          {focusMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-3xl z-50 flex flex-col items-center justify-center pointer-events-none"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-neon-blue mb-8"
              >
                <Shield size={120} strokeWidth={1} />
              </motion.div>
              <h2 className="text-4xl font-black tracking-tighter neon-text mb-4">FOCUS MODE ACTIVE</h2>
              <p className="text-slate-500 font-bold tracking-widest uppercase text-sm">Distractions Minimized</p>
              <button 
                onClick={() => setFocusMode(false)}
                className="mt-12 pointer-events-auto px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 transition-all"
              >
                Exit Focus Mode
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-blue/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-purple/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="p-6 lg:p-12 max-w-7xl mx-auto relative z-10">
          <header className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-black tracking-tighter mb-2">{t[activeTab]}</h1>
              <div className="flex items-center gap-3 text-slate-400 font-medium">
                <span>{time.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <span className="text-neon-blue">{getIslamicDate(time, hijriOffset)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex bg-white/5 backdrop-blur-md rounded-2xl p-1 border border-white/10 flex-wrap justify-center">
                {(['en', 'ur', 'ar', 'sd', 'pa', 'ps', 'bl'] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                      lang === l ? "bg-neon-blue text-black shadow-lg" : "text-slate-500 hover:text-white"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Profile Section */}
                  <div className="glass-card p-6 flex items-center gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-neon-blue/5 blur-2xl" />
                    <div className="relative group/profile">
                      <div className="w-20 h-20 rounded-full border-2 border-neon-blue p-1 shadow-[0_0_15px_rgba(0,242,255,0.3)] overflow-hidden relative">
                        <img 
                          src={profilePic} 
                          alt="User Profile" 
                          className="w-full h-full rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button 
                          onClick={() => setShowAdminModal(true)}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 sm:opacity-0 group-hover/profile:opacity-100 transition-opacity cursor-pointer rounded-full"
                          title="Change Profile Picture"
                        >
                          <Plus size={20} className="text-neon-blue" />
                        </button>
                      </div>

                      {/* Admin Password Modal */}
                      <AnimatePresence>
                        {showAdminModal && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute top-full left-0 mt-4 z-50 glass-card p-4 w-64 space-y-4 shadow-2xl border-neon-blue/30"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase tracking-widest text-neon-blue">Admin Access</span>
                              <button onClick={() => setShowAdminModal(false)}><X size={14} /></button>
                            </div>
                            <input 
                              type="password" 
                              placeholder="Enter Password"
                              value={adminPassInput}
                              onChange={(e) => setAdminPassInput(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-neon-blue transition-all"
                            />
                            <button 
                              onClick={() => {
                                if (adminPassInput === '1234') {
                                  setIsAdminAuthenticated(true);
                                  setShowAdminModal(false);
                                  setAdminPassInput('');
                                  // Small delay to ensure modal close doesn't interfere with file picker
                                  setTimeout(() => {
                                    document.getElementById('profile-upload')?.click();
                                  }, 100);
                                } else {
                                  alert("Incorrect Password");
                                }
                              }}
                              className="w-full py-2 bg-neon-blue text-black rounded-lg text-[10px] font-black uppercase"
                            >
                              Verify & Change
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <input 
                        id="profile-upload"
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            console.log("File selected:", file.name);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const result = reader.result as string;
                              console.log("File read successfully");
                              setProfilePic(result);
                              localStorage.setItem('profilePic', result);
                            };
                            reader.onerror = (err) => {
                              console.error("FileReader error:", err);
                              alert("Failed to read file");
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />

                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-[#050505] flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tighter neon-text">Bin Rasheed</h3>
                      <button 
                        onClick={() => setShowAdminModal(true)}
                        className="text-[10px] text-neon-blue uppercase tracking-widest font-bold hover:underline"
                      >
                        Change Photo
                      </button>
                    </div>
                  </div>

                  {/* Clock Widget */}
                  <div className="lg:col-span-2 glass-card p-10 flex flex-col md:flex-row items-center gap-16 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/5 blur-3xl group-hover:bg-neon-blue/10 transition-all" />
                    <div className="relative">
                      <AnalogWatch size={280} />
                    </div>
                    <div className="text-center md:text-left space-y-6">
                      <div className="text-8xl font-black tracking-tighter neon-text">
                        {time.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                      <div className="space-y-2">
                        <div className="text-2xl font-bold text-white flex items-center gap-3">
                          <Moon className="text-neon-blue" size={24} />
                          {getIslamicDate(time, hijriOffset)}
                          {getHijriMonthInfo(time, hijriOffset).monthName === 'Ramadan' && (
                            <span className="px-2 py-0.5 bg-neon-purple/20 text-neon-purple text-[8px] font-black uppercase tracking-widest rounded-full border border-neon-purple/30">
                              Ramadan
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                          {t.islamicDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Namaz */}
                  <div className="glass-card p-8 space-y-8">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                        <Bell className="text-neon-blue" size={20} />
                        {t.prayerTimes}
                      </h3>
                      <div className="flex gap-2">
                        <button onClick={() => setAzanEnabled(!azanEnabled)} className={cn("p-2 rounded-xl transition-all", azanEnabled ? "bg-neon-blue/20 text-neon-blue" : "bg-white/5 text-slate-500")}>
                          <Volume2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    {location ? (
                      <div className="space-y-4">
                        {Object.entries(getPrayerTimes(location.lat, location.lng, new Date(), prayerOffsets)).map(([name, pTime]) => (
                          <div key={name} className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-neon-blue/30 transition-all group">
                            <span className="capitalize font-bold text-slate-400 group-hover:text-white transition-colors">{name}</span>
                            <span className="font-mono font-black text-lg group-hover:text-neon-blue transition-colors">
                              {pTime.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center text-slate-600">
                        <Globe size={48} strokeWidth={1} className="mb-4 animate-pulse" />
                        <p className="text-sm font-bold uppercase tracking-widest">Awaiting Location...</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'namaz' && (
                <div className="space-y-8">
                  <div className="glass-card p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/5 blur-3xl" />
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                      <div className="text-center md:text-left">
                        <h3 className="text-3xl font-black tracking-tighter mb-2">{t.prayerTimes}</h3>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
                          {location ? "Based on your current location" : "Location access required"}
                        </p>
                      </div>
                      <div className="flex items-center gap-6 bg-white/5 p-6 rounded-[2rem] border border-white/10">
                        <div className="text-center">
                          <div className="text-2xl font-black text-neon-blue">{getIslamicDate(time, hijriOffset).split(' ')[0]}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{getIslamicDate(time, hijriOffset).split(' ')[1]}</div>
                        </div>
                        <div className="w-[1px] h-12 bg-white/10" />
                        <div className="text-center">
                          <div className="text-2xl font-black text-white">{time.getDate()}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{time.toLocaleDateString(lang, { month: 'short' })}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {location ? (
                      Object.entries(getPrayerTimes(location.lat, location.lng, new Date(), prayerOffsets)).map(([name, pTime]) => {
                        const isNext = false; // Simplified for now
                        return (
                          <div key={name} className={cn(
                            "glass-card p-8 flex flex-col items-center justify-center space-y-4 group transition-all duration-500",
                            isNext ? "border-neon-blue bg-neon-blue/5" : "hover:border-neon-blue/30"
                          )}>
                            <div className={cn(
                              "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                              isNext ? "bg-neon-blue text-black shadow-[0_0_20px_rgba(0,242,255,0.4)]" : "bg-white/5 text-slate-500 group-hover:text-neon-blue"
                            )}>
                              <Clock size={32} />
                            </div>
                            <h4 className="text-xl font-black tracking-tight capitalize">{name}</h4>
                            <div className="text-3xl font-mono font-black neon-text">
                              {pTime.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alerts Active</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-full glass-card p-20 flex flex-col items-center justify-center text-slate-600">
                        <Globe size={64} className="mb-6 animate-pulse" />
                        <p className="text-xl font-black uppercase tracking-[0.3em]">Awaiting Location Access</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'calendar' && (
                <div className="space-y-8">
                  <div className="flex justify-center">
                    <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex">
                      {(['both', 'islamic', 'gregorian'] as const).map(view => (
                        <button
                          key={view}
                          onClick={() => setCalendarView(view)}
                          className={cn(
                            "px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all",
                            calendarView === view ? "bg-neon-blue text-black" : "text-slate-500 hover:text-white"
                          )}
                        >
                          {view}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {(calendarView === 'both' || calendarView === 'gregorian') && (
                      <div className="glass-card p-8">
                        <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                          <CalendarIcon className="text-neon-blue" />
                          Gregorian
                        </h3>
                        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 mb-4">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                          {Array.from({ length: 31 }).map((_, i) => (
                            <div key={i} className={cn(
                              "aspect-square flex items-center justify-center rounded-xl font-bold text-sm transition-all",
                              time.getDate() === i + 1 ? "bg-neon-blue text-black shadow-lg" : "bg-white/5 hover:bg-white/10"
                            )}>
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(calendarView === 'both' || calendarView === 'islamic') && (
                      <div className="glass-card p-8 border-neon-purple/20">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-2xl font-black flex items-center gap-3">
                            <Moon className="text-neon-purple" />
                            Hijri
                          </h3>
                          {getHijriMonthInfo(time, hijriOffset).monthName === 'Ramadan' && (
                            <span className="px-3 py-1 bg-neon-purple/20 text-neon-purple text-[10px] font-black uppercase tracking-widest rounded-full border border-neon-purple/30 animate-pulse">
                              Ramadan Special
                            </span>
                          )}
                        </div>
                        
                        <div className="text-center mb-8">
                          <div className="text-xl font-bold text-white mb-1">
                            {getHijriMonthInfo(time, hijriOffset).monthName} {getHijriMonthInfo(time, hijriOffset).year}
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Islamic Month</p>
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                          {Array.from({ length: getHijriMonthInfo(time, hijriOffset).daysInMonth }).map((_, i) => (
                            <div key={i} className={cn(
                              "aspect-square flex items-center justify-center rounded-xl font-bold text-sm transition-all",
                              getHijriMonthInfo(time, hijriOffset).day === i + 1 ? "bg-neon-purple text-white shadow-[0_0_20px_rgba(191,0,255,0.4)]" : "bg-white/5 hover:bg-white/10"
                            )}>
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'lesson' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="glass-card p-8 space-y-6">
                    <div className="space-y-4">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.selectAI}</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['gemini', 'openai', 'claude', 'deepseek'] as AIModel[]).map(model => (
                          <button
                            key={model}
                            onClick={() => setSelectedAI(model)}
                            className={cn(
                              "p-3 rounded-xl text-xs font-bold capitalize border transition-all",
                              selectedAI === model ? "bg-neon-blue/20 border-neon-blue text-neon-blue" : "bg-white/5 border-white/5 text-slate-500"
                            )}
                          >
                            {model}
                          </button>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleGenerateLesson} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Plan Language</label>
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 flex-wrap gap-1">
                          {(['en', 'ur', 'ar', 'sd', 'pa', 'ps', 'bl'] as Language[]).map((l) => (
                            <button
                              key={l}
                              type="button"
                              onClick={() => setLessonLang(l)}
                              className={cn(
                                "flex-1 min-w-[70px] py-2 rounded-lg text-[10px] font-black uppercase transition-all",
                                lessonLang === l ? "bg-neon-blue text-black shadow-lg" : "text-slate-500 hover:text-white"
                              )}
                            >
                              {l === 'en' ? 'English' : l === 'ur' ? 'Urdu' : l === 'ar' ? 'Arabic' : l === 'sd' ? 'Sindhi' : l === 'pa' ? 'Punjabi' : l === 'ps' ? 'Pashto' : 'Balochi'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <input name="class" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" placeholder="Class" />
                          <input name="subject" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" placeholder="Subject" />
                        </div>

                        {lessonFormat !== 'weekly' ? (
                          <input name="topic" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" placeholder="Topic" />
                        ) : (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Weekly Topics (Max 6)</label>
                            {weeklyTopics.map((topic, index) => (
                              <div key={index} className="flex gap-2">
                                <input 
                                  value={topic}
                                  onChange={(e) => {
                                    const newTopics = [...weeklyTopics];
                                    newTopics[index] = e.target.value;
                                    setWeeklyTopics(newTopics);
                                  }}
                                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" 
                                  placeholder={`Topic ${index + 1}`} 
                                />
                                {weeklyTopics.length > 1 && (
                                  <button 
                                    type="button"
                                    onClick={() => setWeeklyTopics(weeklyTopics.filter((_, i) => i !== index))}
                                    className="p-3 bg-red-500/20 text-red-500 rounded-xl"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            ))}
                            {weeklyTopics.length < 6 && (
                              <button 
                                type="button"
                                onClick={() => setWeeklyTopics([...weeklyTopics, ''])}
                                className="w-full py-2 bg-white/5 border border-dashed border-white/20 rounded-xl text-[10px] font-bold text-slate-400 hover:bg-white/10 transition-all"
                              >
                                + Add Topic
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <input name="date" type="date" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                        <input name="duration" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" placeholder="Duration (e.g. 40 min)" />
                      </div>
                      <input name="time" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" placeholder="Total Time" />
                      
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Additional Materials (Optional)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                            <Plus size={16} className="text-neon-blue" />
                            <span className="text-[10px] font-bold text-slate-400">File (Img/PDF/Audio)</span>
                            <input 
                              type="file" 
                              accept="image/*,application/pdf,audio/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const type = file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'audio';
                                    setLessonAttachments([...lessonAttachments, { type, data: reader.result as string, mimeType: file.type }]);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          <button 
                            type="button"
                            onClick={() => {
                              const url = prompt("Enter Website or YouTube URL:");
                              if (url) setLessonAttachments([...lessonAttachments, { type: 'link', data: url }]);
                            }}
                            className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-dashed border-white/20 rounded-xl hover:bg-white/10 transition-all"
                          >
                            <Globe size={16} className="text-neon-blue" />
                            <span className="text-[10px] font-bold text-slate-400">Add Link</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              const text = prompt("Paste Reference Text:");
                              if (text) setLessonAttachments([...lessonAttachments, { type: 'text', data: text }]);
                            }}
                            className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-dashed border-white/20 rounded-xl hover:bg-white/10 transition-all col-span-2"
                          >
                            <MessageSquare size={16} className="text-neon-blue" />
                            <span className="text-[10px] font-bold text-slate-400">Paste Text</span>
                          </button>
                        </div>

                        {lessonAttachments.length > 0 && (
                          <div className="space-y-2 mt-4">
                            {lessonAttachments.map((att, i) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                                <div className="flex items-center gap-3">
                                  {att.type === 'image' && <Eye size={14} className="text-neon-blue" />}
                                  {att.type === 'pdf' && <BookOpen size={14} className="text-red-400" />}
                                  {att.type === 'audio' && <Volume2 size={14} className="text-green-400" />}
                                  {att.type === 'link' && <Globe size={14} className="text-blue-400" />}
                                  {att.type === 'text' && <MessageSquare size={14} className="text-yellow-400" />}
                                  <span className="text-[10px] font-bold text-slate-300 truncate max-w-[150px]">
                                    {att.type.toUpperCase()}: {att.data.substring(0, 20)}...
                                  </span>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setLessonAttachments(lessonAttachments.filter((_, idx) => idx !== i))}
                                  className="text-red-500 hover:text-red-400"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Plan Format</label>
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                          <button
                            type="button"
                            onClick={() => setLessonFormat('simple')}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all",
                              lessonFormat === 'simple' ? "bg-neon-blue text-black shadow-lg" : "text-slate-500 hover:text-white"
                            )}
                          >
                            Simple
                          </button>
                          <button
                            type="button"
                            onClick={() => setLessonFormat('column')}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all",
                              lessonFormat === 'column' ? "bg-neon-blue text-black shadow-lg" : "text-slate-500 hover:text-white"
                            )}
                          >
                            Columnwise
                          </button>
                          <button
                            type="button"
                            onClick={() => setLessonFormat('weekly')}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all",
                              lessonFormat === 'weekly' ? "bg-neon-blue text-black shadow-lg" : "text-slate-500 hover:text-white"
                            )}
                          >
                            Weekly Columnwise
                          </button>
                        </div>
                      </div>

                      <button 
                        disabled={isGenerating}
                        className="w-full bg-neon-blue text-black font-black py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all disabled:opacity-50"
                      >
                        {isGenerating ? "Processing..." : t.generate}
                      </button>
                    </form>
                  </div>

                  <div className="xl:col-span-2 glass-card flex flex-col min-h-[500px] lg:min-h-[700px] max-h-[90vh] overflow-hidden relative border-neon-blue/20 shadow-[0_0_30px_rgba(0,242,255,0.05)]">
                    {lessonPlan && (
                      <div className="p-4 lg:px-8 lg:py-6 flex justify-between items-center gap-4 z-20 border-b border-white/10 bg-white/5 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-neon-blue animate-pulse shadow-[0_0_10px_#00f2ff]" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-blue">AI Generated Content</span>
                            <span className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">Scroll to read full plan</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="hidden md:flex bg-black/40 backdrop-blur-md rounded-xl p-1 border border-white/10 gap-1">
                              <select 
                                value={lessonLang} 
                                onChange={(e) => setLessonLang(e.target.value as Language)}
                                className="bg-slate-800 text-neon-blue text-[10px] font-black uppercase px-2 py-1 outline-none border-r border-white/10 cursor-pointer hover:bg-slate-700 transition-colors"
                              >
                                {(['en', 'ur', 'ar', 'sd', 'pa', 'ps', 'bl'] as Language[]).map(l => (
                                  <option key={l} value={l} className="bg-slate-800 text-neon-blue">{l}</option>
                                ))}
                              </select>
                            {(['simple', 'column'] as const).map(f => (
                              <button
                                key={f}
                                onClick={() => setLessonFormat(f)}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                                  lessonFormat === f ? "bg-neon-blue text-black shadow-[0_0_15px_rgba(0,242,255,0.4)]" : "text-slate-500 hover:text-white"
                                )}
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <button 
                              onClick={handleShare} 
                              className="p-2.5 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 hover:text-white transition-all border border-white/5" 
                              title="Share or Copy"
                            >
                              <Share2 size={18} />
                            </button>
                            <button 
                              onClick={downloadPdf} 
                              disabled={isDownloadingPdf}
                              className={cn(
                                "p-2.5 rounded-xl transition-all flex items-center gap-2 px-4",
                                isDownloadingPdf ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-neon-blue text-black hover:shadow-[0_0_20px_rgba(0,242,255,0.4)]"
                              )}
                            >
                              {isDownloadingPdf ? (
                                <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Download size={18} />
                              )}
                              <span className="text-[10px] font-black uppercase hidden sm:inline">
                                {isDownloadingPdf ? 'Processing...' : 'PDF'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex-1 overflow-auto custom-scrollbar p-6 lg:p-10 bg-black/20">
                      <div 
                        ref={lessonPlanRef} 
                        dir={isRTL(lessonLang) ? 'rtl' : 'ltr'}
                        className={cn(
                          "prose prose-invert max-w-none prose-headings:neon-text prose-p:text-slate-300 prose-strong:text-white prose-table:border-white/10 w-full",
                          isRTL(lessonLang) ? "text-right" : "text-left",
                          (lessonFormat === 'column' || lessonFormat === 'weekly') && "min-w-[1200px]"
                        )}
                      >
                        {lessonPlan ? (
                          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>{lessonPlan}</Markdown>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-6 opacity-30 py-32">
                            <div className="relative">
                              <Cpu size={100} strokeWidth={0.5} className="animate-pulse" />
                              <div className="absolute inset-0 bg-neon-blue/20 blur-3xl rounded-full" />
                            </div>
                            <div className="text-center space-y-2">
                              <p className="font-black uppercase tracking-[0.5em] text-sm">System Ready</p>
                              <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Awaiting Input Parameters</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'qibla' && (
                <div className="flex flex-col items-center justify-center min-h-[600px] space-y-12">
                  <div className="relative">
                    {/* Compass Ring */}
                    <div className="w-80 h-80 rounded-full border-4 border-white/10 flex items-center justify-center relative">
                      <div className="absolute inset-0 rounded-full border border-neon-blue/20 animate-ping" />
                      
                      {/* Compass Card */}
                      <motion.div 
                        animate={{ rotate: -deviceHeading }}
                        className="w-72 h-72 rounded-full bg-white/5 backdrop-blur-md border border-white/20 relative flex items-center justify-center"
                      >
                        {['N', 'E', 'S', 'W'].map((dir, i) => (
                          <span key={dir} className="absolute font-black text-slate-500" style={{ transform: `rotate(${i * 90}deg) translateY(-120px)` }}>
                            {dir}
                          </span>
                        ))}
                        
                        {/* Qibla Needle */}
                        <motion.div 
                          animate={{ rotate: qiblaDirection }}
                          className="absolute w-1 h-48 bg-gradient-to-t from-transparent via-neon-blue to-neon-blue rounded-full shadow-[0_0_20px_rgba(0,242,255,0.5)]"
                        >
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-neon-blue rounded-full shadow-lg flex items-center justify-center">
                            <Compass size={10} className="text-black" />
                          </div>
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>

                  <div className="text-center space-y-4">
                    <h3 className="text-3xl font-black tracking-tighter neon-text">QIBLA DIRECTION</h3>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
                      {location ? `Angle: ${Math.round(qiblaDirection)}° from North` : "Awaiting Location..."}
                    </p>
                    <div className="flex flex-col items-center gap-6 mt-8">
                      <button 
                        onClick={requestCompassPermission}
                        className="px-8 py-4 bg-neon-blue/10 text-neon-blue border border-neon-blue/30 rounded-2xl hover:bg-neon-blue/20 transition-all font-bold text-sm flex items-center gap-3"
                      >
                        <Zap size={18} />
                        Calibrate Compass
                      </button>
                      <div className="flex items-center gap-4 justify-center">
                        <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
                          <span className="text-xs text-slate-500 block mb-1">Your Heading</span>
                          <span className="font-mono font-black text-xl">{Math.round(deviceHeading)}°</span>
                        </div>
                        <div className="px-6 py-3 bg-neon-blue/10 rounded-2xl border border-neon-blue/30">
                          <span className="text-xs text-neon-blue block mb-1">Qibla Angle</span>
                          <span className="font-mono font-black text-xl text-neon-blue">{Math.round(qiblaDirection)}°</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="glass-card p-10 space-y-10">
                    <div className="flex items-center gap-8 pb-10 border-b border-white/10">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full border-2 border-neon-blue p-1 shadow-[0_0_15px_rgba(0,242,255,0.3)] overflow-hidden">
                          <img 
                            src={profilePic} 
                            alt="Profile" 
                            className="w-full h-full rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <button 
                          onClick={() => setShowAdminModal(true)}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                        >
                          <Plus size={24} className="text-neon-blue" />
                        </button>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black tracking-tighter neon-text">Profile Settings</h3>
                        <button 
                          onClick={() => setShowAdminModal(true)}
                          className="text-xs font-bold text-neon-blue uppercase tracking-widest hover:underline mt-2"
                        >
                          Change Profile Picture
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xl font-bold">Azan & Alerts</h4>
                        <p className="text-sm text-slate-500">Enable audio Azan and vibration alerts</p>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => setAzanEnabled(!azanEnabled)} className={cn("p-4 rounded-2xl transition-all", azanEnabled ? "bg-neon-blue text-black" : "bg-white/5 text-slate-500")}>
                          {azanEnabled ? <Volume2 /> : <VolumeX />}
                        </button>
                        <button onClick={() => setVibrateEnabled(!vibrateEnabled)} className={cn("p-4 rounded-2xl transition-all", vibrateEnabled ? "bg-neon-purple text-white" : "bg-white/5 text-slate-500")}>
                          <Zap />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xl font-bold">{t.hijriOffset}</h4>
                        <p className="text-sm text-slate-500">Adjust Hijri date manually (Moon Sighting)</p>
                      </div>
                      <div className="flex items-center gap-6 bg-white/5 p-2 rounded-2xl border border-white/10">
                        <button onClick={() => setHijriOffset(h => h - 1)} className="p-3 hover:text-neon-blue transition-colors"><X size={16} className="rotate-45" /></button>
                        <span className="font-mono font-black text-xl w-12 text-center">{hijriOffset >= 0 ? `+${hijriOffset}` : hijriOffset}</span>
                        <button onClick={() => setHijriOffset(h => h + 1)} className="p-3 hover:text-neon-blue transition-colors"><Plus size={16} /></button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xl font-bold">Interface Language</h4>
                        <p className="text-sm text-slate-500">Change the application language</p>
                      </div>
                      <select 
                        value={lang} 
                        onChange={(e) => setLang(e.target.value as Language)} 
                        className="bg-slate-800 border border-white/10 rounded-xl px-6 py-3 font-bold text-sm text-neon-blue outline-none cursor-pointer hover:bg-slate-700 transition-all"
                      >
                        <option value="en" className="bg-slate-800 text-neon-blue">English</option>
                        <option value="ur" className="bg-slate-800 text-neon-blue">اردو</option>
                        <option value="ar" className="bg-slate-800 text-neon-blue">العربية</option>
                        <option value="sd" className="bg-slate-800 text-neon-blue">سنڌي</option>
                        <option value="pa" className="bg-slate-800 text-neon-blue">پنجابی</option>
                        <option value="ps" className="bg-slate-800 text-neon-blue">پښتو</option>
                        <option value="bl" className="bg-slate-800 text-neon-blue">بلوچی</option>
                      </select>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="text-xl font-bold">{t.adjustPrayers}</h4>
                          <p className="text-sm text-slate-500">Add or subtract minutes from prayer times</p>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.geolocation.getCurrentPosition(
                              (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                              (err) => console.error("Location error:", err)
                            );
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-neon-blue/10 text-neon-blue border border-neon-blue/30 rounded-xl hover:bg-neon-blue/20 transition-all text-xs font-bold"
                        >
                          <Globe size={14} />
                          {t.refreshLocation}
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Object.keys(prayerOffsets).map((p) => (
                          <div key={p} className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block text-center">{p}</label>
                            <div className="flex items-center justify-between">
                              <button onClick={() => setPrayerOffsets(prev => ({ ...prev, [p]: prev[p] - 1 }))} className="text-slate-400 hover:text-neon-blue transition-colors">
                                <Plus size={14} className="rotate-45" />
                              </button>
                              <span className="font-mono font-black text-sm">{prayerOffsets[p] > 0 ? `+${prayerOffsets[p]}` : prayerOffsets[p]}</span>
                              <button onClick={() => setPrayerOffsets(prev => ({ ...prev, [p]: prev[p] + 1 }))} className="text-slate-400 hover:text-neon-blue transition-colors">
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
