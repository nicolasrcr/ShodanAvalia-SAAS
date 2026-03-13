import { NavLink, useLocation } from 'react-router-dom';
import { 
  ClipboardList, 
  Users, 
  FileText, 
  History, 
  BookOpen,
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Painel' },
  { href: '/candidates', icon: Users, label: 'Candidatos' },
  { href: '/evaluations', icon: ClipboardList, label: 'Avaliações' },
  { href: '/new-evaluation', icon: FileText, label: 'Nova Súmula' },
  { href: '/history', icon: History, label: 'Histórico' },
  { href: '/programs', icon: BookOpen, label: 'Programas' },
  { href: '/profile', icon: User, label: 'Meu Perfil' },
];

const adminItems = [
  { href: '/validations', icon: ShieldCheck, label: 'Validações' },
];

export function Sidebar() {
  const location = useLocation();
  const { isAdmin } = useRole();

  const allItems = isAdmin ? [...navItems, ...adminItems] : navItems;

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border min-h-[calc(100vh-73px)]">
      <nav className="p-4 space-y-1">
        {allItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                isActive 
                  ? "bg-primary/15 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary/80"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      
      <div className="p-4 mt-8">
        <div className="bg-secondary rounded-lg p-4">
          <h4 className="font-display font-semibold text-sm mb-2">Regulamento CBJ</h4>
          <p className="text-xs text-muted-foreground">
            Sistema baseado no Regulamento de Exame e Outorga de Faixas e Graus da CBJ 2018.
          </p>
        </div>
      </div>
    </aside>
  );
}
