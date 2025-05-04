import { collection } from 'firebase/firestore';
import { db } from '../firebase';

export const projectsCollection = collection(db, 'projects');
export const usersCollection = collection(db, 'users');
export const applicationsCollection = collection(db, 'applications');