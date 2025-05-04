import { storage } from './firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';

/**
 * Firebase Storage CORS Configuration Helper
 * 
 * This file provides utilities to help diagnose and fix CORS issues with Firebase Storage.
 * 
 * Common CORS issues with Firebase Storage:
 * 1. Video playback fails with no visible error
 * 2. Video shows poster image but doesn't play
 * 3. Network errors in console related to CORS
 * 
 * To fix CORS issues with Firebase Storage, follow these steps:
 * 
 * 1. Install Firebase CLI if not already installed:
 *    npm install -g firebase-tools
 * 
 * 2. Login to Firebase:
 *    firebase login
 * 
 * 3. Create a cors.json file with the following content:
 *    [
 *      {
 *        "origin": ["*"],
 *        "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
 *        "maxAgeSeconds": 3600,
 *        "responseHeader": ["Content-Type", "Content-Disposition", "Content-Length"]
 *      }
 *    ]
 * 
 * 4. Set CORS configuration for your storage bucket:
 *    firebase storage:cors update cors.json --project YOUR_PROJECT_ID
 * 
 * 5. Verify the CORS configuration:
 *    firebase storage:cors get --project YOUR_PROJECT_ID
 * 
 * Note: For production, you should restrict the "origin" to your specific domains
 * instead of using "*" which allows any origin.
 */

/**
 * Tests if a Firebase Storage URL is accessible and properly configured for CORS
 * @param url The Firebase Storage URL to test
 * @returns A promise that resolves to a result object with success status and message
 */
export async function testFirebaseStorageCors(url: string): Promise<{ success: boolean; message: string }> {
  try {
    // First, check if the URL is accessible with a simple HEAD request
    const headResponse = await fetch(url, { method: 'HEAD' });
    
    if (!headResponse.ok) {
      return {
        success: false,
        message: `URL is not accessible: ${headResponse.status} ${headResponse.statusText}`
      };
    }
    
    // Check CORS headers
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers'
    ];
    
    let corsIssues = [];
    
    if (!headResponse.headers.has('access-control-allow-origin')) {
      corsIssues.push('Missing Access-Control-Allow-Origin header');
    }
    
    if (corsIssues.length > 0) {
      // Log all headers for debugging
      console.log('Response headers:');
      headResponse.headers.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });
      
      return {
        success: false,
        message: `CORS issues detected: ${corsIssues.join(', ')}`
      };
    }
    
    // Try to fetch the content to verify full access
    const contentResponse = await fetch(url);
    if (!contentResponse.ok) {
      return {
        success: false,
        message: `Content fetch failed: ${contentResponse.status} ${contentResponse.statusText}`
      };
    }
    
    return {
      success: true,
      message: 'CORS is properly configured for this URL'
    };
  } catch (error) {
    console.error('Error testing CORS configuration:', error);
    return {
      success: false,
      message: `Error testing CORS: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Creates a blob URL from a Firebase Storage URL to bypass CORS issues
 * @param url The Firebase Storage URL
 * @returns A promise that resolves to a blob URL
 */
export async function createBlobUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error creating blob URL:', error);
    throw error;
  }
}

/**
 * Displays instructions for configuring CORS for Firebase Storage
 */
export function showCorsConfigInstructions(): void {
  console.info(`
    === Firebase Storage CORS Configuration Instructions ===
    
    1. Install Firebase CLI:
       npm install -g firebase-tools
    
    2. Login to Firebase:
       firebase login
    
    3. Create a cors.json file with:
       [
         {
           "origin": ["*"],
           "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
           "maxAgeSeconds": 3600,
           "responseHeader": ["Content-Type", "Content-Disposition", "Content-Length"]
         }
       ]
    
    4. Update CORS configuration:
       firebase storage:cors update cors.json --project YOUR_PROJECT_ID
    
    5. Verify the configuration:
       firebase storage:cors get --project YOUR_PROJECT_ID
  `);
  
  toast.info('CORS configuration instructions have been logged to the console');
}
