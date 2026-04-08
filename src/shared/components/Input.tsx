import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    rightElement?: React.ReactNode;
    error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', rightElement, error, ...props }, ref) => {
        return (
            <div className="relative w-full">
                <input
                    ref={ref}
                    className={`
                        w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm text-gray-900 
                        placeholder:text-gray-400 focus:outline-none transition-all
                        ${error 
                            ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' 
                            : 'border-gray-200 focus:ring-2 focus:ring-[#51a8f6] focus:border-transparent'
                        }
                        ${rightElement ? 'pr-20' : ''} 
                        ${className}
                    `}
                    {...props}
                />
                {rightElement && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {rightElement}
                    </div>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
