import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserPlus, X, PencilIcon, TrashIcon, Mail, Phone, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { type Project } from '../../../types/project';
import { cn, calculateAge } from '../../../lib/utils';
import { useAuthStore } from '../../../lib/store';
import { type User, type Gender } from '../../../types/auth';
import { ImageUploader } from '../../shared/ImageUploader';
import { FormLabel } from '../../shared/FormLabel';
import { genderOptions } from '../../shared/GenderSelection';
import { filmCrewRoles, type FilmCrewRole, type Equipment } from '../../../types/member';
import { createMember, getMembers, updateMember, deleteMember, createOwnerMember, updateMemberStay } from '../../../lib/services/members';
import type { ApplicationMember } from '../../../types/member';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { applicationsCollection } from '../../../lib/firebase/collections';
import { Checkbox } from '../../shared/Checkbox';
import { EquipmentSection } from './EquipmentSection';

interface GroupInfoStepProps {
  formData: any;
  onChange: (section: string, field: string, value: any) => void;
}

interface Member {
  id?: string;
  userId?: string;
  fullNameTH: string;
  fullNameEN: string;
  nickname: string;
  gender: Gender;
  age: number;
  roles: FilmCrewRole[];
  isOwner?: boolean;
  isAdmin?: boolean;
  phone?: string;
  email?: string;
  isTeacherAttending?: boolean;
  stay?: boolean;
}

const roleColors: Record<string, { bg: string; text: string }> = {
  'admin': { bg: 'bg-violet-100', text: 'text-violet-800' },
  'director': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'producer': { bg: 'bg-green-100', text: 'text-green-800' },
  'screenwriter': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'cinematographer': { bg: 'bg-orange-100', text: 'text-orange-800' },
  'editor': { bg: 'bg-red-100', text: 'text-red-800' },
  'assistant director': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  'sound recorder': { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  'artDirector': { bg: 'bg-teal-100', text: 'text-teal-800' },
  'costumeDesigner': { bg: 'bg-pink-100', text: 'text-pink-800' },
  'actor': { bg: 'bg-purple-100', text: 'text-purple-800' },
  'productionManager': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  'teacher': { bg: 'bg-amber-100', text: 'text-amber-800' },
};

function GroupInfoStep({ formData, onChange }: GroupInfoStepProps) {
  const { user } = useAuthStore();
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberFormData, setMemberFormData] = useState<Member>({
    fullNameTH: '',
    fullNameEN: '',
    nickname: '',
    gender: 'male',
    age: 0,
    roles: [],
    phone: '',
    email: '',
    isTeacherAttending: true,
    stay: true,
  });
  const [equipment, setEquipment] = useState<Equipment>({
    cameraIncluded: false,
    hasCamera: false,
    hasTripod: false,
    hasMonitor: false,
    otherCameraEquipment: '',
    
    soundIncluded: false,
    hasShotgunMic: false,
    hasWirelessMic: false,
    hasBoomMic: false,
    hasSoundRecorder: false,
    otherSoundEquipment: '',
    
    lightingIncluded: false,
    lightingDetails: '',
    
    computerIncluded: false,
    hasMacBook: false,
    hasPC: false,
    hasSSD: false,
    hasHDD: false,
    hasComputerMonitor: false,
    otherComputerEquipment: '',

    requireCamera: false,
    requireCameraBody: false,
    requireTripod: false,
    requireMonitor: false,
    requiredCameraDetails: '',
    
    requireSound: false,
    requireShotgunMic: false,
    requireWirelessMic: false,
    requireBoomMic: false,
    requireSoundRecorder: false,
    requiredSoundDetails: '',
    
    requireLighting: false,
    requiredLightingDetails: '',
    
    requireComputer: false,
    requireMacBook: false,
    requirePC: false,
    requireSSD: false,
    requireHDD: false,
    requireComputerMonitor: false,
    requiredComputerDetails: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [newRole, setNewRole] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  
  const timeoutIds = useRef<NodeJS.Timeout[]>([]);
  const isLoadSuccessful = useRef(false);
  
  const applicationId = formData.applicationId || (formData.projectId && user?.id ? `${formData.projectId}_${user.id}` : '');

  const clearAllTimeouts = useCallback(() => {
    timeoutIds.current.forEach(id => clearTimeout(id));
    timeoutIds.current = [];
  }, []);

  const ensureApplicationExists = useCallback(async (appId: string) => {
    if (!appId || !user || !formData.projectId) {
      console.warn('Cannot ensure application exists: Missing required data');
      return false;
    }
    
    try {
      const applicationRef = doc(applicationsCollection, appId);
      const applicationSnap = await getDoc(applicationRef);
      
      if (!applicationSnap.exists()) {
        console.log(`Creating new application document: ${appId}`);
        
        const applicationData = {
          projectId: formData.projectId,
          applicationId: appId,
          userId: user.id,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...formData
        };
        
        await setDoc(applicationRef, applicationData);
        console.log(`Created new application document successfully`);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('Error ensuring application exists:', error);
      return false;
    }
  }, [formData, user]);

  const loadMembers = useCallback(async (appId: string) => {
    if (!appId) {
      console.warn('loadMembers: No applicationId provided');
      return;
    }
    
    if (isLoadSuccessful.current && members.length > 0) {
      console.log('loadMembers: Already loaded successfully, skipping');
      return;
    }
    
    console.log(`loadMembers: Starting for application ${appId}`);
    setIsLoading(true);
    
    try {
      const applicationExists = await ensureApplicationExists(appId);
      if (!applicationExists) {
        console.log(`loadMembers: Application document not ready yet. Will retry later.`);
        setIsLoading(false);
        return;
      }
      
      const existingMembers = await getMembers(appId);
      console.log(`loadMembers: Found ${existingMembers?.length || 0} existing members`, existingMembers);
      
      if (!Array.isArray(existingMembers)) {
        console.error('API did not return an array:', existingMembers);
        toast.error('ข้อมูลที่ได้รับไม่ถูกต้อง');
        setIsLoading(false);
        return;
      }
      
      const hasOwner = existingMembers.some(member => member.isOwner);
      const hasUserAsMember = existingMembers.some(member => member.userId === user?.id);
      const hasUserByName = existingMembers.some(
        member => 
          member.fullNameTH === user?.fullName || 
          member.fullNameEN === (user?.fullNameEng || user?.fullName)
      );
      
      if (!hasOwner && !hasUserAsMember && !hasUserByName && user) {
        console.log(`loadMembers: Creating owner member for user ${user.id}`);
        
        let age = 0;
        if (user.birthday) {
          const birthDate = new Date(user.birthday);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }
        
        const ownerMember = {
          fullNameTH: user.fullName,
          fullNameEN: user.fullNameEng || user.fullName,
          nickname: user.nickname || '',
          gender: user.gender || 'male',
          age: age,
          roles: ['admin'],
          userId: user.id,
          isOwner: true,
          email: user.email,
          phone: user.phoneNumber,
          isTeacherAttending: true,
          stay: true,
        };
        
        try {
          const createdOwner = await createOwnerMember(appId, ownerMember);
          console.log(`loadMembers: Owner member created:`, createdOwner);
          
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const updatedMembers = await getMembers(appId);
          console.log(`loadMembers: Reloaded members after creating owner, now have ${updatedMembers.length} members`);
          
          setMembers(updatedMembers as unknown as Member[]);
          
          if (updatedMembers.length > 0) {
            isLoadSuccessful.current = true;
            clearAllTimeouts();
          }
        } catch (ownerError) {
          console.error('Error creating owner member:', ownerError);
          setMembers(existingMembers as unknown as Member[]);
        }
      } else {
        console.log(`loadMembers: Using existing members list with ${existingMembers.length} members`);
        setMembers(existingMembers as unknown as Member[]);
        
        if (existingMembers.length > 0) {
          isLoadSuccessful.current = true;
          clearAllTimeouts();
        }
      }
    } catch (error) {
      console.error('Error loading members:', error);
      if (loadAttempt > 3) {
        toast.error('ไม่สามารถโหลดข้อมูลสมาชิกได้');
      }
    } finally {
      setIsLoading(false);
    }
  }, [ensureApplicationExists, loadAttempt, user, members.length, clearAllTimeouts]);

  const setupRetryTimeouts = useCallback(() => {
    clearAllTimeouts();
    
    if (isLoadSuccessful.current) {
      console.log('setupRetryTimeouts: Already loaded successfully, skipping retry setup');
      return;
    }
    
    [1000, 2000, 3000, 5000, 8000].forEach((delay, index) => {
      const timeoutId = setTimeout(() => {
        if (!isLoadSuccessful.current && applicationId && members.length === 0) {
          console.log(`Auto-retry attempt ${index + 1} after ${delay}ms`);
          setLoadAttempt(prev => prev + 1);
          loadMembers(applicationId);
        }
      }, delay);
      
      timeoutIds.current.push(timeoutId);
    });
  }, [applicationId, clearAllTimeouts, loadMembers, members.length]);

  useEffect(() => {
    return () => {
      timeoutIds.current.forEach(id => clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    console.log(`GroupInfoStep - Initial render with formData:`, { 
      projectId: formData.projectId,
      applicationId: formData.applicationId || applicationId
    });
    
    isLoadSuccessful.current = false;
    
    if (applicationId) {
      console.log(`GroupInfoStep - Found applicationId: ${applicationId}`);
      loadMembers(applicationId);
      
      setupRetryTimeouts();
    } else {
      console.warn(`GroupInfoStep - No applicationId available`);
    }
    
    return () => {
      clearAllTimeouts();
    };
  }, []);

  useEffect(() => {
    if (applicationId && formData.applicationId !== applicationId) {
      console.log(`GroupInfoStep - applicationId changed to ${applicationId}`);
      
      isLoadSuccessful.current = false;
      loadMembers(applicationId);
      setupRetryTimeouts();
    }
  }, [applicationId, formData.applicationId, loadMembers, setupRetryTimeouts]);

  useEffect(() => {
    if (members.length > 0 && !isLoadSuccessful.current) {
      console.log('Members loaded successfully, setting success flag and clearing timeouts');
      isLoadSuccessful.current = true;
      clearAllTimeouts();
    }
  }, [members, clearAllTimeouts]);

  // Initialize equipment state from formData when component mounts or formData.equipment changes
  useEffect(() => {
    if (formData.equipment && Object.keys(formData.equipment).length > 0) {
      console.log('Initializing equipment state from formData:', formData.equipment);
      setEquipment(prevEquipment => ({
        ...prevEquipment,
        ...formData.equipment
      }));
    }
  }, [formData.equipment]);

  useEffect(() => {
    if (loadAttempt > 0 && !isLoadSuccessful.current && applicationId) {
    }
  }, [loadAttempt, applicationId]);

  const validateMemberData = () => {
    if (!memberFormData.fullNameTH || !memberFormData.fullNameEN || !memberFormData.nickname) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return false;
    }
    
    if (memberFormData.roles.length === 0) {
      toast.error('กรุณาเลือกบทบาทในกองถ่ายอย่างน้อย 1 บทบาท');
      return false;
    }

    if (memberFormData.roles.includes('admin')) {
      if (!memberFormData.email || !memberFormData.phone) {
        toast.error('ผู้ดูแลโครงการต้องระบุอีเมลและเบอร์โทรศัพท์');
        return false;
      }
    }

    if (memberFormData.roles.includes('teacher')) {
      if (!memberFormData.email || !memberFormData.phone) {
        toast.error('ครูที่ปรึกษาต้องระบุอีเมลและเบอร์โทรศัพท์');
        return false;
      }
    }

    return true;
  };

  const handleStayChange = async (memberId: string, stay: boolean) => {
    try {
      await updateMemberStay(applicationId, memberId, stay);
      
      setMembers(prevMembers =>
        prevMembers.map(member =>
          member.id === memberId ? { ...member, stay } : member
        )
      );

      toast.success(stay ? 'เพิ่มการเข้าพักโรงแรม' : 'ยกเลิกการเข้าพักโรงแรม');
    } catch (error) {
      console.error('Error updating stay status:', error);
      toast.error('ไม่สามารถอัพเดทสถานะการเข้าพัก');
    }
  };

  const handleAddMember = async () => {
    if (!applicationId || !user) {
      toast.error('กรุณาเข้าสู่ระบบก่อนดำเนินการ');
      return;
    }

    if (!validateMemberData()) {
      return;
    }

    setIsLoading(true);

    try {
      const applicationExists = await ensureApplicationExists(applicationId);
      if (!applicationExists) {
        toast.error('ไม่สามารถเพิ่มสมาชิกได้ กรุณาบันทึกแบบร่างก่อน');
        return;
      }

      const isDuplicate = members.some(member => 
        member.fullNameTH === memberFormData.fullNameTH ||
        member.fullNameEN === memberFormData.fullNameEN
      );

      if (isDuplicate) {
        toast.error('สมาชิกนี้มีอยู่ในกลุ่มแล้ว');
        return;
      }

      const memberDataToSave = {
        ...memberFormData,
        stay: true,
        isTeacherAttending: true,
        isOwner: false,
        isAdmin: false,
      };

      if (editingMember?.id) {
        await updateMember(applicationId, editingMember.id, memberDataToSave);
        const refreshedMembers = await getMembers(applicationId);
        setMembers(refreshedMembers as unknown as Member[]);
        toast.success('อัปเดตข้อมูลสมาชิกสำเร็จ');
      } else {
        await createMember(applicationId, memberDataToSave);
        const refreshedMembers = await getMembers(applicationId);
        setMembers(refreshedMembers as unknown as Member[]);
        toast.success('เพิ่มสมาชิกสำเร็จ');
      }
      
      setShowMemberForm(false);
      setEditingMember(null);
      setMemberFormData({
        fullNameTH: '',
        fullNameEN: '',
        nickname: '',
        gender: 'male',
        age: 0,
        roles: [],
        phone: '',
        email: '',
        isTeacherAttending: true,
        stay: true,
      });
    } catch (error) {
      console.error('Error managing member:', error);
      toast.error('เกิดข้อผิดพลาดในการจัดการสมาชิก');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setMemberFormData(member);
    setShowMemberForm(true);
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!applicationId || !user) {
      toast.error('กรุณาเข้าสู่ระบบก่อนดำเนินการ');
      return;
    }
    
    console.log(`handleDeleteMember: Starting for member ID ${memberId}`);
    setIsLoading(true);
    
    const memberToDelete = members.find(m => m.id === memberId);
    
    if (memberToDelete?.isOwner) {
      toast.error('ไม่สามารถลบเจ้าของกลุ่มได้');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log(`handleDeleteMember: Deleting member with ID ${memberId}`);
      await deleteMember(applicationId, memberId);
      
      console.log(`handleDeleteMember: Reloading members after deletion`);
      const refreshedMembers = await getMembers(applicationId);
      setMembers(refreshedMembers as unknown as Member[]);
      
      toast.success('ลบสมาชิกสำเร็จ');
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('ไม่สามารถลบสมาชิกได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleToggle = (role: FilmCrewRole) => {
    setMemberFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const handleAddCustomRole = () => {
    if (!newRole.trim()) {
      toast.error('กรุณาระบุบทบาท');
      return;
    }

    setMemberFormData(prev => ({
      ...prev,
      roles: [...prev.roles, newRole.trim() as FilmCrewRole]
    }));
    setNewRole('');
  };

  const handleTeacherAttendingChange = (memberId: string, isChecked: boolean) => {
    setMembers(prevMembers =>
      prevMembers.map(member =>
        member.id === memberId ? { ...member, isTeacherAttending: isChecked } : member
      )
    );
  };

  const handleRefreshMembers = () => {
    if (applicationId) {
      console.log(`handleRefreshMembers: Manually refreshing members for ${applicationId}`);
      isLoadSuccessful.current = false;
      loadMembers(applicationId);
      toast.info('กำลังรีเฟรชข้อมูลสมาชิก...');
    } else {
      toast.error('ไม่สามารถรีเฟรชข้อมูลได้ เนื่องจากไม่มีรหัสแอปพลิเคชัน');
    }
  };

  const handleEquipmentChange = (field: keyof Equipment, value: boolean) => {
    setEquipment(prev => ({ ...prev, [field]: value }));
    onChange('equipment', field, value);
  };

  const handleEquipmentDetailsChange = (field: string, value: string) => {
    setEquipment(prev => ({ ...prev, [field]: value }));
    onChange('equipment', field, value);
  };

  const handleEquipmentSubChange = (field: keyof Equipment, value: boolean) => {
    setEquipment(prev => ({ ...prev, [field]: value }));
    onChange('equipment', field, value);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">ข้อมูลกลุ่ม</h2>
        
        <div className="grid grid-cols-3 gap-6">
          <div>
            <FormLabel optional>รูปภาพกลุ่ม</FormLabel>
            <ImageUploader
              imageUrl={formData.groupPhotoUrl}
              onImageChange={(url) => onChange('group', 'groupPhotoUrl', url)}
              projectId={formData.projectId}
            />
          </div>

          <div className="col-span-2 space-y-4">
            <div>
              <FormLabel 
                required 
                description="ชื่อกลุ่มจะถูกตั้งตามชื่อสถานศึกษาโดยอัตโนมัติ คุณสามารถแก้ไขเป็นชื่อที่ต้องการได้"
              >
                ชื่อกลุ่ม
              </FormLabel>
              <input
                type="text"
                value={formData.groupName || ''}
                onChange={(e) => onChange('group', 'groupName', e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div>
              <FormLabel required>คำอธิบายกลุ่ม</FormLabel>
              <textarea
                value={formData.groupDescription || ''}
                onChange={(e) => onChange('group', 'groupDescription', e.target.value)}
                rows={4}
                className="form-textarea"
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-gray-900">สมาชิกในกลุ่ม</h2>
            <p className="text-sm text-gray-500">
              {(() => {
                const teacherCount = members.filter(m => m.roles.includes('teacher')).length;
                const nonTeacherCount = members.length - teacherCount;
                return `ทั้งหมด ${nonTeacherCount} คน / ครู ${teacherCount} คน`;
              })()}
            </p>
            <p className="text-sm text-gray-400">
              รายชื่อนี้จะเข้าพักในโรงแรมที่ทางโครงการจัดให้
            </p>
            {!applicationId && <span className="text-amber-600 text-sm">(กรุณาบันทึกแบบร่างก่อนเพิ่มสมาชิก)</span>}
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRefreshMembers}
              className="btn-secondary flex items-center gap-2"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              รีเฟรชข้อมูล
            </button>
            
            <button
              type="button"
              onClick={() => setShowMemberForm(true)}
              className="btn-primary flex items-center gap-2"
              disabled={isLoading || !applicationId}
            >
              <UserPlus className="w-4 h-4" />
              เพิ่มสมาชิก
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-violet mx-auto mb-4"></div>
            <p>กำลังโหลดข้อมูลสมาชิก...</p>
          </div>
        ) : members.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-2 text-left">ชื่อเล่น</th>
                  <th className="px-4 py-2 text-left">บทบาท</th>
                  <th className="px-4 py-2 text-left">เพศ</th>
                  <th className="px-4 py-2 text-left">อายุ</th>
                  <th className="px-4 py-2 text-left">ข้อมูลติดต่อ</th>
                  <th className="px-4 py-2 text-center">เข้าพักโรงแรม</th>
                  <th className="px-4 py-2 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, index) => {
                  const isTeacher = member.roles.includes('teacher');
                  return (
                    <tr key={member.id} className="border-b">
                      <td className="px-4 py-2 text-gray-500">{index + 1}</td>
                      <td className="px-4 py-2">
                        <div>
                          <div className="font-medium">{member.fullNameTH}</div>
                          <div className="text-gray-500 text-xs">{member.fullNameEN}</div>
                          <div className="flex gap-1 mt-1">
                            {(member.roles.includes('admin') || member.isOwner) && (
                              <span className="inline-block px-2 py-0.5 bg-brand-violet text-white text-xs rounded-full">
                                ผู้ติดต่อ
                              </span>
                            )}
                            {member.roles.includes('teacher') && (
                              <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                                ครูที่ปรึกษา
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">{member.nickname}</td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          {(member.roles || []).map((role) => {
                            const roleConfig = filmCrewRoles.find(r => r.id === role);
                            const colors = roleColors[role] || { bg: 'bg-gray-100', text: 'text-gray-700' };
                            return (
                              <span
                                key={role}
                                className={cn(
                                  "px-2 py-1 rounded-full text-xs",
                                  colors.bg,
                                  colors.text
                                )}
                              >
                                {roleConfig?.emoji} {roleConfig?.label || role}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {genderOptions.find(g => g.value === member.gender)?.label}
                      </td>
                      <td className="px-4 py-2">{member.age}</td>
                      <td className="px-4 py-2">
                        {(member.roles.includes('admin') || member.isOwner || isTeacher) && (
                          <div className="text-sm space-y-1">
                            {member.email && (
                              <a
                                href={`mailto:${member.email}`}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                              >
                                <Mail className="w-4 h-4" />
                                <span>{member.email}</span>
                              </a>
                            )}
                            {member.phone && (
                              <a
                                href={`tel:${member.phone}`}
                                className="flex items-center gap-1 text-green-600 hover:text-green-800"
                              >
                                <Phone className="w-4 h-4" />
                                <span>{member.phone}</span>
                              </a>
                            )}
                          </div>
                        )}
                      </td>
                      
                      
                      <td className="px-4 py-2 text-center">
                        <Checkbox
                          checked={member.stay ?? true}
                          onCheckedChange={(checked) => {
                            if (member.id) {
                              handleStayChange(member.id, checked);
                            }
                          }}
                          disabled={isLoading || member.isOwner}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditMember(member)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          
                          {!member.isOwner && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(member.id!)}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            {!applicationId ? (
              <div>
                <p>กรุณาบันทึกแบบร่างก่อนเพิ่มสมาชิก</p>
                <p className="mt-2 text-xs text-amber-600">หากคุณบันทึกแบบร่างแล้ว โปรดกดปุ่ม "รีเฟรชข้อมูล"</p>
              </div>
            ) : (
              <p>ยังไม่มีสมาชิกในกลุ่ม กรุณาเพิ่มสมาชิก</p>
            )}
          </div>
        )}

        {showMemberForm && (
          <div className="mt-6 border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingMember ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มสมาชิกใหม่'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowMemberForm(false);
                  setEditingMember(null);
                  setMemberFormData({
                    fullNameTH: '',
                    fullNameEN: '',
                    nickname: '',
                    gender: 'male',
                    age: 0,
                    roles: [],
                    phone: '',
                    email: '',
                    isTeacherAttending: true,
                    stay: true,
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormLabel required>ชื่อ-นามสกุล (ภาษาไทย)</FormLabel>
                <input
                  type="text"
                  value={memberFormData.fullNameTH}
                  onChange={(e) => setMemberFormData(prev => ({ ...prev, fullNameTH: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <FormLabel required>ชื่อ-นามสกุล (ภาษาอังกฤษ)</FormLabel>
                <input
                  type="text"
                  value={memberFormData.fullNameEN}
                  onChange={(e) => setMemberFormData(prev => ({ ...prev, fullNameEN: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <FormLabel required>ชื่อเล่น</FormLabel>
                <input
                  type="text"
                  value={memberFormData.nickname}
                  onChange={(e) => setMemberFormData(prev => ({ ...prev, nickname: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <FormLabel required>เพศ</FormLabel>
                <select
                  value={memberFormData.gender}
                  onChange={(e) => setMemberFormData(prev => ({ ...prev, gender: e.target.value as Gender }))}
                  className="form-select"
                  required
                >
                  {genderOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FormLabel required>อายุ</FormLabel>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={memberFormData.age}
                  onChange={(e) => setMemberFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <FormLabel required>บทบาทในกองถ่าย</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {filmCrewRoles.map((role) => {
                  const isSelected = memberFormData.roles.includes(role.id);
                  return (
                    <label
                      key={role.id}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-lg cursor-pointer transition-colors",
                        isSelected
                          ? `${roleColors[role.id]?.bg || 'bg-gray-100'} ${roleColors[role.id]?.text || 'text-gray-800'}`
                          : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleRoleToggle(role.id)}
                        className="sr-only"
                      />
                      <span className="text-2xl mb-2">{role.emoji}</span>
                      <span className="text-sm text-center">{role.label}</span>
                    </label>
                  );
                })}
              </div>

              {memberFormData.roles.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {memberFormData.roles.map(roleId => {
                    const role = filmCrewRoles.find(r => r.id === roleId);
                    const colors = roleColors[roleId] || { bg: 'bg-gray-100', text: 'text-gray-700' };
                    return (
                      <span
                        key={roleId}
                        className={cn(
                          "px-3 py-1 rounded-full text-sm flex items-center gap-2",
                          colors.bg,
                          colors.text
                        )}
                      >
                        {role?.emoji} {role?.label || roleId}
                        <button
                          type="button"
                          onClick={() => handleRoleToggle(roleId)}
                          className="hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4">
              <FormLabel optional>บทบาทอื่นๆ</FormLabel>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ระบุบทบาทอื่นๆ"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="form-input flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddCustomRole}
                  className="px-4 py-2 text-brand-violet border border-brand-violet rounded-lg hover:bg-brand-violet hover:text-white transition-colors"
                >
                  เพิ่ม
                </button>
              </div>
            </div>

            {(memberFormData.roles.includes('admin') || memberFormData.roles.includes('teacher')) && (
              <div className="mt-4">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                  <p className="text-sm text-blue-700">
                    {memberFormData.roles.includes('admin') ? 'ผู้ดูแลโครงการ' : 'ครูที่ปรึกษา'}จำเป็นต้องระบุข้อมูลติดต่อเพื่อการประสานงาน
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormLabel required>อีเมล</FormLabel>
                    <input
                      type="email"
                      value={memberFormData.email || ''}
                      onChange={(e) => setMemberFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <FormLabel required>เบอร์โทรศัพท์</FormLabel>
                    <input
                      type="tel"
                      value={memberFormData.phone || ''}
                      onChange={(e) => setMemberFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleAddMember}
                className="btn-primary"
              >
                {editingMember ? 'บันทึกการแก้ไข' : 'เพิ่มสมาชิก'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Equipment Section */}
      <EquipmentSection
        equipment={equipment}
        onEquipmentChange={handleEquipmentChange}
        onEquipmentSubChange={handleEquipmentSubChange}
        onEquipmentDetailsChange={handleEquipmentDetailsChange}
      />
    </div>
  );
}

export default GroupInfoStep;
export { GroupInfoStep };
