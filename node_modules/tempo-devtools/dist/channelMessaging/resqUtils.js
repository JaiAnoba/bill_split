"use strict";
// Code taken and adapted from the resq library: https://github.com/baruchvlz/resq
Object.defineProperty(exports, "__esModule", { value: true });
exports.findElementInTree = exports.getElementName = exports.clearLookupsFromTree = exports.buildTreeLookupMap = exports.removeUniqueLoookupFromReactTreeNode = exports.addUniqueLoookupToReactTreeNode = exports.getUniqueLoookupFromReactTreeNode = exports.getDomElementForReactNode = exports.buildNodeTree = exports.getRootReactElement = exports.findReactInstance = void 0;
const identifierUtils_1 = require("./identifierUtils");
const uuid_1 = require("uuid");
/**
 * Taken from https://github.com/baruchvlz/resq/blob/master/src/utils.js
 * but improved to work with all versions of react
 */
const findReactInstance = (element) => {
    if (element.hasOwnProperty('_reactRootContainer')) {
        if (element._reactRootContainer._internalRoot) {
            return element._reactRootContainer._internalRoot.current;
        }
        else {
            return element._reactRootContainer.current;
        }
    }
    const instanceId = Object.keys(element).find((key) => key.startsWith('__reactInternalInstance') ||
        key.startsWith('__reactFiber') ||
        key.startsWith('__reactContainer'));
    if (instanceId) {
        return element[instanceId];
    }
};
exports.findReactInstance = findReactInstance;
//Returns true if it is a DOM element
function isElement(o) {
    return typeof HTMLElement === 'object'
        ? o instanceof HTMLElement //DOM2
        : o &&
            typeof o === 'object' &&
            o !== null &&
            o.nodeType === 1 &&
            typeof o.nodeName === 'string';
}
const getRootReactElement = () => {
    var _a;
    let rootSelector = '#root';
    if (!document.querySelector(rootSelector)) {
        rootSelector = '#__next';
    }
    const root = document.querySelector(rootSelector);
    let findInstance = null;
    if (root) {
        findInstance = (0, exports.findReactInstance)(root);
    }
    else {
        // hacky fallback; if there's no root element so we grab the first one recursively
        function findInstanceInNode(node) {
            var _a;
            if (findInstance) {
                return;
            }
            findInstance = (0, exports.findReactInstance)(node);
            if (findInstance) {
                return;
            }
            (_a = node.childNodes) === null || _a === void 0 ? void 0 : _a.forEach((childNode) => {
                findInstanceInNode(childNode);
            });
        }
        findInstanceInNode(document.getElementsByTagName('body')[0]);
    }
    // June 12 2024 fix:
    // Sometimes the react tree only loads correctly in the "alternate slot"
    // Replace the current tree with the alternate tree if that is the case
    if (findInstance && !findInstance.child && ((_a = findInstance.alternate) === null || _a === void 0 ? void 0 : _a.child)) {
        findInstance = findInstance.alternate;
    }
    return findInstance;
};
exports.getRootReactElement = getRootReactElement;
const removeChildrenFromProps = (props) => {
    // if the props is a string, we can assume that it's just the text inside a html element
    if (!props || typeof props === 'string') {
        return props;
    }
    const returnProps = Object.assign({}, props);
    delete returnProps.children;
    return returnProps;
};
const getElementState = (elementState) => {
    if (!elementState) {
        return undefined;
    }
    const { baseState } = elementState;
    if (baseState) {
        return baseState;
    }
    return elementState;
};
const buildNodeTree = (element, parentTreeNode) => {
    var _a, _b;
    let tree = { children: [] };
    tree.element = element;
    tree.parent = parentTreeNode;
    if (!element) {
        return tree;
    }
    tree.name = (0, exports.getElementName)(element.type);
    if (typeof tree.name !== 'string') {
        tree.name = (_b = (_a = tree.name) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
    tree.props = removeChildrenFromProps(element.memoizedProps);
    tree.state = getElementState(element.memoizedState);
    let { child } = element;
    if (child) {
        tree.children.push(child);
        while (child.sibling) {
            tree.children.push(child.sibling);
            child = child.sibling;
        }
    }
    tree.children = tree.children.map((child) => (0, exports.buildNodeTree)(child, tree));
    return tree;
};
exports.buildNodeTree = buildNodeTree;
const getDomElementForReactNode = (node) => {
    var _a, _b;
    let stateNode = (_a = node === null || node === void 0 ? void 0 : node.element) === null || _a === void 0 ? void 0 : _a.stateNode;
    if (stateNode && ((_b = stateNode === null || stateNode === void 0 ? void 0 : stateNode.constructor) === null || _b === void 0 ? void 0 : _b.name) === 'FiberRootNode') {
        stateNode = stateNode.containerInfo;
    }
    if (isElement(stateNode)) {
        return stateNode;
    }
    return null;
};
exports.getDomElementForReactNode = getDomElementForReactNode;
const getUniqueLoookupFromReactTreeNode = (node) => {
    const stateNode = (0, exports.getDomElementForReactNode)(node);
    if (stateNode) {
        return (0, identifierUtils_1.getUniqueLookupFromNode)(stateNode);
    }
    return null;
};
exports.getUniqueLoookupFromReactTreeNode = getUniqueLoookupFromReactTreeNode;
const addUniqueLoookupToReactTreeNode = (node, uniqueLookup) => {
    const stateNode = (0, exports.getDomElementForReactNode)(node);
    if (stateNode) {
        (0, identifierUtils_1.addUniqueLookupAsClass)(stateNode, uniqueLookup);
        return true;
    }
    return false;
};
exports.addUniqueLoookupToReactTreeNode = addUniqueLoookupToReactTreeNode;
const removeUniqueLoookupFromReactTreeNode = (node) => {
    const stateNode = (0, exports.getDomElementForReactNode)(node);
    if (stateNode) {
        (0, identifierUtils_1.removeUniqueLookupFromNode)(stateNode);
        return true;
    }
    return false;
};
exports.removeUniqueLoookupFromReactTreeNode = removeUniqueLoookupFromReactTreeNode;
/**
 * Builds a lookup map with generated uuids that are added to the HTML elements under the hood as classes.
 * Make sure to clear the lookups from the tree after you are done with it.
 * @param tree
 * @param map
 */
const buildTreeLookupMap = (tree, map) => {
    const newUniqueLookup = (0, uuid_1.v4)();
    const added = (0, exports.addUniqueLoookupToReactTreeNode)(tree, newUniqueLookup);
    if (added) {
        map[newUniqueLookup] = tree;
    }
    tree.children.forEach((child) => {
        (0, exports.buildTreeLookupMap)(child, map);
    });
};
exports.buildTreeLookupMap = buildTreeLookupMap;
/**
 * Build tree lookup map adds a class name for lookups, we want to remove these after the tree is built
 * @param tree
 */
const clearLookupsFromTree = (tree) => {
    (0, exports.removeUniqueLoookupFromReactTreeNode)(tree);
    tree.children.forEach((child) => {
        (0, exports.clearLookupsFromTree)(child);
    });
};
exports.clearLookupsFromTree = clearLookupsFromTree;
const isFunction = (type) => {
    return typeof type === 'function';
};
const isObject = (type) => {
    return typeof type === 'object';
};
const getElementName = (type) => {
    var _a;
    if (!type) {
        return type;
    }
    if (isFunction(type) || isObject(type)) {
        if (type.displayName) {
            if (isFunction(type.displayName)) {
                return type.displayName();
            }
            else {
                return type.displayName;
            }
        }
        if (type.name) {
            if (isFunction(type.name)) {
                return type.name();
            }
            else {
                return type.name;
            }
        }
        if ((_a = type.render) === null || _a === void 0 ? void 0 : _a.name) {
            return type.render.name;
        }
        return null;
    }
    return type;
};
exports.getElementName = getElementName;
/**
 * @param tree
 * @param searchFn
 * @param firstOnly if set, returns only the first element in a breadth-firth search
 * @returns
 */
const findElementInTree = (tree, searchFn, firstOnly) => {
    let searchQueue = [tree];
    const foundNodes = [];
    while (searchQueue.length > 0) {
        const node = searchQueue.shift();
        if (searchFn(node)) {
            foundNodes.push(node);
            if (firstOnly) {
                break;
            }
        }
        searchQueue = searchQueue.concat(node.children || []);
    }
    return foundNodes;
};
exports.findElementInTree = findElementInTree;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzcVV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NoYW5uZWxNZXNzYWdpbmcvcmVzcVV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrRkFBa0Y7OztBQUVsRix1REFJMkI7QUFDM0IsK0JBQW9DO0FBRXBDOzs7R0FHRztBQUNJLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxPQUFZLEVBQU8sRUFBRTtJQUNyRCxJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMscUJBQXFCLENBQUMsRUFBRTtRQUNqRCxJQUFJLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxhQUFhLEVBQUU7WUFDN0MsT0FBTyxPQUFPLENBQUMsbUJBQW1CLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQztTQUMxRDthQUFNO1lBQ0wsT0FBTyxPQUFPLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDO1NBQzVDO0tBQ0Y7SUFFRCxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FDMUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUNOLEdBQUcsQ0FBQyxVQUFVLENBQUMseUJBQXlCLENBQUM7UUFDekMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUM7UUFDOUIsR0FBRyxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUNyQyxDQUFDO0lBRUYsSUFBSSxVQUFVLEVBQUU7UUFDZCxPQUFPLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUM1QjtBQUNILENBQUMsQ0FBQztBQW5CVyxRQUFBLGlCQUFpQixxQkFtQjVCO0FBRUYscUNBQXFDO0FBQ3JDLFNBQVMsU0FBUyxDQUFDLENBQU07SUFDdkIsT0FBTyxPQUFPLFdBQVcsS0FBSyxRQUFRO1FBQ3BDLENBQUMsQ0FBQyxDQUFDLFlBQVksV0FBVyxDQUFDLE1BQU07UUFDakMsQ0FBQyxDQUFDLENBQUM7WUFDQyxPQUFPLENBQUMsS0FBSyxRQUFRO1lB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VyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUMsQ0FBQztLQUN2RDtJQUVELE9BQU8sVUFBVSxDQUFDO0FBQ3BCLENBQUMsQ0FBQztBQXRCVyxRQUFBLGlCQUFpQixxQkFzQjVCIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29kZSB0YWtlbiBhbmQgYWRhcHRlZCBmcm9tIHRoZSByZXNxIGxpYnJhcnk6IGh0dHBzOi8vZ2l0aHViLmNvbS9iYXJ1Y2h2bHovcmVzcVxuXG5pbXBvcnQge1xuICBhZGRVbmlxdWVMb29rdXBBc0NsYXNzLFxuICBnZXRVbmlxdWVMb29rdXBGcm9tTm9kZSxcbiAgcmVtb3ZlVW5pcXVlTG9va3VwRnJvbU5vZGUsXG59IGZyb20gJy4vaWRlbnRpZmllclV0aWxzJztcbmltcG9ydCB7IHY0IGFzIHV1aWR2NCB9IGZyb20gJ3V1aWQnO1xuXG4vKipcbiAqIFRha2VuIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2JhcnVjaHZsei9yZXNxL2Jsb2IvbWFzdGVyL3NyYy91dGlscy5qc1xuICogYnV0IGltcHJvdmVkIHRvIHdvcmsgd2l0aCBhbGwgdmVyc2lvbnMgb2YgcmVhY3RcbiAqL1xuZXhwb3J0IGNvbnN0IGZpbmRSZWFjdEluc3RhbmNlID0gKGVsZW1lbnQ6IGFueSk6IGFueSA9PiB7XG4gIGlmIChlbGVtZW50Lmhhc093blByb3BlcnR5KCdfcmVhY3RSb290Q29udGFpbmVyJykpIHtcbiAgICBpZiAoZWxlbWVudC5fcmVhY3RSb290Q29udGFpbmVyLl9pbnRlcm5hbFJvb3QpIHtcbiAgICAgIHJldHVybiBlbGVtZW50Ll9yZWFjdFJvb3RDb250YWluZXIuX2ludGVybmFsUm9vdC5jdXJyZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZWxlbWVudC5fcmVhY3RSb290Q29udGFpbmVyLmN1cnJlbnQ7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgaW5zdGFuY2VJZCA9IE9iamVjdC5rZXlzKGVsZW1lbnQpLmZpbmQoXG4gICAgKGtleSkgPT5cbiAgICAgIGtleS5zdGFydHNXaXRoKCdfX3JlYWN0SW50ZXJuYWxJbnN0YW5jZScpIHx8XG4gICAgICBrZXkuc3RhcnRzV2l0aCgnX19yZWFjdEZpYmVyJykgfHxcbiAgICAgIGtleS5zdGFydHNXaXRoKCdfX3JlYWN0Q29udGFpbmVyJyksXG4gICk7XG5cbiAgaWYgKGluc3RhbmNlSWQpIHtcbiAgICByZXR1cm4gZWxlbWVudFtpbnN0YW5jZUlkXTtcbiAgfVxufTtcblxuLy9SZXR1cm5zIHRydWUgaWYgaXQgaXMgYSBET00gZWxlbWVudFxuZnVuY3Rpb24gaXNFbGVtZW50KG86IGFueSkge1xuICByZXR1cm4gdHlwZW9mIEhUTUxFbGVtZW50ID09PSAnb2JqZWN0J1xuICAgID8gbyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50IC8vRE9NMlxuICAgIDogbyAmJlxuICAgICAgICB0eXBlb2YgbyA9PT0gJ29iamVjdCcgJiZcbiAgICAgICAgbyAhPT0gbnVsbCAmJlxuICAgICAgICBvLm5vZGVUeXBlID09PSAxICYmXG4gICAgICAgIHR5cGVvZiBvLm5vZGVOYW1lID09PSAnc3RyaW5nJztcbn1cblxuZXhwb3J0IGNvbnN0IGdldFJvb3RSZWFjdEVsZW1lbnQgPSAoKTogYW55ID0+IHtcbiAgbGV0IHJvb3RTZWxlY3RvciA9ICcjcm9vdCc7XG4gIGlmICghZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihyb290U2VsZWN0b3IpKSB7XG4gICAgcm9vdFNlbGVjdG9yID0gJyNfX25leHQnO1xuICB9XG5cbiAgY29uc3Qgcm9vdDogYW55ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihyb290U2VsZWN0b3IpO1xuXG4gIGxldCBmaW5kSW5zdGFuY2U6IGFueSA9IG51bGw7XG4gIGlmIChyb290KSB7XG4gICAgZmluZEluc3RhbmNlID0gZmluZFJlYWN0SW5zdGFuY2Uocm9vdCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gaGFja3kgZmFsbGJhY2s7IGlmIHRoZXJlJ3Mgbm8gcm9vdCBlbGVtZW50IHNvIHdlIGdyYWIgdGhlIGZpcnN0IG9uZSByZWN1cnNpdmVseVxuICAgIGZ1bmN0aW9uIGZpbmRJbnN0YW5jZUluTm9kZShub2RlOiBhbnkpIHtcbiAgICAgIGlmIChmaW5kSW5zdGFuY2UpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBmaW5kSW5zdGFuY2UgPSBmaW5kUmVhY3RJbnN0YW5jZShub2RlKTtcbiAgICAgIGlmIChmaW5kSW5zdGFuY2UpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBub2RlLmNoaWxkTm9kZXM/LmZvckVhY2goKGNoaWxkTm9kZTogYW55KSA9PiB7XG4gICAgICAgIGZpbmRJbnN0YW5jZUluTm9kZShjaGlsZE5vZGUpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZmluZEluc3RhbmNlSW5Ob2RlKGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF0pO1xuICB9XG5cbiAgLy8gSnVuZSAxMiAyMDI0IGZpeDpcbiAgLy8gU29tZXRpbWVzIHRoZSByZWFjdCB0cmVlIG9ubHkgbG9hZHMgY29ycmVjdGx5IGluIHRoZSBcImFsdGVybmF0ZSBzbG90XCJcbiAgLy8gUmVwbGFjZSB0aGUgY3VycmVudCB0cmVlIHdpdGggdGhlIGFsdGVybmF0ZSB0cmVlIGlmIHRoYXQgaXMgdGhlIGNhc2VcbiAgaWYgKGZpbmRJbnN0YW5jZSAmJiAhZmluZEluc3RhbmNlLmNoaWxkICYmIGZpbmRJbnN0YW5jZS5hbHRlcm5hdGU/LmNoaWxkKSB7XG4gICAgZmluZEluc3RhbmNlID0gZmluZEluc3RhbmNlLmFsdGVybmF0ZTtcbiAgfVxuXG4gIHJldHVybiBmaW5kSW5zdGFuY2U7XG59O1xuXG5jb25zdCByZW1vdmVDaGlsZHJlbkZyb21Qcm9wcyA9IChwcm9wczogYW55KSA9PiB7XG4gIC8vIGlmIHRoZSBwcm9wcyBpcyBhIHN0cmluZywgd2UgY2FuIGFzc3VtZSB0aGF0IGl0J3MganVzdCB0aGUgdGV4dCBpbnNpZGUgYSBodG1sIGVsZW1lbnRcbiAgaWYgKCFwcm9wcyB8fCB0eXBlb2YgcHJvcHMgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHByb3BzO1xuICB9XG5cbiAgY29uc3QgcmV0dXJuUHJvcHMgPSB7IC4uLnByb3BzIH07XG5cbiAgZGVsZXRlIHJldHVyblByb3BzLmNoaWxkcmVuO1xuXG4gIHJldHVybiByZXR1cm5Qcm9wcztcbn07XG5cbmNvbnN0IGdldEVsZW1lbnRTdGF0ZSA9IChlbGVtZW50U3RhdGU6IGFueSkgPT4ge1xuICBpZiAoIWVsZW1lbnRTdGF0ZSkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCB7IGJhc2VTdGF0ZSB9ID0gZWxlbWVudFN0YXRlO1xuXG4gIGlmIChiYXNlU3RhdGUpIHtcbiAgICByZXR1cm4gYmFzZVN0YXRlO1xuICB9XG5cbiAgcmV0dXJuIGVsZW1lbnRTdGF0ZTtcbn07XG5cbmV4cG9ydCBjb25zdCBidWlsZE5vZGVUcmVlID0gKGVsZW1lbnQ6IGFueSwgcGFyZW50VHJlZU5vZGU6IGFueSk6IGFueSA9PiB7XG4gIGxldCB0cmVlOiBhbnkgPSB7IGNoaWxkcmVuOiBbXSB9O1xuXG4gIHRyZWUuZWxlbWVudCA9IGVsZW1lbnQ7XG4gIHRyZWUucGFyZW50ID0gcGFyZW50VHJlZU5vZGU7XG5cbiAgaWYgKCFlbGVtZW50KSB7XG4gICAgcmV0dXJuIHRyZWU7XG4gIH1cblxuICB0cmVlLm5hbWUgPSBnZXRFbGVtZW50TmFtZShlbGVtZW50LnR5cGUpO1xuICBpZiAodHlwZW9mIHRyZWUubmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICB0cmVlLm5hbWUgPSB0cmVlLm5hbWU/LnRvU3RyaW5nPy4oKTtcbiAgfVxuXG4gIHRyZWUucHJvcHMgPSByZW1vdmVDaGlsZHJlbkZyb21Qcm9wcyhlbGVtZW50Lm1lbW9pemVkUHJvcHMpO1xuICB0cmVlLnN0YXRlID0gZ2V0RWxlbWVudFN0YXRlKGVsZW1lbnQubWVtb2l6ZWRTdGF0ZSk7XG5cbiAgbGV0IHsgY2hpbGQgfSA9IGVsZW1lbnQ7XG5cbiAgaWYgKGNoaWxkKSB7XG4gICAgdHJlZS5jaGlsZHJlbi5wdXNoKGNoaWxkKTtcblxuICAgIHdoaWxlIChjaGlsZC5zaWJsaW5nKSB7XG4gICAgICB0cmVlLmNoaWxkcmVuLnB1c2goY2hpbGQuc2libGluZyk7XG4gICAgICBjaGlsZCA9IGNoaWxkLnNpYmxpbmc7XG4gICAgfVxuICB9XG5cbiAgdHJlZS5jaGlsZHJlbiA9IHRyZWUuY2hpbGRyZW4ubWFwKChjaGlsZDogYW55KSA9PiBidWlsZE5vZGVUcmVlKGNoaWxkLCB0cmVlKSk7XG5cbiAgcmV0dXJuIHRyZWU7XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0RG9tRWxlbWVudEZvclJlYWN0Tm9kZSA9IChub2RlOiBhbnkpID0+IHtcbiAgbGV0IHN0YXRlTm9kZSA9IG5vZGU/LmVsZW1lbnQ/LnN0YXRlTm9kZTtcbiAgaWYgKHN0YXRlTm9kZSAmJiBzdGF0ZU5vZGU/LmNvbnN0cnVjdG9yPy5uYW1lID09PSAnRmliZXJSb290Tm9kZScpIHtcbiAgICBzdGF0ZU5vZGUgPSBzdGF0ZU5vZGUuY29udGFpbmVySW5mbztcbiAgfVxuXG4gIGlmIChpc0VsZW1lbnQoc3RhdGVOb2RlKSkge1xuICAgIHJldHVybiBzdGF0ZU5vZGU7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn07XG5cbmV4cG9ydCBjb25zdCBnZXRVbmlxdWVMb29va3VwRnJvbVJlYWN0VHJlZU5vZGUgPSAobm9kZTogYW55KSA9PiB7XG4gIGNvbnN0IHN0YXRlTm9kZSA9IGdldERvbUVsZW1lbnRGb3JSZWFjdE5vZGUobm9kZSk7XG5cbiAgaWYgKHN0YXRlTm9kZSkge1xuICAgIHJldHVybiBnZXRVbmlxdWVMb29rdXBGcm9tTm9kZShzdGF0ZU5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5leHBvcnQgY29uc3QgYWRkVW5pcXVlTG9vb2t1cFRvUmVhY3RUcmVlTm9kZSA9IChcbiAgbm9kZTogYW55LFxuICB1bmlxdWVMb29rdXA6IHN0cmluZyxcbikgPT4ge1xuICBjb25zdCBzdGF0ZU5vZGUgPSBnZXREb21FbGVtZW50Rm9yUmVhY3ROb2RlKG5vZGUpO1xuXG4gIGlmIChzdGF0ZU5vZGUpIHtcbiAgICBhZGRVbmlxdWVMb29rdXBBc0NsYXNzKHN0YXRlTm9kZSwgdW5pcXVlTG9va3VwKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn07XG5cbmV4cG9ydCBjb25zdCByZW1vdmVVbmlxdWVMb29va3VwRnJvbVJlYWN0VHJlZU5vZGUgPSAobm9kZTogYW55KSA9PiB7XG4gIGNvbnN0IHN0YXRlTm9kZSA9IGdldERvbUVsZW1lbnRGb3JSZWFjdE5vZGUobm9kZSk7XG5cbiAgaWYgKHN0YXRlTm9kZSkge1xuICAgIHJlbW92ZVVuaXF1ZUxvb2t1cEZyb21Ob2RlKHN0YXRlTm9kZSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIEJ1aWxkcyBhIGxvb2t1cCBtYXAgd2l0aCBnZW5lcmF0ZWQgdXVpZHMgdGhhdCBhcmUgYWRkZWQgdG8gdGhlIEhUTUwgZWxlbWVudHMgdW5kZXIgdGhlIGhvb2QgYXMgY2xhc3Nlcy5cbiAqIE1ha2Ugc3VyZSB0byBjbGVhciB0aGUgbG9va3VwcyBmcm9tIHRoZSB0cmVlIGFmdGVyIHlvdSBhcmUgZG9uZSB3aXRoIGl0LlxuICogQHBhcmFtIHRyZWVcbiAqIEBwYXJhbSBtYXBcbiAqL1xuZXhwb3J0IGNvbnN0IGJ1aWxkVHJlZUxvb2t1cE1hcCA9ICh0cmVlOiBhbnksIG1hcDogeyBba2V5OiBzdHJpbmddOiBhbnkgfSkgPT4ge1xuICBjb25zdCBuZXdVbmlxdWVMb29rdXAgPSB1dWlkdjQoKTtcblxuICBjb25zdCBhZGRlZCA9IGFkZFVuaXF1ZUxvb29rdXBUb1JlYWN0VHJlZU5vZGUodHJlZSwgbmV3VW5pcXVlTG9va3VwKTtcbiAgaWYgKGFkZGVkKSB7XG4gICAgbWFwW25ld1VuaXF1ZUxvb2t1cF0gPSB0cmVlO1xuICB9XG5cbiAgdHJlZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZDogYW55KSA9PiB7XG4gICAgYnVpbGRUcmVlTG9va3VwTWFwKGNoaWxkLCBtYXApO1xuICB9KTtcbn07XG5cbi8qKlxuICogQnVpbGQgdHJlZSBsb29rdXAgbWFwIGFkZHMgYSBjbGFzcyBuYW1lIGZvciBsb29rdXBzLCB3ZSB3YW50IHRvIHJlbW92ZSB0aGVzZSBhZnRlciB0aGUgdHJlZSBpcyBidWlsdFxuICogQHBhcmFtIHRyZWVcbiAqL1xuZXhwb3J0IGNvbnN0IGNsZWFyTG9va3Vwc0Zyb21UcmVlID0gKHRyZWU6IGFueSkgPT4ge1xuICByZW1vdmVVbmlxdWVMb29va3VwRnJvbVJlYWN0VHJlZU5vZGUodHJlZSk7XG5cbiAgdHJlZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZDogYW55KSA9PiB7XG4gICAgY2xlYXJMb29rdXBzRnJvbVRyZWUoY2hpbGQpO1xuICB9KTtcbn07XG5cbmNvbnN0IGlzRnVuY3Rpb24gPSAodHlwZTogYW55KSA9PiB7XG4gIHJldHVybiB0eXBlb2YgdHlwZSA9PT0gJ2Z1bmN0aW9uJztcbn07XG5cbmNvbnN0IGlzT2JqZWN0ID0gKHR5cGU6IGFueSkgPT4ge1xuICByZXR1cm4gdHlwZW9mIHR5cGUgPT09ICdvYmplY3QnO1xufTtcblxuZXhwb3J0IGNvbnN0IGdldEVsZW1lbnROYW1lID0gKHR5cGU6IGFueSkgPT4ge1xuICBpZiAoIXR5cGUpIHtcbiAgICByZXR1cm4gdHlwZTtcbiAgfVxuXG4gIGlmIChpc0Z1bmN0aW9uKHR5cGUpIHx8IGlzT2JqZWN0KHR5cGUpKSB7XG4gICAgaWYgKHR5cGUuZGlzcGxheU5hbWUpIHtcbiAgICAgIGlmIChpc0Z1bmN0aW9uKHR5cGUuZGlzcGxheU5hbWUpKSB7XG4gICAgICAgIHJldHVybiB0eXBlLmRpc3BsYXlOYW1lKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdHlwZS5kaXNwbGF5TmFtZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZS5uYW1lKSB7XG4gICAgICBpZiAoaXNGdW5jdGlvbih0eXBlLm5hbWUpKSB7XG4gICAgICAgIHJldHVybiB0eXBlLm5hbWUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0eXBlLm5hbWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGUucmVuZGVyPy5uYW1lKSB7XG4gICAgICByZXR1cm4gdHlwZS5yZW5kZXIubmFtZTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB0eXBlO1xufTtcblxuLyoqXG4gKiBAcGFyYW0gdHJlZVxuICogQHBhcmFtIHNlYXJjaEZuXG4gKiBAcGFyYW0gZmlyc3RPbmx5IGlmIHNldCwgcmV0dXJucyBvbmx5IHRoZSBmaXJzdCBlbGVtZW50IGluIGEgYnJlYWR0aC1maXJ0aCBzZWFyY2hcbiAqIEByZXR1cm5zXG4gKi9cbmV4cG9ydCBjb25zdCBmaW5kRWxlbWVudEluVHJlZSA9IChcbiAgdHJlZTogYW55LFxuICBzZWFyY2hGbjogKG5vZGU6IGFueSkgPT4gYm9vbGVhbixcbiAgZmlyc3RPbmx5PzogYm9vbGVhbixcbikgPT4ge1xuICBsZXQgc2VhcmNoUXVldWUgPSBbdHJlZV07XG4gIGNvbnN0IGZvdW5kTm9kZXMgPSBbXTtcbiAgd2hpbGUgKHNlYXJjaFF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBub2RlID0gc2VhcmNoUXVldWUuc2hpZnQoKTtcblxuICAgIGlmIChzZWFyY2hGbihub2RlKSkge1xuICAgICAgZm91bmROb2Rlcy5wdXNoKG5vZGUpO1xuXG4gICAgICBpZiAoZmlyc3RPbmx5KSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHNlYXJjaFF1ZXVlID0gc2VhcmNoUXVldWUuY29uY2F0KG5vZGUuY2hpbGRyZW4gfHwgW10pO1xuICB9XG5cbiAgcmV0dXJuIGZvdW5kTm9kZXM7XG59O1xuIl19