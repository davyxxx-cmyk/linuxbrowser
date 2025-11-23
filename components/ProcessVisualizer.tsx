import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ProcessNode } from '../types';

interface ProcessVisualizerProps {
  data: ProcessNode;
}

export const ProcessVisualizer: React.FC<ProcessVisualizerProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 400;
    
    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(40, 20)`);

    const root = d3.hierarchy(data);
    const treeLayout = d3.tree<ProcessNode>().size([height - 100, width - 200]);
    treeLayout(root);

    // Links
    svg.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#475569")
      .attr("stroke-width", 2)
      .attr("d", d3.linkHorizontal()
        .x((d: any) => d.y)
        .y((d: any) => d.x) as any
      );

    // Nodes
    const node = svg.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

    // Node Circles
    node.append("circle")
      .attr("r", 8)
      .style("fill", (d) => {
        switch(d.data.type) {
            case 'launcher': return '#ef4444'; // Red
            case 'browser': return '#f59e0b'; // Amber
            case 'sandbox': return '#10b981'; // Emerald
            default: return '#3b82f6'; // Blue
        }
      })
      .style("stroke", "#1e293b")
      .style("stroke-width", 2);

    // Labels
    node.append("text")
      .attr("dy", ".35em")
      .attr("x", (d) => d.children ? -15 : 15)
      .attr("text-anchor", (d) => d.children ? "end" : "start")
      .text((d) => `${d.data.name} [${d.data.pid}]`)
      .style("fill", "#cbd5e1")
      .style("font-size", "12px")
      .style("font-family", "monospace");

  }, [data]);

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg h-full">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Process Isolation Topology
        </h2>
        <div ref={containerRef} className="w-full overflow-hidden">
            <svg ref={svgRef}></svg>
        </div>
        <div className="mt-4 flex gap-4 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Launcher (Root)</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-500 rounded-full"></div> Browser</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> Sandboxed Tab</span>
        </div>
    </div>
  );
};