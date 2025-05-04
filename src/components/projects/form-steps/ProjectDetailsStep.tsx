import React from 'react';
import { FileUploader } from '../../shared/FileUploader';

interface ProjectDetailsStepProps {
  formData: any;
  onChange: (section: string, field: string, value: any) => void;
}

export const projectThemes = [
  { id: 'me-and-world', label: 'ฉันกับโลก', emojis: '🧍🏻🌏' },
  { id: 'me-and-city', label: 'ฉันกับเมือง', emojis: '🧍🏻🏙️' },
  { id: 'me-and-home', label: 'ฉันกับบ้าน', emojis: '🧍🏻🏠' },
  { id: 'me-and-you', label: 'ฉันกับเธอ', emojis: '🧍🏻💑' },
  { id: 'me-and-myself', label: 'ฉันกับฉัน', emojis: '🧍🏻🪞' },
];

// Helper component for form labels
function FormLabel({ children, required = false, optional = false, description }: { 
  children: React.ReactNode; 
  required?: boolean; 
  optional?: boolean;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-lg font-medium text-gray-900">
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
        {optional && <span className="text-gray-400 text-sm ml-2">(ไม่บังคับ)</span>}
      </label>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}

export function ProjectDetailsStep({ formData, onChange }: ProjectDetailsStepProps) {
  return (
    <div className="space-y-8">
      {/* Project Section */}
      <section className="space-y-8 bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-semibold text-gray-900">ข้อมูลโครงการ</h2>
        
        <div>
          <FormLabel required>หัวข้อโครงการ</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {projectThemes.map((theme) => (
              <label
                key={theme.id}
                className="relative flex flex-col items-center"
              >
                <input
                  type="radio"
                  name="projectTheme"
                  value={theme.id}
                  checked={formData.projectTheme === theme.id}
                  onChange={(e) => onChange('project', 'projectTheme', e.target.value)}
                  className="sr-only"
                />
                <div className={`
                  w-full py-6 px-6 text-center rounded-lg cursor-pointer transition-colors
                  ${formData.projectTheme === theme.id
                    ? 'bg-brand-violet text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }
                `}>
                  <span className="text-3xl mb-3 block">{theme.emojis}</span>
                  <span className="text-base block">{theme.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <FormLabel optional description="คุณสามารถแก้ไขชื่อเรื่องได้ในภายหลัง">
            ชื่อเรื่องหนังสั้น
          </FormLabel>
          <input
            type="text"
            value={formData.shortFilmTitle || ''}
            onChange={(e) => onChange('project', 'shortFilmTitle', e.target.value)}
            placeholder="ตั้งชื่อเรื่องหนังสั้นของคุณ"
            className="mt-2 block w-full h-14 px-4 rounded-lg border-gray-300 shadow-sm focus:border-brand-violet focus:ring-brand-violet text-lg"
          />
        </div>

        <div>
          <FormLabel 
            required
            description="เขียนประโยคสั้นๆ ที่สรุปแก่นของเรื่องและสิ่งที่ต้องการสื่อสาร"
          >
            Logline
          </FormLabel>
          <textarea
            value={formData.logline || ''}
            onChange={(e) => onChange('project', 'logline', e.target.value)}
            rows={4}
            className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-violet focus:ring-brand-violet text-lg"
            required
          />
        </div>

        <div>
          <FormLabel required>แรงบันดาลใจในการทำโครงการ</FormLabel>
          <textarea
            value={formData.projectMotivation || ''}
            onChange={(e) => onChange('project', 'projectMotivation', e.target.value)}
            rows={6}
            className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-violet focus:ring-brand-violet text-lg"
            required
          />
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="space-y-8 bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-semibold text-gray-900">ผลงานที่ผ่านมา</h2>

        <div>
          <FormLabel optional>ข้อความแนะนำผลงาน</FormLabel>
          <textarea
            value={formData.portfolioText || ''}
            onChange={(e) => onChange('project', 'portfolioText', e.target.value)}
            rows={6}
            className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-violet focus:ring-brand-violet text-lg"
            placeholder="อธิบายเกี่ยวกับผลงานที่ผ่านมาของคุณ"
          />
        </div>

        <div>
          <FormLabel optional>ไฟล์แนบ</FormLabel>
          <div className="mt-2">
            <FileUploader
              files={formData.projectFiles || []}
              onFilesChange={(files) => onChange('project', 'projectFiles', files)}
              projectId={formData.projectId}
            />
          </div>
        </div>
      </section>

      {/* Form Legend */}
      <div className="text-base text-gray-500 bg-white rounded-lg border border-gray-200 p-4">
        <span className="text-red-500">*</span> หมายถึงข้อมูลที่จำเป็นต้องกรอก
      </div>
    </div>
  );
}