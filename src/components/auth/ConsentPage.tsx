import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function ConsentPage() {
  return (
    <div className="min-h-screen bg-brand-cream py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link 
          to="/register" 
          className="inline-flex items-center text-brand-navy hover:text-brand-violet mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          กลับไปหน้าสมัครสมาชิก
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-brand-navy mb-8">
            กฎของการใช้งานและการยินยอมให้เก็บข้อมูล
          </h1>

          <div className="prose max-w-none">
            <h2>1. ข้อตกลงการใช้งาน</h2>
            <p>
              ผู้สมัครเข้าร่วมกิจกรรมทุกคน ("ผู้ใช้") ต้องยอมรับและปฏิบัติตามกฎระเบียบดังต่อไปนี้:
            </p>
            <ul>
              <li>กรอกข้อมูลส่วนบุคคลที่ถูกต้อง ครบถ้วน และเป็นความจริง</li>
              <li>ห้ามใช้ข้อมูลเท็จหรือแอบอ้างบุคคลอื่นในการสมัคร</li>
              <li>ห้ามกระทำการใด ๆ ที่อาจสร้างความเสียหายต่อเว็บไซต์ กิจกรรม หรือผู้ใช้อื่น</li>
              <li>เว็บไซต์มีสิทธิระงับการใช้งานหากตรวจพบการละเมิดกฎใด ๆ โดยไม่ต้องแจ้งล่วงหน้า</li>
            </ul>

            <h2>2. การเก็บรวบรวมข้อมูลส่วนบุคคล</h2>
            <p>
              เพื่อการสมัครเข้าร่วมกิจกรรมและการติดตามผลในอนาคต เว็บไซต์จะดำเนินการเก็บรวบรวมข้อมูลดังต่อไปนี้:
            </p>
            <ul>
              <li>ข้อมูลพื้นฐาน: ชื่อ-นามสกุล, อายุ, โรงเรียน/มหาวิทยาลัย, เบอร์โทรศัพท์, อีเมล</li>
              <li>ข้อมูลทางเทคนิค: IP Address, ประเภทอุปกรณ์ที่ใช้, วันและเวลาที่เข้าชมเว็บไซต์</li>
              <li>ข้อมูลที่เกี่ยวกับกิจกรรม: ผลงานที่ส่งสมัคร, ประวัติการเข้าร่วมกิจกรรม, ผลการประเมิน</li>
            </ul>

            <h2>3. วัตถุประสงค์ของการเก็บข้อมูล</h2>
            <p>
              ข้อมูลที่เก็บรวบรวมจะถูกนำไปใช้เพื่อวัตถุประสงค์ดังนี้:
            </p>
            <ul>
              <li>ตรวจสอบคุณสมบัติผู้สมัคร และจัดกลุ่มผู้เข้าร่วมให้เหมาะสมกับแต่ละกิจกรรม</li>
              <li>ติดตามผลการเข้าร่วมกิจกรรม และพัฒนากิจกรรมให้เหมาะสมยิ่งขึ้น</li>
              <li>ส่งข่าวสาร กิจกรรมใหม่ และโอกาสในการพัฒนาทักษะด้านการผลิตภาพยนตร์</li>
              <li>วิเคราะห์ข้อมูลในภาพรวมเพื่อวางแผนงานและปรับปรุงคุณภาพโครงการ</li>
            </ul>

            <h2>4. การเปิดเผยข้อมูล</h2>
            <ul>
              <li>ข้อมูลของผู้ใช้จะถูกเก็บรักษาเป็นความลับ และจะไม่ถูกเปิดเผยแก่บุคคลภายนอก</li>
              <li>ยกเว้นกรณีจำเป็นตามกฎหมาย หรือเพื่อประโยชน์ของการประสานงานกับองค์กรพันธมิตรในโครงการ เช่น บริษัทผู้ผลิตภาพยนตร์ หรือสถาบันการศึกษา</li>
            </ul>

            <h2>5. สิทธิของผู้ใช้</h2>
            <p>ผู้ใช้มีสิทธิ:</p>
            <ul>
              <li>ขอเข้าถึงข้อมูลส่วนตัวของตนเอง</li>
              <li>ขอแก้ไขข้อมูลที่ไม่ถูกต้อง หรือไม่เป็นปัจจุบัน</li>
              <li>ขอให้ลบข้อมูลส่วนตัวเมื่อสิ้นสุดการเข้าร่วมกิจกรรม เว้นแต่จะมีข้อผูกพันทางกฎหมายที่กำหนดให้เก็บรักษาข้อมูลไว้</li>
            </ul>

            <div className="bg-gray-50 p-4 rounded-lg mt-4 mb-4">
              <p className="text-sm text-gray-700">
                หากต้องการใช้สิทธิข้างต้น กรุณาติดต่อทีมงานได้ที่อีเมล: info@thaifilmcamps.com
              </p>
            </div>

            <h2>6. ความยินยอม</h2>
            <p>
              เมื่อทำการสมัครเข้าร่วมกิจกรรม ผู้ใช้ถือว่ายินยอมให้เว็บไซต์
            </p>
            <ul>
              <li>เก็บ รวบรวม และใช้ข้อมูลตามที่ระบุไว้ข้างต้น</li>
              <li>ส่งข้อมูลข่าวสารที่เกี่ยวข้องกับการพัฒนาทักษะด้านภาพยนตร์ และกิจกรรมอื่น ๆ ของโครงการ</li>
            </ul>

            <div className="bg-yellow-50 p-4 rounded-lg mt-4">
              <p className="text-sm text-yellow-800">
                หากผู้ใช้ไม่ยินยอมตามเงื่อนไขดังกล่าว จะไม่สามารถสมัครเข้าร่วมกิจกรรมผ่านเว็บไซต์นี้ได้
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}