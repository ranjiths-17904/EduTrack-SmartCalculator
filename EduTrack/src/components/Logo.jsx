import React from 'react';
import { GraduationCap, Calculator } from 'lucide-react';

const Logo = ({ size = 'default' }) => {
  const sizeClasses = {
    small: {
      container: 'flex items-center space-x-2',
      icon: 'w-6 h-6',
      text: 'text-lg',
      calc: 'w-3 h-3'
    },
    default: {
      container: 'flex items-center space-x-3',
      icon: 'w-8 h-8',
      text: 'text-2xl',
      calc: 'w-4 h-4'
    },
    large: {
      container: 'flex items-center space-x-4',
      icon: 'w-12 h-12',
      text: 'text-3xl',
      calc: 'w-6 h-6'
    }
  };

  const classes = sizeClasses[size] || sizeClasses.default;

  return (
    <div className={classes.container}>
      <div className="relative">
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-2 rounded-full">
          <GraduationCap className={`${classes.icon} text-gray-900`} />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-blue-500 p-1 rounded-full">
          <Calculator className={`${classes.calc} text-white`} />
        </div>
      </div>
      <div className={`font-bold text-white ${classes.text}`}>
        Smart<span className="text-yellow-400">CGPA</span>
      </div>
    </div>
  );
};

export default Logo;