import { formatMoney } from '../lib/format-money';

export interface CategoryDonutSlice {
  categoryId: string | null;
  label: string;
  value: number;
  color: string;
}

interface CategoryDonutChartProps {
  data: CategoryDonutSlice[];
  size?: number;
}

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const STROKE_WIDTH = 14;

export function CategoryDonutChart({ data, size = 220 }: CategoryDonutChartProps) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  if (total <= 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-full border border-dashed border-border text-center text-sm text-muted-foreground"
      >
        Нет расходов
        <br />
        за период
      </div>
    );
  }

  const arcs = data.reduce<{ slice: CategoryDonutSlice; dashArray: string; dashOffset: number; cumulative: number }[]>(
    (acc, slice) => {
      const previous = acc.at(-1);
      const previousCumulative = previous ? previous.cumulative : 0;
      const fraction = slice.value / total;

      return [
        ...acc,
        {
          slice,
          dashArray: `${fraction * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
          dashOffset: -previousCumulative * CIRCUMFERENCE,
          cumulative: previousCumulative + fraction,
        },
      ];
    },
    [],
  );

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="-rotate-90" width={size} height={size}>
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--color-secondary)" strokeWidth={STROKE_WIDTH} />
        {arcs.map(({ slice, dashArray, dashOffset }) => (
          <circle
            key={slice.categoryId ?? 'none'}
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke={slice.color}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-muted-foreground">Всего</span>
        <span className="font-mono text-lg font-bold text-foreground">{formatMoney(String(total))}</span>
      </div>
    </div>
  );
}
