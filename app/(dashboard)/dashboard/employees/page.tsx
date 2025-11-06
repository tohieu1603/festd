'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, X, SlidersHorizontal, Users2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmployeeCard } from '@/components/features/EmployeeCard';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { AddEmployeeModal } from '@/components/employees/AddEmployeeModal';
import type { Employee } from '@/lib/types';
import { api } from '@/lib/api';

const roleLabels: Record<string, string> = {
  'Photo/Retouch': 'Photo/Retouch',
  'Makeup Artist': 'Makeup Artist',
  'Content': 'Content',
  'Sales': 'Sales',
  'Manager': 'Manager',
};

const roleColors: Record<string, string> = {
  'Photo/Retouch': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  'Makeup Artist': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  'Content': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  'Sales': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
  'Manager': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [salaryRange, setSalaryRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get<{ total: number; items: Employee[] }>('/employees/');
      setEmployees(response.items || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setSalaryRange({ min: '', max: '' });
    setStatusFilter('all');
  };

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (
          !employee.name.toLowerCase().includes(searchLower) &&
          !employee.email.toLowerCase().includes(searchLower) &&
          !employee.phone.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Role filter
      if (roleFilter !== 'all' && employee.role !== roleFilter) {
        return false;
      }

      // Salary range filter
      if (salaryRange.min && employee.base_salary < Number(salaryRange.min)) {
        return false;
      }
      if (salaryRange.max && employee.base_salary > Number(salaryRange.max)) {
        return false;
      }

      // Status filter
      if (statusFilter === 'active' && !employee.is_active) {
        return false;
      }
      if (statusFilter === 'inactive' && employee.is_active) {
        return false;
      }

      return true;
    });
  }, [employees, searchTerm, roleFilter, salaryRange, statusFilter]);

  const activeFiltersCount = [
    searchTerm,
    roleFilter !== 'all',
    salaryRange.min || salaryRange.max,
    statusFilter !== 'all',
  ].filter(Boolean).length;

  const roleStats = useMemo(() => {
    const stats: Record<string, number> = { all: employees.length };
    employees.forEach((employee) => {
      stats[employee.role] = (stats[employee.role] || 0) + 1;
    });
    return stats;
  }, [employees]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users2 className="h-8 w-8 text-primary" />
            Nhân Viên
          </h1>
          <p className="text-muted-foreground mt-2">
            Quản lý thông tin và lương nhân viên
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Thêm nhân viên
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
              placeholder="Tìm theo tên, email, số điện thoại..."
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
            {/* Salary Range */}
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Khoảng lương
              </label>
              <div className="flex gap-3 items-center">
                <Input
                  type="number"
                  placeholder="Từ"
                  value={salaryRange.min}
                  onChange={(e) => setSalaryRange({ ...salaryRange, min: e.target.value })}
                  className="h-10"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Đến"
                  value={salaryRange.max}
                  onChange={(e) => setSalaryRange({ ...salaryRange, max: e.target.value })}
                  className="h-10"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">VNĐ</span>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Trạng thái</label>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  Tất cả
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                >
                  Đang làm việc
                </Button>
                <Button
                  variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('inactive')}
                >
                  Đã nghỉ
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Role Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          onClick={() => setRoleFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            roleFilter === 'all'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Tất cả ({roleStats.all || 0})
        </button>
        {Object.keys(roleLabels).map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
              roleFilter === role
                ? roleColors[role] || 'bg-secondary'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent'
            }`}
          >
            {roleLabels[role]} ({roleStats[role] || 0})
          </button>
        ))}
      </div>

      {/* Employee Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải danh sách nhân viên...</p>
          </div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border">
          <Users2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Không tìm thấy nhân viên</p>
          <p className="text-muted-foreground mt-2">
            {activeFiltersCount > 0
              ? 'Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác'
              : 'Chưa có nhân viên nào'}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Hiển thị <span className="font-semibold text-foreground">{filteredEmployees.length}</span> nhân viên
              {filteredEmployees.length !== employees.length && (
                <> trong tổng số <span className="font-semibold text-foreground">{employees.length}</span> nhân viên</>
              )}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEmployees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onClick={() => handleEmployeeClick(employee)}
              />
            ))}
          </div>
        </>
      )}

      {/* Add/Edit Employee Modal */}
      {isModalOpen && !selectedEmployee && (
        <AddEmployeeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchEmployees();
          }}
        />
      )}

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEmployee(null);
          }}
          title={selectedEmployee.name}
          size="xl"
        >
          <div className="space-y-6">
            {/* Role Badge */}
            <div className="flex items-center gap-2 pb-4 border-b">
              <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${roleColors[selectedEmployee.role] || 'bg-secondary'}`}>
                {selectedEmployee.role}
              </div>
              <Badge variant={selectedEmployee.is_active ? 'success' : 'secondary'}>
                {selectedEmployee.is_active ? 'Đang làm việc' : 'Đã nghỉ'}
              </Badge>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Ngày bắt đầu</p>
                <p className="font-medium mt-1">{selectedEmployee.start_date}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium mt-1">{selectedEmployee.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số điện thoại</p>
                <p className="font-medium mt-1">{selectedEmployee.phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Địa chỉ</p>
                <p className="font-medium mt-1">{selectedEmployee.address}</p>
              </div>
            </div>

            {/* Skills */}
            {selectedEmployee.skills && selectedEmployee.skills.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Kỹ năng</p>
                <div className="flex flex-wrap gap-2">
                  {selectedEmployee.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Salary Info */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-muted-foreground mb-3">Thông tin lương</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Lương cơ bản</p>
                  <p className="text-lg font-bold text-primary mt-1">{selectedEmployee.base_salary?.toLocaleString('vi-VN')} ₫</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Đơn giá chụp chính</p>
                  <p className="font-semibold mt-1">{selectedEmployee.default_rates?.main_photo?.toLocaleString('vi-VN')} ₫</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Đơn giá chụp phụ</p>
                  <p className="font-semibold mt-1">{selectedEmployee.default_rates?.assist_photo?.toLocaleString('vi-VN')} ₫</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Đơn giá makeup</p>
                  <p className="font-semibold mt-1">{selectedEmployee.default_rates?.makeup?.toLocaleString('vi-VN')} ₫</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Đơn giá retouch</p>
                  <p className="font-semibold mt-1">{selectedEmployee.default_rates?.retouch?.toLocaleString('vi-VN')} ₫</p>
                </div>
              </div>
            </div>

            {/* Bank Info */}
            {selectedEmployee.bank_account && (selectedEmployee.bank_account.bank_name || selectedEmployee.bank_account.account_number) && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Thông tin ngân hàng</p>
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Ngân hàng</p>
                    <p className="font-medium">{selectedEmployee.bank_account.bank_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Số tài khoản</p>
                    <p className="font-medium">{selectedEmployee.bank_account.account_number}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Chủ tài khoản</p>
                    <p className="font-medium">{selectedEmployee.bank_account.account_holder}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            {selectedEmployee.emergency_contact && selectedEmployee.emergency_contact.name && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Liên hệ khẩn cấp</p>
                <div className="grid grid-cols-3 gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                  <div>
                    <p className="text-xs text-muted-foreground">Họ tên</p>
                    <p className="font-medium">{selectedEmployee.emergency_contact.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Số điện thoại</p>
                    <p className="font-medium">{selectedEmployee.emergency_contact.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mối quan hệ</p>
                    <p className="font-medium">{selectedEmployee.emergency_contact.relationship}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedEmployee.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ghi chú</p>
                <p className="mt-2 bg-muted/50 p-3 rounded-lg text-sm">{selectedEmployee.notes}</p>
              </div>
            )}

            <ModalFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedEmployee(null);
                }}
              >
                Đóng
              </Button>
              <Button>Chỉnh sửa</Button>
            </ModalFooter>
          </div>
        </Modal>
      )}
    </div>
  );
}
