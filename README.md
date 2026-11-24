# 🔍 Returnly — Community Lost & Found Platform

> A warm, human, community-powered lost and found platform. Built after losing a cat. 🐱

---

## 📖 About

Returnly is a free, open platform where people report lost items and kind strangers post found items. Users can browse, filter, and contact each other through the platform — with privacy and safety at the core.

**Origin story:** The founder, Amna, lost her cat Berbal and discovered there was no calm, focused community board for exactly this scenario. Returnly is that board.

---

## 🚀 Quick Start

### 1. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Create a new project.
3. In the SQL Editor, paste and run the entire contents of `supabase/schema.sql`.
4. In **Storage**, create a bucket called `item-photos` with **public** access.

### 2. Configure Your Credentials

Open `js/supabase.js` and replace the two placeholder values:

```js
const SUPABASE_URL  = 'YOUR_SUPABASE_URL_HERE';   // e.g. https://xyzxyz.supabase.co
const SUPABASE_ANON = 'YOUR_SUPABASE_ANON_KEY_HERE';
```

Find these values at:  
**Supabase Dashboard → Your Project → Settings → API**

### 3. Add a Hero Video / Poster

- Place your hero video at `assets/hero.mp4`
- Place a fallback poster image at `assets/hero-poster.jpg` (screenshot of the video)
- The existing `Man_recovering_lost_bag_4f0d2ae7.mp4` has been copied to `assets/hero.mp4` automatically.

### 4. Open in Browser

```bash
# Any static file server works, e.g.:
npx serve .
# or
python -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

> ⚠️ **Important:** Open via a local server, not by double-clicking `index.html`. Supabase requires HTTP/HTTPS; file:// will block the CDN and cause CORS errors.

---

## 📁 File Structure

```
Returnly/
├── index.html          # Home: hero, how-it-works, recent items, origin story
├── lost.html           # Lost items list with search & filters
├── found.html          # Found items list with search & filters
├── post.html           # Post an item form (login required)
├── login.html          # Sign in / Create account
├── dashboard.html      # User's own posts: mark returned, delete
├── css/
│   └── style.css       # Global stylesheet (mobile-first, design tokens)
├── js/
│   ├── main.js         # Shared JS: navbar, auth state, item cards, modal, filters
│   └── supabase.js     # ⚙️  Supabase client config — SET YOUR KEYS HERE
├── supabase/
│   └── schema.sql      # Database schema + Row Level Security policies
├── assets/
│   ├── hero.mp4        # Background video for hero section
│   └── hero-poster.jpg # Video poster fallback image
└── README.md           # This file
```

---

## 🗄️ Database Schema

```sql
-- items table
id             UUID (primary key)
user_id        UUID (references auth.users)
type           TEXT ('lost' | 'found')
title          TEXT
category       TEXT (Pets | Phone | Wallet | Bag | Keys | Documents | Other)
description    TEXT
image_url      TEXT
area           TEXT  -- neighbourhood only, never a full address
item_date      DATE
contact_method TEXT ('email' | 'phone' | 'whatsapp')
contact_value  TEXT  -- visible only to logged-in users
status         TEXT ('open' | 'returned')
created_at     TIMESTAMPTZ
```

### Row Level Security

| Action | Who |
|--------|-----|
| Read   | Everyone (including anonymous visitors) |
| Insert | Authenticated users only (must be the owner) |
| Update | Only the item's owner |
| Delete | Only the item's owner |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary (teal) | `#0F766E` |
| Accent (orange) | `#F59E0B` |
| Background | `#FAF7F2` |
| Heading font | Poppins |
| Body font | Inter |

All design tokens are defined as CSS custom properties in `css/style.css` under `:root {}`.

---

## ✨ Features

### Public (no login required)
- Browse all lost and found items
- Search by keyword (title, description, area)
- Filter by category and neighbourhood
- View item details in a modal

### Logged-in users
- View contact details of an item poster
- Post lost or found items (with photo upload)
- Dashboard: view, manage, and delete own posts
- Mark items as "Returned" to celebrate reunions

### Safety
- **No full addresses** — area/neighbourhood only
- Contact information gated behind login
- RLS policies enforced at the database level

---

## 🛡️ Security Notes

- The Supabase **anon key** in `js/supabase.js` is safe to expose publicly — it only allows what the RLS policies permit.
- Never put your Supabase **service role key** in any client-side file.
- Contact details are only visible to signed-in users.
- Full home addresses are never requested or stored.

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Plain HTML5, CSS3, Vanilla JavaScript |
| Backend & Auth | [Supabase](https://supabase.com) (PostgreSQL + Auth + Storage) |
| Fonts | Google Fonts (Poppins + Inter) |
| Supabase Client | Loaded from CDN (`@supabase/supabase-js@2`) |
| Hosting | Any static host (Vercel, Netlify, GitHub Pages, etc.) |

---

## 🌍 Deploying

Returnly is a static site — no build step required. Deploy to any static host:

**Vercel:**
```bash
npx vercel
```

**Netlify:** Drag the `Returnly/` folder into [app.netlify.com/drop](https://app.netlify.com/drop).

**GitHub Pages:** Push to a repo and enable Pages on the `main` branch.

---

## 🤝 Contributing

This is an open community project. PRs welcome for:
- More categories
- Map integration (show approximate item location on a map)
- Push notifications for new items in your area
- Multilingual support

---

## 📄 License

MIT — free to use, modify, and distribute.

---

*Made with ❤️ for communities. Because most people are good — they just need a place to connect.*
