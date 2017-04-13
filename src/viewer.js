/* Copyright (c) 2017, Art Compiler LLC */
/* @flow */
import {assert, message, messages, reserveCodeRange} from "./assert";
import * as React from "react";
import * as d3 from "d3";
window.gcexports.viewer = (() => {
  function capture(el) {
    return null;
  }
  function draw(data) {
    const doRadial = false;
    let width = window.innerWidth
      || document.documentElement.clientWidth
      || document.body.clientWidth;
    let height =
      window.gcexports.height ||
      window.innerHeight ||
      document.documentElement.clientHeight ||
      document.body.clientHeight;
    let svg = d3.select("#chart").select("svg")
      .attr("height", height)
      .attr("width", width);
    let g = svg.select("g");
    if (doRadial) {
      g.attr("transform", "translate(" + (width / 2 + 40) + "," + (height / 2 + 90) + ")");
    } else {
      g.attr("transform", "translate(" + (50) + "," + (50) + ")");
    }
    let tree = d3.tree()
      .size([width, height])
      .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });
    let root = tree(d3.hierarchy(data, (d) => {
      return d.children;
    }));


    let period = 500;
    let t = d3.transition().duration(period);

    let link = 
      g.selectAll(".link")
      .data(root.descendants().slice(1));

    link.exit().remove();

    link.enter().append("path")
      .attr("class", "link")
      .merge(link)
      .attr("opacity", 0)
    .transition().delay(period)
      .attr("opacity", data.name ? .7 : 0)
      .attr("d", (d) => {
        return "M" + project(d.x, d.y)
          + "C" + project(d.x, (d.y + d.parent.y) / 2)
          + " " + project(d.parent.x, (d.y + d.parent.y) / 2)
          + " " + project(d.parent.x, d.parent.y);
      });

    // BIND
    let node = g.selectAll(".node")
      .data(root.descendants(), (d) => {
        return d.data.name;
      });

    // EXIT
    node.exit()
      .remove();

    // ENTER
    let enter = node.enter().append("g")
      .attr("class", (d) => {
        return "node" + (d.children ? " node--internal" : " node--leaf");
      })
      .attr("transform", (d) => {
        return "translate(" + project(d.x, d.y) + ")";
      });
    enter.append("circle")
      .attr("opacity", (d) => {
        return d.data.name ? .7 : 0;
      })
      .attr("r", 4)
    enter.append("text")
      .attr("dy", ".31em");

    // UPDATE+ENTER
    let merge = enter.merge(node)
    .transition(t)
      .attr("transform", (d) => {
        return "translate(" + project(d.x, d.y) + ")";
      });
    merge.selectAll("text")
      .attr("x", (d) => {
        return -15;
      })
      .style("text-anchor", (d) => {
        return "middle";
      })
    .transition(t)
      .attr("transform", function(d) {
        if (doRadial) {
          return "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")";
        } else {
          return "rotate(0)";
        }
      })
      .text((d) => {
        return d.data.name.substring(d.data.name.lastIndexOf(".") + 1);
      });

    function project(x, y) {
      if (doRadial) {
        let angle = (x - 90) / 180 * Math.PI, radius = y;
        return [radius * Math.cos(angle), radius * Math.sin(angle)];
      } else {
        return [x/2, y/2];
      }
    }
  }

  // Graffiticode looks for this React class named Viewer. The compiled code is
  // passed via props in the renderer.
  let Viewer = React.createClass({
    componentDidMount: function() {
      draw(this.props.obj.data);
    },
    componentDidUpdate: function() {
      draw(this.props.obj.data);
    },
    render: function () {
      // If you have nested components, make sure you send the props down to the
      // owned components.
      let data = this.props.obj.data;
      return (
        <div id="chart" className="chart-container" data={data}>
          <svg><g /></svg>
        </div>
      );
    },
  });
  return {
    capture: capture,
    Viewer: Viewer
  };
})();

