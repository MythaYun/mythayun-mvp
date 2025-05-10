'use client';

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiUser, FiLogOut, FiHome, FiClock, FiMap, FiVideo, FiInfo, FiTrendingUp, FiUsers, FiMenu } from "react-icons/fi";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useModal } from "@/lib/contexts/ModalContext";


// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-07 17:59:28";
const CURRENT_USER = "Sdiabate1337";

export default function Home() {
  // Utiliser le contexte d'authentification
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  
  // Use modal context
  const { openModal } = useModal();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Refs for click management
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuContentRef = useRef<HTMLDivElement | null>(null);
  
// Use search params for handling email verification
  const searchParams = useSearchParams();
  
  // Add a state to track if verification has been processed
  const [verificationProcessed, setVerificationProcessed] = useState(false);
  
  // Check for verification success or errors on component mount
  useEffect(() => {
    const verificationSuccess = searchParams.get('verificationSuccess');
    const error = searchParams.get('error');
    
    // Only process once to prevent infinite loop
    if (!verificationProcessed) {
      if (verificationSuccess === 'true') {
        console.log(`[${CURRENT_TIMESTAMP}] Email verification successful, opening login modal`);
        // Open login modal with success message
        openModal('login', { verificationSuccess: true });
        setVerificationProcessed(true);
      } else if (error) {
        // Handle error (can show error toast or modal)
        console.error(`[${CURRENT_TIMESTAMP}] Authentication error: ${error}`);
        setVerificationProcessed(true);
      }
    }
  }, [searchParams, openModal, verificationProcessed]);
  
  // Toggle mobile menu
  const toggleMobileMenu = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!mobileMenuOpen) return;
    
    const handleOutsideClick = (event: MouseEvent): void => {
      if (!menuButtonRef.current || !menuContentRef.current) return;
      
      // TypeScript safety check: ensure target is an Element
      const target = event.target;
      if (!(target instanceof Element)) return;
      
      // Check if click was outside menu and button
      if (
        !menuButtonRef.current.contains(target) && 
        !menuContentRef.current.contains(target)
      ) {
        setMobileMenuOpen(false);
      }
    };
    
    // Add event listener with delay to prevent immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [mobileMenuOpen]);
  
  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!mobileMenuOpen) return;
    
    const handleOutsideClick = (event: MouseEvent): void => {
      if (!menuButtonRef.current || !menuContentRef.current) return;
      
      // TypeScript safety check: ensure target is an Element
      const target = event.target;
      if (!(target instanceof Element)) return;
      
      // Check if click was outside menu and button
      if (
        !menuButtonRef.current.contains(target) && 
        !menuContentRef.current.contains(target)
      ) {
        setMobileMenuOpen(false);
      }
    };
    
    // Add event listener with delay to prevent immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [mobileMenuOpen]);

  return (
    <main className="min-h-screen font-sans text-base bg-slate-900 text-slate-100">
      {/* Modern Navbar with glassmorphism effect - Mobile Optimized */}
      <header className="sticky top-0 z-40 backdrop-blur-lg shadow-sm border-b bg-slate-900/70 border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500">
                Mythayun
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Mobile menu button */}
              <div className="md:hidden">
                <button 
                  ref={menuButtonRef}
                  id="mobile-menu-button"
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-md text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                >
                  <FiMenu size={24} />
                </button>
              </div>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:flex items-center gap-4">
              {isLoading ? (
                <div className="flex items-center text-slate-300">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Chargement...
                </div>
              ) : isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <FiUser className="text-indigo-500" />
                    <span>Bienvenue, {user?.name || CURRENT_USER}</span>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-2 px-4 py-2 rounded-full shadow-sm transition-all bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
                  >
                    <FiLogOut className="text-slate-400" /> Déconnexion
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => openModal('login')}
                    className="px-5 py-2 font-medium rounded-full shadow-sm transition-colors bg-slate-800 border border-slate-700 text-indigo-400 hover:bg-slate-700"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => openModal('register')}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-500 text-white font-medium rounded-full hover:from-indigo-700 hover:to-violet-600 transition-colors shadow-sm"
                  >
                    Inscription
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div 
            ref={menuContentRef}
            id="mobile-menu-content"
            className="md:hidden absolute top-16 inset-x-0 rounded-b-xl border-t shadow-lg p-4 z-50 bg-slate-800 border-slate-700"
          >
            {isLoading ? (
              <div className="flex items-center justify-center p-4 text-slate-300">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Chargement...
              </div>
            ) : isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 text-slate-300">
                  <FiUser className="text-indigo-500" />
                  <span>Bienvenue, {user?.name || CURRENT_USER}</span>
                </div>
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl shadow-sm transition-all bg-slate-700 text-slate-300 hover:bg-slate-600"
                >
                  <FiLogOut className="text-slate-400" /> Déconnexion
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => {
                    openModal('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full p-3 font-medium rounded-xl shadow-sm transition-colors bg-slate-700 text-indigo-400 hover:bg-slate-600"
                >
                  Connexion
                </button>
                <button
                  onClick={() => {
                    openModal('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full p-3 bg-gradient-to-r from-indigo-600 to-violet-500 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-violet-600 transition-colors shadow-sm"
                >
                  Inscription
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Hero Section - Mobile First */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        
        <div className="px-4 py-16 sm:py-20 md:py-28 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-12">
            <div className="flex-1 space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-center md:text-left text-white">
                <span>L'expérience football </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
                  réinventée
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl max-w-2xl text-center md:text-left text-slate-300">
                Mythayun réunit scores en direct, guides de stades et actualités officielles pour une expérience football inégalée.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
                <button 
                  onClick={() => openModal('register')}
                  className="w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-500 text-white rounded-xl sm:rounded-full text-lg font-medium hover:from-indigo-700 hover:to-violet-600 shadow-lg shadow-indigo-900/20 hover:shadow-xl hover:shadow-indigo-900/30 transition-all"
                >
                  Rejoindre maintenant
                </button>
                <button 
                  onClick={() => {}}
                  className="w-full sm:w-auto px-6 py-4 border rounded-xl sm:rounded-full text-lg font-medium shadow-sm hover:shadow transition-all bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                >
                  En savoir plus
                </button>
              </div>
            </div>
            
            {/* Abstract Football Illustration - Mobile Friendly */}
            <div className="flex-1 flex justify-center w-full md:w-auto">
              <div className="relative w-full max-w-xs sm:max-w-sm">
                <div className="absolute -top-8 -right-8 w-32 h-32 sm:w-40 sm:h-40 bg-indigo-400/20 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-4 -left-4 w-20 h-20 sm:w-28 sm:h-28 bg-violet-400/20 rounded-full blur-2xl"></div>
                
                <div className="relative z-10 aspect-square flex items-center justify-center">
                  {/* Football illustration for dark mode */}
                  <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg relative overflow-hidden">
                    <div className="absolute inset-2 rounded-full flex items-center justify-center bg-slate-800">
                      <div className="w-full h-full relative">
                        <div className="absolute inset-0 grid grid-cols-2">
                          {Array.from({length: 6}).map((_, i) => (
                            <div key={i} className="aspect-square border border-slate-700"></div>
                          ))}
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Touch Friendly */}
      <section className="py-16 sm:py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">
              Tout ce dont un fan a besoin
            </h2>
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300">
              Découvrez une plateforme complète conçue pour les passionnés de football.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Feature 1 */}
            <div className="rounded-2xl p-6 sm:p-8 border shadow-sm hover:shadow-md transition-all group bg-slate-700/50 border-slate-600 hover:bg-slate-700">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mb-5 rounded-xl flex items-center justify-center transition-colors bg-slate-600 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white">
                <FiClock size={24} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-white">
                Scores en Direct
              </h3>
              <p className="text-sm sm:text-base text-slate-300">
                Suivez tous vos matchs préférés en temps réel avec des mises à jour instantanées et des statistiques détaillées.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl p-6 sm:p-8 border shadow-sm hover:shadow-md transition-all group bg-slate-700/50 border-slate-600 hover:bg-slate-700">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mb-5 rounded-xl flex items-center justify-center transition-colors bg-slate-600 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white">
                <FiMap size={24} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-white">
                Guides de Stades
              </h3>
              <p className="text-sm sm:text-base text-slate-300">
                Accédez à des guides communautaires pour maximiser votre expérience dans les stades du monde entier.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl p-6 sm:p-8 border shadow-sm hover:shadow-md transition-all group bg-slate-700/50 border-slate-600 hover:bg-slate-700">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mb-5 rounded-xl flex items-center justify-center transition-colors bg-slate-600 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white">
                <FiVideo size={24} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-white">
                Soirées Virtuelles
              </h3>
              <p className="text-sm sm:text-base text-slate-300">
                Créez ou rejoignez des soirées de visionnage pour partager les grands moments avec d'autres passionnés.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl p-6 sm:p-8 border shadow-sm hover:shadow-md transition-all group bg-slate-700/50 border-slate-600 hover:bg-slate-700">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mb-5 rounded-xl flex items-center justify-center transition-colors bg-slate-600 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white">
                <FiInfo size={24} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-white">
                Actualités Officielles
              </h3>
              <p className="text-sm sm:text-base text-slate-300">
                Restez informé avec les dernières actualités provenant directement des fédérations de football.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl p-6 sm:p-8 border shadow-sm hover:shadow-md transition-all group bg-slate-700/50 border-slate-600 hover:bg-slate-700">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mb-5 rounded-xl flex items-center justify-center transition-colors bg-slate-600 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white">
                <FiTrendingUp size={24} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-white">
                Assistance Voyage
              </h3>
              <p className="text-sm sm:text-base text-slate-300">
                Planifiez vos déplacements pour les matchs avec des informations sur l'hébergement et le transport.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl p-6 sm:p-8 border shadow-sm hover:shadow-md transition-all group bg-slate-700/50 border-slate-600 hover:bg-slate-700">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mb-5 rounded-xl flex items-center justify-center transition-colors bg-slate-600 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white">
                <FiUsers size={24} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-white">
                Communauté Active
              </h3>
              <p className="text-sm sm:text-base text-slate-300">
                Échangez avec d'autres supporters passionnés et partagez vos expériences footballistiques.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-700 -z-10"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 -z-10">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="text-white space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold">
              Prêt à rejoindre la communauté?
            </h2>
            <p className="text-base sm:text-lg md:text-xl opacity-80 max-w-2xl mx-auto">
              Créez votre compte en quelques secondes et commencez à vivre le football comme jamais auparavant.
            </p>
            <div className="pt-4">
              <button 
                onClick={() => openModal('register')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl sm:rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all max-w-xs mx-auto bg-white text-indigo-600 hover:bg-slate-100"
              >
                S'inscrire maintenant
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Mobile Optimized */}
      <footer className="text-white py-12 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1 space-y-4">
              <h3 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-300">
                Mythayun
              </h3>
              <p className="text-slate-400 text-sm sm:text-base">
                La plateforme ultime pour les fans de football
              </p>
              <p className="text-slate-500 text-xs sm:text-sm">
                © 2025 Mythayun. Tous droits réservés.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-base sm:text-lg mb-4 text-white">Plateforme</h4>
              <ul className="space-y-2 text-sm sm:text-base">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Actualités</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Guides</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Événements</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-base sm:text-lg mb-4 text-white">Entreprise</h4>
              <ul className="space-y-2 text-sm sm:text-base">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">À propos</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Carrières</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <h4 className="font-bold text-base sm:text-lg mb-4 text-white">Légal</h4>
              <ul className="space-y-2 text-sm sm:text-base">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Conditions</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Confidentialité</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-500 text-xs sm:text-sm text-center md:text-left">
              Dernière mise à jour: {CURRENT_TIMESTAMP}
            </p>
            <div className="flex gap-4 mt-6 md:mt-0">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Bouton retour en haut pour mobile */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 p-3 rounded-full shadow-lg hover:shadow-xl transition-colors z-30 md:hidden bg-indigo-600 text-white hover:bg-indigo-700"
        aria-label="Retour en haut"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 15l-6-6-6 6"/>
        </svg>
      </button>
    </main>
  );
}