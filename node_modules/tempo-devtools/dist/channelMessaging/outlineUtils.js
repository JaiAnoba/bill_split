"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNodeOutline = exports.updateOutlines = exports.clearAllOutlines = exports.getOutlineElement = exports.OutlineType = exports.PRIMARY_COMPONENT_OUTLINE_COLOR = exports.SECONDARY_OUTLINE_COLOUR = exports.PRIMARY_OUTLINE_COLOUR = void 0;
const identifierUtils_1 = require("./identifierUtils");
const sessionStorageUtils_1 = require("./sessionStorageUtils");
// @ts-ignore
const jquery_1 = __importDefault(require("jquery"));
const tempoElement_1 = require("./tempoElement");
const editTextUtils_1 = require("./editTextUtils");
const constantsAndTypes_1 = require("./constantsAndTypes");
exports.PRIMARY_OUTLINE_COLOUR = '#4597F7';
exports.SECONDARY_OUTLINE_COLOUR = '#4597F7';
exports.PRIMARY_COMPONENT_OUTLINE_COLOR = '#6183e4';
var OutlineType;
(function (OutlineType) {
    OutlineType[OutlineType["PRIMARY"] = 0] = "PRIMARY";
    OutlineType[OutlineType["SECONDARY"] = 1] = "SECONDARY";
    OutlineType[OutlineType["CHILD"] = 2] = "CHILD";
    OutlineType[OutlineType["MOVE"] = 3] = "MOVE";
})(OutlineType || (exports.OutlineType = OutlineType = {}));
/**
 * Returns a context-based palette of colours to use for the outlines.
 */
const colours = () => {
    const aiContextSelection = (0, sessionStorageUtils_1.getMemoryStorageItem)('aiContext');
    if (aiContextSelection) {
        return {
            primary: '#6858f5',
            secondary: '#6858f5',
            component: '#5246C2',
        };
    }
    return {
        primary: exports.PRIMARY_OUTLINE_COLOUR,
        secondary: exports.SECONDARY_OUTLINE_COLOUR,
        component: exports.PRIMARY_COMPONENT_OUTLINE_COLOR,
    };
};
const getDashedBackgroundImage = (strokeColor, dashWidth, dashGap) => {
    return `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='${strokeColor.replace('#', '%23')}' stroke-width='${dashWidth}' stroke-dasharray='1%2c ${dashGap}' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`;
};
const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const getPencilSVG = () => {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`;
};
const getEditTextButtonNode = (parentPort, bgColor, elementKey) => {
    const el = document.createElement('div');
    const textEl = document.createElement('div');
    textEl.innerText = 'Edit Dynamic Text';
    textEl.classList.add(identifierUtils_1.EDIT_TEXT_BUTTON);
    textEl.classList.add(identifierUtils_1.OUTLINE_CLASS);
    // First append the pencil SVG
    const pencilSVG = document.createElement('div');
    pencilSVG.innerHTML = getPencilSVG();
    pencilSVG.style.width = '22px';
    pencilSVG.style.height = '22px';
    pencilSVG.classList.add(identifierUtils_1.EDIT_TEXT_BUTTON);
    pencilSVG.classList.add(identifierUtils_1.OUTLINE_CLASS);
    el.appendChild(pencilSVG);
    el.appendChild(textEl);
    el.classList.add(identifierUtils_1.OUTLINE_CLASS);
    el.classList.add(identifierUtils_1.EDIT_TEXT_BUTTON);
    el.style.color = 'white';
    el.style.cursor = 'pointer';
    el.style.backgroundColor = bgColor;
    el.style.padding = '4px 12px 4px 12px';
    el.style.borderRadius = '8px';
    el.style.fontSize = '20px';
    el.style.pointerEvents = 'auto';
    el.style.display = 'flex';
    el.style.flexDirection = 'row';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.gap = '8px';
    // When clicking, trigger an open in editor action
    el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        parentPort.postMessage({
            id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.EDIT_DYNAMIC_TEXT,
            elementKey,
        });
    });
    el.addEventListener('pointerup', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    return el;
};
const getOutlineElement = (parentPort, type, pageLeft, pageTop, width, height, selected, tagName, isComponent, elementKey) => {
    const palette = colours();
    const left = pageLeft;
    const top = pageTop;
    const zoomPerc = (0, sessionStorageUtils_1.getMemoryStorageItem)('zoomPerc');
    const zoomMultiplier = zoomPerc ? 1 / Number(zoomPerc) : 1;
    const newElement = document.createElement('div');
    newElement.classList.add(identifierUtils_1.OUTLINE_CLASS);
    if (type === OutlineType.CHILD || type === OutlineType.MOVE) {
        const dashThickness = 5 * zoomMultiplier;
        newElement.style.backgroundImage = getDashedBackgroundImage(isComponent ? palette.component : palette.primary, Math.max(1, Math.round(dashThickness)), Math.max(3, Math.round(dashThickness * 3)));
    }
    else {
        const thickness = type === OutlineType.SECONDARY
            ? 0.5 * zoomMultiplier
            : 1 * zoomMultiplier;
        if (thickness >= 0.5) {
            newElement.style.outline = `${thickness}px solid ${type === OutlineType.SECONDARY
                ? palette.secondary
                : isComponent
                    ? palette.component
                    : palette.primary}`;
        }
        newElement.style.border = `${thickness >= 0.5 ? thickness : thickness * 2}px solid ${type === OutlineType.SECONDARY
            ? palette.secondary
            : isComponent
                ? palette.component
                : palette.primary}`;
    }
    newElement.style.position = 'fixed';
    newElement.style.pointerEvents = 'none';
    switch (type) {
        case OutlineType.PRIMARY:
            newElement.style.zIndex = '2000000002';
            break;
        case OutlineType.SECONDARY:
            newElement.style.zIndex = '2000000001';
            break;
        case OutlineType.CHILD:
            newElement.style.zIndex = '2000000000';
            break;
        case OutlineType.MOVE:
            newElement.style.zIndex = '2000000003';
            break;
    }
    newElement.style.boxSizing = 'border-box';
    newElement.style.left = left + 'px';
    newElement.style.top = top + 'px';
    newElement.style.width = width + 'px';
    newElement.style.height = height + 'px';
    newElement.style.cursor = 'default !important';
    const limitedZoomMultiplier = Math.min(2, zoomMultiplier);
    if (type === OutlineType.PRIMARY && selected) {
        // Draw the size of the element underneath
        const sizeElement = document.createElement('div');
        newElement.appendChild(sizeElement);
        sizeElement.classList.add(identifierUtils_1.OUTLINE_CLASS);
        sizeElement.innerHTML = `${Math.round(width)} x ${Math.round(height)}`;
        sizeElement.style.color = 'white';
        sizeElement.style.backgroundColor = isComponent
            ? palette.component
            : palette.primary;
        sizeElement.style.padding = '4px 12px 4px 12px';
        sizeElement.style.height = '38px';
        sizeElement.style.borderRadius = '8px';
        sizeElement.style.position = 'absolute';
        sizeElement.style.left = `calc(${width}px / 2)`;
        sizeElement.style.fontSize = '20px';
        sizeElement.style.whiteSpace = 'nowrap';
        // After 22 it starts to merge into the border
        // 52 is the size of the element (38px) + double the size of the gap between the border and the element (7px)
        const bottomValue = -Math.max(22, 45 + (52 * limitedZoomMultiplier - 52) / 2);
        sizeElement.style.bottom = `${bottomValue}px`;
        sizeElement.style.transform = `scale(${limitedZoomMultiplier}) translateX(${-50 / limitedZoomMultiplier}%)`;
    }
    if (selected && tagName) {
        const topControlsWrapper = document.createElement('div');
        newElement.appendChild(topControlsWrapper);
        topControlsWrapper.style.display = 'flex';
        topControlsWrapper.style.width = width / limitedZoomMultiplier + 'px';
        topControlsWrapper.style.justifyContent = 'space-between';
        topControlsWrapper.style.flexDirection = 'row';
        topControlsWrapper.style.gap = '4px';
        topControlsWrapper.style.position = 'absolute';
        topControlsWrapper.style.left = `0px`;
        topControlsWrapper.style.transform = `scale(${limitedZoomMultiplier}) translateX(${50 - 50 / limitedZoomMultiplier}%) translateY(${-70 - 50 / limitedZoomMultiplier}%)`;
        // Draw the tagname above
        const tagNameElement = document.createElement('div');
        topControlsWrapper.appendChild(tagNameElement);
        tagNameElement.classList.add(identifierUtils_1.OUTLINE_CLASS);
        tagNameElement.innerHTML = tagName
            ? isComponent
                ? capitalizeFirstLetter(tagName)
                : tagName.toLowerCase()
            : '';
        tagNameElement.style.color = 'white';
        tagNameElement.style.backgroundColor = isComponent
            ? palette.component
            : palette.primary;
        tagNameElement.style.padding = '4px 12px 4px 12px';
        tagNameElement.style.height = '38px';
        tagNameElement.style.borderRadius = '8px';
        tagNameElement.style.fontSize = '20px';
        // If this node has direct static text inside of it, but is not editable, show the edit text
        // dynamically button
        if (type === OutlineType.PRIMARY) {
            const matchingNode = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${elementKey}`).get(0);
            const tempoElement = tempoElement_1.TempoElement.fromKey(elementKey || '');
            if ((0, editTextUtils_1.hasTextContents)(matchingNode) && !(0, editTextUtils_1.canEditText)(tempoElement)) {
                const newNode = getEditTextButtonNode(parentPort, isComponent ? palette.component : palette.primary, elementKey);
                topControlsWrapper.appendChild(newNode);
            }
        }
    }
    // TODO: Add in when we add resizing in the canvas
    // if (primary && selected) {
    //   for (let top = 1; top >= 0; top -= 1) {
    //     for (let left = 1; left >= 0; left -= 1) {
    //       const cornerElement = document.createElement("div");
    //       newElement.appendChild(cornerElement);
    //       cornerElement.classList.add(OUTLINE_CLASS);
    //       cornerElement.style.position = "absolute";
    //       cornerElement.style.width = Math.max(14 * zoomMultiplier, 1) + "px";
    //       cornerElement.style.height = Math.max(14 * zoomMultiplier, 1) + "px";
    //       cornerElement.style.backgroundColor = "white";
    //       cornerElement.style.cursor = "pointer";
    //       cornerElement.style.zIndex = "2000000002";
    //       if (top) {
    //         cornerElement.style.top = Math.min(-7 * zoomMultiplier, -0.5) + "px";
    //       } else {
    //         cornerElement.style.bottom = Math.min(-7 * zoomMultiplier, -0.5) + "px";
    //       }
    //       if (left) {
    //         cornerElement.style.left = Math.min(-8 * zoomMultiplier, -0.5) + "px";
    //       } else {
    //         cornerElement.style.right = Math.min(-8 * zoomMultiplier, -0.5) + "px";
    //       }
    //       cornerElement.style.outline = 2 * zoomMultiplier + "px solid " + PRIMARY_OUTLINE_COLOUR;
    //       cornerElement.style.pointerEvents = "auto";
    //     }
    //   }
    // }
    return newElement;
};
exports.getOutlineElement = getOutlineElement;
const clearAllOutlines = () => {
    (0, jquery_1.default)(`.${identifierUtils_1.OUTLINE_CLASS}`).remove();
};
exports.clearAllOutlines = clearAllOutlines;
/**
 * Creates all the necessary outlines for the hovered and selected elements
 * @returns
 */
const updateOutlines = (parentPort, storyboardId) => {
    (0, exports.clearAllOutlines)();
    const driveModeEnabled = !!(0, sessionStorageUtils_1.getSessionStorageItem)('driveModeEnabled', storyboardId);
    if (driveModeEnabled) {
        return;
    }
    const hoveredElementKey = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.HOVERED_ELEMENT_KEY);
    const selectedElementKey = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY);
    const multiselectedElementKeys = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.MULTI_SELECTED_ELEMENT_KEYS);
    const selectedElement = tempoElement_1.TempoElement.fromKey(selectedElementKey);
    const body = document.getElementsByTagName('body')[0];
    const elementKeyToNavNode = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.ELEMENT_KEY_TO_NAV_NODE) || {};
    const getBoundingBoxForElementKey = (elementKey) => {
        var _a, _b;
        const navNode = elementKeyToNavNode[elementKey];
        // Try to get the bounding box directly from the DOM, but fall back to the one cached
        // at Nav Tree build time
        const boundingBoxToUse = (_b = (_a = (0, jquery_1.default)('body')
            .find(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${elementKey}`)
            .get(0)) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect) === null || _b === void 0 ? void 0 : _b.call(_a);
        if (boundingBoxToUse) {
            return {
                left: boundingBoxToUse.left,
                top: boundingBoxToUse.top,
                width: boundingBoxToUse.width,
                height: boundingBoxToUse.height,
            };
        }
        if (navNode === null || navNode === void 0 ? void 0 : navNode.pageBoundingBox) {
            return {
                left: navNode.pageBoundingBox.pageX,
                top: navNode.pageBoundingBox.pageY,
                width: navNode.pageBoundingBox.width,
                height: navNode.pageBoundingBox.height,
            };
        }
        return null;
    };
    const createOutlinesForElementKey = (elementKey, selected, isChild, outlineChildren) => {
        var _a, _b;
        const navNode = elementKeyToNavNode[elementKey];
        if (!navNode) {
            return;
        }
        const tagNameToUse = navNode === null || navNode === void 0 ? void 0 : navNode.name;
        const boundingBox = getBoundingBoxForElementKey(elementKey);
        if (boundingBox) {
            body.appendChild((0, exports.getOutlineElement)(parentPort, isChild ? OutlineType.CHILD : OutlineType.PRIMARY, boundingBox.left, boundingBox.top, boundingBox.width, boundingBox.height, selected, tagNameToUse, navNode === null || navNode === void 0 ? void 0 : navNode.isComponent, elementKey));
            const mouseDragData = (0, sessionStorageUtils_1.getMemoryStorageItem)('mouseDragContext');
            const mousePosData = (0, sessionStorageUtils_1.getMemoryStorageItem)('mousePos');
            if (selected && (mouseDragData === null || mouseDragData === void 0 ? void 0 : mouseDragData.dragging) && mousePosData) {
                body.appendChild((0, exports.getOutlineElement)(parentPort, OutlineType.MOVE, mousePosData.pageX - boundingBox.width / 2 + mouseDragData.offsetX, mousePosData.pageY - boundingBox.height / 2 + mouseDragData.offsetY, boundingBox.width, boundingBox.height, undefined, undefined, navNode === null || navNode === void 0 ? void 0 : navNode.isComponent, elementKey));
            }
        }
        if (outlineChildren) {
            (_b = (_a = navNode === null || navNode === void 0 ? void 0 : navNode.children) === null || _a === void 0 ? void 0 : _a.forEach) === null || _b === void 0 ? void 0 : _b.call(_a, (child) => {
                createOutlinesForElementKey(child.tempoElement.getKey(), false, true, false);
            });
        }
    };
    if (hoveredElementKey) {
        createOutlinesForElementKey(hoveredElementKey, false, false, true);
    }
    if (multiselectedElementKeys === null || multiselectedElementKeys === void 0 ? void 0 : multiselectedElementKeys.length) {
        let fullBoundingBox = getBoundingBoxForElementKey(multiselectedElementKeys[0]);
        multiselectedElementKeys.slice(1).forEach((elementKey) => {
            const boundingRect = getBoundingBoxForElementKey(elementKey);
            if (boundingRect) {
                if (fullBoundingBox) {
                    const prevRight = fullBoundingBox.left + fullBoundingBox.width;
                    const prevBottom = fullBoundingBox.top + fullBoundingBox.height;
                    fullBoundingBox.left = Math.min(fullBoundingBox.left, boundingRect.left);
                    fullBoundingBox.top = Math.min(fullBoundingBox.top, boundingRect.top);
                    const right = Math.max(prevRight, boundingRect.left + boundingRect.width);
                    const bottom = Math.max(prevBottom, boundingRect.top + boundingRect.height);
                    fullBoundingBox.width = right - fullBoundingBox.left;
                    fullBoundingBox.height = bottom - fullBoundingBox.top;
                }
                else {
                    fullBoundingBox = boundingRect;
                }
            }
        });
        if (fullBoundingBox) {
            body.appendChild((0, exports.getOutlineElement)(parentPort, OutlineType.PRIMARY, fullBoundingBox.left, fullBoundingBox.top, fullBoundingBox.width, fullBoundingBox.height, true, `${multiselectedElementKeys.length} Elements`, false));
        }
        multiselectedElementKeys.forEach((elementKey) => {
            createOutlinesForElementKey(elementKey, false, false, false);
        });
    }
    else if (selectedElementKey) {
        createOutlinesForElementKey(selectedElementKey, true, false, false);
    }
    // Create outlines
    (0, jquery_1.default)(`.${identifierUtils_1.TEMPO_INSTANT_DIV_DRAW_CLASS}`).each((index, item) => {
        const boundingRect = item.getBoundingClientRect();
        body.appendChild((0, exports.getOutlineElement)(parentPort, OutlineType.PRIMARY, boundingRect.left, boundingRect.top, boundingRect.width, boundingRect.height));
    });
    (0, jquery_1.default)(`*[${identifierUtils_1.TEMPO_OUTLINE_UNTIL_REFESH}=true]`).each((index, item) => {
        const boundingRect = item.getBoundingClientRect();
        body.appendChild((0, exports.getOutlineElement)(parentPort, OutlineType.PRIMARY, boundingRect.left, boundingRect.top, boundingRect.width, boundingRect.height));
    });
    // Create secondary outlines for all matching IDs in the codebase for the clicked element
    if (selectedElement === null || selectedElement === void 0 ? void 0 : selectedElement.codebaseId) {
        (0, jquery_1.default)('body')
            .find(`.${selectedElement === null || selectedElement === void 0 ? void 0 : selectedElement.codebaseId}`)
            .not(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${selectedElementKey}`)
            .not(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${hoveredElementKey}`)
            .each((index, item) => {
            const boundingRect = item.getBoundingClientRect();
            body.appendChild((0, exports.getOutlineElement)(parentPort, OutlineType.SECONDARY, boundingRect.left, boundingRect.top, boundingRect.width, boundingRect.height));
        });
    }
};
exports.updateOutlines = updateOutlines;
const isNodeOutline = (node) => {
    if (!(node === null || node === void 0 ? void 0 : node.classList)) {
        return false;
    }
    let isOutline = false;
    node.classList.forEach((cls) => {
        if (cls === identifierUtils_1.OUTLINE_CLASS) {
            isOutline = true;
        }
    });
    return isOutline;
};
exports.isNodeOutline = isNodeOutline;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0bGluZVV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NoYW5uZWxNZXNzYWdpbmcvb3V0bGluZVV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHVEQU8yQjtBQUUzQiwrREFPK0I7QUFFL0IsYUFBYTtBQUNiLG9EQUF1QjtBQUN2QixpREFBOEM7QUFDOUMsbURBQStEO0FBQy9ELDJEQUErRDtBQUVsRCxRQUFBLHNCQUFzQixHQUFHLFNBQVMsQ0FBQztBQUNuQyxRQUFBLHdCQUF3QixHQUFHLFNBQVMsQ0FBQztBQUNyQyxRQUFBLCtCQUErQixHQUFHLFNBQVMsQ0FBQztBQUV6RCxJQUFZLFdBS1g7QUFMRCxXQUFZLFdBQVc7SUFDckIsbURBQU8sQ0FBQTtJQUNQLHVEQUFTLENBQUE7SUFDVCwrQ0FBSyxDQUFBO0lBQ0wsNkNBQUksQ0FBQTtBQUNOLENBQUMsRUFMVyxXQUFXLDJCQUFYLFdBQVcsUUFLdEI7QUFRRDs7R0FFRztBQUNILE1BQU0sT0FBTyxHQUFHLEdBQVksRUFBRTtJQUM1QixNQUFNLGtCQUFrQixHQUFHLElBQUEsMENBQW9CLEVBQUMsV0FBVyxDQUFDLENBQUM7SUFFN0QsSUFBSSxrQkFBa0IsRUFBRTtRQUN0QixPQUFPO1lBQ0wsT0FBTyxFQUFFLFNBQVM7WUFDbEIsU0FBUyxFQUFFLFNBQVM7WUFDcEIsU0FBUyxFQUFFLFNBQVM7U0FDckIsQ0FBQztLQUNIO0lBRUQsT0FBTztRQUNMLE9BQU8sRUFBRSw4QkFBc0I7UUFDL0IsU0FBUyxFQUFFLGdDQUF3QjtRQUNuQyxTQUFTLEVBQUUsdUNBQStCO0tBQzNDLENBQUM7QUFDSixDQUFDLENBQUM7QUFFRixNQUFNLHdCQUF3QixHQUFHLENBQy9CLFdBQW1CLEVBQ25CLFNBQWlCLEVBQ2pCLE9BQWUsRUFDZixFQUFFO0lBQ0YsT0FBTyxpS0FBaUssV0FBVyxDQUFDLE9BQU8sQ0FDekwsR0FBRyxFQUNILEtBQUssQ0FDTixtQkFB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QyxPQUFPLENBQUMsQ0FBQyxHQUFXLEVBQUUsRUFBRTtRQUNyQyxJQUFJLEdBQUcsS0FBSywrQkFBYSxFQUFFO1lBQ3pCLFNBQVMsR0FBRyxJQUFJLENBQUM7U0FDbEI7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUMsQ0FBQztBQWJXLFFBQUEsYUFBYSxpQkFheEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBFRElUX1RFWFRfQlVUVE9OLFxuICBFTEVNRU5UX0tFWV9QUkVGSVgsXG4gIE9VVExJTkVfQ0xBU1MsXG4gIFRFTVBPX0RFTEVURV9BRlRFUl9SRUZSRVNILFxuICBURU1QT19JTlNUQU5UX0RJVl9EUkFXX0NMQVNTLFxuICBURU1QT19PVVRMSU5FX1VOVElMX1JFRkVTSCxcbn0gZnJvbSAnLi9pZGVudGlmaWVyVXRpbHMnO1xuaW1wb3J0IHsgTmF2VHJlZU5vZGUgfSBmcm9tICcuL25hdlRyZWVVdGlscyc7XG5pbXBvcnQge1xuICBFTEVNRU5UX0tFWV9UT19OQVZfTk9ERSxcbiAgSE9WRVJFRF9FTEVNRU5UX0tFWSxcbiAgTVVMVElfU0VMRUNURURfRUxFTUVOVF9LRVlTLFxuICBTRUxFQ1RFRF9FTEVNRU5UX0tFWSxcbiAgZ2V0TWVtb3J5U3RvcmFnZUl0ZW0sXG4gIGdldFNlc3Npb25TdG9yYWdlSXRlbSxcbn0gZnJvbSAnLi9zZXNzaW9uU3RvcmFnZVV0aWxzJztcblxuLy8gQHRzLWlnbm9yZVxuaW1wb3J0ICQgZnJvbSAnanF1ZXJ5JztcbmltcG9ydCB7IFRlbXBvRWxlbWVudCB9IGZyb20gJy4vdGVtcG9FbGVtZW50JztcbmltcG9ydCB7IGNhbkVkaXRUZXh0LCBoYXNUZXh0Q29udGVudHMgfSBmcm9tICcuL2VkaXRUZXh0VXRpbHMnO1xuaW1wb3J0IHsgRklYRURfSUZSQU1FX01FU1NBR0VfSURTIH0gZnJvbSAnLi9jb25zdGFudHNBbmRUeXBlcyc7XG5cbmV4cG9ydCBjb25zdCBQUklNQVJZX09VVExJTkVfQ09MT1VSID0gJyM0NTk3RjcnO1xuZXhwb3J0IGNvbnN0IFNFQ09OREFSWV9PVVRMSU5FX0NPTE9VUiA9ICcjNDU5N0Y3JztcbmV4cG9ydCBjb25zdCBQUklNQVJZX0NPTVBPTkVOVF9PVVRMSU5FX0NPTE9SID0gJyM2MTgzZTQnO1xuXG5leHBvcnQgZW51bSBPdXRsaW5lVHlwZSB7XG4gIFBSSU1BUlksXG4gIFNFQ09OREFSWSxcbiAgQ0hJTEQsXG4gIE1PVkUsXG59XG5cbmludGVyZmFjZSBQYWxldHRlIHtcbiAgcHJpbWFyeTogc3RyaW5nO1xuICBzZWNvbmRhcnk6IHN0cmluZztcbiAgY29tcG9uZW50OiBzdHJpbmc7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIGNvbnRleHQtYmFzZWQgcGFsZXR0ZSBvZiBjb2xvdXJzIHRvIHVzZSBmb3IgdGhlIG91dGxpbmVzLlxuICovXG5jb25zdCBjb2xvdXJzID0gKCk6IFBhbGV0dGUgPT4ge1xuICBjb25zdCBhaUNvbnRleHRTZWxlY3Rpb24gPSBnZXRNZW1vcnlTdG9yYWdlSXRlbSgnYWlDb250ZXh0Jyk7XG5cbiAgaWYgKGFpQ29udGV4dFNlbGVjdGlvbikge1xuICAgIHJldHVybiB7XG4gICAgICBwcmltYXJ5OiAnIzY4NThmNScsXG4gICAgICBzZWNvbmRhcnk6ICcjNjg1OGY1JyxcbiAgICAgIGNvbXBvbmVudDogJyM1MjQ2QzInLFxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHByaW1hcnk6IFBSSU1BUllfT1VUTElORV9DT0xPVVIsXG4gICAgc2Vjb25kYXJ5OiBTRUNPTkRBUllfT1VUTElORV9DT0xPVVIsXG4gICAgY29tcG9uZW50OiBQUklNQVJZX0NPTVBPTkVOVF9PVVRMSU5FX0NPTE9SLFxuICB9O1xufTtcblxuY29uc3QgZ2V0RGFzaGVkQmFja2dyb3VuZEltYWdlID0gKFxuICBzdHJva2VDb2xvcjogc3RyaW5nLFxuICBkYXNoV2lkdGg6IG51bWJlcixcbiAgZGFzaEdhcDogbnVtYmVyLFxuKSA9PiB7XG4gIHJldHVybiBgdXJsKFwiZGF0YTppbWFnZS9zdmcreG1sLCUzY3N2ZyB3aWR0aD0nMTAwJTI1JyBoZWlnaHQ9JzEwMCUyNScgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJyUzZSUzY3JlY3Qgd2lkdGg9JzEwMCUyNScgaGVpZ2h0PScxMDAlMjUnIGZpbGw9J25vbmUnIHN0cm9rZT0nJHtzdHJva2VDb2xvci5yZXBsYWNlKFxuICAgICcjJyxcbiAgICAnJTIzJyxcbiAgKX0nIHN0cm9rZS13aWR0aD0nJHtkYXNoV2lkdGh9JyBzdHJva2UtZGFzaGFycmF5PScxJTJjICR7ZGFzaEdhcH0nIHN0cm9rZS1kYXNob2Zmc2V0PScwJyBzdHJva2UtbGluZWNhcD0nc3F1YXJlJy8lM2UlM2Mvc3ZnJTNlXCIpYDtcbn07XG5cbmNvbnN0IGNhcGl0YWxpemVGaXJzdExldHRlciA9IChzdHI6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gIHJldHVybiBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc2xpY2UoMSk7XG59O1xuXG5jb25zdCBnZXRQZW5jaWxTVkcgPSAoKSA9PiB7XG4gIHJldHVybiBgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiIGNsYXNzPVwibHVjaWRlIGx1Y2lkZS1wZW5jaWxcIj48cGF0aCBkPVwiTTE3IDNhMi44NSAyLjgzIDAgMSAxIDQgNEw3LjUgMjAuNSAyIDIybDEuNS01LjVaXCIvPjxwYXRoIGQ9XCJtMTUgNSA0IDRcIi8+PC9zdmc+YDtcbn07XG5cbmNvbnN0IGdldEVkaXRUZXh0QnV0dG9uTm9kZSA9IChcbiAgcGFyZW50UG9ydDogYW55LFxuICBiZ0NvbG9yOiBzdHJpbmcsXG4gIGVsZW1lbnRLZXk/OiBzdHJpbmcsXG4pID0+IHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICBjb25zdCB0ZXh0RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGV4dEVsLmlubmVyVGV4dCA9ICdFZGl0IER5bmFtaWMgVGV4dCc7XG4gIHRleHRFbC5jbGFzc0xpc3QuYWRkKEVESVRfVEVYVF9CVVRUT04pO1xuICB0ZXh0RWwuY2xhc3NMaXN0LmFkZChPVVRMSU5FX0NMQVNTKTtcblxuICAvLyBGaXJzdCBhcHBlbmQgdGhlIHBlbmNpbCBTVkdcbiAgY29uc3QgcGVuY2lsU1ZHID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHBlbmNpbFNWRy5pbm5lckhUTUwgPSBnZXRQZW5jaWxTVkcoKTtcbiAgcGVuY2lsU1ZHLnN0eWxlLndpZHRoID0gJzIycHgnO1xuICBwZW5jaWxTVkcuc3R5bGUuaGVpZ2h0ID0gJzIycHgnO1xuICBwZW5jaWxTVkcuY2xhc3NMaXN0LmFkZChFRElUX1RFWFRfQlVUVE9OKTtcbiAgcGVuY2lsU1ZHLmNsYXNzTGlzdC5hZGQoT1VUTElORV9DTEFTUyk7XG5cbiAgZWwuYXBwZW5kQ2hpbGQocGVuY2lsU1ZHKTtcbiAgZWwuYXBwZW5kQ2hpbGQodGV4dEVsKTtcblxuICBlbC5jbGFzc0xpc3QuYWRkKE9VVExJTkVfQ0xBU1MpO1xuICBlbC5jbGFzc0xpc3QuYWRkKEVESVRfVEVYVF9CVVRUT04pO1xuICBlbC5zdHlsZS5jb2xvciA9ICd3aGl0ZSc7XG4gIGVsLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgZWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gYmdDb2xvcjtcbiAgZWwuc3R5bGUucGFkZGluZyA9ICc0cHggMTJweCA0cHggMTJweCc7XG4gIGVsLnN0eWxlLmJvcmRlclJhZGl1cyA9ICc4cHgnO1xuICBlbC5zdHlsZS5mb250U2l6ZSA9ICcyMHB4JztcbiAgZWwuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbiAgZWwuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgZWwuc3R5bGUuZmxleERpcmVjdGlvbiA9ICdyb3cnO1xuICBlbC5zdHlsZS5hbGlnbkl0ZW1zID0gJ2NlbnRlcic7XG4gIGVsLnN0eWxlLmp1c3RpZnlDb250ZW50ID0gJ2NlbnRlcic7XG4gIGVsLnN0eWxlLmdhcCA9ICc4cHgnO1xuXG4gIC8vIFdoZW4gY2xpY2tpbmcsIHRyaWdnZXIgYW4gb3BlbiBpbiBlZGl0b3IgYWN0aW9uXG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJkb3duJywgKGUpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgIHBhcmVudFBvcnQucG9zdE1lc3NhZ2Uoe1xuICAgICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5FRElUX0RZTkFNSUNfVEVYVCxcbiAgICAgIGVsZW1lbnRLZXksXG4gICAgfSk7XG4gIH0pO1xuXG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJ1cCcsIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH0pO1xuXG4gIHJldHVybiBlbDtcbn07XG5cbmV4cG9ydCBjb25zdCBnZXRPdXRsaW5lRWxlbWVudCA9IChcbiAgcGFyZW50UG9ydDogYW55LFxuICB0eXBlOiBPdXRsaW5lVHlwZSxcbiAgcGFnZUxlZnQ6IG51bWJlcixcbiAgcGFnZVRvcDogbnVtYmVyLFxuICB3aWR0aDogbnVtYmVyLFxuICBoZWlnaHQ6IG51bWJlcixcbiAgc2VsZWN0ZWQ/OiBib29sZWFuLFxuICB0YWdOYW1lPzogc3RyaW5nLFxuICBpc0NvbXBvbmVudD86IGJvb2xlYW4sXG4gIGVsZW1lbnRLZXk/OiBzdHJpbmcsXG4pID0+IHtcbiAgY29uc3QgcGFsZXR0ZTogUGFsZXR0ZSA9IGNvbG91cnMoKTtcbiAgY29uc3QgbGVmdCA9IHBhZ2VMZWZ0O1xuICBjb25zdCB0b3AgPSBwYWdlVG9wO1xuXG4gIGNvbnN0IHpvb21QZXJjID0gZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oJ3pvb21QZXJjJyk7XG4gIGNvbnN0IHpvb21NdWx0aXBsaWVyID0gem9vbVBlcmMgPyAxIC8gTnVtYmVyKHpvb21QZXJjKSA6IDE7XG5cbiAgY29uc3QgbmV3RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBuZXdFbGVtZW50LmNsYXNzTGlzdC5hZGQoT1VUTElORV9DTEFTUyk7XG5cbiAgaWYgKHR5cGUgPT09IE91dGxpbmVUeXBlLkNISUxEIHx8IHR5cGUgPT09IE91dGxpbmVUeXBlLk1PVkUpIHtcbiAgICBjb25zdCBkYXNoVGhpY2tuZXNzID0gNSAqIHpvb21NdWx0aXBsaWVyO1xuICAgIG5ld0VsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gZ2V0RGFzaGVkQmFja2dyb3VuZEltYWdlKFxuICAgICAgaXNDb21wb25lbnQgPyBwYWxldHRlLmNvbXBvbmVudCA6IHBhbGV0dGUucHJpbWFyeSxcbiAgICAgIE1hdGgubWF4KDEsIE1hdGgucm91bmQoZGFzaFRoaWNrbmVzcykpLFxuICAgICAgTWF0aC5tYXgoMywgTWF0aC5yb3VuZChkYXNoVGhpY2tuZXNzICogMykpLFxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdGhpY2tuZXNzID1cbiAgICAgIHR5cGUgPT09IE91dGxpbmVUeXBlLlNFQ09OREFSWVxuICAgICAgICA/IDAuNSAqIHpvb21NdWx0aXBsaWVyXG4gICAgICAgIDogMSAqIHpvb21NdWx0aXBsaWVyO1xuICAgIGlmICh0aGlja25lc3MgPj0gMC41KSB7XG4gICAgICBuZXdFbGVtZW50LnN0eWxlLm91dGxpbmUgPSBgJHt0aGlja25lc3N9cHggc29saWQgJHtcbiAgICAgICAgdHlwZSA9PT0gT3V0bGluZVR5cGUuU0VDT05EQVJZXG4gICAgICAgICAgPyBwYWxldHRlLnNlY29uZGFyeVxuICAgICAgICAgIDogaXNDb21wb25lbnRcbiAgICAgICAgICA/IHBhbGV0dGUuY29tcG9uZW50XG4gICAgICAgICAgOiBwYWxldHRlLnByaW1hcnlcbiAgICAgIH1gO1xuICAgIH1cblxuICAgIG5ld0VsZW1lbnQuc3R5bGUuYm9yZGVyID0gYCR7XG4gICAgICB0aGlja25lc3MgPj0gMC41ID8gdGhpY2tuZXNzIDogdGhpY2tuZXNzICogMlxuICAgIH1weCBzb2xpZCAke1xuICAgICAgdHlwZSA9PT0gT3V0bGluZVR5cGUuU0VDT05EQVJZXG4gICAgICAgID8gcGFsZXR0ZS5zZWNvbmRhcnlcbiAgICAgICAgOiBpc0NvbXBvbmVudFxuICAgICAgICA/IHBhbGV0dGUuY29tcG9uZW50XG4gICAgICAgIDogcGFsZXR0ZS5wcmltYXJ5XG4gICAgfWA7XG4gIH1cblxuICBuZXdFbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgbmV3RWxlbWVudC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlIE91dGxpbmVUeXBlLlBSSU1BUlk6XG4gICAgICBuZXdFbGVtZW50LnN0eWxlLnpJbmRleCA9ICcyMDAwMDAwMDAyJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgT3V0bGluZVR5cGUuU0VDT05EQVJZOlxuICAgICAgbmV3RWxlbWVudC5zdHlsZS56SW5kZXggPSAnMjAwMDAwMDAwMSc7XG4gICAgICBicmVhaztcbiAgICBjYXNlIE91dGxpbmVUeXBlLkNISUxEOlxuICAgICAgbmV3RWxlbWVudC5zdHlsZS56SW5kZXggPSAnMjAwMDAwMDAwMCc7XG4gICAgICBicmVhaztcbiAgICBjYXNlIE91dGxpbmVUeXBlLk1PVkU6XG4gICAgICBuZXdFbGVtZW50LnN0eWxlLnpJbmRleCA9ICcyMDAwMDAwMDAzJztcbiAgICAgIGJyZWFrO1xuICB9XG4gIG5ld0VsZW1lbnQuc3R5bGUuYm94U2l6aW5nID0gJ2JvcmRlci1ib3gnO1xuICBuZXdFbGVtZW50LnN0eWxlLmxlZnQgPSBsZWZ0ICsgJ3B4JztcbiAgbmV3RWxlbWVudC5zdHlsZS50b3AgPSB0b3AgKyAncHgnO1xuICBuZXdFbGVtZW50LnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuICBuZXdFbGVtZW50LnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG4gIG5ld0VsZW1lbnQuc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQgIWltcG9ydGFudCc7XG5cbiAgY29uc3QgbGltaXRlZFpvb21NdWx0aXBsaWVyID0gTWF0aC5taW4oMiwgem9vbU11bHRpcGxpZXIpO1xuXG4gIGlmICh0eXBlID09PSBPdXRsaW5lVHlwZS5QUklNQVJZICYmIHNlbGVjdGVkKSB7XG4gICAgLy8gRHJhdyB0aGUgc2l6ZSBvZiB0aGUgZWxlbWVudCB1bmRlcm5lYXRoXG4gICAgY29uc3Qgc2l6ZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBuZXdFbGVtZW50LmFwcGVuZENoaWxkKHNpemVFbGVtZW50KTtcblxuICAgIHNpemVFbGVtZW50LmNsYXNzTGlzdC5hZGQoT1VUTElORV9DTEFTUyk7XG4gICAgc2l6ZUVsZW1lbnQuaW5uZXJIVE1MID0gYCR7TWF0aC5yb3VuZCh3aWR0aCl9IHggJHtNYXRoLnJvdW5kKGhlaWdodCl9YDtcbiAgICBzaXplRWxlbWVudC5zdHlsZS5jb2xvciA9ICd3aGl0ZSc7XG4gICAgc2l6ZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gaXNDb21wb25lbnRcbiAgICAgID8gcGFsZXR0ZS5jb21wb25lbnRcbiAgICAgIDogcGFsZXR0ZS5wcmltYXJ5O1xuICAgIHNpemVFbGVtZW50LnN0eWxlLnBhZGRpbmcgPSAnNHB4IDEycHggNHB4IDEycHgnO1xuICAgIHNpemVFbGVtZW50LnN0eWxlLmhlaWdodCA9ICczOHB4JztcbiAgICBzaXplRWxlbWVudC5zdHlsZS5ib3JkZXJSYWRpdXMgPSAnOHB4JztcbiAgICBzaXplRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgc2l6ZUVsZW1lbnQuc3R5bGUubGVmdCA9IGBjYWxjKCR7d2lkdGh9cHggLyAyKWA7XG4gICAgc2l6ZUVsZW1lbnQuc3R5bGUuZm9udFNpemUgPSAnMjBweCc7XG4gICAgc2l6ZUVsZW1lbnQuc3R5bGUud2hpdGVTcGFjZSA9ICdub3dyYXAnO1xuXG4gICAgLy8gQWZ0ZXIgMjIgaXQgc3RhcnRzIHRvIG1lcmdlIGludG8gdGhlIGJvcmRlclxuICAgIC8vIDUyIGlzIHRoZSBzaXplIG9mIHRoZSBlbGVtZW50ICgzOHB4KSArIGRvdWJsZSB0aGUgc2l6ZSBvZiB0aGUgZ2FwIGJldHdlZW4gdGhlIGJvcmRlciBhbmQgdGhlIGVsZW1lbnQgKDdweClcbiAgICBjb25zdCBib3R0b21WYWx1ZSA9IC1NYXRoLm1heChcbiAgICAgIDIyLFxuICAgICAgNDUgKyAoNTIgKiBsaW1pdGVkWm9vbU11bHRpcGxpZXIgLSA1MikgLyAyLFxuICAgICk7XG5cbiAgICBzaXplRWxlbWVudC5zdHlsZS5ib3R0b20gPSBgJHtib3R0b21WYWx1ZX1weGA7XG4gICAgc2l6ZUVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gYHNjYWxlKCR7bGltaXRlZFpvb21NdWx0aXBsaWVyfSkgdHJhbnNsYXRlWCgke1xuICAgICAgLTUwIC8gbGltaXRlZFpvb21NdWx0aXBsaWVyXG4gICAgfSUpYDtcbiAgfVxuXG4gIGlmIChzZWxlY3RlZCAmJiB0YWdOYW1lKSB7XG4gICAgY29uc3QgdG9wQ29udHJvbHNXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbmV3RWxlbWVudC5hcHBlbmRDaGlsZCh0b3BDb250cm9sc1dyYXBwZXIpO1xuXG4gICAgdG9wQ29udHJvbHNXcmFwcGVyLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgdG9wQ29udHJvbHNXcmFwcGVyLnN0eWxlLndpZHRoID0gd2lkdGggLyBsaW1pdGVkWm9vbU11bHRpcGxpZXIgKyAncHgnO1xuICAgIHRvcENvbnRyb2xzV3JhcHBlci5zdHlsZS5qdXN0aWZ5Q29udGVudCA9ICdzcGFjZS1iZXR3ZWVuJztcbiAgICB0b3BDb250cm9sc1dyYXBwZXIuc3R5bGUuZmxleERpcmVjdGlvbiA9ICdyb3cnO1xuICAgIHRvcENvbnRyb2xzV3JhcHBlci5zdHlsZS5nYXAgPSAnNHB4JztcbiAgICB0b3BDb250cm9sc1dyYXBwZXIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIHRvcENvbnRyb2xzV3JhcHBlci5zdHlsZS5sZWZ0ID0gYDBweGA7XG4gICAgdG9wQ29udHJvbHNXcmFwcGVyLnN0eWxlLnRyYW5zZm9ybSA9IGBzY2FsZSgke2xpbWl0ZWRab29tTXVsdGlwbGllcn0pIHRyYW5zbGF0ZVgoJHtcbiAgICAgIDUwIC0gNTAgLyBsaW1pdGVkWm9vbU11bHRpcGxpZXJcbiAgICB9JSkgdHJhbnNsYXRlWSgkey03MCAtIDUwIC8gbGltaXRlZFpvb21NdWx0aXBsaWVyfSUpYDtcblxuICAgIC8vIERyYXcgdGhlIHRhZ25hbWUgYWJvdmVcbiAgICBjb25zdCB0YWdOYW1lRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRvcENvbnRyb2xzV3JhcHBlci5hcHBlbmRDaGlsZCh0YWdOYW1lRWxlbWVudCk7XG5cbiAgICB0YWdOYW1lRWxlbWVudC5jbGFzc0xpc3QuYWRkKE9VVExJTkVfQ0xBU1MpO1xuICAgIHRhZ05hbWVFbGVtZW50LmlubmVySFRNTCA9IHRhZ05hbWVcbiAgICAgID8gaXNDb21wb25lbnRcbiAgICAgICAgPyBjYXBpdGFsaXplRmlyc3RMZXR0ZXIodGFnTmFtZSlcbiAgICAgICAgOiB0YWdOYW1lLnRvTG93ZXJDYXNlKClcbiAgICAgIDogJyc7XG4gICAgdGFnTmFtZUVsZW1lbnQuc3R5bGUuY29sb3IgPSAnd2hpdGUnO1xuICAgIHRhZ05hbWVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGlzQ29tcG9uZW50XG4gICAgICA/IHBhbGV0dGUuY29tcG9uZW50XG4gICAgICA6IHBhbGV0dGUucHJpbWFyeTtcbiAgICB0YWdOYW1lRWxlbWVudC5zdHlsZS5wYWRkaW5nID0gJzRweCAxMnB4IDRweCAxMnB4JztcbiAgICB0YWdOYW1lRWxlbWVudC5zdHlsZS5oZWlnaHQgPSAnMzhweCc7XG4gICAgdGFnTmFtZUVsZW1lbnQuc3R5bGUuYm9yZGVyUmFkaXVzID0gJzhweCc7XG4gICAgdGFnTmFtZUVsZW1lbnQuc3R5bGUuZm9udFNpemUgPSAnMjBweCc7XG5cbiAgICAvLyBJZiB0aGlzIG5vZGUgaGFzIGRpcmVjdCBzdGF0aWMgdGV4dCBpbnNpZGUgb2YgaXQsIGJ1dCBpcyBub3QgZWRpdGFibGUsIHNob3cgdGhlIGVkaXQgdGV4dFxuICAgIC8vIGR5bmFtaWNhbGx5IGJ1dHRvblxuICAgIGlmICh0eXBlID09PSBPdXRsaW5lVHlwZS5QUklNQVJZKSB7XG4gICAgICBjb25zdCBtYXRjaGluZ05vZGUgPSAkKGAuJHtFTEVNRU5UX0tFWV9QUkVGSVh9JHtlbGVtZW50S2V5fWApLmdldCgwKTtcbiAgICAgIGNvbnN0IHRlbXBvRWxlbWVudCA9IFRlbXBvRWxlbWVudC5mcm9tS2V5KGVsZW1lbnRLZXkgfHwgJycpO1xuICAgICAgaWYgKGhhc1RleHRDb250ZW50cyhtYXRjaGluZ05vZGUpICYmICFjYW5FZGl0VGV4dCh0ZW1wb0VsZW1lbnQpKSB7XG4gICAgICAgIGNvbnN0IG5ld05vZGUgPSBnZXRFZGl0VGV4dEJ1dHRvbk5vZGUoXG4gICAgICAgICAgcGFyZW50UG9ydCxcbiAgICAgICAgICBpc0NvbXBvbmVudCA/IHBhbGV0dGUuY29tcG9uZW50IDogcGFsZXR0ZS5wcmltYXJ5LFxuICAgICAgICAgIGVsZW1lbnRLZXksXG4gICAgICAgICk7XG4gICAgICAgIHRvcENvbnRyb2xzV3JhcHBlci5hcHBlbmRDaGlsZChuZXdOb2RlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBUT0RPOiBBZGQgaW4gd2hlbiB3ZSBhZGQgcmVzaXppbmcgaW4gdGhlIGNhbnZhc1xuICAvLyBpZiAocHJpbWFyeSAmJiBzZWxlY3RlZCkge1xuICAvLyAgIGZvciAobGV0IHRvcCA9IDE7IHRvcCA+PSAwOyB0b3AgLT0gMSkge1xuICAvLyAgICAgZm9yIChsZXQgbGVmdCA9IDE7IGxlZnQgPj0gMDsgbGVmdCAtPSAxKSB7XG4gIC8vICAgICAgIGNvbnN0IGNvcm5lckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAvLyAgICAgICBuZXdFbGVtZW50LmFwcGVuZENoaWxkKGNvcm5lckVsZW1lbnQpO1xuICAvLyAgICAgICBjb3JuZXJFbGVtZW50LmNsYXNzTGlzdC5hZGQoT1VUTElORV9DTEFTUyk7XG5cbiAgLy8gICAgICAgY29ybmVyRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgLy8gICAgICAgY29ybmVyRWxlbWVudC5zdHlsZS53aWR0aCA9IE1hdGgubWF4KDE0ICogem9vbU11bHRpcGxpZXIsIDEpICsgXCJweFwiO1xuICAvLyAgICAgICBjb3JuZXJFbGVtZW50LnN0eWxlLmhlaWdodCA9IE1hdGgubWF4KDE0ICogem9vbU11bHRpcGxpZXIsIDEpICsgXCJweFwiO1xuICAvLyAgICAgICBjb3JuZXJFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwid2hpdGVcIjtcbiAgLy8gICAgICAgY29ybmVyRWxlbWVudC5zdHlsZS5jdXJzb3IgPSBcInBvaW50ZXJcIjtcbiAgLy8gICAgICAgY29ybmVyRWxlbWVudC5zdHlsZS56SW5kZXggPSBcIjIwMDAwMDAwMDJcIjtcbiAgLy8gICAgICAgaWYgKHRvcCkge1xuICAvLyAgICAgICAgIGNvcm5lckVsZW1lbnQuc3R5bGUudG9wID0gTWF0aC5taW4oLTcgKiB6b29tTXVsdGlwbGllciwgLTAuNSkgKyBcInB4XCI7XG4gIC8vICAgICAgIH0gZWxzZSB7XG4gIC8vICAgICAgICAgY29ybmVyRWxlbWVudC5zdHlsZS5ib3R0b20gPSBNYXRoLm1pbigtNyAqIHpvb21NdWx0aXBsaWVyLCAtMC41KSArIFwicHhcIjtcbiAgLy8gICAgICAgfVxuXG4gIC8vICAgICAgIGlmIChsZWZ0KSB7XG4gIC8vICAgICAgICAgY29ybmVyRWxlbWVudC5zdHlsZS5sZWZ0ID0gTWF0aC5taW4oLTggKiB6b29tTXVsdGlwbGllciwgLTAuNSkgKyBcInB4XCI7XG4gIC8vICAgICAgIH0gZWxzZSB7XG4gIC8vICAgICAgICAgY29ybmVyRWxlbWVudC5zdHlsZS5yaWdodCA9IE1hdGgubWluKC04ICogem9vbU11bHRpcGxpZXIsIC0wLjUpICsgXCJweFwiO1xuICAvLyAgICAgICB9XG5cbiAgLy8gICAgICAgY29ybmVyRWxlbWVudC5zdHlsZS5vdXRsaW5lID0gMiAqIHpvb21NdWx0aXBsaWVyICsgXCJweCBzb2xpZCBcIiArIFBSSU1BUllfT1VUTElORV9DT0xPVVI7XG4gIC8vICAgICAgIGNvcm5lckVsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9IFwiYXV0b1wiO1xuICAvLyAgICAgfVxuICAvLyAgIH1cbiAgLy8gfVxuXG4gIHJldHVybiBuZXdFbGVtZW50O1xufTtcblxuZXhwb3J0IGNvbnN0IGNsZWFyQWxsT3V0bGluZXMgPSAoKSA9PiB7XG4gICQoYC4ke09VVExJTkVfQ0xBU1N9YCkucmVtb3ZlKCk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYWxsIHRoZSBuZWNlc3Nhcnkgb3V0bGluZXMgZm9yIHRoZSBob3ZlcmVkIGFuZCBzZWxlY3RlZCBlbGVtZW50c1xuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGNvbnN0IHVwZGF0ZU91dGxpbmVzID0gKHBhcmVudFBvcnQ6IGFueSwgc3Rvcnlib2FyZElkOiBzdHJpbmcpID0+IHtcbiAgY2xlYXJBbGxPdXRsaW5lcygpO1xuXG4gIGNvbnN0IGRyaXZlTW9kZUVuYWJsZWQgPSAhIWdldFNlc3Npb25TdG9yYWdlSXRlbShcbiAgICAnZHJpdmVNb2RlRW5hYmxlZCcsXG4gICAgc3Rvcnlib2FyZElkLFxuICApO1xuXG4gIGlmIChkcml2ZU1vZGVFbmFibGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgaG92ZXJlZEVsZW1lbnRLZXkgPSBnZXRNZW1vcnlTdG9yYWdlSXRlbShIT1ZFUkVEX0VMRU1FTlRfS0VZKTtcbiAgY29uc3Qgc2VsZWN0ZWRFbGVtZW50S2V5ID0gZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oU0VMRUNURURfRUxFTUVOVF9LRVkpO1xuICBjb25zdCBtdWx0aXNlbGVjdGVkRWxlbWVudEtleXM6IHN0cmluZ1tdID0gZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oXG4gICAgTVVMVElfU0VMRUNURURfRUxFTUVOVF9LRVlTLFxuICApO1xuICBjb25zdCBzZWxlY3RlZEVsZW1lbnQgPSBUZW1wb0VsZW1lbnQuZnJvbUtleShzZWxlY3RlZEVsZW1lbnRLZXkpO1xuXG4gIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdO1xuXG4gIGNvbnN0IGVsZW1lbnRLZXlUb05hdk5vZGU6IGFueSA9XG4gICAgZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oRUxFTUVOVF9LRVlfVE9fTkFWX05PREUpIHx8IHt9O1xuXG4gIGNvbnN0IGdldEJvdW5kaW5nQm94Rm9yRWxlbWVudEtleSA9IChlbGVtZW50S2V5OiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBuYXZOb2RlOiBOYXZUcmVlTm9kZSA9IGVsZW1lbnRLZXlUb05hdk5vZGVbZWxlbWVudEtleV07XG5cbiAgICAvLyBUcnkgdG8gZ2V0IHRoZSBib3VuZGluZyBib3ggZGlyZWN0bHkgZnJvbSB0aGUgRE9NLCBidXQgZmFsbCBiYWNrIHRvIHRoZSBvbmUgY2FjaGVkXG4gICAgLy8gYXQgTmF2IFRyZWUgYnVpbGQgdGltZVxuICAgIGNvbnN0IGJvdW5kaW5nQm94VG9Vc2UgPSAkKCdib2R5JylcbiAgICAgIC5maW5kKGAuJHtFTEVNRU5UX0tFWV9QUkVGSVh9JHtlbGVtZW50S2V5fWApXG4gICAgICAuZ2V0KDApXG4gICAgICA/LmdldEJvdW5kaW5nQ2xpZW50UmVjdD8uKCk7XG5cbiAgICBpZiAoYm91bmRpbmdCb3hUb1VzZSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogYm91bmRpbmdCb3hUb1VzZS5sZWZ0LFxuICAgICAgICB0b3A6IGJvdW5kaW5nQm94VG9Vc2UudG9wLFxuICAgICAgICB3aWR0aDogYm91bmRpbmdCb3hUb1VzZS53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiBib3VuZGluZ0JveFRvVXNlLmhlaWdodCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKG5hdk5vZGU/LnBhZ2VCb3VuZGluZ0JveCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogbmF2Tm9kZS5wYWdlQm91bmRpbmdCb3gucGFnZVgsXG4gICAgICAgIHRvcDogbmF2Tm9kZS5wYWdlQm91bmRpbmdCb3gucGFnZVksXG4gICAgICAgIHdpZHRoOiBuYXZOb2RlLnBhZ2VCb3VuZGluZ0JveC53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiBuYXZOb2RlLnBhZ2VCb3VuZGluZ0JveC5oZWlnaHQsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9O1xuXG4gIGNvbnN0IGNyZWF0ZU91dGxpbmVzRm9yRWxlbWVudEtleSA9IChcbiAgICBlbGVtZW50S2V5OiBzdHJpbmcsXG4gICAgc2VsZWN0ZWQ6IGJvb2xlYW4sXG4gICAgaXNDaGlsZDogYm9vbGVhbixcbiAgICBvdXRsaW5lQ2hpbGRyZW46IGJvb2xlYW4sXG4gICkgPT4ge1xuICAgIGNvbnN0IG5hdk5vZGU6IE5hdlRyZWVOb2RlID0gZWxlbWVudEtleVRvTmF2Tm9kZVtlbGVtZW50S2V5XTtcbiAgICBpZiAoIW5hdk5vZGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0YWdOYW1lVG9Vc2UgPSBuYXZOb2RlPy5uYW1lO1xuICAgIGNvbnN0IGJvdW5kaW5nQm94ID0gZ2V0Qm91bmRpbmdCb3hGb3JFbGVtZW50S2V5KGVsZW1lbnRLZXkpO1xuXG4gICAgaWYgKGJvdW5kaW5nQm94KSB7XG4gICAgICBib2R5LmFwcGVuZENoaWxkKFxuICAgICAgICBnZXRPdXRsaW5lRWxlbWVudChcbiAgICAgICAgICBwYXJlbnRQb3J0LFxuICAgICAgICAgIGlzQ2hpbGQgPyBPdXRsaW5lVHlwZS5DSElMRCA6IE91dGxpbmVUeXBlLlBSSU1BUlksXG4gICAgICAgICAgYm91bmRpbmdCb3gubGVmdCxcbiAgICAgICAgICBib3VuZGluZ0JveC50b3AsXG4gICAgICAgICAgYm91bmRpbmdCb3gud2lkdGgsXG4gICAgICAgICAgYm91bmRpbmdCb3guaGVpZ2h0LFxuICAgICAgICAgIHNlbGVjdGVkLFxuICAgICAgICAgIHRhZ05hbWVUb1VzZSxcbiAgICAgICAgICBuYXZOb2RlPy5pc0NvbXBvbmVudCxcbiAgICAgICAgICBlbGVtZW50S2V5LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgICAgY29uc3QgbW91c2VEcmFnRGF0YSA9IGdldE1lbW9yeVN0b3JhZ2VJdGVtKCdtb3VzZURyYWdDb250ZXh0Jyk7XG4gICAgICBjb25zdCBtb3VzZVBvc0RhdGEgPSBnZXRNZW1vcnlTdG9yYWdlSXRlbSgnbW91c2VQb3MnKTtcbiAgICAgIGlmIChzZWxlY3RlZCAmJiBtb3VzZURyYWdEYXRhPy5kcmFnZ2luZyAmJiBtb3VzZVBvc0RhdGEpIHtcbiAgICAgICAgYm9keS5hcHBlbmRDaGlsZChcbiAgICAgICAgICBnZXRPdXRsaW5lRWxlbWVudChcbiAgICAgICAgICAgIHBhcmVudFBvcnQsXG4gICAgICAgICAgICBPdXRsaW5lVHlwZS5NT1ZFLFxuICAgICAgICAgICAgbW91c2VQb3NEYXRhLnBhZ2VYIC0gYm91bmRpbmdCb3gud2lkdGggLyAyICsgbW91c2VEcmFnRGF0YS5vZmZzZXRYLFxuICAgICAgICAgICAgbW91c2VQb3NEYXRhLnBhZ2VZIC0gYm91bmRpbmdCb3guaGVpZ2h0IC8gMiArIG1vdXNlRHJhZ0RhdGEub2Zmc2V0WSxcbiAgICAgICAgICAgIGJvdW5kaW5nQm94LndpZHRoLFxuICAgICAgICAgICAgYm91bmRpbmdCb3guaGVpZ2h0LFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgbmF2Tm9kZT8uaXNDb21wb25lbnQsXG4gICAgICAgICAgICBlbGVtZW50S2V5LFxuICAgICAgICAgICksXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG91dGxpbmVDaGlsZHJlbikge1xuICAgICAgbmF2Tm9kZT8uY2hpbGRyZW4/LmZvckVhY2g/LigoY2hpbGQ6IE5hdlRyZWVOb2RlKSA9PiB7XG4gICAgICAgIGNyZWF0ZU91dGxpbmVzRm9yRWxlbWVudEtleShcbiAgICAgICAgICBjaGlsZC50ZW1wb0VsZW1lbnQuZ2V0S2V5KCksXG4gICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICBmYWxzZSxcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBpZiAoaG92ZXJlZEVsZW1lbnRLZXkpIHtcbiAgICBjcmVhdGVPdXRsaW5lc0ZvckVsZW1lbnRLZXkoaG92ZXJlZEVsZW1lbnRLZXksIGZhbHNlLCBmYWxzZSwgdHJ1ZSk7XG4gIH1cblxuICBpZiAobXVsdGlzZWxlY3RlZEVsZW1lbnRLZXlzPy5sZW5ndGgpIHtcbiAgICBsZXQgZnVsbEJvdW5kaW5nQm94ID0gZ2V0Qm91bmRpbmdCb3hGb3JFbGVtZW50S2V5KFxuICAgICAgbXVsdGlzZWxlY3RlZEVsZW1lbnRLZXlzWzBdLFxuICAgICk7XG5cbiAgICBtdWx0aXNlbGVjdGVkRWxlbWVudEtleXMuc2xpY2UoMSkuZm9yRWFjaCgoZWxlbWVudEtleTogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zdCBib3VuZGluZ1JlY3QgPSBnZXRCb3VuZGluZ0JveEZvckVsZW1lbnRLZXkoZWxlbWVudEtleSk7XG4gICAgICBpZiAoYm91bmRpbmdSZWN0KSB7XG4gICAgICAgIGlmIChmdWxsQm91bmRpbmdCb3gpIHtcbiAgICAgICAgICBjb25zdCBwcmV2UmlnaHQgPSBmdWxsQm91bmRpbmdCb3gubGVmdCArIGZ1bGxCb3VuZGluZ0JveC53aWR0aDtcbiAgICAgICAgICBjb25zdCBwcmV2Qm90dG9tID0gZnVsbEJvdW5kaW5nQm94LnRvcCArIGZ1bGxCb3VuZGluZ0JveC5oZWlnaHQ7XG5cbiAgICAgICAgICBmdWxsQm91bmRpbmdCb3gubGVmdCA9IE1hdGgubWluKFxuICAgICAgICAgICAgZnVsbEJvdW5kaW5nQm94LmxlZnQsXG4gICAgICAgICAgICBib3VuZGluZ1JlY3QubGVmdCxcbiAgICAgICAgICApO1xuICAgICAgICAgIGZ1bGxCb3VuZGluZ0JveC50b3AgPSBNYXRoLm1pbihmdWxsQm91bmRpbmdCb3gudG9wLCBib3VuZGluZ1JlY3QudG9wKTtcblxuICAgICAgICAgIGNvbnN0IHJpZ2h0ID0gTWF0aC5tYXgoXG4gICAgICAgICAgICBwcmV2UmlnaHQsXG4gICAgICAgICAgICBib3VuZGluZ1JlY3QubGVmdCArIGJvdW5kaW5nUmVjdC53aWR0aCxcbiAgICAgICAgICApO1xuICAgICAgICAgIGNvbnN0IGJvdHRvbSA9IE1hdGgubWF4KFxuICAgICAgICAgICAgcHJldkJvdHRvbSxcbiAgICAgICAgICAgIGJvdW5kaW5nUmVjdC50b3AgKyBib3VuZGluZ1JlY3QuaGVpZ2h0LFxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBmdWxsQm91bmRpbmdCb3gud2lkdGggPSByaWdodCAtIGZ1bGxCb3VuZGluZ0JveC5sZWZ0O1xuICAgICAgICAgIGZ1bGxCb3VuZGluZ0JveC5oZWlnaHQgPSBib3R0b20gLSBmdWxsQm91bmRpbmdCb3gudG9wO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZ1bGxCb3VuZGluZ0JveCA9IGJvdW5kaW5nUmVjdDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKGZ1bGxCb3VuZGluZ0JveCkge1xuICAgICAgYm9keS5hcHBlbmRDaGlsZChcbiAgICAgICAgZ2V0T3V0bGluZUVsZW1lbnQoXG4gICAgICAgICAgcGFyZW50UG9ydCxcbiAgICAgICAgICBPdXRsaW5lVHlwZS5QUklNQVJZLFxuICAgICAgICAgIGZ1bGxCb3VuZGluZ0JveC5sZWZ0LFxuICAgICAgICAgIGZ1bGxCb3VuZGluZ0JveC50b3AsXG4gICAgICAgICAgZnVsbEJvdW5kaW5nQm94LndpZHRoLFxuICAgICAgICAgIGZ1bGxCb3VuZGluZ0JveC5oZWlnaHQsXG4gICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICBgJHttdWx0aXNlbGVjdGVkRWxlbWVudEtleXMubGVuZ3RofSBFbGVtZW50c2AsXG4gICAgICAgICAgZmFsc2UsXG4gICAgICAgICksXG4gICAgICApO1xuICAgIH1cblxuICAgIG11bHRpc2VsZWN0ZWRFbGVtZW50S2V5cy5mb3JFYWNoKChlbGVtZW50S2V5OiBzdHJpbmcpID0+IHtcbiAgICAgIGNyZWF0ZU91dGxpbmVzRm9yRWxlbWVudEtleShlbGVtZW50S2V5LCBmYWxzZSwgZmFsc2UsIGZhbHNlKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmIChzZWxlY3RlZEVsZW1lbnRLZXkpIHtcbiAgICBjcmVhdGVPdXRsaW5lc0ZvckVsZW1lbnRLZXkoc2VsZWN0ZWRFbGVtZW50S2V5LCB0cnVlLCBmYWxzZSwgZmFsc2UpO1xuICB9XG5cbiAgLy8gQ3JlYXRlIG91dGxpbmVzXG4gICQoYC4ke1RFTVBPX0lOU1RBTlRfRElWX0RSQVdfQ0xBU1N9YCkuZWFjaCgoaW5kZXg6IGFueSwgaXRlbTogYW55KSA9PiB7XG4gICAgY29uc3QgYm91bmRpbmdSZWN0ID0gaXRlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBib2R5LmFwcGVuZENoaWxkKFxuICAgICAgZ2V0T3V0bGluZUVsZW1lbnQoXG4gICAgICAgIHBhcmVudFBvcnQsXG4gICAgICAgIE91dGxpbmVUeXBlLlBSSU1BUlksXG4gICAgICAgIGJvdW5kaW5nUmVjdC5sZWZ0LFxuICAgICAgICBib3VuZGluZ1JlY3QudG9wLFxuICAgICAgICBib3VuZGluZ1JlY3Qud2lkdGgsXG4gICAgICAgIGJvdW5kaW5nUmVjdC5oZWlnaHQsXG4gICAgICApLFxuICAgICk7XG4gIH0pO1xuXG4gICQoYCpbJHtURU1QT19PVVRMSU5FX1VOVElMX1JFRkVTSH09dHJ1ZV1gKS5lYWNoKChpbmRleDogYW55LCBpdGVtOiBhbnkpID0+IHtcbiAgICBjb25zdCBib3VuZGluZ1JlY3QgPSBpdGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGJvZHkuYXBwZW5kQ2hpbGQoXG4gICAgICBnZXRPdXRsaW5lRWxlbWVudChcbiAgICAgICAgcGFyZW50UG9ydCxcbiAgICAgICAgT3V0bGluZVR5cGUuUFJJTUFSWSxcbiAgICAgICAgYm91bmRpbmdSZWN0LmxlZnQsXG4gICAgICAgIGJvdW5kaW5nUmVjdC50b3AsXG4gICAgICAgIGJvdW5kaW5nUmVjdC53aWR0aCxcbiAgICAgICAgYm91bmRpbmdSZWN0LmhlaWdodCxcbiAgICAgICksXG4gICAgKTtcbiAgfSk7XG5cbiAgLy8gQ3JlYXRlIHNlY29uZGFyeSBvdXRsaW5lcyBmb3IgYWxsIG1hdGNoaW5nIElEcyBpbiB0aGUgY29kZWJhc2UgZm9yIHRoZSBjbGlja2VkIGVsZW1lbnRcbiAgaWYgKHNlbGVjdGVkRWxlbWVudD8uY29kZWJhc2VJZCkge1xuICAgICQoJ2JvZHknKVxuICAgICAgLmZpbmQoYC4ke3NlbGVjdGVkRWxlbWVudD8uY29kZWJhc2VJZH1gKVxuICAgICAgLm5vdChgLiR7RUxFTUVOVF9LRVlfUFJFRklYfSR7c2VsZWN0ZWRFbGVtZW50S2V5fWApXG4gICAgICAubm90KGAuJHtFTEVNRU5UX0tFWV9QUkVGSVh9JHtob3ZlcmVkRWxlbWVudEtleX1gKVxuICAgICAgLmVhY2goKGluZGV4OiBhbnksIGl0ZW06IGFueSkgPT4ge1xuICAgICAgICBjb25zdCBib3VuZGluZ1JlY3QgPSBpdGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBib2R5LmFwcGVuZENoaWxkKFxuICAgICAgICAgIGdldE91dGxpbmVFbGVtZW50KFxuICAgICAgICAgICAgcGFyZW50UG9ydCxcbiAgICAgICAgICAgIE91dGxpbmVUeXBlLlNFQ09OREFSWSxcbiAgICAgICAgICAgIGJvdW5kaW5nUmVjdC5sZWZ0LFxuICAgICAgICAgICAgYm91bmRpbmdSZWN0LnRvcCxcbiAgICAgICAgICAgIGJvdW5kaW5nUmVjdC53aWR0aCxcbiAgICAgICAgICAgIGJvdW5kaW5nUmVjdC5oZWlnaHQsXG4gICAgICAgICAgKSxcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3QgaXNOb2RlT3V0bGluZSA9IChub2RlOiBhbnkpID0+IHtcbiAgaWYgKCFub2RlPy5jbGFzc0xpc3QpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBsZXQgaXNPdXRsaW5lID0gZmFsc2U7XG4gIG5vZGUuY2xhc3NMaXN0LmZvckVhY2goKGNsczogc3RyaW5nKSA9PiB7XG4gICAgaWYgKGNscyA9PT0gT1VUTElORV9DTEFTUykge1xuICAgICAgaXNPdXRsaW5lID0gdHJ1ZTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBpc091dGxpbmU7XG59O1xuIl19