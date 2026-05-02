# ShopKaBot Mobile App

Android-focused Expo React Native app for managing the `auto_reply_messages` collection from the `MeraAI-WhatappBot` backend.

## Included

- Google login with Firebase
- Drawer navigation
- Dashboard overview
- Full CRUD for auto reply rules
- Local business settings persistence
- Rule testing screen
- Disable AI Reply screen
- Razorpay-powered subscription screen
- WhatsApp Business connection flow

## Tech

- Expo SDK 54
- React Native
- React Navigation Drawer
- Firebase Auth
- Expo Auth Session

## App Folder

`shopkabot-mobile-app`

## Environment Setup

Create `.env` in this folder using `.env.example`.

Important values:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_FIREBASE_*`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_RAZORPAY_*`
- `EXPO_PUBLIC_META_*`

For Meta onboarding, you can either provide:

- `EXPO_PUBLIC_META_ONBOARDING_URL`
- or `EXPO_PUBLIC_META_APP_ID` + `EXPO_PUBLIC_META_CONFIG_ID`

## Google Login Notes

This app uses the same Firebase project values used by the existing dashboard as the base reference.

Web login uses Firebase `signInWithPopup`.
Native login uses Expo Auth Session + Google OAuth client IDs.

For Android Google sign in, you still need to configure:

- Android OAuth client in Firebase / Google Cloud
- package name: `com.shopkabot.mobile`

For local browser testing, make sure `localhost` is allowed in:

- Firebase Console -> Authentication -> Settings -> Authorized domains

## Local Backend Notes

If you run the FastAPI backend locally and test on Android emulator, use:

`http://10.0.2.2:8000`

If you test on a real device, replace the API URL in Business Settings with a reachable LAN or deployed backend URL.

## Run

```bash
npm install
npm run android
```

For Meta embedded signup on web, start the web app over `https`:

```bash
npm run web
```

Facebook Login is blocked on `http` pages, so embedded signup will fail if the web app is served insecurely.

## Deploy To Vercel

This app deploys to Vercel as a static Expo web export.

Files added for deployment:

- `vercel.json`
- `scripts/sync-vercel-env.ps1`

### One-time setup

From `shopkabot-mobile-app`:

```powershell
npx vercel login
npx vercel link
```

### Sync all app env vars to Vercel

If your deployment values are already in `.env`:

```powershell
npm run vercel:env
```

If you keep production values in a separate file such as `.env.production`:

```powershell
npm run vercel:env -- -FilePath .env.production
```

By default, the script syncs every variable in that file to:

- `production`
- `preview`
- `development`

If you only want production:

```powershell
npm run vercel:env -- -FilePath .env.production -Targets production
```

### Deploy

Preview deployment:

```powershell
npm run vercel:preview
```

Production deployment:

```powershell
npm run vercel:deploy
```

### Recommended production flow

```powershell
npx vercel login
npx vercel link
npm run vercel:env -- -FilePath .env.production -Targets production preview
npm run vercel:deploy
```

## Backend APIs Used

- `GET /admin/auto-reply-messages?gmailId=...&businessId=...`
- `POST /admin/auto-reply-messages`
- `PUT /admin/auto-reply-messages/{message_id}`
- `DELETE /admin/auto-reply-messages/{message_id}`
- `GET /admin/business-reply-config/{business_id}`
- `POST /admin/business-reply-config/{business_id}/add`
- `POST /admin/business-reply-config/{business_id}/remove`
- `POST /api/billing/razorpay/subscriptions`
- `POST /api/billing/razorpay/verify`
- `GET /api/billing/razorpay/subscriptions/current?gmailId=...&businessId=...`

## Subscription Billing Docs

For the full app + backend + Razorpay linking flow, see:

- [Subscription Billing README](D:/Projects/MERAAI_CHATBOT/MeraAI-WhatappBot/whatsapp-service/docs/subscription-billing/README.md)

## Current Scope

The app performs frontend Google auth only.

Rules are scoped in the mobile UI by:

- logged-in Firebase user email as `gmailId`
- optional `businessId` from Business Settings

## Main Screens

- `Dashboard`
- `Rules`
- `Test Rules`
- `Reply History`
- `Business Settings`
- `Disable AI Reply`
- `Subscription`
- `Automation`
- `Connect WhatsApp`
- `Help / About`
