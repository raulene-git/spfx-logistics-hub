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
import { anchorField, ensureLength, headerFields, linkField } from '../../common/propertyPane';
import { ICON_OPTIONS } from '../../common/components/Icon';
import QuickLinks, { type IQuickLink } from './components/QuickLinks';

export interface IQuickLinksWebPartProps {
  eyebrow: string;
  title: string;
  accent: string;
  anchor: string;
  count: number;
  newTab: boolean;
  links: IQuickLink[];
}

const MAX_LINKS = 12;

export default class QuickLinksWebPart extends FieldnotesWebPart<IQuickLinksWebPartProps> {
  protected createElement(): React.ReactElement {
    const p = this.properties;
    const count = Math.min(Math.max(p.count || 0, 1), MAX_LINKS);
    return React.createElement(QuickLinks, {
      eyebrow: p.eyebrow,
      title: p.title,
      accent: p.accent,
      anchor: p.anchor,
      links: (p.links || []).slice(0, count),
      newTab: !!p.newTab,
      isEditMode: this.isEditMode
    });
  }

  protected onPropertyPaneFieldChanged(path: string, oldValue: unknown, newValue: unknown): void {
    super.onPropertyPaneFieldChanged(path, oldValue, newValue);
    if (path === 'count') {
      this.context.propertyPane.refresh();
    }
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const count = Math.min(Math.max(this.properties.count || 1, 1), MAX_LINKS);
    this.properties.links = ensureLength(this.properties.links, count, () => ({ text: '', url: '', icon: 'link' }));

    const linkGroups: IPropertyPaneGroup[] = this.properties.links.slice(0, count).map((l, i) => ({
      // Not collapsible: SharePoint drops validated boxes inside collapsed groups.
      groupName: `${i + 1}. ${l.text || 'New link'}`,
      groupFields: [
        PropertyPaneTextField(`links[${i}].text`, { label: 'Label' }),
        linkField(`links[${i}].url`, 'Address'),
        PropertyPaneDropdown(`links[${i}].icon`, { label: 'Icon', options: ICON_OPTIONS })
      ]
    }));

    return {
      pages: [
        {
          header: { description: 'Tiles for the places people go every day.' },
          groups: [
            {
              groupName: 'Layout',
              groupFields: [
                ...headerFields(),
                PropertyPaneSlider('count', { label: 'How many links', min: 1, max: MAX_LINKS, step: 1 }),
                PropertyPaneToggle('newTab', { label: 'Open links in a new tab' }),
                anchorField()
              ]
            }
          ]
        },
        {
          header: { description: 'Each link: its label, address and icon. Use Back to change how many there are.' },
          groups: linkGroups
        }
      ]
    };
  }
}
