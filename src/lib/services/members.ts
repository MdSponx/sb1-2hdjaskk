import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { ApplicationMember } from '../../types/member';
import { toast } from 'sonner';

/**
 * Helper function to get the members collection reference
 */
const getMembersCollection = (applicationId: string) => {
  return collection(db, `applications/${applicationId}/members`);
};

/**
 * Helper function to get a member document reference
 */
const getMemberDoc = (applicationId: string, memberId: string) => {
  return doc(db, `applications/${applicationId}/members`, memberId);
};

/**
 * Validate application ID and check if application exists
 */
const validateApplication = async (applicationId: string): Promise<void> => {
  if (!applicationId) {
    throw new Error('ไม่มี Application ID');
  }

  const applicationRef = doc(db, 'applications', applicationId);
  const applicationSnap = await getDoc(applicationRef);
  
  if (!applicationSnap.exists()) {
    throw new Error('ไม่พบข้อมูลโครงการ');
  }
};

/**
 * สร้างสมาชิกใหม่ในกลุ่ม
 */
export async function createMember(applicationId: string, memberData: Omit<ApplicationMember, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    await validateApplication(applicationId);
    
    const membersRef = getMembersCollection(applicationId);
    const newMember = {
      ...memberData,
      stay: true, // Set default stay status to true
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const docRef = await addDoc(membersRef, newMember);
    
    return {
      id: docRef.id,
      ...newMember,
    };
  } catch (error) {
    console.error('Error creating member:', error);
    throw new Error('ไม่สามารถเพิ่มสมาชิกได้');
  }
}

/**
 * ดึงข้อมูลสมาชิกทั้งหมดในกลุ่ม
 */
export async function getMembers(applicationId: string): Promise<ApplicationMember[]> {
  try {
    await validateApplication(applicationId);
    
    const membersRef = getMembersCollection(applicationId);
    const querySnapshot = await getDocs(membersRef);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      stay: doc.data().stay ?? true, // Ensure stay has a default value
    } as ApplicationMember));
  } catch (error) {
    console.error('Error getting members:', error);
    throw error;
  }
}

/**
 * อัปเดตสถานะการเข้าพักของสมาชิก
 */
export async function updateMemberStay(applicationId: string, memberId: string, stay: boolean): Promise<void> {
  try {
    await validateApplication(applicationId);
    
    const memberRef = getMemberDoc(applicationId, memberId);
    await updateDoc(memberRef, {
      stay,
      updatedAt: new Date().toISOString(),
    });
    
    toast.success('บันทึกสถานะการเข้าพักเรียบร้อย');
  } catch (error) {
    console.error('Error updating stay status:', error);
    toast.error('ไม่สามารถบันทึกสถานะการเข้าพัก');
    throw error;
  }
}

/**
 * อัปเดตข้อมูลสมาชิก
 */
export async function updateMember(applicationId: string, memberId: string, memberData: Partial<ApplicationMember>) {
  try {
    if (!memberId) {
      throw new Error('ไม่มี Member ID');
    }

    await validateApplication(applicationId);

    const memberRef = getMemberDoc(applicationId, memberId);
    const memberSnap = await getDoc(memberRef);
    
    if (!memberSnap.exists()) {
      throw new Error('ไม่พบข้อมูลสมาชิก');
    }
    
    await updateDoc(memberRef, {
      ...memberData,
      updatedAt: new Date().toISOString(),
    });
    
    return await getMember(applicationId, memberId);
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
}

/**
 * ลบสมาชิก
 */
export async function deleteMember(applicationId: string, memberId: string) {
  try {
    if (!memberId) {
      throw new Error('ไม่มี Member ID');
    }

    await validateApplication(applicationId);

    const memberRef = getMemberDoc(applicationId, memberId);
    const memberSnap = await getDoc(memberRef);
    
    if (!memberSnap.exists()) {
      throw new Error('ไม่พบข้อมูลสมาชิก');
    }
    
    const memberData = memberSnap.data();
    if (memberData?.isOwner) {
      throw new Error('ไม่สามารถลบเจ้าของกลุ่มได้');
    }

    await deleteDoc(memberRef);
    return true;
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
}

/**
 * สร้างเจ้าของกลุ่มอัตโนมัติ
 */
export async function createOwnerMember(applicationId: string, ownerData: Omit<ApplicationMember, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    await validateApplication(applicationId);
    
    const members = await getMembers(applicationId);
    
    const hasOwner = members.some(member => member.isOwner);
    if (hasOwner) {
      return null;
    }
    
    if (ownerData.userId) {
      const existingMember = members.find(member => member.userId === ownerData.userId);
      if (existingMember) {
        return existingMember;
      }
    }
    
    const existingMemberByName = members.find(
      member => 
        member.fullNameTH === ownerData.fullNameTH || 
        member.fullNameEN === ownerData.fullNameEN
    );
    
    if (existingMemberByName) {
      return existingMemberByName;
    }
    
    const createdMember = await createMember(applicationId, {
      ...ownerData,
      isOwner: true,
      isAdmin: true,
      stay: true, // Set default stay status to true for owner
    });
    
    return createdMember;
  } catch (error) {
    console.error('Error creating owner member:', error);
    throw error;
  }
}