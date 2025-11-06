"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const projectFormSchema = z.object({
  customer_name: z.string().min(1, "Tên khách hàng là bắt buộc"),
  customer_phone: z.string().optional(),
  package_id: z.string().optional(),
  package_name: z.string().optional(),
  package_price: z.number().min(0, "Giá phải lớn hơn 0"),
  discount: z.number().min(0).default(0),
  payment_status: z.enum(["unpaid", "deposit", "paid"]).default("unpaid"),
  shoot_date: z.date(),
  shoot_time: z.string().optional(),
  shoot_location: z.string().optional(),
  notes: z.string().optional(),
  partners: z.array(z.string()).default([]),
  team: z.object({
    main_photographer: z.object({
      employee_id: z.string().optional(),
      salary: z.number().optional(),
      bonus: z.number().optional(),
    }).optional(),
    assistants: z.array(z.object({
      employee_id: z.string(),
      salary: z.number(),
      bonus: z.number().optional(),
    })).default([]),
    makeup_artists: z.array(z.object({
      employee_id: z.string(),
      salary: z.number(),
      bonus: z.number().optional(),
    })).default([]),
    retouch_artists: z.array(z.object({
      employee_id: z.string(),
      salary: z.number(),
      photos: z.number().optional(),
    })).default([]),
  }).default({}),
})

type ProjectFormValues = z.infer<typeof projectFormSchema>

interface ProjectFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  project?: any
}

export function ProjectForm({ open, onClose, onSuccess, project }: ProjectFormProps) {
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [finalPrice, setFinalPrice] = useState(0)
  const [depositAmount, setDepositAmount] = useState(0)
  const [remainingAmount, setRemainingAmount] = useState(0)

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      package_name: "",
      package_price: 0,
      discount: 0,
      payment_status: "unpaid",
      shoot_date: new Date(),
      shoot_time: "",
      shoot_location: "",
      notes: "",
      partners: [],
      team: {
        main_photographer: undefined,
        assistants: [],
        makeup_artists: [],
        retouch_artists: [],
      },
    },
  })

  const watchPrice = form.watch("package_price")
  const watchDiscount = form.watch("discount")

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  useEffect(() => {
    const price = watchPrice || 0
    const discount = watchDiscount || 0
    const final = price - discount
    setFinalPrice(final)
    setDepositAmount(final * 0.6)
    setRemainingAmount(final * 0.4)
  }, [watchPrice, watchDiscount])

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      // Load packages
      const packagesRes = await fetch("http://localhost:8000/api/packages/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (packagesRes.ok) {
        const data = await packagesRes.json()
        setPackages(data.items || [])
      }

      // Load employees
      const employeesRes = await fetch("http://localhost:8000/api/employees/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (employeesRes.ok) {
        const data = await employeesRes.json()
        setEmployees(data.items || [])
      }

      // Load partners
      const partnersRes = await fetch("http://localhost:8000/api/partners/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (partnersRes.ok) {
        const data = await partnersRes.json()
        setPartners(data.items || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const onSubmit = async (data: ProjectFormValues) => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        alert("Vui lòng đăng nhập")
        return
      }

      const payload = {
        ...data,
        shoot_date: format(data.shoot_date, "yyyy-MM-dd"),
        status: "pending",
      }

      const url = project
        ? `http://localhost:8000/api/projects/${project.id}`
        : "http://localhost:8000/api/projects/"

      const method = project ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Có lỗi xảy ra")
      }

      alert(project ? "Cập nhật dự án thành công!" : "Tạo dự án mới thành công!")
      form.reset()
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Error saving project:", error)
      alert(error.message || "Có lỗi xảy ra khi lưu dự án")
    } finally {
      setLoading(false)
    }
  }

  const handlePackageSelect = (packageId: string) => {
    const selectedPackage = packages.find(p => p.id === packageId)
    if (selectedPackage) {
      form.setValue("package_name", selectedPackage.name)
      form.setValue("package_price", selectedPackage.price)
    }
  }

  const photographers = employees.filter(e =>
    e.role === "Photo/Retouch" && e.skills?.includes("Chụp chính")
  )
  const assistants = employees.filter(e =>
    e.role === "Photo/Retouch" && (e.skills?.includes("Chụp phụ") || e.skills?.includes("Chụp chính"))
  )
  const makeupArtists = employees.filter(e => e.role === "Makeup Artist")
  const retouchArtists = employees.filter(e =>
    e.role === "Photo/Retouch" && e.skills?.includes("Retouch")
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Chỉnh Sửa Dự Án" : "Thêm Dự Án Mới"}</DialogTitle>
          <DialogDescription>
            Điền đầy đủ thông tin dự án và đội ngũ thực hiện
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Thông Tin Khách Hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customer_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên Khách Hàng <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập tên khách hàng" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customer_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số Điện Thoại</FormLabel>
                        <FormControl>
                          <Input placeholder="0123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Package Information */}
            <Card>
              <CardHeader>
                <CardTitle>Thông Tin Gói Chụp</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="package_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chọn Gói Chụp</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            handlePackageSelect(value)
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="-- Chọn gói chụp --" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {packages.map((pkg) => (
                              <SelectItem key={pkg.id} value={pkg.id}>
                                {pkg.name} - {pkg.price.toLocaleString()} VNĐ
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">Gói tùy chỉnh</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="package_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên Gói Chi Tiết</FormLabel>
                        <FormControl>
                          <Input placeholder="VD: Gói chụp ảnh cưới tại Đà Lạt" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="package_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tổng Giá Trị Gói (VNĐ) <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chiết Khấu (VNĐ)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Nhập số tiền chiết khấu cho khách hàng (nếu có)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Giá sau chiết khấu:</span>
                    <span className="font-bold">{finalPrice.toLocaleString()} VNĐ</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span>Đợt 1 - Cọc (60%):</span>
                    <span>{depositAmount.toLocaleString()} VNĐ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Đợt 2 - Còn lại (40%):</span>
                    <span>{remainingAmount.toLocaleString()} VNĐ</span>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="payment_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trạng Thái Thanh Toán</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unpaid">Chưa thanh toán</SelectItem>
                          <SelectItem value="deposit">Đã cọc 60%</SelectItem>
                          <SelectItem value="paid">Đã thanh toán đủ</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Shoot Details */}
            <Card>
              <CardHeader>
                <CardTitle>Chi Tiết Chụp</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="shoot_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Ngày Chụp <span className="text-red-500">*</span></FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "dd/MM/yyyy") : "Chọn ngày"}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shoot_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Giờ Chụp</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shoot_location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Địa Điểm</FormLabel>
                        <FormControl>
                          <Input placeholder="Studio, Ngoại cảnh..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Team Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Đội Ngũ Thực Hiện</CardTitle>
                <CardDescription>Chọn nhân viên và nhập lương cho từng người</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Main Photographer */}
                <div className="space-y-2">
                  <FormLabel>📸 Photographer Chính</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    <Select
                      onValueChange={(value) => {
                        form.setValue("team.main_photographer.employee_id", value)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="-- Chọn photographer --" />
                      </SelectTrigger>
                      <SelectContent>
                        {photographers.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Lương"
                      onChange={(e) => {
                        form.setValue("team.main_photographer.salary", parseFloat(e.target.value) || 0)
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Thưởng"
                      onChange={(e) => {
                        form.setValue("team.main_photographer.bonus", parseFloat(e.target.value) || 0)
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi Chú</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Thêm ghi chú về dự án..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Đang lưu..." : project ? "Cập Nhật" : "Tạo Dự Án"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
