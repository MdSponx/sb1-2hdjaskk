# Firebase Storage CORS Configuration Guide

This guide will help you fix CORS (Cross-Origin Resource Sharing) issues with Firebase Storage videos that are not playing in your web application.

## Problem Description

If your videos uploaded to Firebase Storage are:
- Showing only the poster image but not playing
- Working in the sidebar thumbnails but not in the main player
- Accessible directly via URL but not playing in your application
- Not showing any console errors

The issue is likely related to CORS configuration in your Firebase Storage bucket.

## Solution: Configure CORS for Firebase Storage

Follow these steps to configure CORS for your Firebase Storage bucket:

### 1. Install Firebase CLI

If you haven't already installed the Firebase CLI, install it globally:

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

Authenticate with your Firebase account:

```bash
firebase login
```

### 3. Use the Provided CORS Configuration File

We've included a `cors.json` file in this repository with the following content:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Content-Disposition", "Content-Length"]
  }
]
```

> **Note:** For production environments, you should restrict the `"origin"` to your specific domains instead of using `"*"` which allows any origin.

### 4. Update CORS Configuration for Your Storage Bucket

Run the following command, replacing `YOUR_PROJECT_ID` with your Firebase project ID:

```bash
firebase storage:cors update cors.json --project YOUR_PROJECT_ID
```

### 5. Verify the CORS Configuration

Check if the CORS settings were applied correctly:

```bash
firebase storage:cors get --project YOUR_PROJECT_ID
```

## Alternative Solutions in the Application

If you can't immediately update the CORS configuration, the application includes several workarounds:

1. **Blob URL Method**: This downloads the video file and creates a local blob URL to play it
2. **CrossOrigin Attribute**: Tries to use the `crossOrigin="anonymous"` attribute on the video element
3. **Direct URL Access**: You can open the video URL directly in a new tab

## Testing CORS Configuration

The application includes tools to test if CORS is properly configured:

1. Click the "ตรวจสอบ CORS" (Check CORS) button in the debug tools panel
2. Check the browser console for detailed CORS headers information
3. If you see "CORS is properly configured" message, the configuration is correct

## Need More Help?

If you continue to experience issues after configuring CORS:

1. Check your Firebase Storage security rules to ensure read access is permitted
2. Verify that the video files are in a supported format (MP4 or MOV)
3. Try uploading a new video to see if the issue persists
4. Check if your video encoding is compatible with web browsers

For more information, refer to the [Firebase Storage CORS documentation](https://firebase.google.com/docs/storage/web/download-files#cors_configuration).
