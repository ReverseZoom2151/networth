import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  glass?: boolean;
}

export function Card({ children, hover = false, glass = false, className = '', ...props }: CardProps) {
  const baseStyles = 'bg-white rounded-2xl border border-gray-200 shadow-soft';
  const hoverStyles = hover ? 'card-hover' : '';
  const glassStyles = glass ? 'glass' : '';

  return (
    <div className={`${baseStyles} ${hoverStyles} ${glassStyles} ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={`p-6 border-b border-gray-100 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardBody({ children, className = '', ...props }: CardBodyProps) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardFooter({ children, className = '', ...props }: CardFooterProps) {
  return (
    <div className={`p-6 border-t border-gray-100 ${className}`} {...props}>
      {children}
    </div>
  );
}
