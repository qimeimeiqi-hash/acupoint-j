// DOM 渲染与交互逻辑。纯数据/分类逻辑见 pointService.js（有配套单元测试）。
// 本文件直接操作 document，按第 8.3 节约定不写自动化单元测试，人工浏览器验证。

import { acupoints } from './data.js';
import { getPointsForView, getCategoryColor, findPointById, getAspectRatio } from './pointService.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const IMAGE_SRC = {
  front: 'assets/img/body-front.svg',
  back: 'assets/img/body-back.svg',
  hand: 'assets/img/hand-closeup.svg',
  foot: 'assets/img/foot-sole.svg'
};

const VIEW_LABELS = {
  front: '正面',
  back: '背面',
  hand: '手部特写',
  foot: '足底特写'
};

const stageEl = document.getElementById('stage');
const stageImageEl = document.getElementById('stageImage');
const lineOverlayEl = document.getElementById('lineOverlay');
const markerLayerEl = document.getElementById('markerLayer');
const legendEl = document.getElementById('legend');
const tabsEl = document.getElementById('viewTabs');

const detailSheetEl = document.getElementById('detailSheet');
const sheetBackdropEl = document.getElementById('sheetBackdrop');
const closeDetailBtn = document.getElementById('closeDetail');
const detailNameEl = document.getElementById('detailName');
const detailLocationEl = document.getElementById('detailLocation');
const detailTechniqueEl = document.getElementById('detailTechnique');
const detailDurationEl = document.getElementById('detailDuration');
const detailBenefitEl = document.getElementById('detailBenefit');
const detailCautionEl = document.getElementById('detailCaution');

let currentView = 'front';

function renderLegend() {
  const categories = [...new Set(acupoints.map((p) => p.category))];
  legendEl.innerHTML = '';
  for (const category of categories) {
    const item = document.createElement('span');
    item.className = 'legend-item';
    const swatch = document.createElement('span');
    swatch.className = 'legend-swatch';
    swatch.style.background = getCategoryColor(category);
    item.appendChild(swatch);
    item.appendChild(document.createTextNode(category));
    legendEl.appendChild(item);
  }
}

function highlightPoint(id) {
  document.querySelectorAll(`[data-id="${id}"]`).forEach((el) => {
    el.classList.remove('pulse');
    // 触发重排以便动画可以重复播放
    void el.offsetWidth;
    el.classList.add('active', 'pulse');
  });
}

function clearHighlight() {
  document.querySelectorAll('.marker.active, .hit-line.active').forEach((el) => {
    el.classList.remove('active', 'pulse');
  });
}

function openDetail(point) {
  detailNameEl.textContent = point.name;
  detailLocationEl.textContent = point.location;
  detailTechniqueEl.textContent = point.technique;
  detailDurationEl.textContent = point.duration;
  detailBenefitEl.textContent = point.benefit;
  detailCautionEl.textContent = point.caution;
  detailSheetEl.hidden = false;
  sheetBackdropEl.hidden = false;
}

function closeDetail() {
  detailSheetEl.hidden = true;
  sheetBackdropEl.hidden = true;
  clearHighlight();
}

function handlePointClick(id) {
  const point = findPointById(acupoints, id);
  if (!point) return;
  highlightPoint(id);
  openDetail(point);
}

function renderPointMarkers(point) {
  const color = getCategoryColor(point.category);
  for (const coordinate of point.coordinates) {
    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'marker';
    marker.dataset.id = point.id;
    marker.style.left = `${coordinate.x}%`;
    marker.style.top = `${coordinate.y}%`;
    marker.style.background = color;
    marker.setAttribute('aria-label', point.name);
    marker.addEventListener('click', () => handlePointClick(point.id));
    markerLayerEl.appendChild(marker);
  }
}

function ensureArrowMarkerDef(category, color) {
  const markerId = `arrow-${category}`;
  if (lineOverlayEl.querySelector(`#${markerId}`)) return markerId;
  let defs = lineOverlayEl.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS(SVG_NS, 'defs');
    lineOverlayEl.appendChild(defs);
  }
  const marker = document.createElementNS(SVG_NS, 'marker');
  marker.setAttribute('id', markerId);
  marker.setAttribute('viewBox', '0 0 10 10');
  marker.setAttribute('refX', '7');
  marker.setAttribute('refY', '5');
  marker.setAttribute('markerWidth', '5');
  marker.setAttribute('markerHeight', '5');
  marker.setAttribute('orient', 'auto-start-reverse');
  const arrowPath = document.createElementNS(SVG_NS, 'path');
  arrowPath.setAttribute('d', 'M0,0 L10,5 L0,10 Z');
  arrowPath.setAttribute('fill', color);
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
  return markerId;
}

function renderLineMarkers(point) {
  const color = getCategoryColor(point.category);
  const markerId = ensureArrowMarkerDef(point.category, color);
  for (const polyline of point.path) {
    const pointsAttr = polyline.map((p) => `${p.x},${p.y}`).join(' ');

    // 视觉线条
    const visibleLine = document.createElementNS(SVG_NS, 'polyline');
    visibleLine.setAttribute('points', pointsAttr);
    visibleLine.setAttribute('fill', 'none');
    visibleLine.setAttribute('stroke', color);
    visibleLine.setAttribute('stroke-width', '2.4');
    visibleLine.setAttribute('stroke-dasharray', '4,2.5');
    visibleLine.setAttribute('marker-end', `url(#${markerId})`);
    visibleLine.setAttribute('vector-effect', 'non-scaling-stroke');
    visibleLine.classList.add('hit-line-visual');
    visibleLine.dataset.id = point.id;

    // 更粗的透明线，扩大可点击范围（手指点击命中率更高）
    const hitLine = document.createElementNS(SVG_NS, 'polyline');
    hitLine.setAttribute('points', pointsAttr);
    hitLine.setAttribute('fill', 'none');
    hitLine.setAttribute('stroke', 'transparent');
    hitLine.setAttribute('stroke-width', '6');
    hitLine.classList.add('hit-line');
    hitLine.dataset.id = point.id;
    hitLine.addEventListener('click', () => handlePointClick(point.id));

    lineOverlayEl.appendChild(visibleLine);
    lineOverlayEl.appendChild(hitLine);
  }
}

function renderView(view) {
  currentView = view;
  clearHighlight();
  detailSheetEl.hidden = true;
  sheetBackdropEl.hidden = true;

  stageImageEl.src = IMAGE_SRC[view];
  stageImageEl.alt = VIEW_LABELS[view] + '插画';
  stageEl.style.aspectRatio = String(getAspectRatio(view));

  markerLayerEl.innerHTML = '';
  lineOverlayEl.innerHTML = '';
  lineOverlayEl.setAttribute('viewBox', '0 0 100 100');
  lineOverlayEl.setAttribute('preserveAspectRatio', 'none');

  const points = getPointsForView(acupoints, view);
  for (const point of points) {
    if (point.type === 'point') {
      renderPointMarkers(point);
    } else {
      renderLineMarkers(point);
    }
  }

  tabsEl.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
}

tabsEl.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-view]');
  if (!btn) return;
  renderView(btn.dataset.view);
});

closeDetailBtn.addEventListener('click', closeDetail);
sheetBackdropEl.addEventListener('click', closeDetail);

renderLegend();
renderView(currentView);
