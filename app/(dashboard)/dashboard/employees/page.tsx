'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, UserX, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AddEmployeeModal } from '@/components/employees/AddEmployeeModal';
import type { Employee } from '@/lib/types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { toast, confirm } from '@/lib/toast';

const roleLabels: Record<string, string> = {
  'Photo/Retouch': 'Photo/Retouch',
  'Makeup Artist': 'Makeup Artist',
  'Content': 'Content',
  'Sales': 'Sales',
  'Manager': 'Manager',
};

const roleColors: Record<string, string> = {
  'Photo/Retouch': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Makeup Artist': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  'Content': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'Sales': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Manager': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

export default function EmployeesPage() {
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ total: number; items: Employee[] }>('/employees/');
      setEmployees(response.items || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (!confirm(`Bạn có chắc muốn XÓA VĨNH VIỄN nhân viên ${employee.name}? Hành động này không thể hoàn tác!`)) return;

    try {
      await api.delete(`/employees/${employee.id}`);
      toast.success('Đã xóa nhân viên thành công!');
      fetchEmployees();
    } catch (error) {
      console.error('Failed to delete employee:', error);
      toast.error('Không thể xóa nhân viên. Vui lòng thử lại.');
    }
  };

  const handleDeactivateEmployee = async (employee: Employee) => {
    if (!confirm(`Cho nhân viên ${employee.name} nghỉ việc?`)) return;

    try {
      await api.patch(`/employees/${employee.id}/deactivate`);
      toast.success('Đã cho nhân viên nghỉ việc!');
      fetchEmployees();
    } catch (error) {
      console.error('Failed to deactivate employee:', error);
      toast.error('Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  };

  const handleActivateEmployee = async (employee: Employee) => {
    if (!confirm(`Cho nhân viên ${employee.name} quay lại làm việc?`)) return;

    try {
      await api.patch(`/employees/${employee.id}/activate`);
      toast.success('Đã kích hoạt lại nhân viên!');
      fetchEmployees();
    } catch (error) {
      console.error('Failed to activate employee:', error);
      toast.error('Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleModalSuccess = () => {
    fetchEmployees();
    handleModalClose();
  };

  // Filtered employees
  const filteredEmployees = employees.filter((employee) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      employee.name.toLowerCase().includes(searchLower) ||
      employee.email.toLowerCase().includes(searchLower) ||
      employee.phone.toLowerCase().includes(searchLower) ||
      employee.role.toLowerCase().includes(searchLower)
    );
  });

  // Check permissions
  const canCreate = user && ['admin', 'manager'].includes(user.role);
  const canEdit = user && ['admin', 'manager'].includes(user.role);
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
          <h1 className="text-3xl font-bold text-foreground">Nhân viên</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý thông tin nhân viên và phân công công việc
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleAddEmployee}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm nhân viên
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại, chức vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Tổng nhân viên</div>
          <div className="text-2xl font-bold text-foreground mt-1">{employees.length}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Đang hoạt động</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {employees.filter((e) => e.is_active).length}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Nghỉ việc</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {employees.filter((e) => !e.is_active).length}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Kết quả tìm kiếm</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{filteredEmployees.length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Chức vụ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Điện thoại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Lương cơ bản
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Trạng thái
                </th>
                {(canEdit || canDelete) && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    {searchTerm
                      ? 'Không tìm thấy nhân viên nào phù hợp'
                      : 'Chưa có nhân viên nào. Nhấn "Thêm nhân viên" để bắt đầu.'}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-foreground">{employee.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={roleColors[employee.role] || 'bg-gray-100 text-gray-700'}>
                        {roleLabels[employee.role] || employee.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {employee.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {employee.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {employee.base_salary?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        className={
                          employee.is_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }
                      >
                        {employee.is_active ? 'Hoạt động' : 'Nghỉ việc'}
                      </Badge>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEmployee(employee)}
                              title="Chỉnh sửa"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canEdit && employee.is_active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeactivateEmployee(employee)}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                              title="Cho nghỉ việc"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                          {canEdit && !employee.is_active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleActivateEmployee(employee)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                              title="Kích hoạt lại"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEmployee(employee)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Xóa vĩnh viễn"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AddEmployeeModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        employee={editingEmployee}
      />
    </div>
  );
}
