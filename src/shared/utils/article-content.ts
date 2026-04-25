type JsonRecord = Record<string, unknown>;

export interface ArticleContentBlock {
    id: string;
    componentCode: string;
    componentType: string;
    name: string;
    data: JsonRecord;
}

export interface ArticleContentDocument {
    version: number;
    blocks: ArticleContentBlock[];
}

export interface ArticlePreviewSection {
    id: string;
    heading: string;
    content: string;
    imageUrl?: string;
}

export interface ArticlePreviewModel {
    plainText: string;
    lead: string;
    sections: ArticlePreviewSection[];
    tableOfContents: Array<{ id: string; label: string; level: 1 | 2 }>;
}

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
}

function uniqueStrings(items: string[]): string[] {
    return Array.from(new Set(items.filter(Boolean)));
}

function slugifySegment(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'section';
}

function pickFirstString(record: JsonRecord, keys: string[]): string {
    for (const key of keys) {
        const next = asString(record[key]);
        if (next) return next;
    }
    return '';
}

function flattenText(value: unknown): string[] {
    if (typeof value === 'string') {
        return value
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return [String(value)];
    }
    if (Array.isArray(value)) {
        return uniqueStrings(value.flatMap(flattenText));
    }
    if (isRecord(value)) {
        return uniqueStrings(Object.values(value).flatMap(flattenText));
    }
    return [];
}

function normalizeData(block: JsonRecord): JsonRecord {
    if (isRecord(block.data)) {
        return { ...block.data };
    }

    const data: JsonRecord = {};
    for (const [key, value] of Object.entries(block)) {
        if (['id', 'componentCode', 'componentType', 'name', 'data', 'code', 'type', 'label', 'title'].includes(key)) {
            continue;
        }
        data[key] = value;
    }
    return data;
}

function normalizeBlock(block: unknown, index: number): ArticleContentBlock | null {
    if (!isRecord(block)) return null;

    const data = normalizeData(block);
    const componentCode = pickFirstString(block, ['componentCode', 'code', 'type', 'componentType', 'name', 'label', 'title']) || `block-${index + 1}`;
    const componentType = pickFirstString(block, ['componentType', 'type']) || componentCode;
    const name =
        pickFirstString(block, ['name', 'label', 'title']) ||
        pickFirstString(data, ['label', 'title', 'heading', 'name']) ||
        componentCode;

    return {
        id: asString(block.id) || createArticleBlockId(),
        componentCode,
        componentType,
        name,
        data,
    };
}

function blockMatches(block: ArticleContentBlock, needles: string[]): boolean {
    const haystack = `${block.componentCode} ${block.componentType} ${block.name}`.toLowerCase();
    return needles.some((needle) => haystack.includes(needle));
}

function textFromBlock(block: ArticleContentBlock): string {
    const preferred = uniqueStrings([
        pickFirstString(block.data, ['content', 'text', 'body', 'description', 'lead', 'summary', 'title', 'heading', 'caption']),
        ...flattenText(block.data.items),
        ...flattenText(block.data.list),
    ]);

    if (preferred.length > 0) {
        return preferred.join('\n');
    }

    return uniqueStrings(flattenText(block.data)).join('\n');
}

function getMediaUrl(block: ArticleContentBlock): string | undefined {
    return (
        pickFirstString(block.data, ['imageUrl', 'url', 'src', 'youtubeUrl', 'videoUrl']) ||
        undefined
    );
}

function getHeadingText(block: ArticleContentBlock): string {
    return (
        pickFirstString(block.data, ['content', 'text', 'title', 'heading', 'label']) ||
        block.name ||
        block.componentCode
    );
}

function isHeadingBlock(block: ArticleContentBlock): boolean {
    return blockMatches(block, ['h1', 'h2', 'h3', 'heading', 'title']);
}

function isLeadBlock(block: ArticleContentBlock): boolean {
    return blockMatches(block, ['lead', 'summary', 'intro', 'mo-dau', 'opening']);
}

function isWarningBlock(block: ArticleContentBlock): boolean {
    return blockMatches(block, ['warning', 'alert', 'caution']);
}

function buildWarningText(block: ArticleContentBlock): string {
    const title = pickFirstString(block.data, ['title', 'heading', 'label']);
    const lines = uniqueStrings([
        ...flattenText(block.data.items),
        ...flattenText(block.data.list),
        pickFirstString(block.data, ['content', 'text', 'body']),
    ]);
    return uniqueStrings([title, ...lines]).join('\n');
}

export function createArticleBlockId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `block-${Math.random().toString(36).slice(2, 10)}`;
}

export function parseArticleContentJson(raw?: string | null): ArticleContentDocument {
    if (!raw) {
        return { version: 1, blocks: [] };
    }

    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!isRecord(parsed)) {
            return { version: 1, blocks: [] };
        }

        const version = typeof parsed.version === 'number' ? parsed.version : 1;
        const blocks = Array.isArray(parsed.blocks)
            ? parsed.blocks
                  .map((block, index) => normalizeBlock(block, index))
                  .filter((block): block is ArticleContentBlock => block !== null)
            : [];

        return { version, blocks };
    } catch {
        return { version: 1, blocks: [] };
    }
}

export function stringifyArticleContent(document: ArticleContentDocument): string {
    return JSON.stringify({
        version: document.version || 1,
        blocks: document.blocks.map((block) => ({
            id: block.id,
            componentCode: block.componentCode,
            componentType: block.componentType,
            name: block.name,
            data: block.data,
        })),
    });
}

export function extractArticlePlainText(contentJson?: string | null, contentMarkdown?: string | null): string {
    const document = parseArticleContentJson(contentJson);
    const fromJson = uniqueStrings(document.blocks.map(textFromBlock)).join('\n');
    if (fromJson) return fromJson;
    return (contentMarkdown ?? '').trim();
}

export function extractTemplateComponentSeed(contentJson?: string | null): string[] {
    return parseArticleContentJson(contentJson).blocks.map((block) => block.name || block.componentCode);
}

export function buildArticlePreview(contentJson?: string | null, fallbackTitle = 'Noi dung bai viet'): ArticlePreviewModel {
    const document = parseArticleContentJson(contentJson);
    const tableOfContents: ArticlePreviewModel['tableOfContents'] = [];
    const sections: ArticlePreviewSection[] = [];
    let lead = '';

    const ensureSection = (heading: string) => {
        const normalizedHeading = heading.trim() || fallbackTitle;
        const id = slugifySegment(normalizedHeading);
        const existing = sections.find((section) => section.id === id);
        if (existing) return existing;

        const created: ArticlePreviewSection = {
            id,
            heading: normalizedHeading,
            content: '',
        };
        sections.push(created);
        return created;
    };

    let currentSection = ensureSection(fallbackTitle);

    for (const block of document.blocks) {
        if (isHeadingBlock(block)) {
            const heading = getHeadingText(block);
            const nextSection = ensureSection(heading);
            currentSection = nextSection;

            const level: 1 | 2 = blockMatches(block, ['h1']) ? 1 : 2;
            tableOfContents.push({
                id: nextSection.id,
                label: heading,
                level,
            });
            continue;
        }

        if (isLeadBlock(block) && !lead) {
            lead = textFromBlock(block);
        }

        const text = isWarningBlock(block) ? buildWarningText(block) : textFromBlock(block);
        if (text) {
            currentSection.content = uniqueStrings([currentSection.content, text]).join('\n\n');
        }

        const mediaUrl = getMediaUrl(block);
        if (mediaUrl && !currentSection.imageUrl) {
            currentSection.imageUrl = mediaUrl;
        }
    }

    const filteredSections = sections.filter((section) => section.content.trim() || section.heading.trim());
    const plainText = uniqueStrings(filteredSections.flatMap((section) => [section.heading, section.content])).join('\n\n');

    return {
        plainText,
        lead,
        sections: filteredSections.length > 0 ? filteredSections : [{ id: 'noi-dung', heading: fallbackTitle, content: '' }],
        tableOfContents,
    };
}

export function buildMarkdownFromArticleContent(title: string, contentJson?: string | null): string {
    const preview = buildArticlePreview(contentJson, title);
    const lines: string[] = [`# ${title}`];

    if (preview.lead) {
        lines.push('', preview.lead);
    }

    for (const section of preview.sections) {
        if (section.heading && section.heading !== title) {
            lines.push('', `## ${section.heading}`);
        }
        if (section.content) {
            lines.push('', section.content);
        }
    }

    return lines.join('\n').trim();
}
