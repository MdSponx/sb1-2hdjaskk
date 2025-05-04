import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { toast } from 'sonner';
import type { ApplicationMember } from '../../../types/member';
import { ConfirmDialog } from '../../shared/ConfirmDialog';

interface ReviewStepProps {
  formData: any;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-2xl font-semibold text-gray-900 mb-6">{children}</h3>;
}

function InfoField({ label, value }: { label: string; value: any }) {
  if (!value) return null;
  return (
    <div className="py-3">
      <div className="text-gray-600 mb-2 text-lg">
        {label}
      </div>
      <div className="text-xl text-gray-900 ml-2">{value}</div>
    </div>
  );
}

const projectThemes = {
  'me-and-world': { label: 'ฉันกับโลก', emojis: '🧍🏻🌏' },
  'me-and-city': { label: 'ฉันกับเมือง', emojis: '🧍🏻🏙️' },
  'me-and-home': { label: 'ฉันกับบ้าน', emojis: '🧍🏻🏠' },
  'me-and-you': { label: 'ฉันกับเธอ', emojis: '🧍🏻💑' },
  'me-and-myself': { label: 'ฉันกับฉัน', emojis: '🧍🏻🪞' },
};

export function ReviewStep({ formData }: ReviewStepProps) {
  const getThemeDisplay = (themeId: string) => {
    const theme = projectThemes[themeId as keyof typeof projectThemes];
    return theme ? `${theme.emojis} ${theme.label}` : themeId;
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-gray-900">ตรวจสอบข้อมูล</h2>
      
      {/* Group Information with Institute Info */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <SectionTitle>👥 ข้อมูลกลุ่ม</SectionTitle>
        <div className="grid grid-cols-3 gap-6">
          {/* Group Image */}
          <div>
            {formData.groupPhotoUrl ? (
              <img
                src={formData.groupPhotoUrl}
                alt="Group"
                className="w-full aspect-square object-cover rounded-lg"
              />
            ) : (
              <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-4xl">📷</span>
              </div>
            )}
          </div>

          {/* Group Details and Institute Info */}
          <div className="col-span-2 space-y-6">
            <div>
              <h3 className="text-3xl font-bold text-brand-navy mb-3">{formData.groupName}</h3>
              <p className="text-xl text-gray-600">{formData.groupDescription}</p>
            </div>

            <div className="pt-4 border-t">
              <InfoField label="🏫 สถาบันการศึกษา" value={formData.school} />
              <InfoField label="🎓 ระดับการศึกษา" value={formData.educationLevel} />
              <InfoField label="📍 จังหวัด" value={formData.province} />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <SectionTitle>📞 ข้อมูลผู้ติดต่อ</SectionTitle>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <InfoField label="👤 ชื่อ-นามสกุล" value={formData.fullName} />
            <InfoField label="😊 ชื่อเล่น" value={formData.nickname} />
          </div>
          <div>
            <InfoField label="📧 อีเมล" value={formData.email} />
            <InfoField label="📱 เบอร์โทรศัพท์" value={formData.phone} />
          </div>
        </div>
      </section>

      {/* Advisor Information */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <SectionTitle>👨‍🏫 ข้อมูลอาจารย์ที่ปรึกษา</SectionTitle>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <InfoField label="👤 ชื่อ-นามสกุล" value={formData.advisorName} />
            <InfoField label="📱 เบอร์โทรศัพท์" value={formData.advisorPhone} />
          </div>
          <div>
            <InfoField label="📧 อีเมล" value={formData.advisorEmail} />
          </div>
        </div>
      </section>

      {/* Project Information */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <SectionTitle>📽️ รายละเอียดโครงการ</SectionTitle>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <InfoField label="🎯 หัวข้อโครงการ" value={getThemeDisplay(formData.projectTheme)} />
            </div>
            <div>
              <InfoField label="🎬 ชื่อเรื่องหนังสั้น" value={formData.shortFilmTitle} />
            </div>
          </div>
          
          <div>
            <InfoField label="📝 Logline" value={formData.logline} />
          </div>
          
          <div>
            <InfoField label="💡 แรงบันดาลใจ" value={formData.projectMotivation} />
          </div>
        </div>
      </section>

      {/* Portfolio Information */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <SectionTitle>🎨 ผลงานที่ผ่านมา</SectionTitle>
        <div className="space-y-4">
          <InfoField label="📋 ข้อความแนะนำผลงาน" value={formData.portfolioText} />
          
          {formData.projectFiles?.length > 0 && (
            <div>
              <div className="text-lg text-gray-600 mb-3">
                📎 ไฟล์แนบ
              </div>
              <div className="flex flex-wrap gap-3 ml-2">
                {formData.projectFiles.map((file: any, index: number) => (
                  <a
                    key={index}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <span className="text-lg text-gray-700">📄 {file.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-lg text-yellow-700">
              ⚠️ กรุณาตรวจสอบความถูกต้องของข้อมูลทั้งหมดก่อนส่งใบสมัคร เมื่อส่งแล้วจะไม่สามารถแก้ไขได้
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}