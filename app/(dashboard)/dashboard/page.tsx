'use client';

import { useEffect, useState } from 'react';
import { FolderKanban, Users, TrendingUp, Wallet } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { DashboardStats, ChartDataPoint } from '@/lib/types';
import { api } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch real data from APIs
      const [projectsRes, employeesRes, salariesRes, packagesRes] = await Promise.all([
        fetch('http://localhost:8000/api/projects/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:8000/api/employees/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:8000/api/salaries/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:8000/api/packages/', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const projects = projectsRes.ok ? await projectsRes.json() : { total: 0, items: [] };
      const employees = employeesRes.ok ? await employeesRes.json() : { total: 0, items: [] };
      const salaries = salariesRes.ok ? await salariesRes.json() : { total: 0, items: [] };
      const packages = packagesRes.ok ? await packagesRes.json() : { total: 0, items: [] };

      // Calculate stats
      const activeProjects = projects.items?.filter((p: any) =>
        p.status === 'in_progress' || p.status === 'pending'
      ).length || 0;

      const totalRevenue = projects.items?.reduce((sum: number, p: any) =>
        sum + (p.package_price || 0), 0
      ) || 0;

      const totalSalaries = salaries.items?.reduce((sum: number, s: any) =>
        sum + (s.total_amount || 0), 0
      ) || 0;

      const pendingSalaries = salaries.items?.filter((s: any) =>
        s.status === 'pending'
      ).length || 0;

      setStats({
        total_projects: projects.total || projects.items?.length || 0,
        active_projects: activeProjects,
        total_employees: employees.total || employees.items?.length || 0,
        total_revenue: totalRevenue,
        total_expenses: totalSalaries,
        monthly_profit: totalRevenue - totalSalaries,
        pending_salaries: pendingSalaries,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Fallback to mock data on error
      setStats({
        total_projects: 0,
        active_projects: 0,
        total_employees: 0,
        total_revenue: 0,
        total_expenses: 0,
        monthly_profit: 0,
        pending_salaries: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock chart data
  const revenueData: ChartDataPoint[] = [
    { name: 'T1', value: 40000000 },
    { name: 'T2', value: 45000000 },
    { name: 'T3', value: 38000000 },
    { name: 'T4', value: 52000000 },
    { name: 'T5', value: 48000000 },
    { name: 'T6', value: 55000000 },
  ];

  const projectStatusData: ChartDataPoint[] = [
    { name: 'Đang thực hiện', value: 8 },
    { name: 'Hoàn thành', value: 3 },
    { name: 'Tạm dừng', value: 1 },
  ];

  const recentActivities = [
    { id: 1, action: 'Dự án "Website XYZ" đã hoàn thành', time: '2024-01-15T10:30:00' },
    { id: 2, action: 'Nhân viên mới "Nguyễn Văn A" đã tham gia', time: '2024-01-15T09:15:00' },
    { id: 3, action: 'Thanh toán lương tháng 1 đã hoàn tất', time: '2024-01-14T16:45:00' },
    { id: 4, action: 'Dự án "App Mobile ABC" bắt đầu', time: '2024-01-14T14:20:00' },
  ];

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Tổng quan về hoạt động của studio
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Tổng dự án"
            value={stats.total_projects}
            icon={FolderKanban}
            description={`${stats.active_projects} đang hoạt động`}
          />
          <StatCard
            title="Nhân viên"
            value={stats.total_employees}
            icon={Users}
            description="Tổng số nhân viên"
          />
          <StatCard
            title="Doanh thu"
            value={stats.total_revenue}
            icon={TrendingUp}
            isCurrency
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Lợi nhuận"
            value={stats.monthly_profit}
            icon={Wallet}
            isCurrency
            trend={{ value: 8, isPositive: true }}
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Doanh thu 6 tháng"
          description="Doanh thu theo tháng"
          data={revenueData}
          type="bar"
          dataKey="value"
          xAxisKey="name"
        />
        <ChartCard
          title="Trạng thái dự án"
          description="Phân bổ dự án theo trạng thái"
          data={projectStatusData}
          type="pie"
          dataKey="value"
        />
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between pb-4 border-b last:border-0 last:pb-0"
              >
                <p className="text-sm">{activity.action}</p>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {formatRelativeTime(activity.time)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
