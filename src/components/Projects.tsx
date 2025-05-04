import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProjects } from '../lib/services/projects';
import { type Project } from '../types/project';
import { toast } from 'sonner';

const projectLogos = {
  CineBridge: 'https://firebasestorage.googleapis.com/v0/b/ofos-filmcamp.firebasestorage.app/o/sitefiles%2FProject%20Logos%2FAsset%204%403x.png?alt=media&token=ba4e828c-3c6a-4c1f-8bbb-d47c18406c0b',
  NextFrame: 'https://firebasestorage.googleapis.com/v0/b/ofos-filmcamp.firebasestorage.app/o/sitefiles%2FProject%20Logos%2FAsset%202%403x.png?alt=media&token=5b137529-cae9-4124-8ce9-c1c65c8cc3e8'
};

const projectBackgrounds = {
  CineBridge: 'https://firebasestorage.googleapis.com/v0/b/ofos-filmcamp.firebasestorage.app/o/sitefiles%2Ftfc_art%2FOFOS-322.jpg?alt=media&token=927bb207-8f48-4e98-a1c8-2970eada0cc1',
  NextFrame: 'https://firebasestorage.googleapis.com/v0/b/ofos-filmcamp.firebasestorage.app/o/sitefiles%2Ftfc_art%2FBBB08340.jpg?alt=media&token=aac34ab2-0de8-43ff-acff-de923824aa6b'
};

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const allProjects = await getProjects();
      const featuredProjects = allProjects.filter(project => 
        project.tags?.some(tag => ['CineBridge', 'NextFrame'].includes(tag))
      );
      setProjects(featuredProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('โหลดข้อมูลโครงการไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectLogo = (project: Project) => {
    if (project.tags.includes('CineBridge')) {
      return projectLogos.CineBridge;
    }
    if (project.tags.includes('NextFrame')) {
      return projectLogos.NextFrame;
    }
    return project.imageUrl;
  };

  const getProjectBackground = (project: Project) => {
    if (project.tags.includes('CineBridge')) {
      return projectBackgrounds.CineBridge;
    }
    if (project.tags.includes('NextFrame')) {
      return projectBackgrounds.NextFrame;
    }
    return project.imageUrl;
  };

  const getProjectDescription = (project: Project) => {
    if (project.tags.includes('CineBridge')) {
      return 'CINEBRIDGE คือค่ายอบรมด้านภาพยนตร์สำหรับนักเรียนมัธยมศึกษาจาก 77 จังหวัดทั่วไทย โดยเชื่อมโยงการเรียนรู้สู่การลงมือปฏิบัติจริง เยาวชนจะได้เรียนรู้การเขียนบท กำกับ ถ่ายทำ และตัดต่อ พร้อมรับคำแนะนำจากวิทยากรระดับแนวหน้าในวงการ';
    }
    if (project.tags.includes('NextFrame')) {
      return 'NEXT FRAME คือโครงการสำหรับนิสิตนักศึกษาระดับอุดมศึกษา ที่มุ่งเน้นการพัฒนาทักษะในสาขาเฉพาะด้าน เช่น ภาพยนตร์เชิงพาณิชย์ สารคดี แอนิเมชัน ซีรีส์ หนังแฟนตาซี แอ็กชัน หรือดุริยนาฏกรรม';
    }
    return project.description;
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-brand-cream">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-violet"></div>
          </div>
        </div>
      </section>
    );
  }

  if (projects.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-brand-cream">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="heading-2 mb-4">โครงการของเรา</h2>
          <p className="body-light max-w-2xl mx-auto">เลือกโครงการที่เหมาะกับคุณ เพื่อพัฒนาทักษะและสร้างโอกาสในวงการภาพยนตร์</p>
        </div>

        <div className="relative h-[400px]">
          {projects.map((project, index) => (
            <div 
              key={project.id}
              className={`absolute transition-all duration-500 bg-white rounded-lg overflow-hidden ${
                expandedProject === project.id ? 'inset-0 z-20' : 
                expandedProject ? 'w-0 opacity-0' : `w-[calc(50%-1rem)] ${index === 0 ? 'left-0' : 'right-0'} z-10`
              }`}
              onMouseEnter={() => setExpandedProject(project.id)}
              onMouseLeave={() => setExpandedProject(null)}
            >
              {expandedProject === project.id ? (
                <div className="h-full relative">
                  <div className="absolute inset-0 bg-cover bg-center" style={{
                    backgroundImage: `url('${getProjectBackground(project)}')`,
                    opacity: '0.1'
                  }} />
                  <div className="relative h-full p-8 flex items-center">
                    <div className="w-1/3 flex justify-center">
                      <img 
                        src={getProjectLogo(project)}
                        alt={project.title}
                        className="w-40 h-40 object-contain"
                      />
                    </div>
                    <div className="w-2/3 pl-8">
                      <h3 className="text-2xl font-bold text-brand-navy mb-2">
                        {project.tags.includes('CineBridge') ? 'CineBridge' : 'NEXT FRAME'}
                      </h3>
                      <p className="text-brand-navy/80 mb-6">
                        {getProjectDescription(project)}
                      </p>
                      <Link to={`/projects/${project.id}`} className="btn-primary inline-flex items-center space-x-2">
                        <span>ดูรายละเอียดเพิ่มเติม</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full p-8 flex flex-col items-center justify-center relative">
                  <div className="w-40 h-40 flex items-center justify-center mb-6">
                    <img 
                      src={getProjectLogo(project)}
                      alt={project.title}
                      className="w-32 h-32 object-contain"
                    />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-brand-navy mb-2">
                      {project.tags.includes('CineBridge') ? 'CineBridge' : 'NEXT FRAME'}
                    </h3>
                    <p className="text-brand-navy/70">
                      {project.tags?.includes('CineBridge') 
                        ? 'สะพานสร้างสรรค์ จากความฝันสู่เวทีโลก' 
                        : 'เฟรมแรกจากมหาลัย สู่เฟรมใหม่ของวงการ'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}