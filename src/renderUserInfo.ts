// render.ts
import { Context } from 'koishi';
import { } from 'koishi-plugin-puppeteer'; // 引入 puppeteer 类型，但不直接使用 Puppeteer 类

import { IMAGE_STYLES, FONT_FILES, type ImageStyle, ImageType, UnifiedUserInfo, UnifiedContextInfo } from './type';
import { generateTimestamp, getGroupAvatarBase64, getFontBase64 } from './utils';

const formatMsTimestamp = (timestamp) => {
    if (!timestamp) return '<span class="unknown">未知</span>';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
};

export const getSourceHanSerifSCStyleUserInfoHtmlStr = async (userInfo, contextInfo, avatarBase64, groupAvatarBase64, fontBase64, enableDarkMode, hidePhoneNumber = true) => {
    const timestamp = generateTimestamp();

    const backgroundStyle = avatarBase64
        ? `background-image: url(data:image/jpeg;base64,${avatarBase64});`
        : `background-color: #f0f2f5;`;

    const getValue = (value, fallback = '<span class="unknown">未知</span>') => value && value !== '-' ? value : fallback;

    const getSex = (sex) => sex === 'male' ? '男' : sex === 'female' ? '女' : '<span class="unknown">未知</span>';

    const getShengXiao = (num) => {
        const shengXiaoMap = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
        return shengXiaoMap[num - 1] || '';
    };

    const getConstellation = (num) => {
        const constellationMap = ['水瓶座', '双鱼座', '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座'];
        return constellationMap[num - 1] || '';
    };

    const getBloodType = (num) => {
        const bloodTypeMap = ['O', 'A', 'B', 'AB'];
        const type = bloodTypeMap[num];
        return type ? `${type}型` : '';
    };

    const getLocationString = (userInfo) => {
        const locationParts = [userInfo.country, userInfo.province, userInfo.city, userInfo.postCode]
            .filter(part => part && part !== '0' && part !== '-');
        let locationStr = locationParts.length > 0 ? locationParts.join('-') : '';
        if (userInfo.address && userInfo.address !== locationStr) {
            locationStr = locationStr ? `${locationStr} ${userInfo.address}` : userInfo.address;
        }
        return getValue(locationStr);
    };

    const getBirthday = (userInfo) => {
        if (userInfo.birthday_year && userInfo.birthday_month && userInfo.birthday_day) {
            return `${userInfo.birthday_year}年${userInfo.birthday_month}月${userInfo.birthday_day}日`;
        }
        return '<span class="unknown">未知</span>';
    };

    const getInfoItem = (label, value, fullWidth = false) => `
        <div class="info-item${fullWidth ? ' full-width' : ''}">
            <div class="info-label">${label}</div>
            <div class="info-value">${value}</div>
        </div>
    `;

    const getGroupInfoItem = (label, value, className = '') => `
        <div class="info-item ${className}">
            <div class="info-label">${label}</div>
            <div class="info-value">${value}</div>
        </div>
    `;

    const infoItems = [
        getInfoItem('QQ昵称', getValue(userInfo.nickname)),
        getInfoItem('性别', getSex(userInfo.sex)),
        getInfoItem('年龄', getValue(userInfo.age)),
        getInfoItem('QQ等级', getValue(userInfo.qq_level || userInfo.level)),
        getInfoItem('QID', getValue(userInfo.q_id || userInfo.qid)),
        getInfoItem('注册时间', formatMsTimestamp(userInfo.RegisterTime)),
        getInfoItem('个性签名', getValue(userInfo.sign || userInfo.longNick || userInfo.long_nick), true),
        getInfoItem('邮箱', getValue(userInfo.eMail || userInfo.email)),
        getInfoItem('电话', hidePhoneNumber ? '<span class="unknown">已隐藏</span>' : getValue(userInfo.phoneNum || userInfo.phone)),
        getInfoItem('地址信息', getLocationString(userInfo), true),
        `
        <div class="two-column-row">
            <div class="info-item">
                <div class="info-label">生肖</div>
                <div class="info-value">${getValue(getShengXiao(userInfo.shengXiao))}</div>
            </div>
            <div class="info-item">
                <div class="info-label">星座</div>
                <div class="info-value">${getValue(getConstellation(userInfo.constellation))}</div>
            </div>
        </div>
        `,
        getInfoItem('生日', getBirthday(userInfo), true),
        getInfoItem('VIP信息', `VIP: ${userInfo.is_vip ? '是' : '否'} | 年费VIP: ${userInfo.is_years_vip ? '是' : '否'} | VIP等级: ${userInfo.vip_level || 0}`, true),
        getInfoItem('状态', getValue((userInfo.status && userInfo.status.message)), true)
    ];

    const groupSpecificHtml = contextInfo.isGroup ? `
        <div class="group-info-container">
            <div class="group-info-header">
                <div class="group-avatar-wrapper">
                    ${groupAvatarBase64 ? `<img class="group-avatar" src="data:image/jpeg;base64,${groupAvatarBase64}" alt="Group Avatar">` : ''}
                    <div class="group-name-and-count">
                        <div class="group-name">群名: ${contextInfo.groupName || '未知群名'}</div>
                        <div class="group-id">群号: ${contextInfo.groupId}</div>
                        ${contextInfo.memberCount && contextInfo.maxMemberCount ? `<div class="group-member-count">群人数: ${contextInfo.memberCount}/${contextInfo.maxMemberCount}</div>` : contextInfo.memberCount ? `<div class="group-member-count">群人数: ${contextInfo.memberCount}</div>` : ''}
                    </div>
                </div>
            </div>
            <div class="group-info-body">
                ${getGroupInfoItem('群名片', getValue(userInfo.card), 'full-width')}
                <div class="group-level-role-row">
                    ${getGroupInfoItem('群等级', getValue(userInfo.group_level || userInfo.level), 'group-level-item')}
                    ${getGroupInfoItem('群角色', userInfo.role === 'owner' ? '群主' : userInfo.role === 'admin' ? '管理员' : userInfo.role === 'member' ? '成员' : '<span class="unknown">未知</span>', 'group-role-item')}
                </div>
                ${getGroupInfoItem('专属头衔', getValue(userInfo.title), 'full-width')}
                <div class="group-time-row">
                    ${getGroupInfoItem('加群时间', formatMsTimestamp(userInfo.join_time), 'join-time-item')}
                    ${getGroupInfoItem('最后发言', formatMsTimestamp(userInfo.last_sent_time || userInfo.lastSentTime || userInfo.last_speak_time), 'last-speak-item')}
                </div>
            </div>
        </div>
    ` : '';

    return `<!DOCTYPE html>
<html>
<head>
    <style>
        ${fontBase64 ? `@font-face{font-family:'SourceHanSerifSC-Medium';src:url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');font-weight:normal;font-style:normal;font-display:swap;}` : ''}
        body{font-family:${fontBase64 ? "'SourceHanSerifSC-Medium'," : ''}-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";margin:0;padding:0;width:999px;height:999px;display:flex;align-items:center;justify-content:center;${backgroundStyle}background-size:cover;background-position:center center;background-repeat:no-repeat;position:relative;box-sizing:border-box;overflow:hidden;}
        .card{background:rgba(255,255,255,.13);backdrop-filter:blur(13px) saturate(130%);-webkit-backdrop-filter:blur(13px) saturate(130%);border-radius:32px;box-shadow:0 16px 48px rgba(0,0,0,.3),0 0 0 1px rgba(255,255,255,.25),inset 0 2px 0 rgba(255,255,255,.4);padding:40px;width:920px;height:920px;box-sizing:border-box;border:1px solid rgba(255,255,255,.3);color:#212121;position:relative;z-index:2;display:flex;}
        .card-content{display:flex;width:100%;height:100%;}
        .user-profile{flex:0 0 320px;display:flex;flex-direction:column;align-items:center;text-align:center;padding-right:25px;border-right:1px solid rgba(255,255,255,.3);position:relative;justify-content:space-between;padding-bottom:20px;}
        .avatar-section{display:flex;flex-direction:column;align-items:center;margin-bottom:15px;}
        .avatar{width:270px;height:270px;border-radius:50%;object-fit:cover;margin-bottom:20px;border:5px solid rgba(255,255,255,.8);box-shadow:0 12px 28px rgba(0,0,0,.35),0 0 0 3px rgba(255,255,255,.3);transition:transform .3s cubic-bezier(.25,.8,.25,1);}
        .avatar:hover{transform:scale(1.08);}
        .nickname{font-size:36px;font-weight:800;margin-bottom:12px;color:#111;word-break:break-word;text-shadow:0 3px 6px rgba(255,255,255,.7);background:rgba(255,255,255,.25);padding:14px 28px;border-radius:20px;border:1px solid rgba(255,255,255,.5);letter-spacing:.5px;}
        .userid{font-size:20px;color:#555;background:rgba(255,255,255,.4);padding:12px 20px;border-radius:16px;border:1px solid rgba(255,255,255,.6);margin-bottom:18px;font-weight:600;text-shadow:0 1px 2px rgba(255,255,255,.8);}
        .group-info-container{width:100%;padding:10px 10px;display:flex;flex-direction:column;align-items:center;gap:5px;background:rgba(255,255,255,.2);border-top:1px solid rgba(255,255,255,.3);border-bottom-left-radius:25px;border-bottom-right-radius:25px;box-sizing:border-box;min-height:100px;margin-top:auto;}
        .group-info-header{display:flex;align-items:center;gap:15px;margin-bottom:10px;}
        .group-avatar-wrapper{display:flex;align-items:center;gap:10px;}
        .group-avatar{width:80px;height:80px;border-radius:12px;object-fit:cover;border:3px solid rgba(255,255,255,.7);box-shadow:0 6px 16px rgba(0,0,0,.2);}
        .group-name-and-count{display:flex;flex-direction:column;align-items:flex-start;gap:5px;}
        .group-id, .group-name {font-size:15px;color:#333;background:rgba(255,255,255,.6);padding:6px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.6);font-weight:800;text-shadow:0 1px 3px rgba(255,255,255,.9);line-height:1.02;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;}
        .group-member-count{font-size:13px;color:#007bff;font-weight:bold;background:rgba(0,123,255,.1);border:1px solid rgba(0,123,255,.3);border-radius:8px;padding:4px 8px;margin-top:2px;}
        .group-info-body{width:100%;display:flex;flex-direction:column;gap:5px;}
        .group-info-container .info-item{width:100%;box-sizing:border-box;padding:4px 7px;background:rgba(255,255,255,.5);border-radius:10px;white-space:normal;overflow:visible;text-overflow:visible;min-height:auto;}
        .group-info-container .info-label{margin-bottom:2px;font-size:10px;color:#666;font-weight:500;text-shadow:0 1px 2px rgba(255,255,255,.9);}
        .group-info-container .info-value{font-size:13px;line-height:1.3;color:#212121;color:rgb(3,3,3,.9);word-break:break-all;text-shadow:0 1px 2px rgba(255,255,255,.8);line-height:1.3;}
        .group-level-role-row,.group-time-row{display:flex;gap:6px;width:100%;}
        .group-level-item,.group-role-item,.join-time-item,.last-speak-item{flex:1;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .group-info-container .info-item.title-item-row,.group-info-container .info-item.join-time-item-row,.group-info-container .info-item.last-speak-item-row{width:100%;}
        .info-container{flex:1;display:flex;flex-direction:column;gap:15px;padding:0 10px 0 10px;}
        .info-title{font-size:36px;font-weight:700;color:#111;margin-bottom:8px;text-align:center;position:relative;background:rgba(255,255,255,.25);padding:12px 28px;border-radius:18px;border:1px solid rgba(255,255,255,.5);text-shadow:0 3px 6px rgba(255,255,255,.7);}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;flex-grow:1;align-content:start;overflow:visible;}
        .three-column-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;grid-column:1/-1;}
        .two-column-row{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;grid-column:1/-1;}
        .info-grid .three-column-row .info-item{grid-column:span 1;}
        .info-grid .two-column-row .info-item{grid-column:span 1;}
        .info-item{background:rgba(255,255,255,.5);border-radius:10px;padding:7px 9px;border:1px solid rgba(255,255,255,.8);transition:all .3s cubic-bezier(.25,.8,.25,1);box-shadow:3px 3px 9px rgba(0,0,0,0.3);}
        .info-item.full-width{grid-column:1/-1;}
        .info-label{font-size:14px;font-weight:500;color:#666;margin-bottom:2px;}
        .info-value{font-size:16px;font-weight:bold;color:#212121;line-height:1.4;}
        .unknown{color:#999;font-style:italic;}
        .timestamp-watermark{position:fixed;top:1.3px;left:1.3px;font-size:13px;color:rgba(128,128,128,.6);font-family:'Courier New',monospace;z-index:9999;pointer-events:none;text-shadow:0 0 2px rgba(255,255,255,.8);}
        body.dark .card{background:rgba(0,0,0,.7);backdrop-filter:blur(15px) saturate(180%);-webkit-backdrop-filter:blur(15px) saturate(180%);border:1px solid rgba(70,70,70,.6);color:#f0f0f0;box-shadow:0 20px 60px rgba(0,0,0,.95),0 0 0 1px rgba(70,70,70,.4),inset 0 3px 0 rgba(120,120,120,.5);}
        body.dark .user-profile{border-right:2px solid #444;background:linear-gradient(135deg,rgba(0,0,0,.3),rgba(60,60,60,.2));}
        body.dark .avatar{border:6px solid #555;box-shadow:0 18px 40px rgba(0,0,0,.7),0 0 0 3px rgba(220,220,220,.9),inset 0 0 25px rgba(0,0,0,.3);}
        body.dark .nickname{color:#f0f0f0;text-shadow:0 3px 5px rgba(0,0,0,.9);background:linear-gradient(135deg,rgba(50,50,50,.8),rgba(30,30,30,.7));border:2px solid rgba(120,120,120,.4);box-shadow:0 10px 25px rgba(0,0,0,.6);}
        body.dark .userid{color:#ccc;background:rgba(70,70,70,.8);border:2px solid #888;box-shadow:0 5px 15px rgba(0,0,0,.4);}
        body.dark .group-info-container{background:linear-gradient(135deg,rgba(50,50,50,.8),rgba(30,30,30,.7));border-top:2px solid #555;box-shadow:0 8px 20px rgba(0,0,0,.3);}
        body.dark .group-avatar{border:3px solid #666;box-shadow:0 8px 20px rgba(0,0,0,.6);}
        body.dark .group-id,body.dark .group-name{color:#ddd;background:rgba(70,70,70,.8);border:2px solid #888;box-shadow:0 4px 10px rgba(0,0,0,.4);}
        body.dark .group-member-count{color:#82c6ff;background:rgba(0,123,255,.15);border:2px solid rgba(0,123,255,.4);box-shadow:0 3px 8px rgba(0,0,0,.4);}
        body.dark .group-info-container .info-label{color:#ccc;}
        body.dark .group-info-container .info-value{color:#eee;}
        body.dark .info-title{background:linear-gradient(135deg,rgba(50,50,50,.8),rgba(30,30,30,.7));color:#f0f0f0;text-shadow:0 3px 5px rgba(0,0,0,.9);border-bottom:3px solid #aaa;box-shadow:0 8px 20px rgba(0,0,0,.6);}
        body.dark .info-item{background:rgba(70,70,70,.85);border:2px solid #888;box-shadow:0 5px 15px rgba(0,0,0,.5);}
        body.dark .info-item:hover{background:rgba(90,90,90,.98);border-color:#777;box-shadow:0 10px 28px rgba(0,0,0,.7);}
        body.dark .info-label{color:#ddd;text-shadow:0 1px 2px rgba(0,0,0,.4);}
        body.dark .info-value{color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.3);}
        body.dark .timestamp-watermark{color:rgba(160,160,160,.5);text-shadow:0 0 2px rgba(0,0,0,.8);}
    </style>
</head>
<body class="${enableDarkMode ? 'dark' : ''}">
    <div class="card">
        <div class="card-content">
            <div class="user-profile">
                <div class="avatar-section">
                    ${avatarBase64 ? `<img class="avatar" src="data:image/jpeg;base64,${avatarBase64}" alt="User Avatar">` : ''}
                    <div class="nickname">${userInfo.nickname || '未知昵称'}</div>
                    <div class="userid">QQ号: ${userInfo.user_id}</div>
                </div>
                ${groupSpecificHtml}
            </div>
            <div class="info-container">
                <div class="info-title">${contextInfo.isGroup ? '成员详细信息' : '用户信息'}</div>
                <div class="info-grid">
                    ${infoItems.join('')}
                </div>
            </div>
        </div>
    </div>
    <div class="timestamp-watermark">${timestamp}</div>
</body>
</html>`;
};


export const getFlatMinimalUserInfoHtmlStr = async (userInfo, contextInfo, avatarBase64, groupAvatarBase64, fontBase64, enableDarkMode, hidePhoneNumber = true) => {
    const isGroup = contextInfo.isGroup;
    const isDarkMode = enableDarkMode;
    const timestamp = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    // 扁平化配色方案
    const colors = isDarkMode ? {
        // 黑色背景配色：亮蓝、亮绿、亮橙
        background: '#0a0a0a',
        cardBackground: '#1a1a1a',
        textPrimary: '#ffffff',
        textSecondary: '#b0b0b0',
        primary: '#00d4ff',      // 亮蓝色
        secondary: '#00ff88',    // 亮绿色
        accent: '#ff8800',       // 亮橙色
        border: '#333333',
        hover: '#2a2a2a'
    } : {
        // 白色背景配色：黑、蓝、灰
        background: '#f5f7fa',
        cardBackground: '#ffffff',
        textPrimary: '#2c3e50',  // 深蓝灰
        textSecondary: '#6c757d', // 中性灰
        primary: '#007bff',      // 蓝色
        secondary: '#34495e',    // 深灰蓝
        accent: '#6c757d',       // 灰色
        border: '#e0e6ed',
        hover: '#f8f9fa'
    };

    const getShengXiao = num => (['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'][num] || '');
    const getConstellation = num => (['摩羯座', '水瓶座', '双鱼座', '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座'][num - 1] || '');
    const getBloodType = num => (['O', 'A', 'B', 'AB'][num] || '');

    const formatAddress = (user) => {
        const parts = [user.country, user.province, user.city, user.postCode].filter(part => part && part !== '0' && part !== '-');
        let locationStr = parts.length > 0 ? parts.join('-') : '';
        if (user.address && user.address !== locationStr) {
            locationStr = locationStr ? `${locationStr} ${user.address}` : user.address;
        }
        return locationStr || '<span class="unknown">未知</span>';
    };

    const getGroupRole = (role) => {
        switch (role) {
            case 'owner':
                return '群主';
            case 'admin':
                return '管理员';
            case 'member':
                return '成员';
            default:
                return '<span class="unknown">未知</span>';
        }
    };
    
    return `<!DOCTYPE html><html><head><style>
${fontBase64 ? `@font-face{font-family:'CustomFont';src:url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');font-weight:400;font-style:normal;font-display:swap;}` : ''}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
    font-family: ${fontBase64 ? "'CustomFont'," : ''} -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
    background: ${colors.background};
    color: ${colors.textPrimary};
    width: 999px;
    height: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    overflow: hidden;
}
.main-container {
    width: 100%;
    max-width: 970px;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.header {
    background: ${colors.cardBackground};
    border: 2px solid ${colors.border};
    border-radius: 18px;
    padding: 14px 20px;
    text-align: center;
    box-shadow: 0 4px 16px rgba(0,0,0,${isDarkMode ? '0.4' : '0.08'});
}
.title {
    font-size: 34px;
    font-weight: 700;
    color: ${colors.primary};
    margin-bottom: 4px;
    letter-spacing: 2px;
}
.subtitle {
    font-size: 19px;
    color: ${colors.textSecondary};
    font-weight: 500;
}
.content {
    display: flex;
    gap: 10px;
    flex: 1;
    min-height: 0;
}
.left-panel {
    flex: 0 0 270px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.avatar-card {
    background: ${colors.cardBackground};
    border: 2px solid ${colors.border};
    border-radius: 18px;
    padding: 16px 14px;
    text-align: center;
    box-shadow: 0 4px 16px rgba(0,0,0,${isDarkMode ? '0.4' : '0.08'});
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}
.avatar {
    width: 130px;
    height: 130px;
    border-radius: 65px;
    object-fit: cover;
    border: 4px solid ${colors.primary};
    margin-bottom: 14px;
    display: block;
    box-shadow: 0 8px 24px rgba(0,0,0,${isDarkMode ? '0.5' : '0.15'});
}
.avatar-placeholder {
    width: 130px;
    height: 130px;
    border-radius: 65px;
    background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
    margin-bottom: 14px;
}
.user-name {
    font-size: 26px;
    font-weight: 700;
    color: ${colors.textPrimary};
    margin-bottom: 8px;
    letter-spacing: 1px;
}
.user-id {
    font-size: 17px;
    color: ${colors.textSecondary};
    background: ${colors.primary}25;
    padding: 6px 12px;
    border-radius: 12px;
    display: inline-block;
    font-weight: 600;
    border: 1px solid ${colors.primary}40;
}
.group-card {
    background: ${colors.cardBackground};
    border: 2px solid ${colors.border};
    border-radius: 18px;
    padding: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,${isDarkMode ? '0.4' : '0.08'});
    flex: 0.618;
}
.group-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid ${colors.border};
}
.group-avatar {
    width: 58px;
    height: 58px;
    border-radius: 14px;
    object-fit: cover;
    border: 3px solid ${colors.secondary};
    box-shadow: 0 4px 12px rgba(0,0,0,${isDarkMode ? '0.4' : '0.1'});
}
.group-info {
    flex: 1;
}
.group-name {
    font-size: 18px;
    font-weight: 700;
    color: ${colors.textPrimary};
    margin-bottom: 3px;
}
.group-id {
    font-size: 14px;
    color: ${colors.textSecondary};
    font-weight: 500;
}
.group-member-count {
    font-size: 13px;
    color: ${colors.accent};
    margin-top: 3px;
    font-weight: 600;
}
.group-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
}
.group-detail-item {
    text-align: center;
    background: ${colors.background};
    padding: 6px 4px;
    border-radius: 10px;
    border: 1px solid ${colors.border};
}
.group-detail-label {
    font-size: 11px;
    color: ${colors.textSecondary};
    margin-bottom: 2px;
    font-weight: 500;
}
.group-detail-value {
    font-size: 14px;
    color: ${colors.textPrimary};
    font-weight: 600;
    word-break: break-all;
}
.right-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
}
.info-card {
    background: ${colors.cardBackground};
    border: 2px solid ${colors.border};
    border-radius: 18px;
    padding: 16px;
    flex: 1;
    box-shadow: 0 4px 16px rgba(0,0,0,${isDarkMode ? '0.4' : '0.08'});
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}
.info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    flex: 1;
    align-content: start;
}
.info-item {
    background: ${colors.background};
    border: 1px solid ${colors.border};
    border-radius: 10px;
    padding: 10px 12px;
    transition: all 0.25s ease;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 52px;
}
.info-item:hover {
    background: ${colors.hover};
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,${isDarkMode ? '0.5' : '0.12'});
    border-color: ${colors.primary}50;
}
.info-item.full-width {
    grid-column: 1 / -1;
}
.info-label {
    font-size: 13px;
    color: ${colors.textSecondary};
    font-weight: 600;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.info-value {
    font-size: 18px;
    color: ${colors.textPrimary};
    font-weight: 600;
    line-height: 1.35;
    word-break: break-all;
}
.unknown {
    color: ${colors.textSecondary};
    font-style: italic;
    opacity: 0.7;
}
.timestamp {
    position: fixed;
    top: 12px;
    left: 12px;
    font-size: 13px;
    color: ${colors.textSecondary};
    opacity: 0.5;
    font-family: 'Courier New', monospace;
    z-index: 1000;
}
.primary-accent { color: ${colors.primary}; }
.secondary-accent { color: ${colors.secondary}; }
.accent-color { color: ${colors.accent}; }
</style></head><body>
<div class="main-container">
    <div class="header">
        <div class="title">${isGroup ? '群员信息' : '用户信息'}</div>
        <div class="subtitle">详细资料</div>
    </div>
    
    <div class="content">
        <div class="left-panel">
            <div class="avatar-card">
                ${avatarBase64 ? 
                    `<img class="avatar" src="data:image/jpeg;base64,${avatarBase64}" alt="用户头像">` : 
                    '<div class="avatar-placeholder"></div>'
                }
                <div class="user-name">${userInfo.nickname || '未知昵称'}</div>
                <div class="user-id">QQ: ${userInfo.user_id}</div>
            </div>
            
            ${isGroup ? `
            <div class="group-card">
                <div class="group-header">
                    ${groupAvatarBase64 ? `<img class="group-avatar" src="data:image/jpeg;base64,${groupAvatarBase64}" alt="群头像">` : ''}
                    <div class="group-info">
                        <div class="group-name">${contextInfo.groupName || '未知群名'}</div>
                        <div class="group-id">群号: ${contextInfo.groupId}</div>
                        ${contextInfo.memberCount ? `<div class="group-member-count">成员: ${contextInfo.memberCount}${contextInfo.maxMemberCount ? `/${contextInfo.maxMemberCount}` : ''}</div>` : ''}
                    </div>
                </div>
                <div class="group-details">
                    <div class="group-detail-item">
                        <div class="group-detail-label">群名片</div>
                        <div class="group-detail-value">${userInfo.card || '未设置'}</div>
                    </div>
                    <div class="group-detail-item">
                        <div class="group-detail-label">群角色</div>
                        <div class="group-detail-value primary-accent">${getGroupRole(userInfo.role)}</div>
                    </div>
                    <div class="group-detail-item">
                        <div class="group-detail-label">群等级</div>
                        <div class="group-detail-value secondary-accent">${userInfo.group_level || '未知'}</div>
                    </div>
                    <div class="group-detail-item">
                        <div class="group-detail-label">专属头衔</div>
                        <div class="group-detail-value accent-color">${userInfo.title || '无'}</div>
                    </div>
                    <div class="group-detail-item">
                        <div class="group-detail-label">加群时间</div>
                        <div class="group-detail-value">${userInfo.join_time ? `${new Date(userInfo.join_time).toLocaleDateString('zh-CN')}<br>${new Date(userInfo.join_time).toLocaleTimeString('zh-CN')}` : '<span class="unknown">未知</span>'}</div>
                    </div>
                    <div class="group-detail-item">
                        <div class="group-detail-label">最后发言</div>
                        <div class="group-detail-value">${userInfo.last_sent_time ? `${new Date(userInfo.last_sent_time).toLocaleDateString('zh-CN')}<br>${new Date(userInfo.last_sent_time).toLocaleTimeString('zh-CN')}` : '<span class="unknown">未知</span>'}</div>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
        
        <div class="right-panel">
            <div class="info-card">
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">性别</div>
                        <div class="info-value">${userInfo.sex === 'male' ? '男' : userInfo.sex === 'female' ? '女' : '<span class="unknown">未知</span>'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">年龄</div>
                        <div class="info-value">${userInfo.age || '<span class="unknown">未知</span>'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">QQ等级</div>
                        <div class="info-value primary-accent">${userInfo.qq_level || userInfo.level || '<span class="unknown">未知</span>'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">QID</div>
                        <div class="info-value">${userInfo.q_id || userInfo.qid || '<span class="unknown">未知</span>'}</div>
                    </div>
                    ${userInfo.sign || userInfo.longNick || userInfo.long_nick ? `
                    <div class="info-item full-width">
                        <div class="info-label">个性签名</div>
                        <div class="info-value">${userInfo.sign || userInfo.longNick || userInfo.long_nick}</div>
                    </div>
                    ` : ''}
                    ${userInfo.RegisterTime ? `
                    <div class="info-item full-width">
                        <div class="info-label">注册时间</div>
                        <div class="info-value">${new Date(userInfo.RegisterTime).toLocaleString('zh-CN')}</div>
                    </div>
                    ` : ''}
                    <div class="info-item full-width">
                        <div class="info-label">邮箱</div>
                        <div class="info-value">${(userInfo.eMail || userInfo.email) && userInfo.eMail !== '-' ? (userInfo.eMail || userInfo.email) : '<span class="unknown">未知</span>'}</div>
                    </div>
                    <div class="info-item full-width">
                        <div class="info-label">电话</div>
                        <div class="info-value">${hidePhoneNumber ? '<span class="unknown">已隐藏</span>' : (userInfo.phoneNum && userInfo.phoneNum !== '-' ? userInfo.phoneNum : '<span class="unknown">未知</span>')}</div>
                    </div>
                    <div class="info-item full-width">
                        <div class="info-label">地址信息</div>
                        <div class="info-value">${formatAddress(userInfo)}</div>
                    </div>
                    <div class="info-item full-width">
                        <div class="info-label">个人特征</div>
                        <div class="info-value">生肖: ${getShengXiao(userInfo.shengXiao) || '<span class="unknown">未知</span>'} | 星座: ${getConstellation(userInfo.constellation) || '<span class="unknown">未知</span>'} | 血型: ${getBloodType(userInfo.kBloodType) ? `${getBloodType(userInfo.kBloodType)}型` : '<span class="unknown">未知</span>'}</div>
                    </div>
                    <div class="info-item full-width">
                        <div class="info-label">生日</div>
                        <div class="info-value">${(userInfo.birthday_year && userInfo.birthday_month && userInfo.birthday_day) ? `${userInfo.birthday_year}年${userInfo.birthday_month}月${userInfo.birthday_day}日` : '<span class="unknown">未知</span>'}</div>
                    </div>
                    <div class="info-item full-width">
                        <div class="info-label">VIP信息</div>
                        <div class="info-value">VIP: ${userInfo.is_vip ? '是' : '否'} | 年费VIP: ${userInfo.is_years_vip ? '是' : '否'} | VIP等级: ${userInfo.vip_level || 0}</div>
                    </div>
                    <div class="info-item full-width">
                        <div class="info-label">状态</div>
                        <div class="info-value">${(userInfo.status && userInfo.status.message) || '<span class="unknown">未知</span>'}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="timestamp">${timestamp}</div>
</body></html>`;
};

export const getLXGWWenKaiUserInfoHtmlStr = async (userInfo, contextInfo, avatarBase64, groupAvatarBase64, fontBase64, enableDarkMode, hidePhoneNumber = true) => {
    const isGroup = contextInfo.isGroup;
    const isDarkMode = enableDarkMode;
    const timestamp = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const getShengXiao = num => (['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'][num] || '');
    const getConstellation = num => (['摩羯座', '水瓶座', '双鱼座', '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座'][num - 1] || '');
    const getBloodType = num => (['O', 'A', 'B', 'AB'][num] || '');

    const formatAddress = (user) => {
        const parts = [user.country, user.province, user.city, user.postCode].filter(part => part && part !== '0' && part !== '-');
        let locationStr = parts.length > 0 ? parts.join('-') : '';
        if (user.address && user.address !== locationStr) {
            locationStr = locationStr ? `${locationStr} ${user.address}` : user.address;
        }
        return locationStr || '<span class="unknown">未知</span>';
    };

    const getGroupRole = (role) => {
        switch (role) {
            case 'owner':
                return '群主';
            case 'admin':
                return '管理员';
            case 'member':
                return '成员';
            default:
                return '<span class="unknown">未知</span>';
        }
    };
    
    return `<!DOCTYPE html><html><head><style>
body{font-family:${fontBase64?"'LXGWWenKai',":''} "SimSun","FangSong","KaiTi",serif;margin:0;padding:0;width:999px;height:999px;display:flex;align-items:center;justify-content:center;${avatarBase64?`background-image:linear-gradient(45deg,rgba(245,240,230,.8),rgba(250,245,235,.8)),linear-gradient(to bottom,rgba(245,240,230,.05),rgba(250,245,235,.95)),url(data:image/jpeg;base64,${avatarBase64});`:`background:linear-gradient(45deg,#f5f0e6,#faf5eb);`}background-size:cover;background-position:center;background-repeat:no-repeat;position:relative;box-sizing:border-box;overflow:hidden;color:#3a2f2a;}
body::before{content:'';position:absolute;top:20px;left:20px;right:20px;bottom:20px;border:3px solid #d4af37;border-radius:20px;background:linear-gradient(135deg,rgba(212,175,55,.1) 0%,rgba(184,134,11,.05) 50%,rgba(212,175,55,.1) 100%);box-shadow:inset 0 0 20px rgba(212,175,55,.3),0 0 30px rgba(212,175,55,.2);z-index:1;}
.corner-decoration{position:absolute;font-size:24px;color:#d4af37;z-index:2;text-shadow:0 0 10px rgba(212,175,55,.5);}
.corner-decoration.top-left{top:35px;left:35px;}
.corner-decoration.top-right{top:35px;right:35px;}
.corner-decoration.bottom-left{bottom:35px;left:35px;}
.corner-decoration.bottom-right{bottom:35px;right:35px;}
.main-container{width:920px;height:920px;position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;padding:50px 40px 30px 40px;box-sizing:border-box;}
.title-section{text-align:center;margin-bottom:30px;}
.main-title{font-size:36px;font-weight:700;color:#8b4513;margin-bottom:10px;text-shadow:2px 2px 4px rgba(139,69,19,.3);letter-spacing:4px;}
.subtitle{font-size:18px;color:#a0522d;letter-spacing:2px;}
.content-area{display:flex;width:100%;flex:1;gap:30px;}
.avatar-section{flex:0 0 300px;display:flex;flex-direction:column;align-items:center;text-align:center;}
.avatar-frame{position:relative;margin-bottom:18px;}
.avatar{width:200px;height:200px;border-radius:50%;object-fit:cover;border:4px solid #d4af37;box-shadow:0 0 20px rgba(212,175,55,.4),inset 0 0 20px rgba(255,255,255,.2);}
.avatar-decoration{position:absolute;top:-15px;left:50%;transform:translateX(-50%);font-size:30px;color:#d4af37;text-shadow:0 0 10px rgba(212,175,55,.6);}
.user-name{font-size:36px;font-weight:700;color:#8b4513;margin-bottom:8px;text-shadow:1px 1px 2px rgba(139,69,19,.3);}
.user-id{font-size:20px;color:#a0522d;background:rgba(212,175,55,.1);padding:6px 16px;border-radius:20px;border:1px solid rgba(212,175,55,.3);margin-bottom:10px;}
.group-section{width:100%;background:rgba(212,175,55,.08);border:1px solid rgba(212,175,55,.2);border-radius:15px;padding:15px;text-align:center;margin-top:15px;}
.group-header{display:flex;align-items:center;gap:15px;margin-bottom:15px;}
.group-avatar{width:80px;height:80px;border-radius:12px;object-fit:cover;border:2px solid #d4af37;flex-shrink:0;}
.group-info{display:flex;flex-direction:column;align-items:flex-start;text-align:left;flex-grow:1;}
.group-id{font-size:16px;color:#8b4513;font-weight:700;}
.group-name{font-size:16px;color:#8b4513;background:rgba(212,175,55,.15);border:1px solid rgba(212,175,55,.3);border-radius:8px;padding:4px 8px;font-weight:700;margin-top:5px;}
.group-member-count{font-size:14px;color:#a0522d;margin-top:5px;}
.info-section{flex-grow:1;display:flex;flex-direction:column;}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;margin:0;align-items:start;}
.info-card{background:rgba(255,255,255,.2);border:1px solid rgba(212,175,55,.3);border-radius:12px;padding:8px 10px;box-shadow:0 4px 12px rgba(0,0,0,.09);transition:all .3s ease;display:flex;flex-direction:column;justify-content:center;min-height:45px;}
.info-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(212,175,55,.2);}
.info-card.full-width{grid-column:1/-1;}
.info-label{font-size:15px;color:#8b4513;margin-bottom:2px;font-weight:700;letter-spacing:1px;flex-shrink:0;}
.info-value{font-size:17px;color:#3a2f2a;line-height:1.2;word-break:break-all;flex:1;min-height:0;display:flex;align-items:center;}
.unknown{color:#999;font-style:italic;}
.group-info-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:15px;}
.group-info-card{background:rgba(212,175,55,.1);border:1px solid rgba(212,175,55,.25);border-radius:10px;padding:6px 10px;}
.group-info-card.full-width{grid-column:1/-1;}
.group-info-card .info-label{font-size:13px;color:#8b4513;margin-bottom:2px;font-weight:700;letter-spacing:.5px;}
.group-info-card .info-value{font-size:15px;color:#3a2f2a;line-height:1.1;word-break:break-all;text-align:center;display:flex;justify-content:center;align-items:center;min-height:2em;}
.group-info-card .time-value{font-size:13px;}
.multi-info-row{display:flex;justify-content:space-between;align-items:center;gap:10px;}
.multi-info-item{flex:1;display:flex;flex-direction:column;}
.multi-info-item .info-label{font-size:13px;color:#a0522d;font-weight:700;margin-bottom:2px;}
.multi-info-item .info-value{font-size:15px;color:#3a2f2a;line-height:1.2;}
.timestamp-watermark{position:fixed;top:1.3px;left:1.3px;font-size:13px;color:rgba(139,69,19,.5);font-family:'Courier New',monospace;z-index:9999;pointer-events:none;text-shadow:0 0 2px rgba(245,240,230,.8);}
${isDarkMode?`body{background:linear-gradient(45deg,#2c2416,#3a2f1f);color:#e6d7c3;}body::before{border-color:#b8860b;background:linear-gradient(135deg,rgba(184,134,11,.15) 0%,rgba(139,69,19,.1) 50%,rgba(184,134,11,.15) 100%);box-shadow:inset 0 0 20px rgba(184,134,11,.4),0 0 30px rgba(184,134,11,.3);}body .main-title{color:#daa520;}body .subtitle{color:#cd853f;}body .user-name{color:#daa520;}body .user-id{color:#cd853f;background:rgba(184,134,11,.2);border-color:rgba(184,134,11,.4);}body .info-card{background:rgba(0,0,0,.3);border-color:rgba(184,134,11,.4);}body .info-label{color:#daa520;}body .info-value{color:#e6d7c3;}body .group-section{background:rgba(184,134,11,.15);border-color:rgba(184,134,11,.3);}body .group-member-count{color:#daa520;background:rgba(184,134,11,.25);border-color:rgba(184,134,11,.4);}body .group-info-card{background:rgba(184,134,11,.2);border-color:rgba(184,134,11,.35);}body .timestamp-watermark{color:rgba(205,133,63,.4);text-shadow:0 0 2px rgba(0,0,0,.8);}`:''}
${fontBase64?`@font-face{font-family:'LXGWWenKai';src:url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');font-weight:400;font-style:normal;font-display:swap;}`:''}
</style></head><body class="${isDarkMode?'dark':''}">
<div class="corner-decoration top-left">◆</div>
<div class="corner-decoration top-right">◆</div>
<div class="corner-decoration bottom-left">◆</div>
<div class="corner-decoration bottom-right">◆</div>
<div class="main-container">
<div class="title-section">
<div class="main-title">「 ${isGroup?'群员信息':'用户信息'} 」</div>
<div class="subtitle">—— 详细资料 ——</div>
</div>
<div class="content-area">
<div class="avatar-section">
<div class="avatar-frame"><div class="avatar-decoration">❀</div>${avatarBase64?`<img class="avatar" src="data:image/jpeg;base64,${avatarBase64}" alt="用户头像">`:'<div class="avatar" style="background:linear-gradient(45deg,#d4af37,#b8860b);"></div>'}</div>
<div class="user-name">${userInfo.nickname || '未知昵称'}</div>
<div class="user-id">QQ号: ${userInfo.user_id}</div>
${isGroup?`
<div class="group-section">
<div class="group-header">
${groupAvatarBase64?`<img class="group-avatar" src="data:image/jpeg;base64,${groupAvatarBase64}" alt="群头像">`:''}
<div class="group-info">
<div class="group-id">群号: ${contextInfo.groupId}</div>
<div class="group-name">群名: ${contextInfo.groupName || '未知群名'}</div>
${contextInfo.memberCount?`<div class="group-member-count">群人数: ${contextInfo.memberCount}${contextInfo.maxMemberCount?`/${contextInfo.maxMemberCount}`:''}</div>`:''}
</div>
</div>
<div class="group-info-grid">
<div class="group-info-card full-width"><div class="info-label">群名片</div><div class="info-value">${userInfo.card || '<span class="unknown">未知</span>'}</div></div>
<div class="group-info-card"><div class="info-label">群等级</div><div class="info-value">${userInfo.group_level || '<span class="unknown">未知</span>'}</div></div>
<div class="group-info-card"><div class="info-label">群角色</div><div class="info-value">${getGroupRole(userInfo.role)}</div></div>
<div class="group-info-card full-width"><div class="info-label">专属头衔</div><div class="info-value">${userInfo.title || '<span class="unknown">未获取</span>'}</div></div>
<div class="group-info-card"><div class="info-label">加群时间</div><div class="info-value time-value">${userInfo.join_time?new Date(userInfo.join_time).toLocaleString('zh-CN'):'<span class="unknown">未知</span>'}</div></div>
<div class="group-info-card"><div class="info-label">最后发言</div><div class="info-value time-value">${(userInfo.last_sent_time)?new Date(userInfo.last_sent_time).toLocaleString('zh-CN'):'<span class="unknown">未知</span>'}</div></div>
</div>
</div>`:''}
</div>
<div class="info-section">
<div class="info-grid">
<div class="info-card"><div class="info-label">性别</div><div class="info-value">${userInfo.sex === 'male'?'男':userInfo.sex === 'female'?'女':'未知'}</div></div>
<div class="info-card"><div class="info-label">年龄</div><div class="info-value">${userInfo.age || '<span class="unknown">未知</span>'}</div></div>
<div class="info-card"><div class="info-label">QQ等级</div><div class="info-value">${userInfo.qq_level || userInfo.level || '<span class="unknown">未知</span>'}</div></div>
<div class="info-card"><div class="info-label">QID</div><div class="info-value">${userInfo.q_id || userInfo.qid || '<span class="unknown">未知</span>'}</div></div>
${userInfo.sign||userInfo.longNick||userInfo.long_nick?`<div class="info-card full-width"><div class="info-label">个性签名</div><div class="info-value">${userInfo.sign||userInfo.longNick||userInfo.long_nick}</div></div>`:''}
${userInfo.RegisterTime?`<div class="info-card full-width"><div class="info-label">注册时间</div><div class="info-value">${new Date(userInfo.RegisterTime).toLocaleString('zh-CN')}</div></div>`:''}
<div class="info-card"><div class="info-label">邮箱</div><div class="info-value">${(userInfo.eMail || userInfo.email) && userInfo.eMail !== '-' ? (userInfo.eMail || userInfo.email) : '<span class="unknown">未知</span>'}</div></div>
<div class="info-card"><div class="info-label">电话</div><div class="info-value">${hidePhoneNumber ? '<span class="unknown">已隐藏</span>' : (userInfo.phoneNum && userInfo.phoneNum !== '-' ? userInfo.phoneNum : '<span class="unknown">未知</span>')}</div></div>
<div class="info-card full-width"><div class="info-label">地址信息</div><div class="info-value">${formatAddress(userInfo)}</div></div>
<div class="info-card full-width"><div class="info-label">个人特征</div><div class="info-value multi-info-row">
<div class="multi-info-item"><div class="info-label">生肖</div><div class="info-value">${getShengXiao(userInfo.shengXiao) || '<span class="unknown">未知</span>'}</div></div>
<div class="multi-info-item"><div class="info-label">星座</div><div class="info-value">${getConstellation(userInfo.constellation) || '<span class="unknown">未知</span>'}</div></div>
<div class="multi-info-item"><div class="info-label">血型</div><div class="info-value">${getBloodType(userInfo.kBloodType) ? `${getBloodType(userInfo.kBloodType)}型` : '<span class="unknown">未知</span>'}</div></div>
</div></div>
<div class="info-card full-width"><div class="info-label">生日</div><div class="info-value">${(userInfo.birthday_year && userInfo.birthday_month && userInfo.birthday_day) ? `${userInfo.birthday_year}年${userInfo.birthday_month}月${userInfo.birthday_day}日` : '<span class="unknown">未知</span>'}</div></div>
<div class="info-card full-width"><div class="info-label">VIP信息</div><div class="info-value multi-info-row">
<div class="multi-info-item"><div class="info-label">VIP</div><div class="info-value">${userInfo.is_vip?'是':'否'}</div></div>
<div class="multi-info-item"><div class="info-label">年费VIP</div><div class="info-value">${userInfo.is_years_vip?'是':'否'}</div></div>
<div class="multi-info-item"><div class="info-label">VIP等级</div><div class="info-value">${userInfo.vip_level || 0}</div></div>
</div></div>
<div class="info-card full-width"><div class="info-label">状态</div><div class="info-value">${(userInfo.status && userInfo.status.message) || '<span class="unknown">未知</span>'}</div></div>
</div>
</div>
</div>
</div>
<div class="timestamp-watermark">${timestamp}</div>
</body></html>`;
};

/**
 * 渲染用户信息为图片并返回 base64 编码。
 * @param ctx Koishi Context 实例
 * @param userInfo 统一的用户信息对象
 * @param contextInfo 统一的上下文信息对象
 * @param imageStyle 图片样式
 * @param enableDarkMode 是否启用暗黑模式
 * @param imageType 图片类型
 * @param screenshotQuality 截图质量
 * @returns Promise<string> 图片的 base64 编码
 */
export async function renderUserInfo(
    ctx: Context, 
    userInfo: UnifiedUserInfo, 
    contextInfo: UnifiedContextInfo, 
    imageStyle: ImageStyle,
    enableDarkMode: boolean, 
    imageType: ImageType,
    screenshotQuality: number,
    hidePhoneNumber: boolean = true,
): Promise<string> {
    const browserPage = await ctx.puppeteer.page();
    let avatarBase64: string | undefined;
    let groupAvatarBase64: string | undefined;
    let fontBase64: string | undefined;

    try {
        // 获取字体文件
        fontBase64 = await getFontBase64(ctx, imageStyle);

        // 获取用户头像， 这三个ignore是因为 OneBot GroupMemberInfo 对象没有定义avatar字段，但是实际拿到的是有的
        // @ts-ignore
        if (userInfo.avatar) {
            try {
                // @ts-ignore
                const avatarBuffer = await ctx.http.file(userInfo.avatar);
                avatarBase64 = Buffer.from(avatarBuffer.data).toString('base64');
            } catch (error) {
                // @ts-ignore
                ctx.logger.warn(`Failed to fetch user avatar from ${userInfo.avatar}: ${error.message}`);
                avatarBase64 = undefined; // 获取失败则不使用头像
            }
        }

        // 获取群头像（如果是群聊）
        if (contextInfo.isGroup && contextInfo.groupId) {
            groupAvatarBase64 = await getGroupAvatarBase64(ctx, contextInfo.groupId.toString());
        }

        // 如果头像获取失败，可以使用一个默认的头像 base64
        if (!avatarBase64) {
            ctx.logger.info('Using empty avatarBase64 or fallback for background.');
        }

        // const htmlContent = await getSourceHanSerifSCStyleUserInfoHtmlStr(userInfo, contextInfo, avatarBase64 || '', groupAvatarBase64 || '', fontBase64 || '', enableDarkMode);
        let htmlContent;
        if ( imageStyle === IMAGE_STYLES.SOURCE_HAN_SERIF_SC ) {
            htmlContent = await getSourceHanSerifSCStyleUserInfoHtmlStr (userInfo, contextInfo, avatarBase64 || '', groupAvatarBase64 || '', fontBase64 || '', enableDarkMode, hidePhoneNumber);
        } else if ( imageStyle === IMAGE_STYLES.LXGW_WENKAI ) {
            htmlContent = await getLXGWWenKaiUserInfoHtmlStr            (userInfo, contextInfo, avatarBase64 || '', groupAvatarBase64 || '', fontBase64 || '', enableDarkMode, hidePhoneNumber);
        } else if ( imageStyle === IMAGE_STYLES.FLAT_MINIMAL ) {
            htmlContent = await getFlatMinimalUserInfoHtmlStr          (userInfo, contextInfo, avatarBase64 || '', groupAvatarBase64 || '', fontBase64 || '', enableDarkMode, hidePhoneNumber);
        }

        // 设置页面视口为999x999
        await browserPage.setViewport({
            width: 999,
            height: 999,
            deviceScaleFactor: 1,
        });

        // await browserPage.setContent(htmlContent, { waitUntil: 'networkidle0' });

        await browserPage.setContent(htmlContent);

        await browserPage.waitForSelector('body', { timeout: 15000 });

        // 等待图片加载完成（如果 avatar 是远程图片）
        await browserPage.evaluate(async () => {
            const images = Array.from(document.querySelectorAll('img'));
            await Promise.all(images.map(img => {
                if (img.complete) return;
                return new Promise((resolve, reject) => {
                    img.addEventListener('load', resolve);
                    img.addEventListener('error', reject);
                });
            }));
        });

        // todo: 把三种等待的逻辑添加到配置项 让用户选择

        // PLAN B:
        // await browserPage.setContent(htmlContent, {
        //     // 等待网络空闲，确保所有资源（图片、字体等）都已加载
        //     waitUntil: 'networkidle0',
        //     timeout: 15000, // 例如，设置超时为15秒
        // });
        // 等待所有图片加载完成，防止截图时图片还没显示

        // PLAN C:
        // await browserPage.setContent(htmlContent, {
        //     // 只需等待DOM内容加载完毕
        //     waitUntil: 'domcontentloaded',
        // });

        // // 因为字体是以 base64 嵌入的，浏览器需要一些时间来解析和应用
        // // 我们可以使用一个短暂的延迟来确保字体渲染完成
        // await browserPage.waitForTimeout(500); // 延迟500毫秒，可根据需要调整

        // 截图指定尺寸的区域，确保是正方形
        const screenshotBuffer = await browserPage.screenshot({
            encoding: 'base64',
            type: imageType,
            // quality: screenshotQuality,
            ...(imageType !== 'png' && { quality: screenshotQuality }),
            clip: {
                x: 0,
                y: 0,
                width: 999,
                height: 999
            }
        });

        return screenshotBuffer;

    } catch (error) {
        ctx.logger.error(`Error rendering user info image: ${error}`);
        throw new Error(`Failed to render user info image: ${error.message}`);
    } finally {
        await browserPage.close(); // 确保关闭页面，释放资源
    }
}