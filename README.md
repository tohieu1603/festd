# Studio Management Frontend

Frontend application được xây dựng với Next.js 15, TypeScript, và Tailwind CSS.

## Công nghệ sử dụng

- **Next.js 15**: React framework với App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: State management
- **React Query**: Data fetching và caching
- **Lucide React**: Icon library
- **Recharts**: Chart library

## Cấu trúc dự án

```
frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes group
│   │   ├── login/                # Login page
│   │   └── layout.tsx            # Auth layout
│   ├── (dashboard)/              # Dashboard routes group
│   │   ├── dashboard/            # Dashboard pages
│   │   │   ├── page.tsx          # Main dashboard
│   │   │   ├── employees/        # Employee management
│   │   │   ├── projects/         # Project management
│   │   │   ├── packages/         # Package management
│   │   │   ├── partners/         # Partner management
│   │   │   ├── salary/           # Salary management
│   │   │   └── finance/          # Finance management
│   │   └── layout.tsx            # Dashboard layout
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page (redirects)
│
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   └── Select.tsx
│   ├── layout/                   # Layout components
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── dashboard/                # Dashboard-specific components
│   │   ├── StatCard.tsx
│   │   └── ChartCard.tsx
│   └── features/                 # Feature-specific components
│       ├── EmployeeCard.tsx
│       └── ProjectCard.tsx
│
├── lib/
│   ├── api.ts                    # API client và utilities
│   ├── types.ts                  # TypeScript type definitions
│   └── utils.ts                  # Utility functions
│
├── stores/
│   ├── auth.store.ts             # Authentication state
│   └── theme.store.ts            # Theme state
│
├── styles/
│   └── globals.css               # Global styles
│
├── middleware.ts                 # Next.js middleware (auth check)
├── next.config.mjs               # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Cấu hình environment variables:
```bash
cp .env.example .env.local
```

Chỉnh sửa `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_NAME=Studio Management
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Chạy ứng dụng

### Development mode
```bash
npm run dev
```

Ứng dụng sẽ chạy tại: http://localhost:3000

### Production build
```bash
npm run build
npm start
```

### Type checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Tính năng chính

### Authentication
- Login với JWT tokens
- Protected routes với middleware
- Automatic token refresh
- Logout functionality

### Dashboard
- Tổng quan thống kê (dự án, nhân viên, doanh thu, lợi nhuận)
- Biểu đồ doanh thu và trạng thái dự án
- Hoạt động gần đây

### Quản lý Nhân viên
- Danh sách nhân viên với card view
- Tìm kiếm và lọc theo vai trò
- Chi tiết nhân viên
- Thêm/sửa nhân viên (UI ready)

### Quản lý Dự án
- Grid/List view cho dự án
- Tìm kiếm và lọc theo trạng thái
- Chi tiết dự án với team members
- Progress tracking theo ngân sách
- Thêm/sửa dự án (UI ready)

### Quản lý Gói dịch vụ
- Danh sách gói dịch vụ
- Chi tiết gói với tính năng
- Active/Inactive status
- Thêm/sửa gói (UI ready)

### Quản lý Đối tác
- Table view cho đối tác
- Tìm kiếm đối tác
- Chi tiết liên hệ
- Phân loại đối tác (Nhà cung cấp, Khách hàng, Nhà thầu)
- Thêm/sửa đối tác (UI ready)

### Quản lý Lương
- Tổng quan lương (chờ thanh toán, đã thanh toán)
- Lọc theo tháng và trạng thái
- Chi tiết bảng lương
- Tính toán tự động (lương cơ bản + thưởng - khấu trừ)
- Xuất báo cáo (UI ready)

### Quản lý Tài chính
- Tổng quan thu nhập, chi phí, lợi nhuận
- Biểu đồ thu chi theo tháng
- Biểu đồ chi phí theo danh mục
- Danh sách giao dịch
- Lọc theo loại giao dịch
- Xuất báo cáo (UI ready)

## Dark Mode

Ứng dụng hỗ trợ dark mode với 3 options:
- Light mode
- Dark mode
- System (theo OS preference)

Toggle dark mode từ Navbar.

## API Integration

API client được cấu hình trong `lib/api.ts` với các tính năng:

- Automatic JWT token management
- Token refresh on 401 errors
- Request/response interceptors
- TypeScript type safety
- Query string builder

### Ví dụ sử dụng API:

```typescript
import { api } from '@/lib/api';
import type { Employee } from '@/lib/types';

// GET request
const employees = await api.get<{ results: Employee[] }>('/employees/');

// POST request
const newEmployee = await api.post<Employee>('/employees/', data);

// PUT request
const updated = await api.put<Employee>(`/employees/${id}/`, data);

// DELETE request
await api.delete(`/employees/${id}/`);
```

## State Management

### Auth Store (Zustand)
```typescript
import { useAuthStore } from '@/stores/auth.store';

function Component() {
  const { user, login, logout } = useAuthStore();

  // Login
  await login(username, password);

  // Logout
  logout();
}
```

### Theme Store (Zustand)
```typescript
import { useThemeStore } from '@/stores/theme.store';

function Component() {
  const { theme, setTheme, toggleTheme } = useThemeStore();

  // Set theme
  setTheme('dark');

  // Toggle
  toggleTheme();
}
```

## UI Components

Tất cả UI components đều có TypeScript types và support dark mode:

```typescript
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

<Button variant="default" size="lg" isLoading={loading}>
  Click me
</Button>

<Input
  label="Email"
  type="email"
  error={errors.email}
  required
/>
```

## Responsive Design

- Mobile-first approach với Tailwind CSS
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Sidebar collapsible trên mobile
- Grid layouts responsive

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Todo / Improvements

- [ ] Implement form submissions cho CRUD operations
- [ ] Add validation schemas (Zod hoặc Yup)
- [ ] Implement React Query cho data fetching
- [ ] Add loading skeletons
- [ ] Add error boundaries
- [ ] Implement pagination
- [ ] Add toast notifications
- [ ] Add file upload cho avatars
- [ ] Implement Excel export functionality
- [ ] Add unit tests
- [ ] Add E2E tests

## License

Private - Studio Management System
