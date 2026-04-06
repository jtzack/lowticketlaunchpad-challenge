import { getTier, type Tier } from '@/lib/points'

export function TierBadge({ points }: { points: number }) {
  const tier: Tier = getTier(points)
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-sans text-[11px] font-bold uppercase tracking-wider"
      style={{
        background: `${tier.color}20`,
        border: `1px solid ${tier.color}60`,
        color: tier.color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: tier.color }}
      />
      {tier.name}
    </span>
  )
}
