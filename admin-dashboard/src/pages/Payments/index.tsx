import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Payment } from '@/types/payment';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  Pending:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Failed:    'bg-destructive/10 text-destructive',
  Refunded:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const PAGE_SIZE = 10;

export default function PaymentsList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: payments = [], isLoading, isError } = useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: () => api.get('/payments').then((r) => r.data),
  });

  const totalRevenue = payments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0), 0,
  );

  const filtered = useMemo(
    () =>
      payments.filter(
        (p) =>
          String(p.payment_id).includes(search) ||
          String(p.order?.order_id ?? '').includes(search) ||
          (p.payment_method ?? '').toLowerCase().includes(search.toLowerCase()),
      ),
    [payments, search],
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-pink-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý Thanh toán</h1>
            <p className="text-sm text-muted-foreground">
              {payments.length} giao dịch&nbsp;·&nbsp;Tổng:{' '}
              <strong className="text-foreground">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency', currency: 'VND',
                }).format(totalRevenue * 1000)}
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo ID, order, phương thức..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {isError && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          Không thể tải danh sách thanh toán. Kiểm tra backend đang chạy.
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Số tiền</TableHead>
              <TableHead>Phương thức</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead>Trạng thái</TableHead>
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
                  {search ? 'Không tìm thấy kết quả.' : 'Chưa có giao dịch nào.'}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((p) => (
                <TableRow key={p.payment_id} className="hover:bg-muted/20">
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    #{p.payment_id}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {p.order ? `#${p.order.order_id}` : '—'}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {p.amount != null
                      ? new Intl.NumberFormat('vi-VN', {
                          style: 'currency', currency: 'VND',
                        }).format(Number(p.amount) * 1000)
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm">{p.payment_method ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {p.payment_date
                      ? format(new Date(p.payment_date), 'dd/MM/yyyy HH:mm')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        STATUS_COLORS[p.status ?? ''] ?? 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {p.status ?? '—'}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Trang {page}/{totalPages} — {filtered.length} kết quả
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"
              disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Trước
            </Button>
            <Button variant="outline" size="sm"
              disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}