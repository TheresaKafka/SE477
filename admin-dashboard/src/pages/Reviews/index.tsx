import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Review } from '@/types/review';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Search, Star, Trash2 } from 'lucide-react';

const PAGE_SIZE = 10;

function StarRating({ rating }: { rating?: number }) {
  const r = rating ?? 0;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= r
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted text-muted-foreground'
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{r}/5</span>
    </div>
  );
}

export default function ReviewsList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: reviews = [], isLoading, isError } = useQuery<Review[]>({
    queryKey: ['reviews'],
    queryFn: () => api.get('/reviews').then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/reviews/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Xóa đánh giá thành công');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message ?? 'Xóa thất bại'),
  });

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length
        ).toFixed(1)
      : '—';

  const filtered = useMemo(
    () =>
      reviews.filter(
        (r) =>
          r.comment?.toLowerCase().includes(search.toLowerCase()) ||
          r.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
          r.room?.name?.toLowerCase().includes(search.toLowerCase()),
      ),
    [reviews, search],
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Star className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý Đánh giá</h1>
            <p className="text-sm text-muted-foreground">
              {reviews.length} đánh giá&nbsp;·&nbsp;Trung bình:{' '}
              <strong className="text-foreground">{avgRating} ⭐</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm nội dung, user, phòng..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {isError && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          Không thể tải danh sách đánh giá.
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Người dùng</TableHead>
              <TableHead>Phòng</TableHead>
              <TableHead>Đánh giá</TableHead>
              <TableHead>Nội dung</TableHead>
              <TableHead className="text-right w-20">Xóa</TableHead>
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
                  {search ? 'Không tìm thấy kết quả.' : 'Chưa có đánh giá nào.'}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((r) => (
                <TableRow key={r.review_id} className="hover:bg-muted/20">
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    #{r.review_id}
                  </TableCell>
                  <TableCell className="text-sm">{r.user?.email ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.room?.name ?? '—'}
                  </TableCell>
                  <TableCell>
                    <StarRating rating={r.rating} />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm truncate" title={r.comment ?? ''}>
                      {r.comment ?? <span className="text-muted-foreground italic">Không có nội dung</span>}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm('Xóa đánh giá này?'))
                          deleteMutation.mutate(r.review_id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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