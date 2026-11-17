export interface IFieldnotesHeroProps {
  /** e.g. "Tuesday 17 November". */
  dateText: string;
  location: string;
  siteTitle: string;
  /** "Good morning." etc., or empty when the greeting is turned off. */
  greeting: string;
  headline: string;
  accentWord: string;
  description: string;
  primaryText: string;
  /** Already checked with isSafeLink; undefined when not set or not allowed. */
  primaryUrl?: string;
  primaryNewTab: boolean;
  secondaryText: string;
  /** Already resolved and checked; undefined hides the link. */
  secondaryHref?: string;
  showIllustration: boolean;
  isEditMode: boolean;
  missingLinkHint: string;
}
