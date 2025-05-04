import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../lib/store';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';

const loginSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      const from = location.state?.from?.pathname || '/user';
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled in the store
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('กรุณากรอกอีเมล');
      return;
    }

    try {
      setIsResetting(true);
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว');
      setShowForgotPassword(false);
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error('ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg relative">
        {/* Close Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-brand-navy">
            เข้าสู่ระบบ
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            เข้าสู่ระบบเพื่อจัดการใบสมัครและติดตามสถานะ
          </p>
        </div>

        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="mt-8 space-y-6">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-brand-navy">
                อีเมลสำหรับรีเซ็ตรหัสผ่าน
              </label>
              <input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isResetting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-violet hover:bg-brand-violet-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-violet disabled:opacity-50"
              >
                {isResetting ? 'กำลังส่งอีเมล...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="text-sm text-brand-violet hover:text-brand-violet-light"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-brand-navy">
                  อีเมล
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-brand-navy">
                  รหัสผ่าน
                </label>
                <input
                  id="password"
                  type="password"
                  {...register('password')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-violet focus:border-brand-violet"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-brand-violet hover:text-brand-violet-light"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-violet hover:bg-brand-violet-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-violet disabled:opacity-50"
              >
                {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                ยังไม่มีบัญชี?{' '}
                <Link to="/register" className="font-medium text-brand-violet hover:text-brand-violet-light">
                  สมัครสมาชิก
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}