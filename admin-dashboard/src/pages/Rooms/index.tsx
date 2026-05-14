import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/services/api';
import type { Room } from '@/types/room';
import type { Property } from '@/types/property';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Trash2, Search, Home } from 'lucide-react';

const roomSchema = z.object({
  name: z.string().min(1, 'Tên phòng không được để trống'),
  price: z.coerce.number().min(0, 'Giá không hợp lệ'),
  quantity: z.coerce.number().int().min(0, 'Số lượng không hợp lệ'),
  status: z.string().default('available'),
  property_id: z.coerce.number().min(1, 'Vui lòng chọn property'),
});
type RoomFormValues = z.infer<typeof roomSchema>;

const STATUS_OPTIONS = ['available', 'booked', 'maintenance', 'inactive'];
const STATUS_COLORS: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  booked: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  maintenance: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  inactive: 'bg-muted text-muted-foreground',
};

const PAGE_SIZE = 10;

export default function RoomsList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Room | null>(null);

  const { data: rooms = [], isLoading, isError } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: () => api.get('/rooms').then((r) => r.data),
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: RoomFormValues) => api.post('/rooms', data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Tạo phòng thành công');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Tạo thất bại'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RoomFormValues }) =>
      api.patch(`/rooms/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Cập nhật thất bại'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/rooms/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Xóa thành công');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Xóa thất bại'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoomFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(roomSchema) as any,
  });

  const filtered = useMemo(
    () => rooms.filter((r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.property?.name?.toLowerCase().includes(search.toLowerCase())
    ),
    [rooms, search]
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditItem(null);
    reset({ name: '', price: 0, quantity: 1, status: 'available', property_id: 0 });
    setOpen(true);
  };

  const openEdit = (r: Room) => {
    setEditItem(r);
    reset({
      name: r.name || '',
      price: r.price ?? 0,
      quantity: r.quantity ?? 1,
      status: r.status || 'available',
      property_id: r.property?.property_id ?? 0,
    });
    setOpen(true);
  };

  const onSubmit = (data: RoomFormValues) => {
    if (editItem) {
      updateMutation.mutate({ id: editItem.room_id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Home className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý Phòng</h1>
            <p className="text-sm text-muted-foreground">{rooms.length} phòng</p>
          </div>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Thêm Phòng
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm tên phòng, property..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {isError && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          Không thể tải danh sách phòng.
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Tên phòng</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Giá/đêm</TableHead>
              <TableHead>SL</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right w-24">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  {search ? 'Không tìm thấy kết quả.' : 'Chưa có phòng nào.'}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((r) => (
                <TableRow key={r.room_id} className="hover:bg-muted/20">
                  <TableCell className="font-mono text-sm text-muted-foreground">#{r.room_id}</TableCell>
                  <TableCell className="font-medium">{r.name || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{r.property?.name || '—'}</TableCell>
                  <TableCell className="text-sm">
                    {r.price != null
                      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(r.price) * 1000)
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm">{r.quantity ?? '—'}</TableCell>
                  <TableCell>
                    <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status || ''] || 'bg-muted text-muted-foreground'}`}>
                      {r.status || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        disabled={deleteMutation.isPending}
                        onClick={() => { if (window.confirm(`Xóa phòng "${r.name}"?`)) deleteMutation.mutate(r.room_id); }}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Chỉnh sửa Phòng' : 'Thêm Phòng mới'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Tên phòng *</Label>
              <Input {...register('name')} placeholder="VD: Phòng Deluxe 101" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Giá (nghìn VND)</Label>
                <Input type="number" {...register('price')} min={0} />
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Số lượng</Label>
                <Input type="number" {...register('quantity')} min={0} />
                {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <select {...register('status')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Property *</Label>
              <select {...register('property_id')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value={0}>-- Chọn property --</option>
                {properties.map((p) => <option key={p.property_id} value={p.property_id}>{p.name || `Property #${p.property_id}`}</option>)}
              </select>
              {errors.property_id && <p className="text-xs text-destructive">{errors.property_id.message}</p>}
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