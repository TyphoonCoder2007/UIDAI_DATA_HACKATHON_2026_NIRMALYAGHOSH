# Firebase Setup Guide

## Prerequisites

- Google account
- Node.js 18+ installed
- Firebase CLI (`npm install -g firebase-tools`)

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Name: `aadhaar-intelligence` (or similar)
4. Disable Google Analytics (optional for this project)
5. Click **Create project**

---

## Step 2: Enable Firestore

1. In Firebase Console, go to **Build → Firestore Database**
2. Click **Create database**
3. Select **Production mode**
4. Choose location: `asia-south1` (Mumbai) for India
5. Click **Enable**

---

## Step 3: Get Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Click **Add app** → **Web** (</> icon)
4. Register app name: `aadhaar-dashboard`
5. Copy the `firebaseConfig` object

---

## Step 4: Update Project Configuration

Open `src/config/firebase-config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",           // Your API key
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Step 5: Configure Firestore Security Rules

In Firebase Console → Firestore → Rules, set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to live_metrics, alerts, insights
    match /live_metrics/{document=**} {
      allow read: if true;
      allow write: if false; // Backend only
    }
    
    match /alerts/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    match /insights/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    // Event collections - no public access
    match /enrollment_events/{document=**} {
      allow read, write: if false;
    }
    
    match /demographic_update_events/{document=**} {
      allow read, write: if false;
    }
    
    match /biometric_update_events/{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Step 6: Create Indexes

For optimal query performance, create composite indexes:

1. Go to **Firestore → Indexes**
2. Add the following:

| Collection | Fields | Order |
|------------|--------|-------|
| alerts | state, severity, timestamp | Asc, Asc, Desc |
| alerts | acknowledged, timestamp | Asc, Desc |
| live_metrics | health_score | Desc |

---

## Step 7: Initialize and Run

```bash
cd WEBSITE

# Install dependencies
npm install

# Run development server
npm run dev
```

The application will now connect to your Firebase project.

---

## Troubleshooting

### "Permission Denied" Errors
- Check Firestore security rules
- Ensure project ID matches configuration

### "Network Error"
- Check internet connectivity
- Verify Firebase project is active

### Demo Mode Still Active
- Ensure `apiKey` is not "YOUR_API_KEY"
- Check browser console for configuration errors

---

## Data Ingestion (Admin Console)

To ingest data, you'll need to:

1. Enable admin authentication (Firebase Auth)
2. Update security rules to allow authenticated writes
3. Use the data ingestion functions from `data-ingestion.js`

For hackathon demo purposes, the system runs in demo mode with sample data.
