import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import type { Faq } from '@/types/api';

/**
 * FAQ list as an accordion.
 *
 * Radix rather than `<details>`: it gives the correct `aria-expanded` and
 * `aria-controls` wiring, arrow-key navigation between items, and a height
 * transition that `<details>` cannot animate.
 *
 * `type="multiple"` so answers can be open at once. Forcing one open at a time
 * is actively annoying when someone is comparing two answers, and there is no
 * reason to prevent it here.
 *
 * Rendered on the server - Radix Accordion works without client state for the
 * uncontrolled case, so the questions are in the HTML for crawlers even before
 * hydration.
 */
export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  return (
    <Accordion.Root type="multiple" className="divide-y divide-paper-300 border-y border-paper-300">
      {faqs.map((faq) => (
        <Accordion.Item key={faq.id} value={faq.id}>
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-start justify-between gap-4 py-5 text-left">
              <span className="font-display text-lg leading-snug text-ink-900 transition-colors group-hover:text-gold-700">
                {faq.question}
              </span>
              <ChevronDown
                aria-hidden
                className="mt-1 h-4 w-4 shrink-0 text-ink-400 transition-transform duration-300 ease-spice group-data-[state=open]:rotate-180"
              />
            </Accordion.Trigger>
          </Accordion.Header>

          <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <p className="pb-5 pr-8 text-[15px] leading-relaxed text-ink-600">{faq.answer}</p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
