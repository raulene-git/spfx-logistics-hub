import * as React from 'react';
import {
  type IPropertyPaneConfiguration,
  type IPropertyPaneGroup,
  PropertyPaneSlider,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import { FieldnotesWebPart } from '../../common/FieldnotesWebPart';
import { anchorField, ensureLength, headerFields, linkField } from '../../common/propertyPane';
import ComingUp from './components/ComingUp';
import { validateEventDate, type IEventEntry } from './utils/events';

export interface IComingUpWebPartProps {
  eyebrow: string;
  title: string;
  accent: string;
  anchor: string;
  /** How many events to show at once. */
  max: number;
  /** How many event slots to edit. */
  slots: number;
  hidePast: boolean;
  events: IEventEntry[];
}

const MAX_SLOTS = 12;

export default class ComingUpWebPart extends FieldnotesWebPart<IComingUpWebPartProps> {
  protected createElement(): React.ReactElement {
    const p = this.properties;
    return React.createElement(ComingUp, {
      eyebrow: p.eyebrow,
      title: p.title,
      accent: p.accent,
      anchor: p.anchor,
      events: p.events || [],
      max: Math.min(Math.max(p.max || 3, 1), MAX_SLOTS),
      hidePast: p.hidePast !== false,
      locale: this.locale
    });
  }

  protected onPropertyPaneFieldChanged(path: string, oldValue: unknown, newValue: unknown): void {
    super.onPropertyPaneFieldChanged(path, oldValue, newValue);
    if (path === 'slots' || /^events\[\d+\]\.title$/.test(path)) {
      this.context.propertyPane.refresh();
    }
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const slots = Math.min(Math.max(this.properties.slots || 3, 1), MAX_SLOTS);
    this.properties.events = ensureLength(this.properties.events, slots, () => ({ title: '', date: '', detail: '', url: '' }));

    const eventGroups: IPropertyPaneGroup[] = this.properties.events.slice(0, slots).map((e, i) => ({
      // Not collapsible: SharePoint drops validated boxes inside collapsed groups.
      groupName: `${i + 1}. ${e.title || 'New event'}${e.date ? ` (${e.date})` : ''}`,
      groupFields: [
        PropertyPaneTextField(`events[${i}].title`, { label: 'Title' }),
        PropertyPaneTextField(`events[${i}].date`, {
          label: 'Date',
          placeholder: 'YYYY-MM-DD',
          onGetErrorMessage: validateEventDate,
          deferredValidationTime: 400
        }),
        PropertyPaneTextField(`events[${i}].detail`, { label: 'Time and place', placeholder: '09:00 · Main office and Teams' }),
        linkField(`events[${i}].url`, 'Link (optional)')
      ]
    }));

    return {
      pages: [
        {
          header: { description: 'Upcoming dates, soonest first. Past events drop off by themselves.' },
          groups: [
            {
              groupName: 'Layout',
              groupFields: [
                ...headerFields(),
                PropertyPaneSlider('max', { label: 'How many to show', min: 1, max: MAX_SLOTS, step: 1 }),
                PropertyPaneSlider('slots', { label: 'How many events to edit', min: 1, max: MAX_SLOTS, step: 1 }),
                PropertyPaneToggle('hidePast', { label: 'Hide events that have passed' }),
                anchorField()
              ]
            }
          ]
        },
        {
          header: { description: 'Each event: title, date, time and place, and an optional link. Use Back to change how many there are.' },
          groups: eventGroups
        }
      ]
    };
  }
}
