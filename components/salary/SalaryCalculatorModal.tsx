'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { api } from '@/lib/api';

interface SalaryCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SalaryCalculatorModal({ isOpen, onClose, onSuccess }: SalaryCalculatorModalProps) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const [formData, setFormData] = useState({
    employee_id: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    base_salary: 0,
    projects: [] as any[],
    bonus: 0,
    deduction: 0,
    notes: '',
  });

  const [totalSalary, setTotalSalary] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    // Calculate total salary from projects
    const projectsSalary = formData.projects.reduce((sum, p) => sum + (p.salary || 0), 0);
    const total = formData.base_salary + projectsSalary + formData.bonus - formData.deduction;
    setTotalSalary(total);
  }, [formData]);

  const loadData = async () => {
    try {
      // Load employees
      const employeesData = await api.get<{ total: number; items: any[] }>('/employees/');
      console.log('Employees data:', employeesData);
      setEmployees(employeesData.items || []);

      // Load projects
      const projectsData = await api.get<{ total: number; items: any[] }>('/projects/');
      console.log('Projects data:', projectsData);
      setProjects(projectsData.items || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
      setSelectedEmployee(employee);
      setFormData(prev => ({
        ...prev,
        employee_id: employeeId,
        base_salary: employee.base_salary || 0,
      }));
    }
  };

  const handleAddProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, { project_id: '', project_name: '', salary: 0 }]
    }));
  };

  const handleRemoveProject = (index: number) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  const handleProjectChange = (index: number, field: string, value: any) => {
    const newProjects = [...formData.projects];
    newProjects[index] = { ...newProjects[index], [field]: value };

    if (field === 'project_id') {
      const project = projects.find(p => p.id === value);
      if (project) {
        newProjects[index].project_name = project.customer_name;
      }
    }

    setFormData(prev => ({ ...prev, projects: newProjects }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.success('Vui lòng đăng nhập');
        return;
      }

      const payload = {
        employee_id: formData.employee_id,
        month: formData.month,
        base_salary: formData.base_salary,
        bonus: formData.bonus,
        deduction: formData.deduction,
        total_amount: totalSalary,
        projects_detail: formData.projects,
        notes: formData.notes,
        status: 'pending',
      };

      const response = await fetch('http://localhost:8000/api/salaries/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Có lỗi xảy ra');
      }

      toast.success('Tạo bảng lương thành công!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating salary:', error);
      alert(error.message || 'Có lỗi xảy ra khi tạo bảng lương');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo Bảng Lương" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Employee & Month Selection */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
              Thông Tin Cơ Bản
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nhân Viên <span className="text-red-600">*</span>
                </label>
                <Select
                  required
                  value={formData.employee_id}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  options={[
                    { value: '', label: '-- Chọn nhân viên --' },
                    ...employees.map(emp => ({
                      value: emp.id,
                      label: `${emp.name} - ${emp.role}`
                    }))
                  ]}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tháng <span className="text-red-600">*</span>
                </label>
                <Input
                  type="month"
                  required
                  value={formData.month}
                  onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Base Salary */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
              Lương Cơ Bản
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Lương Cơ Bản (VNĐ)
              </label>
              <Input
                type="number"
                value={formData.base_salary}
                onChange={(e) => setFormData(prev => ({ ...prev, base_salary: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
            {selectedEmployee && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <span className="font-medium">Lương mặc định:</span> {selectedEmployee.base_salary?.toLocaleString()} VNĐ/tháng
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Projects */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
              Dự Án Tham Gia
            </h3>
            <Button type="button" variant="outline" size="sm" onClick={handleAddProject}>
              + Thêm Dự Án
            </Button>
          </div>
          <div className="p-6">
            {formData.projects.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Chưa có dự án nào. Nhấn "Thêm Dự Án" để thêm.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.projects.map((project, index) => (
                  <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex-1 space-y-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Dự Án</label>
                      <Select
                        value={project.project_id}
                        onChange={(e) => handleProjectChange(index, 'project_id', e.target.value)}
                        options={[
                          { value: '', label: '-- Chọn dự án --' },
                          ...projects.map(p => ({
                            value: p.id,
                            label: `${p.customer_name} - ${p.shoot_date}`
                          }))
                        ]}
                      />
                    </div>
                    <div className="w-48 space-y-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Lương (VNĐ)</label>
                      <Input
                        type="number"
                        value={project.salary}
                        onChange={(e) => handleProjectChange(index, 'salary', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveProject(index)}
                      className="mt-7"
                    >
                      Xóa
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bonus & Deduction */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
              Thưởng & Khấu Trừ
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Thưởng (VNĐ)</label>
                <Input
                  type="number"
                  value={formData.bonus}
                  onChange={(e) => setFormData(prev => ({ ...prev, bonus: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Thưởng thêm (nếu có)</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Khấu Trừ (VNĐ)</label>
                <Input
                  type="number"
                  value={formData.deduction}
                  onChange={(e) => setFormData(prev => ({ ...prev, deduction: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Phạt, vắng mặt, v.v.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 overflow-hidden">
          <div className="px-6 py-4 bg-blue-100 dark:bg-blue-900/40 border-b-2 border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wide">
              Tổng Kết
            </h3>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700 dark:text-gray-300">Lương cơ bản:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{formData.base_salary.toLocaleString()} VNĐ</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700 dark:text-gray-300">Lương dự án ({formData.projects.length} dự án):</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formData.projects.reduce((sum, p) => sum + (p.salary || 0), 0).toLocaleString()} VNĐ
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-700 dark:text-green-400">Thưởng:</span>
              <span className="font-semibold text-green-700 dark:text-green-400">+{formData.bonus.toLocaleString()} VNĐ</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-red-700 dark:text-red-400">Khấu trừ:</span>
              <span className="font-semibold text-red-700 dark:text-red-400">-{formData.deduction.toLocaleString()} VNĐ</span>
            </div>
            <div className="pt-3 mt-3 border-t-2 border-blue-200 dark:border-blue-700">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-gray-900 dark:text-white">TỔNG LƯƠNG:</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalSalary.toLocaleString()} VNĐ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ghi Chú</label>
          <textarea
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Thêm ghi chú về bảng lương..."
          />
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading || !formData.employee_id}>
            {loading ? 'Đang lưu...' : 'Tạo Bảng Lương'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
