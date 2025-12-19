<template>
    <div v-if="status === 'loading'" class="oii-loading-wrapper">
        <div class="oii-spinner"></div>
        <p>{{ dataServer.msg }}</p>
    </div>

    <k-comment v-if="status === 'no_bot'" type="warning">
        <div class="oii-comment">
            <p>未找到 OneBot 平台的机器人</p>
            <p style="font-size: 12px; color: #888;">请确保已连接 OneBot 协议的机器人</p>
            <k-button @click="refresh">刷新</k-button>
        </div>
    </k-comment>

    <k-comment v-if="status === 'error'" type="error">
        <div class="oii-comment">
            <p>{{ dataServer.msg }}</p>
            <k-button @click="refresh">重试</k-button>
        </div>
    </k-comment>

    <template v-if="status === 'loaded'">
        <div class="oii-bot-info-card oii-fade-in">
            <div class="oii-card-header">
                <div class="oii-header-left">
                    <h3>🤖 aui指令渲染效果预览捏</h3>
                    <!-- 刷新按钮 -->
                    <button class="oii-refresh-btn" @click="refresh" title="刷新预览">
                        <span class="oii-refresh-icon">🔄</span>
                    </button>
                </div>
                <div class="oii-controls">
                    <!-- 模板选择 -->
                    <div class="oii-select-wrapper">
                        <span class="oii-select-icon">🎨</span>
                        <select v-model="selectedTemplate" @change="onTemplateChange" class="oii-select">
                            <option value="sourceHanSerif">思源宋体风格</option>
                            <option value="flatMinimal">扁平简约风格</option>
                            <option value="lxgwWenKai">文楷风格</option>
                        </select>
                        <span class="oii-select-arrow">▼</span>
                    </div>
                    
                    <!-- 字体选择 -->
                    <div class="oii-select-wrapper">
                        <span class="oii-select-icon">✏️</span>
                        <select v-model="selectedFont" @change="onFontChange" class="oii-select">
                            <option value="sourceHanSerif">思源宋体</option>
                            <option value="lxgwWenKai">霞鹜文楷</option>
                        </select>
                        <span class="oii-select-arrow">▼</span>
                    </div>
                    
                    <!-- 主题选择 -->
                    <div class="oii-select-wrapper">
                        <span class="oii-select-icon">{{ isDarkMode ? '🌙' : '☀️' }}</span>
                        <select v-model="isDarkMode" @change="onThemeChange" class="oii-select oii-theme-select">
                            <option :value="true">深色模式</option>
                            <option :value="false">浅色模式</option>
                        </select>
                        <span class="oii-select-arrow">▼</span>
                    </div>
                </div>
            </div>
            <div class="oii-card-content">
                <iframe 
                    :srcdoc="processedHtml" 
                    class="oii-iframe"
                    frameborder="0"
                    scrolling="no"
                ></iframe>
            </div>
        </div>
    </template>
</template>

<script lang="ts" setup>
import { store, send } from "@koishijs/client";
import { computed, inject, ref, watch } from "vue";

type TemplateType = 'sourceHanSerif' | 'flatMinimal' | 'lxgwWenKai';
type FontType = 'sourceHanSerif' | 'lxgwWenKai';

interface BotInfoData {
    status: 'loading' | 'no_bot' | 'error' | 'loaded';
    msg: string;
    htmlContent?: string;
    currentTemplate?: TemplateType;
    currentFont?: FontType;
    currentDarkMode?: boolean;
}

const local: any = inject('manager.settings.local');

const dataServer = ref<BotInfoData>({
    status: 'loading',
    msg: '正在加载...'
});

const selectedTemplate = ref<TemplateType>('sourceHanSerif');
const selectedFont = ref<FontType>('sourceHanSerif');
const isDarkMode = ref<boolean>(true);

const status = computed(() => {
    // 防止其他页面出现该内容
    if (local.value.name !== "koishi-plugin-onebot-info-image") return;
    
    // @ts-ignore 类型定义在服务端，这里忽略类型检查
    const data = store["onebot-info-image"];
    if (data) {
        dataServer.value = data;
        // 同步服务端的选择状态
        if (data.currentTemplate) selectedTemplate.value = data.currentTemplate;
        if (data.currentFont) selectedFont.value = data.currentFont;
        if (data.currentDarkMode !== undefined) isDarkMode.value = data.currentDarkMode;
        return data.status;
    }
    return 'loading';
});

// 处理 HTML：移除时间戳，调整尺寸
const processedHtml = computed(() => {
    let html = dataServer.value.htmlContent || '';
    
    // 移除时间戳水印
    html = html.replace(/<div class="timestamp-watermark">.*?<\/div>/g, '');
    html = html.replace(/<div class="timestamp">.*?<\/div>/g, '');
    
    // 调整 body 尺寸为更小的值
    html = html.replace(/width:\s*999px/g, 'width: 100%');
    html = html.replace(/height:\s*999px/g, 'height: auto; min-height: 500px');
    
    // 调整 card 尺寸
    html = html.replace(/width:\s*920px/g, 'width: 100%');
    html = html.replace(/height:\s*920px/g, 'height: auto');
    
    return html;
});

const refresh = () => {
    send("onebot-info-image/refresh" as any);
};

const onTemplateChange = () => {
    send("onebot-info-image/setTemplate" as any, selectedTemplate.value);
};

const onFontChange = () => {
    send("onebot-info-image/setFont" as any, selectedFont.value);
};

const onThemeChange = () => {
    send("onebot-info-image/setDarkMode" as any, isDarkMode.value);
};
</script>

<style lang="scss" scoped>
.oii-loading-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    gap: 16px;
}

.oii-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-left-color: #fb7299;
    border-radius: 50%;
    animation: oii-spin 1s linear infinite;
}

@keyframes oii-spin {
    to { transform: rotate(360deg); }
}

.oii-comment {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 20px;
}

.oii-bot-info-card {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
    
    .oii-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 18px 24px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        flex-wrap: wrap;
        gap: 14px;
        
        .oii-header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        h3 {
            margin: 0;
            font-size: 17px;
            font-weight: 600;
            background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.8) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .oii-controls {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }
    }
    
    .oii-card-content {
        padding: 20px;
        overflow: hidden;
        
        .oii-iframe {
            width: 100%;
            height: 888px;
            border: none;
            border-radius: 16px;
            background: transparent;
        }
    }
}

// 美化下拉框
.oii-select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    
    .oii-select-icon {
        position: absolute;
        left: 12px;
        font-size: 14px;
        pointer-events: none;
        z-index: 1;
    }
    
    .oii-select-arrow {
        position: absolute;
        right: 12px;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.5);
        pointer-events: none;
        transition: transform 0.2s ease;
    }
    
    &:hover .oii-select-arrow {
        transform: translateY(2px);
    }
    
    .oii-select {
        appearance: none;
        -webkit-appearance: none;
        padding: 10px 36px 10px 38px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
        color: #fff;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        outline: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        min-width: 140px;
        
        &:hover {
            border-color: rgba(251, 114, 153, 0.5);
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
            box-shadow: 0 4px 12px rgba(251, 114, 153, 0.15);
        }
        
        &:focus {
            border-color: #fb7299;
            box-shadow: 0 0 0 3px rgba(251, 114, 153, 0.2), 0 4px 12px rgba(251, 114, 153, 0.2);
        }
        
        option {
            background: #1e1e2e;
            color: #fff;
            padding: 10px;
        }
    }
    
    // 主题选择下拉框特殊宽度
    .oii-theme-select {
        min-width: 120px;
    }
}

// 刷新按钮
.oii-refresh-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    .oii-refresh-icon {
        font-size: 18px;
        transition: transform 0.4s ease;
    }
    
    &:hover {
        border-color: rgba(251, 114, 153, 0.5);
        background: linear-gradient(135deg, rgba(251, 114, 153, 0.2) 0%, rgba(251, 114, 153, 0.1) 100%);
        box-shadow: 0 4px 12px rgba(251, 114, 153, 0.2);
        
        .oii-refresh-icon {
            transform: rotate(180deg);
        }
    }
    
    &:active {
        transform: scale(0.95);
        
        .oii-refresh-icon {
            transform: rotate(360deg);
        }
    }
}

.oii-fade-in {
    animation: oii-fadeIn 0.5s ease-out;
}

@keyframes oii-fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
