'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FiEdit2, FiSave, FiX, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

// Simple notification component to replace react-hot-toast
const Notification = ({ 
  message, 
  type, 
  onClose 
}: { 
  message: string; 
  type: 'success' | 'error'; 
  onClose: () => void;
}) => {
  // Auto-close after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 p-3 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {type === 'success' ? <FiCheckCircle size={20} /> : <FiAlertCircle size={20} />}
      <p>{message}</p>
      <button 
        onClick={onClose} 
        className="ml-2 text-white hover:text-white/70"
        aria-label="Close notification"
      >
        <FiX size={18} />
      </button>
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
  favoriteMatches: string[]; // Added missing property to match AuthContext
}

// Define password update payload
interface PasswordUpdatePayload {
  password: string;
  currentPassword: string;
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
    favoriteMatches: preferences?.favoriteMatches || [] // Added missing property
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
  
  // Loading states
  const [savingUsername, setSavingUsername] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
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
  
  // Update local preferences when user data changes
  useEffect(() => {
    if (user) {
      const updatedPreferences = ensureCompletePreferences(user.preferences);
      setPreferences(updatedPreferences);
      setNotificationPreferences(updatedPreferences.notificationPreferences);
      setDisplayPreferences(updatedPreferences.displayPreferences);
    }
  }, [user]);
  
  // Show notification helper function (replaces toast)
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };
  
  // Hide notification helper
  const hideNotification = () => {
    setNotification(null);
  };
  
  // Handle toggle for notification preferences
  const toggleNotification = (key: keyof NotificationPreferences) => {
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
  
  // Save preferences to backend
  const savePreferences = async (newPreferences: UserPreferences) => {
    try {
      setSavingPreferences(true);
      await updateUserPreferences(newPreferences);
      // Update local state with complete preferences
      setPreferences(newPreferences);
      showNotification('Préférences mises à jour', 'success');
    } catch (error) {
      console.error('Error saving preferences:', error);
      showNotification('Erreur lors de la mise à jour des préférences', 'error');
    } finally {
      setSavingPreferences(false);
    }
  };
  
  // Save username
  const saveUsername = async () => {
    if (!username.trim()) {
      showNotification('Le nom ne peut pas être vide', 'error');
      return;
    }
    
    try {
      setSavingUsername(true);
      await updateUserProfile({ name: username });
      showNotification('Nom mis à jour avec succès', 'success');
      setEditingUsername(false);
    } catch (error) {
      console.error('Error updating username:', error);
      showNotification('Erreur lors de la mise à jour du nom', 'error');
    } finally {
      setSavingUsername(false);
    }
  };
  
  // Save email
  const saveEmail = async () => {
    if (!email.trim() || !email.includes('@')) {
      showNotification('Veuillez entrer une adresse email valide', 'error');
      return;
    }
    
    try {
      setSavingEmail(true);
      await updateUserProfile({ email });
      showNotification('Email mis à jour avec succès', 'success');
      setEditingEmail(false);
    } catch (error) {
      console.error('Error updating email:', error);
      showNotification('Erreur lors de la mise à jour de l\'email', 'error');
    } finally {
      setSavingEmail(false);
    }
  };
  
  // Save password
  const savePassword = async () => {
    if (!currentPassword) {
      showNotification('Veuillez entrer votre mot de passe actuel', 'error');
      return;
    }
    
    if (newPassword.length < 8) {
      showNotification('Le nouveau mot de passe doit contenir au moins 8 caractères', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showNotification('Les mots de passe ne correspondent pas', 'error');
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
      
      showNotification('Mot de passe mis à jour avec succès', 'success');
      setEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      showNotification('Erreur lors de la mise à jour du mot de passe', 'error');
    } finally {
      setSavingPassword(false);
    }
  };
  
  // Delete account confirmation
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const initiateAccountDeletion = () => {
    if (confirmingDelete) {
      if (deleteConfirmText.toLowerCase() !== 'supprimer') {
        showNotification('Veuillez saisir "supprimer" pour confirmer', 'error');
        return;
      }
      
      // Here you would call an API to delete the account
      showNotification('Cette fonctionnalité n\'est pas encore implémentée', 'error');
    } else {
      setConfirmingDelete(true);
    }
  };
  
  return (
    <div className="bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg">
      {/* Display notification if active */}
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={hideNotification} 
        />
      )}
      
      <h2 className="text-xl font-bold mb-6 text-white">Paramètres</h2>
      <p className="text-slate-400 mb-4">Personnalisez votre expérience Mythayun.</p>
      
      <div className="space-y-6">
        {/* Account section */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-white">Compte</h3>
          <div className="space-y-3">
            {/* Username setting */}
            <div className="p-3 bg-slate-700/30 rounded-lg">
              {editingUsername ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-300">Nom d'utilisateur</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingUsername(false); 
                          setUsername(user?.name || '');
                        }}
                        className="p-1.5 rounded-lg bg-slate-600 text-slate-300 hover:bg-slate-500"
                      >
                        <FiX size={18} />
                      </button>
                      <button 
                        onClick={saveUsername}
                        disabled={savingUsername}
                        className={`p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 ${
                          savingUsername ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {savingUsername ? (
                          <span className="flex items-center justify-center h-[18px] w-[18px]">
                            <span className="animate-spin h-3 w-3 border-t-2 border-white rounded-full"></span>
                          </span>
                        ) : (
                          <FiSave size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Votre nom d'utilisateur"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-300">Nom d'utilisateur</span>
                    <p className="text-white font-medium">{user?.name}</p>
                  </div>
                  <button 
                    onClick={() => setEditingUsername(true)}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <FiEdit2 size={16} />
                    <span>Modifier</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* Email setting */}
            <div className="p-3 bg-slate-700/30 rounded-lg">
              {editingEmail ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-300">Adresse e-mail</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingEmail(false); 
                          setEmail(user?.email || '');
                        }}
                        className="p-1.5 rounded-lg bg-slate-600 text-slate-300 hover:bg-slate-500"
                      >
                        <FiX size={18} />
                      </button>
                      <button 
                        onClick={saveEmail}
                        disabled={savingEmail}
                        className={`p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 ${
                          savingEmail ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {savingEmail ? (
                          <span className="flex items-center justify-center h-[18px] w-[18px]">
                            <span className="animate-spin h-3 w-3 border-t-2 border-white rounded-full"></span>
                          </span>
                        ) : (
                          <FiSave size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="votre@email.com"
                  />
                  <p className="text-amber-400 text-xs flex items-center gap-1">
                    <FiAlertCircle size={12} />
                    <span>La modification de l'email nécessitera une nouvelle vérification</span>
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-300">Adresse e-mail</span>
                    <p className="text-white font-medium">{user?.email}</p>
                  </div>
                  <button 
                    onClick={() => setEditingEmail(true)}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <FiEdit2 size={16} />
                    <span>Modifier</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* Password setting */}
            <div className="p-3 bg-slate-700/30 rounded-lg">
              {editingPassword ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-300">Mot de passe</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingPassword(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="p-1.5 rounded-lg bg-slate-600 text-slate-300 hover:bg-slate-500"
                      >
                        <FiX size={18} />
                      </button>
                      <button 
                        onClick={savePassword}
                        disabled={savingPassword}
                        className={`p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 ${
                          savingPassword ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {savingPassword ? (
                          <span className="flex items-center justify-center h-[18px] w-[18px]">
                            <span className="animate-spin h-3 w-3 border-t-2 border-white rounded-full"></span>
                          </span>
                        ) : (
                          <FiSave size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Mot de passe actuel"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Nouveau mot de passe"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Confirmer le mot de passe"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Mot de passe</span>
                  <button 
                    onClick={() => setEditingPassword(true)}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <FiEdit2 size={16} />
                    <span>Modifier</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Preferences section */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-white">Préférences</h3>
          <div className="space-y-2">
            {/* Notification preferences */}
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div>
                <span className="text-slate-300">Rappels de match</span>
                <p className="text-xs text-slate-400">Recevez des notifications avant les matchs</p>
              </div>
              <button
                onClick={() => toggleNotification('matchReminders')}
                disabled={savingPreferences}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  savingPreferences ? 'opacity-50' : ''
                } ${
                  notificationPreferences.matchReminders ? 'bg-indigo-600' : 'bg-slate-600'
                }`}
              >
                <span 
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                    notificationPreferences.matchReminders ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div>
                <span className="text-slate-300">Mises à jour des scores</span>
                <p className="text-xs text-slate-400">Recevez des notifications pour les scores en direct</p>
              </div>
              <button
                onClick={() => toggleNotification('scoreUpdates')}
                disabled={savingPreferences}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  savingPreferences ? 'opacity-50' : ''
                } ${
                  notificationPreferences.scoreUpdates ? 'bg-indigo-600' : 'bg-slate-600'
                }`}
              >
                <span 
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                    notificationPreferences.scoreUpdates ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div>
                <span className="text-slate-300">Alertes d'actualités</span>
                <p className="text-xs text-slate-400">Recevez des actualités importantes sur le football</p>
              </div>
              <button
                onClick={() => toggleNotification('newsAlerts')}
                disabled={savingPreferences}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  savingPreferences ? 'opacity-50' : ''
                } ${
                  notificationPreferences.newsAlerts ? 'bg-indigo-600' : 'bg-slate-600'
                }`}
              >
                <span 
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                    notificationPreferences.newsAlerts ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
            
            {/* Display preferences */}
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div>
                <span className="text-slate-300">Mode sombre</span>
                <p className="text-xs text-slate-400">Utilisez un thème sombre pour l'interface</p>
              </div>
              <button
                onClick={() => toggleDisplay('darkMode')}
                disabled={savingPreferences}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  savingPreferences ? 'opacity-50' : ''
                } ${
                  displayPreferences.darkMode ? 'bg-indigo-600' : 'bg-slate-600'
                }`}
              >
                <span 
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                    displayPreferences.darkMode ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div>
                <span className="text-slate-300">Vue compacte</span>
                <p className="text-xs text-slate-400">Afficher plus d'informations à l'écran</p>
              </div>
              <button
                onClick={() => toggleDisplay('compactView')}
                disabled={savingPreferences}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  savingPreferences ? 'opacity-50' : ''
                } ${
                  displayPreferences.compactView ? 'bg-indigo-600' : 'bg-slate-600'
                }`}
              >
                <span 
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                    displayPreferences.compactView ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
        
        {/* Delete account section */}
        <div className="pt-4 border-t border-slate-700">
          <h3 className="text-lg font-medium text-white mb-3">Danger Zone</h3>
          
          {confirmingDelete ? (
            <div className="space-y-3 p-3 bg-red-900/20 border border-red-900/30 rounded-lg">
              <p className="text-red-300 text-sm">
                Cette action est irréversible. Tout votre contenu et vos données seront définitivement supprimés.
              </p>
              <p className="text-red-300 text-sm">
                Veuillez saisir <strong>supprimer</strong> pour confirmer la suppression de votre compte.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-800 border border-red-900/30 text-white focus:outline-none focus:border-red-500"
                placeholder="Tapez 'supprimer'"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => setConfirmingDelete(false)} 
                  className="flex-1 py-2 text-white bg-slate-700 hover:bg-slate-600 rounded-lg"
                >
                  Annuler
                </button>
                <button 
                  onClick={initiateAccountDeletion} 
                  className="flex-1 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  Confirmer la suppression
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setConfirmingDelete(true)}
              className="w-full py-3 text-white bg-red-600 hover:bg-red-700 rounded-xl font-medium transition-colors"
            >
              Supprimer mon compte
            </button>
          )}
        </div>
      </div>
    </div>
  );
}