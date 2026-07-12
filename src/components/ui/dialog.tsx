import * as React from 'react';
import { cn } from '@/lib/utils';

type DialogProps = { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode };
type DialogContentProps = React.HTMLAttributes<HTMLDivElement>;
type DialogHeaderProps = React.HTMLAttributes<HTMLDivElement>;
type DialogTitleProps = React.HTMLAttributes<HTMLHeadingElement>;
type DialogDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

const DialogContext = React.createContext<{ open: boolean; onOpenChange: (o: boolean) => void } | null>(null);

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>;
}

export function DialogContent({ className, children, ...props }: DialogContentProps) {
  const ctx = React.useContext(DialogContext);
  if (!ctx?.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => ctx.onOpenChange(false)} />
      <div className={cn('relative z-50 w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-lg mx-4', className)} {...props}>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return <div className={cn('flex flex-col space-y-1.5 text-left mb-4', className)} {...props} />;
}
export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return <h2 className={cn('text-lg font-semibold text-gray-900', className)} {...props} />;
}
export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return <p className={cn('text-sm text-gray-500', className)} {...props} />;
}
