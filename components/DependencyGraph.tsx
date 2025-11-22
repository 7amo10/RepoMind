import React, { useEffect, useRef, useState } from 'react';
import { 
  select, 
  forceSimulation, 
  forceLink, 
  forceManyBody, 
  forceCenter, 
  forceCollide, 
  drag as d3Drag 
} from 'd3';
import { DependencyNode, DependencyLink } from '../types';

interface DependencyGraphProps {
  nodes: DependencyNode[];
  links: DependencyLink[];
}

const DependencyGraph: React.FC<DependencyGraphProps> = ({ nodes, links }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: 400 });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !nodes.length) return;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const { width, height } = dimensions;

    // Clone data to avoid mutating props
    const simulationNodes = nodes.map(d => ({ ...d })) as any[];
    
    // Validate links: ensure source and target exist in nodes to prevent D3 crashes
    const nodeIds = new Set(simulationNodes.map(n => n.id));
    const simulationLinks = links
        .filter(l => nodeIds.has(l.source) && nodeIds.has(l.target))
        .map(d => ({ ...d })) as any[];

    const simulation = forceSimulation(simulationNodes)
      .force("link", forceLink(simulationLinks).id((d: any) => d.id).distance(100))
      .force("charge", forceManyBody().strength(-300))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collide", forceCollide().radius(30));

    // Arrows
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#94a3b8"); // slate-400

    const link = svg.append("g")
      .attr("stroke", "#94a3b8")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(simulationLinks)
      .join("line")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    const node = svg.append("g")
      .selectAll("g")
      .data(simulationNodes)
      .join("g")
      .call(drag(simulation) as any);

    // Node Circles
    node.append("circle")
      .attr("r", (d: any) => d.category === 'Core' || d.category === 'Framework' ? 20 : 12)
      .attr("fill", (d: any) => {
          if (d.category === 'Language') return '#3b82f6'; // blue
          if (d.category === 'Framework') return '#8b5cf6'; // purple
          if (d.category === 'Core') return '#ec4899'; // pink
          if (d.category === 'Database') return '#10b981'; // emerald
          return '#64748b'; // slate
      })
      .attr("stroke", "var(--color-surface)")
      .attr("stroke-width", 2);

    // Labels with shadow for better readability
    node.append("text")
      .text((d: any) => d.id)
      .attr("x", 0)
      .attr("y", (d: any) => d.category === 'Core' || d.category === 'Framework' ? 32 : 24)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "currentColor")
      .attr("class", "text-slate-700 dark:text-slate-200 font-medium pointer-events-none")
      .style("paint-order", "stroke")
      .style("stroke", "var(--color-surface)")
      .style("stroke-width", "3px")
      .style("stroke-linecap", "butt")
      .style("stroke-linejoin", "miter");

    // Tooltip
    node.append("title")
      .text((d: any) => `${d.id} (${d.category})`);

    simulation.on("tick", () => {
      // Bounding box constraint
      node
        .attr("transform", (d: any) => {
             d.x = Math.max(20, Math.min(width - 20, d.x));
             d.y = Math.max(20, Math.min(height - 20, d.y));
             return `translate(${d.x},${d.y})`;
        });

      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
    });

    function drag(simulation: any) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3Drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => {
        simulation.stop();
    };
  }, [nodes, links, dimensions]);

  return (
    <div ref={containerRef} className="w-full h-[400px] bg-slate-50 dark:bg-slate-900/50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full cursor-grab active:cursor-grabbing" />
      
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg backdrop-blur-sm border border-slate-100 dark:border-slate-800">
         <div className="flex items-center gap-2">
             <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
             <span className="text-[10px] text-slate-500 dark:text-slate-400">Language</span>
         </div>
         <div className="flex items-center gap-2">
             <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
             <span className="text-[10px] text-slate-500 dark:text-slate-400">Framework</span>
         </div>
         <div className="flex items-center gap-2">
             <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
             <span className="text-[10px] text-slate-500 dark:text-slate-400">Data</span>
         </div>
         <div className="flex items-center gap-2">
             <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
             <span className="text-[10px] text-slate-500 dark:text-slate-400">Tool/Lib</span>
         </div>
      </div>
    </div>
  );
};

export default DependencyGraph;