const { dia, util, shapes: defaultShapes, highlighters, elementTools } = joint;
const shapes = {
  ...defaultShapes
};

var namespace = joint.shapes;

joint.shapes.custom = {};
joint.shapes.standard.Link = joint.dia.Link;
const paperContainer = document.getElementById("paper-container");
var graph = new joint.dia.Graph();

var link = new joint.shapes.standard.Link({
  router: {
    name: "manhattan"
  },
  connector: {
    name: "rounded"
  },
  attrs: {
    line: {
      stroke: "#000",
      strokeDasharray: "0",
      strokeWidth: 1,
      fill: "none",
      sourceMarker: {
        type: "path",
        d: "M 0 0 0 0",
        stroke: "none"
      },
      targetMarker: {
        type: "path",
        d: "M 0 -5 -10 0 0 5 z",
        stroke: "none",
        z: -1
      }
    }
  },
  'data-type': 'link'
});

let paperWidth = $(".designer-area").width();
let paperHeight = $(".designer-area").height();
const paper = new dia.Paper({
  width: "300%",
  height: "300%",
  gridSize: 10,
  drawGrid: true,
  model: graph,
  defaultLink: link,
  interactive: {
    linkMove: false
  },
  async: true,
  sorting: joint.dia.Paper.sorting.APPROX
  
});
paperContainer.appendChild(paper.el);
let undoStack = [];
let redoStack = [];
let currentJSONData; 

function updateHistory() {
  const currentState = graph.toJSON();
  currentJSONData = currentState;
  undoStack.push(currentState);
  redoStack = [];
  
}

// graph.on("change", function() {
//   undoStack.push(graph.toJSON());
// });


function addClassNamesToLinks() {
  setTimeout(() => {
    currentJSONData.cells.forEach((cell) => {

      if (cell.type === 'link' && cell.customAttributes && cell.customAttributes.arrowType) {
        const linkElement = document.querySelector(`[model-id="${cell.id}"]`);
        if (linkElement) {
          const arrowType = cell.customAttributes.arrowType;
          linkElement.classList.add(arrowType);
        }
      }
    });
  }, 100);

}

function undo() {

  if (undoStack.length > 1) {
    var prevState = undoStack.pop();

    redoStack.push(prevState);

    graph.fromJSON(undoStack[undoStack.length - 1]);

    addClassNamesToLinks();
    // drawOverview();
  }
}

function redo() {
  if (redoStack.length > 0) {
    const nextState = redoStack.pop();
    undoStack.push(nextState);

    graph.fromJSON(nextState);

    addClassNamesToLinks();
    // drawOverview();
  }
}

const undoButton = document.createElement('button');
undoButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" width="30px" height="30px"><path d="M24.53,83.85h9.86a46.53,46.53,0,0,1,93,.27v.48h-6.14c0-.14,0-.29,0-.46a40.39,40.39,0,0,0-80.75-.29H51.91a2,2,0,0,1,1.69,2.94L39.92,110.5a2,2,0,0,1-3.4,0L22.83,86.79A2,2,0,0,1,24.53,83.85Z"/></svg>`;
$(".tool-btns").append(undoButton);
undoButton.addEventListener('click', undo);

const redoButton = document.createElement('button');
redoButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 0 150 150"><path d="M125.47,83.85h-9.86a46.53,46.53,0,0,0-93,.27v.48h6.14c0-.14,0-.29,0-.46a40.39,40.39,0,0,1,80.75-.29H98.09a2,2,0,0,0-1.69,2.94l13.68,23.71a2,2,0,0,0,3.4,0l13.69-23.71A2,2,0,0,0,125.47,83.85Z"/></svg>`;
$(".tool-btns").append(redoButton);
redoButton.addEventListener('click', redo);

updateHistory();

function confirmRemoval(elementView) {
  elementView.model.remove();
  // updateHistory();
}

const customImage = joint.dia.Element.extend({

  defaults: joint.util.deepSupplement(
    {
      type: "custom.Image",
      resizable: true,
      size: {
        width: 100,
        height: 100
      },
      attrs: {
        image: {
          ref: "rect"
        }
      }
    },
    joint.dia.Element.prototype.defaults
  )
});

let currentElementView = null;
paper.on("element:pointerclick", (elementView, evt, x, y) => {
  var toolsView;
  currentElementView = elementView; 

  if (elementView.model.attributes.type !== "custom.CustomGroup") {
    toolsView = new dia.ToolsView({
      tools: [
        new elementTools.Remove({
          x: "100%",
          y: 0,
          offset: {
            x: 10,
            y: -10
          },
          action: () => confirmRemoval(elementView)
        }),
        // new ResizeToolbl({
        //   selector: "rect"
        // }),
        new ResizeTool({
          selector: "rect"
        }),
        // new ResizeTooltl({
        //   selector: "rect"
        // }),
        // new ResizeTooltr({
        //   selector: "rect"
        // }),
        // new infobutton({
        //   selector: "rect",
        // }),
        connectRight,
        connectLeft,
        connectTop,
        connectBottom
      ]
    });
  } else {
    toolsView = new dia.ToolsView({
      tools: [
        new elementTools.Remove({
          x: "100%",
          y: 0,
          offset: {
            x: 10,
            y: -10
          },
          action: () => confirmRemoval(elementView)
        }),
        // new ResizeToolbl({
        //   selector: "rect"
        // }),
        new ResizeTool({
          selector: "rect"
        }),
        // new ResizeTooltl({
        //   selector: "rect"
        // }),
        // new ResizeTooltr({
        //   selector: "rect"
        // }),
        // new infobutton({
        //   selector: "rect",
        // }),
        connectRight,
        connectLeft,
        connectTop,
        connectBottom
      ]
    });
  }

  elementView.addTools(toolsView);
  toolsView.render();
  toolsView.$el.addClass("active");

  elementView.render = function () {
    joint.dia.ElementView.prototype.render.apply(this, arguments);

    const label = this.$("text");
    const labelText = this.model.get("attrs").label.text;
    label.text(labelText);
  };
  const labelElement = elementView.$(".group-label");
  const elementPosition = elementView.model.position();

  const inputX = (elementPosition.x + elementView.model.attributes.size.width/2) - 100 ;
  const inputY = elementPosition.y + elementView.model.attributes.size.height ;

  labelElement.on("click", () => {
    $("input.edit-label").remove();

    const input = $("<input>")
      .val(labelElement.text())
      .addClass("edit-label")
      .css({
        position: "absolute",
        top: inputY + "px",
        left: inputX + "px",
        width: '200px',
        height: '36px'
      });
    input.appendTo(paper.el);

    input.on("keyup", (e) => {
      if (e.key === "Enter") {
        const newText = input.val();
        labelElement.text(newText);
        input.remove();

        elementView.model.attr(".group-label/text", newText);
        // updateHistory();
      }
    });

    input.focus();
    paper.on("blank:pointerclick", () => {
      input.remove();
    });

  });
  paper.on("blank:pointerclick", () => {
    toolsView.$el.removeClass("active");
  });

});

paper.el.addEventListener("click", function(event) {
  const ungroupBtn = event.target.closest(".ungroup-btn");
    if (ungroupBtn) {
        const groupElementView = currentElementView;
        if (groupElementView && groupElementView.model) {
            ungroupSelectedElements(graph, groupElementView.model);
        }
    }
});

function ungroupSelectedElements(graph, element) {
  if (element.attributes.type === 'basic.Rect') {
      const childGroups = element.getEmbeddedCells();
      const removedElements = [...childGroups]; 
      element.remove();

      let clonedimagecelllist=[];
      removedElements.forEach((childGroup) => {

          if (childGroup.attributes.type === 'custom.CustomGroup') {
              const imageCellsInChildGroup = removedElements.filter((cell) => {
                  if (childGroup) {
                      const isInside = isInsideChildGroup(cell, childGroup);

                      return cell.attributes.type === 'custom.Image' && isInside;
                  } else {
                      return false;
                  }
              });
              graph.addCell(childGroup);
              imageCellsInChildGroup.forEach((imageCell) => {

                childGroup.embed(imageCell);

                graph.addCell(imageCell);
                clonedimagecelllist.push(imageCell.attributes.id);
            });

          }else{
            if (childGroup.attributes.type !== 'custom.CustomGroup' &&  !clonedimagecelllist.includes(childGroup.attributes.id)) {
              graph.addCell(childGroup);
            }
          }
      });
      // updateHistory();
  }
}

function isInsideChildGroup(element, childGroup) {
  const groupBBox = childGroup.getBBox();
  const elementBBox = element.getBBox();

  return (
      elementBBox.x >= groupBBox.x &&
      elementBBox.y >= groupBBox.y &&
      elementBBox.x + elementBBox.width <= groupBBox.x + groupBBox.width &&
      elementBBox.y + elementBBox.height <= groupBBox.y + groupBBox.height
  );
}

const groupCells = [];
let group;
function handleDrop(event, imageUrl, imageName, groupCheck) {
  let x = event.offsetX / zoomLevel;
  let y = event.offsetY / zoomLevel;

  const groupUnderDrop = groupCells.find((group) => {
    const groupView = group.findView(paper);

    if (groupView && group.attributes.type !== "custom.Image") {
      const groupBBox = groupView.getBBox();
      return (
        x >= groupBBox.x &&
        x <= groupBBox.x + groupBBox.width &&
        y >= groupBBox.y &&
        y <= groupBBox.y + groupBBox.height
      );
    }
    return false; 
  });

  if (groupCheck === "true") {
    const group = new joint.shapes.custom.CustomGroup({
      markup: `
      <g class="rotatable">
        <g class="scalable">
          <rect width="200" height="100"/>
        </g>
        <image width="50" height="50"/>
        <text class="group-label"/>
      </g>
    `,
      position: { x, y },
      attrs: {
        rect: {
          fill: "#f7f7f7",
          stroke: "#aaaaaa",
          "stroke-width": 1
        },
        image: {
          "xlink:href": imageUrl,
          width: 30,
          height: 30,
          ref: "rect",
          "ref-x": 0,
          "ref-y": 0
        },
        ".group-label": {
          text: imageName,
          "ref-x": 0.5,
          "ref-y": 1,
          "ref-dy": 10,
          "font-size": 14,
          "text-anchor": "middle",
          fill: "#000",
          cursor: "pointer"
        }
      }
    });

    const imageCell = new customImage({
      position: { x: 50, y: 50 }, 
      size: { width: 100, height: 100 }, 
      attrs: {
        image: { "xlink:href": imageUrl },
        label: { text: imageName }
      }
    });
    // updateHistory();

    group.embed(imageCell);

    graph.addCell(group);
    updateHistory();
    // updateHistory();
    // drawOverview();

    const toolsView = new dia.ToolsView({
      tools: [
        new elementTools.Remove({
          x: "100%",
          y: 0,
          offset: { x: 10, y: -10 },
          action: () => confirmRemoval(groupView)
        }),
        // new ResizeToolbl({
        //   selector: "rect"
        // }),
        new ResizeTool({
          selector: "rect"
        }),
        // new ResizeTooltl({
        //   selector: "rect"
        // }),
        // new ResizeTooltr({
        //   selector: "rect"
        // }),
        // new infobutton({
        //   selector: "rect",
        // }),
        connectRight,
        connectLeft,
        connectTop,
        connectBottom
      ]
    });

    const groupView = group.findView(paper);
    groupView.addTools(toolsView);
    toolsView.render();
    toolsView.$el.addClass("active");

    paper.on("blank:pointerclick", () => {
      toolsView.$el.removeClass("active");
      $(".joint-tools.joint-theme-default").removeClass("active");
    }); 
    groupCells.push(group);
  } else {

    if (groupUnderDrop) {
      const imageCell = new customImage({
        markup: `
        <g joint-selector="cell-group">
        <rect width="60" height="60" fill="#fff" stroke="#aaaaaa" joint-selector="background"/>
        <image  width="40" height="40" joint-selector="image-cell" />
        <text font-size="13" joint-selector="label" display="block" class="imagecell-label"/>
        </g>
      `,
        position: { x, y }, 
        size: { width: 60, height: 60 }, 
        attrs: {
          image: { 
            "xlink:href": imageUrl,
            x: 10,
            y: 10
          },
          ".imagecell-label": {
            text: imageName,
            "ref-x": 0.5,
            "ref-dy": 0,
            "font-size": 12,
            "text-anchor": "middle",
            "line-height": "30",
            fill: "#000",
            y: 15,
            cursor: "pointer",
            "textWrap": { 
              width: 60, 
              ellipsis: true
            }
          }
        }
      });

      imageCell.set("initialRelativeX", x); 
      imageCell.set("initialRelativeY", y);

      groupUnderDrop.embed(imageCell);

      graph.addCell(imageCell);
      updateHistory();
      // drawOverview();
      // updateHistory();
    } else {

      const imageCell = new customImage({
        markup: `
        <g joint-selector="cell-group">
        <rect width="60" height="60" fill="#fff" stroke="#aaaaaa" joint-selector="background"/>
        <image  width="40" height="40" joint-selector="image-cell" />
        <text font-size="13" joint-selector="label" display="block" class="imagecell-label"/>
        </g>
      `,
        position: { x, y }, 
        size: { width: 60, height: 60 }, 
        attrs: {
          image: { 
            "xlink:href": imageUrl,
            x: 10,
            y: 10
          },
          ".imagecell-label": {
            text: imageName,
            "ref-x": 0.5,
            "ref-dy": 1.5,
            y: 15,
            "font-size": 12,
            "text-anchor": "middle",
            "line-height": "30",
            fill: "#000",
            cursor: "pointer",
            "textWrap": { 
              width: 60, 
              ellipsis: true
            }
          }
        }
      });

      graph.addCell(imageCell);
      updateHistory();
      // updateHistory();
      // drawOverview();

    }
  }
}

const leftSidebarImages = document.querySelectorAll("img");

leftSidebarImages.forEach((img) => {
  img.addEventListener("dragstart", (event) => {
    const imageUrl = event.target.src;
    const imageName = event.target.getAttribute("name");
    const groupCheck = event.target.getAttribute("data-group");
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        imageUrl,
        imageName,
        groupCheck
      })
    );
  });
});

paperContainer.addEventListener("drop", (event) => {
  event.preventDefault();

  const data = JSON.parse(event.dataTransfer.getData("text/plain"));
  const imageUrl = data.imageUrl;
  const imageName = data.imageName;
  const groupCheck = data.groupCheck;
  handleDrop(event, imageUrl, imageName, groupCheck);
});
paperContainer.addEventListener("dragover", (event) => event.preventDefault());

// graph.on("add", onElementAdded);
// // function onElementAdded(element){
  
// // }
function getMarkup(angle = 0) {
  return [
    {
      tagName: "circle",
      selector: "button",
      attributes: {
        r: 7,
        fill: "#4666E5",
        stroke: "#FFFFFF",
        cursor: "pointer"
      }
    },
    {
      tagName: "path",
      selector: "icon",
      attributes: {
        transform: `rotate(${angle})`,
        d: "M -4 -1 L 0 -1 L 0 -4 L 4 0 L 0 4 0 1 -4 1 z",
        fill: "#FFFFFF",
        stroke: "none",
        "stroke-width": 2,
        "pointer-events": "none"
      }
    }
  ];
}
const connectRight = new elementTools.Connect({
  x: "110%",
  y: "50%",
  markup: getMarkup(0)
});

const connectBottom = new elementTools.Connect({
  x: "50%",
  y: "110%",
  markup: getMarkup(90)
});
const connectTop = new elementTools.Connect({
  x: "50%",
  y: "-10%",
  markup: getMarkup(270)
});
const connectLeft = new elementTools.Connect({
  x: "-10%",
  y: "50%",
  markup: getMarkup(180)
});

function exportDiagramJSON() {
  const diagramDesign = graph.toJSON();
  const diagramDesignJSONString = JSON.stringify(diagramDesign);
  //  console.log(diagramDesignJSONString);

}
const exportButton = document.getElementById("export-button");



$("#import-button").change(function (event) {
  const selectedFile = event.target.files[0];

  const reader = new FileReader();
  reader.onload = function (e) {
    const jsonContent = e.target.result;

    processJSON(jsonContent);
  };
  reader.readAsText(selectedFile);

});

function processJSON(jsonContent) {
  try {
    const jsonData = JSON.parse(jsonContent);
    graph.fromJSON(jsonData);

    setTimeout(() => {
      jsonData.cells.forEach((cell) => {
        if (cell.type === 'link' && cell.customAttributes && cell.customAttributes.arrowType) {
          const linkElement = document.querySelector(`[model-id="${cell.id}"]`);
          if (linkElement) {
            const arrowType = cell.customAttributes.arrowType;
            linkElement.classList.add(arrowType);
          }
        }
      });
    }, 100); 

  } catch (error) {
    // console.error("Error parsing JSON:", error);
  }
  // updateHistory();
  // drawOverview();
}


graph.on("change:target", (link, newTarget) => {
  if (link.isLink() && newTarget) {
      const sourceView = paper.findViewByModel(link.get("source").id);
      const targetView = paper.findViewByModel(newTarget.id);
      if (sourceView && targetView) {
          const coords = paper.clientToLocalPoint({
              x: event.clientX,
              y: event.clientY
          });
          showArrowTypeMenu(coords.x, coords.y, sourceView, targetView);
      }
  }
});

function showArrowTypeMenu(x, y, sourceView, targetView) {
  const arrowMenu = document.createElement("div");

  const clientX = (x + paper.el.scrollLeft) / zoomLevel;
  const clientY = (y + paper.el.scrollTop) / zoomLevel;

  const targetBBox = targetView.model.getBBox();

  const targetArrowheadX = targetBBox.x;
  const targetArrowheadY = targetBBox.y + targetBBox.height / 2;

  const arrowMenuX = targetArrowheadX * zoomLevel + paper.el.scrollLeft;
  const arrowMenuY = targetArrowheadY * zoomLevel + paper.el.scrollTop;

  arrowMenu.className = "arrow-menu";
  arrowOptions.forEach((arrowOption) => {
    const arrowItem = document.createElement("div");
    $(arrowItem).addClass(arrowOption.name);

    arrowItem.innerHTML = arrowOption.svg;
    arrowItem.addEventListener("click", () => {
      applyArrowType(sourceView, targetView,link, arrowOption.name);
      arrowMenu.remove();
    });
    setTimeout(function(){
      arrowMenu.remove();
    },2000);
    arrowMenu.appendChild(arrowItem);
  });

  arrowMenu.style.position = "absolute";
  arrowMenu.style.left = arrowMenuX + "px";
  arrowMenu.style.top = arrowMenuY + "px";
  paper.el.appendChild(arrowMenu);

  function removeArrowMenu() {
    if (arrowMenu.parentNode) {
      arrowMenu.parentNode.removeChild(arrowMenu);
    }
  }

  paper.on("blank:pointerclick", () => {
    removeArrowMenu();
  });
}
function applyArrowType(sourceView, targetView, selectedArrowType) {
  const arrowAttributes = {
    "rightside-arrow": {},
    "rightside-dotted-arrow": {},
    "doublesided-arrow": {},
    "doublesided-dotted-arrow": {}
  };

  const existingLink = graph.getLinks().find((existingLink) => {
    return (
      existingLink.get("source").id === sourceView &&
      existingLink.get("target").id === targetView
    );
  });

  if (existingLink) {
    graph.removeCells([existingLink]);
  }

  const link = new joint.shapes.standard.Link({
    id: existingLink.id,
    source: {
      id: sourceView
    },
    target: {
      id: targetView
    },
    router: {
      name: "manhattan"
    },
    connector: {
      name: "rounded"
    },
    attrs: {
      ".connection": {
        stroke: "#000",
        strokeWidth: 1
      }
    },
    labels: existingLink.attributes.labels,
  });

  if (arrowAttributes.hasOwnProperty(selectedArrowType)) {
    link.attr(arrowAttributes[selectedArrowType]);
  }

  link.attr("class", selectedArrowType);
  // updateHistory();
  
  graph.addCell(link);
  const linkVel = link.findView(paper).vel;
  if (selectedArrowType === "rightside-arrow") {
    linkVel.addClass("rightside-arrow");
  } else if(selectedArrowType === "rightside-dotted-arrow"){
    linkVel.addClass("rightside-dotted-arrow");
  } else if(selectedArrowType === "doublesided-arrow"){
    linkVel.addClass("doublesided-arrow");
  }else if(selectedArrowType === "doublesided-dotted-arrow"){
    linkVel.addClass("doublesided-dotted-arrow");
  }
  // updateHistory();
}
// function applyArrowType(sourceView, targetView, selectedArrowType) {
//   const arrowAttributes = {
//     "rightside-arrow": {},
//     "rightside-dotted-arrow": {},
//     "doublesided-arrow": {},
//     "doublesided-dotted-arrow": {}
//   };

//   const link = new joint.shapes.standard.Link({
//     source: {
//       id: sourceView.model.id
//     },
//     target: {
//       id: targetView.model.id
//     },
//     router: {
//       name: "manhattan"
//     },
//     connector: {
//       name: "rounded"
//     },
//     attrs: {
//       ".connection": {
//         stroke: "#000",
//         strokeWidth: 1
//       }
//     }
//   });

//   if (arrowAttributes.hasOwnProperty(selectedArrowType)) {
//     link.attr(arrowAttributes[selectedArrowType]);
//   }

//   link.attr("class", selectedArrowType);
//   updateHistory();
//   const existingLink = graph.getLinks().find((existingLink) => {
//     return (
//       existingLink.get("source").id === sourceView.model.id &&
//       existingLink.get("target").id === targetView.model.id
//     );
//   });

//   if (existingLink) {
//     graph.removeCells([existingLink]);
//   }

//   graph.addCell(link);
//   const linkVel = link.findView(paper).vel;
//   if (selectedArrowType === "rightside-arrow") {
//     linkVel.addClass("rightside-arrow");
//   } else if(selectedArrowType === "rightside-dotted-arrow"){
//     linkVel.addClass("rightside-dotted-arrow");
//   } else if(selectedArrowType === "doublesided-arrow"){
//     linkVel.addClass("doublesided-arrow");
//   }else if(selectedArrowType === "doublesided-dotted-arrow"){
//     linkVel.addClass("doublesided-dotted-arrow");
//   }
//   updateHistory();
// }
let isInputLabelVisible = false;
let paperscrollleft = 0;
let paperscrolltop = 0;

const paperElement = document.getElementById('paper-container');
paperElement.addEventListener('scroll', function() {
    paperscrollleft = paperElement.scrollLeft;
    paperscrolltop = paperElement.scrollTop;
});

paper.on("link:pointerclick", (linkView, event) => {
    if (!isInputLabelVisible) {
        const coords = paper.clientToLocalPoint({
            x: event.clientX,
            y: event.clientY
        });

        const inputX = coords.x * zoomLevel + 300 - paperscrollleft;
        const inputY = coords.y * zoomLevel - paperscrolltop;

        createLinkLabelInput(linkView, inputX, inputY);
        isInputLabelVisible = true;
    }
});
function createLinkLabelInput(linkView, x, y) {
  if (!linkView) {
    // console.error("Invalid linkView");
    return;
  }
  var inputX= x * zoomLevel + 300;
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter Link Text";
  input.classList.add("edit-label");
  const inputwrap  = document.createElement("div");
  inputwrap.classList.add("input-wrapper");
  inputwrap.style.position = "fixed";
  $(inputwrap).append('<span class="close"><svg xmlns="http://www.w3.org/2000/svg" fill="#000000" width="15px" height="15px" viewBox="0 0 32 32" version="1.1"><path d="M16 0c-8.836 0-16 7.163-16 16s7.163 16 16 16c8.837 0 16-7.163 16-16s-7.163-16-16-16zM16 30.032c-7.72 0-14-6.312-14-14.032s6.28-14 14-14 14 6.28 14 14-6.28 14.032-14 14.032zM21.657 10.344c-0.39-0.39-1.023-0.39-1.414 0l-4.242 4.242-4.242-4.242c-0.39-0.39-1.024-0.39-1.415 0s-0.39 1.024 0 1.414l4.242 4.242-4.242 4.242c-0.39 0.39-0.39 1.024 0 1.414s1.024 0.39 1.415 0l4.242-4.242 4.242 4.242c0.39 0.39 1.023 0.39 1.414 0s0.39-1.024 0-1.414l-4.242-4.242 4.242-4.242c0.391-0.391 0.391-1.024 0-1.414z"/></svg></div>');
  inputwrap.style.left = x + "px";
    inputwrap.style.top = y + "px";
  $(inputwrap).append(input)
  setTimeout(function(){
    inputwrap.remove();
    isInputLabelVisible = false;
  },2000);
  input.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      const linkText = input.value.trim();
      if (linkText) {
        applyLinkLabel(linkView, linkText);
        // updateHistory();
        inputwrap.remove();
        isInputLabelVisible = false;
      }
    }
  });
  $(inputwrap).find(".close").click(function(){
    inputwrap.remove();
    isInputLabelVisible = false;
  })

  document.body.appendChild(inputwrap);
  input.focus();

  paper.on("blank:pointerclick", () => {
    if (isInputLabelVisible) {
      inputwrap.remove();
      isInputLabelVisible = false;
    }
  });
}
const arrowOptions = [
  {
    id: "arrow-type-1",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20" viewBox="0 0 41 20" fill="none"><path d="M31.5 2C31.5 2 33.5 6.66667 39.5 10C33.5 13.3333 31.5 18 31.5 18" stroke="black" stroke-width="1" ></path><path d="M39.5 10H28.5" stroke="black" stroke-width="1"></path><path d="M2 10L33 10" stroke="black" stroke-width="1" ></path></svg>',
    name: "rightside-arrow"
  },
  {
    id: "arrow-type-2",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20" viewBox="0 0 41 20" fill="none"><path d="M31.5 2C31.5 2 33.5 6.66667 39.5 10C33.5 13.3333 31.5 18 31.5 18" stroke="black" stroke-width="1" ></path><path d="M39.5 10H28.5" stroke="black" stroke-width="1"></path><path d="M2 10L33 10" stroke="black" stroke-width="1" stroke-dasharray="4 4 "></path></svg>',
    name: "rightside-dotted-arrow"
  },
  {
    id: "arrow-type-3",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20" viewBox="0 0 46 20" fill="none"><path d="M36.5 2C36.5 2 38.5 6.66667 44.5 10C38.5 13.3333 36.5 18 36.5 18" stroke="black" stroke-width="1" ></path><path d="M44.5 10H33.5" stroke="black" stroke-width="1"></path><path d="M11 10L38 10" stroke="black" stroke-width="1"></path><path d="M9.5 18C9.5 18 7.5 13.3333 1.5 10C7.5 6.66667 9.5 2 9.5 2" stroke="black" stroke-width="1" ></path><path d="M1.5 10L12.5 10" stroke="black" stroke-width="1"></path></svg>',
    name: "doublesided-arrow"
  },
  {
    id: "arrow-type-4",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20" viewBox="0 0 46 20" fill="none"><path d="M36.5 2C36.5 2 38.5 6.66667 44.5 10C38.5 13.3333 36.5 18 36.5 18" stroke="black" stroke-width="1" ></path><path d="M44.5 10H33.5" stroke="black" stroke-width="1"></path><path d="M11 10L38 10" stroke="black" stroke-width="1" stroke-dasharray="4 4 "></path><path d="M9.5 18C9.5 18 7.5 13.3333 1.5 10C7.5 6.66667 9.5 2 9.5 2" stroke="black" stroke-width="1" ></path><path d="M1.5 10L12.5 10" stroke="black" stroke-width="1"></path></svg>',
    name: "doublesided-dotted-arrow"
  }
];


function applyLinkLabel(linkView, linkText, positionX, positionY) {
  const link = linkView.model;

  const position = {
    x: positionX,
    y: positionY
  };

  link.label(0, {
    position: {
      distance: 0.5,
      offset: -20,
      args: {
        x: position.x,
        y: position.y,
        dx: 0,
        dy: 0,
        angle: 0
      }
    },
    attrs: {
      text: {
        text: linkText
      }
    }
  });
}

let modelIDd;
// const infobutton = elementTools.Control.extend({
//   currentModelID: null,
//   children: [
//     {
//       tagName: "image",
//       selector: "handle",
//       attributes: {
//         cursor: "pointer",
//         width: 20,
//         height: 20,
//         "xlink:href":
//           "images/info.svg",
//         x: -30,
//         y: -30,
//       },
//     },
//   ],
//   initialize: function () {
//     this.el.addEventListener("mousedown", this.handleMouseDown.bind(this));
//   },

//   handleMouseDown: function () {
//     modelIDd = this.el.getAttribute('model-id');
//     try {
//       ["name", "quantity", "region"].forEach(e => document.getElementById(`${e}value`).value = "");
//     } catch {}
//     ["texttag", "textvalue", "optionstag", "colortag", "colorbox1", "colorbox2", "colorbox3", "colorbox4", "saveb", "resetb"].forEach(e => document.getElementById(e).style.display = "none");
//     var box = document.getElementById("box");
//     var arrowMenu = box.querySelector(".arrow-menu");
//     arrowMenu && box.removeChild(arrowMenu);
//     document.getElementById("jsontab").addEventListener("click", () => {
//       document.getElementById("jsoncont").textContent = JSON.stringify(processInput(graph.toJSON()), null, 2);
//     })
//     const imageDiv = document.querySelector(`[model-id="${modelIDd}"]`);
//     var link = imageDiv.querySelector("image").getAttribute("xlink:href");
//     var text = link.split("/")[link.split("/").length - 1].split(".")[0].split(/[-_]/).filter(item => !["light", "bg"].includes(item)).join(" ");
//     if (text == "ungroup icon") {
//       text = "Selection-group";
//       link = "images/group.svg";
//     }
//     var image = document.getElementById("element");
//     image.src = link;
//     var textElement = document.getElementById("nameofele");
//     textElement.textContent = text;
//     ["nametag", "quantitytag", "regiontag"].forEach(tag => document.getElementById(tag).style.display = "block");
//     var nameTextbox = document.getElementById("namevalue");
//     var quantityTextbox = document.getElementById("quantityvalue");
//     var regionTextbox = document.getElementById("regionvalue");
//     var saveButton = document.getElementById("save");
//     saveButton.addEventListener("click", function() {
//       var currentjson = graph.toJSON();
//       var elementUpdated = false;
//       currentjson.cells.forEach(cell => {
//         if (cell.id === modelIDd) {
//           if (nameTextbox.value !== "") {
//             if (cell.type == "custom.Image") {
//               cell.attrs[".imagecell-label"].text = nameTextbox.value;
//               elementUpdated = true;
//             } else {
//               cell.attrs[".group-label"].text = nameTextbox.value;
//               elementUpdated = true;
//             }
//           }
//           if (quantityTextbox.value !== "") {
//             if (/^[\d]+$/.test(quantityTextbox.value)) {
//               if (cell.type == "custom.Image") {
//                 cell.markup = `\n              <g joint-selector="cell-group">\n                <rect width="60" height="60" fill="#fff" stroke="#aaaaaa" joint-selector="background"/>\n                <circle r="10" fill="#fff" stroke="#aaaaaa" joint-selector="count"/>\n                <text x="0" y="0" font-size="12" fill="#000" text-anchor="middle" dominant-baseline="middle" joint-selector="count-text">${quantityTextbox.value}</text>\n                <image width="40" height="40" joint-selector="image-cell" />\n                <text font-size="14" joint-selector="label" display="block" class="imagecell-label"/>\n              </g>\n            `;
//                 elementUpdated = true;
//               } else if (cell.type == "custom.CustomGroup") {
//                 cell.markup = `\n              <g class="rotatable">\n        <g class="scalable">\n          <rect width="200" height="100"/>\n        </g>\n          <image width="50" height="50"/>\n        <text class="group-label"/>\n      <circle r="10" fill="#fff" stroke="#aaaaaa" joint-selector="count"/>\n                <text x="0" y="0" font-size="12" fill="#000" text-anchor="middle" dominant-baseline="middle" joint-selector="count-text">${quantityTextbox.value}</text>\n        </g>\n              `;
//                 elementUpdated = true;
//               } else {
//                 cell.markup = `\n             <g class="rotatable">\n        <rect  stroke="#555"/>\n        <image width="20" height="20" class="ungroup-btn"/>\n      <text class="group-label">Group Name</text>\n    <circle r="10" fill="#fff" stroke="#aaaaaa" joint-selector="count"/>\n                <text x="0" y="0" font-size="12" fill="#000" text-anchor="middle" dominant-baseline="middle" joint-selector="count-text">${quantityTextbox.value}</text>\n        </g>\n              `;
//                 elementUpdated = true;
//               }
//             }
//             else {
//               const errormsg = document.getElementById("errormsg");
//               errormsg.style.display = "block";
//               errormsg.style.opacity = "1";
//               setTimeout(function() {
//                 errormsg.style.opacity = "0";
//                 quantityTextbox.value = "";
//               }, 1000)
//               setTimeout(function() {
//                 errormsg.style.display = "none";
//               }, 1500);
//             }  
//           }
//         }
//       });
//       elementUpdated && graph.fromJSON(currentjson);
//     });
//     var resetButton = document.getElementById("reset");
//     resetButton.addEventListener("click", function() {
//         [nameTextbox, quantityTextbox, regionTextbox].forEach(e => e.value = "");
//     });
//     [container, image, textElement, nameTextbox, quantityTextbox, regionTextbox, saveButton, resetButton].forEach(e => e.style.display = "block");
//   },
// })

const ResizeTool = elementTools.Control.extend({
  children: [
    {
      tagName: "circle",
      selector: "handle",
      attributes: {
        cursor: "se-resize",
        r: 4,
        fill: "#4666e5",
      }
    },
    {
      tagName: "rect",
      selector: "extras",
      attributes: {
        "pointer-events": "none",
        fill: "none",
        stroke: "#33334F",
        "stroke-dasharray": "2,4",
        rx: 5,
        ry: 5
      }
    }
  ],
  getPosition: function (view) {
    const model = view.model;
    const { width, height } = model.size();
    return { x: width, y: height };
  },
  setPosition: function (view, coordinates) {
    const model = view.model;
    const newSize = {
      width: Math.max(coordinates.x - 10, 1),
      height: Math.max(coordinates.y - 10, 1)
    };

    model.resize(newSize.width, newSize.height);

    const parentWidth = newSize.width;
    const parentHeight = newSize.height;

    const childWidth = parentWidth * 0.9;
    const childHeight = parentHeight * 0.9;

    const childAttrs = {
      rect: {
        width: parentWidth,

        height: parentHeight
      },
      label: {}
    };

    if (model.attributes.type === "basic.Rect") {
      childAttrs.image = {
        width: 30,
        height: 30,
        refX: 0, 
        refY: 0
      };
    } else if (model.attributes.type === "custom.Image") {
      childAttrs.image = {
        width: childWidth * 0.8,
        height: childHeight * 0.8,
        refX: 0,
        refY: 0
      };
    }

    if (model.attributes.type !== "custom.CustomGroup") {
      model.attr(childAttrs);
    }
  }
});

// const ResizeToolbl = elementTools.Control.extend({
//   children: [
//     {
//       tagName: "circle",
//       selector: "handle",
//       attributes: {
//         cursor: "sw-resize",
//         r: 4,
//         fill: "#4666e5",
//       }
//     },
//     {
//       tagName: "rect",
//       selector: "extras",
//       attributes: {
//         "pointer-events": "none",
//         fill: "none",
//         stroke: "#33334F",
//         "stroke-dasharray": "2,4",
//         rx: 5,
//         ry: 5
//       }
//     }
//   ],
//   getPosition: function (view) {
//     const model = view.model;
//     const { width, height } = model.size();
//     return { x: 0, y: height };
//   },
//   setPosition: function (view, coordinates) {
//     const model = view.model;
//     const newposition = {
//       x: coordinates.x,
//       y: coordinates.y
//     };
//     const newSize = {
//       width: Math.max(coordinates.x - 10, 1),
//       height: Math.max(coordinates.y - 10, 1)
//     };
//     model.position(newposition.x, newposition.y);
//     model.resize(newSize.width, newSize.height);

//     const parentWidth = newSize.width;
//     const parentHeight = newSize.height;

//     const childWidth = parentWidth * 0.9;
//     const childHeight = parentHeight * 0.9;

//     const childAttrs = {
//       rect: {
//         width: childWidth,

//         height: childHeight
//       },
//       label: {}
//     };

//     if (model.attributes.type === "basic.Rect") {
//       childAttrs.image = {
//         width: 30,
//         height: 30,
//         refX: 0, 
//         refY: 0
//       };
//     } else if (model.attributes.type === "custom.Image") {
//       childAttrs.image = {
//         width: childWidth * 0.8,
//         height: childHeight * 0.8,
//         refX: 0,
//         refY: 0
//       };
//     }

//     if (model.attributes.type !== "custom.CustomGroup") {
//       model.attr(childAttrs);
//     }
//   }
// });

// const ResizeTooltr = elementTools.Control.extend({
//   children: [
//     {
//       tagName: "circle",
//       selector: "handle",
//       attributes: {
//         cursor: "ne-resize",
//         r: 4,
//         fill: "#4666e5",
//       }
//     },
//     {
//       tagName: "rect",
//       selector: "extras",
//       attributes: {
//         "pointer-events": "none",
//         fill: "none",
//         stroke: "#33334F",
//         "stroke-dasharray": "2,4",
//         rx: 5,
//         ry: 5
//       }
//     }
//   ],
//   getPosition: function (view) {
//     const model = view.model;
//     const { width, height } = model.size();
//     return { x: width, y: 0 };
//   },
//   setPosition: function (view, coordinates) {
//     const model = view.model;
//     const newposition = {
//       x: coordinates.x,
//       y: coordinates.y
//     };
//     const newSize = {
//       width: Math.max(coordinates.x - 10, 1),
//       height: Math.max(coordinates.y - 10, 1)
//     };
//     model.position(newposition.x, newposition.y);
//     model.resize(newSize.width, newSize.height);

//     const parentWidth = newSize.width;
//     const parentHeight = newSize.height;

//     const childWidth = parentWidth * 0.9;
//     const childHeight = parentHeight * 0.9;

//     const childAttrs = {
//       rect: {
//         width: childWidth,

//         height: childHeight
//       },
//       label: {}
//     };

//     if (model.attributes.type === "basic.Rect") {
//       childAttrs.image = {
//         width: 30,
//         height: 30,
//         refX: 0, 
//         refY: 0
//       };
//     } else if (model.attributes.type === "custom.Image") {
//       childAttrs.image = {
//         width: childWidth * 0.8,
//         height: childHeight * 0.8,
//         refX: 0,
//         refY: 0
//       };
//     }

//     if (model.attributes.type !== "custom.CustomGroup") {
//       model.attr(childAttrs);
//     }
//   }
// });

// const ResizeTooltl = elementTools.Control.extend({
//   children: [
//     {
//       tagName: "circle",
//       selector: "handle",
//       attributes: {
//         cursor: "nw-resize",
//         r: 4,
//         fill: "#4666e5",
//       }
//     },
//     {
//       tagName: "rect",
//       selector: "extras",
//       attributes: {
//         "pointer-events": "none",
//         fill: "none",
//         stroke: "#33334F",
//         "stroke-dasharray": "2,4",
//         rx: 5,
//         ry: 5
//       }
//     }
//   ],
//   getPosition: function (view) {
//     const model = view.model;
//     const { width, height } = model.size();
//     return { x: 0, y: 0 };
//   },
//   setPosition: function (view, coordinates) {
//     const model = view.model;
//     const newposition = {
//       x: coordinates.x,
//       y: coordinates.y
//     };
//     const newSize = {
//       width: Math.max(coordinates.x - 10, 1),
//       height: Math.max(coordinates.y - 10, 1)
//     };
//     model.position(newposition.x, newposition.y);
//     model.resize(newSize.width, newSize.height);

//     const parentWidth = newSize.width;
//     const parentHeight = newSize.height;

//     const childWidth = parentWidth * 0.9;
//     const childHeight = parentHeight * 0.9;

//     const childAttrs = {
//       rect: {
//         width: childWidth,

//         height: childHeight
//       },
//       label: {}
//     };

//     if (model.attributes.type === "basic.Rect") {
//       childAttrs.image = {
//         width: 30,
//         height: 30,
//         refX: 0, 
//         refY: 0
//       };
//     } else if (model.attributes.type === "custom.Image") {
//       childAttrs.image = {
//         width: childWidth * 0.8,
//         height: childHeight * 0.8,
//         refX: 0,
//         refY: 0
//       };
//     }

//     if (model.attributes.type !== "custom.CustomGroup") {
//       model.attr(childAttrs);
//     }
//   }
// });

const selectionRectangle = document.createElement("div");
selectionRectangle.classList.add("selection-div");
selectionRectangle.style.position = "absolute";
selectionRectangle.style.border = "1px dashed #000";
selectionRectangle.style.pointerEvents = "none";
selectionRectangle.style.display = "none";
paper.el.appendChild(selectionRectangle);

var startX, startY, endX, endY;
var isDragging = false;

let selectedElements = [];

const groupButton = document.createElement("button");

groupButton.style.position = "absolute";
groupButton.style.top = "10px";
groupButton.style.left = "10px";
groupButton.style.display = "none";
groupButton.classList.add("group-btn");
paperContainer.append(groupButton);

const groupImg = document.createElement("img");
groupImg.src = "images/group.svg";
groupImg.style.width = "20px";
groupImg.style.height = "20px";
groupButton.textContent = "";
groupButton.appendChild(groupImg);
let groupCounter = 0;

  function createGroup(position, size) {
    const imageUrl= "images/ungroup-icon.svg";
    const groupId = `group-${groupCounter++}`;
    const group = new joint.shapes.basic.Rect({
      size: {
        width: size.width,
        height: size.height
      },
      position: position || { x: 100, y: 100 },
      attrs: {
        rect: {
          width: size.width,
          height: size.height,
          fill: "transparent",
          stroke: "#555",
          "stroke-dasharray": "5 5",
          "stroke-width": "1"
        },
        ".group-label": {
          text: "Group Name",
          "ref-x": 0.5,
          "ref-y": 1,
          "ref-dy": 10,
          "font-size": 14,
          "text-anchor": "middle",
          fill: "#000",
          cursor: "pointer"
        },
        ".ungroup-button": {
          cursor: "pointer"
        },
        image: {
          "xlink:href": imageUrl,
          width: 30,
          height: 30,
          ref: "rect",
          "ref-x": -0.5,
          "ref-y": -3.5,
          "cursor": 'pointer'
        }
      },
      id: groupId,
      markup: `
        <g class="rotatable">

            <rect  stroke="#555"/>

            <image width="20" height="20" class="ungroup-btn"/>

          <text class="group-label">Group Name</text>
        </g>
      `
    });

    return group;
  }

groupButton.addEventListener("click", groupSelectedElements);

function groupSelectedElements() {
  if (selectedElements.length > 1) {

    const selectedGroupElements = {
      cells: []
    };
    selectedElements.forEach((element) => {
      if (element.attributes.type === 'custom.CustomGroup') {

        const childElements = element.getEmbeddedCells();
        const filteredChildElements = childElements.filter((element) => element !== undefined);

        if (!selectedGroupElements.cells.includes(element)) {
          selectedGroupElements.cells.push(element);
        }

        element.unembed(filteredChildElements);
      } else {
        if (!selectedGroupElements.cells.includes(element)) {
          selectedGroupElements.cells.push(element);
        }
      }
    });

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    selectedElements.filter(element => element.attributes.type !== "link").forEach(element => {
        const cellView = paper.findViewByModel(element.id);
        if (cellView) {
            const bbox = cellView.getBBox({ useModelGeometry: true });
            minX = Math.min(minX, bbox.x);
            minY = Math.min(minY, bbox.y);
            maxX = Math.max(maxX, bbox.x + bbox.width);
            maxY = Math.max(maxY, bbox.y + bbox.height);
        }
    });
    const boundaryCoordinates = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
    const group = createGroup(
      { x: boundaryCoordinates.x - 20 / zoomLevel, y: boundaryCoordinates.y - 20 / zoomLevel},
      {
        width: boundaryCoordinates.width + 60 / zoomLevel,
        height: boundaryCoordinates.height + 60 / zoomLevel
      }
    );

    // const group = createGroup(
    //   { x: selectionRectangle.offsetLeft / zoomLevel, y: selectionRectangle.offsetTop / zoomLevel},
    //   {
    //     width: selectionRectangle.offsetWidth / zoomLevel,
    //     height: selectionRectangle.offsetHeight / zoomLevel
    //   }
    // );

    selectedGroupElements.cells.forEach((element) => {
      group.embed(element);
    });

    // updateHistory();
    graph.addCell(group);
    group.attr(".label/text", "Group Name");
    // updateHistory();
    // drawOverview();
    selectedGroupElements.cells.forEach((element) => {
      if (element !== group) {
        element.toFront();
      }
    });

    groupButton.style.display = "none";
    selectionRectangle.style.display = "none";
  } else {
    groupButton.style.display = "none";
    selectionRectangle.style.display = "none";
  }
}

paper.on("blank:pointerclick", () => {
  selectedElements = [];
  groupButton.style.display = "none";
  selectionRectangle.style.display = "none"; 

});

paper.el.addEventListener("pointermove", (e) => {
  if (isDragging) {
    endX = e.clientX - 300 + paperContainer.scrollLeft;
    endY = e.clientY - 50 + paperContainer.scrollTop;
    const minX = Math.min(startX, endX);
    const minY = Math.min(startY, endY);
    const maxX = Math.max(startX, endX);
    const maxY = Math.max(startY, endY);

    selectionRectangle.style.left = minX + "px";
    selectionRectangle.style.top = minY + "px";
    selectionRectangle.style.width = maxX - minX + "px";
    selectionRectangle.style.height = maxY - minY + "px";

    const elementsInSelection = graph.getElements().filter((element) => {
      if (element === selectionRectangle) {
        return false; 
      }
      const elementView = element.findView(paper);
      const elementBBox = elementView.getBBox();
      return (
        elementBBox.x + elementBBox.width >= minX &&
        elementBBox.x <= maxX &&
        elementBBox.y + elementBBox.height >= minY &&
        elementBBox.y <= maxY
      );
    });
    selectionRectangle.style.display = "block";

    const linksInSelection = [];
    graph.getLinks().forEach((link) => {
      const sourceElement = graph.getCell(link.get("source").id);
      const targetElement = graph.getCell(link.get("target").id);

      const arrowView = link.findView(paper);
      const arrowBBox = arrowView.getBBox();
      if (
        (elementsInSelection.includes(sourceElement) ||
          elementsInSelection.includes(targetElement) ||
          (minX <= arrowBBox.x + arrowBBox.width &&
            maxX >= arrowBBox.x &&
            minY <= arrowBBox.y + arrowBBox.height &&
            maxY >= arrowBBox.y)) &&
        !linksInSelection.includes(link)
      ) {

        linksInSelection.push(link);
      }
    });

    selectedElements = [...elementsInSelection, ...linksInSelection];

    if (selectedElements.length > 0) {

      groupButton.style.left = startX + "px";

      groupButton.style.top = startY + "px";

      groupButton.style.display = "block";
      paper.on("blank:pointerclick", () => {
        groupButton.style.display = "none";
      });

    } else {
      groupButton.style.display = "none";
    }
  }
});

paper.el.addEventListener("pointerdown", (e) => {
    startX = e.clientX - 300 + paperContainer.scrollLeft;
    startY = e.clientY - 50 + paperContainer.scrollTop;

  isDragging = true;

  const targetElement = paper.findView(e.target);

  if (targetElement) {
    isDragging = false;
    return;
  }

  selectionRectangle.style.left = startX + "px";
  selectionRectangle.style.top = startY + "px";
  selectionRectangle.style.width = "0";
  selectionRectangle.style.height = "0";

  selectionRectangle.style.pointerEvents = "none";

});

paper.el.addEventListener("pointerup", (e) => {
  if (isDragging) {
    isDragging = false;

    if (selectedElements.length === 0) {

      selectionRectangle.style.display = "none";
    }
  }
});

joint.shapes.custom.CustomGroup =   joint.dia.Element.extend({
  defaults: joint.util.deepSupplement(
    {
      type: "custom.CustomGroup",
      size: { width: 200, height: 100 }
    },
    joint.dia.Element.prototype.defaults
  )
});

var inputjson = {

  "Application Integration": [
    {
      "name": "SNS HTTP Notification",
      "path": "Application_Integration/Amazon-Simple-Notification-Service-SNS_HTTP-Notification_light-bg.svg"
    },
    {
      "name": "MQ",
      "path": "Application_Integration/Amazon-MQ.svg"
    },
    {
      "name": "SQS",
      "path": "Application_Integration/Amazon-Simple-Queue-Service-SQS_light-bg.svg"
    },
    {
      "name": "AppSync",
      "path": "Application_Integration/AWS-AppSync.svg"
    },
    {
      "name": "SNS",
      "path": "Application_Integration/Amazon-Simple-Notification-Service-SNS_light-bg.svg"
    },
    {
      "name": "SQS",
      "path": "Application_Integration/Amazon-Simple-Queue-Service-SQS.svg"
    },
    {
      "name": "SNS Email Notification",
      "path": "Application_Integration/Amazon-Simple-Notification-Service-SNS_Email-Notification_light-bg.svg"
    },
    {
      "name": "SNS Topic",
      "path": "Application_Integration/Amazon-Simple-Notification-Service-SNS_Topic_light-bg.svg"
    },
    {
      "name": "Step Functions",
      "path": "Application_Integration/AWS-Step-Functions.svg"
    },
    {
      "name": "SQS Queue",
      "path": "Application_Integration/Amazon-Simple-Queue-Service-SQS_Queue_light-bg.svg"
    },
    {
      "name": "SQS Message",
      "path": "Application_Integration/Amazon-Simple-Queue-Service-SQS_Message_light-bg.svg"
    }
  ],
  "Customer Engagement": [
    {
      "name": "Customer Engagement",
      "path": "Customer_Engagement/Customer-Engagement.svg"
    },
    {
      "name": "Pinpoint",
      "path": "Customer_Engagement/Amazon-Pinpoint.svg"
    },
    {
      "name": "SES",
      "path": "Customer_Engagement/Amazon-Simple-Email-Service-SES.svg"
    },
    {
      "name": "SES Email",
      "path": "Customer_Engagement/Amazon-Simple-Email-Service-SES_Email_light-bg.svg"
    },
    {
      "name": "Connect",
      "path": "Customer_Engagement/Amazon-Connect.svg"
    }
  ],
  "Database": [
    {
      "name": "ElastiCache For Redis",
      "path": "Database/Amazon-ElastiCache_For-Redis_light-bg.svg"
    },
    {
      "name": "DynamoDB Attribute",
      "path": "Database/Amazon-DynamoDB_Attribute_light-bg.svg"
    },
    {
      "name": "ElastiCache Cache Node",
      "path": "Database/Amazon-ElastiCache_Cache-Node_light-bg.svg"
    },
    {
      "name": "DynamoDB Items",
      "path": "Database/Amazon-DynamoDB_Items_light-bg.svg"
    },
    {
      "name": "Timestream",
      "path": "Database/Amazon-Timestream_light-bg.svg"
    },
    {
      "name": "DynamoDB Item",
      "path": "Database/Amazon-DynamoDB_Item_light-bg.svg"
    },
    {
      "name": "Database Migration Workflow",
      "path": "Database/AWS-Database-Migration-Service_Database-Migration-Workflow_light-bg.svg"
    },
    {
      "name": "QLDB",
      "path": "Database/Amazon-Quantum-Ledger-Database_QLDB_light-bg.svg"
    },
    {
      "name": "Timestream",
      "path": "Database/Amazon-Timestream.svg"
    },
    {
      "name": "DynamoDB Attributes",
      "path": "Database/Amazon-DynamoDB_Attributes_light-bg.svg"
    },
    {
      "name": "Aurora",
      "path": "Database/Amazon-Aurora_light-bg.svg"
    },
    {
      "name": "Neptune",
      "path": "Database/Amazon-Neptune_light-bg.svg"
    },
    {
      "name": "DynamoDB",
      "path": "Database/Amazon-DynamoDB_light-bg.svg"
    },
    {
      "name": "Database Migration Service",
      "path": "Database/AWS-Database-Migration-Service.svg"
    },
    {
      "name": "RDS on VMware",
      "path": "Database/Amazon-RDS-on-VMware_light-bg.svg"
    },
    {
      "name": "Redshift Dense Storage Node",
      "path": "Database/Amazon-Redshift_Dense-Storage-Node_light-bg.svg"
    },
    {
      "name": "Redshift",
      "path": "Database/Amazon-Redshift_light-bg.svg"
    },
    {
      "name": "ElastiCache",
      "path": "Database/Amazon-ElastiCache_light-bg.svg"
    },
    {
      "name": "ElastiCache For Memcached",
      "path": "Database/Amazon-ElastiCache_For-Memcached_light-bg.svg"
    },
    {
      "name": "DocumentDB with MongoDB compatibility",
      "path": "Database/Amazon-DocumentDB-with-MongoDB-compatibility_light-bg.svg"
    },
    {
      "name": "DynamoDB Global Secondary Index",
      "path": "Database/Amazon-DynamoDB_Global-Secondary-Index_light-bg.svg"
    },
    {
      "name": "Redshift Dense Compute Node",
      "path": "Database/Amazon-Redshift_Dense-Compute-Node_light-bg.svg"
    },
    {
      "name": "DynamoDB Table",
      "path": "Database/Amazon-DynamoDB_Table_light-bg.svg"
    },
    {
      "name": "RDS",
      "path": "Database/Amazon-RDS.svg"
    }
  ],
  "Group Icons": [
    {
      "name": "Spot Fleet",
      "path": "Group_Icons/Spot-Fleet_dark-bg.svg",
      "groupCheck": "true"
    },
    {
      "name": "Elastic Beanstalk container",
      "path": "Group_Icons/Elastic-Beanstalk-container_dark-bg.svg",
      "groupCheck": "true"
    },
    {
      "name": "VPC subnet public",
      "path": "Group_Icons/VPC-subnet-public_dark-bg.svg",
      "groupCheck": "true"
    },
    {
      "name": "EC2 instance contents",
      "path": "Group_Icons/EC2-instance-contents_dark-bg.svg",
      "groupCheck": "true"
    },
    {
      "name": "Corporate data center",
      "path": "Group_Icons/Corporate-data-center_dark-bg.svg",
      "groupCheck": "true"
    },
    {
      "name": "Corporate data center",
      "path": "Group_Icons/Corporate-data-center_light-bg.svg",
      "groupCheck": "true"
    },
    {
      "name": "EC2 instance contents",
      "path": "Group_Icons/EC2-instance-contents_light-bg.svg",
      "groupCheck": "true"
    },
    {
      "name": "Region",
      "path": "Group_Icons/Region_light-bg.svg",
      "groupCheck": "true"

    },
    {
      "name": "Server contents",
      "path": "Group_Icons/Server-contents_light-bg.svg",
      "groupCheck": "true"
    },
    {
      "name": "VPC subnet private",
      "path": "Group_Icons/VPC-subnet-private_dark-bg.svg",
      "groupCheck": "true"
    },
    {
      "name": "Server contents",
      "path": "Group_Icons/Server-contents_dark-bg.svg",
      "groupCheck": "true"
    },
    {
      "name": "Region",
      "path": "Group_Icons/Region_dark-bg.svg",
      "groupCheck": "true"
    },
    {
      "name": "Elastic Beanstalk container",
      "path": "Group_Icons/Elastic-Beanstalk-container_light-bg.svg",
      "groupCheck": "true"
    },
    {
      "name": "Auto Scaling",
      "path": "Group_Icons/Auto-Scaling_dark-bg.svg",
      "groupCheck": "true"
    },
    {
      "name": "Step Function",
      "path": "Group_Icons/AWS-Step-Function_light-bg.svg",
      "groupCheck": "true"
    },
    {
      "name": "VPC subnet private",
      "path": "Group_Icons/VPC-subnet-private_light-bg.svg"
    },
    {
      "name": "Auto Scaling",
      "path": "Group_Icons/Auto-Scaling_light-bg.svg"
    },
    {
      "name": "VPC subnet public",
      "path": "Group_Icons/VPC-subnet-public_light-bg.svg",
      "groupCheck": "true"
    },
    {
      "name": "VPC",
      "path": "Group_Icons/Virtual-private-cloud-VPC_light-bg.svg",
      "groupCheck": "true"
    },
    {
      "name": "VPC",
      "path": "Group_Icons/Virtual-private-cloud-VPC_dark-bg.svg",
      "groupCheck": "true"
    },
    {
      "name": "Spot Fleet",
      "path": "Group_Icons/Spot-Fleet_light-bg.svg",
      "groupCheck": "true"
    },
    {
      "name": "Step Function",
      "path": "Group_Icons/AWS-Step-Function_dark-bg.svg",
      "groupCheck": "true"
    }
  ],
  "General AWS Light": [
    {
      "name": "General Internet Gateway",
      "path": "General_AWS_Light/AWS-General_Internet-Gateway_light-bg.svg"
    },
    {
      "name": "AWGeneral SAML Token",
      "path": "General_AWS_Light/AWS-General_SAML-Token_light-bg.svg"
    },
    {
      "name": "Cloud",
      "path": "General_AWS_Light/AWS-Cloud_dark-bg.svg"
    },
    {
      "name": "General Disk",
      "path": "General_AWS_Light/AWS-General_Disk_light-bg.svg"
    },
    {
      "name": "General Multimedia",
      "path": "General_AWS_Light/AWS-General_Multimedia_light-bg.svg"
    },
    {
      "name": "General SSL Padlock",
      "path": "General_AWS_Light/AWS-General_SSL-Padlock_light-bg.svg"
    },
    {
      "name": "Cloud alt",
      "path": "General_AWS_Light/AWS-Cloud-alt_dark-bg.svg"
    },
    {
      "name": "General SDK",
      "path": "General_AWS_Light/AWS-General_SDK_light-bg.svg"
    },
    {
      "name": "General Virtual Private Cloud",
      "path": "General_AWS_Light/AWS-General_Virtual-Private-Cloud_light-bg.svg"
    },
    {
      "name": "General Corporate Data Center",
      "path": "General_AWS_Light/AWS-General_Corporate-Data-Center_light-bg.svg"
    },
    {
      "name": "General Generic Database",
      "path": "General_AWS_Light/AWS-General_Generic-Database_light-bg.svg"
    },
    {
      "name": "General Users",
      "path": "General_AWS_Light/AWS-General_Users_light-bg.svg"
    },
    {
      "name": "General User",
      "path": "General_AWS_Light/AWS-General_User_light-bg.svg"
    },
    {
      "name": "General Client",
      "path": "General_AWS_Light/AWS-General_Client_light-bg.svg"
    },
    {
      "name": "General Mobile Client",
      "path": "General_AWS_Light/AWS-General_Mobile-Client_light-bg.svg"
    },
    {
      "name": "General AWS Cloud",
      "path": "General_AWS_Light/AWS-General_AWS-Cloud_light-bg.svg"
    },
    {
      "name": "General Internet Alt1  2",
      "path": "General_AWS_Light/AWS-General_Internet-Alt1_light-bg-2.svg"
    },
    {
      "name": "General Forums",
      "path": "General_AWS_Light/AWS-General_Forums_light-bg.svg"
    },
    {
      "name": "General Toolkit",
      "path": "General_AWS_Light/AWS-General_Toolkit_light-bg.svg"
    },
    {
      "name": "General Office Building",
      "path": "General_AWS_Light/AWS-General_Office-Building_light-bg.svg"
    },
    {
      "name": "General Tape Storage",
      "path": "General_AWS_Light/AWS-General_Tape-Storage_light-bg.svg"
    },
    {
      "name": "General Internet Alt2",
      "path": "General_AWS_Light/AWS-General_Internet-Alt2_light-bg.svg"
    },
    {
      "name": "General Traditional Server",
      "path": "General_AWS_Light/AWS-General_Traditional-Server_light-bg.svg"
    }
  ],
  "Security Identity and Compliance": [
    {
      "name": "IAM Encrypted Data",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_Encrypted-Data_light-bg.svg"
    },
    {
      "name": "IAM AWS STS Alternate",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_AWS-STS-Alternate_light-bg.svg"
    },
    {
      "name": "IAM Temporary Security Credential",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_Temporary-Security-Credential_light-bg.svg"
    },
    {
      "name": "Cognito",
      "path": "Security_Identity_and_Compliance/Amazon-Cognito.svg"
    },
    {
      "name": "Inspector Agent",
      "path": "Security_Identity_and_Compliance/Amazon-Inspector_Agent_light-bg.svg"
    },
    {
      "name": "Shield",
      "path": "Security_Identity_and_Compliance/AWS-Shield.svg"
    },
    {
      "name": "Macie",
      "path": "Security_Identity_and_Compliance/Amazon-Macie.svg"
    },
    {
      "name": "IAM AWS STS",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_AWS-STS_light-bg.svg"
    },
    {
      "name": "Organizations Organizational Unit",
      "path": "Security_Identity_and_Compliance/AWS-Organizations_Organizational-Unit_light-bg.svg"
    },
    {
      "name": "IAM MFA Token",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_MFA-Token_light-bg.svg"
    },
    {
      "name": "Single Sign On",
      "path": "Security_Identity_and_Compliance/AWS-Single-Sign-On.svg"
    },
    {
      "name": "Organizations Account",
      "path": "Security_Identity_and_Compliance/AWS-Organizations_Account_light-bg.svg"
    },
    {
      "name": "Organizations",
      "path": "Security_Identity_and_Compliance/AWS-Organizations.svg"
    },
    {
      "name": "IAM Data Encryption Key",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_Data-Encryption-Key_light-bg.svg"
    },
    {
      "name": "IAM Add on",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_Add-on_light-bg.svg"
    },
    {
      "name": "IAM Long term Security Credential",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_Long-term-Security-Credential_light-bg.svg"
    },
    {
      "name": "WAF",
      "path": "Security_Identity_and_Compliance/AWS-WAF.svg"
    },
    {
      "name": "IAM Role",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_Role_light-bg.svg"
    },
    {
      "name": "Directory Service",
      "path": "Security_Identity_and_Compliance/AWS-Directory-Service.svg"
    },
    {
      "name": "Shield Shield Advanced",
      "path": "Security_Identity_and_Compliance/AWS-Shield_Shield-Advanced_light-bg.svg"
    },
    {
      "name": "IAM Permissions",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_Permissions_light-bg.svg"
    },
    {
      "name": "Security Identity and Compliance",
      "path": "Security_Identity_and_Compliance/Security-Identity-and-Compliance.svg"
    },
    {
      "name": "Certificate Manager",
      "path": "Security_Identity_and_Compliance/AWS-Certificate-Manager_Certificate-Manager_light-bg.svg"
    },
    {
      "name": "Certificate Manager",
      "path": "Security_Identity_and_Compliance/AWS-Certificate-Manager.svg"
    },
    {
      "name": "IAM",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management_IAM.svg"
    },
    {
      "name": "Firewall Manager",
      "path": "Security_Identity_and_Compliance/AWS-Firewall-Manager.svg"
    },
    {
      "name": "CloudHSM",
      "path": "Security_Identity_and_Compliance/AWS-CloudHSM.svg"
    },
    {
      "name": "Cloud Directory",
      "path": "Security_Identity_and_Compliance/Amazon-Cloud-Directory.svg"
    },
    {
      "name": "Key Management Service",
      "path": "Security_Identity_and_Compliance/AWS-Key-Management-Service.svg"
    },
    {
      "name": "Security Hub",
      "path": "Security_Identity_and_Compliance/AWS-Security-Hub.svg"
    },
    {
      "name": "Artifact",
      "path": "Security_Identity_and_Compliance/AWS-Artifact.svg"
    },
    {
      "name": "Resource Access Manager",
      "path": "Security_Identity_and_Compliance/AWS-Resource-Access-Manager.svg"
    },
    {
      "name": "Secrets Manager",
      "path": "Security_Identity_and_Compliance/AWS-Secrets-Manager.svg"
    },
    {
      "name": "WAF Filtering rule",
      "path": "Security_Identity_and_Compliance/AWS-WAF_Filtering-rule_light-bg.svg"
    },
    {
      "name": "GuardDuty",
      "path": "Security_Identity_and_Compliance/Amazon-GuardDuty.svg"
    }
  ],
  "Media Services": [
    {
      "name": "Media Services",
      "path": "Media_Services/Media-Services_light-bg.svg"
    },
    {
      "name": "Kinesis Video Streams",
      "path": "Media_Services/Amazon-Kinesis-Video-Streams.svg"
    },
    {
      "name": "Elemental MediaStore",
      "path": "Media_Services/AWS-Elemental-MediaStore.svg"
    },
    {
      "name": "Elastic Transcoder",
      "path": "Media_Services/Amazon-Elastic-Transcoder.svg"
    },
    {
      "name": "Elemental MediaConvert",
      "path": "Media_Services/AWS-Elemental-MediaConvert.svg"
    },
    {
      "name": "Elemental MediaTailor",
      "path": "Media_Services/AWS-Elemental-MediaTailor.svg"
    },
    {
      "name": "Elemental MediaPackage",
      "path": "Media_Services/AWS-Elemental-MediaPackage.svg"
    },
    {
      "name": "Elemental MediaLive",
      "path": "Media_Services/AWS-Elemental-MediaLive.svg"
    },
    {
      "name": "Elemental MediaConnect",
      "path": "Media_Services/AWS-Elemental-MediaConnect.svg"
    }
  ],
  "Management and Governance": [
    {
      "name": "Trusted Advisor Checklist",
      "path": "Management_and_Governance/AWS-Trusted-Advisor_Checklist_light-bg.svg"
    },
    {
      "name": "License Manager",
      "path": "Management_and_Governance/AWS-License-Manager.svg"
    },
    {
      "name": "Systems Manager State Manager",
      "path": "Management_and_Governance/AWS-Systems-Manager_State-Manager_light-bg.svg"
    },
    {
      "name": "Managed Services",
      "path": "Management_and_Governance/AWS-Managed-Services.svg"
    },
    {
      "name": "Personal Health Dashboard",
      "path": "Management_and_Governance/AWS-Personal-Health-Dashboard.svg"
    },
    {
      "name": "CloudFormation",
      "path": "Management_and_Governance/AWS-CloudFormation.svg"
    },
    {
      "name": "Systems Manager Automation",
      "path": "Management_and_Governance/AWS-Systems-Manager_Automation_light-bg.svg"
    },
    {
      "name": "CloudWatch Rule",
      "path": "Management_and_Governance/Amazon-CloudWatch_Rule_light-bg.svg"
    },
    {
      "name": "Trusted Advisor",
      "path": "Management_and_Governance/AWS-Trusted-Advisor.svg"
    },
    {
      "name": "CloudFormation Change Set",
      "path": "Management_and_Governance/AWS-CloudFormation_Change-Set_light-bg.svg"
    },
    {
      "name": "Trusted Advisor Checklist Performance",
      "path": "Management_and_Governance/AWS-Trusted-Advisor_Checklist-Performance_light-bg.svg"
    },
    {
      "name": "Auto Scaling",
      "path": "Management_and_Governance/AWS-Auto-Scaling.svg"
    },
    {
      "name": "OpsWorks",
      "path": "Management_and_Governance/AWS-OpsWorks.svg"
    },
    {
      "name": "OpsWorks Instances",
      "path": "Management_and_Governance/AWS-OpsWorks_Instances_light-bg.svg"
    },
    {
      "name": "OpsWorks Stack2",
      "path": "Management_and_Governance/AWS-OpsWorks_Stack2_light-bg.svg"
    },
    {
      "name": "Command Line Interface",
      "path": "Management_and_Governance/AWS-Command-Line-Interface.svg"
    },
    {
      "name": "Systems Manager Maintenance Windows",
      "path": "Management_and_Governance/AWS-Systems-Manager_Maintenance-Windows_light-bg.svg"
    },
    {
      "name": "Systems Manager Parameter Store",
      "path": "Management_and_Governance/AWS-Systems-Manager_Parameter-Store_light-bg.svg"
    },
    {
      "name": "Trusted Advisor Checklist Cost",
      "path": "Management_and_Governance/AWS-Trusted-Advisor_Checklist-Cost_light-bg.svg"
    },
    {
      "name": "CloudWatch Event Event Based",
      "path": "Management_and_Governance/Amazon-CloudWatch_Event-Event-Based_light-bg.svg"
    },
    {
      "name": "CloudWatch",
      "path": "Management_and_Governance/Amazon-CloudWatch.svg"
    },
    {
      "name": "Trusted Advisor Checklist Security",
      "path": "Management_and_Governance/AWS-Trusted-Advisor_Checklist-Security_light-bg.svg"
    },
    {
      "name": "OpsWorks Resources",
      "path": "Management_and_Governance/AWS-OpsWorks_Resources_light-bg.svg"
    },
    {
      "name": "Control Tower",
      "path": "Management_and_Governance/AWS-Control-Tower.svg"
    },
    {
      "name": "Systems Manager Run Command",
      "path": "Management_and_Governance/AWS-Systems-Manager_Run-Command_light-bg.svg"
    },
    {
      "name": "OpsWorks Deployments",
      "path": "Management_and_Governance/AWS-OpsWorks_Deployments_light-bg.svg"
    },
    {
      "name": "Config",
      "path": "Management_and_Governance/AWS-Config.svg"
    },
    {
      "name": "CloudFormation Template",
      "path": "Management_and_Governance/AWS-CloudFormation_Template_light-bg.svg"
    },
    {
      "name": "CloudFormation Stack",
      "path": "Management_and_Governance/AWS-CloudFormation_Stack_light-bg.svg"
    },
    {
      "name": "Systems Manager Patch Manager",
      "path": "Management_and_Governance/AWS-Systems-Manager_Patch-Manager_light-bg.svg"
    },
    {
      "name": "CloudWatch Alarm",
      "path": "Management_and_Governance/Amazon-CloudWatch_Alarm_light-bg.svg"
    },
    {
      "name": "OpsWorks Apps",
      "path": "Management_and_Governance/AWS-OpsWorks_Apps_light-bg.svg"
    },
    {
      "name": "Service Catalog",
      "path": "Management_and_Governance/AWS-Service-Catalog.svg"
    },
    {
      "name": "Management Console",
      "path": "Management_and_Governance/AWS-Management-Console.svg"
    },
    {
      "name": "OpsWorks Layers",
      "path": "Management_and_Governance/AWS-OpsWorks_Layers_light-bg.svg"
    },
    {
      "name": "OpsWorks Monitoring",
      "path": "Management_and_Governance/AWS-OpsWorks_Monitoring_light-bg.svg"
    },
    {
      "name": "OpsWorks Permissions",
      "path": "Management_and_Governance/AWS-OpsWorks_Permissions_light-bg.svg"
    },
    {
      "name": "Systems Manager",
      "path": "Management_and_Governance/AWS-Systems-Manager.svg"
    },
    {
      "name": "Control Tower",
      "path": "Management_and_Governance/AWS-Control-Tower_light-bg.svg"
    },
    {
      "name": "Management and Governance",
      "path": "Management_and_Governance/Management-and-Governance.svg"
    },
    {
      "name": "CloudWatch Event Time Based",
      "path": "Management_and_Governance/Amazon-CloudWatch_Event-Time-Based_light-bg.svg"
    },
    {
      "name": "Well Architected Tool",
      "path": "Management_and_Governance/AWS-Well-Architected-Tool.svg"
    },
    {
      "name": "Systems Manager Inventory",
      "path": "Management_and_Governance/AWS-Systems-Manager_Inventory_light-bg.svg"
    },
    {
      "name": "CloudTrail",
      "path": "Management_and_Governance/AWS-CloudTrail.svg"
    },
    {
      "name": "Systems Manager Documents",
      "path": "Management_and_Governance/AWS-Systems-Manager_Documents_light-bg.svg"
    },
    {
      "name": "Trusted Advisor Checklist Fault Tolerant",
      "path": "Management_and_Governance/AWS-Trusted-Advisor_Checklist-Fault-Tolerant_light-bg.svg"
    }
  ],
  "Robotics": [
    {
      "name": "RoboMaker Development Environment",
      "path": "Robotics/AWS-RoboMaker_Development-Environment_light-bg.svg"
    },
    {
      "name": "RoboMaker",
      "path": "Robotics/AWS-RoboMaker.svg"
    },
    {
      "name": "RoboMaker Fleet Management",
      "path": "Robotics/AWS-RoboMaker_Fleet-Management_light-bg.svg"
    },
    {
      "name": "RoboMaker Cloud Extension ROS",
      "path": "Robotics/AWS-RoboMaker_Cloud-Extension-ROS_light-bg.svg"
    },
    {
      "name": "RoboMaker Simulation",
      "path": "Robotics/AWS-RoboMaker_Simulation_light-bg.svg"
    }
  ],
  "Machine Learning": [
    {
      "name": "DeepLens",
      "path": "Machine_Learning/AWS-DeepLens.svg"
    },
    {
      "name": "Textract",
      "path": "Machine_Learning/Amazon-Textract.svg"
    },
    {
      "name": "Personalize",
      "path": "Machine_Learning/Amazon-Personalize.svg"
    },
    {
      "name": "SageMaker",
      "path": "Machine_Learning/Amazon-SageMaker.svg"
    },
    {
      "name": "Translate",
      "path": "Machine_Learning/Amazon-Translate.svg"
    },
    {
      "name": "SageMaker Model",
      "path": "Machine_Learning/Amazon-SageMaker_Model_light-bg.svg"
    },
    {
      "name": "Machine Learning",
      "path": "Machine_Learning/Machine-Learning.svg"
    },
    {
      "name": "Forecast",
      "path": "Machine_Learning/Amazon-Forecast.svg"
    },
    {
      "name": "Comprehend",
      "path": "Machine_Learning/Amazon-Comprehend.svg"
    },
    {
      "name": "Lex",
      "path": "Machine_Learning/Amazon-Lex.svg"
    },
    {
      "name": "DeepRacer",
      "path": "Machine_Learning/AWS-DeepRacer.svg"
    },
    {
      "name": "Elastic Inference",
      "path": "Machine_Learning/Amazon-Elastic-Inference.svg"
    },
    {
      "name": "Deep Learning AMIs",
      "path": "Machine_Learning/AWS-Deep-Learning-AMIs.svg"
    },
    {
      "name": "Transcribe",
      "path": "Machine_Learning/Amazon-Transcribe.svg"
    },
    {
      "name": "Apache MXNet on AWS",
      "path": "Machine_Learning/Apache-MXNet-on-AWS.svg"
    },
    {
      "name": "Polly",
      "path": "Machine_Learning/Amazon-Polly.svg"
    },
    {
      "name": "SageMaker Notebook",
      "path": "Machine_Learning/Amazon-SageMaker_Notebook_light-bg.svg"
    },
    {
      "name": "Rekognition",
      "path": "Machine_Learning/Amazon-Rekognition.svg"
    },
    {
      "name": "SageMaker Train",
      "path": "Machine_Learning/Amazon-SageMaker_Train_light-bg.svg"
    }
  ],
  "Game Tech": [
    {
      "name": "GameLift",
      "path": "Game_Tech/Amazon-GameLift.svg"
    },
    {
      "name": "Game Tech",
      "path": "Game_Tech/Game-Tech.svg"
    }
  ],
  "Satelitte": [
    {
      "name": "Satellite",
      "path": "Satelitte/Satellite.svg"
    },
    {
      "name": "Ground Station",
      "path": "Satelitte/AWS-Ground-Station.svg"
    }
  ],
  "AR and VR": [
    {
      "name": "AR VR",
      "path": "AR_and_VR/AR-VR.svg"
    },
    {
      "name": "Sumerian",
      "path": "AR_and_VR/Amazon-Sumerian.svg"
    }
  ],
  "Storage": [
    {
      "name": "EBS",
      "path": "Storage/Amazon-Elastic-Block-Store-EBS_light-bg.svg"
    },
    {
      "name": "Storage Gateway Virtual Tape Library",
      "path": "Storage/AWS-Storage-Gateway_Virtual-Tape-Library_light-bg.svg"
    },
    {
      "name": "Simple Storage Service S3",
      "path": "Storage/Amazon-Simple-Storage-Service-S3_light-bg.svg"
    },
    {
      "name": "Storage Gateway",
      "path": "Storage/AWS-Storage-Gateway.svg"
    },
    {
      "name": "Simple Storage Service S3 Bucket",
      "path": "Storage/Amazon-Simple-Storage-Service-S3_Bucket_light-bg.svg"
    },
    {
      "name": "Storage Gateway Cached Volume",
      "path": "Storage/AWS-Storage-Gateway_Cached-Volume_light-bg.svg"
    },
    {
      "name": "Snowball",
      "path": "Storage/AWS-Snowball.svg"
    },
    {
      "name": "S3 Glacier",
      "path": "Storage/Amazon-S3-Glacier.svg"
    },
    {
      "name": "Elastic File System EFS",
      "path": "Storage/Amazon-Elastic-File-System_EFS.svg"
    },
    {
      "name": "Snowball Edge",
      "path": "Storage/AWS-Snowball-Edge.svg"
    },
    {
      "name": "Simple Storage Service S3 Bucket with Objects",
      "path": "Storage/Amazon-Simple-Storage-Service-S3_Bucket-with-Objects_light-bg.svg"
    },
    {
      "name": "FSx for Windows File Server",
      "path": "Storage/Amazon-FSx-for-Windows-File-Server_light-bg.svg"
    },
    {
      "name": "Storage Gateway Non Cached Volume",
      "path": "Storage/AWS-Storage-Gateway_Non-Cached-Volume_light-bg.svg"
    },
    {
      "name": "FSx",
      "path": "Storage/Amazon-FSx.svg"
    },
    {
      "name": "Elastic Block Store EBS",
      "path": "Storage/Amazon-Elastic-Block-Store-EBS.svg"
    },
    {
      "name": "Backup",
      "path": "Storage/AWS-Backup.svg"
    },
    {
      "name": "Snowball",
      "path": "Storage/AWS-Snowball_light-bg.svg"
    },
    {
      "name": "FSx for Lustre",
      "path": "Storage/Amazon-FSx-for-Lustre.svg"
    },
    {
      "name": "Simple Storage Service S3 Object",
      "path": "Storage/Amazon-Simple-Storage-Service-S3_Object_light-bg.svg"
    },
    {
      "name": "Simple Storage Service S3",
      "path": "Storage/Amazon-Simple-Storage-Service-S3.svg"
    },
    {
      "name": "Elastic Block Store EBS Snapshot",
      "path": "Storage/Amazon-Elastic-Block-Store-EBS_Snapshot_light-bg.svg"
    },
    {
      "name": "S3 Glacier Archive",
      "path": "Storage/Amazon-S3-Glacier_Archive_light-bg.svg"
    },
    {
      "name": "Snowmobile",
      "path": "Storage/AWS-Snowmobile.svg"
    },
    {
      "name": "S3 Glacier Vault",
      "path": "Storage/Amazon-S3-Glacier_Vault_light-bg.svg"
    },
    {
      "name": "Snow Family Snowball Import Export",
      "path": "Storage/AWS-Snow-Family_Snowball-Import-Export_light-bg.svg"
    },
    {
      "name": "Elastic Block Store EBS Volume",
      "path": "Storage/Amazon-Elastic-Block-Store-EBS_Volume_light-bg.svg"
    }
  ],
  "Developer Tools": [
    {
      "name": "X Ray",
      "path": "Developer_Tools/AWS-X-Ray.svg"
    },
    {
      "name": "Command Line Interface",
      "path": "Developer_Tools/AWS-Command-Line-Interface.svg"
    },
    {
      "name": "Cloud9",
      "path": "Developer_Tools/AWS-Cloud9.svg"
    },
    {
      "name": "CodeCommit",
      "path": "Developer_Tools/AWS-CodeCommit.svg"
    },
    {
      "name": "Tools And SDKs",
      "path": "Developer_Tools/AWS-Tools-And-SDKs.svg"
    },
    {
      "name": "Developer Tools",
      "path": "Developer_Tools/Developer-Tools.svg"
    },
    {
      "name": "CodeDeploy",
      "path": "Developer_Tools/AWS-CodeDeploy.svg"
    },
    {
      "name": "CodePipeline",
      "path": "Developer_Tools/AWS-CodePipeline.svg"
    },
    {
      "name": "CodeBuild",
      "path": "Developer_Tools/AWS-CodeBuild.svg"
    },
    {
      "name": "CodeStar",
      "path": "Developer_Tools/AWS-CodeStar.svg"
    }
  ],
  "Blockchain": [
    {
      "name": "Managed Blockchain",
      "path": "Blockchain/Amazon-Managed-Blockchain.svg"
    },
    {
      "name": "Quantum Ledger Database QLDB",
      "path": "Blockchain/Amazon-Quantum-Ledger-Database-QLDB.svg"
    },
    {
      "name": "Blockchain",
      "path": "Blockchain/Blockchain.svg"
    }
  ],
  "Internet Of Things": [
    {
      "name": "IoT Lightbulb",
      "path": "Internet_Of_Things/IoT_Lightbulb_light-bg.svg"
    },
    {
      "name": "IoT Car",
      "path": "Internet_Of_Things/IoT_Car_light-bg.svg"
    },
    {
      "name": "IoT Windfarm",
      "path": "Internet_Of_Things/IoT_Windfarm_light-bg.svg"
    },
    {
      "name": "IoT Alexa Skill",
      "path": "Internet_Of_Things/IoT_Alexa-Skill_light-bg.svg"
    },
    {
      "name": "IoT MQTT Protocol",
      "path": "Internet_Of_Things/IoT_MQTT-Protocol_light-bg.svg"
    },
    {
      "name": "IoT Sensor",
      "path": "Internet_Of_Things/IoT_Sensor_light-bg.svg"
    },
    {
      "name": "IoT Greengrass",
      "path": "Internet_Of_Things/AWS-IoT-Greengrass.svg"
    },
    {
      "name": "IoT Analytics",
      "path": "Internet_Of_Things/AWS-IoT-Analytics.svg"
    },
    {
      "name": "IoT Thermostat",
      "path": "Internet_Of_Things/IoT_Thermostat_light-bg.svg"
    },
    {
      "name": "IoT 1 Click",
      "path": "Internet_Of_Things/AWS-IoT-1-Click.svg"
    },
    {
      "name": "IoT Over The Air Update",
      "path": "Internet_Of_Things/IoT_Over-The-Air-Update_light-bg.svg"
    },
    {
      "name": "IoT Simulator",
      "path": "Internet_Of_Things/IoT_Simulator_light-bg.svg"
    },
    {
      "name": "IoT Reported State",
      "path": "Internet_Of_Things/IoT_Reported-State_light-bg.svg"
    },
    {
      "name": "IoT Alexa Enabled Device",
      "path": "Internet_Of_Things/IoT_Alexa-Enabled-Device_light-bg.svg"
    },
    {
      "name": "IoT Door Lock",
      "path": "Internet_Of_Things/IoT_Door-Lock_light-bg.svg"
    },
    {
      "name": "IoT Medical Emergency",
      "path": "Internet_Of_Things/IoT_Medical-Emergency_light-bg.svg"
    },
    {
      "name": "IoT Events",
      "path": "Internet_Of_Things/AWS-IoT-Events.svg"
    },
    {
      "name": "IoT Desired State",
      "path": "Internet_Of_Things/IoT_Desired-State_light-bg.svg"
    },
    {
      "name": "IoT Action",
      "path": "Internet_Of_Things/IoT_Action_light-bg.svg"
    },
    {
      "name": "IoT Camera",
      "path": "Internet_Of_Things/IoT_Camera_light-bg.svg"
    },
    {
      "name": "IoT Generic",
      "path": "Internet_Of_Things/IoT_Generic_light-bg.svg"
    },
    {
      "name": "IoT SiteWise",
      "path": "Internet_Of_Things/AWS-IoT-SiteWise.svg"
    },
    {
      "name": "IoT Bicycle",
      "path": "Internet_Of_Things/IoT_Bicycle_light-bg.svg"
    },
    {
      "name": "IoT Topic",
      "path": "Internet_Of_Things/IoT_Topic_light-bg.svg"
    },
    {
      "name": "FreeRTOS",
      "path": "Internet_Of_Things/Amazon-FreeRTOS.svg"
    },
    {
      "name": "IoT Device Gateway",
      "path": "Internet_Of_Things/IoT_Device-Gateway_light-bg.svg"
    },
    {
      "name": "IoT Certificate Manager",
      "path": "Internet_Of_Things/IoT_Certificate-Manager_light-bg.svg"
    },
    {
      "name": "IoT Hardware Board",
      "path": "Internet_Of_Things/IoT_Hardware-Board_light-bg.svg"
    },
    {
      "name": "IoT Core",
      "path": "Internet_Of_Things/AWS-IoT-Core.svg"
    },
    {
      "name": "IoT HTTP Protocol",
      "path": "Internet_Of_Things/IoT_HTTP-Protocol_light-bg.svg"
    },
    {
      "name": "IoT Travel",
      "path": "Internet_Of_Things/IoT_Travel_light-bg.svg"
    },
    {
      "name": "IoT House",
      "path": "Internet_Of_Things/IoT_House_light-bg.svg"
    },
    {
      "name": "IoT Cart",
      "path": "Internet_Of_Things/IoT_Cart_light-bg.svg"
    },
    {
      "name": "IoT Things Graph",
      "path": "Internet_Of_Things/AWS-IoT-Things-Graph.svg"
    },
    {
      "name": "IoT Actuator",
      "path": "Internet_Of_Things/IoT_Actuator_light-bg.svg"
    },
    {
      "name": "IoT Device Defender",
      "path": "Internet_Of_Things/AWS-IoT-Device-Defender.svg"
    },
    {
      "name": "IoT HTTP 2 Protocol",
      "path": "Internet_Of_Things/IoT_HTTP-2-Protocol_light-bg.svg"
    },
    {
      "name": "IoT Device Management",
      "path": "Internet_Of_Things/AWS-IoT-Device-Management.svg"
    },
    {
      "name": "IoT Bank",
      "path": "Internet_Of_Things/IoT_Bank_light-bg.svg"
    },
    {
      "name": "IoT Utility",
      "path": "Internet_Of_Things/IoT_Utility_light-bg.svg"
    },
    {
      "name": "IoT Shadow",
      "path": "Internet_Of_Things/IoT_Shadow_light-bg.svg"
    },
    {
      "name": "IoT Button",
      "path": "Internet_Of_Things/AWS-IoT-Button.svg"
    },
    {
      "name": "IoT Servo",
      "path": "Internet_Of_Things/IoT_Servo_light-bg.svg"
    },
    {
      "name": "IoT Alexa Voice Service",
      "path": "Internet_Of_Things/IoT_Alexa-Voice-Service_light-bg.svg"
    },
    {
      "name": "IoT Lambda Function",
      "path": "Internet_Of_Things/IoT_Lambda-Function_light-bg.svg"
    },
    {
      "name": "IoT Coffee Pot",
      "path": "Internet_Of_Things/IoT_Coffee-Pot_light-bg.svg"
    },
    {
      "name": "IoT Fire TV",
      "path": "Internet_Of_Things/IoT_Fire-TV_light-bg.svg"
    },
    {
      "name": "IoT Rule",
      "path": "Internet_Of_Things/IoT_Rule_light-bg.svg"
    },
    {
      "name": "IoT Factory",
      "path": "Internet_Of_Things/IoT_Factory_light-bg.svg"
    },
    {
      "name": "IoT Echo",
      "path": "Internet_Of_Things/IoT_Echo_light-bg.svg"
    },
    {
      "name": "IoT Police Emergency",
      "path": "Internet_Of_Things/IoT_Police-Emergency_light-bg.svg"
    },
    {
      "name": "IoT Policy",
      "path": "Internet_Of_Things/IoT_Policy_light-bg.svg"
    },
    {
      "name": "IoT Fire TV Stick",
      "path": "Internet_Of_Things/IoT_Fire-TV-Stick_light-bg.svg"
    }
  ],
  "Mobile": [
    {
      "name": "AppSync",
      "path": "Mobile/AWS-AppSync.svg"
    },
    {
      "name": "Device Farm",
      "path": "Mobile/AWS-Device-Farm.svg"
    },
    {
      "name": "API Gateway",
      "path": "Mobile/Amazon-API-Gateway.svg"
    },
    {
      "name": "Pinpoint",
      "path": "Mobile/Amazon-Pinpoint.svg"
    },
    {
      "name": "Mobile",
      "path": "Mobile/Mobile.svg"
    },
    {
      "name": "Amplify",
      "path": "Mobile/AWS-Amplify.svg"
    }
  ],
  "AWS Cost Management": [
    {
      "name": "Cost Explorer",
      "path": "AWS_Cost_Management/AWS-Cost-Explorer.svg"
    },
    {
      "name": "Cost Management",
      "path": "AWS_Cost_Management/AWS-Cost-Management.svg"
    },
    {
      "name": "Cost and Usage Report",
      "path": "AWS_Cost_Management/AWS-Cost-and-Usage-Report.svg"
    },
    {
      "name": "Budgets",
      "path": "AWS_Cost_Management/AWS-Budgets.svg"
    },
    {
      "name": "Reserved Instance Reporting",
      "path": "AWS_Cost_Management/Reserved-Instance-Reporting.svg"
    }
  ],
  "EC2 Instances": [
    {
      "name": "EC2 C5 Instance",
      "path": "EC2_Instances/Amazon-EC2_C5-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 R5 Instance",
      "path": "EC2_Instances/Amazon-EC2_R5-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 X1e Instance",
      "path": "EC2_Instances/Amazon-EC2_X1e-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 R5a Instance",
      "path": "EC2_Instances/Amazon-EC2_R5a-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 M4 Instance",
      "path": "EC2_Instances/Amazon-EC2_M4-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 z1d Instance",
      "path": "EC2_Instances/Amazon-EC2_z1d-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 T3a Instance",
      "path": "EC2_Instances/Amazon-EC2_T3a-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 Spot Instance",
      "path": "EC2_Instances/Amazon-EC2_Spot-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 D2 Instance",
      "path": "EC2_Instances/Amazon-EC2_D2-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 C4 Instance",
      "path": "EC2_Instances/Amazon-EC2_C4-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 R4 Instance",
      "path": "EC2_Instances/Amazon-EC2_R4-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 X1 Instance",
      "path": "EC2_Instances/Amazon-EC2_X1-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 M5 Instance",
      "path": "EC2_Instances/Amazon-EC2_M5-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 Instance with CloudWatch",
      "path": "EC2_Instances/Amazon-EC2_Instance-with-CloudWatch_dark-bg.svg"
    },
    {
      "name": "EC2 A1 Instance",
      "path": "EC2_Instances/Amazon-EC2_A1-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 T3 Instance",
      "path": "EC2_Instances/Amazon-EC2_T3-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 P2 Instance",
      "path": "EC2_Instances/Amazon-EC2_P2-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 F1 Instance",
      "path": "EC2_Instances/Amazon-EC2_F1-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 DB on Instance",
      "path": "EC2_Instances/Amazon-EC2_DB-on-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 G3 Instance",
      "path": "EC2_Instances/Amazon-EC2_G3-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 Optimized Instance",
      "path": "EC2_Instances/Amazon-EC2_Optimized-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 High Memory Instance",
      "path": "EC2_Instances/Amazon-EC2_High-Memory-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 Instance",
      "path": "EC2_Instances/Amazon-EC2_Instance_dark-bg.svg"
    },
    {
      "name": "EC2 I3 Instance",
      "path": "EC2_Instances/Amazon-EC2_I3-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 P3 Instance",
      "path": "EC2_Instances/Amazon-EC2_P3-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 Instances",
      "path": "EC2_Instances/Amazon-EC2_Instances_dark-bg.svg"
    },
    {
      "name": "EC2 T2 Instance",
      "path": "EC2_Instances/Amazon-EC2_T2-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 C5n Instance",
      "path": "EC2_Instances/Amazon-EC2_C5n-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 M5a Instance",
      "path": "EC2_Instances/Amazon-EC2_M5a-Instance_dark-bg.svg"
    },
    {
      "name": "EC2 H1 Instance",
      "path": "EC2_Instances/Amazon-EC2_H1-Instance_dark-bg.svg"
    }
  ],
  "Networking and CDN": [
    {
      "name": "VPC",
      "path": "Networking_and_CDN/Amazon-VPC_light-bg.svg"
    },
    {
      "name": "API Gateway",
      "path": "Networking_and_CDN/Amazon-API-Gateway_light-bg.svg"
    },
    {
      "name": "VPC Flow Logs",
      "path": "Networking_and_CDN/Amazon-VPC_Flow-Logs_light-bg.svg"
    },
    {
      "name": "Transit Gateway",
      "path": "Networking_and_CDN/AWS-Transit-Gateway.svg"
    },
    {
      "name": "VPC NAT Gateway",
      "path": "Networking_and_CDN/Amazon-VPC_NAT-Gateway_light-bg.svg"
    },
    {
      "name": "App Mesh",
      "path": "Networking_and_CDN/AWS-App-Mesh.svg"
    },
    {
      "name": "VPC Elastic Network Adapter",
      "path": "Networking_and_CDN/Amazon-VPC_Elastic-Network-Adapter_light-bg.svg"
    },
    {
      "name": "Cloud Map",
      "path": "Networking_and_CDN/AWS-Cloud-Map.svg"
    },
    {
      "name": "CloudFront",
      "path": "Networking_and_CDN/Amazon-CloudFront_light-bg.svg"
    },
    {
      "name": "VPC PrivateLink",
      "path": "Networking_and_CDN/Amazon-VPC-PrivateLink.svg"
    },
    {
      "name": "VPC Peering",
      "path": "Networking_and_CDN/Amazon-VPC_Peering_light-bg.svg"
    },
    {
      "name": "Route 53 Hosted Zone",
      "path": "Networking_and_CDN/Amazon-Route-53_Hosted-Zone_light-bg.svg"
    },
    {
      "name": "Route 53 Route Table",
      "path": "Networking_and_CDN/Amazon-Route-53_Route-Table_light-bg.svg"
    },
    {
      "name": "VPC Elastic Network Interface",
      "path": "Networking_and_CDN/Amazon-VPC_Elastic-Network-Interface_light-bg.svg"
    },
    {
      "name": "CloudFront Download Distribution",
      "path": "Networking_and_CDN/Amazon-CloudFront_Download-Distribution_light-bg.svg"
    },
    {
      "name": "Direct Connect",
      "path": "Networking_and_CDN/AWS-Direct-Connect.svg"
    },
    {
      "name": "Global Accelerator",
      "path": "Networking_and_CDN/AWS-Global-Accelerator.svg"
    },
    {
      "name": "Networking and Content Delivery",
      "path": "Networking_and_CDN/Networking-and-Content-Delivery.svg"
    },
    {
      "name": "VPC Customer Gateway",
      "path": "Networking_and_CDN/Amazon-VPC_Customer-Gateway_light-bg.svg"
    },
    {
      "name": "VPC Network Access Control List",
      "path": "Networking_and_CDN/Amazon-VPC_Network-Access-Control-List_light-bg.svg"
    },
    {
      "name": "VPC Internet Gateway",
      "path": "Networking_and_CDN/Amazon-VPC_Internet-Gateway_light-bg.svg"
    },
    {
      "name": "Route 53",
      "path": "Networking_and_CDN/Amazon-Route-53.svg"
    },
    {
      "name": "Route 53",
      "path": "Networking_and_CDN/Amazon-Route-53_light-bg.svg"
    },
    {
      "name": "VPC VPN Gateway",
      "path": "Networking_and_CDN/Amazon-VPC_VPN-Gateway_light-bg.svg"
    },
    {
      "name": "CloudFront",
      "path": "Networking_and_CDN/Amazon-CloudFront.svg"
    },
    {
      "name": "VPC Router",
      "path": "Networking_and_CDN/Amazon-VPC_Router_light-bg.svg"
    },
    {
      "name": "Client VPN",
      "path": "Networking_and_CDN/AWS-Client-VPN.svg"
    },
    {
      "name": "CloudFront Edge Location",
      "path": "Networking_and_CDN/Amazon-CloudFront_Edge-Location_light-bg.svg"
    },
    {
      "name": "VPC Endpoints",
      "path": "Networking_and_CDN/Amazon-VPC_Endpoints_light-bg.svg"
    },
    {
      "name": "CloudFront Streaming Distribution",
      "path": "Networking_and_CDN/Amazon-CloudFront_Streaming-Distribution_light-bg.svg"
    },
    {
      "name": "VPC",
      "path": "Networking_and_CDN/Amazon-VPC.svg"
    },
    {
      "name": "VPC VPN Connection",
      "path": "Networking_and_CDN/Amazon-VPC_VPN-Connection_light-bg.svg"
    }
  ],
  "Business Applications": [
    {
      "name": "Chime",
      "path": "Business_Applications/Amazon-Chime.svg"
    },
    {
      "name": "WorkDocs",
      "path": "Business_Applications/Amazon-WorkDocs.svg"
    },
    {
      "name": "Alexa For Business",
      "path": "Business_Applications/Alexa-For-Business.svg"
    },
    {
      "name": "Business Application",
      "path": "Business_Applications/Business-Application.svg"
    },
    {
      "name": "WorkMail",
      "path": "Business_Applications/Amazon-WorkMail.svg"
    }
  ],
  "Migration and Transfer": [
    {
      "name": "DataSync",
      "path": "Migration_and_Transfer/AWS-DataSync.svg"
    },
    {
      "name": "Snowball",
      "path": "Migration_and_Transfer/AWS-Snowball.svg"
    },
    {
      "name": "Migration and Transfer",
      "path": "Migration_and_Transfer/Migration-and-Transfer.svg"
    },
    {
      "name": "Snowball Edge",
      "path": "Migration_and_Transfer/AWS-Snowball-Edge.svg"
    },
    {
      "name": "Migration Hub",
      "path": "Migration_and_Transfer/AWS-Migration-Hub.svg"
    },
    {
      "name": "Database Migration Service",
      "path": "Migration_and_Transfer/AWS-Database-Migration-Service.svg"
    },
    {
      "name": "Application Discovery Service",
      "path": "Migration_and_Transfer/AWS-Application-Discovery-Service.svg"
    },
    {
      "name": "Server Migration Service",
      "path": "Migration_and_Transfer/AWS-Server-Migration-Service.svg"
    },
    {
      "name": "Snowmobile",
      "path": "Migration_and_Transfer/AWS-Snowmobile.svg"
    },
    {
      "name": "Transfer for SFTP",
      "path": "Migration_and_Transfer/AWS-Transfer-for-SFTP.svg"
    }
  ],
  "Desktop and App Streaming": [
    {
      "name": "Appstream 2.0",
      "path": "Desktop_and_App_Streaming/Amazon-Appstream-2.0.svg"
    },
    {
      "name": "Desktop and App Streaming",
      "path": "Desktop_and_App_Streaming/Desktop-and-App-Streaming.svg"
    },
    {
      "name": "Workspaces",
      "path": "Desktop_and_App_Streaming/Amazon-Workspaces.svg"
    }
  ],
  "AWS Compute": [
    {
      "name": "VMware Cloud On AWS",
      "path": "AWS_Compute/VMware-Cloud-On-AWS_light-bg.svg"
    },
    {
      "name": "Elastic Container Service",
      "path": "AWS_Compute/Amazon-Elastic-Container-Service_light-bg.svg"
    },
    {
      "name": "Elastic Container Service",
      "path": "AWS_Compute/Amazon-Elastic-Container-Service.svg"
    },
    {
      "name": "EC2 Rescue",
      "path": "AWS_Compute/Amazon-EC2_Rescue_light-bg.svg"
    },
    {
      "name": "Elastic Beanstalk Deployment",
      "path": "AWS_Compute/AWS-Elastic-Beanstalk_Deployment_light-bg.svg"
    },
    {
      "name": "Batch",
      "path": "AWS_Compute/AWS-Batch_light-bg.svg"
    },
    {
      "name": "Elastic Beanstalk",
      "path": "AWS_Compute/AWS-Elastic-Beanstalk_light-bg.svg"
    },
    {
      "name": "EC2 AMI",
      "path": "AWS_Compute/Amazon-EC2_AMI_light-bg.svg"
    },
    {
      "name": "Outposts",
      "path": "AWS_Compute/AWS-Outposts.svg"
    },
    {
      "name": "EC2 Auto Scaling",
      "path": "AWS_Compute/Amazon-EC2-Auto-Scaling_light-bg.svg"
    },
    {
      "name": "Elastic Load Balancing ELB",
      "path": "AWS_Compute/Elastic-Load-Balancing-ELB_light-bg.svg"
    },
    {
      "name": "EC2 Container Registry",
      "path": "AWS_Compute/Amazon-EC2-Container-Registry_light-bg.svg"
    },
    {
      "name": "Elastic Container Service Container1",
      "path": "AWS_Compute/Amazon-Elastic-Container-Service_Container1_light-bg.svg"
    },
    {
      "name": "Outposts",
      "path": "AWS_Compute/AWS-Outposts_light-bg.svg"
    },
    {
      "name": "Serverless Application Repository",
      "path": "AWS_Compute/AWS-Serverless-Application-Repository_light-bg.svg"
    },
    {
      "name": "Compute",
      "path": "AWS_Compute/Compute_light-bg.svg"
    },
    {
      "name": "EC2",
      "path": "AWS_Compute/Amazon-EC2_light-bg.svg"
    },
    {
      "name": "EC2 Elastic IP Address",
      "path": "AWS_Compute/Amazon-EC2_Elastic-IP-Address_light-bg.svg"
    },
    {
      "name": "Lambda Lambda Function",
      "path": "AWS_Compute/AWS-Lambda_Lambda-Function_light-bg.svg"
    },
    {
      "name": "Elastic Container Service Container2",
      "path": "AWS_Compute/Amazon-Elastic-Container-Service_Container2_light-bg.svg"
    },
    {
      "name": "Elastic Container Service Service",
      "path": "AWS_Compute/Amazon-Elastic-Container-Service_Service_light-bg.svg"
    },
    {
      "name": "EC2 Container Registry Registry",
      "path": "AWS_Compute/Amazon-EC2-Container-Registry_Registry_light-bg.svg"
    },
    {
      "name": "Lightsail",
      "path": "AWS_Compute/Amazon-Lightsail_light-bg.svg"
    },
    {
      "name": "Elastic Block Store EBS Snapshot",
      "path": "AWS_Compute/Amazon-Elastic-Block-Store-EBS_Snapshot_light-bg.svg"
    },
    {
      "name": "Elastic Container Service Container3",
      "path": "AWS_Compute/Amazon-Elastic-Container-Service_Container3_light-bg.svg"
    },
    {
      "name": "Elastic Container Service Task",
      "path": "AWS_Compute/Amazon-Elastic-Container-Service_Task_light-bg.svg"
    },
    {
      "name": "Elastic Container Service for Kubernetes",
      "path": "AWS_Compute/Amazon-Elastic-Container-Service-for-Kubernetes_light-bg.svg"
    },
    {
      "name": "Fargate",
      "path": "AWS_Compute/AWS-Fargate_light-bg.svg"
    },
    {
      "name": "Lightsail",
      "path": "AWS_Compute/Amazon-Lightsail.svg"
    },
    {
      "name": "EC2 Auto Scaling",
      "path": "AWS_Compute/Amazon-EC2_Auto-Scaling_light-bg.svg"
    },
    {
      "name": "Lambda",
      "path": "AWS_Compute/AWS-Lambda_light-bg.svg"
    },
    {
      "name": "Elastic Beanstalk Application",
      "path": "AWS_Compute/AWS-Elastic-Beanstalk_Application_light-bg.svg"
    },
    {
      "name": "EC2 Container Registry Image",
      "path": "AWS_Compute/Amazon-EC2-Container-Registry_Image_light-bg.svg"
    },
    {
      "name": "Elastic Block Store EBS Volume",
      "path": "AWS_Compute/Amazon-Elastic-Block-Store-EBS_Volume_light-bg.svg"
    }
  ],
  "Analytics": [
    {
      "name": "QuickSight",
      "path": "Analytics/Amazon-QuickSight.png"
    },
    {
      "name": "Kinesis",
      "path": "Analytics/Amazon-Kinesis.png"
    },
    {
      "name": "Kinesis Video Streams",
      "path": "Analytics/Amazon-Kinesis-Video-Streams.png"
    },
    {
      "name": "CloudSearch",
      "path": "Analytics/Amazon-CloudSearch.png"
    },
    {
      "name": "Glue Crawlers",
      "path": "Analytics/AWS-Glue_Crawlers_dark-bg.png"
    },
    {
      "name": "Lake Formation",
      "path": "Analytics/AWS-Lake-Formation.png"
    },
    {
      "name": "Redshift Dense Storage Node",
      "path": "Analytics/Amazon-Redshift_Dense-Storage-Node_dark-bg.png"
    },
    {
      "name": "Elasticsearch Service",
      "path": "Analytics/Amazon-Elasticsearch-Service.png"
    },
    {
      "name": "EMR EMR Engine MapR M7",
      "path": "Analytics/Amazon-EMR_EMR-Engine-MapR-M7_dark-bg.png"
    },
    {
      "name": "Kinesis Data Firehose",
      "path": "Analytics/Amazon-Kinesis-Data-Firehose.png"
    },
    {
      "name": "Data Pipeline",
      "path": "Analytics/AWS-Data-Pipeline.png"
    },
    {
      "name": "EMR EMR Engine",
      "path": "Analytics/Amazon-EMR_EMR-Engine_dark-bg.png"
    },
    {
      "name": "EMR Cluster",
      "path": "Analytics/Amazon-EMR_Cluster_dark-bg.png"
    },
    {
      "name": "EMR HDFS Cluster",
      "path": "Analytics/Amazon-EMR_HDFS-Cluster_dark-bg.png"
    },
    {
      "name": "Redshift Dense Compute Node",
      "path": "Analytics/Amazon-Redshift_Dense-Compute-Node_dark-bg.png"
    },
    {
      "name": "Glue Data Catalog",
      "path": "Analytics/AWS-Glue_Data-Catalog_dark-bg.png"
    },
    {
      "name": "EMR EMR Engine MapR M5",
      "path": "Analytics/Amazon-EMR_EMR-Engine-MapR-M5_dark-bg.png"
    },
    {
      "name": "CloudSearch Search Documents",
      "path": "Analytics/Amazon-CloudSearch_Search-Documents_dark-bg.png"
    },
    {
      "name": "Analytics",
      "path": "Analytics/Analytics.png"
    },
    {
      "name": "Glue",
      "path": "Analytics/AWS-Glue.png"
    },
    {
      "name": "EMR",
      "path": "Analytics/Amazon-EMR.png"
    },
    {
      "name": "Redshift",
      "path": "Analytics/Amazon-Redshift.png"
    },
    {
      "name": "Kinesis Data Streams",
      "path": "Analytics/Amazon-Kinesis-Data-Streams.png"
    },
    {
      "name": "Athena",
      "path": "Analytics/Amazon-Athena.png"
    },
    {
      "name": "Managed Streaming for Kafka",
      "path": "Analytics/Amazon-Managed-Streaming-for-Kafka.png"
    },
    {
      "name": "EMR EMR Engine MapR M3",
      "path": "Analytics/Amazon-EMR_EMR-Engine-MapR-M3_dark-bg.png"
    },
    {
      "name": "Kinesis Data Analytics",
      "path": "Analytics/Amazon-Kinesis-Data-Analytics.png"
    }
  ]
}
document.addEventListener('DOMContentLoaded', function () {

  var container = document.querySelector('.sidebar-icons');

  for (var category in inputjson) {
    if (inputjson.hasOwnProperty(category)) {
      var catid = category.replace(/,/g, '');
      var newcatid = catid.replace(/ /g, '_');

      var categoryDiv = document.createElement('div');
      categoryDiv.classList.add('category', 'collapsed');
      categoryDiv.dataset.toggle = 'collapse';
      categoryDiv.dataset.target = '#' + newcatid;
      categoryDiv.setAttribute('aria-expanded', 'false');
      categoryDiv.setAttribute('aria-controls', category.replace(/ /g, '_'));
      categoryDiv.textContent = category;

      var collapseDiv = document.createElement('div');
      collapseDiv.classList.add('collapse');
      collapseDiv.id = newcatid;

      var cardDiv = document.createElement('div');
      cardDiv.classList.add('card');
      cardDiv.classList.add('card-body');

      collapseDiv.appendChild(cardDiv);

      categoryDiv.addEventListener('click', function (e) {

        var targetId = e.target.dataset.target.substring(1); 
        var categoryName = targetId.replace(/_/g, ' '); 

        var items = inputjson[categoryName]; 
        var targetCardDiv = $("#"+targetId+" .card-body");

        $(targetCardDiv).html("");

        if (items) {
          items.forEach(function (item) {

            var img = document.createElement('img');
            img.src = 'images/AWS/' + item.path;
            img.width = '30';
            img.height = '30';
            img.draggable = true;
            img.name = item.name;
            $(img).attr("data-group",item.groupCheck);
            $(img).attr("data-toggle","tooltip");
            $(img).attr("title", item.name);

            $(targetCardDiv).append(img);

            img.addEventListener("dragstart", (event) => {
              const imageUrl = event.target.src;
              const imageName = event.target.getAttribute("name");
              const groupCheck = event.target.getAttribute("data-group");
              event.dataTransfer.setData(
                "text/plain",
                JSON.stringify({
                  imageUrl,
                  imageName,
                  groupCheck
                })
              );
            });

            img.addEventListener("click", (event) => {
              let imageUrl = event.target.src;
              let imageName = event.target.getAttribute("name");
              let groupCheck = event.target.getAttribute("data-group");

              clickDrop(event, imageUrl, imageName, groupCheck);
            });
          });
        }

        container.addEventListener("mouseover", function(event) {

          if (event.target.tagName === "IMG") {
              var hoveredImg = event.target.cloneNode(true); 
              var topPos = $(event.target).offset().top;
              $(".view-icon").html("");
              var imgname = $(hoveredImg).attr("name");
              $(".view-icon").css("top", topPos + "px");
              $(".view-icon").append(hoveredImg);
              $(".view-icon").append("<p class='d-block w-100'>"+imgname+"</p>");
              $(".view-icon").css("display","flex");
          }
      });

      container.addEventListener("mouseleave", function(event) {
          if (!event.relatedTarget || event.relatedTarget.tagName !== "IMG") {
              $(".view-icon").hide(); 
          }
      });

      });

      container.appendChild(categoryDiv);
      container.appendChild(collapseDiv);

    }
  }

});

$(document).ready(function () {

  $('#search').on('input', function () {
      const searchTerm = $(this).val().toLowerCase();
      var searchResults = [];

      if (searchTerm.length >= 3) {
          $.each(inputjson, function (category, items) {
              $.each(items, function (index, item) {
                  if (item.name.toLowerCase().includes(searchTerm)) {
                      searchResults.push(item);
                  }
              });
          });
          $(".search-result").remove();
          displayResults(searchResults);
      } else {
          $(".search-result").empty();
          $(".sidebar-icons").show();
      }
  });

  function displayResults(results) {
      $(".search-result").empty(); 
      $(".sidebar").append('<div class="search-result"></div>');
      if (results.length < 1) {
          $(".search-result").html('<p class="text-danger">No Results Found</p>');
          $(".sidebar-icons").hide();
          $(".search-result").show();
      } else {

          $(".sidebar-icons").hide();
          $.each(results, function (index, item) {

            var img = document.createElement('img');
            img.src = 'images/AWS/' + item.path;
            img.width = '30';
            img.height = '30';
            img.draggable = true;
            img.name = item.name;
            $(img).attr("data-group",item.groupCheck);
            $(img).attr("data-toggle","tooltip");
            $(img).attr("title", item.name);

            $(".search-result").append(img);

            img.addEventListener("dragstart", (event) => {
              const imageUrl = event.target.src;
              const imageName = event.target.getAttribute("name");
              const groupCheck = event.target.getAttribute("data-group");
              event.dataTransfer.setData(
                "text/plain",
                JSON.stringify({
                  imageUrl,
                  imageName,
                  groupCheck
                })
              );
            });

          });

          $(".search-result").show();
          $(".search-result img").mouseover(function(event){

            if (event.target.tagName === "IMG") {
                var hoveredImg = event.target.cloneNode(true); 
                var topPos = $(event.target).offset().top;
                $(".view-icon").html("");
                var imgname = $(hoveredImg).attr("name");
                $(".view-icon").css("top", topPos + "px");
                $(".view-icon").append(hoveredImg);
                $(".view-icon").append("<p>"+imgname+"</p>");
                $(".view-icon").css("display","flex");
            }
        });

        $(".search-result img").mouseleave(function(event){
            if (!event.relatedTarget || event.relatedTarget.tagName !== "IMG") {
                $(".view-icon").hide(); 
            }
        });
      }

  }

});

function clickDrop(event, imageUrl, imageName, groupCheck) {
  let x = 400;
  let y = 300;

  if (groupCheck === "true") {

    const group = new joint.shapes.custom.CustomGroup({
      markup: `
      <g class="rotatable">
        <g class="scalable">
          <rect width="200" height="100"/>
        </g>
        <image width="50" height="50"/>
        <text class="group-label"/>
      </g>
    `,
      position: { x, y },
      attrs: {
        rect: {
          fill: "#f7f7f7",
          stroke: "#aaaaaa",
          "stroke-width": 1
        },
        image: {
          "xlink:href": imageUrl,
          width: 30,
          height: 30,
          ref: "rect",
          "ref-x": 0,
          "ref-y": 0
        },

        ".group-label": {
          text: imageName,
          "ref-x": 0.5,
          "ref-y": 1,
          "ref-dy": 10,
          "font-size": 14,
          "text-anchor": "middle",
          fill: "#000",
          cursor: "pointer"
        }
      }
    });

    const imageCell = new customImage({
      position: { x: 50, y: 50 }, 
      size: { width: 100, height: 100 }, 
      attrs: {
        image: { "xlink:href": imageUrl },
        label: { text: imageName }
      }
    });

    group.embed(imageCell);


    graph.addCell(group);
    updateHistory();
    // updateHistory();
    // undoStack.splice(undoStack.length-2,1)

    const toolsView = new dia.ToolsView({
      tools: [
        new elementTools.Remove({
          x: "100%",
          y: 0,
          offset: { x: 10, y: -10 },
          action: () => confirmRemoval(groupView)
        }),
        // new ResizeToolbl({
        //   selector: "rect"
        // }),
        new ResizeTool({
          selector: "rect"
        }),
        // new ResizeTooltl({
        //   selector: "rect"
        // }),
        // new ResizeTooltr({
        //   selector: "rect"
        // }),
        // new infobutton({
        //   selector: "rect",
        // }),
        connectRight,
        connectLeft,
        connectTop,
        connectBottom
      ]
    });

    const groupView = group.findView(paper);
    groupView.addTools(toolsView);
    toolsView.render();
    toolsView.$el.addClass("active");
    // updateHistory();
    groupCells.push(group);

    paper.on("blank:pointerclick", () => {
      toolsView.$el.removeClass("active");
      $(".joint-tools.joint-theme-default").removeClass("active");
    }); 
    groupCells.push(group);
    // updateHistory();
  } else {
      const imageCell = new customImage({
        markup: `
        <g joint-selector="cell-group">
        <rect width="70" height="70" fill="#fff" stroke="#aaaaaa" joint-selector="background"/>
        <image width="50" height="50" joint-selector="image-cell" />
        <text font-size="14" joint-selector="label" display="block" class="imagecell-label"/>
        </g>
      `,
        position: { x, y },
        size: { width: 80, height: 80 },
        attrs: {
          image: { 
            "xlink:href": imageUrl,
            x: 10,
            y: 10
          },
          ".imagecell-label": {
            text: imageName,
            "ref-x": 0.5,
            "ref-dy": 0,
            "font-size": 12,
            "text-anchor": "middle",
            "line-height": "30",
            fill: "#000",
            cursor: "pointer",
            "textWrap": { 
              width: 60, 
              ellipsis: true
            }
          }
        }
      });

      graph.addCell(imageCell);
      updateHistory();

      // updateHistory();

  }
}

$(document).ready(function(){
  $("#filenameForm").submit(function(e){
    e.preventDefault();
    if ($("#filenameForm input").val() !== "") { 
        $("#filename .form-group p").remove();
        $(".file-name p").text($("#filenameForm input").val()); 
        $("#filename .line-btn").trigger("click");
    } else {
        $("#filename .form-group p").remove();                                                      
        $("#filename .form-group").append('<p class="d-inline text-danger">Please Enter Title</p>');
    }
});

$("#export-svg").click(function() {

  const elements = graph.getElements();

  let maxX = 0;
  let maxY = 0;
  elements.forEach(element => {
      const bbox = element.getBBox();
      maxX = Math.max(maxX, bbox.x + bbox.width + 50);
      maxY = Math.max(maxY, bbox.y + bbox.height + 50);
  });

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', maxX);
  svg.setAttribute('height', maxY);

  const svgContent = paper.svg.cloneNode(true);

  svgContent.querySelectorAll('.joint-tools-layer, .link-tools, .marker-vertices, .ungroup-btn').forEach(element => {
      element.remove();
  });

  svgContent.querySelectorAll('.connection, .connection-wrap').forEach(path => {
      path.setAttribute('fill', 'transparent');
      path.setAttribute('stroke-width', '1.5');
  });
  svgContent.querySelectorAll('.rightside-dotted-arrow .connection, .doublesided-dotted-arrow .connection').forEach(path => {
    path.setAttribute("stroke-dasharray","4,4");
  });
  svgContent.querySelectorAll('.rightside-arrow .marker-source, .rightside-arrow .marker-arrowhead-group-source, .rightside-dotted-arrow .marker-arrowhead-group-source, .rightside-dotted-arrow .marker-source').forEach(path => {
    
    path.remove();
  });

  svg.appendChild(svgContent);

  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'diagram.svg';
  document.body.appendChild(a);
  a.click();

  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
});

});

let zoomLevel = 1;

function updateZoomAndCenter() {

  paper.scale(zoomLevel, zoomLevel);

}

// const zoomInButton = document.getElementById("zoom-in-button");
// zoomInButton.addEventListener("click", () => {
//   zoomLevel += 0.1;
//   updateZoomAndCenter();
// });

// const zoomOutButton = document.getElementById("zoom-out-button");
// zoomOutButton.addEventListener("click", () => {
//   if (zoomLevel > 0.2) {
//     zoomLevel -= 0.1;
//     updateZoomAndCenter();
//   }
// });
// const zoomResetButton = document.getElementById("zoom-reset-button");
// zoomResetButton.addEventListener("click", () => {
//   zoomLevel = 1;
//   updateZoomAndCenter();
// });
// window.addEventListener('beforeunload', function(event) {
//   event.returnValue = 'Are you sure you want to leave?';
// });

$("#clear-all").click(function (){
  // updateHistory();
  graph.clear();
  // updateHistory();
  // drawOverview();
});

// const canvas = document.getElementById('navigator-canvas');
// if (canvas) {
//     const ctx = canvas.getContext('2d');

//     const paperWidth = $(".joint-paper.joint-theme-default").width(); 
//     const paperHeight = $(".joint-paper.joint-theme-default").height();

//     const scaleX = canvas.width / paperWidth;
//     const scaleY = canvas.height / paperHeight;

//     function drawOverview() {
//       ctx.clearRect(0, 0, canvas.width, canvas.height);

//       const scaleX = canvas.width / paperWidth;
//       const scaleY = canvas.height / paperHeight;

//       const viewportX = paperContainer.scrollLeft * scaleX;
//       const viewportY = paperContainer.scrollTop * scaleY;
//       const viewportWidth = paperContainer.clientWidth * scaleX;
//       const viewportHeight = paperContainer.clientHeight * scaleY;

//       ctx.fillStyle = 'rgba(0, 0, 255, 0.2)'; 
//       ctx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);

//       paper.model.getCells().filter(cell => cell.get('type') !== 'link').forEach(cell => {
//           const cellX = cell.position().x * scaleX;
//           const cellY = cell.position().y * scaleY;
//           const cellWidth = cell.attributes.size.width * scaleX;
//           const cellHeight = cell.attributes.size.height * scaleY;

//           ctx.fillStyle = '#3498db'; 
//           ctx.fillRect(cellX, cellY, cellWidth, cellHeight);
//       });
//   }

//     drawOverview();

// }
// paperContainer.addEventListener('scroll', function() {
//   drawOverview();
// });

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        $(".design-wrapper").removeClass("active");
        $(body).removeClass("overflow-hidden");
    }
});

var refreshbutton = document.getElementById("refreshbutton");
refreshbutton.addEventListener("click", function() {
  document.getElementById("jsoncont").textContent = JSON.stringify(processInput(graph.toJSON()), null, 2);
})

var closebutton = document.getElementById("closebutton");
closebutton.addEventListener("click", function() {
  container.style.display = "none";
});

var closeButton = document.getElementById("closeButton");
closeButton.addEventListener("click", function() {
  container.style.display = "none";
});

// var CustomLinkView = joint.dia.LinkView.extend({
//   options: joint.util.deepSupplement({
//     events: {
//       'mouseover .tool-remove': 'showIButton',
//       'mouseout .tool-remove': 'hideIButton',
//       'click .tool-i': 'onIButtonClick',
//     },
//   }, joint.dia.LinkView.prototype.options),
//   initialize: function () {
//     joint.dia.LinkView.prototype.initialize.apply(this, arguments);
//     const showIButtonHandler = this.showIButton.bind(this);
//     const hideIButtonHandler = this.hideIButton.bind(this);
//     const onIButtonClickHandler = this.onIButtonClick.bind(this);
//     this.el.addEventListener('mouseover', showIButtonHandler);
//     this.el.addEventListener('mouseout', hideIButtonHandler);
//     setTimeout(() => {
//       try {
//         const middlePoint = this.getMiddlePointOnLink();
//         const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
//         circle.setAttribute("r", "10");
//         circle.setAttribute("fill", "#fff");
//         circle.setAttribute("stroke", "#aaaaaa");
//         circle.setAttribute("cx", middlePoint.x);
//         circle.setAttribute("cy", middlePoint.y);
//         circle.setAttribute("class", "tool-i");
//         this.el.appendChild(circle);
//         this.hideIButton();
//         circle.addEventListener('click', onIButtonClickHandler);
//       } catch (error) {}
//     }, 2000);
//     this.listenTo(this.model, 'change:vertices', this.updateCirclePosition);
//     const targetElement = graph.getCell(this.model.attributes.target.id);
//     this.listenTo(targetElement, 'change:position', this.handleLinkChange);
//     const sourceElement = graph.getCell(this.model.attributes.source.id);
//     this.listenTo(sourceElement, 'change:position', this.handleLinkChange);

//     // var segmentsTool = new joint.linkTools.Segments({
//     //   focusOpacity: 0.5,
//     //   redundancyRemoval: false,
//     //   segmentLengthThreshold: 50,
//     //   snapHandle: false,
//     //   snapRadius: 10
//     // });
//     // console.log(this.model)
//     // segmentsTool.applySegments(this.model)
//   },
//   handleLinkChange: function (targetElement) {
//     targetElement && this.updateCirclePosition();
//   },
//   updateCirclePosition: function () {
//     const middlePoint = this.getMiddlePointOnLink();
//     const circle = this.el.querySelector('.tool-i');
//     circle.setAttribute("cx", middlePoint.x);
//     circle.setAttribute("cy", middlePoint.y);
//   },
//   getMiddlePointOnLink: function () {
//     const linkLength = this.getConnectionLength();
//     const middlePoint = this.getConnectionPointAtLength(linkLength / 2);
//     return middlePoint;
//   },
//   getConnectionLength: function () {
//     return this.getConnection().length();
//   },
//   getConnectionPointAtLength: function (length) {
//     return this.getConnection().pointAtLength(length);
//   },
//   showIButton: function () {
//     this.$('.tool-i').show();
//   },
//   hideIButton: function () {
//     this.$('.tool-i').hide();
//   },
//   onIButtonClick: function (evt) {
//     document.getElementById("textvalue").value = "";
//     ["element", "nameofele", "nametag", "quantitytag", "regiontag", "namevalue", "quantityvalue", "regionvalue", "save", "reset"].forEach(id => document.getElementById(id).style.display = "none");
//     document.getElementById("jsontab").addEventListener("click", () => {
//       document.getElementById("jsoncont").textContent = JSON.stringify(processInput(graph.toJSON()), null, 2);
//     })
//     modelIDd = this.el.getAttribute('model-id');
//     var box = document.getElementById("box"); 
//     var textTextbox = document.getElementById("textvalue");
//     const arrowMenu = document.createElement("div");
//     arrowMenu.className = "arrow-menu";
//     let arrowoption;
//     arrowOptions.forEach((arrowOption) => {
//       const arrowItem = document.createElement("div");
//       $(arrowItem).addClass(arrowOption.name);
//       arrowItem.innerHTML = arrowOption.svg;
//       arrowItem.addEventListener("click", () => {
//         arrowoption = arrowOption.name;
//       });
//       arrowMenu.appendChild(arrowItem);
//     });
//     box.appendChild(arrowMenu);
//     const arrows = document.querySelectorAll('.rightside-arrow, .rightside-dotted-arrow, .doublesided-arrow, .doublesided-dotted-arrow');
//     function handleClick(event) {
//       const clickedArrow = event.currentTarget;
//       const associatedDottedArrow = document.querySelector(clickedArrow.dataset.dottedArrow);
//       document.querySelectorAll('.rightside-arrow, .rightside-dotted-arrow, .doublesided-arrow, .doublesided-dotted-arrow').forEach(arrow => remborder(arrow.querySelector('svg')));
//       clickedArrow.querySelector('svg').style.border = "2px solid black";
//       associatedDottedArrow && remborder(associatedDottedArrow.querySelector('svg'));
//     }
//     arrows.forEach(arrow => arrow.addEventListener("click", handleClick));
//     function remborder(element) {
//       if (element) {
//         element.style.border = "";
//       }
//     }  
//     var colorBox1 = document.getElementById("colorbox1");
//     var colorBox2 = document.getElementById("colorbox2");
//     var colorBox3 = document.getElementById("colorbox3");
//     var colorBox4 = document.getElementById("colorbox4");
//     let color = "";
//     colorBox1.addEventListener("click", () => {
//       [colorBox2, colorBox3, colorBox4].forEach(e => remborder(e));
//       colorBox1.style.border = "2px solid black";
//       color = "red";
//     });
//     colorBox2.addEventListener("click", () => {
//       [colorBox1, colorBox3, colorBox4].forEach(e => remborder(e));
//       colorBox2.style.border = "2px solid black";
//       color = "green";
//     });
//     colorBox3.addEventListener("click", () => {
//       [colorBox1, colorBox2, colorBox4].forEach(e => remborder(e));
//       colorBox3.style.border = "2px solid black";
//       color = "blue";
//     });
//     colorBox4.addEventListener("click", () => {
//       [colorBox1, colorBox2, colorBox3].forEach(e => remborder(e));
//       colorBox4.style.border = "2px solid black";
//       color = "yellow";
//     });
//     var saveButton = document.getElementById("saveb");
//     saveButton.addEventListener("click", function() {
//       var currentjson = graph.toJSON();
//       currentjson.cells.forEach(cell => {
//         if (cell.id == modelIDd && textTextbox.value != "") {
//           cell.labels = [{ "position": { "distance": 0.5, "offset": -20, "args": { "dx": 0, "dy": 0, "angle": 0 } }, "attrs": { "text": { "text": textTextbox.value } } }];
//           graph.fromJSON(currentjson);
//           return;
//         }
//       });      
//       var currentjson = graph.toJSON();
//       currentjson.cells.forEach(cell => {
//         if (cell.id == modelIDd) {
//           arrowoption && applyArrowType(cell.source.id, cell.target.id, arrowoption);
//           return;
//         }
//       });      
//       var currentjson = graph.toJSON();
//       currentjson.cells.forEach(cell => {
//         if (cell.id == modelIDd && color != "") {
//           const linkVel = paper.findViewByModel(cell.id).vel;
//           if (color == "red") {
//             linkVel.addClass("red");
//           } else if (color == "green") {
//             linkVel.addClass("green");
//           } else if (color == "blue") {
//             linkVel.addClass("blue");
//           } else if (color == "yellow") {
//             linkVel.addClass("yellow");
//           }
//         }
//       });      
//     });
//     var resetButton = document.getElementById("resetb");
//     resetButton.addEventListener("click", function() {
//         textTextbox.value = "";
//         [colorBox1, colorBox2, colorBox3, colorBox4].forEach(e => remborder(e));
//         document.querySelectorAll('.rightside-arrow, .rightside-dotted-arrow, .doublesided-arrow, .doublesided-dotted-arrow').forEach(arrow => remborder(arrow.querySelector('svg')));
//     });
//     [container, textTextbox, colorBox1, colorBox2, colorBox3, colorBox4, saveButton, resetButton].forEach(e => e.style.display = "block");
//     ["optionstag", "texttag", "colortag"].forEach(e => document.getElementById(e).style.display = "block");
//   },
// });

// joint.shapes.devs.LinkView = CustomLinkView;

// paper.options.linkView = CustomLinkView;

function processInput(input) {
  const entities = [];
  const relationships = [];
  input.cells.forEach((cell) => {
      if (cell.type == 'custom.Image') {
        entities.push({
          id: cell.id,
          text: cell.attrs['.imagecell-label'].text,
        });
      } else if (cell.type == 'custom.CustomGroup') {
        relationships.push({
          type: 'group',
          id: cell.id,
          embeds: cell.embeds.slice(1), 
          text: cell.attrs['.group-label'].text,
        });
      } else if (cell.type == 'basic.Rect') {
        relationships.push({
          type: 'selection-group',
          id: cell.id,
          embeds: cell.embeds,
          text: cell.attrs['.group-label'].text,
        });
      } else if (cell.type == 'link') {
        relationships.push({
          type: 'link',
          sourceid: cell.source.id,
          targetid: cell.target.id,
          id: cell.id,
          arrowType: 'right-arrow',
        });
      }
  });
  return { entities, relationships };
}

function downloadJson() {
  var blob = new Blob([document.getElementById("jsoncont").textContent], { type: "application/json" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "data.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

document.getElementById("download").addEventListener("click", downloadJson);

// paper.on('cell:pointerdown', function(cellView, evt, x, y) {
//   var cell = cellView.model;
//   if (cell.isLink()) {
//     var ns = joint.linkTools;
//     console.log(ns)
//     var toolsView = new joint.dia.ToolsView({
//         name: 'link-pointerdown',
//         tools: [
//             new ns.Vertices({ offset: 100 }),
//             new ns.SourceAnchor(),
//             new ns.TargetAnchor(),
//             new ns.SourceArrowhead(),
//             new ns.TargetArrowhead(),
//             new ns.Segments,
//             new ns.Boundary({ padding: 15 }),
//             new ns.Remove({ offset: -20, distance: 40 })
//         ]
//     });
//     console.log(toolsView)
//     cellView.addTools(toolsView);
//     console.log(cellView)
//     console.log("done")
//   }
// });


paper.on('cell:pointerdown', function(cellView, evt, x, y) {
  var cell = cellView.model;
  if (cell.isLink()) {
    var ns = joint.linkTools;
    var toolsView = new joint.dia.ToolsView({
        name: 'link-pointerdown',
        tools: [
            new ns.Vertices({ offset: 100 }),
            new ns.SourceAnchor(),
            new ns.TargetAnchor(),
            new ns.SourceArrowhead(),
            new ns.TargetArrowhead(),
            new ns.Segments,
            new ns.Boundary({ padding: 15 }),
            new ns.Remove({ offset: -20, distance: 40 })
        ]
    });
    cellView.addTools(toolsView);
    document.getElementById("textvalue").value = "";
    ["element", "nameofele", "nametag", "quantitytag", "regiontag", "namevalue", "quantityvalue", "regionvalue", "save", "reset"].forEach(id => document.getElementById(id).style.display = "none");
    document.getElementById("jsontab").addEventListener("click", () => {
      document.getElementById("jsoncont").textContent = JSON.stringify(processInput(graph.toJSON()), null, 2);
    })
    modelIDd = this.el.getAttribute('model-id');
    var box = document.getElementById("box"); 
    var textTextbox = document.getElementById("textvalue");
    const arrowMenu = document.createElement("div");
    arrowMenu.className = "arrow-menu";
    let arrowoption;
    arrowOptions.forEach((arrowOption) => {
      const arrowItem = document.createElement("div");
      $(arrowItem).addClass(arrowOption.name);
      arrowItem.innerHTML = arrowOption.svg;
      arrowItem.addEventListener("click", () => {
        arrowoption = arrowOption.name;
      });
      arrowMenu.appendChild(arrowItem);
    });
    box.appendChild(arrowMenu);
    const arrows = document.querySelectorAll('.rightside-arrow, .rightside-dotted-arrow, .doublesided-arrow, .doublesided-dotted-arrow');
    function handleClick(event) {
      const clickedArrow = event.currentTarget;
      const associatedDottedArrow = document.querySelector(clickedArrow.dataset.dottedArrow);
      document.querySelectorAll('.rightside-arrow, .rightside-dotted-arrow, .doublesided-arrow, .doublesided-dotted-arrow').forEach(arrow => remborder(arrow.querySelector('svg')));
      clickedArrow.querySelector('svg').style.border = "2px solid black";
      associatedDottedArrow && remborder(associatedDottedArrow.querySelector('svg'));
    }
    arrows.forEach(arrow => arrow.addEventListener("click", handleClick));
    function remborder(element) {
      if (element) {
        element.style.border = "";
      }
    }  
    var colorBox1 = document.getElementById("colorbox1");
    var colorBox2 = document.getElementById("colorbox2");
    var colorBox3 = document.getElementById("colorbox3");
    var colorBox4 = document.getElementById("colorbox4");
    let color = "";
    colorBox1.addEventListener("click", () => {
      [colorBox2, colorBox3, colorBox4].forEach(e => remborder(e));
      colorBox1.style.border = "2px solid black";
      color = "red";
    });
    colorBox2.addEventListener("click", () => {
      [colorBox1, colorBox3, colorBox4].forEach(e => remborder(e));
      colorBox2.style.border = "2px solid black";
      color = "green";
    });
    colorBox3.addEventListener("click", () => {
      [colorBox1, colorBox2, colorBox4].forEach(e => remborder(e));
      colorBox3.style.border = "2px solid black";
      color = "blue";
    });
    colorBox4.addEventListener("click", () => {
      [colorBox1, colorBox2, colorBox3].forEach(e => remborder(e));
      colorBox4.style.border = "2px solid black";
      color = "yellow";
    });
    var saveButton = document.getElementById("saveb");
    saveButton.addEventListener("click", function() {
      var currentjson = graph.toJSON();
      currentjson.cells.forEach(cell => {
        if (cell.id == modelIDd && textTextbox.value != "") {
          cell.labels = [{ "position": { "distance": 0.5, "offset": -20, "args": { "dx": 0, "dy": 0, "angle": 0 } }, "attrs": { "text": { "text": textTextbox.value } } }];
          graph.fromJSON(currentjson);
          return;
        }
      });      
      var currentjson = graph.toJSON();
      currentjson.cells.forEach(cell => {
        if (cell.id == modelIDd) {
          arrowoption && applyArrowType(cell.source.id, cell.target.id, arrowoption);
          return;
        }
      });      
      var currentjson = graph.toJSON();
      currentjson.cells.forEach(cell => {
        if (cell.id == modelIDd && color != "") {
          const linkVel = paper.findViewByModel(cell.id).vel;
          if (color == "red") {
            linkVel.addClass("red");
          } else if (color == "green") {
            linkVel.addClass("green");
          } else if (color == "blue") {
            linkVel.addClass("blue");
          } else if (color == "yellow") {
            linkVel.addClass("yellow");
          }
        }
      });      
    });
    var resetButton = document.getElementById("resetb");
    resetButton.addEventListener("click", function() {
        textTextbox.value = "";
        [colorBox1, colorBox2, colorBox3, colorBox4].forEach(e => remborder(e));
        document.querySelectorAll('.rightside-arrow, .rightside-dotted-arrow, .doublesided-arrow, .doublesided-dotted-arrow').forEach(arrow => remborder(arrow.querySelector('svg')));
    });
    [container, textTextbox, colorBox1, colorBox2, colorBox3, colorBox4, saveButton, resetButton].forEach(e => e.style.display = "block");
    ["optionstag", "texttag", "colortag"].forEach(e => document.getElementById(e).style.display = "block");
  } 
  else {
    console.log(cell)
    modelIDd = cell.attributes.id;
    try {
      ["name", "quantity", "region"].forEach(e => document.getElementById(`${e}value`).value = "");
    } catch {}
    ["texttag", "textvalue", "optionstag", "colortag", "colorbox1", "colorbox2", "colorbox3", "colorbox4", "saveb", "resetb"].forEach(e => document.getElementById(e).style.display = "none");
    var box = document.getElementById("box");
    var arrowMenu = box.querySelector(".arrow-menu");
    arrowMenu && box.removeChild(arrowMenu);
    document.getElementById("jsontab").addEventListener("click", () => {
      document.getElementById("jsoncont").textContent = JSON.stringify(processInput(graph.toJSON()), null, 2);
    })
    const imageDiv = document.querySelector(`[model-id="${modelIDd}"]`);
    var link = imageDiv.querySelector("image").getAttribute("xlink:href");
    var text = link.split("/")[link.split("/").length - 1].split(".")[0].split(/[-_]/).filter(item => !["light", "bg"].includes(item)).join(" ");
    if (text == "ungroup icon") {
      text = "Selection-group";
      link = "images/group.svg";
    }
    var image = document.getElementById("element");
    image.src = link;
    var textElement = document.getElementById("nameofele");
    textElement.textContent = text;
    ["nametag", "quantitytag", "regiontag"].forEach(tag => document.getElementById(tag).style.display = "block");
    var nameTextbox = document.getElementById("namevalue");
    var quantityTextbox = document.getElementById("quantityvalue");
    var regionTextbox = document.getElementById("regionvalue");
    var saveButton = document.getElementById("save");
    saveButton.addEventListener("click", function() {
      var currentjson = graph.toJSON();
      var elementUpdated = false;
      currentjson.cells.forEach(cell => {
        if (cell.id === modelIDd) {
          if (nameTextbox.value !== "") {
            if (cell.type == "custom.Image") {
              cell.attrs[".imagecell-label"].text = nameTextbox.value;
              elementUpdated = true;
            } else {
              cell.attrs[".group-label"].text = nameTextbox.value;
              elementUpdated = true;
            }
          }
          if (quantityTextbox.value !== "") {
            if (/^[\d]+$/.test(quantityTextbox.value)) {
              if (cell.type == "custom.Image") {
                cell.markup = `\n              <g joint-selector="cell-group">\n                <rect width="60" height="60" fill="#fff" stroke="#aaaaaa" joint-selector="background"/>\n                <circle r="10" fill="#fff" stroke="#aaaaaa" joint-selector="count"/>\n                <text x="0" y="0" font-size="12" fill="#000" text-anchor="middle" dominant-baseline="middle" joint-selector="count-text">${quantityTextbox.value}</text>\n                <image width="40" height="40" joint-selector="image-cell" />\n                <text font-size="14" joint-selector="label" display="block" class="imagecell-label"/>\n              </g>\n            `;
                elementUpdated = true;
              } else if (cell.type == "custom.CustomGroup") {
                cell.markup = `\n              <g class="rotatable">\n        <g class="scalable">\n          <rect width="200" height="100"/>\n        </g>\n          <image width="50" height="50"/>\n        <text class="group-label"/>\n      <circle r="10" fill="#fff" stroke="#aaaaaa" joint-selector="count"/>\n                <text x="0" y="0" font-size="12" fill="#000" text-anchor="middle" dominant-baseline="middle" joint-selector="count-text">${quantityTextbox.value}</text>\n        </g>\n              `;
                elementUpdated = true;
              } else {
                cell.markup = `\n             <g class="rotatable">\n        <rect  stroke="#555"/>\n        <image width="20" height="20" class="ungroup-btn"/>\n      <text class="group-label">Group Name</text>\n    <circle r="10" fill="#fff" stroke="#aaaaaa" joint-selector="count"/>\n                <text x="0" y="0" font-size="12" fill="#000" text-anchor="middle" dominant-baseline="middle" joint-selector="count-text">${quantityTextbox.value}</text>\n        </g>\n              `;
                elementUpdated = true;
              }
            }
            else {
              const errormsg = document.getElementById("errormsg");
              errormsg.style.display = "block";
              errormsg.style.opacity = "1";
              setTimeout(function() {
                errormsg.style.opacity = "0";
                quantityTextbox.value = "";
              }, 1000)
              setTimeout(function() {
                errormsg.style.display = "none";
              }, 1500);
            }  
          }
        }
      });
      elementUpdated && graph.fromJSON(currentjson);
    });
    var resetButton = document.getElementById("reset");
    resetButton.addEventListener("click", function() {
        [nameTextbox, quantityTextbox, regionTextbox].forEach(e => e.value = "");
    });
    [container, image, textElement, nameTextbox, quantityTextbox, regionTextbox, saveButton, resetButton].forEach(e => e.style.display = "block");
  }
});

var cellJson;

document.addEventListener('keydown', function (e) {
  if ((e.key === 'c' || e.key === 'C') && e.ctrlKey) {
    if (modelIDd) {
      cellJson = graph.getCell(modelIDd).toJSON();
      e.preventDefault();
    }
  }
});

let count = 0;

document.addEventListener('keydown', function (e) {
  if ((e.key === 'v' || e.key === 'V') && e.ctrlKey) {
    if (cellJson) {
      count += 1;
      if (cellJson.type == "custom.Image") {
        graph.addCell({
          "type": "custom.Image",
          "resizable": true,
          "size": {
              "width": 60,
              "height": 60
          },
          "position": {
              "x": 100,
              "y": 100
          },
          "angle": 0,
          "markup": "\n        <g joint-selector=\"cell-group\">\n        <rect width=\"60\" height=\"60\" fill=\"#fff\" stroke=\"#aaaaaa\" joint-selector=\"background\"/>\n        <image  width=\"40\" height=\"40\" joint-selector=\"image-cell\" />\n        <text font-size=\"13\" joint-selector=\"label\" display=\"block\" class=\"imagecell-label\"/>\n        </g>\n      ",
          "id": "duplicate" + count,
          "z": 1,
          "attrs": {
              "image": {
                  "xlink:href": cellJson.attrs.image["xlink:href"],
                  "x": 10,
                  "y": 10
              },
              ".imagecell-label": {
                  "text": cellJson.attrs[".imagecell-label"].text,
                  "ref-x": 0.5,
                  "ref-dy": 1.5,
                  "y": 15,
                  "font-size": 12,
                  "text-anchor": "middle",
                  "line-height": "30",
                  "fill": "#000",
                  "cursor": "pointer",
                  "textWrap": {
                      "width": 60,
                      "ellipsis": true
                  }
              }
          }
        });
      }
      else if (cellJson.type == "custom.CustomGroup") {
        let l = [];
        let cnt = 0;
        const currjson = graph.toJSON();
        let req;
        currjson.cells.forEach((e) => {
          if (e.id == modelIDd) {
            req = e;
          }
        });      
        graph.addCell({
          "type": "custom.CustomGroup",
          "size": {
              "width": req.size.width,
              "height": req.size.height
          },
          "position": {
              "x": 100,
              "y": 100
          },
          "angle": 0,
          "markup": "\n      <g class=\"rotatable\">\n        <g class=\"scalable\">\n          <rect width=\"200\" height=\"100\"/>\n        </g>\n        <image width=\"50\" height=\"50\"/>\n        <text class=\"group-label\"/>\n      </g>\n    ",
          "id": "duplicate" + count,
          "embeds": l,
          "z": 1,
          "attrs": {
              "rect": {
                  "fill": "#f7f7f7",
                  "stroke": "#aaaaaa",
                  "stroke-width": 1
              },
              "image": {
                  "xlink:href": req.attrs.image["xlink:href"],
                  "width": 30,
                  "height": 30,
                  "ref": "rect",
                  "ref-x": 0,
                  "ref-y": 0
              },
              ".group-label": {
                  "text": req.attrs[".group-label"].text,
                  "ref-x": 0.5,
                  "ref-y": 1,
                  "ref-dy": 10,
                  "font-size": 14,
                  "text-anchor": "middle",
                  "fill": "#000",
                  "cursor": "pointer"
              }
          }
        });
        req.embeds.slice(1).forEach((e) => {
          currjson.cells.forEach((f) => {
            if (f.id == e) {
              graph.addCell({
                "type": "custom.Image",
                "resizable": true,
                "size": {
                    "width": 60,
                    "height": 60
                },
                "position": {
                    "x": f.position.x - req.position.x + 100,
                    "y": f.position.y - req.position.y + 100
                },
                "angle": 0,
                "markup": "\n        <g joint-selector=\"cell-group\">\n        <rect width=\"60\" height=\"60\" fill=\"#fff\" stroke=\"#aaaaaa\" joint-selector=\"background\"/>\n        <image  width=\"40\" height=\"40\" joint-selector=\"image-cell\" />\n        <text font-size=\"13\" joint-selector=\"label\" display=\"block\" class=\"imagecell-label\"/>\n        </g>\n      ",
                "id": "duplicate" + count + cnt,
                "z": 1,
                "attrs": {
                    "image": {
                        "xlink:href": f.attrs.image["xlink:href"],
                        "x": 10,
                        "y": 10
                    },
                    ".imagecell-label": {
                        "text": f.attrs[".imagecell-label"].text,
                        "ref-x": 0.5,
                        "ref-dy": 1.5,
                        "y": 15,
                        "font-size": 12,
                        "text-anchor": "middle",
                        "line-height": "30",
                        "fill": "#000",
                        "cursor": "pointer",
                        "textWrap": {
                            "width": 60,
                            "ellipsis": true
                        }
                    }
                }
              });
              l.push("duplicate" + count + cnt);
            }
          });  
        });  
        graph.getCell("duplicate" + count).set("embeds", l);
      }
      // else if (cellJson.type == "basic.Rect") {
      //   let l = [];
      //   let cnt = 0;
      //   const currjson = graph.toJSON();
      //   let req;
      //   currjson.cells.forEach((e) => {
      //     if (e.id == modelIDd) {
      //       req = e;
      //     }
      //   });      
      //   graph.addCell({
      //     "type": "basic.Rect",
      //     "position": {
      //         "x": 100,
      //         "y": 100
      //     },
      //     "size": {
      //         "width": req.size.width,
      //         "height": req.size.height
      //     },
      //     "angle": 0,
      //     "id": "duplicate" + count,
      //     "markup": "\n        <g class=\"rotatable\">\n\n            <rect  stroke=\"#555\"/>\n\n            <image width=\"20\" height=\"20\" class=\"ungroup-btn\"/>\n\n          <text class=\"group-label\">Group Name</text>\n        </g>\n      ",
      //     "embeds": l,
      //     "z": 3,
      //     "attrs": {
      //         "rect": {
      //             "fill": "transparent",
      //             "stroke": "#555",
      //             "width": req.size.width,
      //             "height": req.size.height,
      //             "stroke-dasharray": "5 5",
      //             "stroke-width": "1"
      //         },
      //         ".group-label": {
      //             "text": req.attrs[".group-label"].text,
      //             "ref-x": 0.5,
      //             "ref-y": 1,
      //             "ref-dy": 10,
      //             "font-size": 14,
      //             "text-anchor": "middle",
      //             "fill": "#000",
      //             "cursor": "pointer"
      //         },
      //         ".ungroup-button": {
      //             "cursor": "pointer"
      //         },
      //         "image": {
      //             "xlink:href": "images/ungroup-icon.svg",
      //             "width": 30,
      //             "height": 30,
      //             "ref": "rect",
      //             "ref-x": -0.5,
      //             "ref-y": -3.5,
      //             "cursor": "pointer"
      //         },
      //         ".label": {
      //             "text": "Group Name"
      //         }
      //     }
      //   });
      //   req.embeds.forEach((e) => {
      //     currjson.cells.forEach((f) => {
      //       if (f.id == e) {
      //         if (f.type == "custom.CustomGroup") {
      //           graph.addCell({
      //             "type": "custom.CustomGroup",
      //             "size": {
      //                 "width": f.size.width,
      //                 "height": f.size.height
      //             },
      //             "position": {
      //                 "x": f.position.x - req.position.x + 100,
      //                 "y": f.position.y - req.position.y + 100
      //             },
      //             "angle": 0,
      //             "markup": "\n      <g class=\"rotatable\">\n        <g class=\"scalable\">\n          <rect width=\"200\" height=\"100\"/>\n        </g>\n        <image width=\"50\" height=\"50\"/>\n        <text class=\"group-label\"/>\n      </g>\n    ",
      //             "id": "duplicate" + count + cnt,
      //             "embeds": l,
      //             "z": 1,
      //             "attrs": {
      //                 "rect": {
      //                     "fill": "#f7f7f7",
      //                     "stroke": "#aaaaaa",
      //                     "stroke-width": 1
      //                 },
      //                 "image": {
      //                     "xlink:href": f.attrs.image["xlink:href"],
      //                     "width": 30,
      //                     "height": 30,
      //                     "ref": "rect",
      //                     "ref-x": 0,
      //                     "ref-y": 0
      //                 },
      //                 ".group-label": {
      //                     "text": f.attrs[".group-label"].text,
      //                     "ref-x": 0.5,
      //                     "ref-y": 1,
      //                     "ref-dy": 10,
      //                     "font-size": 14,
      //                     "text-anchor": "middle",
      //                     "fill": "#000",
      //                     "cursor": "pointer"
      //                 }
      //             }
      //           })
      //         }
      //         else if (f.type == "custom.Image") {
      //           graph.addCell({
      //             "type": "custom.Image",
      //             "resizable": true,
      //             "size": {
      //                 "width": 60,
      //                 "height": 60
      //             },
      //             "position": {
      //                 "x": f.position.x - req.position.x + 100,
      //                 "y": f.position.y - req.position.y + 100
      //             },
      //             "angle": 0,
      //             "markup": "\n        <g joint-selector=\"cell-group\">\n        <rect width=\"60\" height=\"60\" fill=\"#fff\" stroke=\"#aaaaaa\" joint-selector=\"background\"/>\n        <image  width=\"40\" height=\"40\" joint-selector=\"image-cell\" />\n        <text font-size=\"13\" joint-selector=\"label\" display=\"block\" class=\"imagecell-label\"/>\n        </g>\n      ",
      //             "id": "duplicate" + count + cnt,
      //             "z": 1,
      //             "attrs": {
      //                 "image": {
      //                     "xlink:href": f.attrs.image["xlink:href"],
      //                     "x": 10,
      //                     "y": 10
      //                 },
      //                 ".imagecell-label": {
      //                     "text": f.attrs[".imagecell-label"].text,
      //                     "ref-x": 0.5,
      //                     "ref-dy": 1.5,
      //                     "y": 15,
      //                     "font-size": 12,
      //                     "text-anchor": "middle",
      //                     "line-height": "30",
      //                     "fill": "#000",
      //                     "cursor": "pointer",
      //                     "textWrap": {
      //                         "width": 60,
      //                         "ellipsis": true
      //                     }
      //                 }
      //             }
      //           });
      //         }
      //         l.push("duplicate" + count + cnt);
      //       }
      //     });  
      //   });  
      //   graph.getCell("duplicate" + count).set("embeds", l);
      // }
    }
  }
});

paper.el.addEventListener("pointerup", (e) => {
  console.log("abc");
  if (undoStack.length > 1) {
    const sortedJSON1 = JSON.stringify(graph.toJSON(), Object.keys(graph.toJSON()).sort());
    const sortedJSON2 = JSON.stringify(undoStack[undoStack.length - 1], Object.keys(undoStack[undoStack.length - 1]).sort());
    if (sortedJSON1 === sortedJSON2) {
      updateHistory();
    }
  }
  else {
    updateHistory();
  }
});