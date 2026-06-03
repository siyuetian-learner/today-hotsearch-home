const mockBoards = {
  weibo: {
    source: "weibo",
    sourceName: "微博热搜",
    listName: "全站热搜榜（示例）",
    items: [
      ["高考倒计时最后冲刺", "482.6万"],
      ["端午假期出行预测发布", "421.3万"],
      ["多地发布高温黄色预警", "397.8万"],
      ["新一轮消费补贴怎么领", "365.1万"],
      ["毕业季租房避坑指南", "312.4万"],
      ["国产大模型新品发布", "294.7万"],
      ["今年龙舟赛有哪些看点", "266.8万"],
      ["年轻人开始反向旅游", "239.2万"],
      ["咖啡品牌联名周边上新", "211.9万"],
      ["睡眠质量如何科学改善", "186.5万"],
    ],
  },
  zhihu: {
    source: "zhihu",
    sourceName: "知乎热榜",
    listName: "讨论热度榜（示例）",
    items: [
      ["如何看待 AI 编程工具进入日常开发", "356.2万"],
      ["普通人怎样建立长期稳定的阅读习惯", "338.7万"],
      ["端午假期短途游有哪些城市值得去", "318.5万"],
      ["年轻人存钱变难了吗", "286.1万"],
      ["高效远程协作需要哪些基本规范", "263.8万"],
      ["什么样的简历更容易被看见", "241.4万"],
      ["城市通勤时间会影响幸福感吗", "226.9万"],
      ["夏季运动如何避免过度疲劳", "208.6万"],
      ["如何评价最近的国产动画电影", "184.3万"],
      ["厨房小家电哪些是真的实用", "162.5万"],
    ],
  },
  bilibili: {
    source: "bilibili",
    sourceName: "B站热搜",
    listName: "站内搜索榜（示例）",
    items: [
      ["毕业歌会全程回放", "398.8万"],
      ["端午限定美食测评", "364.6万"],
      ["一口气看懂空间站任务", "331.2万"],
      ["独立游戏新作试玩", "309.9万"],
      ["三分钟学会手机摄影构图", "281.7万"],
      ["经典动画高清修复上线", "253.5万"],
      ["UP主挑战一周不点外卖", "232.4万"],
      ["国风舞台混剪合集", "218.1万"],
      ["硬核拆解旗舰耳机", "197.3万"],
      ["新番五月口碑排行", "173.6万"],
    ],
  },
};

async function fetchMock(source, { q = "" } = {}) {
  const board = mockBoards[source];

  if (!board) {
    throw new Error(`Unknown mock source: ${source}`);
  }

  const items = board.items
    .filter(([title]) => !q || title.includes(q))
    .map(([title, heat], index) => ({
      rank: index + 1,
      title,
      heat,
      url: "#",
      summary: "示例数据，后续可替换为真实接口",
    }));

  return {
    source: board.source,
    sourceName: board.sourceName,
    listName: board.listName,
    updatedAt: new Date().toISOString(),
    items,
  };
}

module.exports = {
  fetchMock,
};
