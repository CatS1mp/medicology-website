'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BaseAdminLayout } from '@/features/admin/components/layout/BaseAdminLayout';
import styles from './article-template-select.module.css';
import type { DictionaryArticleTemplateResponse } from '@/features/encyclopedia/api';
import { adminCreateArticle } from '@/shared/api/admin-dictionary';
import {
    ARTICLE_CONTENT_SCHEMA_VERSION,
    buildMarkdownFromArticleContent,
    parseArticleContentJson,
    stringifyArticleContent,
} from '@/shared/utils/article-content';

const EMPTY_TEMPLATE: DictionaryArticleTemplateResponse = {
    id: 'template-none',
    code: 'none',
    name: 'Không',
    description: 'Không có gì hết.',
    defaultContentJson: JSON.stringify({
        version: ARTICLE_CONTENT_SCHEMA_VERSION,
        blocks: [],
    }),
    isActive: true,
    createdAt: '2026-04-20T00:00:00',
    updatedAt: '2026-04-20T00:00:00',
};

function slugify(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function normalizeTemplateContent(raw?: string | null): string {
    return stringifyArticleContent(parseArticleContentJson(raw));
}

export const AdminArticleTemplateSelectScreen: React.FC = () => {
    const router = useRouter();
    const [selectedTemplateId, setSelectedTemplateId] = React.useState('');
    const [name, setName] = React.useState('');
    const [slug, setSlug] = React.useState('');
    const [slugTouched, setSlugTouched] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (slugTouched) return;
        setSlug(slugify(name));
    }, [name, slugTouched]);

    const selectedTemplate = selectedTemplateId === EMPTY_TEMPLATE.id ? EMPTY_TEMPLATE : null;

    const handleNextStep = async () => {
        const trimmedName = name.trim();
        const trimmedSlug = slug.trim();

        if (!trimmedName || !trimmedSlug) {
            setError('Vui lòng nhập tên bài viết và slug trước khi qua bước tiếp theo.');
            return;
        }

        if (!selectedTemplate) {
            setError('Vui lòng chọn template trước khi qua bước tiếp theo.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const contentJson = normalizeTemplateContent(selectedTemplate.defaultContentJson);
            const articleId = await adminCreateArticle({
                name: trimmedName,
                slug: trimmedSlug,
                contentJson,
                contentVersion: ARTICLE_CONTENT_SCHEMA_VERSION,
                contentMarkdown: buildMarkdownFromArticleContent(trimmedName, contentJson),
            });
            router.push(`/admin/dictionary/${articleId}/editor`);
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Không tạo được bài viết.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <BaseAdminLayout>
            <div className={styles.page}>
                <section className={styles.hero}>
                    <h1>Chọn mẫu bài viết</h1>
                    <p>
                        Template ở đây không được lưu vào article. Nó chỉ phục vụ mục đích thêm sẵn khung ban đầu trước khi
                        chuyển sang màn soạn thảo.
                    </p>
                </section>

                <section className={styles.shell}>
                    <div className={styles.panelHead}>
                        <h2>Khởi tạo bài viết mới</h2>
                        <p>Nhập tên bài viết trước, sau đó chọn khung khởi tạo để đi sang bước soạn thảo.</p>
                    </div>

                    <div className={styles.panelBody}>
                        <div className={styles.fieldGrid}>
                            <div className={styles.field}>
                                <label htmlFor="article-name">Tên bài viết</label>
                                <input
                                    id="article-name"
                                    className={styles.input}
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    placeholder="Ví dụ: Viêm phổi ở người lớn"
                                />
                            </div>
                            <div className={styles.field}>
                                <label htmlFor="article-slug">Slug</label>
                                <input
                                    id="article-slug"
                                    className={styles.input}
                                    value={slug}
                                    onChange={(event) => {
                                        setSlugTouched(true);
                                        setSlug(event.target.value);
                                    }}
                                    placeholder="viem-phoi-o-nguoi-lon"
                                />
                            </div>
                        </div>

                        {error && <div className={styles.alertBox}>{error}</div>}
                        {!error && (
                            <div className={styles.noteBox}>
                                Template không được lưu vào article. Chỉ khi sau này bạn lưu template riêng thì JSON mới thuộc về template đó.
                            </div>
                        )}
                    </div>
                </section>

                <section className={styles.shell} style={{ marginTop: 20 }}>
                    <div className={styles.panelHead}>
                        <h2>Chọn template</h2>
                        <p>Bấm trực tiếp vào card để chọn. Hiện tại chỉ có một lựa chọn khung trống.</p>
                    </div>

                    <div className={styles.panelBody}>
                        <div className={styles.templateGrid}>
                            <article
                                className={`${styles.templateCard} ${selectedTemplate ? styles.templateCardActive : ''}`}
                                onClick={() => setSelectedTemplateId(EMPTY_TEMPLATE.id)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        setSelectedTemplateId(EMPTY_TEMPLATE.id);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                            >
                                <div className={styles.templateVisual} />
                                <div className={styles.templateContent}>
                                    <h3>{EMPTY_TEMPLATE.name}</h3>
                                    <p>{EMPTY_TEMPLATE.description}</p>

                                    <div className={styles.templateMeta}>
                                        <span className={styles.miniPill}>Khung trống</span>
                                        <span className={styles.miniPill}>Không có gì hết</span>
                                    </div>

                                    <div className={styles.seed}>
                                        {selectedTemplate ? 'Đã chọn template này.' : 'Bấm vào card để chọn template này.'}
                                    </div>
                                </div>
                            </article>
                        </div>

                        <div className={styles.templateActions} style={{ marginTop: 18 }}>
                            <button
                                type="button"
                                className={styles.primaryButton}
                                onClick={() => void handleNextStep()}
                                disabled={submitting}
                            >
                                {submitting ? 'Đang chuyển bước...' : 'Qua bước tiếp theo'}
                            </button>
                        </div>

                        {selectedTemplate && (
                            <div className={styles.noteBox} style={{ marginTop: 18 }}>
                                Đang chọn template <strong>{selectedTemplate.name}</strong> cho bài viết{' '}
                                <strong>{name || '(chưa đặt tên)'}</strong>.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </BaseAdminLayout>
    );
};
