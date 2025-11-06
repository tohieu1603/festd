'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'employee',
  });

  const roleOptions = [
    { value: 'employee', label: 'Nhân viên' },
    { value: 'sales', label: 'Sales' },
    { value: 'manager', label: 'Quản lý' },
    { value: 'admin', label: 'Admin' },
  ];

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post<{
        success: boolean;
        token: string;
        message: string;
        user: any;
      }>('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role,
      });

      if (response.success) {
        // Save token
        if (response.token) {
          localStorage.setItem('token', response.token);
        }

        toast.success('Đăng ký thành công!');
        router.push('/dashboard');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Đăng ký thất bại';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between mb-4">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          </Link>
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Đăng ký tài khoản</CardTitle>
        <CardDescription className="text-center">
          Tạo tài khoản mới để sử dụng hệ thống
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tên đăng nhập"
              type="text"
              placeholder="username"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              required
              disabled={isLoading}
              className="col-span-2"
            />

            <Input
              label="Họ và tên"
              type="text"
              placeholder="Nguyễn Văn A"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              required
              disabled={isLoading}
            />

            <Input
              label="Email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={isLoading}
            />

            <div className="col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Vai trò</label>
              <Select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                options={roleOptions}
                disabled={isLoading}
              />
            </div>

            <Input
              label="Mật khẩu"
              type="password"
              placeholder="Ít nhất 6 ký tự"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required
              disabled={isLoading}
            />

            <Input
              label="Xác nhận mật khẩu"
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            Đăng ký
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
