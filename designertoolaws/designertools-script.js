const { dia, util, shapes: defaultShapes, highlighters, elementTools } = joint;
const shapes = {
  ...defaultShapes,
};

var namespace = joint.shapes;

const paperContainer = document.getElementById("paper-container");
const graph = new dia.Graph(
  {},
  {
    cellNamespace: shapes,
  }
);

const paper = new dia.Paper({
  model: graph,
  cellViewNamespace: shapes,
  width: "100%",
  height: "100%",
  gridSize: 20,
  drawGrid: {
    name: 'dots',
  },
  async: true,
  sorting: dia.Paper.sorting.APPROX,
  background: {
    color: "#fff",
  },
  snapLinksSelf: {
    radius: 50,
  },
  cellViewNamespace: namespace,
  defaultLink: () => new shapes.standard.Link(),
});

paperContainer.appendChild(paper.el);

let undoStack = [];
let redoStack = [];
let currentJSONData; // Store the current JSON data

function updateHistory() {
  const currentState = graph.toJSON();

  // Store the current JSON data
  currentJSONData = currentState;

  undoStack.push(currentState);
  redoStack = [];
  
}

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
    
    // Import the previous state into the graph
    graph.fromJSON(undoStack[undoStack.length - 1]);

    // Apply class names to link elements based on the stored JSON data
    addClassNamesToLinks();
  }
}

function redo() {
  if (redoStack.length > 0) {
    const nextState = redoStack.pop();
    undoStack.push(nextState);

    // Import the next state into the graph
    graph.fromJSON(nextState);

    // Apply class names to link elements based on the stored JSON data
    addClassNamesToLinks();
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
  updateHistory();
}

function infoview(elementView) {
  console.log("sbc");
  alert("clicked");
}

const customImage = joint.dia.Element.extend({

  
  defaults: joint.util.deepSupplement(
    {
      type: "custom.Image",
      resizable: true,
      size: {
        width: 100,
        height: 100,
      },
      attrs: {
        image: {
          ref: "rect",
        },
      },
    },
    joint.dia.Element.prototype.defaults
  ),
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
            y: -10,
          },
          action: () => confirmRemoval(elementView),
        }),
        new ResizeTool({
          selector: "rect",
        }),
        new infobutton({
          selector: "rect",
        }),
        connectRight,
        connectLeft,
        connectTop,
        connectBottom,
      ],
    });
  } else {
    toolsView = new dia.ToolsView({
      tools: [
        new elementTools.Remove({
          x: "100%",
          y: 0,
          offset: {
            x: 10,
            y: -10,
          },
          action: () => confirmRemoval(elementView),
        }),
        new ResizeTool({
          selector: "rect",
        }),
        new infobutton({
          selector: "rect",
        }),
        connectRight,
        connectLeft,
        connectTop,
        connectBottom,
      ],
    });
  }
  
 
  
  elementView.addTools(toolsView);
  toolsView.render();
  toolsView.$el.addClass("active");

  elementView.render = function () {
    joint.dia.ElementView.prototype.render.apply(this, arguments);

    // Render the label
    const label = this.$("text");
    const labelText = this.model.get("attrs").label.text;
    label.text(labelText);
  };
  const labelElement = elementView.$(".group-label");
  const elementPosition = elementView.model.position();
  

  // Calculate the position relative to the paper container
  const inputX = (elementPosition.x + elementView.model.attributes.size.width/2) - 100 ;
  const inputY = elementPosition.y + elementView.model.attributes.size.height ;

  // Add a click handler for the label element
  labelElement.on("click", () => {
    $("input.edit-label").remove();
    // Create an input element for editing the label
    const input = $("<input>")
      .val(labelElement.text())
      .addClass("edit-label")
      .css({
        position: "absolute",
        top: inputY + "px",
        left: inputX + "px",
        width: '200px',
        height: '36px',
      });
    input.appendTo(paper.el);

    // Handle Enter key press to save the changes
    input.on("keyup", (e) => {
      if (e.key === "Enter") {
        const newText = input.val();
        labelElement.text(newText);
        input.remove();
        // Update the model's label attribute here if needed
        elementView.model.attr(".group-label/text", newText);
        updateHistory();
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
      if (currentElementView && currentElementView.$) {
          const ungroupElement = currentElementView.$(ungroupBtn);
          if (ungroupElement) {
            ungroupElements(currentElementView.model);
              
          } else {
              
          }
      }
  }
});
function ungroupElements(parentGroup) {
  const embeddedCellIds = parentGroup.get('embeds');

  if (embeddedCellIds && embeddedCellIds.length > 0) {
    // Collect JSON representation of child groups before ungrouping
    const childGroupsJSON = embeddedCellIds
      .map((cellId) => graph.getCell(cellId))
      .filter((cell) => cell.isElement() && cell.attributes.type === 'custom.CustomGroup')
      .map((group) => group.toJSON());

    // Remove the parent group from the graph
    parentGroup.remove();

    // Embed child elements back to the graph
    embeddedCellIds.forEach((cellId) => {
      const cell = graph.getCell(cellId);
      if (cell && cell !== parentGroup) {
        graph.addCell(cell);
      }
    });

    // Add child groups back to the graph from the collected JSON representations
    childGroupsJSON.forEach((groupJSON) => {
      const childGroup = new joint.shapes.custom.CustomGroup(groupJSON);
      graph.addCell(childGroup);
    });

    // Update history or perform any other necessary actions
    updateHistory();
  }
}










const groupCells = [];
let group;
function handleDrop(event, imageUrl, imageName, groupCheck) {
  let x = event.offsetX/zoomLevel;
  let y = event.offsetY/zoomLevel;

  // Check if it's an existing group under the drop position
  const groupUnderDrop = groupCells.find((group) => {
    const groupView = group.findView(paper);

    // Check if groupView is defined and it's not an image cell
    if (groupView && group.attributes.type !== "custom.Image") {
      const groupBBox = groupView.getBBox();
      return (
        x >= groupBBox.x &&
        x <= groupBBox.x + groupBBox.width &&
        y >= groupBBox.y &&
        y <= groupBBox.y + groupBBox.height
      );
    }
    return false; // No valid groupView or it's an image cell
  });

  if (groupCheck === "true") {
    // If it's a group cell, create a group and add it to the graph
    const group = new joint.shapes.custom.CustomGroup({
      markup: `
      <g class="rotatable">
        <g class="scalable">
          <rect width="400" height="200"/>
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
          "stroke-width": 1,
        },
        image: {
          "xlink:href": imageUrl,
          width: 30,
          height: 30,
          ref: "rect",
          "ref-x": 0,
          "ref-y": 0,
        },
        // Configure the label element
        ".group-label": {
          text: imageName,
          "ref-x": 0.5,
          "ref-y": 1,
          "ref-dy": 10,
          "font-size": 14,
          "text-anchor": "middle",
          fill: "#000",
          cursor: "pointer",
        },
      },
    });

    // Create the image cell
    const imageCell = new customImage({
      position: { x: 50, y: 50 }, // Customize the image position within the group
      size: { width: 100, height: 100 }, // Customize the image size as needed
      attrs: {
        image: { "xlink:href": imageUrl },
        label: { text: imageName },
      },
    });
    updateHistory();
    // Add the image cell to the group
    group.embed(imageCell);

    // Add the group to the graph
    graph.addCell(group);
    updateHistory();
    // Add tools for resizing, connecting, etc. to the group
    const toolsView = new dia.ToolsView({
      tools: [
        new elementTools.Remove({
          x: "100%",
          y: 0,
          offset: { x: 10, y: -10 },
          action: () => confirmRemoval(groupView),
        }),
        new ResizeTool({
          selector: "rect", // Customize the selector as needed
        }),
        new infobutton({
          selector: "rect",
        }),
        connectRight,
        connectLeft,
        connectTop,
        connectBottom,
      ],
    });

    const groupView = group.findView(paper);
    groupView.addTools(toolsView);
    toolsView.render();
    toolsView.$el.addClass("active");

    paper.on("blank:pointerclick", () => {
      toolsView.$el.removeClass("active");
    }); 
    groupCells.push(group);
  } else {

    if (groupUnderDrop) {
      const imageCell = new customImage({
        markup: `
        <g joint-selector="cell-group">
        <rect width="80" height="80" fill="#fff" stroke="#aaaaaa" joint-selector="background"/>
        <image  width="60" height="60" joint-selector="image-cell" />
        <text font-size="14" joint-selector="label" display="block" class="imagecell-label"/>
        </g>
      `,
        position: { x, y }, // Customize the image position within the group
        size: { width: 90, height: 90 }, // Customize the image size as needed
        attrs: {
          image: { 
            "xlink:href": imageUrl,
            x: 10,
            y: 10,
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
              width: 150, // Set the width at which text should wrap
              ellipsis: true, // Optional: add ellipsis for text that exceeds the specified width
            },
          },
        },
      });

      imageCell.set("initialRelativeX", x); // Set the initial relative X position
      imageCell.set("initialRelativeY", y);
      // Embed the new cell into the group
      groupUnderDrop.embed(imageCell);

      // Add the child cell to the graph
      graph.addCell(imageCell);
      updateHistory();
    } else {
      // Create the image cell
      const imageCell = new customImage({
        markup: `
        <g joint-selector="cell-group">
        <rect width="80" height="80" fill="#fff" stroke="#aaaaaa" joint-selector="background"/>
        <image  width="60" height="60" joint-selector="image-cell" />
        <text font-size="14" joint-selector="label" display="block" class="imagecell-label"/>
        </g>
      `,
        position: { x, y }, // Customize the image position within the group
        size: { width: 90, height: 90 }, // Customize the image size as needed
        attrs: {
          image: { 
            "xlink:href": imageUrl,
            x: 10,
            y: 10,
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
              width: 100, // Set the width at which text should wrap
              ellipsis: true, // Optional: add ellipsis for text that exceeds the specified width
            },
          },
        },
      });
      
     
      
      
      
      
      

      // Add the group to the graph
      graph.addCell(imageCell);
      updateHistory();
      
     
    }
  }
}

function clickDrop(event, imageUrl, imageName, groupCheck) {
  let x = 100;
  let y = 100;
  // console.log(groupCheck)
  if (groupCheck === "true") {
    // If it's a group cell, create a group and add it to the graph
    const group = new joint.shapes.custom.CustomGroup({
      markup: `
      <g class="rotatable">
        <g class="scalable">
          <rect width="400" height="200"/>
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
          "stroke-width": 1,
        },
        image: {
          "xlink:href": imageUrl,
          width: 30,
          height: 30,
          ref: "rect",
          "ref-x": 0,
          "ref-y": 0,
        },
        // Configure the label element
        ".group-label": {
          text: imageName,
          "ref-x": 0.5,
          "ref-y": 1,
          "ref-dy": 10,
          "font-size": 14,
          "text-anchor": "middle",
          fill: "#000",
          cursor: "pointer",
        },
      },
    });

    // Create the image cell
    const imageCell = new customImage({
      position: { x: 50, y: 50 }, // Customize the image position within the group
      size: { width: 100, height: 100 }, // Customize the image size as needed
      attrs: {
        image: { "xlink:href": imageUrl },
        label: { text: imageName },
      },
    });

    // Add the image cell to the group
    group.embed(imageCell);
    // getjson();
    console.log(undoStack)
    // Add the image cell to the group
    group.embed(imageCell);

    // Add the group to the graph
    graph.addCell(group);
    // getjson();
    undoStack.splice(undoStack.length-2,1)
    console.log(undoStack)

    // Add tools for resizing, connecting, etc. to the group
    const toolsView = new dia.ToolsView({
      tools: [
        new elementTools.Remove({
          x: "100%",
          y: 0,
          offset: { x: 10, y: -10 },
          action: () => confirmRemoval(groupView),
        }),
        new ResizeTool({
          selector: "rect", // Customize the selector as needed
        }),
        new infobutton({
          selector: "rect",
        }),
        connectRight,
        connectLeft,
        connectTop,
        connectBottom,
      ],
    });

    const groupView = group.findView(paper);
    groupView.addTools(toolsView);
    toolsView.render();
    toolsView.$el.addClass("active");

    groupCells.push(group);
    // currentState=graph.toJSON();
    //     undoStack.push(currentState);
    //     console.log(undoStack)

    paper.on("blank:pointerclick", () => {
      toolsView.$el.removeClass("active");
    }); 
    groupCells.push(group);
  } else {
      const imageCell = new customImage({
        markup: `
        <g joint-selector="cell-group">
        <rect width="80" height="80" fill="#fff" stroke="#aaaaaa" joint-selector="background"/>
        <image width="60" height="60" joint-selector="image-cell" />
        <text font-size="14" joint-selector="label" display="block" class="imagecell-label"/>
        </g>
      `,
        position: { x, y }, // Customize the image position within the group
        size: { width: 90, height: 90 }, // Customize the image size as needed
        attrs: {
          image: { 
            "xlink:href": imageUrl,
            x: 10,
            y: 10,
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
              width: 150, // Set the width at which text should wrap
              ellipsis: true, // Optional: add ellipsis for text that exceeds the specified width
            },
          },
        },
      });

      // Add the group to the graph
      graph.addCell(imageCell);
      // Add the group to the graph
      graph.addCell(imageCell);
      undoStack.push(graph.toJSON())
      // getjson();
      console.log(undoStack)
      
     
    // }
  }
}

const leftSidebarImages = document.querySelectorAll("img");

leftSidebarImages.forEach((img) => {
  // img.addEventListener("dragstart", (event) => {
  //   const imageUrl = event.target.src;
  //   const imageName = event.target.getAttribute("name");
  //   const groupCheck = event.target.getAttribute("data-group");
  //   // console.log(event)
  //   event.dataTransfer.setData(
  //     "text/plain",
  //     JSON.stringify({
  //       imageUrl,
  //       imageName,
  //       groupCheck,
  //     })
  //   );
  // });
  img.addEventListener("click", (event) => {
    let imageUrl = event.target.src;
    let imageName = event.target.getAttribute("name");
    let groupCheck = event.target.getAttribute("data-group");
    // console.log(typeof imageUrl,typeof imageName,typeof groupCheck)
    // console.log(event)
    // event.dataTransfer.setData(
    //   "text/plain",
    //   JSON.stringify({
    //     imageUrl,
    //     imageName,
    //     groupCheck,
    //   })
    // );
    // console.log(img)
    // graph.addCell(img);
    // event.preventDefault();
    // const data = JSON.parse(event.dataTransfer.getData("text/plain"));
    // console.log(groupCheck)
    // let groupcheck = JSON.stringify(groupCheck);
    clickDrop(event, imageUrl, imageName, groupCheck);
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

//Testing
function onElementAdded(element) {}

// Listen for the 'add' event on the graph
graph.on("add", onElementAdded);

function getMarkup(angle = 0) {
  return [
    {
      tagName: "circle",
      selector: "button",
      attributes: {
        r: 7,
        fill: "transparent",
        stroke: "transparent",
        cursor: "pointer",
      },
    },
    {
      tagName: "path",
      selector: "icon",
      attributes: {
        transform: `rotate(${angle})`,
        d: "M -10 -2 L 0 -2 L 0 -6 L 9 0 L 0 6 L 0 2 L -10 2 z",
        fill: "#4666E5",
        stroke: "none",
        "stroke-width": 2,
        "pointer-events": "none",
      },
    },
  ];
}

const connectRight = new elementTools.Connect({
  x: "110%",
  y: "50%",
  markup: getMarkup(0),
});

const connectBottom = new elementTools.Connect({
  x: "50%",
  y: "110%",
  markup: getMarkup(90),
});
const connectTop = new elementTools.Connect({
  x: "50%",
  y: "-10%",
  markup: getMarkup(270),
});
const connectLeft = new elementTools.Connect({
  x: "-10%",
  y: "50%",
  markup: getMarkup(180),
});

// Function to handle diagram export
function exportDiagramJSON() {
  const diagramDesign = graph.toJSON();
  const diagramDesignJSONString = JSON.stringify(diagramDesign);

  console.log(diagramDesignJSONString);

  //  const blob = new Blob([diagramDesignJSONString], { type: 'application/json' });
  //  const url = URL.createObjectURL(blob);
  //  const a = document.createElement('a');
  //  a.href = url;
  //  a.download = 'diagram.json';
  //  a.textContent = 'Download Diagram JSON';
  //  document.body.appendChild(a);
  //  a.click();
  //  document.body.removeChild(a);
  //  URL.revokeObjectURL(url);
}
const exportButton = document.getElementById("export-button");
exportButton.addEventListener("click", exportDiagramJSON);

joint.shapes.custom = {};

joint.shapes.standard.Link = joint.dia.Link;

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

    // Wait for the graph to render the elements
    setTimeout(() => {
      // Find and add the dynamic class to the HTML element of the link
      jsonData.cells.forEach((cell) => {
        if (cell.type === 'link' && cell.customAttributes && cell.customAttributes.arrowType) {
          const linkElement = document.querySelector(`[model-id="${cell.id}"]`);
          if (linkElement) {
            const arrowType = cell.customAttributes.arrowType;
            linkElement.classList.add(arrowType);
          }
        }
      });
    }, 100); // Use a small timeout to ensure the elements are rendered

  } catch (error) {
    console.error("Error parsing JSON:", error);
  }
  updateHistory();
}





graph.on("change:target", (link, newTarget) => {
  if (link.isLink() && newTarget) {
    const sourceView = paper.findViewByModel(link.get("source").id);
    const targetView = paper.findViewByModel(newTarget.id);
    if (sourceView && targetView) {
      const coords = paper.clientToLocalPoint({
        x: event.clientX,
        y: event.clientY,
      });
      // showArrowTypeMenu(coords.x, coords.y, sourceView, targetView);
    }
  }
});

// function showArrowTypeMenu(x, y, sourceView, targetView) {
  
//   const arrowMenu = document.createElement("div");
//   var inputx = x + 300;
//   console.log(inputx);
//   arrowMenu.className = "arrow-menu";
//   arrowOptions.forEach((arrowOption) => {
//     const arrowItem = document.createElement("div");
//     $(arrowItem).addClass(arrowOption.name);

//     arrowItem.innerHTML = arrowOption.svg; // Set the SVG markup as innerHTML
//     arrowItem.addEventListener("click", () => {
//       applyArrowType(x, y, sourceView, targetView, arrowOption.name);
//       arrowMenu.remove();
//     });
//     arrowMenu.appendChild(arrowItem);
//   });

//   arrowMenu.style.position = "fixed";
//   arrowMenu.style.left = inputx + "px";
//   arrowMenu.style.top = y + "px";
//   document.body.appendChild(arrowMenu);

//   function removeArrowMenu() {
//     if (arrowMenu.parentNode) {
//       arrowMenu.parentNode.removeChild(arrowMenu);
//     }
//   }

//   paper.on("blank:pointerclick", () => {
//     removeArrowMenu();
//   });
// }

function createLinkLabelInput(linkView, x, y) {
  if (!linkView) {
    console.error("Invalid linkView");
    return;
  }
  var inputX= x + 300;
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter Link Text";

  input.style.position = "fixed";
  input.style.left = inputX + "px";
  input.style.top = y - 20 + "px"; // Adjust the position as needed

  input.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      const linkText = input.value.trim();
      if (linkText) {
        applyLinkLabel(linkView, linkText);
        updateHistory();
        input.style.display = "none"; // Hide the input field
      }
    }
  });

  document.body.appendChild(input);
  input.focus();

  paper.on("blank:pointerclick", () => {
    input.style.display = "none";
  });
}

function applyLinkLabel(linkView, linkText, positionX, positionY) {
  const link = linkView.model;

  const position = {
    x: positionX,
    y: positionY,
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
        angle: 0,
      },
    },
    attrs: {
      text: {
        text: linkText,
      },
    },
  });
}

let hasExistingLink = false;

function applyArrowType(sourceView, targetView, selectedArrowType) {
  const selectedStyle = arrowStyleOptions.find(
    (style) => style.name === selectedArrowType
  );

  if (!selectedStyle) {
    console.error("Invalid arrow type:", selectedArrowType);
    return;
  }

  const link = new joint.shapes.standard.Link({
    source: {
      id: sourceView,
    },
    target: {
      id: targetView,
    },
    attrs: {
      ".connection": {
        // stroke: "#e42527",
        stroke: selectedStyle.line.stroke,
      },
      ".marker-source": {
        markup: selectedStyle.line.sourceMarker.d,
        fill: "#e42527",
      },
      ".marker-target": {
        d: selectedStyle.line.targetMarker.d,
        fill: "#e42527",
      },
    },
    customAttributes: {
      arrowType: selectedArrowType,
    },
    labels: [
      {
        position: 1,
        attrs: {
          text: {
            text: "",
          },
        },
      },
    ],
  });

  const existingLink = graph.getLinks().find((existingLink) => {
    return (
      existingLink.get("source").id === sourceView &&
      existingLink.get("target").id === targetView
    );
  });

  if (existingLink) {
    hasExistingLink = true;
    const defaultLink = graph
      .getLinks()
      .find(
        (defaultLink) =>
          defaultLink.get("source").id === sourceView &&
          defaultLink.get("target").id === targetView &&
          defaultLink.attributes.customAttributes?.arrowType === undefined
      );
    if (defaultLink) { 
      graph.removeCells([defaultLink]);
    }
  }

  graph.addCell(link);
  updateHistory();
  const linkVel = link.findView(paper).vel;
  if (selectedArrowType === "doubleside-arrow") {
    linkVel.addClass("doubleside-arrow");
  } else if (selectedArrowType === "dotted-arrow") {
    linkVel.attr("stroke-dasharray", "4 4");
    linkVel.addClass("dotted-arrow");
  } else if (selectedArrowType === "doubleside-dotted-arrow") {
    linkVel.attr("stroke-dasharray", "4 4");
    linkVel.addClass("doubleside-dotted-arrow");
  } else if (selectedArrowType === "right-arrow") {
    linkVel.addClass("right-arrow");
  }
}

paper.on("link:pointerclick", (linkView) => {
  const coords = paper.clientToLocalPoint({
    x: event.clientX,
    y: event.clientY,
  });
  createLinkLabelInput(linkView, coords.x, coords.y);
});

const arrowOptions = [
  {
    id: "arrow-type-1",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20" viewBox="0 0 41 20" fill="none"><path d="M31.5 2C31.5 2 33.5 6.66667 39.5 10C33.5 13.3333 31.5 18 31.5 18" stroke="black" stroke-width="1" stroke-linejoin="round"></path><path d="M39.5 10H28.5" stroke="black" stroke-width="1"></path><path d="M2 10L33 10" stroke="black" stroke-width="1" ></path></svg>',
    name: "right-arrow",
  },
  {
    id: "arrow-type-2",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20" viewBox="0 0 41 20" fill="none"><path d="M31.5 2C31.5 2 33.5 6.66667 39.5 10C33.5 13.3333 31.5 18 31.5 18" stroke="black" stroke-width="1" stroke-linejoin="round"></path><path d="M39.5 10H28.5" stroke="black" stroke-width="1"></path><path d="M2 10L33 10" stroke="black" stroke-width="1" stroke-dasharray="4 4 "></path></svg>',
    name: "dotted-arrow",
  },
  {
    id: "arrow-type-3",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20" viewBox="0 0 46 20" fill="none"><path d="M36.5 2C36.5 2 38.5 6.66667 44.5 10C38.5 13.3333 36.5 18 36.5 18" stroke="black" stroke-width="1" stroke-linejoin="round"></path><path d="M44.5 10H33.5" stroke="black" stroke-width="1"></path><path d="M11 10L38 10" stroke="black" stroke-width="1"></path><path d="M9.5 18C9.5 18 7.5 13.3333 1.5 10C7.5 6.66667 9.5 2 9.5 2" stroke="black" stroke-width="1" stroke-linejoin="round"></path><path d="M1.5 10L12.5 10" stroke="black" stroke-width="1"></path></svg>',
    name: "doubleside-arrow",
  },
  {
    id: "arrow-type-4",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20" viewBox="0 0 46 20" fill="none"><path d="M36.5 2C36.5 2 38.5 6.66667 44.5 10C38.5 13.3333 36.5 18 36.5 18" stroke="black" stroke-width="1" stroke-linejoin="round"></path><path d="M44.5 10H33.5" stroke="black" stroke-width="1"></path><path d="M11 10L38 10" stroke="black" stroke-width="1" stroke-dasharray="4 4 "></path><path d="M9.5 18C9.5 18 7.5 13.3333 1.5 10C7.5 6.66667 9.5 2 9.5 2" stroke="black" stroke-width="1" stroke-linejoin="round"></path><path d="M1.5 10L12.5 10" stroke="black" stroke-width="1"></path></svg>',
    name: "doubleside-dotted-arrow",
  },
];

const arrowStyleOptions = [
  {
    name: "right-arrow",
    line: {
      stroke: "#e42527",
      sourceMarker: {
        d: "",
      },
      targetMarker: {
        d: "M8 0 0 5 8 10Z",
      },
    },
  },

  {
    name: "dotted-arrow",
    line: {
      stroke: "black",
      sourceMarker: {
        d: "",
      },
      targetMarker: {
        d: "M 8 0 L 0 5 L 8 10 Z",
      },
    },
  },
  {
    name: "doubleside-arrow",
    line: {
      stroke: "black",
      sourceMarker: {
        d: "",
      },
      targetMarker: {
        d: "M8 0 0 5 8 10Z",
      },
    },
  },
  {
    name: "doubleside-dotted-arrow",
    line: {
      stroke: "#000",
      sourceMarker: {
        d: "M 8 0 L 0 5 L 8 10 Z",
      },
      targetMarker: {
        d: "",
      },
    },
  },
];

const infobutton = elementTools.Control.extend({
  children: [
    {
      tagName: "image",
      selector: "handle",
      attributes: {
        cursor: "pointer",
        width: 20,
        height: 20,
        "xlink:href":
          "images/info.svg",
        x: -30,
        y: -30,
      },
    },
  ],
  initialize: function () {
    this.el.addEventListener("mousedown", this.handleMouseDown.bind(this));
  },

  handleMouseDown: function () {
    var box = document.getElementById("box"); 
    var childNodes = box.childNodes;
    for (var i = childNodes.length - 1; i >= 0; i--) {
        var child = childNodes[i];
        if (child.id !== "closebutton") {
            box.removeChild(child);
        }
    }
    container.style.display = "block";
    let modelIDd = this.el.getAttribute('model-id');
    let imageDiv = document.querySelector('[model-id ="' + modelIDd + '"]');
    let link = imageDiv.querySelector("image").getAttribute("xlink:href")
    let lastpart = link.split("/")[link.split("/").length - 1];
    let l = lastpart.split(".")[0].split(/[-_]/);
    let filteredArray = l.filter(item => !["light", "bg"].includes(item));
    let text = filteredArray.join(" "); 
    console.log(modelIDd)
    var image = document.createElement("img");
    image.id = "element";
    image.src = link; 
    image.style.width = "20%";
    image.style.height = "20%";
    image.style.position = "absolute";
    image.style.top = "0%";
    image.style.left = "10%";
    box.appendChild(image);
    var textElement = document.createElement("p");
    textElement.textContent = text;
    textElement.style.position = "absolute";
    textElement.style.top = "5%";
    textElement.style.left = "40%";
    textElement.style.fontSize = "16px";
    box.appendChild(textElement);
    var nameLabel = document.createElement("label");
    nameLabel.textContent = "Name:";
    nameLabel.style.position = "absolute";
    nameLabel.style.top = "18%";
    nameLabel.style.left = "10%";
    nameLabel.style.fontSize = "16px";
    box.appendChild(nameLabel);
    var nameTextbox = document.createElement("input");
    nameTextbox.type = "text";
    nameTextbox.style.position = "absolute";
    nameTextbox.style.top = "18%";
    nameTextbox.style.left = "35%";
    nameTextbox.style.width = "170px";
    box.appendChild(nameTextbox);
    var quantityLabel = document.createElement("label");
    quantityLabel.textContent = "Quantity:";
    quantityLabel.style.position = "absolute";
    quantityLabel.style.top = "28%";
    quantityLabel.style.left = "10%";
    quantityLabel.style.fontSize = "16px";
    box.appendChild(quantityLabel);
    var quantityTextbox = document.createElement("input");
    quantityTextbox.type = "text";
    quantityTextbox.style.position = "absolute";
    quantityTextbox.style.top = "28%";
    quantityTextbox.style.left = "35%";
    quantityTextbox.style.width = "170px";
    box.appendChild(quantityTextbox);
    var regionLabel = document.createElement("label");
    regionLabel.textContent = "Region:";
    regionLabel.style.position = "absolute";
    regionLabel.style.top = "38%";
    regionLabel.style.left = "10%";
    regionLabel.style.fontSize = "16px";
    box.appendChild(regionLabel);
    var regionTextbox = document.createElement("input");
    regionTextbox.type = "text";
    regionTextbox.style.position = "absolute";
    regionTextbox.style.top = "38%";
    regionTextbox.style.left = "35%";
    regionTextbox.style.width = "170px";
    box.appendChild(regionTextbox);
    var saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.style.position = "absolute";
    saveButton.style.top = "48%";
    saveButton.style.left = "30%";
    saveButton.style.fontSize = "16px";
    saveButton.addEventListener("click", function() {
      var currentjson = graph.toJSON();
      for (let i = 0; i < currentjson.cells.length; i++) {
        if (currentjson.cells[i].id == modelIDd) {
          currentjson.cells[i].attrs[".imagecell-label"].text = nameTextbox.value;
          if (quantityTextbox.value != "") {
            currentjson.cells[i].markup = "\n        <g joint-selector=\"cell-group\">\n        <rect width=\"80\" height=\"80\" fill=\"#fff\" stroke=\"#aaaaaa\" joint-selector=\"background\"/>\n        <circle r=\"10\" fill=\"#fff\" stroke=\"#aaaaaa\" joint-selector=\"count\"/>\n        <text x=\"0\" y=\"0\" font-size=\"12\" fill=\"#000\" text-anchor=\"middle\" dominant-baseline=\"middle\" joint-selector=\"count-text\">" + quantityTextbox.value + "</text>\n        <image width=\"60\" height=\"60\" joint-selector=\"image-cell\" />\n        <text font-size=\"14\" joint-selector=\"label\" display=\"block\" class=\"imagecell-label\"/>\n        </g>\n      ";
          }
          graph.fromJSON(currentjson);
          break;
        }
      }
    });
    box.appendChild(saveButton);
    var resetButton = document.createElement("button");
    resetButton.textContent = "Reset";
    resetButton.style.position = "absolute";
    resetButton.style.top = "48%";
    resetButton.style.left = "55%";
    resetButton.style.fontSize = "16px";
    resetButton.addEventListener("click", function() {
        nameTextbox.value = "";
        quantityTextbox.value = "";
        regionTextbox.value = "";
    });
    box.appendChild(resetButton);
  },
  
})

const ResizeTool = elementTools.Control.extend({
  children: [
    {
      tagName: "image",
      selector: "handle",
      attributes: {
        cursor: "pointer",
        width: 20,
        height: 20,
        "xlink:href":
          "images/resize.svg",
      },
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
        ry: 5,
      },
    },
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
      height: Math.max(coordinates.y - 10, 1),
    };

    model.resize(newSize.width, newSize.height);

    const childWidth = newSize.width;
    const childHeight = newSize.height;

    const childAttrs = {
      image: {
        width: childWidth - 15,
        height: childHeight - 15,
      },
      label: {},
    };
    if (model.attributes.type != "custom.CustomGroup") {
      model.attr("image", childAttrs.image);

      const parentAttrs = {
        rect: {
          width: childWidth,
          height: childHeight,
        },
      };

      model.attr(parentAttrs);
    }
  },
});

  // Create a rectangle for the selection boundary
  const selectionRectangle = document.createElement("div");
  selectionRectangle.classList.add("selection-div");
  selectionRectangle.style.position = "absolute";
  selectionRectangle.style.border = "1px dashed #000";
  selectionRectangle.style.pointerEvents = "none";
  paper.el.appendChild(selectionRectangle);

  var startX, startY, endX, endY;
  var isDragging = false;

  let selectedElements = [];

  // Create a "Group" button
  const groupButton = document.createElement("button");

  groupButton.style.position = "absolute";
  groupButton.style.top = "10px";
  groupButton.style.left = "10px";
  groupButton.style.display = "none";
  groupButton.classList.add("group-btn");
  paperContainer.append(groupButton);

  // Create an image element for the icon
  const groupImg = document.createElement("img");
  groupImg.src = "images/group.svg";
  groupImg.style.width = "20px";
  groupImg.style.height = "20px";
  groupButton.textContent = "";
  // Append the icon image to the button
  groupButton.appendChild(groupImg);
  let groupCounter = 0;

  // Function to create a group
  function createGroup(position, size) {
    const groupId = `group-${groupCounter++}`;
    const group = new joint.shapes.basic.Rect({
      size: size || { width: 100, height: 100 },
      position: position || { x: 100, y: 100 },
      attrs: {
        rect: {
          fill: "transparent",
          stroke: "#555",
          "stroke-dasharray": "5 5",
        },
        ".group-label": {
          text: "Group Name",
          "ref-x": 0.5,
          "ref-y": 1,
          "ref-dy": 10,
          "font-size": 14,
          "text-anchor": "middle",
          fill: "#000",
          cursor: "pointer",
        },
        ".ungroup-button": {
          cursor: "pointer",
        },
      },
      id: groupId,
      markup: `
        <g class="rotatable">
          <g class="scalable">
            <rect width="100" height="100" stroke="#555"/>
            <svg width="20" height="20" class="ungroup-btn" fill="#555" stroke="#555" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 3v7h20V3zm19 6H3V4h18zm-8 12h9v-9h-9zm1-8h7v7h-7zM2 21h9v-9H2zm1-8h7v7H3z"/><path fill="none" d="M0 0h24v24H0z"/>
          </svg>

          </g>
          <text class="group-label">Group Name</text>
        </g>
      `,
    });

    return group;
  }



  groupButton.addEventListener("click", groupSelectedElements);

  

  function groupSelectedElements() {
    if (selectedElements.length > 1) {
      const selectedGroupElements = {
        cells: [],
      };;
    

      selectedElements.forEach((element) => {
        if (element.attributes.type === 'custom.CustomGroup') {
          // Check if it has child elements
          const childElements = element.getEmbeddedCells();
          const filteredChildElements = childElements.filter((element) => element !== undefined);

          // Check if the element is not already in the selectedGroupElements array
          if (!selectedGroupElements.cells.includes(element)) {
            selectedGroupElements.cells.push(element.toJSON());
          }
          
          // Unembed child elements from the group
          element.unembed(filteredChildElements);
        }else{
          if(!selectedGroupElements.cells.includes(element)){

            selectedGroupElements.cells.push(element.toJSON());
          }
          
        }
      });
    


      const group = createGroup(
        { x: selectionRectangle.offsetLeft/zoomLevel, y: selectionRectangle.offsetTop/zoomLevel },
        {
          width: selectionRectangle.offsetWidth,
          height: selectionRectangle.offsetHeight,
        }
      );


      selectedElements.forEach((element) => {
        group.embed(element);
      });
      updateHistory();
      graph.addCell(group);
      group.attr(".label/text", "Group Name");
      updateHistory();

      selectedElements.forEach((element) => {
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
    selectionRectangle.style.display = "none"; // Hide the selection rectangle
  });

  // Update the pointermove event listener
  paper.el.addEventListener("pointermove", (e) => {
    if (isDragging) {
      endX = e.clientX - 300;
      endY = e.clientY - 50;
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
          return false; // Exclude the selection rectangle itself
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
      // Iterate over all links in the graph
      const linksInSelection = [];
      graph.getLinks().forEach((link) => {
        const sourceElement = graph.getCell(link.get("source").id);
        const targetElement = graph.getCell(link.get("target").id);

        // Check if any part of the arrow intersects with the selection rectangle
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
          // The link connects two selected elements or intersects with the selection rectangle, so include it
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
    startX = e.clientX - 300;
    startY = e.clientY - 50;
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

    // Don't reset selectedElements here
  });

  paper.el.addEventListener("pointerup", (e) => {
    if (isDragging) {
      isDragging = false;

      if (selectedElements.length === 0) {
        // If no elements are selected, hide the selection-div
        selectionRectangle.style.display = "none";
      }
    }
  });

// Define a custom group as a joint.dia.Element
joint.shapes.custom.CustomGroup =   joint.dia.Element.extend({
  defaults: joint.util.deepSupplement(
    {
      type: "custom.CustomGroup",
      size: { width: 400, height: 200 },
    },
    joint.dia.Element.prototype.defaults
  ),
});

var zoomLevel = 1;
var paperWidthPercentage = 110; 
var paperHeightPercentage = 110; 

// Create Zoom In and Zoom Out buttons
var zoomInButton = document.createElement("button");
zoomInButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" width="30px" height="30px"><path d="M75.35,62H67.93V54.54a2.48,2.48,0,0,0-5,0V62H55.56a2.48,2.48,0,1,0,0,4.95H63v7.42a2.48,2.48,0,0,0,5,0V66.91h7.42a2.48,2.48,0,0,0,0-4.95Z"/><path d="M112.1,108.27,86.89,83.06a28.5,28.5,0,1,0-5.09,4.6l25.45,25.45a3.25,3.25,0,0,0,4.6,0l.25-.24A3.25,3.25,0,0,0,112.1,108.27Zm-69-43.87A22.29,22.29,0,1,1,65.42,86.69,22.31,22.31,0,0,1,43.13,64.4Z"/></svg>`;
zoomInButton.id = "zoom-in";
zoomInButton.addEventListener("click", function () {
    zoomLevel += 0.1;
    paper.scale(zoomLevel, zoomLevel);
    paperWidthPercentage = paperWidthPercentage / zoomLevel;
    paperHeightPercentage = paperHeightPercentage / zoomLevel;
    // updateScroll();
});

var zoomOutButton = document.createElement("button");
zoomOutButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" width="30px" height="30px"><path d="M112.1,108.27,86.89,83.06a28.5,28.5,0,1,0-5.09,4.6l25.45,25.45a3.25,3.25,0,0,0,4.6,0l.25-.24A3.25,3.25,0,0,0,112.1,108.27ZM65.42,86.69A22.29,22.29,0,1,1,87.7,64.4,22.32,22.32,0,0,1,65.42,86.69Z"/><path d="M75.34,62h-20a2.5,2.5,0,0,0,0,5h20a2.5,2.5,0,0,0,0-5Z"/></svg>`;
zoomOutButton.id = "zoom-out";
zoomOutButton.addEventListener("click", function () {
    if (zoomLevel > 0.2) { // Limit minimum zoom level
        zoomLevel -= 0.1;
        paper.scale(zoomLevel, zoomLevel);
        paperWidthPercentage = paperWidthPercentage / zoomLevel;
        paperHeightPercentage = paperHeightPercentage / zoomLevel;
        // updateScroll();
    }
});

// Append buttons to the document
$(".tool-btns").append(zoomInButton);
$(".tool-btns").append(zoomOutButton);


var inputjson = {
 
  "Application Integration": [
    {
      "name": "Amazon Simple Notification Service SNS HTTP Notification",
      "path": "Application_Integration/Amazon-Simple-Notification-Service-SNS_HTTP-Notification_light-bg.svg"
    },
    {
      "name": "Amazon MQ",
      "path": "Application_Integration/Amazon-MQ.svg"
    },
    {
      "name": "Amazon Simple Queue Service SQS",
      "path": "Application_Integration/Amazon-Simple-Queue-Service-SQS_light-bg.svg"
    },
    {
      "name": "AWS AppSync",
      "path": "Application_Integration/AWS-AppSync.svg"
    },
    {
      "name": "Amazon Simple Notification Service SNS",
      "path": "Application_Integration/Amazon-Simple-Notification-Service-SNS_light-bg.svg"
    },
    {
      "name": "Amazon Simple Queue Service SQS",
      "path": "Application_Integration/Amazon-Simple-Queue-Service-SQS.svg"
    },
    {
      "name": "Amazon Simple Notification Service SNS Email Notification",
      "path": "Application_Integration/Amazon-Simple-Notification-Service-SNS_Email-Notification_light-bg.svg"
    },
    {
      "name": "Amazon Simple Notification Service SNS Topic",
      "path": "Application_Integration/Amazon-Simple-Notification-Service-SNS_Topic_light-bg.svg"
    },
    {
      "name": "AWS Step Functions",
      "path": "Application_Integration/AWS-Step-Functions.svg"
    },
    {
      "name": "Amazon Simple Queue Service SQS Queue",
      "path": "Application_Integration/Amazon-Simple-Queue-Service-SQS_Queue_light-bg.svg"
    },
    {
      "name": "Amazon Simple Queue Service SQS Message",
      "path": "Application_Integration/Amazon-Simple-Queue-Service-SQS_Message_light-bg.svg"
    }
  ],
  "Customer Engagement": [
    {
      "name": "Customer Engagement",
      "path": "Customer_Engagement/Customer-Engagement.svg"
    },
    {
      "name": "Amazon Pinpoint",
      "path": "Customer_Engagement/Amazon-Pinpoint.svg"
    },
    {
      "name": "Amazon Simple Email Service SES",
      "path": "Customer_Engagement/Amazon-Simple-Email-Service-SES.svg"
    },
    {
      "name": "Amazon Simple Email Service SES Email",
      "path": "Customer_Engagement/Amazon-Simple-Email-Service-SES_Email_light-bg.svg"
    },
    {
      "name": "Amazon Connect",
      "path": "Customer_Engagement/Amazon-Connect.svg"
    }
  ],
  "Database": [
    {
      "name": "Amazon ElastiCache For Redis",
      "path": "Database/Amazon-ElastiCache_For-Redis_light-bg.svg"
    },
    {
      "name": "Amazon DynamoDB Attribute",
      "path": "Database/Amazon-DynamoDB_Attribute_light-bg.svg"
    },
    {
      "name": "Amazon ElastiCache Cache Node",
      "path": "Database/Amazon-ElastiCache_Cache-Node_light-bg.svg"
    },
    {
      "name": "Amazon DynamoDB Items",
      "path": "Database/Amazon-DynamoDB_Items_light-bg.svg"
    },
    {
      "name": "Amazon Timestream",
      "path": "Database/Amazon-Timestream_light-bg.svg"
    },
    {
      "name": "Amazon DynamoDB Item",
      "path": "Database/Amazon-DynamoDB_Item_light-bg.svg"
    },
    {
      "name": "AWS Database Migration Service Database Migration Workflow",
      "path": "Database/AWS-Database-Migration-Service_Database-Migration-Workflow_light-bg.svg"
    },
    {
      "name": "Amazon Quantum Ledger Database QLDB",
      "path": "Database/Amazon-Quantum-Ledger-Database_QLDB_light-bg.svg"
    },
    {
      "name": "Amazon Timestream",
      "path": "Database/Amazon-Timestream.svg"
    },
    {
      "name": "Amazon DynamoDB Attributes",
      "path": "Database/Amazon-DynamoDB_Attributes_light-bg.svg"
    },
    {
      "name": "Amazon Aurora",
      "path": "Database/Amazon-Aurora_light-bg.svg"
    },
    {
      "name": "Amazon Neptune",
      "path": "Database/Amazon-Neptune_light-bg.svg"
    },
    {
      "name": "Amazon DynamoDB",
      "path": "Database/Amazon-DynamoDB_light-bg.svg"
    },
    {
      "name": "AWS Database Migration Service",
      "path": "Database/AWS-Database-Migration-Service.svg"
    },
    {
      "name": "Amazon RDS on VMware",
      "path": "Database/Amazon-RDS-on-VMware_light-bg.svg"
    },
    {
      "name": "Amazon Redshift Dense Storage Node",
      "path": "Database/Amazon-Redshift_Dense-Storage-Node_light-bg.svg"
    },
    {
      "name": "Amazon Redshift",
      "path": "Database/Amazon-Redshift_light-bg.svg"
    },
    {
      "name": "Amazon ElastiCache",
      "path": "Database/Amazon-ElastiCache_light-bg.svg"
    },
    {
      "name": "Amazon ElastiCache For Memcached",
      "path": "Database/Amazon-ElastiCache_For-Memcached_light-bg.svg"
    },
    {
      "name": "Amazon DocumentDB with MongoDB compatibility",
      "path": "Database/Amazon-DocumentDB-with-MongoDB-compatibility_light-bg.svg"
    },
    {
      "name": "Amazon DynamoDB Global Secondary Index",
      "path": "Database/Amazon-DynamoDB_Global-Secondary-Index_light-bg.svg"
    },
    {
      "name": "Amazon Redshift Dense Compute Node",
      "path": "Database/Amazon-Redshift_Dense-Compute-Node_light-bg.svg"
    },
    {
      "name": "Amazon DynamoDB Table",
      "path": "Database/Amazon-DynamoDB_Table_light-bg.svg"
    },
    {
      "name": "Amazon RDS",
      "path": "Database/Amazon-RDS.svg"
    }
  ],
  "Group Icons": [
    {
      "name": "Spot Fleet",
      "path": "Group_Icons/Spot-Fleet_dark-bg.svg",
      "groupCheck": "true",
    },
    {
      "name": "Elastic Beanstalk container",
      "path": "Group_Icons/Elastic-Beanstalk-container_dark-bg.svg",
      "groupCheck": "true",
    },
    {
      "name": "VPC subnet public",
      "path": "Group_Icons/VPC-subnet-public_dark-bg.svg",
      "groupCheck": "true",
    },
    {
      "name": "EC2 instance contents",
      "path": "Group_Icons/EC2-instance-contents_dark-bg.svg",
      "groupCheck": "true",
    },
    {
      "name": "Corporate data center",
      "path": "Group_Icons/Corporate-data-center_dark-bg.svg",
      "groupCheck": "true",
    },
    {
      "name": "Corporate data center",
      "path": "Group_Icons/Corporate-data-center_light-bg.svg",
      "groupCheck": "true",
    },
    {
      "name": "EC2 instance contents",
      "path": "Group_Icons/EC2-instance-contents_light-bg.svg",
      "groupCheck": "true",
    },
    {
      "name": "Region",
      "path": "Group_Icons/Region_light-bg.svg",
      "groupCheck": "true",
    },
    {
      "name": "Server contents",
      "path": "Group_Icons/Server-contents_light-bg.svg",
      "groupCheck": "true",
    },
    {
      "name": "VPC subnet private",
      "path": "Group_Icons/VPC-subnet-private_dark-bg.svg",
      "groupCheck": "true",
    },
    {
      "name": "Server contents",
      "path": "Group_Icons/Server-contents_dark-bg.svg"
    },
    {
      "name": "Region",
      "path": "Group_Icons/Region_dark-bg.svg",
      "groupCheck": "true",
    },
    {
      "name": "Elastic Beanstalk container",
      "path": "Group_Icons/Elastic-Beanstalk-container_light-bg.svg",
      "groupCheck": "true",
    },
    {
      "name": "Auto Scaling",
      "path": "Group_Icons/Auto-Scaling_dark-bg.svg",
      "groupCheck": "true",
    },
    {
      "name": "AWS Step Function",
      "path": "Group_Icons/AWS-Step-Function_light-bg.svg",
      "groupCheck": "true",
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
      "groupCheck": "true",
    },
    {
      "name": "Virtual private cloud VPC",
      "path": "Group_Icons/Virtual-private-cloud-VPC_light-bg.svg",
      "groupCheck": "true",
    },
    {
      "name": "Virtual private cloud VPC",
      "path": "Group_Icons/Virtual-private-cloud-VPC_dark-bg.svg",
      "groupCheck": "true",
    },
    {
      "name": "Spot Fleet",
      "path": "Group_Icons/Spot-Fleet_light-bg.svg",
      "groupCheck": "true",
    },
    {
      "name": "AWS Step Function",
      "path": "Group_Icons/AWS-Step-Function_dark-bg.svg",
      "groupCheck": "true",
    }
  ],
  "General AWS Light": [
    {
      "name": "AWS General Internet Gateway",
      "path": "General_AWS_Light/AWS-General_Internet-Gateway_light-bg.svg"
    },
    {
      "name": "AWS General SAML Token",
      "path": "General_AWS_Light/AWS-General_SAML-Token_light-bg.svg"
    },
    {
      "name": "AWS Cloud",
      "path": "General_AWS_Light/AWS-Cloud_dark-bg.svg"
    },
    {
      "name": "AWS General Disk",
      "path": "General_AWS_Light/AWS-General_Disk_light-bg.svg"
    },
    {
      "name": "AWS General Multimedia",
      "path": "General_AWS_Light/AWS-General_Multimedia_light-bg.svg"
    },
    {
      "name": "AWS General SSL Padlock",
      "path": "General_AWS_Light/AWS-General_SSL-Padlock_light-bg.svg"
    },
    {
      "name": "AWS Cloud alt",
      "path": "General_AWS_Light/AWS-Cloud-alt_dark-bg.svg"
    },
    {
      "name": "AWS General SDK",
      "path": "General_AWS_Light/AWS-General_SDK_light-bg.svg"
    },
    {
      "name": "AWS General Virtual Private Cloud",
      "path": "General_AWS_Light/AWS-General_Virtual-Private-Cloud_light-bg.svg"
    },
    {
      "name": "AWS General Corporate Data Center",
      "path": "General_AWS_Light/AWS-General_Corporate-Data-Center_light-bg.svg"
    },
    {
      "name": "AWS General Generic Database",
      "path": "General_AWS_Light/AWS-General_Generic-Database_light-bg.svg"
    },
    {
      "name": "AWS General Users",
      "path": "General_AWS_Light/AWS-General_Users_light-bg.svg"
    },
    {
      "name": "AWS General User",
      "path": "General_AWS_Light/AWS-General_User_light-bg.svg"
    },
    {
      "name": "AWS General Client",
      "path": "General_AWS_Light/AWS-General_Client_light-bg.svg"
    },
    {
      "name": "AWS General Mobile Client",
      "path": "General_AWS_Light/AWS-General_Mobile-Client_light-bg.svg"
    },
    {
      "name": "AWS General AWS Cloud",
      "path": "General_AWS_Light/AWS-General_AWS-Cloud_light-bg.svg"
    },
    {
      "name": "AWS General Internet Alt1  2",
      "path": "General_AWS_Light/AWS-General_Internet-Alt1_light-bg 2.svg"
    },
    {
      "name": "AWS General Forums",
      "path": "General_AWS_Light/AWS-General_Forums_light-bg.svg"
    },
    {
      "name": "AWS General Toolkit",
      "path": "General_AWS_Light/AWS-General_Toolkit_light-bg.svg"
    },
    {
      "name": "AWS General Office Building",
      "path": "General_AWS_Light/AWS-General_Office-Building_light-bg.svg"
    },
    {
      "name": "AWS General Tape Storage",
      "path": "General_AWS_Light/AWS-General_Tape-Storage_light-bg.svg"
    },
    {
      "name": "AWS General Internet Alt2",
      "path": "General_AWS_Light/AWS-General_Internet-Alt2_light-bg.svg"
    },
    {
      "name": "AWS General Traditional Server",
      "path": "General_AWS_Light/AWS-General_Traditional-Server_light-bg.svg"
    }
  ],
  "Security Identity and Compliance": [
    {
      "name": "AWS Identity and Access Management IAM Encrypted Data",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_Encrypted-Data_light-bg.svg"
    },
    {
      "name": "AWS Identity and Access Management IAM AWS STS Alternate",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_AWS-STS-Alternate_light-bg.svg"
    },
    {
      "name": "AWS Identity and Access Management IAM Temporary Security Credential",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_Temporary-Security-Credential_light-bg.svg"
    },
    {
      "name": "Amazon Cognito",
      "path": "Security_Identity_and_Compliance/Amazon-Cognito.svg"
    },
    {
      "name": "Amazon Inspector Agent",
      "path": "Security_Identity_and_Compliance/Amazon-Inspector_Agent_light-bg.svg"
    },
    {
      "name": "AWS Shield",
      "path": "Security_Identity_and_Compliance/AWS-Shield.svg"
    },
    {
      "name": "Amazon Macie",
      "path": "Security_Identity_and_Compliance/Amazon-Macie.svg"
    },
    {
      "name": "AWS Identity and Access Management IAM AWS STS",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_AWS-STS_light-bg.svg"
    },
    {
      "name": "AWS Organizations Organizational Unit",
      "path": "Security_Identity_and_Compliance/AWS-Organizations_Organizational-Unit_light-bg.svg"
    },
    {
      "name": "AWS Identity and Access Management IAM MFA Token",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_MFA-Token_light-bg.svg"
    },
    {
      "name": "AWS Single Sign On",
      "path": "Security_Identity_and_Compliance/AWS-Single-Sign-On.svg"
    },
    {
      "name": "AWS Organizations Account",
      "path": "Security_Identity_and_Compliance/AWS-Organizations_Account_light-bg.svg"
    },
    {
      "name": "AWS Organizations",
      "path": "Security_Identity_and_Compliance/AWS-Organizations.svg"
    },
    {
      "name": "AWS Identity and Access Management IAM Data Encryption Key",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_Data-Encryption-Key_light-bg.svg"
    },
    {
      "name": "AWS Identity and Access Management IAM Add on",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_Add-on_light-bg.svg"
    },
    {
      "name": "AWS Identity and Access Management IAM Long term Security Credential",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_Long-term-Security-Credential_light-bg.svg"
    },
    {
      "name": "AWS WAF",
      "path": "Security_Identity_and_Compliance/AWS-WAF.svg"
    },
    {
      "name": "AWS Identity and Access Management IAM Role",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_Role_light-bg.svg"
    },
    {
      "name": "AWS Directory Service",
      "path": "Security_Identity_and_Compliance/AWS-Directory-Service.svg"
    },
    {
      "name": "AWS Shield Shield Advanced",
      "path": "Security_Identity_and_Compliance/AWS-Shield_Shield-Advanced_light-bg.svg"
    },
    {
      "name": "AWS Identity and Access Management IAM Permissions",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management-IAM_Permissions_light-bg.svg"
    },
    {
      "name": "Security Identity and Compliance",
      "path": "Security_Identity_and_Compliance/Security-Identity-and-Compliance.svg"
    },
    {
      "name": "AWS Certificate Manager Certificate Manager",
      "path": "Security_Identity_and_Compliance/AWS-Certificate-Manager_Certificate-Manager_light-bg.svg"
    },
    {
      "name": "AWS Certificate Manager",
      "path": "Security_Identity_and_Compliance/AWS-Certificate-Manager.svg"
    },
    {
      "name": "AWS Identity and Access Management IAM",
      "path": "Security_Identity_and_Compliance/AWS-Identity-and-Access-Management_IAM.svg"
    },
    {
      "name": "AWS Firewall Manager",
      "path": "Security_Identity_and_Compliance/AWS-Firewall-Manager.svg"
    },
    {
      "name": "AWS CloudHSM",
      "path": "Security_Identity_and_Compliance/AWS-CloudHSM.svg"
    },
    {
      "name": "Amazon Cloud Directory",
      "path": "Security_Identity_and_Compliance/Amazon-Cloud-Directory.svg"
    },
    {
      "name": "AWS Key Management Service",
      "path": "Security_Identity_and_Compliance/AWS-Key-Management-Service.svg"
    },
    {
      "name": "AWS Security Hub",
      "path": "Security_Identity_and_Compliance/AWS-Security-Hub.svg"
    },
    {
      "name": "AWS Artifact",
      "path": "Security_Identity_and_Compliance/AWS-Artifact.svg"
    },
    {
      "name": "AWS Resource Access Manager",
      "path": "Security_Identity_and_Compliance/AWS-Resource-Access-Manager.svg"
    },
    {
      "name": "AWS Secrets Manager",
      "path": "Security_Identity_and_Compliance/AWS-Secrets-Manager.svg"
    },
    {
      "name": "AWS WAF Filtering rule",
      "path": "Security_Identity_and_Compliance/AWS-WAF_Filtering-rule_light-bg.svg"
    },
    {
      "name": "Amazon GuardDuty",
      "path": "Security_Identity_and_Compliance/Amazon-GuardDuty.svg"
    }
  ],
  "Media Services": [
    {
      "name": "Media Services",
      "path": "Media_Services/Media-Services_light-bg.svg"
    },
    {
      "name": "Amazon Kinesis Video Streams",
      "path": "Media_Services/Amazon-Kinesis-Video-Streams.svg"
    },
    {
      "name": "AWS Elemental MediaStore",
      "path": "Media_Services/AWS-Elemental-MediaStore.svg"
    },
    {
      "name": "Amazon Elastic Transcoder",
      "path": "Media_Services/Amazon-Elastic-Transcoder.svg"
    },
    {
      "name": "AWS Elemental MediaConvert",
      "path": "Media_Services/AWS-Elemental-MediaConvert.svg"
    },
    {
      "name": "AWS Elemental MediaTailor",
      "path": "Media_Services/AWS-Elemental-MediaTailor.svg"
    },
    {
      "name": "AWS Elemental MediaPackage",
      "path": "Media_Services/AWS-Elemental-MediaPackage.svg"
    },
    {
      "name": "AWS Elemental MediaLive",
      "path": "Media_Services/AWS-Elemental-MediaLive.svg"
    },
    {
      "name": "AWS Elemental MediaConnect",
      "path": "Media_Services/AWS-Elemental-MediaConnect.svg"
    }
  ],
  "Management and Governance": [
    {
      "name": "AWS Trusted Advisor Checklist",
      "path": "Management_and_Governance/AWS-Trusted-Advisor_Checklist_light-bg.svg"
    },
    {
      "name": "AWS License Manager",
      "path": "Management_and_Governance/AWS-License-Manager.svg"
    },
    {
      "name": "AWS Systems Manager State Manager",
      "path": "Management_and_Governance/AWS-Systems-Manager_State-Manager_light-bg.svg"
    },
    {
      "name": "AWS Managed Services",
      "path": "Management_and_Governance/AWS-Managed-Services.svg"
    },
    {
      "name": "AWS Personal Health Dashboard",
      "path": "Management_and_Governance/AWS-Personal-Health-Dashboard.svg"
    },
    {
      "name": "AWS CloudFormation",
      "path": "Management_and_Governance/AWS-CloudFormation.svg"
    },
    {
      "name": "AWS Systems Manager Automation",
      "path": "Management_and_Governance/AWS-Systems-Manager_Automation_light-bg.svg"
    },
    {
      "name": "Amazon CloudWatch Rule",
      "path": "Management_and_Governance/Amazon-CloudWatch_Rule_light-bg.svg"
    },
    {
      "name": "AWS Trusted Advisor",
      "path": "Management_and_Governance/AWS-Trusted-Advisor.svg"
    },
    {
      "name": "AWS CloudFormation Change Set",
      "path": "Management_and_Governance/AWS-CloudFormation_Change-Set_light-bg.svg"
    },
    {
      "name": "AWS Trusted Advisor Checklist Performance",
      "path": "Management_and_Governance/AWS-Trusted-Advisor_Checklist-Performance_light-bg.svg"
    },
    {
      "name": "AWS Auto Scaling",
      "path": "Management_and_Governance/AWS-Auto-Scaling.svg"
    },
    {
      "name": "AWS OpsWorks",
      "path": "Management_and_Governance/AWS-OpsWorks.svg"
    },
    {
      "name": "AWS OpsWorks Instances",
      "path": "Management_and_Governance/AWS-OpsWorks_Instances_light-bg.svg"
    },
    {
      "name": "AWS OpsWorks Stack2",
      "path": "Management_and_Governance/AWS-OpsWorks_Stack2_light-bg.svg"
    },
    {
      "name": "AWS Command Line Interface",
      "path": "Management_and_Governance/AWS-Command-Line-Interface.svg"
    },
    {
      "name": "AWS Systems Manager Maintenance Windows",
      "path": "Management_and_Governance/AWS-Systems-Manager_Maintenance-Windows_light-bg.svg"
    },
    {
      "name": "AWS Systems Manager Parameter Store",
      "path": "Management_and_Governance/AWS-Systems-Manager_Parameter-Store_light-bg.svg"
    },
    {
      "name": "AWS Trusted Advisor Checklist Cost",
      "path": "Management_and_Governance/AWS-Trusted-Advisor_Checklist-Cost_light-bg.svg"
    },
    {
      "name": "Amazon CloudWatch Event Event Based",
      "path": "Management_and_Governance/Amazon-CloudWatch_Event-Event-Based_light-bg.svg"
    },
    {
      "name": "Amazon CloudWatch",
      "path": "Management_and_Governance/Amazon-CloudWatch.svg"
    },
    {
      "name": "AWS Trusted Advisor Checklist Security",
      "path": "Management_and_Governance/AWS-Trusted-Advisor_Checklist-Security_light-bg.svg"
    },
    {
      "name": "AWS OpsWorks Resources",
      "path": "Management_and_Governance/AWS-OpsWorks_Resources_light-bg.svg"
    },
    {
      "name": "AWS Control Tower",
      "path": "Management_and_Governance/AWS-Control-Tower.svg"
    },
    {
      "name": "AWS Systems Manager Run Command",
      "path": "Management_and_Governance/AWS-Systems-Manager_Run-Command_light-bg.svg"
    },
    {
      "name": "AWS OpsWorks Deployments",
      "path": "Management_and_Governance/AWS-OpsWorks_Deployments_light-bg.svg"
    },
    {
      "name": "AWS Config",
      "path": "Management_and_Governance/AWS-Config.svg"
    },
    {
      "name": "AWS CloudFormation Template",
      "path": "Management_and_Governance/AWS-CloudFormation_Template_light-bg.svg"
    },
    {
      "name": "AWS CloudFormation Stack",
      "path": "Management_and_Governance/AWS-CloudFormation_Stack_light-bg.svg"
    },
    {
      "name": "AWS Systems Manager Patch Manager",
      "path": "Management_and_Governance/AWS-Systems-Manager_Patch-Manager_light-bg.svg"
    },
    {
      "name": "Amazon CloudWatch Alarm",
      "path": "Management_and_Governance/Amazon-CloudWatch_Alarm_light-bg.svg"
    },
    {
      "name": "AWS OpsWorks Apps",
      "path": "Management_and_Governance/AWS-OpsWorks_Apps_light-bg.svg"
    },
    {
      "name": "AWS Service Catalog",
      "path": "Management_and_Governance/AWS-Service-Catalog.svg"
    },
    {
      "name": "AWS Management Console",
      "path": "Management_and_Governance/AWS-Management-Console.svg"
    },
    {
      "name": "AWS OpsWorks Layers",
      "path": "Management_and_Governance/AWS-OpsWorks_Layers_light-bg.svg"
    },
    {
      "name": "AWS OpsWorks Monitoring",
      "path": "Management_and_Governance/AWS-OpsWorks_Monitoring_light-bg.svg"
    },
    {
      "name": "AWS OpsWorks Permissions",
      "path": "Management_and_Governance/AWS-OpsWorks_Permissions_light-bg.svg"
    },
    {
      "name": "AWS Systems Manager",
      "path": "Management_and_Governance/AWS-Systems-Manager.svg"
    },
    {
      "name": "AWS Control Tower",
      "path": "Management_and_Governance/AWS-Control-Tower_light-bg.svg"
    },
    {
      "name": "Management and Governance",
      "path": "Management_and_Governance/Management-and-Governance.svg"
    },
    {
      "name": "Amazon CloudWatch Event Time Based",
      "path": "Management_and_Governance/Amazon-CloudWatch_Event-Time-Based_light-bg.svg"
    },
    {
      "name": "AWS Well Architected Tool",
      "path": "Management_and_Governance/AWS-Well-Architected-Tool.svg"
    },
    {
      "name": "AWS Systems Manager Inventory",
      "path": "Management_and_Governance/AWS-Systems-Manager_Inventory_light-bg.svg"
    },
    {
      "name": "AWS CloudTrail",
      "path": "Management_and_Governance/AWS-CloudTrail.svg"
    },
    {
      "name": "AWS Systems Manager Documents",
      "path": "Management_and_Governance/AWS-Systems-Manager_Documents_light-bg.svg"
    },
    {
      "name": "AWS Trusted Advisor Checklist Fault Tolerant",
      "path": "Management_and_Governance/AWS-Trusted-Advisor_Checklist-Fault-Tolerant_light-bg.svg"
    }
  ],
  "Robotics": [
    {
      "name": "AWS RoboMaker Development Environment",
      "path": "Robotics/AWS-RoboMaker_Development-Environment_light-bg.svg"
    },
    {
      "name": "AWS RoboMaker",
      "path": "Robotics/AWS-RoboMaker.svg"
    },
    {
      "name": "AWS RoboMaker Fleet Management",
      "path": "Robotics/AWS-RoboMaker_Fleet-Management_light-bg.svg"
    },
    {
      "name": "AWS RoboMaker Cloud Extension ROS",
      "path": "Robotics/AWS-RoboMaker_Cloud-Extension-ROS_light-bg.svg"
    },
    {
      "name": "AWS RoboMaker Simulation",
      "path": "Robotics/AWS-RoboMaker_Simulation_light-bg.svg"
    }
  ],
  "Machine Learning": [
    {
      "name": "AWS DeepLens",
      "path": "Machine_Learning/AWS-DeepLens.svg"
    },
    {
      "name": "Amazon Textract",
      "path": "Machine_Learning/Amazon-Textract.svg"
    },
    {
      "name": "Amazon Personalize",
      "path": "Machine_Learning/Amazon-Personalize.svg"
    },
    {
      "name": "Amazon SageMaker",
      "path": "Machine_Learning/Amazon-SageMaker.svg"
    },
    {
      "name": "Amazon Translate",
      "path": "Machine_Learning/Amazon-Translate.svg"
    },
    {
      "name": "Amazon SageMaker Model",
      "path": "Machine_Learning/Amazon-SageMaker_Model_light-bg.svg"
    },
    {
      "name": "Machine Learning",
      "path": "Machine_Learning/Machine-Learning.svg"
    },
    {
      "name": "Amazon Forecast",
      "path": "Machine_Learning/Amazon-Forecast.svg"
    },
    {
      "name": "Amazon Comprehend",
      "path": "Machine_Learning/Amazon-Comprehend.svg"
    },
    {
      "name": "Amazon Lex",
      "path": "Machine_Learning/Amazon-Lex.svg"
    },
    {
      "name": "AWS DeepRacer",
      "path": "Machine_Learning/AWS-DeepRacer.svg"
    },
    {
      "name": "Amazon Elastic Inference",
      "path": "Machine_Learning/Amazon-Elastic-Inference.svg"
    },
    {
      "name": "AWS Deep Learning AMIs",
      "path": "Machine_Learning/AWS-Deep-Learning-AMIs.svg"
    },
    {
      "name": "Amazon Transcribe",
      "path": "Machine_Learning/Amazon-Transcribe.svg"
    },
    {
      "name": "Apache MXNet on AWS",
      "path": "Machine_Learning/Apache-MXNet-on-AWS.svg"
    },
    {
      "name": "Amazon Polly",
      "path": "Machine_Learning/Amazon-Polly.svg"
    },
    {
      "name": "Amazon SageMaker Notebook",
      "path": "Machine_Learning/Amazon-SageMaker_Notebook_light-bg.svg"
    },
    {
      "name": "Amazon Rekognition",
      "path": "Machine_Learning/Amazon-Rekognition.svg"
    },
    {
      "name": "Amazon SageMaker Train",
      "path": "Machine_Learning/Amazon-SageMaker_Train_light-bg.svg"
    }
  ],
  "Game Tech": [
    {
      "name": "Amazon GameLift",
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
      "name": "AWS Ground Station",
      "path": "Satelitte/AWS-Ground-Station.svg"
    }
  ],
  "AR and VR": [
    {
      "name": "AR VR",
      "path": "AR_and_VR/AR-VR.svg"
    },
    {
      "name": "Amazon Sumerian",
      "path": "AR_and_VR/Amazon-Sumerian.svg"
    }
  ],
  "Storage": [
    {
      "name": "Amazon Elastic Block Store EBS",
      "path": "Storage/Amazon-Elastic-Block-Store-EBS_light-bg.svg"
    },
    {
      "name": "AWS Storage Gateway Virtual Tape Library",
      "path": "Storage/AWS-Storage-Gateway_Virtual-Tape-Library_light-bg.svg"
    },
    {
      "name": "Amazon Simple Storage Service S3",
      "path": "Storage/Amazon-Simple-Storage-Service-S3_light-bg.svg"
    },
    {
      "name": "AWS Storage Gateway",
      "path": "Storage/AWS-Storage-Gateway.svg"
    },
    {
      "name": "Amazon Simple Storage Service S3 Bucket",
      "path": "Storage/Amazon-Simple-Storage-Service-S3_Bucket_light-bg.svg"
    },
    {
      "name": "AWS Storage Gateway Cached Volume",
      "path": "Storage/AWS-Storage-Gateway_Cached-Volume_light-bg.svg"
    },
    {
      "name": "AWS Snowball",
      "path": "Storage/AWS-Snowball.svg"
    },
    {
      "name": "Amazon S3 Glacier",
      "path": "Storage/Amazon-S3-Glacier.svg"
    },
    {
      "name": "Amazon Elastic File System EFS",
      "path": "Storage/Amazon-Elastic-File-System_EFS.svg"
    },
    {
      "name": "AWS Snowball Edge",
      "path": "Storage/AWS-Snowball-Edge.svg"
    },
    {
      "name": "Amazon Simple Storage Service S3 Bucket with Objects",
      "path": "Storage/Amazon-Simple-Storage-Service-S3_Bucket-with-Objects_light-bg.svg"
    },
    {
      "name": "Amazon FSx for Windows File Server",
      "path": "Storage/Amazon-FSx-for-Windows-File-Server_light-bg.svg"
    },
    {
      "name": "AWS Storage Gateway Non Cached Volume",
      "path": "Storage/AWS-Storage-Gateway_Non-Cached-Volume_light-bg.svg"
    },
    {
      "name": "Amazon FSx",
      "path": "Storage/Amazon-FSx.svg"
    },
    {
      "name": "Amazon Elastic Block Store EBS",
      "path": "Storage/Amazon-Elastic-Block-Store-EBS.svg"
    },
    {
      "name": "AWS Backup",
      "path": "Storage/AWS-Backup.svg"
    },
    {
      "name": "AWS Snowball",
      "path": "Storage/AWS-Snowball_light-bg.svg"
    },
    {
      "name": "Amazon FSx for Lustre",
      "path": "Storage/Amazon-FSx-for-Lustre.svg"
    },
    {
      "name": "Amazon Simple Storage Service S3 Object",
      "path": "Storage/Amazon-Simple-Storage-Service-S3_Object_light-bg.svg"
    },
    {
      "name": "Amazon Simple Storage Service S3",
      "path": "Storage/Amazon-Simple-Storage-Service-S3.svg"
    },
    {
      "name": "Amazon Elastic Block Store EBS Snapshot",
      "path": "Storage/Amazon-Elastic-Block-Store-EBS_Snapshot_light-bg.svg"
    },
    {
      "name": "Amazon S3 Glacier Archive",
      "path": "Storage/Amazon-S3-Glacier_Archive_light-bg.svg"
    },
    {
      "name": "AWS Snowmobile",
      "path": "Storage/AWS-Snowmobile.svg"
    },
    {
      "name": "Amazon S3 Glacier Vault",
      "path": "Storage/Amazon-S3-Glacier_Vault_light-bg.svg"
    },
    {
      "name": "AWS Snow Family Snowball Import Export",
      "path": "Storage/AWS-Snow-Family_Snowball-Import-Export_light-bg.svg"
    },
    {
      "name": "Amazon Elastic Block Store EBS Volume",
      "path": "Storage/Amazon-Elastic-Block-Store-EBS_Volume_light-bg.svg"
    }
  ],
  "Developer Tools": [
    {
      "name": "AWS X Ray",
      "path": "Developer_Tools/AWS-X-Ray.svg"
    },
    {
      "name": "AWS Command Line Interface",
      "path": "Developer_Tools/AWS-Command-Line-Interface.svg"
    },
    {
      "name": "AWS Cloud9",
      "path": "Developer_Tools/AWS-Cloud9.svg"
    },
    {
      "name": "AWS CodeCommit",
      "path": "Developer_Tools/AWS-CodeCommit.svg"
    },
    {
      "name": "AWS Tools And SDKs",
      "path": "Developer_Tools/AWS-Tools-And-SDKs.svg"
    },
    {
      "name": "Developer Tools",
      "path": "Developer_Tools/Developer-Tools.svg"
    },
    {
      "name": "AWS CodeDeploy",
      "path": "Developer_Tools/AWS-CodeDeploy.svg"
    },
    {
      "name": "AWS CodePipeline",
      "path": "Developer_Tools/AWS-CodePipeline.svg"
    },
    {
      "name": "AWS CodeBuild",
      "path": "Developer_Tools/AWS-CodeBuild.svg"
    },
    {
      "name": "AWS CodeStar",
      "path": "Developer_Tools/AWS-CodeStar.svg"
    }
  ],
  "Blockchain": [
    {
      "name": "Amazon Managed Blockchain",
      "path": "Blockchain/Amazon-Managed-Blockchain.svg"
    },
    {
      "name": "Amazon Quantum Ledger Database QLDB",
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
      "name": "AWS IoT Greengrass",
      "path": "Internet_Of_Things/AWS-IoT-Greengrass.svg"
    },
    {
      "name": "AWS IoT Analytics",
      "path": "Internet_Of_Things/AWS-IoT-Analytics.svg"
    },
    {
      "name": "IoT Thermostat",
      "path": "Internet_Of_Things/IoT_Thermostat_light-bg.svg"
    },
    {
      "name": "AWS IoT 1 Click",
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
      "name": "AWS IoT Events",
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
      "name": "AWS IoT SiteWise",
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
      "name": "Amazon FreeRTOS",
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
      "name": "AWS IoT Core",
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
      "name": "AWS IoT Things Graph",
      "path": "Internet_Of_Things/AWS-IoT-Things-Graph.svg"
    },
    {
      "name": "IoT Actuator",
      "path": "Internet_Of_Things/IoT_Actuator_light-bg.svg"
    },
    {
      "name": "AWS IoT Device Defender",
      "path": "Internet_Of_Things/AWS-IoT-Device-Defender.svg"
    },
    {
      "name": "IoT HTTP 2 Protocol",
      "path": "Internet_Of_Things/IoT_HTTP-2-Protocol_light-bg.svg"
    },
    {
      "name": "AWS IoT Device Management",
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
      "name": "AWS IoT Button",
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
      "name": "AWS AppSync",
      "path": "Mobile/AWS-AppSync.svg"
    },
    {
      "name": "AWS Device Farm",
      "path": "Mobile/AWS-Device-Farm.svg"
    },
    {
      "name": "Amazon API Gateway",
      "path": "Mobile/Amazon-API-Gateway.svg"
    },
    {
      "name": "Amazon Pinpoint",
      "path": "Mobile/Amazon-Pinpoint.svg"
    },
    {
      "name": "Mobile",
      "path": "Mobile/Mobile.svg"
    },
    {
      "name": "AWS Amplify",
      "path": "Mobile/AWS-Amplify.svg"
    }
  ],
  "AWS Cost Management": [
    {
      "name": "AWS Cost Explorer",
      "path": "AWS_Cost_Management/AWS-Cost-Explorer.svg"
    },
    {
      "name": "AWS Cost Management",
      "path": "AWS_Cost_Management/AWS-Cost-Management.svg"
    },
    {
      "name": "AWS Cost and Usage Report",
      "path": "AWS_Cost_Management/AWS-Cost-and-Usage-Report.svg"
    },
    {
      "name": "AWS Budgets",
      "path": "AWS_Cost_Management/AWS-Budgets.svg"
    },
    {
      "name": "Reserved Instance Reporting",
      "path": "AWS_Cost_Management/Reserved-Instance-Reporting.svg"
    }
  ],
  "EC2 Instances": [
    {
      "name": "Amazon EC2 C5 Instance",
      "path": "EC2_Instances/Amazon-EC2_C5-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 R5 Instance",
      "path": "EC2_Instances/Amazon-EC2_R5-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 X1e Instance",
      "path": "EC2_Instances/Amazon-EC2_X1e-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 R5a Instance",
      "path": "EC2_Instances/Amazon-EC2_R5a-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 M4 Instance",
      "path": "EC2_Instances/Amazon-EC2_M4-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 z1d Instance",
      "path": "EC2_Instances/Amazon-EC2_z1d-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 T3a Instance",
      "path": "EC2_Instances/Amazon-EC2_T3a-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 Spot Instance",
      "path": "EC2_Instances/Amazon-EC2_Spot-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 D2 Instance",
      "path": "EC2_Instances/Amazon-EC2_D2-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 C4 Instance",
      "path": "EC2_Instances/Amazon-EC2_C4-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 R4 Instance",
      "path": "EC2_Instances/Amazon-EC2_R4-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 X1 Instance",
      "path": "EC2_Instances/Amazon-EC2_X1-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 M5 Instance",
      "path": "EC2_Instances/Amazon-EC2_M5-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 Instance with CloudWatch",
      "path": "EC2_Instances/Amazon-EC2_Instance-with-CloudWatch_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 A1 Instance",
      "path": "EC2_Instances/Amazon-EC2_A1-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 T3 Instance",
      "path": "EC2_Instances/Amazon-EC2_T3-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 P2 Instance",
      "path": "EC2_Instances/Amazon-EC2_P2-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 F1 Instance",
      "path": "EC2_Instances/Amazon-EC2_F1-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 DB on Instance",
      "path": "EC2_Instances/Amazon-EC2_DB-on-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 G3 Instance",
      "path": "EC2_Instances/Amazon-EC2_G3-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 Optimized Instance",
      "path": "EC2_Instances/Amazon-EC2_Optimized-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 High Memory Instance",
      "path": "EC2_Instances/Amazon-EC2_High-Memory-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 Instance",
      "path": "EC2_Instances/Amazon-EC2_Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 I3 Instance",
      "path": "EC2_Instances/Amazon-EC2_I3-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 P3 Instance",
      "path": "EC2_Instances/Amazon-EC2_P3-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 Instances",
      "path": "EC2_Instances/Amazon-EC2_Instances_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 T2 Instance",
      "path": "EC2_Instances/Amazon-EC2_T2-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 C5n Instance",
      "path": "EC2_Instances/Amazon-EC2_C5n-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 M5a Instance",
      "path": "EC2_Instances/Amazon-EC2_M5a-Instance_dark-bg.svg"
    },
    {
      "name": "Amazon EC2 H1 Instance",
      "path": "EC2_Instances/Amazon-EC2_H1-Instance_dark-bg.svg"
    }
  ],
  "Networking and CDN": [
    {
      "name": "Amazon VPC",
      "path": "Networking_and_CDN/Amazon-VPC_light-bg.svg"
    },
    {
      "name": "Amazon API Gateway",
      "path": "Networking_and_CDN/Amazon-API-Gateway_light-bg.svg"
    },
    {
      "name": "Amazon VPC Flow Logs",
      "path": "Networking_and_CDN/Amazon-VPC_Flow-Logs_light-bg.svg"
    },
    {
      "name": "AWS Transit Gateway",
      "path": "Networking_and_CDN/AWS-Transit-Gateway.svg"
    },
    {
      "name": "Amazon VPC NAT Gateway",
      "path": "Networking_and_CDN/Amazon-VPC_NAT-Gateway_light-bg.svg"
    },
    {
      "name": "AWS App Mesh",
      "path": "Networking_and_CDN/AWS-App-Mesh.svg"
    },
    {
      "name": "Amazon VPC Elastic Network Adapter",
      "path": "Networking_and_CDN/Amazon-VPC_Elastic-Network-Adapter_light-bg.svg"
    },
    {
      "name": "AWS Cloud Map",
      "path": "Networking_and_CDN/AWS-Cloud-Map.svg"
    },
    {
      "name": "Amazon CloudFront",
      "path": "Networking_and_CDN/Amazon-CloudFront_light-bg.svg"
    },
    {
      "name": "Amazon VPC PrivateLink",
      "path": "Networking_and_CDN/Amazon-VPC-PrivateLink.svg"
    },
    {
      "name": "Amazon VPC Peering",
      "path": "Networking_and_CDN/Amazon-VPC_Peering_light-bg.svg"
    },
    {
      "name": "Amazon Route 53 Hosted Zone",
      "path": "Networking_and_CDN/Amazon-Route-53_Hosted-Zone_light-bg.svg"
    },
    {
      "name": "Amazon Route 53 Route Table",
      "path": "Networking_and_CDN/Amazon-Route-53_Route-Table_light-bg.svg"
    },
    {
      "name": "Amazon VPC Elastic Network Interface",
      "path": "Networking_and_CDN/Amazon-VPC_Elastic-Network-Interface_light-bg.svg"
    },
    {
      "name": "Amazon CloudFront Download Distribution",
      "path": "Networking_and_CDN/Amazon-CloudFront_Download-Distribution_light-bg.svg"
    },
    {
      "name": "AWS Direct Connect",
      "path": "Networking_and_CDN/AWS-Direct-Connect.svg"
    },
    {
      "name": "AWS Global Accelerator",
      "path": "Networking_and_CDN/AWS-Global-Accelerator.svg"
    },
    {
      "name": "Networking and Content Delivery",
      "path": "Networking_and_CDN/Networking-and-Content-Delivery.svg"
    },
    {
      "name": "Amazon VPC Customer Gateway",
      "path": "Networking_and_CDN/Amazon-VPC_Customer-Gateway_light-bg.svg"
    },
    {
      "name": "Amazon VPC Network Access Control List",
      "path": "Networking_and_CDN/Amazon-VPC_Network-Access-Control-List_light-bg.svg"
    },
    {
      "name": "Amazon VPC Internet Gateway",
      "path": "Networking_and_CDN/Amazon-VPC_Internet-Gateway_light-bg.svg"
    },
    {
      "name": "Amazon Route 53",
      "path": "Networking_and_CDN/Amazon-Route-53.svg"
    },
    {
      "name": "Amazon Route 53",
      "path": "Networking_and_CDN/Amazon-Route-53_light-bg.svg"
    },
    {
      "name": "Amazon VPC VPN Gateway",
      "path": "Networking_and_CDN/Amazon-VPC_VPN-Gateway_light-bg.svg"
    },
    {
      "name": "Amazon CloudFront",
      "path": "Networking_and_CDN/Amazon-CloudFront.svg"
    },
    {
      "name": "Amazon VPC Router",
      "path": "Networking_and_CDN/Amazon-VPC_Router_light-bg.svg"
    },
    {
      "name": "AWS Client VPN",
      "path": "Networking_and_CDN/AWS-Client-VPN.svg"
    },
    {
      "name": "Amazon CloudFront Edge Location",
      "path": "Networking_and_CDN/Amazon-CloudFront_Edge-Location_light-bg.svg"
    },
    {
      "name": "Amazon VPC Endpoints",
      "path": "Networking_and_CDN/Amazon-VPC_Endpoints_light-bg.svg"
    },
    {
      "name": "Amazon CloudFront Streaming Distribution",
      "path": "Networking_and_CDN/Amazon-CloudFront_Streaming-Distribution_light-bg.svg"
    },
    {
      "name": "Amazon VPC",
      "path": "Networking_and_CDN/Amazon-VPC.svg"
    },
    {
      "name": "Amazon VPC VPN Connection",
      "path": "Networking_and_CDN/Amazon-VPC_VPN-Connection_light-bg.svg"
    }
  ],
  "Business Applications": [
    {
      "name": "Amazon Chime",
      "path": "Business_Applications/Amazon-Chime.svg"
    },
    {
      "name": "Amazon WorkDocs",
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
      "name": "Amazon WorkMail",
      "path": "Business_Applications/Amazon-WorkMail.svg"
    }
  ],
  "Migration and Transfer": [
    {
      "name": "AWS DataSync",
      "path": "Migration_and_Transfer/AWS-DataSync.svg"
    },
    {
      "name": "AWS Snowball",
      "path": "Migration_and_Transfer/AWS-Snowball.svg"
    },
    {
      "name": "Migration and Transfer",
      "path": "Migration_and_Transfer/Migration-and-Transfer.svg"
    },
    {
      "name": "AWS Snowball Edge",
      "path": "Migration_and_Transfer/AWS-Snowball-Edge.svg"
    },
    {
      "name": "AWS Migration Hub",
      "path": "Migration_and_Transfer/AWS-Migration-Hub.svg"
    },
    {
      "name": "AWS Database Migration Service",
      "path": "Migration_and_Transfer/AWS-Database-Migration-Service.svg"
    },
    {
      "name": "AWS Application Discovery Service",
      "path": "Migration_and_Transfer/AWS-Application-Discovery-Service.svg"
    },
    {
      "name": "AWS Server Migration Service",
      "path": "Migration_and_Transfer/AWS-Server-Migration-Service.svg"
    },
    {
      "name": "AWS Snowmobile",
      "path": "Migration_and_Transfer/AWS-Snowmobile.svg"
    },
    {
      "name": "AWS Transfer for SFTP",
      "path": "Migration_and_Transfer/AWS-Transfer-for-SFTP.svg"
    }
  ],
  "Desktop and App Streaming": [
    {
      "name": "Amazon Appstream 2.0",
      "path": "Desktop_and_App_Streaming/Amazon-Appstream-2.0.svg"
    },
    {
      "name": "Desktop and App Streaming",
      "path": "Desktop_and_App_Streaming/Desktop-and-App-Streaming.svg"
    },
    {
      "name": "Amazon Workspaces",
      "path": "Desktop_and_App_Streaming/Amazon-Workspaces.svg"
    }
  ],
  "AWS Compute": [
    {
      "name": "VMware Cloud On AWS",
      "path": "AWS_Compute/VMware-Cloud-On-AWS_light-bg.svg"
    },
    {
      "name": "Amazon Elastic Container Service",
      "path": "AWS_Compute/Amazon-Elastic-Container-Service_light-bg.svg"
    },
    {
      "name": "Amazon Elastic Container Service",
      "path": "AWS_Compute/Amazon-Elastic-Container-Service.svg"
    },
    {
      "name": "Amazon EC2 Rescue",
      "path": "AWS_Compute/Amazon-EC2_Rescue_light-bg.svg"
    },
    {
      "name": "AWS Elastic Beanstalk Deployment",
      "path": "AWS_Compute/AWS-Elastic-Beanstalk_Deployment_light-bg.svg"
    },
    {
      "name": "AWS Batch",
      "path": "AWS_Compute/AWS-Batch_light-bg.svg"
    },
    {
      "name": "AWS Elastic Beanstalk",
      "path": "AWS_Compute/AWS-Elastic-Beanstalk_light-bg.svg"
    },
    {
      "name": "Amazon EC2 AMI",
      "path": "AWS_Compute/Amazon-EC2_AMI_light-bg.svg"
    },
    {
      "name": "AWS Outposts",
      "path": "AWS_Compute/AWS-Outposts.svg"
    },
    {
      "name": "Amazon EC2 Auto Scaling",
      "path": "AWS_Compute/Amazon-EC2-Auto-Scaling_light-bg.svg"
    },
    {
      "name": "Elastic Load Balancing ELB",
      "path": "AWS_Compute/Elastic-Load-Balancing-ELB_light-bg.svg"
    },
    {
      "name": "Amazon EC2 Container Registry",
      "path": "AWS_Compute/Amazon-EC2-Container-Registry_light-bg.svg"
    },
    {
      "name": "Amazon Elastic Container Service Container1",
      "path": "AWS_Compute/Amazon-Elastic-Container-Service_Container1_light-bg.svg"
    },
    {
      "name": "AWS Outposts",
      "path": "AWS_Compute/AWS-Outposts_light-bg.svg"
    },
    {
      "name": "AWS Serverless Application Repository",
      "path": "AWS_Compute/AWS-Serverless-Application-Repository_light-bg.svg"
    },
    {
      "name": "Compute",
      "path": "AWS_Compute/Compute_light-bg.svg"
    },
    {
      "name": "Amazon EC2",
      "path": "AWS_Compute/Amazon-EC2_light-bg.svg"
    },
    {
      "name": "Amazon EC2 Elastic IP Address",
      "path": "AWS_Compute/Amazon-EC2_Elastic-IP-Address_light-bg.svg"
    },
    {
      "name": "AWS Lambda Lambda Function",
      "path": "AWS_Compute/AWS-Lambda_Lambda-Function_light-bg.svg"
    },
    {
      "name": "Amazon Elastic Container Service Container2",
      "path": "AWS_Compute/Amazon-Elastic-Container-Service_Container2_light-bg.svg"
    },
    {
      "name": "Amazon Elastic Container Service Service",
      "path": "AWS_Compute/Amazon-Elastic-Container-Service_Service_light-bg.svg"
    },
    {
      "name": "Amazon EC2 Container Registry Registry",
      "path": "AWS_Compute/Amazon-EC2-Container-Registry_Registry_light-bg.svg"
    },
    {
      "name": "Amazon Lightsail",
      "path": "AWS_Compute/Amazon-Lightsail_light-bg.svg"
    },
    {
      "name": "Amazon Elastic Block Store EBS Snapshot",
      "path": "AWS_Compute/Amazon-Elastic-Block-Store-EBS_Snapshot_light-bg.svg"
    },
    {
      "name": "Amazon Elastic Container Service Container3",
      "path": "AWS_Compute/Amazon-Elastic-Container-Service_Container3_light-bg.svg"
    },
    {
      "name": "Amazon Elastic Container Service Task",
      "path": "AWS_Compute/Amazon-Elastic-Container-Service_Task_light-bg.svg"
    },
    {
      "name": "Amazon Elastic Container Service for Kubernetes",
      "path": "AWS_Compute/Amazon-Elastic-Container-Service-for-Kubernetes_light-bg.svg"
    },
    {
      "name": "AWS Fargate",
      "path": "AWS_Compute/AWS-Fargate_light-bg.svg"
    },
    {
      "name": "Amazon Lightsail",
      "path": "AWS_Compute/Amazon-Lightsail.svg"
    },
    {
      "name": "Amazon EC2 Auto Scaling",
      "path": "AWS_Compute/Amazon-EC2_Auto-Scaling_light-bg.svg"
    },
    {
      "name": "AWS Lambda",
      "path": "AWS_Compute/AWS-Lambda_light-bg.svg"
    },
    {
      "name": "AWS Elastic Beanstalk Application",
      "path": "AWS_Compute/AWS-Elastic-Beanstalk_Application_light-bg.svg"
    },
    {
      "name": "Amazon EC2 Container Registry Image",
      "path": "AWS_Compute/Amazon-EC2-Container-Registry_Image_light-bg.svg"
    },
    {
      "name": "Amazon Elastic Block Store EBS Volume",
      "path": "AWS_Compute/Amazon-Elastic-Block-Store-EBS_Volume_light-bg.svg"
    }
  ],
  "Analytics": [
    {
      "name": "Amazon QuickSight",
      "path": "Analytics/Amazon-QuickSight.png"
    },
    {
      "name": "Amazon Kinesis",
      "path": "Analytics/Amazon-Kinesis.png"
    },
    {
      "name": "Amazon Kinesis Video Streams",
      "path": "Analytics/Amazon-Kinesis-Video-Streams.png"
    },
    {
      "name": "Amazon CloudSearch",
      "path": "Analytics/Amazon-CloudSearch.png"
    },
    {
      "name": "AWS Glue Crawlers",
      "path": "Analytics/AWS-Glue_Crawlers_dark-bg.png"
    },
    {
      "name": "AWS Lake Formation",
      "path": "Analytics/AWS-Lake-Formation.png"
    },
    {
      "name": "Amazon Redshift Dense Storage Node",
      "path": "Analytics/Amazon-Redshift_Dense-Storage-Node_dark-bg.png"
    },
    {
      "name": "Amazon Elasticsearch Service",
      "path": "Analytics/Amazon-Elasticsearch-Service.png"
    },
    {
      "name": "Amazon EMR EMR Engine MapR M7",
      "path": "Analytics/Amazon-EMR_EMR-Engine-MapR-M7_dark-bg.png"
    },
    {
      "name": "Amazon Kinesis Data Firehose",
      "path": "Analytics/Amazon-Kinesis-Data-Firehose.png"
    },
    {
      "name": "AWS Data Pipeline",
      "path": "Analytics/AWS-Data-Pipeline.png"
    },
    {
      "name": "Amazon EMR EMR Engine",
      "path": "Analytics/Amazon-EMR_EMR-Engine_dark-bg.png"
    },
    {
      "name": "Amazon EMR Cluster",
      "path": "Analytics/Amazon-EMR_Cluster_dark-bg.png"
    },
    {
      "name": "Amazon EMR HDFS Cluster",
      "path": "Analytics/Amazon-EMR_HDFS-Cluster_dark-bg.png"
    },
    {
      "name": "Amazon Redshift Dense Compute Node",
      "path": "Analytics/Amazon-Redshift_Dense-Compute-Node_dark-bg.png"
    },
    {
      "name": "AWS Glue Data Catalog",
      "path": "Analytics/AWS-Glue_Data-Catalog_dark-bg.png"
    },
    {
      "name": "Amazon EMR EMR Engine MapR M5",
      "path": "Analytics/Amazon-EMR_EMR-Engine-MapR-M5_dark-bg.png"
    },
    {
      "name": "Amazon CloudSearch Search Documents",
      "path": "Analytics/Amazon-CloudSearch_Search-Documents_dark-bg.png"
    },
    {
      "name": "Analytics",
      "path": "Analytics/Analytics.png"
    },
    {
      "name": "AWS Glue",
      "path": "Analytics/AWS-Glue.png"
    },
    {
      "name": "Amazon EMR",
      "path": "Analytics/Amazon-EMR.png"
    },
    {
      "name": "Amazon Redshift",
      "path": "Analytics/Amazon-Redshift.png"
    },
    {
      "name": "Amazon Kinesis Data Streams",
      "path": "Analytics/Amazon-Kinesis-Data-Streams.png"
    },
    {
      "name": "Amazon Athena",
      "path": "Analytics/Amazon-Athena.png"
    },
    {
      "name": "Amazon Managed Streaming for Kafka",
      "path": "Analytics/Amazon-Managed-Streaming-for-Kafka.png"
    },
    {
      "name": "Amazon EMR EMR Engine MapR M3",
      "path": "Analytics/Amazon-EMR_EMR-Engine-MapR-M3_dark-bg.png"
    },
    {
      "name": "Amazon Kinesis Data Analytics",
      "path": "Analytics/Amazon-Kinesis-Data-Analytics.png"
    }
  ]
}
document.addEventListener('DOMContentLoaded', function () {
  // Get a reference to the container where you want to add the HTML
  var container = document.querySelector('.sidebar-icons');

  // Loop through the categories in the JSON data
  for (var category in inputjson) {
    if (inputjson.hasOwnProperty(category)) {
      var catid = category.replace(/,/g, '');
      var newcatid = catid.replace(/ /g, '_');
      
      // Create the category element
      var categoryDiv = document.createElement('div');
      categoryDiv.classList.add('category', 'collapsed');
      categoryDiv.dataset.toggle = 'collapse';
      categoryDiv.dataset.target = '#' + newcatid;
      categoryDiv.setAttribute('aria-expanded', 'false');
      categoryDiv.setAttribute('aria-controls', category.replace(/ /g, '_'));
      categoryDiv.textContent = category;

      // Create the collapse element
      var collapseDiv = document.createElement('div');
      collapseDiv.classList.add('collapse');
      collapseDiv.id = newcatid;

      // Create the card element
      var cardDiv = document.createElement('div');
      cardDiv.classList.add('card');
      cardDiv.classList.add('card-body');



      // Add the card element to the collapse element
      collapseDiv.appendChild(cardDiv);

      // Add click event listener to load images when category is clicked
      categoryDiv.addEventListener('click', function (e) {

        var targetId = e.target.dataset.target.substring(1); // Get the collapse ID
        var categoryName = targetId.replace(/_/g, ' '); // Replace underscores with spaces

        var items = inputjson[categoryName]; // Get the items based on the category name
        var targetCardDiv = $("#"+targetId+" .card-body");

        // Clear the HTML content of the target card-body
        $(targetCardDiv).html("");

        // Loop through the items and add images to the target card-body
        if (items) {
          items.forEach(function (item) {
          
            // Create the image element
            var img = document.createElement('img');
            img.src = './images/AWS/' + item.path;
            img.width = '30';
            img.height = '30';
            img.draggable = true;
            img.name = item.name;
            $(img).attr("data-group",item.groupCheck);
            $(img).attr("data-toggle","tooltip");
            $(img).attr("title", item.name);

            
            // Append the image to the target card-body
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
                  groupCheck,
                })
              );
            });
            img.addEventListener("click", (event) => {
              let imageUrl = event.target.src;
              let imageName = event.target.getAttribute("name");
              let groupCheck = event.target.getAttribute("data-group");
              // console.log(typeof imageUrl,typeof imageName,typeof groupCheck)
              // console.log(event)
              // event.dataTransfer.setData(
              //   "text/plain",
              //   JSON.stringify({
              //     imageUrl,
              //     imageName,
              //     groupCheck,
              //   })
              // );
              // console.log(img)
              // graph.addCell(img);
              // event.preventDefault();
              // const data = JSON.parse(event.dataTransfer.getData("text/plain"));
              // console.log(groupCheck)
              // let groupcheck = JSON.stringify(groupCheck);
              clickDrop(event, imageUrl, imageName, groupCheck);
            });
          });
        }
        
        container.addEventListener("mouseover", function(event) {
          // Check if the event target is an image
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
      
      container.addEventListener("mouseleave", function(event) {
          if (!event.relatedTarget || event.relatedTarget.tagName !== "IMG") {
              $(".view-icon").hide(); 
          }
      });
      
      
      
      

      });

      // Add the category and collapse elements to the container
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

  // Function to display search results
  function displayResults(results) {
      $(".search-result").empty(); 
      $(".sidebar").append('<div class="search-result"></div>');
      if (results.length < 3) {
          $(".search-result").html('<p class="text-danger">No Results Found</p>');
          $(".sidebar-icons").hide();
          $(".search-result").show();
      } else {
          
          $(".sidebar-icons").hide();
          $.each(results, function (index, item) {
               // Create the image element
            var img = document.createElement('img');
            img.src = './images/AWS/' + item.path;
            img.width = '30';
            img.height = '30';
            img.draggable = true;
            img.name = item.name;
            $(img).attr("data-group",item.groupCheck);
            $(img).attr("data-toggle","tooltip");
            $(img).attr("title", item.name);

            
            // Append the image to the target card-body
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
                  groupCheck,
                })
              );
            });
              
          });
         
          $(".search-result").show();
          
      }
  }
  
  
});

// let positionjsonarray = [];

// paper.on('cell:pointermove', function (cellView, evt, x, y) {
//   const currentgraphjson = graph.toJSON();
//   positionjsonarray.push(currentgraphjson);
//   const containerWidth = document.getElementById('paper-container').clientWidth; 
//   const containerHeight = document.getElementById('paper-container').clientHeight;
//   const paperWidth = (paperWidthPercentage / 100) * containerWidth;
//   const paperHeight = (paperHeightPercentage / 100) * containerHeight;
//   const elementWidth = cellView.model.get('size').width;
//   const elementHeight = cellView.model.get('size').height;
//   // console.log(x,y)

//   let newX = x;
//   let newY = y;

//   // console.log(x,y,paperWidth,elementWidth)

//   if (x < 0) {
//     newX = 0;
//     // newX = paperWidth-elementWidth - 170;
//     // scrollToRight();
//   } 
//   else if (x + elementWidth > (paperWidth - 100)) {
//     newX = paperWidth - 100 - elementWidth;
//     // newX = 30;
//     // scrollToLeft();
//   }

//   if (y < 0) {
//     newY = 0;
//     // newY = paperHeight-elementHeight - 170;
//     // scrollToBottom();
//   } 
//   else if (y + elementHeight + 140 > paperHeight) {
//     newY = paperHeight - elementHeight - 140;
//     // newY = 0;
//     // scrollToTop();
//   }

//   cellView.model.position(newX, newY);

//   if (cellView.model.attributes.type == "custom.CustomGroup") {
//     for (let i = 0; i < currentgraphjson.cells.length; i++) {
//       if (currentgraphjson.cells[i].id == cellView.model.id) {
//         const embedslist = currentgraphjson.cells[i].embeds.slice(1);
//         for (let k = 0; k < embedslist.length; k++) {
//           for (let j = 0; j < currentgraphjson.cells.length; j++) {
//             if (embedslist[k] == currentgraphjson.cells[j].id) {
//               graph.getCell(currentgraphjson.cells[j].id).position(newX+(currentgraphjson.cells[j].initialRelativeX-positionjsonarray[0].cells[i].position.x), newY+(currentgraphjson.cells[j].initialRelativeY-positionjsonarray[0].cells[i].position.y));
//             }
//           }
//         }
//       }
//     }
//   }
//   else if (cellView.model.attributes.type == "basic.Rect") {
//     for (let i = 0; i < currentgraphjson.cells.length; i++) {
//       if (currentgraphjson.cells[i].id == cellView.model.id) {
//         const embedslist = currentgraphjson.cells[i].embeds;
//         for (let k = 0; k < embedslist.length; k++) {
//           for (let j = 0; j < currentgraphjson.cells.length; j++) {
//             if (embedslist[k] == currentgraphjson.cells[j].id) {
//               graph.getCell(currentgraphjson.cells[j].id).position(newX+(positionjsonarray[0].cells[j].position.x-positionjsonarray[0].cells[i].position.x), newY+(positionjsonarray[0].cells[j].position.y-positionjsonarray[0].cells[i].position.y));
//             }
//           }
//         }
//       }
//     }
//   }
// });

var container = document.createElement("div");
container.id = "container";
container.style.position = "absolute";
container.style.top = "0";
container.style.right = "0";
container.style.width = "300px";
container.style.height = "100vh";
container.style.backgroundColor = "#eee";
container.style.borderLeft = "1px solid #ccc";
container.style.zIndex = "9999";
container.style.display = "none";

var box = document.createElement("div");
box.id = "box";
box.style.width = "100%";
box.style.height = "100%";
box.style.backgroundColor = "#fff";

var closeButton = document.createElement("img");
closeButton.id = "closebutton";
closeButton.src = "images/close.svg"; 
closeButton.alt = "Close";
closeButton.style.position = "absolute";
closeButton.style.top = "5px";
closeButton.style.right = "5px";
closeButton.style.cursor = "pointer";
closeButton.style.width = "20px";
closeButton.style.height = "20px";

closeButton.addEventListener("click", function() {
  container.style.display = "none";
});

box.appendChild(closeButton);

container.appendChild(box);
document.body.appendChild(container);


// #e42527  red
// #089949  green
// #226db4  blue
// #f9b21d  yellow

var CustomLinkView = joint.dia.LinkView.extend({
  options: joint.util.deepSupplement({
      events: {
          'mouseover .tool-remove': 'showIButton',
          'mouseout .tool-remove': 'hideIButton',
          'click .tool-i': 'onIButtonClick'
      }
  }, joint.dia.LinkView.prototype.options),

  initialize: function () {
      joint.dia.LinkView.prototype.initialize.apply(this, arguments);

      const showIButtonHandler = this.showIButton.bind(this);
      const hideIButtonHandler = this.hideIButton.bind(this);
      const onIButtonClickHandler = this.onIButtonClick.bind(this);

      this.el.addEventListener('mouseover', showIButtonHandler);
      this.el.addEventListener('mouseout', hideIButtonHandler);
      this.el.addEventListener('click', onIButtonClickHandler);

      setTimeout(() => {
        console.log(this.el.getElementsByClassName("connection")[0].getAttribute("d"))
        const svgPathData = this.el.getElementsByClassName("connection")[0].getAttribute("d");
        const pathArray = svgPathData.split(' ');
        const x1 = parseFloat(pathArray[1]);
        const y1 = parseFloat(pathArray[2]);
        const x2 = parseFloat(pathArray[4]);
        const y2 = parseFloat(pathArray[5]);
        const middlePointX = (x1 + x2) / 2;
        const middlePointY = (y1 + y2) / 2;
        var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("r", "10");
        circle.setAttribute("fill", "#fff");
        circle.setAttribute("stroke", "#aaaaaa");
        circle.setAttribute("cx", middlePointX);
        circle.setAttribute("cy", middlePointY);
        circle.setAttribute("class", "tool-i");

        this.el.appendChild(circle);

        console.log(this.el);

        this.hideIButton();
      }, 1000);

      // this.listenTo(this.model, 'change:vertices', this.updateCirclePosition);
  },

  // updateCirclePosition: function () {
  //   console.log("abc")
  //   const svgPathData = this.el.getElementsByClassName("connection")[0].getAttribute("d");
  //   const pathArray = svgPathData.split(' ');
  //   const x1 = parseFloat(pathArray[1]);
  //   const y1 = parseFloat(pathArray[2]);
  //   const x2 = parseFloat(pathArray[4]);
  //   const y2 = parseFloat(pathArray[5]);
  //   const middlePointX = (x1 + x2) / 2;
  //   const middlePointY = (y1 + y2) / 2;

  //   const circle = this.el.querySelector('.tool-i');
  //   circle.setAttribute("cx", middlePointX);
  //   circle.setAttribute("cy", middlePointY);
  // },

  showIButton: function () {
      this.$('.tool-i').show();
  },

  hideIButton: function () {
      this.$('.tool-i').hide();
  },

  onIButtonClick: function (evt) {
    
    let modelIDd = this.el.getAttribute('model-id');
    var box = document.getElementById("box"); 
    var childNodes = box.childNodes;
    for (var i = childNodes.length - 1; i >= 0; i--) {
        var child = childNodes[i];
        if (child.id !== "closebutton") {
            box.removeChild(child);
        }
    }
    container.style.display = "block";
    var textLabel = document.createElement("label");
    textLabel.textContent = "Text:";
    textLabel.style.position = "absolute";
    textLabel.style.top = "18%";
    textLabel.style.left = "10%";
    textLabel.style.fontSize = "16px";
    box.appendChild(textLabel);
    var textTextbox = document.createElement("input");
    textTextbox.type = "text";
    textTextbox.style.position = "absolute";
    textTextbox.style.top = "18%";
    textTextbox.style.left = "35%";
    textTextbox.style.width = "170px";
    box.appendChild(textTextbox);
    var arrowmenuLabel = document.createElement("label");
    arrowmenuLabel.textContent = "Arrow options:";
    arrowmenuLabel.style.position = "absolute";
    arrowmenuLabel.style.top = "30%";
    arrowmenuLabel.style.left = "10%";
    arrowmenuLabel.style.fontSize = "16px";
    box.appendChild(arrowmenuLabel);
    const arrowMenu = document.createElement("div");
    arrowMenu.className = "arrow-menu";
    let arrowoption;
    arrowOptions.forEach((arrowOption) => {
      const arrowItem = document.createElement("div");
      $(arrowItem).addClass(arrowOption.name);

      arrowItem.innerHTML = arrowOption.svg;
      arrowItem.addEventListener("click", () => {
        arrowoption = arrowOption.name;
        // applyArrowType(sourceView, targetView, arrowOption.name);
        // arrowMenu.remove();
      });
      arrowMenu.appendChild(arrowItem);
    });
    // console.log(arrowoption)
    arrowMenu.style.position = "absolute";
    arrowMenu.style.top = "27%";
    arrowMenu.style.left = "45%";
    box.appendChild(arrowMenu);
    var arrowcolorLabel = document.createElement("label");
    arrowcolorLabel.textContent = "Arrow colors:";
    arrowcolorLabel.style.position = "absolute";
    arrowcolorLabel.style.top = "42%";
    arrowcolorLabel.style.left = "10%";
    arrowcolorLabel.style.fontSize = "16px";
    box.appendChild(arrowcolorLabel);
    var colorBox1 = document.createElement("div");
    colorBox1.style.position = "absolute";
    colorBox1.style.top = "42%";
    colorBox1.style.left = "52%";
    colorBox1.style.width = "20px";
    colorBox1.style.height = "20px";
    colorBox1.style.backgroundColor = "#e42527";
    box.appendChild(colorBox1);
    var colorBox2 = document.createElement("div");
    colorBox2.style.position = "absolute";
    colorBox2.style.top = "42%";
    colorBox2.style.left = "62%";
    colorBox2.style.width = "20px";
    colorBox2.style.height = "20px";
    colorBox2.style.backgroundColor = "#089949"; 
    box.appendChild(colorBox2);
    var colorBox3 = document.createElement("div");
    colorBox3.style.position = "absolute";
    colorBox3.style.top = "42%";
    colorBox3.style.left = "72%";
    colorBox3.style.width = "20px";
    colorBox3.style.height = "20px";
    colorBox3.style.backgroundColor = "#226db4"; 
    box.appendChild(colorBox3);
    var colorBox4 = document.createElement("div");
    colorBox4.style.position = "absolute";
    colorBox4.style.top = "42%";
    colorBox4.style.left = "82%";
    colorBox4.style.width = "20px";
    colorBox4.style.height = "20px";
    colorBox4.style.backgroundColor = "#f9b21d"; 
    box.appendChild(colorBox4);
    var saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.style.position = "absolute";
    saveButton.style.top = "53%";
    saveButton.style.left = "30%";
    saveButton.style.fontSize = "16px";
    saveButton.addEventListener("click", function() {
      var currentjson = graph.toJSON();
      for (let i = 0; i < currentjson.cells.length; i++) {
        if (currentjson.cells[i].id == modelIDd) {
          if (arrowoption) {
            applyArrowType(currentjson.cells[i].source.id, currentjson.cells[i].target.id, arrowoption);
          }
          break;
        }
      };
      var currentjson = graph.toJSON();
      for (let i = 0; i < currentjson.cells.length; i++) {
        if (currentjson.cells[i].id == modelIDd) {
          if (textTextbox.value != "") {
            currentjson.cells[i]["labels"] = [ { "position": { "distance": 0.5, "offset": -20, "args": { "dx": 0, "dy": 0, "angle": 0 } }, "attrs": { "text": { "text": textTextbox.value } } } ];
          }
          graph.fromJSON(currentjson);
          break;
        }
      };
    });
    box.appendChild(saveButton);
    var resetButton = document.createElement("button");
    resetButton.textContent = "Reset";
    resetButton.style.position = "absolute";
    resetButton.style.top = "53%";
    resetButton.style.left = "55%";
    resetButton.style.fontSize = "16px";
    resetButton.addEventListener("click", function() {
        textTextbox.value = "";
    });
    box.appendChild(resetButton);
  }
});

joint.shapes.devs.LinkView = CustomLinkView;

paper.options.linkView = CustomLinkView;
