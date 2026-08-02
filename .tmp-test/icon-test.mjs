import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Trash, Warning2 } from "iconsax-react";
const a = renderToStaticMarkup(React.createElement(Trash, { size: 14, variant: "Bold" }));
const b = renderToStaticMarkup(React.createElement(Trash, { size: 14, variant: "Linear", color: "#CD432F" }));
const c = renderToStaticMarkup(React.createElement(Warning2, { size: 17, variant: "Bold", color: "#0D0D0D" }));
console.log("Bold currentColor:", a, "\n");
console.log("Linear explicit:", b, "\n");
console.log("Warning2:", c);
