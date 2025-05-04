import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function UnderConstruction() {
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="relative">
          <div className="absolute inset-0 animate-ping">
            <Construction className="w-16 h-16 mx-auto text-brand-violet opacity-20" />
          </div>
          <Construction className="w-16 h-16 mx-auto text-brand-violet relative" />
        </div>
        
        <h1 className="mt-8 text-3xl font-bold text-brand-navy">
          อยู่ระหว่างการพัฒนา
        </h1>
        <p className="mt-4 text-lg text-brand-navy/70">
          ขออภัยในความไม่สะดวก เรากำลังพัฒนาหน้านี้ให้พร้อมใช้งานในเร็วๆ นี้
        </p>
        
        <Link 
          to="/"
          className="mt-8 inline-flex items-center gap-2 text-brand-violet hover:text-brand-violet-light"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับสู่หน้าแรก</span>
        </Link>
      </div>
    </div>
  );
}