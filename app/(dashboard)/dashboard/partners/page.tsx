'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { AddPartnerModal } from '@/components/partners/AddPartnerModal';
import type { Partner } from '@/lib/types';
import { api, buildQueryString } from '@/lib/api';

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  useEffect(() => {
    fetchPartners();
  }, [searchTerm]);

  const fetchPartners = async () => {
    try {
      const params = buildQueryString({ search: searchTerm });
      const response = await api.get<{ items: Partner[] }>(`/partners/${params}`);
      setPartners(response.items || []);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerClick = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsModalOpen(true);
  };

  const partnerTypeLabels: Record<string, string> = {
    clothing: '👔 Trang Phục',
    printing: '🖨️ In Ảnh',
    flower: '🌸 Hoa Tươi',
    venue: '🏢 Địa Điểm',
    equipment: '📷 Thiết Bị',
    other: '📦 Khác',
  };

  const partnerTypeColors: Record<string, 'default' | 'success' | 'warning' | 'secondary'> = {
    clothing: 'warning',
    printing: 'success',
    flower: 'default',
    venue: 'secondary',
    equipment: 'warning',
    other: 'secondary',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Đối tác</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý thông tin đối tác
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm đối tác
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm đối tác..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Partners Table */}
      {loading ? (
        <div>Đang tải...</div>
      ) : partners.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Không tìm thấy đối tác</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Tên đối tác</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Người liên hệ</TableHead>
              <TableHead>Điện thoại</TableHead>
              <TableHead>Chi phí</TableHead>
              <TableHead>Đánh giá</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.map((partner) => (
              <TableRow key={partner.id}>
                <TableCell className="font-mono text-sm">{partner.partner_id}</TableCell>
                <TableCell className="font-medium">{partner.name}</TableCell>
                <TableCell>
                  <Badge variant={partnerTypeColors[partner.type]}>
                    {partnerTypeLabels[partner.type]}
                  </Badge>
                </TableCell>
                <TableCell>{partner.contact_info?.contact_person || '-'}</TableCell>
                <TableCell>{partner.contact_info?.phone || '-'}</TableCell>
                <TableCell>
                  {partner.cost === 'Theo bill' ? (
                    <span className="text-muted-foreground italic">Theo bill</span>
                  ) : (
                    <span>{parseFloat(partner.cost).toLocaleString('vi-VN')} VNĐ</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-yellow-500">★ {partner.rating || 0}</span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePartnerClick(partner)}
                  >
                    Chi tiết
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add/Edit Partner Modal */}
      {isModalOpen && !selectedPartner && (
        <AddPartnerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchPartners();
          }}
        />
      )}

      {/* Partner Detail Modal */}
      {selectedPartner && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPartner(null);
          }}
          title={selectedPartner.name}
          size="lg"
        >
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Mã đối tác</p>
                  <p className="font-mono font-medium mt-1">{selectedPartner.partner_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loại đối tác</p>
                  <Badge variant={partnerTypeColors[selectedPartner.type]} className="mt-1">
                    {partnerTypeLabels[selectedPartner.type]}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Chi phí</p>
                  <p className="font-medium mt-1">
                    {selectedPartner.cost === 'Theo bill' ? (
                      <span className="text-muted-foreground italic">Theo bill thực tế</span>
                    ) : (
                      <span>{parseFloat(selectedPartner.cost).toLocaleString('vi-VN')} VNĐ</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Đánh giá</p>
                  <p className="font-medium mt-1">
                    <span className="text-yellow-500">★ {selectedPartner.rating || 0}</span> / 5
                  </p>
                </div>
              </div>

              {selectedPartner.contact_info && (
                <>
                  {selectedPartner.contact_info.contact_person && (
                    <div>
                      <p className="text-sm text-muted-foreground">Người liên hệ</p>
                      <p className="font-medium mt-1">{selectedPartner.contact_info.contact_person}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {selectedPartner.contact_info.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Điện thoại</p>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedPartner.contact_info.phone}</span>
                        </div>
                      </div>
                    )}
                    {selectedPartner.contact_info.email && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Email</p>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedPartner.contact_info.email}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedPartner.contact_info.address && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Địa chỉ</p>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                        <span>{selectedPartner.contact_info.address}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Số dự án đã làm</p>
                  <p className="font-medium mt-1">{selectedPartner.projects_count || 0} dự án</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                  <p className="font-medium mt-1">{(selectedPartner.total_revenue || 0).toLocaleString('vi-VN')} VNĐ</p>
                </div>
              </div>

              {selectedPartner.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Ghi chú</p>
                  <p className="mt-1 bg-muted p-3 rounded-md">{selectedPartner.notes}</p>
                </div>
              )}
            </div>

            <ModalFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedPartner(null);
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
