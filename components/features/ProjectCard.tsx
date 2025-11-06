import { Calendar, DollarSign, Users, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Project, ProjectStatus } from '@/lib/types';
import { formatCurrency, formatDateShort } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const statusColors: Record<ProjectStatus, 'default' | 'warning' | 'success' | 'secondary' | 'destructive'> = {
  pending: 'secondary',
  confirmed: 'default',
  shooting: 'warning',
  retouching: 'warning',
  delivered: 'success',
  completed: 'success',
  cancelled: 'destructive',
};

const statusLabels: Record<ProjectStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shooting: 'Đang chụp',
  retouching: 'Đang retouch',
  delivered: 'Đã giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  // Calculate team size
  const teamSize = [
    project.team.main_photographer ? 1 : 0,
    project.team.assist_photographers.length,
    project.team.makeup_artists.length,
    project.team.retouch_artists.length,
  ].reduce((a, b) => a + b, 0);

  // Calculate payment progress
  const paymentProgress = project.payment.final > 0
    ? Math.min((project.payment.paid / project.payment.final) * 100, 100)
    : 0;

  return (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-primary"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold truncate">
              {project.project_code}
            </CardTitle>
            <p className="text-base font-semibold text-foreground mt-1 truncate">
              {project.customer_name}
            </p>
          </div>
          <Badge variant={statusColors[project.status]} className="shrink-0">
            {statusLabels[project.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Package Info */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium text-muted-foreground">Gói chụp</p>
          <p className="font-semibold mt-1">{project.package_name}</p>
          <p className="text-lg font-bold text-primary mt-1">
            {formatCurrency(project.package_final_price)}
          </p>
        </div>

        <div className="space-y-2">
          {/* Shoot Date & Time */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium">{formatDateShort(project.shoot_date)}</span>
            <Clock className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
            <span>{project.shoot_time}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{project.location}</span>
          </div>

          {/* Team Size */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{teamSize} thành viên</span>
          </div>
        </div>

        {/* Payment Progress */}
        <div className="pt-2">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Thanh toán</span>
            <span className="font-bold">
              {formatCurrency(project.payment.paid)} / {formatCurrency(project.payment.final)}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full transition-all bg-green-500"
              style={{ width: `${Math.min(paymentProgress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {paymentProgress.toFixed(0)}% đã thanh toán
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
