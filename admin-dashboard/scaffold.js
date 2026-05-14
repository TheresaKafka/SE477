import fs from 'fs';
import path from 'path';

const dirs = [
  'src/components/ui',
  'src/components/common',
  'src/layouts',
  'src/services',
  'src/hooks',
  'src/store',
  'src/types',
  'src/utils',
  'src/pages/Dashboard',
  'src/pages/Login',
  'src/pages/Users',
  'src/pages/Orders',
  'src/pages/Properties',
  'src/pages/Rooms',
  'src/pages/Reviews',
  'src/pages/Payments',
  'src/pages/Roles',
  'src/routes',
];

dirs.forEach(dir => {
  fs.mkdirSync(path.join(process.cwd(), dir), { recursive: true });
});

console.log('Directories created!');
