import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../lib/store';
import { ProjectSubmitForm } from '../projects/ProjectSubmitForm';
import { Clock, CheckCircle2, XCircle, Send, Search, X, Filter, GraduationCap, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, cn } from '../../lib/utils';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface Project {
  id: string;
  title: string;
  imageUrl: string;
}

interface Application {
  id: string;
  projectId: string;
  projectTitle: string;
  groupName: string;
  school: string;
  status: 'draft' | 'submitted' | 'approved' | 'graduated' | 'cancelled';
  submittedAt?: string;
}

interface EnrichedApplication extends Application {
  project?: Project;
}

const statusConfig = {
  draft: {
    label: 'แบบร่าง',
    icon: Clock,
    className: 'text-gray-700 bg-gray-100',
  },
  submitted: {
    label: 'กำลังพิจารณา',
    icon: Clock,
    className: 'text-yellow-700 bg-yellow-100',
  },
  approved: {
    label: 'ผ่านการคัดเลือก',
    icon: CheckCircle2,
    className: 'text-green-700 bg-green-100',
  },
  graduated: {
    label: 'สำเร็จการอบรม',
    icon: GraduationCap,
    className: 'text-purple-700 bg-purple-100',
  },
  cancelled: {
    label: 'ยกเลิกการสมัคร',
    icon: XCircle,
    className: 'text-gray-700 bg-gray-100',
  },
};

const ITEMS_PER_PAGE = 12;

export function AdminSubmissions() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<EnrichedApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<EnrichedApplication | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [applicationToCancel, setApplicationToCancel] = useState<EnrichedApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(1);

  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectsRef = collection(db, 'projects');
        const projectsSnap = await getDocs(projectsRef);
        const projectsData = projectsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Project));
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };

    loadProjects();
  }, []);

  const loadApplications = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const applicationsRef = collection(db, 'applications');
      let q = query(
        applicationsRef,
        orderBy('submittedAt', 'desc'),
        limit(ITEMS_PER_PAGE * page)
      );

      if (selectedStatus) {
        q = query(
          applicationsRef,
          where('status', '==', selectedStatus),
          orderBy('submittedAt', 'desc'),
          limit(ITEMS_PER_PAGE * page)
        );
      }

      const querySnapshot = await getDocs(q);
      const apps: EnrichedApplication[] = [];

      const projectPromises = querySnapshot.docs.map(async (docSnap) => {
        const appData = docSnap.data() as Application;
        try {
          const projectRef = doc(db, 'projects', appData.projectId);
          const projectSnap = await getDoc(projectRef);
          
          if (projectSnap.exists()) {
            const projectData = projectSnap.data() as Project;
            apps.push({
              id: docSnap.id,
              ...appData,
              project: {
                id: projectSnap.id,
                ...projectData
              }
            });
          } else {
            apps.push({
              id: docSnap.id,
              ...appData
            });
          }
        } catch (error) {
          console.error(`Error fetching project ${appData.projectId}:`, error);
          apps.push({
            id: docSnap.id,
            ...appData
          });
        }
      });

      await Promise.all(projectPromises);
      setApplications(apps);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error('โหลดข้อมูลใบสมัครไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [user, selectedStatus, page]);

  const filteredApplications = applications.filter(application => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      (application.groupName?.toLowerCase() || '').includes(searchLower) ||
      (application.school?.toLowerCase() || '').includes(searchLower)
    );
    
    const matchesProject = !selectedProject || application.projectId === selectedProject;
    
    const matchesTags = selectedTags.length === 0 || 
      (application.project?.tags?.some(tag => selectedTags.includes(tag)) ?? false);
    
    const matchesProvince = !selectedProvince || application.project?.province === selectedProvince;
    
    return matchesSearch && matchesProject && matchesTags && matchesProvince;
  });

  const hasActiveFilters = searchQuery !== '' || selectedProject || selectedTags.length > 0 || selectedProvince !== '' || selectedStatus !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedProject('');
    setSelectedTags([]);
    setSelectedProvince('');
    setSelectedStatus('');
    setPage(1);
  };

  const handleCancelApplication = async () => {
    if (!applicationToCancel) return;

    try {
      const applicationRef = doc(db, 'applications', applicationToCancel.id);
      await updateDoc(applicationRef, {
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      });

      toast.success('ยกเลิกใบสมัครสำเร็จ');
      setShowCancelDialog(false);
      setApplicationToCancel(null);
      
      await loadApplications();
    } catch (error) {
      console.error('Error cancelling application:', error);
      toast.error('เกิดข้อผิดพลาดในการยกเลิกใบสมัคร');
    }
  };

  const handleEditClick = (e: React.MouseEvent, application: EnrichedApplication) => {
    e.stopPropagation();
    setSelectedApplication(application);
    setShowEditForm(true);
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">กรุณาเข้าสู่ระบบเพื่อดูใบสมัครของคุณ</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-navy mb-8">การสมัครของฉัน</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
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

        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const isSelected = selectedStatus === status;
            const StatusIcon = config.icon;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(isSelected ? '' : status)}
                className={cn(
                  "px-4 py-2 rounded-full flex items-center gap-2 transition-colors",
                  isSelected ? config.className : "bg-gray-50 text-gray-600",
                  !isSelected && "hover:bg-gray-100"
                )}
              >
                <StatusIcon className="w-4 h-4" />
                <span>{config.label}</span>
                {isSelected && (
                  <X 
                    className="w-4 h-4 ml-1 hover:text-gray-900" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStatus('');
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาตามชื่อกลุ่มหรือสถาบัน..."
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

          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
          >
            <option value="">เลือกโครงการ</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-500">
          แสดง {filteredApplications.length} จาก {applications.length} ใบสมัคร
          {hasActiveFilters && (
            <span className="ml-2 flex items-center gap-1 text-brand-violet">
              <Filter className="w-4 h-4" />
              กำลังใช้ตัวกรอง
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-violet"></div>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500">ไม่พบใบสมัครที่ตรงกับเงื่อนไขการค้นหา</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredApplications.map((application) => {
            const status = statusConfig[application.status];
            const StatusIcon = status.icon;
            
            return (
              <div
                key={application.id}
                onClick={() => navigate(`/admin/submissions/${application.id}`)}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              >
                <div className="relative h-48">
                  <img
                    src={application.project?.imageUrl || 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg'}
                    alt={application.groupName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {application.groupName || 'ไม่ระบุชื่อกลุ่ม'}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {application.school || 'ไม่ระบุสถาบัน'}
                    </p>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-4 h-4 ${status.className.split(' ')[1]}`} />
                        <span className={cn("text-sm font-medium", status.className)}>
                          {status.label}
                        </span>
                      </div>
                      {canEdit && (
                        <button
                          onClick={(e) => handleEditClick(e, application)}
                          className="p-2 text-gray-500 hover:text-brand-violet rounded-full hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {application.submittedAt && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Send className="w-4 h-4" />
                        <span className="text-sm">
                          ส่งเมื่อ {formatDate(application.submittedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {applications.length >= ITEMS_PER_PAGE * page && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-brand-violet border border-brand-violet rounded-lg hover:bg-brand-violet hover:text-white transition-colors"
          >
            โหลดเพิ่มเติม
          </button>
        </div>
      )}

      {selectedApplication && (
        <ProjectSubmitForm
          projectId={selectedApplication.projectId}
          projectTitle={selectedApplication.projectTitle}
          onClose={() => {
            setSelectedApplication(null);
            setShowEditForm(false);
            loadApplications();
          }}
          applicationId={selectedApplication.id}
        />
      )}

      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => {
          setShowCancelDialog(false);
          setApplicationToCancel(null);
        }}
        onConfirm={handleCancelApplication}
        title="ยืนยันการยกเลิกใบสมัคร"
        message="คุณแน่ใจหรือไม่ที่จะยกเลิกใบสมัคร? การดำเนินการนี้ไม่สามารถเรียกคืนได้"
        confirmText="ยกเลิกใบสมัคร"
        type="danger"
      />
    </div>
  );
}