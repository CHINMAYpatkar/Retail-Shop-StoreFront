import { Leaf, PackageCheck, Sparkles, Truck, type LucideIcon } from 'lucide-react';
import type { UspStrip as UspStripType } from '@/types/api';
import { Stagger, StaggerItem } from '@/components/motion';
import { text } from '@/lib/utils';

/**
 * The "why buy from us" strip (`SF-31`).
 *
 * The admin picks an icon by name from this map rather than uploading one.
 * A free-text icon field would mean either shipping the entire Lucide set to
 * every visitor, or rendering nothing when someone types a name that does not
 * exist. A small named set keeps the bundle honest and the failure mode quiet:
 * an unknown name simply gets the default.
 */
const ICONS: Record<string, LucideIcon> = {
  leaf: Leaf,
  fresh: Leaf,
  truck: Truck,
  delivery: Truck,
  package: PackageCheck,
  quality: PackageCheck,
  sparkles: Sparkles,
  handmade: Sparkles,
};

export function UspStrip({ strip }: { strip?: UspStripType }) {
  if (strip?.enabled === false) return null;

  const items = (strip?.items ?? []).filter((item) => text(item.title));
  if (items.length === 0) return null;

  return (
    <section className="border-y border-paper-300 bg-paper-50">
      <div className="shell py-10">
        <Stagger
          as="ul"
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
          gap={0.08}
        >
          {items.map((item, index) => {
            const Icon = ICONS[(item.icon ?? '').toLowerCase()] ?? Sparkles;
            const description = text(item.description);

            return (
              <StaggerItem
                as="li"
                key={`${item.title}-${index}`}
                className="flex items-start gap-3.5"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink-900">{item.title}</h3>
                  {description ? (
                    <p className="mt-1 text-sm leading-relaxed text-ink-500">{description}</p>
                  ) : null}
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
