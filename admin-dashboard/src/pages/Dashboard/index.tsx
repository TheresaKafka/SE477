import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, Building2, CreditCard, Star, Home, TrendingUp, AlertCircle } from 'lucide-react';
import { api } from '@/services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

interface DashboardStats {
  users: number;
  orders: number;
  properties: number;
  rooms: number;
  payments: number;
  reviews: number;
  revenue: number;
  ordersByStatus: { name: string; value: number }[];
  propertiesByStatus: { name: string; value: number }[];
  recentOrders: any[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function StatCard({
  title,
  value,
  icon: Icon,
  color = 'text-primary',
  loading,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color?: string;
  loading: boolean;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`h-8 w-8 rounded-lg bg-muted flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-16 bg-muted animate-pulse rounded" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [usersRes, ordersRes, propertiesRes, roomsRes, paymentsRes, reviewsRes] =
        await Promise.allSettled([
          api.get('/users'),
          api.get('/orders'),
          api.get('/properties'),
          api.get('/rooms'),
          api.get('/payments'),
          api.get('/reviews'),
        ]);

      const users = usersRes.status === 'fulfilled' ? usersRes.value.data : [];
      const orders = ordersRes.status === 'fulfilled' ? ordersRes.value.data : [];
      const properties = propertiesRes.status === 'fulfilled' ? propertiesRes.value.data : [];
      const rooms = roomsRes.status === 'fulfilled' ? roomsRes.value.data : [];
      const payments = paymentsRes.status === 'fulfilled' ? paymentsRes.value.data : [];
      const reviews = reviewsRes.status === 'fulfilled' ? reviewsRes.value.data : [];

      // Tính tổng doanh thu từ payments
      const revenue = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

      // Thống kê orders theo status
      const orderStatusMap: Record<string, number> = {};
      orders.forEach((o: any) => {
        const s = o.status || 'Unknown';
        orderStatusMap[s] = (orderStatusMap[s] || 0) + 1;
      });
      const ordersByStatus = Object.entries(orderStatusMap).map(([name, value]) => ({ name, value }));

      // Thống kê properties theo status
      const propStatusMap: Record<string, number> = {};
      properties.forEach((p: any) => {
        const s = p.status || 'Unknown';
        propStatusMap[s] = (propStatusMap[s] || 0) + 1;
      });
      const propertiesByStatus = Object.entries(propStatusMap).map(([name, value]) => ({ name, value }));

      // 5 đơn hàng mới nhất
      const recentOrders = [...orders]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      return {
        users: users.length,
        orders: orders.length,
        properties: properties.length,
        rooms: rooms.length,
        payments: payments.length,
        reviews: reviews.length,
        revenue,
        ordersByStatus,
        propertiesByStatus,
        recentOrders,
      };
    },
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tổng quan hệ thống — SE477 Travel Rental
        </p>
      </div>

      {isError && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Không thể kết nối backend. Kiểm tra server đang chạy tại <strong>http://localhost:3000</strong></span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Tổng Users" value={stats?.users ?? 0} icon={Users} color="text-blue-500" loading={isLoading} />
        <StatCard title="Đơn hàng" value={stats?.orders ?? 0} icon={ShoppingCart} color="text-emerald-500" loading={isLoading} />
        <StatCard title="Properties" value={stats?.properties ?? 0} icon={Building2} color="text-violet-500" loading={isLoading} />
        <StatCard title="Phòng" value={stats?.rooms ?? 0} icon={Home} color="text-amber-500" loading={isLoading} />
        <StatCard title="Payments" value={stats?.payments ?? 0} icon={CreditCard} color="text-pink-500" loading={isLoading} />
        <StatCard title="Đánh giá" value={stats?.reviews ?? 0} icon={Star} color="text-orange-500" loading={isLoading} />
      </div>

      {/* Revenue card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng doanh thu</CardTitle>
            {isLoading ? (
              <div className="h-8 w-32 bg-muted animate-pulse rounded mt-1" />
            ) : (
              <p className="text-3xl font-bold text-primary">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((stats?.revenue ?? 0) * 1000)}
              </p>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Đơn hàng theo trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[220px] bg-muted animate-pulse rounded" />
            ) : (stats?.ordersByStatus ?? []).length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Chưa có dữ liệu đơn hàng
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats?.ordersByStatus} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" name="Số đơn" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Properties by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Properties theo trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[220px] bg-muted animate-pulse rounded" />
            ) : (stats?.propertiesByStatus ?? []).length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Chưa có dữ liệu property
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats?.propertiesByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={3}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {(stats?.propertiesByStatus ?? []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Đơn hàng gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (stats?.recentOrders ?? []).length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Chưa có đơn hàng nào</p>
          ) : (
            <div className="space-y-3">
              {(stats?.recentOrders ?? []).map((order: any) => (
                <div
                  key={order.order_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Order #{order.order_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.user?.email || 'Unknown user'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {order.total_price != null
                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(order.total_price) * 1000)
                        : '—'}
                    </p>
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        order.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : order.status === 'pending'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {order.status || 'unknown'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
