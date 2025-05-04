import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../lib/store';
import { ProjectSubmitForm } from '../projects/ProjectSubmitForm';
import { Clock, CheckCircle2, XCircle, Calendar, MapPin, Send, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, cn } from '../../lib/utils';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface Project {
  id: string;
  title: string;
  imageUrl: string;
  venueName: string;
  province: string;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
}

interface Application {
  id: string;
  projectId: string;
  projectTitle: string;
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

export function UserApplications() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<EnrichedApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<EnrichedApplication | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSubmittedDialog, setShowSubmittedDialog] = useState(false);
  const [applicationToCancel, setApplicationToCancel] = useState<EnrichedApplication | null>(null);

  const loadApplications = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const applicationsRef = collection(db, 'applications');
      const q = query(
        applicationsRef,
        where('userId', '==', user.id)
      );
      
      const querySnapshot = await getDocs(q);
      const apps: EnrichedApplication[] = [];
      
      for (const docSnap of querySnapshot.docs) {
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
      }
      
      // Sort applications by submission date
      const sortedApps = apps.sort((a, b) => {
        const dateA = a.submittedAt || '';
        const dateB = b.submittedAt || '';
        return dateB.localeCompare(dateA);
      });
      
      setApplications(sortedApps);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error('โหลดข้อมูลใบสมัครไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [user]);

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
      
      // Refresh applications list
      await loadApplications();
    } catch (error) {
      console.error('Error cancelling application:', error);
      toast.error('เกิดข้อผิดพลาดในการยกเลิกใบสมัคร');
    }
  };

  const handleApplicationClick = (application: EnrichedApplication) => {
    switch (application.status) {
      case 'draft':
      case 'approved':
        setSelectedApplication(application);
        setShowEditForm(true);
        break;
      case 'submitted':
        setShowSubmittedDialog(true);
        break;
      case 'graduated':
      case 'cancelled':
        navigate(`/admin/submissions/${application.id}`);
        break;
    }
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
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-violet"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500">คุณยังไม่มีใบสมัคร</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((application) => {
            const status = statusConfig[application.status];
            const StatusIcon = status.icon;
            
            return (
              <div
                key={application.id}
                onClick={() => handleApplicationClick(application)}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              >
                <div className="relative h-48">
                  <img
                    src={application.project?.imageUrl || 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg'}
                    alt={application.projectTitle}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {application.projectTitle}
                    </h3>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-4 h-4 ${status.className.split(' ')[1]}`} />
                      <span className={cn("text-sm font-medium", status.className)}>
                        {status.label}
                        {application.status === 'graduated' && application.project?.endDate && (
                          <span className="ml-2">
                            {formatDate(application.project.endDate)}
                          </span>
                        )}
                      </span>
                    </div>

                    {application.project?.startDate && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {formatDate(application.project.startDate)}
                          {application.project.endDate && ` - ${formatDate(application.project.endDate)}`}
                        </span>
                      </div>
                    )}
                    
                    {(application.project?.venueName || application.project?.province) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">
                          {application.project.venueName}
                          {application.project.province && ` ${application.project.province}`}
                        </span>
                      </div>
                    )}

                    {application.submittedAt && application.status !== 'graduated' && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Send className="w-4 h-4" />
                        <span className="text-sm">
                          ส่งเมื่อ {formatDate(application.submittedAt)}
                        </span>
                      </div>
                    )}

                    {application.status === 'submitted' && (
                      <div className="mt-4 pt-3 border-t">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setApplicationToCancel(application);
                            setShowCancelDialog(true);
                          }}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          ยกเลิกใบสมัคร
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedApplication && (
        <ProjectSubmitForm
          projectId={selectedApplication.projectId}
          projectTitle={selectedApplication.projectTitle}
          onClose={() => {
            setSelectedApplication(null);
            loadApplications(); // Refresh applications after form closes
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

      <ConfirmDialog
        isOpen={showSubmittedDialog}
        onClose={() => setShowSubmittedDialog(false)}
        onConfirm={() => setShowSubmittedDialog(false)}
        title="ใบสมัครอยู่ระหว่างการพิจารณา"
        message="ใบสมัครของคุณกำลังอยู่ระหว่างการพิจารณา คุณจะสามารถแก้ไขใบสมัครได้หลังจากได้รับการอนุมัติ"
        confirmText="รับทราบ"
        type="warning"
        showCancel={false}
      />
    </div>
  );
}