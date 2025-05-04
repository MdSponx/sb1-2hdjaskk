import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, Mail, Phone, ArrowLeft } from 'lucide-react';
import { getProjectById } from '../../lib/services/projects';
import { useAuthStore } from '../../lib/store';
import { type Project } from '../../types/project';
import { toast } from 'sonner';
import { formatDate } from '../../lib/utils';
import { ProjectSubmitForm } from './ProjectSubmitForm';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [showSubmittedDialog, setShowSubmittedDialog] = useState(false);
  const [existingApplication, setExistingApplication] = useState<{ id: string; status: string } | null>(null);

  useEffect(() => {
    if (id) {
      loadProject(id);
    }
  }, [id]);

  useEffect(() => {
    // Check if there's a stored project ID in sessionStorage
    const storedProjectId = sessionStorage.getItem('pendingProjectId');
    if (storedProjectId && user && id === storedProjectId) {
      // Clear the stored ID and show the form
      sessionStorage.removeItem('pendingProjectId');
      checkExistingApplication();
    }
  }, [user, id]);

  const loadProject = async (projectId: string) => {
    try {
      setIsLoading(true);
      const data = await getProjectById(projectId);
      if (!data || !data.isPublic) {
        navigate('/projects');
        return;
      }
      setProject(data);
      if (user) {
        await checkExistingApplication();
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('โหลดข้อมูลโครงการไม่สำเร็จ');
      navigate('/projects');
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingApplication = async () => {
    if (!user || !id) return;

    try {
      const applicationsRef = collection(db, 'applications');
      const q = query(
        applicationsRef,
        where('projectId', '==', id),
        where('userId', '==', user.id)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const applicationData = querySnapshot.docs[0].data();
        setExistingApplication({
          id: querySnapshot.docs[0].id,
          status: applicationData.status
        });
      } else {
        setExistingApplication(null);
      }
    } catch (error) {
      console.error('Error checking existing application:', error);
    }
  };

  const handleApplyClick = () => {
    if (!user) {
      // Store the project ID in sessionStorage before redirecting
      sessionStorage.setItem('pendingProjectId', id || '');
      navigate('/register', { 
        state: { 
          redirectTo: `/projects/${id}`,
          message: 'กรุณาสร้างบัญชีก่อนสมัครเข้าร่วมโครงการ'
        }
      });
      return;
    }

    if (existingApplication) {
      if (existingApplication.status === 'draft') {
        setShowSubmitForm(true);
      } else if (existingApplication.status === 'submitted') {
        setShowSubmittedDialog(true);
      }
    } else {
      setShowSubmitForm(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-cream py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-violet"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brand-cream py-20">
      {showSubmitForm ? (
        <ProjectSubmitForm
          projectId={project.id}
          projectTitle={project.title}
          onClose={() => setShowSubmitForm(false)}
          applicationId={existingApplication?.id}
        />
      ) : (
        <div className="container mx-auto px-4 max-w-6xl">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center text-brand-navy hover:text-brand-violet mb-8"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            กลับไปหน้าโครงการทั้งหมด
          </button>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <img
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <h1 className="text-2xl font-semibold text-brand-navy mb-4">
                {project.title}
              </h1>
              
              <div className="space-y-4 mb-6">
                {project.startDate && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-5 h-5" />
                    <span>
                      {formatDate(project.startDate)}
                      {project.endDate && ` - ${formatDate(project.endDate)}`}
                    </span>
                  </div>
                )}
                
                {project.venueName && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-5 h-5" />
                    <span>
                      {project.venueName}
                      {project.province && ` ${project.province}`}
                    </span>
                  </div>
                )}
                
                {project.maxAttendees && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-5 h-5" />
                    <span>รับสมัครผู้เข้าร่วม {project.maxAttendees} คน</span>
                  </div>
                )}
              </div>

              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: project.description }} />
              
              <div className="mt-6 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Contact Persons */}
              {project.contactPersons && project.contactPersons.length > 0 && (
                <div className="mt-8 pt-8 border-t">
                  <h2 className="text-lg font-semibold text-brand-navy mb-4">
                    ผู้ประสานงาน
                  </h2>
                  <div className="space-y-4">
                    {project.contactPersons.map((contact) => (
                      <div key={contact.id} className="flex items-center gap-4">
                        {contact.profileImage ? (
                          <img
                            src={contact.profileImage}
                            alt={contact.fullName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-brand-violet text-white flex items-center justify-center font-medium">
                            {contact.fullName[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-brand-navy">
                            {contact.fullName}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-sm">
                            <a
                              href={`mailto:${contact.email}`}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            >
                              <Mail className="w-4 h-4" />
                              <span>{contact.email}</span>
                            </a>
                            {contact.phoneNumber && (
                              <a
                                href={`tel:${contact.phoneNumber}`}
                                className="flex items-center gap-1 text-green-600 hover:text-green-800"
                              >
                                <Phone className="w-4 h-4" />
                                <span>{contact.phoneNumber}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply Button */}
              <div className="mt-8 pt-8 border-t">
                <button
                  onClick={handleApplyClick}
                  className="w-full btn-primary"
                >
                  {!user ? 'เข้าสู่ระบบเพื่อสมัคร' : 
                   existingApplication?.status === 'submitted' ? 'ดูใบสมัครของคุณ' :
                   existingApplication?.status === 'draft' ? 'แก้ไขใบสมัคร' : 
                   'เริ่มกรอกใบสมัคร'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showSubmittedDialog}
        onClose={() => setShowSubmittedDialog(false)}
        onConfirm={() => {
          setShowSubmittedDialog(false);
          navigate('/user/applications');
        }}
        title="คุณได้ส่งใบสมัครแล้ว"
        message="คุณได้ส่งใบสมัครสำหรับโครงการนี้ไปแล้ว คุณสามารถติดตามสถานะใบสมัครได้ที่หน้าการสมัครของคุณ"
        confirmText="ไปที่หน้าการสมัคร"
        cancelText="ปิด"
        type="warning"
      />
    </div>
  );
}