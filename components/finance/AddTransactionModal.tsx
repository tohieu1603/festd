'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTransactionModal({ isOpen, onClose, onSuccess }: AddTransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'income',
    category: '',
    amount: 0,
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: '',
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

      const response = await fetch('http://localhost:8000/api/finance/transactions/', {
        method: 'POST',
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

      toast.success('Thêm giao dịch thành công!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      alert(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    { value: 'income', label: 'Thu nhập' },
    { value: 'expense', label: 'Chi phí' },
  ];

  const incomeCategoryOptions = [
    { value: 'project_payment', label: 'Thanh toán dự án' },
    { value: 'deposit', label: 'Tiền cọc' },
    { value: 'other_income', label: 'Thu nhập khác' },
  ];

  const expenseCategoryOptions = [
    { value: 'salary', label: 'Lương nhân viên' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'office', label: 'Văn phòng' },
    { value: 'equipment', label: 'Thiết bị' },
    { value: 'partner_payment', label: 'Thanh toán đối tác' },
    { value: 'other_expense', label: 'Chi phí khác' },
  ];

  const paymentMethodOptions = [
    { value: 'cash', label: 'Tiền mặt' },
    { value: 'bank_transfer', label: 'Chuyển khoản' },
    { value: 'credit_card', label: 'Thẻ tín dụng' },
  ];

  const categoryOptions = formData.type === 'income' ? incomeCategoryOptions : expenseCategoryOptions;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm Giao Dịch" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Loại Giao Dịch <span className="text-red-500">*</span>
              </label>
              <Select
                required
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value, category: '' }))}
                options={typeOptions}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Danh Mục <span className="text-red-500">*</span>
              </label>
              <Select
                required
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                options={[{ value: '', label: '-- Chọn danh mục --' }, ...categoryOptions]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Số Tiền (VNĐ) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                required
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Ngày Giao Dịch <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                required
                value={formData.transaction_date}
                onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">
              Phương Thức Thanh Toán
            </label>
            <Select
              value={formData.payment_method}
              onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
              options={paymentMethodOptions}
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">
              Mô Tả <span className="text-red-500">*</span>
            </label>
            <Input
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả ngắn gọn về giao dịch"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Ghi Chú</label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2 min-h-[80px]"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Thêm ghi chú chi tiết..."
            />
          </div>
        </Card>

        {/* Summary */}
        <div className={`p-4 rounded-lg ${formData.type === 'income' ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex justify-between items-center">
            <span className="font-medium">
              {formData.type === 'income' ? 'Tổng Thu' : 'Tổng Chi'}:
            </span>
            <span className={`text-2xl font-bold ${formData.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              {formData.type === 'income' ? '+' : '-'}{formData.amount.toLocaleString()} VNĐ
            </span>
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Thêm Giao Dịch'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
