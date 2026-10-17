import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from './dialog';
import { Button } from './button';

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Borrar',
  cancelLabel = 'Cancelar',
  destructive = true,
  loading = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <div className="grid gap-3">
          <span
            className={
              destructive
                ? 'flex size-11 items-center justify-center rounded-full bg-error-soft text-error'
                : 'flex size-11 items-center justify-center rounded-full bg-info-soft text-info'
            }
          >
            <AlertTriangle className="size-6" />
          </span>
          <DialogTitle>{title}</DialogTitle>
          {description && <p className="text-sm text-ink-soft">{description}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button
              variant={destructive ? 'destructive' : 'default'}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Procesando…' : confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
