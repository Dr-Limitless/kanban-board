# Section 41023 — Capstone Sprint Board

Real-time na kanban board (React + Vite + Firebase). Kahit sino makakapanood
nang live (view-only), pero ikaw lang ang makaka-edit (drag, add, delete)
sa pamamagitan ng "Edit mode" login sa taas-kanan.

---

## 1. I-setup ang Firebase project

1. Pumunta sa [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. Sa loob ng project, pumunta sa **Build → Firestore Database** → **Create database** → mode: **Production** → piliin ang region (hal. `asia-southeast1`).
3. Pumunta sa **Build → Authentication** → **Get started** → i-enable ang **Email/Password** provider.
4. Sa **Authentication → Users**, mag-**Add user** — ito 'yung account mo bilang editor (email + password na gagamitin mo para makapag-edit sa deployed site).
5. Pumunta sa **Project settings (⚙️) → General → Your apps** → click ang `</>` (Web app icon) → irehistro ang app → kopyahin ang `firebaseConfig` values, gagamitin sa Step 3 sa ibaba.

### Firestore Security Rules

Pumunta sa **Firestore Database → Rules**, i-replace ng ganito:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /kanbanCards/{cardId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Ibig sabihin: **kahit sino pwede magbasa** (view-only sa publiko), pero
**kailangan naka-login** (ikaw lang may account) bago makapag-add/edit/delete.

Click **Publish**.

---

## 2. I-install ang dependencies

```bash
npm install
```

---

## 3. I-configure ang environment variables

Kopyahin ang `.env.example` papuntang `.env`:

```bash
cp .env.example .env
```

Tapos i-paste ang values mula sa Firebase config (Step 1.5):

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

## 4. Subukan muna locally

```bash
npm run dev
```

Buksan sa browser (default: `http://localhost:5173`). I-click ang
**"Edit mode"** sa taas-kanan, i-login gamit 'yung account na ginawa mo
sa Step 1.4 — dapat lumabas na 'yung add/drag/delete controls.

---

## 5. I-deploy sa Vercel

1. I-push ang project na 'to sa isang GitHub repo.
2. Pumunta sa [vercel.com](https://vercel.com) → **Add New Project** → i-import 'yung repo.
3. Sa **Environment Variables**, i-add lahat ng 6 na `VITE_FIREBASE_*` variables (kopya mula sa `.env` mo).
4. Framework preset: **Vite** (auto-detected naman).
5. Click **Deploy**.

## O kaya i-deploy sa Netlify

1. I-push sa GitHub din.
2. Sa [netlify.com](https://netlify.com) → **Add new site → Import an existing project**.
3. Build command: `npm run build`, Publish directory: `dist`.
4. Sa **Site settings → Environment variables**, i-add din lahat ng `VITE_FIREBASE_*` vars.
5. Deploy.

---

## Paalala

- Ang `.env` ay **hindi** dapat i-push sa GitHub (nasa `.gitignore` na ito) —
  environment variables sa Vercel/Netlify na lang ang gagamitin sa production.
- Kung may gusto kang idagdag pang editor account, balik lang sa
  **Firebase Console → Authentication → Users → Add user**.
- Ang mga cards ay naka-store sa Firestore collection na `kanbanCards` —
  pwede mo ring tingnan/i-edit direkta doon kung kinakailangan.
