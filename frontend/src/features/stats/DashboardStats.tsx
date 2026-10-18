import type { ReactNode } from 'react';
import { CalendarDays, CheckCircle2, Clock, Layers, Lightbulb, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { StatsSummary } from '@/lib/api';

function StatTile({
  icon: Icon,
  label,
  value,
  tint,
  iconClass,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  tint: string;
  iconClass: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn('rounded-xl p-3', tint)}>
      <Icon className={cn('size-4', iconClass)} aria-hidden />
      <p className="mt-2 text-xs text-ink-soft">{label}</p>
      <p className="text-xl font-bold text-secondary-navy dark:text-white">{value}</p>
      {children}
    </div>
  );
}

function PotIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden focusable="false">
      <path d="M40 44c-3-11 2-22 13-27 1 12-4 23-13 27Z" fill="#3FBF7F" />
      <path d="M40 44c3-10-2-20-12-25-1 11 4 21 12 25Z" fill="#5BD08F" />
      <path d="M40 47V26" stroke="#2E8B57" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="18" y="42" width="44" height="9" rx="4" fill="#14B8A6" />
      <path d="M23 51h34l-4 20a5 5 0 0 1-5 4H32a5 5 0 0 1-5-4l-4-20Z" fill="#0D9488" />
    </svg>
  );
}

export function DashboardStats({ stats }: { stats: StatsSummary }) {
  const { totalTarjetas, dominadas, pendientes, progresoGeneral, rachaDias } = stats;

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-azul-100 text-azul-700"
              aria-hidden
            >
              <Lightbulb className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-secondary-navy dark:text-white">Sigue así</h2>
              <p className="text-sm text-ink-soft">La constancia es la clave del progreso.</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile
              icon={Layers}
              label="Total de tarjetas"
              value={totalTarjetas}
              tint="bg-azul-100/50"
              iconClass="text-azul-700"
            />
            <StatTile
              icon={CheckCircle2}
              label="Dominadas"
              value={dominadas}
              tint="bg-ok-soft"
              iconClass="text-ok"
            />
            <StatTile
              icon={Clock}
              label="Pendientes"
              value={pendientes}
              tint="bg-primary-muted"
              iconClass="text-ink-soft"
            />
            <StatTile
              icon={CalendarDays}
              label="Progreso general"
              value={`${progresoGeneral}%`}
              tint="bg-azul-100/50"
              iconClass="text-azul-700"
            >
              <Progress
                value={progresoGeneral}
                className="mt-2 h-1.5"
                barClassName="bg-azul-500"
                label="Progreso general"
              />
            </StatTile>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex h-full flex-col p-6">
          <div className="flex items-center gap-3">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-azul-100 text-azul-700"
              aria-hidden
            >
              <CalendarDays className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-secondary-navy dark:text-white">
                Tu racha de estudio
              </h2>
              <p className="text-sm text-ink-soft">¡Vas muy bien!</p>
            </div>
          </div>

          <div className="mt-5 flex flex-1 items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-extrabold leading-none text-secondary-navy dark:text-white">
                {rachaDias} {rachaDias === 1 ? 'día' : 'días'}
              </p>
              <p className="mt-1 text-sm text-ink-soft">de estudio consecutivo</p>
            </div>
            <PotIllustration className="h-20 w-auto shrink-0" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
