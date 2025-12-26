import { Context, h } from 'koishi'
import { Config } from './index'
import { IMAGE_STYLES, IMAGE_STYLE_KEY_ARR } from './type'
import { renderGroupEssenceDetail } from './renderGroupEssenceDetail'
import { GroupEssenceMessageRaw, formatTimestamp } from './commandGroupEssence'

// 单条精华消息详情的上下文信息
export interface EssenceDetailContextInfo {
  groupId: number;
  groupName: string;
  memberCount: number;
  maxMemberCount: number;
  groupAvatarUrl: string;
  essenceIndex: number;  // 精华消息序号（从1开始）
  totalEssenceCount: number;  // 精华消息总数
}

/**
 * 解析群精华消息内容为可读文本（详细版本）
 */
function parseEssenceContentDetail(content: Array<{ type: string; data: Record<string, any> }>): string {
  if (!content || content.length === 0) {
    return '[空消息]';
  }

  return content.map(item => {
    switch (item.type) {
      case 'text':
        return item.data.text || '';
      case 'image':
        return '[图片]';
      case 'face':
        return `[表情:${item.data.id || ''}]`;
      case 'at':
        return `@${item.data.qq || item.data.name || '某人'}`;
      case 'reply':
        const replyId = item.data.id || item.data.qq || '';
        return `[回复:${replyId}]`;
      case 'forward':
        return '[转发消息]';
      case 'video':
        return '[视频]';
      case 'record':
        return '[语音]';
      case 'file':
        return '[文件]';
      default:
        return `[${item.type}]`;
    }
  }).join('');
}

/**
 * 格式化单条群精华消息详情为文本
 */
function formatGroupEssenceDetailAsText(
  record: GroupEssenceMessageRaw,
  contextInfo: EssenceDetailContextInfo,
  config: Config
): string {
  const content = parseEssenceContentDetail(record.content);
  const timeStr = formatTimestamp(record.operator_time);

  let output = `📌 群精华消息详情\n`;
  output += `==================\n`;
  output += `📍 群聊: ${contextInfo.groupName} (${contextInfo.groupId})\n`;
  output += `📊 第 ${contextInfo.essenceIndex}/${contextInfo.totalEssenceCount} 条精华\n`;
  output += `------------------\n`;
  output += `👤 发送者: ${record.sender_nick}\n`;
  output += `🆔 QQ号: ${record.sender_id}\n`;
  output += `------------------\n`;
  output += `💬 消息内容:\n${content}\n`;
  output += `------------------\n`;
  output += `⏰ 设精时间: ${timeStr}\n`;
  output += `📌 操作者: ${record.operator_nick} (${record.operator_id})\n`;
  output += `==================\n`;

  // 添加用法提示
  output += `📖 用法: ${config.groupEssenceDetailCommandName} <序号>\n`;
  output += `📝 示例: ${config.groupEssenceDetailCommandName} 5  查看第5条精华详情\n`;

  return output;
}

/**
 * 格式化单条群精华消息详情为合并转发
 */
function formatGroupEssenceDetailAsForward(
  record: GroupEssenceMessageRaw,
  contextInfo: EssenceDetailContextInfo,
  config: Config
): string {
  const content = parseEssenceContentDetail(record.content);
  const timeStr = formatTimestamp(record.operator_time);

  let messages = '';
  const addMessageBlock = (userId: string | undefined, nickname: string, content: string) => {
    if (userId) {
      messages += `<message user-id="${userId}" nickname="${nickname}">${content}</message>\n`;
    } else {
      messages += `<message nickname="${nickname}">${content}</message>\n`;
    }
  };

  // 标题
  addMessageBlock(undefined, '📌 群精华详情', `第 ${contextInfo.essenceIndex}/${contextInfo.totalEssenceCount} 条精华消息`);

  // 群聊信息
  addMessageBlock(undefined, '📍 群聊信息', `${contextInfo.groupName}\n群号: ${contextInfo.groupId}\n成员: ${contextInfo.memberCount}/${contextInfo.maxMemberCount}`);

  // 发送者信息
  addMessageBlock(String(record.sender_id), record.sender_nick, `发送者: ${record.sender_nick}\nQQ: ${record.sender_id}`);

  // 消息内容
  addMessageBlock(String(record.sender_id), record.sender_nick, `💬 消息内容:\n${content}`);

  // 精华信息
  addMessageBlock(String(record.operator_id), record.operator_nick, `📌 设精信息:\n操作者: ${record.operator_nick}\n时间: ${timeStr}`);

  // 用法提示
  const usageText = [
    `📖 用法: ${config.groupEssenceDetailCommandName} <序号>`,
    `📝 示例: ${config.groupEssenceDetailCommandName} 5  查看第5条精华详情`
  ].join('\n');
  addMessageBlock(undefined, '使用帮助', usageText);

  return `<message forward>\n${messages}\n</message>`;
}

export function registerGroupEssenceDetailCommand(ctx: Context, config: Config, responseHint: string) {
  if (!config.enableGroupEssenceCommand) return;

  ctx.command(`${config.groupEssenceDetailCommandName} <num:number>`, `获取指定序号的群精华消息详情, 发送${responseHint}`)
    .alias('群精华详情')
    .alias('aged')
    .option('imageStyleIdx', '-i, --idx, --index <idx:number> 图片样式索引')
    .action(async ({ session, options }, num) => {
      if (!session.onebot)
        return session.send('[error]当前会话不支持onebot协议。');

      if (!session.guildId)
        return session.send('[error]当前会话不在群聊中。');

      if (num === undefined || num === null || isNaN(num)) {
        return session.send(`[error]请输入要查看的精华消息序号。\n用法: ${config.groupEssenceDetailCommandName} <序号>\n示例: ${config.groupEssenceDetailCommandName} 5`);
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
        // 获取群精华消息列表
        const onebotBot = (session as any).onebot;
        const groupEssenceMsgList: GroupEssenceMessageRaw[] = await onebotBot.getEssenceMsgList(session.guildId);

        if (!groupEssenceMsgList || groupEssenceMsgList.length === 0) {
          return session.send('该群暂无精华消息。');
        }

        // 验证序号
        const index = Math.floor(num);
        if (index < 1 || index > groupEssenceMsgList.length) {
          return session.send(`[error]序号超出范围。\n有效范围: 1 - ${groupEssenceMsgList.length}\n当前输入: ${index}`);
        }

        // 获取指定的精华消息
        const targetRecord = groupEssenceMsgList[index - 1];

        // 获取群信息
        const groupInfoObj = await session.onebot.getGroupInfo(session.guildId);
        const contextInfo: EssenceDetailContextInfo = {
          groupId: parseInt(session.guildId),
          groupName: groupInfoObj.group_name || '未知群聊',
          memberCount: groupInfoObj.member_count || 0,
          maxMemberCount: groupInfoObj.max_member_count || 0,
          groupAvatarUrl: `https://p.qlogo.cn/gh/${session.guildId}/${session.guildId}/640/`,
          essenceIndex: index,
          totalEssenceCount: groupEssenceMsgList.length
        };

        if (config.verboseConsoleOutput) {
          ctx.logger.info(`群精华消息详情: ${JSON.stringify(targetRecord)}`);
        }

        // 发送文本
        if (config.sendText) {
          const textMessage = formatGroupEssenceDetailAsText(targetRecord, contextInfo, config);
          await session.send(`${config.enableQuoteWithText ? h.quote(session.messageId) : ''}${textMessage}`);
        }

        // 发送图片
        if (config.sendImage) {
          const waitTipMsgId = await session.send(`${h.quote(session.messageId)}🔄正在渲染群精华详情图片，请稍候⏳...`);
          const selectedImageStyle = IMAGE_STYLES[selectedStyleDetailObj.styleKey];
          const selectedDarkMode = selectedStyleDetailObj.darkMode;
          const essenceDetailImageBase64 = await renderGroupEssenceDetail(
            ctx,
            targetRecord,
            contextInfo,
            selectedImageStyle,
            selectedDarkMode,
            config.imageType,
            config.screenshotQuality
          );
          // 构建图片消息
          let imageMessage = `${config.enableQuoteWithImage ? h.quote(session.messageId) : ''}${h.image(`data:image/png;base64,${essenceDetailImageBase64}`)}`;
          imageMessage += `\n📌 第 ${index}/${groupEssenceMsgList.length} 条精华 | 📖 ${config.groupEssenceDetailCommandName} <序号>`;
          await session.send(imageMessage);
          await session.bot.deleteMessage(session.guildId, String(waitTipMsgId));
        }

        // 发送合并转发
        if (config.sendForward) {
          const forwardMessage = formatGroupEssenceDetailAsForward(targetRecord, contextInfo, config);
          await session.send(h.unescape(forwardMessage));
        }

      } catch (error) {
        ctx.logger.error(`获取群精华消息详情失败: ${error}`);
        await session.send(`[error]获取群精华消息详情失败: ${error.message}`);
      }
    });
}
