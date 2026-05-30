# Hoang Long Homestay — Website

A boutique homestay booking website for **Hoàng Long Homestay**, located in Mộc Châu, Sơn La, Vietnam. Built with Next.js 14, fully internationalized in 5 languages (Vietnamese, English, Chinese, Korean, Japanese).

---

## Table of Contents

1. [Running Locally](#1-running-locally)
2. [Deploying to Vercel](#2-deploying-to-vercel)
3. [Adding Real Room Photos](#3-adding-real-room-photos)
4. [Updating Room Prices](#4-updating-room-prices)
5. [Blocking Unavailable Dates](#5-blocking-unavailable-dates)
6. [Updating Contact Details](#6-updating-contact-details)
7. [Adding a New Language](#7-adding-a-new-language)
8. [Project Structure](#8-project-structure)

---

## 1. Running Locally

**Requirements:** Node.js 18+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The site will redirect to `/vi` (Vietnamese) by default.

To build for production and preview it locally:

```bash
npm run build
npm run start
```

---

## 2. Deploying to Vercel

Vercel is the recommended host — Next.js deploys there with zero configuration.

**Step 1 — Push your code to GitHub**

Create a new repository on [github.com](https://github.com), then push:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/hoang-long-homestay.git
git push -u origin main
```

**Step 2 — Import the project on Vercel**

1. Go to [vercel.com](https://vercel.com) and sign in (you can use your GitHub account).
2. Click **Add New Project**.
3. Select your `hoang-long-homestay` GitHub repository.
4. Leave all build settings at their defaults — Vercel detects Next.js automatically.
5. Click **Deploy**.

**Step 3 — Connect your domain**

1. In your Vercel project, go to **Settings → Domains**.
2. Add `hoanglonghomestay.vn`.
3. Follow the DNS instructions Vercel provides (you will add a CNAME or A record at your domain registrar).

**Step 4 — Redeploy after changes**

Every time you push a new commit to the `main` branch, Vercel will automatically rebuild and redeploy the site.

---

## 3. Adding Real Room Photos

### Folder structure

Place all photos inside `/public/images/rooms/`. Name them exactly as shown:

```
public/
└── images/
    ├── hero.jpg                      ← Hero section background
    └── rooms/
        ├── green-mountain-1.jpg      ← Green Mountain Room — main shot
        ├── green-mountain-2.jpg      ← Green Mountain Room — photo 2
        ├── green-mountain-3.jpg      ← Green Mountain Room — photo 3
        ├── green-mountain-4.jpg      ← Green Mountain Room — photo 4
        ├── ban-flower-1.jpg          ← Ban Flower Room — main shot
        ├── ban-flower-2.jpg          ← Ban Flower Room — photo 2
        ├── ban-flower-3.jpg          ← Ban Flower Room — photo 3
        ├── ban-flower-4.jpg          ← Ban Flower Room — photo 4
        ├── family-room-1.jpg         ← Family Room — main shot
        ├── family-room-2.jpg         ← Family Room — photo 2
        ├── family-room-3.jpg         ← Family Room — photo 3
        ├── family-room-4.jpg         ← Family Room — photo 4
        ├── deluxe-1.jpg              ← Deluxe Room — main shot
        ├── deluxe-2.jpg              ← Deluxe Room — photo 2
        ├── deluxe-3.jpg              ← Deluxe Room — photo 3
        └── deluxe-4.jpg              ← Deluxe Room — photo 4
```

**Recommended photo dimensions:** 1200×800 px (3:2 ratio), JPEG quality 85. Keep each file under 300 KB.

### Where to update the code

**Hero photo** — open `components/HeroSection.tsx` and find:

```tsx
{/* TODO: Replace with actual hero photo */}
<Image
  src="/images/placeholder-room.svg"
  ...
/>
```

Change `src` to `"/images/hero.jpg"` and remove `unoptimized`.

**Room card photos (rooms listing page)** — open `components/RoomCard.tsx` and find:

```tsx
{/* TODO: Replace with actual room photo */}
<Image
  src="/images/placeholder-room.svg"
  ...
/>
```

Change the `src` to a dynamic path using the room's `id`:

```tsx
src={`/images/rooms/${room.id}-1.jpg`}
```

Remove `unoptimized` so Next.js can optimize the JPEG for you.

**Room gallery photos (detail modal, 4 slots)** — open `components/RoomDetailModal.tsx` and find the gallery grid:

```tsx
{gallery.map((cls, i) => (
  <div key={i} ...>
    {/* TODO: Replace with actual room photo */}
    <Image
      src="/images/placeholder-room.svg"
      ...
    />
```

Change `src` to:

```tsx
src={`/images/rooms/${room.id}-${i + 1}.jpg`}
```

Remove `unoptimized` from each one.

---

## 4. Updating Room Prices

Open `lib/rooms.ts`. Each room has a `pricePerNight` field in Vietnamese Dong (VND):

```ts
{
  id: 'green-mountain',
  nameVi: 'Phòng Núi Xanh',
  pricePerNight: 450_000,   // ← change this number
  ...
},
```

Change the number and save. The new price will appear automatically everywhere on the site — the rooms listing page, the room card, the detail modal, and the booking summary.

---

## 5. Blocking Unavailable Dates

Open `lib/availability.ts`. At the top you will find a `blockedDates` object with a list of date ranges for each room:

```ts
const blockedDates: Record<string, DateRange[]> = {
  'green-mountain': [
    { start: new Date('2026-05-20'), end: new Date('2026-05-23') },
    // Add more ranges here...
  ],
  'ban-flower': [ ... ],
  'family-room': [ ... ],
  'deluxe':      [ ... ],
};
```

**To block a new period**, add a new object to the correct room's array:

```ts
'green-mountain': [
  { start: new Date('2026-05-20'), end: new Date('2026-05-23') },
  { start: new Date('2026-08-10'), end: new Date('2026-08-20') }, // ← new blocked period
],
```

- The `start` date is the **first night** the room is unavailable.
- The `end` date is the **check-out date** (the day the next guest can check in). It is **not** included in the blocked period.
- Dates use the format `'YYYY-MM-DD'`.

Blocked dates will appear as strikethrough on the calendar and prevent those nights from being booked.

---

## 6. Updating Contact Details

### Phone number

There are two places to update:

1. **Contact section on the home page** — open `app/[locale]/page.tsx` and find:
   ```tsx
   <a href="tel:+84000000000" ...>+84 000 000 000</a>
   ```
   Replace both the `href` value and the display text with the real number.

2. **WhatsApp button** — open `components/WhatsAppButton.tsx` and find:
   ```ts
   const WHATSAPP_NUMBER = '84000000000';
   ```
   Replace with the real number (international format, no `+` or spaces, e.g. `'84912345678'`).

3. **Booking confirmation WhatsApp link** — open `components/BookingConfirmModal.tsx` and find:
   ```ts
   const WHATSAPP_NUMBER = '84000000000';
   ```
   Replace with the same real number.

### Email address

Open `app/[locale]/page.tsx` and find:
```tsx
<a href="mailto:info@hoanglonghomestay.vn" ...>info@hoanglonghomestay.vn</a>
```
Replace both the `href` and display text.

Also update the JSON-LD structured data in `app/[locale]/layout.tsx`:
```ts
email: 'info@hoanglonghomestay.vn',
telephone: '+84000000000',
```

### Address

The address is stored in the translation files. Open `messages/vi.json` (and the other language files) and find:

```json
"contact": {
  "address_value": "Xã Mộc Châu, Huyện Mộc Châu,\nSơn La, Việt Nam"
}
```

Update this in all five files: `vi.json`, `en.json`, `zh.json`, `ko.json`, `ja.json`. The `\n` produces a line break.

### SEO / structured data

After updating phone and email, also update the JSON-LD block in `app/[locale]/layout.tsx`:

```ts
const jsonLd = {
  telephone: '+84YOUR_NUMBER',
  email: 'your@email.com',
  address: {
    addressLocality: 'Mộc Châu',   // update if needed
    ...
  },
};
```

---

## 7. Adding a New Language

**Step 1 — Create the translation file**

Copy `messages/en.json` to `messages/XX.json` where `XX` is the locale code (e.g. `fr` for French). Translate every value — do not translate the keys.

**Step 2 — Register the locale in four places**

Open `i18n/routing.ts` (or `middleware.ts` — wherever `locales` is defined) and add the new code:

```ts
export const locales = ['vi', 'en', 'zh', 'ko', 'ja', 'fr'];
```

Open `app/[locale]/layout.tsx` and add the locale to the `locales` array:

```ts
const locales = ['vi', 'en', 'zh', 'ko', 'ja', 'fr'];
```

Open `components/Navbar.tsx` and add the locale to the `LOCALES` array and the display name to the `LOCALE_NAMES` map.

Open `app/sitemap.ts` and add the locale:

```ts
const LOCALES = ['vi', 'en', 'zh', 'ko', 'ja', 'fr'] as const;
```

**Step 3 — Add a CJK font (if needed)**

If the new language uses Chinese, Japanese, or Korean characters, a Noto Sans font is already loaded. For other scripts (Arabic, Thai, etc.), add the appropriate `next/font/google` font in `app/[locale]/layout.tsx` following the same pattern as the existing CJK fonts.

**Step 4 — Add metadata**

In `app/[locale]/layout.tsx`, add an entry to the `META` object:

```ts
fr: {
  title: 'Hoang Long Homestay | Retraite des Hauts Plateaux Vietnamiens',
  description: '...',
},
```

---

## 8. Project Structure

```
hoang-long-homestay/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx          ← Fonts, metadata, JSON-LD, WhatsApp button
│   │   ├── page.tsx            ← Home page (hero, features, rooms preview, contact)
│   │   ├── rooms/
│   │   │   └── page.tsx        ← Rooms listing page with filters
│   │   └── booking/
│   │       └── page.tsx        ← Multi-step booking form
│   ├── globals.css             ← Global styles, animations (pageFadeIn, waPulse, priceUpdate)
│   ├── robots.ts               ← robots.txt generation
│   └── sitemap.ts              ← sitemap.xml generation
├── components/
│   ├── Navbar.tsx              ← Navigation + language switcher
│   ├── HeroSection.tsx         ← Full-screen hero with CTA buttons
│   ├── AvailabilityChecker.tsx ← Date/guest search bar
│   ├── RoomCard.tsx            ← Room listing card (horizontal layout)
│   ├── RoomDetailModal.tsx     ← Full room detail overlay with photo gallery
│   ├── RoomsFilterBar.tsx      ← Sort and capacity filters
│   ├── DateRangePicker.tsx     ← Custom two-month calendar
│   ├── BookingConfirmModal.tsx ← Booking confirmation with reference number
│   └── WhatsAppButton.tsx      ← Floating WhatsApp button (bottom-right)
├── lib/
│   ├── rooms.ts                ← Room data (names, prices, amenities)
│   ├── availability.ts         ← Blocked date ranges per room
│   └── booking-store.ts        ← Zustand store for booking state
├── messages/
│   ├── vi.json                 ← Vietnamese translations
│   ├── en.json                 ← English translations
│   ├── zh.json                 ← Chinese translations
│   ├── ko.json                 ← Korean translations
│   └── ja.json                 ← Japanese translations
└── public/
    └── images/
        ├── placeholder-room.svg  ← Temporary placeholder (replace with real photos)
        └── rooms/                ← Add real room photos here (see section 3)
```
