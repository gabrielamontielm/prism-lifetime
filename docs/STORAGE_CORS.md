# Firebase Storage Configuration

To enable image uploads in LifePrism, you must configure two settings in your Firebase console: **CORS** (to allow the browser to talk to Storage) and **Security Rules** (to allow authenticated users to write).

## 🛠️ 1. Security Rules (Mandatory)

By default, Firebase Storage blocks all writes. You must apply the rules I've generated for you.

1. Open the [Firebase Console](https://console.firebase.com/).
2. Go to **Storage > Rules**.
3. Replace the existing contents with these (also found in `/storage.rules`). **IMPORTANT: Click the "Publish" button after pasting!**

### Standard Production Rules (Recommended)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} { allow read, write: if false; }
    match /events/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

### Emergency "Debug Mode" Rules
If you are still getting "unauthorized" errors, try these extremely permissive rules temporarily to verify your connection:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
*Note: Only use these for testing. Switch back to specific paths once fixed.*

## 📋 2. CORS Configuration

If you are seeing a CORS error (e.g., "Access-Control-Allow-Origin" missing), follow these steps via CLI.

### Create `cors.json`
I have created a `cors.json` file in your root directory.

### Apply via CLI
Run these commands in your local terminal:

```bash
# 1. Authenticate
gcloud auth login

# 2. Set project context
gcloud config set project gen-lang-client-0176879604

# 3. Apply CORS
# Try firebasestorage.app first, then appspot.com if it fails
gsutil cors set cors.json gs://gen-lang-client-0176879604.firebasestorage.app
```

## 🔍 Troubleshooting 404/Unauthorized

If `gsutil` returns **NotFound (404)**:
1. Ensure you have clicked **"Get Started"** in the Firebase Storage dashboard to provision the bucket.
2. Verify the account in `gcloud auth login` has "Storage Admin" permissions.

If the app returns **unauthorized**:
1. Verify the Security Rules (Step 1) were actually **Published** in the console.
2. Ensure you are signed into the app before uploading.
