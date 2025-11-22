
import React from 'react';
import type { TopUserData, LastHourUsageDataPoint } from '../types';

const Bar: React.FC<{ value: number, total: number, color: string, label: string }> = ({ value, total, color, label }) => {
    if (value === 0 || total === 0) return null;
    const percentage = (value / total) * 100;
    return (
        <div style={{ width: `${percentage}%`, backgroundColor: color }} className="h-full transition-all duration-300" title={`${label}: ${value.toLocaleString()}`}>
        </div>
    );
};

export const TopUserChart: React.FC<{ topUser: TopUserData | null }> = ({ topUser }) => {
    if (!topUser) {
        return <p className="text-white text-center py-4">No user data available to display.</p>;
    }
    
    return (
        <>
            <div className="flex justify-between items-baseline mb-1">
                 <p className="text-sm text-gray-200 truncate pr-2">User: <span className="font-semibold text-white">{topUser.userName}</span></p>
                 <p className="text-lg font-bold text-white">{topUser.totalTokens.toLocaleString()} <span className="text-xs font-normal text-gray-400">tokens</span></p>
            </div>
            <div className="w-full h-8 bg-[var(--theme-bg-primary)] rounded-md flex overflow-hidden border border-[var(--theme-border)]">
                <Bar value={topUser.inputTokens} total={topUser.totalTokens} color="var(--theme-border)" label="Input" />
                <Bar value={topUser.cachedInputTokens} total={topUser.totalTokens} color="#007bff" label="Cached Input" />
                <Bar value={topUser.outputTokens} total={topUser.totalTokens} color="var(--theme-accent)" label="Output" />
            </div>
            <div className="flex justify-end gap-4 mt-2 text-xs">
                <div className="flex items-center"><span className="w-3 h-3 rounded-sm bg-[var(--theme-border)] mr-1"></span> Input</div>
                <div className="flex items-center"><span className="w-3 h-3 rounded-sm bg-[#007bff] mr-1"></span> Cached</div>
                <div className="flex items-center"><span className="w-3 h-3 rounded-sm bg-[var(--theme-accent)] mr-1"></span> Output</div>
            </div>
        </>
    );
};

export const LastHourUsageChart: React.FC<{ usage: LastHourUsageDataPoint[] }> = ({ usage }) => {
    const maxValue = Math.max(...usage.map(d => d.totalTokens));
    const hasData = usage.some(d => d.totalTokens > 0);

    if (!hasData) {
        return <p className="text-white text-center py-4">No token usage recorded in the last hour.</p>;
    }

    const yAxisMax = Math.max(500, Math.ceil(maxValue / 500) * 500);

    const width = 500;
    const height = 200;
    const padding = 40;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding;

    const tokensToY = (tokens: number) => height - (Math.min(tokens, yAxisMax) / yAxisMax) * usableHeight - (padding / 2);
    const dateToX = (index: number) => (index / (usage.length - 1)) * usableWidth + padding;
    
    const points = usage.map((d, i) => `${dateToX(i)},${tokensToY(d.totalTokens)}`).join(' ');

    const yAxisLabels = Array.from({ length: 5 }).map((_, i) => {
        const value = Math.round((yAxisMax / 4) * i);
        return {
            value,
            y: tokensToY(value)
        };
    });

    const xAxisLabels = [
        { value: "-60m", x: dateToX(0) },
        { value: "-45m", x: dateToX(15) },
        { value: "-30m", x: dateToX(30) },
        { value: "-15m", x: dateToX(45) },
        { value: "Now",  x: dateToX(60) },
    ];

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            {yAxisLabels.map(({ value, y }) => (
                <g key={value}>
                    <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--theme-border)" strokeWidth="1" />
                    <text x={padding - 5} y={y + 3} fill="#9ca3af" textAnchor="end" fontSize="10">
                        {value >= 1000 ? `${(value/1000).toFixed(1).replace('.0', '')}k` : value}
                    </text>
                </g>
            ))}

            {xAxisLabels.map(({ value, x }, index) => (
                <text key={index} x={x} y={height - 5} fill="#9ca3af" textAnchor="middle" fontSize="10">{value}</text>
            ))}
            
            <polyline points={points} fill="none" stroke="var(--theme-accent)" strokeWidth="2" />
        </svg>
    );
};

export const TopFundsChart: React.FC<{ data: { label: string; value: number }[]; colors: string[] }> = ({ data, colors }) => {
    if (!data || data.length === 0) {
        return <p className="text-white text-center py-4">No fund data available to display.</p>;
    }
    const maxValue = Math.max(1, ...data.map(item => item.value));
    return (
      <div className="space-y-3 w-full">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center gap-3 w-full text-sm">
            <span className="text-gray-300 w-28 truncate text-right">{item.label}</span>
            <div className="flex-grow bg-[var(--theme-bg-secondary)] h-5 rounded-sm overflow-hidden">
              <div
                style={{ width: `${(item.value / maxValue) * 100}%`, backgroundColor: colors[index % colors.length] }}
                className="h-5 rounded-sm flex items-center justify-end pr-2 text-xs font-bold text-black transition-all duration-500"
              >
                {item.value.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
