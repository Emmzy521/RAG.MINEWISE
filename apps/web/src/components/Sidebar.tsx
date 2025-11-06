import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Plus, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Close drawer on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay/Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer Menu */}
      <aside
        className={`fixed left-0 top-0 h-full w-80 bg-card/95 backdrop-blur-md border-r border-cyan-400/20 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-cyan-400/20 flex items-center justify-between">
            <h2 className="text-xl font-bold gradient-text">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-300 hover:text-cyan-400 hover:bg-cyan-400/10"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* New Chat Button */}
            <Link to="/query" onClick={onClose}>
              <Button className="w-full bg-gradient-cyan text-white hover:opacity-90 hover:shadow-lg hover:shadow-cyan-500/50">
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </Link>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-cyan-400/20 text-white placeholder:text-gray-500 focus-visible:border-cyan-400/50 focus-visible:ring-cyan-400/50"
              />
            </div>

            {/* Chat History Section */}
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                Recent Chats
              </h3>
              <div className="space-y-1">
                {/* Placeholder for chat history - can be populated later */}
                <div className="text-sm text-gray-400 px-2 py-1">
                  No recent chats
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

