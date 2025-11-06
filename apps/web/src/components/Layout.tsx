import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Button } from './ui/button';
import { FileText, Search, LogOut, Menu } from 'lucide-react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const openDrawer = () => {
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const navItems = [
    { path: '/', label: 'Home', icon: FileText },
    { path: '/query', label: 'Query', icon: Search },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-cyan-400/20 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Menu Button */}
            <div className="w-32">
              <Button
                variant="ghost"
                size="icon"
                onClick={openDrawer}
                className="text-gray-300 hover:text-cyan-400 hover:bg-cyan-400/10"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Centered Navigation */}
            <div className="flex items-center justify-center space-x-8 flex-1">
              <Link to="/" className="text-2xl font-bold gradient-text">
                Minewise AI
              </Link>
              <div className="flex space-x-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                        isActive
                          ? 'bg-gradient-cyan text-white shadow-lg shadow-cyan-500/50'
                          : 'text-gray-300 hover:bg-cyan-400/10 hover:text-cyan-400 border border-transparent hover:border-cyan-400/30'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            
            {/* Right side - Sign Out */}
            <div className="w-32 flex justify-end">
              <Button variant="ghost" onClick={handleSignOut} className="flex items-center space-x-2 text-gray-300 hover:text-cyan-400 hover:bg-cyan-400/10">
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Drawer Menu */}
      <Sidebar isOpen={isDrawerOpen} onClose={closeDrawer} />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}


