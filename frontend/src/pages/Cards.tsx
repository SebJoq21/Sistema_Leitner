import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, redirect, useLoaderData, useRevalidator, type LoaderFunctionArgs } from 'react-router-dom';
import {
  ArrowUpDown,
  Clock,
  Download,
  Filter,
  FolderInput,
  ListChecks,
  Pencil,
  Play,
  Plus,
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
import { Input, TextArea } from '@/components/ui/input';
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

const selectClass =
  'h-10 w-full rounded-xl border border-border-soft bg-primary-bg px-3 text-sm text-ink outline-none focus:border-secondary-blue focus:ring-2 focus:ring-secondary-blue/15';

function filterLabel(icon: ReactNode, text: string) {
  return (
    <label className="flex items-center gap-1.5 text-sm font-medium text-ink">
      {icon}
      {text}
    </label>
  );
}

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
        return new Date(a.proximaRevision).getTime() - new Date(b.proximaRevision).getTime();
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
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-4">
        <div className="mr-auto">
          <h1 className="text-2xl font-extrabold tracking-tight text-secondary-navy dark:text-white">Tarjetas</h1>
          <p className="text-sm text-ink-soft">
            {filtered.length} de {cards.length} tarjeta{cards.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="w-52 min-w-0">
          <Input
            label="Buscar"
            placeholder="Pregunta o respuesta…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid w-40 min-w-0 gap-1.5">
          {filterLabel(<FolderInput className="size-4 text-ink-soft" />, 'Mazo')}
          <select className={selectClass} value={deckId} onChange={(e) => setDeckId(e.target.value)}>
            <option value="">Todos</option>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="grid w-32 min-w-0 gap-1.5">
          {filterLabel(<SquareStack className="size-4 text-ink-soft" />, 'Caja')}
          <select className={selectClass} value={caja} onChange={(e) => setCaja(e.target.value)}>
            <option value="">Todas</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                Caja {n}
              </option>
            ))}
          </select>
        </div>
        <div className="grid w-44 min-w-0 gap-1.5">
          {filterLabel(<ArrowUpDown className="size-4 text-ink-soft" />, 'Ordenar por')}
          <select
            className={selectClass}
            value={order}
            onChange={(e) => setOrder(e.target.value as CardOrder)}
          >
            <option value="recientes">Creación (recientes)</option>
            <option value="proxima">Próxima revisión</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="size-4" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="size-4" />
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

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={clearFilters} disabled={!hasFilters}>
          <X className="size-4" />
          Limpiar filtros
        </Button>
        {filtered.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              className="size-4 accent-[#3481BC]"
              checked={allSelected}
              onChange={toggleAll}
            />
            Seleccionar todo
          </label>
        )}
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border-soft bg-azul-100 px-3 py-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-secondary-navy">
            <ListChecks className="size-4" />
            {selected.size} seleccionada{selected.size === 1 ? '' : 's'}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              className={selectClass}
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
              <FolderInput className="size-4" />
              Mover
            </Button>
            <Button size="sm" variant="danger" disabled={busy} onClick={() => setConfirmBulk(true)}>
              <Trash2 className="size-4" />
              Borrar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

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
            <Card key={card.id} className="transition-shadow hover:shadow-md">
              <CardContent className="grid gap-3 pt-6">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 accent-[#3481BC]"
                    checked={selected.has(card.id)}
                    onChange={() => toggleSelect(card.id)}
                    aria-label={`Seleccionar "${card.frontText.slice(0, 40)}"`}
                  />
                  <div className="grid flex-1 gap-3 sm:grid-cols-2 sm:gap-6">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Pregunta</p>
                      <p className="text-sm font-semibold text-ink">{card.frontText}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Respuesta</p>
                      <p className="text-sm text-ink-soft">{card.backText}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <CajaBadge caja={card.cajaActual} />
                  {card.deck && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: card.deck.color ?? DECK_COLOR_FALLBACK }}
                        aria-hidden
                      />
                      {card.deck.nombre}
                    </span>
                  )}
                  {(card.tags ?? []).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-azul-100 px-2 py-0.5 text-[11px] font-medium text-secondary-navy"
                    >
                      {t}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
                    <Clock className="size-3.5" />
                    {formatNextReview(card.proximaRevision)}
                  </span>
                  <span className="ml-auto flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Editar tarjeta"
                      title="Editar"
                      className="transition-transform hover:-translate-y-px hover:bg-editar-soft hover:text-editar focus-visible:bg-editar-soft focus-visible:text-editar"
                      onClick={() => setEditing(card)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Link to={`/study?deckId=${card.deckId}`} aria-label="Estudiar este mazo" title="Estudiar">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="transition-transform hover:-translate-y-px hover:bg-ok-soft hover:text-ok focus-visible:bg-ok-soft focus-visible:text-ok"
                      >
                        <Play className="size-4" />
                      </Button>
                    </Link>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="transition-transform hover:-translate-y-px hover:bg-error-soft hover:text-error focus-visible:bg-error-soft focus-visible:text-error"
                      aria-label="Borrar tarjeta"
                      title="Borrar"
                      onClick={() => setConfirmCard(card)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </span>
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
