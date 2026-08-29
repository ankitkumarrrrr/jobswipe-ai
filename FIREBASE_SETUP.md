# Firebase Setup Guide for JobSwipe AI

## Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Create a project"
3. Enter project name: `jobswipe-ai`
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Get Client Config
1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "Web" icon (</>) to add a web app
4. Enter app nickname: `JobSwipe Web`
5. Click "Register app"
6. Copy the `firebaseConfig` object values

## Step 3: Update .env.local
Add these values to your `.env.local` file:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=jobswipe-ai.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=jobswipe-ai
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=jobswipe-ai.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Step 4: Get Service Account (for Admin SDK)
1. In Firebase Console, go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file
4. Copy the entire JSON content
5. Add to `.env.local`:
```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

## Step 5: Create Firestore Database
1. In Firebase Console, go to Firestore Database
2. Click "Create database"
3. Choose "Start in test mode"
4. Select a location (closest to your users)
5. Click "Enable"

## Step 6: Set Up Firestore Security Rules
In Firestore → Rules, paste:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    match /stats/{document} {
      allow read, write: if request.auth != null;
    }
    match /applications/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 7: Enable Email/Password Authentication
1. In Firebase Console, go to Authentication
2. Click "Get started"
3. Enable "Email/Password" provider
4. Click "Save"

## Step 8: Restart the Server
```bash
pm2 restart jobswipe
```

## What Firebase Enables
- ✅ Real-time stats in admin dashboard
- ✅ Real-time user list updates
- ✅ Cross-device data sync
- ✅ Firebase Authentication (optional, alongside NextAuth)
- ✅ Firestore for scalable data storage
- ✅ Firebase Hosting for deployment

## Current Status
- SQLite: Working ✅
- Firebase: Ready to connect (add your config)
