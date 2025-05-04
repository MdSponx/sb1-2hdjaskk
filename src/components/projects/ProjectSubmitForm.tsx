import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { applicationsCollection } from '../../lib/firebase/collections';
import { toast } from 'sonner';
import { ContactInfoStep } from './form-steps/ContactInfoStep';
import { GroupInfoStep } from './form-steps/GroupInfoStep';
import { ProjectDetailsStep } from './form-steps/ProjectDetailsStep';
import { ReviewStep } from './form-steps/ReviewStep';
import { createMember, getMembers } from '../../lib/services/members';
import type { ApplicationMember } from '../../types/member';
import { useAuthStore } from '../../lib/store';
import { X } from 'lucide-react';

interface ProjectSubmitFormProps {
  projectId: string;
  projectTitle: string;
  onClose: () => void;
  applicationId?: string;
}

export function ProjectSubmitForm({ projectId, projectTitle, onClose, applicationId }: ProjectSubmitFormProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    // Contact Info
    fullName: user?.fullName || '',
    nickname: user?.nickname || '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
    gender: user?.gender || '',
    age: '',
    school: user?.instituteName || '',
    schoolAddress: '',
    schoolMapUrl: '',
    educationLevel: user?.schoolLevel || user?.collegeLevel || '',
    advisorName: '',
    advisorPhone: '',
    advisorEmail: '',
    
    // Group Info
    groupName: '',
    groupDescription: '',
    groupPhotoUrl: '',
    
    // Project Details
    projectTheme: '',
    shortFilmTitle: '',
    logline: '',
    projectMotivation: '',
    portfolioText: '',
    projectFiles: [],

    // Equipment
    equipment: {},
    
    // Metadata
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submittedAt: null,
    userId: user?.id || '',
    reviewStatus: 'pending',
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
    
    applicationId: applicationId || (user?.id ? `${projectId}_${user.id}` : ''),
    projectId: projectId,
    projectTitle: projectTitle,
  });

  // Scroll to form when it opens
  useEffect(() => {
    if (formRef.current) {
      const yOffset = -20; // Add some padding from top
      const y = formRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const loadApplication = async () => {
      if (!user || !formData.applicationId) return;
      
      try {
        const applicationRef = doc(applicationsCollection, formData.applicationId);
        const applicationDoc = await getDoc(applicationRef);
        
        if (applicationDoc.exists()) {
          const applicationData = applicationDoc.data();
          setFormData(prev => ({
            ...prev,
            ...applicationData,
          }));
        }
      } catch (error) {
        console.error('Error loading application:', error);
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    };

    loadApplication();
  }, [user, formData.applicationId]);

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => {
      if (section === 'equipment') {
        return {
          ...prev,
          equipment: {
            ...prev.equipment,
            [field]: value
          },
          updatedAt: new Date().toISOString()
        };
      }
      return {
        ...prev,
        [field]: value,
        updatedAt: new Date().toISOString()
      };
    });
  };

  const saveDraft = async () => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อนบันทึกแบบร่าง');
      return false;
    }

    try {
      setIsDraftSaving(true);
      const applicationId = formData.applicationId;
      const applicationRef = doc(applicationsCollection, applicationId);
      
      const applicationData = {
        ...formData,
        projectId,
        applicationId,
        projectTitle,
        fullNameEN: user.fullNameEng || user.fullName,
        status: 'draft',
        updatedAt: new Date().toISOString()
      };

      await setDoc(applicationRef, applicationData);

      // Create owner member if not exists
      const members = await getMembers(applicationId);
      const hasOwner = members.some(member => member.isOwner);
      const hasUserAsMember = members.some(member => member.userId === user.id);
      
      if (!hasOwner && !hasUserAsMember) {
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
          stay: true,
        };

        await createMember(applicationId, ownerMember);
      }
      
      toast.success('บันทึกแบบร่างสำเร็จ');
      return true;
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกแบบร่าง');
      return false;
    } finally {
      setIsDraftSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.applicationId) {
      toast.error('ไม่พบข้อมูลใบสมัคร');
      return;
    }

    try {
      setIsSubmitting(true);
      const applicationRef = doc(applicationsCollection, formData.applicationId);
      
      await setDoc(applicationRef, {
        ...formData,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      toast.success('ส่งใบสมัครสำเร็จ');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('เกิดข้อผิดพลาดในการส่งใบสมัคร');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1: // Contact Info
        return !!(formData.fullName && formData.nickname && formData.email && 
                 formData.phone && formData.school && formData.educationLevel &&
                 formData.advisorName && formData.advisorPhone);
      case 2: // Group Info
        return !!(formData.groupName && formData.groupDescription);
      case 3: // Project Details
        return !!(formData.projectTheme && formData.logline && formData.projectMotivation);
      default:
        return true;
    }
  };

  const nextStep = async () => {
    if (!validateStep()) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    const saved = await saveDraft();
    if (saved) {
      setCurrentStep(prev => prev + 1);
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleClose = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onClose();
  };

  return (
    <div ref={formRef} className="min-h-screen bg-gray-50 pb-8 mt-8">
      {/* Project Header */}
      <div className="relative h-48 bg-brand-navy mb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-navy/80" />
        <div className="container mx-auto px-4 max-w-6xl h-full relative">
          <div className="h-full flex flex-col justify-between py-6">
            <div className="flex justify-between items-center">
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {projectTitle}
              </h1>
              <p className="text-white/80">
                กรอกข้อมูลเพื่อสมัครเข้าร่วมโครงการ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="container mx-auto px-4 max-w-6xl mb-8">
        <div className="flex justify-between">
          {[
            { number: 1, title: 'ข้อมูลผู้สมัคร', color: 'bg-blue-500' },
            { number: 2, title: 'ข้อมูลกลุ่ม', color: 'bg-violet-500' },
            { number: 3, title: 'รายละเอียดโครงการ', color: 'bg-emerald-500' },
            { number: 4, title: 'ตรวจสอบข้อมูล', color: 'bg-amber-500' },
          ].map((step, index) => (
            <div
              key={step.number}
              className={`flex items-center ${
                index < currentStep ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors ${
                  index < currentStep ? step.color : 'bg-gray-200'
                } ${
                  index === currentStep - 1 && "ring-4 ring-offset-2 ring-offset-gray-50"
                } ${
                  index === currentStep - 1 && step.color.replace('bg-', 'ring-').replace('500', '200')
                }`}
              >
                {step.number}
              </div>
              <span className="ml-3 hidden sm:block font-medium">{step.title}</span>
              {index < 3 && (
                <div
                  className={`flex-1 h-1 mx-4 ${
                    index < currentStep - 1 ? step.color : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          {currentStep === 1 && (
            <ContactInfoStep
              formData={formData}
              onChange={handleInputChange}
              onNext={nextStep}
              onSaveDraft={saveDraft}
            />
          )}
          
          {currentStep === 2 && (
            <GroupInfoStep
              formData={formData}
              onChange={handleInputChange}
            />
          )}
          
          {currentStep === 3 && (
            <ProjectDetailsStep
              formData={formData}
              onChange={handleInputChange}
            />
          )}
          
          {currentStep === 4 && (
            <ReviewStep
              formData={formData}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-end items-center gap-3">
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="px-6 py-2 text-gray-700 bg-white rounded-lg border hover:bg-gray-50"
            >
              ย้อนกลับ
            </button>
          )}
          
          <button
            onClick={saveDraft}
            disabled={isDraftSaving}
            className="px-6 py-2 text-gray-700 bg-white rounded-lg border hover:bg-gray-50"
          >
            {isDraftSaving ? 'กำลังบันทึก...' : 'บันทึกแบบร่าง'}
          </button>

          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              disabled={!validateStep()}
              className="px-6 py-2 text-white bg-brand-violet rounded-lg hover:bg-brand-violet-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ถัดไป
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 text-white bg-brand-violet rounded-lg hover:bg-brand-violet-light disabled:opacity-50"
            >
              {isSubmitting ? 'กำลังส่งใบสมัคร...' : 'ส่งใบสมัคร'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
