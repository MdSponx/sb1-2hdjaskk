import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../lib/store';
import { toast } from 'sonner';
import { Camera, X } from 'lucide-react';
import { getInitials, calculateAge } from '../../lib/utils';
import { uploadProfileImage, deleteProfileImage, getImageUrl } from '../../lib/storage';
import type { Gender, UserType, SchoolLevel, CollegeLevel } from '../../types/auth';
import { THAI_PROVINCES } from '../../types/auth';
import { GenderSelection } from './GenderSelection';
import { FormLabel } from './FormLabel';
import { ConfirmDialog } from './ConfirmDialog';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const userTypeOptions: { value: UserType; label: string; emoji: string }[] = [
  { value: 'school-student', label: 'นักเรียน', emoji: '📚' },
  { value: 'college-student', label: 'นิสิต/นักศึกษา', emoji: '🎓' },
  { value: 'teacher', label: 'ครู/อาจารย์', emoji: '👨‍🏫' },
  { value: 'government', label: 'เจ้าหน้าที่รัฐ', emoji: '👔' },
  { value: 'staff', label: 'ทีมงานค่าย', emoji: '🎬' },
];

const profileSchema = z.object({
  fullName: z.string().min(1, 'กรุณากรอกชื่อ-นามสกุล'),
  fullNameEng: z.string().min(1, 'กรุณากรอกชื่อ-นามสกุลภาษาอังกฤษ'),
  nickname: z.string().min(1, 'กรุณากรอกชื่อเล่น'),
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  phoneNumber: z.string().min(9, 'เบอร์โทรศัพท์ไม่ถูกต้อง').optional(),
  bio: z.string().max(500, 'ประวัติย่อต้องไม่เกิน 500 ตัวอักษร').optional(),
  birthday: z.string().min(1, 'กรุณาเลือกวันเกิด'),
  gender: z.enum(['male', 'female', 'lgbtqm', 'lgbtqf']).optional(),
  userType: z.enum(['school-student', 'college-student', 'teacher', 'government', 'staff']).optional(),
  schoolLevel: z.enum(['มัธยมศึกษา', 'ปวช']).optional(),
  schoolYear: z.number().min(1).max(6).optional(),
  instituteName: z.string().optional(),
  province: z.string().optional(),
  collegeLevel: z.enum(['ปริญญาตรี', 'ปวส']).optional(),
  collegeYear: z.number().min(1).max(5).optional(),
  faculty: z.string().optional(),
  department: z.string().optional(),
  teacherInstitute: z.string().optional(),
  teacherFaculty: z.string().optional(),
  teacherDepartment: z.string().optional(),
  teacherProvince: z.string().optional(),
  organization: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showProjectsDialog, setShowProjectsDialog] = useState(false);
  const pendingProjectId = sessionStorage.getItem('pendingProjectId');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  useEffect(() => {
    const imageUrl = getImageUrl(user?.profileImage);
    setPreviewImage(imageUrl);
  }, [user?.profileImage]);

  const { register, watch, setValue, handleSubmit, formState: { errors, isDirty, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      fullNameEng: user?.fullNameEng || '',
      nickname: user?.nickname || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      bio: user?.bio || '',
      birthday: user?.birthday || '',
      gender: user?.gender || undefined,
      userType: user?.userType || undefined,
      schoolLevel: user?.schoolLevel || undefined,
      schoolYear: user?.schoolYear || undefined,
      instituteName: user?.instituteName || '',
      province: user?.province || undefined,
      collegeLevel: user?.collegeLevel || undefined,
      collegeYear: user?.collegeYear || undefined,
      faculty: user?.faculty || '',
      department: user?.department || '',
      teacherInstitute: user?.teacherInstitute || '',
      teacherFaculty: user?.teacherFaculty || '',
      teacherDepartment: user?.teacherDepartment || '',
      teacherProvince: user?.teacherProvince || undefined,
      organization: user?.organization || '',
    },
  });

  const selectedUserType = watch('userType');
  const birthday = watch('birthday');
  const age = calculateAge(birthday);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('รองรับไฟล์ภาพ JPG, PNG และ WebP เท่านั้น');
      return;
    }

    try {
      setIsUploading(true);
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);

      if (user) {
        const imageUrl = await uploadProfileImage(file, user.id);
        URL.revokeObjectURL(objectUrl);
        
        if (user.profileImage) {
          await deleteProfileImage(user.profileImage);
        }
        await updateProfile({ profileImage: imageUrl });
      }
    } catch (error) {
      toast.error('อัพโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      setPreviewImage(getImageUrl(user?.profileImage));
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = async () => {
    if (!user) return;

    try {
      setIsUploading(true);
      if (user.profileImage) {
        await deleteProfileImage(user.profileImage);
      }
      await updateProfile({ profileImage: '' });
      setPreviewImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error('ลบรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    try {
      // Create base update object
      const updateData: Partial<ProfileForm> = {
        fullName: data.fullName,
        fullNameEng: data.fullNameEng,
        nickname: data.nickname,
        email: data.email,
        phoneNumber: data.phoneNumber,
        bio: data.bio,
        birthday: data.birthday,
        gender: data.gender,
        userType: data.userType,
      };

      // Reset all type-specific fields
      const resetFields = {
        schoolLevel: null,
        schoolYear: null,
        instituteName: null,
        province: null,
        collegeLevel: null,
        collegeYear: null,
        faculty: null,
        department: null,
        teacherInstitute: null,
        teacherFaculty: null,
        teacherDepartment: null,
        teacherProvince: null,
        organization: null,
      };

      // Add type-specific fields based on user type
      if (data.userType === 'school-student') {
        Object.assign(updateData, {
          ...resetFields,
          schoolLevel: data.schoolLevel,
          schoolYear: data.schoolYear,
          instituteName: data.instituteName,
          province: data.province,
        });
      } else if (data.userType === 'college-student') {
        Object.assign(updateData, {
          ...resetFields,
          collegeLevel: data.collegeLevel,
          collegeYear: data.collegeYear,
          faculty: data.faculty,
          department: data.department,
          instituteName: data.instituteName,
          province: data.province,
        });
      } else if (data.userType === 'teacher') {
        Object.assign(updateData, {
          ...resetFields,
          teacherInstitute: data.teacherInstitute,
          teacherFaculty: data.teacherFaculty,
          teacherDepartment: data.teacherDepartment,
          teacherProvince: data.teacherProvince,
        });
      } else if (data.userType === 'government' || data.userType === 'staff') {
        Object.assign(updateData, {
          ...resetFields,
          organization: data.organization,
        });
      }

      await updateProfile(updateData);

      // Show appropriate dialog based on whether there's a pending project
      if (pendingProjectId) {
        setShowProjectDialog(true);
      } else {
        setShowProjectsDialog(true);
      }
    } catch (error) {
      // Error is handled in the store
    }
  };

  return (
    <div className="py-8 px-4 md:px-8">
      <h1 className="text-2xl font-semibold text-brand-navy mb-8">โปรไฟล์ของฉัน</h1>
      
      <div className="bg-white rounded-lg shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {previewImage ? (
                <div className="relative">
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={isUploading}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-brand-violet flex items-center justify-center text-white text-3xl font-medium">
                  {user?.fullName ? getInitials(user.fullName) : 'U'}
                </div>
              )}
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                <Camera className="w-5 h-5 text-brand-navy" />
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
            
            <p className="text-sm text-gray-500">
              {isUploading ? 'กำลังอัพโหลด...' : 'อัพโหลดรูปโปรไฟล์ (ไม่เกิน 5MB)'}
            </p>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FormLabel required>ชื่อ-นามสกุล (ภาษาไทย)</FormLabel>
              <input
                type="text"
                {...register('fullName')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <FormLabel required>ชื่อ-นามสกุล (ภาษาอังกฤษ)</FormLabel>
              <input
                type="text"
                {...register('fullNameEng')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
              />
              {errors.fullNameEng && (
                <p className="mt-1 text-sm text-red-600">{errors.fullNameEng.message}</p>
              )}
            </div>
            
            <div>
              <FormLabel required>ชื่อเล่น</FormLabel>
              <input
                type="text"
                {...register('nickname')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
              />
              {errors.nickname && (
                <p className="mt-1 text-sm text-red-600">{errors.nickname.message}</p>
              )}
            </div>

            <div>
              <FormLabel required>วันเกิด</FormLabel>
              <input
                type="date"
                {...register('birthday')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
              />
              {errors.birthday && (
                <p className="mt-1 text-sm text-red-600">{errors.birthday.message}</p>
              )}
            </div>

            <div>
              <FormLabel>อายุ</FormLabel>
              <div className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                {age !== null ? `${age} ปี` : '-'}
              </div>
            </div>

            <div>
              <FormLabel required>เพศ</FormLabel>
              <GenderSelection
                value={watch('gender')}
                onChange={(value) => setValue('gender', value)}
              />
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
              )}
            </div>
          </div>

          {/* User Type Selection */}
          <div>
            <FormLabel required>ประเภทผู้ใช้งาน</FormLabel>
            <div className="grid grid-cols-5 gap-4">
              {userTypeOptions.map((option) => (
                <label
                  key={option.value}
                  className="relative flex flex-col items-center"
                >
                  <input
                    type="radio"
                    {...register('userType')}
                    value={option.value}
                    className="sr-only"
                  />
                  <div className={`
                    w-full py-3 px-4 text-center rounded-lg cursor-pointer transition-colors
                    ${watch('userType') === option.value
                      ? 'bg-brand-violet text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }
                  `}>
                    <span className="text-2xl mb-2 block">{option.emoji}</span>
                    <span className="text-sm block">{option.label}</span>
                  </div>
                </label>
              ))}
            </div>
            {errors.userType && (
              <p className="mt-1 text-sm text-red-600">{errors.userType.message}</p>
            )}
          </div>

          {/* Conditional Fields Based on User Type */}
          {selectedUserType === 'school-student' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <FormLabel required>ระดับการศึกษา</FormLabel>
                <select
                  {...register('schoolLevel')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
                >
                  <option value="">เลือกระดับการศึกษา</option>
                  <option value="มัธยมศึกษา">มัธยมศึกษา</option>
                  <option value="ปวช">ปวช</option>
                </select>
                {errors.schoolLevel && (
                  <p className="mt-1 text-sm text-red-600">{errors.schoolLevel.message}</p>
                )}
              </div>
              
              <div>
                <FormLabel required>ชั้นปี</FormLabel>
                <select
                  {...register('schoolYear', { valueAsNumber: true })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
                >
                  <option value="">เลือกชั้นปี</option>
                  {[1, 2, 3, 4, 5, 6].map((year) => (
                    <option key={year} value={year}>ปีที่ {year}</option>
                  ))}
                </select>
                {errors.schoolYear && (
                  <p className="mt-1 text-sm text-red-600">{errors.schoolYear.message}</p>
                )}
              </div>

              <div>
                <FormLabel required>สถานศึกษา</FormLabel>
                <input
                  type="text"
                  {...register('instituteName')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
                />
                {errors.instituteName && (
                  <p className="mt-1 text-sm text-red-600">{errors.instituteName.message}</p>
                )}
              </div>

              <div>
                <FormLabel required>จังหวัด</FormLabel>
                <select
                  {...register('province')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
                >
                  <option value="">เลือกจังหวัด</option>
                  {THAI_PROVINCES.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
                {errors.province && (
                  <p className="mt-1 text-sm text-red-600">{errors.province.message}</p>
                )}
              </div>
            </div>
          )}

          {selectedUserType === 'college-student' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <FormLabel required>ระดับการศึกษา</FormLabel>
                <select
                  {...register('collegeLevel')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
                >
                  <option value="">เลือกระดับการศึกษา</option>
                  <option value="ปริญญาตรี">ปริญญาตรี</option>
                  <option value="ปวส">ปวส</option>
                </select>
                {errors.collegeLevel && (
                  <p className="mt-1 text-sm text-red-600">{errors.collegeLevel.message}</p>
                )}
              </div>

              <div>
                <FormLabel required>ชั้นปี</FormLabel>
                <select
                  {...register('collegeYear', { valueAsNumber: true })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
                >
                  <option value="">เลือกชั้นปี</option>
                  {[1, 2, 3, 4, 5].map((year) => (
                    <option key={year} value={year}>ปีที่ {year}</option>
                  ))}
                </select>
                {errors.collegeYear && (
                  <p className="mt-1 text-sm text-red-600">{errors.collegeYear.message}</p>
                )}
              </div>

              <div>
                <FormLabel required>สถาบัน</FormLabel>
                <input
                  type="text"
                  {...register('instituteName')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
                />
                {errors.instituteName && (
                  <p className="mt-1 text-sm text-red-600">{errors.instituteName.message}</p>
                )}
              </div>

              <div>
                <FormLabel required>คณะ</FormLabel>
                <input
                  type="text"
                  {...register('faculty')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
                />
                {errors.faculty && (
                  <p className="mt-1 text-sm text-red-600">{errors.faculty.message}</p>
                )}
              </div>

              <div>
                <FormLabel required>สาขาวิชา</FormLabel>
                <input
                  type="text"
                  {...register('department')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
                />
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
                )}
              </div>

              <div>
                <FormLabel required>จังหวัด</FormLabel>
                <select
                  {...register('province')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
                >
                  <option value="">เลือกจังหวัด</option>
                  {THAI_PROVINCES.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
                {errors.province && (
                  <p className="mt-1 text-sm text-red-600">{errors.province.message}</p>
                )}
              </div>
            </div>
          )}

          {selectedUserType === 'teacher' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <FormLabel required>สถาบัน</FormLabel>
                <input
                  type="text"
                  {...register('teacherInstitute')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
                />
                {errors.teacherInstitute && (
                  <p className="mt-1 text-sm text-red-600">{errors.teacherInstitute.message}</p>
                )}
              </div>

              <div>
                <FormLabel required>คณะ</FormLabel>
                <input
                  type="text"
                  {...register('teacherFaculty')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
                />
                {errors.teacherFaculty && (
                  <p className="mt-1 text-sm text-red-600">{errors.teacherFaculty.message}</p>
                )}
              </div>

              <div>
                <FormLabel required>สาขาวิชา</FormLabel>
                <input
                  type="text"
                  {...register('teacherDepartment')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
                />
                {errors.teacherDepartment && (
                  <p className="mt-1 text-sm text-red-600">{errors.teacherDepartment.message}</p>
                )}
              </div>

              <div>
                <FormLabel required>จังหวัด</FormLabel>
                <select
                  {...register('teacherProvince')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
                >
                  <option value="">เลือกจังหวัด</option>
                  {THAI_PROVINCES.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
                {errors.teacherProvince && (
                  <p className="mt-1 text-sm text-red-600">{errors.teacherProvince.message}</p>
                )}
              </div>
            </div>
          )}

          {(selectedUserType === 'government' || selectedUserType === 'staff') && (
            <div>
              <FormLabel required>หน่วยงาน/องค์กร</FormLabel>
              <input
                type="text"
                {...register('organization')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
              />
              {errors.organization && (
                <p className="mt-1 text-sm text-red-600">{errors.organization.message}</p>
              )}
            </div>
          )}

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FormLabel required>อีเมล</FormLabel>
              <input
                type="email"
                {...register('email')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <FormLabel required>เบอร์โทรศัพท์</FormLabel>
              <input
                type="tel"
                {...register('phoneNumber')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          
          <div>
            <FormLabel optional>ประวัติย่อ</FormLabel>
            <textarea
              {...register('bio')}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
              placeholder="เล่าเกี่ยวกับตัวคุณสั้นๆ..."
            />
            {errors.bio && (
              <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
            )}
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isDirty || isSubmitting || isUploading}
              className="px-4 py-2 border border-transparent rounde
d-md shadow-sm text-sm font-medium text-white bg-brand-violet hover:bg-brand-violet-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-violet disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        isOpen={showProjectDialog}
        onClose={() => {
          setShowProjectDialog(false);
          sessionStorage.removeItem('pendingProjectId');
        }}
        onConfirm={() => {
          setShowProjectDialog(false);
          sessionStorage.removeItem('pendingProjectId');
          navigate(`/projects/${pendingProjectId}`);
        }}
        title="ข้อมูลส่วนตัวครบถ้วนแล้ว"
        message="คุณต้องการกลับไปกรอกใบสมัครโครงการต่อหรือไม่?"
        confirmText="ไปที่หน้าโครงการ"
        cancelText="ข้าม"
        type="warning"
      />

      <ConfirmDialog
        isOpen={showProjectsDialog}
        onClose={() => setShowProjectsDialog(false)}
        onConfirm={() => {
          setShowProjectsDialog(false);
          navigate('/projects');
        }}
        title="ข้อมูลส่วนตัวครบถ้วนแล้ว"
        message="คุณต้องการดูโครงการที่เปิดรับสมัครหรือไม่?"
        confirmText="ดูโครงการทั้งหมด"
        cancelText="ข้าม"
        type="warning"
      />
    </div>
  );
}