import React, { useEffect, useState } from 'react';
import { GenderSelection } from '../../shared/GenderSelection';
import { type Gender, type SchoolLevel, type CollegeLevel, THAI_PROVINCES } from '../../../types/auth';
import { useAuthStore } from '../../../lib/store';
import { calculateAge } from '../../../lib/utils';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { createMember, getMembers } from '../../../lib/services/members';

interface ContactInfoStepProps {
  formData: any;
  onChange: (section: string, field: string, value: any) => void;
  onNext?: () => void;
  onSaveDraft?: () => void;
}

// Helper component for form labels
function FormLabel({ children, required = false, optional = false }: { children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
      {optional && <span className="text-gray-400 text-xs ml-2">(ไม่บังคับ)</span>}
    </label>
  );
}

export function ContactInfoStep({ formData, onChange, onNext, onSaveDraft }: ContactInfoStepProps) {
  const { user } = useAuthStore();
  const [advisorSaved, setAdvisorSaved] = useState(false);

  useEffect(() => {
    if (user) {
      // Prefill user data
      onChange('contact', 'fullName', user.fullName || formData.fullName);
      onChange('contact', 'nickname', user.nickname || formData.nickname);
      onChange('contact', 'email', user.email || formData.email);
      onChange('contact', 'phone', user.phoneNumber || formData.phone);
      onChange('contact', 'gender', user.gender || formData.gender);
      onChange('contact', 'province', user.province || formData.province);

      // Calculate age from birthday
      if (user.birthday) {
        const age = calculateAge(user.birthday);
        if (age !== null) {
          onChange('contact', 'age', age);
        }
      }

      // Handle school student specific fields
      if (user.userType === 'school-student') {
        onChange('contact', 'school', user.instituteName || formData.school);
        onChange('contact', 'schoolLevel', user.schoolLevel || formData.schoolLevel);
        onChange('contact', 'schoolYear', user.schoolYear || formData.schoolYear);
      }

      // Handle college student specific fields
      if (user.userType === 'college-student') {
        onChange('contact', 'school', user.instituteName || formData.school);
        onChange('contact', 'collegeLevel', user.collegeLevel || formData.collegeLevel);
        onChange('contact', 'collegeYear', user.collegeYear || formData.collegeYear);
      }
    }
  }, [user]);

  // Watch for school name changes and update group name
  useEffect(() => {
    const prefillGroupName = async () => {
      // Only proceed if user is authenticated and we have a school name but no group name
      if (!user || !formData.school || formData.groupName) return;

      try {
        const applicationsRef = collection(db, 'applications');
        const q = query(applicationsRef, where('school', '==', formData.school));
        const querySnapshot = await getDocs(q);
        const existingGroups = querySnapshot.size;
        
        const groupName = existingGroups > 0 
          ? `${formData.school} ${existingGroups + 1}`
          : formData.school;
        
        onChange('group', 'groupName', groupName);
      } catch (error) {
        console.error('Error prefilling group name:', error);
        // Fallback to school name if query fails
        onChange('group', 'groupName', formData.school);
      }
    };

    prefillGroupName();
  }, [formData.school, user]);

  // สร้างฟังก์ชันแยกสำหรับการบันทึกข้อมูลอาจารย์
  const saveAdvisorInfo = async () => {
    if (!formData.applicationId || !formData.advisorName || !formData.advisorPhone) {
      return false;
    }
    
    try {
      const members = await getMembers(formData.applicationId);
      const existingTeacher = members.find(member => member.roles.includes('teacher'));

      const advisorData = {
        fullNameTH: formData.advisorName,
        fullNameEN: formData.advisorName,
        nickname: '',
        gender: 'male' as Gender,
        age: 0,
        roles: ['teacher'],
        phone: formData.advisorPhone,
        email: formData.advisorEmail || '',
        stay: true,
        isTeacherAttending: true,
        updatedAt: new Date().toISOString(),
      };

      if (existingTeacher) {
        await setDoc(doc(db, `applications/${formData.applicationId}/members`, existingTeacher.id), 
          advisorData, 
          { merge: true }
        );
      } else {
        await createMember(formData.applicationId, advisorData);
      }
      
      setAdvisorSaved(true);
      return true;
    } catch (error) {
      console.error('Error saving advisor information:', error);
      return false;
    }
  };

  // Handle Next and Save Draft with advisor data
  const handleNext = React.useCallback(async () => {
    if (formData.applicationId && formData.advisorName && formData.advisorPhone && !advisorSaved) {
      await saveAdvisorInfo();
    }
    if (onNext) onNext();
  }, [formData.applicationId, formData.advisorName, formData.advisorPhone, advisorSaved, onNext]);
  
  const handleSaveDraft = React.useCallback(async () => {
    if (formData.applicationId && formData.advisorName && formData.advisorPhone && !advisorSaved) {
      await saveAdvisorInfo();
    }
    if (onSaveDraft) onSaveDraft();
  }, [formData.applicationId, formData.advisorName, formData.advisorPhone, advisorSaved, onSaveDraft]);

  useEffect(() => {
    if (onNext) {
      const origOnNext = onNext;
      // @ts-ignore
      onNext = async () => {
        await handleNext();
        origOnNext();
      };
    }
    
    if (onSaveDraft) {
      const origOnSaveDraft = onSaveDraft;
      // @ts-ignore
      onSaveDraft = async () => {
        await handleSaveDraft();
        origOnSaveDraft();
      };
    }
  }, [handleNext, handleSaveDraft, onNext, onSaveDraft]);

  const handleGenderChange = (value: Gender) => {
    onChange('contact', 'gender', value);
  };

  return (
    <div className="space-y-8">
      {/* Personal Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">ข้อมูลส่วนตัว</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FormLabel required>ชื่อ-นามสกุล</FormLabel>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => onChange('contact', 'fullName', e.target.value)}
              className="h-12 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm focus:border-brand-violet focus:ring-brand-violet"
              required
            />
          </div>

          <div>
            <FormLabel required>ชื่อเล่น</FormLabel>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => onChange('contact', 'nickname', e.target.value)}
              className="h-12 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm focus:border-brand-violet focus:ring-brand-violet"
              required
            />
          </div>

          <div>
            <FormLabel required>อีเมล</FormLabel>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onChange('contact', 'email', e.target.value)}
              className="h-12 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm focus:border-brand-violet focus:ring-brand-violet"
              required
            />
          </div>

          <div>
            <FormLabel required>เบอร์โทรศัพท์</FormLabel>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => onChange('contact', 'phone', e.target.value)}
              className="h-12 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm focus:border-brand-violet focus:ring-brand-violet"
              required
            />
          </div>

          <div className="md:col-span-2">
            <FormLabel required>เพศ</FormLabel>
            <GenderSelection
              value={formData.gender}
              onChange={handleGenderChange}
            />
          </div>

          <div>
            <FormLabel>อายุ</FormLabel>
            <input
              type="text"
              value={formData.age || '-'}
              disabled
              className="h-12 block w-full rounded-lg border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Educational Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">ข้อมูลสถานศึกษา</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <FormLabel required>ชื่อสถานศึกษา</FormLabel>
            <input
              type="text"
              value={formData.school}
              onChange={(e) => onChange('contact', 'school', e.target.value)}
              className="h-12 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm focus:border-brand-violet focus:ring-brand-violet"
              required
            />
          </div>

          {user?.userType === 'school-student' && (
            <>
              <div>
                <FormLabel required>ระดับการศึกษา</FormLabel>
                <select
                  value={formData.schoolLevel}
                  onChange={(e) => onChange('contact', 'schoolLevel', e.target.value as SchoolLevel)}
                  className="h-12 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm focus:border-brand-violet focus:ring-brand-violet"
                  required
                >
                  <option value="">เลือกระดับการศึกษา</option>
                  <option value="มัธยมศึกษา">มัธยมศึกษา</option>
                  <option value="ปวช">ปวช</option>
                </select>
              </div>

              <div>
                <FormLabel required>ชั้นปี</FormLabel>
                <select
                  value={formData.schoolYear}
                  onChange={(e) => onChange('contact', 'schoolYear', parseInt(e.target.value))}
                  className="h-12 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm focus:border-brand-violet focus:ring-brand-violet"
                  required
                >
                  <option value="">เลือกชั้นปี</option>
                  {[1, 2, 3, 4, 5, 6].map((year) => (
                    <option key={year} value={year}>ปีที่ {year}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {user?.userType === 'college-student' && (
            <>
              <div>
                <FormLabel required>ระดับการศึกษา</FormLabel>
                <select
                  value={formData.collegeLevel}
                  onChange={(e) => onChange('contact', 'collegeLevel', e.target.value as CollegeLevel)}
                  className="h-12 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm focus:border-brand-violet focus:ring-brand-violet"
                  required
                >
                  <option value="">เลือกระดับการศึกษา</option>
                  <option value="ปริญญาตรี">ปริญญาตรี</option>
                  <option value="ปวส">ปวส</option>
                </select>
              </div>

              <div>
                <FormLabel required>ชั้นปี</FormLabel>
                <select
                  value={formData.collegeYear}
                  onChange={(e) => onChange('contact', 'collegeYear', parseInt(e.target.value))}
                  className="h-12 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm focus:border-brand-violet focus:ring-brand-violet"
                  required
                >
                  <option value="">เลือกชั้นปี</option>
                  {[1, 2, 3, 4, 5].map((year) => (
                    <option key={year} value={year}>ปีที่ {year}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <FormLabel required>จังหวัด</FormLabel>
            <select
              value={formData.province}
              onChange={(e) => onChange('contact', 'province', e.target.value)}
              className="h-12 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm focus:border-brand-violet focus:ring-brand-violet"
              required
            >
              <option value="">เลือกจังหวัด</option>
              {THAI_PROVINCES.map((province) => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Advisor Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">ข้อมูลอาจารย์ที่ปรึกษา</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <FormLabel required>ชื่อ-นามสกุล อาจารย์ที่ปรึกษา</FormLabel>
            <input
              type="text"
              value={formData.advisorName}
              onChange={(e) => onChange('contact', 'advisorName', e.target.value)}
              className="h-12 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm focus:border-brand-violet focus:ring-brand-violet"
              required
            />
          </div>

          <div>
            <FormLabel required>เบอร์โทรศัพท์</FormLabel>
            <input
              type="tel"
              value={formData.advisorPhone}
              onChange={(e) => onChange('contact', 'advisorPhone', e.target.value)}
              className="h-12 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm focus:border-brand-violet focus:ring-brand-violet"
              required
            />
          </div>

          <div>
            <FormLabel optional>อีเมล</FormLabel>
            <input
              type="email"
              value={formData.advisorEmail}
              onChange={(e) => onChange('contact', 'advisorEmail', e.target.value)}
              className="h-12 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm focus:border-brand-violet focus:ring-brand-violet"
            />
          </div>
        </div>
      </div>

      {/* Form Legend */}
      <div className="text-sm text-gray-500">
        <span className="text-red-500">*</span> หมายถึงข้อมูลที่จำเป็นต้องกรอก
      </div>
    </div>
  );
}