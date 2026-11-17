import * as React from 'react';
import {
  type IPropertyPaneConfiguration,
  type IPropertyPaneGroup,
  PropertyPaneDropdown,
  PropertyPaneSlider,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import { FieldnotesWebPart } from '../../common/FieldnotesWebPart';
import { COLOUR_OPTIONS, anchorField, ensureLength, headerFields, linkField } from '../../common/propertyPane';
import Discover, { type IDiscoverCard } from './components/Discover';
import { HubSitesService } from './services/HubSitesService';

export interface IDiscoverWebPartProps {
  eyebrow: string;
  title: string;
  accent: string;
  anchor: string;
  linkText: string;
  linkUrl: string;
  source: 'manual' | 'hub';
  count: number;
  cards: IDiscoverCard[];
}

const MAX_CARDS = 8;
const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

export default class DiscoverWebPart extends FieldnotesWebPart<IDiscoverWebPartProps> {
  private _hubService: HubSitesService | undefined;

  private get _hubSiteId(): string | undefined {
    // legacyPageContext is the documented way to read the hub a site belongs to.
    const id = (this.context.pageContext.legacyPageContext as { hubSiteId?: string }).hubSiteId;
    return id && id !== EMPTY_GUID ? id : undefined;
  }

  protected createElement(): React.ReactElement {
    const p = this.properties;
    const count = Math.min(Math.max(p.count || 4, 1), MAX_CARDS);
    const hubSiteId = this._hubSiteId;
    if (!this._hubService) {
      this._hubService = new HubSitesService(this.context.spHttpClient);
    }

    return React.createElement(Discover, {
      eyebrow: p.eyebrow,
      title: p.title,
      accent: p.accent,
      anchor: p.anchor,
      linkText: p.linkText,
      linkUrl: p.linkUrl,
      source: p.source === 'hub' ? 'hub' : 'manual',
      cards: (p.cards || []).slice(0, count),
      hub: hubSiteId ? { service: this._hubService, webUrl: this.webUrl, hubSiteId } : undefined,
      isEditMode: this.isEditMode
    });
  }

  protected onPropertyPaneFieldChanged(path: string, oldValue: unknown, newValue: unknown): void {
    super.onPropertyPaneFieldChanged(path, oldValue, newValue);
    if (path === 'count' || path === 'source' || /^cards\[\d+\]\.title$/.test(path)) {
      this.context.propertyPane.refresh();
    }
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const manual = this.properties.source !== 'hub';
    const count = Math.min(Math.max(this.properties.count || 4, 1), MAX_CARDS);
    this.properties.cards = ensureLength(this.properties.cards, count, () => ({
      title: '',
      accent: '',
      description: '',
      url: '',
      colour: 'white',
      comingSoon: false
    }));

    const cardGroups: IPropertyPaneGroup[] = manual
      ? this.properties.cards.slice(0, count).map((c, i) => ({
          // Not collapsible: SharePoint drops validated boxes inside collapsed groups.
          groupName: `${i + 1}. ${c.title || 'New card'}`,
          groupFields: [
            PropertyPaneTextField(`cards[${i}].title`, { label: 'Title' }),
            PropertyPaneTextField(`cards[${i}].accent`, { label: 'Italic ending (optional)' }),
            PropertyPaneTextField(`cards[${i}].description`, { label: 'Description', multiline: true, rows: 2 }),
            linkField(`cards[${i}].url`, 'Site address'),
            PropertyPaneDropdown(`cards[${i}].colour`, { label: 'Colour', options: COLOUR_OPTIONS }),
            PropertyPaneToggle(`cards[${i}].comingSoon`, { label: 'Coming soon (not clickable yet)' })
          ]
        }))
      : [];

    return {
      pages: [
        {
          header: { description: 'Colour cards for the sites in your intranet. The hero\'s "Find your way around" link can jump here (#discover).' },
          groups: [
            {
              groupName: 'Layout',
              groupFields: [
                ...headerFields(),
                PropertyPaneTextField('linkText', { label: 'Header link text (optional)' }),
                linkField('linkUrl', 'Header link address'),
                anchorField()
              ]
            },
            {
              groupName: 'Cards',
              groupFields: [
                PropertyPaneDropdown('source', {
                  label: 'Where the cards come from',
                  options: [
                    { key: 'manual', text: 'Pick the cards myself' },
                    { key: 'hub', text: 'Sites in this hub (automatic)' }
                  ]
                }),
                ...(manual ? [PropertyPaneSlider('count', { label: 'How many cards', min: 1, max: MAX_CARDS, step: 1 })] : [])
              ]
            }
          ]
        },
        ...(cardGroups.length
          ? [{ header: { description: 'Each card: title, description, site address and colour. Use Back to change how many there are.' }, groups: cardGroups }]
          : [])
      ]
    };
  }
}
