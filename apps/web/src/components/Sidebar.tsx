import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, MessageSquare, Pencil, Trash2, Settings, Sun, Moon, Check, X } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp, deleteDoc, doc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import Profile from './Profile';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat?: () => void;
  onClearConversation?: () => void;
  onLoadQuery?: (query: string) => void;
}

interface RecentChat {
  id: string;
  query: string;
  timestamp: Date | Timestamp;
}

export default function Sidebar({ isOpen, onClose, onNewChat, onClearConversation, onLoadQuery }: SidebarProps) {
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const t = useTranslation();

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

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingChatId) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (editInputRef.current) {
          editInputRef.current.focus();
          editInputRef.current.select();
        }
      }, 10);
    }
  }, [editingChatId]);

  // Load recent chats from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Map documents to chat objects - deleted documents won't be in the snapshot
        const chats: RecentChat[] = snapshot.docs
          .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            query: data.query || '',
            timestamp: data.timestamp || new Date(),
          };
          })
          .filter((chat) => chat.id); // Ensure we only include valid chats
        
        // Update state with the current snapshot - this will automatically remove deleted chats
        setRecentChats(chats);
      },
      (error) => {
        console.error('Error loading chats:', error);
        // If index is missing, Firestore will provide a link in the error
        if (error.code === 'failed-precondition') {
          console.warn('Firestore index required. Check the error message for the index creation link.');
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const handleNewChat = () => {
    setSelectedChatId(null);
    if (onNewChat) {
      onNewChat();
    }
    navigate('/');
    onClose();
  };

  const handleClearConversation = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // Optimistically clear the UI immediately
    setRecentChats([]);
    setSelectedChatId(null);
    
    // Clear the conversation/messages
    if (onClearConversation) {
      onClearConversation();
    }
    
    try {
      // Get all chats for the current user
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('userId', '==', user.uid)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // No chats to delete, just navigate and close
        navigate('/');
        onClose();
        return;
      }

      // Firestore batch write limit is 500 operations
      // Delete in batches if there are more than 500 chats
      const batchSize = 500;
      const docs = snapshot.docs;
      
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchDocs = docs.slice(i, i + batchSize);
        
        batchDocs.forEach((docSnapshot) => {
          batch.delete(docSnapshot.ref);
        });
        
        await batch.commit();
      }
      
      // The onSnapshot listener will automatically update the list when it detects the deletions
      // Navigate and close after deletion
      navigate('/');
      onClose();
    } catch (error) {
      console.error('Error clearing conversations:', error);
      // Even if deletion fails, we've already cleared the UI
      // The onSnapshot listener will restore chats if deletion failed
    navigate('/');
    onClose();
    }
  };

  const handleChatClick = (chat: RecentChat) => {
    // Don't navigate if we're editing this chat
    if (editingChatId === chat.id) {
      return;
    }
    setSelectedChatId(chat.id);
    if (onLoadQuery && chat.query) {
      onLoadQuery(chat.query);
    }
    navigate('/');
    onClose();
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Store the chat ID to prevent it from being re-added
    const chatToDelete = chatId;
    
    // Optimistically remove from local state immediately
    setRecentChats(prev => prev.filter(chat => chat.id !== chatToDelete));
    
    // If this was the selected chat, clear it immediately
    if (selectedChatId === chatToDelete) {
        setSelectedChatId(null);
      // Clear the conversation/messages when deleting the selected chat
      if (onClearConversation) {
        onClearConversation();
      }
      navigate('/');
      onClose();
    }
    
    try {
      // Delete the chat from Firestore - this is the source of truth
      await deleteDoc(doc(db, 'chats', chatToDelete));
      // The onSnapshot listener will automatically update the list when it detects the deletion
      // No need to manually update state here as the listener handles it
    } catch (error) {
      console.error('Error deleting chat:', error);
      // If deletion fails, the onSnapshot listener will restore the chat automatically
      // We don't need to manually reload since the listener is already active
    }
  };

  const handleEditChat = (chat: RecentChat, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditValue(chat.query);
  };

  const handleSaveEdit = async (chatId: string) => {
    if (!editValue.trim()) {
      setEditingChatId(null);
      return;
    }

    try {
      await updateDoc(doc(db, 'chats', chatId), {
        query: editValue.trim(),
      });
      setEditingChatId(null);
      setEditValue('');
    } catch (error) {
      console.error('Error updating chat:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingChatId(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(chatId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

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

      {/* Drawer Menu - Theme-aware Design */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-[#171717] dark:bg-[#171717] bg-gray-50 border-r border-gray-800 dark:border-gray-800 border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
      >
        <div className="h-full flex flex-col">
          {/* Top Section - New Chat Button */}
          <div className="p-3">
            <Link to="/" onClick={handleNewChat}>
              <Button className="w-full bg-[#2a2a2a] dark:bg-[#2a2a2a] bg-gray-200 hover:bg-[#353535] dark:hover:bg-[#353535] hover:bg-gray-300 text-gray-800 dark:text-white border-0 rounded-lg h-10 justify-start">
                <Plus className="w-4 h-4 mr-2" />
                {t('sidebar.newChat')}
              </Button>
            </Link>
          </div>

          {/* Selected Chat Item - Show if a chat is selected */}
          {selectedChatId && (() => {
            const selectedChat = recentChats.find(c => c.id === selectedChatId);
            if (!selectedChat) return null;
            return (
              <div className="px-3 mb-2">
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#1f1f1f] dark:bg-[#1f1f1f] bg-gray-100 hover:bg-[#252525] dark:hover:bg-[#252525] hover:bg-gray-200 group">
                <div className="flex items-center flex-1 min-w-0">
                  <MessageSquare className="w-4 h-4 mr-2 text-gray-700 dark:text-white flex-shrink-0" />
                  {editingChatId === selectedChat.id ? (
                    <div className="flex items-center flex-1 gap-1">
                      <Input
                        ref={editInputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, selectedChat.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-7 text-sm bg-[#2a2a2a] dark:bg-[#2a2a2a] bg-gray-200 border-gray-600 dark:border-gray-600 border-gray-300 text-white dark:text-white text-gray-900 px-2 py-1"
                        onBlur={() => handleSaveEdit(selectedChat.id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-green-400 hover:text-green-300 hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveEdit(selectedChat.id);
                        }}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-800 dark:text-white truncate">{selectedChat.query || 'New Chat'}</span>
                  )}
                </div>
                {editingChatId !== selectedChat.id && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white dark:hover:text-white hover:text-gray-900 hover:bg-transparent"
                    onClick={(e) => handleEditChat(selectedChat, e)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white dark:hover:text-white hover:text-gray-900 hover:bg-transparent"
                    onClick={(e) => handleDeleteChat(selectedChat.id, e)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                )}
              </div>
              </div>
            );
          })()}

          {/* Chat List - Scrollable Area */}
          <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
            {recentChats.length > 0 ? (
              <div className="space-y-1">
                {recentChats.map((chat) => {
                  const isSelected = selectedChatId === chat.id;
                  return (
                    <div
                      key={chat.id}
                      onClick={() => handleChatClick(chat)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer group ${
                        isSelected 
                          ? 'bg-[#1f1f1f] dark:bg-[#1f1f1f] bg-gray-100' 
                          : 'hover:bg-[#252525] dark:hover:bg-[#252525] hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <MessageSquare className="w-4 h-4 mr-2 text-gray-700 dark:text-white flex-shrink-0" />
                        {editingChatId === chat.id ? (
                          <div className="flex items-center flex-1 gap-1">
                            <Input
                              ref={editInputRef}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => handleEditKeyDown(e, chat.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-7 text-sm bg-[#2a2a2a] dark:bg-[#2a2a2a] bg-gray-200 border-gray-600 dark:border-gray-600 border-gray-300 text-white dark:text-white text-gray-900 px-2 py-1"
                              onBlur={() => handleSaveEdit(chat.id)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-green-400 hover:text-green-300 hover:bg-transparent"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveEdit(chat.id);
                              }}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-transparent"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelEdit();
                              }}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-800 dark:text-white truncate" title={chat.query}>
                          {chat.query || 'New Chat'}
                        </span>
                        )}
                      </div>
                      {editingChatId !== chat.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white dark:hover:text-white hover:text-gray-900 hover:bg-transparent"
                          onClick={(e) => handleEditChat(chat, e)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white dark:hover:text-white hover:text-gray-900 hover:bg-transparent"
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-600 dark:text-gray-400 text-sm py-8">
                No recent chats
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="border-t border-gray-800 dark:border-gray-800 border-gray-200 mx-3"></div>

          {/* Bottom Section - Utility Options */}
          <div className="p-3 space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-800 dark:text-white hover:bg-[#252525] dark:hover:bg-[#252525] hover:bg-gray-200 h-10 px-3"
              onClick={handleClearConversation}
            >
              <Trash2 className="w-4 h-4 mr-3 text-gray-700 dark:text-white" />
              {t('sidebar.clearConversation')}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-800 dark:text-white hover:bg-[#252525] dark:hover:bg-[#252525] hover:bg-gray-200 h-10 px-3"
              onClick={() => {
                setIsProfileOpen(true);
                onClose();
              }}
            >
              <Settings className="w-4 h-4 mr-3 text-gray-700 dark:text-white" />
              {t('sidebar.settings')}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-800 dark:text-white hover:bg-[#252525] dark:hover:bg-[#252525] hover:bg-gray-200 h-10 px-3"
              onClick={() => {
                toggleTheme();
              }}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 mr-3 text-gray-700 dark:text-white" />
                  {t('sidebar.lightMode')}
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 mr-3 text-gray-700 dark:text-white" />
                  {t('sidebar.darkMode')}
                </>
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Profile Dialog */}
      <Profile open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </>
  );
}

