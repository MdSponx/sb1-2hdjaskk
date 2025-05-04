import React from 'react';

export function CTA() {
  return (
    <section className="gradient-cta">
      <div className="container mx-auto px-4 text-center max-w-6xl py-20">
        <h2 className="heading-2 mb-4 text-white">พร้อมที่จะเริ่มต้นเส้นทางในวงการภาพยนตร์หรือยัง?</h2>
        <p className="body-light mb-8 max-w-2xl mx-auto text-brand-cream/80">
          สมัครเข้าร่วมโครงการวันนี้ เพื่อโอกาสในการพัฒนาทักษะและสร้างผลงานระดับมืออาชีพ
        </p>
        <a href="#" className="btn-primary">สมัครเข้าร่วมโครงการ</a>
      </div>
    </section>
  );
}