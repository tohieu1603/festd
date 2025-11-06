'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';

interface AddPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  package?: any;
}

export function AddPackageModal({ isOpen, onClose, onSuccess, package: editPackage }: AddPackageModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: editPackage?.name || '',
    price: editPackage?.price || 0,
    category: editPackage?.category || 'wedding',
    description: editPackage?.description || '',
    services: {
      photographer_main: editPackage?.details?.photographer_main || 500000,
      photographer_assistant: editPackage?.details?.photographer_assistant || 300000,
      makeup: editPackage?.details?.makeup || 400000,
      retouch_per_photo: editPackage?.details?.retouch_per_photo || 50000,
      retouch_photos: editPackage?.details?.retouch_photos || 100,
      shooting_time: editPackage?.details?.time || '',
      location: editPackage?.details?.location || '',
    },
    notes: editPackage?.notes || '',
    is_active: editPackage?.is_active !== undefined ? editPackage.is_active : true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Transform formData to match backend schema
      const payload = {
        name: formData.name,
        category: formData.category,
        price: formData.price,
        description: formData.description || '',
        notes: formData.notes || '',
        details: {
          photo: null,
          makeup: null,
          assistant: null,
          retouch: null,
          time: formData.services.shooting_time || null,
          location: formData.services.location || null,
          retouch_photos: formData.services.retouch_photos || null,
          extra_services: []
        },
        includes: [],
        is_active: formData.is_active,
        popularity_score: 0,
      };

      console.log('Payload being sent:', JSON.stringify(payload, null, 2));

      if (editPackage) {
        await api.put(`/packages/${editPackage.id}`, payload);
        toast.success('Cập nhật gói chụp thành công!');
      } else {
        await api.post('/packages/', payload);
        toast.success('Tạo gói chụp thành công!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving package:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi lưu gói chụp');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('services.')) {
      const serviceField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        services: { ...prev.services, [serviceField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editPackage ? 'Chỉnh Sửa Gói Chụp' : 'Thêm Gói Chụp Mới'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Thông Tin Cơ Bản</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tên Gói Chụp <span className="text-red-500">*</span>
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="VD: Gói Premium Plus"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Giá Gói (VNĐ) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                required
                value={formData.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                placeholder="20000000"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Danh Mục <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full border border-gray-300 rounded-md p-2"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                <option value="portrait">Portrait</option>
                <option value="family">Family</option>
                <option value="couple">Couple</option>
                <option value="wedding">Wedding</option>
                <option value="event">Event</option>
                <option value="commercial">Commercial</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mô Tả</label>
              <Input
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Mô tả ngắn về gói chụp"
              />
            </div>
          </div>
        </Card>

        {/* Service Details */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Chi Tiết Dịch Vụ</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Lương Photographer Chính (VNĐ)</label>
                <Input
                  type="number"
                  value={formData.services.photographer_main}
                  onChange={(e) => handleChange('services.photographer_main', parseFloat(e.target.value) || 0)}
                  placeholder="500000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Lương Photographer Phụ (VNĐ)</label>
                <Input
                  type="number"
                  value={formData.services.photographer_assistant}
                  onChange={(e) => handleChange('services.photographer_assistant', parseFloat(e.target.value) || 0)}
                  placeholder="300000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Lương Makeup (VNĐ)</label>
                <Input
                  type="number"
                  value={formData.services.makeup}
                  onChange={(e) => handleChange('services.makeup', parseFloat(e.target.value) || 0)}
                  placeholder="400000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Lương Retouch/ảnh (VNĐ)</label>
                <Input
                  type="number"
                  value={formData.services.retouch_per_photo}
                  onChange={(e) => handleChange('services.retouch_per_photo', parseFloat(e.target.value) || 0)}
                  placeholder="50000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Số Ảnh Retouch</label>
                <Input
                  type="number"
                  value={formData.services.retouch_photos}
                  onChange={(e) => handleChange('services.retouch_photos', parseInt(e.target.value) || 0)}
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Thời Gian Chụp</label>
                <Input
                  value={formData.services.shooting_time}
                  onChange={(e) => handleChange('services.shooting_time', e.target.value)}
                  placeholder="VD: 4-5 giờ"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Địa Điểm</label>
              <Input
                value={formData.services.location}
                onChange={(e) => handleChange('services.location', e.target.value)}
                placeholder="VD: Studio + 1 ngoại cảnh"
              />
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
            placeholder="Mô tả chi tiết về gói chụp..."
          />
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Đang lưu...' : editPackage ? 'Cập Nhật' : 'Tạo Gói Chụp'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
