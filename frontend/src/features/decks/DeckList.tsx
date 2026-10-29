import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, MoreHorizontal, Pencil, Play, Plus, Search, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DECK_COLOR_FALLBACK, deckIcon, formatRelative } from '@/lib/leitner';
import type { Deck } from '@/lib/api';

type Order = 'nombre' | 'progreso' | 'pendientes' | 'ultimo';

const selectClass =
  'h-10 rounded-xl border border-border-soft bg-primary-bg px-3 text-sm text-ink outline-none focus:border-secondary-blue focus:ring-2 focus:ring-secondary-blue/15';

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
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState<Order>('nombre');

  const visible = useMemo(() => {
    const s = search.trim().toLowerCase();
    const list = decks.filter((deck) => {
      if (!s) return true;
      return (
        deck.nombre.toLowerCase().includes(s) ||
        (deck.descripcion?.toLowerCase().includes(s) ?? false) ||
        (deck.tags?.some((tag) => tag.toLowerCase().includes(s)) ?? false)
      );
    });
    return [...list].sort((a, b) => {
      if (order === 'progreso') {
        const pa = (a.total ?? 0) > 0 ? (a.dominadas ?? 0) / (a.total ?? 1) : 0;
        const pb = (b.total ?? 0) > 0 ? (b.dominadas ?? 0) / (b.total ?? 1) : 0;
        return pb - pa;
      }
      if (order === 'pendientes') return (b.pendientes ?? 0) - (a.pendientes ?? 0);
      if (order === 'ultimo') {
        const ta = a.ultimoEstudio ? new Date(a.ultimoEstudio).getTime() : 0;
        const tb = b.ultimoEstudio ? new Date(b.ultimoEstudio).getTime() : 0;
        return tb - ta;
      }
      return a.nombre.localeCompare(b.nombre, 'es');
    });
  }, [decks, search, order]);

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
    <div className="grid gap-4">
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
            aria-hidden
          />
          <Input
            className="pl-9"
            placeholder="Nombre, descripción o etiquetas…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar mazo"
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-ink">Ordenar por</label>
          <select
            className={selectClass}
            value={order}
            onChange={(e) => setOrder(e.target.value as Order)}
          >
            <option value="nombre">Nombre (A-Z)</option>
            <option value="progreso">Más dominados</option>
            <option value="pendientes">Más pendientes</option>
            <option value="ultimo">Último estudio</option>
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Ningún mazo coincide"
          description={`No hay mazos que contengan "${search.trim()}".`}
          action={
            <Button variant="secondary" onClick={() => setSearch('')}>
              <X className="size-4" />
              Limpiar búsqueda
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {visible.map((deck) => {
            const total = deck.total ?? deck._count?.cards ?? 0;
            const pend = deck.pendientes ?? 0;
            const dom = deck.dominadas ?? 0;
            const pct = total > 0 ? Math.round((dom / total) * 100) : 0;
            const color = deck.color ?? DECK_COLOR_FALLBACK;
            const Icon = deckIcon(deck.icon);
            const hasDue = pend > 0;

            return (
              <Card
                key={deck.id}
                className="flex flex-col border-l-4 transition-shadow hover:shadow-md"
                style={{ borderLeftColor: color }}
              >
                <CardHeader className="flex items-center gap-3 pb-0">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  >
                    <Icon className="size-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate">{deck.nombre}</CardTitle>
                    <p className="text-xs text-ink-soft">
                      {deck.ultimoEstudio
                        ? `Estudiado ${formatRelative(deck.ultimoEstudio).toLowerCase()}`
                        : 'Sin estudiar aún'}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 shrink-0"
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
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  {deck.descripcion && <p className="line-clamp-2 text-sm text-ink-soft">{deck.descripcion}</p>}

                  {deck.tags && deck.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {deck.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-azul-100 px-2 py-0.5 text-[11px] font-medium text-secondary-navy"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto grid gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-soft">
                        {total} tarjeta{total === 1 ? '' : 's'} · {dom} dominada{dom === 1 ? '' : 's'}
                      </span>
                      <span className="font-semibold text-ink">{pct}%</span>
                    </div>
                    <Progress value={pct} barClassName="bg-azul-500" label={`Progreso de ${deck.nombre}`} />
                  </div>

                  {hasDue && (
                    <div className="pt-1">
                      <Link to={`/study?deckId=${deck.id}`} className="block">
                        <Button size="sm" variant="study" className="w-full">
                          <Play className="size-3.5" />
                          Estudiar ({pend})
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
