'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/styles/calendar.css';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Calendar as CalendarIcon, Clock, MapPin, Users, DollarSign, Phone, Mail } from 'lucide-react';
import type { Project } from '@/lib/types';
import { api } from '@/lib/api';
import { formatCurrency, formatDateShort } from '@/lib/utils';

// Setup localizer for Vietnamese
const locales = {
  'vi': vi,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: vi }),
  getDay,
  locales,
});

// Custom messages in Vietnamese
const messages = {
  allDay: 'Cả ngày',
  previous: '←',
  next: '→',
  today: 'Hôm nay',
  month: 'Tháng',
  week: 'Tuần',
  day: 'Ngày',
  agenda: 'Lịch trình',
  date: 'Ngày',
  time: 'Thời gian',
  event: 'Sự kiện',
  noEventsInRange: 'Không có dự án nào trong khoảng thời gian này.',
  showMore: (total: number) => `+${total} dự án`,
};

// Event interface for Calendar
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Project;
}

// Status colors
const statusColors: Record<string, string> = {
  pending: '#9e9e9e',
  confirmed: '#2196f3',
  shooting: '#ff9800',
  retouching: '#9c27b0',
  delivered: '#4caf50',
  completed: '#00bcd4',
  cancelled: '#f44336',
};

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shooting: 'Đang chụp',
  retouching: 'Đang retouch',
  delivered: 'Đã giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export default function CalendarPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ total: number; items: Project[] }>('/projects/');
      setProjects(response.items || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert projects to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return projects.map(project => {
      const [hours, minutes] = (project.shoot_time || '00:00').split(':');
      const startDate = new Date(project.shoot_date);
      startDate.setHours(parseInt(hours), parseInt(minutes));

      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 2); // Default 2 hours duration

      return {
        id: project.id,
        title: `${project.customer_name} - ${project.package_name}`,
        start: startDate,
        end: endDate,
        resource: project,
      };
    });
  }, [projects]);

  // Event style getter
  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = statusColors[event.resource.status] || '#757575';
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '12px',
        padding: '2px 5px',
      },
    };
  };

  // Handle event selection
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedProject(event.resource);
    setIsModalOpen(true);
  };

  // Calculate team size
  const getTeamSize = (project: Project) => {
    return [
      project.team.main_photographer ? 1 : 0,
      project.team.assist_photographers.length,
      project.team.makeup_artists.length,
      project.team.retouch_artists.length,
    ].reduce((a, b) => a + b, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-primary" />
            Lịch Dự Án
          </h1>
          <p className="text-muted-foreground mt-2">
            Xem lịch chụp hình theo tháng, tuần hoặc ngày
          </p>
        </div>
        <Button onClick={fetchProjects} variant="outline">
          🔄 Tải lại
        </Button>
      </div>

      {/* Legend */}
      <div className="bg-card p-4 rounded-lg border">
        <p className="text-sm font-semibold mb-3">Chú thích trạng thái:</p>
        <div className="flex flex-wrap gap-4">
          {Object.entries(statusLabels).map(([status, label]) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: statusColors[status] }}
              />
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Đang tải lịch...</p>
        </div>
      ) : (
        <div className="bg-card p-6 rounded-lg border" style={{ height: '700px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            messages={messages}
            culture="vi"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            popup
            selectable
          />
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProject(null);
          }}
          title={`${selectedProject.project_code} - ${selectedProject.customer_name}`}
          size="xl"
        >
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge
                style={{
                  backgroundColor: statusColors[selectedProject.status],
                  color: 'white',
                }}
              >
                {statusLabels[selectedProject.status]}
              </Badge>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Khách hàng</p>
                <p className="font-semibold mt-1">{selectedProject.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số điện thoại</p>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{selectedProject.customer_phone}</p>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Email</p>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{selectedProject.customer_email}</p>
                </div>
              </div>
            </div>

            {/* Package Info */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-muted-foreground mb-2">Gói chụp</p>
              <p className="text-lg font-bold mb-2">{selectedProject.package_name}</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(selectedProject.package_final_price)}
              </p>
            </div>

            {/* Shoot Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Ngày chụp</p>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{formatDateShort(selectedProject.shoot_date)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Giờ chụp</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{selectedProject.shoot_time}</p>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground mb-2">Địa điểm</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{selectedProject.location}</p>
                </div>
              </div>
            </div>

            {/* Team Info */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Đội ngũ</p>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{getTeamSize(selectedProject)} thành viên</p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-3">Thanh toán</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Đặt cọc</p>
                  <p className="font-semibold">{formatCurrency(selectedProject.payment.deposit)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Đã thanh toán</p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(selectedProject.payment.paid)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Còn lại</p>
                  <p className="font-semibold text-orange-600">
                    {formatCurrency(selectedProject.payment.final - selectedProject.payment.paid)}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedProject.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Ghi chú</p>
                <p className="mt-1 p-3 bg-muted/50 rounded">{selectedProject.notes}</p>
              </div>
            )}

            <ModalFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedProject(null);
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
