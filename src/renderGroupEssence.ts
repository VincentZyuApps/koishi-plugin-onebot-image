// renderGroupEssence.ts
import { Context } from 'koishi';
import { } from 'koishi-plugin-puppeteer';

import { IMAGE_STYLES, FONT_FILES, type ImageStyle, ImageType } from './type';
import { generateTimestamp, getGroupAvatarBase64, getFontBase64 } from './utils';
import { PaginatedEssenceResult, GroupEssenceMessageRaw, formatTimestamp } from './commandGroupEssence';

interface EssenceContextInfo {
  groupId: number;
  groupName: string;
  memberCount: number;
  maxMemberCount: number;
  groupAvatarUrl: string;
}

/**
 * 解析群精华消息内容为 HTML（用于图片渲染）
 * 支持回复消息段和图片的特殊渲染
 */
function parseEssenceContentToHtml(content: Array<{ type: string; data: Record<string, any> }>): string {
  if (!content || content.length === 0) {
    return '<span class="empty-msg">[空消息]</span>';
  }

  return content.map(item => {
    switch (item.type) {
      case 'text':
        // 转义 HTML 特殊字符，保留换行
        const text = (item.data.text || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br/>');
        return `<span class="msg-text">${text}</span>`;
      case 'image':
        // 图片预览，限制尺寸
        const imageUrl = item.data.url || '';
        if (imageUrl) {
          return `<span class="msg-image-wrapper"><img class="msg-image-preview" src="${imageUrl}" alt="图片" onerror="this.style.display='none';this.nextSibling.style.display='inline';" /><span class="msg-image-fallback" style="display:none;">[图片]</span></span>`;
        }
        return '<span class="msg-image-placeholder">[图片]</span>';
      case 'face':
        return `<span class="msg-face">[表情:${item.data.id || ''}]</span>`;
      case 'at':
        return `<span class="msg-at">@${item.data.qq || item.data.name || '某人'}</span>`;
      case 'reply':
        // 回复消息段，特殊样式，显示回复的用户ID
        const replyUserId = item.data.id || item.data.qq || '';
        return `<span class="msg-reply"><span class="reply-icon">↩</span><span class="reply-text">回复${replyUserId ? ` [${replyUserId}]` : '消息'}</span></span>`;
      case 'forward':
        return '<span class="msg-forward">[转发消息]</span>';
      case 'video':
        return '<span class="msg-video">[视频]</span>';
      case 'record':
        return '<span class="msg-record">[语音]</span>';
      case 'file':
        return '<span class="msg-file">[文件]</span>';
      default:
        return `<span class="msg-unknown">[${item.type}]</span>`;
    }
  }).join('');
}

/**
 * 生成精华消息列表的 HTML 内容
 */
const generateEssenceListItems = (records: GroupEssenceMessageRaw[], currentPage: number, pageSize: number) => {
  return records.map((record, index) => {
    const globalIndex = (currentPage - 1) * pageSize + index + 1;
    const contentHtml = parseEssenceContentToHtml(record.content);
    const timeStr = formatTimestamp(record.operator_time);
    const senderAvatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${record.sender_id}&s=640`;

    return `
      <div class="essence-item">
        <div class="essence-column-1">
          <div class="essence-number">${globalIndex.toString().padStart(2, '0')}</div>
          <div class="essence-avatar">
            <img src="${senderAvatarUrl}" alt="头像" />
          </div>
        </div>
        <div class="essence-column-2">
          <div class="essence-sender">${record.sender_nick || '未知'}</div>
          <div class="essence-sender-id"><span class="qq-label">QQ:</span> <span class="qq-number">${record.sender_id}</span></div>
        </div>
        <div class="essence-column-3">
          <div class="essence-content">${contentHtml}</div>
          <div class="essence-meta">
            <span class="essence-time">⏰ ${timeStr}</span>
            <span class="essence-operator">📌 ${record.operator_nick}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

/**
 * 思源宋体样式的群精华 HTML 模板
 */
const getSourceHanSerifSCStyleEssenceHtmlStr = async (
  result: PaginatedEssenceResult,
  contextInfo: EssenceContextInfo,
  groupAvatarBase64: string,
  fontBase64: string,
  enableDarkMode: boolean
) => {
  const backgroundStyle = groupAvatarBase64
    ? `background-image: radial-gradient(circle at center, rgba(255,255,255,0.15), rgba(0,0,0,0.1)), url(data:image/jpeg;base64,${groupAvatarBase64}); background-size: cover; background-position: center center; background-repeat: no-repeat;`
    : 'background: linear-gradient(135deg, #f8f9fa, #e9ecef);';

  const timestamp = generateTimestamp();

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    ${fontBase64 ? `@font-face { font-family: 'SourceHanSerifSC-Medium'; src: url('data:font/opentype;charset=utf-8;base64,${fontBase64}') format('opentype'); font-weight: normal; font-style: normal; font-display: swap; }` : ''}

    html, body { margin: 0; padding: 0; width: 100%; height: auto; min-height: 100vh; }
    body {
      font-family: ${fontBase64 ? "'SourceHanSerifSC-Medium'," : ''} -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.6);
      position: relative;
      overflow: visible;
      display: flex;
      flex-direction: column;
      padding: 32px;
      box-sizing: border-box;
    }

    .group-header { display: flex; align-items: center; margin-bottom: 20px; padding: 18px; background: rgba(255,255,255,0.3); border: 1px solid rgba(255,255,255,0.4); border-radius: 18px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .group-avatar { width: 75px; height: 75px; border-radius: 50%; margin-right: 16px; border: 3px solid rgba(255,255,255,0.6); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .group-info { flex: 1; }
    .group-name { font-size: 28px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    .group-details { font-size: 18px; color: #4a4a4a; line-height: 1.3; font-weight: 500; }

    .title { font-size: 40px; font-weight: 700; margin-bottom: 16px; color: #1a1a1a; text-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
    .pagination-info { font-size: 16px; color: #666; text-align: center; margin-bottom: 16px; }

    .essence-list { width: 100%; display: flex; flex-direction: column; gap: 12px; }

    .essence-item { background: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.5); border-radius: 14px; padding: 16px; display: flex; align-items: flex-start; box-shadow: 0 3px 10px rgba(0,0,0,0.08); transition: all 0.3s ease; backdrop-filter: blur(10px); min-height: 80px; }
    .essence-item:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.12); background: rgba(255,255,255,0.7); }

    .essence-column-1 { display: flex; flex-direction: row; align-items: center; margin-right: 15px; min-width: 100px; }
    .essence-avatar { margin-bottom: 4px; }
    .essence-avatar img { width: 60px; height: 60px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.8); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .essence-number { font-size: 22px; margin: 0 10px 0 0; font-weight: 700; color: #666; }

    .essence-column-2 { min-width: 120px; margin-right: 16px; }
    .essence-sender { font-size: 18px; color: #1a1a1a; font-weight: 600; margin-bottom: 4px; }
    .essence-sender-id { font-size: 14px; }
    .qq-label { color: #666; font-weight: 500; }
    .qq-number { color: #1a1a1a; font-weight: 600; font-family: 'Courier New', monospace; }

    .essence-column-3 { flex: 1; }
    .essence-content { font-size: 16px; color: #333; line-height: 1.5; margin-bottom: 8px; word-break: break-all; white-space: pre-wrap; max-height: 150px; overflow: hidden; position: relative; }
    .essence-content::after { content: ''; position: absolute; bottom: 0; right: 0; width: 100%; height: 1.5em; background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.9)); pointer-events: none; }
    .essence-item:hover .essence-content::after { background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.95)); }
    .essence-meta { font-size: 13px; color: #888; display: flex; gap: 16px; flex-wrap: wrap; }
    .essence-time { color: #666; }
    .essence-operator { color: #ff8c00; }

    /* 消息内容元素样式 */
    .msg-text { }
    .msg-reply { display: inline-flex; align-items: center; background: rgba(100,100,100,0.15); border-left: 3px solid #888; padding: 2px 8px; margin: 2px 4px 2px 0; border-radius: 0 6px 6px 0; font-size: 13px; color: #666; }
    .msg-reply .reply-icon { margin-right: 4px; font-size: 12px; }
    .msg-reply .reply-text { font-style: italic; }
    .msg-image-wrapper { display: inline-block; margin: 4px 4px 4px 0; vertical-align: middle; }
    .msg-image-preview { max-width: 78px; max-height: 78px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.1); object-fit: cover; vertical-align: middle; }
    .msg-image-placeholder, .msg-image-fallback { color: #888; font-style: italic; }
    .msg-at { color: #1e90ff; font-weight: 500; }
    .msg-face { color: #ff9800; }
    .msg-forward, .msg-video, .msg-record, .msg-file { color: #888; font-style: italic; background: rgba(0,0,0,0.05); padding: 1px 6px; border-radius: 4px; }
    .msg-unknown { color: #999; }
    .empty-msg { color: #999; font-style: italic; }

    .timestamp-watermark { position: fixed; top: 1.3px; left: 1.3px; font-size: 13px; color: rgba(128, 128, 128, 0.6); font-family: 'Courier New', monospace; z-index: 9999; pointer-events: none; text-shadow: 0 0 2px rgba(255, 255, 255, 0.8); }

    body.dark { color: #e0e0e0; }
    body.dark .card { background: rgba(20,20,20,0.4); box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.15); }
    body.dark .group-header { background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.15); }
    body.dark .group-name { color: #ffffff; }
    body.dark .group-details { color: #b0b0b0; }
    body.dark .title { color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.4); }
    body.dark .pagination-info { color: #aaa; }
    body.dark .essence-item { background: rgba(40,40,40,0.6); border-color: rgba(255,255,255,0.1); box-shadow: 0 3px 10px rgba(0,0,0,0.2); }
    body.dark .essence-item:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.3); background: rgba(50,50,50,0.7); }
    body.dark .essence-content::after { background: linear-gradient(to bottom, transparent, rgba(40,40,40,0.9)); }
    body.dark .essence-item:hover .essence-content::after { background: linear-gradient(to bottom, transparent, rgba(50,50,50,0.95)); }
    body.dark .essence-number { color: #a0a0a0; }
    body.dark .essence-sender { color: #ffffff; }
    body.dark .qq-label { color: #b0b0b0; }
    body.dark .qq-number { color: #ffffff; }
    body.dark .essence-content { color: #e0e0e0; }
    body.dark .essence-meta { color: #888; }
    body.dark .essence-time { color: #aaa; }
    body.dark .essence-operator { color: #ffa07a; }
    body.dark .msg-reply { background: rgba(150,150,150,0.2); border-left-color: #aaa; color: #bbb; }
    body.dark .msg-at { color: #4da6ff; }
    body.dark .msg-face { color: #ffb74d; }
    body.dark .msg-forward, body.dark .msg-video, body.dark .msg-record, body.dark .msg-file { background: rgba(255,255,255,0.1); color: #aaa; }
    body.dark .msg-image-preview { border-color: rgba(255,255,255,0.2); }
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
    <div class="title">📌 群精华消息</div>
    <div class="pagination-info">第${result.currentPage}/${result.totalPages}页 (共${result.totalCount}条精华)</div>
    <div class="essence-list">
      ${generateEssenceListItems(result.records, result.currentPage, result.pageSize)}
    </div>
  </div>
</body>
</html>`;
};

/**
 * 落霞孤鹜文楷样式的群精华 HTML 模板（金色传统中式风格）
 */
const getLXGWWenKaiStyleEssenceHtmlStr = async (
  result: PaginatedEssenceResult,
  contextInfo: EssenceContextInfo,
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
    .group-name { font-size: 25px; font-weight: bold; color: #8b4513; margin-bottom: 4px; text-shadow: 1px 1px 2px rgba(139,69,19,0.2); }
    .group-details { font-size: 20px; color: #a0522d; line-height: 1.4; font-weight: 500; }

    .title-section { text-align: center; margin-bottom: 14px; }
    .main-title { font-size: 46px; font-weight: bold; color: #8b4513; margin-bottom: 6px; text-shadow: 2px 2px 4px rgba(139,69,19,0.3); letter-spacing: 2px; }
    .pagination-info { font-size: 16px; color: #a0522d; text-align: center; margin-bottom: 14px; font-weight: 500; }

    .essence-list { width: 100%; display: flex; flex-direction: column; gap: 6px; }

    .essence-item { background: rgba(255,255,255,0.25); border: 1px solid rgba(212,175,55,0.4); border-radius: 12px; padding: 14px; display: flex; align-items: flex-start; box-shadow: 0 3px 10px rgba(0,0,0,0.08); transition: all 0.3s ease; backdrop-filter: blur(5px); min-height: 70px; }
    .essence-item:hover { transform: translateY(-1px); box-shadow: 0 5px 18px rgba(212,175,55,0.25); background: rgba(255,255,255,0.3); }

    .essence-column-1 { display: flex; flex-direction: row; align-items: center; margin-right: 14px; min-width: 90px; }
    .essence-avatar img { width: 55px; height: 55px; border-radius: 50%; border: 2px solid #d4af37; box-shadow: 0 2px 6px rgba(212,175,55,0.2); }
    .essence-number { font-size: 24px; margin: 0 10px 0 0; font-weight: bold; color: #8b4513; }

    .essence-column-2 { min-width: 110px; margin-right: 14px; }
    .essence-sender { font-size: 16px; color: #3a2f2a; font-weight: bold; margin-bottom: 3px; }
    .essence-sender-id { font-size: 13px; }
    .qq-label { color: #a0522d; font-weight: 500; }
    .qq-number { color: #3a2f2a; font-family: 'Courier New', monospace; font-weight: bold; }

    .essence-column-3 { flex: 1; }
    .essence-content { font-size: 15px; color: #3a2f2a; line-height: 1.5; margin-bottom: 6px; word-break: break-all; white-space: pre-wrap; max-height: 140px; overflow: hidden; position: relative; }
    .essence-content::after { content: ''; position: absolute; bottom: 0; right: 0; width: 100%; height: 1.5em; background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.3)); pointer-events: none; }
    .essence-item:hover .essence-content::after { background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.4)); }
    .essence-meta { font-size: 12px; color: #a0522d; display: flex; gap: 14px; flex-wrap: wrap; }
    .essence-time { color: #a0522d; }
    .essence-operator { color: #8b4513; font-weight: 500; }

    /* 消息内容元素样式 */
    .msg-text { }
    .msg-reply { display: inline-flex; align-items: center; background: rgba(212,175,55,0.15); border-left: 3px solid #d4af37; padding: 2px 8px; margin: 2px 4px 2px 0; border-radius: 0 6px 6px 0; font-size: 12px; color: #a0522d; }
    .msg-reply .reply-icon { margin-right: 4px; font-size: 11px; }
    .msg-reply .reply-text { font-style: italic; }
    .msg-image-wrapper { display: inline-block; margin: 4px 4px 4px 0; vertical-align: middle; }
    .msg-image-preview { max-width: 72px; max-height: 72px; border-radius: 6px; border: 1px solid rgba(212,175,55,0.3); object-fit: cover; vertical-align: middle; }
    .msg-image-placeholder, .msg-image-fallback { color: #a0522d; font-style: italic; }
    .msg-at { color: #8b4513; font-weight: bold; }
    .msg-face { color: #d4af37; }
    .msg-forward, .msg-video, .msg-record, .msg-file { color: #a0522d; font-style: italic; background: rgba(212,175,55,0.1); padding: 1px 6px; border-radius: 4px; }
    .msg-unknown { color: #8b7355; }
    .empty-msg { color: #8b7355; font-style: italic; }

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
    body.dark .essence-item { background: rgba(0,0,0,0.35); border-color: rgba(184,134,11,0.5); }
    body.dark .essence-item:hover { box-shadow: 0 5px 18px rgba(184,134,11,0.35); background: rgba(0,0,0,0.4); }
    body.dark .essence-content::after { background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.4)); }
    body.dark .essence-item:hover .essence-content::after { background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.5)); }
    body.dark .essence-number { color: #daa520; }
    body.dark .essence-sender { color: #e6d7c3; }
    body.dark .qq-label { color: #cd853f; }
    body.dark .qq-number { color: #e6d7c3; }
    body.dark .essence-content { color: #e6d7c3; }
    body.dark .essence-meta { color: #cd853f; }
    body.dark .essence-time { color: #cd853f; }
    body.dark .essence-operator { color: #daa520; }
    body.dark .msg-reply { background: rgba(184,134,11,0.2); border-left-color: #b8860b; color: #cd853f; }
    body.dark .msg-at { color: #daa520; }
    body.dark .msg-face { color: #b8860b; }
    body.dark .msg-forward, body.dark .msg-video, body.dark .msg-record, body.dark .msg-file { background: rgba(184,134,11,0.15); color: #cd853f; }
    body.dark .msg-image-preview { border-color: rgba(184,134,11,0.4); }
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
      <div class="main-title">「 群精华消息 」</div>
    </div>
    <div class="pagination-info">第${result.currentPage}/${result.totalPages}页 (共${result.totalCount}条精华)</div>
    <div class="essence-list">
      ${generateEssenceListItems(result.records, result.currentPage, result.pageSize)}
    </div>
  </div>
  <div class="timestamp-watermark">${timestamp}</div>
</body>
</html>`;
};

/**
 * 扁平简约样式的群精华 HTML 模板
 */
const getFlatMinimalStyleEssenceHtmlStr = async (
  result: PaginatedEssenceResult,
  contextInfo: EssenceContextInfo,
  groupAvatarBase64: string,
  fontBase64: string,
  enableDarkMode: boolean
) => {
  const timestamp = generateTimestamp();

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
      background: linear-gradient(180deg, #f5f7fa 0%, #c3cfe2 100%);
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
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: visible;
      display: flex;
      flex-direction: column;
      padding: 26px;
      box-sizing: border-box;
    }

    .group-header { display: flex; align-items: center; margin-bottom: 16px; padding: 14px; background: #f8f9fa; border-radius: 12px; }
    .group-avatar { width: 65px; height: 65px; border-radius: 50%; margin-right: 12px; border: 2px solid #e9ecef; }
    .group-info { flex: 1; }
    .group-name { font-size: 24px; font-weight: 600; color: #212529; margin-bottom: 2px; }
    .group-details { font-size: 14px; color: #6c757d; }

    .title { font-size: 32px; font-weight: 600; margin-bottom: 12px; color: #212529; text-align: center; }
    .pagination-info { font-size: 14px; color: #6c757d; text-align: center; margin-bottom: 12px; }

    .essence-list { width: 100%; display: flex; flex-direction: column; gap: 8px; }

    .essence-item { background: #f8f9fa; border-radius: 10px; padding: 12px; display: flex; align-items: flex-start; transition: background 0.2s ease; min-height: 65px; }
    .essence-item:hover { background: #e9ecef; }

    .essence-column-1 { display: flex; flex-direction: row; align-items: center; margin-right: 10px; min-width: 85px; }
    .essence-avatar img { width: 50px; height: 50px; border-radius: 50%; border: 1px solid #dee2e6; }
    .essence-number { font-size: 18px; margin: 0 8px 0 0; font-weight: 600; color: #adb5bd; }

    .essence-column-2 { min-width: 100px; margin-right: 12px; }
    .essence-sender { font-size: 15px; color: #212529; font-weight: 600; margin-bottom: 2px; }
    .essence-sender-id { font-size: 12px; }
    .qq-label { color: #6c757d; }
    .qq-number { color: #495057; font-family: 'Courier New', monospace; }

    .essence-column-3 { flex: 1; }
    .essence-content { font-size: 14px; color: #495057; line-height: 1.4; margin-bottom: 5px; word-break: break-all; white-space: pre-wrap; max-height: 130px; overflow: hidden; position: relative; }
    .essence-content::after { content: ''; position: absolute; bottom: 0; right: 0; width: 100%; height: 1.4em; background: linear-gradient(to bottom, transparent, rgba(248,249,250,0.95)); pointer-events: none; }
    .essence-item:hover .essence-content::after { background: linear-gradient(to bottom, transparent, rgba(233,236,239,0.95)); }
    .essence-meta { font-size: 11px; color: #adb5bd; display: flex; gap: 12px; flex-wrap: wrap; }
    .essence-time { color: #6c757d; }
    .essence-operator { color: #fd7e14; }

    /* 消息内容元素样式 */
    .msg-text { }
    .msg-reply { display: inline-flex; align-items: center; background: #e9ecef; border-left: 3px solid #adb5bd; padding: 2px 7px; margin: 2px 4px 2px 0; border-radius: 0 5px 5px 0; font-size: 11px; color: #6c757d; }
    .msg-reply .reply-icon { margin-right: 3px; font-size: 10px; }
    .msg-reply .reply-text { font-style: italic; }
    .msg-image-wrapper { display: inline-block; margin: 3px 4px 3px 0; vertical-align: middle; }
    .msg-image-preview { max-width: 65px; max-height: 65px; border-radius: 5px; border: 1px solid #dee2e6; object-fit: cover; vertical-align: middle; }
    .msg-image-placeholder, .msg-image-fallback { color: #adb5bd; font-style: italic; }
    .msg-at { color: #0d6efd; font-weight: 500; }
    .msg-face { color: #fd7e14; }
    .msg-forward, .msg-video, .msg-record, .msg-file { color: #6c757d; font-style: italic; background: #e9ecef; padding: 1px 5px; border-radius: 3px; }
    .msg-unknown { color: #adb5bd; }
    .empty-msg { color: #adb5bd; font-style: italic; }

    .timestamp-watermark { position: fixed; top: 1px; left: 1px; font-size: 11px; color: rgba(128, 128, 128, 0.4); font-family: 'Courier New', monospace; z-index: 9999; }

    body.dark { background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); color: #e9ecef; }
    body.dark .card { background: #212529; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); }
    body.dark .group-header { background: #343a40; }
    body.dark .group-avatar { border-color: #495057; }
    body.dark .group-name { color: #f8f9fa; }
    body.dark .group-details { color: #adb5bd; }
    body.dark .title { color: #f8f9fa; }
    body.dark .pagination-info { color: #adb5bd; }
    body.dark .essence-item { background: #343a40; }
    body.dark .essence-item:hover { background: #495057; }
    body.dark .essence-content::after { background: linear-gradient(to bottom, transparent, rgba(52,58,64,0.95)); }
    body.dark .essence-item:hover .essence-content::after { background: linear-gradient(to bottom, transparent, rgba(73,80,87,0.95)); }
    body.dark .essence-number { color: #6c757d; }
    body.dark .essence-sender { color: #f8f9fa; }
    body.dark .qq-label { color: #adb5bd; }
    body.dark .qq-number { color: #e9ecef; }
    body.dark .essence-content { color: #ced4da; }
    body.dark .essence-time { color: #adb5bd; }
    body.dark .essence-operator { color: #ffc107; }
    body.dark .msg-reply { background: #495057; border-left-color: #6c757d; color: #adb5bd; }
    body.dark .msg-at { color: #6ea8fe; }
    body.dark .msg-face { color: #ffc107; }
    body.dark .msg-forward, body.dark .msg-video, body.dark .msg-record, body.dark .msg-file { background: #495057; color: #adb5bd; }
    body.dark .msg-image-preview { border-color: #495057; }
    body.dark .timestamp-watermark { color: rgba(200, 200, 200, 0.3); }
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
    <div class="title">📌 群精华消息</div>
    <div class="pagination-info">第${result.currentPage}/${result.totalPages}页 (共${result.totalCount}条精华)</div>
    <div class="essence-list">
      ${generateEssenceListItems(result.records, result.currentPage, result.pageSize)}
    </div>
  </div>
</body>
</html>`;
};

/**
 * 渲染群精华消息列表为图片
 */
export async function renderGroupEssence(
  ctx: Context,
  result: PaginatedEssenceResult,
  contextInfo: EssenceContextInfo,
  imageStyle: ImageStyle,
  enableDarkMode: boolean,
  imageType: ImageType,
  screenshotQuality: number
): Promise<string> {
  // 获取群头像的 Base64 编码
  const groupAvatarBase64 = await getGroupAvatarBase64(ctx, contextInfo.groupId.toString());

  // 获取字体的 Base64 编码
  const fontBase64 = await getFontBase64(ctx, imageStyle);

  // 根据样式选择 HTML 生成函数
  let htmlContent: string;
  switch (imageStyle) {
    case IMAGE_STYLES.SOURCE_HAN_SERIF_SC:
      htmlContent = await getSourceHanSerifSCStyleEssenceHtmlStr(result, contextInfo, groupAvatarBase64, fontBase64, enableDarkMode);
      break;
    case IMAGE_STYLES.LXGW_WENKAI:
      htmlContent = await getLXGWWenKaiStyleEssenceHtmlStr(result, contextInfo, groupAvatarBase64, fontBase64, enableDarkMode);
      break;
    case IMAGE_STYLES.FLAT_MINIMAL:
      htmlContent = await getFlatMinimalStyleEssenceHtmlStr(result, contextInfo, groupAvatarBase64, fontBase64, enableDarkMode);
      break;
    default:
      htmlContent = await getSourceHanSerifSCStyleEssenceHtmlStr(result, contextInfo, groupAvatarBase64, fontBase64, enableDarkMode);
  }

  // 使用 Puppeteer 渲染图片
  const page = await ctx.puppeteer.page();
  try {
    await page.setViewport({ width: 900, height: 1 });
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    // 获取 body 元素的实际高度，截取整个页面以保留边距
    const bodyElement = await page.$('body');
    const boundingBox = await bodyElement?.boundingBox();

    if (!boundingBox) {
      throw new Error('无法获取页面元素的边界框');
    }

    const screenshot = await page.screenshot({
      type: imageType as 'png' | 'jpeg' | 'webp',
      encoding: 'base64',
      clip: boundingBox,
      quality: imageType === 'png' ? undefined : screenshotQuality
    });

    return screenshot as string;
  } finally {
    await page.close();
  }
}
