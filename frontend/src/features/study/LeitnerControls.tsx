import { Button } from '@/components/ui/button';

export function LeitnerControls({
  onResult,
  disabled,
}: {
  onResult: (acierto: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl gap-3">
      <Button className="flex-1" size="lg" variant="danger" disabled={disabled} onClick={() => onResult(false)}>
        Fallé
      </Button>
      <Button className="flex-1" size="lg" variant="success" disabled={disabled} onClick={() => onResult(true)}>
        Acerté
      </Button>
    </div>
  );
}
