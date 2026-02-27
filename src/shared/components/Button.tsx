import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', fullWidth, children, ...props }, ref) => {
    let variantStyles = '';
    
    switch (variant) {
      case 'primary':
        variantStyles = 'bg-[#51a8f6] text-white hover:bg-[#4094e0] border border-transparent';
        break;
      case 'outline':
        variantStyles = 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';
        break;
      case 'ghost':
        variantStyles = 'bg-transparent text-gray-500 hover:text-gray-700';
        break;
    }

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`px-4 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-colors duration-200 flex items-center justify-center gap-2 ${variantStyles} ${widthStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
