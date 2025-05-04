import { Gender } from './auth';

export interface ApplicationMember {
  id: string;
  userId?: string;
  fullNameTH: string;
  fullNameEN: string;
  nickname: string;
  gender: Gender;
  age: number;
  roles: string[];
  isOwner: boolean;
  isAdmin?: boolean;
  phone?: string;
  email?: string;
  stay: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  // Prepared Equipment
  cameraIncluded: boolean;
  hasCamera?: boolean;
  hasTripod?: boolean;
  hasMonitor?: boolean;
  otherCameraEquipment?: string;
  
  soundIncluded: boolean;
  hasShotgunMic?: boolean;
  hasWirelessMic?: boolean;
  hasBoomMic?: boolean;
  hasSoundRecorder?: boolean;
  otherSoundEquipment?: string;
  
  lightingIncluded: boolean;
  lightingDetails?: string;
  
  computerIncluded: boolean;
  hasMacBook?: boolean;
  hasPC?: boolean;
  hasSSD?: boolean;
  hasHDD?: boolean;
  hasComputerMonitor?: boolean;
  otherComputerEquipment?: string;

  // Required Equipment
  requireCamera: boolean;
  requireCameraBody?: boolean;
  requireTripod?: boolean;
  requireMonitor?: boolean;
  requiredCameraDetails?: string;
  
  requireSound: boolean;
  requireShotgunMic?: boolean;
  requireWirelessMic?: boolean;
  requireBoomMic?: boolean;
  requireSoundRecorder?: boolean;
  requiredSoundDetails?: string;
  
  requireLighting: boolean;
  requiredLightingDetails?: string;
  
  requireComputer: boolean;
  requireMacBook?: boolean;
  requirePC?: boolean;
  requireSSD?: boolean;
  requireHDD?: boolean;
  requireComputerMonitor?: boolean;
  requiredComputerDetails?: string;
}

export const filmCrewRoles = [
  { id: 'admin', label: 'ผู้ดูแลโครงการ', emoji: '👑' },
  { id: 'director', label: 'ผู้กำกับ', emoji: '🎬' },
  { id: 'producer', label: 'โปรดิวเซอร์', emoji: '💼' },
  { id: 'screenwriter', label: 'นักเขียนบท', emoji: '✍️' },
  { id: 'cinematographer', label: 'ผู้กำกับภาพ', emoji: '📷' },
  { id: 'editor', label: 'ตัดต่อ', emoji: '✂️' },
  { id: 'assistant director', label: 'ผู้ช่วยผู้กำกับ', emoji: '📋' },
  { id: 'sound recorder', label: 'บันทึกเสียง', emoji: '🎙️' },
  { id: 'artDirector', label: 'กำกับศิลป์', emoji: '🎨' },
  { id: 'costumeDesigner', label: 'ออกแบบเครื่องแต่งกาย', emoji: '👕' },
  { id: 'actor', label: 'นักแสดง', emoji: '🎭' },
  { id: 'productionManager', label: 'ผู้จัดการกองถ่าย', emoji: '📊' },
  { id: 'teacher', label: 'ครูที่ปรึกษา', emoji: '👨‍🏫' },
] as const;

export type FilmCrewRole = typeof filmCrewRoles[number]['id'];