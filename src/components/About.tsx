import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Parallax } from 'react-scroll-parallax';

export function About() {
  return (
    <div className="flex flex-col min-h-screen font-ibm">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-32">
        <Parallax translateY={[-20, 20]} className="absolute inset-0">
          <img 
            src="https://firebasestorage.googleapis.com/v0/b/ofos-filmcamp.firebasestorage.app/o/sitefiles%2Ftfc_art%2FOFOS-322.jpg?alt=media&token=927bb207-8f48-4e98-a1c8-2970eada0cc1"
            alt="Thai Film Camps Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-brand-navy/70" />
        </Parallax>
        <div className="container mx-auto px-4 max-w-4xl relative">
          <Parallax translateY={[20, -20]}>
            <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-8">
              เกี่ยวกับ Thai Film Camps
            </h1>
            <p className="text-lg text-white/90 leading-relaxed text-center max-w-3xl mx-auto">
              Thai Film Camps คือเครือข่ายโครงการค่ายอบรมด้านการผลิตภาพยนตร์ที่ใหญ่ที่สุดในประเทศไทย ซึ่งเกิดจากความเชื่อมั่นว่า "เฟรมแรกของเยาวชนไทยสามารถเปลี่ยนวงการภาพยนตร์ได้" เรามุ่งหมายจะ กระจายโอกาสและสร้างเวทีให้เยาวชนและนักศึกษาจากทั่วประเทศ ได้เรียนรู้ ฝึกฝน และผลิตผลงานภาพยนตร์ร่วมกับมืออาชีพ ผ่านการลงมือทำจริงในรูปแบบ Film Camp
            </p>
          </Parallax>
        </div>
      </section>

      {/* Policy Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <Parallax speed={-5}>
            <p className="text-lg text-brand-navy/80 leading-relaxed">
              โครงการนี้อยู่ภายใต้นโยบาย OFOS ของรัฐบาลนางสาวแพทองธาร ชินวัตร นายกรัฐมนตรี โดยมีนายแพทย์สุรพงษ์ สืบวงศ์ลี รองประธานคณะที่ปรึกษาด้านนโยบายของนายกรัฐมนตรี, กรรมการและเลขานุการคณะกรรมการยุทธศาสตร์ซอฟต์พาวเวอร์แห่งชาติ และประธานกรรมการพัฒนาซอฟต์พาวเวอร์แห่งชาติ เป็นผู้ริเริ่มโครงการ จัดทำหลักสูตรและกิจกรรมโดย นายชูเกียรติ ศักดิ์วีระกุล ผู้อำนวยการหลักสูตร OFOS สาขาภาพยนตร์และซีรีส์ ดำเนินนโยบายผ่านสำนักงานส่งเสริมเศรษฐกิจสร้างสรรค์ (THACCA) สนับสนุนโดย กรมส่งเสริมวัฒนธรรม กระทรวงวัฒนธรรม และร่วมจัดทำกิจกรรมโดยเครือข่ายมหาวิทยาลัย 6 แห่งจากทั่วประเทศไทย ได้แก่ จุฬาลงกรณ์มหาวิทยาลัย, มหาวิทยาลัยขอนแก่น, มหาวิทยาลัยแม่โจ้, มหาวิทยาลัยศรีนครินทรวิโรฒ, มหาวิทยาลัยมหาสารคาม และสถาบันเทคโนโลยีพระจอมเกล้าฯ เจ้าคุณทหารลาดกระบัง
            </p>
          </Parallax>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-16 bg-brand-cream">
        <div className="container mx-auto px-4 max-w-4xl">
          <Parallax speed={5}>
            <h2 className="text-2xl font-semibold text-brand-navy mb-8">
              โครงการของเราครอบคลุมทั้งระดับมัธยมศึกษาและอุดมศึกษา ภายใต้สองเส้นทางหลัก คือ:
            </h2>
          </Parallax>

          {/* CineBridge */}
          <Parallax translateY={[20, -20]} className="mb-8">
            <div className="relative bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="absolute inset-0">
                <img 
                  src="https://firebasestorage.googleapis.com/v0/b/ofos-filmcamp.firebasestorage.app/o/sitefiles%2Ftfc_art%2FAS7A8158.jpg?alt=media&token=75f64560-1668-4ff7-ab8c-7d38adb4cb14"
                  alt="CineBridge Background"
                  className="w-full h-full object-cover opacity-10"
                />
              </div>
              <div className="relative p-8">
                <div className="flex justify-center mb-8">
                  <img 
                    src="https://firebasestorage.googleapis.com/v0/b/ofos-filmcamp.firebasestorage.app/o/sitefiles%2FProject%20Logos%2FAsset%204%403x.png?alt=media&token=ba4e828c-3c6a-4c1f-8bbb-d47c18406c0b"
                    alt="OFOS CINEBRIDGE"
                    className="h-32 object-contain"
                  />
                </div>
                <h3 className="text-2xl font-bold text-brand-navy mb-4">
                  OFOS CINEBRIDGE
                </h3>
                <p className="text-xl text-brand-violet font-medium mb-4">
                  "สะพานสร้างสรรค์ จากความฝันสู่เวทีโลก"
                </p>
                <p className="text-lg text-brand-navy/80 leading-relaxed mb-4">
                  CINEBRIDGE คือค่ายอบรมด้านภาพยนตร์สำหรับนักเรียนมัธยมศึกษาจาก 77 จังหวัดทั่วไทย โดยเชื่อมโยงการเรียนรู้สู่การลงมือปฏิบัติจริง เยาวชนจะได้เรียนรู้การเขียนบท กำกับ ถ่ายทำ และตัดต่อ พร้อมรับคำแนะนำจากวิทยากรระดับแนวหน้าในวงการ
                </p>
                <p className="text-lg text-brand-navy/80 leading-relaxed">
                  เป้าหมายของเราคือการสร้างแรงบันดาลใจและปูทางให้เยาวชนได้ค้นพบศักยภาพของตนเองในฐานะนักเล่าเรื่อง ผ่านกิจกรรมที่เข้มข้นและสนุกสนาน
                </p>
              </div>
            </div>
          </Parallax>

          {/* Next Frame */}
          <Parallax translateY={[20, -20]}>
            <div className="relative bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="absolute inset-0">
                <img 
                  src="https://firebasestorage.googleapis.com/v0/b/ofos-filmcamp.firebasestorage.app/o/sitefiles%2Ftfc_art%2FBBB08340.jpg?alt=media&token=aac34ab2-0de8-43ff-acff-de923824aa6b"
                  alt="Next Frame Background"
                  className="w-full h-full object-cover opacity-10"
                />
              </div>
              <div className="relative p-8">
                <div className="flex justify-center mb-8">
                  <img 
                    src="https://firebasestorage.googleapis.com/v0/b/ofos-filmcamp.firebasestorage.app/o/sitefiles%2FProject%20Logos%2FAsset%202%403x.png?alt=media&token=5b137529-cae9-4124-8ce9-c1c65c8cc3e8"
                    alt="OFOS NEXT FRAME"
                    className="h-32 object-contain"
                  />
                </div>
                <h3 className="text-2xl font-bold text-brand-navy mb-4">
                  OFOS NEXT FRAME
                </h3>
                <p className="text-xl text-brand-violet font-medium mb-4">
                  "เฟรมแรกจากมหาลัย สู่เฟรมใหม่ของวงการ"
                </p>
                <p className="text-lg text-brand-navy/80 leading-relaxed mb-4">
                  NEXT FRAME คือโครงการสำหรับนิสิตนักศึกษาระดับอุดมศึกษา ที่มุ่งเน้นการพัฒนาทักษะในสาขาเฉพาะด้าน เช่น ภาพยนตร์เชิงพาณิชย์ สารคดี แอนิเมชัน ซีรีส์ หนังแฟนตาซี แอ็กชัน หรือดุริยนาฏกรรม
                </p>
                <p className="text-lg text-brand-navy/80 leading-relaxed">
                  ค่ายการเรียนรู้ภายใต้ NEXT FRAME จัดขึ้นโดยเครือข่ายมหาวิทยาลัยโดยร่วมมือกับบุคลากรจากสตูดิโอระดับแนวหน้า เช่น GDH, GMMTV, Workpoint, Studio Commuan ฯลฯ เพื่อให้ผู้เข้าร่วมได้ฝึกทำงานในระดับกึ่งมืออาชีพ และเชื่อมโยงกับอุตสาหกรรมจริง
                </p>
              </div>
            </div>
          </Parallax>
        </div>
      </section>

      {/* Goals Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <Parallax speed={5}>
            <h2 className="text-2xl font-bold text-brand-navy mb-8">
              เป้าหมายของเรา
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-brand-cream rounded-lg p-6 transform transition-transform hover:scale-105">
                <div className="text-4xl mb-4">👥</div>
                <p className="text-lg text-brand-navy/80 leading-relaxed">
                  สร้างบุคลากรรุ่นใหม่ ที่มีความสามารถและความเข้าใจในวงการภาพยนตร์ไทย
                </p>
              </div>
              <div className="bg-brand-cream rounded-lg p-6 transform transition-transform hover:scale-105">
                <div className="text-4xl mb-4">🎭</div>
                <p className="text-lg text-brand-navy/80 leading-relaxed">
                  เปิดพื้นที่ให้เยาวชนทั่วประเทศ ได้ค้นพบตัวเองผ่านกระบวนการเล่าเรื่อง
                </p>
              </div>
              <div className="bg-brand-cream rounded-lg p-6 transform transition-transform hover:scale-105">
                <div className="text-4xl mb-4">🤝</div>
                <p className="text-lg text-brand-navy/80 leading-relaxed">
                  เชื่อมโยงการศึกษาเข้ากับอุตสาหกรรม ผ่านการร่วมมือของสถาบันการศึกษา สตูดิโอ และแพลตฟอร์มเผยแพร่
                </p>
              </div>
              <div className="bg-brand-cream rounded-lg p-6 transform transition-transform hover:scale-105">
                <div className="text-4xl mb-4">🌏</div>
                <p className="text-lg text-brand-navy/80 leading-relaxed">
                  กระจายโอกาสและความหลากหลาย ทั้งด้านเนื้อหาและภูมิภาค เพื่อยกระดับอุตสาหกรรมภาพยนตร์ไทยอย่างยั่งยืน
                </p>
              </div>
            </div>
          </Parallax>
        </div>
      </section>

      {/* Closing Section */}
      <section className="py-16 bg-brand-cream">
        <div className="container mx-auto px-4 max-w-4xl">
          <Parallax speed={-5}>
            <p className="text-lg text-brand-navy/80 leading-relaxed text-center">
              Thai Film Camps คือพื้นที่แห่งการเริ่มต้นของนักเล่าเรื่องรุ่นใหม่ เราเชื่อว่าทุกความฝันมีศักยภาพที่จะกลายเป็น Soft Power ที่ทรงพลัง และพร้อมผลักดันเฟรมเล็ก ๆ จากห้องเรียน ให้ก้าวขึ้นสู่เวทีระดับโลกอย่างมั่นใจ
            </p>
          </Parallax>
        </div>
      </section>

      <Footer />
    </div>
  );
}