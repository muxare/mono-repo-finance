import { useRef, useEffect, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import type { 
  D3ChartConfig, 
  ChartScales, 
  ChartColors,
  OHLCV
} from '../types/ChartTypes';
import { LIGHT_THEME_COLORS, DARK_THEME_COLORS } from '../types/ChartTypes';

export interface ChartMethods {
  svgRef: React.RefObject<SVGSVGElement | null>;
  scales: ChartScales;
  fitToData: () => void;
  zoomToTimeRange: (startTime: Date, endTime: Date) => void;
  resetZoom: () => void;
}

/**
 * Core D3.js candlestick chart hook following Swizec Teller's React + D3 patterns
 * Handles all D3 DOM manipulation while React manages state and lifecycle
 */
export const useCandlestickChart = (config: D3ChartConfig): ChartMethods => {
  const svgRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<{
    zoom?: d3.ZoomBehavior<SVGSVGElement, unknown>;
    currentTransform?: d3.ZoomTransform;
  }>({});

  // Create D3 scales - memoized for performance
  const scales = useMemo((): ChartScales => {
    const { width, height, margin } = config.dimensions;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    if (!config.data.length) {
      // Return empty scales if no data
      return {
        xScale: d3.scaleTime().range([0, chartWidth]),
        yScale: d3.scaleLinear().range([chartHeight * 0.7, 0]),
        volumeScale: d3.scaleLinear().range([chartHeight, chartHeight * 0.7]),
        chartWidth,
        chartHeight,
      };
    }

    // Time scale for x-axis
    const timeExtent = d3.extent(config.data, d => new Date(d.time * 1000)) as [Date, Date];
    const xScale = d3.scaleTime()
      .domain(timeExtent)
      .range([0, chartWidth]);

    // Price scale for y-axis (reserve 30% for volume)
    const priceExtent = d3.extent(config.data.flatMap(d => [d.low, d.high])) as [number, number];
    const yScale = d3.scaleLinear()
      .domain(priceExtent)
      .range([chartHeight * 0.7, 0])
      .nice();

    // Volume scale (bottom 30%)
    const volumeExtent = d3.extent(config.data, d => d.volume || 0) as [number, number];
    const volumeScale = d3.scaleLinear()
      .domain([0, volumeExtent[1] || 1]) // Start from 0 for volume
      .range([chartHeight, chartHeight * 0.7]);

    return { xScale, yScale, volumeScale, chartWidth, chartHeight };
  }, [config.data, config.dimensions]);
  // Theme-based colors
  const colors = useMemo((): ChartColors => {
    return config.theme === 'dark' ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;
  }, [config.theme]);

  // Main D3 rendering effect
  useEffect(() => {
    if (!svgRef.current || !config.data.length) return;    const svg = d3.select(svgRef.current);
    const { xScale, yScale, volumeScale, chartWidth, chartHeight } = scales;
    const { margin } = config.dimensions;

    // Clear previous render
    svg.selectAll('*').remove();

    // Create main chart group
    const chartGroup = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add background
    chartGroup.append('rect')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('fill', colors.background)
      .attr('stroke', 'none');

    // Calculate candlestick width based on data density
    const candleWidth = Math.max(1, Math.min(20, chartWidth / config.data.length * 0.8));

    // Draw volume bars first (behind candlesticks)
    if (config.showVolume) {
      const volumeBars = chartGroup.selectAll('.volume-bar')
        .data(config.data)
        .enter()
        .append('rect')
        .attr('class', 'volume-bar')
        .attr('x', d => xScale(new Date(d.time * 1000)) - candleWidth / 2)
        .attr('y', d => volumeScale(d.volume || 0))
        .attr('width', candleWidth)
        .attr('height', d => chartHeight - volumeScale(d.volume || 0))
        .attr('fill', d => d.close >= d.open ? colors.volume.bullish : colors.volume.bearish)
        .attr('opacity', 0.6);

      // Add volume bars with smooth transition
      volumeBars
        .attr('height', 0)
        .transition()
        .duration(500)
        .delay((_, i) => i * 2)
        .attr('height', d => chartHeight - volumeScale(d.volume || 0));
    }

    // Draw candlesticks
    const candlesticks = chartGroup.selectAll('.candlestick')
      .data(config.data)
      .enter()
      .append('g')
      .attr('class', 'candlestick');

    // Candlestick wicks (high-low lines)
    const wicks = candlesticks.append('line')
      .attr('class', 'wick')
      .attr('x1', d => xScale(new Date(d.time * 1000)))
      .attr('x2', d => xScale(new Date(d.time * 1000)))
      .attr('y1', d => yScale(d.high))
      .attr('y2', d => yScale(d.low))
      .attr('stroke', d => d.close >= d.open ? colors.bullish : colors.bearish)
      .attr('stroke-width', 1);

    // Candlestick bodies (open-close rectangles)
    const bodies = candlesticks.append('rect')
      .attr('class', 'candle-body')
      .attr('x', d => xScale(new Date(d.time * 1000)) - candleWidth / 2)
      .attr('y', d => yScale(Math.max(d.open, d.close)))
      .attr('width', candleWidth)
      .attr('height', d => Math.max(1, Math.abs(yScale(d.open) - yScale(d.close))))
      .attr('fill', d => d.close >= d.open ? colors.bullish : colors.bearish)
      .attr('stroke', d => d.close >= d.open ? colors.bullish : colors.bearish)
      .attr('stroke-width', 1);    // Add smooth animation for candlesticks
    wicks
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((_, i) => i * 2)
      .attr('opacity', 1);

    bodies
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((_, i) => i * 2)
      .attr('opacity', 1);

    // Draw technical indicators
    config.indicators.forEach((indicator, index) => {
      if (indicator.visible && indicator.data && indicator.data.length) {
        const line = d3.line<{ time: number; value: number }>()
          .x(d => xScale(new Date(d.time * 1000)))
          .y(d => yScale(d.value))
          .curve(d3.curveMonotoneX)
          .defined(d => !isNaN(d.value) && isFinite(d.value));        const path = chartGroup.append('path')
          .datum(indicator.data.filter((d: any) => !isNaN(d.value) && isFinite(d.value)))
          .attr('class', `indicator indicator-${indicator.type.toLowerCase()}`)
          .attr('d', line as any)
          .attr('fill', 'none')
          .attr('stroke', indicator.color || d3.schemeCategory10[index % 10])
          .attr('stroke-width', 2)
          .attr('opacity', 0.8);

        // Animate indicator lines
        const pathLength = (path.node() as SVGPathElement).getTotalLength();
        path
          .attr('stroke-dasharray', `${pathLength} ${pathLength}`)
          .attr('stroke-dashoffset', pathLength)
          .transition()
          .duration(1000)
          .delay(500)
          .attr('stroke-dashoffset', 0);
      }
    });

    // Add grid lines
    const xTicks = xScale.ticks(Math.min(10, config.data.length / 10));
    const yTicks = yScale.ticks(8);

    // Vertical grid lines
    chartGroup.selectAll('.grid-line-x')
      .data(xTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-line-x')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', chartHeight * 0.7)
      .attr('stroke', colors.grid)
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.3);

    // Horizontal grid lines
    chartGroup.selectAll('.grid-line-y')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-line-y')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', colors.grid)
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.3);    // Add axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat((d) => d3.timeFormat(config.timeframe === '1D' ? '%H:%M' : '%m/%d')(d as Date))
      .ticks(8);

    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d3.format('.2f'))
      .ticks(8);

    const volumeAxis = d3.axisRight(volumeScale)
      .tickFormat(d3.format('.2s'))
      .ticks(4);

    // X-axis
    chartGroup.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis as any)
      .selectAll('text')
      .attr('fill', colors.text);

    // Y-axis (price)
    chartGroup.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', colors.text);

    // Volume axis (if volume is shown)
    if (config.showVolume) {
      chartGroup.append('g')
        .attr('class', 'volume-axis')
        .attr('transform', `translate(${chartWidth},0)`)
        .call(volumeAxis)
        .selectAll('text')
        .attr('fill', colors.text);
    }

    // Add zoom and pan behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 20])
      .translateExtent([[0, 0], [chartWidth, chartHeight]])
      .on('zoom', (event) => {
        const transform = event.transform;
        chartRef.current.currentTransform = transform;

        // Update x-scale with transform
        const newXScale = transform.rescaleX(xScale);

        // Update candlesticks positions
        chartGroup.selectAll('.candlestick')
          .selectAll('line')
          .attr('x1', d => newXScale(new Date((d as OHLCV).time * 1000)))
          .attr('x2', d => newXScale(new Date((d as OHLCV).time * 1000)));

        chartGroup.selectAll('.candlestick')
          .selectAll('rect')
          .attr('x', d => newXScale(new Date((d as OHLCV).time * 1000)) - candleWidth / 2);

        // Update volume bars
        if (config.showVolume) {
          chartGroup.selectAll('.volume-bar')
            .attr('x', d => newXScale(new Date((d as OHLCV).time * 1000)) - candleWidth / 2);
        }        // Update indicator lines
        config.indicators.forEach(indicator => {
          if (indicator.visible && indicator.data) {
            const newLine = d3.line<{ time: number; value: number }>()
              .x(d => newXScale(new Date(d.time * 1000)))
              .y(d => yScale(d.value))
              .curve(d3.curveMonotoneX)
              .defined(d => !isNaN(d.value) && isFinite(d.value));

            chartGroup.select(`.indicator-${indicator.type.toLowerCase()}`)
              .datum(indicator.data.filter(d => !isNaN(d.value) && isFinite(d.value)))
              .attr('d', newLine as any);
          }
        });

        // Update x-axis
        chartGroup.select('.x-axis')
          .call(d3.axisBottom(newXScale).tickFormat((d) => d3.timeFormat(config.timeframe === '1D' ? '%H:%M' : '%m/%d')(d as Date)) as any)
          .selectAll('text')
          .attr('fill', colors.text);

        // Update grid lines
        chartGroup.selectAll('.grid-line-x')
          .attr('x1', d => newXScale(d as Date))
          .attr('x2', d => newXScale(d as Date));
      });

    svg.call(zoom);
    chartRef.current.zoom = zoom;

    // Add crosshair and tooltip on hover
    const focus = chartGroup.append('g')
      .attr('class', 'focus')
      .style('display', 'none');

    focus.append('line')
      .attr('class', 'x-hover-line hover-line')
      .attr('y1', 0)
      .attr('y2', chartHeight);

    focus.append('line')
      .attr('class', 'y-hover-line hover-line')
      .attr('x1', 0)
      .attr('x2', chartWidth);

    // Invisible rect for mouse tracking
    chartGroup.append('rect')
      .attr('class', 'overlay')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all')      .on('mouseover', () => focus.style('display', null))
      .on('mouseout', () => focus.style('display', 'none'))
      .on('mousemove', function(event) {
        const [x] = d3.pointer(event);
        
        focus.select('.x-hover-line')
          .attr('transform', `translate(${x},0)`)
          .attr('stroke', colors.text)
          .attr('opacity', 0.5);

        focus.select('.y-hover-line')
          .attr('transform', `translate(0,${d3.pointer(event)[1]})`)
          .attr('stroke', colors.text)
          .attr('opacity', 0.5);
      });

  }, [config, scales, colors]);

  // Chart interaction methods
  const fitToData = useCallback(() => {
    if (chartRef.current.zoom && svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(750)
        .call(chartRef.current.zoom.transform, d3.zoomIdentity);
    }
  }, []);

  const zoomToTimeRange = useCallback((startTime: Date, endTime: Date) => {
    if (!chartRef.current.zoom || !svgRef.current) return;

    const { xScale, chartWidth } = scales;
    
    const x0 = xScale(startTime);
    const x1 = xScale(endTime);
    const scale = chartWidth / (x1 - x0);
    const translate = -x0 * scale;
    
    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(chartRef.current.zoom.transform, d3.zoomIdentity.scale(scale).translate(translate, 0));
  }, [scales]);

  const resetZoom = useCallback(() => {
    fitToData();
  }, [fitToData]);

  return {
    svgRef,
    scales,
    fitToData,
    zoomToTimeRange,
    resetZoom,
  };
};

export default useCandlestickChart;
