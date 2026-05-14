import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/services/api';
import type { User } from '@/types/user';
import type { Role } from '@/types/role';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Trash2, Search, Users } from 'lucide-react';
import { format } from 'date-fns';

const userSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').optional().or(z.literal('')),
  role_id: z.coerce.number().min(1, 'Vui lòng chọn role'),
});

type UserFormValues = z.infer<typeof userSchema>;

const PAGE_SIZE = 10;

export default function UsersList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const { data: users = [], isLoading, isError } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: UserFormValues) => api.post('/users', data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Tạo user thành công');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Tạo user thất bại');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserFormValues }) =>
      api.patch(`/users/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Cập nhật user thành công');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Xóa user thành công');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(userSchema) as any,
  });

  const filtered = useMemo(
    () => users.filter((u) => u.email?.toLowerCase().includes(search.toLowerCase())),
    [users, search]
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditUser(null);
    reset({ email: '', password: '', role_id: 0 });
    setOpen(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    reset({ email: u.email, password: '', role_id: u.role?.role_id ?? 0 });
    setOpen(true);
  };

  const onSubmit = (data: UserFormValues) => {
    const payload: any = { email: data.email, role_id: data.role_id };
    if (data.password) payload.password = data.password;

    if (editUser) {
      updateMutation.mutate({ id: editUser.user_id, data: payload });
    } else {
      if (!data.password) {
        toast.error('Mật khẩu là bắt buộc khi tạo user mới');
        return;
      }
      createMutation.mutate(data);
    }
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý Users</h1>
            <p className="text-sm text-muted-foreground">{users.length} người dùng</p>
          </div>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Thêm User
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {/* Error */}
      {isError && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          Không thể tải danh sách user. Backend có đang chạy không?
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right w-24">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  {search ? 'Không tìm thấy kết quả.' : 'Chưa có user nào.'}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((u) => (
                <TableRow key={u.user_id} className="hover:bg-muted/20">
                  <TableCell className="font-mono text-sm text-muted-foreground">#{u.user_id}</TableCell>
                  <TableCell className="font-medium">{u.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {u.role?.role_name || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {u.created_at ? format(new Date(u.created_at), 'dd/MM/yyyy HH:mm') : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)} title="Chỉnh sửa">
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Xóa"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Xóa user "${u.email}"?`)) {
                            deleteMutation.mutate(u.user_id);
                          }
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Trang {page}/{totalPages} — {filtered.length} kết quả
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Trước
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Sau
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editUser ? 'Chỉnh sửa User' : 'Thêm User mới'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u-email">Email *</Label>
              <Input id="u-email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="u-password">
                Mật khẩu {editUser ? '(để trống nếu không đổi)' : '*'}
              </Label>
              <Input id="u-password" type="password" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="u-role">Role *</Label>
              <select
                id="u-role"
                {...register('role_id')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={0}>-- Chọn role --</option>
                {roles.map((r) => (
                  <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
                ))}
              </select>
              {errors.role_id && <p className="text-xs text-destructive">{errors.role_id.message}</p>}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isBusy}>
                {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editUser ? 'Lưu thay đổi' : 'Tạo User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}