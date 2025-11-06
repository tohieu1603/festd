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
              <TableHead>Email</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.map((partner) => (
              <TableRow key={partner.id}>
                <TableCell className="font-mono text-sm">{partner.id}</TableCell>
                <TableCell className="font-medium">{partner.name}</TableCell>
                <TableCell>
                  <Badge variant={partnerTypeColors[partner.partnership_type]}>
                    {partnerTypeLabels[partner.partnership_type]}
                  </Badge>
                </TableCell>
                <TableCell>{partner.contact_person || '-'}</TableCell>
                <TableCell>{partner.phone_number || '-'}</TableCell>
                <TableCell>{partner.email || '-'}</TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{partner.address || '-'}</span>
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
                  <p className="font-mono font-medium mt-1">{selectedPartner.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loại đối tác</p>
                  <Badge variant={partnerTypeColors[selectedPartner.partnership_type]} className="mt-1">
                    {partnerTypeLabels[selectedPartner.partnership_type]}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Người liên hệ</p>
                <p className="font-medium mt-1">{selectedPartner.contact_person}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Điện thoại</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedPartner.phone_number || '-'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedPartner.email}</span>
                  </div>
                </div>
              </div>

              {selectedPartner.address && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Địa chỉ</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <span>{selectedPartner.address}</span>
                  </div>
                </div>
              )}

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
