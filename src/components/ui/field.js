// components/ui/field.jsx (since you're using it)
export const FieldGroup = ({ children, className, ...props }) => (
  <div className={`space-y-4 ${className}`} {...props}>
    {children}
  </div>
)

export const Field = ({ children, className, ...props }) => (
  <div className={`space-y-2 ${className}`} {...props}>
    {children}
  </div>
)

export const FieldLabel = ({ children, htmlFor, className, ...props }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-800 dark:text-gray-200 ${className}`} {...props}>
    {children}
  </label>
)

export const FieldDescription = ({ children, className, ...props }) => (
  <p className={`text-sm text-gray-600 dark:text-gray-200/90 ${className}`} {...props}>
    {children}
  </p>
)