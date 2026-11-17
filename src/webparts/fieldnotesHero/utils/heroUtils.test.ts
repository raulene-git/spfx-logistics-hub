import { getDayPart, isSafeLink, resolveSectionLink, CUSTOM_TARGET } from './heroUtils';

describe('getDayPart', () => {
  it('splits the day at 12:00 and 18:00', () => {
    expect(getDayPart(new Date(2026, 10, 17, 8, 0))).toBe('morning');
    expect(getDayPart(new Date(2026, 10, 17, 12, 0))).toBe('afternoon');
    expect(getDayPart(new Date(2026, 10, 17, 18, 0))).toBe('evening');
  });
});

describe('isSafeLink', () => {
  it('allows https, site-relative and in-page links', () => {
    expect(isSafeLink('https://contoso.sharepoint.com/sites/ops')).toBe(true);
    expect(isSafeLink('/sites/ops/SitePages/Dispatch.aspx')).toBe(true);
    expect(isSafeLink('#discover')).toBe(true);
  });

  it('blocks script links, protocol-relative links and empty values', () => {
    // eslint-disable-next-line no-script-url -- checking that script links are blocked
    expect(isSafeLink('javascript:alert(1)')).toBe(false);
    expect(isSafeLink('//evil.example')).toBe(false);
    expect(isSafeLink('#')).toBe(false);
    expect(isSafeLink('')).toBe(false);
  });
});

describe('resolveSectionLink', () => {
  it('uses the chosen section', () => {
    expect(resolveSectionLink('#discover', '')).toBe('#discover');
  });

  it('uses the custom address when "another page" is chosen', () => {
    expect(resolveSectionLink(CUSTOM_TARGET, ' /sites/ops ')).toBe('/sites/ops');
    // eslint-disable-next-line no-script-url -- checking that script links are blocked
    expect(resolveSectionLink(CUSTOM_TARGET, 'javascript:void(0)')).toBeUndefined();
  });

  it('hides the link when nothing is chosen', () => {
    expect(resolveSectionLink('', '/sites/ops')).toBeUndefined();
  });
});
