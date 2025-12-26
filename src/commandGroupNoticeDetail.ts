import { Context, h } from 'koishi'
import { Config } from './index'
import { IMAGE_STYLES, IMAGE_STYLE_KEY_ARR } from './type'
import { renderGroupNoticeDetail } from './renderGroupNoticeDetail'
import { GroupNoticeMessageRaw, formatTimestamp, parseNoticeText } from './commandGroupNotice'

// 单条公告详情的上下文信息
export interface NoticeDetailContextInfo {
  groupId: number;
  groupName: string;
  memberCount: number;
  maxMemberCount: number;
  groupAvatarUrl: string;
  noticeIndex: number;  // 公告序号（从1开始）
  totalNoticeCount: number;  // 公告总数
}

/**
 * 格式化单条群公告详情为文本
 */
function formatGroupNoticeDetailAsText(
  record: GroupNoticeMessageRaw,
  contextInfo: NoticeDetailContextInfo,
  config: Config
): string {
  const textContent = parseNoticeText(record.message.text);
  const timeStr = formatTimestamp(record.publish_time);
  const imageCount = record.message.images?.length || 0;

  let output = `📢 群公告详情\n`;
  output += `==================\n`;
  output += `📍 群聊: ${contextInfo.groupName} (${contextInfo.groupId})\n`;
  output += `📊 第 ${contextInfo.noticeIndex}/${contextInfo.totalNoticeCount} 条公告\n`;
  output += `------------------\n`;
  output += `👤 发布者QQ: ${record.sender_id}\n`;
  output += `⏰ 发布时间: ${timeStr}\n`;
  output += `------------------\n`;
  output += `💬 公告内容:\n${textContent}\n`;
  if (imageCount > 0) {
    output += `------------------\n`;
    output += `🖼️ 包含 ${imageCount} 张图片\n`;
  }
  output += `==================\n`;

  // 添加用法提示
  output += `📖 用法: ${config.groupNoticeDetailCommandName} <序号>\n`;
  output += `📝 示例: ${config.groupNoticeDetailCommandName} 2  查看第2条公告详情\n`;

  return output;
}

/**
 * 格式化单条群公告详情为合并转发
 */
function formatGroupNoticeDetailAsForward(
  record: GroupNoticeMessageRaw,
  contextInfo: NoticeDetailContextInfo,
  config: Config
): string {
  const textContent = parseNoticeText(record.message.text);
  const timeStr = formatTimestamp(record.publish_time);
  const imageCount = record.message.images?.length || 0;

  let messages = '';
  const addMessageBlock = (userId: string | undefined, nickname: string, content: string) => {
    if (userId) {
      messages += `<message user-id="${userId}" nickname="${nickname}">${content}</message>\n`;
    } else {
      messages += `<message nickname="${nickname}">${content}</message>\n`;
    }
  };

  // 标题
  addMessageBlock(undefined, '📢 群公告详情', `第 ${contextInfo.noticeIndex}/${contextInfo.totalNoticeCount} 条公告`);

  // 群聊信息
  addMessageBlock(undefined, '📍 群聊信息', `${contextInfo.groupName}\n群号: ${contextInfo.groupId}\n成员: ${contextInfo.memberCount}/${contextInfo.maxMemberCount}`);

  // 发布者信息
  addMessageBlock(String(record.sender_id), `发布者 ${record.sender_id}`, `发布者QQ: ${record.sender_id}\n发布时间: ${timeStr}`);

  // 公告内容
  addMessageBlock(String(record.sender_id), `发布者 ${record.sender_id}`, `💬 公告内容:\n${textContent}`);

  // 图片信息
  if (imageCount > 0) {
    addMessageBlock(undefined, '🖼️ 图片信息', `包含 ${imageCount} 张图片`);
  }

  // 用法提示
  const usageText = [
    `📖 用法: ${config.groupNoticeDetailCommandName} <序号>`,
    `📝 示例: ${config.groupNoticeDetailCommandName} 2  查看第2条公告详情`
  ].join('\n');
  addMessageBlock(undefined, '使用帮助', usageText);

  return `<message forward>\n${messages}\n</message>`;
}

export function registerGroupNoticeDetailCommand(ctx: Context, config: Config, responseHint: string) {
  if (!config.enableGroupNoticeCommand) return;

  ctx.command(`${config.groupNoticeDetailCommandName} <num:number>`, `获取指定序号的群公告详情, 发送${responseHint}`)
    .alias('群公告详情')
    .alias('agnd')
    .option('imageStyleIdx', '-i, --idx, --index <idx:number> 图片样式索引')
    .action(async ({ session, options }, num) => {
      if (!session.onebot)
        return session.send('[error]当前会话不支持onebot协议。');

      if (!session.guildId)
        return session.send('[error]当前会话不在群聊中。');

      if (num === undefined || num === null || isNaN(num)) {
        return session.send(`[error]请输入要查看的公告序号。\n用法: ${config.groupNoticeDetailCommandName} <序号>\n示例: ${config.groupNoticeDetailCommandName} 2`);
      }

      // 选择图片样式
      const defaultStyleDetailObj = config.imageStyleDetails.length > 0
        ? config.imageStyleDetails[0]
        : { styleKey: IMAGE_STYLE_KEY_ARR[0], darkMode: false };

      let selectedStyleDetailObj = defaultStyleDetailObj;
      if (options.imageStyleIdx !== undefined) {
        const isIdxValid = (options.imageStyleIdx as number) >= 0
          && (options.imageStyleIdx as number) < config.imageStyleDetails.length;
        if (!isIdxValid) {
          let idxInvalidMsgArr = [
            `图片样式索引不合法。`,
            `\t 合法范围：[0, ${config.imageStyleDetails.length - 1}]双闭区间。`,
            `\t 当前输入：${options.imageStyleIdx}`,
            `\n`,
            `输入指令 ${config.inspectStyleCommandName} 查看图片样式列表。`
          ];
          return await session.send(idxInvalidMsgArr.join('\n'));
        }
        selectedStyleDetailObj = config.imageStyleDetails[options.imageStyleIdx as number];
      }

      try {
        // 获取群公告列表
        const onebotBot = (session as any).onebot;
        const groupNoticeList: GroupNoticeMessageRaw[] = await onebotBot.getGroupNotice(session.guildId);

        if (!groupNoticeList || groupNoticeList.length === 0) {
          return session.send('该群暂无公告。');
        }

        // 验证序号
        const index = Math.floor(num);
        if (index < 1 || index > groupNoticeList.length) {
          return session.send(`[error]序号超出范围。\n有效范围: 1 - ${groupNoticeList.length}\n当前输入: ${index}`);
        }

        // 获取指定的公告
        const targetRecord = groupNoticeList[index - 1];

        // 获取群信息
        const groupInfoObj = await session.onebot.getGroupInfo(session.guildId);
        const contextInfo: NoticeDetailContextInfo = {
          groupId: parseInt(session.guildId),
          groupName: groupInfoObj.group_name || '未知群聊',
          memberCount: groupInfoObj.member_count || 0,
          maxMemberCount: groupInfoObj.max_member_count || 0,
          groupAvatarUrl: `https://p.qlogo.cn/gh/${session.guildId}/${session.guildId}/640/`,
          noticeIndex: index,
          totalNoticeCount: groupNoticeList.length
        };

        if (config.verboseConsoleOutput) {
          ctx.logger.info(`群公告详情: ${JSON.stringify(targetRecord)}`);
        }

        // 发送文本
        if (config.sendText) {
          const textMessage = formatGroupNoticeDetailAsText(targetRecord, contextInfo, config);
          await session.send(`${config.enableQuoteWithText ? h.quote(session.messageId) : ''}${textMessage}`);
        }

        // 发送图片
        if (config.sendImage) {
          const waitTipMsgId = await session.send(`${h.quote(session.messageId)}🔄正在渲染群公告详情图片，请稍候⏳...`);
          const selectedImageStyle = IMAGE_STYLES[selectedStyleDetailObj.styleKey];
          const selectedDarkMode = selectedStyleDetailObj.darkMode;
          const noticeDetailImageBase64 = await renderGroupNoticeDetail(
            ctx,
            targetRecord,
            contextInfo,
            selectedImageStyle,
            selectedDarkMode,
            config.imageType,
            config.screenshotQuality
          );
          // 构建图片消息
          let imageMessage = `${config.enableQuoteWithImage ? h.quote(session.messageId) : ''}${h.image(`data:image/png;base64,${noticeDetailImageBase64}`)}`;
          imageMessage += `\n📢 第 ${index}/${groupNoticeList.length} 条公告 | 📖 ${config.groupNoticeDetailCommandName} <序号>`;
          await session.send(imageMessage);
          await session.bot.deleteMessage(session.guildId, String(waitTipMsgId));
        }

        // 发送合并转发
        if (config.sendForward) {
          const forwardMessage = formatGroupNoticeDetailAsForward(targetRecord, contextInfo, config);
          await session.send(h.unescape(forwardMessage));
        }

      } catch (error) {
        ctx.logger.error(`获取群公告详情失败: ${error}`);
        await session.send(`[error]获取群公告详情失败: ${error.message}`);
      }
    });
}
