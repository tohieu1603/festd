'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err) {
      // Error is handled by the store
      console.error('Login failed:', err);
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <LogIn className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Đăng nhập</CardTitle>
        <CardDescription className="text-center">
          Nhập thông tin để truy cập hệ thống
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <Input
            label="Tên đăng nhập"
            type="text"
            placeholder="Nhập tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />

          <Input
            label="Mật khẩu"
            type="password"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            Đăng nhập
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground space-y-2">
          <p>Quên mật khẩu? Liên hệ quản trị viên</p>
          <p>
            Chưa có tài khoản?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
