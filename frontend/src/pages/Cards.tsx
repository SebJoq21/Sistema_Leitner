import { useMemo, useRef, useState } from 'react';
import { Link, redirect, useLoaderData, useRevalidator, type LoaderFunctionArgs } from 'react-router-dom';
import {
  ArrowUpDown,
  Clock,
  Download,
  Filter,
  FolderInput,
  FolderOpen,
  Layers,
  ListChecks,
  Pencil,
  Play,
  Plus,
  Search,
  SquareStack,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CajaBadge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { TextArea } from '@/components/ui/input';
import { api, type Deck, type DueCard } from '@/lib/api';
import { getStoredToken } from '@/lib/supabase';
import { formatNextReview, DECK_COLOR_FALLBACK } from '@/lib/leitner';
import { downloadCsv, parseCsv, toCsv } from '@/lib/csv';

export interface CardsData {
  cards: DueCard[];
  decks: Deck[];
  token: string;
}

type CardOrder = 'recientes' | 'proxima';

const toolbarFieldClass =
  'h-9 w-full rounded-xl border border-border-soft bg-primary-bg pl-9 pr-3 text-xs font-medium text-ink outline-none transition-colors hover:border-secondary-blue/40 focus:border-secondary-blue focus:ring-2 focus:ring-secondary-blue/15';

export async function cardsLoader({ request }: LoaderFunctionArgs): Promise<CardsData> {
  const token = getStoredToken();
  if (!token) {
    throw redirect('/login');
  }
  const url = new URL(request.url);
  const filters = {
    deckId: url.searchParams.get('deckId') ?? undefined,
    caja: url.searchParams.get('caja') ? Number(url.searchParams.get('caja')) : undefined,
    search: url.searchParams.get('search') ?? undefined,
  };
  const [cards, decks] = await Promise.all([api.listCards(token, filters), api.listDecks(token)]);
  return { cards, decks, token };
}

function EditCardForm({
  card,
  onSubmit,
  submitting,
}: {
  card: DueCard;
  onSubmit: (values: { frontText: string; backText: string }) => Promise<void> | void;
  submitting?: boolean;
}) {
  const [frontText, setFrontText] = useState(card.frontText);
  const [backText, setBackText] = useState(card.backText);
  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({ frontText, backText });
      }}
    >
      <TextArea label="Pregunta (anverso)" value={frontText} onChange={(e) => setFrontText(e.target.value)} />
      <TextArea label="Respuesta (reverso)" value={backText} onChange={(e) => setBackText(e.target.value)} />
      <Button type="submit" disabled={submitting || frontText.trim() === '' || backText.trim() === ''}>
        {submitting ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </form>
  );
}

export function CardsPage() {
  const { cards: initial, decks, token } = useLoaderData() as CardsData;
  const revalidator = useRevalidator();
  const [cards, setCards] = useState<DueCard[]>(initial);
  const [search, setSearch] = useState('');
  const [deckId, setDeckId] = useState('');
  const [caja, setCaja] = useState('');
  const [order, setOrder] = useState<CardOrder>('recientes');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<DueCard | null>(null);
  const [confirmCard, setConfirmCard] = useState<DueCard | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [moveTarget, setMoveTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasFilters = search.trim() !== '' || deckId !== '' || caja !== '';

  function clearFilters() {
    setSearch('');
    setDeckId('');
    setCaja('');
  }

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const list = cards.filter((c) => {
      if (deckId && c.deckId !== deckId) return false;
      if (caja && c.cajaActual !== Number(caja)) return false;
      if (s && !c.frontText.toLowerCase().includes(s) && !c.backText.toLowerCase().includes(s)) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (order === 'proxima') {
        return a.proximaRevision.localeCompare(b.proximaRevision);
      }
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [cards, search, deckId, caja, order]);

  const selectedIds = useMemo(() => filtered.filter((c) => selected.has(c.id)).map((c) => c.id), [filtered, selected]);
  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (filtered.length > 0 && filtered.every((c) => prev.has(c.id))) return new Set();
      return new Set(filtered.map((c) => c.id));
    });
  }

  async function handleUpdate(values: { frontText: string; backText: string }) {
    if (!editing) return;
    setBusy(true);
    try {
      const updated = await api.updateCard(token, editing.id, values);
      setCards((list) => list.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
      setEditing(null);
      toast.success('Tarjeta actualizada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirmCard) return;
    const card = confirmCard;
    try {
      await api.deleteCard(token, card.id);
      setCards((list) => list.filter((c) => c.id !== card.id));
      setConfirmCard(null);
      toast.success('Tarjeta borrada', {
        action: {
          label: 'Deshacer',
          onClick: async () => {
            try {
              const recreated = await api.createCard(token, {
                deckId: card.deckId,
                frontText: card.frontText,
                backText: card.backText,
                hint: card.hint,
                notas: card.notas,
                tags: card.tags,
                cajaInicial: card.cajaActual,
              });
              setCards((list) => [recreated, ...list]);
              toast.success('Tarjeta restaurada');
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'No se pudo restaurar');
            }
          },
        },
      });
      revalidator.revalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo borrar');
    }
  }

  async function handleBulkDelete() {
    const targets = cards.filter((c) => selected.has(c.id));
    if (targets.length === 0) return;
    setBusy(true);
    try {
      await Promise.all(targets.map((c) => api.deleteCard(token, c.id)));
      setCards((list) => list.filter((c) => !selected.has(c.id)));
      setSelected(new Set());
      setConfirmBulk(false);
      toast.success(`${targets.length} tarjetas borradas`, {
        action: {
          label: 'Deshacer',
          onClick: async () => {
            try {
              for (const c of targets) {
                await api.createCard(token, {
                  deckId: c.deckId,
                  frontText: c.frontText,
                  backText: c.backText,
                  hint: c.hint,
                  notas: c.notas,
                  tags: c.tags,
                  cajaInicial: c.cajaActual,
                });
              }
              toast.success('Tarjetas restauradas');
              revalidator.revalidate();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'No se pudo restaurar');
            }
          },
        },
      });
      revalidator.revalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudieron borrar');
    } finally {
      setBusy(false);
    }
  }

  async function handleBulkMove() {
    if (!moveTarget) return;
    const target = decks.find((d) => d.id === moveTarget);
    const targets = cards.filter((c) => selected.has(c.id));
    if (targets.length === 0) return;
    setBusy(true);
    try {
      await Promise.all(targets.map((c) => api.updateCard(token, c.id, { deckId: moveTarget })));
      setCards((list) =>
        list.map((c) =>
          selected.has(c.id)
            ? {
                ...c,
                deckId: moveTarget,
                deck: { id: moveTarget, nombre: target?.nombre ?? '', color: target?.color, icon: target?.icon },
              }
            : c,
        ),
      );
      setSelected(new Set());
      setMoveTarget('');
      toast.success(`${targets.length} tarjetas movidas a "${target?.nombre ?? ''}"`);
      revalidator.revalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudieron mover');
    } finally {
      setBusy(false);
    }
  }

  function handleExport() {
    const rows: string[][] = [['Pregunta', 'Respuesta', 'Pista', 'Notas', 'Tags', 'Caja']];
    for (const c of filtered) {
      rows.push([
        c.frontText,
        c.backText,
        c.hint ?? '',
        c.notas ?? '',
        (c.tags ?? []).join('|'),
        String(c.cajaActual),
      ]);
    }
    const deckName = deckId ? decks.find((d) => d.id === deckId)?.nombre : undefined;
    const filename = `${(deckName ?? 'tarjetas').replace(/[^\w-]+/g, '_')}.csv`;
    downloadCsv(filename, toCsv(rows));
    toast.success(`Exportadas ${filtered.length} tarjetas`);
  }

  async function handleImportFile(file: File) {
    setImporting(true);
    try {
      const rows = parseCsv(await file.text());
      if (rows.length === 0) {
        toast.error('El archivo está vacío');
        return;
      }
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const hasHeader = header.some((h) =>
        ['pregunta', 'respuesta', 'front', 'back', 'question', 'answer', 'fronttext', 'backtext'].includes(h),
      );
      const pos = (names: string[]) => (hasHeader ? header.findIndex((h) => names.includes(h)) : -1);
      const iFront = hasHeader ? pos(['pregunta', 'front', 'question', 'fronttext']) : 0;
      const iBack = hasHeader ? pos(['respuesta', 'back', 'answer', 'backtext']) : 1;
      const iHint = pos(['pista', 'hint']);
      const iNotas = pos(['notas', 'notes']);
      const iTags = pos(['tags', 'etiquetas']);
      const iCaja = pos(['caja', 'cajaactual', 'box']);
      const iDeck = pos(['mazo', 'deck']);
      if (iFront < 0 || iBack < 0) {
        toast.error('Faltan las columnas de pregunta y respuesta');
        return;
      }
      const body = hasHeader ? rows.slice(1) : rows;
      const byName = new Map(decks.map((d) => [d.nombre.toLowerCase(), d.id]));
      let ok = 0;
      let skipped = 0;
      for (const row of body) {
        const front = (row[iFront] ?? '').trim();
        const back = (row[iBack] ?? '').trim();
        if (!front || !back) {
          skipped++;
          continue;
        }
        const deckName = iDeck >= 0 ? (row[iDeck] ?? '').trim().toLowerCase() : '';
        const targetDeck = deckName ? byName.get(deckName) : deckId || undefined;
        if (!targetDeck) {
          skipped++;
          continue;
        }
        const cajaRaw = iCaja >= 0 ? Number(row[iCaja]) : NaN;
        const cajaInicial = Number.isFinite(cajaRaw)
          ? Math.min(Math.max(Math.trunc(cajaRaw), 1), 5)
          : undefined;
        const tags =
          iTags >= 0
            ? (row[iTags] ?? '')
                .split('|')
                .map((t) => t.trim())
                .filter(Boolean)
            : undefined;
        try {
          await api.createCard(token, {
            deckId: targetDeck,
            frontText: front,
            backText: back,
            hint: iHint >= 0 ? (row[iHint] ?? '').trim() || undefined : undefined,
            notas: iNotas >= 0 ? (row[iNotas] ?? '').trim() || undefined : undefined,
            tags,
            cajaInicial,
          });
          ok++;
        } catch {
          skipped++;
        }
      }
      if (ok > 0) revalidator.revalidate();
      if (ok > 0) toast.success(`Importadas ${ok} tarjetas${skipped ? `, ${skipped} omitidas` : ''}`);
      else toast.warning('No se pudo importar ninguna tarjeta (revisa el mazo destino)');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo importar');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="grid gap-5">
      {/* Cabecera + Acciones globales sutiles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-secondary-navy dark:text-white">Tarjetas</h1>
          <p className="mt-0.5 text-xs font-medium text-ink-soft">
            Mostrando <span className="font-semibold text-ink">{filtered.length}</span> de{' '}
            <span className="font-semibold text-ink">{cards.length}</span> tarjeta{cards.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="h-9 rounded-xl border border-border-soft bg-surface px-3 text-xs font-medium text-ink-soft shadow-2xs hover:bg-primary-muted hover:text-ink"
          >
            <Download className="size-3.5" />
            Exportar CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="h-9 rounded-xl border border-border-soft bg-surface px-3 text-xs font-medium text-ink-soft shadow-2xs hover:bg-primary-muted hover:text-ink"
          >
            <Upload className="size-3.5" />
            {importing ? 'Importando…' : 'Importar CSV'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
            }}
          />
        </div>
      </div>

      {/* Barra de herramientas horizontal compacta */}
      <div className="rounded-2xl border border-border-soft bg-surface p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Buscar */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="search"
              placeholder="Buscar pregunta o respuesta…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={toolbarFieldClass}
              aria-label="Buscar tarjetas"
            />
          </div>

          {/* Mazo */}
          <div className="relative w-full sm:w-44">
            <FolderOpen className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <select
              className={toolbarFieldClass}
              value={deckId}
              onChange={(e) => setDeckId(e.target.value)}
              aria-label="Filtrar por mazo"
            >
              <option value="">Todos los mazos</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Caja */}
          <div className="relative w-full sm:w-44">
            <Layers className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <select
              className={toolbarFieldClass}
              value={caja}
              onChange={(e) => setCaja(e.target.value)}
              aria-label="Filtrar por caja"
            >
              <option value="">Todas las cajas</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  Caja {n}
                </option>
              ))}
            </select>
          </div>

          {/* Ordenar por */}
          <div className="relative w-full sm:w-52">
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <select
              className={toolbarFieldClass}
              value={order}
              onChange={(e) => setOrder(e.target.value as CardOrder)}
              aria-label="Ordenar tarjetas por"
            >
              <option value="recientes">Creación (recientes)</option>
              <option value="proxima">Próxima revisión</option>
            </select>
          </div>

          {/* Limpiar filtros (solo visible cuando hay filtros activos) */}
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium text-ink-soft transition-colors hover:bg-primary-muted hover:text-ink"
            >
              <X className="size-3.5" />
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Sub-barra de selección */}
        {filtered.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-border-soft/70 pt-2.5 text-xs text-ink-soft">
            <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-ink-soft hover:text-ink">
              <input
                type="checkbox"
                className="size-4 rounded accent-[#3481BC]"
                checked={allSelected}
                onChange={toggleAll}
              />
              Seleccionar todo ({filtered.length})
            </label>
            {selected.size > 0 && (
              <span className="font-semibold text-secondary-blue">
                {selected.size} seleccionada{selected.size === 1 ? '' : 's'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Barra de acciones masivas cuando hay seleccionadas */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-secondary-blue/25 bg-azul-100/70 px-4 py-2.5 shadow-xs dark:bg-secondary-blue/10">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-secondary-navy dark:text-white">
            <ListChecks className="size-4 text-secondary-blue" />
            {selected.size} tarjeta{selected.size === 1 ? '' : 's'} seleccionada{selected.size === 1 ? '' : 's'}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              className="h-8 rounded-xl border border-border-soft bg-surface px-2.5 text-xs font-medium text-ink outline-none focus:border-secondary-blue"
              value={moveTarget}
              onChange={(e) => setMoveTarget(e.target.value)}
              aria-label="Mover a mazo"
            >
              <option value="">Mover a…</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
            <Button size="sm" variant="secondary" disabled={!moveTarget || busy} onClick={handleBulkMove}>
              <FolderInput className="size-3.5" />
              Mover
            </Button>
            <Button size="sm" variant="danger" disabled={busy} onClick={() => setConfirmBulk(true)}>
              <Trash2 className="size-3.5" />
              Borrar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Listado de tarjetas */}
      {cards.length === 0 ? (
        <EmptyState
          icon={SquareStack}
          title="Todavía no hay tarjetas"
          description="Crea un mazo y añade tu primera tarjeta para empezar."
          action={
            <Link to="/">
              <Button>
                <Plus className="size-4" />
                Ir a mis mazos
              </Button>
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No encontramos tarjetas con ese filtro"
          description="Prueba con otro texto o quita los filtros aplicados."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              <X className="size-4" />
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((card) => (
            <Card
              key={card.id}
              className="group rounded-2xl border border-border-soft bg-surface shadow-2xs transition-all duration-150 hover:border-secondary-blue/30 hover:shadow-md"
            >
              <CardContent className="grid gap-3.5 p-4 sm:p-5">
                {/* Contenido: Pregunta y Respuesta diferenciadas en paneles */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-3 size-4 shrink-0 cursor-pointer rounded accent-[#3481BC]"
                    checked={selected.has(card.id)}
                    onChange={() => toggleSelect(card.id)}
                    aria-label={`Seleccionar "${card.frontText.slice(0, 40)}"`}
                  />
                  <div className="grid flex-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                    {/* Panel Pregunta */}
                    <div className="rounded-xl border border-border-soft/80 bg-primary-bg/55 px-3.5 py-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-blue">
                        Pregunta
                      </span>
                      <p className="mt-1 text-sm font-bold leading-snug text-ink">{card.frontText}</p>
                    </div>
                    {/* Panel Respuesta */}
                    <div className="rounded-xl border border-border-soft/60 bg-primary-muted/65 px-3.5 py-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                        Respuesta
                      </span>
                      <p className="mt-1 text-sm font-medium leading-snug text-ink/85">{card.backText}</p>
                    </div>
                  </div>
                </div>

                {/* Pie de tarjeta: Metadatos en badges + Acciones agrupadas */}
                <div className="flex flex-wrap items-center justify-between gap-2 pl-7">
                  {/* Badges de metadatos */}
                  <div className="flex flex-wrap items-center gap-2">
                    <CajaBadge caja={card.cajaActual} />

                    {card.deck && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-primary-bg px-2.5 py-0.5 text-xs font-medium text-ink">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: card.deck.color ?? DECK_COLOR_FALLBACK }}
                          aria-hidden
                        />
                        {card.deck.nombre}
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-primary-muted/80 px-2.5 py-0.5 text-xs font-medium text-ink-soft">
                      <Clock className="size-3 shrink-0 text-secondary-blue" />
                      {formatNextReview(card.proximaRevision)}
                    </span>

                    {(card.tags ?? []).map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full bg-azul-100 px-2.5 py-0.5 text-[11px] font-semibold text-secondary-navy dark:bg-secondary-blue/20 dark:text-white"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Grupo de acciones accesible */}
                  <div className="ml-auto inline-flex items-center gap-1 rounded-xl border border-border-soft bg-primary-muted/70 p-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Editar tarjeta"
                      title="Editar tarjeta"
                      className="size-7 rounded-lg text-ink-soft transition-colors hover:bg-editar-soft hover:text-editar focus-visible:bg-editar-soft focus-visible:text-editar"
                      onClick={() => setEditing(card)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Link to={`/study?deckId=${card.deckId}`} aria-label="Estudiar este mazo" title="Estudiar este mazo">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 rounded-lg text-ink-soft transition-colors hover:bg-ok-soft hover:text-ok focus-visible:bg-ok-soft focus-visible:text-ok"
                      >
                        <Play className="size-3.5" />
                      </Button>
                    </Link>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 rounded-lg text-ink-soft transition-colors hover:bg-error-soft hover:text-error focus-visible:bg-error-soft focus-visible:text-error"
                      aria-label="Borrar tarjeta"
                      title="Borrar tarjeta"
                      onClick={() => setConfirmCard(card)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogTitle>Editar tarjeta</DialogTitle>
          {editing && <EditCardForm card={editing} onSubmit={handleUpdate} submitting={busy} />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmCard !== null}
        onOpenChange={(open) => !open && setConfirmCard(null)}
        title="¿Borrar esta tarjeta?"
        description={confirmCard ? `"${confirmCard.frontText.slice(0, 80)}"` : undefined}
        confirmLabel="Borrar tarjeta"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={confirmBulk}
        onOpenChange={setConfirmBulk}
        title={`¿Borrar ${selected.size} tarjeta${selected.size === 1 ? '' : 's'}?`}
        description="Se pueden deshacer unos segundos desde el aviso."
        confirmLabel="Borrar seleccionadas"
        loading={busy}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
