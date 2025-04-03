"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.teardownEditableText = exports.setupEditableText = exports.getEditingInfo = exports.currentlyEditing = exports.hasTextContents = exports.canEditText = void 0;
const identifierUtils_1 = require("./identifierUtils");
const sessionStorageUtils_1 = require("./sessionStorageUtils");
const constantsAndTypes_1 = require("./constantsAndTypes");
const jquery_1 = __importDefault(require("jquery"));
/**
 * Evaluates if the element's text can be edited in place.
 *
 * @param element
 */
const canEditText = (element) => {
    const treeElements = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.TREE_ELEMENT_LOOKUP) || {};
    const treeElement = treeElements[element.codebaseId];
    if (!treeElement) {
        return false;
    }
    return treeElement.staticTextContents;
};
exports.canEditText = canEditText;
/**
 * Returns if the node has text contents in the DOM
 */
const hasTextContents = (node) => {
    if (!node) {
        return false;
    }
    let hasText = false;
    let hasNonText = false;
    node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
            hasText = true;
            return;
        }
        hasNonText = true;
    });
    return hasText && !hasNonText;
};
exports.hasTextContents = hasTextContents;
const currentlyEditing = () => {
    const item = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.TEXT_EDIT);
    return item !== null && item !== undefined;
};
exports.currentlyEditing = currentlyEditing;
const markAsEditing = (info) => {
    (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.TEXT_EDIT, info);
};
const getEditingInfo = () => {
    return (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.TEXT_EDIT);
};
exports.getEditingInfo = getEditingInfo;
const clearEditingInfo = () => {
    (0, sessionStorageUtils_1.setMemoryStorageItem)(sessionStorageUtils_1.TEXT_EDIT, null);
};
/**
 * Takes an element and registers it as an editable text element.
 * Mutates the DOM to make the element editable.
 */
const setupEditableText = (element, parentPort, storyboardId) => {
    const classToSearchFor = `.${identifierUtils_1.ELEMENT_KEY_PREFIX}${element.getKey()}`;
    const domElement = (0, jquery_1.default)(classToSearchFor).get(0);
    if (!domElement) {
        return;
    }
    const originalText = (0, jquery_1.default)(domElement).text();
    markAsEditing({
        key: element.getKey(),
        originalText,
    });
    parentPort.postMessage({
        id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.START_EDITING_TEXT,
        data: {
            key: element.getKey(),
            oldText: originalText,
        },
    });
    (0, jquery_1.default)(domElement).attr('contenteditable', 'plaintext-only').trigger('focus');
    // Apply styling directly
    (0, jquery_1.default)(domElement).css({
        cursor: 'text',
        outline: 'none',
        border: 'none',
    });
    (0, jquery_1.default)(domElement).on('blur', () => (0, exports.teardownEditableText)(parentPort, storyboardId));
};
exports.setupEditableText = setupEditableText;
/**
 * Used to mark the completion of the editable text process.
 * Reverts the DOM to its original state.
 * Sends a message to the housing frame with updated text, if necessary.
 *
 */
const teardownEditableText = (parentPort, storyboardId) => {
    var _a;
    const editingInfo = (0, exports.getEditingInfo)();
    if (!(0, exports.currentlyEditing)()) {
        return;
    }
    clearEditingInfo();
    if (!editingInfo) {
        return;
    }
    const classToSearchFor = `.${identifierUtils_1.ELEMENT_KEY_PREFIX}${editingInfo.key}`;
    const domElement = (0, jquery_1.default)(classToSearchFor).get(0);
    if (!domElement) {
        return;
    }
    const updatedText = (0, jquery_1.default)(domElement).text();
    parentPort.postMessage({
        id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.EDITED_TEXT,
        data: {
            key: editingInfo.key,
            newText: updatedText,
            oldText: editingInfo.originalText,
        },
    });
    // Clear any selection
    (_a = window.getSelection()) === null || _a === void 0 ? void 0 : _a.removeAllRanges();
    // Cleanup
    (0, jquery_1.default)(domElement).removeAttr('contenteditable').off('blur').css({
        cursor: '',
        outline: '',
        border: '',
    });
    clearEditingInfo();
};
exports.teardownEditableText = teardownEditableText;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdFRleHRVdGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jaGFubmVsTWVzc2FnaW5nL2VkaXRUZXh0VXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsdURBQXVEO0FBQ3ZELCtEQU0rQjtBQUUvQiwyREFBK0Q7QUFDL0Qsb0RBQXVCO0FBRXZCOzs7O0dBSUc7QUFDSSxNQUFNLFdBQVcsR0FBRyxDQUFDLE9BQXFCLEVBQVcsRUFBRTtJQUM1RCxNQUFNLFlBQVksR0FBRyxJQUFBLDBDQUFvQixFQUFDLHlDQUFtQixDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3JFLE1BQU0sV0FBVyxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFckQsSUFBSSxDQUFDLFdBQVcsRUFBRTtRQUNoQixPQUFPLEtBQUssQ0FBQztLQUNkO0lBRUQsT0FBTyxXQUFXLENBQUMsa0JBQWtCLENBQUM7QUFDeEMsQ0FBQyxDQUFDO0FBVFcsUUFBQSxXQUFXLGVBU3RCO0FBRUY7O0dBRUc7QUFDSSxNQUFNLGVBQWUsR0FBRyxDQUFDLElBQWtCLEVBQVcsRUFBRTtJQUM3RCxJQUFJLENBQUMsSUFBSSxFQUFFO1FBQ1QsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztJQUNwQixJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7SUFDdkIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUNoQyxJQUFJLEtBQUssQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNyQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ2YsT0FBTztTQUNSO1FBRUQsVUFBVSxHQUFHLElBQUksQ0FBQztJQUNwQixDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQ2hDLENBQUMsQ0FBQztB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LEVBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFOUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtRQUNmLE9BQU87S0FDUjtJQUVELE1BQU0sV0FBVyxHQUFHLElBQUEsZ0JBQUMsRUFBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUV6QyxVQUFVLENBQUMsV0FBVyxDQUFDO1FBQ3JCLEVBQUUsRUFBRSw0Q0FBd0IsQ0FBQyxXQUFXO1FBQ3hDLElBQUksRUFBRTtZQUNKLEdBQUcsRUFBRSxXQUFXLENBQUMsR0FBRztZQUNwQixPQUFPLEVBQUUsV0FBVztZQUNwQixPQUFPLEVBQUUsV0FBVyxDQUFDLFlBQVk7U0FDbEM7S0FDRixDQUFDLENBQUM7SUFFSCxzQkFBc0I7SUFDdEIsTUFBQSxNQUFNLENBQUMsWUFBWSxFQUFFLDBDQUFFLGVBQWUsRUFBRSxDQUFDO0lBRXpDLFVBQVU7SUFDVixJQUFBLGdCQUFDLEVBQUMsVUFBVSxDQUFDLENBQUMsVUFBVSxDQUFDLGlCQUFpQixDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQztRQUMxRCxNQUFNLEVBQUUsRUFBRTtRQUNWLE9BQU8sRUFBRSxFQUFFO1FBQ1gsTUFBTSxFQUFFLEVBQUU7S0FDWCxDQUFDLENBQUM7SUFFSCxnQkFBZ0IsRUFBRSxDQUFDO0FBQ3JCLENBQUMsQ0FBQztBQTdDVyxRQUFBLG9CQUFvQix3QkE2Qy9CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRUxFTUVOVF9LRVlfUFJFRklYIH0gZnJvbSAnLi9pZGVudGlmaWVyVXRpbHMnO1xuaW1wb3J0IHtcbiAgU0VMRUNURURfRUxFTUVOVF9LRVksXG4gIFRFWFRfRURJVCxcbiAgVFJFRV9FTEVNRU5UX0xPT0tVUCxcbiAgZ2V0TWVtb3J5U3RvcmFnZUl0ZW0sXG4gIHNldE1lbW9yeVN0b3JhZ2VJdGVtLFxufSBmcm9tICcuL3Nlc3Npb25TdG9yYWdlVXRpbHMnO1xuaW1wb3J0IHsgVGVtcG9FbGVtZW50IH0gZnJvbSAnLi90ZW1wb0VsZW1lbnQnO1xuaW1wb3J0IHsgRklYRURfSUZSQU1FX01FU1NBR0VfSURTIH0gZnJvbSAnLi9jb25zdGFudHNBbmRUeXBlcyc7XG5pbXBvcnQgJCBmcm9tICdqcXVlcnknO1xuXG4vKipcbiAqIEV2YWx1YXRlcyBpZiB0aGUgZWxlbWVudCdzIHRleHQgY2FuIGJlIGVkaXRlZCBpbiBwbGFjZS5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudFxuICovXG5leHBvcnQgY29uc3QgY2FuRWRpdFRleHQgPSAoZWxlbWVudDogVGVtcG9FbGVtZW50KTogYm9vbGVhbiA9PiB7XG4gIGNvbnN0IHRyZWVFbGVtZW50cyA9IGdldE1lbW9yeVN0b3JhZ2VJdGVtKFRSRUVfRUxFTUVOVF9MT09LVVApIHx8IHt9O1xuICBjb25zdCB0cmVlRWxlbWVudCA9IHRyZWVFbGVtZW50c1tlbGVtZW50LmNvZGViYXNlSWRdO1xuXG4gIGlmICghdHJlZUVsZW1lbnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHJlZUVsZW1lbnQuc3RhdGljVGV4dENvbnRlbnRzO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGlmIHRoZSBub2RlIGhhcyB0ZXh0IGNvbnRlbnRzIGluIHRoZSBET01cbiAqL1xuZXhwb3J0IGNvbnN0IGhhc1RleHRDb250ZW50cyA9IChub2RlPzogSFRNTEVsZW1lbnQpOiBib29sZWFuID0+IHtcbiAgaWYgKCFub2RlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgbGV0IGhhc1RleHQgPSBmYWxzZTtcbiAgbGV0IGhhc05vblRleHQgPSBmYWxzZTtcbiAgbm9kZS5jaGlsZE5vZGVzLmZvckVhY2goKGNoaWxkKSA9PiB7XG4gICAgaWYgKGNoaWxkLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuICAgICAgaGFzVGV4dCA9IHRydWU7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaGFzTm9uVGV4dCA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNUZXh0ICYmICFoYXNOb25UZXh0O1xufTtcblxuLyoqXG4gKiBFdmFsdWF0ZXMgaWYgdGhlcmUncyBjdXJyZW50bHkgYW4gZWxlbWVudCBiZWluZyBlZGl0ZWQuXG4gKi9cblxuaW50ZXJmYWNlIEVkaXRpbmdJbmZvIHtcbiAga2V5OiBzdHJpbmc7XG4gIG9yaWdpbmFsVGV4dDogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgY3VycmVudGx5RWRpdGluZyA9ICgpOiBib29sZWFuID0+IHtcbiAgY29uc3QgaXRlbSA9IGdldE1lbW9yeVN0b3JhZ2VJdGVtKFRFWFRfRURJVCk7XG4gIHJldHVybiBpdGVtICE9PSBudWxsICYmIGl0ZW0gIT09IHVuZGVmaW5lZDtcbn07XG5cbmNvbnN0IG1hcmtBc0VkaXRpbmcgPSAoaW5mbzogRWRpdGluZ0luZm8pOiB2b2lkID0+IHtcbiAgc2V0TWVtb3J5U3RvcmFnZUl0ZW0oVEVYVF9FRElULCBpbmZvKTtcbn07XG5cbmV4cG9ydCBjb25zdCBnZXRFZGl0aW5nSW5mbyA9ICgpOiBFZGl0aW5nSW5mbyB8IG51bGwgPT4ge1xuICByZXR1cm4gZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oVEVYVF9FRElUKTtcbn07XG5cbmNvbnN0IGNsZWFyRWRpdGluZ0luZm8gPSAoKTogdm9pZCA9PiB7XG4gIHNldE1lbW9yeVN0b3JhZ2VJdGVtKFRFWFRfRURJVCwgbnVsbCk7XG59O1xuXG4vKipcbiAqIFRha2VzIGFuIGVsZW1lbnQgYW5kIHJlZ2lzdGVycyBpdCBhcyBhbiBlZGl0YWJsZSB0ZXh0IGVsZW1lbnQuXG4gKiBNdXRhdGVzIHRoZSBET00gdG8gbWFrZSB0aGUgZWxlbWVudCBlZGl0YWJsZS5cbiAqL1xuZXhwb3J0IGNvbnN0IHNldHVwRWRpdGFibGVUZXh0ID0gKFxuICBlbGVtZW50OiBUZW1wb0VsZW1lbnQsXG4gIHBhcmVudFBvcnQ6IGFueSxcbiAgc3Rvcnlib2FyZElkOiBzdHJpbmcsXG4pID0+IHtcbiAgY29uc3QgY2xhc3NUb1NlYXJjaEZvciA9IGAuJHtFTEVNRU5UX0tFWV9QUkVGSVh9JHtlbGVtZW50LmdldEtleSgpfWA7XG4gIGNvbnN0IGRvbUVsZW1lbnQgPSAkKGNsYXNzVG9TZWFyY2hGb3IpLmdldCgwKTtcblxuICBpZiAoIWRvbUVsZW1lbnQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBvcmlnaW5hbFRleHQgPSAkKGRvbUVsZW1lbnQpLnRleHQoKTtcblxuICBtYXJrQXNFZGl0aW5nKHtcbiAgICBrZXk6IGVsZW1lbnQuZ2V0S2V5KCksXG4gICAgb3JpZ2luYWxUZXh0LFxuICB9KTtcbiAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSh7XG4gICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5TVEFSVF9FRElUSU5HX1RFWFQsXG4gICAgZGF0YToge1xuICAgICAga2V5OiBlbGVtZW50LmdldEtleSgpLFxuICAgICAgb2xkVGV4dDogb3JpZ2luYWxUZXh0LFxuICAgIH0sXG4gIH0pO1xuXG4gICQoZG9tRWxlbWVudCkuYXR0cignY29udGVudGVkaXRhYmxlJywgJ3BsYWludGV4dC1vbmx5JykudHJpZ2dlcignZm9jdXMnKTtcblxuICAvLyBBcHBseSBzdHlsaW5nIGRpcmVjdGx5XG4gICQoZG9tRWxlbWVudCkuY3NzKHtcbiAgICBjdXJzb3I6ICd0ZXh0JyxcbiAgICBvdXRsaW5lOiAnbm9uZScsXG4gICAgYm9yZGVyOiAnbm9uZScsXG4gIH0pO1xuXG4gICQoZG9tRWxlbWVudCkub24oJ2JsdXInLCAoKSA9PlxuICAgIHRlYXJkb3duRWRpdGFibGVUZXh0KHBhcmVudFBvcnQsIHN0b3J5Ym9hcmRJZCksXG4gICk7XG59O1xuXG4vKipcbiAqIFVzZWQgdG8gbWFyayB0aGUgY29tcGxldGlvbiBvZiB0aGUgZWRpdGFibGUgdGV4dCBwcm9jZXNzLlxuICogUmV2ZXJ0cyB0aGUgRE9NIHRvIGl0cyBvcmlnaW5hbCBzdGF0ZS5cbiAqIFNlbmRzIGEgbWVzc2FnZSB0byB0aGUgaG91c2luZyBmcmFtZSB3aXRoIHVwZGF0ZWQgdGV4dCwgaWYgbmVjZXNzYXJ5LlxuICpcbiAqL1xuZXhwb3J0IGNvbnN0IHRlYXJkb3duRWRpdGFibGVUZXh0ID0gKFxuICBwYXJlbnRQb3J0OiBhbnksXG4gIHN0b3J5Ym9hcmRJZDogc3RyaW5nLFxuKTogdm9pZCA9PiB7XG4gIGNvbnN0IGVkaXRpbmdJbmZvID0gZ2V0RWRpdGluZ0luZm8oKTtcblxuICBpZiAoIWN1cnJlbnRseUVkaXRpbmcoKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNsZWFyRWRpdGluZ0luZm8oKTtcblxuICBpZiAoIWVkaXRpbmdJbmZvKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgY2xhc3NUb1NlYXJjaEZvciA9IGAuJHtFTEVNRU5UX0tFWV9QUkVGSVh9JHtlZGl0aW5nSW5mby5rZXl9YDtcbiAgY29uc3QgZG9tRWxlbWVudCA9ICQoY2xhc3NUb1NlYXJjaEZvcikuZ2V0KDApO1xuXG4gIGlmICghZG9tRWxlbWVudCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHVwZGF0ZWRUZXh0ID0gJChkb21FbGVtZW50KS50ZXh0KCk7XG5cbiAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSh7XG4gICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5FRElURURfVEVYVCxcbiAgICBkYXRhOiB7XG4gICAgICBrZXk6IGVkaXRpbmdJbmZvLmtleSxcbiAgICAgIG5ld1RleHQ6IHVwZGF0ZWRUZXh0LFxuICAgICAgb2xkVGV4dDogZWRpdGluZ0luZm8ub3JpZ2luYWxUZXh0LFxuICAgIH0sXG4gIH0pO1xuXG4gIC8vIENsZWFyIGFueSBzZWxlY3Rpb25cbiAgd2luZG93LmdldFNlbGVjdGlvbigpPy5yZW1vdmVBbGxSYW5nZXMoKTtcblxuICAvLyBDbGVhbnVwXG4gICQoZG9tRWxlbWVudCkucmVtb3ZlQXR0cignY29udGVudGVkaXRhYmxlJykub2ZmKCdibHVyJykuY3NzKHtcbiAgICBjdXJzb3I6ICcnLFxuICAgIG91dGxpbmU6ICcnLFxuICAgIGJvcmRlcjogJycsXG4gIH0pO1xuXG4gIGNsZWFyRWRpdGluZ0luZm8oKTtcbn07XG4iXX0=