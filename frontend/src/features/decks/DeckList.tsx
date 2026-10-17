import { Link } from 'react-router-dom';
import { Clock, Layers, MoreHorizontal, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deckIcon, formatRelative } from '@/lib/leitner';
import type { Deck } from '@/lib/api';

export function DeckList({
  decks,
  onDelete,
  onAddCard,
  onCreateDeck,
  onEdit,
}: {
  decks: Deck[];
  onDelete: (deck: Deck) => void;
  onAddCard: (deck: Deck) => void;
  onCreateDeck?: () => void;
  onEdit?: (deck: Deck) => void;
}) {
  if (decks.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="Aún no tienes mazos"
        description="Crea el primero para empezar a estudiar tus tarjetas."
        action={
          onCreateDeck ? (
            <Button onClick={onCreateDeck}>
              <Plus className="size-4" />
              Nuevo mazo
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {decks.map((deck) => {
        const total = deck.total ?? deck._count?.cards ?? 0;
        const pend = deck.pendientes ?? 0;
        const dom = deck.dominadas ?? 0;
        const pct = total > 0 ? Math.round((dom / total) * 100) : 0;
        const color = deck.color ?? '#1D4ED8';
        const Icon = deckIcon(deck.icon);
        const hasDue = pend > 0;

        return (
          <Card key={deck.id} className="flex flex-col transition-shadow hover:shadow-md">
            <CardHeader className="flex items-center gap-3 pb-0">
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: color }}
                aria-hidden
              >
                <Icon className="size-6" />
              </span>
              <div className="min-w-0">
                <CardTitle className="truncate">{deck.nombre}</CardTitle>
                <p className="text-xs text-ink-soft">
                  {deck.ultimoEstudio ? `Estudiado ${formatRelative(deck.ultimoEstudio).toLowerCase()}` : 'Sin estudiar aún'}
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3">
              {deck.descripcion && <p className="line-clamp-2 text-sm text-ink-soft">{deck.descripcion}</p>}

              <div className="grid gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-soft">
                    {total} tarjeta{total === 1 ? '' : 's'} · {dom} dominada{dom === 1 ? '' : 's'}
                  </span>
                  <span className="font-semibold text-ink">{pct}%</span>
                </div>
                <Progress
                  value={pct}
                  barClassName="bg-teal-500"
                  label={`Progreso de ${deck.nombre}`}
                />
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                {hasDue ? (
                  <Link to={`/study?deckId=${deck.id}`}>
                    <Button size="sm">
                      <Play className="size-4" />
                      Estudiar ({pend})
                    </Button>
                  </Link>
                ) : (
                  <Button size="sm" disabled>
                    <Clock className="size-4" />
                    Nada pendiente
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => onAddCard(deck)}>
                  <Plus className="size-4" />
                  Tarjeta
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="ml-auto"
                      aria-label={`Opciones de ${deck.nombre}`}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {onEdit && (
                      <DropdownMenuItem onSelect={() => onEdit(deck)}>
                        <Pencil className="size-4" />
                        Editar mazo
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onSelect={() => onAddCard(deck)}>
                      <Plus className="size-4" />
                      Agregar tarjeta
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-error focus:bg-error-soft focus:text-error"
                      onSelect={() => onDelete(deck)}
                    >
                      <Trash2 className="size-4" />
                      Borrar mazo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
