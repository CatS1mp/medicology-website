type JsonRecord = Record<string, unknown>;

export type ArticleHeadingLevel = 1 | 2 | 3;
export const ARTICLE_CONTENT_SCHEMA_VERSION = 2;

export interface ArticleContentBlock {
    id: string;
    componentCode: string;
    componentType: string;
    name: string;
    data: JsonRecord;
    level: ArticleHeadingLevel;
}

export interface ArticleContentDocument {
    version: number;
    blocks: ArticleContentBlock[];
}

export interface ArticlePreviewSection {
    id: string;
    heading: string;
    headingLevel: ArticleHeadingLevel;
    content: string;
    imageUrl?: string;
}

export interface ArticlePreviewModel {
    plainText: string;
    lead: string;
    sections: ArticlePreviewSection[];
    tableOfContents: Array<{ id: string; label: string; level: ArticleHeadingLevel }>;
}

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
}

function asNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value.trim());
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
}

function requiredStringField(record: JsonRecord, field: string, blockIndex: number): string {
    const value = record[field];
    if (typeof value === 'string' && value.trim()) return value.trim();
    throw new Error(`Invalid contentJson: blocks[${blockIndex}].${field} must be a non-empty string`);
}

function clampHeadingLevel(value: unknown, fallback: ArticleHeadingLevel = 1): ArticleHeadingLevel {
    const parsed = asNumber(value);
    if (parsed === null) return fallback;
    if (parsed <= 1) return 1;
    if (parsed === 2) return 2;
    return 3;
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
    if (!isRecord(block.data)) {
        throw new Error('Invalid contentJson: block.data must be an object');
    }
    return { ...block.data };
}

function normalizeBlock(block: unknown, index: number): ArticleContentBlock {
    if (!isRecord(block)) {
        throw new Error(`Invalid contentJson: blocks[${index}] must be an object`);
    }

    const data = normalizeData(block);
    const levelRaw = asNumber(block.level);
    if (levelRaw === null) {
        throw new Error(`Invalid contentJson: blocks[${index}].level must be an integer in range 1..3`);
    }
    const level = clampHeadingLevel(levelRaw, 1);
    if (levelRaw < 1 || levelRaw > 3) {
        throw new Error(`Invalid contentJson: blocks[${index}].level must be an integer in range 1..3`);
    }

    return {
        id: requiredStringField(block, 'id', index),
        componentCode: requiredStringField(block, 'componentCode', index),
        componentType: requiredStringField(block, 'componentType', index),
        name: requiredStringField(block, 'name', index),
        data,
        level,
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

    return ' ';
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

export function resolveHeadingLevel(block: ArticleContentBlock): ArticleHeadingLevel {
    const fromData = asNumber(block.data.headingLevel ?? block.data.rank ?? block.data.level);
    if (fromData !== null) {
        return clampHeadingLevel(fromData, 2);
    }
    if (blockMatches(block, ['h1'])) return 1;
    if (blockMatches(block, ['h2'])) return 2;
    if (blockMatches(block, ['h3'])) return 3;
    return clampHeadingLevel(block.level, 2);
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
    if (!raw || !raw.trim()) {
        throw new Error('Invalid contentJson: payload is required');
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw) as unknown;
    } catch {
        throw new Error('Invalid contentJson: payload must be valid JSON');
    }
    if (!isRecord(parsed)) {
        throw new Error('Invalid contentJson: root must be an object');
    }

    const version = asNumber(parsed.version);
    if (version !== ARTICLE_CONTENT_SCHEMA_VERSION) {
        throw new Error(`Invalid contentJson: version must be ${ARTICLE_CONTENT_SCHEMA_VERSION}`);
    }
    if (!Array.isArray(parsed.blocks)) {
        throw new Error('Invalid contentJson: blocks must be an array');
    }

    const blocks = parsed.blocks.map((block, index) => normalizeBlock(block, index));
    return { version: ARTICLE_CONTENT_SCHEMA_VERSION, blocks };
}

export function stringifyArticleContent(document: ArticleContentDocument): string {
    return JSON.stringify({
        version: ARTICLE_CONTENT_SCHEMA_VERSION,
        blocks: document.blocks.map((block) => ({
            id: block.id,
            componentCode: block.componentCode,
            componentType: block.componentType,
            name: block.name,
            data: block.data,
            level: clampHeadingLevel(block.level, 1),
        })),
    });
}

export function extractArticlePlainText(contentJson?: string | null, contentMarkdown?: string | null): string {
    const document = parseArticleContentJson(contentJson);
    const fromJson = uniqueStrings(document.blocks.map(textFromBlock)).join('\n');
    if (fromJson) return fromJson;
    return (contentMarkdown ?? '').trim();
}

/**
 * For catalog cards / lists: never throw if contentJson is missing, invalid, or legacy (not schema v2).
 */
export function extractArticlePlainTextLenient(contentJson?: string | null, contentMarkdown?: string | null): string {
    try {
        return extractArticlePlainText(contentJson, contentMarkdown);
    } catch {
        return (contentMarkdown ?? '').trim();
    }
}

export function sanitizeArticlePreviewText(text: string): string {
    return text
        .replace(/https?:\/\/\S+/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * For learner views when contentJson may still be legacy: fall back to markdown-only preview.
 */
export function buildArticlePreviewLenient(
    contentJson?: string | null,
    fallbackTitle = 'Nội dung bài viết',
    contentMarkdown?: string | null
): ArticlePreviewModel {
    try {
        return buildArticlePreview(contentJson, fallbackTitle);
    } catch {
        const md = (contentMarkdown ?? '').trim();
        return {
            plainText: md || fallbackTitle,
            lead: '',
            sections: [
                {
                    id: 'noi-dung',
                    heading: fallbackTitle,
                    headingLevel: 1,
                    content: md,
                },
            ],
            tableOfContents: [],
        };
    }
}

export function extractTemplateComponentSeed(contentJson?: string | null): string[] {
    return parseArticleContentJson(contentJson).blocks.map((block) => block.name || block.componentCode);
}

export function buildArticlePreview(contentJson?: string | null, fallbackTitle = 'Nội dung bài viết'): ArticlePreviewModel {
    const document = parseArticleContentJson(contentJson);
    const tableOfContents: ArticlePreviewModel['tableOfContents'] = [];
    const sections: ArticlePreviewSection[] = [];
    let lead = '';
    const sectionIdCount = new Map<string, number>();

    const buildSectionId = (heading: string) => {
        const base = slugifySegment(heading);
        const nextCount = (sectionIdCount.get(base) ?? 0) + 1;
        sectionIdCount.set(base, nextCount);
        return nextCount === 1 ? base : `${base}-${nextCount}`;
    };

    const ensureSection = (heading: string, headingLevel: ArticleHeadingLevel) => {
        const normalizedHeading = heading.trim() || fallbackTitle;
        const id = buildSectionId(normalizedHeading);
        const created: ArticlePreviewSection = {
            id,
            heading: normalizedHeading,
            headingLevel,
            content: '',
        };
        sections.push(created);
        return created;
    };

    let currentSection = ensureSection(fallbackTitle, 1);

    for (const block of document.blocks) {
        if (isHeadingBlock(block)) {
            const heading = getHeadingText(block);
            const headingLevel = resolveHeadingLevel(block);
            const nextSection = ensureSection(heading, headingLevel);
            currentSection = nextSection;

            tableOfContents.push({
                id: nextSection.id,
                label: heading,
                level: headingLevel,
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
        sections:
            filteredSections.length > 0
                ? filteredSections
                : [{ id: 'noi-dung', heading: fallbackTitle, headingLevel: 1, content: '' }],
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
            const markdownLevel = Math.min(6, section.headingLevel + 1);
            lines.push('', `${'#'.repeat(markdownLevel)} ${section.heading}`);
        }
        if (section.content) {
            lines.push('', section.content);
        }
    }

    return lines.join('\n').trim();
}
