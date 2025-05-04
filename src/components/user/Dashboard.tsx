import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle2 } from 'lucide-react';

export function UserDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-navy mb-8">หน้าหลัก</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">ใบสมัครทั้งหมด</p>
              <p className="text-2xl font-semibold text-brand-navy">2</p>
            </div>
            <FileText className="w-8 h-8 text-brand-violet" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">กำลังดำเนินการ</p>
              <p className="text-2xl font-semibold text-yellow-600">1</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">ผ่านการคัดเลือก</p>
              <p className="text-2xl font-semibold text-green-600">1</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-brand-navy mb-4">ใบสมัครล่าสุด</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-brand-navy">CineBridge 2025</p>
                <p className="text-sm text-gray-500">ส่งเมื่อ 2 วันที่แล้ว</p>
              </div>
              <span className="px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-full">
                กำลังพิจารณา
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-brand-navy">NEXT FRAME 2025</p>
                <p className="text-sm text-gray-500">ส่งเมื่อ 1 สัปดาห์ที่แล้ว</p>
              </div>
              <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
                ผ่านการคัดเลือก
              </span>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
          <Link
            to="/user/applications"
            className="text-sm text-brand-violet hover:text-brand-violet-light font-medium"
          >
            ดูใบสมัครทั้งหมด
          </Link>
        </div>
      </div>
    </div>
  );
}