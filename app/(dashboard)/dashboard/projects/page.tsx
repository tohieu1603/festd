'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Grid, List, X, SlidersHorizontal, Calendar, FolderKanban, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ProjectCard } from '@/components/features/ProjectCard';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { AddProjectModal } from '@/components/projects/AddProjectModal';
import type { Project, ProjectStatus } from '@/lib/types';
import { api } from '@/lib/api';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

const statusLabels: Record<ProjectStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shooting: 'Đang chụp',
  retouching: 'Đang retouch',
  delivered: 'Đã giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const statusColors: Record<ProjectStatus, string> = {
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  shooting: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  retouching: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  delivered: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get<{ total: number; items: Project[] }>('/projects/');
      setProjects(response.items || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({ start: '', end: '' });
  };

  const handleConfirmProject = async () => {
    if (!selectedProject || selectedProject.status !== 'pending') return;

    setConfirmLoading(true);
    try {
      await api.patch(`/projects/${selectedProject.id}`, {
        status: 'confirmed'
      });

      // Update local state
      setProjects(projects.map(p =>
        p.id === selectedProject.id
          ? { ...p, status: 'confirmed' as ProjectStatus }
          : p
      ));
      setSelectedProject({ ...selectedProject, status: 'confirmed' });

      alert('Đã xác nhận dự án thành công!');
    } catch (error) {
      console.error('Failed to confirm project:', error);
      alert('Không thể xác nhận dự án. Vui lòng thử lại.');
    } finally {
      setConfirmLoading(false);
    }
  };

  // Check if user has permission to confirm projects
  const canConfirmProject = user && ['admin', 'manager'].includes(user.role);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (
          !project.project_code.toLowerCase().includes(searchLower) &&
          !project.customer_name.toLowerCase().includes(searchLower) &&
          !project.package_name.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && project.status !== statusFilter) {
        return false;
      }

      // Date range filter
      if (dateRange.start && project.shoot_date < dateRange.start) {
        return false;
      }
      if (dateRange.end && project.shoot_date > dateRange.end) {
        return false;
      }

      return true;
    });
  }, [projects, searchTerm, statusFilter, dateRange]);

  const activeFiltersCount = [
    searchTerm,
    statusFilter !== 'all',
    dateRange.start || dateRange.end,
  ].filter(Boolean).length;

  const statusStats = useMemo(() => {
    const stats: Record<string, number> = { all: projects.length };
    projects.forEach((project) => {
      stats[project.status] = (stats[project.status] || 0) + 1;
    });
    return stats;
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FolderKanban className="h-8 w-8 text-primary" />
            Dự Án
          </h1>
          <p className="text-muted-foreground mt-2">
            Quản lý và theo dõi tiến độ dự án chụp ảnh
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Tạo dự án mới
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-card rounded-xl border p-4 space-y-4">
        <div className="flex gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm theo mã dự án, tên khách hàng, gói chụp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 text-base"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="h-11 px-4"
          >
            <SlidersHorizontal className="h-5 w-5 mr-2" />
            Lọc
            {activeFiltersCount > 0 && (
              <Badge variant="default" className="ml-2 px-1.5 py-0 h-5 min-w-5">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="h-9 w-9"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="h-9 w-9"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              onClick={handleClearFilters}
              className="h-11 px-4"
            >
              <X className="h-4 w-4 mr-2" />
              Xóa lọc
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="pt-4 border-t space-y-4">
            {/* Date Range */}
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Khoảng thời gian chụp
              </label>
              <div className="flex gap-3 items-center">
                <Input
                  type="date"
                  placeholder="Từ ngày"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="h-10"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="date"
                  placeholder="Đến ngày"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            statusFilter === 'all'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Tất cả ({statusStats.all || 0})
        </button>
        {(Object.keys(statusLabels) as ProjectStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
              statusFilter === status
                ? statusColors[status]
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent'
            }`}
          >
            {statusLabels[status]} ({statusStats[status] || 0})
          </button>
        ))}
      </div>

      {/* Projects Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải dự án...</p>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border">
          <FolderKanban className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Không tìm thấy dự án</p>
          <p className="text-muted-foreground mt-2">
            {activeFiltersCount > 0
              ? 'Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác'
              : 'Chưa có dự án nào'}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Hiển thị <span className="font-semibold text-foreground">{filteredProjects.length}</span> dự án
              {filteredProjects.length !== projects.length && (
                <> trong tổng số <span className="font-semibold text-foreground">{projects.length}</span> dự án</>
              )}
            </p>
          </div>

          <div className={viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectClick(project)}
              />
            ))}
          </div>
        </>
      )}

      {/* Add/Edit Project Modal */}
      {isModalOpen && !selectedProject && (
        <AddProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchProjects();
          }}
        />
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProject(null);
          }}
          title={`${selectedProject.project_code} - ${selectedProject.customer_name}`}
          size="xl"
        >
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-2 pb-4 border-b">
              <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${statusColors[selectedProject.status]}`}>
                {statusLabels[selectedProject.status]}
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tên khách hàng</p>
                <p className="font-semibold mt-1">{selectedProject.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số điện thoại</p>
                <p className="font-medium mt-1">{selectedProject.customer_phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium mt-1">{selectedProject.customer_email}</p>
              </div>
            </div>

            {/* Package Info */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-muted-foreground mb-2">Gói chụp</p>
              <p className="text-lg font-bold mb-3">{selectedProject.package_name}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Giá gốc</p>
                  <p className="font-semibold">{formatCurrency(selectedProject.package_price)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Giảm giá</p>
                  <p className="font-semibold text-red-600">{formatCurrency(selectedProject.package_discount)}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-primary/10">
                <p className="text-xs text-muted-foreground">Tổng cộng</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(selectedProject.package_final_price)}</p>
              </div>
            </div>

            {/* Shoot Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Ngày chụp</p>
                <p className="font-medium mt-1">{formatDateShort(selectedProject.shoot_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Giờ chụp</p>
                <p className="font-medium mt-1">{selectedProject.shoot_time}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Địa điểm</p>
                <p className="font-medium mt-1">{selectedProject.location}</p>
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Thanh toán</p>
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Đặt cọc</p>
                  <p className="font-semibold mt-1">{formatCurrency(selectedProject.payment.deposit)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Đã thanh toán</p>
                  <p className="font-semibold text-green-600 mt-1">{formatCurrency(selectedProject.payment.paid)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Còn lại</p>
                  <p className="font-semibold text-orange-600 mt-1">
                    {formatCurrency(selectedProject.payment.final - selectedProject.payment.paid)}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedProject.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ghi chú</p>
                <p className="mt-2 bg-muted/50 p-3 rounded-lg text-sm">{selectedProject.notes}</p>
              </div>
            )}

            <ModalFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedProject(null);
                }}
              >
                Đóng
              </Button>
              {canConfirmProject && selectedProject.status === 'pending' && (
                <Button
                  onClick={handleConfirmProject}
                  disabled={confirmLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {confirmLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Đang xác nhận...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Xác nhận dự án
                    </>
                  )}
                </Button>
              )}
              <Button>Chỉnh sửa</Button>
            </ModalFooter>
          </div>
        </Modal>
      )}
    </div>
  );
}
