import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Order } from '@/types/order';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Search, ShoppingCart, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-destructive/10 text-destructive',
};

const PAGE_SIZE = 10;

export default function OrdersList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState('');

  const { data: orders = [], isLoading, isError } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then((r) => r.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/orders/${id}`, { status }).then((r) => r.data),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setViewOrder(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Cập nhật thất bại'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/orders/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Xóa đơn hàng thành công');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Xóa thất bại'),
  });

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        const matchSearch =
          String(o.order_id).includes(search) ||
          o.user?.email?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || o.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [orders, search, statusFilter]
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openView = (o: Order) => {
    setViewOrder(o);
    setEditStatus(o.status || 'pending');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý Đơn hàng</h1>
            <p className="text-sm text-muted-foreground">{orders.length} đơn hàng</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo ID hoặc email..."
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
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isError && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          Không thể tải danh sách đơn hàng.
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-20">Order ID</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right w-28">Thao tác</TableHead>
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
                  {search || statusFilter ? 'Không tìm thấy kết quả.' : 'Chưa có đơn hàng nào.'}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((o) => (
                <TableRow key={o.order_id} className="hover:bg-muted/20">
                  <TableCell className="font-mono text-sm font-medium">#{o.order_id}</TableCell>
                  <TableCell className="text-sm">{o.user?.email || '—'}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {o.total_price != null
                      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(o.total_price) * 1000)
                      : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {o.created_at ? format(new Date(o.created_at), 'dd/MM/yyyy HH:mm') : '—'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status || ''] || 'bg-muted text-muted-foreground'}`}>
                      {o.status || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openView(o)} title="Xem / Cập nhật">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        disabled={deleteMutation.isPending}
                        onClick={() => { if (window.confirm(`Xóa đơn hàng #${o.order_id}?`)) deleteMutation.mutate(o.order_id); }}
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

      {/* View/Edit Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={(o) => !o && setViewOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chi tiết Đơn hàng #{viewOrder?.order_id}</DialogTitle>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Khách hàng</p>
                  <p className="font-medium">{viewOrder.user?.email || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tổng tiền</p>
                  <p className="font-medium">
                    {viewOrder.total_price != null
                      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(viewOrder.total_price) * 1000)
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ngày tạo</p>
                  <p className="font-medium">
                    {viewOrder.created_at ? format(new Date(viewOrder.created_at), 'dd/MM/yyyy HH:mm') : '—'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cập nhật trạng thái</Label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOrder(null)}>Đóng</Button>
            <Button
              disabled={updateStatusMutation.isPending}
              onClick={() => {
                if (viewOrder) updateStatusMutation.mutate({ id: viewOrder.order_id, status: editStatus });
              }}
            >
              {updateStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu trạng thái
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}