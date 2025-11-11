import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Button } from './ui/button';
import { LogOut, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useTranslation } from '../hooks/useTranslation';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const t = useTranslation();

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const openDrawer = () => {
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <nav className="border-b border-cyan-400/20 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Menu Button */}
            <div className="w-32">
              <Button
                variant="ghost"
                size="icon"
                onClick={openDrawer}
                className="text-gray-700 dark:text-gray-300 hover:text-cyan-400 hover:bg-cyan-400/10"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Centered Navigation */}
            <div className="flex items-center justify-center flex-1">
              <Link to="/" className="text-2xl font-bold gradient-text">
                Minewise AI
              </Link>
            </div>
            
            {/* Right side - Sign Out */}
            <div className="w-32 flex justify-end">
              <Button variant="ghost" onClick={handleSignOut} className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-cyan-400 hover:bg-cyan-400/10">
                <LogOut className="w-4 h-4" />
                <span>{t('sidebar.signOut')}</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Drawer Menu */}
      <Sidebar 
        isOpen={isDrawerOpen} 
        onClose={closeDrawer}
        onNewChat={() => {
          window.dispatchEvent(new CustomEvent('sidebar:newChat'));
        }}
        onClearConversation={() => {
          window.dispatchEvent(new CustomEvent('sidebar:clearConversation'));
        }}
        onLoadQuery={(query: string) => {
          window.dispatchEvent(new CustomEvent('sidebar:loadQuery', { detail: { query } }));
        }}
      />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}


