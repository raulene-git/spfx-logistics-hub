import * as React from 'react';
import {
  type IPropertyPaneConfiguration,
  type IPropertyPaneField,
  PropertyPaneDropdown,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';

import * as strings from 'ShipmentTrackerWebPartStrings';
import { FieldnotesWebPart } from '../../common/FieldnotesWebPart';
import { formatLongDate } from '../../common/loadBrandFonts';
import { linkField } from '../../common/propertyPane';
import { safeLink } from '../../common/links';
import ShipmentTracker from './components/ShipmentTracker';
import BoardSnapshot from './components/BoardSnapshot';
import type { IShipmentService } from './services/IShipmentService';
import { MockShipmentService } from './services/MockShipmentService';
import { SharePointShipmentService } from './services/SharePointShipmentService';

export type DataSource = 'demo' | 'list';
/** "board" is the full Dispatch Board; "snapshot" is the small "Today at a glance" version. */
export type BoardLayout = 'board' | 'snapshot';

export interface IShipmentTrackerWebPartProps {
  layout: BoardLayout;
  eyebrow: string;
  title: string;
  accentWord: string;
  boardUrl: string;
  dataSource: DataSource;
  listTitle: string;
}

export default class ShipmentTrackerWebPart extends FieldnotesWebPart<IShipmentTrackerWebPartProps> {
  private _service: IShipmentService | undefined;
  private _serviceKey: string = '';

  protected createElement(): React.ReactElement {
    const p = this.properties;
    if (p.layout === 'snapshot') {
      return React.createElement(BoardSnapshot, {
        eyebrow: p.eyebrow,
        title: p.title || 'The day so far.',
        accent: p.accentWord || '',
        boardUrl: safeLink(p.boardUrl),
        service: this._getService(),
        isDemo: this._usesDemoData()
      });
    }
    return React.createElement(ShipmentTracker, {
      title: p.title || strings.DefaultTitle,
      accentWord: p.accentWord || '',
      siteTitle: this.context.pageContext.web.title,
      dateText: formatLongDate(new Date(), this.locale),
      service: this._getService(),
      isDemo: this._usesDemoData()
    });
  }

  private _usesDemoData(): boolean {
    return this.properties.dataSource !== 'list' || !this.properties.listTitle;
  }

  /** Reuses the service until the data source settings change, so the list isn't re-fetched on every render. */
  private _getService(): IShipmentService {
    const key = this._usesDemoData() ? 'demo' : `list:${this.properties.listTitle}`;
    if (!this._service || key !== this._serviceKey) {
      this._serviceKey = key;
      this._service = this._usesDemoData()
        ? new MockShipmentService()
        : new SharePointShipmentService(this.context.spHttpClient, this.webUrl, this.properties.listTitle);
    }
    return this._service;
  }

  protected onPropertyPaneFieldChanged(path: string, oldValue: unknown, newValue: unknown): void {
    super.onPropertyPaneFieldChanged(path, oldValue, newValue);
    if (path === 'layout' || path === 'dataSource') {
      this.context.propertyPane.refresh();
    }
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const snapshot = this.properties.layout === 'snapshot';
    const displayFields: IPropertyPaneField<unknown>[] = [
      PropertyPaneDropdown('layout', {
        label: 'Layout',
        options: [
          { key: 'board', text: 'Full dispatch board' },
          { key: 'snapshot', text: 'Snapshot: today at a glance' }
        ]
      }),
      ...(snapshot ? [PropertyPaneTextField('eyebrow', { label: 'Label above the title' })] : []),
      PropertyPaneTextField('title', { label: strings.TitleFieldLabel }),
      PropertyPaneTextField('accentWord', { label: strings.AccentWordLabel }),
      ...(snapshot ? [linkField('boardUrl', 'Link to the full dispatch board')] : [])
    ];

    return {
      pages: [
        {
          header: { description: strings.PropertyPaneDescription },
          groups: [
            { groupName: strings.DisplayGroupName, groupFields: displayFields },
            {
              groupName: strings.DataGroupName,
              groupFields: [
                PropertyPaneDropdown('dataSource', {
                  label: strings.DataSourceFieldLabel,
                  options: [
                    { key: 'demo', text: strings.DataSourceDemo },
                    { key: 'list', text: strings.DataSourceList }
                  ]
                }),
                PropertyPaneTextField('listTitle', {
                  label: strings.ListTitleFieldLabel,
                  description: strings.ListTitleFieldDescription,
                  disabled: this.properties.dataSource !== 'list'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
