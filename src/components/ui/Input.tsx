import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
  }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, id, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label htmlFor={id} className="text-sm font-bold text-prism-700 block">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-4 text-prism-400">
              {icon}
            </div>
          )}
          <input
            type={type}
            id={id}
            className={cn(
              'w-full bg-prism-50 border-none rounded-xl outline-none py-3 transition-all focus:ring-2 focus:ring-accent-blue',
              icon ? 'pl-11 pr-4' : 'px-4',
              error && 'ring-2 ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500 font-medium pl-1">{error}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
