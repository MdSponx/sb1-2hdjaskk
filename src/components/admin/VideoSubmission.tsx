import React, { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, FileText, Loader2, AlertCircle, Star, Play, Info, Image } from 'lucide-react';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import type { MediaPlayerInstance } from '@vidstack/react';
import { DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, getDocs, getDoc, query, orderBy, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import { cn, formatDate, getInitials } from '../../lib/utils';
import { useAuthStore } from '../../lib/store';
import { toast } from 'sonner';
import { testFirebaseStorageCors, createBlobUrl, showCorsConfigInstructions } from '../../lib/firebase-cors-helper';

interface Video {
  id: string;
  videoUrl: string;
  posterUrl?: string | null;
  title: string;
  groupName: string;
  school: string;
  createdAt: string;
  updatedAt: string;
  rating: number;
  applicationId: string;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  text: string;
  rating: number;
  createdAt: string;
}

interface VideoSubmissionProps {
  applicationId?: string;
  projectId?: string;
  projectImage?: string;
  videos: Video[];
  selectedVideo: Video | null;
  onVideoSelect: (video: Video | null) => void;
  onVideosChange: (videos: Video[]) => void;
  projectTitle?: string;
  groupName?: string;
  school?: string;
}

const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Project theme mapping
type ThemeKey = 'me-and-world' | 'me-and-city' | 'me-and-home' | 'me-and-you' | 'me-and-myself';

interface ThemeInfo {
  label: string;
  emojis: string;
}

const projectThemes: Record<ThemeKey, ThemeInfo> & { [key: string]: ThemeInfo | undefined } = {
  'me-and-world': { label: 'ฉันกับโลก', emojis: '🧍🏻🌏' },
  'me-and-city': { label: 'ฉันกับเมือง', emojis: '🧍🏻🏙️' },
  'me-and-home': { label: 'ฉันกับบ้าน', emojis: '🧍🏻🏠' },
  'me-and-you': { label: 'ฉันกับเธอ', emojis: '🧍🏻💑' },
  'me-and-myself': { label: 'ฉันกับฉัน', emojis: '🧍🏻🪞' },
};

export function VideoSubmission({
  applicationId,
  projectId,
  projectImage,
  videos,
  selectedVideo,
  onVideoSelect,
  onVideosChange,
  projectTitle,
  groupName,
  school,
}: VideoSubmissionProps) {
  const { user } = useAuthStore();
  const playerRef = useRef<MediaPlayerInstance>(null);
  const [videoComments, setVideoComments] = useState<Comment[]>([]);
  const [newVideoComment, setNewVideoComment] = useState('');
  const [newVideoRating, setNewVideoRating] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [projectTheme, setProjectTheme] = useState<string>('');
  const [logline, setLogline] = useState<string>('');
  const [isLoglineExpanded, setIsLoglineExpanded] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentText, setEditedCommentText] = useState('');
  const [editedCommentRating, setEditedCommentRating] = useState(0);
  const [isPosterUploading, setIsPosterUploading] = useState(false);
  const [posterUploadProgress, setPosterUploadProgress] = useState(0);
  const [tempPosterUrl, setTempPosterUrl] = useState<string | null>(null);
  
  // Load first video info on component mount
  useEffect(() => {
    if (videos.length > 0) {
      // Always select the first video on component mount
      const firstVideo = videos[0];
      handleVideoSelect(firstVideo);
    }
  }, [videos.length]);
  
  // Function to ensure Firebase URL works with video player
  const getPlayableUrl = (url: string) => {
    // Return the original URL without modifications
    // Adding timestamp parameters can sometimes cause issues with video playback
    return url;
  };
  
  // Function to check if a Firebase Storage URL is accessible
  const checkUrlAccessibility = async (url: string) => {
    try {
      setIsVideoLoading(true);
      const response = await fetch(url, { method: 'HEAD' });
      console.log('URL accessibility check:', response);
      
      if (response.ok) {
        toast.success('วิดีโอ URL สามารถเข้าถึงได้');
        return true;
      } else {
        const errorMsg = `ไม่สามารถเข้าถึง URL ได้: ${response.status} ${response.statusText}`;
        toast.error(errorMsg);
        setVideoError(errorMsg);
        return false;
      }
    } catch (error) {
      console.error('Error checking URL accessibility:', error);
      const errorMsg = `เกิดข้อผิดพลาดในการเข้าถึง URL: ${error instanceof Error ? error.message : 'Unknown error'}`;
      toast.error(errorMsg);
      setVideoError(errorMsg);
      return false;
    } finally {
      setIsVideoLoading(false);
    }
  };
  
  // Function to check CORS configuration
  const checkCorsConfiguration = async (url: string) => {
    try {
      setIsVideoLoading(true);
      
      // First, check if the URL is accessible with a simple HEAD request
      const headResponse = await fetch(url, { method: 'HEAD' });
      console.log('HEAD response:', headResponse);
      
      if (!headResponse.ok) {
        const errorMsg = `ไม่สามารถเข้าถึง URL ได้: ${headResponse.status} ${headResponse.statusText}`;
        toast.error(errorMsg);
        setVideoError(errorMsg);
        return false;
      }
      
      // Check CORS headers
      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-methods',
        'access-control-allow-headers'
      ];
      
      let corsIssues = [];
      
      if (!headResponse.headers.has('access-control-allow-origin')) {
        corsIssues.push('ไม่พบ Access-Control-Allow-Origin header');
      }
      
      if (corsIssues.length > 0) {
        const errorMsg = `พบปัญหา CORS: ${corsIssues.join(', ')}`;
        toast.error(errorMsg);
        console.error(errorMsg);
        
        // Log all headers for debugging
        console.log('Response headers:');
        headResponse.headers.forEach((value, key) => {
          console.log(`${key}: ${value}`);
        });
        
        setVideoError(errorMsg);
        return false;
      }
      
      toast.success('การตั้งค่า CORS ถูกต้อง');
      return true;
    } catch (error) {
      console.error('Error checking CORS configuration:', error);
      const errorMsg = `เกิดข้อผิดพลาดในการตรวจสอบ CORS: ${error instanceof Error ? error.message : 'Unknown error'}`;
      toast.error(errorMsg);
      setVideoError(errorMsg);
      return false;
    } finally {
      setIsVideoLoading(false);
    }
  };

  const loadVideoComments = async (videoId: string) => {
    try {
      const commentsRef = collection(db, `shortfilms/${videoId}/movieComments`);
      const q = query(commentsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      
      setVideoComments(commentsData);
    } catch (error) {
      console.error('Error loading video comments:', error);
    }
  };

  // Function to fetch application data
  const fetchApplicationData = async (applicationId: string) => {
    try {
      const applicationRef = doc(db, 'applications', applicationId);
      const applicationSnap = await getDoc(applicationRef);
      
      if (applicationSnap.exists()) {
        const applicationData = applicationSnap.data();
        setProjectTheme(applicationData.projectTheme || '');
        setLogline(applicationData.logline || '');
        console.log('Retrieved application data:', applicationData);
      } else {
        setProjectTheme('');
        setLogline('');
      }
    } catch (error) {
      console.error('Error fetching application data:', error);
      setProjectTheme('');
      setLogline('');
    }
  };

  // Function to handle poster upload
  const handlePosterUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedVideo) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('รองรับไฟล์ภาพ JPG, PNG และ WebP เท่านั้น');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    try {
      setIsPosterUploading(true);
      setPosterUploadProgress(0);

      // Create a reference to the storage location
      const storageRef = ref(storage, `shortfilms/${selectedVideo.applicationId}/posters/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setPosterUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Error uploading poster:', error);
          toast.error('อัพโหลดโปสเตอร์ไม่สำเร็จ');
          setIsPosterUploading(false);
        },
        async () => {
          try {
            const posterUrl = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Update the video document with the poster URL
            const videoRef = doc(db, 'shortfilms', selectedVideo.id);
            await updateDoc(videoRef, {
              posterUrl,
              updatedAt: new Date().toISOString()
            });

            // Update local state
            const updatedVideo = { ...selectedVideo, posterUrl };
            onVideoSelect(updatedVideo);
            
            // Update videos list
            const updatedVideos = videos.map(video => 
              video.id === selectedVideo.id ? updatedVideo : video
            );
            onVideosChange(updatedVideos);
            
            // Set temporary poster URL for immediate display
            setTempPosterUrl(posterUrl);
            
            toast.success('อัพโหลดโปสเตอร์สำเร็จ');
          } catch (error) {
            console.error('Error updating video with poster:', error);
            toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
          } finally {
            setIsPosterUploading(false);
            setPosterUploadProgress(0);
          }
        }
      );
    } catch (error) {
      console.error('Error starting poster upload:', error);
      toast.error('อัพโหลดโปสเตอร์ไม่สำเร็จ');
      setIsPosterUploading(false);
      setPosterUploadProgress(0);
    }
  };

  const handleVideoSelect = (video: Video) => {
    console.log('Selected video:', video);
    onVideoSelect(video);
    loadVideoComments(video.id);
    setNewVideoComment('');
    setNewVideoRating(0);
    setVideoError(null); // Reset error state when selecting a new video
    setIsVideoLoading(true); // Show loading state
    setIsLoglineExpanded(false); // Reset logline expanded state
    setTempPosterUrl(null); // Reset temporary poster URL
    
    // Fetch application data if applicationId is available
    if (video.applicationId) {
      fetchApplicationData(video.applicationId);
    } else {
      setProjectTheme('');
      setLogline('');
    }
    
    // Reset video player
    if (playerRef.current) {
      playerRef.current.currentTime = 0;
      
      // Force reload the video source
      setTimeout(() => {
        if (playerRef.current) {
          // Try to play the video after a short delay
          try {
            playerRef.current.play().catch(err => {
              console.log('Auto-play prevented:', err);
            });
          } catch (err) {
            console.log('Error playing video:', err);
          }
        }
      }, 100);
    }
  };

  const handleVideoCommentSubmit = async () => {
    if (!selectedVideo || !user || !newVideoRating || !newVideoComment) return;

    try {
      setIsSubmitting(true);
      const commentsRef = collection(db, `shortfilms/${selectedVideo.id}/movieComments`);
      
      await addDoc(commentsRef, {
        userId: user.id,
        userName: user.fullName,
        userProfileImage: user.profileImage,
        text: newVideoComment,
        rating: newVideoRating,
        createdAt: new Date().toISOString()
      });

      // Update video rating
      const newAverage = videoComments.length > 0
        ? (videoComments.reduce((acc, curr) => acc + curr.rating, 0) + newVideoRating) / (videoComments.length + 1)
        : newVideoRating;

      const newRating = Number(newAverage.toFixed(1));
      
      // Update in database
      const videoRef = doc(db, 'shortfilms', selectedVideo.id);
      await updateDoc(videoRef, {
        rating: newRating,
        updatedAt: new Date().toISOString()
      });

      // Update local state to immediately show the new rating
      const updatedVideo = { ...selectedVideo, rating: newRating };
      onVideoSelect(updatedVideo);
      
      // Update the videos array to reflect the new rating
      const updatedVideos = videos.map(video => 
        video.id === selectedVideo.id ? updatedVideo : video
      );
      onVideosChange(updatedVideos);

      setNewVideoComment('');
      setNewVideoRating(0);
      loadVideoComments(selectedVideo.id);
      toast.success('บันทึกการประเมินสำเร็จ');
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('บันทึกการประเมินไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVideoDelete = async (videoId: string) => {
    try {
      // Delete the video document from Firestore
      const videoRef = doc(db, 'shortfilms', videoId);
      await deleteDoc(videoRef);
      
      // Update the videos list
      const updatedVideos = videos.filter(video => video.id !== videoId);
      onVideosChange(updatedVideos);
      
      // If the deleted video was selected, select another video or set to null
      if (selectedVideo?.id === videoId) {
        if (updatedVideos.length > 0) {
          handleVideoSelect(updatedVideos[0]);
        } else {
          onVideoSelect(null);
        }
      }
      
      toast.success('ลบวิดีโอสำเร็จ');
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('ลบวิดีโอไม่สำเร็จ');
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !applicationId || !user) return;

    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      toast.error('รองรับไฟล์ MP4 และ MOV เท่านั้น');
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 500MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Fetch data from the applications collection
      let shortFilmTitle = '';
      let appGroupName = '';
      let appSchool = '';
      
      try {
        const applicationRef = doc(db, 'applications', applicationId);
        const applicationSnap = await getDoc(applicationRef);
        
        if (applicationSnap.exists()) {
          const applicationData = applicationSnap.data();
          shortFilmTitle = applicationData.shortFilmTitle || '';
          appGroupName = applicationData.groupName || '';
          appSchool = applicationData.school || '';
          console.log('Retrieved data from application:', { shortFilmTitle, appGroupName, appSchool });
        }
      } catch (error) {
        console.error('Error fetching application data:', error);
        // Continue with upload even if we couldn't get the application data
      }

      const storageRef = ref(storage, `shortfilms/${applicationId}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Error uploading video:', error);
          toast.error('อัพโหลดวิดีโอไม่สำเร็จ');
          setIsUploading(false);
        },
        async () => {
          try {
            const videoUrl = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Create new shortfilm document
            const shortfilmRef = doc(collection(db, 'shortfilms'));
            const videoData = {
              applicationId,
              videoUrl,
              // Use shortFilmTitle from application if available, otherwise fall back to projectTitle or empty string
              title: shortFilmTitle || projectTitle || '',
              // Use groupName and school from application if available, otherwise fall back to props
              groupName: appGroupName || groupName || '',
              school: appSchool || school || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              rating: 0,
              posterUrl: null // Initialize with null, can be updated later
            };
            
            await setDoc(shortfilmRef, videoData);
            
            const newVideo = { id: shortfilmRef.id, ...videoData };
            
            // Update videos state and select new video
            const updatedVideos = [newVideo, ...videos];
            onVideosChange(updatedVideos);
            handleVideoSelect(newVideo);
            
            toast.success('อัพโหลดวิดีโอสำเร็จ');
          } catch (error) {
            console.error('Error creating documents:', error);
            toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
          } finally {
            setIsUploading(false);
            setUploadProgress(0);
          }
        }
      );
    } catch (error) {
      console.error('Error starting upload:', error);
      toast.error('อัพโหลดวิดีโอไม่สำเร็จ');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6 max-w-full">
      <h3 className="text-2xl font-semibold text-gray-900">วิดีโอผลงาน</h3>
      
      {/* Combined Poster Uploader and Requirements - Moved to top */}
      {selectedVideo && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Poster Uploader - Left side */}
            <div className="lg:col-span-1">
              <p className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-1">
                <Image className="w-4 h-4 text-amber-500" />
                <span>โปสเตอร์วิดีโอ</span>
              </p>
              
              {(selectedVideo.posterUrl || tempPosterUrl) ? (
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={tempPosterUrl || selectedVideo.posterUrl || ''}
                    alt="Video Poster"
                    className="w-full aspect-[2/3] object-cover"
                  />
                  <button
                    onClick={async () => {
                      if (!selectedVideo) return;
                      
                      try {
                        // Update the video document to remove the poster URL
                        const videoRef = doc(db, 'shortfilms', selectedVideo.id);
                        await updateDoc(videoRef, {
                          posterUrl: null,
                          updatedAt: new Date().toISOString()
                        });
                        
                        // Update local state
                        const updatedVideo = { ...selectedVideo };
                        delete updatedVideo.posterUrl;
                        onVideoSelect(updatedVideo);
                        
                        // Update videos list
                        const updatedVideos = videos.map(video => 
                          video.id === selectedVideo.id ? updatedVideo : video
                        );
                        onVideosChange(updatedVideos);
                        
                        // Reset temporary poster URL
                        setTempPosterUrl(null);
                        
                        toast.success('ลบโปสเตอร์สำเร็จ');
                      } catch (error) {
                        console.error('Error removing poster:', error);
                        toast.error('ลบโปสเตอร์ไม่สำเร็จ');
                      }
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <div className="w-full aspect-[2/3] border-2 border-dashed border-amber-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-amber-500 transition-colors bg-amber-50/50">
                    <Image className="w-6 h-6 text-amber-500" />
                    <span className="text-sm text-amber-700">คลิกเพื่ออัพโหลดโปสเตอร์</span>
                    <span className="text-xs text-amber-600 text-center px-2">อัตราส่วน 2:3 (แนวตั้ง)</span>
                  </div>
                  <input
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(',')}
                    onChange={handlePosterUpload}
                    className="hidden"
                  />
                </label>
              )}
              
              {/* Upload Progress */}
              {isPosterUploading && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-xs text-amber-700 mb-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    กำลังอัพโหลด... {posterUploadProgress}%
                  </div>
                  <div className="w-full h-1.5 bg-amber-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${posterUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Poster Requirements - Right side */}
            <div className="lg:col-span-2">
              <p className="text-sm font-medium text-amber-700 mb-2">ข้อกำหนดการอัพโหลดโปสเตอร์</p>
              <ul className="text-sm text-amber-600 space-y-1">
                <li>• รองรับไฟล์ JPG, PNG และ WebP เท่านั้น</li>
                <li>• ขนาดไฟล์ไม่เกิน 5MB</li>
                <li>• ขนาดแนะนำ: อัตราส่วน 2:3 (แนวตั้ง) เหมือนโปสเตอร์ภาพยนตร์</li>
                <li>• โปสเตอร์จะถูกใช้เป็นภาพปกในการแสดงผลวิดีโอบนหน้าเว็บไซต์</li>
                <li>• ควรใช้ภาพที่สื่อถึงเนื้อหาของวิดีโอและมีความน่าสนใจ</li>
                <li>• หลีกเลี่ยงการใช้ข้อความมากเกินไปในโปสเตอร์</li>
              </ul>
              
              <div className="mt-3 bg-amber-100 p-2 rounded text-xs text-amber-800">
                <p className="flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>คำแนะนำ: โปสเตอร์ที่ดีจะช่วยดึงดูดความสนใจและเพิ่มโอกาสในการรับชมวิดีโอของคุณ</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-full">
        {/* Video Gallery */}
        <div className="lg:col-span-1 space-y-4 w-full">
          <h4 className="text-lg font-medium text-gray-900">รายการวิดีโอ</h4>
          
          <div className="space-y-3">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => handleVideoSelect(video)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors",
                  selectedVideo?.id === video.id
                    ? "bg-brand-violet text-white"
                    : "bg-gray-50 hover:bg-gray-100"
                )}
              >
                <div className="flex gap-3 relative group">
                  <div className="relative w-24 aspect-video rounded-md overflow-hidden bg-black">
                    {/* Delete button for video in left panel */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the parent button click
                        setVideoToDelete(video.id);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    
                    {/* Show poster image if available, otherwise show video thumbnail */}
                    {video.posterUrl ? (
                      <img 
                        src={video.posterUrl} 
                        alt={video.title || 'Video thumbnail'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={getPlayableUrl(video.videoUrl)}
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                    )}
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className={cn(
                        "w-6 h-6",
                        selectedVideo?.id === video.id ? "text-white" : "text-gray-400"
                      )} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium truncate",
                      selectedVideo?.id === video.id ? "text-white" : "text-gray-900"
                    )}>
                      {video.title || 'ไม่มีชื่อ'}
                    </p>
                    <p className={cn(
                      "text-sm truncate",
                      selectedVideo?.id === video.id ? "text-white/80" : "text-gray-500"
                    )}>
                      {video.groupName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "w-3 h-3",
                              star <= (video.rating || 0)
                                ? "text-yellow-400 fill-yellow-400"
                                : selectedVideo?.id === video.id
                                ? "text-white/30"
                                : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                      <span className={cn(
                        "text-xs",
                        selectedVideo?.id === video.id ? "text-white/80" : "text-gray-500"
                      )}>
                        {video.rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Upload Button */}
          <label className="block">
            <div className="w-full h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-violet transition-colors">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">อัพโหลดวิดีโอใหม่</span>
            </div>
            <input
              type="file"
              accept="video/mp4,video/quicktime"
              onChange={handleVideoUpload}
              className="hidden"
            />
          </label>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังอัพโหลด... {uploadProgress}%
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-violet transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Video Upload Conditions - Moved here from the top */}
          <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-3 text-xs">
            <p className="text-blue-700 font-medium mb-1">ข้อกำหนดการอัพโหลดวิดีโอ</p>
            <ul className="text-blue-600 space-y-1">
              <li>• รองรับไฟล์ MP4 และ MOV เท่านั้น</li>
              <li>• ขนาดไฟล์ไม่เกิน 500MB</li>
              <li>• ความละเอียดแนะนำ: 1920x1080 (Full HD)</li>
            </ul>
          </div>
        </div>

        {/* Video Player and Comments */}
        <div className="lg:col-span-2 w-full -mr-6 pr-6">
          {selectedVideo ? (
            <div className="space-y-6 w-full">
              {/* Video Player */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden w-full max-w-full">
                {/* Debug info */}
                <div className="absolute top-0 left-0 bg-black/70 text-white text-xs p-1 z-10">
                  Video URL: {selectedVideo?.videoUrl ? selectedVideo.videoUrl.substring(0, 30) + '...' : 'No URL'}
                </div>
                
                {/* HTML5 video player with source element */}
                {selectedVideo?.videoUrl && (
                  <>
                    {/* Loading indicator */}
                    {isVideoLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-10 h-10 text-white animate-spin" />
                          <p className="text-white mt-2">กำลังโหลดวิดีโอ...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Error display */}
                    {videoError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
                          <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />
                            <div>
                              <p className="font-bold">เกิดข้อผิดพลาดในการเล่นวิดีโอ</p>
                              <p className="text-sm">{videoError}</p>
                              <p className="text-sm mt-2">
                                อาจเกิดจากปัญหา CORS หรือรูปแบบวิดีโอไม่รองรับ
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Thumbnail video (visible until main video plays) */}
                    <div className="absolute inset-0 z-10" style={{ display: isVideoLoading ? 'block' : 'none' }}>
                      <video
                        key={`thumb-${selectedVideo.id}`}
                        className="w-full h-full object-cover"
                        src={getPlayableUrl(selectedVideo.videoUrl)}
                        preload="metadata"
                        muted
                        autoPlay
                      />
                    </div>
                    
                    {/* Main playable video */}
                    <video 
                      key={selectedVideo.id} // Add key prop to force re-rendering when video changes
                      className="w-full h-full"
                      controls
                      playsInline
                      preload="auto" // Ensure video is preloaded
                      onLoadStart={() => {
                        console.log("Video load started");
                        setIsVideoLoading(true);
                        setVideoError(null);
                      }}
                      onLoadedData={() => {
                        console.log("Video data loaded");
                        setIsVideoLoading(false);
                      }}
                      onCanPlay={() => {
                        console.log("Video can play");
                        setIsVideoLoading(false);
                      }}
                      onPlaying={() => {
                        console.log("Video is playing");
                        setIsVideoLoading(false);
                        setVideoError(null);
                      }}
                      onError={(e) => {
                        console.error("Native video error:", e);
                        console.log("Video URL:", selectedVideo.videoUrl);
                        setIsVideoLoading(false);
                        
                        // Log the error code if available
                        const target = e.target as HTMLVideoElement;
                        if (target.error) {
                          console.error("Error code:", target.error.code);
                          console.error("Error message:", target.error.message);
                          
                          // Set error message based on error code
                          switch (target.error.code) {
                            case 1: // MEDIA_ERR_ABORTED
                              setVideoError("การเล่นวิดีโอถูกยกเลิก");
                              break;
                            case 2: // MEDIA_ERR_NETWORK
                              setVideoError("เกิดข้อผิดพลาดเครือข่าย อาจเกิดจากการตั้งค่า CORS ไม่ถูกต้อง");
                              break;
                            case 3: // MEDIA_ERR_DECODE
                              setVideoError("ไม่สามารถถอดรหัสวิดีโอได้ รูปแบบไฟล์อาจไม่รองรับ");
                              break;
                            case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                              setVideoError("รูปแบบวิดีโอไม่รองรับหรือ URL ไม่ถูกต้อง");
                              break;
                            default:
                              setVideoError("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
                          }
                        } else {
                          setVideoError("เกิดข้อผิดพลาดในการเล่นวิดีโอ");
                        }
                      }}
                    >
                      {/* Try multiple source formats */}
                      <source 
                        src={getPlayableUrl(selectedVideo.videoUrl)} 
                        type="video/mp4" 
                      />
                      <source 
                        src={getPlayableUrl(selectedVideo.videoUrl)} 
                        type="video/quicktime" 
                      />
                      Your browser does not support the video tag.
                    </video>
                    
                    {/* Removed the video button from here */}
                    
                    {/* Removed direct link for debugging */}
                  </>
                )}
                
                {/* We've removed the MediaPlayer component and are using the native HTML5 video player instead */}
              </div>

              {/* Video Info */}
              <div className="space-y-4 w-full">
                <div className="w-full">
                  <div className="space-y-3 w-full">
                    {/* Title */}
                    <h4 className="text-lg font-medium text-gray-900 mb-3 pr-4">
                      {selectedVideo.title || 'ไม่มีชื่อ'}
                    </h4>
                    
                    {/* Group Name, Theme and Rating in same row */}
                    <div className="flex justify-between items-center pr-4">
                      {/* Group Name on left */}
                      <p className="text-gray-500">{selectedVideo.groupName}</p>
                      
                      {/* Theme and Rating on right */}
                      <div className="flex flex-wrap items-center gap-3">
                        {projectTheme && (
                          <span className="inline-flex items-center bg-brand-violet/10 text-brand-violet text-xs font-medium px-2 py-1 rounded-full">
                            <span className="mr-1">{projectThemes[projectTheme]?.emojis || '🎭'}</span> 
                            {projectThemes[projectTheme]?.label || projectTheme}
                          </span>
                        )}
                        
                        {selectedVideo.rating > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={cn(
                                    "w-4 h-4",
                                    star <= selectedVideo.rating
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  )}
                                />
                              ))}
                            </div>
                            <div className="text-xs font-medium text-gray-700">
                              {selectedVideo.rating.toFixed(1)}/5
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Poster uploader moved to top left */}
                    
                    {/* Logline with show more/less button */}
                    {logline && (
                      <div className="mt-4 pr-4">
                        <p className="flex items-center gap-1 text-sm text-gray-700 font-medium mb-1">
                          <span>📝</span> เรื่องย่อ:
                        </p>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-700">
                            {isLoglineExpanded || logline.length <= 150 
                              ? logline 
                              : `${logline.substring(0, 150)}...`}
                          </p>
                          {logline.length > 150 && (
                            <button
                              onClick={() => setIsLoglineExpanded(!isLoglineExpanded)}
                              className="text-xs text-brand-violet hover:underline mt-2"
                            >
                              {isLoglineExpanded ? 'แสดงน้อยลง' : 'แสดงเพิ่มเติม'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Remove Video Button removed as requested */}
                </div>

                {/* Rating Input */}
                <div className="flex flex-col gap-2">
                  
                  {/* Rating input with selected rating number */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setNewVideoRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={cn(
                              "w-6 h-6",
                              star <= newVideoRating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    {newVideoRating > 0 && (
                      <div className="text-sm font-medium text-brand-violet">
                        {newVideoRating}/5
                      </div>
                    )}
                  </div>
                </div>

                {/* Comment Input */}
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newVideoComment}
                    onChange={(e) => setNewVideoComment(e.target.value)}
                    placeholder="แสดงความคิดเห็น..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
                  />
                  <button
                    onClick={handleVideoCommentSubmit}
                    disabled={!newVideoRating || !newVideoComment || isSubmitting}
                    className="px-4 py-2 bg-brand-violet text-white rounded-lg hover:bg-brand-violet-light disabled:opacity-50"
                  >
                    ส่งความคิดเห็น
                  </button>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {videoComments.map((comment) => (
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
                        </div>
                      </div>
                      
                      {editingCommentId === comment.id ? (
                        <div className="space-y-4">
                          {/* Edit rating */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">คะแนน:</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setEditedCommentRating(star)}
                                  className="focus:outline-none"
                                >
                                  <Star
                                    className={cn(
                                      "w-5 h-5",
                                      star <= editedCommentRating
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300"
                                    )}
                                  />
                                </button>
                              ))}
                            </div>
                            <span className="text-sm text-brand-violet">
                              {editedCommentRating}/5
                            </span>
                          </div>
                          
                          {/* Edit comment text */}
                          <input
                            type="text"
                            value={editedCommentText}
                            onChange={(e) => setEditedCommentText(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
                          />
                          
                          {/* Action buttons */}
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="px-3 py-1 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                              ยกเลิก
                            </button>
                            <button
                              onClick={async () => {
                                if (!selectedVideo || !editedCommentText.trim()) return;
                                
                                try {
                                  const commentRef = doc(db, `shortfilms/${selectedVideo.id}/movieComments`, comment.id);
                                  
                                  // Use the editedCommentRating state
                                  const newRating = editedCommentRating || comment.rating;
                                  
                                  await updateDoc(commentRef, {
                                    text: editedCommentText,
                                    rating: newRating,
                                    updatedAt: new Date().toISOString()
                                  });
                                  
                                  // Update local state
                                  setVideoComments(prev => 
                                    prev.map(c => c.id === comment.id ? {
                                      ...c, 
                                      text: editedCommentText,
                                      rating: newRating
                                    } : c)
                                  );
                                  
                                  // Recalculate average rating
                                  const newAverage = videoComments
                                    .map(c => c.id === comment.id ? newRating : c.rating)
                                    .reduce((acc, curr) => acc + curr, 0) / videoComments.length;
                                  
                                  const updatedRating = Number(newAverage.toFixed(1));
                                  
                                  // Update video rating in database
                                  const videoRef = doc(db, 'shortfilms', selectedVideo.id);
                                  await updateDoc(videoRef, {
                                    rating: updatedRating,
                                    updatedAt: new Date().toISOString()
                                  });
                                  
                                  // Update local video state
                                  const updatedVideo = { ...selectedVideo, rating: updatedRating };
                                  onVideoSelect(updatedVideo);
                                  
                                  // Update videos list
                                  const updatedVideos = videos.map(video => 
                                    video.id === selectedVideo.id ? updatedVideo : video
                                  );
                                  onVideosChange(updatedVideos);
                                  
                                  setEditingCommentId(null);
                                  toast.success('แก้ไขความคิดเห็นสำเร็จ');
                                } catch (error) {
                                  console.error('Error updating comment:', error);
                                  toast.error('แก้ไขความคิดเห็นไม่สำเร็จ');
                                }
                              }}
                              className="px-3 py-1 text-white bg-brand-violet rounded-md hover:bg-brand-violet-light"
                            >
                              บันทึก
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700">{comment.text}</p>
                      )}
                      
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                        
                        {/* Edit button - only visible for comment owner */}
                        {user && user.id === comment.userId && editingCommentId !== comment.id && (
                          <button
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditedCommentText(comment.text);
                              setEditedCommentRating(comment.rating);
                            }}
                            className="text-xs text-brand-violet hover:underline"
                          >
                            แก้ไข
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              เลือกวิดีโอเพื่อเริ่มรับชม
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setVideoToDelete(null);
        }}
        onConfirm={() => {
          if (videoToDelete) {
            handleVideoDelete(videoToDelete);
            setIsDeleteDialogOpen(false);
            setVideoToDelete(null);
          }
        }}
        title="ลบวิดีโอ"
        message="คุณต้องการลบวิดีโอนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถเรียกคืนได้"
        confirmText="ลบวิดีโอ"
        cancelText="ยกเลิก"
        type="danger"
      />
    </div>
  );
}
