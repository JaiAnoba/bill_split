"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runNavTreeBuiltCallbacks = exports.addNavTreeBuiltCallback = exports.buildNavForNode = exports.getNavNodeForVirtualComponent = exports.ExtractedPropType = exports.SKIP_ROOT_CODEBASE_ID = exports.EMPTY_TREE_CODEBASE_ID = exports.TOP_LEVEL_PARENT_COMPONENT_TO_SKIP = exports.UNKNOWN_PARENT_COMPONENT = void 0;
const cssFunctions_1 = require("./cssFunctions");
const identifierUtils_1 = require("./identifierUtils");
const outlineUtils_1 = require("./outlineUtils");
const jquery_1 = __importDefault(require("jquery"));
const sessionStorageUtils_1 = require("./sessionStorageUtils");
const tempoElement_1 = require("./tempoElement");
exports.UNKNOWN_PARENT_COMPONENT = 'UnknownComponent';
exports.TOP_LEVEL_PARENT_COMPONENT_TO_SKIP = 'TOP_LEVEL_PARENT_COMPONENT_TO_SKIP';
exports.EMPTY_TREE_CODEBASE_ID = 'EMPTY-TREE';
// Special codebase ID -> if set on the root node it's expected it doesn't get rendered
// This is used when there are multiple nodes under the root node that we want to return while we don't
// want to render the root node itself
exports.SKIP_ROOT_CODEBASE_ID = 'SKIP-ROOT';
// Matches the interface on the frontend
var ExtractedPropType;
(function (ExtractedPropType) {
    ExtractedPropType["LITERAL"] = "LITERAL";
    ExtractedPropType["FUNCTION"] = "FUNCTION";
    ExtractedPropType["JSON_OBJECT"] = "JSON_OBJECT";
})(ExtractedPropType || (exports.ExtractedPropType = ExtractedPropType = {}));
const extractPropsFromReactFiberNode = (reactFiberNode) => {
    var _a;
    if (!((_a = reactFiberNode === null || reactFiberNode === void 0 ? void 0 : reactFiberNode.element) === null || _a === void 0 ? void 0 : _a.memoizedProps)) {
        return {};
    }
    const props = {};
    Object.keys(reactFiberNode.element.memoizedProps).forEach((key) => {
        if (key === 'children') {
            return;
        }
        // Filter out known props
        if (identifierUtils_1.KNOWN_ATTRIBUTES.has(key.toLowerCase())) {
            return;
        }
        let propValue = reactFiberNode.element.memoizedProps[key];
        // Filter out unknown classes
        if (key === 'className' && typeof propValue === 'string') {
            propValue = (0, identifierUtils_1.getAllUnknownClasesFromList)(propValue.split(' ')).join(' ');
        }
        if (typeof propValue === 'function') {
            props[key] = {
                value: key,
                type: ExtractedPropType.FUNCTION,
            };
        }
        else if (typeof propValue === 'object') {
            try {
                props[key] = {
                    value: JSON.stringify(propValue),
                    type: ExtractedPropType.JSON_OBJECT,
                };
            }
            catch (e) {
                // skip this prop
            }
        }
        else {
            props[key] = {
                value: propValue,
                type: ExtractedPropType.LITERAL,
            };
        }
    });
    return props;
};
const extractLiteralChildrenFromReactFiberNode = (reactFiberNode) => {
    var _a, _b;
    if (!((_b = (_a = reactFiberNode === null || reactFiberNode === void 0 ? void 0 : reactFiberNode.element) === null || _a === void 0 ? void 0 : _a.memoizedProps) === null || _b === void 0 ? void 0 : _b.children)) {
        return [];
    }
    const literalChildren = [];
    Array.from(reactFiberNode.element.memoizedProps.children || []).forEach((childProp, index) => {
        if (typeof childProp !== 'object') {
            literalChildren.push({
                index,
                value: childProp,
            });
        }
    });
    return literalChildren;
};
function selectorSafe(uniquePath) {
    // Dictionary of replacements. You can expand this list as needed.
    const replacements = {
        '!': '_exclamation_',
        '@': '_at_',
        '#': '_hash_',
        $: '_dollar_',
        '%': '_percent_',
        '^': '_caret_',
        '&': '_and_',
        '*': '_asterisk_',
        '(': '_openParen_',
        ')': '_closeParen_',
        '+': '_plus_',
        '=': '_equals_',
        '[': '_openBracket_',
        ']': '_closeBracket_',
        '{': '_openBrace_',
        '}': '_closeBrace_',
        '|': '_pipe_',
        ';': '_semicolon_',
        ':': '_colon_',
        ',': '_comma_',
        '.': '_period_',
        '<': '_lessThan_',
        '>': '_greaterThan_',
        '/': '_slash_',
        '?': '_question_',
        '\\': '_backslash_',
        ' ': '_space_',
    };
    // Replace each character with its mapped value
    Object.keys(replacements).forEach((character) => {
        const regex = new RegExp('\\' + character, 'g');
        uniquePath = uniquePath.replace(regex, replacements[character]);
    });
    // Handle invalid starting characters
    uniquePath = uniquePath.replace(/^[0-9-]/, '_startNumOrHyphen_');
    // Lastly, replace any remaining non-alphanumeric characters just in case
    return uniquePath.replace(/[^a-zA-Z0-9_-]/g, '_');
}
/**
 * Nav node for a component that has no DOM element associated with it
 */
const getNavNodeForVirtualComponent = (parent, componentName, componentInstanceId, uniquePath, scopeLookup, storyboardId, reactFiberNode) => {
    const navTreeNode = {
        parent: parent,
        children: [],
        classList: [],
        directlySetClassList: [],
        name: '',
        tempoElement: tempoElement_1.TempoElement.empty(),
    };
    navTreeNode.name = componentName;
    navTreeNode.isComponent = true;
    navTreeNode.tempoElement = new tempoElement_1.TempoElement(componentInstanceId, storyboardId, uniquePath);
    navTreeNode.props = extractPropsFromReactFiberNode(reactFiberNode);
    navTreeNode.literalChildren =
        extractLiteralChildrenFromReactFiberNode(reactFiberNode);
    Object.keys(scopeLookup).forEach((codebaseId) => {
        var _a;
        if (navTreeNode.scope) {
            return;
        }
        if (((_a = scopeLookup[codebaseId].codebaseIds) === null || _a === void 0 ? void 0 : _a.indexOf(componentInstanceId)) > -1) {
            navTreeNode.scope = scopeLookup[codebaseId];
        }
    });
    return navTreeNode;
};
exports.getNavNodeForVirtualComponent = getNavNodeForVirtualComponent;
const buildNavForNode = (storyboardId, parent, node, uniquePathBase, uniquePathAddon, scopeLookup, treeElements, lookupIdToReactTreeMap, knownComponentNames, knownComponentInstanceNames, 
// Gets populated by this function, a lookup of element key -> list of element keys that represent this virtual component
elementKeyToLookupList, elementKeyToNavNode) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    if (!node) {
        return null;
    }
    if ((0, outlineUtils_1.isNodeOutline)(node)) {
        return null;
    }
    if ((0, identifierUtils_1.isSkipNavTreeNode)(node)) {
        return null;
    }
    if (['noscript', 'script'].includes((_a = node === null || node === void 0 ? void 0 : node.tagName) === null || _a === void 0 ? void 0 : _a.toLowerCase())) {
        return null;
    }
    const foundId = (0, identifierUtils_1.getCodebaseIdFromNode)(node);
    const reactFiberLookupId = (0, identifierUtils_1.getUniqueLookupFromNode)(node);
    // May 15, 2023 -> found bug where a random iframe was being added with the hot reloaded code
    // I think this is related to this bug:
    // https://github.com/facebook/create-react-app/issues/11880
    if (((_b = node === null || node === void 0 ? void 0 : node.tagName) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === 'iframe') {
        if (!foundId) {
            node.remove();
            return null;
        }
    }
    let reactFiberNode = null;
    if (reactFiberLookupId) {
        reactFiberNode = lookupIdToReactTreeMap[reactFiberLookupId];
    }
    const boundingRect = node.getBoundingClientRect();
    const { top, left } = (0, jquery_1.default)(node).offset() || { top: 0, left: 0 };
    let parentToUse = parent;
    let uniquePathBaseToUse = uniquePathBase;
    //////////////////////////////////////////////////////////////////
    // Handle virtual components from the react fiber tree
    //////////////////////////////////////////////////////////////////
    // For outlines, components that are added need an outline around all the elements inside
    // Create lookups in local storage to keep track of this
    // Element keys of virtual components
    const virtualComponentElementKeys = [];
    // When there are react forward refs we want to collapse the node into the top level forward ref
    let componentNameToCollapseInto;
    let componentInstanceIdToCollapseInto;
    if (reactFiberNode && (parent === null || parent === void 0 ? void 0 : parent.reactFiberNode)) {
        // Traverse up the stack adding components to the tree until you hit this node's parent
        // Note, we have to account for other children that already performed this operation and added nodes to the tree
        let searchNode = reactFiberNode.parent;
        let possibleNodesToAdd = [];
        // This loop picks all the relevant nodes in between (ignoring if they are already added or not)
        while (searchNode) {
            if (searchNode === parent.reactFiberNode) {
                break;
            }
            // Sometimes components are named differently in the react fiber tree from the codebase, but we still want to include them
            // in the DOM tree if they are components defined in source files
            // E.g. in next JS if you create a <Link /> element it will be called "LinkComponent"
            const debugSourceFileInCodebase = ((_d = (_c = searchNode === null || searchNode === void 0 ? void 0 : searchNode.element) === null || _c === void 0 ? void 0 : _c._debugSource) === null || _d === void 0 ? void 0 : _d.fileName) &&
                !((_g = (_f = (_e = searchNode === null || searchNode === void 0 ? void 0 : searchNode.element) === null || _e === void 0 ? void 0 : _e._debugSource) === null || _f === void 0 ? void 0 : _f.fileName) === null || _g === void 0 ? void 0 : _g.includes('node_modules'));
            if ((((_h = searchNode.props) === null || _h === void 0 ? void 0 : _h.tempoelementid) ||
                ((_j = searchNode.props) === null || _j === void 0 ? void 0 : _j['data-testid'])) &&
                ((knownComponentNames === null || knownComponentNames === void 0 ? void 0 : knownComponentNames.has(searchNode.name)) ||
                    (knownComponentInstanceNames === null || knownComponentInstanceNames === void 0 ? void 0 : knownComponentInstanceNames.has(searchNode.name)) ||
                    debugSourceFileInCodebase)) {
                possibleNodesToAdd.push(searchNode);
            }
            searchNode = searchNode.parent;
        }
        // Found the parent, traverse down the nodes, checking if that node was already added to the tree,
        // and adding it if it wasn't
        if (searchNode && possibleNodesToAdd.length) {
            let currentParent = parent;
            Array.from(possibleNodesToAdd)
                .reverse()
                .forEach((nodeToAdd) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                // If this is a forward ref just move forward in the tree without adding this element, but
                // but still label the next non-forward ref with this node's name & instance ID
                // However, only do this the first time (want the highest forward ref)
                if (((_c = (_b = (_a = nodeToAdd === null || nodeToAdd === void 0 ? void 0 : nodeToAdd.element) === null || _a === void 0 ? void 0 : _a.elementType) === null || _b === void 0 ? void 0 : _b['$$typeof']) === null || _c === void 0 ? void 0 : _c.toString()) ===
                    'Symbol(react.forward_ref)') {
                    if (!componentNameToCollapseInto &&
                        !componentInstanceIdToCollapseInto) {
                        componentInstanceIdToCollapseInto =
                            ((_d = nodeToAdd.props) === null || _d === void 0 ? void 0 : _d.tempoelementid) ||
                                ((_e = nodeToAdd.props) === null || _e === void 0 ? void 0 : _e['data-testid']);
                        const referenceTreeElement = treeElements[componentInstanceIdToCollapseInto || ''];
                        if ((referenceTreeElement === null || referenceTreeElement === void 0 ? void 0 : referenceTreeElement.type) === 'component-instance') {
                            componentNameToCollapseInto =
                                referenceTreeElement.componentName;
                        }
                        else {
                            componentNameToCollapseInto = nodeToAdd.name;
                        }
                    }
                    return;
                }
                const matchingNavTreeNode = currentParent
                    ? (_f = currentParent.children) === null || _f === void 0 ? void 0 : _f.find((child) => child.reactFiberNode === nodeToAdd)
                    : null;
                // Node already matches, increase level and continue
                if (matchingNavTreeNode) {
                    currentParent = matchingNavTreeNode;
                    if (currentParent.tempoElement) {
                        virtualComponentElementKeys.push(currentParent.tempoElement.getKey());
                    }
                    // Increase the size of the bounding box for this element
                    if (!matchingNavTreeNode.pageBoundingBox) {
                        matchingNavTreeNode.pageBoundingBox = {
                            pageX: left,
                            pageY: top,
                            width: boundingRect.width,
                            height: boundingRect.height,
                        };
                    }
                    else {
                        const newRight = Math.max(matchingNavTreeNode.pageBoundingBox.pageX +
                            matchingNavTreeNode.pageBoundingBox.width, left + boundingRect.width);
                        const newLeft = Math.min(matchingNavTreeNode.pageBoundingBox.pageX, boundingRect.left);
                        const newTop = Math.min(matchingNavTreeNode.pageBoundingBox.pageY, boundingRect.top);
                        const newBottom = Math.max(matchingNavTreeNode.pageBoundingBox.pageY +
                            matchingNavTreeNode.pageBoundingBox.height, top + boundingRect.height);
                        matchingNavTreeNode.pageBoundingBox.pageX = newLeft;
                        matchingNavTreeNode.pageBoundingBox.pageY = newTop;
                        matchingNavTreeNode.pageBoundingBox.width = newRight - newLeft;
                        matchingNavTreeNode.pageBoundingBox.height = newBottom - newTop;
                    }
                    return;
                }
                else {
                    // Otherwise, create a new virtual node, add to parent and continue
                    let componentName;
                    let componentInstanceId;
                    if (componentNameToCollapseInto) {
                        componentName = componentInstanceIdToCollapseInto;
                        componentInstanceId = componentInstanceIdToCollapseInto;
                        componentNameToCollapseInto = undefined;
                        componentInstanceIdToCollapseInto = undefined;
                    }
                    else {
                        componentName = nodeToAdd.name;
                        componentInstanceId =
                            ((_g = nodeToAdd.props) === null || _g === void 0 ? void 0 : _g.tempoelementid) ||
                                ((_h = nodeToAdd.props) === null || _h === void 0 ? void 0 : _h['data-testid']);
                    }
                    // Update the unique path and use it
                    uniquePathBaseToUse = selectorSafe(`${uniquePathBaseToUse}-${((_j = currentParent === null || currentParent === void 0 ? void 0 : currentParent.children) === null || _j === void 0 ? void 0 : _j.length) || 0}`);
                    const newVirtualComponent = (0, exports.getNavNodeForVirtualComponent)(currentParent, nodeToAdd.name, componentInstanceId, uniquePathBaseToUse, scopeLookup, storyboardId, nodeToAdd);
                    currentParent.children.push(newVirtualComponent);
                    currentParent = newVirtualComponent;
                    virtualComponentElementKeys.push(newVirtualComponent.tempoElement.getKey());
                    elementKeyToNavNode[newVirtualComponent.tempoElement.getKey()] =
                        newVirtualComponent;
                    // Set the bounding box for the new virtual component
                    newVirtualComponent.pageBoundingBox = {
                        pageX: left,
                        pageY: top,
                        width: boundingRect.width,
                        height: boundingRect.height,
                    };
                }
            });
            parentToUse = currentParent;
        }
    }
    // This node corresponds to the DOM element, not any components, unless we are collapsing into the component
    const navTreeNode = {
        parent: parentToUse,
        children: [],
        classList: (0, identifierUtils_1.getAllUnknownClasses)(node),
        directlySetClassList: [],
        name: '',
        tempoElement: tempoElement_1.TempoElement.empty(),
    };
    (_k = parentToUse === null || parentToUse === void 0 ? void 0 : parentToUse.children) === null || _k === void 0 ? void 0 : _k.push(navTreeNode);
    navTreeNode.name = componentNameToCollapseInto || node.tagName;
    navTreeNode.elementTagName = node.tagName;
    // These are only forward ref components, all other components are added as virtual components
    navTreeNode.isComponent = Boolean(componentInstanceIdToCollapseInto);
    const uniquePathForNode = selectorSafe(`${uniquePathBaseToUse}${uniquePathAddon}`);
    const codebaseId = componentInstanceIdToCollapseInto || foundId || undefined;
    navTreeNode.tempoElement = new tempoElement_1.TempoElement(codebaseId, storyboardId, uniquePathForNode);
    const nodeElementKey = navTreeNode.tempoElement.getKey();
    // Using the virtualComponentElementKeys, set the elementKey in a list for this element
    virtualComponentElementKeys.forEach((elementKey) => {
        if (elementKeyToLookupList[elementKey]) {
            elementKeyToLookupList[elementKey].push(nodeElementKey);
        }
        else {
            elementKeyToLookupList[elementKey] = [nodeElementKey];
        }
    });
    // Set the lookup list for the specific node itself as well
    elementKeyToLookupList[nodeElementKey] = [nodeElementKey];
    // Add the element key to the class to help with referencing
    // Note - even if there is no codebase ID we still mark it as something processed in the nav tree
    (0, identifierUtils_1.addElementKeyAsClass)(node, nodeElementKey);
    const treeElementForNode = treeElements[navTreeNode.tempoElement.codebaseId];
    if (treeElementForNode) {
        const removableClasses = new Set((treeElementForNode === null || treeElementForNode === void 0 ? void 0 : treeElementForNode.removableClasses) || []);
        navTreeNode.directlySetClassList = (_l = navTreeNode.classList) === null || _l === void 0 ? void 0 : _l.filter((cls) => {
            return removableClasses.has(cls);
        });
    }
    navTreeNode.reactFiberNode = reactFiberNode;
    navTreeNode.props = extractPropsFromReactFiberNode(reactFiberNode);
    navTreeNode.literalChildren =
        extractLiteralChildrenFromReactFiberNode(reactFiberNode);
    navTreeNode.pageBoundingBox = {
        pageX: left,
        pageY: top,
        width: boundingRect.width,
        height: boundingRect.height,
    };
    navTreeNode.displayType = (0, cssFunctions_1.cssEval)(node, 'display');
    navTreeNode.positionType = (0, cssFunctions_1.cssEval)(node, 'position');
    navTreeNode.flexDirection = (0, cssFunctions_1.cssEval)(node, 'flex-direction');
    navTreeNode.floatVal = (0, cssFunctions_1.cssEval)(node, 'float');
    if (navTreeNode.tempoElement.codebaseId) {
        Object.keys(scopeLookup).forEach((codebaseId) => {
            var _a;
            if (navTreeNode.scope) {
                return;
            }
            if (((_a = scopeLookup[codebaseId].codebaseIds) === null || _a === void 0 ? void 0 : _a.indexOf(navTreeNode.tempoElement.codebaseId)) > -1) {
                navTreeNode.scope = scopeLookup[codebaseId];
            }
        });
    }
    // Only parse children for non-svg elements
    if (node.children && node.tagName !== 'svg') {
        let indexForUniqueness = 0;
        Array.from(node.children).forEach((child) => {
            (0, exports.buildNavForNode)(storyboardId, navTreeNode, child, uniquePathForNode, `-${indexForUniqueness}`, scopeLookup, treeElements, lookupIdToReactTreeMap, knownComponentNames, knownComponentInstanceNames, elementKeyToLookupList, elementKeyToNavNode);
            indexForUniqueness += 1;
        });
    }
    elementKeyToNavNode[nodeElementKey] = navTreeNode;
    // This is the top-level node
    if (!parentToUse) {
        let newNavTree = filterOutNodesWithoutCodebaseId(navTreeNode, elementKeyToNavNode, treeElements, storyboardId);
        return newNavTree;
    }
    return null;
};
exports.buildNavForNode = buildNavForNode;
const filterOutNodesWithoutCodebaseId = (finishedNavTree, elementKeyToNavNode, treeElements, storyboardId) => {
    let treeToReturn = finishedNavTree;
    const storyboardType = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.STORYBOARD_TYPE) || 'APPLICATION';
    const storyboardSavedComponentFile = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.SAVED_STORYBOARD_COMPONENT_FILENAME);
    const originalStoryboardUrl = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.ORIGINAL_STORYBOARD_URL);
    const userNavigatedToNewRoute = originalStoryboardUrl &&
        !window.location.href.includes(originalStoryboardUrl);
    /**
     * Returns whether the given tree element is in the top-level file of the storyboard
     * Note - for saved components the top-level file is the saved component file
     */
    const isElementDirectlyInStoryboard = (node) => {
        var _a, _b, _c, _d, _e, _f;
        const filename = (_a = treeElements[node.tempoElement.codebaseId]) === null || _a === void 0 ? void 0 : _a.filename;
        // For stories, just filter for anything not in _app or _document
        if (storyboardType === 'STORY' &&
            filename &&
            !filename.includes('_app') &&
            !filename.includes('_document')) {
            return true;
        }
        // Special case -> if the parent is the body element this might be in a portal
        // go all the way up the react fiber tree and see if there are any elements
        // that are in the storyboard
        if (((_b = node.parent) === null || _b === void 0 ? void 0 : _b.name) === 'BODY') {
            let parentFiberNode = (_c = node.reactFiberNode) === null || _c === void 0 ? void 0 : _c.parent;
            while (parentFiberNode) {
                const codebaseId = ((_d = parentFiberNode === null || parentFiberNode === void 0 ? void 0 : parentFiberNode.props) === null || _d === void 0 ? void 0 : _d.tempoelementid) ||
                    ((_e = parentFiberNode === null || parentFiberNode === void 0 ? void 0 : parentFiberNode.props) === null || _e === void 0 ? void 0 : _e['data-testid']) ||
                    '';
                if (codebaseId) {
                    const treeElementFilename = (_f = treeElements[codebaseId]) === null || _f === void 0 ? void 0 : _f.filename;
                    const valid = Boolean(treeElementFilename === null || treeElementFilename === void 0 ? void 0 : treeElementFilename.includes('tempobook/storyboards')) ||
                        Boolean(treeElementFilename &&
                            treeElementFilename === storyboardSavedComponentFile);
                    if (valid) {
                        return true;
                    }
                }
                parentFiberNode = parentFiberNode === null || parentFiberNode === void 0 ? void 0 : parentFiberNode.parent;
            }
        }
        // For everything else, filter anything that is not in the storyboard itself
        return (Boolean(filename === null || filename === void 0 ? void 0 : filename.includes('tempobook/storyboards')) ||
            Boolean(filename && filename === storyboardSavedComponentFile));
    };
    const processNode = (node, elementInStoryboardFound) => {
        var _a, _b;
        // Process the children first
        for (let i = node.children.length - 1; i >= 0; i--) {
            processNode(node.children[i], elementInStoryboardFound || isElementDirectlyInStoryboard(node));
        }
        // Product decision: Filter out nodes that don't exist in storyboard file for the corresponding component URL
        //
        // Historical context:
        // Dec 14 - a bug was found where in cases that components were dynamically loaded (e.g. in Next JS _app.tsx), when you click
        // on the top level component it would point to this location in the codebase:
        //
        // function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
        //   return (
        //     <SessionProvider session={session}>
        //       <Component {...pageProps} />
        //       <Analytics />
        //     </SessionProvider>
        //   );
        // }
        //
        // This was especially an issue for component storyboards. Thus the decision was made to hide any top-level components or divs
        // that are not in the storyboard file
        const inComponentStoryboardAndSkip = storyboardType !== 'APPLICATION' &&
            !userNavigatedToNewRoute &&
            !elementInStoryboardFound &&
            !isElementDirectlyInStoryboard(node);
        // If this node doesn't have a codebaseId, move its children to its parent
        if (!((_a = node.tempoElement.codebaseId) === null || _a === void 0 ? void 0 : _a.startsWith('tempo-')) ||
            inComponentStoryboardAndSkip) {
            if (node.parent) {
                // Move the children in the spot where the node was
                const childrenToMove = node.children;
                const indexOfNodeInParent = (_b = node.parent.children) === null || _b === void 0 ? void 0 : _b.indexOf(node);
                node.parent.children.splice(indexOfNodeInParent, 1, ...childrenToMove);
                // Change the parent of all the children to the new parent
                childrenToMove.forEach((child) => {
                    child.parent = node.parent;
                });
                // Remove the node from the known nodes
                delete elementKeyToNavNode[node.tempoElement.getKey()];
            }
            else if (node.children.length === 1) {
                // This is the top-level node, move it down
                treeToReturn = node.children[0];
                delete elementKeyToNavNode[node.tempoElement.getKey()];
                treeToReturn.parent = undefined;
            }
            else if (node.children.length === 0) {
                // 0 children, no nav tree to return
                treeToReturn = {
                    children: [],
                    tempoElement: new tempoElement_1.TempoElement(exports.EMPTY_TREE_CODEBASE_ID, storyboardId, '1'),
                    name: '',
                };
                delete elementKeyToNavNode[node.tempoElement.getKey()];
            }
            else {
                // 2+ children, return this node, but make the codebase ID one to skip
                node.tempoElement = new tempoElement_1.TempoElement(exports.SKIP_ROOT_CODEBASE_ID, node.tempoElement.storyboardId, node.tempoElement.uniquePath);
                delete elementKeyToNavNode[node.tempoElement.getKey()];
            }
        }
    };
    processNode(finishedNavTree, false);
    const postProcess = (node, level) => {
        // Remove the react fiber node after processing
        delete node['reactFiberNode'];
        node.level = level;
        node.children.forEach((child) => {
            postProcess(child, node.tempoElement.codebaseId === exports.SKIP_ROOT_CODEBASE_ID
                ? level
                : level + 1);
        });
    };
    postProcess(treeToReturn, 0);
    return treeToReturn;
};
const addNavTreeBuiltCallback = (callbackToAdd) => {
    const { callbackFn, state } = callbackToAdd;
    const callbacks = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.NAV_TREE_CALLBACKS) || [];
    // Sort the multiSelectedElementKeys for consistency before adding
    state.multiSelectedElementKeys = (state.multiSelectedElementKeys || []).sort();
    const existingCallback = callbacks.find((callback) => callback.callbackFn.toString() === callbackFn.toString() &&
        callback.state.selectedElementKey === state.selectedElementKey &&
        callback.state.multiSelectedElementKeys.join(',') ===
            state.multiSelectedElementKeys.join(','));
    if (existingCallback) {
        return;
    }
    callbacks.push(callbackToAdd);
    (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.NAV_TREE_CALLBACKS, callbacks);
};
exports.addNavTreeBuiltCallback = addNavTreeBuiltCallback;
const runNavTreeBuiltCallbacks = () => {
    const callbacks = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.NAV_TREE_CALLBACKS) || [];
    if (!callbacks.length) {
        return;
    }
    const currentSelectedKey = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.SELECTED_ELEMENT_KEY);
    const multiSelectedElementKeys = ((0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.MULTI_SELECTED_ELEMENT_KEYS) || []).sort();
    callbacks.forEach((callback) => {
        const { callbackFn, state } = callback;
        if (state.selectedElementKey === currentSelectedKey &&
            state.multiSelectedElementKeys.join(',') ===
                multiSelectedElementKeys.join(',')) {
            callbackFn();
        }
    });
    (0, sessionStorageUtils_1.removeMemoryStorageItem)(sessionStorageUtils_1.NAV_TREE_CALLBACKS);
};
exports.runNavTreeBuiltCallbacks = runNavTreeBuiltCallbacks;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF2VHJlZVV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NoYW5uZWxNZXNzYWdpbmcvbmF2VHJlZVV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGlEQUF5QztBQUN6Qyx1REFRMkI7QUFDM0IsaURBQStDO0FBQy9DLG9EQUF1QjtBQUN2QiwrREFXK0I7QUFDL0IsaURBQThDO0FBRWpDLFFBQUEsd0JBQXdCLEdBQUcsa0JBQWtCLENBQUM7QUFDOUMsUUFBQSxrQ0FBa0MsR0FDN0Msb0NBQW9DLENBQUM7QUFDMUIsUUFBQSxzQkFBc0IsR0FBRyxZQUFZLENBQUM7QUFFbkQsdUZBQXVGO0FBQ3ZGLHVHQUF1RztBQUN2RyxzQ0FBc0M7QUFDekIsUUFBQSxxQkFBcUIsR0FBRyxXQUFXLENBQUM7QUFFakQsd0NBQXdDO0FBQ3hDLElBQVksaUJBSVg7QUFKRCxXQUFZLGlCQUFpQjtJQUMzQix3Q0FBbUIsQ0FBQTtJQUNuQiwwQ0FBcUIsQ0FBQTtJQUNyQixnREFBMkIsQ0FBQTtBQUM3QixDQUFDLEVBSlcsaUJBQWlCLGlDQUFqQixpQkFBaUIsUUFJNUI7QUEwQ0QsTUFBTSw4QkFBOEIsR0FBRyxDQUFDLGNBQW1CLEVBQUUsRUFBRTs7SUFDN0QsSUFBSSxDQUFDLENBQUEsTUFBQSxjQUFjLGFBQWQsY0FBYyx1QkFBZCxjQUFjLENBQUUsT0FBTywwQ0FBRSxhQUFhLENBQUEsRUFBRTtRQUMzQyxPQUFPLEVBQUUsQ0FBQztLQUNYO0lBRUQsTUFBTSxLQUFLLEdBQVEsRUFBRSxDQUFDO0lBQ3RCLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtRQUNoRSxJQUFJLEdBQUcsS0FBSyxVQUFVLEVBQUU7WUFDdEIsT0FBTztTQUNSO1FBRUQseUJBQXlCO1FBQ3pCLElBQUksa0NBQWdCLENBQUMsR0FBRyxD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cyc7XG5pbXBvcnQge1xuICBLTk9XTl9BVFRSSUJVVEVTLFxuICBhZGRFbGVtZW50S2V5QXNDbGFzcyxcbiAgZ2V0QWxsVW5rbm93bkNsYXNlc0Zyb21MaXN0LFxuICBnZXRBbGxVbmtub3duQ2xhc3NlcyxcbiAgZ2V0Q29kZWJhc2VJZEZyb21Ob2RlLFxuICBnZXRVbmlxdWVMb29rdXBGcm9tTm9kZSxcbiAgaXNTa2lwTmF2VHJlZU5vZGUsXG59IGZyb20gJy4vaWRlbnRpZmllclV0aWxzJztcbmltcG9ydCB7IGlzTm9kZU91dGxpbmUgfSBmcm9tICcuL291dGxpbmVVdGlscyc7XG5pbXBvcnQgJCBmcm9tICdqcXVlcnknO1xuaW1wb3J0IHtcbiAgTVVMVElfU0VMRUNURURfRUxFTUVOVF9LRVlTLFxuICBOQVZfVFJFRV9DQUxMQkFDS1MsXG4gIE9SSUdJTkFMX1NUT1JZQk9BUkRfVVJMLFxuICBTQVZFRF9TVE9SWUJPQVJEX0NPTVBPTkVOVF9GSUxFTkFNRSxcbiAgU0VMRUNURURfRUxFTUVOVF9LRVksXG4gIFNUT1JZQk9BUkRfQ09NUE9ORU5ULFxuICBTVE9SWUJPQVJEX1RZUEUsXG4gIGdldE1lbW9yeVN0b3JhZ2VJdGVtLFxuICByZW1vdmVNZW1vcnlTdG9yYWdlSXRlbSxcbiAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0sXG59IGZyb20gJy4vc2Vzc2lvblN0b3JhZ2VVdGlscyc7XG5pbXBvcnQgeyBUZW1wb0VsZW1lbnQgfSBmcm9tICcuL3RlbXBvRWxlbWVudCc7XG5cbmV4cG9ydCBjb25zdCBVTktOT1dOX1BBUkVOVF9DT01QT05FTlQgPSAnVW5rbm93bkNvbXBvbmVudCc7XG5leHBvcnQgY29uc3QgVE9QX0xFVkVMX1BBUkVOVF9DT01QT05FTlRfVE9fU0tJUCA9XG4gICdUT1BfTEVWRUxfUEFSRU5UX0NPTVBPTkVOVF9UT19TS0lQJztcbmV4cG9ydCBjb25zdCBFTVBUWV9UUkVFX0NPREVCQVNFX0lEID0gJ0VNUFRZLVRSRUUnO1xuXG4vLyBTcGVjaWFsIGNvZGViYXNlIElEIC0+IGlmIHNldCBvbiB0aGUgcm9vdCBub2RlIGl0J3MgZXhwZWN0ZWQgaXQgZG9lc24ndCBnZXQgcmVuZGVyZWRcbi8vIFRoaXMgaXMgdXNlZCB3aGVuIHRoZXJlIGFyZSBtdWx0aXBsZSBub2RlcyB1bmRlciB0aGUgcm9vdCBub2RlIHRoYXQgd2Ugd2FudCB0byByZXR1cm4gd2hpbGUgd2UgZG9uJ3Rcbi8vIHdhbnQgdG8gcmVuZGVyIHRoZSByb290IG5vZGUgaXRzZWxmXG5leHBvcnQgY29uc3QgU0tJUF9ST09UX0NPREVCQVNFX0lEID0gJ1NLSVAtUk9PVCc7XG5cbi8vIE1hdGNoZXMgdGhlIGludGVyZmFjZSBvbiB0aGUgZnJvbnRlbmRcbmV4cG9ydCBlbnVtIEV4dHJhY3RlZFByb3BUeXBlIHtcbiAgTElURVJBTCA9ICdMSVRFUkFMJyxcbiAgRlVOQ1RJT04gPSAnRlVOQ1RJT04nLFxuICBKU09OX09CSkVDVCA9ICdKU09OX09CSkVDVCcsXG59XG5leHBvcnQgaW50ZXJmYWNlIE5hdlRyZWVOb2RlIHtcbiAgcGFyZW50PzogTmF2VHJlZU5vZGU7XG4gIGNoaWxkcmVuOiBOYXZUcmVlTm9kZVtdO1xuICB0ZW1wb0VsZW1lbnQ6IFRlbXBvRWxlbWVudDtcblxuICBuYW1lOiBzdHJpbmc7XG4gIGVsZW1lbnRUYWdOYW1lPzogc3RyaW5nO1xuICBpc0NvbXBvbmVudD86IGJvb2xlYW47XG4gIGxldmVsPzogbnVtYmVyO1xuICBjbGFzc0xpc3Q/OiBzdHJpbmdbXTtcbiAgZGlyZWN0bHlTZXRDbGFzc0xpc3Q/OiBzdHJpbmdbXTtcbiAgc2NvcGU/OiBhbnk7XG5cbiAgLy8gVXNlZCBmb3IgZHJhd2luZywgbW92aW5nLCBldGNcbiAgcGFnZUJvdW5kaW5nQm94Pzoge1xuICAgIHBhZ2VYOiBudW1iZXI7XG4gICAgcGFnZVk6IG51bWJlcjtcbiAgICB3aWR0aDogbnVtYmVyO1xuICAgIGhlaWdodDogbnVtYmVyO1xuICB9O1xuICBkaXNwbGF5VHlwZT86IHN0cmluZztcbiAgcG9zaXRpb25UeXBlPzogc3RyaW5nO1xuICBmbGV4RGlyZWN0aW9uPzogc3RyaW5nO1xuICBmbG9hdFZhbD86IHN0cmluZztcblxuICAvLyBOb3QgaW5jbHVkZWQsIG9ubHkgZm9yIHByb2Nlc3NpbmdcbiAgcmVhY3RGaWJlck5vZGU/OiBhbnk7XG5cbiAgLy8gRG9lcyBub3QgaW5jbHVkZSB0aGUgXCJjaGlsZHJlblwiIHByb3BcbiAgcHJvcHM/OiB7XG4gICAgW2tleTogc3RyaW5nXToge1xuICAgICAgdmFsdWU6IGFueTtcbiAgICAgIHR5cGU6IEV4dHJhY3RlZFByb3BUeXBlO1xuICAgIH07XG4gIH07XG5cbiAgLy8gVGhlc2UgYXJlIHRoZSBjaGlsZHJlbiB0aGF0IGFyZSBsaXRlcmFscyB3aXRoIHRoZVxuICAvLyBwb3NpdGlvbiB0aGV5IGNhbiBiZSBmb3VuZFxuICBsaXRlcmFsQ2hpbGRyZW4/OiB7IGluZGV4OiBudW1iZXI7IHZhbHVlOiBhbnkgfVtdO1xufVxuXG5jb25zdCBleHRyYWN0UHJvcHNGcm9tUmVhY3RGaWJlck5vZGUgPSAocmVhY3RGaWJlck5vZGU6IGFueSkgPT4ge1xuICBpZiAoIXJlYWN0RmliZXJOb2RlPy5lbGVtZW50Py5tZW1vaXplZFByb3BzKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG5cbiAgY29uc3QgcHJvcHM6IGFueSA9IHt9O1xuICBPYmplY3Qua2V5cyhyZWFjdEZpYmVyTm9kZS5lbGVtZW50Lm1lbW9pemVkUHJvcHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgIGlmIChrZXkgPT09ICdjaGlsZHJlbicpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXIgb3V0IGtub3duIHByb3BzXG4gICAgaWYgKEtOT1dOX0FUVFJJQlVURVMuaGFzKGtleS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBwcm9wVmFsdWUgPSByZWFjdEZpYmVyTm9kZS5lbGVtZW50Lm1lbW9pemVkUHJvcHNba2V5XTtcblxuICAgIC8vIEZpbHRlciBvdXQgdW5rbm93biBjbGFzc2VzXG4gICAgaWYgKGtleSA9PT0gJ2NsYXNzTmFtZScgJiYgdHlwZW9mIHByb3BWYWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHByb3BWYWx1ZSA9IGdldEFsbFVua25vd25DbGFzZXNGcm9tTGlzdChwcm9wVmFsdWUuc3BsaXQoJyAnKSkuam9pbignICcpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgcHJvcFZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBwcm9wc1trZXldID0ge1xuICAgICAgICB2YWx1ZToga2V5LFxuICAgICAgICB0eXBlOiBFeHRyYWN0ZWRQcm9wVHlwZS5GVU5DVElPTixcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcHJvcFZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcHJvcHNba2V5XSA9IHtcbiAgICAgICAgICB2YWx1ZTogSlNPTi5zdHJpbmdpZnkocHJvcFZhbHVlKSxcbiAgICAgICAgICB0eXBlOiBFeHRyYWN0ZWRQcm9wVHlwZS5KU09OX09CSkVDVCxcbiAgICAgICAgfTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gc2tpcCB0aGlzIHByb3BcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcHJvcHNba2V5XSA9IHtcbiAgICAgICAgdmFsdWU6IHByb3BWYWx1ZSxcbiAgICAgICAgdHlwZTogRXh0cmFjdGVkUHJvcFR5cGUuTElURVJBTCxcbiAgICAgIH07XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHByb3BzO1xufTtcblxuY29uc3QgZXh0cmFjdExpdGVyYWxDaGlsZHJlbkZyb21SZWFjdEZpYmVyTm9kZSA9IChyZWFjdEZpYmVyTm9kZTogYW55KSA9PiB7XG4gIGlmICghcmVhY3RGaWJlck5vZGU/LmVsZW1lbnQ/Lm1lbW9pemVkUHJvcHM/LmNoaWxkcmVuKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgY29uc3QgbGl0ZXJhbENoaWxkcmVuOiB7XG4gICAgaW5kZXg6IG51bWJlcjtcbiAgICB2YWx1ZTogYW55O1xuICB9W10gPSBbXTtcblxuICBBcnJheS5mcm9tKHJlYWN0RmliZXJOb2RlLmVsZW1lbnQubWVtb2l6ZWRQcm9wcy5jaGlsZHJlbiB8fCBbXSkuZm9yRWFjaChcbiAgICAoY2hpbGRQcm9wOiBhbnksIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgY2hpbGRQcm9wICE9PSAnb2JqZWN0Jykge1xuICAgICAgICBsaXRlcmFsQ2hpbGRyZW4ucHVzaCh7XG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgdmFsdWU6IGNoaWxkUHJvcCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgKTtcbiAgcmV0dXJuIGxpdGVyYWxDaGlsZHJlbjtcbn07XG5cbmZ1bmN0aW9uIHNlbGVjdG9yU2FmZSh1bmlxdWVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAvLyBEaWN0aW9uYXJ5IG9mIHJlcGxhY2VtZW50cy4gWW91IGNhbiBleHBhbmQgdGhpcyBsaXN0IGFzIG5lZWRlZC5cbiAgY29uc3QgcmVwbGFjZW1lbnRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICchJzogJ19leGNsYW1hdGlvbl8nLFxuICAgICdAJzogJ19hdF8nLFxuICAgICcjJzogJ19oYXNoXycsXG4gICAgJDogJ19kb2xsYXJfJyxcbiAgICAnJSc6ICdfcGVyY2VudF8nLFxuICAgICdeJzogJ19jYXJldF8nLFxuICAgICcmJzogJ19hbmRfJyxcbiAgICAnKic6ICdfYXN0ZXJpc2tfJyxcbiAgICAnKCc6ICdfb3BlblBhcmVuXycsXG4gICAgJyknOiAnX2Nsb3NlUGFyZW5fJyxcbiAgICAnKyc6ICdfcGx1c18nLFxuICAgICc9JzogJ19lcXVhbHNfJyxcbiAgICAnWyc6ICdfb3BlbkJyYWNrZXRfJyxcbiAgICAnXSc6ICdfY2xvc2VCcmFja2V0XycsXG4gICAgJ3snOiAnX29wZW5CcmFjZV8nLFxuICAgICd9JzogJ19jbG9zZUJyYWNlXycsXG4gICAgJ3wnOiAnX3BpcGVfJyxcbiAgICAnOyc6ICdfc2VtaWNvbG9uXycsXG4gICAgJzonOiAnX2NvbG9uXycsXG4gICAgJywnOiAnX2NvbW1hXycsXG4gICAgJy4nOiAnX3BlcmlvZF8nLFxuICAgICc8JzogJ19sZXNzVGhhbl8nLFxuICAgICc+JzogJ19ncmVhdGVyVGhhbl8nLFxuICAgICcvJzogJ19zbGFzaF8nLFxuICAgICc/JzogJ19xdWVzdGlvbl8nLFxuICAgICdcXFxcJzogJ19iYWNrc2xhc2hfJyxcbiAgICAnICc6ICdfc3BhY2VfJyxcbiAgfTtcblxuICAvLyBSZXBsYWNlIGVhY2ggY2hhcmFjdGVyIHdpdGggaXRzIG1hcHBlZCB2YWx1ZVxuICBPYmplY3Qua2V5cyhyZXBsYWNlbWVudHMpLmZvckVhY2goKGNoYXJhY3RlcikgPT4ge1xuICAgIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cCgnXFxcXCcgKyBjaGFyYWN0ZXIsICdnJyk7XG4gICAgdW5pcXVlUGF0aCA9IHVuaXF1ZVBhdGgucmVwbGFjZShyZWdleCwgcmVwbGFjZW1lbnRzW2NoYXJhY3Rlcl0pO1xuICB9KTtcblxuICAvLyBIYW5kbGUgaW52YWxpZCBzdGFydGluZyBjaGFyYWN0ZXJzXG4gIHVuaXF1ZVBhdGggPSB1bmlxdWVQYXRoLnJlcGxhY2UoL15bMC05LV0vLCAnX3N0YXJ0TnVtT3JIeXBoZW5fJyk7XG5cbiAgLy8gTGFzdGx5LCByZXBsYWNlIGFueSByZW1haW5pbmcgbm9uLWFscGhhbnVtZXJpYyBjaGFyYWN0ZXJzIGp1c3QgaW4gY2FzZVxuICByZXR1cm4gdW5pcXVlUGF0aC5yZXBsYWNlKC9bXmEtekEtWjAtOV8tXS9nLCAnXycpO1xufVxuXG4vKipcbiAqIE5hdiBub2RlIGZvciBhIGNvbXBvbmVudCB0aGF0IGhhcyBubyBET00gZWxlbWVudCBhc3NvY2lhdGVkIHdpdGggaXRcbiAqL1xuZXhwb3J0IGNvbnN0IGdldE5hdk5vZGVGb3JWaXJ0dWFsQ29tcG9uZW50ID0gKFxuICBwYXJlbnQ6IE5hdlRyZWVOb2RlLFxuICBjb21wb25lbnROYW1lOiBzdHJpbmcsXG4gIGNvbXBvbmVudEluc3RhbmNlSWQ6IHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgdW5pcXVlUGF0aDogc3RyaW5nLFxuICBzY29wZUxvb2t1cDogeyBbY29kZWJhc2VJZDogc3RyaW5nXTogYW55IH0sXG4gIHN0b3J5Ym9hcmRJZDogc3RyaW5nLFxuICByZWFjdEZpYmVyTm9kZTogYW55LFxuKTogTmF2VHJlZU5vZGUgPT4ge1xuICBjb25zdCBuYXZUcmVlTm9kZTogTmF2VHJlZU5vZGUgPSB7XG4gICAgcGFyZW50OiBwYXJlbnQsXG4gICAgY2hpbGRyZW46IFtdLFxuICAgIGNsYXNzTGlzdDogW10sXG4gICAgZGlyZWN0bHlTZXRDbGFzc0xpc3Q6IFtdLFxuICAgIG5hbWU6ICcnLFxuICAgIHRlbXBvRWxlbWVudDogVGVtcG9FbGVtZW50LmVtcHR5KCksXG4gIH07XG5cbiAgbmF2VHJlZU5vZGUubmFtZSA9IGNvbXBvbmVudE5hbWU7XG4gIG5hdlRyZWVOb2RlLmlzQ29tcG9uZW50ID0gdHJ1ZTtcblxuICBuYXZUcmVlTm9kZS50ZW1wb0VsZW1lbnQgPSBuZXcgVGVtcG9FbGVtZW50KFxuICAgIGNvbXBvbmVudEluc3RhbmNlSWQsXG4gICAgc3Rvcnlib2FyZElkLFxuICAgIHVuaXF1ZVBhdGgsXG4gICk7XG5cbiAgbmF2VHJlZU5vZGUucHJvcHMgPSBleHRyYWN0UHJvcHNGcm9tUmVhY3RGaWJlck5vZGUocmVhY3RGaWJlck5vZGUpO1xuICBuYXZUcmVlTm9kZS5saXRlcmFsQ2hpbGRyZW4gPVxuICAgIGV4dHJhY3RMaXRlcmFsQ2hpbGRyZW5Gcm9tUmVhY3RGaWJlck5vZGUocmVhY3RGaWJlck5vZGUpO1xuXG4gIE9iamVjdC5rZXlzKHNjb3BlTG9va3VwKS5mb3JFYWNoKChjb2RlYmFzZUlkOiBzdHJpbmcpID0+IHtcbiAgICBpZiAobmF2VHJlZU5vZGUuc2NvcGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBzY29wZUxvb2t1cFtjb2RlYmFzZUlkXS5jb2RlYmFzZUlkcz8uaW5kZXhPZihjb21wb25lbnRJbnN0YW5jZUlkKSA+IC0xXG4gICAgKSB7XG4gICAgICBuYXZUcmVlTm9kZS5zY29wZSA9IHNjb3BlTG9va3VwW2NvZGViYXNlSWRdO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIG5hdlRyZWVOb2RlO1xufTtcblxuZXhwb3J0IGNvbnN0IGJ1aWxkTmF2Rm9yTm9kZSA9IChcbiAgc3Rvcnlib2FyZElkOiBzdHJpbmcsXG4gIHBhcmVudDogTmF2VHJlZU5vZGUgfCB1bmRlZmluZWQsXG4gIG5vZGU6IGFueSxcbiAgdW5pcXVlUGF0aEJhc2U6IHN0cmluZyxcbiAgdW5pcXVlUGF0aEFkZG9uOiBzdHJpbmcsXG4gIHNjb3BlTG9va3VwOiB7IFtjb2RlYmFzZUlkOiBzdHJpbmddOiBhbnkgfSxcbiAgdHJlZUVsZW1lbnRzOiB7IFtjb2RlYmFzZUlkOiBzdHJpbmddOiBhbnkgfSxcbiAgbG9va3VwSWRUb1JlYWN0VHJlZU1hcDogYW55LFxuICBrbm93bkNvbXBvbmVudE5hbWVzOiBTZXQ8c3RyaW5nPixcbiAga25vd25Db21wb25lbnRJbnN0YW5jZU5hbWVzOiBTZXQ8c3RyaW5nPixcblxuICAvLyBHZXRzIHBvcHVsYXRlZCBieSB0aGlzIGZ1bmN0aW9uLCBhIGxvb2t1cCBvZiBlbGVtZW50IGtleSAtPiBsaXN0IG9mIGVsZW1lbnQga2V5cyB0aGF0IHJlcHJlc2VudCB0aGlzIHZpcnR1YWwgY29tcG9uZW50XG4gIGVsZW1lbnRLZXlUb0xvb2t1cExpc3Q6IHsgW2VsZW1lbnRLZXk6IHN0cmluZ106IHN0cmluZ1tdIH0sXG4gIGVsZW1lbnRLZXlUb05hdk5vZGU6IHsgW2VsZW1lbnRLZXk6IHN0cmluZ106IE5hdlRyZWVOb2RlIH0sXG4pOiBOYXZUcmVlTm9kZSB8IG51bGwgPT4ge1xuICBpZiAoIW5vZGUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmIChpc05vZGVPdXRsaW5lKG5vZGUpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBpZiAoaXNTa2lwTmF2VHJlZU5vZGUobm9kZSkpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmIChbJ25vc2NyaXB0JywgJ3NjcmlwdCddLmluY2x1ZGVzKG5vZGU/LnRhZ05hbWU/LnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBmb3VuZElkID0gZ2V0Q29kZWJhc2VJZEZyb21Ob2RlKG5vZGUpO1xuICBjb25zdCByZWFjdEZpYmVyTG9va3VwSWQgPSBnZXRVbmlxdWVMb29rdXBGcm9tTm9kZShub2RlKTtcblxuICAvLyBNYXkgMTUsIDIwMjMgLT4gZm91bmQgYnVnIHdoZXJlIGEgcmFuZG9tIGlmcmFtZSB3YXMgYmVpbmcgYWRkZWQgd2l0aCB0aGUgaG90IHJlbG9hZGVkIGNvZGVcbiAgLy8gSSB0aGluayB0aGlzIGlzIHJlbGF0ZWQgdG8gdGhpcyBidWc6XG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9jcmVhdGUtcmVhY3QtYXBwL2lzc3Vlcy8xMTg4MFxuICBpZiAobm9kZT8udGFnTmFtZT8udG9Mb3dlckNhc2UoKSA9PT0gJ2lmcmFtZScpIHtcbiAgICBpZiAoIWZvdW5kSWQpIHtcbiAgICAgIG5vZGUucmVtb3ZlKCk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBsZXQgcmVhY3RGaWJlck5vZGU6IGFueSA9IG51bGw7XG4gIGlmIChyZWFjdEZpYmVyTG9va3VwSWQpIHtcbiAgICByZWFjdEZpYmVyTm9kZSA9IGxvb2t1cElkVG9SZWFjdFRyZWVNYXBbcmVhY3RGaWJlckxvb2t1cElkXTtcbiAgfVxuXG4gIGNvbnN0IGJvdW5kaW5nUmVjdCA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIGNvbnN0IHsgdG9wLCBsZWZ0IH0gPSAkKG5vZGUpLm9mZnNldCgpIHx8IHsgdG9wOiAwLCBsZWZ0OiAwIH07XG5cbiAgbGV0IHBhcmVudFRvVXNlID0gcGFyZW50O1xuICBsZXQgdW5pcXVlUGF0aEJhc2VUb1VzZSA9IHVuaXF1ZVBhdGhCYXNlO1xuXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyBIYW5kbGUgdmlydHVhbCBjb21wb25lbnRzIGZyb20gdGhlIHJlYWN0IGZpYmVyIHRyZWVcbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgLy8gRm9yIG91dGxpbmVzLCBjb21wb25lbnRzIHRoYXQgYXJlIGFkZGVkIG5lZWQgYW4gb3V0bGluZSBhcm91bmQgYWxsIHRoZSBlbGVtZW50cyBpbnNpZGVcbiAgLy8gQ3JlYXRlIGxvb2t1cHMgaW4gbG9jYWwgc3RvcmFnZSB0byBrZWVwIHRyYWNrIG9mIHRoaXNcbiAgLy8gRWxlbWVudCBrZXlzIG9mIHZpcnR1YWwgY29tcG9uZW50c1xuICBjb25zdCB2aXJ0dWFsQ29tcG9uZW50RWxlbWVudEtleXM6IHN0cmluZ1tdID0gW107XG5cbiAgLy8gV2hlbiB0aGVyZSBhcmUgcmVhY3QgZm9yd2FyZCByZWZzIHdlIHdhbnQgdG8gY29sbGFwc2UgdGhlIG5vZGUgaW50byB0aGUgdG9wIGxldmVsIGZvcndhcmQgcmVmXG4gIGxldCBjb21wb25lbnROYW1lVG9Db2xsYXBzZUludG86IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgbGV0IGNvbXBvbmVudEluc3RhbmNlSWRUb0NvbGxhcHNlSW50bzogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gIGlmIChyZWFjdEZpYmVyTm9kZSAmJiBwYXJlbnQ/LnJlYWN0RmliZXJOb2RlKSB7XG4gICAgLy8gVHJhdmVyc2UgdXAgdGhlIHN0YWNrIGFkZGluZyBjb21wb25lbnRzIHRvIHRoZSB0cmVlIHVudGlsIHlvdSBoaXQgdGhpcyBub2RlJ3MgcGFyZW50XG4gICAgLy8gTm90ZSwgd2UgaGF2ZSB0byBhY2NvdW50IGZvciBvdGhlciBjaGlsZHJlbiB0aGF0IGFscmVhZHkgcGVyZm9ybWVkIHRoaXMgb3BlcmF0aW9uIGFuZCBhZGRlZCBub2RlcyB0byB0aGUgdHJlZVxuICAgIGxldCBzZWFyY2hOb2RlID0gcmVhY3RGaWJlck5vZGUucGFyZW50O1xuICAgIGxldCBwb3NzaWJsZU5vZGVzVG9BZGQ6IGFueVtdID0gW107XG5cbiAgICAvLyBUaGlzIGxvb3AgcGlja3MgYWxsIHRoZSByZWxldmFudCBub2RlcyBpbiBiZXR3ZWVuIChpZ25vcmluZyBpZiB0aGV5IGFyZSBhbHJlYWR5IGFkZGVkIG9yIG5vdClcbiAgICB3aGlsZSAoc2VhcmNoTm9kZSkge1xuICAgICAgaWYgKHNlYXJjaE5vZGUgPT09IHBhcmVudC5yZWFjdEZpYmVyTm9kZSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gU29tZXRpbWVzIGNvbXBvbmVudHMgYXJlIG5hbWVkIGRpZmZlcmVudGx5IGluIHRoZSByZWFjdCBmaWJlciB0cmVlIGZyb20gdGhlIGNvZGViYXNlLCBidXQgd2Ugc3RpbGwgd2FudCB0byBpbmNsdWRlIHRoZW1cbiAgICAgIC8vIGluIHRoZSBET00gdHJlZSBpZiB0aGV5IGFyZSBjb21wb25lbnRzIGRlZmluZWQgaW4gc291cmNlIGZpbGVzXG4gICAgICAvLyBFLmcuIGluIG5leHQgSlMgaWYgeW91IGNyZWF0ZSBhIDxMaW5rIC8+IGVsZW1lbnQgaXQgd2lsbCBiZSBjYWxsZWQgXCJMaW5rQ29tcG9uZW50XCJcbiAgICAgIGNvbnN0IGRlYnVnU291cmNlRmlsZUluQ29kZWJhc2UgPVxuICAgICAgICBzZWFyY2hOb2RlPy5lbGVtZW50Py5fZGVidWdTb3VyY2U/LmZpbGVOYW1lICYmXG4gICAgICAgICFzZWFyY2hOb2RlPy5lbGVtZW50Py5fZGVidWdTb3VyY2U/LmZpbGVOYW1lPy5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJyk7XG5cbiAgICAgIGlmIChcbiAgICAgICAgKHNlYXJjaE5vZGUucHJvcHM/LnRlbXBvZWxlbWVudGlkIHx8XG4gICAgICAgICAgc2VhcmNoTm9kZS5wcm9wcz8uWydkYXRhLXRlc3RpZCddKSAmJlxuICAgICAgICAoa25vd25Db21wb25lbnROYW1lcz8uaGFzKHNlYXJjaE5vZGUubmFtZSkgfHxcbiAgICAgICAgICBrbm93bkNvbXBvbmVudEluc3RhbmNlTmFtZXM/LmhhcyhzZWFyY2hOb2RlLm5hbWUpIHx8XG4gICAgICAgICAgZGVidWdTb3VyY2VGaWxlSW5Db2RlYmFzZSlcbiAgICAgICkge1xuICAgICAgICBwb3NzaWJsZU5vZGVzVG9BZGQucHVzaChzZWFyY2hOb2RlKTtcbiAgICAgIH1cbiAgICAgIHNlYXJjaE5vZGUgPSBzZWFyY2hOb2RlLnBhcmVudDtcbiAgICB9XG5cbiAgICAvLyBGb3VuZCB0aGUgcGFyZW50LCB0cmF2ZXJzZSBkb3duIHRoZSBub2RlcywgY2hlY2tpbmcgaWYgdGhhdCBub2RlIHdhcyBhbHJlYWR5IGFkZGVkIHRvIHRoZSB0cmVlLFxuICAgIC8vIGFuZCBhZGRpbmcgaXQgaWYgaXQgd2Fzbid0XG4gICAgaWYgKHNlYXJjaE5vZGUgJiYgcG9zc2libGVOb2Rlc1RvQWRkLmxlbmd0aCkge1xuICAgICAgbGV0IGN1cnJlbnRQYXJlbnQgPSBwYXJlbnQ7XG5cbiAgICAgIEFycmF5LmZyb20ocG9zc2libGVOb2Rlc1RvQWRkKVxuICAgICAgICAucmV2ZXJzZSgpXG4gICAgICAgIC5mb3JFYWNoKChub2RlVG9BZGQ6IGFueSkgPT4ge1xuICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSBmb3J3YXJkIHJlZiBqdXN0IG1vdmUgZm9yd2FyZCBpbiB0aGUgdHJlZSB3aXRob3V0IGFkZGluZyB0aGlzIGVsZW1lbnQsIGJ1dFxuICAgICAgICAgIC8vIGJ1dCBzdGlsbCBsYWJlbCB0aGUgbmV4dCBub24tZm9yd2FyZCByZWYgd2l0aCB0aGlzIG5vZGUncyBuYW1lICYgaW5zdGFuY2UgSURcbiAgICAgICAgICAvLyBIb3dldmVyLCBvbmx5IGRvIHRoaXMgdGhlIGZpcnN0IHRpbWUgKHdhbnQgdGhlIGhpZ2hlc3QgZm9yd2FyZCByZWYpXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgbm9kZVRvQWRkPy5lbGVtZW50Py5lbGVtZW50VHlwZT8uWyckJHR5cGVvZiddPy50b1N0cmluZygpID09PVxuICAgICAgICAgICAgJ1N5bWJvbChyZWFjdC5mb3J3YXJkX3JlZiknXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICFjb21wb25lbnROYW1lVG9Db2xsYXBzZUludG8gJiZcbiAgICAgICAgICAgICAgIWNvbXBvbmVudEluc3RhbmNlSWRUb0NvbGxhcHNlSW50b1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGNvbXBvbmVudEluc3RhbmNlSWRUb0NvbGxhcHNlSW50byA9XG4gICAgICAgICAgICAgICAgbm9kZVRvQWRkLnByb3BzPy50ZW1wb2VsZW1lbnRpZCB8fFxuICAgICAgICAgICAgICAgIG5vZGVUb0FkZC5wcm9wcz8uWydkYXRhLXRlc3RpZCddO1xuXG4gICAgICAgICAgICAgIGNvbnN0IHJlZmVyZW5jZVRyZWVFbGVtZW50ID1cbiAgICAgICAgICAgICAgICB0cmVlRWxlbWVudHNbY29tcG9uZW50SW5zdGFuY2VJZFRvQ29sbGFwc2VJbnRvIHx8ICcnXTtcblxuICAgICAgICAgICAgICBpZiAocmVmZXJlbmNlVHJlZUVsZW1lbnQ/LnR5cGUgPT09ICdjb21wb25lbnQtaW5zdGFuY2UnKSB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50TmFtZVRvQ29sbGFwc2VJbnRvID1cbiAgICAgICAgICAgICAgICAgIHJlZmVyZW5jZVRyZWVFbGVtZW50LmNvbXBvbmVudE5hbWU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50TmFtZVRvQ29sbGFwc2VJbnRvID0gbm9kZVRvQWRkLm5hbWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IG1hdGNoaW5nTmF2VHJlZU5vZGUgPSBjdXJyZW50UGFyZW50XG4gICAgICAgICAgICA/IGN1cnJlbnRQYXJlbnQuY2hpbGRyZW4/LmZpbmQoXG4gICAgICAgICAgICAgICAgKGNoaWxkKSA9PiBjaGlsZC5yZWFjdEZpYmVyTm9kZSA9PT0gbm9kZVRvQWRkLFxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICA6IG51bGw7XG5cbiAgICAgICAgICAvLyBOb2RlIGFscmVhZHkgbWF0Y2hlcywgaW5jcmVhc2UgbGV2ZWwgYW5kIGNvbnRpbnVlXG4gICAgICAgICAgaWYgKG1hdGNoaW5nTmF2VHJlZU5vZGUpIHtcbiAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQgPSBtYXRjaGluZ05hdlRyZWVOb2RlO1xuXG4gICAgICAgICAgICBpZiAoY3VycmVudFBhcmVudC50ZW1wb0VsZW1lbnQpIHtcbiAgICAgICAgICAgICAgdmlydHVhbENvbXBvbmVudEVsZW1lbnRLZXlzLnB1c2goXG4gICAgICAgICAgICAgICAgY3VycmVudFBhcmVudC50ZW1wb0VsZW1lbnQuZ2V0S2V5KCksXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEluY3JlYXNlIHRoZSBzaXplIG9mIHRoZSBib3VuZGluZyBib3ggZm9yIHRoaXMgZWxlbWVudFxuICAgICAgICAgICAgaWYgKCFtYXRjaGluZ05hdlRyZWVOb2RlLnBhZ2VCb3VuZGluZ0JveCkge1xuICAgICAgICAgICAgICBtYXRjaGluZ05hdlRyZWVOb2RlLnBhZ2VCb3VuZGluZ0JveCA9IHtcbiAgICAgICAgICAgICAgICBwYWdlWDogbGVmdCxcbiAgICAgICAgICAgICAgICBwYWdlWTogdG9wLFxuICAgICAgICAgICAgICAgIHdpZHRoOiBib3VuZGluZ1JlY3Qud2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBib3VuZGluZ1JlY3QuaGVpZ2h0LFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY29uc3QgbmV3UmlnaHQgPSBNYXRoLm1heChcbiAgICAgICAgICAgICAgICBtYXRjaGluZ05hdlRyZWVOb2RlLnBhZ2VCb3VuZGluZ0JveC5wYWdlWCArXG4gICAgICAgICAgICAgICAgICBtYXRjaGluZ05hdlRyZWVOb2RlLnBhZ2VCb3VuZGluZ0JveC53aWR0aCxcbiAgICAgICAgICAgICAgICBsZWZ0ICsgYm91bmRpbmdSZWN0LndpZHRoLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBjb25zdCBuZXdMZWZ0ID0gTWF0aC5taW4oXG4gICAgICAgICAgICAgICAgbWF0Y2hpbmdOYXZUcmVlTm9kZS5wYWdlQm91bmRpbmdCb3gucGFnZVgsXG4gICAgICAgICAgICAgICAgYm91bmRpbmdSZWN0LmxlZnQsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGNvbnN0IG5ld1RvcCA9IE1hdGgubWluKFxuICAgICAgICAgICAgICAgIG1hdGNoaW5nTmF2VHJlZU5vZGUucGFnZUJvdW5kaW5nQm94LnBhZ2VZLFxuICAgICAgICAgICAgICAgIGJvdW5kaW5nUmVjdC50b3AsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGNvbnN0IG5ld0JvdHRvbSA9IE1hdGgubWF4KFxuICAgICAgICAgICAgICAgIG1hdGNoaW5nTmF2VHJlZU5vZGUucGFnZUJvdW5kaW5nQm94LnBhZ2VZICtcbiAgICAgICAgICAgICAgICAgIG1hdGNoaW5nTmF2VHJlZU5vZGUucGFnZUJvdW5kaW5nQm94LmhlaWdodCxcbiAgICAgICAgICAgICAgICB0b3AgKyBib3VuZGluZ1JlY3QuaGVpZ2h0LFxuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgIG1hdGNoaW5nTmF2VHJlZU5vZGUucGFnZUJvdW5kaW5nQm94LnBhZ2VYID0gbmV3TGVmdDtcbiAgICAgICAgICAgICAgbWF0Y2hpbmdOYXZUcmVlTm9kZS5wYWdlQm91bmRpbmdCb3gucGFnZVkgPSBuZXdUb3A7XG4gICAgICAgICAgICAgIG1hdGNoaW5nTmF2VHJlZU5vZGUucGFnZUJvdW5kaW5nQm94LndpZHRoID0gbmV3UmlnaHQgLSBuZXdMZWZ0O1xuICAgICAgICAgICAgICBtYXRjaGluZ05hdlRyZWVOb2RlLnBhZ2VCb3VuZGluZ0JveC5oZWlnaHQgPSBuZXdCb3R0b20gLSBuZXdUb3A7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSwgY3JlYXRlIGEgbmV3IHZpcnR1YWwgbm9kZSwgYWRkIHRvIHBhcmVudCBhbmQgY29udGludWVcbiAgICAgICAgICAgIGxldCBjb21wb25lbnROYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgY29tcG9uZW50SW5zdGFuY2VJZDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICBpZiAoY29tcG9uZW50TmFtZVRvQ29sbGFwc2VJbnRvKSB7XG4gICAgICAgICAgICAgIGNvbXBvbmVudE5hbWUgPSBjb21wb25lbnRJbnN0YW5jZUlkVG9Db2xsYXBzZUludG87XG4gICAgICAgICAgICAgIGNvbXBvbmVudEluc3RhbmNlSWQgPSBjb21wb25lbnRJbnN0YW5jZUlkVG9Db2xsYXBzZUludG87XG4gICAgICAgICAgICAgIGNvbXBvbmVudE5hbWVUb0NvbGxhcHNlSW50byA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgY29tcG9uZW50SW5zdGFuY2VJZFRvQ29sbGFwc2VJbnRvID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY29tcG9uZW50TmFtZSA9IG5vZGVUb0FkZC5uYW1lO1xuICAgICAgICAgICAgICBjb21wb25lbnRJbnN0YW5jZUlkID1cbiAgICAgICAgICAgICAgICBub2RlVG9BZGQucHJvcHM/LnRlbXBvZWxlbWVudGlkIHx8XG4gICAgICAgICAgICAgICAgbm9kZVRvQWRkLnByb3BzPy5bJ2RhdGEtdGVzdGlkJ107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgdW5pcXVlIHBhdGggYW5kIHVzZSBpdFxuICAgICAgICAgICAgdW5pcXVlUGF0aEJhc2VUb1VzZSA9IHNlbGVjdG9yU2FmZShcbiAgICAgICAgICAgICAgYCR7dW5pcXVlUGF0aEJhc2VUb1VzZX0tJHtjdXJyZW50UGFyZW50Py5jaGlsZHJlbj8ubGVuZ3RoIHx8IDB9YCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjb25zdCBuZXdWaXJ0dWFsQ29tcG9uZW50ID0gZ2V0TmF2Tm9kZUZvclZpcnR1YWxDb21wb25lbnQoXG4gICAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQsXG4gICAgICAgICAgICAgIG5vZGVUb0FkZC5uYW1lLFxuICAgICAgICAgICAgICBjb21wb25lbnRJbnN0YW5jZUlkLFxuICAgICAgICAgICAgICB1bmlxdWVQYXRoQmFzZVRvVXNlLFxuICAgICAgICAgICAgICBzY29wZUxvb2t1cCxcbiAgICAgICAgICAgICAgc3Rvcnlib2FyZElkLFxuICAgICAgICAgICAgICBub2RlVG9BZGQsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY3VycmVudFBhcmVudC5jaGlsZHJlbi5wdXNoKG5ld1ZpcnR1YWxDb21wb25lbnQpO1xuICAgICAgICAgICAgY3VycmVudFBhcmVudCA9IG5ld1ZpcnR1YWxDb21wb25lbnQ7XG5cbiAgICAgICAgICAgIHZpcnR1YWxDb21wb25lbnRFbGVtZW50S2V5cy5wdXNoKFxuICAgICAgICAgICAgICBuZXdWaXJ0dWFsQ29tcG9uZW50LnRlbXBvRWxlbWVudC5nZXRLZXkoKSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBlbGVtZW50S2V5VG9OYXZOb2RlW25ld1ZpcnR1YWxDb21wb25lbnQudGVtcG9FbGVtZW50LmdldEtleSgpXSA9XG4gICAgICAgICAgICAgIG5ld1ZpcnR1YWxDb21wb25lbnQ7XG5cbiAgICAgICAgICAgIC8vIFNldCB0aGUgYm91bmRpbmcgYm94IGZvciB0aGUgbmV3IHZpcnR1YWwgY29tcG9uZW50XG4gICAgICAgICAgICBuZXdWaXJ0dWFsQ29tcG9uZW50LnBhZ2VCb3VuZGluZ0JveCA9IHtcbiAgICAgICAgICAgICAgcGFnZVg6IGxlZnQsXG4gICAgICAgICAgICAgIHBhZ2VZOiB0b3AsXG4gICAgICAgICAgICAgIHdpZHRoOiBib3VuZGluZ1JlY3Qud2lkdGgsXG4gICAgICAgICAgICAgIGhlaWdodDogYm91bmRpbmdSZWN0LmhlaWdodCxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgcGFyZW50VG9Vc2UgPSBjdXJyZW50UGFyZW50O1xuICAgIH1cbiAgfVxuXG4gIC8vIFRoaXMgbm9kZSBjb3JyZXNwb25kcyB0byB0aGUgRE9NIGVsZW1lbnQsIG5vdCBhbnkgY29tcG9uZW50cywgdW5sZXNzIHdlIGFyZSBjb2xsYXBzaW5nIGludG8gdGhlIGNvbXBvbmVudFxuICBjb25zdCBuYXZUcmVlTm9kZTogTmF2VHJlZU5vZGUgPSB7XG4gICAgcGFyZW50OiBwYXJlbnRUb1VzZSxcbiAgICBjaGlsZHJlbjogW10sXG4gICAgY2xhc3NMaXN0OiBnZXRBbGxVbmtub3duQ2xhc3Nlcyhub2RlKSxcbiAgICBkaXJlY3RseVNldENsYXNzTGlzdDogW10sXG4gICAgbmFtZTogJycsXG4gICAgdGVtcG9FbGVtZW50OiBUZW1wb0VsZW1lbnQuZW1wdHkoKSxcbiAgfTtcblxuICBwYXJlbnRUb1VzZT8uY2hpbGRyZW4/LnB1c2gobmF2VHJlZU5vZGUpO1xuICBuYXZUcmVlTm9kZS5uYW1lID0gY29tcG9uZW50TmFtZVRvQ29sbGFwc2VJbnRvIHx8IG5vZGUudGFnTmFtZTtcbiAgbmF2VHJlZU5vZGUuZWxlbWVudFRhZ05hbWUgPSBub2RlLnRhZ05hbWU7XG5cbiAgLy8gVGhlc2UgYXJlIG9ubHkgZm9yd2FyZCByZWYgY29tcG9uZW50cywgYWxsIG90aGVyIGNvbXBvbmVudHMgYXJlIGFkZGVkIGFzIHZpcnR1YWwgY29tcG9uZW50c1xuICBuYXZUcmVlTm9kZS5pc0NvbXBvbmVudCA9IEJvb2xlYW4oY29tcG9uZW50SW5zdGFuY2VJZFRvQ29sbGFwc2VJbnRvKTtcblxuICBjb25zdCB1bmlxdWVQYXRoRm9yTm9kZSA9IHNlbGVjdG9yU2FmZShcbiAgICBgJHt1bmlxdWVQYXRoQmFzZVRvVXNlfSR7dW5pcXVlUGF0aEFkZG9ufWAsXG4gICk7XG5cbiAgY29uc3QgY29kZWJhc2VJZCA9IGNvbXBvbmVudEluc3RhbmNlSWRUb0NvbGxhcHNlSW50byB8fCBmb3VuZElkIHx8IHVuZGVmaW5lZDtcbiAgbmF2VHJlZU5vZGUudGVtcG9FbGVtZW50ID0gbmV3IFRlbXBvRWxlbWVudChcbiAgICBjb2RlYmFzZUlkLFxuICAgIHN0b3J5Ym9hcmRJZCxcbiAgICB1bmlxdWVQYXRoRm9yTm9kZSxcbiAgKTtcblxuICBjb25zdCBub2RlRWxlbWVudEtleSA9IG5hdlRyZWVOb2RlLnRlbXBvRWxlbWVudC5nZXRLZXkoKTtcbiAgLy8gVXNpbmcgdGhlIHZpcnR1YWxDb21wb25lbnRFbGVtZW50S2V5cywgc2V0IHRoZSBlbGVtZW50S2V5IGluIGEgbGlzdCBmb3IgdGhpcyBlbGVtZW50XG4gIHZpcnR1YWxDb21wb25lbnRFbGVtZW50S2V5cy5mb3JFYWNoKChlbGVtZW50S2V5OiBhbnkpID0+IHtcbiAgICBpZiAoZWxlbWVudEtleVRvTG9va3VwTGlzdFtlbGVtZW50S2V5XSkge1xuICAgICAgZWxlbWVudEtleVRvTG9va3VwTGlzdFtlbGVtZW50S2V5XS5wdXNoKG5vZGVFbGVtZW50S2V5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWxlbWVudEtleVRvTG9va3VwTGlzdFtlbGVtZW50S2V5XSA9IFtub2RlRWxlbWVudEtleV07XG4gICAgfVxuICB9KTtcblxuICAvLyBTZXQgdGhlIGxvb2t1cCBsaXN0IGZvciB0aGUgc3BlY2lmaWMgbm9kZSBpdHNlbGYgYXMgd2VsbFxuICBlbGVtZW50S2V5VG9Mb29rdXBMaXN0W25vZGVFbGVtZW50S2V5XSA9IFtub2RlRWxlbWVudEtleV07XG5cbiAgLy8gQWRkIHRoZSBlbGVtZW50IGtleSB0byB0aGUgY2xhc3MgdG8gaGVscCB3aXRoIHJlZmVyZW5jaW5nXG4gIC8vIE5vdGUgLSBldmVuIGlmIHRoZXJlIGlzIG5vIGNvZGViYXNlIElEIHdlIHN0aWxsIG1hcmsgaXQgYXMgc29tZXRoaW5nIHByb2Nlc3NlZCBpbiB0aGUgbmF2IHRyZWVcbiAgYWRkRWxlbWVudEtleUFzQ2xhc3Mobm9kZSwgbm9kZUVsZW1lbnRLZXkpO1xuXG4gIGNvbnN0IHRyZWVFbGVtZW50Rm9yTm9kZSA9IHRyZWVFbGVtZW50c1tuYXZUcmVlTm9kZS50ZW1wb0VsZW1lbnQuY29kZWJhc2VJZF07XG4gIGlmICh0cmVlRWxlbWVudEZvck5vZGUpIHtcbiAgICBjb25zdCByZW1vdmFibGVDbGFzc2VzID0gbmV3IFNldChcbiAgICAgIHRyZWVFbGVtZW50Rm9yTm9kZT8ucmVtb3ZhYmxlQ2xhc3NlcyB8fCBbXSxcbiAgICApO1xuICAgIG5hdlRyZWVOb2RlLmRpcmVjdGx5U2V0Q2xhc3NMaXN0ID0gbmF2VHJlZU5vZGUuY2xhc3NMaXN0Py5maWx0ZXIoKGNscykgPT4ge1xuICAgICAgcmV0dXJuIHJlbW92YWJsZUNsYXNzZXMuaGFzKGNscyk7XG4gICAgfSk7XG4gIH1cblxuICBuYXZUcmVlTm9kZS5yZWFjdEZpYmVyTm9kZSA9IHJlYWN0RmliZXJOb2RlO1xuICBuYXZUcmVlTm9kZS5wcm9wcyA9IGV4dHJhY3RQcm9wc0Zyb21SZWFjdEZpYmVyTm9kZShyZWFjdEZpYmVyTm9kZSk7XG4gIG5hdlRyZWVOb2RlLmxpdGVyYWxDaGlsZHJlbiA9XG4gICAgZXh0cmFjdExpdGVyYWxDaGlsZHJlbkZyb21SZWFjdEZpYmVyTm9kZShyZWFjdEZpYmVyTm9kZSk7XG5cbiAgbmF2VHJlZU5vZGUucGFnZUJvdW5kaW5nQm94ID0ge1xuICAgIHBhZ2VYOiBsZWZ0LFxuICAgIHBhZ2VZOiB0b3AsXG4gICAgd2lkdGg6IGJvdW5kaW5nUmVjdC53aWR0aCxcbiAgICBoZWlnaHQ6IGJvdW5kaW5nUmVjdC5oZWlnaHQsXG4gIH07XG4gIG5hdlRyZWVOb2RlLmRpc3BsYXlUeXBlID0gY3NzRXZhbChub2RlLCAnZGlzcGxheScpO1xuICBuYXZUcmVlTm9kZS5wb3NpdGlvblR5cGUgPSBjc3NFdmFsKG5vZGUsICdwb3NpdGlvbicpO1xuICBuYXZUcmVlTm9kZS5mbGV4RGlyZWN0aW9uID0gY3NzRXZhbChub2RlLCAnZmxleC1kaXJlY3Rpb24nKTtcbiAgbmF2VHJlZU5vZGUuZmxvYXRWYWwgPSBjc3NFdmFsKG5vZGUsICdmbG9hdCcpO1xuXG4gIGlmIChuYXZUcmVlTm9kZS50ZW1wb0VsZW1lbnQuY29kZWJhc2VJZCkge1xuICAgIE9iamVjdC5rZXlzKHNjb3BlTG9va3VwKS5mb3JFYWNoKChjb2RlYmFzZUlkOiBzdHJpbmcpID0+IHtcbiAgICAgIGlmIChuYXZUcmVlTm9kZS5zY29wZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgc2NvcGVMb29rdXBbY29kZWJhc2VJZF0uY29kZWJhc2VJZHM/LmluZGV4T2YoXG4gICAgICAgICAgbmF2VHJlZU5vZGUudGVtcG9FbGVtZW50LmNvZGViYXNlSWQsXG4gICAgICAgICkgPiAtMVxuICAgICAgKSB7XG4gICAgICAgIG5hdlRyZWVOb2RlLnNjb3BlID0gc2NvcGVMb29rdXBbY29kZWJhc2VJZF07XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvLyBPbmx5IHBhcnNlIGNoaWxkcmVuIGZvciBub24tc3ZnIGVsZW1lbnRzXG4gIGlmIChub2RlLmNoaWxkcmVuICYmIG5vZGUudGFnTmFtZSAhPT0gJ3N2ZycpIHtcbiAgICBsZXQgaW5kZXhGb3JVbmlxdWVuZXNzID0gMDtcblxuICAgIEFycmF5LmZyb20obm9kZS5jaGlsZHJlbikuZm9yRWFjaCgoY2hpbGQ6IGFueSkgPT4ge1xuICAgICAgYnVpbGROYXZGb3JOb2RlKFxuICAgICAgICBzdG9yeWJvYXJkSWQsXG4gICAgICAgIG5hdlRyZWVOb2RlLFxuICAgICAgICBjaGlsZCxcbiAgICAgICAgdW5pcXVlUGF0aEZvck5vZGUsXG4gICAgICAgIGAtJHtpbmRleEZvclVuaXF1ZW5lc3N9YCxcbiAgICAgICAgc2NvcGVMb29rdXAsXG4gICAgICAgIHRyZWVFbGVtZW50cyxcbiAgICAgICAgbG9va3VwSWRUb1JlYWN0VHJlZU1hcCxcbiAgICAgICAga25vd25Db21wb25lbnROYW1lcyxcbiAgICAgICAga25vd25Db21wb25lbnRJbnN0YW5jZU5hbWVzLFxuICAgICAgICBlbGVtZW50S2V5VG9Mb29rdXBMaXN0LFxuICAgICAgICBlbGVtZW50S2V5VG9OYXZOb2RlLFxuICAgICAgKTtcblxuICAgICAgaW5kZXhGb3JVbmlxdWVuZXNzICs9IDE7XG4gICAgfSk7XG4gIH1cblxuICBlbGVtZW50S2V5VG9OYXZOb2RlW25vZGVFbGVtZW50S2V5XSA9IG5hdlRyZWVOb2RlO1xuXG4gIC8vIFRoaXMgaXMgdGhlIHRvcC1sZXZlbCBub2RlXG4gIGlmICghcGFyZW50VG9Vc2UpIHtcbiAgICBsZXQgbmV3TmF2VHJlZSA9IGZpbHRlck91dE5vZGVzV2l0aG91dENvZGViYXNlSWQoXG4gICAgICBuYXZUcmVlTm9kZSxcbiAgICAgIGVsZW1lbnRLZXlUb05hdk5vZGUsXG4gICAgICB0cmVlRWxlbWVudHMsXG4gICAgICBzdG9yeWJvYXJkSWQsXG4gICAgKTtcblxuICAgIHJldHVybiBuZXdOYXZUcmVlO1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5jb25zdCBmaWx0ZXJPdXROb2Rlc1dpdGhvdXRDb2RlYmFzZUlkID0gKFxuICBmaW5pc2hlZE5hdlRyZWU6IE5hdlRyZWVOb2RlLFxuICBlbGVtZW50S2V5VG9OYXZOb2RlOiB7IFtlbGVtZW50S2V5OiBzdHJpbmddOiBOYXZUcmVlTm9kZSB9LFxuICB0cmVlRWxlbWVudHM6IHsgW2NvZGViYXNlSWQ6IHN0cmluZ106IGFueSB9LFxuICBzdG9yeWJvYXJkSWQ6IHN0cmluZyxcbik6IE5hdlRyZWVOb2RlID0+IHtcbiAgbGV0IHRyZWVUb1JldHVybjogTmF2VHJlZU5vZGUgPSBmaW5pc2hlZE5hdlRyZWU7XG5cbiAgY29uc3Qgc3Rvcnlib2FyZFR5cGUgPSBnZXRNZW1vcnlTdG9yYWdlSXRlbShTVE9SWUJPQVJEX1RZUEUpIHx8ICdBUFBMSUNBVElPTic7XG4gIGNvbnN0IHN0b3J5Ym9hcmRTYXZlZENvbXBvbmVudEZpbGUgPSBnZXRNZW1vcnlTdG9yYWdlSXRlbShcbiAgICBTQVZFRF9TVE9SWUJPQVJEX0NPTVBPTkVOVF9GSUxFTkFNRSxcbiAgKTtcblxuICBjb25zdCBvcmlnaW5hbFN0b3J5Ym9hcmRVcmwgPSBnZXRNZW1vcnlTdG9yYWdlSXRlbShPUklHSU5BTF9TVE9SWUJPQVJEX1VSTCk7XG5cbiAgY29uc3QgdXNlck5hdmlnYXRlZFRvTmV3Um91dGUgPVxuICAgIG9yaWdpbmFsU3Rvcnlib2FyZFVybCAmJlxuICAgICF3aW5kb3cubG9jYXRpb24uaHJlZi5pbmNsdWRlcyhvcmlnaW5hbFN0b3J5Ym9hcmRVcmwpO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIHRyZWUgZWxlbWVudCBpcyBpbiB0aGUgdG9wLWxldmVsIGZpbGUgb2YgdGhlIHN0b3J5Ym9hcmRcbiAgICogTm90ZSAtIGZvciBzYXZlZCBjb21wb25lbnRzIHRoZSB0b3AtbGV2ZWwgZmlsZSBpcyB0aGUgc2F2ZWQgY29tcG9uZW50IGZpbGVcbiAgICovXG4gIGNvbnN0IGlzRWxlbWVudERpcmVjdGx5SW5TdG9yeWJvYXJkID0gKG5vZGU6IE5hdlRyZWVOb2RlKSA9PiB7XG4gICAgY29uc3QgZmlsZW5hbWUgPSB0cmVlRWxlbWVudHNbbm9kZS50ZW1wb0VsZW1lbnQuY29kZWJhc2VJZF0/LmZpbGVuYW1lO1xuXG4gICAgLy8gRm9yIHN0b3JpZXMsIGp1c3QgZmlsdGVyIGZvciBhbnl0aGluZyBub3QgaW4gX2FwcCBvciBfZG9jdW1lbnRcbiAgICBpZiAoXG4gICAgICBzdG9yeWJvYXJkVHlwZSA9PT0gJ1NUT1JZJyAmJlxuICAgICAgZmlsZW5hbWUgJiZcbiAgICAgICFmaWxlbmFtZS5pbmNsdWRlcygnX2FwcCcpICYmXG4gICAgICAhZmlsZW5hbWUuaW5jbHVkZXMoJ19kb2N1bWVudCcpXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBTcGVjaWFsIGNhc2UgLT4gaWYgdGhlIHBhcmVudCBpcyB0aGUgYm9keSBlbGVtZW50IHRoaXMgbWlnaHQgYmUgaW4gYSBwb3J0YWxcbiAgICAvLyBnbyBhbGwgdGhlIHdheSB1cCB0aGUgcmVhY3QgZmliZXIgdHJlZSBhbmQgc2VlIGlmIHRoZXJlIGFyZSBhbnkgZWxlbWVudHNcbiAgICAvLyB0aGF0IGFyZSBpbiB0aGUgc3Rvcnlib2FyZFxuICAgIGlmIChub2RlLnBhcmVudD8ubmFtZSA9PT0gJ0JPRFknKSB7XG4gICAgICBsZXQgcGFyZW50RmliZXJOb2RlID0gbm9kZS5yZWFjdEZpYmVyTm9kZT8ucGFyZW50O1xuICAgICAgd2hpbGUgKHBhcmVudEZpYmVyTm9kZSkge1xuICAgICAgICBjb25zdCBjb2RlYmFzZUlkID1cbiAgICAgICAgICBwYXJlbnRGaWJlck5vZGU/LnByb3BzPy50ZW1wb2VsZW1lbnRpZCB8fFxuICAgICAgICAgIHBhcmVudEZpYmVyTm9kZT8ucHJvcHM/LlsnZGF0YS10ZXN0aWQnXSB8fFxuICAgICAgICAgICcnO1xuXG4gICAgICAgIGlmIChjb2RlYmFzZUlkKSB7XG4gICAgICAgICAgY29uc3QgdHJlZUVsZW1lbnRGaWxlbmFtZSA9IHRyZWVFbGVtZW50c1tjb2RlYmFzZUlkXT8uZmlsZW5hbWU7XG4gICAgICAgICAgY29uc3QgdmFsaWQgPVxuICAgICAgICAgICAgQm9vbGVhbih0cmVlRWxlbWVudEZpbGVuYW1lPy5pbmNsdWRlcygndGVtcG9ib29rL3N0b3J5Ym9hcmRzJykpIHx8XG4gICAgICAgICAgICBCb29sZWFuKFxuICAgICAgICAgICAgICB0cmVlRWxlbWVudEZpbGVuYW1lICYmXG4gICAgICAgICAgICAgICAgdHJlZUVsZW1lbnRGaWxlbmFtZSA9PT0gc3Rvcnlib2FyZFNhdmVkQ29tcG9uZW50RmlsZSxcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICBpZiAodmFsaWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHBhcmVudEZpYmVyTm9kZSA9IHBhcmVudEZpYmVyTm9kZT8ucGFyZW50O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZvciBldmVyeXRoaW5nIGVsc2UsIGZpbHRlciBhbnl0aGluZyB0aGF0IGlzIG5vdCBpbiB0aGUgc3Rvcnlib2FyZCBpdHNlbGZcbiAgICByZXR1cm4gKFxuICAgICAgQm9vbGVhbihmaWxlbmFtZT8uaW5jbHVkZXMoJ3RlbXBvYm9vay9zdG9yeWJvYXJkcycpKSB8fFxuICAgICAgQm9vbGVhbihmaWxlbmFtZSAmJiBmaWxlbmFtZSA9PT0gc3Rvcnlib2FyZFNhdmVkQ29tcG9uZW50RmlsZSlcbiAgICApO1xuICB9O1xuXG4gIGNvbnN0IHByb2Nlc3NOb2RlID0gKFxuICAgIG5vZGU6IE5hdlRyZWVOb2RlLFxuICAgIGVsZW1lbnRJblN0b3J5Ym9hcmRGb3VuZDogYm9vbGVhbixcbiAgKSA9PiB7XG4gICAgLy8gUHJvY2VzcyB0aGUgY2hpbGRyZW4gZmlyc3RcbiAgICBmb3IgKGxldCBpID0gbm9kZS5jaGlsZHJlbi5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgcHJvY2Vzc05vZGUoXG4gICAgICAgIG5vZGUuY2hpbGRyZW5baV0sXG4gICAgICAgIGVsZW1lbnRJblN0b3J5Ym9hcmRGb3VuZCB8fCBpc0VsZW1lbnREaXJlY3RseUluU3Rvcnlib2FyZChub2RlKSxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gUHJvZHVjdCBkZWNpc2lvbjogRmlsdGVyIG91dCBub2RlcyB0aGF0IGRvbid0IGV4aXN0IGluIHN0b3J5Ym9hcmQgZmlsZSBmb3IgdGhlIGNvcnJlc3BvbmRpbmcgY29tcG9uZW50IFVSTFxuICAgIC8vXG4gICAgLy8gSGlzdG9yaWNhbCBjb250ZXh0OlxuICAgIC8vIERlYyAxNCAtIGEgYnVnIHdhcyBmb3VuZCB3aGVyZSBpbiBjYXNlcyB0aGF0IGNvbXBvbmVudHMgd2VyZSBkeW5hbWljYWxseSBsb2FkZWQgKGUuZy4gaW4gTmV4dCBKUyBfYXBwLnRzeCksIHdoZW4geW91IGNsaWNrXG4gICAgLy8gb24gdGhlIHRvcCBsZXZlbCBjb21wb25lbnQgaXQgd291bGQgcG9pbnQgdG8gdGhpcyBsb2NhdGlvbiBpbiB0aGUgY29kZWJhc2U6XG4gICAgLy9cbiAgICAvLyBmdW5jdGlvbiBNeUFwcCh7IENvbXBvbmVudCwgcGFnZVByb3BzOiB7IHNlc3Npb24sIC4uLnBhZ2VQcm9wcyB9IH06IEFwcFByb3BzKSB7XG4gICAgLy8gICByZXR1cm4gKFxuICAgIC8vICAgICA8U2Vzc2lvblByb3ZpZGVyIHNlc3Npb249e3Nlc3Npb259PlxuICAgIC8vICAgICAgIDxDb21wb25lbnQgey4uLnBhZ2VQcm9wc30gLz5cbiAgICAvLyAgICAgICA8QW5hbHl0aWNzIC8+XG4gICAgLy8gICAgIDwvU2Vzc2lvblByb3ZpZGVyPlxuICAgIC8vICAgKTtcbiAgICAvLyB9XG4gICAgLy9cbiAgICAvLyBUaGlzIHdhcyBlc3BlY2lhbGx5IGFuIGlzc3VlIGZvciBjb21wb25lbnQgc3Rvcnlib2FyZHMuIFRodXMgdGhlIGRlY2lzaW9uIHdhcyBtYWRlIHRvIGhpZGUgYW55IHRvcC1sZXZlbCBjb21wb25lbnRzIG9yIGRpdnNcbiAgICAvLyB0aGF0IGFyZSBub3QgaW4gdGhlIHN0b3J5Ym9hcmQgZmlsZVxuICAgIGNvbnN0IGluQ29tcG9uZW50U3Rvcnlib2FyZEFuZFNraXAgPVxuICAgICAgc3Rvcnlib2FyZFR5cGUgIT09ICdBUFBMSUNBVElPTicgJiZcbiAgICAgICF1c2VyTmF2aWdhdGVkVG9OZXdSb3V0ZSAmJlxuICAgICAgIWVsZW1lbnRJblN0b3J5Ym9hcmRGb3VuZCAmJlxuICAgICAgIWlzRWxlbWVudERpcmVjdGx5SW5TdG9yeWJvYXJkKG5vZGUpO1xuXG4gICAgLy8gSWYgdGhpcyBub2RlIGRvZXNuJ3QgaGF2ZSBhIGNvZGViYXNlSWQsIG1vdmUgaXRzIGNoaWxkcmVuIHRvIGl0cyBwYXJlbnRcbiAgICBpZiAoXG4gICAgICAhbm9kZS50ZW1wb0VsZW1lbnQuY29kZWJhc2VJZD8uc3RhcnRzV2l0aCgndGVtcG8tJykgfHxcbiAgICAgIGluQ29tcG9uZW50U3Rvcnlib2FyZEFuZFNraXBcbiAgICApIHtcbiAgICAgIGlmIChub2RlLnBhcmVudCkge1xuICAgICAgICAvLyBNb3ZlIHRoZSBjaGlsZHJlbiBpbiB0aGUgc3BvdCB3aGVyZSB0aGUgbm9kZSB3YXNcbiAgICAgICAgY29uc3QgY2hpbGRyZW5Ub01vdmUgPSBub2RlLmNoaWxkcmVuO1xuICAgICAgICBjb25zdCBpbmRleE9mTm9kZUluUGFyZW50ID0gbm9kZS5wYXJlbnQuY2hpbGRyZW4/LmluZGV4T2Yobm9kZSk7XG5cbiAgICAgICAgbm9kZS5wYXJlbnQuY2hpbGRyZW4uc3BsaWNlKGluZGV4T2ZOb2RlSW5QYXJlbnQsIDEsIC4uLmNoaWxkcmVuVG9Nb3ZlKTtcblxuICAgICAgICAvLyBDaGFuZ2UgdGhlIHBhcmVudCBvZiBhbGwgdGhlIGNoaWxkcmVuIHRvIHRoZSBuZXcgcGFyZW50XG4gICAgICAgIGNoaWxkcmVuVG9Nb3ZlLmZvckVhY2goKGNoaWxkKSA9PiB7XG4gICAgICAgICAgY2hpbGQucGFyZW50ID0gbm9kZS5wYXJlbnQ7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgbm9kZSBmcm9tIHRoZSBrbm93biBub2Rlc1xuICAgICAgICBkZWxldGUgZWxlbWVudEtleVRvTmF2Tm9kZVtub2RlLnRlbXBvRWxlbWVudC5nZXRLZXkoKV07XG4gICAgICB9IGVsc2UgaWYgKG5vZGUuY2hpbGRyZW4ubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgdGhlIHRvcC1sZXZlbCBub2RlLCBtb3ZlIGl0IGRvd25cbiAgICAgICAgdHJlZVRvUmV0dXJuID0gbm9kZS5jaGlsZHJlblswXTtcbiAgICAgICAgZGVsZXRlIGVsZW1lbnRLZXlUb05hdk5vZGVbbm9kZS50ZW1wb0VsZW1lbnQuZ2V0S2V5KCldO1xuXG4gICAgICAgIHRyZWVUb1JldHVybi5wYXJlbnQgPSB1bmRlZmluZWQ7XG4gICAgICB9IGVsc2UgaWYgKG5vZGUuY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIC8vIDAgY2hpbGRyZW4sIG5vIG5hdiB0cmVlIHRvIHJldHVyblxuICAgICAgICB0cmVlVG9SZXR1cm4gPSB7XG4gICAgICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgICAgIHRlbXBvRWxlbWVudDogbmV3IFRlbXBvRWxlbWVudChcbiAgICAgICAgICAgIEVNUFRZX1RSRUVfQ09ERUJBU0VfSUQsXG4gICAgICAgICAgICBzdG9yeWJvYXJkSWQsXG4gICAgICAgICAgICAnMScsXG4gICAgICAgICAgKSxcbiAgICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgfTtcbiAgICAgICAgZGVsZXRlIGVsZW1lbnRLZXlUb05hdk5vZGVbbm9kZS50ZW1wb0VsZW1lbnQuZ2V0S2V5KCldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gMisgY2hpbGRyZW4sIHJldHVybiB0aGlzIG5vZGUsIGJ1dCBtYWtlIHRoZSBjb2RlYmFzZSBJRCBvbmUgdG8gc2tpcFxuICAgICAgICBub2RlLnRlbXBvRWxlbWVudCA9IG5ldyBUZW1wb0VsZW1lbnQoXG4gICAgICAgICAgU0tJUF9ST09UX0NPREVCQVNFX0lELFxuICAgICAgICAgIG5vZGUudGVtcG9FbGVtZW50LnN0b3J5Ym9hcmRJZCxcbiAgICAgICAgICBub2RlLnRlbXBvRWxlbWVudC51bmlxdWVQYXRoLFxuICAgICAgICApO1xuICAgICAgICBkZWxldGUgZWxlbWVudEtleVRvTmF2Tm9kZVtub2RlLnRlbXBvRWxlbWVudC5nZXRLZXkoKV07XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHByb2Nlc3NOb2RlKGZpbmlzaGVkTmF2VHJlZSwgZmFsc2UpO1xuXG4gIGNvbnN0IHBvc3RQcm9jZXNzID0gKG5vZGU6IE5hdlRyZWVOb2RlLCBsZXZlbDogbnVtYmVyKSA9PiB7XG4gICAgLy8gUmVtb3ZlIHRoZSByZWFjdCBmaWJlciBub2RlIGFmdGVyIHByb2Nlc3NpbmdcbiAgICBkZWxldGUgbm9kZVsncmVhY3RGaWJlck5vZGUnXTtcblxuICAgIG5vZGUubGV2ZWwgPSBsZXZlbDtcbiAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB7XG4gICAgICBwb3N0UHJvY2VzcyhcbiAgICAgICAgY2hpbGQsXG4gICAgICAgIG5vZGUudGVtcG9FbGVtZW50LmNvZGViYXNlSWQgPT09IFNLSVBfUk9PVF9DT0RFQkFTRV9JRFxuICAgICAgICAgID8gbGV2ZWxcbiAgICAgICAgICA6IGxldmVsICsgMSxcbiAgICAgICk7XG4gICAgfSk7XG4gIH07XG5cbiAgcG9zdFByb2Nlc3ModHJlZVRvUmV0dXJuLCAwKTtcbiAgcmV0dXJuIHRyZWVUb1JldHVybjtcbn07XG5cbmludGVyZmFjZSBDYWxsYmFja09wdGlvbnMge1xuICBjYWxsYmFja0ZuOiBGdW5jdGlvbjtcbiAgc3RhdGU6IHtcbiAgICBzZWxlY3RlZEVsZW1lbnRLZXk6IHN0cmluZztcbiAgICBtdWx0aVNlbGVjdGVkRWxlbWVudEtleXM6IHN0cmluZ1tdO1xuICB9O1xufVxuXG5leHBvcnQgY29uc3QgYWRkTmF2VHJlZUJ1aWx0Q2FsbGJhY2sgPSAoXG4gIGNhbGxiYWNrVG9BZGQ6IENhbGxiYWNrT3B0aW9ucyxcbik6IHZvaWQgPT4ge1xuICBjb25zdCB7IGNhbGxiYWNrRm4sIHN0YXRlIH0gPSBjYWxsYmFja1RvQWRkO1xuICBjb25zdCBjYWxsYmFja3M6IENhbGxiYWNrT3B0aW9uc1tdID1cbiAgICBnZXRNZW1vcnlTdG9yYWdlSXRlbShOQVZfVFJFRV9DQUxMQkFDS1MpIHx8IFtdO1xuXG4gIC8vIFNvcnQgdGhlIG11bHRpU2VsZWN0ZWRFbGVtZW50S2V5cyBmb3IgY29uc2lzdGVuY3kgYmVmb3JlIGFkZGluZ1xuICBzdGF0ZS5tdWx0aVNlbGVjdGVkRWxlbWVudEtleXMgPSAoXG4gICAgc3RhdGUubXVsdGlTZWxlY3RlZEVsZW1lbnRLZXlzIHx8IFtdXG4gICkuc29ydCgpO1xuXG4gIGNvbnN0IGV4aXN0aW5nQ2FsbGJhY2sgPSBjYWxsYmFja3MuZmluZChcbiAgICAoY2FsbGJhY2spID0+XG4gICAgICBjYWxsYmFjay5jYWxsYmFja0ZuLnRvU3RyaW5nKCkgPT09IGNhbGxiYWNrRm4udG9TdHJpbmcoKSAmJlxuICAgICAgY2FsbGJhY2suc3RhdGUuc2VsZWN0ZWRFbGVtZW50S2V5ID09PSBzdGF0ZS5zZWxlY3RlZEVsZW1lbnRLZXkgJiZcbiAgICAgIGNhbGxiYWNrLnN0YXRlLm11bHRpU2VsZWN0ZWRFbGVtZW50S2V5cy5qb2luKCcsJykgPT09XG4gICAgICAgIHN0YXRlLm11bHRpU2VsZWN0ZWRFbGVtZW50S2V5cy5qb2luKCcsJyksXG4gICk7XG5cbiAgaWYgKGV4aXN0aW5nQ2FsbGJhY2spIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjYWxsYmFja3MucHVzaChjYWxsYmFja1RvQWRkKTtcbiAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oTkFWX1RSRUVfQ0FMTEJBQ0tTLCBjYWxsYmFja3MpO1xufTtcblxuZXhwb3J0IGNvbnN0IHJ1bk5hdlRyZWVCdWlsdENhbGxiYWNrcyA9ICgpOiB2b2lkID0+IHtcbiAgY29uc3QgY2FsbGJhY2tzOiBDYWxsYmFja09wdGlvbnNbXSA9XG4gICAgZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oTkFWX1RSRUVfQ0FMTEJBQ0tTKSB8fCBbXTtcblxuICBpZiAoIWNhbGxiYWNrcy5sZW5ndGgpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBjdXJyZW50U2VsZWN0ZWRLZXkgPSBnZXRNZW1vcnlTdG9yYWdlSXRlbShTRUxFQ1RFRF9FTEVNRU5UX0tFWSk7XG4gIGNvbnN0IG11bHRpU2VsZWN0ZWRFbGVtZW50S2V5cyA9IChcbiAgICBnZXRNZW1vcnlTdG9yYWdlSXRlbShNVUxUSV9TRUxFQ1RFRF9FTEVNRU5UX0tFWVMpIHx8IFtdXG4gICkuc29ydCgpO1xuXG4gIGNhbGxiYWNrcy5mb3JFYWNoKChjYWxsYmFjaykgPT4ge1xuICAgIGNvbnN0IHsgY2FsbGJhY2tGbiwgc3RhdGUgfSA9IGNhbGxiYWNrO1xuXG4gICAgaWYgKFxuICAgICAgc3RhdGUuc2VsZWN0ZWRFbGVtZW50S2V5ID09PSBjdXJyZW50U2VsZWN0ZWRLZXkgJiZcbiAgICAgIHN0YXRlLm11bHRpU2VsZWN0ZWRFbGVtZW50S2V5cy5qb2luKCcsJykgPT09XG4gICAgICAgIG11bHRpU2VsZWN0ZWRFbGVtZW50S2V5cy5qb2luKCcsJylcbiAgICApIHtcbiAgICAgIGNhbGxiYWNrRm4oKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJlbW92ZU1lbW9yeVN0b3JhZ2VJdGVtKE5BVl9UUkVFX0NBTExCQUNLUyk7XG59O1xuIl19