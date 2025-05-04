import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import { ProjectsGrid } from '../admin/ProjectsGrid';
import { getProjects } from '../../lib/services/projects';
import { THAI_PROVINCES, type Project } from '../../types/project';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

// Only show CineBridge and NextFrame tags
const AVAILABLE_TAGS = ['CineBridge', 'NextFrame'] as const;

export function AllProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const data = await getProjects();
      setProjects(data.filter(project => project.isPublic));
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('โหลดข้อมูลโครงการไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedProvince('');
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = (
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => project.tags.includes(tag));
    
    const matchesProvince = !selectedProvince || 
      (project.targetArea || '').toLowerCase().includes(selectedProvince.toLowerCase());
    
    return matchesSearch && matchesTags && matchesProvince;
  });

  const hasActiveFilters = searchQuery !== '' || selectedTags.length > 0 || selectedProvince !== '';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-cream py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-violet"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-brand-navy">โครงการทั้งหมด</h1>
        </div>

        {/* Compact Filter Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* Search and Province Filters */}
            <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาโครงการ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 w-full h-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent text-sm"
              >
                <option value="">เลือกจังหวัด</option>
                {THAI_PROVINCES.map((province) => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>

            {/* Tags Filter */}
            <div className="md:col-span-4 flex items-center justify-end space-x-2">
              <div className="flex gap-2">
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm transition-colors",
                      tag === 'CineBridge' 
                        ? selectedTags.includes(tag)
                          ? "bg-emerald-800 text-white"
                          : "border border-emerald-800 text-emerald-800 hover:bg-emerald-800 hover:text-white"
                        : selectedTags.includes(tag)
                          ? "bg-brand-violet text-white"
                          : "border border-brand-violet text-brand-violet hover:bg-brand-violet hover:text-white"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="h-10 px-4 text-sm text-red-600 hover:text-red-700 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  ล้างตัวกรอง
                </button>
              )}
            </div>
          </div>

          {/* Filter Stats */}
          <div className="mt-4 text-sm text-gray-500">
            แสดง {filteredProjects.length} จาก {projects.length} โครงการ
            {hasActiveFilters && (
              <span className="ml-2 flex items-center gap-1 text-brand-violet">
                <Filter className="w-4 h-4" />
                กำลังใช้ตัวกรอง
              </span>
            )}
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">ยังไม่มีโครงการในระบบ</p>
          </div>
        ) : (
          <ProjectsGrid
            projects={filteredProjects}
            onProjectClick={handleProjectClick}
          />
        )}
      </div>
    </div>
  );
}
