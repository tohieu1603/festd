'use client';

import { useEffect, useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { SalaryCalculatorModal } from '@/components/salary/SalaryCalculatorModal';
import type { SalaryPayment } from '@/lib/types';
import { api, buildQueryString } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function SalaryPage() {
  const [salaries, setSalaries] = useState<SalaryPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<SalaryPayment | null>(null);

  useEffect(() => {
    fetchSalaries();
  }, [monthFilter, statusFilter]);

  const fetchSalaries = async () => {
    try {
      const params = buildQueryString({
        month: monthFilter,
        status: statusFilter,
      });
      const response = await api.get<{ results: SalaryPayment[] }>(`/salaries/${params}`);
      setSalaries(response.results || []);
    } catch (error) {
      console.error('Failed to fetch salaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSalaryClick = (salary: SalaryPayment) => {
    setSelectedSalary(salary);
    setIsModalOpen(true);
  };

  const statusLabels: Record<string, string> = {
    pending: 'Chờ thanh toán',
    paid: 'Đã thanh toán',
    cancelled: 'Đã hủy',
  };

  const statusColors: Record<string, 'warning' | 'success' | 'destructive'> = {
    pending: 'warning',
    paid: 'success',
    cancelled: 'destructive',
  };

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ thanh toán' },
    { value: 'paid', label: 'Đã thanh toán' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  // Calculate summary
  const totalPending = salaries
    .filter(s => s.status === 'pending')
    .reduce((sum, s) => sum + s.total_amount, 0);

  const totalPaid = salaries
    .filter(s => s.status === 'paid')
    .reduce((sum, s) => sum + s.total_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý lương</h1>
          <p className="text-muted-foreground mt-2">
            Theo dõi và thanh toán lương nhân viên
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo bảng lương
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Chờ thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(totalPending)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {salaries.filter(s => s.status === 'pending').length} bảng lương
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Đã thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {salaries.filter(s => s.status === 'paid').length} bảng lương
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tổng chi lương</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPending + totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tổng cộng {salaries.length} bảng lương
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="w-48">
          <Select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            options={[
              { value: '', label: 'Tất cả các tháng' },
              { value: '2024-01', label: 'Tháng 1/2024' },
              { value: '2024-02', label: 'Tháng 2/2024' },
              { value: '2024-03', label: 'Tháng 3/2024' },
            ]}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={statusOptions}
          className="w-48"
        />
      </div>

      {/* Salaries Table */}
      {loading ? (
        <div>Đang tải...</div>
      ) : salaries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Không tìm thấy bảng lương</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Tháng</TableHead>
              <TableHead>Lương cơ bản</TableHead>
              <TableHead>Thưởng</TableHead>
              <TableHead>Khấu trừ</TableHead>
              <TableHead>Tổng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salaries.map((salary) => (
              <TableRow key={salary.id}>
                <TableCell className="font-medium">
                  {salary.employee.name}
                </TableCell>
                <TableCell>{salary.month}</TableCell>
                <TableCell>{formatCurrency(salary.base_salary)}</TableCell>
                <TableCell>{formatCurrency(salary.bonus)}</TableCell>
                <TableCell>{formatCurrency(salary.deduction)}</TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(salary.total_amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={statusColors[salary.status]}>
                    {statusLabels[salary.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSalaryClick(salary)}
                  >
                    Chi tiết
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Salary Calculator Modal */}
      {isModalOpen && !selectedSalary && (
        <SalaryCalculatorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchSalaries();
          }}
        />
      )}

      {/* Salary Detail Modal */}
      {selectedSalary && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSalary(null);
          }}
          title="Chi tiết bảng lương"
          size="lg"
        >
          <div className="space-y-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nhân viên</p>
                <p className="font-medium mt-1">{selectedSalary.employee.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tháng</p>
                  <p className="font-medium mt-1">{selectedSalary.month}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <Badge variant={statusColors[selectedSalary.status]} className="mt-1">
                    {statusLabels[selectedSalary.status]}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-sm">Lương cơ bản:</span>
                  <span className="font-medium">{formatCurrency(selectedSalary.base_salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Thưởng:</span>
                  <span className="font-medium text-green-600">+{formatCurrency(selectedSalary.bonus)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Khấu trừ:</span>
                  <span className="font-medium text-red-600">-{formatCurrency(selectedSalary.deduction)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Tổng cộng:</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(selectedSalary.total_amount)}
                  </span>
                </div>
              </div>
              {selectedSalary.payment_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Ngày thanh toán</p>
                  <p className="font-medium mt-1">{formatDate(selectedSalary.payment_date)}</p>
                </div>
              )}
              {selectedSalary.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Ghi chú</p>
                  <p className="mt-1">{selectedSalary.notes}</p>
                </div>
              )}
            </div>

            <ModalFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedSalary(null);
                }}
              >
                Đóng
              </Button>
              {selectedSalary.status === 'pending' && (
                <Button>Xác nhận thanh toán</Button>
              )}
            </ModalFooter>
          </div>
        </Modal>
      )}
    </div>
  );
}
