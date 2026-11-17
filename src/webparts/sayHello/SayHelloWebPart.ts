import * as React from 'react';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneSlider,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import { FieldnotesWebPart } from '../../common/FieldnotesWebPart';
import SayHello from './components/SayHello';
import { DemoPeopleService, GraphPeopleService, type IPeopleService } from './services/people';

export type PeopleSource = 'demo' | 'entra';

export interface ISayHelloWebPartProps {
  eyebrow: string;
  source: PeopleSource;
  days: number;
  max: number;
  department: string;
  showList: boolean;
}

export default class SayHelloWebPart extends FieldnotesWebPart<ISayHelloWebPartProps> {
  private _services: Partial<Record<PeopleSource, IPeopleService>> = {};

  private _service(source: PeopleSource): IPeopleService {
    if (!this._services[source]) {
      this._services[source] =
        source === 'entra' ? new GraphPeopleService(() => this.context.msGraphClientFactory.getClient('3')) : new DemoPeopleService();
    }
    return this._services[source] as IPeopleService;
  }

  protected createElement(): React.ReactElement {
    const p = this.properties;
    const source: PeopleSource = p.source === 'entra' ? 'entra' : 'demo';
    return React.createElement(SayHello, {
      eyebrow: p.eyebrow,
      service: this._service(source),
      days: Math.min(Math.max(p.days || 30, 1), 90),
      max: Math.min(Math.max(p.max || 5, 1), 12),
      department: p.department,
      showList: p.showList !== false,
      isDemo: source === 'demo',
      isEditMode: this.isEditMode,
      locale: this.locale
    });
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: 'Welcomes new starters. With Entra ID as the source, anyone whose account was created recently appears here by themselves.' },
          groups: [
            {
              groupName: 'Content',
              groupFields: [
                PropertyPaneTextField('eyebrow', { label: 'Label' }),
                PropertyPaneToggle('showList', { label: 'List names, job titles and departments' })
              ]
            },
            {
              groupName: 'Who to show',
              groupFields: [
                PropertyPaneDropdown('source', {
                  label: 'Source',
                  options: [
                    { key: 'demo', text: 'Example people (built in)' },
                    { key: 'entra', text: 'Entra ID: new accounts (Microsoft Graph)' }
                  ]
                }),
                PropertyPaneSlider('days', { label: 'Joined in the last (days)', min: 7, max: 90, step: 1 }),
                PropertyPaneSlider('max', { label: 'Most people to show', min: 1, max: 12, step: 1 }),
                PropertyPaneTextField('department', {
                  label: 'Only this department (optional)',
                  description: 'Matches the Department field in Entra ID, e.g. Warehouse.'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
