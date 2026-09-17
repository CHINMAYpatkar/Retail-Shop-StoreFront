/**
 * Response types for the public and customer-authenticated API.
 *
 * Money and quantities arrive as **strings**, not numbers. The backend stores
 * them as Postgres `Decimal` and Prisma serialises them as strings precisely so
 * they never round-trip through an IEEE754 double. Parsing them to `number`
 * here would reintroduce exactly the error the schema went out of its way to
 * avoid, so they stay strings all the way to the formatter.
 */

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface Category extends CategorySummary {
  description: string | null;
  imageUrl: string | null;
  children: CategorySummary[];
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isVideo: boolean;
}

/** What the catalogue listing returns. Deliberately narrower than the detail. */
export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  price: string;
  compareAtPrice: string | null;
  isFeatured: boolean;
  stockQuantity: number;
  category: CategorySummary | null;
  images: ProductImage[];
}

export interface ProductVariant {
  id: string;
  name: string;
  price: string;
  stockQuantity: number;
  isActive: boolean;
}

export interface IngredientSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  /** The educational angle: what this spice actually does. */
  benefits: string | null;
  imageUrl: string | null;
}

/** Note `name`, not `title` - matching the Prisma model. */
export interface RecipeSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cookingTimeMins: number | null;
  difficulty: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
}

export interface ReviewImage {
  id: string;
  url: string;
}

export interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerifiedPurchase: boolean;
  adminReply: string | null;
  createdAt: string;
  images: ReviewImage[];
  customer: { name: string | null } | null;
}

export interface ProductDetail extends Omit<ProductCard, 'images'> {
  description: string | null;
  weightGrams: number | null;
  shelfLifeDays: number | null;
  storageInstructions: string | null;
  preparationProcess: string | null;
  sku: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  ingredients: { ingredient: IngredientSummary }[];
  recipes: { recipe: RecipeSummary }[];
  reviews: Review[];
  ratingAverage: number;
  ratingCount: number;
}

export type BannerPlacement = 'HOME_HERO' | 'HOME_OFFER' | 'CATEGORY' | 'SLIDER';

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  /** Always present. Doubles as the poster frame when `videoUrl` is set. */
  imageUrl: string;
  videoUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  placement: BannerPlacement;
  sortOrder: number;
}

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
}

// ---------------------------------------------------------------------------
// Settings — the storefront's entire chrome and copy
// ---------------------------------------------------------------------------

/**
 * `GET /settings/public` returns a key/value map, and the backend allow-lists
 * which keys are exposed. Every value is `Json`, so nothing here is guaranteed
 * to exist or to have the expected shape: an admin can leave a key unset, and
 * an older deployment may not have it at all.
 *
 * Everything is therefore optional, and every consumer must have a sensible
 * answer for "not set yet". That is not defensive habit - it is the direct
 * consequence of the no-static-content rule. A storefront that throws when a
 * settings key is missing is a storefront that cannot be launched incrementally.
 */
export interface BusinessInfo {
  name?: string;
  tagline?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  addressLines?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  hours?: string;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  x?: string;
  pinterest?: string;
}

export interface SeoDefaults {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImageUrl?: string;
}

/** `SF-30`. Logo and favicon are uploaded through the admin media library. */
export interface Branding {
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  wordmark?: string;
}

/** `SF-31`. The dismissible bar above the header. */
export interface Announcement {
  enabled?: boolean;
  message?: string;
  linkLabel?: string;
  linkUrl?: string;
}

export interface UspItem {
  icon?: string;
  title?: string;
  description?: string;
}

export interface UspStrip {
  enabled?: boolean;
  items?: UspItem[];
}

export interface HomeSection {
  key?: string;
  heading?: string;
  subheading?: string;
  enabled?: boolean;
}

export interface HomeSections {
  sections?: HomeSection[];
}

export interface FooterLink {
  label?: string;
  href?: string;
}

export interface FooterColumn {
  heading?: string;
  links?: FooterLink[];
}

export interface FooterSettings {
  columns?: FooterColumn[];
  note?: string;
}

export interface PublicSettings {
  business_info?: BusinessInfo;
  social_links?: SocialLinks;
  seo_defaults?: SeoDefaults;
  branding?: Branding;
  announcement?: Announcement;
  usp_strip?: UspStrip;
  home_sections?: HomeSections;
  footer?: FooterSettings;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Customer account
// ---------------------------------------------------------------------------

export interface CustomerProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  isVerified: boolean;
  /** Derived server-side. False until both name and phone are set. */
  profileComplete: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

/** What `otp/verify` returns. The refresh token is a cookie, not a field. */
export interface VerifyOtpResult {
  accessToken: string;
  isNewCustomer: boolean;
  profileComplete: boolean;
}

export interface Address {
  id: string;
  /** The "type" - Home, Work, and so on. Free text with presets in the UI. */
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface ServerCartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    stockQuantity: number;
    images: ProductImage[];
  };
}

export interface ServerCart {
  items: ServerCartItem[];
  subtotal: number;
  itemCount: number;
}

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: string;
  quantity: number;
  totalPrice: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  subtotal: string;
  shippingAmount: string;
  discountAmount: string;
  totalAmount: string;
  createdAt: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  items: OrderItem[];
  address?: Address;
}

export interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: ProductCard;
}
