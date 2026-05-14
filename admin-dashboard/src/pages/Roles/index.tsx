import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/services/api';
import type { Role } from '@/types/role';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Trash2, Shield, Search } from 'lucide-react';

const roleSchema = z.object({
  role_name: z.string().min(1, 'Tên role không được để trống').max(20, 'Tối đa 20 ký tự'),
});
type RoleFormValues = z.infer<typeof roleSchema>;

const PAGE_SIZE = 10;

export default function RolesList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);

  const { data: roles = [], isLoading, isError } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: RoleFormValues) => api.post('/roles', data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Tạo role thành công');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Tạo role thất bại'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RoleFormValues }) =>
      api.patch(`/roles/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Cập nhật role thành công');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Cập nhật thất bại'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/roles/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Xóa role thành công');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Xóa thất bại'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
  });

  const filtered = useMemo(
    () => roles.filter((r) => r.role_name.toLowerCase().includes(search.toLowerCase())),
    [roles, search]
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditRole(null);
    reset({ role_name: '' });
    setOpen(true);
  };

  const openEdit = (r: Role) => {
    setEditRole(r);
    reset({ role_name: r.role_name });
    setOpen(true);
  };

  const onSubmit = (data: RoleFormValues) => {
    if (editRole) {
      updateMutation.mutate({ id: editRole.role_id, data });
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
            <Shield className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý Roles</h1>
            <p className="text-sm text-muted-foreground">{roles.length} vai trò</p>
          </div>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Thêm Role
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên role..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {isError && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          Không thể tải danh sách role.
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Tên Role</TableHead>
              <TableHead className="text-right w-24">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                  {search ? 'Không tìm thấy kết quả.' : 'Chưa có role nào.'}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((r) => (
                <TableRow key={r.role_id} className="hover:bg-muted/20">
                  <TableCell className="font-mono text-sm text-muted-foreground">#{r.role_id}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                      <Shield className="h-3 w-3" />
                      {r.role_name}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)} title="Chỉnh sửa">
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Xóa"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Xóa role "${r.role_name}"?`)) {
                            deleteMutation.mutate(r.role_id);
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Trang {page}/{totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau</Button>
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editRole ? 'Chỉnh sửa Role' : 'Thêm Role mới'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="r-name">Tên Role * (tối đa 20 ký tự)</Label>
              <Input id="r-name" {...register('role_name')} placeholder="VD: admin, owner, user..." />
              {errors.role_name && <p className="text-xs text-destructive">{errors.role_name.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={isBusy}>
                {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editRole ? 'Lưu' : 'Tạo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}