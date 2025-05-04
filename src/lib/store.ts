import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
  AuthError 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { AuthState, User, Role } from '../types/auth';
import { toast } from 'sonner';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  searchUsers: (email: string) => Promise<User[]>;
  updateUserRole: (userId: string, role: Role) => Promise<void>;
  fetchNonViewerUsers: () => Promise<User[]>;
  setLoading: (isLoading: boolean) => void;
}

const convertFirebaseUser = async (firebaseUser: FirebaseUser | null): Promise<User | null> => {
  if (!firebaseUser || !firebaseUser.email) return null;

  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      console.warn('User document not found:', firebaseUser.uid);
      return null;
    }

    const userData = userDoc.data() as User;
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      fullName: userData.fullName || '',
      fullNameEng: userData.fullNameEng || '', 
      nickname: userData.nickname || '',
      role: userData.role || 'viewer',
      phoneNumber: userData.phoneNumber || '',
      bio: userData.bio || '',
      profileImage: userData.profileImage || '',
      birthday: userData.birthday || '',
      gender: userData.gender || null,
      userType: userData.userType || null,
      schoolLevel: userData.schoolLevel || null,
      schoolYear: userData.schoolYear || null,
      instituteName: userData.instituteName || '',
      province: userData.province || '',
      collegeLevel: userData.collegeLevel || null,
      collegeYear: userData.collegeYear || null,
      faculty: userData.faculty || '',
      department: userData.department || '',
      teacherInstitute: userData.teacherInstitute || '',
      teacherFaculty: userData.teacherFaculty || '',
      teacherDepartment: userData.teacherDepartment || '',
      teacherProvince: userData.teacherProvince || '',
      organization: userData.organization || '',
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error converting Firebase user:', error);
    return null;
  }
};

export const useAuthStore = create<AuthStore>((set, get) => {
  // Set up auth state listener
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const user = await convertFirebaseUser(firebaseUser);
        set({ user, isAuthenticated: !!user, isLoading: false });
      } catch (error) {
        console.error('Error loading user data:', error);
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  });

  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,

    fetchNonViewerUsers: async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '!=', 'viewer'));
        const querySnapshot = await getDocs(q);
        
        const users: User[] = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data() as User;
          users.push({ ...userData, id: doc.id });
        });
        
        return users;
      } catch (error) {
        console.error('Error fetching non-viewer users:', error);
        toast.error('โหลดข้อมูลผู้ใช้ไม่สำเร็จ');
        return [];
      }
    },

    searchUsers: async (searchTerm: string) => {
      // Return empty array if searchTerm is undefined or empty
      if (!searchTerm?.trim()) {
        return [];
      }

      try {
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('email', '>=', searchTerm),
          where('email', '<=', searchTerm + '\uf8ff')
        );
        
        const querySnapshot = await getDocs(q);
        const users: User[] = [];
        
        querySnapshot.forEach((doc) => {
          const userData = doc.data() as User;
          users.push({ ...userData, id: doc.id });
        });
        
        return users;
      } catch (error) {
        console.error('Error searching users:', error);
        toast.error('ค้นหาผู้ใช้ไม่สำเร็จ');
        return [];
      }
    },

    updateUserRole: async (userId: string, role: Role) => {
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { role, updatedAt: new Date().toISOString() }, { merge: true });
        toast.success('อัพเดทบทบาทผู้ใช้สำเร็จ');
      } catch (error) {
        console.error('Error updating user role:', error);
        toast.error('อัพเดทบทบาทผู้ใช้ไม่สำเร็จ');
        throw error;
      }
    },

    login: async (email: string, password: string) => {
      try {
        const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
        const user = await convertFirebaseUser(firebaseUser);
        
        if (!user) {
          throw new Error('User data not found');
        }
        
        set({ user, isAuthenticated: true });
      } catch (error) {
        console.error('Login error:', error);
        
        if (error instanceof Error) {
          const authError = error as AuthError;
          switch (authError.code) {
            case 'auth/invalid-credential':
              toast.error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
              break;
            case 'auth/user-not-found':
              toast.error('ไม่พบบัญชีผู้ใช้นี้');
              break;
            case 'auth/wrong-password':
              toast.error('รหัสผ่านไม่ถูกต้อง');
              break;
            case 'auth/too-many-requests':
              toast.error('คุณพยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณาลองใหม่ในภายหลัง');
              break;
            default:
              toast.error('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
          }
        }
        
        throw error;
      }
    },

    register: async (email: string, password: string, userData: Partial<User>) => {
      try {
        const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
        
        if (!firebaseUser.email) {
          throw new Error('Invalid email from Firebase Auth');
        }

        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          fullName: userData.fullName || '',
          fullNameEng: userData.fullNameEng || '',
          nickname: userData.nickname || '',
          role: 'viewer',
          phoneNumber: '',
          bio: '',
          profileImage: '',
          birthday: '',
          gender: null,
          userType: null,
          schoolLevel: null,
          schoolYear: null,
          instituteName: '',
          province: '',
          collegeLevel: null,
          collegeYear: null,
          faculty: '',
          department: '',
          teacherInstitute: '',
          teacherFaculty: '',
          teacherDepartment: '',
          teacherProvince: '',
          organization: userData.organization || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        set({ user: newUser, isAuthenticated: true });
      } catch (error) {
        console.error('Registration error:', error);
        
        if (error instanceof Error) {
          const authError = error as AuthError;
          if (authError.code === 'auth/email-already-in-use') {
            toast.error('อีเมลนี้ถูกใช้สมัครไปแล้ว กรุณาใช้อีเมลอื่น');
          } else {
            toast.error('สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
          }
        }
        
        throw error;
      }
    },

    logout: async () => {
      try {
        await signOut(auth);
        set({ user: null, isAuthenticated: false });
      } catch (error) {
        console.error('Logout error:', error);
        toast.error('ออกจากระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        throw error;
      }
    },

    updateProfile: async (data: Partial<User>) => {
      try {
        const { user } = get();
        if (!user) {
          toast.error('กรุณาเข้าสู่ระบบก่อนอัพเดทข้อมูล');
          throw new Error('No user logged in');
        }

        // Get current user data
        const userRef = doc(db, 'users', user.id);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          throw new Error('User document not found');
        }

        // Create update data
        const updateData = {
          ...data,
          updatedAt: new Date().toISOString(),
        };

        // Update Firestore
        await setDoc(userRef, updateData, { merge: true });

        // Update local state with merged data
        const updatedUser = {
          ...user,
          ...updateData,
        };
        
        set({ user: updatedUser });
        toast.success('อัพเดทข้อมูลสำเร็จ');
      } catch (error) {
        console.error('Profile update error:', error);
        toast.error('อัพเดทข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        throw error;
      }
    },

    setLoading: (isLoading: boolean) => set({ isLoading }),
  };
});