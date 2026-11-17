import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DisplayMode, Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  type IPropertyPaneDropdownOption,
  type IPropertyPaneField,
  PropertyPaneDropdown,
  PropertyPaneTextField,
  PropertyPaneToggle,
  PropertyPaneLabel
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'FieldnotesHeroWebPartStrings';
import FieldnotesHero from './components/FieldnotesHero';
import type { IFieldnotesHeroProps } from './components/IFieldnotesHeroProps';
import {
  CUSTOM_TARGET,
  findPageSections,
  formatHeroDate,
  getDayPart,
  isSafeLink,
  resolveSectionLink,
  type IPageSection
} from './utils/heroUtils';

export interface IFieldnotesHeroWebPartProps {
  location: string;
  showGreeting: boolean;
  headline: string;
  accentWord: string;
  description: string;
  primaryText: string;
  primaryUrl: string;
  primaryNewTab: boolean;
  secondaryText: string;
  /** "#id" for a section on this page, "custom" for secondaryUrl, or "" to hide. */
  secondaryTarget: string;
  secondaryUrl: string;
  showIllustration: boolean;
}

const FONT_LINK_ID = 'fieldnotes-fonts';
const FONT_URL =
  'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Instrument+Serif:ital@0;1&display=swap';

export default class FieldnotesHeroWebPart extends BaseClientSideWebPart<IFieldnotesHeroWebPartProps> {
  private _root: Root | undefined;
  private _sections: IPageSection[] = [];

  protected onInit(): Promise<void> {
    this._loadFonts();
    return super.onInit();
  }

  public render(): void {
    const p = this.properties;
    const now = new Date();
    const greetings = { morning: strings.GoodMorning, afternoon: strings.GoodAfternoon, evening: strings.GoodEvening };

    const element: React.ReactElement<IFieldnotesHeroProps> = React.createElement(FieldnotesHero, {
      dateText: formatHeroDate(now, this.context.pageContext.cultureInfo.currentUICultureName || 'en-GB'),
      location: p.location || '',
      siteTitle: this.context.pageContext.web.title,
      greeting: p.showGreeting ? greetings[getDayPart(now)] : '',
      headline: p.headline || '',
      accentWord: p.accentWord || '',
      description: p.description || '',
      primaryText: p.primaryText || '',
      primaryUrl: isSafeLink(p.primaryUrl) ? p.primaryUrl.trim() : undefined,
      primaryNewTab: !!p.primaryNewTab,
      secondaryText: p.secondaryText || '',
      secondaryHref: resolveSectionLink(p.secondaryTarget, p.secondaryUrl),
      showIllustration: p.showIllustration !== false,
      isEditMode: this.displayMode === DisplayMode.Edit,
      missingLinkHint: strings.MissingLinkHint
    });

    if (!this._root) {
      this._root = createRoot(this.domElement);
    }
    this._root.render(element);
  }

  /** The fonts the Fieldnotes brand uses, added once per page. Falls back to Segoe UI if blocked. */
  private _loadFonts(): void {
    if (document.getElementById(FONT_LINK_ID)) {
      return;
    }
    const link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    link.href = FONT_URL;
    document.head.appendChild(link);
  }

  /** Re-scan the page each time the pane opens, so new headings show up in "Goes to". */
  protected onPropertyPaneConfigurationStart(): void {
    this._sections = findPageSections(document, this.domElement);
    this.context.propertyPane.refresh();
  }

  protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: unknown, newValue: unknown): void {
    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);
    if (propertyPath === 'secondaryTarget') {
      this.context.propertyPane.refresh();
    }
  }

  private _sectionOptions(): IPropertyPaneDropdownOption[] {
    const options: IPropertyPaneDropdownOption[] = [{ key: '', text: strings.SectionNone }];
    this._sections.forEach((s) => options.push({ key: `#${s.id}`, text: s.label }));

    const current = this.properties.secondaryTarget;
    if (current && current !== CUSTOM_TARGET && !options.some((o) => o.key === current)) {
      options.push({ key: current, text: `${current} ${strings.SectionNotFound}` });
    }

    options.push({ key: CUSTOM_TARGET, text: strings.SectionCustom });
    return options;
  }

  private _validateLink = (value: string): string => (!value || isSafeLink(value) ? '' : strings.InvalidUrl);

  protected onDispose(): void {
    this._root?.unmount();
    this._root = undefined;
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const sectionFields: IPropertyPaneField<unknown>[] = [
      PropertyPaneTextField('secondaryText', { label: strings.LinkTextLabel }),
      PropertyPaneDropdown('secondaryTarget', { label: strings.SectionLabel, options: this._sectionOptions() }),
      PropertyPaneLabel('sectionHelp', { text: strings.SectionHelp })
    ];
    if (this.properties.secondaryTarget === CUSTOM_TARGET) {
      sectionFields.push(
        PropertyPaneTextField('secondaryUrl', {
          label: strings.CustomUrlLabel,
          placeholder: '/sites/operations',
          onGetErrorMessage: this._validateLink,
          deferredValidationTime: 400
        })
      );
    }

    return {
      pages: [
        {
          header: { description: strings.PropertyPaneDescription },
          groups: [
            {
              groupName: strings.ContentGroupName,
              groupFields: [
                PropertyPaneToggle('showGreeting', { label: strings.ShowGreetingLabel }),
                PropertyPaneTextField('headline', { label: strings.HeadlineLabel, description: strings.HeadlineDescription, multiline: true, rows: 3 }),
                PropertyPaneTextField('accentWord', { label: strings.AccentWordLabel }),
                PropertyPaneTextField('description', { label: strings.DescriptionLabel, multiline: true, rows: 3 }),
                PropertyPaneTextField('location', { label: strings.LocationLabel }),
                PropertyPaneToggle('showIllustration', { label: strings.ShowIllustrationLabel })
              ]
            },
            {
              groupName: strings.PrimaryGroupName,
              groupFields: [
                PropertyPaneTextField('primaryText', { label: strings.ButtonTextLabel }),
                PropertyPaneTextField('primaryUrl', {
                  label: strings.ButtonUrlLabel,
                  description: strings.ButtonUrlDescription,
                  placeholder: 'https://',
                  onGetErrorMessage: this._validateLink,
                  deferredValidationTime: 400
                }),
                PropertyPaneToggle('primaryNewTab', { label: strings.NewTabLabel })
              ]
            },
            {
              groupName: strings.SecondaryGroupName,
              groupFields: sectionFields
            }
          ]
        }
      ]
    };
  }
}
