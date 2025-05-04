import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';

export function Hero() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleSignUpClick = () => {
    if (user) {
      navigate('/user');
    } else {
      navigate('/register');
    }
  };

  return (
    <section className="min-h-[85vh] flex items-center relative overflow-hidden bg-brand-cream pt-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[900px] mx-auto mb-8">
            <img 
              src="https://firebasestorage.googleapis.com/v0/b/ofos-filmcamp.firebasestorage.app/o/sitefiles%2Ftfc_art%2F20250424-201433.png?alt=media&token=e5cf7384-d976-49f2-8a33-5d2d46dcfe81"
              alt="Thai Film Camps Illustration"
              className="w-full h-auto object-contain"
            />
          </div>
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
              <p className="text-base text-brand-navy leading-normal">
                ร่วมเป็นส่วนหนึ่งของเฟรมใหม่วงการหนังไทย! สมัครเข้าร่วม OFOS CINEBRIDGE และ NEXT FRAME วันนี้
                ฝึกกับมืออาชีพ สร้างหนังจริง พร้อมโอกาสไปไกลระดับโลก
              </p>
              <div className="flex gap-4 justify-end">
                <button onClick={handleSignUpClick} className="btn-primary">สมัครเข้าร่วม</button>
                <button onClick={() => navigate('/about')} className="btn-secondary">ดูรายละเอียด</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}