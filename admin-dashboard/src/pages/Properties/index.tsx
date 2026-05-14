import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/services/api';
import type { Property } from '@/types/property';
import type { User } from '@/types/user';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Trash2, Search, Building2 } from 'lucide-react';

const propertySchema = z.object({
  name: z.string().min(1, 'Tên không được để trống'),
  address: z.string().default(''),
  city: z.string().default(''),
  status: z.string().default('pending'),
  owner_id: z.coerce.number().min(1, 'Vui lòng chọn owner'),
});
type PropertyFormValues = z.infer<typeof propertySchema>;

const STATUS_OPTIONS = ['pending', 'active', 'inactive', 'rejected'];
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  inactive: 'bg-muted text-muted-foreground',
  rejected: 'bg-destructive/10 text-destructive',
};

const PAGE_SIZE = 10;

export default function PropertiesList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Property | null>(null);

  const { data: properties = [], isLoading, isError } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then((r) => r.data),
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: PropertyFormValues) => api.post('/properties', data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Tạo property thành công');
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Tạo thất bại'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PropertyFormValues }) =>
      api.patch(`/properties/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Cập nhật thất bại'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/properties/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Xóa thành công');
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Xóa thất bại'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PropertyFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(propertySchema) as any,
  });

  const filtered = useMemo(
    () =>
      properties.filter((p) => {
        const matchSearch =
          p.name?.toLowerCase().includes(search.toLowerCase()) ||
          p.city?.toLowerCase().includes(search.toLowerCase()) ||
          p.address?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || p.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [properties, search, statusFilter]
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditItem(null);
    reset({ name: '', address: '', city: '', status: 'pending', owner_id: 0 });
    setOpen(true);
  };

  const openEdit = (p: Property) => {
    setEditItem(p);
    reset({
      name: p.name || '',
      address: p.address || '',
      city: p.city || '',
      status: p.status || 'pending',
      owner_id: p.owner?.user_id ?? 0,
    });
    setOpen(true);
  };

  const onSubmit = (data: PropertyFormValues) => {
    if (editItem) {
      updateMutation.mutate({ id: editItem.property_id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý Properties</h1>
            <p className="text-sm text-muted-foreground">{properties.length} bất động sản</p>
          </div>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Thêm Property
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm tên, thành phố, địa chỉ..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {isError && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          Không thể tải danh sách property.
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead>Thành phố</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right w-24">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  {search || statusFilter ? 'Không tìm thấy kết quả.' : 'Chưa có property nào.'}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((p) => (
                <TableRow key={p.property_id} className="hover:bg-muted/20">
                  <TableCell className="font-mono text-sm text-muted-foreground">#{p.property_id}</TableCell>
                  <TableCell className="font-medium">{p.name || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{p.city || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.owner?.email || '—'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status || ''] || 'bg-muted text-muted-foreground'}`}>
                      {p.status || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Xóa property "${p.name}"?`))
                            deleteMutation.mutate(p.property_id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Trang {page}/{totalPages} — {filtered.length} kết quả</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau</Button>
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Chỉnh sửa Property' : 'Thêm Property mới'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Tên Property *</Label>
              <Input {...register('name')} placeholder="VD: Nhà nghỉ Hà Nội" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Thành phố</Label>
                <Input {...register('city')} placeholder="VD: Hà Nội" />
              </div>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <select
                  {...register('status')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Địa chỉ</Label>
              <Input {...register('address')} placeholder="Số nhà, đường, quận..." />
            </div>
            <div className="space-y-2">
              <Label>Owner *</Label>
              <select
                {...register('owner_id')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={0}>-- Chọn owner --</option>
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>{u.email}</option>
                ))}
              </select>
              {errors.owner_id && <p className="text-xs text-destructive">{errors.owner_id.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={isBusy}>
                {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editItem ? 'Lưu' : 'Tạo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}