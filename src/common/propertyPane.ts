import { type IPropertyPaneField, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { validateLink } from './links';

/** The colours an author can pick for blocks and bands. */
export type BrandColour = 'green' | 'yellow' | 'pink' | 'sage' | 'navy' | 'white';

export const COLOUR_OPTIONS: { key: BrandColour; text: string }[] = [
  { key: 'green', text: 'Fieldnotes green' },
  { key: 'yellow', text: 'Yellow' },
  { key: 'pink', text: 'Pink' },
  { key: 'sage', text: 'Sage' },
  { key: 'navy', text: 'Navy' },
  { key: 'white', text: 'White' }
];

/** The fields every section shares: label, title, italic ending. */
export function headerFields(prefix: string = ''): IPropertyPaneField<unknown>[] {
  return [
    PropertyPaneTextField(`${prefix}eyebrow`, { label: 'Label above the title', description: 'e.g. 03 / News' }),
    PropertyPaneTextField(`${prefix}title`, { label: 'Title' }),
    PropertyPaneTextField(`${prefix}accent`, { label: 'Italic ending (optional)' })
  ];
}

export function linkField(property: string, label: string): IPropertyPaneField<unknown> {
  return PropertyPaneTextField(property, {
    label,
    placeholder: 'https:// or /sites/…',
    onGetErrorMessage: validateLink,
    deferredValidationTime: 400
  });
}

export function anchorField(): IPropertyPaneField<unknown> {
  return PropertyPaneTextField('anchor', {
    label: 'Section name for links',
    description: 'Other web parts (like the hero) can jump here with #name. Leave empty to use the title.'
  });
}

/** Keeps an array property at exactly `count` items, so the pane always has a slot to edit. */
export function ensureLength<T>(items: T[] | undefined, count: number, make: (index: number) => T): T[] {
  const list = (items || []).slice(0, count);
  for (let i = list.length; i < count; i++) {
    list.push(make(i));
  }
  return list;
}
