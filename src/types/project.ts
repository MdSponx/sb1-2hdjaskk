import { z } from 'zod';

export type ProjectStatus = 'coming-soon' | 'open' | 'reviewing' | 'closed';

export const projectSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'กรุณากรอกชื่อโครงการ'),
  shortDescription: z.string().max(200, 'คำอธิบายสั้นต้องไม่เกิน 200 ตัวอักษร').optional(),
  status: z.enum(['coming-soon', 'open', 'reviewing', 'closed']),
  isPublic: z.boolean().default(true),
  description: z.string().min(1, 'กรุณากรอกรายละเอียดโครงการ'),
  imageUrl: z.string().url('รูปภาพต้องเป็น URL ที่ถูกต้อง').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  applicationDeadline: z.string().optional(),
  venueName: z.string().optional(),
  venueCoordinates: z.string().url('พิกัดต้องเป็น URL ของ Google Maps ที่ถูกต้อง').optional(),
  province: z.string().optional(),
  organizerName: z.string().optional(),
  targetArea: z.string().optional(),
  maxAttendees: z.number().min(1, 'กรุณาระบุจำนวนผู้เข้าร่วมสูงสุด').optional(),
  tags: z.array(z.string()),
  contactPersons: z.array(z.object({
    id: z.string(),
    fullName: z.string(),
    profileImage: z.string().optional(),
  })),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Project = z.infer<typeof projectSchema>;

export const projectTags = [
  'Workshop',
  'Training',
  'Funding',
  'Mentorship',
  'International',
  'Competition',
  'Collaboration',
  'CineBridge',
  'NextFrame',
  'THACCA',
  'OFOS',
  'กระทรวงวัฒนธรรม',
  'กรมส่งเสริมวัฒนธรรม',
] as const;

export const projectStatusConfig = {
  'coming-soon': {
    label: 'เร็วๆ นี้',
    color: 'bg-blue-100 text-blue-800',
  },
  'open': {
    label: 'เปิดรับสมัคร',
    color: 'bg-green-100 text-green-800',
  },
  'reviewing': {
    label: 'อยู่ระหว่างการพิจารณา',
    color: 'bg-yellow-100 text-yellow-800',
  },
  'closed': {
    label: 'ปิดรับสมัคร',
    color: 'bg-red-100 text-red-800',
  },
} as const;

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