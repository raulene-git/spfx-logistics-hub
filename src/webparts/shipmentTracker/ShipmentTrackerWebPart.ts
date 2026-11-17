import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import type { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'ShipmentTrackerWebPartStrings';
import ShipmentTracker from './components/ShipmentTracker';
import type { IShipmentTrackerProps } from './components/IShipmentTrackerProps';
import type { IShipmentService } from './services/IShipmentService';
import { MockShipmentService } from './services/MockShipmentService';
import { SharePointShipmentService } from './services/SharePointShipmentService';

export type DataSource = 'demo' | 'list';

export interface IShipmentTrackerWebPartProps {
  title: string;
  dataSource: DataSource;
  listTitle: string;
}

export default class ShipmentTrackerWebPart extends BaseClientSideWebPart<IShipmentTrackerWebPartProps> {
  private _isDarkTheme: boolean = false;
  private _root: Root | undefined;
  private _service: IShipmentService | undefined;
  private _serviceKey: string = '';

  public render(): void {
    const element: React.ReactElement<IShipmentTrackerProps> = React.createElement(ShipmentTracker, {
      title: this.properties.title || strings.DefaultTitle,
      service: this._getService(),
      isDemo: this._usesDemoData(),
      isDarkTheme: this._isDarkTheme
    });

    if (!this._root) {
      this._root = createRoot(this.domElement);
    }
    this._root.render(element);
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
        : new SharePointShipmentService(this.context.spHttpClient, this.context.pageContext.web.absoluteUrl, this.properties.listTitle);
    }
    return this._service;
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }
    this._isDarkTheme = !!currentTheme.isInverted;
    const { semanticColors } = currentTheme;
    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }
  }

  protected onDispose(): void {
    this._root?.unmount();
    this._root = undefined;
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: strings.PropertyPaneDescription },
          groups: [
            {
              groupName: strings.DisplayGroupName,
              groupFields: [PropertyPaneTextField('title', { label: strings.TitleFieldLabel })]
            },
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
