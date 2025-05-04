export type Role = 'admin' | 'editor' | 'commentor' | 'viewer';

export type Gender = 'male' | 'female' | 'lgbtqm' | 'lgbtqf';

export type UserType = 'school-student' | 'college-student' | 'teacher' | 'government' | 'staff';

export type SchoolLevel = 'มัธยมศึกษา' | 'ปวช';
export type CollegeLevel = 'ปริญญาตรี' | 'ปวส';

export interface User {
  id: string;
  email: string;
  fullName: string;
  fullNameEng: string;
  nickname?: string;
  role: Role;
  phoneNumber?: string;
  bio?: string;
  profileImage?: string;
  birthday?: string;
  gender?: Gender;
  userType?: UserType;
  // School Student fields
  schoolLevel?: SchoolLevel;
  schoolYear?: number;
  instituteName?: string;
  province?: string;
  // College Student fields
  collegeLevel?: CollegeLevel;
  collegeYear?: number;
  faculty?: string;
  department?: string;
  // Teacher fields
  teacherInstitute?: string;
  teacherFaculty?: string;
  teacherDepartment?: string;
  teacherProvince?: string;
  // Government/Staff fields
  organization?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const THAI_PROVINCES = [
  'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี', 
  'ฉะเชิงเทรา', 'ชลบุรี', 'ชัยนาท', 'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง', 
  'ตราด', 'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม', 'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 
  'นนทบุรี', 'นราธิวาส', 'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์', 
  'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พะเยา', 'พังงา', 'พัทลุง', 'พิจิตร', 'พิษณุโลก', 
  'เพชรบุรี', 'เพชรบูรณ์', 'แพร่', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร', 
  'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง', 'ราชบุรี', 'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย', 
  'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ', 'สมุทรสงคราม', 'สมุทรสาคร', 
  'สระแก้ว', 'สระบุรี', 'สิงห์บุรี', 'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 
  'หนองคาย', 'หนองบัวลำภู', 'อ่างทอง', 'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 
  'อุบลราชธานี'
] as const;

export type ThaiProvince = typeof THAI_PROVINCES[number];