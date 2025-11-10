'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { api } from '@/lib/api';
import {
  Calendar, Users, MapPin, Clock, Package,
  UserPlus, Camera, Palette, Image, Plus, Trash2
} from 'lucide-react';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project?: any;
}

interface TeamMember {
  employee_id: string;
  salary: number;
  bonus: number;
  notes?: string;
}

export function AddProjectModal({ isOpen, onClose, onSuccess, project }: AddProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [_partners, setPartners] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    package_id: '',
    package_name: '',
    package_price: 0,
    discount: 0,
    payment_status: 'unpaid',
    status: 'confirmed' as 'confirmed' | 'completed' | 'cancelled',
    shoot_date: new Date().toISOString().slice(0, 10),
    shoot_time: '',
    shoot_location: '',
    notes: '',
    team: {
      main_photographer: { employee_id: '', salary: 0, bonus: 0 } as TeamMember,
      assistants: [] as TeamMember[],
      makeup_artists: [] as TeamMember[],
      retouch_artists: [] as TeamMember[],
    },
    partners: [] as string[],
  });

  const [finalPrice, setFinalPrice] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (project) {
        // Ensure team structure is always defined
        const teamData = project.team || {};
        setFormData({
          customer_name: project.customer_name || '',
          customer_phone: project.customer_phone || '',
          customer_email: project.customer_email || '',
          package_id: project.package_id || '',
          package_name: project.package_name || '',
          package_price: project.package_price || 0,
          discount: project.discount || 0,
          payment_status: project.payment?.status || 'unpaid',
          status: project.status || 'confirmed',
          shoot_date: project.shoot_date || new Date().toISOString().slice(0, 10),
          shoot_time: project.shoot_time || '',
          shoot_location: project.location || '',
          notes: project.notes || '',
          team: {
            main_photographer: teamData.main_photographer || { employee_id: '', salary: 0, bonus: 0 },
            assistants: teamData.assistants || [],
            makeup_artists: teamData.makeup_artists || [],
            retouch_artists: teamData.retouch_artists || [],
          },
          partners: project.partners || [],
        });
      } else {
        // Reset form when adding new project
        setFormData({
          customer_name: '',
          customer_phone: '',
          customer_email: '',
          package_id: '',
          package_name: '',
          package_price: 0,
          discount: 0,
          payment_status: 'unpaid',
          status: 'confirmed',
          shoot_date: new Date().toISOString().slice(0, 10),
          shoot_time: '',
          shoot_location: '',
          notes: '',
          team: {
            main_photographer: { employee_id: '', salary: 0, bonus: 0 },
            assistants: [],
            makeup_artists: [],
            retouch_artists: [],
          },
          partners: [],
        });
      }
    }
  }, [isOpen, project]);

  useEffect(() => {
    const price = formData.package_price || 0;
    const discount = formData.discount || 0;
    const final = price - discount;
    setFinalPrice(final);
    setDepositAmount(Math.round(final * 0.6));
    setRemainingAmount(Math.round(final * 0.4));
  }, [formData.package_price, formData.discount]);

  const loadData = async () => {
    try {
      const [packagesData, employeesData, partnersData] = await Promise.all([
        api.get<{ total: number; items: any[] }>('/packages/'),
        api.get<{ total: number; items: any[] }>('/employees/'),
        api.get<{ total: number; items: any[] }>('/partners/'),
      ]);

      setPackages(packagesData.items || []);
      setEmployees(employeesData.items || []);
      setPartners(partnersData.items || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handlePackageSelect = (packageId: string) => {
    if (packageId === 'custom') {
      setFormData(prev => ({
        ...prev,
        package_id: '',
        package_name: '',
        package_price: 0,
      }));
      return;
    }

    const selectedPackage = packages.find(p => p.id === packageId);
    if (selectedPackage) {
      setFormData(prev => ({
        ...prev,
        package_id: packageId,
        package_name: selectedPackage.name,
        package_price: selectedPackage.price,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.team.main_photographer.employee_id) {
      toast.error('Vui lòng chọn Photographer chính!');
      return;
    }

    setLoading(true);

    try {
      // Transform formData to match backend schema
      const payload = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || null,
        package_type: formData.package_id, // Backend expects package_type (UUID)
        package_name: formData.package_name,
        package_price: formData.package_price,
        package_discount: formData.discount,
        shoot_date: formData.shoot_date,
        shoot_time: formData.shoot_time || null,
        location: formData.shoot_location || null,
        notes: formData.notes || null,
        status: 'pending', // New projects always start as pending, status changed from table
        // Transform team data
        team: {
          main_photographer: formData.team.main_photographer.employee_id ? {
            employee: formData.team.main_photographer.employee_id, // Backend expects 'employee' not 'employee_id'
            salary: formData.team.main_photographer.salary || 0,
            bonus: formData.team.main_photographer.bonus || 0,
            notes: null
          } : null,
          assist_photographers: formData.team.assistants.map(a => ({
            employee: a.employee_id,
            salary: a.salary || 0,
            bonus: a.bonus || 0,
            notes: null
          })),
          makeup_artists: formData.team.makeup_artists.map(m => ({
            employee: m.employee_id,
            salary: m.salary || 0,
            bonus: m.bonus || 0,
            notes: null
          })),
          retouch_artists: formData.team.retouch_artists.map(r => ({
            employee: r.employee_id,
            salary: r.salary || 0,
            bonus: r.bonus || 0,
            quantity: 0,
            notes: null
          }))
        },
        payment: {
          status: formData.payment_status,
          deposit: depositAmount,
          final: finalPrice,
          paid: 0,
          payment_history: []
        },
        partners: null,
        additional_packages: []
      };

      console.log('📤 Sending payload:', payload);

      if (project) {
        await api.put(`/projects/${project.id}`, payload);
        toast.success('Cập nhật dự án thành công!');
      } else {
        await api.post('/projects/', payload);
        toast.success('Tạo dự án mới thành công!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ Error saving project:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi lưu dự án');
    } finally {
      setLoading(false);
    }
  };

  // Filter employees by role
  const photographers = employees.filter(e =>
    (e.role === 'Photo/Retouch' || e.role === 'Photographer') &&
    (e.skills?.includes('Chụp chính') || !e.skills || e.skills.length === 0)
  );
  const assistants = employees.filter(e =>
    (e.role === 'Photo/Retouch' || e.role === 'Photographer') &&
    (e.skills?.includes('Chụp phụ') || e.skills?.includes('Chụp chính') || !e.skills || e.skills.length === 0)
  );
  const makeupArtists = employees.filter(e =>
    e.role === 'Makeup Artist' || e.role === 'Makeup'
  );
  const retouchArtists = employees.filter(e =>
    (e.role === 'Photo/Retouch' || e.role === 'Retouch' || e.role === 'Retoucher') &&
    (e.skills?.includes('Retouch') || !e.skills || e.skills.length === 0)
  );

  // Team member handlers
  const addAssistant = () => {
    setFormData(prev => ({
      ...prev,
      team: {
        ...prev.team,
        assistants: [...prev.team.assistants, { employee_id: '', salary: 0, bonus: 0 }]
      }
    }));
  };

  const removeAssistant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      team: {
        ...prev.team,
        assistants: prev.team.assistants.filter((_, i) => i !== index)
      }
    }));
  };

  const updateAssistant = (index: number, field: keyof TeamMember, value: any) => {
    setFormData(prev => ({
      ...prev,
      team: {
        ...prev.team,
        assistants: prev.team.assistants.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const addMakeupArtist = () => {
    setFormData(prev => ({
      ...prev,
      team: {
        ...prev.team,
        makeup_artists: [...prev.team.makeup_artists, { employee_id: '', salary: 0, bonus: 0 }]
      }
    }));
  };

  const removeMakeupArtist = (index: number) => {
    setFormData(prev => ({
      ...prev,
      team: {
        ...prev.team,
        makeup_artists: prev.team.makeup_artists.filter((_, i) => i !== index)
      }
    }));
  };

  const updateMakeupArtist = (index: number, field: keyof TeamMember, value: any) => {
    setFormData(prev => ({
      ...prev,
      team: {
        ...prev.team,
        makeup_artists: prev.team.makeup_artists.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const addRetouchArtist = () => {
    setFormData(prev => ({
      ...prev,
      team: {
        ...prev.team,
        retouch_artists: [...prev.team.retouch_artists, { employee_id: '', salary: 0, bonus: 0 }]
      }
    }));
  };

  const removeRetouchArtist = (index: number) => {
    setFormData(prev => ({
      ...prev,
      team: {
        ...prev.team,
        retouch_artists: prev.team.retouch_artists.filter((_, i) => i !== index)
      }
    }));
  };

  const updateRetouchArtist = (index: number, field: keyof TeamMember, value: any) => {
    setFormData(prev => ({
      ...prev,
      team: {
        ...prev.team,
        retouch_artists: prev.team.retouch_artists.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? "Chỉnh Sửa Dự Án" : "Tạo Dự Án Mới"}
      size="full"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Thông Tin Khách Hàng
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tên Khách Hàng <span className="text-red-600">*</span>
                  </label>
                  <Input
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="Nhập tên khách hàng"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Số Điện Thoại
                    </label>
                    <Input
                      value={formData.customer_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                      placeholder="0123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Package Information */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Thông Tin Gói Chụp
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Chọn Gói Chụp
                  </label>
                  <Select
                    value={formData.package_id}
                    onChange={(e) => handlePackageSelect(e.target.value)}
                    options={[
                      { value: '', label: '-- Chọn gói chụp --' },
                      ...packages.map(pkg => ({
                        value: pkg.id,
                        label: `${pkg.name} - ${pkg.price.toLocaleString()} VNĐ`
                      })),
                      { value: 'custom', label: 'Gói tùy chỉnh' }
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tên Gói Chi Tiết
                  </label>
                  <Input
                    value={formData.package_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, package_name: e.target.value }))}
                    placeholder="VD: Gói chụp ảnh cưới tại Đà Lạt"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Giá Gói (VNĐ) <span className="text-red-600">*</span>
                    </label>
                    <Input
                      type="number"
                      required
                      value={formData.package_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, package_price: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Chiết Khấu (VNĐ)
                    </label>
                    <Input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800 p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900 dark:text-white">Tổng thanh toán:</span>
                    <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{finalPrice.toLocaleString()} VNĐ</span>
                  </div>
                  <div className="h-px bg-amber-200 dark:bg-amber-700"></div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">Cọc 60%:</span>
                    <span className="font-semibold">{depositAmount.toLocaleString()} VNĐ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">Còn lại 40%:</span>
                    <span className="font-semibold">{remainingAmount.toLocaleString()} VNĐ</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trạng Thái Thanh Toán
                  </label>
                  <Select
                    value={formData.payment_status}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_status: e.target.value }))}
                    options={[
                      { value: 'unpaid', label: 'Chưa thanh toán' },
                      { value: 'deposit', label: 'Đã cọc 60%' },
                      { value: 'paid', label: 'Đã thanh toán đủ' }
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Shoot Details */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Chi Tiết Chụp
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ngày Chụp <span className="text-red-600">*</span>
                    </label>
                    <Input
                      type="date"
                      required
                      value={formData.shoot_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, shoot_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Giờ Chụp
                    </label>
                    <Input
                      type="time"
                      value={formData.shoot_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, shoot_time: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Địa Điểm
                  </label>
                  <Input
                    value={formData.shoot_location}
                    onChange={(e) => setFormData(prev => ({ ...prev, shoot_location: e.target.value }))}
                    placeholder="Studio, Ngoại cảnh..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Team */}
          <div className="space-y-6">
            {/* Main Photographer */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-200 dark:border-amber-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Photographer Chính
                  <span className="text-red-600 ml-1">*</span>
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                      Nhân viên <span className="text-red-600">*</span>
                    </label>
                    <Select
                      value={formData.team.main_photographer.employee_id}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        team: { ...prev.team, main_photographer: { ...prev.team.main_photographer, employee_id: e.target.value }}
                      }))}
                      options={[
                        { value: '', label: '-- Chọn --' },
                        ...photographers.map(emp => ({ value: emp.id, label: emp.name }))
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Lương (VNĐ)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.team.main_photographer.salary}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        team: { ...prev.team, main_photographer: { ...prev.team.main_photographer, salary: parseFloat(e.target.value) || 0 }}
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Thưởng (VNĐ)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.team.main_photographer.bonus}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        team: { ...prev.team, main_photographer: { ...prev.team.main_photographer, bonus: parseFloat(e.target.value) || 0 }}
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Assistants */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Trợ Lý Chụp ({formData.team.assistants.length})
                </h3>
                <Button type="button" size="sm" variant="outline" onClick={addAssistant}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-3">
                {formData.team.assistants.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Chưa có trợ lý. Nhấn + để thêm.
                  </p>
                ) : (
                  formData.team.assistants.map((assistant, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Select
                        value={assistant.employee_id}
                        onChange={(e) => updateAssistant(index, 'employee_id', e.target.value)}
                        options={[
                          { value: '', label: '-- Chọn --' },
                          ...assistants.map(emp => ({ value: emp.id, label: emp.name }))
                        ]}
                      />
                      <Input
                        type="number"
                        placeholder="Lương"
                        value={assistant.salary}
                        onChange={(e) => updateAssistant(index, 'salary', parseFloat(e.target.value) || 0)}
                      />
                      <Input
                        type="number"
                        placeholder="Thưởng"
                        value={assistant.bonus}
                        onChange={(e) => updateAssistant(index, 'bonus', parseFloat(e.target.value) || 0)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeAssistant(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Makeup Artists */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Makeup Artists ({formData.team.makeup_artists.length})
                </h3>
                <Button type="button" size="sm" variant="outline" onClick={addMakeupArtist}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-3">
                {formData.team.makeup_artists.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Chưa có makeup artist. Nhấn + để thêm.
                  </p>
                ) : (
                  formData.team.makeup_artists.map((artist, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Select
                        value={artist.employee_id}
                        onChange={(e) => updateMakeupArtist(index, 'employee_id', e.target.value)}
                        options={[
                          { value: '', label: '-- Chọn --' },
                          ...makeupArtists.map(emp => ({ value: emp.id, label: emp.name }))
                        ]}
                      />
                      <Input
                        type="number"
                        placeholder="Lương"
                        value={artist.salary}
                        onChange={(e) => updateMakeupArtist(index, 'salary', parseFloat(e.target.value) || 0)}
                      />
                      <Input
                        type="number"
                        placeholder="Thưởng"
                        value={artist.bonus}
                        onChange={(e) => updateMakeupArtist(index, 'bonus', parseFloat(e.target.value) || 0)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeMakeupArtist(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Retouch Artists */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Retouch Artists ({formData.team.retouch_artists.length})
                </h3>
                <Button type="button" size="sm" variant="outline" onClick={addRetouchArtist}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-3">
                {formData.team.retouch_artists.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Chưa có retouch artist. Nhấn + để thêm.
                  </p>
                ) : (
                  formData.team.retouch_artists.map((artist, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Select
                        value={artist.employee_id}
                        onChange={(e) => updateRetouchArtist(index, 'employee_id', e.target.value)}
                        options={[
                          { value: '', label: '-- Chọn --' },
                          ...retouchArtists.map(emp => ({ value: emp.id, label: emp.name }))
                        ]}
                      />
                      <Input
                        type="number"
                        placeholder="Lương"
                        value={artist.salary}
                        onChange={(e) => updateRetouchArtist(index, 'salary', parseFloat(e.target.value) || 0)}
                      />
                      <Input
                        type="number"
                        placeholder="Thưởng"
                        value={artist.bonus}
                        onChange={(e) => updateRetouchArtist(index, 'bonus', parseFloat(e.target.value) || 0)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeRetouchArtist(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ghi Chú</label>
          <textarea
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 min-h-[80px] focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Thêm ghi chú về dự án..."
          />
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={
              loading ||
              !formData.customer_name ||
              !formData.package_price ||
              !formData.team.main_photographer.employee_id
            }
          >
            {loading ? 'Đang lưu...' : project ? 'Cập Nhật Dự Án' : 'Tạo Dự Án'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
