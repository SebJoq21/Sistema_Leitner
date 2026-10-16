import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import type { DueCard } from '@/lib/api';

export function Flashcard({ card, flipped, onFlip }: { card: DueCard; flipped: boolean; onFlip: () => void }) {
  return (
    <div className="perspective-1000 mx-auto w-full max-w-xl">
      <button type="button" onClick={onFlip} className="block w-full text-left">
        <div
          className={cn(
            'preserve-3d relative min-h-64 transition-transform duration-500',
            flipped && 'rotate-y-180',
          )}
        >
          <Card className="backface-hidden absolute inset-0 flex items-center justify-center p-8">
            <CardContent>
              <p className="text-center text-2xl font-medium">{card.frontText}</p>
              <p className="mt-4 text-center text-xs text-slate-400">
                Caja {card.cajaActual} · {card.deck?.nombre ?? ''} · clic para ver respuesta
              </p>
            </CardContent>
          </Card>
          <Card className="backface-hidden rotate-y-180 absolute inset-0 flex items-center justify-center bg-secondary-blue/10 p-8 dark:bg-slate-800">
            <CardContent>
              <p className="text-center text-2xl font-medium">{card.backText}</p>
              <p className="mt-4 text-center text-xs text-slate-400">¿Acertaste?</p>
            </CardContent>
          </Card>
        </div>
      </button>
    </div>
  );
}
