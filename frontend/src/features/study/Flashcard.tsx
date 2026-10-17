import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { CajaBadge } from '@/components/ui/badge';
import { cajaTheme } from '@/lib/leitner';
import type { DueCard } from '@/lib/api';

export function Flashcard({ card, flipped, onFlip }: { card: DueCard; flipped: boolean; onFlip: () => void }) {
  const theme = cajaTheme(card.cajaActual);
  return (
    <div className="perspective-1000 mx-auto w-full max-w-xl">
      <button type="button" onClick={onFlip} className="block w-full text-left" aria-label="Voltear tarjeta">
        <div
          className={cn(
            'preserve-3d relative min-h-64 transition-transform duration-500',
            flipped && 'rotate-y-180',
          )}
        >
          <Card className="backface-hidden absolute inset-0 flex items-center justify-center p-8">
            <CardContent>
              <p className="text-center text-2xl font-medium">{card.frontText}</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <CajaBadge caja={card.cajaActual} />
                {card.deck && <span className="text-xs text-ink-soft">{card.deck.nombre}</span>}
              </div>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-soft">
                <RotateCw className="size-3.5" />
                Clic para ver la respuesta
              </p>
            </CardContent>
          </Card>
          <Card
            className={cn(
              'backface-hidden rotate-y-180 absolute inset-0 flex items-center justify-center border-0 p-8',
              theme.softBg,
            )}
          >
            <CardContent>
              <p className="text-center text-2xl font-medium">{card.backText}</p>
              <p className="mt-4 text-center text-xs text-ink-soft">¿La sabías?</p>
            </CardContent>
          </Card>
        </div>
      </button>
    </div>
  );
}
