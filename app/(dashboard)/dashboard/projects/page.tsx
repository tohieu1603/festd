'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Check, Calendar, DollarSign, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AddProjectModal } from '@/components/projects/AddProjectModal';
import type { Project, ProjectStatus } from '@/lib/types';
import { api } from '@/lib/api';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { toast, confirm } from '@/lib/toast';

const statusLabels: Record<ProjectStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shooting: 'Đang chụp',
  retouching: 'Đang chỉnh sửa',
  delivered: 'Đã giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const statusColors: Record<ProjectStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  shooting: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  retouching: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  delivered: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const paymentStatusColors: Record<string, string> = {
  unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  deposit_paid: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  partially_paid: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  fully_paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

export default function ProjectsPage() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ total: number; items: Project[] }>('/projects/');
      setProjects(response.items || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmProject = async (project: Project) => {
    if (project.status !== 'pending') return;

    setConfirmingId(project.id);
    try {
      await api.patch(`/projects/${project.id}`, { status: 'confirmed' });
      toast.success('Đã xác nhận dự án thành công!');
      fetchProjects();
    } catch (error) {
      console.error('Failed to confirm project:', error);
      toast.error('Không thể xác nhận dự án. Vui lòng thử lại.');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Bạn có chắc muốn xóa dự án "${project.customer_name}"?`)) return;

    try {
      await api.delete(`/projects/${project.id}`);
      toast.success('Đã xóa dự án thành công!');
      fetchProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Không thể xóa dự án. Vui lòng thử lại.');
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter((project) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (
        !project.customer_name.toLowerCase().includes(searchLower) &&
        !project.customer_phone.toLowerCase().includes(searchLower) &&
        !project.project_code.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    if (statusFilter !== 'all' && project.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Check permissions
  const canCreate = user && ['admin', 'manager', 'sales'].includes(user.role);
  const canConfirm = user && ['admin', 'manager'].includes(user.role);
  const canDelete = user && user.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dự án</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý dự án và theo dõi tiến độ
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo dự án
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo tên KH, SĐT, mã dự án..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            Tất cả
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
          >
            Chờ xác nhận
          </Button>
          <Button
            variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('confirmed')}
          >
            Đã xác nhận
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Tổng dự án</div>
          <div className="text-2xl font-bold text-foreground mt-1">{projects.length}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Chờ xác nhận</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {projects.filter((p) => p.status === 'pending').length}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Đang thực hiện</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {projects.filter((p) => p.status === 'shooting' || p.status === 'retouching').length}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Hoàn thành</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {projects.filter((p) => p.status === 'completed').length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Mã dự án
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Gói chụp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ngày chụp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Giá trị
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Thanh toán
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Không tìm thấy dự án nào phù hợp'
                      : 'Chưa có dự án nào. Nhấn "Tạo dự án" để bắt đầu.'}
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm font-medium text-foreground">{project.project_code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{project.customer_name}</div>
                      <div className="text-sm text-muted-foreground">{project.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {project.package_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDateShort(project.shoot_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {formatCurrency(project.payment?.final || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={paymentStatusColors[project.payment?.status || 'unpaid']}>
                        {project.payment?.status === 'unpaid' && 'Chưa thanh toán'}
                        {project.payment?.status === 'deposit_paid' && 'Đã đặt cọc'}
                        {project.payment?.status === 'partially_paid' && 'Thanh toán 1 phần'}
                        {project.payment?.status === 'fully_paid' && 'Đã thanh toán'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={statusColors[project.status]}>
                        {statusLabels[project.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        {canConfirm && project.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConfirmProject(project)}
                            disabled={confirmingId === project.id}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                            title="Xác nhận dự án"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProject(project)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Xóa dự án"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchProjects();
        }}
      />
    </div>
  );
}
