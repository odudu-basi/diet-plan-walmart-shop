
import React, { useEffect, useState } from 'react';
import { ShoppingCart, Sparkles } from 'lucide-react';

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
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 flex items-center justify-center z-50 animate-fade-out">
        {/* Fade out content */}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 flex items-center justify-center z-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-white/10 rounded-full animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-16 h-16 bg-white/10 rounded-full animate-pulse animation-delay-500"></div>
      </div>

      {/* Main Content */}
      <div className="text-center z-10">
        {/* Logo Container */}
        <div className="relative mb-8">
          {/* Main Icon */}
          <div className="relative mx-auto w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center transform animate-bounce">
            <ShoppingCart className="h-12 w-12 text-emerald-600" />
          </div>
          
          {/* Sparkle Accent */}
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          
          {/* Glow Effect */}
          <div className="absolute inset-0 w-24 h-24 bg-white/30 rounded-3xl blur-xl animate-pulse mx-auto"></div>
        </div>

        {/* App Name */}
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
          FreshCart
        </h1>
        
        {/* Tagline */}
        <p className="text-emerald-100 text-lg font-medium mb-8 max-w-sm mx-auto">
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
