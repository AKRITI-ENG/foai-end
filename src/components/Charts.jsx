import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Sector
} from 'recharts';
import { useISSData } from '../hooks/useISSData';
import { useNewsData } from '../hooks/useNewsData';
import { Activity, PieChart as PieChartIcon } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f43f5e'];

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export default function Charts({ onCategorySelect, selectedCategory }) {
  const { speedHistory } = useISSData();
  const { categoryCounts } = useNewsData();
  const [activeIndex, setActiveIndex] = useState(-1);

  const newsData = Object.entries(categoryCounts).map(([name, value]) => ({
    name: name,
    displayName: name.length > 15 ? name.substring(0, 15) + '...' : name,
    value
  }));

  // Create some default dummy data if no speed history is available yet
  const displaySpeedData = speedHistory.length > 0 ? speedHistory : Array.from({length: 10}).map((_, i) => ({
    time: `12:0${i}`,
    speed: 27500 + Math.random() * 500
  }));

  const handlePieClick = (data, index) => {
    if (selectedCategory === data.name) {
      onCategorySelect(null);
      setActiveIndex(-1);
    } else {
      onCategorySelect(data.name);
      setActiveIndex(index);
    }
  };

  // Sync active index with external category selection
  React.useEffect(() => {
    if (!selectedCategory) setActiveIndex(-1);
    else {
      const idx = newsData.findIndex(d => d.name === selectedCategory);
      setActiveIndex(idx);
    }
  }, [selectedCategory, newsData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      {/* Line Chart */}
      <div className="rounded-2xl border border-[hsl(var(--border))]/50 bg-[hsl(var(--card))]/50 backdrop-blur-xl p-6 shadow-xl shadow-black/5 hover:border-[hsl(var(--border))] transition-colors">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <Activity className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-lg">ISS Speed Trend <span className="text-sm font-normal text-[hsl(var(--muted-foreground))]">(Last 30)</span></h3>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displaySpeedData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 500', 'dataMax + 500']}
                tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                dx={-10}
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--popover-foreground))',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                  border: '1px solid hsl(var(--border))'
                }}
                cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Line 
                type="monotone" 
                dataKey="speed" 
                stroke="url(#colorSpeed)" 
                strokeWidth={4}
                dot={false}
                activeDot={{ r: 6, fill: '#3b82f6', stroke: 'hsl(var(--card))', strokeWidth: 3 }}
                animationDuration={1500}
              />
              <defs>
                <linearGradient id="colorSpeed" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={1}/>
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="rounded-2xl border border-[hsl(var(--border))]/50 bg-[hsl(var(--card))]/50 backdrop-blur-xl p-6 shadow-xl shadow-black/5 hover:border-[hsl(var(--border))] transition-colors">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <PieChartIcon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg">News Distribution</h3>
          </div>
          {selectedCategory && (
            <button 
              onClick={() => onCategorySelect(null)}
              className="text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] bg-[hsl(var(--muted))] px-2 py-1 rounded-md transition-colors"
            >
              Clear Filter
            </button>
          )}
        </div>
        <div className="h-[280px] w-full relative">
          {newsData.length > 0 ? (
            <>
              <p className="absolute top-0 left-0 text-xs text-[hsl(var(--muted-foreground))] text-center w-full z-10 pointer-events-none">
                Click a slice to filter articles
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={newsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    onClick={handlePieClick}
                    className="cursor-pointer outline-none"
                    stroke="none"
                  >
                    {newsData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        opacity={activeIndex === -1 || activeIndex === index ? 1 : 0.3}
                        className="transition-opacity duration-300"
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--popover-foreground))',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      border: '1px solid hsl(var(--border))'
                    }}
                    formatter={(value, name, props) => [value, props.payload.name]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle" 
                    formatter={(value, entry, index) => (
                      <span className={`text-sm ${activeIndex === -1 || activeIndex === index ? 'text-[hsl(var(--foreground))] font-medium' : 'text-[hsl(var(--muted-foreground))]'}`}>
                        {newsData[index].displayName}
                      </span>
                    )}
                    onClick={(e) => {
                       const idx = newsData.findIndex(d => d.displayName === e.value);
                       if (idx !== -1) handlePieClick(newsData[idx], idx);
                    }}
                    wrapperStyle={{ cursor: 'pointer' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </>
          ) : (
             <div className="h-full flex items-center justify-center text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/30 rounded-xl border border-dashed border-[hsl(var(--border))]">
                No news data available.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
