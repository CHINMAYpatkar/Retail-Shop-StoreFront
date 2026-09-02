import Image from 'next/image';
import Link from 'next/link';
import type { Branding, BusinessInfo } from '@/types/api';
import { isOwnMedia, mediaUrl, text } from '@/lib/utils';

/**
 * The shop's identity in the header and footer.
 *
 * Three levels of graceful degradation, because the logo does not exist yet
 * (`SF-30`) and the site has to be usable before it does:
 *
 *   1. An uploaded logo, if branding.logoUrl is set.
 *   2. A wordmark — the shop name set in display type.
 *   3. Nothing but the home link, if even the name is unset.
 *
 * No placeholder graphic and no "Your Logo Here". A missing logo should look
 * like a deliberately typographic brand, not like a broken page.
 */
export function BrandMark({
  branding,
  business,
  className,
  priority = false,
}: {
  branding?: Branding;
  business?: BusinessInfo;
  className?: string;
  priority?: boolean;
}) {
  const logo = mediaUrl(branding?.logoUrl);
  const name = text(branding?.wordmark) ?? text(business?.name);

  return (
    <Link
      href="/"
      className={className}
      aria-label={name ? `${name} — home` : 'Home'}
    >
      {logo ? (
        isOwnMedia(logo) ? (
          <Image
            src={logo}
            alt={name ?? ''}
            width={160}
            height={44}
            priority={priority}
            className="h-9 w-auto object-contain sm:h-10"
          />
        ) : (
          // An admin-pasted external URL. next/image would need its host in
          // remotePatterns and would render nothing for an unknown one.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={name ?? ''} className="h-9 w-auto object-contain sm:h-10" />
        )
      ) : name ? (
        <span className="font-display text-xl tracking-tight text-ink-900 sm:text-2xl">
          {name}
        </span>
      ) : null}
    </Link>
  );
}
