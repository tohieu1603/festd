'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';

interface AddPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  partner?: any;
}

export function AddPartnerModal({ isOpen, onClose, onSuccess, partner: editPartner }: AddPartnerModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: editPartner?.name || '',
    type: editPartner?.type || 'vendor',
    contact_person: editPartner?.contact_person || '',
    phone: editPartner?.phone || '',
    email: editPartner?.email || '',
    address: editPartner?.address || '',
    services: editPartner?.services || [],
    cost_per_service: editPartner?.cost_per_service || 0,
    rating: editPartner?.rating || 5,
    notes: editPartner?.notes || '',
    is_active: editPartner?.is_active !== undefined ? editPartner.is_active : true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.success('Vui lòng đăng nhập');
        return;
      }

      const url = editPartner
        ? `http://localhost:8000/api/partners/${editPartner.id}`
        : 'http://localhost:8000/api/partners/';
      const method = editPartner ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Có lỗi xảy ra');
      }

      toast.success(editPartner ? 'Cập nhật đối tác thành công!' : 'Thêm đối tác thành công!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving partner:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi lưu đối tác');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const partnerTypeOptions = [
    { value: 'vendor', label: 'Nhà cung cấp' },
    { value: 'location', label: 'Địa điểm chụp' },
    { value: 'equipment', label: 'Thiết bị' },
    { value: 'other', label: 'Khác' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editPartner ? 'Chỉnh Sửa Đối Tác' : 'Thêm Đối Tác Mới'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Thông Tin Cơ Bản</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tên Đối Tác <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Nhập tên đối tác"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Loại Đối Tác <span className="text-red-500">*</span>
                </label>
                <Select
                  required
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  options={partnerTypeOptions}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Người Liên Hệ</label>
                <Input
                  value={formData.contact_person}
                  onChange={(e) => handleChange('contact_person', e.target.value)}
                  placeholder="Tên người liên hệ"
                />
              </div>
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
          </div>
        </Card>

        {/* Service Details */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Chi Tiết Dịch Vụ</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Dịch Vụ Cung Cấp</label>
              <Input
                value={formData.services.join(', ')}
                onChange={(e) => handleChange('services', e.target.value.split(',').map(s => s.trim()))}
                placeholder="VD: Cho thuê váy cưới, Trang điểm, Địa điểm chụp..."
              />
              <p className="text-sm text-gray-500 mt-1">Nhập các dịch vụ, cách nhau bằng dấu phẩy</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Chi Phí Mỗi Lần Sử Dụng (VNĐ)</label>
                <Input
                  type="number"
                  value={formData.cost_per_service}
                  onChange={(e) => handleChange('cost_per_service', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Đánh Giá (1-5 sao)</label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => handleChange('rating', parseFloat(e.target.value) || 5)}
                  placeholder="5"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">Ghi Chú</label>
          <textarea
            className="w-full border border-gray-300 rounded-md p-2 min-h-[100px]"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Thêm ghi chú về đối tác..."
          />
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Đang lưu...' : editPartner ? 'Cập Nhật' : 'Thêm Đối Tác'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
