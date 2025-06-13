'use client';

export default function GlobalStyles() {
  return (
    <style jsx global>{`
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
      }
      .animate-float {
        animation: float 6s ease-in-out infinite;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .animate-fadeIn {
        animation: fadeIn 0.5s ease-out;
      }
      
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      
      .animate-scaleIn {
        animation: scaleIn 0.2s ease-out forwards;
      }
      
      @keyframes pulse-slow {
        0% { opacity: 0.6; transform: scale(0.98); }
        50% { opacity: 1; transform: scale(1.02); }
        100% { opacity: 0.6; transform: scale(0.98); }
      }
      
      .animate-pulse-slow {
        animation: pulse-slow 3s infinite ease-in-out;
      }
      
      /* Prevent pull-to-refresh on iOS */
      html, body {
        overscroll-behavior-y: contain;
      }
      
      /* Hide scrollbars but keep functionality */
      ::-webkit-scrollbar {
        display: none;
      }
      
      * {
        -ms-overflow-style: none;
        scrollbar-width: none;
        -webkit-tap-highlight-color: transparent;
      }
    `}</style>
  );
}