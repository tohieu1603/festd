'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Package as PackageIcon, Search, Filter, X, SlidersHorizontal, Camera, Users, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { AddPackageModal } from '@/components/packages/AddPackageModal';
import type { Package, PackageCategory } from '@/lib/types';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const categoryLabels: Record<PackageCategory, string> = {
  portrait: 'Portrait',
  family: 'Gia Đình',
  couple: 'Couple',
  wedding: 'Cưới Hỏi',
  event: 'Sự Kiện',
  commercial: 'Thương Mại',
  other: 'Khác',
};

const categoryColors: Record<PackageCategory, string> = {
  portrait: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  family: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
  couple: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  wedding: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  event: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  commercial: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PackageCategory | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await api.get<{ items: Package[] }>('/packages/');
      setPackages(response.items || []);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageClick = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsModalOpen(true);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setPriceRange({ min: '', max: '' });
    setStatusFilter('all');
  };

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      // Search filter
      if (searchTerm && !pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !pkg.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && pkg.category !== selectedCategory) {
        return false;
      }

      // Price range filter
      if (priceRange.min && pkg.price < Number(priceRange.min)) {
        return false;
      }
      if (priceRange.max && pkg.price > Number(priceRange.max)) {
        return false;
      }

      // Status filter
      if (statusFilter === 'active' && !pkg.is_active) {
        return false;
      }
      if (statusFilter === 'inactive' && pkg.is_active) {
        return false;
      }

      return true;
    });
  }, [packages, searchTerm, selectedCategory, priceRange, statusFilter]);

  const activeFiltersCount = [
    searchTerm,
    selectedCategory !== 'all',
    priceRange.min || priceRange.max,
    statusFilter !== 'all',
  ].filter(Boolean).length;

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = { all: packages.length };
    packages.forEach((pkg) => {
      stats[pkg.category] = (stats[pkg.category] || 0) + 1;
    });
    return stats;
  }, [packages]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <PackageIcon className="h-8 w-8 text-primary" />
            Gói Dịch Vụ
          </h1>
          <p className="text-muted-foreground mt-2">
            Quản lý và tùy chỉnh các gói chụp ảnh
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Thêm gói mới
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-card rounded-xl border p-4 space-y-4">
        <div className="flex gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm gói dịch vụ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 text-base"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="h-11 px-4"
          >
            <SlidersHorizontal className="h-5 w-5 mr-2" />
            Lọc
            {activeFiltersCount > 0 && (
              <Badge variant="default" className="ml-2 px-1.5 py-0 h-5 min-w-5">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              onClick={handleClearFilters}
              className="h-11 px-4"
            >
              <X className="h-4 w-4 mr-2" />
              Xóa lọc
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="pt-4 border-t space-y-4">
            {/* Price Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">Khoảng giá</label>
              <div className="flex gap-3 items-center">
                <Input
                  type="number"
                  placeholder="Từ"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="h-10"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Đến"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="h-10"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">VNĐ</span>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Trạng thái</label>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  Tất cả
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                >
                  Đang hoạt động
                </Button>
                <Button
                  variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('inactive')}
                >
                  Tạm dừng
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Tất cả ({categoryStats.all || 0})
        </button>
        {(Object.keys(categoryLabels) as PackageCategory[]).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
              selectedCategory === category
                ? categoryColors[category]
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent'
            }`}
          >
            {categoryLabels[category]} ({categoryStats[category] || 0})
          </button>
        ))}
      </div>

      {/* Packages Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải gói dịch vụ...</p>
          </div>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border">
          <PackageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Không tìm thấy gói dịch vụ</p>
          <p className="text-muted-foreground mt-2">
            {activeFiltersCount > 0
              ? 'Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác'
              : 'Chưa có gói dịch vụ nào'}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Hiển thị <span className="font-semibold text-foreground">{filteredPackages.length}</span> gói
              {filteredPackages.length !== packages.length && (
                <> trong tổng số <span className="font-semibold text-foreground">{packages.length}</span> gói</>
              )}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPackages.map((pkg) => (
              <Card
                key={pkg.id}
                className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-l-4 overflow-hidden group"
                style={{ borderLeftColor: `hsl(var(--primary))` }}
                onClick={() => handlePackageClick(pkg)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryColors[pkg.category]}`}>
                      {categoryLabels[pkg.category]}
                    </div>
                    <Badge variant={pkg.is_active ? 'success' : 'secondary'}>
                      {pkg.is_active ? 'Hoạt động' : 'Tạm dừng'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {pkg.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {pkg.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Price */}
                  <div className="pt-2 border-t">
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(pkg.price)}
                      </p>
                    </div>
                  </div>

                  {/* Package Details */}
                  {pkg.details && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {pkg.details.time && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{pkg.details.time}</span>
                        </div>
                      )}
                      {pkg.details.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{pkg.details.location}</span>
                        </div>
                      )}
                      {pkg.details.photo && (
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4 text-muted-foreground" />
                          <span>{pkg.details.photo} Photographer</span>
                        </div>
                      )}
                      {pkg.details.retouch_photos && (
                        <div className="flex items-center gap-2">
                          <span className="text-primary">✨</span>
                          <span>{pkg.details.retouch_photos} ảnh retouch</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Features */}
                  <div className="pt-3 border-t">
                    <p className="text-sm font-semibold mb-2">Bao gồm:</p>
                    <ul className="space-y-1.5">
                      {(pkg.includes || []).slice(0, 3).map((feature, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span className="line-clamp-1">{feature}</span>
                        </li>
                      ))}
                      {(pkg.includes || []).length > 3 && (
                        <li className="text-sm font-medium text-primary pl-3.5">
                          +{(pkg.includes || []).length - 3} dịch vụ khác
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit Package Modal */}
      {isModalOpen && !selectedPackage && (
        <AddPackageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchPackages();
          }}
        />
      )}

      {/* Package Detail Modal */}
      {selectedPackage && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPackage(null);
          }}
          title={selectedPackage.name}
          size="xl"
        >
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${categoryColors[selectedPackage.category]}`}>
                {categoryLabels[selectedPackage.category]}
              </div>
              <Badge variant={selectedPackage.is_active ? 'success' : 'secondary'} className="text-sm px-3 py-1">
                {selectedPackage.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
              </Badge>
            </div>

            {/* Description */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Mô tả</p>
              <p className="mt-2 text-base">{selectedPackage.description}</p>
            </div>

            {/* Price & Details */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-baseline gap-3 mb-4">
                <p className="text-4xl font-bold text-primary">
                  {formatCurrency(selectedPackage.price)}
                </p>
              </div>
              {selectedPackage.details && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedPackage.details.time && (
                    <div>
                      <p className="text-muted-foreground mb-1">Thời gian</p>
                      <p className="font-medium">{selectedPackage.details.time}</p>
                    </div>
                  )}
                  {selectedPackage.details.location && (
                    <div>
                      <p className="text-muted-foreground mb-1">Địa điểm</p>
                      <p className="font-medium">{selectedPackage.details.location}</p>
                    </div>
                  )}
                  {selectedPackage.details.photo && (
                    <div>
                      <p className="text-muted-foreground mb-1">Photographer</p>
                      <p className="font-medium">{selectedPackage.details.photo}</p>
                    </div>
                  )}
                  {selectedPackage.details.makeup && (
                    <div>
                      <p className="text-muted-foreground mb-1">Makeup Artist</p>
                      <p className="font-medium">{selectedPackage.details.makeup}</p>
                    </div>
                  )}
                  {selectedPackage.details.retouch_photos && (
                    <div>
                      <p className="text-muted-foreground mb-1">Ảnh retouch</p>
                      <p className="font-medium">{selectedPackage.details.retouch_photos} ảnh</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Features List */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Dịch vụ bao gồm</p>
              <ul className="space-y-2 bg-muted/30 rounded-lg p-4">
                {(selectedPackage.includes || []).map((feature: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary text-xs">✓</span>
                    </span>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Notes */}
            {selectedPackage.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ghi chú</p>
                <p className="mt-2 text-sm bg-muted/50 p-3 rounded-lg">{selectedPackage.notes}</p>
              </div>
            )}

            <ModalFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedPackage(null);
                }}
              >
                Đóng
              </Button>
              <Button onClick={() => {
                setIsModalOpen(false);
                setSelectedPackage(null);
                setTimeout(() => {
                  setSelectedPackage(null);
                  setIsModalOpen(true);
                }, 100);
              }}>
                Chỉnh sửa
              </Button>
            </ModalFooter>
          </div>
        </Modal>
      )}
    </div>
  );
}
