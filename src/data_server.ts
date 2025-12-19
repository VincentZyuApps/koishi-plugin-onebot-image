import { Context } from 'koishi';
import { DataService } from '@koishijs/plugin-console';
import { getSourceHanSerifSCStyleUserInfoHtmlStr, getFlatMinimalUserInfoHtmlStr, getLXGWWenKaiUserInfoHtmlStr } from './renderUserInfo';
import { UnifiedUserInfo, UnifiedContextInfo, IMAGE_STYLES, ImageStyle } from './type';
import { validateFonts, getFontBase64 } from './utils';
import * as path from 'path';

// 模板类型
export type TemplateType = 'sourceHanSerif' | 'flatMinimal' | 'lxgwWenKai';
// 字体类型
export type FontType = 'sourceHanSerif' | 'lxgwWenKai';

declare module '@koishijs/plugin-console' {
    namespace Console {
        interface Services {
            'onebot-info-image': BotInfoData;
        }
    }
    interface Events {
        'onebot-info-image/refresh'(): void;
        'onebot-info-image/setTemplate'(template: TemplateType): void;
        'onebot-info-image/setFont'(font: FontType): void;
        'onebot-info-image/setDarkMode'(darkMode: boolean): void;
    }
}

export interface BotInfoData {
    status: 'loading' | 'no_bot' | 'error' | 'loaded';
    msg: string;
    htmlContent?: string;
    currentTemplate?: TemplateType;
    currentFont?: FontType;
    currentDarkMode?: boolean;
}

export class OnebotInfoImageDataServer extends DataService<BotInfoData> {
    public fontsBase64: Record<FontType, string> = {
        sourceHanSerif: '',
        lxgwWenKai: '',
    };
    public fontLoaded: boolean = false;
    public currentTemplate: TemplateType = 'sourceHanSerif';
    public currentFont: FontType = 'sourceHanSerif';
    public currentDarkMode: boolean = true;
    
    static inject = ['console'];

    constructor(ctx: Context) {
        super(ctx, 'onebot-info-image', { immediate: true });
        
        // 预加载字体（先确保下载完毕）
        this.loadFonts();
        
        // 注册 DataService 的客户端入口
        ctx.console.addEntry({
            dev: path.resolve(__dirname, '../client/index.ts'),
            prod: path.resolve(__dirname, '../dist'),
        });
        
        // 注册刷新事件
        ctx.console.addListener('onebot-info-image/refresh', async () => {
            await this.refresh();
        }, { authority: 0 });
        
        // 注册设置模板事件
        ctx.console.addListener('onebot-info-image/setTemplate', async (template: TemplateType) => {
            this.currentTemplate = template;
            await this.refresh();
        }, { authority: 0 });
        
        // 注册设置字体事件
        ctx.console.addListener('onebot-info-image/setFont', async (font: FontType) => {
            this.currentFont = font;
            await this.refresh();
        }, { authority: 0 });
        
        // 注册设置深色模式事件
        ctx.console.addListener('onebot-info-image/setDarkMode', async (darkMode: boolean) => {
            this.currentDarkMode = darkMode;
            await this.refresh();
        }, { authority: 0 });
        
        // 监听 bot 状态变化
        ctx.on('bot-status-updated', async () => {
            await this.refresh();
        });
    }
    
    private async loadFonts() {
        try {
            // 先确保字体文件已下载
            await validateFonts(this.ctx);
            
            // 加载两种字体
            this.fontsBase64.sourceHanSerif = await getFontBase64(this.ctx, IMAGE_STYLES.SOURCE_HAN_SERIF_SC);
            this.fontsBase64.lxgwWenKai = await getFontBase64(this.ctx, IMAGE_STYLES.LXGW_WENKAI);
            
            this.fontLoaded = true;
            this.ctx.logger('onebot-info-image').info('字体加载完成');
            
            // 字体加载完成后刷新数据
            await this.refresh();
        } catch (e) {
            this.ctx.logger('onebot-info-image').warn('加载字体失败:', e);
            this.fontLoaded = true; // 即使失败也标记为完成，避免一直等待
            await this.refresh();
        }
    }
    
    private getHtmlGenerator(template: TemplateType) {
        switch (template) {
            case 'sourceHanSerif':
                return getSourceHanSerifSCStyleUserInfoHtmlStr;
            case 'flatMinimal':
                return getFlatMinimalUserInfoHtmlStr;
            case 'lxgwWenKai':
                return getLXGWWenKaiUserInfoHtmlStr;
            default:
                return getSourceHanSerifSCStyleUserInfoHtmlStr;
        }
    }

    async get(): Promise<BotInfoData> {
        try {
            // 等待字体加载完成
            if (!this.fontLoaded) {
                return {
                    status: 'loading',
                    msg: '正在加载字体...',
                };
            }
            
            // 查找 OneBot 平台的 bot
            const onebotBot = this.ctx.bots.find(b => b.platform === 'onebot');
            
            if (!onebotBot) {
                return {
                    status: 'no_bot',
                    msg: '未找到 OneBot 平台的机器人',
                };
            }
            
            // 获取 bot 自身信息
            const selfId = onebotBot.selfId;
            const loginInfo = await onebotBot.internal.getLoginInfo();
            const strangerInfo = await onebotBot.internal.getStrangerInfo(Number(selfId));
            
            // 获取头像
            const avatarUrl = `https://q.qlogo.cn/headimg_dl?dst_uin=${selfId}&spec=640&img_type=jpg`;
            let avatarBase64 = '';
            try {
                const response = await this.ctx.http.get(avatarUrl, { responseType: 'arraybuffer' });
                avatarBase64 = Buffer.from(response).toString('base64');
            } catch (e) {
                this.ctx.logger('onebot-info-image').warn('获取头像失败:', e);
            }
            
            // 构建 UserInfo
            const userInfo: UnifiedUserInfo = {
                user_id: selfId,
                nickname: loginInfo.nickname || strangerInfo.nickname,
                sex: strangerInfo.sex || '',
                age: strangerInfo.age || 0,
                sign: strangerInfo.sign,
                level: strangerInfo.level,
                login_days: strangerInfo.login_days,
                qid: strangerInfo.qid,
            };
            
            // 构建 ContextInfo
            const contextInfo: UnifiedContextInfo = {
                isGroup: false,
            };
            
            // 获取当前选择的字体
            const fontBase64 = this.fontsBase64[this.currentFont] || '';
            
            // 获取对应的 HTML 生成器
            const htmlGenerator = this.getHtmlGenerator(this.currentTemplate);
            
            // 生成 HTML (WebUI 预览中默认隐藏手机号)
            const htmlContent = await htmlGenerator(
                userInfo,
                contextInfo,
                avatarBase64,
                '',
                fontBase64,
                this.currentDarkMode, // 使用当前选择的主题模式
                true // hidePhoneNumber: 预览中默认隐藏手机号
            );
            
            return {
                status: 'loaded',
                msg: '加载成功',
                htmlContent,
                currentTemplate: this.currentTemplate,
                currentFont: this.currentFont,
                currentDarkMode: this.currentDarkMode,
            };
        } catch (e) {
            this.ctx.logger('onebot-info-image').error('获取 Bot 信息失败:', e);
            return {
                status: 'error',
                msg: `获取失败: ${e.message || e}`,
            };
        }
    }
}
