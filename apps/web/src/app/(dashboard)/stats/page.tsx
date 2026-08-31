import { StatsOverview } from '@/widgets/stats-overview';

export default function Page() {
  return (
    <div className="flex-1 space-y-6 pt-2">
      <h1 className="text-3xl font-extrabold text-foreground">Статистика</h1>
      <StatsOverview />
    </div>
  );
}
