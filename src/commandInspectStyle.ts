import { Context } from 'koishi'
import { Config } from './index'
import { IMAGE_STYLES } from './type'

export function registerInspectStyleCommand(ctx: Context, config: Config) {
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
}
