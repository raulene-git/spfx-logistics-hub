import * as React from 'react';
import { type IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { FieldnotesWebPart } from '../../common/FieldnotesWebPart';
import { headerFields, linkField } from '../../common/propertyPane';
import ShipmentImporter from './components/ShipmentImporter';
import { ImportService } from './services/ImportService';

export interface IShipmentImporterWebPartProps {
  eyebrow: string;
  title: string;
  accent: string;
  listTitle: string;
  boardUrl: string;
}

export default class ShipmentImporterWebPart extends FieldnotesWebPart<IShipmentImporterWebPartProps> {
  private _service: ImportService | undefined;
  private _serviceKey = '';

  private _getService(): ImportService | undefined {
    const list = (this.properties.listTitle || '').trim();
    if (!list) {
      return undefined;
    }
    if (!this._service || this._serviceKey !== list) {
      this._serviceKey = list;
      this._service = new ImportService(this.context.spHttpClient, this.webUrl, list);
    }
    return this._service;
  }

  protected createElement(): React.ReactElement {
    const p = this.properties;
    return React.createElement(ShipmentImporter, {
      eyebrow: p.eyebrow,
      title: p.title,
      accent: p.accent,
      listTitle: (p.listTitle || '').trim(),
      service: this._getService(),
      boardUrl: p.boardUrl
    });
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: 'Turns the weekly Excel sheet into list items. Existing references are updated, new ones added.' },
          groups: [
            { groupName: 'Content', groupFields: headerFields() },
            {
              groupName: 'Where to import',
              groupFields: [
                PropertyPaneTextField('listTitle', {
                  label: 'List name',
                  description: 'The Shipments list (scripts/provision-shipments-list.ps1). Leave empty to check files without importing.'
                }),
                linkField('boardUrl', 'Link to the dispatch board (shown after importing)')
              ]
            }
          ]
        }
      ]
    };
  }
}
