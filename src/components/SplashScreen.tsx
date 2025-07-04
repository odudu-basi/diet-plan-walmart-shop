

import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 500); // Allow fade out animation
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 flex items-center justify-center z-50 animate-fade-out safe-area-inset">
        {/* Fade out content */}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 flex items-center justify-center z-50 safe-area-inset">
      {/* Animated Background Elements - Responsive */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-20 h-20 sm:w-32 sm:h-32 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-full animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-full animate-pulse animation-delay-500"></div>
      </div>

      {/* Main Content - Optimized for iPhone screens */}
      <div className="text-center z-10 px-4">
        {/* Logo Container - Using new uploaded logo */}
        <div className="relative mb-6 sm:mb-8">
          {/* Main Logo */}
          <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center transform animate-bounce">
            <img 
              src="/lovable-uploads/31904f9b-4920-4bbd-b421-bc9f92a32bd5.png" 
              alt="Preppi Logo" 
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-2xl rounded-2xl"
            />
          </div>
          
          {/* Sparkle Accent */}
          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </div>
          
          {/* Glow Effect */}
          <div className="absolute inset-0 w-24 h-24 sm:w-28 sm:h-28 bg-emerald-300/30 rounded-full blur-xl animate-pulse mx-auto"></div>
        </div>

        {/* App Name - Responsive */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 sm:mb-3 tracking-tight">
          Preppi
        </h1>
        
        {/* Tagline - Responsive */}
        <p className="text-emerald-100 text-base sm:text-lg font-medium mb-6 sm:mb-8 max-w-sm mx-auto px-4">
          Smart Meal Planning & Shopping
        </p>

        {/* Loading Animation */}
        <div className="flex justify-center items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce animation-delay-150"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce animation-delay-300"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

