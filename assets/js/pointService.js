// 纯逻辑函数（不操作 DOM），便于用 node:test 直接测试。
// 渲染相关的 DOM 操作放在 app.js 中。

export const VIEW_ASPECT_RATIO = {
  front: 300 / 600,
  back: 300 / 600,
  hand: 400 / 400,
  foot: 300 / 400
};

export const CATEGORY_COLORS = {
  头部: '#FFB4A2',
  上肢: '#A2D2FF',
  下肢: '#B5EAD7',
  背部: '#CDB4DB'
};

const FALLBACK_COLOR = '#CCCCCC';

export function getPointsForView(acupoints, view) {
  return acupoints.filter((point) => point.view === view);
}

export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] ?? FALLBACK_COLOR;
}

export function findPointById(acupoints, id) {
  return acupoints.find((point) => point.id === id) ?? null;
}

export function getAspectRatio(view) {
  return VIEW_ASPECT_RATIO[view] ?? 1;
}
