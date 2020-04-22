
const execute = require("demokit/execute");
const { convert, Scene } = require("./coordinate-space");
const uuid = require("uuid").v4;
const { delay } = require("bluebird");
const { span } = require("./html");



module.exports = async function callout({ children, from, to, space = Scene, window })
{
    const id = "callout" + uuid.v4();
    
    await execute(
                  {
                  args: [{ id, from: await convert({ point:from, from:space, to:Scene }), to: await convert({ point:to, from:space, to:Scene }) }],
                  script: function ({ id, from, to }, resolve, reject)
                  {
                  const element = document.createElement("div");
                  
                  const leftAdjust = (to.x > from.x) ? ((from.x - 250 - 20 - 5) + "px") : ((from.x + 20 + 5) + "px");//radius = 5, buffer = 20
                  
                  element.style.textAlign = (to.x > from.x) ? ("right") : ("left");

                  element.id = id;
                  if(to.x === from.x) {
                    element.style.width = "500px";
                  } else {
                    element.style.width = "250px";
                  }
                  element.style.height = "20px";
                  element.style.position = "absolute";
                  element.style.left = leftAdjust;
                  element.style.top = (from.y) + "px";
                  
                  document.getElementById("scene").appendChild(element);
                  
                  callout({ id:id + "--svg", from, to });
                  
                  function callout({ id, from, to })
                  {
                  const theta = Math.atan2(to.y - from.y, to.x - from.x);
                  
                  const radius = 5;
                  const length = Math.sqrt(Math.pow(to.y - from.y, 2) + Math.pow(to.x - from.x, 2) );
                  
                  const width = length + radius + radius * 10;
                  const height = radius * 10 * 2 + 4.0;
                  const cy = height / 2.0;
                  const cx = width / 2.0;
                  const stroke = "rgba(151,151,151,1.0)";
                  const fill = "rgba(151,151,151,1.0)";
                  
                  const svg = create("svg", { width, height },
                                     create("circle", { cx: radius, cy: height / 2.0, r: { from:0, to: radius, begin:"0.5s", dur:"0.1s" }, fill, "stroke-width": 2.0 }),
                                     create("line", { x1: { from: length + radius, to: radius, begin:"0.1s" }, y1: cy, x2: length + radius, y2: cy, stroke, "stroke-width": 2.0 }),
                                     create("circle", { cx: length + radius, cy: height / 2.0, r: { from:0, to: radius, dur:"0.1s" }, fill, "stroke-width": 2.0 }),
                                     create("circle", { cx: length + radius, cy: height / 2.0, r: { from:0, to: radius * 10, dur:"0.5s" }, fill:"rgba(151,151,151,0.0)", stroke, opacity:{ from:1, to:0, dur:"0.5s"}, "stroke-width": 2.0 })
                                     );
                  
                  const sx = length / 2.0;
                  const sy = 0;
                  const dx = Math.cos(theta) * length / 2.0 - sx;
                  const dy = Math.sin(theta) * length / 2.0 - sy;
                  
                  svg.id = id;
                  svg.style.position = "absolute";
                  svg.style.width = width + "px";
                  svg.style.height = height + "px";
                  svg.style.left = (from.x - radius + dx) + "px";
                  svg.style.top = (from.y - height / 2 + dy) + "px";
                  svg.style.transform = "rotate(" + theta + "rad)";
                  svg.style.transformOrigin = (radius + length / 2.0) + "px" + " center";
                  svg.style.border = "0";
                  svg.style.padding = "0";
                  svg.style.zIndex = "1000";
                  document.getElementById("scene").appendChild(svg);
                  
                  setTimeout(function ()
                             {
                             resolve();
                             }, 600);
                  }
                  
                  function create(type, attributes, ...children)
                  {
                  const element = document.createElementNS("http://www.w3.org/2000/svg", type);
                  const animations = [];
                  
                  for (const key of Object.keys(attributes))
                  {
                  const value = attributes[key];
                  
                  if (typeof value === "object" && value !== null)
                  {
                  animations.push(create("animate", Object.assign(
                                                                  {
                                                                  attributeName: key,
                                                                  begin: "0s",
                                                                  dur: "0.4s",
                                                                  fill: "freeze"
                                                                  }, value)));
                  
                  element.setAttribute(key, attributes[key].start || attributes[key].from);
                  }
                  else
                  element.setAttribute(key, attributes[key]);
                  }
                  
                  for (const animation of animations)
                  element.appendChild(animation);
                  
                  for (const child of children)
                  element.appendChild(child);
                  
                  return element;
                  
                  function animate(anAttributeName, attributes)
                  {
                  return create("animate", Object.assign(
                                                         {
                                                         attributeName: anAttributeName,
                                                         dur: "0.4s",
                                                         fill: "freeze"
                                                         }, attributes));
                  }
                  }
                  }
                  });
    
    for (const child of children)
        await (<child callout = { id } window = { window } id = { window } />)();
    
    await execute(
                  {
                  args: [{ id }],
                  script: function ({id }, resolve)
                  {
                  const element = document.getElementById(id);
                  const svg = document.getElementById(id + "--svg");
                  
                  element.style.transition = "opacity 0.45s";
                  svg.style.transition = "opacity 0.45s";
                  
                  element.addEventListener("transitionend", function end()
                                           {
                                           element.removeEventListener("transitionend", end);
                                           element.parentNode.removeChild(element);
                                           svg.parentNode.removeChild(svg);
                                           
                                           resolve();
                                           });
                  
                  element.style.opacity = 0;
                  svg.style.opacity = 0;
                  }
                  });
}

module.exports.callout = module.exports;

module.exports.blurb = async function blurb({ callout, style, children })
{
    const withChildren = <span children = { children } />;
    const string = style ? <withChildren style = { style }/>() : withChildren();
    
    await execute(
                  {
                  args: [{ callout, string }],
                  script: function ({ callout, string }, resolve, reject)
                  {
                  const blurb = document.createElement("div");
                  
                  blurb.style.color = "white";
                  blurb.style.fontSize = "20px";
                  blurb.style.position = "absolute";
                  blurb.style.zIndex = 10;
                  blurb.style.opacity = 0;
                  blurb.innerHTML = string;
                  blurb.style.transition = "opacity .45s";
                  blurb.style.lineHeight = "1.2";
                  blurb.style.margin = "0 0 20px 0";
                  
                  calloutParent = document.getElementById(callout);
                  
                  calloutParent.appendChild(blurb);
                  blurb.getBoundingClientRect();
                  const blurbHeight = blurb.getBoundingClientRect().height;
                  
                  if(blurb && (blurbHeight + "px") != calloutParent.style.height)
                  {
                        calloutParent.style.height = blurbHeight + "px";
                        var prevTop = parseInt(calloutParent.style.top);
                        calloutParent.style.top = prevTop - (blurbHeight / 2) + "px";
                  };
                  
                  blurb.addEventListener("transitionend", function end()
                                         {
                                         blurb.removeEventListener("transitionend", end);
                                         resolve();
                                         });
                  
                  blurb.style.opacity = 1;
                  }
                  });
    await delay(100 + 150 * string.split(" ").length);
}
