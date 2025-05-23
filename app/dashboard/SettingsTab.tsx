'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  FiEdit2, FiSave, FiX, FiAlertCircle, FiCheckCircle, FiUser, 
  FiMail, FiLock, FiSettings, FiTrash2, FiShield, FiBell, 
  FiEye, FiEyeOff, FiHelpCircle, FiAlertTriangle, FiChevronDown,
  FiMonitor, FiMoon, FiSun, FiMaximize, FiMinimize,
  FiMessageCircle,
  FiActivity
} from 'react-icons/fi';

// Current timestamp and user details
const CURRENT_TIMESTAMP = "2025-05-22 15:38:14";
const CURRENT_USER = "Sdiabate1337";

// Enhanced notification component with animations
const Notification = ({ 
  message, 
  type, 
  onClose,
  onUndo 
}: { 
  message: string; 
  type: 'success' | 'error' | 'info'; 
  onClose: () => void;
  onUndo?: () => void;
}) => {
  // Auto-close after 5 seconds (longer if undo is available)
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, onUndo ? 5000 : 3000);
    
    return () => clearTimeout(timer);
  }, [onClose, onUndo]);
  
  return (
    <div 
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 p-3 pr-10 rounded-lg shadow-lg animate-slideIn transform transition-all ${
        type === 'success' ? 'bg-green-600/95 text-white' : 
        type === 'error' ? 'bg-red-600/95 text-white' : 
        'bg-indigo-600/95 text-white'
      }`}
      role="alert"
      aria-live="assertive"
    >
      {type === 'success' ? (
        <FiCheckCircle size={20} className="animate-scaleIn" />
      ) : type === 'error' ? (
        <FiAlertCircle size={20} className="animate-pulse" />
      ) : (
        <FiAlertCircle size={20} />
      )}
      <div>
        <p>{message}</p>
        {onUndo && (
          <button 
            onClick={onUndo}
            className="text-sm underline mt-1 hover:text-white/80 focus:outline-none focus:ring-1 focus:ring-white/50 rounded px-1"
          >
            Undo
          </button>
        )}
      </div>
      <button 
        onClick={onClose} 
        className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
        aria-label="Close notification"
      >
        <FiX size={16} />
      </button>
    </div>
  );
};

// Tooltip component for better UX
const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {text}
      </div>
    </div>
  );
};

// Confirmation modal component
const ConfirmationModal = ({ 
  title,
  message, 
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonClass = "bg-red-600 hover:bg-red-700",
  confirmIcon = <FiTrash2 size={16} />,
  onConfirm, 
  onCancel 
}: { 
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  confirmIcon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  // Trap focus inside modal for accessibility
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus the cancel button when the modal opens
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Tab') {
        // Trap focus inside modal
        if (!e.shiftKey && document.activeElement === confirmRef.current) {
          e.preventDefault();
          cancelRef.current?.focus();
        } else if (e.shiftKey && document.activeElement === cancelRef.current) {
          e.preventDefault();
          confirmRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-fadeIn"
      onClick={onCancel}
    >
      <div 
        className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-xl border border-slate-700/70 max-w-md w-full animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-message"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-red-600/20 p-3 rounded-full text-red-500">
            <FiAlertTriangle size={24} />
          </div>
          <h3 id="confirmation-title" className="text-xl font-bold text-white">{title}</h3>
        </div>
        
        <div id="confirmation-message" className="text-slate-300 mb-6">
          {message}
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`px-4 py-2 ${confirmButtonClass} text-white rounded-lg transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800`}
          >
            {confirmIcon}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Password strength meter component for better UX
const PasswordStrengthMeter = ({ password }: { password: string }) => {
  // Calculate password strength
  const getStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const strength = getStrength(password);
  
  const getColor = () => {
    switch (strength) {
      case 0: return 'bg-slate-600';
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-green-500';
      default: return 'bg-slate-600';
    }
  };
  
  const getText = () => {
    switch (strength) {
      case 0: return 'Too short';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  if (!password) return null;
  
  return (
    <div className="mt-1">
      <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${getColor()}`}
          style={{ width: `${(strength / 4) * 100}%` }}
        ></div>
      </div>
      <p className={`text-xs mt-1 ${getColor().replace('bg-', 'text-')}`}>{getText()}</p>
    </div>
  );
};

// Define proper preference types
interface NotificationPreferences {
  matchReminders: boolean;
  scoreUpdates: boolean;
  newsAlerts: boolean;
}

interface DisplayPreferences {
  darkMode: boolean;
  compactView: boolean;
}

interface UserPreferences {
  notificationPreferences: NotificationPreferences;
  displayPreferences: DisplayPreferences;
  favoriteLeagues: string[];
  favoriteTeams: string[];
  favoriteMatches: string[]; 
}

// Helper function to ensure we have complete preferences with defaults
function ensureCompletePreferences(preferences: any): UserPreferences {
  const defaultNotificationPreferences: NotificationPreferences = {
    matchReminders: true,
    scoreUpdates: true,
    newsAlerts: false
  };

  const defaultDisplayPreferences: DisplayPreferences = {
    darkMode: true,
    compactView: false
  };

  // Make sure we have a complete preferences object with all required properties
  return {
    notificationPreferences: {
      ...defaultNotificationPreferences,
      ...(preferences?.notificationPreferences || {})
    },
    displayPreferences: {
      ...defaultDisplayPreferences,
      ...(preferences?.displayPreferences || {})
    },
    favoriteLeagues: preferences?.favoriteLeagues || [],
    favoriteTeams: preferences?.favoriteTeams || [],
    favoriteMatches: preferences?.favoriteMatches || []
  };
}

export default function SettingsTab() {
  const { user, updateUserPreferences, updateUserProfile } = useAuth();
  
  // Edit mode states
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  
  // Form values
  const [username, setUsername] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Loading states
  const [savingUsername, setSavingUsername] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    undoAction?: () => void;
  } | null>(null);
  
  // Previous settings store (for undo functionality)
  const [previousSettings, setPreviousSettings] = useState<{
    type: 'preferences' | 'username' | 'email';
    value: any;
  } | null>(null);
  
  // Get user preferences with proper defaults using our helper function
  const [preferences, setPreferences] = useState<UserPreferences>(
    ensureCompletePreferences(user?.preferences)
  );
  
  // Set up preferences state properly
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(
    preferences.notificationPreferences
  );
  
  const [displayPreferences, setDisplayPreferences] = useState<DisplayPreferences>(
    preferences.displayPreferences
  );
  
  // Ref for handling keyboard shortcuts
  const pageRef = useRef<HTMLDivElement>(null);
  
  // Update local preferences when user data changes
  useEffect(() => {
    if (user) {
      const updatedPreferences = ensureCompletePreferences(user.preferences);
      setPreferences(updatedPreferences);
      setNotificationPreferences(updatedPreferences.notificationPreferences);
      setDisplayPreferences(updatedPreferences.displayPreferences);
    }
  }, [user]);
  
  // Show notification helper function with undo support
  const showNotification = (message: string, type: 'success' | 'error' | 'info', undoAction?: () => void) => {
    const id = Date.now().toString();
    setNotification({ id, message, type, undoAction });
    
    // Add vibration for tactile feedback on mobile
    if ('vibrate' in navigator && type === 'success') {
      navigator.vibrate(50);
    } else if ('vibrate' in navigator && type === 'error') {
      navigator.vibrate([100, 50, 100]);
    }
  };
  
  // Hide notification helper
  const hideNotification = () => {
    setNotification(null);
  };
  
  // Handle undo action
  const handleUndo = () => {
    if (notification?.undoAction) {
      notification.undoAction();
      hideNotification();
    }
  };
  
  // Handle toggle for notification preferences
  const toggleNotification = (key: keyof NotificationPreferences) => {
    // Store previous value for undo
    const prevValue = { ...notificationPreferences };
    setPreviousSettings({
      type: 'preferences',
      value: { notificationPreferences: prevValue }
    });
    
    const updatedPreferences = {
      ...notificationPreferences,
      [key]: !notificationPreferences[key]
    };
    
    setNotificationPreferences(updatedPreferences);
    
    // Save changes immediately with complete preferences object
    savePreferences({
      ...preferences,
      notificationPreferences: updatedPreferences
    });
  };
  
  // Handle toggle for display preferences
  const toggleDisplay = (key: keyof DisplayPreferences) => {
    // Store previous value for undo
    const prevValue = { ...displayPreferences };
    setPreviousSettings({
      type: 'preferences',
      value: { displayPreferences: prevValue }
    });
    
    const updatedPreferences = {
      ...displayPreferences,
      [key]: !displayPreferences[key]
    };
    
    setDisplayPreferences(updatedPreferences);
    
    // Save changes immediately with complete preferences object
    savePreferences({
      ...preferences,
      displayPreferences: updatedPreferences
    });
  };
  
  // Undo preference change
  const undoPreferenceChange = () => {
    if (!previousSettings || previousSettings.type !== 'preferences') return;
    
    const { notificationPreferences: prevNotifications, displayPreferences: prevDisplay } = previousSettings.value;
    
    if (prevNotifications) {
      setNotificationPreferences(prevNotifications);
    }
    
    if (prevDisplay) {
      setDisplayPreferences(prevDisplay);
    }
    
    // Save changes back to original values
    savePreferences({
      ...preferences,
      ...(prevNotifications ? { notificationPreferences: prevNotifications } : {}),
      ...(prevDisplay ? { displayPreferences: prevDisplay } : {})
    });
    
    // Clear the stored previous settings
    setPreviousSettings(null);
  };
  
  // Save preferences to backend
  const savePreferences = async (newPreferences: UserPreferences) => {
    try {
      setSavingPreferences(true);
      await updateUserPreferences(newPreferences);
      // Update local state with complete preferences
      setPreferences(newPreferences);
      showNotification('Preferences updated successfully', 'success', undoPreferenceChange);
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error saving preferences:`, error);
      showNotification('Error updating preferences', 'error');
      
      // Revert UI changes on error
      if (previousSettings?.type === 'preferences') {
        const { notificationPreferences: prevNotifications, displayPreferences: prevDisplay } = previousSettings.value;
        
        if (prevNotifications) {
          setNotificationPreferences(prevNotifications);
        }
        
        if (prevDisplay) {
          setDisplayPreferences(prevDisplay);
        }
      }
    } finally {
      setSavingPreferences(false);
    }
  };
  
  // Save username
  const saveUsername = async () => {
    if (!username.trim()) {
      showNotification('Username cannot be empty', 'error');
      return;
    }
    
    // Store previous username for undo
    const prevUsername = user?.name;
    setPreviousSettings({
      type: 'username',
      value: prevUsername
    });
    
    try {
      setSavingUsername(true);
      await updateUserProfile({ name: username });
      showNotification('Username updated successfully', 'success', () => {
        // Undo function
        if (prevUsername) {
          setUsername(prevUsername);
          updateUserProfile({ name: prevUsername }).catch(console.error);
        }
      });
      setEditingUsername(false);
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error updating username:`, error);
      showNotification('Error updating username', 'error');
    } finally {
      setSavingUsername(false);
    }
  };
  
  // Save email
  const saveEmail = async () => {
    if (!email.trim() || !email.includes('@')) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }
    
    // Store previous email for undo
    const prevEmail = user?.email;
    setPreviousSettings({
      type: 'email',
      value: prevEmail
    });
    
    try {
      setSavingEmail(true);
      await updateUserProfile({ email });
      showNotification('Email updated successfully', 'success', () => {
        // Undo function
        if (prevEmail) {
          setEmail(prevEmail);
          updateUserProfile({ email: prevEmail }).catch(console.error);
        }
      });
      setEditingEmail(false);
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error updating email:`, error);
      showNotification('Error updating email', 'error');
    } finally {
      setSavingEmail(false);
    }
  };
  
  // Save password
  const savePassword = async () => {
    if (!currentPassword) {
      showNotification('Please enter your current password', 'error');
      return;
    }
    
    if (newPassword.length < 8) {
      showNotification('New password must be at least 8 characters long', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }
    
    try {
      setSavingPassword(true);
      
      // Password update needs special handling
      await updateUserProfile({
        // @ts-ignore - we know we're passing a password update payload
        password: newPassword,
        currentPassword
      });
      
      showNotification('Password updated successfully', 'success');
      setEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error updating password:`, error);
      showNotification('Error updating password. Please check your current password.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };
  
  // Delete account states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  
  // Handle delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete') {
      showNotification('Please type "delete" to confirm', 'error');
      return;
    }
    
    try {
      setDeletingAccount(true);
      
      // Here you would call the actual API to delete the account
      // await deleteUserAccount();
      
      // For now, just simulate a success
      setTimeout(() => {
        showNotification('Account deletion requested. You will receive a confirmation email.', 'info');
        setShowDeleteModal(false);
        setDeleteConfirmText('');
        setDeletingAccount(false);
      }, 1500);
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error deleting account:`, error);
      showNotification('Error processing account deletion request', 'error');
      setDeletingAccount(false);
    }
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond to shortcuts if not in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      
      // Escape key to cancel editing
      if (e.key === 'Escape') {
        if (editingUsername) {
          setEditingUsername(false);
          setUsername(user?.name || '');
        } else if (editingEmail) {
          setEditingEmail(false);
          setEmail(user?.email || '');
        } else if (editingPassword) {
          setEditingPassword(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }
      }
      
      // Alt+U to edit username
      if (e.altKey && e.key === 'u') {
        e.preventDefault();
        if (!editingUsername) setEditingUsername(true);
      }
      
      // Alt+E to edit email
      if (e.altKey && e.key === 'e') {
        e.preventDefault();
        if (!editingEmail) setEditingEmail(true);
      }
      
      // Alt+P to edit password
      if (e.altKey && e.key === 'p') {
        e.preventDefault();
        if (!editingPassword) setEditingPassword(true);
      }
      
      // Alt+? to show keyboard shortcuts
      if (e.altKey && e.key === '?') {
        e.preventDefault();
        showNotification('Keyboard shortcuts: Alt+U (username), Alt+E (email), Alt+P (password), Esc (cancel)', 'info');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingUsername, editingEmail, editingPassword, user]);
  
  // Show keyboard shortcuts hint on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      const keyboardShortcutsShown = localStorage.getItem('keyboardShortcutsShown');
      if (!keyboardShortcutsShown) {
        showNotification('Tip: Press Alt+? for keyboard shortcuts', 'info');
        localStorage.setItem('keyboardShortcutsShown', 'true');
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div 
      className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-700/50 relative"
      ref={pageRef}
    >
      {/* Display notification if active */}
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={hideNotification}
          onUndo={notification.undoAction ? handleUndo : undefined}
        />
      )}
      
      <div className="flex items-center justify-between mb-6">
        <div className="animate-fadeIn">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiSettings className="text-indigo-400" />
            <span>Settings</span>
          </h2>
          <p className="text-slate-400 mt-1">Customize your experience</p>
        </div>
        
        <Tooltip text="Settings last updated">
          <div className="text-xs text-slate-500 text-right">
            <div>User: {CURRENT_USER}</div>
            <div>Last updated: {CURRENT_TIMESTAMP}</div>
          </div>
        </Tooltip>
      </div>
      
      <div className="space-y-6">
        {/* Account section */}
        <div className="space-y-3 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <FiUser className="text-indigo-400" size={18} />
            <span>Account</span>
          </h3>
          <div className="space-y-3">
            {/* Username setting */}
            <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-700/50 hover:bg-slate-700/40 transition-colors">
              {editingUsername ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-300 flex items-center gap-1.5">
                      <FiUser size={14} className="text-indigo-400" />
                      <span>Username</span>
                      <span className="text-slate-500 text-xs">(Alt+U)</span>
                    </label>
                    <div className="flex gap-2">
                      <Tooltip text="Cancel">
                        <button 
                          onClick={() => {
                            setEditingUsername(false); 
                            setUsername(user?.name || '');
                          }}
                          className="p-1.5 rounded-lg bg-slate-600 text-slate-300 hover:bg-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400"
                          aria-label="Cancel"
                        >
                          <FiX size={18} />
                        </button>
                      </Tooltip>
                      <Tooltip text="Save username">
                        <button 
                          onClick={saveUsername}
                          disabled={savingUsername}
                          className={`p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400 ${
                            savingUsername ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          aria-label="Save"
                        >
                          {savingUsername ? (
                            <span className="flex items-center justify-center h-[18px] w-[18px]">
                              <span className="animate-spin h-3 w-3 border-t-2 border-white rounded-full"></span>
                            </span>
                          ) : (
                            <FiSave size={18} />
                          )}
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                    placeholder="Your username"
                    autoFocus
                    aria-label="Username"
                    maxLength={50}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <FiUser size={14} className="text-indigo-400" />
                      <span>Username</span>
                    </span>
                    <p className="text-white font-medium mt-1">{user?.name}</p>
                  </div>
                  <Tooltip text="Edit username (Alt+U)">
                    <button 
                      onClick={() => setEditingUsername(true)}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors p-1.5 hover:bg-slate-700/70 rounded-lg active:scale-95"
                      aria-label="Edit username"
                    >
                      <FiEdit2 size={16} />
                      <span className="sm:inline hidden">Edit</span>
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>
            
            {/* Email setting */}
            <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-700/50 hover:bg-slate-700/40 transition-colors">
              {editingEmail ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-300 flex items-center gap-1.5">
                      <FiMail size={14} className="text-indigo-400" />
                      <span>Email Address</span>
                      <span className="text-slate-500 text-xs">(Alt+E)</span>
                    </label>
                    <div className="flex gap-2">
                      <Tooltip text="Cancel">
                        <button 
                          onClick={() => {
                            setEditingEmail(false); 
                            setEmail(user?.email || '');
                          }}
                          className="p-1.5 rounded-lg bg-slate-600 text-slate-300 hover:bg-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400"
                          aria-label="Cancel"
                        >
                          <FiX size={18} />
                        </button>
                      </Tooltip>
                      <Tooltip text="Save email">
                        <button 
                          onClick={saveEmail}
                          disabled={savingEmail}
                          className={`p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400 ${
                            savingEmail ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          aria-label="Save"
                        >
                          {savingEmail ? (
                            <span className="flex items-center justify-center h-[18px] w-[18px]">
                              <span className="animate-spin h-3 w-3 border-t-2 border-white rounded-full"></span>
                            </span>
                          ) : (
                            <FiSave size={18} />
                          )}
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                    placeholder="your@email.com"
                    autoFocus
                    aria-label="Email address"
                  />
                  <div className="flex items-start gap-2 text-amber-400 text-xs mt-2">
                    <FiAlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>Changing your email will require re-verification. You will receive a verification link at the new address.</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <FiMail size={14} className="text-indigo-400" />
                      <span>Email Address</span>
                    </span>
                    <p className="text-white font-medium mt-1">{user?.email}</p>
                  </div>
                  <Tooltip text="Edit email (Alt+E)">
                    <button 
                      onClick={() => setEditingEmail(true)}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors p-1.5 hover:bg-slate-700/70 rounded-lg active:scale-95"
                      aria-label="Edit email"
                    >
                      <FiEdit2 size={16} />
                      <span className="sm:inline hidden">Edit</span>
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>
            
            {/* Password setting */}
            <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-700/50 hover:bg-slate-700/40 transition-colors">
              {editingPassword ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-300 flex items-center gap-1.5">
                      <FiLock size={14} className="text-indigo-400" />
                      <span>Password</span>
                      <span className="text-slate-500 text-xs">(Alt+P)</span>
                    </label>
                    <div className="flex gap-2">
                      <Tooltip text="Cancel">
                        <button 
                          onClick={() => {
                            setEditingPassword(false);
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                          className="p-1.5 rounded-lg bg-slate-600 text-slate-300 hover:bg-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400"
                          aria-label="Cancel"
                        >
                          <FiX size={18} />
                        </button>
                      </Tooltip>
                      <Tooltip text="Save password">
                        <button 
                          onClick={savePassword}
                          disabled={savingPassword}
                          className={`p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400 ${
                            savingPassword ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          aria-label="Save"
                        >
                          {savingPassword ? (
                            <span className="flex items-center justify-center h-[18px] w-[18px]">
                              <span className="animate-spin h-3 w-3 border-t-2 border-white rounded-full"></span>
                            </span>
                          ) : (
                            <FiSave size={18} />
                          )}
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full p-2.5 pr-10 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                      placeholder="Current password"
                      autoFocus
                      aria-label="Current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                    >
                      {showCurrentPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2.5 pr-10 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                      placeholder="New password"
                      aria-label="New password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  
                  {/* Password strength meter */}
                  <PasswordStrengthMeter password={newPassword} />
                  
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full p-2.5 pr-10 rounded-lg bg-slate-800 border text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors ${
                        confirmPassword && confirmPassword !== newPassword 
                          ? 'border-red-500' 
                          : confirmPassword && confirmPassword === newPassword
                            ? 'border-green-500'
                            : 'border-slate-600'
                      }`}
                      placeholder="Confirm password"
                      aria-label="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <FiAlertCircle size={12} />
                      <span>Passwords do not match</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FiLock className="text-indigo-400" size={14} />
                    <span className="text-slate-300">Password</span>
                  </div>
                  <Tooltip text="Change password (Alt+P)">
                    <button 
                      onClick={() => setEditingPassword(true)}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors p-1.5 hover:bg-slate-700/70 rounded-lg active:scale-95"
                      aria-label="Change password"
                    >
                      <FiEdit2 size={16} />
                      <span className="sm:inline hidden">Change</span>
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Preferences section */}
        <div className="space-y-3 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <FiSettings className="text-indigo-400" size={18} />
            <span>Preferences</span>
          </h3>
          <div className="space-y-2">
            {/* Notification preferences */}
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-700/50 hover:bg-slate-700/40 transition-colors">
              <div className="flex gap-3 items-center">
                <div className="p-2 rounded-full bg-indigo-500/10 text-indigo-400">
                  <FiBell size={18} />
                </div>
                <div>
                  <span className="text-slate-300">Match Reminders</span>
                  <p className="text-xs text-slate-400">Receive notifications before matches</p>
                </div>
              </div>
              <Tooltip text={notificationPreferences.matchReminders ? "Disable match reminders" : "Enable match reminders"}>
                <button
                  onClick={() => toggleNotification('matchReminders')}
                  disabled={savingPreferences}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    savingPreferences ? 'opacity-50' : ''
                  } ${
                    notificationPreferences.matchReminders ? 'bg-indigo-600' : 'bg-slate-600'
                  }`}
                  aria-pressed={notificationPreferences.matchReminders}
                  aria-label="Toggle match reminders"
                >
                  <span 
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                      notificationPreferences.matchReminders ? 'right-0.5 translate-x-0' : 'left-0.5 translate-x-0'
                    }`}
                  />
                </button>
              </Tooltip>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-700/50 hover:bg-slate-700/40 transition-colors">
              <div className="flex gap-3 items-center">
                <div className="p-2 rounded-full bg-green-500/10 text-green-400">
                  <FiActivity size={18} />
                </div>
                <div>
                  <span className="text-slate-300">Score Updates</span>
                  <p className="text-xs text-slate-400">Receive notifications for live scores</p>
                </div>
              </div>
              <Tooltip text={notificationPreferences.scoreUpdates ? "Disable score updates" : "Enable score updates"}>
                <button
                  onClick={() => toggleNotification('scoreUpdates')}
                  disabled={savingPreferences}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    savingPreferences ? 'opacity-50' : ''
                  } ${
                    notificationPreferences.scoreUpdates ? 'bg-indigo-600' : 'bg-slate-600'
                  }`}
                  aria-pressed={notificationPreferences.scoreUpdates}
                  aria-label="Toggle score updates"
                >
                  <span 
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                      notificationPreferences.scoreUpdates ? 'right-0.5 translate-x-0' : 'left-0.5 translate-x-0'
                    }`}
                  />
                </button>
              </Tooltip>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-700/50 hover:bg-slate-700/40 transition-colors">
              <div className="flex gap-3 items-center">
                <div className="p-2 rounded-full bg-amber-500/10 text-amber-400">
                  <FiMessageCircle size={18} />
                </div>
                <div>
                  <span className="text-slate-300">News Alerts</span>
                  <p className="text-xs text-slate-400">Receive important football news</p>
                </div>
              </div>
              <Tooltip text={notificationPreferences.newsAlerts ? "Disable news alerts" : "Enable news alerts"}>
                <button
                  onClick={() => toggleNotification('newsAlerts')}
                  disabled={savingPreferences}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    savingPreferences ? 'opacity-50' : ''
                  } ${
                    notificationPreferences.newsAlerts ? 'bg-indigo-600' : 'bg-slate-600'
                  }`}
                  aria-pressed={notificationPreferences.newsAlerts}
                  aria-label="Toggle news alerts"
                >
                  <span 
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                      notificationPreferences.newsAlerts ? 'right-0.5 translate-x-0' : 'left-0.5 translate-x-0'
                    }`}
                  />
                </button>
              </Tooltip>
            </div>
            
            {/* Display preferences */}
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-700/50 hover:bg-slate-700/40 transition-colors">
              <div className="flex gap-3 items-center">
                <div className="p-2 rounded-full bg-blue-500/10 text-blue-400">
                  {displayPreferences.darkMode ? <FiMoon size={18} /> : <FiSun size={18} />}
                </div>
                <div>
                  <span className="text-slate-300">Dark Mode</span>
                  <p className="text-xs text-slate-400">Use a dark theme for the interface</p>
                </div>
              </div>
              <Tooltip text={displayPreferences.darkMode ? "Switch to light mode" : "Switch to dark mode"}>
                <button
                  onClick={() => toggleDisplay('darkMode')}
                  disabled={savingPreferences}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    savingPreferences ? 'opacity-50' : ''
                  } ${
                    displayPreferences.darkMode ? 'bg-indigo-600' : 'bg-slate-600'
                  }`}
                  aria-pressed={displayPreferences.darkMode}
                  aria-label="Toggle dark mode"
                >
                  <span 
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                      displayPreferences.darkMode ? 'right-0.5 translate-x-0' : 'left-0.5 translate-x-0'
                    }`}
                  />
                </button>
              </Tooltip>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-700/50 hover:bg-slate-700/40 transition-colors">
              <div className="flex gap-3 items-center">
                <div className="p-2 rounded-full bg-purple-500/10 text-purple-400">
                  {displayPreferences.compactView ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
                </div>
                <div>
                  <span className="text-slate-300">Compact View</span>
                  <p className="text-xs text-slate-400">Show more information on screen</p>
                </div>
              </div>
              <Tooltip text={displayPreferences.compactView ? "Switch to standard view" : "Switch to compact view"}>
                <button
                  onClick={() => toggleDisplay('compactView')}
                  disabled={savingPreferences}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    savingPreferences ? 'opacity-50' : ''
                  } ${
                    displayPreferences.compactView ? 'bg-indigo-600' : 'bg-slate-600'
                  }`}
                  aria-pressed={displayPreferences.compactView}
                  aria-label="Toggle compact view"
                >
                  <span 
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                      displayPreferences.compactView ? 'right-0.5 translate-x-0' : 'left-0.5 translate-x-0'
                    }`}
                  />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
        
        {/* Link account section */}
        <div className="space-y-3 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <FiShield className="text-indigo-400" size={18} />
            <span>Linked Accounts</span>
          </h3>
          
          <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#4285F4]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <div>
                  <span className="text-white">Google</span>
                  <p className="text-xs text-slate-400">Connected</p>
                </div>
              </div>
              <button className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors">
                Disconnect
              </button>
            </div>
            
            <div className="border-t border-slate-700/50 my-4"></div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1877F2]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M24 12.073c0-5.8-4.703-10.503-10.503-10.503S2.994 6.273 2.994 12.073c0 5.242 3.84 9.593 8.859 10.382v-7.345h-2.668v-3.037h2.668V9.739c0-2.633 1.568-4.087 3.97-4.087 1.15 0 2.352.206 2.352.206v2.587h-1.326c-1.303 0-1.71.81-1.71 1.64v1.973h2.912l-.465 3.037h-2.447v7.345c5.02-.79 8.859-5.141 8.859-10.382z" />
                  </svg>
                </div>
                <div>
                  <span className="text-white">Facebook</span>
                  <p className="text-xs text-slate-400">Not connected</p>
                </div>
              </div>
              <button className="px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors">
                Connect
              </button>
            </div>
          </div>
        </div>
        
        {/* Delete account section */}
        <div className="pt-5 mt-2 border-t border-slate-700 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-3">
            <FiTrash2 className="text-red-500" size={18} />
            <span>Danger Zone</span>
          </h3>
          
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-3 text-white bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 rounded-xl font-medium transition-colors shadow-sm hover:shadow flex items-center justify-center gap-2"
            aria-label="Delete account"
          >
            <FiTrash2 size={18} />
            <span>Delete My Account</span>
          </button>
        </div>
        
        {/* Footer with current user info */}
        <div className="pt-4 mt-4 border-t border-slate-700/50 text-xs text-slate-500 flex justify-between">
          <div>User ID: {user?.id || 'unknown'}</div>
          <div>Last login: {new Date(CURRENT_TIMESTAMP).toLocaleString()}</div>
        </div>
      </div>
      
      {/* Help button */}
      <Tooltip text="Keyboard shortcuts (Alt+?)">
        <button
          onClick={() => showNotification('Keyboard shortcuts: Alt+U (username), Alt+E (email), Alt+P (password), Esc (cancel)', 'info')}
          className="absolute bottom-5 right-5 w-9 h-9 bg-slate-800/80 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-indigo-700 transition-colors"
          aria-label="Show keyboard shortcuts"
        >
          <FiHelpCircle size={18} />
        </button>
      </Tooltip>
      
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <ConfirmationModal
          title="Delete Account"
          message={
            <div className="space-y-4">
              <p>This action is <strong className="text-red-400">permanent and irreversible</strong>. All your data will be deleted, including:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>Your profile information</li>
                <li>Favorites and preferences</li>
                <li>Notifications and settings</li>
                <li>Saved content</li>
              </ul>
              <div className="bg-slate-800/50 border border-slate-700 p-3 rounded">
                <p className="mb-2 font-medium text-white">To confirm, please type <strong>delete</strong> below:</p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full p-2 rounded bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder='Type "delete"'
                  autoFocus
                />
              </div>
            </div>
          }
          confirmText={deletingAccount ? "Processing..." : "Delete Account"}
          cancelText="Cancel"
          confirmButtonClass={deletingAccount ? "bg-slate-700 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}
          onConfirm={handleDeleteAccount}
          onCancel={() => {
            setShowDeleteModal(false);
            setDeleteConfirmText('');
          }}
        />
      )}
      
      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}