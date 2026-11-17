import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DisplayMode, Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { loadBrandFonts } from './loadBrandFonts';

/**
 * Shared plumbing for Fieldnotes web parts: loads the brand fonts, mounts one React root,
 * and cleans up. Subclasses only describe what to render.
 */
export abstract class FieldnotesWebPart<TProps extends {}> extends BaseClientSideWebPart<TProps> {
  private _root: Root | undefined;

  protected onInit(): Promise<void> {
    loadBrandFonts();
    return super.onInit();
  }

  protected abstract createElement(): React.ReactElement;

  public render(): void {
    if (!this._root) {
      this._root = createRoot(this.domElement);
    }
    this._root.render(this.createElement());
  }

  protected get isEditMode(): boolean {
    return this.displayMode === DisplayMode.Edit;
  }

  protected get webUrl(): string {
    return this.context.pageContext.web.absoluteUrl;
  }

  protected get locale(): string {
    return this.context.pageContext.cultureInfo.currentUICultureName || 'en-GB';
  }

  protected onDispose(): void {
    this._root?.unmount();
    this._root = undefined;
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }
}
