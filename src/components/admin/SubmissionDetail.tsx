import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, Mail, Phone, RefreshCw, Upload, Play, AlertCircle, X, Star, Clock, CheckCircle2, GraduationCap } from 'lucide-react';
import { doc, getDoc, collection, addDoc, updateDoc, onSnapshot, query, orderBy, where, getDocs, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuthStore } from '../../lib/store';
import { toast } from 'sonner';
import { cn, formatDate, getInitials } from '../../lib/utils';
import { ReviewStep } from '../projects/form-steps/ReviewStep';
import type { Project } from '../../types/project';
import { getMembers } from '../../lib/services/members';
import type { ApplicationMember } from '../../types/member';
import { filmCrewRoles } from '../../types/member';
import { VideoSubmission } from './VideoSubmission';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  text: string;
  rating: number;
  createdAt: string;
}

interface Video {
  id: string;
  videoUrl: string;
  title: string;
  groupName: string;
  school: string;
  createdAt: string;
  updatedAt: string;
  rating: number;
  applicationId: string;
}

const roleColors: Record<string, { bg: string; text: string }> = {
  'admin': { bg: 'bg-violet-100', text: 'text-violet-800' },
  'director': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'producer': { bg: 'bg-green-100', text: 'text-green-800' },
  'screenwriter': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'cinematographer': { bg: 'bg-orange-100', text: 'text-orange-800' },
  'editor': { bg: 'bg-red-100', text: 'text-red-800' },
  'assistant director': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  'sound recorder': { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  'artDirector': { bg: 'bg-teal-100', text: 'text-teal-800' },
  'costumeDesigner': { bg: 'bg-pink-100', text: 'text-pink-800' },
  'actor': { bg: 'bg-purple-100', text: 'text-purple-800' },
  'productionManager': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  'teacher': { bg: 'bg-amber-100', text: 'text-amber-800' },
};

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
    label: 'จบการอบรม',
    icon: GraduationCap,
    className: 'text-violet-700 bg-violet-100',
  }
};

const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const COMMENTS_PER_PAGE = 10;

export function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [application, setApplication] = useState<any>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [members, setMembers] = useState<ApplicationMember[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [page, setPage] = useState(1);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    if (!id || !user) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        // Load application data
        const applicationRef = doc(db, 'applications', id);
        const applicationSnap = await getDoc(applicationRef);

        if (!applicationSnap.exists()) {
          toast.error('ไม่พบข้อมูลใบสมัคร');
          navigate('/admin/submissions');
          return;
        }

        const appData = applicationSnap.data();
        setApplication(appData);
        setAverageRating(appData.rating || 0);

        // Load project data
        const projectRef = doc(db, 'projects', appData.projectId);
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
          setProject({
            id: projectSnap.id,
            ...projectSnap.data()
          } as Project);
        }

        // Load videos from shortfilms collection
        const shortfilmsRef = collection(db, 'shortfilms');
        const shortfilmsQuery = query(
          shortfilmsRef,
          where('applicationId', '==', id),
          orderBy('createdAt', 'desc')
        );
        const shortfilmsSnap = await getDocs(shortfilmsQuery);
        const videosData = shortfilmsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Video[];
        setVideos(videosData);

        if (videosData.length > 0) {
          setSelectedVideo(videosData[0]);
        }

        // Load members
        await loadMembers();

        // Subscribe to comments with pagination
        const commentsRef = collection(db, `applications/${id}/comments`);
        const q = query(
          commentsRef,
          orderBy('createdAt', 'desc')
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const commentsData: Comment[] = [];
          snapshot.forEach((doc) => {
            commentsData.push({ id: doc.id, ...doc.data() } as Comment);
          });
          
          setComments(commentsData);
          
          if (commentsData.length > 0) {
            const avg = commentsData.reduce((acc, curr) => acc + curr.rating, 0) / commentsData.length;
            setAverageRating(Number(avg.toFixed(1)));
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('โหลดข้อมูลไม่สำเร็จ');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, user, navigate]);

  const loadMembers = async () => {
    if (!id) return;
    
    try {
      setIsLoadingMembers(true);
      const membersList = await getMembers(id);
      setMembers(membersList);
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('โหลดข้อมูลสมาชิกไม่สำเร็จ');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!id || !user || !newRating || !newComment) return;

    try {
      setIsSubmitting(true);
      const commentsRef = collection(db, `applications/${id}/comments`);
      
      await addDoc(commentsRef, {
        userId: user.id,
        userName: user.fullName,
        userProfileImage: user.profileImage,
        text: newComment,
        rating: newRating,
        createdAt: new Date().toISOString()
      });

      const newAverage = comments.length > 0
        ? (comments.reduce((acc, curr) => acc + curr.rating, 0) + newRating) / (comments.length + 1)
        : newRating;

      const applicationRef = doc(db, 'applications', id);
      await updateDoc(applicationRef, {
        rating: Number(newAverage.toFixed(1)),
        updatedAt: new Date().toISOString()
      });

      setNewComment('');
      setNewRating(0);
      toast.success('บันทึกการประเมินสำเร็จ');
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('บันทึกการประเมินไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (!id) return;

    try {
      const applicationRef = doc(db, 'applications', id);
      await updateDoc(applicationRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      setApplication(prev => ({
        ...prev,
        status: newStatus
      }));

      toast.success('อัพเดทสถานะสำเร็จ');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('อัพเดทสถานะไม่สำเร็จ');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-violet"></div>
      </div>
    );
  }

  if (!application || !project) return null;

  const projectLogo = project.tags?.includes('CineBridge')
    ? "https://firebasestorage.googleapis.com/v0/b/ofos-filmcamp.appspot.com/o/sitefiles%2FProject%20Logos%2FAsset%204%403x.png?alt=media&token=ba4e828c-3c6a-4c1f-8bb8-d47c18406c0b"
    : project.tags?.includes('NextFrame')
    ? "https://firebasestorage.googleapis.com/v0/b/ofos-filmcamp.appspot.com/o/sitefiles%2FProject%20Logos%2FAsset%202%403x.png?alt=media&token=5b137529-cae9-4124-8ce9-c1c65c8cc3e8"
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative h-48 rounded-lg overflow-hidden">
        <img
          src={project.imageUrl}
          alt={project.title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
        
        <div className="relative h-full flex items-center px-8">
          {projectLogo && (
            <img
              src={projectLogo}
              alt="Project Logo"
              className="h-24 object-contain mr-6"
              loading="lazy"
            />
          )}
          
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white mb-2">
              {application.projectTitle}
            </h2>
            <p className="text-white/80 text-lg">
              {application.groupName}
            </p>
          </div>
          
          <button
            onClick={() => navigate('/admin/submissions')}
            className="absolute top-4 right-4 text-white hover:text-white/80"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Application Details */}
      <ReviewStep formData={application} />

      {/* Members Section */}
      {(user?.role === 'admin' || user?.role === 'editor' || user?.role === 'commentor') && (
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-semibold text-gray-900">สมาชิกในกลุ่ม</h3>
            <button
              onClick={loadMembers}
              className="flex items-center gap-2 text-brand-violet hover:text-brand-violet-light text-lg"
              disabled={isLoadingMembers}
            >
              <RefreshCw className={cn("w-5 h-5", isLoadingMembers && "animate-spin")} />
              รีเฟรชข้อมูล
            </button>
          </div>

          {isLoadingMembers ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-violet mx-auto"></div>
              <p className="mt-4 text-gray-500 text-lg">กำลังโหลดข้อมูลสมาชิก...</p>
            </div>
          ) : members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-6 py-3 text-left">#</th>
                    <th className="px-6 py-3 text-left">ชื่อ-นามสกุล</th>
                    <th className="px-6 py-3 text-left">ชื่อเล่น</th>
                    <th className="px-6 py-3 text-left">บทบาท</th>
                    <th className="px-6 py-3 text-left">เพศ</th>
                    <th className="px-6 py-3 text-left">อายุ</th>
                    <th className="px-6 py-3 text-left">ข้อมูลติดต่อ</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, index) => (
                    <tr key={member.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-lg">{member.fullNameTH}</div>
                          <div className="text-gray-500 text-xs">{member.fullNameEN}</div>
                          {member.isOwner && (
                            <span className="inline-block px-2 py-0.5 bg-brand-violet text-white text-xs rounded-full mt-1">
                              ผู้ติดต่อ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-lg">{member.nickname}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(member.roles || []).map((role) => {
                            const roleConfig = filmCrewRoles.find(r => r.id === role);
                            const colors = roleColors[role] || { bg: 'bg-gray-100', text: 'text-gray-700' };
                            return (
                              <span
                                key={role}
                                className={cn(
                                  "px-2 py-1 rounded-full text-xs",
                                  colors.bg,
                                  colors.text
                                )}
                              >
                                {roleConfig?.emoji} {roleConfig?.label || role}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-lg">
                        {member.gender === 'male' ? 'ชาย' :
                         member.gender === 'female' ? 'หญิง' :
                         member.gender === 'lgbtqm' ? 'LGBTQ+M' :
                         member.gender === 'lgbtqf' ? 'LGBTQ+F' : '-'}
                      </td>
                      <td className="px-6 py-4 text-lg">{member.age}</td>
                      <td className="px-6 py-4">
                        {(member.roles.includes('admin') || member.isOwner) && (
                          <div className="text-sm space-y-1">
                            {member.email && (
                              <a
                                href={`mailto:${member.email}`}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                              >
                                <Mail className="w-4 h-4" />
                                <span>{member.email}</span>
                              </a>
                            )}
                            {member.phone && (
                              <a
                                href={`tel:${member.phone}`}
                                className="flex items-center gap-1 text-green-600 hover:text-green-800"
                              >
                                <Phone className="w-4 h-4" />
                                <span>{member.phone}</span>
                              </a>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">ยังไม่มีสมาชิกในกลุ่ม</p>
            </div>
          )}
        </div>
      )}

      {/* Comments Section */}
      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">ประเมินใบสมัคร</h3>
          <div className="flex items-center gap-4">
            <select
              value={application.status}
              onChange={handleStatusChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
            >
              {Object.entries(statusConfig).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {comments.length > 0 && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "w-5 h-5",
                      star <= averageRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    )}
                  />
                ))}
                <span className="ml-2 text-lg font-medium text-gray-700">
                  {averageRating.toFixed(1)}/5
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  ({comments.length} ความคิดเห็น)
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              คะแนน
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setNewRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={cn(
                      "w-6 h-6",
                      star <= newRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ความคิดเห็น
            </label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
              placeholder="เขียนความคิดเห็นของคุณ..."
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmitComment}
              disabled={!newRating || !newComment || isSubmitting}
              className="px-4 py-2 bg-brand-violet text-white rounded-lg hover:bg-brand-violet-light disabled:opacity-50"
            >
              บันทึกการประเมิน
            </button>
          </div>
        </div>

        {comments.length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-medium text-gray-900 mb-4">ความคิดเห็นทั้งหมด</h4>
            <div className="space-y-4">
              {comments.slice(0, page * COMMENTS_PER_PAGE).map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {comment.userProfileImage ? (
                        <img
                          src={comment.userProfileImage}
                          alt={comment.userName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-brand-violet text-white flex items-center justify-center font-medium">
                          {getInitials(comment.userName)}
                        </div>
                      )}
                      <div className="font-medium text-gray-900">{comment.userName}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "w-4 h-4",
                            star <= comment.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                          )}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">{comment.rating}/5</span>
                    </div>
                  </div>
                  <p className="text-gray-700">{comment.text}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    {formatDate(comment.createdAt)}
                  </div>
                </div>
              ))}
            </div>

            {comments.length > page * COMMENTS_PER_PAGE && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 text-brand-violet border border-brand-violet rounded-lg hover:bg-brand-violet hover:text-white transition-colors"
                >
                  โหลดความคิดเห็นเพิ่มเติม
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Section */}
      <VideoSubmission
        applicationId={id}
        projectId={project?.id}
        projectImage={project?.imageUrl}
        videos={videos}
        selectedVideo={selectedVideo}
        onVideoSelect={setSelectedVideo}
        onVideosChange={setVideos}
      />
    </div>
  );
}