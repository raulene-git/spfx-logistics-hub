import * as React from 'react';
import { type IPropertyPaneConfiguration, PropertyPaneSlider, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-property-pane';
import { FieldnotesWebPart } from '../../common/FieldnotesWebPart';
import { anchorField, headerFields, linkField } from '../../common/propertyPane';
import { isSafeLink } from '../../common/links';
import News from './components/News';
import { NewsService } from './services/NewsService';

export interface INewsWebPartProps {
  eyebrow: string;
  title: string;
  accent: string;
  anchor: string;
  siteUrl: string;
  allNewsUrl: string;
  count: number;
  showThumbnails: boolean;
  showDescription: boolean;
  showDemoWhenEmpty: boolean;
}

export default class NewsWebPart extends FieldnotesWebPart<INewsWebPartProps> {
  private _service: NewsService | undefined;

  protected createElement(): React.ReactElement {
    const p = this.properties;
    if (!this._service) {
      this._service = new NewsService(this.context.spHttpClient);
    }
    const siteUrl = p.siteUrl && /^https:\/\//i.test(p.siteUrl.trim()) ? p.siteUrl.trim() : this.webUrl;

    return React.createElement(News, {
      eyebrow: p.eyebrow,
      title: p.title,
      accent: p.accent,
      anchor: p.anchor,
      allNewsUrl: isSafeLink(p.allNewsUrl) ? p.allNewsUrl : undefined,
      siteUrl,
      count: Math.min(Math.max(p.count || 3, 1), 9),
      showThumbnails: p.showThumbnails !== false,
      showDescription: !!p.showDescription,
      showDemoWhenEmpty: p.showDemoWhenEmpty !== false,
      service: this._service,
      locale: this.locale
    });
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: 'Shows the newest news posts. Publish a news post (New > News post) and it appears here automatically.' },
          groups: [
            {
              groupName: 'Content',
              groupFields: [
                ...headerFields(),
                PropertyPaneSlider('count', { label: 'How many posts', min: 1, max: 9, step: 1 }),
                PropertyPaneToggle('showThumbnails', { label: 'Show thumbnails' }),
                PropertyPaneToggle('showDescription', { label: 'Show the description' }),
                linkField('allNewsUrl', '"All news" link (optional)')
              ]
            },
            {
              groupName: 'Source',
              groupFields: [
                PropertyPaneTextField('siteUrl', {
                  label: 'Read news from another site (optional)',
                  description: 'Full address, e.g. https://contoso.sharepoint.com/sites/news. Leave empty for this site.',
                  onGetErrorMessage: (v: string) => (!v || /^https:\/\/\S+$/i.test(v.trim()) ? '' : 'Use the full https:// address of a site'),
                  deferredValidationTime: 400
                }),
                PropertyPaneToggle('showDemoWhenEmpty', { label: 'Show example stories until the first post is published' }),
                anchorField()
              ]
            }
          ]
        }
      ]
    };
  }
}
