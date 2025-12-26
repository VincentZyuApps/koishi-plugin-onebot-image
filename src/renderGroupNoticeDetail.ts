// renderGroupNoticeDetail.ts
import { Context } from 'koishi';
import { } from 'koishi-plugin-puppeteer';

import { IMAGE_STYLES, FONT_FILES, type ImageStyle, ImageType } from './type';
import { generateTimestamp, getGroupAvatarBase64, getFontBase64 } from './utils';
import { GroupNoticeMessageRaw, formatTimestamp, parseNoticeText } from './commandGroupNotice';
import { NoticeDetailContextInfo } from './commandGroupNoticeDetail';

/**
 * 解析群公告内容为 HTML（详情页完整版本）
 */
function parseNoticeContentToHtmlFull(text: string): string {
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
 */
function getNoticeImageUrl(imageId: string): string {
  return `https://gdynamic.qpic.cn/gdynamic/${imageId}/0`;
}

/**
 * 思源宋体样式的群公告详情 HTML 模板
 */
const getSourceHanSerifSCStyleDetailHtmlStr = async (
  record: GroupNoticeMessageRaw,
  contextInfo: NoticeDetailContextInfo,
  groupAvatarBase64: string,
  fontBase64: string,
  enableDarkMode: boolean
) => {
  const backgroundStyle = groupAvatarBase64
    ? `background-image: radial-gradient(circle at center, rgba(255,255,255,0.15), rgba(0,0,0,0.1)), url(data:image/jpeg;base64,${groupAvatarBase64}); background-size: cover; background-position: center center; background-repeat: no-repeat;`
    : 'background: linear-gradient(135deg, #667eea, #764ba2);';

  const timestamp = generateTimestamp();
  const contentHtml = parseNoticeContentToHtmlFull(record.message.text);
  const timeStr = formatTimestamp(record.publish_time);
  const senderAvatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${record.sender_id}&s=640`;
  const imageCount = record.message.images?.length || 0;

  // 生成图片预览HTML
  let imagesHtml = '';
  if (record.message.images && record.message.images.length > 0) {
    const imageItems = record.message.images.map(img => {
      const imgUrl = getNoticeImageUrl(img.id);
      return `<div class="notice-image-item"><img class="notice-image-large" src="${imgUrl}" alt="公告图片" onerror="this.parentElement.innerHTML='<span class=\\'image-error\\'>[图片加载失败]</span>';" /></div>`;
    }).join('');
    imagesHtml = `<div class="notice-images-section"><div class="images-title">🖼️ 公告图片 (${imageCount}张)</div><div class="images-container">${imageItems}</div></div>`;
  }

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
    .group-avatar { width: 60px; height: 60px; border-radius: 50%; margin-right: 14px; border: 3px solid rgba(255,255,255,0.6); }
    .group-info { flex: 1; }
    .group-name { font-size: 22px; font-weight: 800; color: #111; margin-bottom: 4px; text-shadow: 0 1px 2px rgba(255,255,255,0.8); }
    .group-details { font-size: 15px; color: #444; line-height: 1.3; font-weight: 600; text-shadow: 0 1px 2px rgba(255,255,255,0.7); }

    .title { font-size: 32px; font-weight: 800; margin-bottom: 8px; color: #111; text-align: center; text-shadow: 0 2px 4px rgba(255,255,255,0.8); }
    .subtitle { font-size: 15px; color: #555; text-align: center; margin-bottom: 18px; font-weight: 600; }

    .sender-section { display: flex; align-items: center; padding: 14px; background: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.4); border-radius: 14px; margin-bottom: 14px; }
    .sender-avatar { width: 65px; height: 65px; border-radius: 50%; margin-right: 14px; border: 2px solid rgba(255,255,255,0.6); }
    .sender-info { flex: 1; }
    .sender-label { font-size: 14px; color: #555; margin-bottom: 4px; font-weight: 600; }
    .sender-id { font-size: 18px; font-weight: 800; color: #111; margin-bottom: 4px; }
    .publish-time { font-size: 13px; color: #444; font-weight: 600; }

    .content-section { background: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.4); border-radius: 14px; padding: 18px; margin-bottom: 14px; }
    .content-title { font-size: 13px; color: #555; margin-bottom: 10px; font-weight: 700; }
    .content-body { font-size: 16px; color: #212121; line-height: 1.7; word-break: break-all; white-space: pre-wrap; font-weight: 500; }

    .notice-images-section { background: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.4); border-radius: 14px; padding: 18px; margin-bottom: 14px; }
    .images-title { font-size: 13px; color: #555; margin-bottom: 12px; font-weight: 700; }
    .images-container { display: flex; flex-wrap: wrap; gap: 10px; }
    .notice-image-item { }
    .notice-image-large { max-width: 200px; max-height: 200px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); object-fit: cover; }
    .image-error { color: #999; font-style: italic; font-size: 12px; }

    .timestamp-watermark { position: fixed; top: 1.3px; left: 1.3px; font-size: 13px; color: rgba(128, 128, 128, 0.6); font-family: 'Courier New', monospace; z-index: 9999; pointer-events: none; text-shadow: 0 0 2px rgba(255, 255, 255, 0.8); }

    body.dark { color: #e0e0e0; }
    body.dark .card { background: rgba(20,20,20,0.4); box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.15); }
    body.dark .group-header { background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.15); }
    body.dark .group-name { color: #ffffff; }
    body.dark .group-details { color: #b0b0b0; }
    body.dark .title { color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.4); }
    body.dark .subtitle { color: #aaa; }
    body.dark .sender-section { background: rgba(40,40,40,0.5); border-color: rgba(255,255,255,0.1); }
    body.dark .sender-label { color: #aaa; }
    body.dark .sender-id { color: #ffffff; }
    body.dark .publish-time { color: #b0b0b0; }
    body.dark .content-section { background: rgba(40,40,40,0.5); border-color: rgba(255,255,255,0.1); }
    body.dark .content-title { color: #aaa; }
    body.dark .content-body { color: #e0e0e0; }
    body.dark .notice-images-section { background: rgba(40,40,40,0.5); border-color: rgba(255,255,255,0.1); }
    body.dark .images-title { color: #aaa; }
    body.dark .notice-image-large { border-color: rgba(255,255,255,0.2); }
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
    <div class="title">📢 群公告详情</div>
    <div class="subtitle">第 ${contextInfo.noticeIndex}/${contextInfo.totalNoticeCount} 条公告</div>
    <div class="sender-section">
      <img class="sender-avatar" src="${senderAvatarUrl}" alt="发布者头像" />
      <div class="sender-info">
        <div class="sender-label">发布者</div>
        <div class="sender-id">QQ: ${record.sender_id}</div>
        <div class="publish-time">⏰ ${timeStr}</div>
      </div>
    </div>
    <div class="content-section">
      <div class="content-title">💬 公告内容</div>
      <div class="content-body">${contentHtml}</div>
    </div>
    ${imagesHtml}
  </div>
</body>
</html>`;
};

/**
 * 落霞孤鹜文楷样式的群公告详情 HTML 模板（金色传统中式风格）
 */
const getLXGWWenKaiStyleDetailHtmlStr = async (
  record: GroupNoticeMessageRaw,
  contextInfo: NoticeDetailContextInfo,
  groupAvatarBase64: string,
  fontBase64: string,
  enableDarkMode: boolean
) => {
  const timestamp = generateTimestamp();
  const contentHtml = parseNoticeContentToHtmlFull(record.message.text);
  const timeStr = formatTimestamp(record.publish_time);
  const senderAvatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${record.sender_id}&s=640`;
  const imageCount = record.message.images?.length || 0;

  // 背景样式：群头像 + 白色半透明滤镜
  const backgroundStyle = groupAvatarBase64
    ? `background-image: linear-gradient(45deg, rgba(245,240,230,0.85), rgba(250,245,235,0.85)), url(data:image/jpeg;base64,${groupAvatarBase64}); background-size: cover; background-position: center center; background-repeat: no-repeat;`
    : `background: linear-gradient(45deg, #f5f0e6, #faf5eb);`;

  // 生成图片预览HTML
  let imagesHtml = '';
  if (record.message.images && record.message.images.length > 0) {
    const imageItems = record.message.images.map(img => {
      const imgUrl = getNoticeImageUrl(img.id);
      return `<div class="notice-image-item"><img class="notice-image-large" src="${imgUrl}" alt="公告图片" onerror="this.parentElement.innerHTML='<span class=\\'image-error\\'>[图片加载失败]</span>';" /></div>`;
    }).join('');
    imagesHtml = `<div class="notice-images-section"><div class="images-title">🖼️ 公告图片 (${imageCount}张)</div><div class="images-container">${imageItems}</div></div>`;
  }

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
    .group-avatar { width: 60px; height: 60px; border-radius: 9%; margin-right: 14px; border: 3px solid #d4af37; box-shadow: 0 4px 12px rgba(212,175,55,0.3); }
    .group-info { flex: 1; }
    .group-name { font-size: 22px; font-weight: 800; color: #5d2e0c; margin-bottom: 4px; text-shadow: 1px 1px 2px rgba(139,69,19,0.3); }
    .group-details { font-size: 16px; color: #6b3a1a; line-height: 1.3; font-weight: 700; text-shadow: 1px 1px 2px rgba(139,69,19,0.2); }

    .title-section { text-align: center; margin-bottom: 8px; }
    .main-title { font-size: 40px; font-weight: 800; color: #5d2e0c; margin-bottom: 6px; text-shadow: 2px 2px 4px rgba(139,69,19,0.4); letter-spacing: 2px; }
    .subtitle { font-size: 16px; color: #6b3a1a; text-align: center; margin-bottom: 18px; font-weight: 700; }

    .sender-section { display: flex; align-items: center; padding: 14px; background: rgba(255,255,255,0.25); border: 1px solid rgba(212,175,55,0.4); border-radius: 14px; margin-bottom: 14px; box-shadow: 0 3px 10px rgba(0,0,0,0.08); backdrop-filter: blur(5px); }
    .sender-avatar { width: 65px; height: 65px; border-radius: 50%; margin-right: 14px; border: 2px solid #d4af37; box-shadow: 0 2px 6px rgba(212,175,55,0.2); }
    .sender-info { flex: 1; }
    .sender-label { font-size: 14px; color: #6b3a1a; font-weight: 700; margin-bottom: 4px; }
    .sender-id { font-size: 18px; font-weight: 800; color: #2a1f1a; margin-bottom: 4px; }
    .publish-time { font-size: 13px; color: #6b3a1a; font-weight: 600; }

    .content-section { background: rgba(255,255,255,0.25); border: 1px solid rgba(212,175,55,0.4); border-radius: 14px; padding: 18px; margin-bottom: 14px; box-shadow: 0 3px 10px rgba(0,0,0,0.08); backdrop-filter: blur(5px); }
    .content-title { font-size: 14px; color: #6b3a1a; margin-bottom: 10px; font-weight: 700; }
    .content-body { font-size: 16px; color: #2a1f1a; line-height: 1.7; word-break: break-all; white-space: pre-wrap; font-weight: 600; }

    .notice-images-section { background: rgba(255,255,255,0.25); border: 1px solid rgba(212,175,55,0.4); border-radius: 14px; padding: 18px; margin-bottom: 14px; box-shadow: 0 3px 10px rgba(0,0,0,0.08); backdrop-filter: blur(5px); }
    .images-title { font-size: 14px; color: #6b3a1a; margin-bottom: 12px; font-weight: 700; }
    .images-container { display: flex; flex-wrap: wrap; gap: 10px; }
    .notice-image-item { }
    .notice-image-large { max-width: 200px; max-height: 200px; border-radius: 8px; border: 1px solid rgba(212,175,55,0.3); object-fit: cover; }
    .image-error { color: #8b7355; font-style: italic; font-size: 12px; }

    .timestamp-watermark { position: fixed; top: 1.3px; left: 1.3px; font-size: 13px; color: rgba(139, 69, 19, 0.4); font-family: 'Courier New', monospace; z-index: 9999; pointer-events: none; text-shadow: 0 0 2px rgba(255, 255, 255, 0.8); }

    body.dark { background: linear-gradient(45deg, #2c2416, #3a2f1f); color: #e6d7c3; }
    body.dark::before { border-color: #b8860b; background: linear-gradient(135deg, rgba(184,134,11,0.18) 0%, rgba(139,69,19,0.12) 50%, rgba(184,134,11,0.18) 100%); box-shadow: inset 0 0 25px rgba(184,134,11,0.45), 0 0 35px rgba(184,134,11,0.35); }
    body.dark::after { color: #b8860b; text-shadow: 0 0 12px rgba(184,134,11,0.6); }
    body.dark .corner-decoration { color: #b8860b; text-shadow: 0 0 12px rgba(184,134,11,0.6); }
    body.dark .group-header { background: rgba(0,0,0,0.3); border-color: rgba(184,134,11,0.5); }
    body.dark .group-name { color: #daa520; text-shadow: 1px 1px 2px rgba(218,165,32,0.3); }
    body.dark .group-details { color: #cd853f; }
    body.dark .main-title { color: #daa520; text-shadow: 2px 2px 4px rgba(218,165,32,0.4); }
    body.dark .subtitle { color: #cd853f; }
    body.dark .sender-section { background: rgba(0,0,0,0.35); border-color: rgba(184,134,11,0.5); }
    body.dark .sender-label { color: #cd853f; }
    body.dark .sender-id { color: #e6d7c3; }
    body.dark .publish-time { color: #cd853f; }
    body.dark .content-section { background: rgba(0,0,0,0.35); border-color: rgba(184,134,11,0.5); }
    body.dark .content-title { color: #cd853f; }
    body.dark .content-body { color: #e6d7c3; }
    body.dark .notice-images-section { background: rgba(0,0,0,0.35); border-color: rgba(184,134,11,0.5); }
    body.dark .images-title { color: #cd853f; }
    body.dark .notice-image-large { border-color: rgba(184,134,11,0.4); }
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
      <div class="main-title">「 群公告详情 」</div>
    </div>
    <div class="subtitle">第 ${contextInfo.noticeIndex}/${contextInfo.totalNoticeCount} 条公告</div>
    <div class="sender-section">
      <img class="sender-avatar" src="${senderAvatarUrl}" alt="发布者头像" />
      <div class="sender-info">
        <div class="sender-label">发布者</div>
        <div class="sender-id">QQ: ${record.sender_id}</div>
        <div class="publish-time">⏰ ${timeStr}</div>
      </div>
    </div>
    <div class="content-section">
      <div class="content-title">💬 公告内容</div>
      <div class="content-body">${contentHtml}</div>
    </div>
    ${imagesHtml}
  </div>
  <div class="timestamp-watermark">${timestamp}</div>
</body>
</html>`;
};

/**
 * 扁平简约样式的群公告详情 HTML 模板
 */
const getFlatMinimalStyleDetailHtmlStr = async (
  record: GroupNoticeMessageRaw,
  contextInfo: NoticeDetailContextInfo,
  groupAvatarBase64: string,
  fontBase64: string,
  enableDarkMode: boolean
) => {
  const timestamp = generateTimestamp();
  const contentHtml = parseNoticeContentToHtmlFull(record.message.text);
  const timeStr = formatTimestamp(record.publish_time);
  const senderAvatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${record.sender_id}&s=640`;
  const imageCount = record.message.images?.length || 0;

  const colors = enableDarkMode ? {
    background: '#000000',
    cardBackground: '#1a1a1a',
    textPrimary: '#ffffff',
    textSecondary: '#b0b0b0',
    primary: '#00d4ff',
    border: '#333333',
  } : {
    background: '#f5f7fa',
    cardBackground: '#ffffff',
    textPrimary: '#2c3e50',
    textSecondary: '#6c757d',
    primary: '#007bff',
    border: '#dee2e6',
  };

  // 生成图片预览HTML
  let imagesHtml = '';
  if (record.message.images && record.message.images.length > 0) {
    const imageItems = record.message.images.map(img => {
      const imgUrl = getNoticeImageUrl(img.id);
      return `<img class="notice-image-large" src="${imgUrl}" alt="公告图片" onerror="this.style.display='none';" />`;
    }).join('');
    imagesHtml = `<div class="notice-images-section"><div class="images-title">🖼️ 公告图片 (${imageCount}张)</div><div class="images-container">${imageItems}</div></div>`;
  }

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
    .group-avatar { width: 80px; height: 80px; border-radius: 16px; object-fit: cover; border: 3px solid ${colors.primary}; }
    .group-details { flex: 1; }
    .group-name { font-size: 24px; font-weight: 800; color: ${colors.textPrimary}; margin-bottom: 8px; }
    .group-meta { font-size: 15px; color: ${colors.textSecondary}; font-weight: 600; }

    .title { font-size: 32px; font-weight: 800; color: ${colors.primary}; text-align: center; margin-bottom: 8px; }
    .subtitle { font-size: 15px; color: ${colors.textSecondary}; text-align: center; font-weight: 600; }

    .sender-section {
      background: ${colors.cardBackground};
      border: 2px solid ${colors.border};
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .sender-avatar { width: 60px; height: 60px; border-radius: 50%; border: 2px solid ${colors.border}; }
    .sender-info { flex: 1; }
    .sender-label { font-size: 13px; color: ${colors.textSecondary}; margin-bottom: 4px; font-weight: 600; }
    .sender-id { font-size: 18px; font-weight: 800; color: ${colors.textPrimary}; margin-bottom: 4px; }
    .publish-time { font-size: 13px; color: ${colors.textSecondary}; font-weight: 600; }

    .content-section {
      background: ${colors.cardBackground};
      border: 2px solid ${colors.border};
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 16px;
    }
    .content-title { font-size: 14px; color: ${colors.textSecondary}; margin-bottom: 12px; font-weight: 700; }
    .content-body { font-size: 16px; color: ${colors.textPrimary}; line-height: 1.8; word-break: break-all; white-space: pre-wrap; font-weight: 500; }

    .notice-images-section {
      background: ${colors.cardBackground};
      border: 2px solid ${colors.border};
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 16px;
    }
    .images-title { font-size: 14px; color: ${colors.textSecondary}; margin-bottom: 12px; font-weight: 700; }
    .images-container { display: flex; flex-wrap: wrap; gap: 12px; }
    .notice-image-large { max-width: 180px; max-height: 180px; border-radius: 12px; border: 1px solid ${colors.border}; object-fit: cover; }

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
      <div class="title">📢 群公告详情</div>
      <div class="subtitle">第 ${contextInfo.noticeIndex}/${contextInfo.totalNoticeCount} 条公告</div>
    </div>
    <div class="sender-section">
      <img class="sender-avatar" src="${senderAvatarUrl}" alt="发布者头像" />
      <div class="sender-info">
        <div class="sender-label">发布者</div>
        <div class="sender-id">QQ: ${record.sender_id}</div>
        <div class="publish-time">⏰ ${timeStr}</div>
      </div>
    </div>
    <div class="content-section">
      <div class="content-title">💬 公告内容</div>
      <div class="content-body">${contentHtml}</div>
    </div>
    ${imagesHtml}
  </div>
</body>
</html>`;
};

/**
 * 渲染群公告详情图片
 */
export async function renderGroupNoticeDetail(
  ctx: Context,
  record: GroupNoticeMessageRaw,
  contextInfo: NoticeDetailContextInfo,
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
      htmlStr = await getSourceHanSerifSCStyleDetailHtmlStr(record, contextInfo, groupAvatarBase64, fontBase64, enableDarkMode);
      break;
    case IMAGE_STYLES.LXGW_WENKAI:
      htmlStr = await getLXGWWenKaiStyleDetailHtmlStr(record, contextInfo, groupAvatarBase64, fontBase64, enableDarkMode);
      break;
    case IMAGE_STYLES.FLAT_MINIMAL:
      htmlStr = await getFlatMinimalStyleDetailHtmlStr(record, contextInfo, groupAvatarBase64, fontBase64, enableDarkMode);
      break;
    default:
      htmlStr = await getSourceHanSerifSCStyleDetailHtmlStr(record, contextInfo, groupAvatarBase64, fontBase64, enableDarkMode);
  }

  // 使用 Puppeteer 渲染
  const page = await ctx.puppeteer.page();
  
  // 使用 domcontentloaded 而不是 networkidle0，避免因外部图片加载失败导致超时
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
