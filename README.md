# ScreenCraft 🎨📸

מערכת צילום מסך מתקדמת לדסקטופ – בנויה עם React, Electron ו-Lovable Cloud.

## ✨ תכונות עיקריות

- **צילום מסך מיידי** – לחיצה אחת לצילום המסך המלא
- **צילום אזור** – בחירת אזור ספציפי לצילום (Crop)
- **סימון וציור** – ציור חופשי על המסך לפני הצילום (Annotate)
- **טיימר** – צילום עם השהיה (3/5/10 שניות)
- **גלריה** – ניהול צילומים עם חיפוש, סינון, תיקיות וגרירה לסידור מחדש
- **נעיצה (Pin)** – הצמדת צילומים למסך כחלונות צפים
- **תבניות ציור** – שמירה וטעינה של תבניות ציור מוכנות
- **חלונות צפים** – כל הדיאלוגים ניתנים לגרירה, שינוי גודל, מיזעור והגדלה
- **z-index דינמי** – לחיצה על חלון מביאה אותו לחזית
- **סגירה עם Escape** – כל חלון נסגר בלחיצה על Escape
- **System Tray** – האפליקציה רצה ברקע ונגישה מה-Tray

## 🏗️ ארכיטקטורה

```
src/
├── pages/
│   ├── Index.tsx            # שטח עבודה ראשי (ריק + סיידבר צף)
│   └── Auth.tsx             # מסך כניסה / הרשמה
├── components/
│   ├── FloatingSidebar.tsx   # סיידבר צף – נפתח במעבר עכבר, ניתן לנעיצה
│   ├── FloatingWindow.tsx   # חלון צף – גרירה, resize, מיזעור, Escape
│   ├── GalleryPanel.tsx     # גלריה – חיפוש, סינון, תיקיות, drag & drop
│   ├── AnnotateOverlay.tsx  # שכבת ציור – כלי ציור + תבניות
│   ├── PinnedScreenshot.tsx # צילום מוצמד למסך
│   ├── TimerOverlay.tsx     # ספירה לאחור לפני צילום
│   └── RegionSelectOverlay.tsx # בחירת אזור לצילום
├── hooks/
│   ├── useScreenCapture.ts  # לוגיקת צילום, שמירה, מחיקה
│   ├── useWindowManager.tsx # ניהול z-index דינמי בין חלונות
│   ├── useAuth.tsx          # אימות משתמשים
│   ├── useFolders.ts        # ניהול תיקיות
│   ├── useAnnotation.ts     # לוגיקת ציור
│   └── useDrawingTemplates.ts # תבניות ציור
electron/
└── main.cjs                 # Electron Main Process + System Tray
```

## 🔄 זרימת שימוש

1. **כניסה** – המשתמש מתחבר / נרשם דרך מסך Auth
2. **שטח עבודה** – מסך ריק עם סיידבר צף (העברת עכבר לקצה השמאלי)
3. **צילום** – בחירת שיטת צילום מהסיידבר
4. **ניהול** – פתיחת הגלריה לצפייה, מחיקה, הורדה, העברה לתיקיות
5. **עריכה** – סימון וציור על צילומים, שמירת תבניות

> **אין דף נחיתה** – האפליקציה נפתחת ישירות לשטח העבודה (לאחר התחברות).
> כל הכלים נגישים דרך הסיידבר הצף והחלונות.

## 🖥️ הרצה מקומית (פיתוח)

```bash
npm install
npm run dev
```

## 📦 בניית Electron

```bash
npm run build
npx @electron/packager . ScreenCraft --platform=win32 --arch=x64 --out=electron-release --overwrite
```

## 🛠️ טכנולוגיות

- **Frontend:** React 18, TypeScript, Tailwind CSS, Framer Motion
- **UI:** shadcn/ui, Radix UI
- **Backend:** Lovable Cloud (אימות, אחסון, מסד נתונים)
- **Desktop:** Electron עם System Tray
- **Drag & Drop:** @hello-pangea/dnd
