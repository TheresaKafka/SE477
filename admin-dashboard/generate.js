import fs from 'fs';
import path from 'path';

// Define entities manually based on earlier inspection to ensure correctness
// instead of writing a complex AST parser right now
const entities = [
  {
    name: 'User',
    route: 'users',
    fields: [
      { name: 'user_id', type: 'number', isPrimary: true },
      { name: 'email', type: 'string' },
      { name: 'password', type: 'string' },
      { name: 'created_at', type: 'Date' }
    ]
  },
  {
    name: 'Order',
    route: 'orders',
    fields: [
      { name: 'order_id', type: 'number', isPrimary: true },
      { name: 'total_amount', type: 'number' },
      { name: 'status', type: 'string' },
      { name: 'created_at', type: 'Date' }
    ]
  },
  {
    name: 'Property',
    route: 'properties',
    fields: [
      { name: 'property_id', type: 'number', isPrimary: true },
      { name: 'name', type: 'string' },
      { name: 'address', type: 'string' },
      { name: 'city', type: 'string' },
      { name: 'status', type: 'string' }
    ]
  },
  {
    name: 'Room',
    route: 'rooms',
    fields: [
      { name: 'room_id', type: 'number', isPrimary: true },
      { name: 'room_type', type: 'string' },
      { name: 'price_per_night', type: 'number' },
      { name: 'status', type: 'string' }
    ]
  },
  {
    name: 'Review',
    route: 'reviews',
    fields: [
      { name: 'review_id', type: 'number', isPrimary: true },
      { name: 'rating', type: 'number' },
      { name: 'comment', type: 'string' },
      { name: 'created_at', type: 'Date' }
    ]
  },
  {
    name: 'Payment',
    route: 'payments',
    fields: [
      { name: 'payment_id', type: 'number', isPrimary: true },
      { name: 'amount', type: 'number' },
      { name: 'payment_method', type: 'string' },
      { name: 'payment_status', type: 'string' },
      { name: 'payment_date', type: 'Date' }
    ]
  },
  {
    name: 'Role',
    route: 'roles',
    fields: [
      { name: 'role_id', type: 'number', isPrimary: true },
      { name: 'role_name', type: 'string' },
      { name: 'description', type: 'string' }
    ]
  }
];

const srcDir = path.join(process.cwd(), 'src');

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

entities.forEach(entity => {
  const entityDir = path.join(srcDir, 'pages', capitalize(entity.route));
  fs.mkdirSync(entityDir, { recursive: true });

  // 1. Generate Type
  const typeDef = `
export interface ${entity.name} {
${entity.fields.map(f => `  ${f.name}: ${f.type === 'Date' ? 'string' : f.type};`).join('\n')}
}
  `;
  fs.writeFileSync(path.join(srcDir, 'types', `${entity.name.toLowerCase()}.ts`), typeDef.trim());

  // 2. Generate Service
  const serviceDef = `
import { api } from './api';
import { ${entity.name} } from '../types/${entity.name.toLowerCase()}';

export const ${entity.name.toLowerCase()}Service = {
  getAll: () => api.get<${entity.name}[]>('/${entity.route}').then(res => res.data),
  getById: (id: string | number) => api.get<${entity.name}>(\`/${entity.route}/\${id}\`).then(res => res.data),
  create: (data: Partial<${entity.name}>) => api.post<${entity.name}>('/${entity.route}', data).then(res => res.data),
  update: (id: string | number, data: Partial<${entity.name}>) => api.patch<${entity.name}>(\`/${entity.route}/\${id}\`, data).then(res => res.data),
  delete: (id: string | number) => api.delete(\`/${entity.route}/\${id}\`).then(res => res.data),
};
  `;
  fs.writeFileSync(path.join(srcDir, 'services', `${entity.name.toLowerCase()}.service.ts`), serviceDef.trim());

  // 3. Generate List Page
  const listPageDef = `
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ${entity.name.toLowerCase()}Service } from '@/services/${entity.name.toLowerCase()}.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ${capitalize(entity.route)}List() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['${entity.route}'],
    queryFn: ${entity.name.toLowerCase()}Service.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: ${entity.name.toLowerCase()}Service.delete,
    onSuccess: () => {
      toast.success('${entity.name} deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['${entity.route}'] });
    },
    onError: () => toast.error('Failed to delete ${entity.name}'),
  });

  if (isLoading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">${entity.name}s</h1>
        <Button asChild>
          <Link to="/${entity.route}/new"><Plus className="mr-2 h-4 w-4" /> Add New</Link>
        </Button>
      </div>
      
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
${entity.fields.map(f => `              <TableHead>${f.name}</TableHead>`).join('\n')}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((item) => (
              <TableRow key={item.${entity.fields.find(f => f.isPrimary)?.name || 'id'}}>
${entity.fields.map(f => `                <TableCell>{String(item.${f.name})}</TableCell>`).join('\n')}
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={\`/${entity.route}/\${item.${entity.fields.find(f => f.isPrimary)?.name || 'id'}}\`}><Edit className="h-4 w-4 text-muted-foreground" /></Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (window.confirm('Are you sure?')) deleteMutation.mutate(item.${entity.fields.find(f => f.isPrimary)?.name || 'id'});
                  }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={${entity.fields.length + 1}} className="h-24 text-center text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
  `;
  fs.writeFileSync(path.join(entityDir, 'index.tsx'), listPageDef.trim());
});

console.log('Entities scaffolding completed.');
