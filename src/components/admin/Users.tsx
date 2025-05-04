import React, { useState, useEffect } from 'react';
import { UserCircle2, Search, X } from 'lucide-react';
import { useAuthStore } from '../../lib/store';
import { User, Role } from '../../types/auth';
import { cn, getInitials } from '../../lib/utils';

const roleOptions: { value: Role; label: string; color: string; emoji: string; description: string }[] = [
  { value: 'admin', label: 'ผู้ดูแลระบบ', color: 'bg-red-100 text-red-800', emoji: '👑', description: 'จัดการระบบและผู้ใช้ทั้งหมด' },
  { value: 'editor', label: 'บรรณาธิการ', color: 'bg-yellow-100 text-yellow-800', emoji: '✍️', description: 'จัดการเนื้อหาและโครงการ' },
  { value: 'commentor', label: 'ผู้ให้ความเห็น', color: 'bg-emerald-100 text-emerald-800', emoji: '💭', description: 'ให้ความเห็นต่อผลงาน' },
  { value: 'viewer', label: 'ผู้ใช้งาน', color: 'bg-gray-100 text-gray-800', emoji: '👤', description: 'เข้าถึงข้อมูลทั่วไป' },
];

const userTypeLabels: Record<string, string> = {
  'school-student': 'นักเรียน',
  'college-student': 'นิสิต/นักศึกษา',
  'teacher': 'ครู/อาจารย์',
  'government': 'เจ้าหน้าที่รัฐ',
  'staff': 'ทีมงานค่าย',
};

export function AdminUsers() {
  const { searchUsers, updateUserRole, fetchNonViewerUsers } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [defaultAdminUser, setDefaultAdminUser] = useState<User | null>(null);

  const loadNonViewerUsers = async () => {
    setIsLoading(true);
    try {
      const nonViewerUsers = await fetchNonViewerUsers();
      setUsers(nonViewerUsers);
      
      // Find and set the first admin user as default
      const firstAdmin = nonViewerUsers.find(user => user.role === 'admin');
      if (firstAdmin && !defaultAdminUser) {
        setDefaultAdminUser(firstAdmin);
        setSelectedUser(firstAdmin);
      }
    } catch (error) {
      console.error('Error loading non-viewer users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNonViewerUsers();
  }, [fetchNonViewerUsers]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 3) {
        setIsLoading(true);
        try {
          const results = await searchUsers(searchTerm);
          setUsers(results);
        } catch (error) {
          console.error('Error searching users:', error);
        } finally {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleRoleChange = async (user: User, role: Role) => {
    try {
      await updateUserRole(user.id, role);
      const updatedUser = { ...user, role };
      setUsers(users.map(u => 
        u.id === user.id ? updatedUser : u
      ));
      if (selectedUser?.id === user.id) {
        setSelectedUser(updatedUser);
      }
      if (defaultAdminUser?.id === user.id) {
        setDefaultAdminUser(updatedUser);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const clearSearch = async () => {
    setSearchTerm('');
    await loadNonViewerUsers();
    // Restore default admin selection
    if (defaultAdminUser) {
      setSelectedUser(defaultAdminUser);
    }
  };

  const getUserTypeDisplay = (user: User) => {
    if (!user.userType) return '';
    
    let display = userTypeLabels[user.userType];
    
    if (user.userType === 'government' || user.userType === 'staff') {
      display += user.organization ? ` • ${user.organization}` : '';
    }
    
    return display;
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <UserCircle2 className="w-6 h-6 text-brand-primary" />
        <h1 className="text-2xl font-semibold text-gray-900">จัดการผู้ใช้</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {/* Search Input */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาผู้ใช้..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-violet focus:border-brand-violet sm:text-sm"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Users List */}
            <div className="col-span-1 bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">รายชื่อผู้ใช้</h2>
              {isLoading ? (
                <div className="text-center py-4 text-gray-500">กำลังโหลด...</div>
              ) : users.length > 0 ? (
                <div className="space-y-2">
                  {users.map((user) => {
                    const userRole = roleOptions.find(r => r.value === user.role);
                    return (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-lg transition-colors",
                          selectedUser?.id === user.id
                            ? "bg-brand-violet text-white"
                            : "bg-white hover:bg-gray-100"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          {user.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt={user.fullName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {getInitials(user.fullName)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn(
                                "font-medium truncate",
                                selectedUser?.id === user.id ? "text-white" : "text-gray-900"
                              )}>
                                {user.fullName}
                              </p>
                              <span className={cn(
                                "px-1.5 py-0.5 text-xs font-medium rounded-full",
                                userRole?.color
                              )}>
                                {userRole?.label}
                              </span>
                            </div>
                            <p className={cn(
                              "text-sm truncate",
                              selectedUser?.id === user.id ? "text-white/80" : "text-gray-500"
                            )}>
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  ไม่พบผู้ใช้ที่มีบทบาทในระบบ
                </div>
              )}
            </div>

            {/* User Details and Role Management */}
            <div className="col-span-2">
              {selectedUser ? (
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center space-x-4 mb-6">
                    {selectedUser.profileImage ? (
                      <img
                        src={selectedUser.profileImage}
                        alt={selectedUser.fullName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xl font-medium text-gray-600">
                          {getInitials(selectedUser.fullName)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-medium text-gray-900">
                        {selectedUser.fullName}
                      </h3>
                      <p className="text-gray-500">{selectedUser.email}</p>
                      {selectedUser.userType && (
                        <p className="text-sm text-gray-600 mt-1">
                          {getUserTypeDisplay(selectedUser)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">บทบาทผู้ใช้</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {roleOptions.map((role) => (
                        <label
                          key={role.value}
                          className={cn(
                            "relative flex flex-col p-4 rounded-lg cursor-pointer transition-all",
                            selectedUser.role === role.value
                              ? "ring-2 ring-brand-violet bg-brand-violet/5"
                              : "ring-1 ring-gray-200 hover:ring-brand-violet/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="role"
                              value={role.value}
                              checked={selectedUser.role === role.value}
                              onChange={() => handleRoleChange(selectedUser, role.value)}
                              className="h-4 w-4 text-brand-violet focus:ring-brand-violet border-gray-300"
                            />
                            <span className="text-2xl">{role.emoji}</span>
                            <span className="font-medium text-gray-900">
                              {role.label}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-500 pl-7">
                            {role.description}
                          </p>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  เลือกผู้ใช้เพื่อดูรายละเอียด
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}