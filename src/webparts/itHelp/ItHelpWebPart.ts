import * as React from 'react';
import { type IPropertyPaneConfiguration, PropertyPaneDropdown, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { FieldnotesWebPart } from '../../common/FieldnotesWebPart';
import { formatLongDate } from '../../common/loadBrandFonts';
import ItHelp, { type ItHelpView } from './components/ItHelp';
import type { ITicketService } from './services/ITicketService';
import { DemoTicketService } from './services/DemoTicketService';
import { SharePointTicketService } from './services/SharePointTicketService';

export interface IItHelpWebPartProps {
  title: string;
  accent: string;
  lede: string;
  promise: string;
  dataSource: 'demo' | 'list';
  ticketList: string;
  worklogList: string;
}

export default class ItHelpWebPart extends FieldnotesWebPart<IItHelpWebPartProps> {
  private _service: ITicketService | undefined;
  private _serviceKey: string = '';

  private _usesDemo(): boolean {
    const p = this.properties;
    return p.dataSource !== 'list' || !p.ticketList || !p.worklogList;
  }

  /** Reuses the service until the data settings change, so the queue isn't re-fetched on every render. */
  private _getService(): ITicketService {
    const p = this.properties;
    const key = this._usesDemo() ? 'demo' : `list:${p.ticketList}:${p.worklogList}`;
    if (!this._service || key !== this._serviceKey) {
      const user = this.context.pageContext.user.displayName;
      this._serviceKey = key;
      this._service = this._usesDemo()
        ? new DemoTicketService(user)
        : new SharePointTicketService(
            this.context.spHttpClient,
            this.webUrl,
            p.ticketList,
            p.worklogList,
            Number(this.context.pageContext.legacyPageContext?.userId) || 0,
            user
          );
    }
    return this._service;
  }

  protected createElement(): React.ReactElement {
    const p = this.properties;
    const params = new URLSearchParams(window.location.search);
    return React.createElement(ItHelp, {
      service: this._getService(),
      siteTitle: this.context.pageContext.web.title,
      dateText: formatLongDate(new Date(), this.locale),
      title: p.title || 'How can we',
      accent: p.accent || '',
      lede: p.lede || '',
      promise: p.promise || 'Someone will pick it up within one working day.',
      initialTemplate: params.get('ticket') || undefined,
      initialView: (params.get('view') === 'queue' ? 'queue' : 'raise') as ItHelpView
    });
  }

  protected onPropertyPaneFieldChanged(path: string, oldValue: unknown, newValue: unknown): void {
    super.onPropertyPaneFieldChanged(path, oldValue, newValue);
    if (path === 'dataSource') {
      this.context.propertyPane.refresh();
    }
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const live = this.properties.dataSource === 'list';
    return {
      pages: [
        {
          header: {
            description:
              'Raise a ticket from a template. People in IT (anyone with Edit on the tickets list) also get the full queue. ' +
              'Link straight to a template with ?ticket=incident, service, access or starter.'
          },
          groups: [
            {
              groupName: 'Text',
              groupFields: [
                PropertyPaneTextField('title', { label: 'Title' }),
                PropertyPaneTextField('accent', { label: 'Italic ending' }),
                PropertyPaneTextField('lede', { label: 'Text under the title', multiline: true, rows: 3 }),
                PropertyPaneTextField('promise', { label: 'How quickly IT responds', description: 'Shown after someone raises a ticket.' })
              ]
            },
            {
              groupName: 'Tickets',
              groupFields: [
                PropertyPaneDropdown('dataSource', {
                  label: 'Where tickets are kept',
                  options: [
                    { key: 'demo', text: 'Demo data (nothing is saved)' },
                    { key: 'list', text: 'SharePoint lists' }
                  ]
                }),
                PropertyPaneTextField('ticketList', {
                  label: 'Tickets list',
                  description: 'Created by scripts/provision-it-helpdesk.ps1',
                  disabled: !live
                }),
                PropertyPaneTextField('worklogList', { label: 'Worklog list', disabled: !live })
              ]
            }
          ]
        }
      ]
    };
  }
}
