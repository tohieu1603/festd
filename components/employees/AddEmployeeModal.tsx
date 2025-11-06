'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee?: any;
}

const ROLE_SKILLS = {
  'Photo/Retouch': ['Chụp chính', 'Chụp phụ', 'Retouch'],
  'Makeup Artist': ['Makeup', 'Làm tóc', 'Styling'],
  'Sales': ['Sales', 'Tư vấn khách hàng', 'Quản lý dự án'],
  'Manager': ['Quản lý dự án', 'Quản lý nhân sự'],
  'Content': ['Viết content', 'Quản lý social'],
  'Designer': ['Thiết kế', 'Chỉnh sửa video'],
};

export function AddEmployeeModal({ isOpen, onClose, onSuccess, employee: editEmployee }: AddEmployeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(editEmployee?.role || '');
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: editEmployee?.name || '',
    role: editEmployee?.role || '',
    skills: editEmployee?.skills || [],
    phone: editEmployee?.phone || '',
    email: editEmployee?.email || '',
    address: editEmployee?.address || '',
    base_salary: editEmployee?.base_salary || 0,
    bank_account: {
      bank_name: editEmployee?.bank_account?.bank_name || '',
      account_number: editEmployee?.bank_account?.account_number || '',
      account_holder: editEmployee?.bank_account?.account_holder || '',
    },
    emergency_contact: {
      name: editEmployee?.emergency_contact?.name || '',
      phone: editEmployee?.emergency_contact?.phone || '',
      relationship: editEmployee?.emergency_contact?.relationship || '',
    },
    default_rates: {
      main_photo: editEmployee?.default_rates?.main_photo || 500000,
      assist_photo: editEmployee?.default_rates?.assist_photo || 300000,
      retouch: editEmployee?.default_rates?.retouch || 50000,
      makeup: editEmployee?.default_rates?.makeup || 400000,
    },
    notes: editEmployee?.notes || '',
    is_active: editEmployee?.is_active !== undefined ? editEmployee.is_active : true,
  });

  useEffect(() => {
    if (selectedRole && ROLE_SKILLS[selectedRole as keyof typeof ROLE_SKILLS]) {
      setAvailableSkills(ROLE_SKILLS[selectedRole as keyof typeof ROLE_SKILLS]);
    } else {
      setAvailableSkills([]);
    }
  }, [selectedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editEmployee) {
        await api.put(`/employees/${editEmployee.id}`, formData);
      } else {
        // Debug: log the data being sent
        console.log('Sending employee data:', JSON.stringify(formData, null, 2));

        // Try debug endpoint first
        const debugResponse = await api.post('/employees/debug', formData);
        console.log('Debug response:', debugResponse);

        // Now try the real endpoint
        await api.post('/employees/', formData);
      }

      toast.success(editEmployee ? 'Cập nhật nhân viên thành công!' : 'Thêm nhân viên thành công!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving employee:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi lưu nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field === 'role') {
      setSelectedRole(value);
      setFormData(prev => ({ ...prev, role: value, skills: [] }));
    } else if (field.startsWith('bank_account.')) {
      const bankField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bank_account: { ...prev.bank_account, [bankField]: value }
      }));
    } else if (field.startsWith('emergency_contact.')) {
      const emergencyField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergency_contact: { ...prev.emergency_contact, [emergencyField]: value }
      }));
    } else if (field.startsWith('default_rates.')) {
      const rateField = field.split('.')[1];
      // Convert to number and ensure valid value
      const numValue = parseFloat(value);
      setFormData(prev => ({
        ...prev,
        default_rates: { ...prev.default_rates, [rateField]: isNaN(numValue) ? 0 : numValue }
      }));
    } else if (field === 'base_salary') {
      // Convert to number and ensure valid value
      const numValue = parseFloat(value);
      setFormData(prev => ({ ...prev, [field]: isNaN(numValue) ? 0 : numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => {
      const skills = prev.skills.includes(skill)
        ? prev.skills.filter((s: string) => s !== skill)
        : [...prev.skills, skill];
      return { ...prev, skills };
    });
  };

  const roleOptions = [
    { value: '', label: '-- Chọn vai trò --' },
    { value: 'Photo/Retouch', label: 'Photo/Retouch' },
    { value: 'Makeup Artist', label: 'Makeup Artist' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Content', label: 'Content' },
    { value: 'Designer', label: 'Designer' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editEmployee ? 'Chỉnh Sửa Nhân Viên' : 'Thêm Nhân Viên Mới'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Thông Tin Cơ Bản</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tên Nhân Viên <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Nhập tên nhân viên"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Vai Trò <span className="text-red-500">*</span>
                </label>
                <Select
                  required
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  options={roleOptions}
                />
              </div>
            </div>

            {availableSkills.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Kỹ Năng</label>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map((skill) => (
                    <label key={skill} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.skills.includes(skill)}
                        onChange={() => handleSkillToggle(skill)}
                        className="rounded"
                      />
                      <span className="text-sm">{skill}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Số Điện Thoại</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="0123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Địa Chỉ</label>
              <Input
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Nhập địa chỉ"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Lương Cơ Bản (VNĐ/tháng)</label>
              <Input
                type="number"
                value={formData.base_salary}
                onChange={(e) => handleChange('base_salary', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </Card>

        {/* Default Rates */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Đơn Giá Mặc Định</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Chụp Chính (VNĐ/dự án)</label>
              <Input
                type="number"
                value={formData.default_rates.main_photo}
                onChange={(e) => handleChange('default_rates.main_photo', e.target.value)}
                placeholder="500000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Chụp Phụ (VNĐ/dự án)</label>
              <Input
                type="number"
                value={formData.default_rates.assist_photo}
                onChange={(e) => handleChange('default_rates.assist_photo', e.target.value)}
                placeholder="300000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Retouch (VNĐ/ảnh)</label>
              <Input
                type="number"
                value={formData.default_rates.retouch}
                onChange={(e) => handleChange('default_rates.retouch', e.target.value)}
                placeholder="50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Makeup (VNĐ/dự án)</label>
              <Input
                type="number"
                value={formData.default_rates.makeup}
                onChange={(e) => handleChange('default_rates.makeup', e.target.value)}
                placeholder="400000"
              />
            </div>
          </div>
        </Card>

        {/* Bank Account */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Thông Tin Ngân Hàng</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tên Ngân Hàng</label>
              <Input
                value={formData.bank_account.bank_name}
                onChange={(e) => handleChange('bank_account.bank_name', e.target.value)}
                placeholder="VD: Vietcombank"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Số Tài Khoản</label>
              <Input
                value={formData.bank_account.account_number}
                onChange={(e) => handleChange('bank_account.account_number', e.target.value)}
                placeholder="0123456789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Chủ Tài Khoản</label>
              <Input
                value={formData.bank_account.account_holder}
                onChange={(e) => handleChange('bank_account.account_holder', e.target.value)}
                placeholder="NGUYEN VAN A"
              />
            </div>
          </div>
        </Card>

        {/* Emergency Contact */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Liên Hệ Khẩn Cấp</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tên</label>
              <Input
                value={formData.emergency_contact.name}
                onChange={(e) => handleChange('emergency_contact.name', e.target.value)}
                placeholder="Họ tên người liên hệ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Số Điện Thoại</label>
              <Input
                type="tel"
                value={formData.emergency_contact.phone}
                onChange={(e) => handleChange('emergency_contact.phone', e.target.value)}
                placeholder="0123456789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mối Quan Hệ</label>
              <Input
                value={formData.emergency_contact.relationship}
                onChange={(e) => handleChange('emergency_contact.relationship', e.target.value)}
                placeholder="VD: Bố, Mẹ, Vợ, Chồng..."
              />
            </div>
          </div>
        </Card>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">Ghi Chú</label>
          <textarea
            className="w-full border border-gray-300 rounded-md p-2 min-h-[80px]"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Thêm ghi chú về nhân viên..."
          />
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Đang lưu...' : editEmployee ? 'Cập Nhật' : 'Thêm Nhân Viên'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
