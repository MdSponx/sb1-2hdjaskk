import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2, AlertCircle, Star, Play } from 'lucide-react';
import { MediaPlayer, MediaProvider, type MediaPlayerElement } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, getDocs, query, orderBy, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import { cn, formatDate, getInitials } from '../../lib/utils';
import { useAuthStore } from '../../lib/store';
import { toast } from 'sonner';

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
  onVideoSelect: (video: Video) => void;
  onVideosChange: (videos: Video[]) => void;
  projectTitle?: string;
  groupName?: string;
  school?: string;
}

const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

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
  const playerRef = useRef<MediaPlayerElement>(null);
  const [videoComments, setVideoComments] = useState<Comment[]>([]);
  const [newVideoComment, setNewVideoComment] = useState('');
  const [newVideoRating, setNewVideoRating] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleVideoSelect = (video: Video) => {
    onVideoSelect(video);
    loadVideoComments(video.id);
    setNewVideoComment('');
    setNewVideoRating(0);
    
    // Reset video player
    if (playerRef.current) {
      playerRef.current.currentTime = 0;
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

      const videoRef = doc(db, 'shortfilms', selectedVideo.id);
      await updateDoc(videoRef, {
        rating: Number(newAverage.toFixed(1)),
        updatedAt: new Date().toISOString()
      });

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
              title: projectTitle || '',
              groupName: groupName || '',
              school: school || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              rating: 0
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
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <h3 className="text-2xl font-semibold text-gray-900">วิดีโอผลงาน</h3>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-700 font-medium">ข้อกำหนดการอัพโหลดวิดีโอ</p>
            <ul className="mt-2 text-sm text-blue-600 space-y-1">
              <li>• รองรับไฟล์ MP4 และ MOV เท่านั้น</li>
              <li>• ขนาดไฟล์ไม่เกิน 500MB</li>
              <li>• ความละเอียดแนะนำ: 1920x1080 (Full HD)</li>
              <li>• อัตราเฟรม: 24-30 fps</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Gallery */}
        <div className="lg:col-span-1 space-y-4">
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
                <div className="flex gap-3">
                  <div className="relative w-24 aspect-video rounded-md overflow-hidden bg-black">
                    <video
                      src={video.videoUrl}
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />
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
        </div>

        {/* Video Player and Comments */}
        <div className="lg:col-span-2">
          {selectedVideo ? (
            <div className="space-y-6">
              {/* Video Player */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <MediaPlayer
                  ref={playerRef}
                  src={selectedVideo.videoUrl}
                  poster={projectImage}
                  className="w-full h-full"
                  load="visible"
                  crossorigin=""
                >
                  <MediaProvider>
                    <DefaultVideoLayout icons={defaultLayoutIcons} />
                  </MediaProvider>
                </MediaPlayer>
              </div>

              {/* Video Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {selectedVideo.title || 'ไม่มีชื่อ'}
                  </h4>
                  <p className="text-gray-500">{selectedVideo.groupName}</p>
                </div>

                {/* Rating Input */}
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
                  {selectedVideo.rating > 0 && (
                    <div className="text-sm text-gray-600">
                      คะแนนเฉลี่ย: {selectedVideo.rating.toFixed(1)}/5
                    </div>
                  )}
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
                      <p className="text-gray-700">{comment.text}</p>
                      <div className="mt-2 text-sm text-gray-500">
                        {formatDate(comment.createdAt)}
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
    </div>
  );
}