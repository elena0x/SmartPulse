import { memo, useMemo, useState } from "react";

interface RegionData {
  name: string;
  value: number;
}

interface ChinaMapChartProps {
  data: RegionData[];
}

// Simplified province SVG paths for a China map
const provinceShapes: Record<string, { path: string; cx: number; cy: number }> = {
  "新疆": { path: "M80,60 L180,40 L220,60 L230,100 L220,140 L200,160 L160,170 L120,160 L80,130 L60,100 Z", cx: 150, cy: 105 },
  "西藏": { path: "M100,180 L180,170 L220,180 L230,210 L220,250 L180,260 L130,260 L90,240 L80,210 Z", cx: 155, cy: 215 },
  "内蒙古": { path: "M240,50 L340,30 L400,40 L430,60 L440,80 L420,100 L380,110 L340,100 L300,105 L260,100 L240,80 Z", cx: 340, cy: 70 },
  "青海": { path: "M180,170 L240,160 L280,170 L290,200 L270,230 L230,240 L190,230 L170,200 Z", cx: 230, cy: 200 },
  "四川": { path: "M260,240 L310,230 L340,240 L350,270 L340,310 L310,320 L270,310 L250,280 Z", cx: 300, cy: 275 },
  "黑龙江": { path: "M440,30 L480,20 L520,30 L530,60 L520,90 L490,100 L460,90 L440,60 Z", cx: 485, cy: 55 },
  "吉林": { path: "M460,90 L500,85 L530,95 L535,115 L520,130 L490,135 L465,120 L455,105 Z", cx: 495, cy: 110 },
  "辽宁": { path: "M440,110 L475,105 L510,115 L520,135 L510,155 L480,160 L450,150 L435,130 Z", cx: 478, cy: 132 },
  "甘肃": { path: "M230,140 L280,130 L320,140 L340,120 L370,110 L380,130 L360,150 L330,170 L290,170 L260,160 Z", cx: 305, cy: 145 },
  "河北": { path: "M400,100 L430,95 L440,110 L435,135 L420,145 L400,140 L390,120 Z", cx: 415, cy: 120 },
  "北京": { path: "M415,105 L425,100 L430,108 L425,115 L415,112 Z", cx: 422, cy: 108 },
  "天津": { path: "M425,115 L435,112 L438,120 L432,125 L425,122 Z", cx: 431, cy: 118 },
  "山西": { path: "M380,120 L400,115 L410,130 L405,155 L390,165 L375,155 L370,135 Z", cx: 390, cy: 140 },
  "山东": { path: "M420,145 L455,140 L475,150 L480,165 L465,175 L435,175 L415,165 Z", cx: 448, cy: 158 },
  "宁夏": { path: "M330,135 L350,130 L355,145 L345,158 L330,155 Z", cx: 342, cy: 145 },
  "陕西": { path: "M340,155 L370,145 L385,160 L380,190 L365,210 L345,210 L330,195 L325,170 Z", cx: 355, cy: 180 },
  "河南": { path: "M380,165 L415,160 L430,175 L425,200 L405,210 L380,205 L370,185 Z", cx: 400, cy: 185 },
  "江苏": { path: "M435,175 L465,170 L480,185 L475,210 L455,220 L435,210 L425,195 Z", cx: 455, cy: 195 },
  "安徽": { path: "M420,200 L445,195 L455,215 L445,240 L425,245 L410,235 L405,215 Z", cx: 430, cy: 220 },
  "湖北": { path: "M360,210 L400,205 L420,215 L415,240 L395,255 L365,255 L350,240 L345,220 Z", cx: 383, cy: 230 },
  "浙江": { path: "M460,215 L480,210 L490,225 L485,250 L470,260 L455,250 L450,235 Z", cx: 470, cy: 235 },
  "上海": { path: "M478,200 L488,198 L490,208 L483,212 L476,208 Z", cx: 483, cy: 204 },
  "重庆": { path: "M320,250 L345,245 L355,258 L350,275 L335,280 L318,270 Z", cx: 336, cy: 262 },
  "湖南": { path: "M365,255 L395,250 L410,265 L405,295 L385,305 L365,300 L355,280 Z", cx: 383, cy: 278 },
  "江西": { path: "M420,245 L445,240 L460,255 L455,285 L435,295 L415,285 L410,265 Z", cx: 436, cy: 268 },
  "福建": { path: "M455,260 L480,255 L495,270 L490,300 L470,310 L455,300 L445,280 Z", cx: 470, cy: 282 },
  "贵州": { path: "M300,280 L335,275 L350,290 L345,315 L325,325 L305,315 L290,300 Z", cx: 322, cy: 298 },
  "广西": { path: "M300,320 L340,315 L365,325 L365,350 L345,360 L310,358 L290,345 Z", cx: 330, cy: 338 },
  "广东": { path: "M370,305 L420,295 L450,310 L455,340 L435,355 L395,358 L370,345 L365,325 Z", cx: 413, cy: 330 },
  "云南": { path: "M230,280 L280,270 L300,290 L300,330 L280,355 L250,360 L225,340 L215,310 Z", cx: 260, cy: 318 },
  "海南": { path: "M370,370 L395,365 L400,380 L390,395 L375,393 L365,382 Z", cx: 383, cy: 380 },
  "台湾": { path: "M490,290 L500,285 L508,300 L505,325 L495,335 L488,320 Z", cx: 498, cy: 310 },
  "香港": { path: "M443,352 L450,350 L453,356 L448,360 L443,357 Z", cx: 448, cy: 355 },
  "澳门": { path: "M435,358 L440,356 L442,362 L438,365 L435,362 Z", cx: 438, cy: 360 },
};

const ChinaMapChart = memo(({ data }: ChinaMapChartProps) => {
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  const dataMap = useMemo(() => {
    const m = new Map<string, number>();
    data.forEach((d) => m.set(d.name, d.value));
    return m;
  }, [data]);

  const maxVal = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

  const getColor = (val: number) => {
    if (val === 0) return "hsl(var(--muted))";
    const ratio = val / maxVal;
    if (ratio > 0.7) return "hsl(217 91% 45%)";
    if (ratio > 0.4) return "hsl(217 80% 58%)";
    if (ratio > 0.15) return "hsl(217 65% 70%)";
    return "hsl(217 50% 82%)";
  };

  return (
    <div className="relative w-full">
      <svg viewBox="50 10 500 400" className="w-full h-auto" style={{ maxHeight: 260 }}>
        <defs>
          <filter id="mapShadow" x="-2%" y="-2%" width="104%" height="104%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="hsl(var(--foreground))" floodOpacity="0.08" />
          </filter>
        </defs>
        <g filter="url(#mapShadow)">
          {Object.entries(provinceShapes).map(([name, shape]) => {
            const val = dataMap.get(name) ?? 0;
            const isHovered = hoveredProvince === name;
            return (
              <g key={name}>
                <path
                  d={shape.path}
                  fill={getColor(val)}
                  stroke="hsl(var(--background))"
                  strokeWidth={isHovered ? 2 : 1}
                  className="transition-all duration-200 cursor-pointer"
                  style={{
                    filter: isHovered ? "brightness(0.85)" : undefined,
                    transform: isHovered ? "scale(1.02)" : undefined,
                    transformOrigin: `${shape.cx}px ${shape.cy}px`,
                  }}
                  onMouseEnter={() => setHoveredProvince(name)}
                  onMouseLeave={() => setHoveredProvince(null)}
                />
                {val > 0 && (
                  <text
                    x={shape.cx}
                    y={shape.cy + 4}
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                    fill={val / maxVal > 0.3 ? "white" : "hsl(var(--foreground))"}
                    fontSize={7}
                    fontWeight={600}
                    opacity={isHovered ? 0 : 0.9}
                  >
                    {val}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {hoveredProvince && (
        <div className="absolute top-2 right-2 bg-card border border-border rounded-lg px-3 py-2 text-xs text-card-foreground shadow-lg pointer-events-none z-10">
          <span className="font-semibold">{hoveredProvince}</span>
          <span className="text-muted-foreground ml-2">{dataMap.get(hoveredProvince) ?? 0} 位专家</span>
        </div>
      )}

      {/* Gradient Legend */}
      <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-muted-foreground">
        <span>少</span>
        <div className="flex h-2.5 rounded-full overflow-hidden w-32">
          <div className="flex-1" style={{ background: "hsl(217 50% 82%)" }} />
          <div className="flex-1" style={{ background: "hsl(217 65% 70%)" }} />
          <div className="flex-1" style={{ background: "hsl(217 80% 58%)" }} />
          <div className="flex-1" style={{ background: "hsl(217 91% 45%)" }} />
        </div>
        <span>多</span>
      </div>
    </div>
  );
});

ChinaMapChart.displayName = "ChinaMapChart";

export default ChinaMapChart;
