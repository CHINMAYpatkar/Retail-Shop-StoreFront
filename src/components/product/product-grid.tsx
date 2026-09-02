import type { ProductCard as ProductCardType } from '@/types/api';
import { Stagger, StaggerItem } from '@/components/motion';
import { ProductCard } from './product-card';

export function ProductGrid({
  products,
  /** Eagerly load the first row's images; they are usually above the fold. */
  priorityCount = 0,
}: {
  products: ProductCardType[];
  priorityCount?: number;
}) {
  if (products.length === 0) return null;

  return (
    <Stagger className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4" gap={0.05}>
      {products.map((product, index) => (
        <StaggerItem key={product.id}>
          <ProductCard product={product} priority={index < priorityCount} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
