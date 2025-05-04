import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { v4 as uuidv4 } from 'uuid';

export async function uploadProfileImage(file: File, userId: string): Promise<string> {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storageRef = ref(storage, `profile_images/${userId}/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error('Failed to upload profile image');
  }
}

export async function uploadProjectImage(file: File, projectId: string): Promise<string> {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storageRef = ref(storage, `project_images/${projectId}/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading project image:', error);
    throw new Error('Failed to upload project image');
  }
}

export async function deleteProfileImage(imageUrl: string): Promise<void> {
  try {
    // Extract the path from the Firebase Storage URL
    const decodedUrl = decodeURIComponent(imageUrl);
    const startIndex = decodedUrl.indexOf('/o/') + 3;
    const endIndex = decodedUrl.indexOf('?');
    const path = decodedUrl.substring(startIndex, endIndex);
    
    const imageRef = ref(storage, path);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting profile image:', error);
    // Don't throw error if deletion fails - the image might have already been deleted
  }
}

export async function deleteProjectImage(imageUrl: string): Promise<void> {
  try {
    const decodedUrl = decodeURIComponent(imageUrl);
    const startIndex = decodedUrl.indexOf('/o/') + 3;
    const endIndex = decodedUrl.indexOf('?');
    const path = decodedUrl.substring(startIndex, endIndex);
    
    const imageRef = ref(storage, path);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting project image:', error);
  }
}

export function getImageUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  
  // Check if the URL is already a complete URL
  try {
    new URL(url);
    return url;
  } catch {
    // If URL parsing fails, it might be a relative path
    return null;
  }
}