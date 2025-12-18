// index.ts
import { Context, Schema, h } from 'koishi'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import {} from 'koishi-plugin-adapter-onebot';

import { IMAGE_STYLES, type ImageStyle, type ImageStyleKey, IMAGE_STYLE_KEY_ARR, IMAGE_TYPES, type ImageType, ONEBOT_IMPL_NAME, type OneBotImplName, getNapcatQQStatusText } from './type';
import { renderUserInfo } from './renderUserInfo'
import { renderAdminList } from './renderAdminList'
import { convertToUnifiedUserInfo, convertToUnifiedAdminInfo, convertToUnifiedContextInfo, UnifiedUserInfo, UnifiedAdminInfo, UnifiedContextInfo } from './type'
import { validateFonts } from './utils'

export const name = 'onebot-info-image'

export const inject = {
    required: ["puppeteer", "http"]
}

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json'), 'utf-8')
)

export const usage = `
<h1>Koishi 插件：onebot-info-image 获取群员信息 渲染成图像</h1>
<h2>🎯 插件版本：v${pkg.version}</h2>
<p>插件使用问题 / Bug反馈 / 插件开发交流，欢迎加入QQ群：<b>259248174</b></p>

目前仅仅适配了Lagrange 和 Napcat 协议
<br>
Napcat能拿到的东西更多， 为了更好的使用体验，推荐使用Napcat

<hr>

<p>📦 插件仓库地址：</p>
<ul>
  <li><a href="https://gitee.com/vincent-zyu/koishi-plugin-onebot-image">Gitee</a></li>
  <li><a href="https://github.com/VincentZyu233/koishi-plugin-onebot-image">GitHub</a></li>
</ul>

<hr>

<h3>字体使用声明</h3>
<p>本插件使用以下开源字体进行图像渲染：</p>
<ul>
  <li><b>思源宋体（Source Han Serif SC）</b> - 由 Adobe 与 Google 联合开发，遵循 <a href="https://openfontlicense.org">SIL Open Font License 1.1</a> 协议。</li>
  <li><b>霞鹜文楷（LXGW WenKai）</b> - 由 LXGW 开发并维护，遵循 <a href="https://openfontlicense.org">SIL Open Font License 1.1</a> 协议。</li>
</ul>
<p>两者均为自由字体，可在本项目中自由使用、修改与发布。若你也在开发相关插件或项目，欢迎一同使用这些优秀的字体。</p>

<hr>

<h3>插件许可声明</h3>
<p>本插件为开源免费项目，基于 MIT 协议开放。欢迎修改、分发、二创。</p>
<p>如果你觉得插件好用，欢迎在 GitHub 上 Star 或通过其他方式给予支持（例如提供服务器、API Key 或直接赞助）！</p>
<p>感谢所有开源字体与项目的贡献者 ❤️</p>
`

export interface ImageStyleDetail {
  styleKey: ImageStyleKey;
  darkMode: boolean;
}

export interface Config {
  onebotImplName: OneBotImplName;

  enableUserInfoCommand: boolean;
  userinfoCommandName: string;
  enableGroupAdminListCommand: boolean;
  groupAdminListCommandName: string;
  inspectStyleCommandName: string;

  sendText: boolean;
  enableQuoteWithText: boolean;

  sendImage: boolean;
  enableQuoteWithImage: boolean
  imageStyleDetails: ImageStyleDetail[];
  imageType: ImageType;
  screenshotQuality: number;

  sendForward: boolean

  verboseSessionOutput: boolean
  verboseConsoleOutput: boolean
  verboseFileOutput: boolean
}
export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    onebotImplName: Schema.union([
      Schema.const(ONEBOT_IMPL_NAME.LAGRNAGE).description('Lagrange'),
      Schema.const(ONEBOT_IMPL_NAME.NAPCAT).description('NapCat'),
      // Schema.const(ONEBOT_IMPL_NAME.LLONEBOT).description('LLOneBot'),
    ])
      .role('radio')
      .default(ONEBOT_IMPL_NAME.LAGRNAGE)
      .description('【重要】OneBot 的具体实现名称(选错了会导致获取到的内容会变少)'),
  }).description('你的OneBot具体实现平台 是哪一个捏？'),

  Schema.object({
    enableUserInfoCommand: Schema.boolean()
      .default(true)
      .description('ℹ️ 是否启用用户信息命令。'),
    userinfoCommandName: Schema.string()
      .default('用户信息')
      .description('🔍 用户信息命令名称。'),
    enableGroupAdminListCommand: Schema.boolean()
      .default(false)
      .description('👥 是否启用群管理员列表命令。'),
    groupAdminListCommandName: Schema.string()
      .default('群管理列表')
      .description('👥 群管理员列表命令名称。'),
    inspectStyleCommandName: Schema.string()
      .default('查看图片样式')
      .description('🎨 查看图片样式列表命令名称。'),
  }).description('基础配置 ⚙️'),

  Schema.object({
    sendText: Schema.boolean()
      .default(false)
      .description('💬 是否启用文本回复。'),
    enableQuoteWithText: Schema.boolean()
      .default(false)
      .description('↩️ 回复文本的时候，是否带引用触发指令的消息。'),
  }).description('发送 文本 配置 📝'),

  Schema.object({
    sendImage: Schema.boolean()
      .default(true)
      .description('🖼️ 是否启用 Puppeteer 渲染图片。'),
    enableQuoteWithImage: Schema.boolean()
      .default(false)
      .description('📸 回复图片的时候，是否带引用触发指令的消息。'),
    imageStyleDetails: Schema
      .array(
        Schema.object({
          styleKey: Schema
            .union(IMAGE_STYLE_KEY_ARR.map((key) => Schema.const(key).description(IMAGE_STYLES[key])))
            .role('radio')
            .description("🎨 图片样式"),
          darkMode: Schema
            .boolean()
            .description("🌙 启用深色模式"),
        })
      )
      .role('table')
      .default([
        {
          styleKey: IMAGE_STYLE_KEY_ARR[0],
          darkMode: false,
        },
        {
          styleKey: IMAGE_STYLE_KEY_ARR[0],
          darkMode: true,
        },
        {
          styleKey: IMAGE_STYLE_KEY_ARR[1],
          darkMode: false,
        },
        {
          styleKey: IMAGE_STYLE_KEY_ARR[1],
          darkMode: true,
        },
        {
          styleKey: IMAGE_STYLE_KEY_ARR[2],
          darkMode: false,
        },
        {
          styleKey: IMAGE_STYLE_KEY_ARR[2],
          darkMode: true,
        },
      ])
      .description("� 图片样式配置。第一行是默认使用的样式，指定样式请使用 -i 参数"),
    imageType: Schema.union([
      Schema.const(IMAGE_TYPES.PNG).description(`🖼️ ${IMAGE_TYPES.PNG}, ❌ 不支持调整quality`),
      Schema.const(IMAGE_TYPES.JPEG).description(`🌄 ${IMAGE_TYPES.JPEG}, ✅ 支持调整quality`),
      Schema.const(IMAGE_TYPES.WEBP).description(`🌐 ${IMAGE_TYPES.WEBP}, ✅ 支持调整quality`),
    ])
      .role('radio')
      .default(IMAGE_TYPES.PNG)
      .description("📤 渲染图片的输出类型。"),
    screenshotQuality: Schema.number()
      .min(0).max(100).step(1)
      .default(80)
      .description('📏 Puppeteer 截图质量 (0-100)。'),

  }).description('发送 Puppeteer渲染的图片 配置 🎨'),

  Schema.object({
    sendForward: Schema.boolean()
      .default(false)
      .description('➡️ 是否启用转发消息。'),
  }).description('发送 onebot转发消息 配置 ✉️'),

  Schema.object({
    verboseSessionOutput: Schema.boolean()
      .default(false)
      .description('🗣️ 是否在会话中输出详细信息。(生产环境别开，东西很多)'),
    verboseConsoleOutput: Schema.boolean()
      .default(false)
      .description('💻 是否在控制台输出详细信息。'),
    verboseFileOutput: Schema.boolean()
      .default(false)
      .description('📄 是否在文件中输出详细信息。(生产环境不要开)'),
  }).description('调试 (Debug) 配置 🐞')

]);


export function apply(ctx: Context, config: Config) {
  // 验证并下载字体文件
  validateFonts(ctx).catch(error => {
    ctx.logger.error(`字体文件验证失败: ${error.message}`);
  });

  //帮助文本中的 结果信息格式
  const responseHint = [
    config.sendText && '文本消息',
    config.sendImage && '图片消息',
    config.sendForward && '合并转发消息'
  ].filter(Boolean).join('、');

  // 注册 ais 指令 - 查看图片样式列表
  ctx.command(config.inspectStyleCommandName, "查看图片样式列表")
    .alias('ais')
    .alias("awa_inspect_style")
    .action(async ({ session }) => {
      let msg = '用户信息图片样式列表：\n';
      for (let i = 0; i < config.imageStyleDetails.length; i++) {
        const o = config.imageStyleDetails[i];
        msg += `\t【${i}】: ${IMAGE_STYLES[o.styleKey]} ${o.darkMode ? '深色模式' : '浅色模式'} (${o.styleKey})\n`;
      }
      await session.send(msg);
    });

  if ( config.enableUserInfoCommand ) 
    ctx.command(`${config.userinfoCommandName} [qqId:string]`, `获取用户信息, 发送${responseHint}`)
      .alias('aui')
      .alias("awa_user_info")
      .option("imageStyleIdx", "-i, --idx, --index <idx:number> 图片样式索引")
      .action( async ( {session, options}, qqId ) => {
        if ( !session.onebot )
          return session.send("[error]当前会话不支持onebot协议。");

        // 选择图片样式
        const IMAGE_STYLE_VALUES = Object.values(IMAGE_STYLES);
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

        let targetUserId = session.userId;
        // 是否通过参数直接指定了 QQ 号（此时使用私聊逻辑）
        const isDirectQQQuery = !!qqId;
        if (isDirectQQQuery) {
          targetUserId = qqId;
        } else {
          // 检查是否有 @ 用户
          for ( const e of session.event.message.elements ){
            if ( e.type === 'at'){
              targetUserId = e.attrs.id;
              break;
            }
          }
        }

        const userObj = await session.bot.getUser(targetUserId);
        let userObjMsg = `userObj = \n\t ${JSON.stringify(userObj)}`;
        // await session.send(userObjMsg);
        const userAvatarUrl = userObj.avatar;

        let userInfoArg = {
          status: null
        };
        let contextInfo = {
          isGroup: false,
          groupId: null,
          groupName: null,
          groupAvatarUrl: null,
          memberCount: null,
          maxMemberCount: null
        };


        try {
          // 获取陌生人信息（包含头像等基本信息）
          const strangerInfoObj = await session.onebot.getStrangerInfo(targetUserId);
          let strangerInfoObjMsg = `strangerInfoObj = \n\t ${JSON.stringify(strangerInfoObj)}`;
          if ( config.verboseSessionOutput ) await session.send(strangerInfoObjMsg);
          if ( config.verboseConsoleOutput ) ctx.logger.info(strangerInfoObjMsg);

          if (session.guildId && !isDirectQQQuery) { // 如果在群聊中，且不是直接 QQ 查询
            const groupMemberInfoObj = await session.onebot.getGroupMemberInfo(session.guildId, targetUserId);
            let groupMemberInfoObjMsg = `groupMemberInfoObj = \n\t ${JSON.stringify(groupMemberInfoObj)}`;
            if ( config.verboseSessionOutput ) await session.send(groupMemberInfoObjMsg);
            if ( config.verboseConsoleOutput ) ctx.logger.info(groupMemberInfoObjMsg);

            const groupInfoObj = await session.onebot.getGroupInfo(session.guildId);
            let groupInfoObjMsg = `groupInfoObj = \n\t ${JSON.stringify(groupInfoObj)}`;
            if ( config.verboseSessionOutput ) await session.send(groupInfoObjMsg);
            if ( config.verboseConsoleOutput ) ctx.logger.info(groupInfoObjMsg);
            
            // 合并群成员信息和陌生人信息，优先保留陌生人信息中的关键字段
            userInfoArg = {
              ...groupMemberInfoObj,
              ...strangerInfoObj,
              // @ts-ignore - strangerInfoObj 实际包含 age 字段，但类型定义中缺失
              age: strangerInfoObj.age,
              // @ts-ignore - strangerInfoObj 实际包含 level 字段，但类型定义中缺失 (here ↓)
              // node_modules/koishi-plugin-adapter-onebot/lib/types.d.ts:  export interface StrangerInfo ...
              level: strangerInfoObj.level,
              sex: strangerInfoObj.sex,
              card: groupMemberInfoObj.card,
              role: groupMemberInfoObj.role,
              join_time: groupMemberInfoObj.join_time,
              last_sent_time: groupMemberInfoObj.last_sent_time,
              group_level: groupMemberInfoObj.level,
              title: groupMemberInfoObj.title,
              avatar: userObj.avatar
            };
            
            // 设置群聊上下文信息
            contextInfo = {
              isGroup: true,
              groupId: session.guildId,
              //@ts-ignore - groupInfoObj 在lagrange中 实际包含 GroupName 字段，但类型定义中缺失
              groupName: groupInfoObj.GroupName || groupInfoObj.group_name,
              groupAvatarUrl: `https://p.qlogo.cn/gh/${session.guildId}/${session.guildId}/640/`,
              memberCount: groupInfoObj.member_count || 0,
              maxMemberCount: groupInfoObj.max_member_count || 0,
            };
          } else {
            // 私聊情况，只使用陌生人信息
            userInfoArg = {
              ...strangerInfoObj,
              // @ts-ignore - userObj 确实有avatar字段
              avatar: userObj.avatar
            };
            contextInfo = {
              isGroup: false,
              groupId: null,
              groupName: null,
              groupAvatarUrl: null,
              memberCount: null,
              maxMemberCount: null
            };
          }

        if ( config.onebotImplName === ONEBOT_IMPL_NAME.LAGRNAGE ){
          // userInfoArg.status = {

          // }
        } else if ( config.onebotImplName === ONEBOT_IMPL_NAME.NAPCAT ){
          const ncUserStatusObj = await session.onebot._request('nc_get_user_status', { user_id: targetUserId });
          const napcatStatusData = ncUserStatusObj?.data ?? null;
          // ctx.logger.info(`[napcat独有]: ncUserStatusObj = \n\t ${JSON.stringify(ncUserStatusObj)}`);
          userInfoArg.status = {
            napcat_origin: ncUserStatusObj,
            message: getNapcatQQStatusText(napcatStatusData?.status, napcatStatusData?.ext_status)
          }
          // ctx.logger.info(`[napcat独有]: userInfoArg.status = \n\t ${JSON.stringify(userInfoArg.status)}`);
        } 

          let userInfoArgMsg = `userInfoArg = \n\t ${JSON.stringify(userInfoArg)}`;
          let contextInfoMsg = `contextInfo = \n\t ${JSON.stringify(contextInfo)}`;
          if ( config.verboseSessionOutput ) {
            await session.send(userInfoArgMsg);
            await session.send(contextInfoMsg);
          }
          if ( config.verboseConsoleOutput ) {
            await ctx.logger.info(userInfoArgMsg);
            await ctx.logger.info(contextInfoMsg);
          }

          const unifiedUserInfo = convertToUnifiedUserInfo(userInfoArg, config.onebotImplName);
          const unifiedContextInfo = convertToUnifiedContextInfo(contextInfo, config.onebotImplName);

          let unifiedUserInfoMsg = `unifiedUserInfo = \n\t ${JSON.stringify(unifiedUserInfo)}`;
          let unifiedContextInfoMsg = `unifiedContextInfo = \n\t ${JSON.stringify(unifiedContextInfo)}`;
          if ( config.verboseSessionOutput ) {
            await session.send(unifiedUserInfoMsg);
            await session.send(unifiedContextInfoMsg);
          }
          if ( config.verboseConsoleOutput ) {
            await ctx.logger.info(unifiedUserInfoMsg);
            await ctx.logger.info(unifiedContextInfoMsg);
          }

          if (config.sendText) {
            ctx.logger.info("text");
            const formattedText = formatUserInfoDirectText(unifiedUserInfo, unifiedContextInfo);
            session.send(`${config.enableQuoteWithText ? h.quote(session.messageId) : ''}${formattedText}`);
          }

          if (config.sendImage){
            const waitTipMsgId = await session.send(`${h.quote(session.messageId)}🔄正在渲染用户信息图片，请稍候⏳...`);
            const selectedImageStyle = IMAGE_STYLES[selectedStyleDetailObj.styleKey];
            const selectedDarkMode = selectedStyleDetailObj.darkMode;
            const userInfoimageBase64 = await renderUserInfo(ctx, unifiedUserInfo, unifiedContextInfo, selectedImageStyle, selectedDarkMode, config.imageType, config.screenshotQuality);
            if ( config.verboseFileOutput ){
              try {
                const tmpDir = resolve(__dirname, '../tmp');
                mkdirSync(tmpDir, { recursive: true });
                const outputPath = resolve(tmpDir, 'image_base64.txt');
                writeFileSync(outputPath, userInfoimageBase64, 'utf-8');
                ctx.logger.info(`图片 base64 已输出到: ${outputPath}`);
              } catch (error) {
                ctx.logger.error(`写入 base64 文件失败: ${error.message}`);
              }
            }
            await session.send(`${config.enableQuoteWithImage ? h.quote(session.messageId) : ''}${h.image(`data:image/png;base64,${userInfoimageBase64}`)}`);
            await session.bot.deleteMessage(session.guildId, String(waitTipMsgId));
          }

          if (config.sendForward) {
            const forwardMessageContent = formatUserInfoForwardText(session.bot, unifiedUserInfo, unifiedContextInfo);
            session.send(h.unescape(forwardMessageContent)); 
          }
          

        } catch (error) {
          ctx.logger.error(`获取用户信息或渲染图片失败: \n\terror=${error}\n\terror.stack=${error.stack}`);
          await session.send(`[error]获取用户信息或渲染图片失败: \n\terror.message=${error.message}`);
        }
        
      })
    
  if ( config.enableGroupAdminListCommand )
    ctx.command(config.groupAdminListCommandName, `获取群管理员列表, 发送${responseHint}`)
      .alias('al')
      .alias("awa_group_admin_list")
      .option("imageStyleIdx", "-i, --idx, --index <idx:number> 图片样式索引")
      .action( async ( {session, options} ) => {
        if ( !session.onebot )
          return session.send("[error]当前会话不支持onebot协议。");

        if ( !session.guildId )
          return session.send("[error]当前会话不在群聊中。");

        // 选择图片样式
        const IMAGE_STYLE_VALUES = Object.values(IMAGE_STYLES);
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
          const groupMemberListObj = await session.onebot.getGroupMemberList(session.guildId);
          const groupInfoObj = await session.onebot.getGroupInfo(session.guildId);
          const groupAdminMemberListObj = groupMemberListObj.filter(m => m.role === 'admin' || m.role === 'owner');
          
          let groupAdminMemberListObjMsg = `groupAdminMemberListObj = \n\t ${JSON.stringify(groupAdminMemberListObj)}`;
          if ( config.verboseSessionOutput ) await session.send(groupAdminMemberListObjMsg);
          if ( config.verboseConsoleOutput ) ctx.logger.info(groupAdminMemberListObjMsg);

          if (groupAdminMemberListObj.length === 0) {
            return session.send("该群没有管理员。");
          }

          // 获取管理员头像并转换为 AdminInfo 格式
          const adminListArg: UnifiedAdminInfo[] = [];
          for (const member of groupAdminMemberListObj) {
            try {
              // @ts-ignore - getGroupMemberList()返回的数组里面，每一个member对象 实际包含 user_id 字段，但类型定义中缺失 (here ↓)
              // node_modules/koishi-plugin-adapter-onebot/lib/types.d.ts:  export interface GroupMemberInfo extends SenderInfo
              const userObj = await session.bot.getUser(member.user_id);
              const rawAdminInfo = {
                user_id: member.user_id,
                nickname: member.nickname,
                card: member.card,
                role: member.role as 'owner' | 'admin',
                level: member.level,
                join_time: member.join_time,
                last_sent_time: member.last_sent_time,
                title: member.title,
                avatar: userObj.avatar || ''
              };
              adminListArg.push(convertToUnifiedAdminInfo(rawAdminInfo, config.onebotImplName));
            } catch (error) {
              ctx.logger.error(`获取管理员列表信息失败: ${error}`);
            }
          }

          adminListArg.sort((a, b) => {
            // 群主优先
            if (a.role === 'owner' && b.role !== 'owner') return -1
            if (a.role !== 'owner' && b.role === 'owner') return 1

            // 非群主之间按 card 字典序降序
            const cardA = a.card || ''
            const cardB = b.card || ''
            return cardB.localeCompare(cardA, 'zh') // 支持中文拼音
          })

          const contextInfo = {
            isGroup: true,
            groupId: parseInt(session.guildId),
            groupName: groupInfoObj.group_name || '未知群聊',
            memberCount: groupInfoObj.member_count || 0,
            maxMemberCount: groupInfoObj.max_member_count || 0,
            groupAvatarUrl: `https://p.qlogo.cn/gh/${session.guildId}/${session.guildId}/640/`
          };

          if (config.sendText) {
            const unifiedContextInfo = convertToUnifiedContextInfo(contextInfo, config.onebotImplName);
            const formattedText = formatAdminListDirectText(adminListArg, unifiedContextInfo);
            await session.send(`${config.enableQuoteWithText ? h.quote(session.messageId) : ''}${formattedText}`);
          }

          if (config.sendImage) {
            ctx.logger.info(`context info = ${JSON.stringify(contextInfo)}`)
            const waitTipMsgId = await session.send(`${h.quote(session.messageId)}🔄正在渲染群管理员列表图片，请稍候⏳...`);
            const unifiedContextInfo = convertToUnifiedContextInfo(contextInfo, config.onebotImplName);
            const selectedImageStyle = IMAGE_STYLES[selectedStyleDetailObj.styleKey];
            const selectedDarkMode = selectedStyleDetailObj.darkMode;
            const adminListImageBase64 = await renderAdminList(ctx, adminListArg, unifiedContextInfo, selectedImageStyle, selectedDarkMode, config.imageType, config.screenshotQuality);
            await session.send(`${config.enableQuoteWithImage ? h.quote(session.messageId) : ''}${h.image(`data:image/png;base64,${adminListImageBase64}`)}`);
            await session.bot.deleteMessage(session.guildId, String(waitTipMsgId));
          }

          if (config.sendForward) {
            const unifiedContextInfo = convertToUnifiedContextInfo(contextInfo, config.onebotImplName);
            const forwardMessageContent = formatAdminListForwardText(adminListArg, unifiedContextInfo);
            await session.send(h.unescape(forwardMessageContent));
          }

        } catch (error) {
          ctx.logger.error(`获取群管理员列表失败: ${error}`);
          await session.send(`[error]获取群管理员列表失败: ${error.message}`);
        }
      })

    // ctx.command("debug")
    //   .action(async ({ session }) => {

    //     //write debug code here (*╹▽╹*)

    //   });

    function formatUserInfoDirectText(userInfo: UnifiedUserInfo, contextInfo: UnifiedContextInfo): string {
      let output = '';

      // User Information
      output += `----- 用户信息 (UserInfo) -----\n`;
      output += `QQ号\t(UserID): \t\t ${userInfo.user_id}\n`;
      if (userInfo.nickname) output += `昵称\t\t(Nickname): \t ${userInfo.nickname}\n`;
      if (userInfo.card) output += `群昵称\t(GroupCard): \t ${userInfo.card}\n`;
      if (userInfo.sex) output += `性别\t\t(Gender): \t ${userInfo.sex === 'male' ? '男 (Male)' : userInfo.sex === 'female' ? '女 (Female)' : '未知 (Unknown)'}\n`;
      if (userInfo.age) output += `年龄\t\t(Age): \t\t ${userInfo.age}\n`;
      if (userInfo.level) output += `等级\t\t(Level): \t\t ${userInfo.level}\n`;
      if (userInfo.sign) output += `个性签名\t(Signature): \t ${userInfo.sign}\n`;
      if (userInfo.role) output += `群角色\t(GroupRole): \t ${userInfo.role === 'owner' ? '群主 (Owner)' : userInfo.role === 'admin' ? '管理员 (Admin)' : '成员 (Member)'}\n`;
      if (userInfo.join_time) output += `入群时间\t(JoinTime): \t ${new Date(userInfo.join_time).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}\n`;
      if (userInfo.RegisterTime) output += `注册时间\t(RegTime): \t ${new Date(userInfo.RegisterTime).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}\n`;


      // Context Information (Group/Private Chat Specifics)
      output += `\n--- 会话信息 (ContextInfo) ---\n`;
      output += `是否群聊 \t (IsGroupChat): ${contextInfo.isGroup ? '是 (Yes)' : '否 (No)'}\n`;
      if (contextInfo.isGroup && contextInfo.groupId) output += `群号 \t (GroupID): \t ${contextInfo.groupId}\n`;

      return output;
    }

    function formatUserInfoForwardText(botSelf: any, userInfo: UnifiedUserInfo, contextInfo: UnifiedContextInfo): string {
      let messages = '';

      // Helper to add a message block
      const addMessageBlock = (authorId: string, authorName: string, value: string) => {
        messages += `
          <message>
            <author ${authorId ? `id="${authorId}"` : ``} ${authorName ? `name="${authorName}"` : ``}/>
            ${value}
          </message>`;
      };

      // User Information
      addMessageBlock(undefined, '当前时间 (CurrentTime):', `${new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`);
      addMessageBlock(undefined, '信息类型 (InfoType):', '用户信息 (User Info)');
      addMessageBlock(userInfo.user_id, undefined, `QQ号 (UserID):\t${userInfo.user_id}`);
      if (userInfo.nickname) addMessageBlock(userInfo.user_id, undefined, `昵称 (Nickname):\t${userInfo.nickname}`);
      if (userInfo.card) addMessageBlock(userInfo.user_id, undefined, `群昵称 (GroupCard):\t${userInfo.card}`);
      if (userInfo.sex) addMessageBlock(userInfo.user_id, undefined, `性别 (Gender):\t\t${userInfo.sex === 'male' ? '男 (Male)' : userInfo.sex === 'female' ? '女 (Female)' : '未知 (Unknown)'}`);
      if (userInfo.age !== undefined && userInfo.age !== null) addMessageBlock(userInfo.user_id, undefined, `年龄 (Age):\t${userInfo.age}`);
      if (userInfo.level) addMessageBlock(userInfo.user_id, undefined, `等级 (Level):\t${userInfo.level}`);
      if (userInfo.sign) addMessageBlock(userInfo.user_id, undefined, `个性签名 (Signature):\t${userInfo.sign}`);
      if (userInfo.role) addMessageBlock(userInfo.user_id, undefined, `群角色 (GroupRole):\t\t${userInfo.role === 'owner' ? '群主 (Owner)' : userInfo.role === 'admin' ? '管理员 (Admin)' : '成员 (Member)'}`);
      if (userInfo.join_time) addMessageBlock(userInfo.user_id, undefined, `入群时间 (JoinTime):\t${new Date(userInfo.join_time).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`);
      if (userInfo.RegisterTime) addMessageBlock(userInfo.user_id, undefined, `注册时间 (RegTime):\t${new Date(userInfo.RegisterTime).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`);


      // Context Information (Group/Private Chat Specifics)
      addMessageBlock(botSelf.userId, '信息类型 (Info Type):', '会话信息 (Context Info)');
      addMessageBlock(botSelf.userId, '是否群聊 (Is Group Chat):', `${contextInfo.isGroup ? '是 (Yes)' : '否 (No)'}`);
      if (contextInfo.isGroup && contextInfo.groupId) addMessageBlock(botSelf.userId, '群号 (Group ID):', `${contextInfo.groupId}`);

      // Wrap all messages in the forward tag
      return `<message forward>\n${messages}\n</message>`;
    }

    function formatAdminListDirectText(adminListArg: UnifiedAdminInfo[], contextInfo: UnifiedContextInfo): string {
      let output = '';

      output += `当前时间 (Current Time): ${new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}\n`;
      output += `===== 群管理员列表 (Group Admin List) =====\n`;
      output += `群名称 (Group Name): ${contextInfo.groupName || '未知群聊'}\n`;
      output += `群号 (Group ID): ${contextInfo.groupId}\n`;
      output += `成员数 (Member Count): ${contextInfo.memberCount}/${contextInfo.maxMemberCount}\n`;
      output += `管理员数量 (Admin Count): ${adminListArg.length}\n\n`;

      adminListArg.forEach((admin, index) => {
        output += `-----No. ${index + 1}. ${admin.role === 'owner' ? '群主' : '管理员'} (${admin.role === 'owner' ? 'Owner' : 'Admin'})-----\n`;
        output += `   QQ号 (User ID): ${admin.user_id}\n`;
        output += `   昵称 (Nickname): ${admin.nickname || '未知'}\n`;
        if (admin.card) output += `   群名片 (Group Card): ${admin.card}\n`;
        if (admin.level) output += `   等级 (Level): ${admin.level}\n`;
        if (admin.join_time) output += `   入群时间 (Join Time): ${new Date(admin.join_time * 1000).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}\n`;
        if (admin.title) output += `   头衔 (Title): ${admin.title}\n`;
        output += '\n';
      });

      return output;
    }

    function formatAdminListForwardText(adminListArg: UnifiedAdminInfo[], contextInfo: UnifiedContextInfo): string {
        let messages = '';

        // Helper to add a message block with author
        const addMessageBlock = (authorId: string, authorName: string, adminUsrInfoStr: string) => {
            messages += `
              <message>
                <author ${authorId ? `id="${authorId}"` : ``} name="${authorName}"/>
                ${adminUsrInfoStr}
              </message>`;
        };

        // First message: Group basic information
        addMessageBlock(
            undefined,
            '群聊基本信息',
            [
              `当前时间: \t ${new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
              `=========群聊信息=========`,
              `群名称: \t ${contextInfo.groupName || '未知群聊'}`,
              `群号: \t ${contextInfo.groupId}`,
              `成员数: \t ${contextInfo.memberCount}/${contextInfo.maxMemberCount}`,
              `管理员数量: \t ${adminListArg.length}`
            ].join('\n')
        );

        // Subsequent messages: Each admin's full information
        // for (const admin of adminListArg) {
        for ( let i = 0; i < adminListArg.length; i++ ) {
            const admin = adminListArg[i];
            const authorName = admin.card || admin.nickname || `QQ: ${admin.user_id}`;
            const adminDetails = [
                `---------No. ${i+1}---------`,
                `QQ号: \t ${admin.user_id}`,
                `昵称: \t ${admin.nickname}`,
                `角色: \t ${admin.role === 'owner' ? '群主' : '管理员'}`,
                admin.card ? `群昵称: \t ${admin.card}` : '',
                admin.level ? `等级: \t ${admin.level}` : '',
                admin.title ? `群头衔: \t ${admin.title}` : '',
                admin.join_time ? `加入本群时间: \t ${new Date(admin.join_time * 1000).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}` : '',
                admin.last_sent_time ? `最后发言时间: \t ${new Date(admin.last_sent_time * 1000).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}` : '',
                
            ].filter(Boolean).join('\n'); // Filter out empty strings and join with newline

            addMessageBlock(
              admin.user_id.toString(),
              authorName,
              adminDetails
            );
        }
        
        // Wrap all messages in the forward tag
        return `<message forward>\n${messages}\n</message>`;
    }

}

