// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BrandMark } from './brand-mark';

// next/image needs a real loader; a plain img keeps the assertion about
// behaviour rather than about Next's internals.
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img src={src} alt={alt} data-testid="next-image" />,
}));

/**
 * Brand identity, which must degrade in three steps because the real logo does
 * not exist yet (`SF-30`) and the site has to be usable before it does.
 *
 * The failure this guards against is a placeholder graphic or the words "Your
 * Logo Here" shipping to customers. A missing logo should look like a
 * deliberately typographic brand, not like a broken page.
 */
describe('BrandMark', () => {
  it('renders the uploaded logo when branding provides one', () => {
    render(
      <BrandMark
        branding={{ logoUrl: '/uploads/public/misc/logo.webp', wordmark: 'Aajicha Masala' }}
        business={{ name: 'Aajicha Masala' }}
      />,
    );

    const img = screen.getByTestId('next-image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Aajicha Masala');
  });

  it('falls back to a typographic wordmark when there is no logo', () => {
    render(<BrandMark branding={{ wordmark: 'Aajicha Masala' }} business={{}} />);

    expect(screen.getByText('Aajicha Masala')).toBeInTheDocument();
    expect(screen.queryByTestId('next-image')).not.toBeInTheDocument();
  });

  it('falls back to the business name when no wordmark is set', () => {
    render(<BrandMark branding={{}} business={{ name: 'Aajicha Masala' }} />);
    expect(screen.getByText('Aajicha Masala')).toBeInTheDocument();
  });

  it('renders a bare home link when nothing is configured at all', () => {
    // A brand-new install. It must not render a placeholder graphic or invented
    // copy - just a working link home.
    const { container } = render(<BrandMark branding={{}} business={{}} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/');
    expect(link).toHaveAccessibleName('Home');
    expect(container.textContent).toBe('');
  });

  it('uses a plain img for an admin-pasted external logo', () => {
    // next/image renders nothing for a host absent from remotePatterns, so an
    // external URL must not go through it.
    const { container } = render(
      <BrandMark branding={{ logoUrl: 'https://cdn.example.test/logo.png' }} business={{}} />,
    );

    expect(screen.queryByTestId('next-image')).not.toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://cdn.example.test/logo.png',
    );
  });

  it('names the link for screen readers using the shop name', () => {
    render(<BrandMark branding={{}} business={{ name: 'Aajicha Masala' }} />);
    expect(screen.getByRole('link')).toHaveAccessibleName('Aajicha Masala — home');
  });
});
