import { SPHttpClient } from '@microsoft/sp-http';

export interface INewsItem {
  title: string;
  description: string;
  url: string;
  /** Banner image, or undefined when the post uses SharePoint's default thumbnail. */
  imageUrl?: string;
  /** ISO date the post was first published. */
  published: string;
  /** The page's topic heading, if the author set one. */
  topic?: string;
}

interface ISitePageItem {
  Title: string;
  Description?: string;
  FileRef: string;
  FirstPublishedDate?: string;
  BannerImageUrl?: { Url?: string };
  OData__TopicHeader?: string;
}

/**
 * Reads published news posts (PromotedState = 2) from a site's Site Pages library,
 * newest first. A new post appears as soon as it is published, no setup needed.
 */
export class NewsService {
  constructor(private readonly _client: SPHttpClient) {}

  public async getLatest(siteUrl: string, count: number): Promise<INewsItem[]> {
    const site = siteUrl.replace(/\/+$/, '');
    const serverRelative = new URL(site).pathname.replace(/\/+$/, '');
    const base =
      `${site}/_api/web/getList('${encodeURIComponent(`${serverRelative}/SitePages`)}')/items` +
      `?$filter=PromotedState eq 2 and FirstPublishedDate ne null&$orderby=FirstPublishedDate desc&$top=${count}`;
    const fields = 'Title,Description,FileRef,FirstPublishedDate,BannerImageUrl';

    // The topic heading column is missing on some older libraries, so try with it and fall back without.
    let response = await this._client.get(`${base}&$select=${fields},OData__TopicHeader`, SPHttpClient.configurations.v1);
    if (response.status === 400) {
      response = await this._client.get(`${base}&$select=${fields}`, SPHttpClient.configurations.v1);
    }
    if (!response.ok) {
      throw new Error(`Could not load news (HTTP ${response.status}).`);
    }

    const origin = new URL(site).origin;
    const json: { value: ISitePageItem[] } = await response.json();
    return json.value.map((p) => ({
      title: p.Title,
      description: p.Description || '',
      url: origin + p.FileRef,
      imageUrl: usableImage(p.BannerImageUrl?.Url),
      published: p.FirstPublishedDate || '',
      topic: p.OData__TopicHeader || undefined
    }));
  }
}

function usableImage(url: string | undefined): string | undefined {
  if (!url || /sitepagethumbnail/i.test(url)) {
    return undefined;
  }
  return url;
}

/** Shown before any real news is published, so the page never looks empty. */
export function demoNews(now: Date = new Date()): INewsItem[] {
  const daysAgo = (n: number): string => new Date(now.getTime() - n * 86400000).toISOString();
  return [
    {
      title: 'A new northern route cuts the Harrogate run by 25 minutes',
      description: 'Route 7 now leaves from Bay 2 and skips the ring road at peak times.',
      url: '',
      published: daysAgo(2),
      topic: 'Operations'
    },
    {
      title: 'Three new starters join the warehouse team this month',
      description: 'Say hello to Amira, Jordan and Sam when you see them on the floor.',
      url: '',
      published: daysAgo(4),
      topic: 'People'
    },
    {
      title: "Delivery notes are going digital. Here's what changes",
      description: 'From December, drivers will capture signatures on the handheld.',
      url: '',
      published: daysAgo(7),
      topic: 'Projects'
    }
  ];
}
