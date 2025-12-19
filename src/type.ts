export const IMAGE_STYLES = {
  SOURCE_HAN_SERIF_SC: '思源宋体SourceHanSerifSC',
  LXGW_WENKAI: '落霞孤鹜文楷LXGWWenKai',
  FLAT_MINIMAL: '扁平化简约FlatMinimal'
} as const;

// 样式类型定义
export type ImageStyle = typeof IMAGE_STYLES[keyof typeof IMAGE_STYLES];
export type ImageStyleKey = keyof typeof IMAGE_STYLES;

export const IMAGE_STYLE_KEY_ARR = Object.keys(IMAGE_STYLES) as ImageStyleKey[];

// 字体文件映射
export const FONT_FILES = {
  [IMAGE_STYLES.SOURCE_HAN_SERIF_SC]: 'SourceHanSerifSC-Medium.otf',
  [IMAGE_STYLES.LXGW_WENKAI]: 'LXGWWenKaiMono-Regular.ttf',
  [IMAGE_STYLES.FLAT_MINIMAL]: 'LXGWWenKaiMono-Regular.ttf' // 扁平化样式使用文楷字体
} as const;


export const IMAGE_TYPES = {
  PNG: 'png',
  JPEG: 'jpeg',
  WEBP: 'webp',
} as const;

export type ImageType = typeof IMAGE_TYPES[keyof typeof IMAGE_TYPES];



export const ONEBOT_IMPL_NAME = {
  LAGRNAGE: 'Lagrange',
  NAPCAT: 'NapCat',
  // LLONEBOT: "LLOneBot" //todo
}

export type OneBotImplName = typeof ONEBOT_IMPL_NAME[keyof typeof ONEBOT_IMPL_NAME];


// 统一的数据类型定义（基于 NapCat 格式）
export interface UnifiedUserInfo {
  // 基础用户信息
  user_id: string;
  nickname: string;
  sex: 'male' | 'female' | 'unknown' | '';
  age: number;
  
  // 群相关信息（如果在群聊中）
  group_id?: number;
  card?: string;
  level?: string;
  qq_level?: number;
  join_time?: number;
  last_sent_time?: number;
  role?: 'owner' | 'admin' | 'member';
  title?: string;
  title_expire_time?: number;
  unfriendly?: boolean;
  card_changeable?: boolean;
  is_robot?: boolean;
  shut_up_timestamp?: number;
  
  // 详细用户信息（来自 strangerInfo）
  uid?: string;
  uin?: string;
  nick?: string;
  remark?: string;
  constellation?: number;
  shengXiao?: number;
  kBloodType?: number;
  homeTown?: string;
  makeFriendCareer?: number;
  pos?: string;
  college?: string;
  country?: string;
  province?: string;
  city?: string;
  postCode?: string;
  address?: string;
  regTime?: number;
  reg_time?: number;
  interest?: string;
  labels?: any[];
  qqLevel?: number;
  qid?: string;
  q_id?: string;
  longNick?: string;
  long_nick?: string;
  birthday_year?: number;
  birthday_month?: number;
  birthday_day?: number;
  eMail?: string;
  phoneNum?: string;
  categoryId?: number;
  richTime?: number;
  richBuffer?: any;
  topTime?: string;
  isBlock?: boolean;
  isMsgDisturb?: boolean;
  isSpecialCareOpen?: boolean;
  isSpecialCareZone?: boolean;
  ringId?: string;
  isBlocked?: boolean;
  recommendImgFlag?: number;
  disableEmojiShortCuts?: number;
  qidianMasterFlag?: number;
  qidianCrewFlag?: number;
  qidianCrewFlag2?: number;
  isHideQQLevel?: number;
  isHidePrivilegeIcon?: number;
  status?: number | { status_id?: number; face_id?: number; message?: string };
  extStatus?: number;
  batteryStatus?: number;
  termType?: number;
  netType?: number;
  iconType?: number;
  customStatus?: any;
  setTime?: string;
  specialFlag?: number;
  abiFlag?: number;
  eNetworkType?: number;
  showName?: string;
  termDesc?: string;
  musicInfo?: any;
  extOnlineBusinessInfo?: any;
  extBuffer?: any;
  is_vip?: boolean;
  is_years_vip?: boolean;
  vip_level?: number;
  login_days?: number;
  
  // 其他字段
  avatar?: string;
  sign?: string;
  area?: string;
  group_level?: string;
  RegisterTime?: number;
  Business?: any[];
}

export interface UnifiedAdminInfo {
  user_id: number;
  nickname: string;
  card?: string;
  sex?: 'male' | 'female' | 'unknown' | '';
  age?: number;
  area?: string;
  level?: string;
  qq_level?: number;
  join_time?: number;
  last_sent_time?: number;
  title_expire_time?: number;
  unfriendly?: boolean;
  card_changeable?: boolean;
  is_robot?: boolean;
  shut_up_timestamp?: number;
  role: 'owner' | 'admin';
  title?: string;
  avatar?: string;
}

export interface UnifiedContextInfo {
  isGroup: boolean;
  groupId?: number;
  groupName?: string;
  memberCount?: number;
  maxMemberCount?: number;
  groupAvatarUrl?: string;
}

// 数据转换函数
export function convertToUnifiedUserInfo(userInfo: any, onebotImplName: OneBotImplName): UnifiedUserInfo {
  const baseInfo: UnifiedUserInfo = {
    user_id: userInfo.user_id || userInfo.userId,
    nickname: userInfo.nickname || '',
    sex: userInfo.sex || 'unknown',
    age: userInfo.age || 0,
    avatar: userInfo.avatar || '',
  };

  if (onebotImplName === ONEBOT_IMPL_NAME.LAGRNAGE) {
    // Lagrange 格式处理
    return {
      ...baseInfo,
      card: userInfo.card === null ? '' : (userInfo.card || ''),
      level: String(userInfo.level || 0),
      role: userInfo.role || 'member',
      join_time: userInfo.join_time ? userInfo.join_time*1000 : 0,
      last_sent_time: userInfo.last_sent_time ? userInfo.last_sent_time*1000 : 0,
      title: userInfo.title || '',
      title_expire_time: userInfo.title_expire_time || 0,
      unfriendly: userInfo.unfriendly || false,
      card_changeable: userInfo.card_changeable || false,
      // Lagrange 特有字段
      sign: userInfo.sign || userInfo.longNick || userInfo.long_nick || '',
      q_id: userInfo.q_id || userInfo.qid || '',                              // 同时支持 q_id 和 qid 两种格式
      qid: userInfo.qid || userInfo.q_id || '',                                // 同时支持 qid 和 q_id 两种格式
      longNick: userInfo.longNick || userInfo.long_nick || '',
      long_nick: userInfo.long_nick || userInfo.longNick || '',
      RegisterTime: userInfo.RegisterTime || '',
      Business: userInfo.Business || [],
      status: userInfo.status || {},
      group_level: userInfo.group_level || userInfo.level || '0'
    };
  } else if (onebotImplName === ONEBOT_IMPL_NAME.NAPCAT) {
    // NapCat 格式处理
    return {
      ...baseInfo,
      card: userInfo.card || '',
      level: String(userInfo.level || 0),
      qq_level: userInfo.qq_level || 0,
      role: userInfo.role || 'member',
      join_time: userInfo.join_time ? userInfo.join_time*1000 : 0,
      last_sent_time: userInfo.last_sent_time ? userInfo.last_sent_time*1000 : 0,
      title: userInfo.title || '',
      title_expire_time: userInfo.title_expire_time || 0,
      unfriendly: userInfo.unfriendly || false,
      card_changeable: userInfo.card_changeable || false,
      is_robot: userInfo.is_robot || false,
      shut_up_timestamp: userInfo.shut_up_timestamp || 0,
      // NapCat 特有字段
      uid: userInfo.uid || '',
      uin: userInfo.uin || '',
      nick: userInfo.nick || '',
      remark: userInfo.remark || '',
      constellation: userInfo.constellation || 0,
      shengXiao: userInfo.shengXiao || 0,
      kBloodType: userInfo.kBloodType || 0,
      homeTown: userInfo.homeTown || '',
      makeFriendCareer: userInfo.makeFriendCareer || 0,
      pos: userInfo.pos || '',
      college: userInfo.college || '',
      country: userInfo.country || '',
      province: userInfo.province || '',
      city: userInfo.city || '',
      postCode: userInfo.postCode || '',
      address: userInfo.address || '',
      RegisterTime: userInfo.reg_time ? Number(userInfo.reg_time)*1000 : 0,                  //注册时间, napcat是秒级的unix时间戳
      interest: userInfo.interest || '',
      labels: userInfo.labels || [],
      qqLevel: userInfo.qqLevel || 0,
      qid: userInfo.qid || '',
      longNick: userInfo.longNick || '',
      sign: userInfo.long_nick || '',                                     // 个性签名
      birthday_year: userInfo.birthday_year || 0,
      birthday_month: userInfo.birthday_month || 0,
      birthday_day: userInfo.birthday_day || 0,
      eMail: userInfo.eMail || '',
      phoneNum: userInfo.phoneNum || '',
      categoryId: userInfo.categoryId || 0,
      richTime: userInfo.richTime || 0,
      richBuffer: userInfo.richBuffer || {},
      topTime: userInfo.topTime || '0',
      isBlock: userInfo.isBlock || false,
      isMsgDisturb: userInfo.isMsgDisturb || false,
      isSpecialCareOpen: userInfo.isSpecialCareOpen || false,
      isSpecialCareZone: userInfo.isSpecialCareZone || false,
      ringId: userInfo.ringId || '',
      isBlocked: userInfo.isBlocked || false,
      recommendImgFlag: userInfo.recommendImgFlag || 0,
      disableEmojiShortCuts: userInfo.disableEmojiShortCuts || 0,
      qidianMasterFlag: userInfo.qidianMasterFlag || 0,
      qidianCrewFlag: userInfo.qidianCrewFlag || 0,
      qidianCrewFlag2: userInfo.qidianCrewFlag2 || 0,
      isHideQQLevel: userInfo.isHideQQLevel || 0,
      isHidePrivilegeIcon: userInfo.isHidePrivilegeIcon || 0,
      status: userInfo.status || 0,
      extStatus: userInfo.extStatus || 0,
      batteryStatus: userInfo.batteryStatus || 0,
      termType: userInfo.termType || 0,
      netType: userInfo.netType || 0,
      iconType: userInfo.iconType || 0,
      customStatus: userInfo.customStatus || null,
      setTime: userInfo.setTime || '0',
      specialFlag: userInfo.specialFlag || 0,
      abiFlag: userInfo.abiFlag || 0,
      eNetworkType: userInfo.eNetworkType || 0,
      showName: userInfo.showName || '',
      termDesc: userInfo.termDesc || '',
      musicInfo: userInfo.musicInfo || { buf: {} },
      extOnlineBusinessInfo: userInfo.extOnlineBusinessInfo || { buf: {}, customStatus: null, videoBizInfo: { cid: '', tvUrl: '', synchType: '' }, videoInfo: { name: '' } },
      extBuffer: userInfo.extBuffer || { buf: {} },
      is_vip: userInfo.is_vip || false,
      is_years_vip: userInfo.is_years_vip || false,
      vip_level: userInfo.vip_level || 0,
      login_days: userInfo.login_days || 0,
      group_level: userInfo.group_level || userInfo.level || '0'
    };
  }

  // 默认返回基础信息
  return baseInfo;
}

export function convertToUnifiedAdminInfo(adminInfo: any, onebotImplName: OneBotImplName): UnifiedAdminInfo {
  const baseInfo: UnifiedAdminInfo = {
    user_id: adminInfo.user_id || adminInfo.userId,
    nickname: adminInfo.nickname || '',
    role: adminInfo.role || 'admin',
    avatar: adminInfo.avatar || ''
  };

  if (onebotImplName === ONEBOT_IMPL_NAME.LAGRNAGE) {
    // Lagrange 格式处理
    return {
      ...baseInfo,
      card: adminInfo.card === null ? '' : (adminInfo.card || ''),
      sex: adminInfo.sex || '',
      age: adminInfo.age || 0,
      area: adminInfo.area || '',
      level: String(adminInfo.level || 0),
      join_time: adminInfo.join_time || 0,
      last_sent_time: adminInfo.last_sent_time || 0,
      title: adminInfo.title || '',
      title_expire_time: adminInfo.title_expire_time || 0,
      unfriendly: adminInfo.unfriendly || false,
      card_changeable: adminInfo.card_changeable || false
    };
  } else if (onebotImplName === ONEBOT_IMPL_NAME.NAPCAT) {
    // NapCat 格式处理
    return {
      ...baseInfo,
      card: adminInfo.card || '',
      sex: adminInfo.sex || 'unknown',
      age: adminInfo.age || 0,
      area: adminInfo.area || '',
      level: String(adminInfo.level || 0),
      qq_level: adminInfo.qq_level || 0,
      join_time: adminInfo.join_time ? adminInfo.join_time*1000 : 0,
      last_sent_time: adminInfo.last_sent_time ? adminInfo.last_sent_time*1000 : 0,
      title: adminInfo.title || '',
      title_expire_time: adminInfo.title_expire_time || 0,
      unfriendly: adminInfo.unfriendly || false,
      card_changeable: adminInfo.card_changeable || false,
      is_robot: adminInfo.is_robot || false,
      shut_up_timestamp: adminInfo.shut_up_timestamp || 0
    };
  }

  // 默认返回基础信息
  return baseInfo;
}

export function convertToUnifiedContextInfo(contextInfo: any, onebotImplName: OneBotImplName): UnifiedContextInfo {
  // 上下文信息在两种实现中格式基本一致，无需特殊处理
  return {
    isGroup: contextInfo.isGroup !== undefined ? contextInfo.isGroup : true,
    groupId: contextInfo.groupId || contextInfo.group_id,
    groupName: contextInfo.groupName || contextInfo.group_name || '未知群聊',
    memberCount: contextInfo.memberCount || contextInfo.member_count || 0,
    maxMemberCount: contextInfo.maxMemberCount || contextInfo.max_member_count || 0,
    groupAvatarUrl: contextInfo.groupAvatarUrl || contextInfo.group_avatar_url || ''
  };
}

export const NAPCAT_QQ_STATUS_MAP: { [key: string]: string } = {
  // 主状态码-扩展状态码
  '10-0': '在线',
  '60-0': 'Q我吧',
  '30-0': '离开',
  '50-0': '忙碌',
  '70-0': '请勿打扰',
  '40-0': '隐身',
  '10-1028': '听歌中',
  '10-2037': '春日限定',
  '10-2025': '一起元梦',
  '10-2026': '求星搭子',
  '10-2014': '被掏空',
  '10-1030': '今日天气',
  '10-2019': '我crash了',
  '10-2006': '爱你',
  '10-1051': '恋爱中',
  '10-1071': '好运锦鲤',
  '10-1201': '水逆退散',
  '10-1056': '嗨到飞起',
  '10-1058': '元气满满',
  '10-1070': '宝宝认证',
  '10-1063': '一言难尽',
  '10-2001': '难得糊涂',
  '10-1401': 'emo中',
  '10-1062': '我太难了',
  '10-2013': '我想开了',
  '10-1052': '我没事',
  '10-1061': '想静静',
  '10-1059': '悠哉哉',
  '10-2015': '去旅行',
  '10-1011': '信号弱',
  '10-2003': '出去浪',
  '10-2012': '肝作业',
  '10-1018': '学习中',
  '10-2023': '搬砖中',
  '10-1300': '摸鱼中',
  '10-1060': '无聊中',
  '10-1027': 'timi中',
  '10-1016': '睡觉中',
  '10-1032': '熬夜中',
  '10-1021': '追剧中',
};

/**
 * 根据QQ状态码和扩展状态码获取对应的文本描述
 * @param status 主状态码
 * @param ext_status 扩展状态码
 * @returns 对应的状态文本，如果未找到则返回 '未知状态'
 */
export function getNapcatQQStatusText(status: number, ext_status: number): string {
  const key = `${status}-${ext_status}`;
  return NAPCAT_QQ_STATUS_MAP[key] || '未知状态';
}