import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'prism'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: 'bg-prism-900 text-white hover:bg-prism-800 shadow-lg shadow-prism-900/10',
      secondary: 'bg-prism-100 text-prism-900 hover:bg-prism-200',
      outline: 'border border-prism-200 bg-transparent hover:bg-prism-50 text-prism-700',
      ghost: 'hover:bg-prism-100 text-prism-600',
      prism: 'prism-gradient text-white hover:opacity-90 shadow-lg shadow-accent-purple/20'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-6 py-2.5 text-sm',
      lg: 'px-8 py-3 text-base',
      icon: 'p-2'
    };

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
