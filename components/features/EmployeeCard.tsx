import { Mail, Phone, Calendar, Award, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Employee } from '@/lib/types';
import { formatCurrency, formatDateShort, getInitials } from '@/lib/utils';

interface EmployeeCardProps {
  employee: Employee;
  onClick?: () => void;
}

const getRoleColor = (role: string): 'default' | 'warning' | 'success' | 'secondary' | 'destructive' => {
  const roleLower = role.toLowerCase();
  if (roleLower.includes('photo') || roleLower.includes('photographer')) return 'warning';
  if (roleLower.includes('makeup')) return 'success';
  if (roleLower.includes('content')) return 'secondary';
  return 'default';
};

export function EmployeeCard({ employee, onClick }: EmployeeCardProps) {
  return (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer border-t-4 border-t-primary"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            {employee.avatar ? (
              <img
                src={employee.avatar}
                alt={employee.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-primary">
                {getInitials(employee.name)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{employee.name}</h3>
            <Badge variant={getRoleColor(employee.role)} className="mt-1">
              {employee.role}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Contact Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{employee.email}</span>
          </div>
          {employee.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{employee.phone}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {employee.skills && employee.skills.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Kỹ năng</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {employee.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-secondary text-xs rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Salary & Start Date */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-semibold text-primary">
              {formatCurrency(employee.base_salary)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>Bắt đầu: {formatDateShort(employee.start_date)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
