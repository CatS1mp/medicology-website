'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { BaseAdminLayout } from '@/features/admin/components/layout/BaseAdminLayout';
import styles from './article-editor.module.css';
import type {
    DictionaryArticleResponse,
    DictionaryComponentDefinitionResponse,
    DictionaryTagResponse,
} from '@/features/encyclopedia/api';
import {
    adminAssignArticleTags,
    adminGetArticleById,
    adminListComponents,
    adminListTags,
    adminPublishArticle,
    adminUploadDictionaryAsset,
    adminUnpublishArticle,
    adminUpdateArticle,
} from '@/shared/api/admin-dictionary';
import {
    ARTICLE_CONTENT_SCHEMA_VERSION,
    buildArticlePreview,
    buildMarkdownFromArticleContent,
    createArticleBlockId,
    parseArticleContentJson,
    resolveHeadingLevel,
    stringifyArticleContent,
    type ArticleHeadingLevel,
    type ArticleContentBlock,
} from '@/shared/utils/article-content';

type SchemaField = {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'select';
    options: string[];
};

type TocGroup = {
    id: string;
    label: string;
    children: Array<{ id: string; label: string; level: ArticleHeadingLevel }>;
};

function asString(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
}

/** Match select value to schema options (handles number in JSON vs string options). */
function coerceSelectFieldValue(raw: unknown, options: string[]): string {
    if (options.length === 0) return asString(raw);
    const direct = asString(raw);
    if (options.includes(direct)) return direct;
    const n = typeof raw === 'number' ? raw : Number(direct);
    if (Number.isFinite(n)) {
        const matched = options.find((o) => Number(o) === n);
        if (matched !== undefined) return matched;
    }
    return '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clampBlockLevel(value: unknown, fallback: ArticleHeadingLevel = 1): ArticleHeadingLevel {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    if (parsed <= 1) return 1;
    if (parsed === 2) return 2;
    return 3;
}

function getBlockLevel(block: ArticleContentBlock): ArticleHeadingLevel {
    return clampBlockLevel(block.level, 1);
}

function normalizeSlug(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function blockMatches(block: ArticleContentBlock, needles: string[]): boolean {
    const haystack = `${block.componentCode} ${block.componentType} ${block.name}`.toLowerCase();
    return needles.some((needle) => haystack.includes(needle));
}

function readBlockText(block: ArticleContentBlock): string {
    for (const key of ['content', 'text', 'body', 'description', 'summary', 'title', 'heading', 'label']) {
        const next = asString(block.data[key]).trim();
        if (next) return next;
    }
    return '';
}

function readDescriptionFromBlocks(blocks: ArticleContentBlock[]): string {
    const preferred = blocks.find((block) => blockMatches(block, ['lead', 'summary', 'intro']));
    if (preferred) return readBlockText(preferred);
    const paragraph = blocks.find((block) => blockMatches(block, ['paragraph', 'text']));
    return paragraph ? readBlockText(paragraph) : '';
}

function normalizeBlocks(article: DictionaryArticleResponse): ArticleContentBlock[] {
    return parseArticleContentJson(article.contentJson).blocks;
}

function buildPreviewBlocks(
    blocks: ArticleContentBlock[],
    title: string,
    description: string
): ArticleContentBlock[] {
    const nextBlocks = blocks.map((block) => ({
        ...block,
        data: { ...block.data },
    }));

    const headingBlock = nextBlocks.find((block) => blockMatches(block, ['h1', 'title']));
    if (headingBlock) {
        headingBlock.data.content = title;
    } else {
        nextBlocks.unshift({
            id: createArticleBlockId(),
            componentCode: 'H1',
            componentType: 'heading',
            name: 'Tiêu đề chính',
            data: { content: title },
            level: 1,
        });
    }

    const leadBlock = nextBlocks.find((block) => blockMatches(block, ['lead', 'summary', 'intro']));
    if (description.trim()) {
        if (leadBlock) {
            leadBlock.data.content = description.trim();
        } else {
            nextBlocks.splice(1, 0, {
                id: createArticleBlockId(),
                componentCode: 'Lead',
                componentType: 'text',
                name: 'Đoạn dẫn mở đầu',
                data: { content: description.trim() },
                level: 1,
            });
        }
    }

    return nextBlocks;
}

function humanizeFieldLabel(value: string): string {
    const normalized = value.trim();
    const lookup: Record<string, string> = {
        content: 'Nội dung',
        text: 'Nội dung',
        body: 'Nội dung',
        title: 'Tiêu đề',
        heading: 'Tiêu đề',
        label: 'Nhãn',
        description: 'Mô tả',
        summary: 'Tóm tắt',
        caption: 'Chú thích',
        imageUrl: 'Liên kết hình ảnh',
        videoUrl: 'Liên kết video',
        youtubeUrl: 'Liên kết YouTube',
        url: 'Liên kết',
        src: 'Nguồn',
    };

    if (lookup[normalized]) return lookup[normalized];

    return normalized
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^./, (char) => char.toUpperCase());
}

function parseOptions(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => {
            if (typeof item === 'string') return item;
            if (isRecord(item)) return asString(item.label || item.value || item.name);
            return '';
        })
        .filter(Boolean);
}

function parseSchemaFields(schemaJson?: string | null, block?: ArticleContentBlock): SchemaField[] {
    if (schemaJson) {
        try {
            const parsed = JSON.parse(schemaJson) as unknown;
            const fields = isRecord(parsed) && Array.isArray(parsed.fields) ? parsed.fields : [];
            const normalized = fields
                .map((field) => {
                    if (!isRecord(field)) return null;

                    const key = asString(field.key || field.name || field.code || field.id);
                    if (!key) return null;

                    const rawType = asString(field.type || field.inputType || field.widget).toLowerCase();
                    const type: SchemaField['type'] =
                        rawType.includes('select') || rawType.includes('option')
                            ? 'select'
                            : rawType.includes('textarea') || rawType.includes('multiline') || rawType.includes('rich')
                              ? 'textarea'
                              : 'text';

                    return {
                        key,
                        label: humanizeFieldLabel(asString(field.label || field.title || field.name || key)),
                        type,
                        options: parseOptions(field.options || field.choices),
                    };
                })
                .filter((field): field is SchemaField => field !== null);

            if (normalized.length > 0) return normalized;
        } catch {
        }
    }

    if (!block) return [];

    const keys = Object.keys(block.data);
    if (keys.length === 0) {
        return [{ key: 'content', label: 'Nội dung', type: 'textarea', options: [] }];
    }

    return keys.map((key) => ({
        key,
        label: humanizeFieldLabel(key),
        type:
            key.toLowerCase().includes('content') ||
            key.toLowerCase().includes('text') ||
            key.toLowerCase().includes('body') ||
            key.toLowerCase().includes('description')
                ? 'textarea'
                : 'text',
        options: [],
    }));
}

function parseDefaultData(defaultDataJson?: string | null): Record<string, unknown> {
    if (!defaultDataJson) return {};

    try {
        const parsed = JSON.parse(defaultDataJson) as unknown;
        return isRecord(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

function buildBlockFromDefinition(definition: DictionaryComponentDefinitionResponse): ArticleContentBlock {
    const data = parseDefaultData(definition.defaultDataJson);
    return {
        id: createArticleBlockId(),
        componentCode: definition.code,
        componentType: definition.componentType,
        name: definition.name,
        data,
        level: clampBlockLevel(data.level ?? data.headingLevel, 1),
    };
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
        return value.flatMap(flattenText);
    }

    if (isRecord(value)) {
        return Object.values(value).flatMap(flattenText);
    }

    return [];
}

function extractBlockParagraphs(block: ArticleContentBlock): string[] {
    const preferred = readBlockText(block).trim();
    if (preferred) {
        return preferred
            .split('\n\n')
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return flattenText(block.data);
}

function extractWarningItems(block: ArticleContentBlock): string[] {
    const rawItems = [...flattenText(block.data.items), ...flattenText(block.data.list)];

    if (rawItems.length > 0) return rawItems;

    return readBlockText(block)
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
}

function getWarningTitle(block: ArticleContentBlock): string {
    for (const key of ['title', 'heading', 'label', 'name']) {
        const value = asString(block.data[key]).trim();
        if (value) return value;
    }

    return block.name || 'Cảnh báo';
}

function getMediaCaption(block: ArticleContentBlock): string {
    for (const key of ['caption', 'description', 'text', 'content', 'imageUrl', 'url', 'src', 'videoUrl', 'youtubeUrl']) {
        const value = asString(block.data[key]).trim();
        if (value) return value;
    }

    return block.name || 'Tệp phương tiện';
}

function getBlockImageUrl(block: ArticleContentBlock): string {
    return asString(block.data.imageUrl ?? block.data.url ?? block.data.src).trim();
}

function isVideoLikeUrl(url: string): boolean {
    const lower = url.toLowerCase();
    return (
        lower.includes('youtube.com') ||
        lower.includes('youtu.be') ||
        lower.includes('vimeo.com') ||
        /\.(mp4|webm|ogg)(\?|$)/i.test(lower)
    );
}

function getImageFigureCaption(block: ArticleContentBlock, imageUrl: string): string {
    for (const key of ['caption', 'title', 'heading', 'label', 'description']) {
        const value = asString(block.data[key]).trim();
        if (value && value !== imageUrl) return value;
    }
    return block.name || 'Hình minh họa';
}

function isWarningLikeBlock(block: ArticleContentBlock): boolean {
    return blockMatches(block, ['warning', 'alert', 'caution', 'canh bao']);
}

function isMediaLikeBlock(block: ArticleContentBlock): boolean {
    return (
        blockMatches(block, ['image', 'media', 'video', 'youtube', 'file', 'gallery']) ||
        ['imageUrl', 'url', 'src', 'videoUrl', 'youtubeUrl'].some((key) => Boolean(asString(block.data[key]).trim()))
    );
}

function isInfographicLikeBlock(block: ArticleContentBlock): boolean {
    return blockMatches(block, ['infographic', 'media', 'image']);
}

function isHeadingLikeBlock(block: ArticleContentBlock): boolean {
    return blockMatches(block, ['h1', 'h2', 'h3', 'heading', 'title']);
}

function getHeadingText(block: ArticleContentBlock): string {
    return readBlockText(block).trim() || block.name || block.componentCode;
}

function buildTocGroupsFromBlocks(blocks: ArticleContentBlock[], fallbackLabel: string): TocGroup[] {
    const rootLabel = fallbackLabel.trim() || 'Bài viết chưa đặt tên';
    const children = blocks
        .filter((block) => isHeadingLikeBlock(block))
        .map((block) => ({
            id: `preview-heading-${block.id}`,
            label: getHeadingText(block),
            level: resolveHeadingLevel(block),
        }))
        .filter((item) => item.label && item.label !== rootLabel);

    return [
        {
            id: 'preview-root',
            label: rootLabel,
            children,
        },
    ];
}

export const AdminArticleEditorScreen: React.FC = () => {
    const params = useParams<{ articleId: string }>();
    const articleId = Array.isArray(params?.articleId) ? params.articleId[0] : params?.articleId;

    const [article, setArticle] = React.useState<DictionaryArticleResponse | null>(null);
    const [components, setComponents] = React.useState<DictionaryComponentDefinitionResponse[]>([]);
    const [tags, setTags] = React.useState<DictionaryTagResponse[]>([]);
    const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([]);
    const [name, setName] = React.useState('');
    const [slug, setSlug] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [slugTouched, setSlugTouched] = React.useState(false);
    const [blocks, setBlocks] = React.useState<ArticleContentBlock[]>([]);
    const [contentVersion, setContentVersion] = React.useState(ARTICLE_CONTENT_SCHEMA_VERSION);
    const [loading, setLoading] = React.useState(true);
    const [busyAction, setBusyAction] = React.useState<'save' | 'publish' | 'unpublish' | ''>('');
    const [error, setError] = React.useState<string | null>(null);
    const [activeBlockId, setActiveBlockId] = React.useState<string | null>(null);
    const [collapsedBranches, setCollapsedBranches] = React.useState<Record<string, boolean>>({});
    const [draggedBlockId, setDraggedBlockId] = React.useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = React.useState<string | null>(null);
    const [dropPosition, setDropPosition] = React.useState<'before' | 'after' | null>(null);
    const [uploadingByBlock, setUploadingByBlock] = React.useState<Record<string, boolean>>({});
    const [uploadErrorByBlock, setUploadErrorByBlock] = React.useState<Record<string, string | null>>({});

    React.useEffect(() => {
        if (slugTouched) return;
        setSlug(normalizeSlug(name));
    }, [name, slugTouched]);

    React.useEffect(() => {
        if (!articleId) {
            setError('Không tìm thấy article id để mở editor.');
            setLoading(false);
            return;
        }

        let cancelled = false;

        async function run() {
            setLoading(true);
            setError(null);

            try {
                const [nextArticle, nextComponents, nextTags] = await Promise.all([
                    adminGetArticleById(articleId),
                    adminListComponents(true),
                    adminListTags(),
                ]);

                if (cancelled) return;

                const nextBlocks = normalizeBlocks(nextArticle);
                setArticle(nextArticle);
                setComponents(nextComponents);
                setTags(nextTags);
                setSelectedTagIds((nextArticle.tags ?? []).map((tag) => tag.id));
                setName(nextArticle.name);
                setSlug(nextArticle.slug);
                setDescription(readDescriptionFromBlocks(nextBlocks));
                setBlocks(nextBlocks);
                setContentVersion(nextArticle.contentVersion ?? ARTICLE_CONTENT_SCHEMA_VERSION);
                setSlugTouched(false);
                setActiveBlockId(nextBlocks[0]?.id ?? null);
                setCollapsedBranches({});
                setUploadingByBlock({});
                setUploadErrorByBlock({});
            } catch (nextError) {
                if (!cancelled) {
                    setError(nextError instanceof Error ? nextError.message : 'Không tải được dữ liệu editor.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void run();
        return () => {
            cancelled = true;
        };
    }, [articleId]);

    const definitionMap = React.useMemo(() => {
        const entries = new Map<string, DictionaryComponentDefinitionResponse>();
        for (const definition of components) {
            entries.set(definition.code.toLowerCase(), definition);
        }
        return entries;
    }, [components]);

    const previewBlocks = React.useMemo(
        () => buildPreviewBlocks(blocks, name.trim(), description.trim()),
        [blocks, description, name]
    );
    const previewJson = stringifyArticleContent({ version: contentVersion || ARTICLE_CONTENT_SCHEMA_VERSION, blocks: previewBlocks });
    const previewModel = buildArticlePreview(previewJson, name || 'Nội dung bài viết');
    const tocGroups = React.useMemo(
        () => buildTocGroupsFromBlocks(blocks, name || previewModel.sections[0]?.heading || ''),
        [blocks, name, previewModel.sections]
    );

    React.useEffect(() => {
        setActiveBlockId((current) => {
            if (current && blocks.some((block) => block.id === current)) return current;
            return blocks[0]?.id ?? null;
        });
    }, [blocks]);

    const hiddenBlockIds = React.useMemo(() => {
        const hidden = new Set<string>();
        const collapsedLevelStack: number[] = [];

        for (const block of blocks) {
            const level = getBlockLevel(block);
            while (collapsedLevelStack.length > 0 && level <= collapsedLevelStack[collapsedLevelStack.length - 1]) {
                collapsedLevelStack.pop();
            }

            if (collapsedLevelStack.length > 0) {
                hidden.add(block.id);
            }

            if (collapsedBranches[block.id]) {
                collapsedLevelStack.push(level);
            }
        }
        return hidden;
    }, [blocks, collapsedBranches]);

    function branchHasChildren(index: number): boolean {
        const current = blocks[index];
        if (!current) return false;
        const currentLevel = getBlockLevel(current);
        for (let i = index + 1; i < blocks.length; i += 1) {
            const nextLevel = getBlockLevel(blocks[i]);
            if (nextLevel <= currentLevel) {
                return false;
            }
            return true;
        }
        return false;
    }

    async function refreshArticle() {
        if (!articleId) return;
        const nextArticle = await adminGetArticleById(articleId);
        const nextBlocks = normalizeBlocks(nextArticle);
        setArticle(nextArticle);
        setSelectedTagIds((nextArticle.tags ?? []).map((tag) => tag.id));
        setName(nextArticle.name);
        setSlug(nextArticle.slug);
        setDescription(readDescriptionFromBlocks(nextBlocks));
        setBlocks(nextBlocks);
        setContentVersion(nextArticle.contentVersion ?? ARTICLE_CONTENT_SCHEMA_VERSION);
        setCollapsedBranches({});
        setUploadingByBlock({});
        setUploadErrorByBlock({});
    }

    async function persistArticle(action: 'save' | 'publish' | 'unpublish') {
        if (!articleId) return;

        const trimmedName = name.trim();
        const trimmedSlug = slug.trim();

        if (!trimmedName || !trimmedSlug) {
            setError('Tên bài viết và slug không được để trống.');
            return;
        }

        const nextJson = stringifyArticleContent({ version: contentVersion || ARTICLE_CONTENT_SCHEMA_VERSION, blocks });
        const previewContentJson = stringifyArticleContent({ version: contentVersion || ARTICLE_CONTENT_SCHEMA_VERSION, blocks: previewBlocks });

        setBusyAction(action);
        setError(null);

        try {
            await adminUpdateArticle(articleId, {
                name: trimmedName,
                slug: trimmedSlug,
                contentJson: nextJson,
                contentVersion: contentVersion || ARTICLE_CONTENT_SCHEMA_VERSION,
                contentMarkdown: buildMarkdownFromArticleContent(trimmedName, previewContentJson),
            });
            await adminAssignArticleTags(articleId, selectedTagIds);

            if (action === 'publish') {
                await adminPublishArticle(articleId);
            }

            if (action === 'unpublish') {
                await adminUnpublishArticle(articleId);
            }

            await refreshArticle();
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Không lưu được bài viết.');
        } finally {
            setBusyAction('');
        }
    }

    function toggleTag(tagId: string) {
        setSelectedTagIds((current) =>
            current.includes(tagId) ? current.filter((item) => item !== tagId) : [...current, tagId]
        );
    }

    function updateBlockField(blockId: string, key: string, value: string) {
        setBlocks((current) =>
            current.map((block) => {
                if (block.id !== blockId) return block;
                const nextData = { ...block.data, [key]: value };
                let nextLevel = block.level;
                if (key === 'headingLevel' || key === 'rank') {
                    const n = Number(value);
                    if (Number.isFinite(n)) {
                        nextLevel = clampBlockLevel(n, block.level);
                    }
                }
                return { ...block, data: nextData, level: nextLevel };
            })
        );
    }

    function updateBlockLevel(blockId: string, direction: -1 | 1) {
        setBlocks((current) =>
            current.map((block) =>
                block.id === blockId
                    ? {
                          ...block,
                          level: clampBlockLevel((block.level ?? 1) + direction, 1),
                      }
                    : block
            )
        );
    }

    function moveBlock(blockId: string, direction: -1 | 1) {
        setBlocks((current) => {
            const index = current.findIndex((block) => block.id === blockId);
            const nextIndex = index + direction;
            if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;

            const next = [...current];
            const [item] = next.splice(index, 1);
            next.splice(nextIndex, 0, item);
            return next;
        });
    }

    function removeBlock(blockId: string) {
        setBlocks((current) => current.filter((block) => block.id !== blockId));
        setCollapsedBranches((current) => {
            const next = { ...current };
            delete next[blockId];
            return next;
        });
        setUploadErrorByBlock((current) => {
            const next = { ...current };
            delete next[blockId];
            return next;
        });
        setUploadingByBlock((current) => {
            const next = { ...current };
            delete next[blockId];
            return next;
        });
    }

    function toggleCollapseBranch(blockId: string) {
        setCollapsedBranches((current) => ({
            ...current,
            [blockId]: !current[blockId],
        }));
    }

    function reorderBlocksByDrag(sourceId: string, targetId: string, position: 'before' | 'after') {
        setBlocks((current) => {
            const sourceIndex = current.findIndex((block) => block.id === sourceId);
            const targetIndex = current.findIndex((block) => block.id === targetId);
            if (sourceIndex < 0 || targetIndex < 0) return current;
            if (sourceIndex === targetIndex) return current;

            const next = [...current];
            const [moved] = next.splice(sourceIndex, 1);
            const adjustedTarget = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
            const insertIndex = position === 'after' ? adjustedTarget + 1 : adjustedTarget;
            next.splice(insertIndex, 0, moved);
            return next;
        });
    }

    function handleDragStart(event: React.DragEvent<HTMLElement>, blockId: string) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', blockId);
        setDraggedBlockId(blockId);
    }

    function handleDragOver(event: React.DragEvent<HTMLElement>, blockId: string) {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const isAfter = event.clientY > rect.top + rect.height / 2;
        setDropTargetId(blockId);
        setDropPosition(isAfter ? 'after' : 'before');
        event.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(event: React.DragEvent<HTMLElement>, blockId: string) {
        event.preventDefault();
        const sourceId = draggedBlockId || event.dataTransfer.getData('text/plain');
        if (!sourceId) return;
        const position = dropTargetId === blockId && dropPosition ? dropPosition : 'after';
        reorderBlocksByDrag(sourceId, blockId, position);
        setDraggedBlockId(null);
        setDropTargetId(null);
        setDropPosition(null);
    }

    function handleDragEnd() {
        setDraggedBlockId(null);
        setDropTargetId(null);
        setDropPosition(null);
    }

    function addBlock(definition: DictionaryComponentDefinitionResponse) {
        const nextBlock = buildBlockFromDefinition(definition);
        setBlocks((current) => [...current, nextBlock]);
        setActiveBlockId(nextBlock.id);
    }

    async function uploadInfographicImage(blockId: string, file: File) {
        if (!file) return;
        setUploadingByBlock((current) => ({ ...current, [blockId]: true }));
        setUploadErrorByBlock((current) => ({ ...current, [blockId]: null }));
        try {
            const uploaded = await adminUploadDictionaryAsset(file);
            setBlocks((current) =>
                current.map((block) =>
                    block.id === blockId
                        ? {
                              ...block,
                              data: {
                                  ...block.data,
                                  imageUrl: uploaded.url,
                                  assetId: uploaded.assetId,
                              },
                          }
                        : block
                )
            );
        } catch (nextError) {
            setUploadErrorByBlock((current) => ({
                ...current,
                [blockId]: nextError instanceof Error ? nextError.message : 'Tải ảnh thất bại.',
            }));
        } finally {
            setUploadingByBlock((current) => ({ ...current, [blockId]: false }));
        }
    }

    if (loading) {
        return (
            <BaseAdminLayout>
                <div className={styles.page}>
                    <section className={styles.hero}>
                        <h1>Trình soạn thảo bài viết</h1>
                        <p>Hệ thống đang nạp bài viết, component và nhãn để mở màn chỉnh sửa nội dung.</p>
                    </section>
                </div>
            </BaseAdminLayout>
        );
    }

    return (
        <BaseAdminLayout>
            <div className={styles.page}>
                <section className={styles.hero}>
                    <h1>Trình soạn thảo bài viết</h1>
                    <p>
                        Màn này tập trung vào hai phần chính là <strong>Chỉnh sửa</strong> và <strong>Xem trước</strong>.
                        Bạn có thể cập nhật thông tin bài viết, thêm component, sắp xếp nội dung và theo dõi cách bài viết
                        hiển thị ngay bên cạnh.
                    </p>
                </section>

                <section className={styles.toolbar}>
                    <div className={styles.statusGroup}>
                        <span className={styles.pill}>
                            Trạng thái hiện tại: {article?.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                        </span>
                    </div>

                    <div className={styles.actionGroup}>
                        <button
                            type="button"
                            className={styles.ghostButton}
                            disabled={busyAction !== ''}
                            onClick={() => void persistArticle('save')}
                        >
                            {busyAction === 'save' ? 'Đang lưu...' : 'Lưu nháp'}
                        </button>
                        <button
                            type="button"
                            className={styles.successButton}
                            disabled={busyAction !== ''}
                            onClick={() => void persistArticle(article?.isPublished ? 'unpublish' : 'publish')}
                        >
                            {busyAction === 'publish'
                                ? 'Đang xuất bản...'
                                : busyAction === 'unpublish'
                                  ? 'Đang gỡ xuất bản...'
                                  : article?.isPublished
                                    ? 'Gỡ xuất bản'
                                    : 'Xuất bản'}
                        </button>
                    </div>
                </section>

                {error && <div className={styles.alertBox}>{error}</div>}

                <details className={styles.section} open>
                    <summary>
                        <div className={styles.summaryMain}>
                            <h2>Chỉnh sửa</h2>
                            <p>
                                Khu này chỉ hiển thị các component ở dạng rất đơn giản: tên component và các thuộc tính có
                                thể nhập. Ý tưởng là editor tập trung vào dữ liệu đầu vào thay vì nhìn giao diện quá phức
                                tạp.
                            </p>
                        </div>
                        <div className={styles.summarySide}>
                            <span className={styles.summaryBadge}>Biểu mẫu nhập liệu</span>
                            <span className={styles.summaryArrow}>⌄</span>
                        </div>
                    </summary>

                    <div className={styles.sectionBody}>
                        <div className={styles.substeps}>
                            <details className={styles.substep} open>
                                <summary>
                                    <div className={styles.substepMain}>
                                        <div>
                                            <h3>Đặt tên và gắn nhãn bài viết</h3>
                                            <p>
                                                Điền thông tin nền để bài viết có định danh rõ ràng trước khi chỉnh nội
                                                dung đã được nạp từ mẫu.
                                            </p>
                                        </div>
                                    </div>
                                    <span className={styles.substepArrow}>⌄</span>
                                </summary>

                                <div className={styles.substepBody}>
                                    <div className={styles.fieldGrid}>
                                        <div className={styles.field}>
                                            <label htmlFor="editor-name">Tên bài viết</label>
                                            <input
                                                id="editor-name"
                                                className={styles.input}
                                                value={name}
                                                onChange={(event) => setName(event.target.value)}
                                            />
                                        </div>

                                        <div className={styles.field}>
                                            <label htmlFor="editor-slug">Đường dẫn</label>
                                            <input
                                                id="editor-slug"
                                                className={styles.input}
                                                value={slug}
                                                onChange={(event) => {
                                                    setSlugTouched(true);
                                                    setSlug(event.target.value);
                                                }}
                                            />
                                        </div>

                                        <div className={styles.field}>
                                            <label>Nhãn bài viết</label>
                                            <div className={styles.miniTools}>
                                                {tags.map((tag) => {
                                                    const active = selectedTagIds.includes(tag.id);
                                                    return (
                                                        <button
                                                            key={tag.id}
                                                            type="button"
                                                            className={`${styles.miniButton} ${active ? styles.miniButtonAdd : ''}`}
                                                            onClick={() => toggleTag(tag.id)}
                                                        >
                                                            #{tag.name}
                                                        </button>
                                                    );
                                                })}
                                                {tags.length === 0 && (
                                                    <span className={styles.inlineHint}>Chưa có nhãn để gắn vào bài viết.</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.field}>
                                            <label htmlFor="editor-description">Mô tả ngắn</label>
                                            <textarea
                                                id="editor-description"
                                                className={styles.textarea}
                                                value={description}
                                                onChange={(event) => setDescription(event.target.value)}
                                                placeholder="Tổng quan ngắn sẽ được đồng bộ vào đoạn dẫn mở đầu."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </details>
                        </div>

                        <div className={styles.editGrid}>
                            <section className={styles.panel}>
                                <div className={styles.panelHead}>
                                    <h3>Kho component</h3>
                                    <p>Thêm nhanh các component cần dùng cho bài viết.</p>
                                </div>

                                <div className={styles.panelBody}>
                                    <div className={styles.miniTools}>
                                        {components.map((definition) => (
                                            <button
                                                key={definition.id}
                                                type="button"
                                                className={`${styles.miniButton} ${styles.miniButtonAdd}`}
                                                onClick={() => addBlock(definition)}
                                            >
                                                + Thêm {definition.name}
                                            </button>
                                        ))}
                                        {components.length === 0 && (
                                            <span className={styles.inlineHint}>Chưa có component đang hoạt động để thêm.</span>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className={styles.panel}>
                                <div className={styles.panelHead}>
                                    <h3>Danh sách component trong bài viết</h3>
                                    <p>
                                        Mỗi component chỉ hiện phần tên và các thuộc tính nhập liệu để việc chỉnh nội dung
                                        được gọn và dễ theo dõi.
                                    </p>
                                </div>

                                <div className={styles.panelBody}>
                                    <div className={styles.componentList}>
                                        {blocks.map((block, index) => {
                                            if (hiddenBlockIds.has(block.id)) {
                                                return null;
                                            }
                                            const definition = definitionMap.get(block.componentCode.toLowerCase());
                                            const fields = parseSchemaFields(definition?.schemaJson, block);
                                            const isActive = activeBlockId === block.id;
                                            const level = getBlockLevel(block);
                                            const hasChildren = branchHasChildren(index);
                                            const isCollapsed = !!collapsedBranches[block.id];
                                            const isDragging = draggedBlockId === block.id;
                                            const showDropBefore = dropTargetId === block.id && dropPosition === 'before';
                                            const showDropAfter = dropTargetId === block.id && dropPosition === 'after';
                                            const isInfographicBlock = isInfographicLikeBlock(block);
                                            const imagePreviewUrl = asString(
                                                block.data.imageUrl ?? block.data.url ?? block.data.src
                                            ).trim();

                                            return (
                                                <details
                                                    key={block.id}
                                                    className={`${styles.componentItem} ${isActive ? styles.componentItemActive : ''} ${isDragging ? styles.componentItemDragging : ''}`}
                                                    open={isActive}
                                                    draggable
                                                    onDragStart={(event) => handleDragStart(event, block.id)}
                                                    onDragOver={(event) => handleDragOver(event, block.id)}
                                                    onDrop={(event) => handleDrop(event, block.id)}
                                                    onDragEnd={handleDragEnd}
                                                    style={{ marginLeft: `${(level - 1) * 18}px` }}
                                                >
                                                    {showDropBefore && <div className={styles.dropIndicatorTop} />}
                                                    <summary
                                                        className={styles.componentSummary}
                                                        onClick={() => setActiveBlockId(block.id)}
                                                    >
                                                        <div className={styles.componentSummaryMain}>
                                                            <span className={styles.dragHandle} aria-hidden>⋮⋮</span>
                                                            <div className={styles.componentName}>
                                                                {block.name || definition?.name || block.componentCode}
                                                            </div>
                                                            <div className={styles.componentCode}>{block.componentCode}</div>
                                                            <div className={styles.componentLevel}>Cấp {level}</div>
                                                        </div>
                                                        <div className={styles.componentSummaryActions}>
                                                            {hasChildren && (
                                                                <button
                                                                    type="button"
                                                                    className={styles.branchToggleButton}
                                                                    onClick={(event) => {
                                                                        event.preventDefault();
                                                                        event.stopPropagation();
                                                                        toggleCollapseBranch(block.id);
                                                                    }}
                                                                >
                                                                    {isCollapsed ? 'Mở nhánh con' : 'Thu nhánh con'}
                                                                </button>
                                                            )}
                                                            <span className={styles.componentArrow}>⌄</span>
                                                        </div>
                                                    </summary>

                                                    <div className={styles.componentBody}>
                                                        <div className={styles.fieldGrid}>
                                                            {fields.map((field) => {
                                                                const value =
                                                                    field.type === 'select'
                                                                        ? coerceSelectFieldValue(block.data[field.key], field.options)
                                                                        : asString(block.data[field.key]);

                                                                return (
                                                                    <div key={`${block.id}-${field.key}`} className={styles.field}>
                                                                        <label>{field.label}</label>
                                                                        {field.type === 'select' ? (
                                                                            <select
                                                                                className={styles.select}
                                                                                value={value}
                                                                                onChange={(event) =>
                                                                                    updateBlockField(
                                                                                        block.id,
                                                                                        field.key,
                                                                                        event.target.value
                                                                                    )
                                                                                }
                                                                            >
                                                                                <option value="">Chọn giá trị</option>
                                                                                {field.options.map((option) => (
                                                                                    <option key={option} value={option}>
                                                                                        {option}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                        ) : field.type === 'textarea' ? (
                                                                            <textarea
                                                                                className={styles.textarea}
                                                                                value={value}
                                                                                onChange={(event) =>
                                                                                    updateBlockField(
                                                                                        block.id,
                                                                                        field.key,
                                                                                        event.target.value
                                                                                    )
                                                                                }
                                                                            />
                                                                        ) : (
                                                                            <input
                                                                                className={styles.input}
                                                                                value={value}
                                                                                onChange={(event) =>
                                                                                    updateBlockField(
                                                                                        block.id,
                                                                                        field.key,
                                                                                        event.target.value
                                                                                    )
                                                                                }
                                                                            />
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {isInfographicBlock && (
                                                            <div className={styles.inlineUpload}>
                                                                <label className={styles.uploadLabel}>
                                                                    Upload ảnh infographic
                                                                    <input
                                                                        type="file"
                                                                        accept="image/png,image/jpeg,image/webp,image/gif"
                                                                        className={styles.fileInput}
                                                                        onChange={(event) => {
                                                                            const file = event.currentTarget.files?.[0];
                                                                            if (file) {
                                                                                void uploadInfographicImage(block.id, file);
                                                                            }
                                                                            event.currentTarget.value = '';
                                                                        }}
                                                                    />
                                                                </label>
                                                                {uploadingByBlock[block.id] && (
                                                                    <p className={styles.inlineHint}>Đang tải ảnh...</p>
                                                                )}
                                                                {uploadErrorByBlock[block.id] && (
                                                                    <p className={styles.uploadError}>{uploadErrorByBlock[block.id]}</p>
                                                                )}
                                                                {imagePreviewUrl && (
                                                                    <div className={styles.uploadPreview}>
                                                                        {/* eslint-disable-next-line @next/next/no-img-element -- admin preview allows external URL */}
                                                                        <img src={imagePreviewUrl} alt="Preview infographic" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className={styles.miniTools}>
                                                            <button
                                                                type="button"
                                                                className={styles.miniButton}
                                                                onClick={() => updateBlockLevel(block.id, -1)}
                                                                disabled={level <= 1}
                                                            >
                                                                Giảm cấp
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className={styles.miniButton}
                                                                onClick={() => updateBlockLevel(block.id, 1)}
                                                                disabled={level >= 3}
                                                            >
                                                                Tăng cấp
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className={styles.miniButton}
                                                                onClick={() => moveBlock(block.id, -1)}
                                                                disabled={index === 0}
                                                            >
                                                                Di chuyển lên
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className={styles.miniButton}
                                                                onClick={() => moveBlock(block.id, 1)}
                                                                disabled={index === blocks.length - 1}
                                                            >
                                                                Di chuyển xuống
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className={styles.miniButton}
                                                                onClick={() => removeBlock(block.id)}
                                                            >
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {showDropAfter && <div className={styles.dropIndicatorBottom} />}
                                                </details>
                                            );
                                        })}

                                        {blocks.length === 0 && (
                                            <p className={styles.inlineHint}>Bài viết này chưa có component nào.</p>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </details>

                <details className={styles.section} open>
                    <summary>
                        <div className={styles.summaryMain}>
                            <h2>Xem trước</h2>
                            <p>
                                Khu này hiển thị trước bài viết theo bố cục đọc thực tế trên website để bạn đối chiếu nội
                                dung và cấu trúc trong lúc biên tập.
                            </p>
                        </div>
                        <div className={styles.summarySide}>
                            <span className={styles.summaryBadge}>Góc nhìn học viên</span>
                            <span className={styles.summaryArrow}>⌄</span>
                        </div>
                    </summary>

                    <div className={styles.sectionBody}>
                        <div className={styles.previewGrid}>
                            <section className={styles.studentFrame}>
                                <div className={styles.studentTopbar}>
                                    <strong>Bài viết hiển thị kiểu cuộn dọc</strong>
                                    <span>Trang bài viết người học sẽ đọc</span>
                                </div>

                                <article className={styles.studentArticle}>
                                    <h1 id={tocGroups[0]?.id || 'preview-root'}>{name || 'Bài viết chưa đặt tên'}</h1>
                                    {(description.trim() || previewModel.lead) && (
                                        <p className={styles.lead}>{description.trim() || previewModel.lead}</p>
                                    )}

                                    {blocks.map((block) => {
                                        if (isHeadingLikeBlock(block)) {
                                            const heading = getHeadingText(block);
                                            const headingLevel = resolveHeadingLevel(block);
                                            const headingId = `preview-heading-${block.id}`;
                                            return (
                                                <React.Fragment key={block.id}>
                                                    {headingLevel === 1 ? (
                                                        <h2 id={headingId}>{heading}</h2>
                                                    ) : headingLevel === 2 ? (
                                                        <h3 id={headingId}>{heading}</h3>
                                                    ) : (
                                                        <h4 id={headingId}>{heading}</h4>
                                                    )}
                                                </React.Fragment>
                                            );
                                        }

                                        if (isWarningLikeBlock(block)) {
                                            const items = extractWarningItems(block);
                                            return (
                                                <div key={block.id} className={styles.warningCard}>
                                                    <div className={styles.warningHead}>Cảnh báo y khoa</div>
                                                    <div className={styles.warningBody}>
                                                        <h3>{getWarningTitle(block)}</h3>
                                                        <ul>
                                                            {items.map((item) => (
                                                                <li key={`${block.id}-${item}`}>{item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        if (isMediaLikeBlock(block)) {
                                            const imageUrl = getBlockImageUrl(block);
                                            if (imageUrl && !isVideoLikeUrl(imageUrl)) {
                                                const caption = getImageFigureCaption(block, imageUrl);
                                                return (
                                                    <figure key={block.id} className={`${styles.imageView} ${styles.imageViewWithPhoto}`}>
                                                        {/* eslint-disable-next-line @next/next/no-img-element -- preview may be Supabase or external URL */}
                                                        <img
                                                            className={styles.imageViewPhoto}
                                                            src={imageUrl}
                                                            alt={caption}
                                                        />
                                                        <figcaption className={styles.imageCaption}>{caption}</figcaption>
                                                    </figure>
                                                );
                                            }
                                            return (
                                                <div key={block.id} className={styles.imageView}>
                                                    <div className={styles.imageCaption}>{getMediaCaption(block)}</div>
                                                </div>
                                            );
                                        }

                                        const paragraphs = extractBlockParagraphs(block);
                                        return (
                                            <React.Fragment key={block.id}>
                                                {paragraphs.map((paragraph, paragraphIndex) => (
                                                    <p key={`${block.id}-${paragraphIndex}`}>{paragraph}</p>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}
                                </article>
                            </section>

                            <aside className={styles.previewSide}>
                                <section className={styles.metaCard}>
                                    <h3>Mục lục bài viết</h3>
                                    {tocGroups.length === 0 ? (
                                        <p className={styles.inlineHint}>Chưa có heading để hiển thị trong mục lục.</p>
                                    ) : (
                                        <ul className={styles.tocList}>
                                            {tocGroups.map((group) => (
                                                <li key={group.id}>
                                                    <a href={`#${group.id}`} className={styles.tocItem}>
                                                        {group.label}
                                                    </a>
                                                    {group.children.length > 0 && (
                                                        <ul>
                                                            {group.children.map((child) => (
                                                                <li
                                                                    key={child.id}
                                                                    className={
                                                                        child.level === 3 ? styles.tocSubitemDeep : undefined
                                                                    }
                                                                >
                                                                    <a href={`#${child.id}`} className={styles.tocSubitem}>
                                                                        {child.label}
                                                                    </a>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            </aside>
                        </div>
                    </div>
                </details>
            </div>
        </BaseAdminLayout>
    );
};
