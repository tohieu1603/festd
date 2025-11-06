'use client';

import { useEffect, useState } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { AddTransactionModal } from '@/components/finance/AddTransactionModal';
import type { Transaction, ChartDataPoint } from '@/lib/types';
// import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter]);

  const fetchTransactions = async () => {
    try {
      // TODO: Backend endpoint /transactions not yet implemented
      // Temporarily use mock data
      setTransactions([]);

      // Uncomment when backend is ready:
      // const params = buildQueryString({ type: typeFilter });
      // const response = await api.get<{ results: Transaction[] }>(`/transactions/${params}`);
      // setTransactions(response.results || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  // Calculate summary
  const totalRevenue = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const profit = totalRevenue - totalExpense;

  // Mock chart data
  const revenueByMonthData: ChartDataPoint[] = [
    { name: 'T1', value: 45000000, income: 45000000, expense: 32000000 },
    { name: 'T2', value: 52000000, income: 52000000, expense: 35000000 },
    { name: 'T3', value: 48000000, income: 48000000, expense: 33000000 },
    { name: 'T4', value: 58000000, income: 58000000, expense: 38000000 },
    { name: 'T5', value: 55000000, income: 55000000, expense: 36000000 },
    { name: 'T6', value: 62000000, income: 62000000, expense: 40000000 },
  ];

  const expensesByCategoryData: ChartDataPoint[] = [
    { name: 'Lương', value: 180000000 },
    { name: 'Marketing', value: 45000000 },
    { name: 'Văn phòng', value: 25000000 },
    { name: 'Công cụ', value: 15000000 },
    { name: 'Khác', value: 10000000 },
  ];

  const typeOptions = [
    { value: '', label: 'Tất cả giao dịch' },
    { value: 'income', label: 'Thu nhập' },
    { value: 'expense', label: 'Chi phí' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tài chính</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý thu chi và báo cáo tài chính
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm giao dịch
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng thu nhập</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {transactions.filter(t => t.type === 'income').length} giao dịch
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng chi phí</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {transactions.filter(t => t.type === 'expense').length} giao dịch
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lợi nhuận</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {profit >= 0 ? '+' : ''}{((profit / totalRevenue) * 100).toFixed(1)}% biên lợi nhuận
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Thu chi theo tháng"
          description="So sánh thu nhập và chi phí"
          data={revenueByMonthData}
          type="bar"
          dataKey="income"
          xAxisKey="name"
        />
        <ChartCard
          title="Chi phí theo danh mục"
          description="Phân bổ chi phí"
          data={expensesByCategoryData}
          type="pie"
          dataKey="value"
        />
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={typeOptions}
          className="w-48"
        />
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div>Đang tải...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Không tìm thấy giao dịch</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ngày</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Số tiền</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                <TableCell>
                  <Badge variant={transaction.type === 'income' ? 'success' : 'destructive'}>
                    {transaction.type === 'income' ? 'Thu nhập' : 'Chi phí'}
                  </Badge>
                </TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {transaction.description}
                </TableCell>
                <TableCell className={`font-semibold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTransactionClick(transaction)}
                  >
                    Chi tiết
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add Transaction Modal */}
      {isModalOpen && !selectedTransaction && (
        <AddTransactionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchTransactions();
          }}
        />
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTransaction(null);
          }}
          title="Chi tiết giao dịch"
          size="lg"
        >
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Loại giao dịch</p>
                  <Badge
                    variant={selectedTransaction.type === 'income' ? 'success' : 'destructive'}
                    className="mt-1"
                  >
                    {selectedTransaction.type === 'income' ? 'Thu nhập' : 'Chi phí'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Danh mục</p>
                  <p className="font-medium mt-1">{selectedTransaction.category}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mô tả</p>
                <p className="mt-1">{selectedTransaction.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Số tiền</p>
                  <p className={`text-xl font-bold mt-1 ${
                    selectedTransaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedTransaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(selectedTransaction.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày giao dịch</p>
                  <p className="font-medium mt-1">{formatDate(selectedTransaction.transaction_date)}</p>
                </div>
              </div>
              {selectedTransaction.project && (
                <div>
                  <p className="text-sm text-muted-foreground">Dự án liên quan</p>
                  <p className="font-medium mt-1">{selectedTransaction.project.project_code} - {selectedTransaction.project.customer_name}</p>
                </div>
              )}
            </div>

            <ModalFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedTransaction(null);
                }}
              >
                Đóng
              </Button>
            </ModalFooter>
          </div>
        </Modal>
      )}
    </div>
  );
}
