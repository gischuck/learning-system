// 学习相关名言名句
export const dailyQuotes = [
  { text: '学而不思则罔，思而不学则殆', author: '孔子' },
  { text: '温故而知新，可以为师矣', author: '孔子' },
  { text: '三人行，必有我师焉', author: '孔子' },
  { text: '学而时习之，不亦说乎', author: '孔子' },
  { text: '知之者不如好之者，好之者不如乐之者', author: '孔子' },
  { text: '敏而好学，不耻下问', author: '孔子' },
  { text: '学海无涯苦作舟', author: '韩愈' },
  { text: '读书破万卷，下笔如有神', author: '杜甫' },
  { text: '业精于勤，荒于嬉', author: '韩愈' },
  { text: '少壮不努力，老大徒伤悲', author: '汉乐府' },
  { text: '一寸光阴一寸金，寸金难买寸光阴', author: '王贞白' },
  { text: '书山有路勤为径', author: '韩愈' },
  { text: '读书百遍，其义自见', author: '三国志' },
  { text: '不积跬步，无以至千里', author: '荀子' },
  { text: '锲而不舍，金石可镂', author: '荀子' },
  { text: '天才就是百分之九十九的汗水加百分之一的灵感', author: '爱迪生' },
  { text: '知识就是力量', author: '培根' },
  { text: '活到老，学到老', author: '谚语' },
  { text: '勤能补拙是良训，一分辛苦一分才', author: '华罗庚' },
  { text: '为中华之崛起而读书', author: '周恩来' },
  { text: '好好学习，天天向上', author: '毛泽东' },
  { text: '读书使人充实，讨论使人机智，笔记使人准确', author: '培根' },
  { text: '学然后知不足', author: '礼记' },
  { text: '读万卷书，行万里路', author: '董其昌' },
  { text: '黑发不知勤学早，白首方悔读书迟', author: '颜真卿' },
  { text: '明日复明日，明日何其多', author: '钱福' },
  { text: '功夫不负有心人', author: '谚语' },
  { text: '世上无难事，只怕有心人', author: '谚语' },
  { text: '千里之行，始于足下', author: '老子' },
  { text: '己所不欲，勿施于人', author: '孔子' },
];

// 获取今日名言
export const getTodayQuote = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % dailyQuotes.length;
  return dailyQuotes[index];
};
