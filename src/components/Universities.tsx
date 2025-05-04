import React from 'react';

export function Universities() {
  const universities = [
    {
      name: "จุฬาลงกรณ์มหาวิทยาลัย",
      logo: "https://firebasestorage.googleapis.com/v0/b/ofos-filmcamp.firebasestorage.app/o/sponsor%2F8.png?alt=media&token=66696b35-0ebe-4846-870c-0f427ff73cc5"
    },
    {
      name: "มหาวิทยาลัยแม่โจ้",
      logo: "https://firebasestorage.googleapis.com/v0/b/ofos-filmcamp.firebasestorage.app/o/sponsor%2F11.png?alt=media&token=824c1bbe-5a5c-421c-ac2f-1ac47f59e98b"
    },
    {
      name: "มหาวิทยาลัยขอนแก่น",
      logo: "https://firebasestorage.googleapis.com/v0/b/ofos-filmcamp.firebasestorage.app/o/sponsor%2F12.png?alt=media&token=4bf836d4-e78d-4525-be0a-51f2a673478d"
    },
    {
      name: "มหาวิทยาลัยมหาสารคาม",
      logo: "https://firebasestorage.googleapis.com/v0/b/ofos-filmcamp.firebasestorage.app/o/sponsor%2F13.png?alt=media&token=fc055bb0-c90a-4abf-882d-0e1dde954cbd"
    },
    {
      name: "มหาวิทยาลัยศรีนครินทรวิโรฒ",
      logo: "https://firebasestorage.googleapis.com/v0/b/ofos-filmcamp.firebasestorage.app/o/sponsor%2F9.png?alt=media&token=96178f1"
    },
    {
      name: "สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง",
      logo: "https://firebasestorage.googleapis.com/v0/b/ofos-filmcamp.firebasestorage.app/o/sponsor%2F10.png?alt=media&token=40312787-7ff4-4ec3-a1e6-6fb95a93e7a5"
    }
  ];

  return (
    <section className="py-20 bg-brand-cream">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="heading-2 mb-4">มหาวิทยาลัยที่ร่วมโครงการ</h2>
          <p className="body-light max-w-2xl mx-auto">ร่วมมือกับมหาวิทยาลัยชั้นนำทั่วประเทศในการพัฒนาบุคลากรด้านภาพยนตร์</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {universities.map((university, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="aspect-square relative">
                <img 
                  src={university.logo}
                  alt={university.name}
                  className="absolute inset-0 w-full h-full object-contain p-4"
                />
              </div>
              <p className="text-center mt-4 font-medium text-brand-navy">{university.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}