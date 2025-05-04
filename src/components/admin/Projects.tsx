import React, { useState, useEffect } from 'react';
import { ProjectEditorPanel } from './ProjectEditorPanel';
import { ProjectsGrid } from './ProjectsGrid';
import { Plus, Search, Filter, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { projectTags, type Project } from '../../types/project';
import { getProjects } from '../../lib/services/projects';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../lib/store';

// Tag color mapping
const tagColors: Record<string, { bg: string; text: string; hover: string }> = {
  'Workshop': { bg: 'bg-blue-100', text: 'text-blue-800', hover: 'hover:bg-blue-200' },
  'Training': { bg: 'bg-green-100', text: 'text-green-800', hover: 'hover:bg-green-200' },
  'Funding': { bg: 'bg-yellow-100', text: 'text-yellow-800', hover: 'hover:bg-yellow-200' },
  'Mentorship': { bg: 'bg-purple-100', text: 'text-purple-800', hover: 'hover:bg-purple-200' },
  'International': { bg: 'bg-red-100', text: 'text-red-800', hover: 'hover:bg-red-200' },
  'Competition': { bg: 'bg-orange-100', text: 'text-orange-800', hover: 'hover:bg-orange-200' },
  'Collaboration': { bg: 'bg-teal-100', text: 'text-teal-800', hover: 'hover:bg-teal-200' },
  'CineBridge': { bg: 'bg-indigo-100', text: 'text-indigo-800', hover: 'hover:bg-indigo-200' },
  'NextFrame': { bg: 'bg-pink-100', text: 'text-pink-800', hover: 'hover:bg-pink-200' },
  'THACCA': { bg: 'bg-cyan-100', text: 'text-cyan-800', hover: 'hover:bg-cyan-200' },
  'OFOS': { bg: 'bg-emerald-100', text: 'text-emerald-800', hover: 'hover:bg-emerald-200' },
  'กระทรวงวัฒนธรรม': { bg: 'bg-amber-100', text: 'text-amber-800', hover: 'hover:bg-amber-200' },
  'กรมส่งเสริมวัฒนธรรม': { bg: 'bg-lime-100', text: 'text-lime-800', hover: 'hover:bg-lime-200' },
};

export function AdminProjects() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const data = await getProjects();
      setProjects(data);
    } catch (error: any) {
      console.error('Error loading projects:', error);
      toast.error('โหลดข้อมูลโครงการไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsEditorOpen(true);
  };

  const handleCreateProject = () => {
    setSelectedProject(null);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedProject(null);
  };

  const handleSaveSuccess = () => {
    loadProjects();
    handleCloseEditor();
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = (
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => project.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  const hasActiveFilters = searchQuery !== '' || selectedTags.length > 0;

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">กรุณาเข้าสู่ระบบเพื่อจัดการโครงการ</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-navy">จัดการโครงการ</h1>
        <button
          onClick={handleCreateProject}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          สร้างโครงการใหม่
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-brand-navy">
            ค้นหาและกรอง
          </h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
              ล้างตัวกรอง
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาโครงการ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Tags Filter */}
        <div className="flex flex-wrap gap-2 pt-2">
          {projectTags.map((tag) => {
            const colors = tagColors[tag] || { bg: 'bg-gray-100', text: 'text-gray-700', hover: 'hover:bg-gray-200' };
            return (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                  selectedTags.includes(tag)
                    ? `${colors.bg} ${colors.text}`
                    : `bg-gray-100 text-gray-600 ${colors.hover}`
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Filter Stats */}
        <div className="flex justify-between items-center text-sm text-gray-500 pt-2">
          <div>
            แสดง {filteredProjects.length} จาก {projects.length} โครงการ
          </div>
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              กำลังใช้ตัวกรอง
            </div>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-brand-violet animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">ยังไม่มีโครงการในระบบ</p>
        </div>
      ) : (
        <ProjectsGrid
          projects={filteredProjects}
          onProjectClick={handleEditProject}
        />
      )}

      {/* Project Editor Panel */}
      <ProjectEditorPanel
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        project={selectedProject}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
}