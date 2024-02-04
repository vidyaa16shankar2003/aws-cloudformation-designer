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
    name: "mesh",
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

function confirmRemoval(elementView) {
  elementView.model.remove();
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


paper.on("element:pointerclick", (elementView, evt, x, y) => {
  var toolsView;
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
  const labelPosition = labelElement.position();

  paper.on("blank:pointerclick", () => {
    toolsView.$el.removeClass("active");
  });
});

const groupCells = [];
let group;
function handleDrop(event, imageUrl, imageName, groupCheck) {
  let x = event.offsetX;
  let y = event.offsetY;

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
        <text class="group-label"/> <!-- Add a text element for the label -->
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
          width: 50,
          height: 50,
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
          fill: "red",
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

    // Add the group to the graph
    graph.addCell(group);

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
        <rect width="100" height="100" fill="#fff" stroke="#aaaaaa" joint-selector="background"/>
        <image x="5" y="5" width="90" height="90" joint-selector="image-cell" />
        <text font-size="14" joint-selector="label" display="block" class="imagecell-label"/>
        </g>
      `,  
        position: { x, y },
        size: { width: 100, height: 100 },
        attrs: {
          image: { "xlink:href": imageUrl },
          label: { text: imageName },
        },
      });

      imageCell.set("initialRelativeX", x); // Set the initial relative X position
      imageCell.set("initialRelativeY", y);
      // Embed the new cell into the group
      groupUnderDrop.embed(imageCell);

      // Add the child cell to the graph
      graph.addCell(imageCell);
    } else {
      // Create the image cell
      const imageCell = new customImage({
        markup: `
        <g joint-selector="cell-group">
        <rect width="100" height="100" fill="#fff" stroke="#aaaaaa" joint-selector="background"/>
        <image x="5" y="5" width="90" height="90" joint-selector="image-cell" />
        <text font-size="14" joint-selector="label" display="block" class="imagecell-label"/>
        </g>
      `,
        position: { x, y }, // Customize the image position within the group
        size: { width: 100, height: 100 }, // Customize the image size as needed
        attrs: {
          image: { "xlink:href": imageUrl },
          label: { text: imageName },
          // Configure the label element
          ".imagecell-label": {
            text: imageName,
            "ref-x": 0.5,
            "ref-y": 1,
            "ref-dy": 10,
            "font-size": 14,
            "text-anchor": "middle",
            fill: "red",
            cursor: "pointer",
          },
        },
      });

      // Add the group to the graph
      graph.addCell(imageCell);

      
     
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
        groupCheck,
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
    jsonData.cells.forEach((cell) => {
      debugger;
      if (cell.type === 'link') {
        // Check if the link has customAttributes
        if (cell.customAttributes) {
          var arrowType = cell.customAttributes.arrowType;
    
          // Set the class attribute based on the arrowType
          cell.attrs = {
            
            class: arrowType,
            
          };
        }
      }
    });

    graph.fromJSON(jsonData);
  } catch (error) {
    console.error("Error parsing JSON:", error);
  }
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
      showArrowTypeMenu(coords.x, coords.y, sourceView, targetView);
    }
  }
});

function showArrowTypeMenu(x, y, sourceView, targetView) {
  const arrowMenu = document.createElement("div");
  arrowMenu.className = "arrow-menu";
  arrowOptions.forEach((arrowOption) => {
    const arrowItem = document.createElement("div");
    $(arrowItem).addClass(arrowOption.name);

    arrowItem.innerHTML = arrowOption.svg; // Set the SVG markup as innerHTML
    arrowItem.addEventListener("click", () => {
      applyArrowType(x, y, sourceView, targetView, arrowOption.name);
      arrowMenu.remove();
    });
    arrowMenu.appendChild(arrowItem);
  });

  arrowMenu.style.position = "absolute";
  arrowMenu.style.left = x + "px";
  arrowMenu.style.top = y + "px";
  document.body.appendChild(arrowMenu);

  function removeArrowMenu() {
    if (arrowMenu.parentNode) {
      arrowMenu.parentNode.removeChild(arrowMenu);
    }
  }

  paper.on("blank:pointerclick", () => {
    removeArrowMenu();
  });
}

function createLinkLabelInput(linkView, x, y) {
  if (!linkView) {
    console.error("Invalid linkView");
    return;
  }

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter Link Text";

  input.style.position = "absolute";
  input.style.left = x + "px";
  input.style.top = y - 20 + "px"; // Adjust the position as needed

  input.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      const linkText = input.value.trim();
      if (linkText) {
        applyLinkLabel(linkView, linkText);
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

function applyArrowType(x, y, sourceView, targetView, selectedArrowType) {
  const selectedStyle = arrowStyleOptions.find(
    (style) => style.name === selectedArrowType
  );

  if (!selectedStyle) {
    console.error("Invalid arrow type:", selectedArrowType);
    return;
  }

  const link = new joint.shapes.standard.Link({
    source: {
      id: sourceView.model.id,
    },
    target: {
      id: targetView.model.id,
    },
    attrs: {
      ".connection": {
        stroke: selectedStyle.line.stroke,
      },
      ".marker-source": {
        markup: selectedStyle.line.sourceMarker.d,
      },
      ".marker-target": {
        d: selectedStyle.line.targetMarker.d,
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
      existingLink.get("source").id === sourceView.model.id &&
      existingLink.get("target").id === targetView.model.id
    );
  });

  if (existingLink) {
    hasExistingLink = true;
    const defaultLink = graph
      .getLinks()
      .find(
        (defaultLink) =>
          defaultLink.get("source").id === sourceView.model.id &&
          defaultLink.get("target").id === targetView.model.id &&
          defaultLink.attributes.customAttributes?.arrowType === undefined
      );
    if (defaultLink) {
      graph.removeCells([defaultLink]);
    }
  }

  graph.addCell(link);

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
          "https://assets.codepen.io/7589991/8725981_image_resize_square_icon.svg",
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
        width: childWidth,
        height: childHeight,
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
groupButton.textContent = "Group";
groupButton.style.position = "absolute";
groupButton.style.top = "10px";
groupButton.style.left = "10px";
groupButton.style.display = "none";
groupButton.classList.add("group-btn");
paperContainer.append(groupButton);

// Create an image element for the icon
const groupImg = document.createElement("img");
groupImg.src = "";
groupImg.alt = "Group"; // Add alt text for accessibility
groupImg.style.width = "20px";
groupImg.style.height = "20px";
groupButton.textContent = "";
// Append the icon image to the button
groupButton.appendChild(groupImg);

// Function to create a group
function createGroup(position, size) {
  const group = new joint.shapes.basic.Rect({
    size: size || { width: 100, height: 100 },
    position: position || { x: 100, y: 100 },
    attrs: {
      rect: {
        fill: "transparent",
        stroke: "#000000",
        "stroke-dasharray": "5 5",
      },
    },
  });

  const label = document.createElement("div");
  label.contentEditable = true;
  label.textContent = "Group Label";
  label.style.position = "absolute";
  label.style.top = startY + size.height + 10 + "px";
  label.style.left = startX + size.width / 2 + "px";
  label.style.transform = "translate(-50%, -50%)";
  label.style.fontSize = "14px";
  label.style.color = "#000000";
  label.style.display = "block";
  label.style.cursor = "text";
  paper.el.appendChild(label);
  label.addEventListener("mousedown", (event) => {
    event.stopPropagation();
  });
  // Enter edit mode when the label is clicked
  label.addEventListener("click", () => {
    label.contentEditable = true;
    label.focus(); // Focus on the label for editing
  });
  // Exit edit mode when Enter is pressed
  label.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      label.contentEditable = false;
      event.preventDefault(); // Prevent line break on Enter
    }
  });
  group.label = label;
  group.on("change:position", (group, newPosition) => {
    const labelX = newPosition.x + size.width / 2;
    const labelY = newPosition.y + size.height + 10;
    label.style.left = labelX + "px";
    label.style.top = labelY + "px";
  });

  return group;
}
groupButton.addEventListener("click", groupSelectedElements);

// Function to group selected elements
function groupSelectedElements() {
  if (selectedElements.length > 1) {
    const selectedGroupElements = [];
    const selectedNonGroupElements = [];

    selectedElements.forEach((element) => {
      if (element.attributes.type === 'custom.CustomGroup') {
          // Check if it has child elements
          const childElements = element.getEmbeddedCells();
          const filteredChildElements = childElements.filter((element) => element !== undefined);

          if (childElements.length > 0) {
              // If it has child elements, add them individually
              filteredChildElements.forEach((childElement) => {
                  selectedNonGroupElements.push(childElement);
              });
          } else {
              // If it doesn't have child elements, add the group itself
              selectedGroupElements.push(element);
          }
      } else {
          const parentGroup = element.getParentCell();
          if (parentGroup && parentGroup.attributes.type === 'custom.CustomGroup') {
            if (!selectedGroupElements.includes(parentGroup)) {
                selectedGroupElements.push(parentGroup);
            }
          } else {
              selectedNonGroupElements.push(element);
          }
      }
  });
  

    if (selectedGroupElements.length > 0) {

      selectedGroupElements.forEach((group) => {
        
        const childElements = group.getEmbeddedCells();
        const filteredChildElements = childElements.filter((element) => element !== undefined);

          if (filteredChildElements.length > 0) {
              group.unembed(filteredChildElements);
          }
        if (group && group instanceof joint.dia.Element) {

          
          
          

          const newGroup = new joint.shapes.custom.CustomGroup({
            markup: `
            <g class="rotatable">
              <g class="scalable">
                <rect />
              </g>
              <image width="50" height="50"/>
              <text class="group-label"/> <!-- Add a text element for the label -->
            </g>
          `,
            position: { x: group.position().x, y: group.position().y },
            attrs: {
              rect: {
                fill: "#f7f7f7",
                stroke: "#aaaaaa",
                "stroke-width": 1,
                width: group.attributes.size.width,
                height: group.attributes.size.height,
              },
              image: {
                "xlink:href": '',
              },
              // Configure the label element
              ".group-label": {
                text: 'Group Name',
                "ref-x": 0.5,
                "ref-y": 1,
                "ref-dy": 10,
                "font-size": 14,
                "text-anchor": "middle",
                fill: "red",
                cursor: "pointer",
              },
            },
          });
          

          // Now, you can safely work with the filteredChildElements
          filteredChildElements.forEach((element) => {
            newGroup.embed(element);
          });

          // Add the new group to the graph
          graph.addCell(newGroup);

          // Remove the ungrouped group
          group.remove();
        } else {
          console.error('Invalid group:', group);
        }
      });

      // Now, group the newly created groups (including ungrouped groups) and non-group elements
      const finalGroup = createGroup(
        { x: selectionRectangle.offsetLeft, y: selectionRectangle.offsetTop },
        {
          width: selectionRectangle.offsetWidth,
          height: selectionRectangle.offsetHeight,
        }
      );

      selectedNonGroupElements.forEach((element) => {
        const currentParent = element.getParentCell();
        if (currentParent) {
            // Unembed the element from its current parent
            currentParent.unembed(element);
        }

        // Embed the element into finalGroup
        finalGroup.embed(element);

        
      });

      graph.addCell(finalGroup);

      selectedElements = selectedNonGroupElements; // Update the selected elements
    } else {
      // If there are no group elements, create a new group as before
      const group = createGroup(
        { x: selectionRectangle.offsetLeft, y: selectionRectangle.offsetTop },
        {
          width: selectionRectangle.offsetWidth,
          height: selectionRectangle.offsetHeight,
        }
      );

      selectedElements.forEach((element) => {
        group.embed(element);
        element.setParent(group);
      });

      graph.addCell(group);
    }

    // Rest of your code for handling the Ungroup button
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
    endX = e.clientX - 100;
    endY = e.clientY;
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
  startX = e.clientX - 100;
  startY = e.clientY;
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
