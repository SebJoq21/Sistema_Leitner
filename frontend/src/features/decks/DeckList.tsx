import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Deck } from '@/lib/api';

export function DeckList({
  decks,
  onDelete,
  onAddCard,
}: {
  decks: Deck[];
  onDelete: (id: string) => void;
  onAddCard: (deck: Deck) => void;
}) {
  if (decks.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="py-4 text-center text-sm text-slate-500">
            Sin mazos todavía. Crea el primero con “Nuevo mazo”.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {decks.map((deck) => (
        <Card key={deck.id}>
          <CardHeader>
            <CardTitle>{deck.nombre}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {deck.descripcion && <p className="text-sm text-slate-500">{deck.descripcion}</p>}
              <p className="text-xs text-slate-400">{deck._count?.cards ?? 0} tarjetas</p>
              <div className="flex flex-wrap gap-2">
                <Link to={`/study?deckId=${deck.id}`}>
                  <Button size="sm">Estudiar</Button>
                </Link>
                <Button size="sm" variant="secondary" onClick={() => onAddCard(deck)}>
                  + Tarjeta
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(deck.id)}>
                  Borrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
