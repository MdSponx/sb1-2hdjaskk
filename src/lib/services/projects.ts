import { collection, addDoc, updateDoc, getDocs, getDoc, doc, query, orderBy, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { projectsCollection } from '../firebase/collections';
import type { Project } from '../../types/project';
import { deleteProjectImage } from '../storage';

export async function getProjects(): Promise<Project[]> {
  try {
    const q = query(
      projectsCollection,
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const projects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Project));

    return projects.filter(project => project.status !== 'archived');
  } catch (error: any) {
    console.error('Error getting projects:', error);
    throw new Error('Failed to fetch projects');
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const docRef = doc(db, 'projects', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Project;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting project:', error);
    throw new Error('Failed to fetch project');
  }
}

export async function createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  try {
    const newProject = {
      ...project,
      tags: project.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const docRef = await addDoc(projectsCollection, newProject);
    return {
      id: docRef.id,
      ...newProject,
    };
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project');
  }
}

export async function updateProject(id: string, project: Partial<Project>): Promise<void> {
  try {
    const docRef = doc(db, 'projects', id);
    await updateDoc(docRef, {
      ...project,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw new Error('Failed to update project');
  }
}

export async function deleteProject(id: string, imageUrl?: string): Promise<void> {
  try {
    const docRef = doc(db, 'projects', id);
    
    if (imageUrl) {
      await deleteProjectImage(imageUrl);
    }
    
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new Error('Failed to delete project');
  }
}