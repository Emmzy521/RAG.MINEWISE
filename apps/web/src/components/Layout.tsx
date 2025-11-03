import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Button } from './ui/button';
import { FileText, Upload, Search, BarChart3, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const navItems = [
    { path: '/', label: 'Home', icon: FileText },
    { path: '/upload', label: 'Upload', icon: Upload },
    { path: '/query', label: 'Query', icon: Search },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-bold text-primary">
                Minewise AI
              </Link>
              <div className="flex space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            <Button variant="ghost" onClick={handleSignOut} className="flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}


