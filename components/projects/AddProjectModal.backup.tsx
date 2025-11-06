'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TeamMember {
  employee: string;
  name?: string;
  salary: number;
  bonus: number;
  quantity?: number;
  notes?: string;
}

interface MainPhotographer extends TeamMember {}

interface TeamData {
  main_photographer: MainPhotographer;
  assist_photographers: TeamMember[];
  makeup_artists: TeamMember[];
  retouch_artists: TeamMember[];
}

interface AdditionalPackage {
  package_type: string;
  package_name: string;
  package_price: number;
  package_discount: number;
  package_final_price: number;
  notes: string;
  team: TeamData;
}

interface Milestone {
  name: string;
  description: string;
  stage: string;
  status: string;
  start_date: string;
  due_date: string;
  notes: string;
  team: TeamData;
}

export function AddProjectModal({ isOpen, onClose, onSuccess }: AddProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    package_type: '',
    package_name: '',
    package_price: 0,
    package_discount: 0,
    package_final_price: 0,
    shoot_date: new Date().toISOString().split('T')[0],
    shoot_time: '',
    location: '',
    status: 'pending',
    payment: {
      status: 'unpaid',
      deposit: 0,
      final: 0,
      paid: 0,
      payment_history: [] as any[]
    },
    progress: {
      shooting_done: false,
      retouch_done: false,
      delivered: false
    },
    team: {
      main_photographer: { employee: '', name: '', salary: 0, bonus: 0, notes: '' },
      assist_photographers: [] as TeamMember[],
      makeup_artists: [] as TeamMember[],
      retouch_artists: [] as TeamMember[]
    },
    surcharge: {
      extra_hours: 0,
      extra_people: 0,
      extra_photos: 0,
      extra_makeup: 0
    },
    partners: {
      clothing: [] as any[],
      printing: { included: false, actual_cost: 0 },
      flower: { included: false, actual_cost: 0 },
      total_cost: 0,
      notes: [] as string[]
    },
    additional_packages: [] as AdditionalPackage[],
    milestones: [] as Milestone[],
    completed_date: '',
    delivery_date: '',
    notes: '',
  });

  const [finalPrice, setFinalPrice] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadData();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    const final = (formData.package_price || 0) - (formData.package_discount || 0);
    setFinalPrice(final);
    setDepositAmount(final * 0.6);
    setRemainingAmount(final * 0.4);
    setFormData(prev => ({ ...prev, package_final_price: final }));
  }, [formData.package_price, formData.package_discount]);

  // Auto-calculate bonuses when surcharge changes
  useEffect(() => {
    const { extra_hours, extra_people, extra_photos } = formData.surcharge;

    // Calculate bonuses based on surcharge (chi phí thưởng nhân viên)
    const photoBonus = (extra_hours * 300000) + (extra_people * 100000);
    const makeupBonus = (extra_hours * 200000) + (extra_people * 60000);
    const assistBonus = (extra_hours * 200000) + (extra_people * 50000);
    const retouchBonus = extra_photos * 15000;

    // Update team bonuses
    setFormData(prev => ({
      ...prev,
      team: {
        ...prev.team,
        main_photographer: prev.team.main_photographer.employee ? {
          ...prev.team.main_photographer,
          bonus: photoBonus
        } : prev.team.main_photographer,
        makeup_artists: prev.team.makeup_artists.map(member => ({
          ...member,
          bonus: makeupBonus
        })),
        assist_photographers: prev.team.assist_photographers.map(member => ({
          ...member,
          bonus: assistBonus
        })),
        retouch_artists: prev.team.retouch_artists.map(member => ({
          ...member,
          bonus: retouchBonus
        }))
      }
    }));
  }, [formData.surcharge.extra_hours, formData.surcharge.extra_people, formData.surcharge.extra_photos]);

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      package_type: '',
      package_name: '',
      package_price: 0,
      package_discount: 0,
      package_final_price: 0,
      shoot_date: new Date().toISOString().split('T')[0],
      shoot_time: '',
      location: '',
      status: 'pending',
      payment: {
        status: 'unpaid',
        deposit: 0,
        final: 0,
        paid: 0,
        payment_history: []
      },
      progress: {
        shooting_done: false,
        retouch_done: false,
        delivered: false
      },
      team: {
        main_photographer: { employee: '', name: '', salary: 0, bonus: 0, notes: '' },
        assist_photographers: [],
        makeup_artists: [],
        retouch_artists: []
      },
      surcharge: {
        extra_hours: 0,
        extra_people: 0,
        extra_photos: 0,
        extra_makeup: 0
      },
      partners: {
        clothing: [],
        printing: { included: false, actual_cost: 0 },
        flower: { included: false, actual_cost: 0 },
        total_cost: 0,
        notes: []
      },
      additional_packages: [],
      milestones: [],
      completed_date: '',
      delivery_date: '',
      notes: '',
    });
  };

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [packagesRes, employeesRes, partnersRes] = await Promise.all([
        fetch('http://localhost:8000/api/packages/', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:8000/api/employees/', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:8000/api/partners/', {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (packagesRes.ok) {
        const data = await packagesRes.json();
        setPackages(data.items || []);
      }

      if (employeesRes.ok) {
        const data = await employeesRes.json();
        setEmployees(data.items || []);
      }

      if (partnersRes.ok) {
        const data = await partnersRes.json();
        setPartners(data.items || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Vui lòng đăng nhập');
        return;
      }

      const response = await fetch('http://localhost:8000/api/projects/', {
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

      alert('Tạo dự án thành công!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating project:', error);
      alert(error.message || 'Có lỗi xảy ra khi tạo dự án');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev as any)[parent],
        [field]: value
      }
    }));
  };

  const handlePackageChange = (packageId: string) => {
    const selectedPackage = packages.find(p => p.id === packageId);
    if (selectedPackage) {
      // Tự động điền lương cố định từ gói vào team
      const photoSalary = (selectedPackage.details?.photo || 0) * 1000; // Convert từ k sang VNĐ
      const makeupSalary = (selectedPackage.details?.makeup || 0) * 1000;
      const assistSalary = (selectedPackage.details?.assistant || 0) * 1000;
      const retouchSalary = parseFloat(selectedPackage.details?.retouch?.replace('k', '') || '0') * 1000;

      setFormData(prev => ({
        ...prev,
        package_type: packageId,
        package_name: selectedPackage.name,
        package_price: selectedPackage.price,
        team: {
          ...prev.team,
          main_photographer: prev.team.main_photographer.employee ? {
            ...prev.team.main_photographer,
            salary: photoSalary
          } : prev.team.main_photographer,
          assist_photographers: prev.team.assist_photographers.map(member => ({
            ...member,
            salary: assistSalary
          })),
          makeup_artists: prev.team.makeup_artists.map(member => ({
            ...member,
            salary: makeupSalary
          })),
          retouch_artists: prev.team.retouch_artists.map(member => ({
            ...member,
            salary: retouchSalary
          }))
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        package_type: packageId,
      }));
    }
  };

  // Calculate Financial Summary
  const calculateFinancialSummary = () => {
    // Total Revenue = Package price + Surcharge revenue from customer
    const surchargeRevenue =
      (formData.surcharge.extra_hours * 1000000) + // Thời gian chụp phát sinh: 1tr/giờ
      (formData.surcharge.extra_people * 600000) + // Người chụp phát sinh: 600k/người
      (formData.surcharge.extra_makeup * 800000); // Phát sinh 1 mặt makeup: 800k/người
    const totalRevenue = formData.package_final_price + surchargeRevenue;

    // Total Labor Costs = Fixed salaries + Bonuses
    let totalLaborCosts = 0;

    // Main photographer
    if (formData.team.main_photographer.employee) {
      totalLaborCosts += formData.team.main_photographer.salary + formData.team.main_photographer.bonus;
    }

    // Assist photographers
    formData.team.assist_photographers.forEach(member => {
      totalLaborCosts += member.salary + member.bonus;
    });

    // Makeup artists
    formData.team.makeup_artists.forEach(member => {
      totalLaborCosts += member.salary + member.bonus;
    });

    // Retouch artists
    formData.team.retouch_artists.forEach(member => {
      totalLaborCosts += member.salary + member.bonus;
    });

    // Partner costs
    const partnerCosts = formData.partners.total_cost || 0;

    // Total Costs = Labor + Partners
    const totalCosts = totalLaborCosts + partnerCosts;

    // Profit = Revenue - Costs
    const profit = totalRevenue - totalCosts;

    return {
      totalRevenue,
      surchargeRevenue,
      totalLaborCosts,
      partnerCosts,
      totalCosts,
      profit,
      profitMargin: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0
    };
  };

  // Main Team Management - Photographer Chính
  const setMainPhotographer = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        team: {
          ...prev.team,
          main_photographer: {
            employee: employeeId,
            name: emp.name,
            salary: 0,
            bonus: 0,
            notes: ''
          }
        }
      }));
    }
  };

  const updateMainPhotographerField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      team: {
        ...prev.team,
        main_photographer: {
          ...prev.team.main_photographer,
          [field]: value
        }
      }
    }));
  };

  const removeMainPhotographer = () => {
    setFormData(prev => ({
      ...prev,
      team: {
        ...prev.team,
        main_photographer: { employee: '', name: '', salary: 0, bonus: 0, notes: '' }
      }
    }));
  };

  // Assistant Photographers
  const addAssistPhotographer = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp && !formData.team.assist_photographers.find(p => p.employee === employeeId)) {
      setFormData(prev => ({
        ...prev,
        team: {
          ...prev.team,
          assist_photographers: [...prev.team.assist_photographers, {
            employee: employeeId,
            name: emp.name,
            salary: 0,
            bonus: 0,
            notes: ''
          }]
        }
      }));
    }
  };

  const updateAssistPhotographer = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      team: {
        ...prev.team,
        assist_photographers: prev.team.assist_photographers.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const removeAssistPhotographer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      team: {
        ...prev.team,
        assist_photographers: prev.team.assist_photographers.filter((_, i) => i !== index)
      }
    }));
  };

  // Makeup Artists
  const addMakeupArtist = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp && !formData.team.makeup_artists.find(m => m.employee === employeeId)) {
      setFormData(prev => ({
        ...prev,
        team: {
          ...prev.team,
          makeup_artists: [...prev.team.makeup_artists, {
            employee: employeeId,
            name: emp.name,
            salary: 0,
            bonus: 0,
            notes: ''
          }]
        }
      }));
    }
  };

  const updateMakeupArtist = (index: number, field: string, value: any) => {
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

  const removeMakeupArtist = (index: number) => {
    setFormData(prev => ({
      ...prev,
      team: {
        ...prev.team,
        makeup_artists: prev.team.makeup_artists.filter((_, i) => i !== index)
      }
    }));
  };

  // Retouch Artists
  const addRetouchArtist = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp && !formData.team.retouch_artists.find(r => r.employee === employeeId)) {
      setFormData(prev => ({
        ...prev,
        team: {
          ...prev.team,
          retouch_artists: [...prev.team.retouch_artists, {
            employee: employeeId,
            name: emp.name,
            salary: 0,
            bonus: 0,
            quantity: 0,
            notes: ''
          }]
        }
      }));
    }
  };

  const updateRetouchArtist = (index: number, field: string, value: any) => {
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

  const removeRetouchArtist = (index: number) => {
    setFormData(prev => ({
      ...prev,
      team: {
        ...prev.team,
        retouch_artists: prev.team.retouch_artists.filter((_, i) => i !== index)
      }
    }));
  };

  // Partner Management
  const addClothingPartner = () => {
    setFormData(prev => ({
      ...prev,
      partners: {
        ...prev.partners,
        clothing: [...prev.partners.clothing, { partner: '', actual_cost: 0 }]
      }
    }));
  };

  const updateClothingPartner = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      partners: {
        ...prev.partners,
        clothing: prev.partners.clothing.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const removeClothingPartner = (index: number) => {
    setFormData(prev => ({
      ...prev,
      partners: {
        ...prev.partners,
        clothing: prev.partners.clothing.filter((_, i) => i !== index)
      }
    }));
  };

  // Additional Packages Management
  const addAdditionalPackage = () => {
    setFormData(prev => ({
      ...prev,
      additional_packages: [...prev.additional_packages, {
        package_type: '',
        package_name: '',
        package_price: 0,
        package_discount: 0,
        package_final_price: 0,
        notes: '',
        team: {
          main_photographer: { employee: '', name: '', salary: 0, bonus: 0 },
          assist_photographers: [],
          makeup_artists: [],
          retouch_artists: []
        }
      }]
    }));
  };

  const updateAdditionalPackage = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      additional_packages: prev.additional_packages.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value };
          if (field === 'package_price' || field === 'package_discount') {
            updated.package_final_price = (updated.package_price || 0) - (updated.package_discount || 0);
          }
          return updated;
        }
        return item;
      })
    }));
  };

  const removeAdditionalPackage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additional_packages: prev.additional_packages.filter((_, i) => i !== index)
    }));
  };

  // Additional Package Team Management
  const setAdditionalPackageMainPhotographer = (pkgIndex: number, employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        additional_packages: prev.additional_packages.map((pkg, i) =>
          i === pkgIndex ? {
            ...pkg,
            team: {
              ...pkg.team,
              main_photographer: {
                employee: employeeId,
                name: emp.name,
                salary: 0,
                bonus: 0
              }
            }
          } : pkg
        )
      }));
    }
  };

  const updateAdditionalPackageMainPhotographer = (pkgIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      additional_packages: prev.additional_packages.map((pkg, i) =>
        i === pkgIndex ? {
          ...pkg,
          team: {
            ...pkg.team,
            main_photographer: {
              ...pkg.team.main_photographer,
              [field]: value
            }
          }
        } : pkg
      )
    }));
  };

  const removeAdditionalPackageMainPhotographer = (pkgIndex: number) => {
    setFormData(prev => ({
      ...prev,
      additional_packages: prev.additional_packages.map((pkg, i) =>
        i === pkgIndex ? {
          ...pkg,
          team: {
            ...pkg.team,
            main_photographer: { employee: '', name: '', salary: 0, bonus: 0 }
          }
        } : pkg
      )
    }));
  };

  const addAdditionalPackageAssist = (pkgIndex: number, employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        additional_packages: prev.additional_packages.map((pkg, i) =>
          i === pkgIndex ? {
            ...pkg,
            team: {
              ...pkg.team,
              assist_photographers: [...pkg.team.assist_photographers, {
                employee: employeeId,
                name: emp.name,
                salary: 0,
                bonus: 0
              }]
            }
          } : pkg
        )
      }));
    }
  };

  const updateAdditionalPackageAssist = (pkgIndex: number, assistIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      additional_packages: prev.additional_packages.map((pkg, i) =>
        i === pkgIndex ? {
          ...pkg,
          team: {
            ...pkg.team,
            assist_photographers: pkg.team.assist_photographers.map((item, j) =>
              j === assistIndex ? { ...item, [field]: value } : item
            )
          }
        } : pkg
      )
    }));
  };

  const removeAdditionalPackageAssist = (pkgIndex: number, assistIndex: number) => {
    setFormData(prev => ({
      ...prev,
      additional_packages: prev.additional_packages.map((pkg, i) =>
        i === pkgIndex ? {
          ...pkg,
          team: {
            ...pkg.team,
            assist_photographers: pkg.team.assist_photographers.filter((_, j) => j !== assistIndex)
          }
        } : pkg
      )
    }));
  };

  const addAdditionalPackageMakeup = (pkgIndex: number, employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        additional_packages: prev.additional_packages.map((pkg, i) =>
          i === pkgIndex ? {
            ...pkg,
            team: {
              ...pkg.team,
              makeup_artists: [...pkg.team.makeup_artists, {
                employee: employeeId,
                name: emp.name,
                salary: 0,
                bonus: 0
              }]
            }
          } : pkg
        )
      }));
    }
  };

  const updateAdditionalPackageMakeup = (pkgIndex: number, makeupIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      additional_packages: prev.additional_packages.map((pkg, i) =>
        i === pkgIndex ? {
          ...pkg,
          team: {
            ...pkg.team,
            makeup_artists: pkg.team.makeup_artists.map((item, j) =>
              j === makeupIndex ? { ...item, [field]: value } : item
            )
          }
        } : pkg
      )
    }));
  };

  const removeAdditionalPackageMakeup = (pkgIndex: number, makeupIndex: number) => {
    setFormData(prev => ({
      ...prev,
      additional_packages: prev.additional_packages.map((pkg, i) =>
        i === pkgIndex ? {
          ...pkg,
          team: {
            ...pkg.team,
            makeup_artists: pkg.team.makeup_artists.filter((_, j) => j !== makeupIndex)
          }
        } : pkg
      )
    }));
  };

  const addAdditionalPackageRetouch = (pkgIndex: number, employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        additional_packages: prev.additional_packages.map((pkg, i) =>
          i === pkgIndex ? {
            ...pkg,
            team: {
              ...pkg.team,
              retouch_artists: [...pkg.team.retouch_artists, {
                employee: employeeId,
                name: emp.name,
                salary: 0,
                bonus: 0,
                quantity: 0
              }]
            }
          } : pkg
        )
      }));
    }
  };

  const updateAdditionalPackageRetouch = (pkgIndex: number, retouchIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      additional_packages: prev.additional_packages.map((pkg, i) =>
        i === pkgIndex ? {
          ...pkg,
          team: {
            ...pkg.team,
            retouch_artists: pkg.team.retouch_artists.map((item, j) =>
              j === retouchIndex ? { ...item, [field]: value } : item
            )
          }
        } : pkg
      )
    }));
  };

  const removeAdditionalPackageRetouch = (pkgIndex: number, retouchIndex: number) => {
    setFormData(prev => ({
      ...prev,
      additional_packages: prev.additional_packages.map((pkg, i) =>
        i === pkgIndex ? {
          ...pkg,
          team: {
            ...pkg.team,
            retouch_artists: pkg.team.retouch_artists.filter((_, j) => j !== retouchIndex)
          }
        } : pkg
      )
    }));
  };

  // Milestone Management
  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, {
        name: '',
        description: '',
        stage: 'shooting',
        status: 'pending',
        start_date: '',
        due_date: '',
        notes: '',
        team: {
          main_photographer: { employee: '', name: '', salary: 0, bonus: 0 },
          assist_photographers: [],
          makeup_artists: [],
          retouch_artists: []
        }
      }]
    }));
  };

  const updateMilestone = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  // Milestone Team Management (similar pattern to Additional Package)
  const setMilestoneMainPhotographer = (milestoneIndex: number, employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        milestones: prev.milestones.map((milestone, i) =>
          i === milestoneIndex ? {
            ...milestone,
            team: {
              ...milestone.team,
              main_photographer: {
                employee: employeeId,
                name: emp.name,
                salary: 0,
                bonus: 0
              }
            }
          } : milestone
        )
      }));
    }
  };

  const updateMilestoneMainPhotographer = (milestoneIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) =>
        i === milestoneIndex ? {
          ...milestone,
          team: {
            ...milestone.team,
            main_photographer: {
              ...milestone.team.main_photographer,
              [field]: value
            }
          }
        } : milestone
      )
    }));
  };

  const removeMilestoneMainPhotographer = (milestoneIndex: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) =>
        i === milestoneIndex ? {
          ...milestone,
          team: {
            ...milestone.team,
            main_photographer: { employee: '', name: '', salary: 0, bonus: 0 }
          }
        } : milestone
      )
    }));
  };

  const addMilestoneAssist = (milestoneIndex: number, employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        milestones: prev.milestones.map((milestone, i) =>
          i === milestoneIndex ? {
            ...milestone,
            team: {
              ...milestone.team,
              assist_photographers: [...milestone.team.assist_photographers, {
                employee: employeeId,
                name: emp.name,
                salary: 0,
                bonus: 0
              }]
            }
          } : milestone
        )
      }));
    }
  };

  const updateMilestoneAssist = (milestoneIndex: number, assistIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) =>
        i === milestoneIndex ? {
          ...milestone,
          team: {
            ...milestone.team,
            assist_photographers: milestone.team.assist_photographers.map((item, j) =>
              j === assistIndex ? { ...item, [field]: value } : item
            )
          }
        } : milestone
      )
    }));
  };

  const removeMilestoneAssist = (milestoneIndex: number, assistIndex: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) =>
        i === milestoneIndex ? {
          ...milestone,
          team: {
            ...milestone.team,
            assist_photographers: milestone.team.assist_photographers.filter((_, j) => j !== assistIndex)
          }
        } : milestone
      )
    }));
  };

  const addMilestoneMakeup = (milestoneIndex: number, employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        milestones: prev.milestones.map((milestone, i) =>
          i === milestoneIndex ? {
            ...milestone,
            team: {
              ...milestone.team,
              makeup_artists: [...milestone.team.makeup_artists, {
                employee: employeeId,
                name: emp.name,
                salary: 0,
                bonus: 0
              }]
            }
          } : milestone
        )
      }));
    }
  };

  const updateMilestoneMakeup = (milestoneIndex: number, makeupIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) =>
        i === milestoneIndex ? {
          ...milestone,
          team: {
            ...milestone.team,
            makeup_artists: milestone.team.makeup_artists.map((item, j) =>
              j === makeupIndex ? { ...item, [field]: value } : item
            )
          }
        } : milestone
      )
    }));
  };

  const removeMilestoneMakeup = (milestoneIndex: number, makeupIndex: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) =>
        i === milestoneIndex ? {
          ...milestone,
          team: {
            ...milestone.team,
            makeup_artists: milestone.team.makeup_artists.filter((_, j) => j !== makeupIndex)
          }
        } : milestone
      )
    }));
  };

  const addMilestoneRetouch = (milestoneIndex: number, employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        milestones: prev.milestones.map((milestone, i) =>
          i === milestoneIndex ? {
            ...milestone,
            team: {
              ...milestone.team,
              retouch_artists: [...milestone.team.retouch_artists, {
                employee: employeeId,
                name: emp.name,
                salary: 0,
                bonus: 0,
                quantity: 0
              }]
            }
          } : milestone
        )
      }));
    }
  };

  const updateMilestoneRetouch = (milestoneIndex: number, retouchIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) =>
        i === milestoneIndex ? {
          ...milestone,
          team: {
            ...milestone.team,
            retouch_artists: milestone.team.retouch_artists.map((item, j) =>
              j === retouchIndex ? { ...item, [field]: value } : item
            )
          }
        } : milestone
      )
    }));
  };

  const removeMilestoneRetouch = (milestoneIndex: number, retouchIndex: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) =>
        i === milestoneIndex ? {
          ...milestone,
          team: {
            ...milestone.team,
            retouch_artists: milestone.team.retouch_artists.filter((_, j) => j !== retouchIndex)
          }
        } : milestone
      )
    }));
  };

  const packageOptions = [
    { value: '', label: '-- Chọn gói chụp --' },
    ...packages.map(pkg => ({
      value: pkg.id,
      label: `${pkg.name} - ${pkg.price?.toLocaleString() || 0} VNĐ`
    })),
    { value: 'custom', label: 'Gói tùy chỉnh' },
  ];

  const employeeOptions = [
    { value: '', label: '-- Chọn nhân viên --' },
    ...employees.map(emp => ({
      value: emp.id,
      label: `${emp.name} (${emp.role})`
    })),
  ];

  const partnerOptions = [
    { value: '', label: '-- Chọn đối tác --' },
    ...partners.filter(p => p.type === 'clothing').map(p => ({
      value: p.id,
      label: `${p.name} - ${p.cost}`
    })),
  ];

  const paymentStatusOptions = [
    { value: 'unpaid', label: 'Chưa thanh toán' },
    { value: 'deposit', label: 'Đã cọc' },
    { value: 'paid', label: 'Đã thanh toán đủ' },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Đang chờ' },
    { value: 'in-progress', label: 'Đang thực hiện' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  const milestoneStageOptions = [
    { value: 'shooting', label: 'Chụp' },
    { value: 'makeup', label: 'Makeup' },
    { value: 'retouch', label: 'Chỉnh sửa' },
    { value: 'delivery', label: 'Giao hàng' },
    { value: 'custom', label: 'Tùy chỉnh' },
  ];

  const milestoneStatusOptions = [
    { value: 'pending', label: 'Chưa bắt đầu' },
    { value: 'in-progress', label: 'Đang thực hiện' },
    { value: 'completed', label: 'Hoàn thành' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm Dự Án Mới" size="full">
      <form onSubmit={handleSubmit}>
        <style jsx>{`
          .form-section {
            margin-bottom: 25px;
          }
          .form-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #2c3e50;
            font-weight: 500;
          }
          .form-group small {
            color: #95a5a6;
            font-size: 12px;
            margin-top: 5px;
            display: block;
          }
          .required {
            color: #e74c3c;
          }
          .payment-info {
            background: #e8f5e9;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            border: 2px solid #4caf50;
          }
          .payment-info h4 {
            color: #2e7d32;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
          }
          .team-selection {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
          }
          .team-selection h3 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 18px;
          }
          .team-role-section {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            border: 2px solid #e9ecef;
          }
          .team-role-section h4 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
          }
          .team-custom-container {
            margin-top: 15px;
          }
          .team-member-custom {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
            position: relative;
            transition: all 0.3s;
          }
          .team-member-custom:hover {
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
          }
          .team-member-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #dee2e6;
          }
          .team-member-name {
            font-weight: 600;
            color: #2c3e50;
            font-size: 16px;
          }
          .btn-remove-member {
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 5px;
            padding: 5px 15px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.3s;
          }
          .btn-remove-member:hover {
            background: #c82333;
            transform: scale(1.05);
          }
          .custom-inputs-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 10px;
          }
          .custom-input-group {
            display: flex;
            flex-direction: column;
          }
          .custom-input-group label {
            font-size: 13px;
            color: #6c757d;
            margin-bottom: 5px;
            font-weight: 500;
          }
          .custom-notes-group {
            margin-top: 10px;
          }
          .custom-notes-group label {
            font-size: 13px;
            color: #6c757d;
            margin-bottom: 5px;
            font-weight: 500;
            display: block;
          }
          .custom-notes-group textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ced4da;
            border-radius: 5px;
            font-size: 14px;
            resize: vertical;
            min-height: 60px;
            font-family: inherit;
          }
          .additional-packages-section {
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 2px dashed #ddd;
          }
          .additional-packages-section h3 {
            color: #4a90e2;
            margin-bottom: 10px;
          }
          .additional-package-item {
            background: white;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
            position: relative;
          }
          .additional-package-item .package-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0f0f0;
          }
          .additional-package-item .package-header h4 {
            color: #2c3e50;
            font-size: 16px;
          }
          .remove-package-btn {
            background: #d9534f;
            color: white;
            border: none;
            padding: 5px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }
          .remove-package-btn:hover {
            background: #c9302c;
          }
        `}</style>

        {/* Customer Information */}
        <div className="form-section">
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Thông Tin Khách Hàng</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Tên Khách Hàng <span className="required">*</span></label>
              <Input
                required
                value={formData.customer_name}
                onChange={(e) => handleChange('customer_name', e.target.value)}
                placeholder="Nhập tên khách hàng"
              />
            </div>
            <div className="form-group">
              <label>Số Điện Thoại <span className="required">*</span></label>
              <Input
                required
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => handleChange('customer_phone', e.target.value)}
                placeholder="0123456789"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <Input
                type="email"
                value={formData.customer_email}
                onChange={(e) => handleChange('customer_email', e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>
        </div>

        {/* Package Information */}
        <div className="form-section">
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Thông Tin Gói Chụp</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Chọn Gói Chụp <span className="required">*</span></label>
              <Select
                required
                value={formData.package_type}
                onChange={(e) => handlePackageChange(e.target.value)}
                options={packageOptions}
              />
            </div>
            <div className="form-group">
              <label>Tên Gói Chi Tiết <span className="required">*</span></label>
              <Input
                required
                value={formData.package_name}
                onChange={(e) => handleChange('package_name', e.target.value)}
                placeholder="VD: Gói chụp ảnh cưới tại Đà Lạt"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tổng Giá Trị Gói (VNĐ) <span className="required">*</span></label>
              <Input
                type="number"
                required
                value={formData.package_price}
                onChange={(e) => handleChange('package_price', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Chiết Khấu (VNĐ)</label>
              <Input
                type="number"
                value={formData.package_discount}
                onChange={(e) => handleChange('package_discount', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="payment-info">
            <h4>Thông Tin Thanh Toán</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Giá sau chiết khấu:</label>
                <Input type="number" value={finalPrice} disabled />
              </div>
              <div className="form-group">
                <label>Đợt 1 - Cọc (60%):</label>
                <Input type="number" value={depositAmount} disabled />
                <small>Thanh toán khi ký hợp đồng</small>
              </div>
              <div className="form-group">
                <label>Đợt 2 - Còn lại (40%):</label>
                <Input type="number" value={remainingAmount} disabled />
                <small>Thanh toán sau khi nhận ảnh</small>
              </div>
            </div>
            <div className="form-group">
              <label>Trạng Thái Thanh Toán</label>
              <Select
                value={formData.payment.status}
                onChange={(e) => handleNestedChange('payment', 'status', e.target.value)}
                options={paymentStatusOptions}
              />
            </div>
          </div>
        </div>

        {/* Shoot Details */}
        <div className="form-section">
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Chi Tiết Chụp</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Ngày Chụp <span className="required">*</span></label>
              <Input
                type="date"
                required
                value={formData.shoot_date}
                onChange={(e) => handleChange('shoot_date', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Giờ Chụp</label>
              <Input
                type="time"
                value={formData.shoot_time}
                onChange={(e) => handleChange('shoot_time', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Địa Điểm</label>
              <Input
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Studio, Ngoại cảnh..."
              />
            </div>
          </div>
        </div>

        {/* Team Selection - Main Package */}
        <div className="team-selection">
          <h3>Chọn Đội Ngũ Thực Hiện - Gói Chính</h3>
          <p style={{ color: '#7f8c8d', marginBottom: '15px', fontSize: '14px' }}>
            Chọn nhân viên và nhập lương/thưởng tùy chỉnh cho từng người
          </p>

          {/* Main Photographer */}
          <div className="team-role-section">
            <h4>📸 Photographer Chính</h4>
            <div className="form-group">
              <label>Chọn Photographer Chính:</label>
              <Select
                value={formData.team.main_photographer.employee}
                onChange={(e) => setMainPhotographer(e.target.value)}
                options={employeeOptions}
              />
            </div>

            {formData.team.main_photographer.employee && (
              <div className="team-custom-container">
                <div className="team-member-custom">
                  <div className="team-member-header">
                    <span className="team-member-name">{formData.team.main_photographer.name}</span>
                    <button
                      type="button"
                      className="btn-remove-member"
                      onClick={removeMainPhotographer}
                    >
                      Xóa
                    </button>
                  </div>
                  <div className="custom-inputs-grid">
                    <div className="custom-input-group">
                      <label>Lương (VNĐ):</label>
                      <Input
                        type="number"
                        value={formData.team.main_photographer.salary}
                        onChange={(e) => updateMainPhotographerField('salary', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div className="custom-input-group">
                      <label>Thưởng (VNĐ):</label>
                      <Input
                        type="number"
                        value={formData.team.main_photographer.bonus}
                        onChange={(e) => updateMainPhotographerField('bonus', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="custom-notes-group">
                    <label>Ghi chú:</label>
                    <textarea
                      value={formData.team.main_photographer.notes}
                      onChange={(e) => updateMainPhotographerField('notes', e.target.value)}
                      placeholder="Ghi chú về photographer chính..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Assistant Photographers */}
          <div className="team-role-section">
            <h4>📸 Photographer Phụ</h4>
            <div className="form-group">
              <label>Thêm Photographer Phụ:</label>
              <Select
                value=""
                onChange={(e) => e.target.value && addAssistPhotographer(e.target.value)}
                options={employeeOptions}
              />
            </div>

            <div className="team-custom-container">
              {formData.team.assist_photographers.map((member, index) => (
                <div key={index} className="team-member-custom">
                  <div className="team-member-header">
                    <span className="team-member-name">{member.name}</span>
                    <button
                      type="button"
                      className="btn-remove-member"
                      onClick={() => removeAssistPhotographer(index)}
                    >
                      Xóa
                    </button>
                  </div>
                  <div className="custom-inputs-grid">
                    <div className="custom-input-group">
                      <label>Lương (VNĐ):</label>
                      <Input
                        type="number"
                        value={member.salary}
                        onChange={(e) => updateAssistPhotographer(index, 'salary', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div className="custom-input-group">
                      <label>Thưởng (VNĐ):</label>
                      <Input
                        type="number"
                        value={member.bonus}
                        onChange={(e) => updateAssistPhotographer(index, 'bonus', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="custom-notes-group">
                    <label>Ghi chú:</label>
                    <textarea
                      value={member.notes}
                      onChange={(e) => updateAssistPhotographer(index, 'notes', e.target.value)}
                      placeholder="Ghi chú..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Makeup Artists */}
          <div className="team-role-section">
            <h4>💄 Makeup Artist</h4>
            <div className="form-group">
              <label>Thêm Makeup Artist:</label>
              <Select
                value=""
                onChange={(e) => e.target.value && addMakeupArtist(e.target.value)}
                options={employeeOptions}
              />
            </div>

            <div className="team-custom-container">
              {formData.team.makeup_artists.map((member, index) => (
                <div key={index} className="team-member-custom">
                  <div className="team-member-header">
                    <span className="team-member-name">{member.name}</span>
                    <button
                      type="button"
                      className="btn-remove-member"
                      onClick={() => removeMakeupArtist(index)}
                    >
                      Xóa
                    </button>
                  </div>
                  <div className="custom-inputs-grid">
                    <div className="custom-input-group">
                      <label>Lương (VNĐ):</label>
                      <Input
                        type="number"
                        value={member.salary}
                        onChange={(e) => updateMakeupArtist(index, 'salary', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div className="custom-input-group">
                      <label>Thưởng (VNĐ):</label>
                      <Input
                        type="number"
                        value={member.bonus}
                        onChange={(e) => updateMakeupArtist(index, 'bonus', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="custom-notes-group">
                    <label>Ghi chú:</label>
                    <textarea
                      value={member.notes}
                      onChange={(e) => updateMakeupArtist(index, 'notes', e.target.value)}
                      placeholder="Ghi chú..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Retouch Artists */}
          <div className="team-role-section">
            <h4>🎨 Retouch Artist</h4>
            <div className="form-group">
              <label>Thêm Retouch Artist:</label>
              <Select
                value=""
                onChange={(e) => e.target.value && addRetouchArtist(e.target.value)}
                options={employeeOptions}
              />
            </div>

            <div className="team-custom-container">
              {formData.team.retouch_artists.map((member, index) => (
                <div key={index} className="team-member-custom">
                  <div className="team-member-header">
                    <span className="team-member-name">{member.name}</span>
                    <button
                      type="button"
                      className="btn-remove-member"
                      onClick={() => removeRetouchArtist(index)}
                    >
                      Xóa
                    </button>
                  </div>
                  <div className="custom-inputs-grid">
                    <div className="custom-input-group">
                      <label>Số lượng ảnh:</label>
                      <Input
                        type="number"
                        value={member.quantity}
                        onChange={(e) => updateRetouchArtist(index, 'quantity', parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div className="custom-input-group">
                      <label>Lương (VNĐ):</label>
                      <Input
                        type="number"
                        value={member.salary}
                        onChange={(e) => updateRetouchArtist(index, 'salary', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="custom-inputs-grid">
                    <div className="custom-input-group">
                      <label>Thưởng (VNĐ):</label>
                      <Input
                        type="number"
                        value={member.bonus}
                        onChange={(e) => updateRetouchArtist(index, 'bonus', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="custom-notes-group">
                    <label>Ghi chú:</label>
                    <textarea
                      value={member.notes}
                      onChange={(e) => updateRetouchArtist(index, 'notes', e.target.value)}
                      placeholder="Ghi chú..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Surcharge/Bonus Section */}
        <div className="form-section" style={{ background: '#fff8e1', padding: '20px', borderRadius: '10px', margin: '20px 0', border: '2px solid #ffc107' }}>
          <h3 style={{ color: '#f57c00', marginBottom: '10px' }}>⚡ Phụ Thu Khách Hàng (Ngoài Gói)</h3>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
            Chỉ áp dụng khi khách hàng vượt quá thời gian hoặc yêu cầu thêm dịch vụ ngoài gói
          </p>

          <div style={{ marginBottom: '20px', padding: '12px', background: '#e3f2fd', borderRadius: '8px', border: '1px solid #2196f3' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#1565c0' }}>
              📊 Doanh Thu Phụ Thu (Báo Khách):
            </h4>
            <div style={{ fontSize: '12px', color: '#333', lineHeight: '1.8' }}>
              • Thời gian chụp phát sinh: <strong>1.000.000 VNĐ/giờ</strong><br/>
              • Người chụp phát sinh: <strong>600.000 VNĐ/người</strong><br/>
              • Phát sinh 1 mặt makeup: <strong>800.000 VNĐ/người</strong>
            </div>
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            <div className="form-group">
              <label>⏰ Thời gian phát sinh (giờ):</label>
              <Input
                type="number"
                value={formData.surcharge.extra_hours}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  surcharge: { ...prev.surcharge, extra_hours: parseInt(e.target.value) || 0 }
                }))}
                placeholder="0"
                min="0"
              />
              <small style={{ color: '#d32f2f', fontSize: '11px', fontWeight: '600' }}>
                💰 Thu khách: +1tr/giờ
              </small>
            </div>

            <div className="form-group">
              <label>👥 Người chụp phát sinh:</label>
              <Input
                type="number"
                value={formData.surcharge.extra_people}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  surcharge: { ...prev.surcharge, extra_people: parseInt(e.target.value) || 0 }
                }))}
                placeholder="0"
                min="0"
              />
              <small style={{ color: '#d32f2f', fontSize: '11px', fontWeight: '600' }}>
                💰 Thu khách: +600k/người
              </small>
            </div>

            <div className="form-group">
              <label>💄 Makeup phát sinh (người):</label>
              <Input
                type="number"
                value={formData.surcharge.extra_makeup}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  surcharge: { ...prev.surcharge, extra_makeup: parseInt(e.target.value) || 0 }
                }))}
                placeholder="0"
                min="0"
              />
              <small style={{ color: '#d32f2f', fontSize: '11px', fontWeight: '600' }}>
                💰 Thu khách: +800k/người
              </small>
            </div>

            <div className="form-group">
              <label>📸 Retouch thêm (ảnh):</label>
              <Input
                type="number"
                value={formData.surcharge.extra_photos}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  surcharge: { ...prev.surcharge, extra_photos: parseInt(e.target.value) || 0 }
                }))}
                placeholder="0"
                min="0"
              />
              <small style={{ color: '#666', fontSize: '11px' }}>
                (Không tính vào doanh thu khách)
              </small>
            </div>
          </div>

          {/* Customer Surcharge Revenue Summary */}
          {(formData.surcharge.extra_hours > 0 || formData.surcharge.extra_people > 0 || formData.surcharge.extra_makeup > 0) && (
            <div style={{ marginTop: '15px', padding: '15px', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #4caf50' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#2e7d32' }}>
                💵 Tổng Phụ Thu Từ Khách:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px' }}>
                {formData.surcharge.extra_hours > 0 && (
                  <div>
                    <strong>Thời gian phát sinh:</strong> {(formData.surcharge.extra_hours * 1000000).toLocaleString('vi-VN')} VNĐ
                  </div>
                )}
                {formData.surcharge.extra_people > 0 && (
                  <div>
                    <strong>Người chụp thêm:</strong> {(formData.surcharge.extra_people * 600000).toLocaleString('vi-VN')} VNĐ
                  </div>
                )}
                {formData.surcharge.extra_makeup > 0 && (
                  <div>
                    <strong>Makeup phát sinh:</strong> {(formData.surcharge.extra_makeup * 800000).toLocaleString('vi-VN')} VNĐ
                  </div>
                )}
                <div style={{ gridColumn: 'span 2', marginTop: '8px', paddingTop: '8px', borderTop: '2px solid #4caf50', fontSize: '15px', fontWeight: 'bold', color: '#1b5e20' }}>
                  Tổng phụ thu: {((formData.surcharge.extra_hours * 1000000) + (formData.surcharge.extra_people * 600000) + (formData.surcharge.extra_makeup * 800000)).toLocaleString('vi-VN')} VNĐ
                </div>
              </div>
            </div>
          )}

          {/* Employee Bonus Summary */}
          {(formData.surcharge.extra_hours > 0 || formData.surcharge.extra_people > 0 || formData.surcharge.extra_photos > 0) && (
            <div style={{ marginTop: '15px', padding: '15px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#856404' }}>
                💰 Chi Phí Thưởng Nhân Viên:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px' }}>
                <div>
                  <strong>Photo Chính:</strong> {((formData.surcharge.extra_hours * 300000) + (formData.surcharge.extra_people * 100000)).toLocaleString('vi-VN')} VNĐ
                </div>
                <div>
                  <strong>Makeup:</strong> {((formData.surcharge.extra_hours * 200000) + (formData.surcharge.extra_people * 60000)).toLocaleString('vi-VN')} VNĐ
                </div>
                <div>
                  <strong>Chụp Phụ:</strong> {((formData.surcharge.extra_hours * 200000) + (formData.surcharge.extra_people * 50000)).toLocaleString('vi-VN')} VNĐ
                </div>
                <div>
                  <strong>Retouch:</strong> {(formData.surcharge.extra_photos * 15000).toLocaleString('vi-VN')} VNĐ
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Financial Summary Section */}
        {formData.package_type && (() => {
          const summary = calculateFinancialSummary();
          return (
            <div className="form-section" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '25px', borderRadius: '12px', margin: '20px 0', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}>
              <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
                💎 Tổng Quan Tài Chính
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                {/* Revenue Section */}
                <div style={{ background: 'rgba(255,255,255,0.95)', padding: '15px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', textTransform: 'uppercase', fontWeight: '600' }}>
                    Doanh Thu
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32', marginBottom: '10px' }}>
                    {summary.totalRevenue.toLocaleString('vi-VN')} VNĐ
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Giá gói:</span>
                      <span style={{ fontWeight: '600' }}>{formData.package_final_price.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    {summary.surchargeRevenue > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f57c00' }}>
                        <span>Phụ thu:</span>
                        <span style={{ fontWeight: '600' }}>+{summary.surchargeRevenue.toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cost Section */}
                <div style={{ background: 'rgba(255,255,255,0.95)', padding: '15px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', textTransform: 'uppercase', fontWeight: '600' }}>
                    Chi Phí
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d32f2f', marginBottom: '10px' }}>
                    {summary.totalCosts.toLocaleString('vi-VN')} VNĐ
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Nhân sự:</span>
                      <span style={{ fontWeight: '600' }}>{summary.totalLaborCosts.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    {summary.partnerCosts > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Đối tác:</span>
                        <span style={{ fontWeight: '600' }}>{summary.partnerCosts.toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Profit Section */}
                <div style={{
                  background: summary.profit >= 0
                    ? 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)'
                    : 'linear-gradient(135deg, #f44336 0%, #c62828 100%)',
                  padding: '15px',
                  borderRadius: '10px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                  gridColumn: 'span 2'
                }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', marginBottom: '5px', textTransform: 'uppercase', fontWeight: '600' }}>
                    Lợi Nhuận Dự Kiến
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff' }}>
                      {summary.profit >= 0 ? '+' : ''}{summary.profit.toLocaleString('vi-VN')} VNĐ
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
                        {summary.profitMargin.toFixed(1)}%
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
                        Tỷ suất lợi nhuận
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning if loss */}
              {summary.profit < 0 && (
                <div style={{ marginTop: '15px', padding: '12px', background: '#fff3cd', borderRadius: '8px', border: '2px solid #ffc107', color: '#856404', fontSize: '13px', fontWeight: '600' }}>
                  ⚠️ Cảnh báo: Dự án này đang bị lỗ! Vui lòng xem xét lại chi phí hoặc giá gói.
                </div>
              )}
            </div>
          );
        })()}

        {/* Partners Section */}
        <div className="form-section" style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', margin: '20px 0' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Chọn Đối Tác</h3>

          <div className="form-group">
            <label>Đối Tác Trang Phục:</label>
            <Button type="button" onClick={addClothingPartner} size="sm" style={{ marginBottom: '10px' }}>
              + Thêm Đối Tác
            </Button>

            {formData.partners.clothing.map((item, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '10px', marginBottom: '10px' }}>
                <Select
                  value={item.partner}
                  onChange={(e) => updateClothingPartner(index, 'partner', e.target.value)}
                  options={partnerOptions}
                />
                <Input
                  type="number"
                  value={item.actual_cost}
                  onChange={(e) => updateClothingPartner(index, 'actual_cost', parseFloat(e.target.value) || 0)}
                  placeholder="Chi phí (VNĐ)"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => removeClothingPartner(index)}>
                  Xóa
                </Button>
              </div>
            ))}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.partners.printing.included}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    partners: {
                      ...prev.partners,
                      printing: { ...prev.partners.printing, included: e.target.checked }
                    }
                  }))}
                  style={{ width: '18px', height: '18px' }}
                />
                <span>🖨️ In ảnh</span>
              </label>
              <Input
                type="number"
                value={formData.partners.printing.actual_cost}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  partners: {
                    ...prev.partners,
                    printing: { ...prev.partners.printing, actual_cost: parseFloat(e.target.value) || 0 }
                  }
                }))}
                placeholder="Chi phí thực tế (VNĐ)"
                disabled={!formData.partners.printing.included}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.partners.flower.included}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    partners: {
                      ...prev.partners,
                      flower: { ...prev.partners.flower, included: e.target.checked }
                    }
                  }))}
                  style={{ width: '18px', height: '18px' }}
                />
                <span>🌸 Hoa cưới</span>
              </label>
              <Input
                type="number"
                value={formData.partners.flower.actual_cost}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  partners: {
                    ...prev.partners,
                    flower: { ...prev.partners.flower, actual_cost: parseFloat(e.target.value) || 0 }
                  }
                }))}
                placeholder="Chi phí thực tế (VNĐ)"
                disabled={!formData.partners.flower.included}
              />
            </div>
          </div>
        </div>

        {/* Additional Packages Section */}
        <div className="additional-packages-section">
          <h3>📦 Gói Phụ (Đi Kèm)</h3>
          <p style={{ color: '#7f8c8d', marginBottom: '15px', fontSize: '14px' }}>
            Thêm các gói chụp bổ sung (nếu có). Mỗi gói có thể có đội ngũ riêng.
          </p>
          <Button type="button" onClick={addAdditionalPackage} size="sm">
            + Thêm Gói Phụ
          </Button>

          {formData.additional_packages.map((pkg, pkgIndex) => (
            <div key={pkgIndex} className="additional-package-item">
              <div className="package-header">
                <h4>Gói Phụ #{pkgIndex + 1}</h4>
                <button
                  type="button"
                  className="remove-package-btn"
                  onClick={() => removeAdditionalPackage(pkgIndex)}
                >
                  Xóa Gói
                </button>
              </div>

              {/* Package Info */}
              <div className="form-row">
                <div className="form-group">
                  <label>Chọn Gói:</label>
                  <Select
                    value={pkg.package_type}
                    onChange={(e) => {
                      const selectedPkg = packages.find(p => p.id === e.target.value);
                      if (selectedPkg) {
                        updateAdditionalPackage(pkgIndex, 'package_type', e.target.value);
                        updateAdditionalPackage(pkgIndex, 'package_name', selectedPkg.name);
                        updateAdditionalPackage(pkgIndex, 'package_price', selectedPkg.price);
                      } else {
                        updateAdditionalPackage(pkgIndex, 'package_type', e.target.value);
                      }
                    }}
                    options={packageOptions}
                  />
                </div>
                <div className="form-group">
                  <label>Tên Gói:</label>
                  <Input
                    value={pkg.package_name}
                    onChange={(e) => updateAdditionalPackage(pkgIndex, 'package_name', e.target.value)}
                    placeholder="Tên gói chi tiết"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Giá (VNĐ):</label>
                  <Input
                    type="number"
                    value={pkg.package_price}
                    onChange={(e) => updateAdditionalPackage(pkgIndex, 'package_price', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Chiết Khấu (VNĐ):</label>
                  <Input
                    type="number"
                    value={pkg.package_discount}
                    onChange={(e) => updateAdditionalPackage(pkgIndex, 'package_discount', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Giá Sau Chiết Khấu:</label>
                  <Input
                    type="number"
                    value={pkg.package_final_price}
                    disabled
                  />
                </div>
              </div>

              {/* Team Selection for this Package */}
              <div className="team-selection" style={{ marginTop: '15px' }}>
                <h4 style={{ fontSize: '16px', marginBottom: '15px' }}>Đội ngũ cho gói phụ #{pkgIndex + 1}</h4>

                {/* Main Photographer */}
                <div className="team-role-section">
                  <h4>📸 Photographer Chính</h4>
                  <div className="form-group">
                    <label>Chọn Photographer Chính:</label>
                    <Select
                      value={pkg.team.main_photographer.employee}
                      onChange={(e) => setAdditionalPackageMainPhotographer(pkgIndex, e.target.value)}
                      options={employeeOptions}
                    />
                  </div>

                  {pkg.team.main_photographer.employee && (
                    <div className="team-custom-container">
                      <div className="team-member-custom">
                        <div className="team-member-header">
                          <span className="team-member-name">{pkg.team.main_photographer.name}</span>
                          <button
                            type="button"
                            className="btn-remove-member"
                            onClick={() => removeAdditionalPackageMainPhotographer(pkgIndex)}
                          >
                            Xóa
                          </button>
                        </div>
                        <div className="custom-inputs-grid">
                          <div className="custom-input-group">
                            <label>Lương (VNĐ):</label>
                            <Input
                              type="number"
                              value={pkg.team.main_photographer.salary}
                              onChange={(e) => updateAdditionalPackageMainPhotographer(pkgIndex, 'salary', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                          <div className="custom-input-group">
                            <label>Thưởng (VNĐ):</label>
                            <Input
                              type="number"
                              value={pkg.team.main_photographer.bonus}
                              onChange={(e) => updateAdditionalPackageMainPhotographer(pkgIndex, 'bonus', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="custom-notes-group">
                          <label>Ghi chú:</label>
                          <textarea
                            value={pkg.team.main_photographer.notes}
                            onChange={(e) => updateAdditionalPackageMainPhotographer(pkgIndex, 'notes', e.target.value)}
                            placeholder="Ghi chú..."
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Assistant Photographers */}
                <div className="team-role-section">
                  <h4>📸 Photographer Phụ</h4>
                  <div className="form-group">
                    <label>Thêm Photographer Phụ:</label>
                    <Select
                      value=""
                      onChange={(e) => e.target.value && addAdditionalPackageAssist(pkgIndex, e.target.value)}
                      options={employeeOptions}
                    />
                  </div>

                  <div className="team-custom-container">
                    {pkg.team.assist_photographers.map((member, assistIndex) => (
                      <div key={assistIndex} className="team-member-custom">
                        <div className="team-member-header">
                          <span className="team-member-name">{member.name}</span>
                          <button
                            type="button"
                            className="btn-remove-member"
                            onClick={() => removeAdditionalPackageAssist(pkgIndex, assistIndex)}
                          >
                            Xóa
                          </button>
                        </div>
                        <div className="custom-inputs-grid">
                          <div className="custom-input-group">
                            <label>Lương (VNĐ):</label>
                            <Input
                              type="number"
                              value={member.salary}
                              onChange={(e) => updateAdditionalPackageAssist(pkgIndex, assistIndex, 'salary', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                          <div className="custom-input-group">
                            <label>Thưởng (VNĐ):</label>
                            <Input
                              type="number"
                              value={member.bonus}
                              onChange={(e) => updateAdditionalPackageAssist(pkgIndex, assistIndex, 'bonus', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="custom-notes-group">
                          <label>Ghi chú:</label>
                          <textarea
                            value={member.notes}
                            onChange={(e) => updateAdditionalPackageAssist(pkgIndex, assistIndex, 'notes', e.target.value)}
                            placeholder="Ghi chú..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Makeup Artists */}
                <div className="team-role-section">
                  <h4>💄 Makeup Artist</h4>
                  <div className="form-group">
                    <label>Thêm Makeup Artist:</label>
                    <Select
                      value=""
                      onChange={(e) => e.target.value && addAdditionalPackageMakeup(pkgIndex, e.target.value)}
                      options={employeeOptions}
                    />
                  </div>

                  <div className="team-custom-container">
                    {pkg.team.makeup_artists.map((member, makeupIndex) => (
                      <div key={makeupIndex} className="team-member-custom">
                        <div className="team-member-header">
                          <span className="team-member-name">{member.name}</span>
                          <button
                            type="button"
                            className="btn-remove-member"
                            onClick={() => removeAdditionalPackageMakeup(pkgIndex, makeupIndex)}
                          >
                            Xóa
                          </button>
                        </div>
                        <div className="custom-inputs-grid">
                          <div className="custom-input-group">
                            <label>Lương (VNĐ):</label>
                            <Input
                              type="number"
                              value={member.salary}
                              onChange={(e) => updateAdditionalPackageMakeup(pkgIndex, makeupIndex, 'salary', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                          <div className="custom-input-group">
                            <label>Thưởng (VNĐ):</label>
                            <Input
                              type="number"
                              value={member.bonus}
                              onChange={(e) => updateAdditionalPackageMakeup(pkgIndex, makeupIndex, 'bonus', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="custom-notes-group">
                          <label>Ghi chú:</label>
                          <textarea
                            value={member.notes}
                            onChange={(e) => updateAdditionalPackageMakeup(pkgIndex, makeupIndex, 'notes', e.target.value)}
                            placeholder="Ghi chú..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Retouch Artists */}
                <div className="team-role-section">
                  <h4>🎨 Retouch Artist</h4>
                  <div className="form-group">
                    <label>Thêm Retouch Artist:</label>
                    <Select
                      value=""
                      onChange={(e) => e.target.value && addAdditionalPackageRetouch(pkgIndex, e.target.value)}
                      options={employeeOptions}
                    />
                  </div>

                  <div className="team-custom-container">
                    {pkg.team.retouch_artists.map((member, retouchIndex) => (
                      <div key={retouchIndex} className="team-member-custom">
                        <div className="team-member-header">
                          <span className="team-member-name">{member.name}</span>
                          <button
                            type="button"
                            className="btn-remove-member"
                            onClick={() => removeAdditionalPackageRetouch(pkgIndex, retouchIndex)}
                          >
                            Xóa
                          </button>
                        </div>
                        <div className="custom-inputs-grid">
                          <div className="custom-input-group">
                            <label>Số lượng ảnh:</label>
                            <Input
                              type="number"
                              value={member.quantity}
                              onChange={(e) => updateAdditionalPackageRetouch(pkgIndex, retouchIndex, 'quantity', parseInt(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                          <div className="custom-input-group">
                            <label>Lương (VNĐ):</label>
                            <Input
                              type="number"
                              value={member.salary}
                              onChange={(e) => updateAdditionalPackageRetouch(pkgIndex, retouchIndex, 'salary', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="custom-inputs-grid">
                          <div className="custom-input-group">
                            <label>Thưởng (VNĐ):</label>
                            <Input
                              type="number"
                              value={member.bonus}
                              onChange={(e) => updateAdditionalPackageRetouch(pkgIndex, retouchIndex, 'bonus', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="custom-notes-group">
                          <label>Ghi chú:</label>
                          <textarea
                            value={member.notes}
                            onChange={(e) => updateAdditionalPackageRetouch(pkgIndex, retouchIndex, 'notes', e.target.value)}
                            placeholder="Ghi chú..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Package Notes */}
              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>Ghi chú cho gói phụ:</label>
                <textarea
                  value={pkg.notes}
                  onChange={(e) => updateAdditionalPackage(pkgIndex, 'notes', e.target.value)}
                  placeholder="Ghi chú về gói phụ này..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '5px',
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '60px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Milestones Section */}
        <div className="additional-packages-section">
          <h3>🎯 Giai Đoạn Dự Án (Milestones)</h3>
          <p style={{ color: '#7f8c8d', marginBottom: '15px', fontSize: '14px' }}>
            Chia dự án thành các giai đoạn với thời gian và đội ngũ cụ thể.
          </p>
          <Button type="button" onClick={addMilestone} size="sm">
            + Thêm Giai Đoạn
          </Button>

          {formData.milestones.map((milestone, milestoneIndex) => (
            <div key={milestoneIndex} className="additional-package-item">
              <div className="package-header">
                <h4>Giai Đoạn #{milestoneIndex + 1}</h4>
                <button
                  type="button"
                  className="remove-package-btn"
                  onClick={() => removeMilestone(milestoneIndex)}
                >
                  Xóa Giai Đoạn
                </button>
              </div>

              {/* Milestone Info */}
              <div className="form-row">
                <div className="form-group">
                  <label>Tên Giai Đoạn:</label>
                  <Input
                    value={milestone.name}
                    onChange={(e) => updateMilestone(milestoneIndex, 'name', e.target.value)}
                    placeholder="VD: Chụp ảnh ngoại cảnh"
                  />
                </div>
                <div className="form-group">
                  <label>Loại:</label>
                  <Select
                    value={milestone.stage}
                    onChange={(e) => updateMilestone(milestoneIndex, 'stage', e.target.value)}
                    options={milestoneStageOptions}
                  />
                </div>
                <div className="form-group">
                  <label>Trạng Thái:</label>
                  <Select
                    value={milestone.status}
                    onChange={(e) => updateMilestone(milestoneIndex, 'status', e.target.value)}
                    options={milestoneStatusOptions}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ngày Bắt Đầu:</label>
                  <Input
                    type="date"
                    value={milestone.start_date}
                    onChange={(e) => updateMilestone(milestoneIndex, 'start_date', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Ngày Kết Thúc:</label>
                  <Input
                    type="date"
                    value={milestone.due_date}
                    onChange={(e) => updateMilestone(milestoneIndex, 'due_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mô Tả:</label>
                <textarea
                  value={milestone.description}
                  onChange={(e) => updateMilestone(milestoneIndex, 'description', e.target.value)}
                  placeholder="Mô tả chi tiết về giai đoạn này..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '5px',
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '60px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Team Selection for this Milestone */}
              <div className="team-selection" style={{ marginTop: '15px' }}>
                <h4 style={{ fontSize: '16px', marginBottom: '15px' }}>Đội ngũ cho giai đoạn #{milestoneIndex + 1}</h4>

                {/* Main Photographer */}
                <div className="team-role-section">
                  <h4>📸 Photographer Chính</h4>
                  <div className="form-group">
                    <label>Chọn Photographer Chính:</label>
                    <Select
                      value={milestone.team.main_photographer.employee}
                      onChange={(e) => setMilestoneMainPhotographer(milestoneIndex, e.target.value)}
                      options={employeeOptions}
                    />
                  </div>

                  {milestone.team.main_photographer.employee && (
                    <div className="team-custom-container">
                      <div className="team-member-custom">
                        <div className="team-member-header">
                          <span className="team-member-name">{milestone.team.main_photographer.name}</span>
                          <button
                            type="button"
                            className="btn-remove-member"
                            onClick={() => removeMilestoneMainPhotographer(milestoneIndex)}
                          >
                            Xóa
                          </button>
                        </div>
                        <div className="custom-inputs-grid">
                          <div className="custom-input-group">
                            <label>Lương (VNĐ):</label>
                            <Input
                              type="number"
                              value={milestone.team.main_photographer.salary}
                              onChange={(e) => updateMilestoneMainPhotographer(milestoneIndex, 'salary', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                          <div className="custom-input-group">
                            <label>Thưởng (VNĐ):</label>
                            <Input
                              type="number"
                              value={milestone.team.main_photographer.bonus}
                              onChange={(e) => updateMilestoneMainPhotographer(milestoneIndex, 'bonus', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="custom-notes-group">
                          <label>Ghi chú:</label>
                          <textarea
                            value={milestone.team.main_photographer.notes}
                            onChange={(e) => updateMilestoneMainPhotographer(milestoneIndex, 'notes', e.target.value)}
                            placeholder="Ghi chú..."
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Assistant Photographers */}
                <div className="team-role-section">
                  <h4>📸 Photographer Phụ</h4>
                  <div className="form-group">
                    <label>Thêm Photographer Phụ:</label>
                    <Select
                      value=""
                      onChange={(e) => e.target.value && addMilestoneAssist(milestoneIndex, e.target.value)}
                      options={employeeOptions}
                    />
                  </div>

                  <div className="team-custom-container">
                    {milestone.team.assist_photographers.map((member, assistIndex) => (
                      <div key={assistIndex} className="team-member-custom">
                        <div className="team-member-header">
                          <span className="team-member-name">{member.name}</span>
                          <button
                            type="button"
                            className="btn-remove-member"
                            onClick={() => removeMilestoneAssist(milestoneIndex, assistIndex)}
                          >
                            Xóa
                          </button>
                        </div>
                        <div className="custom-inputs-grid">
                          <div className="custom-input-group">
                            <label>Lương (VNĐ):</label>
                            <Input
                              type="number"
                              value={member.salary}
                              onChange={(e) => updateMilestoneAssist(milestoneIndex, assistIndex, 'salary', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                          <div className="custom-input-group">
                            <label>Thưởng (VNĐ):</label>
                            <Input
                              type="number"
                              value={member.bonus}
                              onChange={(e) => updateMilestoneAssist(milestoneIndex, assistIndex, 'bonus', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="custom-notes-group">
                          <label>Ghi chú:</label>
                          <textarea
                            value={member.notes}
                            onChange={(e) => updateMilestoneAssist(milestoneIndex, assistIndex, 'notes', e.target.value)}
                            placeholder="Ghi chú..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Makeup Artists */}
                <div className="team-role-section">
                  <h4>💄 Makeup Artist</h4>
                  <div className="form-group">
                    <label>Thêm Makeup Artist:</label>
                    <Select
                      value=""
                      onChange={(e) => e.target.value && addMilestoneMakeup(milestoneIndex, e.target.value)}
                      options={employeeOptions}
                    />
                  </div>

                  <div className="team-custom-container">
                    {milestone.team.makeup_artists.map((member, makeupIndex) => (
                      <div key={makeupIndex} className="team-member-custom">
                        <div className="team-member-header">
                          <span className="team-member-name">{member.name}</span>
                          <button
                            type="button"
                            className="btn-remove-member"
                            onClick={() => removeMilestoneMakeup(milestoneIndex, makeupIndex)}
                          >
                            Xóa
                          </button>
                        </div>
                        <div className="custom-inputs-grid">
                          <div className="custom-input-group">
                            <label>Lương (VNĐ):</label>
                            <Input
                              type="number"
                              value={member.salary}
                              onChange={(e) => updateMilestoneMakeup(milestoneIndex, makeupIndex, 'salary', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                          <div className="custom-input-group">
                            <label>Thưởng (VNĐ):</label>
                            <Input
                              type="number"
                              value={member.bonus}
                              onChange={(e) => updateMilestoneMakeup(milestoneIndex, makeupIndex, 'bonus', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="custom-notes-group">
                          <label>Ghi chú:</label>
                          <textarea
                            value={member.notes}
                            onChange={(e) => updateMilestoneMakeup(milestoneIndex, makeupIndex, 'notes', e.target.value)}
                            placeholder="Ghi chú..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Retouch Artists */}
                <div className="team-role-section">
                  <h4>🎨 Retouch Artist</h4>
                  <div className="form-group">
                    <label>Thêm Retouch Artist:</label>
                    <Select
                      value=""
                      onChange={(e) => e.target.value && addMilestoneRetouch(milestoneIndex, e.target.value)}
                      options={employeeOptions}
                    />
                  </div>

                  <div className="team-custom-container">
                    {milestone.team.retouch_artists.map((member, retouchIndex) => (
                      <div key={retouchIndex} className="team-member-custom">
                        <div className="team-member-header">
                          <span className="team-member-name">{member.name}</span>
                          <button
                            type="button"
                            className="btn-remove-member"
                            onClick={() => removeMilestoneRetouch(milestoneIndex, retouchIndex)}
                          >
                            Xóa
                          </button>
                        </div>
                        <div className="custom-inputs-grid">
                          <div className="custom-input-group">
                            <label>Số lượng ảnh:</label>
                            <Input
                              type="number"
                              value={member.quantity}
                              onChange={(e) => updateMilestoneRetouch(milestoneIndex, retouchIndex, 'quantity', parseInt(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                          <div className="custom-input-group">
                            <label>Lương (VNĐ):</label>
                            <Input
                              type="number"
                              value={member.salary}
                              onChange={(e) => updateMilestoneRetouch(milestoneIndex, retouchIndex, 'salary', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="custom-inputs-grid">
                          <div className="custom-input-group">
                            <label>Thưởng (VNĐ):</label>
                            <Input
                              type="number"
                              value={member.bonus}
                              onChange={(e) => updateMilestoneRetouch(milestoneIndex, retouchIndex, 'bonus', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="custom-notes-group">
                          <label>Ghi chú:</label>
                          <textarea
                            value={member.notes}
                            onChange={(e) => updateMilestoneRetouch(milestoneIndex, retouchIndex, 'notes', e.target.value)}
                            placeholder="Ghi chú..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Milestone Notes */}
              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>Ghi chú cho giai đoạn:</label>
                <textarea
                  value={milestone.notes}
                  onChange={(e) => updateMilestone(milestoneIndex, 'notes', e.target.value)}
                  placeholder="Ghi chú về giai đoạn này..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '5px',
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '60px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Project Progress & Status */}
        <div className="form-section" style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', margin: '20px 0' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Tiến Độ & Trạng Thái</h3>

          <div className="form-group">
            <label>Trạng Thái Dự Án:</label>
            <Select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={statusOptions}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.progress.shooting_done}
                  onChange={(e) => handleNestedChange('progress', 'shooting_done', e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span>Đã chụp xong</span>
              </label>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.progress.retouch_done}
                  onChange={(e) => handleNestedChange('progress', 'retouch_done', e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span>Đã retouch xong</span>
              </label>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.progress.delivered}
                  onChange={(e) => handleNestedChange('progress', 'delivered', e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span>Đã giao hàng</span>
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Ngày Hoàn Thành:</label>
              <Input
                type="date"
                value={formData.completed_date}
                onChange={(e) => handleChange('completed_date', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Ngày Giao Hàng:</label>
              <Input
                type="date"
                value={formData.delivery_date}
                onChange={(e) => handleChange('delivery_date', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* General Notes */}
        <div className="form-section">
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Ghi Chú Chung</h3>
          <div className="form-group">
            <label>Ghi chú về dự án:</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Ghi chú chung về dự án..."
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #ced4da',
                borderRadius: '5px',
                fontSize: '14px',
                resize: 'vertical',
                minHeight: '100px',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Tạo Dự Án'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
