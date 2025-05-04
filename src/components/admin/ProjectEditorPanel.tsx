import React, { useState, useEffect } from 'react';
import { X, Upload, MapPin, Calendar, Users, Tag, Building2, Globe, Mail, Phone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { type Project } from '../../types/project';
import { projectStatusConfig, THAI_PROVINCES, projectTags, THAI_REGIONS } from '../../types/project';
import { createProject, updateProject, deleteProject } from '../../lib/services/projects';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../lib/store';
import { type User } from '../../types/auth';
import { ImageUploader } from '../shared/ImageUploader';
import { RichTextEditor } from '../shared/RichTextEditor';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface ProjectEditorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSaveSuccess: () => void;
}

export function ProjectEditorPanel({ isOpen, onClose, project, onSaveSuccess }: ProjectEditorPanelProps) {
  const { user, searchUsers } = useAuthStore();
  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    shortDescription: '',
    description: '',
    status: 'coming-soon',
    isPublic: true,
    tags: [],
    imageUrl: '',
    startDate: '',
    endDate: '',
    applicationDeadline: '',
    venueName: '',
    venueCoordinates: '',
    province: '',
    organizerName: '',
    targetArea: [],
    maxAttendees: undefined,
    contactPersons: [],
  });
  const [contactSearch, setContactSearch] = useState('');
  const [availableContacts, setAvailableContacts] = useState<User[]>([]);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [contactDetails, setContactDetails] = useState<Record<string, User>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData(project);
      loadContactDetails(project.contactPersons);
    } else {
      setFormData({
        title: '',
        shortDescription: '',
        description: '',
        status: 'coming-soon',
        isPublic: true,
        tags: [],
        imageUrl: '',
        startDate: '',
        endDate: '',
        applicationDeadline: '',
        venueName: '',
        venueCoordinates: '',
        province: '',
        organizerName: '',
        targetArea: [],
        maxAttendees: undefined,
        contactPersons: [],
      });
      setContactDetails({});
    }
  }, [project]);

  const loadContactDetails = async (contacts: Project['contactPersons']) => {
    const details: Record<string, User> = {};
    for (const contact of contacts) {
      try {
        // Only search if we have a valid email
        if (contact.email) {
          const results = await searchUsers(contact.email);
          if (results.length > 0) {
            details[contact.id] = results[0];
          }
        }
      } catch (error) {
        console.error('Error loading contact details:', error);
      }
    }
    setContactDetails(details);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.title || !formData.description) {
        toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }

      if (project?.id) {
        await updateProject(project.id, formData);
      } else {
        await createProject(formData as Omit<Project, 'id' | 'createdAt' | 'updatedAt'>);
      }

      toast.success(project ? 'อัปเดตโครงการสำเร็จ' : 'สร้างโครงการสำเร็จ');
      onSaveSuccess();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกโครงการ');
    }
  };

  const handleDelete = async () => {
    try {
      if (project?.id) {
        await deleteProject(project.id);
        toast.success('ลบโครงการสำเร็จ');
        onSaveSuccess();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('เกิดข้อผิดพลาดในการลบโครงการ');
    }
  };

  const handleContactSearch = async (value: string) => {
    setContactSearch(value);
    if (value.length >= 2) {
      const results = await searchUsers(value);
      setAvailableContacts(results);
      setShowContactDropdown(true);
    } else {
      setAvailableContacts([]);
      setShowContactDropdown(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const addContactPerson = (contact: User) => {
    setFormData(prev => ({
      ...prev,
      contactPersons: [
        ...(prev.contactPersons || []),
        {
          id: contact.id,
          email: contact.email,
          fullName: contact.fullName,
          profileImage: contact.profileImage,
        },
      ],
    }));
    setContactSearch('');
    setShowContactDropdown(false);
  };

  const removeContactPerson = (contactId: string) => {
    setFormData(prev => ({
      ...prev,
      contactPersons: prev.contactPersons?.filter(c => c.id !== contactId) || [],
    }));
  };

  return (
    <div
      className={cn(
        "fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div
        className={cn(
          "fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl transform transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-brand-navy">
              {project ? 'แก้ไขโครงการ' : 'สร้างโครงการใหม่'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-8">
              <section className="space-y-4 border rounded-lg p-4">
                <h3 className="text-lg font-medium text-brand-navy flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  ภาพรวมโครงการ
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รูปภาพโครงการ
                  </label>
                  <ImageUploader
                    imageUrl={formData.imageUrl}
                    onImageChange={(url) => setFormData({ ...formData, imageUrl: url })}
                    projectId={project?.id}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อโครงการ
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    คำอธิบายสั้น
                  </label>
                  <textarea
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    maxLength={200}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
                    placeholder="อธิบายโครงการสั้นๆ ไม่เกิน 200 ตัวอักษร"
                  />
                  <p className="mt-1 text-sm text-gray-500 text-right">
                    {(formData.shortDescription?.length || 0)}/200
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      สถานะ
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
                    >
                      {Object.entries(projectStatusConfig).map(([value, { label }]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      การมองเห็น
                    </label>
                    <div className="flex items-center space-x-4 mt-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={formData.isPublic}
                          onChange={() => setFormData({ ...formData, isPublic: true })}
                          className="w-4 h-4 text-brand-violet focus:ring-brand-violet border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">สาธารณะ</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!formData.isPublic}
                          onChange={() => setFormData({ ...formData, isPublic: false })}
                          className="w-4 h-4 text-brand-violet focus:ring-brand-violet border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">ส่วนตัว</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    พื้นที่เป้าหมาย
                  </label>
                  <input
                    type="text"
                    value={formData.targetArea || ''}
                    onChange={(e) => setFormData({ ...formData, targetArea: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
                    placeholder="ระบุพื้นที่เป้าหมาย เช่น ภาคเหนือ, ทั่วประเทศ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนผู้เข้าร่วมสูงสุด
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxAttendees || ''}
                    onChange={(e) => setFormData({ ...formData, maxAttendees: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
                    placeholder="ระบุจำนวนผู้เข้าร่วมสูงสุด"
                  />
                </div>
              </section>

              <section className="space-y-4 border rounded-lg p-4">
                <h3 className="text-lg font-medium text-brand-navy flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  วันและเวลา
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      วันที่เริ่ม
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      วันที่สิ้นสุด
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันปิดรับสมัคร
                  </label>
                  <input
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    สถานที่จัดงาน
                  </label>
                  <input
                    type="text"
                    value={formData.venueName}
                    onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    พิกัด Google Maps
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.venueCoordinates}
                      onChange={(e) => setFormData({ ...formData, venueCoordinates: e.target.value })}
                      placeholder="URL Google Maps"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
                    />
                    <button
                      type="button"
                      className="px-3 py-2 text-brand-violet hover:text-brand-violet-light border border-brand-violet hover:border-brand-violet-light rounded-lg"
                      onClick={() => window.open(formData.venueCoordinates, '_blank')}
                      disabled={!formData.venueCoordinates}
                    >
                      <MapPin className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จังหวัด
                  </label>
                  <select
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
                  >
                    <option value="">เลือกจังหวัด</option>
                    {THAI_PROVINCES.map((province) => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>
              </section>

              <section className="space-y-4 border rounded-lg p-4">
                <h3 className="text-lg font-medium text-brand-navy flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  รายละเอียด
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รายละเอียดโครงการ
                  </label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ผู้จัดงาน
                  </label>
                  <input
                    type="text"
                    value={formData.organizerName}
                    onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
                  />
                </div>
              </section>

              <section className="space-y-4 border rounded-lg p-4">
                <h3 className="text-lg font-medium text-brand-navy flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  แท็ก
                </h3>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">แท็กที่มีอยู่</h4>
                  <div className="flex flex-wrap gap-2">
                    {projectTags.map((tag) => {
                      const isSelected = formData.tags?.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              tags: isSelected
                                ? prev.tags?.filter(t => t !== tag) || []
                                : [...(prev.tags || []), tag]
                            }));
                          }}
                          className={cn(
                            "px-3 py-1 rounded-full text-sm transition-colors",
                            isSelected
                              ? "bg-brand-violet text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          )}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เพิ่มแท็กใหม่
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="พิมพ์แท็กที่ต้องการเพิ่ม"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 text-brand-violet border border-brand-violet rounded-lg hover:bg-brand-violet hover:text-white transition-colors"
                    >
                      เพิ่ม
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.tags?.filter(tag => !projectTags.includes(tag)).map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            tags: prev.tags?.filter(t => t !== tag) || []
                          }));
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </section>

              <section className="space-y-4 border rounded-lg p-4">
                <h3 className="text-lg font-medium text-brand-navy flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  ผู้ประสานงาน
                </h3>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-700">
                    ค้นหาผู้ประสานงานจากรายชื่อผู้ดูแลระบบและบรรณาธิการ
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={contactSearch}
                    onChange={(e) => handleContactSearch(e.target.value)}
                    placeholder="พิมพ์ชื่อ, ชื่อเล่น หรืออีเมลเพื่อค้นหา"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent"
                  />

                  {showContactDropdown && availableContacts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {availableContacts.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => addContactPerson(contact)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                        >
                          {contact.profileImage ? (
                            <img
                              src={contact.profileImage}
                              alt={contact.fullName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-brand-violet text-white flex items-center justify-center font-medium">
                              {contact.fullName[0]}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{contact.fullName}</div>
                            <div className="text-sm text-gray-500">
                              {contact.nickname && `${contact.nickname} • `}{contact.email}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {formData.contactPersons?.map((contact) => {
                    const details = contactDetails[contact.id];
                    return (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          {contact.profileImage ? (
                            <img
                              src={contact.profileImage}
                              alt={contact.fullName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-brand-violet text-white flex items-center justify-center font-medium">
                              {contact.fullName[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{contact.fullName}</div>
                            {details && (
                              <div className="text-sm text-gray-600 mt-1">
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  {details.email}
                                </div>
                                {details.phoneNumber && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    {details.phoneNumber}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeContactPerson(contact.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="border-t bg-gray-50 px-6 py-4">
              <div className="flex justify-between items-center">
                {project && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    ลบโครงการ
                  </button>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {project ? 'บันทึกการแก้ไข' : 'สร้างโครงการ'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="ยืนยันการลบโครงการ"
        message="คุณแน่ใจหรือไม่ที่จะลบโครงการนี้? การดำเนินการนี้ไม่สามารถเรียกคืนได้"
        confirmText="ลบโครงการ"
        type="danger"
      />
    </div>
  );
}