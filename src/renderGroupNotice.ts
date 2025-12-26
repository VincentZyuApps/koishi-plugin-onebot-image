// renderGroupNotice.ts
import { Context } from 'koishi';
import { } from 'koishi-plugin-puppeteer';

import { IMAGE_STYLES, FONT_FILES, type ImageStyle, ImageType } from './type';
import { generateTimestamp, getGroupAvatarBase64, getFontBase64 } from './utils';
import { PaginatedNoticeResult, GroupNoticeMessageRaw, NoticeContextInfo, formatTimestamp, parseNoticeText } from './commandGroupNotice';

/**
 * 解析群公告内容为 HTML（用于图片渲染）
 */
function parseNoticeContentToHtml(text: string): string {
  if (!text) {
    return '<span class="empty-msg">[空公告]</span>';
  }

  // 先解析HTML实体
  let parsed = parseNoticeText(text);
  
  // 转义 HTML 特殊字符，保留换行
  parsed = parsed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

  return `<span class="notice-text">${parsed}</span>`;
}

/**
 * 获取公告图片URL
 * 根据文档：图片 URL 为 https://gdynamic.qpic.cn/gdynamic/{id}/0
 */
function getNoticeImageUrl(imageId: string): string {
  return `https://gdynamic.qpic.cn/gdynamic/${imageId}/0`;
}

/**
 * 生成公告列表的 HTML 内容
 */
const generateNoticeListItems = (records: GroupNoticeMessageRaw[], currentPage: number, pageSize: number, groupId: number) => {
  return records.map((record, index) => {
    const globalIndex = (currentPage - 1) * pageSize + index + 1;
    const contentHtml = parseNoticeContentToHtml(record.message.text);
    const timeStr = formatTimestamp(record.publish_time);
    const senderAvatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${record.sender_id}&s=640`;
    const imageCount = record.message.images?.length || 0;

    // 生成图片预览HTML
    let imagesHtml = '';
    if (record.message.images && record.message.images.length > 0) {
      const imageItems = record.message.images.slice(0, 3).map(img => {
        const imgUrl = getNoticeImageUrl(img.id);
        return `<img class="notice-image-preview" src="${imgUrl}" alt="公告图片" onerror="this.style.display='none';" />`;
      }).join('');
      imagesHtml = `<div class="notice-images">${imageItems}${imageCount > 3 ? `<span class="notice-image-more">+${imageCount - 3}</span>` : ''}</div>`;
    }
    if (record.message.images && record.message.images.length > 0) {
      const imageItems = record.message.images.slice(0, 3).map(img => {
        const imgUrl = getNoticeImageUrl(img.id);
        return `<img class="notice-image-preview" src="${imgUrl}" alt="公告图片" onerror="this.style.display='none';" />`;
      }).join('');
      imagesHtml = `<div class="notice-images">${imageItems}${imageCount > 3 ? `<span class="notice-image-more">+${imageCount - 3}</span>` : ''}</div>`;
    }

    return `
      <div class="notice-item">
        <div class="notice-column-1">
          <div class="notice-number">${globalIndex.toString().padStart(2, '0')}</div>
          <div class="notice-avatar">
            <img src="${senderAvatarUrl}" alt="头像" />
          </div>
        </div>
        <div class="notice-column-2">
          <div class="notice-sender">发布者</div>
          <div class="notice-sender-id"><span class="qq-label">QQ:</span> <span class="qq-number">${record.sender_id}</span></div>
        </div>
        <div class="notice-column-3">
          <div class="notice-content">${contentHtml}</div>
          ${imagesHtml}
          <div class="notice-meta">
            <span class="notice-time">⏰ ${timeStr}</span>
            ${imageCount > 0 ? `<span class="notice-image-count">🖼️ ${imageCount}张图</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
};

/**
 * 思源宋体样式的群公告 HTML 模板
 */
const getSourceHanSerifStyleNoticeHtmlStr = async (
  result: PaginatedNoticeResult,
  contextInfo: NoticeContextInfo,
  groupAvatarBase64: string,
  fontBase64: string,
  enableDarkMode: boolean
) => {
  const backgroundStyle = groupAvatarBase64
    ? `background-image: radial-gradient(circle at center, rgba(255,255,255,0.2), rgba(0,0,0,0.05)), url(data:image/jpeg;base64,${groupAvatarBase64}); background-size: cover; background-position: center center; background-repeat: no-repeat;`
    : 'background: linear-gradient(135deg, #667eea, #764ba2);';

  const timestamp = generateTimestamp();

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    ${fontBase64 ? `@font-face { font-family: 'SourceHanSerifSC'; src: url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype'); font-weight: normal; font-style: normal; font-display: swap; }` : ''}

    html, body { margin: 0; padding: 0; width: 100%; height: auto; min-height: 100vh; }
    body {
      font-family: ${fontBase64 ? "'SourceHanSerifSC'," : ''} -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      width: 850px;
      height: auto;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      ${backgroundStyle}
      background-repeat: no-repeat;
      position: relative;
      box-sizing: border-box;
      overflow: visible;
      color: #333;
      padding: 35px;
    }

    .card {
      width: 720px;
      height: auto;
      min-height: 400px;
      background: rgba(255, 255, 255, 0.35);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.6);
      position: relative;
      overflow: visible;
      display: flex;
      flex-direction: column;
      padding: 30px;
      box-sizing: border-box;
    }

    .group-header { display: flex; align-items: center; margin-bottom: 18px; padding: 16px; background: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.5); border-radius: 16px; }
    .group-avatar { width: 70px; height: 70px; border-radius: 50%; margin-right: 14px; border: 3px solid rgba(255,255,255,0.6); }
    .group-info { flex: 1; }
    .group-name { font-size: 26px; font-weight: 800; color: #111; margin-bottom: 4px; text-shadow: 0 1px 2px rgba(255,255,255,0.8); }
    .group-details { font-size: 16px; color: #444; line-height: 1.3; font-weight: 600; text-shadow: 0 1px 2px rgba(255,255,255,0.7); }

    .title { font-size: 36px; font-weight: 800; margin-bottom: 14px; color: #111; text-align: center; text-shadow: 0 2px 4px rgba(255,255,255,0.8); }
    .pagination-info { font-size: 15px; color: #555; text-align: center; margin-bottom: 14px; font-weight: 600; }

    .notice-list { width: 100%; display: flex; flex-direction: column; gap: 10px; }

    .notice-item { background: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.4); border-radius: 12px; padding: 14px; display: flex; align-items: flex-start; transition: all 0.3s ease; min-height: 80px; }
    .notice-item:hover { background: rgba(255,255,255,0.65); }

    .notice-column-1 { display: flex; flex-direction: row; align-items: center; margin-right: 12px; min-width: 90px; }
    .notice-avatar img { width: 55px; height: 55px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.6); }
    .notice-number { font-size: 20px; margin: 0 8px 0 0; font-weight: 800; color: #333; }

    .notice-column-2 { min-width: 100px; margin-right: 14px; }
    .notice-sender { font-size: 14px; color: #555; margin-bottom: 3px; font-weight: 600; }
    .notice-sender-id { font-size: 13px; font-weight: 600; }
    .qq-label { color: #555; font-weight: 600; }
    .qq-number { color: #111; font-family: 'Courier New', monospace; font-weight: bold; }

    .notice-column-3 { flex: 1; }
    .notice-content { font-size: 15px; color: #212121; line-height: 1.5; margin-bottom: 8px; word-break: break-all; white-space: pre-wrap; max-height: 120px; overflow: hidden; position: relative; font-weight: 500; }
    .notice-content::after { content: ''; position: absolute; bottom: 0; right: 0; width: 100%; height: 1.5em; background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.6)); pointer-events: none; }
    .notice-images { display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
    .notice-image-preview { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(0,0,0,0.1); }
    .notice-image-more { display: flex; align-items: center; justify-content: center; width: 60px; height: 60px; background: rgba(0,0,0,0.1); border-radius: 6px; font-size: 14px; color: #444; font-weight: 600; }
    .notice-meta { font-size: 12px; color: #555; display: flex; gap: 14px; flex-wrap: wrap; font-weight: 600; }
    .notice-time { color: #555; font-weight: 600; }
    .notice-image-count { color: #1e90ff; font-weight: bold; }

    .timestamp-watermark { position: fixed; top: 1.3px; left: 1.3px; font-size: 13px; color: rgba(128, 128, 128, 0.6); font-family: 'Courier New', monospace; z-index: 9999; pointer-events: none; text-shadow: 0 0 2px rgba(255, 255, 255, 0.8); }

    body.dark { color: #e0e0e0; }
    body.dark .card { background: rgba(20,20,20,0.4); box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.15); }
    body.dark .group-header { background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.15); }
    body.dark .group-name { color: #ffffff; }
    body.dark .group-details { color: #b0b0b0; }
    body.dark .title { color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.4); }
    body.dark .pagination-info { color: #aaa; }
    body.dark .notice-item { background: rgba(40,40,40,0.5); border-color: rgba(255,255,255,0.1); }
    body.dark .notice-item:hover { background: rgba(50,50,50,0.6); }
    body.dark .notice-content::after { background: linear-gradient(to bottom, transparent, rgba(40,40,40,0.8)); }
    body.dark .notice-number { color: #fff; }
    body.dark .notice-sender { color: #ddd; }
    body.dark .qq-label { color: #ccc; }
    body.dark .qq-number { color: #fff; }
    body.dark .notice-content { color: #fff; }
    body.dark .notice-image-preview { border-color: rgba(255,255,255,0.2); }
    body.dark .notice-image-more { background: rgba(255,255,255,0.1); color: #ddd; }
    body.dark .timestamp-watermark { color: rgba(160, 160, 160, 0.5); text-shadow: 0 0 2px rgba(0, 0, 0, 0.8); }
  </style>
</head>
<body class="${enableDarkMode ? 'dark' : ''}">
  <div class="timestamp-watermark">${timestamp}</div>
  <div class="card">
    <div class="group-header">
      <img class="group-avatar" src="data:image/jpeg;base64,${groupAvatarBase64}" alt="群头像" />
      <div class="group-info">
        <div class="group-name">${contextInfo.groupName}</div>
        <div class="group-details">群号: ${contextInfo.groupId} | 成员: ${contextInfo.memberCount}/${contextInfo.maxMemberCount}</div>
      </div>
    </div>
    <div class="title">📢 群公告列表</div>
    <div class="pagination-info">第${result.currentPage}/${result.totalPages}页 (共${result.totalCount}条公告)</div>
    <div class="notice-list">
      ${generateNoticeListItems(result.records, result.currentPage, result.pageSize, contextInfo.groupId)}
    </div>
  </div>
</body>
</html>`;
};

/**
 * 落霞孤鹜文楷样式的群公告 HTML 模板（金色传统中式风格）
 */
const getLXGWWenKaiStyleNoticeHtmlStr = async (
  result: PaginatedNoticeResult,
  contextInfo: NoticeContextInfo,
  groupAvatarBase64: string,
  fontBase64: string,
  enableDarkMode: boolean
) => {
  const timestamp = generateTimestamp();

  // 背景样式：群头像 + 白色半透明滤镜
  const backgroundStyle = groupAvatarBase64
    ? `background-image: linear-gradient(45deg, rgba(245,240,230,0.85), rgba(250,245,235,0.85)), url(data:image/jpeg;base64,${groupAvatarBase64}); background-size: cover; background-position: center center; background-repeat: no-repeat;`
    : `background: linear-gradient(45deg, #f5f0e6, #faf5eb);`;

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    ${fontBase64 ? `@font-face { font-family: 'LXGWWenKai'; src: url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype'); font-weight: normal; font-style: normal; font-display: swap; }` : ''}

    html, body { margin: 0; padding: 0; width: 100%; height: auto; min-height: 100vh; }
    body {
      font-family: ${fontBase64 ? "'LXGWWenKai'," : ''} -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      width: 850px;
      height: auto;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      ${backgroundStyle}
      position: relative;
      box-sizing: border-box;
      overflow: visible;
      color: #3a2f2a;
      padding: 35px;
    }

    body::before { content: ''; position: absolute; top: 16px; left: 16px; right: 16px; bottom: 16px; border: 3px solid #d4af37; border-radius: 20px; background: linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(184,134,11,0.06) 50%, rgba(212,175,55,0.12) 100%); box-shadow: inset 0 0 25px rgba(212,175,55,0.35), 0 0 35px rgba(212,175,55,0.25); z-index: 1; }
    body::after { content: '◆'; position: absolute; top: 30px; left: 30px; font-size: 26px; color: #d4af37; z-index: 2; text-shadow: 0 0 12px rgba(212,175,55,0.6); }

    .corner-decoration { position: absolute; font-size: 26px; color: #d4af37; z-index: 2; text-shadow: 0 0 12px rgba(212,175,55,0.6); }
    .corner-decoration.top-right { top: 30px; right: 30px; }
    .corner-decoration.bottom-left { bottom: 30px; left: 30px; }
    .corner-decoration.bottom-right { bottom: 30px; right: 30px; }

    .main-container {
      width: 720px;
      min-height: 400px;
      position: relative;
      z-index: 3;
      display: flex;
      flex-direction: column;
      padding: 32px 28px;
      box-sizing: border-box;
    }

    .group-header { display: flex; align-items: center; margin-bottom: 18px; padding: 16px; background: rgba(255,255,255,0.2); border: 1px solid rgba(212,175,55,0.4); border-radius: 16px; box-shadow: 0 4px 16px rgba(212,175,55,0.15); }
    .group-avatar { width: 64px; height: 64px; border-radius: 9%; margin-right: 14px; border: 3px solid #d4af37; box-shadow: 0 4px 12px rgba(212,175,55,0.3); }
    .group-info { flex: 1; }
    .group-name { font-size: 25px; font-weight: 800; color: #5d2e0c; margin-bottom: 4px; text-shadow: 1px 1px 2px rgba(139,69,19,0.3); }
    .group-details { font-size: 20px; color: #6b3a1a; line-height: 1.4; font-weight: 700; text-shadow: 1px 1px 2px rgba(139,69,19,0.2); }

    .title-section { text-align: center; margin-bottom: 14px; }
    .main-title { font-size: 46px; font-weight: 800; color: #5d2e0c; margin-bottom: 6px; text-shadow: 2px 2px 4px rgba(139,69,19,0.4); letter-spacing: 2px; }
    .pagination-info { font-size: 16px; color: #6b3a1a; text-align: center; margin-bottom: 14px; font-weight: 700; }

    .notice-list { width: 100%; display: flex; flex-direction: column; gap: 6px; }

    .notice-item { background: rgba(255,255,255,0.25); border: 1px solid rgba(212,175,55,0.4); border-radius: 12px; padding: 14px; display: flex; align-items: flex-start; box-shadow: 0 3px 10px rgba(0,0,0,0.08); transition: all 0.3s ease; backdrop-filter: blur(5px); min-height: 80px; }
    .notice-item:hover { transform: translateY(-1px); box-shadow: 0 5px 18px rgba(212,175,55,0.25); background: rgba(255,255,255,0.3); }

    .notice-column-1 { display: flex; flex-direction: row; align-items: center; margin-right: 14px; min-width: 90px; }
    .notice-avatar img { width: 55px; height: 55px; border-radius: 50%; border: 2px solid #d4af37; box-shadow: 0 2px 6px rgba(212,175,55,0.2); }
    .notice-number { font-size: 24px; margin: 0 10px 0 0; font-weight: 800; color: #5d2e0c; }

    .notice-column-2 { min-width: 100px; margin-right: 14px; }
    .notice-sender { font-size: 14px; color: #6b3a1a; font-weight: 700; margin-bottom: 3px; }
    .notice-sender-id { font-size: 13px; font-weight: 700; }
    .qq-label { color: #6b3a1a; font-weight: 700; }
    .qq-number { color: #2a1f1a; font-family: 'Courier New', monospace; font-weight: 800; }

    .notice-column-3 { flex: 1; }
    .notice-content { font-size: 15px; color: #2a1f1a; line-height: 1.5; margin-bottom: 8px; word-break: break-all; white-space: pre-wrap; max-height: 120px; overflow: hidden; position: relative; font-weight: 600; }
    .notice-content::after { content: ''; position: absolute; bottom: 0; right: 0; width: 100%; height: 1.5em; background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.3)); pointer-events: none; }
    .notice-item:hover .notice-content::after { background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.4)); }
    .notice-images { display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
    .notice-image-preview { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(212,175,55,0.3); }
    .notice-image-more { display: flex; align-items: center; justify-content: center; width: 60px; height: 60px; background: rgba(212,175,55,0.15); border-radius: 6px; font-size: 14px; color: #5d2e0c; font-weight: 700; }
    .notice-meta { font-size: 12px; color: #6b3a1a; display: flex; gap: 14px; flex-wrap: wrap; font-weight: 700; }
    .notice-time { color: #6b3a1a; font-weight: 700; }
    .notice-image-count { color: #5d2e0c; font-weight: 800; }

    .timestamp-watermark { position: fixed; top: 1.3px; left: 1.3px; font-size: 13px; color: rgba(139, 69, 19, 0.4); font-family: 'Courier New', monospace; z-index: 9999; pointer-events: none; text-shadow: 0 0 2px rgba(255, 255, 255, 0.8); }

    body.dark { background: linear-gradient(45deg, #2c2416, #3a2f1f); color: #e6d7c3; }
    body.dark::before { border-color: #b8860b; background: linear-gradient(135deg, rgba(184,134,11,0.18) 0%, rgba(139,69,19,0.12) 50%, rgba(184,134,11,0.18) 100%); box-shadow: inset 0 0 25px rgba(184,134,11,0.45), 0 0 35px rgba(184,134,11,0.35); }
    body.dark::after { color: #b8860b; text-shadow: 0 0 12px rgba(184,134,11,0.6); }
    body.dark .corner-decoration { color: #b8860b; text-shadow: 0 0 12px rgba(184,134,11,0.6); }
    body.dark .group-header { background: rgba(0,0,0,0.3); border-color: rgba(184,134,11,0.5); }
    body.dark .group-name { color: #daa520; text-shadow: 1px 1px 2px rgba(218,165,32,0.3); }
    body.dark .group-details { color: #cd853f; }
    body.dark .main-title { color: #daa520; text-shadow: 2px 2px 4px rgba(218,165,32,0.4); }
    body.dark .pagination-info { color: #cd853f; }
    body.dark .notice-item { background: rgba(0,0,0,0.35); border-color: rgba(184,134,11,0.5); }
    body.dark .notice-item:hover { box-shadow: 0 5px 18px rgba(184,134,11,0.35); background: rgba(0,0,0,0.4); }
    body.dark .notice-content::after { background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.4)); }
    body.dark .notice-item:hover .notice-content::after { background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.5)); }
    body.dark .notice-number { color: #daa520; }
    body.dark .notice-sender { color: #cd853f; }
    body.dark .qq-label { color: #cd853f; }
    body.dark .qq-number { color: #e6d7c3; }
    body.dark .notice-content { color: #e6d7c3; }
    body.dark .notice-image-preview { border-color: rgba(184,134,11,0.4); }
    body.dark .notice-image-more { background: rgba(184,134,11,0.2); color: #daa520; }
    body.dark .notice-meta { color: #cd853f; }
    body.dark .notice-time { color: #cd853f; }
    body.dark .notice-image-count { color: #daa520; }
    body.dark .timestamp-watermark { color: rgba(218, 165, 32, 0.4); text-shadow: 0 0 2px rgba(0, 0, 0, 0.8); }
  </style>
</head>
<body class="${enableDarkMode ? 'dark' : ''}">
  <div class="corner-decoration top-right">◆</div>
  <div class="corner-decoration bottom-left">◆</div>
  <div class="corner-decoration bottom-right">◆</div>
  <div class="main-container">
    <div class="group-header">
      <img class="group-avatar" src="data:image/jpeg;base64,${groupAvatarBase64}" alt="群头像" />
      <div class="group-info">
        <div class="group-name">${contextInfo.groupName}</div>
        <div class="group-details">群号: ${contextInfo.groupId} | 成员: ${contextInfo.memberCount}/${contextInfo.maxMemberCount}</div>
      </div>
    </div>
    <div class="title-section">
      <div class="main-title">「 群公告列表 」</div>
    </div>
    <div class="pagination-info">第${result.currentPage}/${result.totalPages}页 (共${result.totalCount}条公告)</div>
    <div class="notice-list">
      ${generateNoticeListItems(result.records, result.currentPage, result.pageSize, contextInfo.groupId)}
    </div>
  </div>
  <div class="timestamp-watermark">${timestamp}</div>
</body>
</html>`;
};

/**
 * 扁平简约样式的群公告 HTML 模板
 */
const getFlatMinimalStyleNoticeHtmlStr = async (
  result: PaginatedNoticeResult,
  contextInfo: NoticeContextInfo,
  groupAvatarBase64: string,
  fontBase64: string,
  enableDarkMode: boolean
) => {
  const timestamp = generateTimestamp();

  const colors = enableDarkMode ? {
    background: '#000000',
    cardBackground: '#1a1a1a',
    textPrimary: '#ffffff',
    textSecondary: '#b0b0b0',
    primary: '#00d4ff',
    border: '#333333',
    hover: '#2a2a2a',
  } : {
    background: '#f5f7fa',
    cardBackground: '#ffffff',
    textPrimary: '#2c3e50',
    textSecondary: '#6c757d',
    primary: '#007bff',
    border: '#dee2e6',
    hover: '#f8f9fa',
  };

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    ${fontBase64 ? `@font-face { font-family: 'CustomFont'; src: url('data:font/opentype;charset=utf-8;base64,${fontBase64}') format('opentype'); font-weight: normal; font-style: normal; font-display: swap; }` : ''}

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { margin: 0; padding: 0; width: 100%; height: auto; }

    body {
      font-family: ${fontBase64 ? "'CustomFont'," : ''} -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
      width: 850px;
      min-height: 100vh;
      background: ${colors.background};
      color: ${colors.textPrimary};
      padding: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .container { width: 100%; max-width: 720px; }

    .header {
      background: ${colors.cardBackground};
      border: 2px solid ${colors.border};
      border-radius: 20px;
      padding: 32px;
      margin-bottom: 24px;
      box-shadow: 0 4px 16px rgba(0,0,0,${enableDarkMode ? '0.3' : '0.08'});
    }

    .group-info-wrapper { display: flex; align-items: center; gap: 24px; margin-bottom: 24px; }
    .group-avatar { width: 90px; height: 90px; border-radius: 16px; object-fit: cover; border: 3px solid ${colors.primary}; }
    .group-details { flex: 1; }
    .group-name { font-size: 26px; font-weight: 800; color: ${colors.textPrimary}; margin-bottom: 8px; }
    .group-meta { font-size: 16px; color: ${colors.textSecondary}; font-weight: 600; }

    .title { font-size: 36px; font-weight: 800; color: ${colors.primary}; text-align: center; margin-bottom: 8px; }
    .pagination-info { font-size: 15px; color: ${colors.textSecondary}; text-align: center; font-weight: 600; }

    .notice-list { display: flex; flex-direction: column; gap: 12px; }

    .notice-item {
      background: ${colors.cardBackground};
      border: 2px solid ${colors.border};
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      transition: all 0.2s ease;
    }
    .notice-item:hover { border-color: ${colors.primary}; transform: translateY(-2px); }

    .notice-number { font-size: 24px; font-weight: 800; color: ${colors.primary}; min-width: 40px; }
    .notice-avatar img { width: 50px; height: 50px; border-radius: 50%; border: 2px solid ${colors.border}; }
    .notice-info { flex: 1; }
    .notice-sender-id { font-size: 14px; color: ${colors.textSecondary}; margin-bottom: 8px; font-weight: 600; }
    .notice-content { font-size: 15px; color: ${colors.textPrimary}; line-height: 1.6; margin-bottom: 8px; max-height: 100px; overflow: hidden; font-weight: 500; }
    .notice-images { display: flex; gap: 6px; margin-bottom: 8px; }
    .notice-image-preview { width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid ${colors.border}; }
    .notice-meta { font-size: 12px; color: ${colors.textSecondary}; display: flex; gap: 12px; font-weight: 600; }

    .timestamp-watermark { position: fixed; top: 1.3px; left: 1.3px; font-size: 12px; color: ${enableDarkMode ? 'rgba(160,160,160,0.4)' : 'rgba(100,100,100,0.4)'}; font-family: 'Courier New', monospace; z-index: 9999; }
  </style>
</head>
<body>
  <div class="timestamp-watermark">${timestamp}</div>
  <div class="container">
    <div class="header">
      <div class="group-info-wrapper">
        <img class="group-avatar" src="data:image/jpeg;base64,${groupAvatarBase64}" alt="群头像" />
        <div class="group-details">
          <div class="group-name">${contextInfo.groupName}</div>
          <div class="group-meta">群号: ${contextInfo.groupId} | 成员: ${contextInfo.memberCount}/${contextInfo.maxMemberCount}</div>
        </div>
      </div>
      <div class="title">📢 群公告列表</div>
      <div class="pagination-info">第${result.currentPage}/${result.totalPages}页 (共${result.totalCount}条公告)</div>
    </div>
    <div class="notice-list">
      ${result.records.map((record, index) => {
        const globalIndex = (result.currentPage - 1) * result.pageSize + index + 1;
        const contentHtml = parseNoticeContentToHtml(record.message.text);
        const timeStr = formatTimestamp(record.publish_time);
        const senderAvatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${record.sender_id}&s=640`;
        const imageCount = record.message.images?.length || 0;

        let imagesHtml = '';
        if (record.message.images && record.message.images.length > 0) {
          imagesHtml = `<div class="notice-images">${record.message.images.slice(0, 3).map(img => 
            `<img class="notice-image-preview" src="${getNoticeImageUrl(img.id)}" alt="图" onerror="this.style.display='none';" />`
          ).join('')}</div>`;
        }

        return `
          <div class="notice-item">
            <div class="notice-number">${globalIndex.toString().padStart(2, '0')}</div>
            <img class="notice-avatar" src="${senderAvatarUrl}" alt="头像" style="width:50px;height:50px;border-radius:50%;" />
            <div class="notice-info">
              <div class="notice-sender-id">发布者: ${record.sender_id}</div>
              <div class="notice-content">${contentHtml}</div>
              ${imagesHtml}
              <div class="notice-meta">
                <span>⏰ ${timeStr}</span>
                ${imageCount > 0 ? `<span>🖼️ ${imageCount}张图</span>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  </div>
</body>
</html>`;
};

/**
 * 渲染群公告列表图片
 */
export async function renderGroupNotice(
  ctx: Context,
  result: PaginatedNoticeResult,
  contextInfo: NoticeContextInfo,
  imageStyle: ImageStyle,
  enableDarkMode: boolean,
  imageType: ImageType,
  screenshotQuality: number
): Promise<string> {
  // 获取群头像的 base64 (传入群号，不是URL)
  const groupAvatarBase64 = await getGroupAvatarBase64(ctx, contextInfo.groupId.toString());

  // 获取字体文件的 base64
  const fontBase64 = await getFontBase64(ctx, imageStyle);

  // 根据样式选择模板
  let htmlStr: string;
  switch (imageStyle) {
    case IMAGE_STYLES.SOURCE_HAN_SERIF_SC:
      htmlStr = await getSourceHanSerifStyleNoticeHtmlStr(result, contextInfo, groupAvatarBase64, fontBase64, enableDarkMode);
      break;
    case IMAGE_STYLES.LXGW_WENKAI:
      htmlStr = await getLXGWWenKaiStyleNoticeHtmlStr(result, contextInfo, groupAvatarBase64, fontBase64, enableDarkMode);
      break;
    case IMAGE_STYLES.FLAT_MINIMAL:
      htmlStr = await getFlatMinimalStyleNoticeHtmlStr(result, contextInfo, groupAvatarBase64, fontBase64, enableDarkMode);
      break;
    default:
      htmlStr = await getSourceHanSerifStyleNoticeHtmlStr(result, contextInfo, groupAvatarBase64, fontBase64, enableDarkMode);
  }

  // 使用 Puppeteer 渲染
  const page = await ctx.puppeteer.page();
  
  // 使用 domcontentloaded 而不是 networkidle0，避免因外部图片加载失败导致超时
  // 设置较短的超时时间
  await page.setContent(htmlStr, { 
    waitUntil: 'domcontentloaded',
    timeout: 15000 
  });
  
  // 等待一小段时间让本地资源加载
  await new Promise(resolve => setTimeout(resolve, 500));

  // 获取内容实际高度
  const bodyHandle = await page.$('body');
  const boundingBox = await bodyHandle.boundingBox();
  const contentHeight = Math.ceil(boundingBox.height);
  const contentWidth = Math.ceil(boundingBox.width);

  // 设置视口大小
  await page.setViewport({
    width: contentWidth,
    height: contentHeight,
    deviceScaleFactor: 2
  });

  // 截图
  const screenshotOptions: any = {
    fullPage: true,
    type: imageType,
    encoding: 'base64'
  };
  if (imageType !== 'png') {
    screenshotOptions.quality = screenshotQuality;
  }

  const screenshot = await page.screenshot(screenshotOptions);
  await page.close();

  return screenshot as string;
}
