// index.ts
import { Context, Schema, h } from 'koishi'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import {} from 'koishi-plugin-adapter-onebot';
import {} from '@koishijs/plugin-console';

import { IMAGE_STYLES, type ImageStyle, type ImageStyleKey, IMAGE_STYLE_KEY_ARR, IMAGE_TYPES, type ImageType, ONEBOT_IMPL_NAME, type OneBotImplName, getNapcatQQStatusText } from './type';
import { renderUserInfo } from './renderUserInfo'
import { renderAdminList } from './renderAdminList'
import { convertToUnifiedUserInfo, convertToUnifiedAdminInfo, convertToUnifiedContextInfo, UnifiedUserInfo, UnifiedAdminInfo, UnifiedContextInfo } from './type'
import { validateFonts } from './utils'
import { OnebotInfoImageDataServer } from './data_server'
import { registerInspectStyleCommand } from './commandInspectStyle'
import { registerUserInfoCommand } from './commandUserInfo'
import { registerAdminListCommand } from './commandAdminList'
import { registerGroupEssenceCommand } from './commandGroupEssence'
import { registerGroupEssenceDetailCommand } from './commandGroupEssenceDetail'
import { registerGroupNoticeCommand } from './commandGroupNotice'
import { registerGroupNoticeDetailCommand } from './commandGroupNoticeDetail'

export const name = 'onebot-info-image'

export const inject = {
    required: ["puppeteer", "http"]
}

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json'), 'utf-8')
)

export const usage = `
<h1>Koishi 插件：onebot-info-image 获取群员信息 渲染成图像</h1>
<h2>🎯 插件版本：<span style="color: #ff6b6b; font-weight: bold;">v${pkg.version}</span></h2>
<p>插件使用问题 / Bug反馈 / 插件开发交流，欢迎加入QQ群：<b style="color: #50c878;">259248174</b></p>

<p>目前仅仅适配了 <b>Lagrange</b> 和 <b>Napcat</b> 协议</p>
<p style="color: #f39c12;">Napcat能拿到的东西更多， 为了更好的使用体验，推荐使用 Napcat</p>

<hr>

<p>📦 插件仓库地址：</p>
<ul>
  <li><a href="https://gitee.com/vincent-zyu/koishi-plugin-onebot-image">Gitee</a></li>
  <li><a href="https://github.com/VincentZyu233/koishi-plugin-onebot-image">GitHub</a></li>
</ul>

<hr>

<h3 style="color: #27ae60;">字体使用声明</h3>
<p>本插件使用以下开源字体进行图像渲染：</p>
<ul>
  <li><b style="color: #3498db;">思源宋体（Source Han Serif SC）</b> - 由 Adobe 与 Google 联合开发，遵循 <a href="https://openfontlicense.org">SIL Open Font License 1.1</a> 协议。</li>
  <li><b style="color: #3498db;">霞鹜文楷（LXGW WenKai）</b> - 由 LXGW 开发并维护，遵循 <a href="https://openfontlicense.org">SIL Open Font License 1.1</a> 协议。</li>
</ul>
<p>两者均为自由字体，可在本项目中自由使用、修改与发布。若你也在开发相关插件或项目，欢迎一同使用这些优秀的字体。</p>

<hr>

<h3 style="color: #e67e22;">插件许可声明</h3>
<p>本插件为开源免费项目，基于 MIT 协议开放。欢迎修改、分发、二创。</p>
<p>如果你觉得插件好用，欢迎在 GitHub 上 ⭐ Star 或通过其他方式给予支持（例如提供服务器、API Key 或直接赞助）！</p>
<p style="color: #e91e63;">感谢所有开源字体与项目的贡献者 ❤️</p>
`

export interface ImageStyleDetail {
  styleKey: ImageStyleKey;
  darkMode: boolean;
}

export interface Config {
  onebotImplName: OneBotImplName;

  enableUserInfoCommand: boolean;
  userinfoCommandName: string;
  hidePhoneNumber: boolean;
  enableGroupAdminListCommand: boolean;
  groupAdminListCommandName: string;
  enableGroupEssenceCommand: boolean;
  groupEssenceCommandName: string;
  groupEssenceDetailCommandName: string;
  groupEssencePageSize: number;
  enableGroupNoticeCommand: boolean;
  groupNoticeCommandName: string;
  groupNoticeDetailCommandName: string;
  groupNoticePageSize: number;
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
    hidePhoneNumber: Schema.boolean()
      .default(true)
      .experimental()
      .description('📱 是否隐藏手机号。开启后手机号将显示为【已隐藏】。</br> <i> 保护隐私捏 </i>'),
    enableGroupAdminListCommand: Schema.boolean()
      .default(false)
      .description('👥 是否启用群管理员列表命令。'),
    groupAdminListCommandName: Schema.string()
      .default('群管理列表')
      .description('👥 群管理员列表命令名称。'),
    enableGroupEssenceCommand: Schema.boolean()
      .default(true)
      .description('📌 是否启用群精华消息命令。'),
    groupEssenceCommandName: Schema.string()
      .default('群精华')
      .description('📌 群精华消息列表命令名称。'),
    groupEssenceDetailCommandName: Schema.string()
      .default('群精华详情')
      .description('🔍 群精华详情命令名称。'),
    groupEssencePageSize: Schema.number()
      .min(1).max(20).step(1)
      .default(10)
      .description('📌 群精华消息每页显示条数。'),
    enableGroupNoticeCommand: Schema.boolean()
      .default(true)
      .description('📢 是否启用群公告命令。'),
    groupNoticeCommandName: Schema.string()
      .default('群公告')
      .description('📢 群公告列表命令名称。'),
    groupNoticeDetailCommandName: Schema.string()
      .default('群公告详情')
      .description('🔍 群公告详情命令名称。'),
    groupNoticePageSize: Schema.number()
      .min(1).max(20).step(1)
      .default(10)
      .description('📢 群公告每页显示条数。'),
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

  // 注册 DataService (如果 console 服务可用)
  ctx.plugin(OnebotInfoImageDataServer);

  //帮助文本中的 结果信息格式
  const responseHint = [
    config.sendText && '文本消息',
    config.sendImage && '图片消息',
    config.sendForward && '合并转发消息'
  ].filter(Boolean).join('、');

  // 注册指令
  registerInspectStyleCommand(ctx, config);
  registerUserInfoCommand(ctx, config, responseHint);
  registerAdminListCommand(ctx, config, responseHint);
  registerGroupEssenceCommand(ctx, config, responseHint);
  registerGroupEssenceDetailCommand(ctx, config, responseHint);
  registerGroupNoticeCommand(ctx, config, responseHint);
  registerGroupNoticeDetailCommand(ctx, config, responseHint);

}

