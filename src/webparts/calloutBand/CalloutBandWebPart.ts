import * as React from 'react';
import {
  type IPropertyPaneConfiguration,
  type IPropertyPaneGroup,
  PropertyPaneDropdown,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { FieldnotesWebPart } from '../../common/FieldnotesWebPart';
import { COLOUR_OPTIONS, ensureLength, headerFields, linkField, type BrandColour } from '../../common/propertyPane';
import CalloutBand, { type ICalloutLink } from './components/CalloutBand';

export interface ICalloutBandWebPartProps {
  colour: BrandColour;
  eyebrow: string;
  title: string;
  accent: string;
  body: string;
  links: ICalloutLink[];
}

const LINK_SLOTS = 3;

export default class CalloutBandWebPart extends FieldnotesWebPart<ICalloutBandWebPartProps> {
  protected createElement(): React.ReactElement {
    const p = this.properties;
    return React.createElement(CalloutBand, {
      colour: p.colour || 'yellow',
      eyebrow: p.eyebrow,
      title: p.title,
      accent: p.accent,
      body: p.body,
      links: p.links || [],
      isEditMode: this.isEditMode
    });
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    this.properties.links = ensureLength(this.properties.links, LINK_SLOTS, () => ({ text: '', url: '' }));

    const linkGroups: IPropertyPaneGroup[] = this.properties.links.map((_, i) => ({
      // Not collapsible: SharePoint drops the validated address box inside collapsed groups.
      groupName: `Link ${i + 1}`,
      groupFields: [
        PropertyPaneTextField(`links[${i}].text`, { label: 'Text', description: 'Leave empty to hide this link.' }),
        linkField(`links[${i}].url`, 'Address')
      ]
    }));

    return {
      pages: [
        {
          header: { description: 'A full-width coloured band. Put it in a full-width section, for example as the page footer.' },
          groups: [
            {
              groupName: 'Content',
              groupFields: [
                PropertyPaneDropdown('colour', { label: 'Colour', options: COLOUR_OPTIONS.filter((c) => c.key !== 'white' && c.key !== 'sage') }),
                ...headerFields(),
                PropertyPaneTextField('body', { label: 'Text under the title', multiline: true, rows: 3 })
              ]
            },
            ...linkGroups
          ]
        }
      ]
    };
  }
}
