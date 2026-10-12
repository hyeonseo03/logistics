import Link from "next/link";
import ProductImage from "@/components/product/ProductImage";
import StockBadge from "@/components/product/StockBadge";
import { formatArrival, formatPrice } from "@/lib/format";
import type { ProductWithStock } from "@/types/product";

export default function ProductCard({ product }: { product: ProductWithStock }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="block rounded-lg border bg-white p-4 hover:shadow-md"
    >
      <ProductImage imageUrl={product.imageUrl} name={product.name} textSize="text-sm" />

      <p className="mt-3 text-xs text-gray-500">{product.categoryName}</p>
      <h2 className="font-semibold">{product.name}</h2>
      <p className="mt-1 text-lg font-bold">{formatPrice(product.price)}</p>

      <div className="mt-2 flex flex-wrap gap-1 text-xs">
        <StockBadge status={product.stockStatus} quantity={product.totalStock} />
        {product.sameDayShipping && (
          <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-700">당일 출고</span>
        )}
      </div>

      {/* 예상 도착일 (품절이면 표시하지 않는다) */}
      {product.estimatedArrivalDate && (
        <p className="mt-2 text-xs font-semibold text-blue-700">{formatArrival(product.estimatedArrivalDate)}</p>
      )}
    </Link>
  );
}
