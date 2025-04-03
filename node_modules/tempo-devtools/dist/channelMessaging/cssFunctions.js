"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ruleMatchesElement = exports.getElementClassList = exports.getCssEvals = exports.cssEval = exports.processRulesForSelectedElement = exports.setModifiersForSelectedElement = exports.parse = void 0;
// @ts-ignore
const jquery_1 = __importDefault(require("jquery"));
const identifierUtils_1 = require("./identifierUtils");
const cssRuleUtils_1 = require("./cssRuleUtils");
const constantsAndTypes_1 = require("./constantsAndTypes");
const uuid_1 = require("uuid");
const specificity_1 = require("specificity");
const tempoElement_1 = require("./tempoElement");
const css_selector_parser_1 = require("css-selector-parser");
const sessionStorageUtils_1 = require("./sessionStorageUtils");
const navTreeUtils_1 = require("./navTreeUtils");
exports.parse = (0, css_selector_parser_1.createParser)({
    syntax: {
        baseSyntax: 'latest',
        pseudoClasses: {
            unknown: 'accept',
            definitions: {
                Selector: ['has'],
            },
        },
        pseudoElements: {
            unknown: 'accept',
        },
        combinators: ['>', '+', '~'],
        attributes: {
            operators: ['^=', '$=', '*=', '~='],
        },
        classNames: true,
        namespace: {
            wildcard: true,
        },
        tag: {
            wildcard: true,
        },
    },
    substitutes: true,
});
const addCSSRule = (styleSheet, selector, rules, index) => {
    try {
        if (styleSheet.insertRule) {
            styleSheet.insertRule(`${selector} { ${rules} }`, index);
        }
        else {
            styleSheet.addRule(selector, rules, index);
        }
    }
    catch (e) {
        console.log('Error adding rule: ', e);
    }
};
/**
 * This method filters and process media query rules for responsive modifiers to extract Tailwind responsive classes.
 * A Tailwind responsive modifiers takes the form:
 *
 *   {sm,md,lg...}:className
 *
 * which is represented as:
 *
 * @media (min-width: 640px) {
 *    .sm\:className {
 *     ...
 *   }
 * }
 *
 * This is why we need to filter for media query rules with min-width and then extract the class name.
 * @param rule
 * @returns
 */
const processMediaQueryRulesForResponsiveModifiers = (rule) => {
    let rules = [];
    if (rule instanceof CSSMediaRule) {
        // Loop through each CSSRule within the CSSMediaRule
        for (let innerRule of rule.cssRules) {
            // Check for min-width in media queries and that it is a style rule
            if (rule.media.mediaText.includes('min-width') &&
                innerRule instanceof CSSStyleRule) {
                const parsedIsSelector = (0, exports.parse)(innerRule.selectorText);
                if (parsedIsSelector.type !== 'Selector') {
                    continue;
                }
                const lastRule = parsedIsSelector.rules[0];
                const classNames = lastRule.items.filter((item) => item.type === 'ClassName').map((item) => item.name);
                if (classNames.length !== 1) {
                    continue;
                }
                // Extract Tailwind responsive modifiers
                rules.push({
                    class: classNames[0],
                    pseudos: extractTailwindPrefixes(classNames[0]),
                    cssText: innerRule.style.cssText,
                    style: innerRule.style,
                });
            }
        }
    }
    return rules;
};
/**
 * Since Tailwind CSS responsive modifiers are not CSS pseudo classes, we need to extract them from the class name.
 * We use a regex to match the responsive prefixes and return them as a set.
 * @param selectorText
 * @returns Set[prefixes]
 */
const extractTailwindPrefixes = (selectorText) => {
    // This regex matches classes with responsive prefixes that might be preceded by a period or another colon
    const prefixRegex = /(?:\b|(?<=[:.]))(sm|md|lg|xl|2xl)\\?:[\w-]+/g;
    const matches = selectorText.match(prefixRegex) || [];
    const prefixes = matches.map((match) => {
        // Find the index of the colon or escaped colon
        const index = match.indexOf(match.includes('\\:') ? '\\:' : ':');
        return match.substring(0, index);
    });
    return [...new Set(prefixes)]; // Remove duplicates
};
/**
 * Tailwind CSS dark mode classes (< 3.4.1) are specified using the `:is` pseudo selector and take the form
 *   :is(.dark .dark:bg-red-200)
 * This is to support the behaviour that dark mode classes are applied to the element when the dark class is present in the parent.
 *
 * TODO: We should support the new Tailwind CSS dark mode classes in 3.4.1 and above which are specified using the `@media (prefers-color-scheme: dark)` media query.
 * @param isSelectorString
 * @returns
 */
const processIsSelectorForDarkMode = (isSelector) => {
    if (isSelector.type !== 'Selector') {
        return;
    }
    const firstRule = isSelector.rules[0];
    const classNames = firstRule.items.filter((item) => item.type === 'ClassName').map((item) => item.name);
    if (classNames.length === 0 || classNames[0] !== 'dark') {
        return;
    }
    const nestedRule = firstRule.nestedRule;
    if (!nestedRule) {
        return;
    }
    let darkModeClasses = [];
    const nestedClassNames = nestedRule.items.filter((item) => item.type === 'ClassName').map((item) => item.name);
    if (nestedClassNames.length > 1) {
        console.log('Skipping is selector with multiple classes', firstRule);
        return;
    }
    darkModeClasses.push({
        class: nestedClassNames[0],
        pseudos: [
            'dark',
            ...nestedRule.items.filter((item) => item.type === 'PseudoClass').map((p) => p.name),
        ],
    });
    return darkModeClasses;
};
const setModifiersForSelectedElement = (parentPort, modifiers, selectedElementKey) => {
    // Remove all existing force classes from entire document
    const allElements = document.querySelectorAll('[class*="tempo-force-"]');
    allElements.forEach((element) => {
        const classes = Array.from(element.classList);
        classes.forEach((cls) => {
            if (cls.startsWith('tempo-force-')) {
                element.classList.remove(cls);
            }
        });
    });
    const selectedElement = tempoElement_1.TempoElement.fromKey(selectedElementKey);
    if (selectedElement.isEmpty()) {
        return;
    }
    const selectedDomElement = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${selectedElement.getKey()}`).get(0);
    if (!selectedDomElement) {
        return;
    }
    modifiers.forEach((modifier) => {
        selectedDomElement.classList.add('tempo-force-' + modifier);
    });
};
exports.setModifiersForSelectedElement = setModifiersForSelectedElement;
const processRulesForSelectedElement = (parentPort, cssElementLookup, selectedElementKey) => {
    var _a, _b, _c, _d, _e;
    // TODO: this whole function is slow, fix
    if (!cssElementLookup) {
        return;
    }
    const selectedElement = tempoElement_1.TempoElement.fromKey(selectedElementKey);
    if (selectedElement.isEmpty()) {
        return;
    }
    const selectedDomElement = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${selectedElement.getKey()}`).get(0);
    const multiSelectedElementKeys = (0, sessionStorageUtils_1.getMemoryStorageItem)(sessionStorageUtils_1.MULTI_SELECTED_ELEMENT_KEYS) || [];
    /**
     * If there's no selected DOM element yet, it implies the nav tree isn't built yet.
     * We register a callback to defer the processing of the rules until the nav tree is built.
     */
    if (!selectedDomElement) {
        (0, navTreeUtils_1.addNavTreeBuiltCallback)({
            callbackFn: () => {
                (0, exports.processRulesForSelectedElement)(parentPort, cssElementLookup, selectedElementKey);
            },
            state: {
                selectedElementKey: selectedElementKey,
                multiSelectedElementKeys: multiSelectedElementKeys,
            },
        });
        return;
    }
    const newProcessedCssRules = [];
    const extractedKnownClasses = new Set();
    const knownSelectors = new Set();
    // First get the inline style of the element
    const inlineStyleRule = {
        filename: '',
        selector: 'element.style',
        source: {},
        styles: {},
        applied: true,
        codebaseId: 'element.style',
        removable: false,
        allowChanges: true,
    };
    for (let i = 0; i < ((_a = selectedDomElement === null || selectedDomElement === void 0 ? void 0 : selectedDomElement.style) === null || _a === void 0 ? void 0 : _a.length) || 0; i++) {
        const cssName = selectedDomElement.style[i];
        // @ts-ignore
        inlineStyleRule.styles[cssName] = selectedDomElement.style[cssName];
    }
    newProcessedCssRules.push(inlineStyleRule);
    // Only check the inline-styles of the parent once
    let checkedInlineStylesOfParent = false;
    const directMatchCssRules = [];
    const otherCssRules = [];
    Object.keys(cssElementLookup).forEach((codebaseId) => {
        var _a;
        const cssRule = cssElementLookup[codebaseId];
        knownSelectors.add(cssRule.selector);
        if (!(0, cssRuleUtils_1.isCssSelectorValid)(cssRule.selector)) {
            return;
        }
        (0, cssRuleUtils_1.getAllClassesFromSelector)(cssRule.selector).forEach((cls) => {
            extractedKnownClasses.add(cls);
        });
        // First check if a rule directly matches
        if ((0, cssRuleUtils_1.isCssSelectorValid)(cssRule.selector) &&
            (selectedDomElement === null || selectedDomElement === void 0 ? void 0 : selectedDomElement.matches(cssRule.selector))) {
            directMatchCssRules.push(Object.assign(Object.assign({}, cssRule), { applied: true, allowChanges: true, removable: (0, cssRuleUtils_1.canRemoveCssClassFromElement)(cssRule.selector, selectedDomElement) }));
            return;
        }
        // In order to make the parentElement.style selector unique
        let parentElementIndex = 0;
        // Then check the parents if it's a rule with properties that are inherited
        let parentDomElement = selectedDomElement === null || selectedDomElement === void 0 ? void 0 : selectedDomElement.parentElement;
        const inheritedStyles = {};
        while (parentDomElement) {
            // Inline styles are prioritized over rule based styles
            if (!checkedInlineStylesOfParent) {
                const inlineStyleOfParent = {};
                for (let i = 0; i < ((_a = parentDomElement === null || parentDomElement === void 0 ? void 0 : parentDomElement.style) === null || _a === void 0 ? void 0 : _a.length) || 0; i++) {
                    const cssName = parentDomElement.style[i];
                    if (constantsAndTypes_1.INHERITABLE_CSS_PROPS[cssName]) {
                        inlineStyleOfParent[cssName] = parentDomElement.style[cssName];
                    }
                }
                if (Object.keys(inlineStyleOfParent).length !== 0) {
                    otherCssRules.push({
                        filename: '',
                        // TODO: make this unique
                        selector: `parentElement${parentElementIndex}.style`,
                        inherited: true,
                        source: {},
                        styles: inlineStyleOfParent,
                        applied: true,
                        codebaseId: `parentElement${parentElementIndex}.style`,
                        removable: false,
                        allowChanges: false,
                    });
                }
            }
            // Css defined styles
            if ((0, cssRuleUtils_1.isCssSelectorValid)(cssRule.selector) &&
                !(parentDomElement === null || parentDomElement === void 0 ? void 0 : parentDomElement.matches(cssRule.selector))) {
                parentDomElement = parentDomElement.parentElement;
                continue;
            }
            Object.keys((cssRule === null || cssRule === void 0 ? void 0 : cssRule.styles) || {}).forEach((cssName) => {
                // Prioritize inherited styles that are further down the tree
                if (constantsAndTypes_1.INHERITABLE_CSS_PROPS[cssName] &&
                    inheritedStyles[cssName] !== null) {
                    inheritedStyles[cssName] = cssRule.styles[cssName];
                }
            });
            parentDomElement = parentDomElement.parentElement;
            parentElementIndex += 1;
        }
        // Check once across all css rules
        checkedInlineStylesOfParent = true;
        // Just because a css rule is inherited doesn't mean it can't be eligible to apply,
        // so do not return after appending this rule
        if (Object.keys(inheritedStyles).length !== 0) {
            otherCssRules.push(Object.assign(Object.assign({}, cssRule), { inherited: true, styles: inheritedStyles, applied: true, removable: false, allowChanges: false }));
        }
        // Finally check if it's a rule that can be applied if clases are changed
        otherCssRules.push(Object.assign(Object.assign({}, cssRule), { applied: false, allowChanges: false, eligibleToApply: (0, cssRuleUtils_1.canApplyCssRuleToElement)(cssRule.selector, selectedDomElement) }));
    });
    const mainStyleSheet = document.styleSheets[0];
    // Add any rules not previously added that are available in the stylesheets as read-only
    for (let i = 0; i < document.styleSheets.length; i += 1) {
        const sheet = document.styleSheets[i];
        let rules = null;
        try {
            rules = sheet.cssRules;
        }
        catch (e) {
            console.log(e);
            try {
                rules = sheet.rules;
            }
            catch (e) {
                console.log(e);
            }
        }
        if (!rules) {
            continue;
        }
        for (let j = 0; j < rules.length; j += 1) {
            const rule = rules[j];
            /**
             * Handle Tailwind CSS responsive modifiers
             */
            const responsiveModifiers = processMediaQueryRulesForResponsiveModifiers(rule);
            if (responsiveModifiers.length > 0) {
                for (let k = 0; k < responsiveModifiers.length; k++) {
                    const modifier = responsiveModifiers[k];
                    if (!(selectedDomElement === null || selectedDomElement === void 0 ? void 0 : selectedDomElement.matches('.' + CSS.escape(modifier.class)))) {
                        continue;
                    }
                    const styling = {};
                    for (let l = 0; l < ((_b = modifier === null || modifier === void 0 ? void 0 : modifier.style) === null || _b === void 0 ? void 0 : _b.length) || 0; l += 1) {
                        const cssName = modifier === null || modifier === void 0 ? void 0 : modifier.style[l];
                        // @ts-ignore;
                        styling[cssName] = modifier === null || modifier === void 0 ? void 0 : modifier.style[cssName];
                    }
                    const ruleToPush = {
                        filename: undefined,
                        selector: CSS.escape('.' + modifier.class),
                        classParsed: modifier.class,
                        source: {},
                        styles: styling,
                        applied: true,
                        modifiers: Object.assign({}, modifier.pseudos.reduce((acc, pseudo) => {
                            acc[pseudo] = true;
                            return acc;
                        }, {})),
                        // Generate a random codebase ID to use for selection
                        // Note: this ID is shown as a backup in the overridden tooltip
                        codebaseId: `${modifier.class} ${(0, uuid_1.v4)().toString()}`,
                        removable: false,
                        allowChanges: false,
                        cssText: modifier.cssText,
                    };
                    directMatchCssRules.push(ruleToPush);
                }
            }
            if (!rule.selectorText) {
                continue;
            }
            if (knownSelectors.has(rule.selectorText)) {
                continue;
            }
            const parsedCssRule = (0, exports.parse)(rule.selectorText);
            if (parsedCssRule.type !== 'Selector') {
                continue;
            }
            const firstRule = parsedCssRule.rules[0];
            if (!firstRule) {
                continue;
            }
            /**
             * This is a special case for the `:is` pseudo selector, which is how Tailwind specifies dark mode classes.
             */
            const classNames = firstRule.items.filter((item) => item.type === 'ClassName').map((item) => item.name);
            const pseudos = firstRule.items.filter((item) => item.type === 'PseudoClass');
            // TODO: Add support for https://github.com/tailwindlabs/tailwindcss/pull/13379 (~3.4.4)
            if (classNames.length === 0 &&
                pseudos.length === 1 &&
                pseudos[0].name === 'is') {
                const pseudo = pseudos[0];
                if (pseudo && ((_c = pseudo.argument) === null || _c === void 0 ? void 0 : _c.type) === 'Selector') {
                    const darkModeClasses = processIsSelectorForDarkMode(pseudo.argument);
                    if (darkModeClasses) {
                        for (const darkModeClass of darkModeClasses) {
                            if (!(selectedDomElement === null || selectedDomElement === void 0 ? void 0 : selectedDomElement.matches('.' + CSS.escape(darkModeClass.class)))) {
                                continue;
                            }
                            const styling = {};
                            for (let k = 0; k < ((_d = rule === null || rule === void 0 ? void 0 : rule.style) === null || _d === void 0 ? void 0 : _d.length) || 0; k += 1) {
                                const cssName = rule.style[k];
                                styling[cssName] = rule.style[cssName];
                            }
                            const ruleToPush = {
                                filename: undefined,
                                selector: CSS.escape('.' + darkModeClass.class),
                                classParsed: darkModeClass.class,
                                source: {},
                                styles: styling,
                                applied: true,
                                modifiers: Object.assign({}, darkModeClass.pseudos.reduce((acc, pseudo) => {
                                    acc[pseudo] = true;
                                    return acc;
                                }, {})),
                                // Generate a random codebase ID to use for selection
                                // Note: this ID is shown as a backup in the overridden tooltip
                                codebaseId: `${rule.selectorText} ${(0, uuid_1.v4)().toString()}`,
                                removable: false,
                                allowChanges: false,
                                cssText: rule.style.cssText,
                            };
                            directMatchCssRules.push(ruleToPush);
                        }
                    }
                }
            }
            if (classNames.length === 0 || classNames.length > 1) {
                continue;
            }
            const cls = classNames[0];
            const pseudoClasses = firstRule.items.filter((item) => item.type === 'PseudoClass').map((p) => p.name);
            try {
                if (selectedDomElement === null || selectedDomElement === void 0 ? void 0 : selectedDomElement.matches('.' + CSS.escape(cls))) {
                    const styling = {};
                    for (let k = 0; k < ((_e = rule === null || rule === void 0 ? void 0 : rule.style) === null || _e === void 0 ? void 0 : _e.length) || 0; k += 1) {
                        const cssName = rule.style[k];
                        styling[cssName] = rule.style[cssName];
                    }
                    directMatchCssRules.push({
                        filename: undefined,
                        selector: rule.selectorText,
                        classParsed: cls,
                        source: {},
                        styles: styling,
                        applied: true,
                        modifiers: Object.assign({}, pseudoClasses.reduce((acc, pseudo) => {
                            acc[pseudo.name] = true;
                            return acc;
                        }, {})),
                        // Generate a random codebase ID to use for selection
                        // Note: this ID is shown as a backup in the overridden tooltip
                        codebaseId: `${rule.selectorText} ${(0, uuid_1.v4)().toString()}`,
                        removable: false,
                        allowChanges: false,
                        cssText: rule.style.cssText,
                    });
                }
                else {
                    // console.log("NO MATCH", cls)
                }
            }
            catch (e) {
                // console.error(e);
            }
        }
    }
    // For each direct match rule, check if it has modifiers and create a new rule for each modifier.
    for (let i = 0; i < directMatchCssRules.length; i++) {
        const currentRule = directMatchCssRules[i];
        if (!currentRule.modifiers) {
            continue;
        }
        const rulePseudos = Object.keys(currentRule.modifiers);
        if (rulePseudos.length < 1) {
            continue;
        }
        const cls = currentRule.classParsed;
        if (!cls) {
            continue;
        }
        const cssText = currentRule.cssText;
        if (!cssText) {
            continue;
        }
        // Create a new custom css rule for ones that have pseudo selectors.
        // Use the parseClass as the selector and add `tempo-force-[pseudo]` for each pseudo selector
        const pseudoSelector = rulePseudos
            .map((pseudo) => '.tempo-force-' + pseudo)
            .join('');
        const newSelector = '.' + CSS.escape(cls) + pseudoSelector;
        const newRules = cssText;
        // // Inject new rule into the stylesheet
        addCSSRule(mainStyleSheet, newSelector, newRules, mainStyleSheet.cssRules.length);
    }
    const newList = newProcessedCssRules
        .concat(directMatchCssRules.sort((a, b) => {
        try {
            return -(0, specificity_1.compare)(a.selector, b.selector);
        }
        catch (_a) {
            // Put the invalid elements at the end
            let aValid = true;
            try {
                (0, specificity_1.compare)(a.selector, 'body');
            }
            catch (e) {
                aValid = false;
            }
            let bValid = true;
            try {
                (0, specificity_1.compare)(b.selector, 'body');
            }
            catch (e) {
                bValid = false;
            }
            if (aValid && !bValid) {
                return -1;
            }
            if (!aValid && bValid) {
                return 1;
            }
            return 0;
        }
    }))
        .concat(otherCssRules);
    parentPort.postMessage({
        id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.PROCESSED_CSS_RULES_FOR_ELEMENT,
        processedCssRules: newList,
    });
};
exports.processRulesForSelectedElement = processRulesForSelectedElement;
const cssEval = (element, property) => {
    return window.getComputedStyle(element, null).getPropertyValue(property);
};
exports.cssEval = cssEval;
const getCssEvals = (parentPort, selectedElementKey) => {
    let cssEvals = {};
    const selectdElement = tempoElement_1.TempoElement.fromKey(selectedElementKey);
    if (selectdElement.isEmpty()) {
        return;
    }
    const selectedDomElement = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${selectdElement.getKey()}`).get(0);
    if (!selectedDomElement) {
        return;
    }
    constantsAndTypes_1.CSS_VALUES_TO_COLLECT.forEach((cssName) => {
        cssEvals[cssName] = (0, exports.cssEval)(selectedDomElement, cssName);
    });
    const parentCssEvals = {};
    const parentElement = selectedDomElement.parentElement;
    if (parentElement) {
        constantsAndTypes_1.CSS_VALUES_TO_COLLECT_FOR_PARENT.forEach((cssName) => {
            parentCssEvals[cssName] = (0, exports.cssEval)(selectedDomElement.parentElement, cssName);
        });
        // Use jQuery to check if 'dark' class is in any ancestor of the parent element
        let darkEnabledInParent = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${selectdElement.getKey()}`).closest('.dark')
            .length > 0;
        parentCssEvals['darkEnabledInParent'] = darkEnabledInParent;
    }
    cssEvals['parent'] = parentCssEvals;
    parentPort.postMessage({
        id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.CSS_EVALS_FOR_ELEMENT,
        cssEvals,
    });
};
exports.getCssEvals = getCssEvals;
const getElementClassList = (parentPort, selectedElementKey) => {
    const selectdElement = tempoElement_1.TempoElement.fromKey(selectedElementKey);
    if (selectdElement.isEmpty()) {
        return;
    }
    const selectedDomElement = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${selectdElement.getKey()}`).get(0);
    if (!selectedDomElement) {
        return;
    }
    parentPort.postMessage({
        id: constantsAndTypes_1.FIXED_IFRAME_MESSAGE_IDS.ELEMENT_CLASS_LIST,
        classList: Array.from(selectedDomElement.classList),
    });
};
exports.getElementClassList = getElementClassList;
const ruleMatchesElement = (parentPort, messageId, rule, selectedElementKey) => {
    if (!rule) {
        return;
    }
    const selectdElement = tempoElement_1.TempoElement.fromKey(selectedElementKey);
    if (selectdElement.isEmpty()) {
        return;
    }
    const selectedDomElement = (0, jquery_1.default)(`.${identifierUtils_1.ELEMENT_KEY_PREFIX}${selectdElement.getKey()}`).get(0);
    if (!selectedDomElement) {
        return;
    }
    parentPort.postMessage({
        id: messageId,
        matches: selectedDomElement === null || selectedDomElement === void 0 ? void 0 : selectedDomElement.matches(rule),
    });
};
exports.ruleMatchesElement = ruleMatchesElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3NzRnVuY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NoYW5uZWxNZXNzYWdpbmcvY3NzRnVuY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGFBQWE7QUFDYixvREFBdUI7QUFDdkIsdURBQXVEO0FBQ3ZELGlEQUt3QjtBQUN4QiwyREFLNkI7QUFDN0IsK0JBQW9DO0FBQ3BDLDZDQUErRDtBQUMvRCxpREFBOEM7QUFDOUMsNkRBSzZCO0FBQzdCLCtEQUcrQjtBQUMvQixpREFBeUQ7QUFFNUMsUUFBQSxLQUFLLEdBQUcsSUFBQSxrQ0FBWSxFQUFDO0lBQ2hDLE1BQU0sRUFBRTtRQUNOLFVBQVUsRUFBRSxRQUFRO1FBQ3BCLGFBQWEsRUFBRTtZQUNiLE9BQU8sRUFBRSxRQUFRO1lBQ2pCLFdBQVcsRUFBRTtnQkFDWCxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUM7YUFDbEI7U0FDRjtRQUNELGNBQWMsRUFBRTtZQUNkLE9BQU8sRUFBRSxRQUFRO1NBQ2xCO1FBQ0QsV0FBVyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7UUFDNUIsVUFBVSxFQUFFO1lBQ1YsU0FBUyxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO1NBQ3BDO1FBQ0QsVUFBVSxFQUFFLElBQUk7UUFDaEIsU0FBUyxFQUFFO1lBQ1QsUUFBUSxFQUFFLElBQUk7U0FDZjtRQUNELEdBQUcsRUFBRTtZQUNILFFBQVEsRUFBRSxJQUFJO1NBQ2Y7S0FDRjtJQUNELFdBQVcsRUFBRSxJQUFJO0NBQ2xCLENBQUMsQ0FBQztBQWtCSCxNQUFNLFVBQVUsR0FBRyxDQUNqQixVQUFlLEVBQ2YsUUFBZ0IsRUFDaEIsS0FBYSxFQUNiLEtBQWEsRUFDYixFQUFFO0lBQ0YsSUFBSTtRQUNGLElBQUksVUFBVSxDQUFDLFVBQVUsRUFBRTtZQUN6QixVQUFVLENBQUMsVUFBVSxDQUFD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QU87S0FDUjtJQUVELE1BQU0sa0JBQWtCLEdBQUcsSUFBQSxnQkFBQyxFQUMxQixJQUFJLG9DQUFrQixHQUFHLGNBQWMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUNuRCxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVULElBQUksQ0FBQyxrQkFBa0IsRUFBRTtRQUN2QixPQUFPO0tBQ1I7SUFFRCxVQUFVLENBQUMsV0FBVyxDQUFDO1FBQ3JCLEVBQUUsRUFBRSxTQUFTO1FBQ2IsT0FBTyxFQUFFLGtCQUFrQixhQUFsQixrQkFBa0IsdUJBQWxCLGtCQUFrQixDQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUM7S0FDM0MsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDO0FBNUJXLFFBQUEsa0JBQWtCLHNCQTRCN0IiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAdHMtaWdub3JlXG5pbXBvcnQgJCBmcm9tICdqcXVlcnknO1xuaW1wb3J0IHsgRUxFTUVOVF9LRVlfUFJFRklYIH0gZnJvbSAnLi9pZGVudGlmaWVyVXRpbHMnO1xuaW1wb3J0IHtcbiAgY2FuQXBwbHlDc3NSdWxlVG9FbGVtZW50LFxuICBjYW5SZW1vdmVDc3NDbGFzc0Zyb21FbGVtZW50LFxuICBnZXRBbGxDbGFzc2VzRnJvbVNlbGVjdG9yLFxuICBpc0Nzc1NlbGVjdG9yVmFsaWQsXG59IGZyb20gJy4vY3NzUnVsZVV0aWxzJztcbmltcG9ydCB7XG4gIENTU19WQUxVRVNfVE9fQ09MTEVDVCxcbiAgQ1NTX1ZBTFVFU19UT19DT0xMRUNUX0ZPUl9QQVJFTlQsXG4gIEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUyxcbiAgSU5IRVJJVEFCTEVfQ1NTX1BST1BTLFxufSBmcm9tICcuL2NvbnN0YW50c0FuZFR5cGVzJztcbmltcG9ydCB7IHY0IGFzIHV1aWR2NCB9IGZyb20gJ3V1aWQnO1xuaW1wb3J0IHsgY29tcGFyZSBhcyBjc3NTcGVjaWZpY2l0eUNvbXBhcmUgfSBmcm9tICdzcGVjaWZpY2l0eSc7XG5pbXBvcnQgeyBUZW1wb0VsZW1lbnQgfSBmcm9tICcuL3RlbXBvRWxlbWVudCc7XG5pbXBvcnQge1xuICBBc3RDbGFzc05hbWUsXG4gIEFzdFBzZXVkb0NsYXNzLFxuICBBc3RTZWxlY3RvcixcbiAgY3JlYXRlUGFyc2VyLFxufSBmcm9tICdjc3Mtc2VsZWN0b3ItcGFyc2VyJztcbmltcG9ydCB7XG4gIE1VTFRJX1NFTEVDVEVEX0VMRU1FTlRfS0VZUyxcbiAgZ2V0TWVtb3J5U3RvcmFnZUl0ZW0sXG59IGZyb20gJy4vc2Vzc2lvblN0b3JhZ2VVdGlscyc7XG5pbXBvcnQgeyBhZGROYXZUcmVlQnVpbHRDYWxsYmFjayB9IGZyb20gJy4vbmF2VHJlZVV0aWxzJztcblxuZXhwb3J0IGNvbnN0IHBhcnNlID0gY3JlYXRlUGFyc2VyKHtcbiAgc3ludGF4OiB7XG4gICAgYmFzZVN5bnRheDogJ2xhdGVzdCcsXG4gICAgcHNldWRvQ2xhc3Nlczoge1xuICAgICAgdW5rbm93bjogJ2FjY2VwdCcsXG4gICAgICBkZWZpbml0aW9uczoge1xuICAgICAgICBTZWxlY3RvcjogWydoYXMnXSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBwc2V1ZG9FbGVtZW50czoge1xuICAgICAgdW5rbm93bjogJ2FjY2VwdCcsXG4gICAgfSxcbiAgICBjb21iaW5hdG9yczogWyc+JywgJysnLCAnfiddLFxuICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgIG9wZXJhdG9yczogWydePScsICckPScsICcqPScsICd+PSddLFxuICAgIH0sXG4gICAgY2xhc3NOYW1lczogdHJ1ZSxcbiAgICBuYW1lc3BhY2U6IHtcbiAgICAgIHdpbGRjYXJkOiB0cnVlLFxuICAgIH0sXG4gICAgdGFnOiB7XG4gICAgICB3aWxkY2FyZDogdHJ1ZSxcbiAgICB9LFxuICB9LFxuICBzdWJzdGl0dXRlczogdHJ1ZSxcbn0pO1xuXG5leHBvcnQgaW50ZXJmYWNlIENzc1J1bGUge1xuICBmaWxlbmFtZT86IHN0cmluZztcbiAgc2VsZWN0b3I/OiBzdHJpbmc7XG4gIGF0cnVsZT86IHN0cmluZztcbiAgY29kZWJhc2VJZD86IHN0cmluZztcbiAgc291cmNlPzogYW55O1xuICBzdHlsZXM/OiB7IFtjc3NLZXk6IHN0cmluZ106IHN0cmluZyB9O1xuICBpbmhlcml0ZWQ/OiBib29sZWFuO1xuICBhcHBsaWVkPzogYm9vbGVhbjsgLy8gV2hldGhlciB0aGlzIGNzcyBydWxlIGlzIGFwcGxpZWQgdG8gdGhlIGN1cnJlbnQgZWxlbWVudFxuICByZW1vdmFibGU/OiBib29sZWFuOyAvLyBXaGV0aGVyIHRoaXMgY3NzIHJ1bGUgaXMgcmVtb3ZhYmxlIHdpdGggYSBzaW1wbGUgY2xhc3MgY2hhbmdlXG4gIGFsbG93Q2hhbmdlcz86IGJvb2xlYW47XG4gIG1vZGlmaWVycz86IHsgW21vZGlmaWVyOiBzdHJpbmddOiBib29sZWFuIH07XG4gIGNsYXNzUGFyc2VkPzogc3RyaW5nO1xuICBjc3NUZXh0PzogYW55O1xufVxuXG5jb25zdCBhZGRDU1NSdWxlID0gKFxuICBzdHlsZVNoZWV0OiBhbnksXG4gIHNlbGVjdG9yOiBzdHJpbmcsXG4gIHJ1bGVzOiBzdHJpbmcsXG4gIGluZGV4OiBudW1iZXIsXG4pID0+IHtcbiAgdHJ5IHtcbiAgICBpZiAoc3R5bGVTaGVldC5pbnNlcnRSdWxlKSB7XG4gICAgICBzdHlsZVNoZWV0Lmluc2VydFJ1bGUoYCR7c2VsZWN0b3J9IHsgJHtydWxlc30gfWAsIGluZGV4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3R5bGVTaGVldC5hZGRSdWxlKHNlbGVjdG9yLCBydWxlcywgaW5kZXgpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUubG9nKCdFcnJvciBhZGRpbmcgcnVsZTogJywgZSk7XG4gIH1cbn07XG5cbi8qKlxuICogVGhpcyBtZXRob2QgZmlsdGVycyBhbmQgcHJvY2VzcyBtZWRpYSBxdWVyeSBydWxlcyBmb3IgcmVzcG9uc2l2ZSBtb2RpZmllcnMgdG8gZXh0cmFjdCBUYWlsd2luZCByZXNwb25zaXZlIGNsYXNzZXMuXG4gKiBBIFRhaWx3aW5kIHJlc3BvbnNpdmUgbW9kaWZpZXJzIHRha2VzIHRoZSBmb3JtOlxuICpcbiAqICAge3NtLG1kLGxnLi4ufTpjbGFzc05hbWVcbiAqXG4gKiB3aGljaCBpcyByZXByZXNlbnRlZCBhczpcbiAqXG4gKiBAbWVkaWEgKG1pbi13aWR0aDogNjQwcHgpIHtcbiAqICAgIC5zbVxcOmNsYXNzTmFtZSB7XG4gKiAgICAgLi4uXG4gKiAgIH1cbiAqIH1cbiAqXG4gKiBUaGlzIGlzIHdoeSB3ZSBuZWVkIHRvIGZpbHRlciBmb3IgbWVkaWEgcXVlcnkgcnVsZXMgd2l0aCBtaW4td2lkdGggYW5kIHRoZW4gZXh0cmFjdCB0aGUgY2xhc3MgbmFtZS5cbiAqIEBwYXJhbSBydWxlXG4gKiBAcmV0dXJuc1xuICovXG5jb25zdCBwcm9jZXNzTWVkaWFRdWVyeVJ1bGVzRm9yUmVzcG9uc2l2ZU1vZGlmaWVycyA9IChydWxlOiBhbnkpID0+IHtcbiAgbGV0IHJ1bGVzID0gW107XG5cbiAgaWYgKHJ1bGUgaW5zdGFuY2VvZiBDU1NNZWRpYVJ1bGUpIHtcbiAgICAvLyBMb29wIHRocm91Z2ggZWFjaCBDU1NSdWxlIHdpdGhpbiB0aGUgQ1NTTWVkaWFSdWxlXG4gICAgZm9yIChsZXQgaW5uZXJSdWxlIG9mIHJ1bGUuY3NzUnVsZXMpIHtcbiAgICAgIC8vIENoZWNrIGZvciBtaW4td2lkdGggaW4gbWVkaWEgcXVlcmllcyBhbmQgdGhhdCBpdCBpcyBhIHN0eWxlIHJ1bGVcbiAgICAgIGlmIChcbiAgICAgICAgcnVsZS5tZWRpYS5tZWRpYVRleHQuaW5jbHVkZXMoJ21pbi13aWR0aCcpICYmXG4gICAgICAgIGlubmVyUnVsZSBpbnN0YW5jZW9mIENTU1N0eWxlUnVsZVxuICAgICAgKSB7XG4gICAgICAgIGNvbnN0IHBhcnNlZElzU2VsZWN0b3IgPSBwYXJzZShpbm5lclJ1bGUuc2VsZWN0b3JUZXh0KTtcblxuICAgICAgICBpZiAocGFyc2VkSXNTZWxlY3Rvci50eXBlICE9PSAnU2VsZWN0b3InKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsYXN0UnVsZSA9IHBhcnNlZElzU2VsZWN0b3IucnVsZXNbMF07XG5cbiAgICAgICAgY29uc3QgY2xhc3NOYW1lczogc3RyaW5nW10gPSAoXG4gICAgICAgICAgbGFzdFJ1bGUuaXRlbXMuZmlsdGVyKFxuICAgICAgICAgICAgKGl0ZW0pID0+IGl0ZW0udHlwZSA9PT0gJ0NsYXNzTmFtZScsXG4gICAgICAgICAgKSBhcyBBc3RDbGFzc05hbWVbXVxuICAgICAgICApLm1hcCgoaXRlbSkgPT4gaXRlbS5uYW1lKTtcblxuICAgICAgICBpZiAoY2xhc3NOYW1lcy5sZW5ndGggIT09IDEpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEV4dHJhY3QgVGFpbHdpbmQgcmVzcG9uc2l2ZSBtb2RpZmllcnNcbiAgICAgICAgcnVsZXMucHVzaCh7XG4gICAgICAgICAgY2xhc3M6IGNsYXNzTmFtZXNbMF0sXG4gICAgICAgICAgcHNldWRvczogZXh0cmFjdFRhaWx3aW5kUHJlZml4ZXMoY2xhc3NOYW1lc1swXSksXG4gICAgICAgICAgY3NzVGV4dDogaW5uZXJSdWxlLnN0eWxlLmNzc1RleHQsXG4gICAgICAgICAgc3R5bGU6IGlubmVyUnVsZS5zdHlsZSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJ1bGVzO1xufTtcblxuLyoqXG4gKiBTaW5jZSBUYWlsd2luZCBDU1MgcmVzcG9uc2l2ZSBtb2RpZmllcnMgYXJlIG5vdCBDU1MgcHNldWRvIGNsYXNzZXMsIHdlIG5lZWQgdG8gZXh0cmFjdCB0aGVtIGZyb20gdGhlIGNsYXNzIG5hbWUuXG4gKiBXZSB1c2UgYSByZWdleCB0byBtYXRjaCB0aGUgcmVzcG9uc2l2ZSBwcmVmaXhlcyBhbmQgcmV0dXJuIHRoZW0gYXMgYSBzZXQuXG4gKiBAcGFyYW0gc2VsZWN0b3JUZXh0XG4gKiBAcmV0dXJucyBTZXRbcHJlZml4ZXNdXG4gKi9cbmNvbnN0IGV4dHJhY3RUYWlsd2luZFByZWZpeGVzID0gKHNlbGVjdG9yVGV4dDogc3RyaW5nKSA9PiB7XG4gIC8vIFRoaXMgcmVnZXggbWF0Y2hlcyBjbGFzc2VzIHdpdGggcmVzcG9uc2l2ZSBwcmVmaXhlcyB0aGF0IG1pZ2h0IGJlIHByZWNlZGVkIGJ5IGEgcGVyaW9kIG9yIGFub3RoZXIgY29sb25cbiAgY29uc3QgcHJlZml4UmVnZXggPSAvKD86XFxifCg/PD1bOi5dKSkoc218bWR8bGd8eGx8MnhsKVxcXFw/OltcXHctXSsvZztcbiAgY29uc3QgbWF0Y2hlcyA9IHNlbGVjdG9yVGV4dC5tYXRjaChwcmVmaXhSZWdleCkgfHwgW107XG4gIGNvbnN0IHByZWZpeGVzID0gbWF0Y2hlcy5tYXAoKG1hdGNoKSA9PiB7XG4gICAgLy8gRmluZCB0aGUgaW5kZXggb2YgdGhlIGNvbG9uIG9yIGVzY2FwZWQgY29sb25cbiAgICBjb25zdCBpbmRleCA9IG1hdGNoLmluZGV4T2YobWF0Y2guaW5jbHVkZXMoJ1xcXFw6JykgPyAnXFxcXDonIDogJzonKTtcbiAgICByZXR1cm4gbWF0Y2guc3Vic3RyaW5nKDAsIGluZGV4KTtcbiAgfSk7XG4gIHJldHVybiBbLi4ubmV3IFNldChwcmVmaXhlcyldOyAvLyBSZW1vdmUgZHVwbGljYXRlc1xufTtcblxuLyoqXG4gKiBUYWlsd2luZCBDU1MgZGFyayBtb2RlIGNsYXNzZXMgKDwgMy40LjEpIGFyZSBzcGVjaWZpZWQgdXNpbmcgdGhlIGA6aXNgIHBzZXVkbyBzZWxlY3RvciBhbmQgdGFrZSB0aGUgZm9ybVxuICogICA6aXMoLmRhcmsgLmRhcms6YmctcmVkLTIwMClcbiAqIFRoaXMgaXMgdG8gc3VwcG9ydCB0aGUgYmVoYXZpb3VyIHRoYXQgZGFyayBtb2RlIGNsYXNzZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgd2hlbiB0aGUgZGFyayBjbGFzcyBpcyBwcmVzZW50IGluIHRoZSBwYXJlbnQuXG4gKlxuICogVE9ETzogV2Ugc2hvdWxkIHN1cHBvcnQgdGhlIG5ldyBUYWlsd2luZCBDU1MgZGFyayBtb2RlIGNsYXNzZXMgaW4gMy40LjEgYW5kIGFib3ZlIHdoaWNoIGFyZSBzcGVjaWZpZWQgdXNpbmcgdGhlIGBAbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBkYXJrKWAgbWVkaWEgcXVlcnkuXG4gKiBAcGFyYW0gaXNTZWxlY3RvclN0cmluZ1xuICogQHJldHVybnNcbiAqL1xuY29uc3QgcHJvY2Vzc0lzU2VsZWN0b3JGb3JEYXJrTW9kZSA9IChcbiAgaXNTZWxlY3RvcjogQXN0U2VsZWN0b3IsXG4pOiB7IGNsYXNzOiBzdHJpbmc7IHBzZXVkb3M6IHN0cmluZ1tdIH1bXSB8IHVuZGVmaW5lZCA9PiB7XG4gIGlmIChpc1NlbGVjdG9yLnR5cGUgIT09ICdTZWxlY3RvcicpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBmaXJzdFJ1bGUgPSBpc1NlbGVjdG9yLnJ1bGVzWzBdO1xuXG4gIGNvbnN0IGNsYXNzTmFtZXMgPSAoXG4gICAgZmlyc3RSdWxlLml0ZW1zLmZpbHRlcihcbiAgICAgIChpdGVtKSA9PiBpdGVtLnR5cGUgPT09ICdDbGFzc05hbWUnLFxuICAgICkgYXMgQXN0Q2xhc3NOYW1lW11cbiAgKS5tYXAoKGl0ZW0pID0+IGl0ZW0ubmFtZSk7XG5cbiAgaWYgKGNsYXNzTmFtZXMubGVuZ3RoID09PSAwIHx8IGNsYXNzTmFtZXNbMF0gIT09ICdkYXJrJykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG5lc3RlZFJ1bGUgPSBmaXJzdFJ1bGUubmVzdGVkUnVsZTtcblxuICBpZiAoIW5lc3RlZFJ1bGUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBsZXQgZGFya01vZGVDbGFzc2VzID0gW107XG4gIGNvbnN0IG5lc3RlZENsYXNzTmFtZXMgPSAoXG4gICAgbmVzdGVkUnVsZS5pdGVtcy5maWx0ZXIoXG4gICAgICAoaXRlbSkgPT4gaXRlbS50eXBlID09PSAnQ2xhc3NOYW1lJyxcbiAgICApIGFzIEFzdENsYXNzTmFtZVtdXG4gICkubWFwKChpdGVtKSA9PiBpdGVtLm5hbWUpO1xuXG4gIGlmIChuZXN0ZWRDbGFzc05hbWVzLmxlbmd0aCA+IDEpIHtcbiAgICBjb25zb2xlLmxvZygnU2tpcHBpbmcgaXMgc2VsZWN0b3Igd2l0aCBtdWx0aXBsZSBjbGFzc2VzJywgZmlyc3RSdWxlKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBkYXJrTW9kZUNsYXNzZXMucHVzaCh7XG4gICAgY2xhc3M6IG5lc3RlZENsYXNzTmFtZXNbMF0sXG4gICAgcHNldWRvczogW1xuICAgICAgJ2RhcmsnLFxuICAgICAgLi4uKFxuICAgICAgICBuZXN0ZWRSdWxlLml0ZW1zLmZpbHRlcihcbiAgICAgICAgICAoaXRlbSkgPT4gaXRlbS50eXBlID09PSAnUHNldWRvQ2xhc3MnLFxuICAgICAgICApIGFzIEFzdFBzZXVkb0NsYXNzW11cbiAgICAgICkubWFwKChwKSA9PiBwLm5hbWUpLFxuICAgIF0sXG4gIH0pO1xuXG4gIHJldHVybiBkYXJrTW9kZUNsYXNzZXM7XG59O1xuXG5leHBvcnQgY29uc3Qgc2V0TW9kaWZpZXJzRm9yU2VsZWN0ZWRFbGVtZW50ID0gKFxuICBwYXJlbnRQb3J0OiBhbnksXG4gIG1vZGlmaWVyczogc3RyaW5nW10sXG4gIHNlbGVjdGVkRWxlbWVudEtleTogc3RyaW5nLFxuKSA9PiB7XG4gIC8vIFJlbW92ZSBhbGwgZXhpc3RpbmcgZm9yY2UgY2xhc3NlcyBmcm9tIGVudGlyZSBkb2N1bWVudFxuICBjb25zdCBhbGxFbGVtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tjbGFzcyo9XCJ0ZW1wby1mb3JjZS1cIl0nKTtcbiAgYWxsRWxlbWVudHMuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgIGNvbnN0IGNsYXNzZXMgPSBBcnJheS5mcm9tKGVsZW1lbnQuY2xhc3NMaXN0KTtcbiAgICBjbGFzc2VzLmZvckVhY2goKGNscykgPT4ge1xuICAgICAgaWYgKGNscy5zdGFydHNXaXRoKCd0ZW1wby1mb3JjZS0nKSkge1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY2xzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgY29uc3Qgc2VsZWN0ZWRFbGVtZW50ID0gVGVtcG9FbGVtZW50LmZyb21LZXkoc2VsZWN0ZWRFbGVtZW50S2V5KTtcblxuICBpZiAoc2VsZWN0ZWRFbGVtZW50LmlzRW1wdHkoKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHNlbGVjdGVkRG9tRWxlbWVudDogYW55ID0gJChcbiAgICBgLiR7RUxFTUVOVF9LRVlfUFJFRklYfSR7c2VsZWN0ZWRFbGVtZW50LmdldEtleSgpfWAsXG4gICkuZ2V0KDApO1xuXG4gIGlmICghc2VsZWN0ZWREb21FbGVtZW50KSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgbW9kaWZpZXJzLmZvckVhY2goKG1vZGlmaWVyKSA9PiB7XG4gICAgc2VsZWN0ZWREb21FbGVtZW50LmNsYXNzTGlzdC5hZGQoJ3RlbXBvLWZvcmNlLScgKyBtb2RpZmllcik7XG4gIH0pO1xufTtcblxuZXhwb3J0IGNvbnN0IHByb2Nlc3NSdWxlc0ZvclNlbGVjdGVkRWxlbWVudCA9IChcbiAgcGFyZW50UG9ydDogYW55LFxuICBjc3NFbGVtZW50TG9va3VwOiBhbnksXG4gIHNlbGVjdGVkRWxlbWVudEtleTogc3RyaW5nLFxuKSA9PiB7XG4gIC8vIFRPRE86IHRoaXMgd2hvbGUgZnVuY3Rpb24gaXMgc2xvdywgZml4XG4gIGlmICghY3NzRWxlbWVudExvb2t1cCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHNlbGVjdGVkRWxlbWVudCA9IFRlbXBvRWxlbWVudC5mcm9tS2V5KHNlbGVjdGVkRWxlbWVudEtleSk7XG4gIGlmIChzZWxlY3RlZEVsZW1lbnQuaXNFbXB0eSgpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc2VsZWN0ZWREb21FbGVtZW50OiBhbnkgPSAkKFxuICAgIGAuJHtFTEVNRU5UX0tFWV9QUkVGSVh9JHtzZWxlY3RlZEVsZW1lbnQuZ2V0S2V5KCl9YCxcbiAgKS5nZXQoMCk7XG5cbiAgY29uc3QgbXVsdGlTZWxlY3RlZEVsZW1lbnRLZXlzOiBzdHJpbmdbXSA9XG4gICAgZ2V0TWVtb3J5U3RvcmFnZUl0ZW0oTVVMVElfU0VMRUNURURfRUxFTUVOVF9LRVlTKSB8fCBbXTtcblxuICAvKipcbiAgICogSWYgdGhlcmUncyBubyBzZWxlY3RlZCBET00gZWxlbWVudCB5ZXQsIGl0IGltcGxpZXMgdGhlIG5hdiB0cmVlIGlzbid0IGJ1aWx0IHlldC5cbiAgICogV2UgcmVnaXN0ZXIgYSBjYWxsYmFjayB0byBkZWZlciB0aGUgcHJvY2Vzc2luZyBvZiB0aGUgcnVsZXMgdW50aWwgdGhlIG5hdiB0cmVlIGlzIGJ1aWx0LlxuICAgKi9cbiAgaWYgKCFzZWxlY3RlZERvbUVsZW1lbnQpIHtcbiAgICBhZGROYXZUcmVlQnVpbHRDYWxsYmFjayh7XG4gICAgICBjYWxsYmFja0ZuOiAoKSA9PiB7XG4gICAgICAgIHByb2Nlc3NSdWxlc0ZvclNlbGVjdGVkRWxlbWVudChcbiAgICAgICAgICBwYXJlbnRQb3J0LFxuICAgICAgICAgIGNzc0VsZW1lbnRMb29rdXAsXG4gICAgICAgICAgc2VsZWN0ZWRFbGVtZW50S2V5LFxuICAgICAgICApO1xuICAgICAgfSxcbiAgICAgIHN0YXRlOiB7XG4gICAgICAgIHNlbGVjdGVkRWxlbWVudEtleTogc2VsZWN0ZWRFbGVtZW50S2V5LFxuICAgICAgICBtdWx0aVNlbGVjdGVkRWxlbWVudEtleXM6IG11bHRpU2VsZWN0ZWRFbGVtZW50S2V5cyxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbmV3UHJvY2Vzc2VkQ3NzUnVsZXM6IENzc1J1bGVbXSA9IFtdO1xuICBjb25zdCBleHRyYWN0ZWRLbm93bkNsYXNzZXMgPSBuZXcgU2V0KCk7XG4gIGNvbnN0IGtub3duU2VsZWN0b3JzID0gbmV3IFNldCgpO1xuXG4gIC8vIEZpcnN0IGdldCB0aGUgaW5saW5lIHN0eWxlIG9mIHRoZSBlbGVtZW50XG4gIGNvbnN0IGlubGluZVN0eWxlUnVsZTogQ3NzUnVsZSA9IHtcbiAgICBmaWxlbmFtZTogJycsXG4gICAgc2VsZWN0b3I6ICdlbGVtZW50LnN0eWxlJyxcbiAgICBzb3VyY2U6IHt9LFxuICAgIHN0eWxlczoge30sXG4gICAgYXBwbGllZDogdHJ1ZSxcbiAgICBjb2RlYmFzZUlkOiAnZWxlbWVudC5zdHlsZScsXG4gICAgcmVtb3ZhYmxlOiBmYWxzZSxcbiAgICBhbGxvd0NoYW5nZXM6IHRydWUsXG4gIH07XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0ZWREb21FbGVtZW50Py5zdHlsZT8ubGVuZ3RoIHx8IDA7IGkrKykge1xuICAgIGNvbnN0IGNzc05hbWUgPSBzZWxlY3RlZERvbUVsZW1lbnQuc3R5bGVbaV07XG5cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaW5saW5lU3R5bGVSdWxlLnN0eWxlc1tjc3NOYW1lXSA9IHNlbGVjdGVkRG9tRWxlbWVudC5zdHlsZVtjc3NOYW1lXTtcbiAgfVxuICBuZXdQcm9jZXNzZWRDc3NSdWxlcy5wdXNoKGlubGluZVN0eWxlUnVsZSk7XG5cbiAgLy8gT25seSBjaGVjayB0aGUgaW5saW5lLXN0eWxlcyBvZiB0aGUgcGFyZW50IG9uY2VcbiAgbGV0IGNoZWNrZWRJbmxpbmVTdHlsZXNPZlBhcmVudCA9IGZhbHNlO1xuICBjb25zdCBkaXJlY3RNYXRjaENzc1J1bGVzOiBDc3NSdWxlW10gPSBbXTtcbiAgY29uc3Qgb3RoZXJDc3NSdWxlczogQ3NzUnVsZVtdID0gW107XG5cbiAgT2JqZWN0LmtleXMoY3NzRWxlbWVudExvb2t1cCkuZm9yRWFjaCgoY29kZWJhc2VJZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgY3NzUnVsZSA9IGNzc0VsZW1lbnRMb29rdXBbY29kZWJhc2VJZF07XG5cbiAgICBrbm93blNlbGVjdG9ycy5hZGQoY3NzUnVsZS5zZWxlY3Rvcik7XG5cbiAgICBpZiAoIWlzQ3NzU2VsZWN0b3JWYWxpZChjc3NSdWxlLnNlbGVjdG9yKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGdldEFsbENsYXNzZXNGcm9tU2VsZWN0b3IoY3NzUnVsZS5zZWxlY3RvcikuZm9yRWFjaCgoY2xzOiBzdHJpbmcpID0+IHtcbiAgICAgIGV4dHJhY3RlZEtub3duQ2xhc3Nlcy5hZGQoY2xzKTtcbiAgICB9KTtcblxuICAgIC8vIEZpcnN0IGNoZWNrIGlmIGEgcnVsZSBkaXJlY3RseSBtYXRjaGVzXG4gICAgaWYgKFxuICAgICAgaXNDc3NTZWxlY3RvclZhbGlkKGNzc1J1bGUuc2VsZWN0b3IpICYmXG4gICAgICBzZWxlY3RlZERvbUVsZW1lbnQ/Lm1hdGNoZXMoY3NzUnVsZS5zZWxlY3RvcilcbiAgICApIHtcbiAgICAgIGRpcmVjdE1hdGNoQ3NzUnVsZXMucHVzaCh7XG4gICAgICAgIC4uLmNzc1J1bGUsXG4gICAgICAgIGFwcGxpZWQ6IHRydWUsXG4gICAgICAgIGFsbG93Q2hhbmdlczogdHJ1ZSxcbiAgICAgICAgcmVtb3ZhYmxlOiBjYW5SZW1vdmVDc3NDbGFzc0Zyb21FbGVtZW50KFxuICAgICAgICAgIGNzc1J1bGUuc2VsZWN0b3IsXG4gICAgICAgICAgc2VsZWN0ZWREb21FbGVtZW50LFxuICAgICAgICApLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSW4gb3JkZXIgdG8gbWFrZSB0aGUgcGFyZW50RWxlbWVudC5zdHlsZSBzZWxlY3RvciB1bmlxdWVcbiAgICBsZXQgcGFyZW50RWxlbWVudEluZGV4ID0gMDtcblxuICAgIC8vIFRoZW4gY2hlY2sgdGhlIHBhcmVudHMgaWYgaXQncyBhIHJ1bGUgd2l0aCBwcm9wZXJ0aWVzIHRoYXQgYXJlIGluaGVyaXRlZFxuICAgIGxldCBwYXJlbnREb21FbGVtZW50OiBhbnkgPSBzZWxlY3RlZERvbUVsZW1lbnQ/LnBhcmVudEVsZW1lbnQ7XG4gICAgY29uc3QgaW5oZXJpdGVkU3R5bGVzOiBhbnkgPSB7fTtcbiAgICB3aGlsZSAocGFyZW50RG9tRWxlbWVudCkge1xuICAgICAgLy8gSW5saW5lIHN0eWxlcyBhcmUgcHJpb3JpdGl6ZWQgb3ZlciBydWxlIGJhc2VkIHN0eWxlc1xuICAgICAgaWYgKCFjaGVja2VkSW5saW5lU3R5bGVzT2ZQYXJlbnQpIHtcbiAgICAgICAgY29uc3QgaW5saW5lU3R5bGVPZlBhcmVudDogYW55ID0ge307XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFyZW50RG9tRWxlbWVudD8uc3R5bGU/Lmxlbmd0aCB8fCAwOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBjc3NOYW1lOiBzdHJpbmcgPSBwYXJlbnREb21FbGVtZW50LnN0eWxlW2ldO1xuICAgICAgICAgIGlmIChJTkhFUklUQUJMRV9DU1NfUFJPUFNbY3NzTmFtZV0pIHtcbiAgICAgICAgICAgIGlubGluZVN0eWxlT2ZQYXJlbnRbY3NzTmFtZV0gPSBwYXJlbnREb21FbGVtZW50LnN0eWxlW2Nzc05hbWVdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoT2JqZWN0LmtleXMoaW5saW5lU3R5bGVPZlBhcmVudCkubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgb3RoZXJDc3NSdWxlcy5wdXNoKHtcbiAgICAgICAgICAgIGZpbGVuYW1lOiAnJyxcblxuICAgICAgICAgICAgLy8gVE9ETzogbWFrZSB0aGlzIHVuaXF1ZVxuICAgICAgICAgICAgc2VsZWN0b3I6IGBwYXJlbnRFbGVtZW50JHtwYXJlbnRFbGVtZW50SW5kZXh9LnN0eWxlYCxcbiAgICAgICAgICAgIGluaGVyaXRlZDogdHJ1ZSxcbiAgICAgICAgICAgIHNvdXJjZToge30sXG4gICAgICAgICAgICBzdHlsZXM6IGlubGluZVN0eWxlT2ZQYXJlbnQsXG4gICAgICAgICAgICBhcHBsaWVkOiB0cnVlLFxuICAgICAgICAgICAgY29kZWJhc2VJZDogYHBhcmVudEVsZW1lbnQke3BhcmVudEVsZW1lbnRJbmRleH0uc3R5bGVgLFxuICAgICAgICAgICAgcmVtb3ZhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIGFsbG93Q2hhbmdlczogZmFsc2UsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQ3NzIGRlZmluZWQgc3R5bGVzXG4gICAgICBpZiAoXG4gICAgICAgIGlzQ3NzU2VsZWN0b3JWYWxpZChjc3NSdWxlLnNlbGVjdG9yKSAmJlxuICAgICAgICAhcGFyZW50RG9tRWxlbWVudD8ubWF0Y2hlcyhjc3NSdWxlLnNlbGVjdG9yKVxuICAgICAgKSB7XG4gICAgICAgIHBhcmVudERvbUVsZW1lbnQgPSBwYXJlbnREb21FbGVtZW50LnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBPYmplY3Qua2V5cyhjc3NSdWxlPy5zdHlsZXMgfHwge30pLmZvckVhY2goKGNzc05hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAvLyBQcmlvcml0aXplIGluaGVyaXRlZCBzdHlsZXMgdGhhdCBhcmUgZnVydGhlciBkb3duIHRoZSB0cmVlXG4gICAgICAgIGlmIChcbiAgICAgICAgICBJTkhFUklUQUJMRV9DU1NfUFJPUFNbY3NzTmFtZV0gJiZcbiAgICAgICAgICBpbmhlcml0ZWRTdHlsZXNbY3NzTmFtZV0gIT09IG51bGxcbiAgICAgICAgKSB7XG4gICAgICAgICAgaW5oZXJpdGVkU3R5bGVzW2Nzc05hbWVdID0gY3NzUnVsZS5zdHlsZXNbY3NzTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBwYXJlbnREb21FbGVtZW50ID0gcGFyZW50RG9tRWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICAgICAgcGFyZW50RWxlbWVudEluZGV4ICs9IDE7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgb25jZSBhY3Jvc3MgYWxsIGNzcyBydWxlc1xuICAgIGNoZWNrZWRJbmxpbmVTdHlsZXNPZlBhcmVudCA9IHRydWU7XG5cbiAgICAvLyBKdXN0IGJlY2F1c2UgYSBjc3MgcnVsZSBpcyBpbmhlcml0ZWQgZG9lc24ndCBtZWFuIGl0IGNhbid0IGJlIGVsaWdpYmxlIHRvIGFwcGx5LFxuICAgIC8vIHNvIGRvIG5vdCByZXR1cm4gYWZ0ZXIgYXBwZW5kaW5nIHRoaXMgcnVsZVxuICAgIGlmIChPYmplY3Qua2V5cyhpbmhlcml0ZWRTdHlsZXMpLmxlbmd0aCAhPT0gMCkge1xuICAgICAgb3RoZXJDc3NSdWxlcy5wdXNoKHtcbiAgICAgICAgLi4uY3NzUnVsZSxcbiAgICAgICAgaW5oZXJpdGVkOiB0cnVlLFxuICAgICAgICBzdHlsZXM6IGluaGVyaXRlZFN0eWxlcyxcbiAgICAgICAgYXBwbGllZDogdHJ1ZSxcbiAgICAgICAgcmVtb3ZhYmxlOiBmYWxzZSxcbiAgICAgICAgYWxsb3dDaGFuZ2VzOiBmYWxzZSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEZpbmFsbHkgY2hlY2sgaWYgaXQncyBhIHJ1bGUgdGhhdCBjYW4gYmUgYXBwbGllZCBpZiBjbGFzZXMgYXJlIGNoYW5nZWRcbiAgICBvdGhlckNzc1J1bGVzLnB1c2goe1xuICAgICAgLi4uY3NzUnVsZSxcbiAgICAgIGFwcGxpZWQ6IGZhbHNlLFxuICAgICAgYWxsb3dDaGFuZ2VzOiBmYWxzZSxcbiAgICAgIGVsaWdpYmxlVG9BcHBseTogY2FuQXBwbHlDc3NSdWxlVG9FbGVtZW50KFxuICAgICAgICBjc3NSdWxlLnNlbGVjdG9yLFxuICAgICAgICBzZWxlY3RlZERvbUVsZW1lbnQsXG4gICAgICApLFxuICAgIH0pO1xuICB9KTtcblxuICBjb25zdCBtYWluU3R5bGVTaGVldCA9IGRvY3VtZW50LnN0eWxlU2hlZXRzWzBdO1xuXG4gIC8vIEFkZCBhbnkgcnVsZXMgbm90IHByZXZpb3VzbHkgYWRkZWQgdGhhdCBhcmUgYXZhaWxhYmxlIGluIHRoZSBzdHlsZXNoZWV0cyBhcyByZWFkLW9ubHlcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkb2N1bWVudC5zdHlsZVNoZWV0cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgIGNvbnN0IHNoZWV0ID0gZG9jdW1lbnQuc3R5bGVTaGVldHNbaV07XG5cbiAgICBsZXQgcnVsZXMgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICBydWxlcyA9IHNoZWV0LmNzc1J1bGVzO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcnVsZXMgPSBzaGVldC5ydWxlcztcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFydWxlcykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBydWxlcy5sZW5ndGg7IGogKz0gMSkge1xuICAgICAgY29uc3QgcnVsZTogYW55ID0gcnVsZXNbal07XG5cbiAgICAgIC8qKlxuICAgICAgICogSGFuZGxlIFRhaWx3aW5kIENTUyByZXNwb25zaXZlIG1vZGlmaWVyc1xuICAgICAgICovXG4gICAgICBjb25zdCByZXNwb25zaXZlTW9kaWZpZXJzID1cbiAgICAgICAgcHJvY2Vzc01lZGlhUXVlcnlSdWxlc0ZvclJlc3BvbnNpdmVNb2RpZmllcnMocnVsZSk7XG5cbiAgICAgIGlmIChyZXNwb25zaXZlTW9kaWZpZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCByZXNwb25zaXZlTW9kaWZpZXJzLmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgY29uc3QgbW9kaWZpZXIgPSByZXNwb25zaXZlTW9kaWZpZXJzW2tdO1xuXG4gICAgICAgICAgaWYgKCFzZWxlY3RlZERvbUVsZW1lbnQ/Lm1hdGNoZXMoJy4nICsgQ1NTLmVzY2FwZShtb2RpZmllci5jbGFzcykpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBzdHlsaW5nOiBhbnkgPSB7fTtcblxuICAgICAgICAgIGZvciAobGV0IGwgPSAwOyBsIDwgbW9kaWZpZXI/LnN0eWxlPy5sZW5ndGggfHwgMDsgbCArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBjc3NOYW1lID0gbW9kaWZpZXI/LnN0eWxlW2xdO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZTtcbiAgICAgICAgICAgIHN0eWxpbmdbY3NzTmFtZV0gPSBtb2RpZmllcj8uc3R5bGVbY3NzTmFtZV07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgcnVsZVRvUHVzaDogQ3NzUnVsZSA9IHtcbiAgICAgICAgICAgIGZpbGVuYW1lOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBzZWxlY3RvcjogQ1NTLmVzY2FwZSgnLicgKyBtb2RpZmllci5jbGFzcyksXG4gICAgICAgICAgICBjbGFzc1BhcnNlZDogbW9kaWZpZXIuY2xhc3MsXG4gICAgICAgICAgICBzb3VyY2U6IHt9LFxuICAgICAgICAgICAgc3R5bGVzOiBzdHlsaW5nLFxuICAgICAgICAgICAgYXBwbGllZDogdHJ1ZSxcbiAgICAgICAgICAgIG1vZGlmaWVyczoge1xuICAgICAgICAgICAgICAuLi5tb2RpZmllci5wc2V1ZG9zLnJlZHVjZSgoYWNjOiBhbnksIHBzZXVkbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgYWNjW3BzZXVkb10gPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICAgIH0sIHt9KSxcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIEdlbmVyYXRlIGEgcmFuZG9tIGNvZGViYXNlIElEIHRvIHVzZSBmb3Igc2VsZWN0aW9uXG4gICAgICAgICAgICAvLyBOb3RlOiB0aGlzIElEIGlzIHNob3duIGFzIGEgYmFja3VwIGluIHRoZSBvdmVycmlkZGVuIHRvb2x0aXBcbiAgICAgICAgICAgIGNvZGViYXNlSWQ6IGAke21vZGlmaWVyLmNsYXNzfSAke3V1aWR2NCgpLnRvU3RyaW5nKCl9YCxcbiAgICAgICAgICAgIHJlbW92YWJsZTogZmFsc2UsXG4gICAgICAgICAgICBhbGxvd0NoYW5nZXM6IGZhbHNlLFxuICAgICAgICAgICAgY3NzVGV4dDogbW9kaWZpZXIuY3NzVGV4dCxcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgZGlyZWN0TWF0Y2hDc3NSdWxlcy5wdXNoKHJ1bGVUb1B1c2gpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghcnVsZS5zZWxlY3RvclRleHQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChrbm93blNlbGVjdG9ycy5oYXMocnVsZS5zZWxlY3RvclRleHQpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwYXJzZWRDc3NSdWxlID0gcGFyc2UocnVsZS5zZWxlY3RvclRleHQpO1xuXG4gICAgICBpZiAocGFyc2VkQ3NzUnVsZS50eXBlICE9PSAnU2VsZWN0b3InKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBmaXJzdFJ1bGUgPSBwYXJzZWRDc3NSdWxlLnJ1bGVzWzBdO1xuXG4gICAgICBpZiAoIWZpcnN0UnVsZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBUaGlzIGlzIGEgc3BlY2lhbCBjYXNlIGZvciB0aGUgYDppc2AgcHNldWRvIHNlbGVjdG9yLCB3aGljaCBpcyBob3cgVGFpbHdpbmQgc3BlY2lmaWVzIGRhcmsgbW9kZSBjbGFzc2VzLlxuICAgICAgICovXG4gICAgICBjb25zdCBjbGFzc05hbWVzID0gKFxuICAgICAgICBmaXJzdFJ1bGUuaXRlbXMuZmlsdGVyKFxuICAgICAgICAgIChpdGVtKSA9PiBpdGVtLnR5cGUgPT09ICdDbGFzc05hbWUnLFxuICAgICAgICApIGFzIEFzdENsYXNzTmFtZVtdXG4gICAgICApLm1hcCgoaXRlbSkgPT4gaXRlbS5uYW1lKTtcblxuICAgICAgY29uc3QgcHNldWRvcyA9IGZpcnN0UnVsZS5pdGVtcy5maWx0ZXIoXG4gICAgICAgIChpdGVtKSA9PiBpdGVtLnR5cGUgPT09ICdQc2V1ZG9DbGFzcycsXG4gICAgICApIGFzIEFzdFBzZXVkb0NsYXNzW107XG5cbiAgICAgIC8vIFRPRE86IEFkZCBzdXBwb3J0IGZvciBodHRwczovL2dpdGh1Yi5jb20vdGFpbHdpbmRsYWJzL3RhaWx3aW5kY3NzL3B1bGwvMTMzNzkgKH4zLjQuNClcbiAgICAgIGlmIChcbiAgICAgICAgY2xhc3NOYW1lcy5sZW5ndGggPT09IDAgJiZcbiAgICAgICAgcHNldWRvcy5sZW5ndGggPT09IDEgJiZcbiAgICAgICAgcHNldWRvc1swXS5uYW1lID09PSAnaXMnXG4gICAgICApIHtcbiAgICAgICAgY29uc3QgcHNldWRvID0gcHNldWRvc1swXTtcbiAgICAgICAgaWYgKHBzZXVkbyAmJiBwc2V1ZG8uYXJndW1lbnQ/LnR5cGUgPT09ICdTZWxlY3RvcicpIHtcbiAgICAgICAgICBjb25zdCBkYXJrTW9kZUNsYXNzZXMgPSBwcm9jZXNzSXNTZWxlY3RvckZvckRhcmtNb2RlKHBzZXVkby5hcmd1bWVudCk7XG5cbiAgICAgICAgICBpZiAoZGFya01vZGVDbGFzc2VzKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGRhcmtNb2RlQ2xhc3Mgb2YgZGFya01vZGVDbGFzc2VzKSB7XG4gICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAhc2VsZWN0ZWREb21FbGVtZW50Py5tYXRjaGVzKFxuICAgICAgICAgICAgICAgICAgJy4nICsgQ1NTLmVzY2FwZShkYXJrTW9kZUNsYXNzLmNsYXNzKSxcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3Qgc3R5bGluZzogYW55ID0ge307XG4gICAgICAgICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgcnVsZT8uc3R5bGU/Lmxlbmd0aCB8fCAwOyBrICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjc3NOYW1lID0gcnVsZS5zdHlsZVtrXTtcbiAgICAgICAgICAgICAgICBzdHlsaW5nW2Nzc05hbWVdID0gcnVsZS5zdHlsZVtjc3NOYW1lXTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IHJ1bGVUb1B1c2g6IENzc1J1bGUgPSB7XG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICBzZWxlY3RvcjogQ1NTLmVzY2FwZSgnLicgKyBkYXJrTW9kZUNsYXNzLmNsYXNzKSxcbiAgICAgICAgICAgICAgICBjbGFzc1BhcnNlZDogZGFya01vZGVDbGFzcy5jbGFzcyxcbiAgICAgICAgICAgICAgICBzb3VyY2U6IHt9LFxuICAgICAgICAgICAgICAgIHN0eWxlczogc3R5bGluZyxcbiAgICAgICAgICAgICAgICBhcHBsaWVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIG1vZGlmaWVyczoge1xuICAgICAgICAgICAgICAgICAgLi4uZGFya01vZGVDbGFzcy5wc2V1ZG9zLnJlZHVjZSgoYWNjOiBhbnksIHBzZXVkbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFjY1twc2V1ZG9dID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgICAgICAgIH0sIHt9KSxcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgLy8gR2VuZXJhdGUgYSByYW5kb20gY29kZWJhc2UgSUQgdG8gdXNlIGZvciBzZWxlY3Rpb25cbiAgICAgICAgICAgICAgICAvLyBOb3RlOiB0aGlzIElEIGlzIHNob3duIGFzIGEgYmFja3VwIGluIHRoZSBvdmVycmlkZGVuIHRvb2x0aXBcbiAgICAgICAgICAgICAgICBjb2RlYmFzZUlkOiBgJHtydWxlLnNlbGVjdG9yVGV4dH0gJHt1dWlkdjQoKS50b1N0cmluZygpfWAsXG4gICAgICAgICAgICAgICAgcmVtb3ZhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBhbGxvd0NoYW5nZXM6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGNzc1RleHQ6IHJ1bGUuc3R5bGUuY3NzVGV4dCxcbiAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICBkaXJlY3RNYXRjaENzc1J1bGVzLnB1c2gocnVsZVRvUHVzaCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjbGFzc05hbWVzLmxlbmd0aCA9PT0gMCB8fCBjbGFzc05hbWVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNscyA9IGNsYXNzTmFtZXNbMF07XG4gICAgICBjb25zdCBwc2V1ZG9DbGFzc2VzID0gKFxuICAgICAgICBmaXJzdFJ1bGUuaXRlbXMuZmlsdGVyKFxuICAgICAgICAgIChpdGVtKSA9PiBpdGVtLnR5cGUgPT09ICdQc2V1ZG9DbGFzcycsXG4gICAgICAgICkgYXMgQXN0UHNldWRvQ2xhc3NbXVxuICAgICAgKS5tYXAoKHApID0+IHAubmFtZSk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChzZWxlY3RlZERvbUVsZW1lbnQ/Lm1hdGNoZXMoJy4nICsgQ1NTLmVzY2FwZShjbHMpKSkge1xuICAgICAgICAgIGNvbnN0IHN0eWxpbmc6IGFueSA9IHt9O1xuICAgICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgcnVsZT8uc3R5bGU/Lmxlbmd0aCB8fCAwOyBrICs9IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGNzc05hbWUgPSBydWxlLnN0eWxlW2tdO1xuICAgICAgICAgICAgc3R5bGluZ1tjc3NOYW1lXSA9IHJ1bGUuc3R5bGVbY3NzTmFtZV07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZGlyZWN0TWF0Y2hDc3NSdWxlcy5wdXNoKHtcbiAgICAgICAgICAgIGZpbGVuYW1lOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBzZWxlY3RvcjogcnVsZS5zZWxlY3RvclRleHQsXG4gICAgICAgICAgICBjbGFzc1BhcnNlZDogY2xzLFxuICAgICAgICAgICAgc291cmNlOiB7fSxcbiAgICAgICAgICAgIHN0eWxlczogc3R5bGluZyxcbiAgICAgICAgICAgIGFwcGxpZWQ6IHRydWUsXG4gICAgICAgICAgICBtb2RpZmllcnM6IHtcbiAgICAgICAgICAgICAgLi4ucHNldWRvQ2xhc3Nlcy5yZWR1Y2UoKGFjYzogYW55LCBwc2V1ZG86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGFjY1twc2V1ZG8ubmFtZV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICAgIH0sIHt9KSxcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIEdlbmVyYXRlIGEgcmFuZG9tIGNvZGViYXNlIElEIHRvIHVzZSBmb3Igc2VsZWN0aW9uXG4gICAgICAgICAgICAvLyBOb3RlOiB0aGlzIElEIGlzIHNob3duIGFzIGEgYmFja3VwIGluIHRoZSBvdmVycmlkZGVuIHRvb2x0aXBcbiAgICAgICAgICAgIGNvZGViYXNlSWQ6IGAke3J1bGUuc2VsZWN0b3JUZXh0fSAke3V1aWR2NCgpLnRvU3RyaW5nKCl9YCxcbiAgICAgICAgICAgIHJlbW92YWJsZTogZmFsc2UsXG4gICAgICAgICAgICBhbGxvd0NoYW5nZXM6IGZhbHNlLFxuICAgICAgICAgICAgY3NzVGV4dDogcnVsZS5zdHlsZS5jc3NUZXh0LFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiTk8gTUFUQ0hcIiwgY2xzKVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gRm9yIGVhY2ggZGlyZWN0IG1hdGNoIHJ1bGUsIGNoZWNrIGlmIGl0IGhhcyBtb2RpZmllcnMgYW5kIGNyZWF0ZSBhIG5ldyBydWxlIGZvciBlYWNoIG1vZGlmaWVyLlxuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdE1hdGNoQ3NzUnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjdXJyZW50UnVsZSA9IGRpcmVjdE1hdGNoQ3NzUnVsZXNbaV07XG4gICAgaWYgKCFjdXJyZW50UnVsZS5tb2RpZmllcnMpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHJ1bGVQc2V1ZG9zID0gT2JqZWN0LmtleXMoY3VycmVudFJ1bGUubW9kaWZpZXJzKTtcblxuICAgIGlmIChydWxlUHNldWRvcy5sZW5ndGggPCAxKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBjbHMgPSBjdXJyZW50UnVsZS5jbGFzc1BhcnNlZDtcblxuICAgIGlmICghY2xzKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBjc3NUZXh0ID0gY3VycmVudFJ1bGUuY3NzVGV4dDtcblxuICAgIGlmICghY3NzVGV4dCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGEgbmV3IGN1c3RvbSBjc3MgcnVsZSBmb3Igb25lcyB0aGF0IGhhdmUgcHNldWRvIHNlbGVjdG9ycy5cbiAgICAvLyBVc2UgdGhlIHBhcnNlQ2xhc3MgYXMgdGhlIHNlbGVjdG9yIGFuZCBhZGQgYHRlbXBvLWZvcmNlLVtwc2V1ZG9dYCBmb3IgZWFjaCBwc2V1ZG8gc2VsZWN0b3JcbiAgICBjb25zdCBwc2V1ZG9TZWxlY3RvciA9IHJ1bGVQc2V1ZG9zXG4gICAgICAubWFwKChwc2V1ZG86IHN0cmluZykgPT4gJy50ZW1wby1mb3JjZS0nICsgcHNldWRvKVxuICAgICAgLmpvaW4oJycpO1xuICAgIGNvbnN0IG5ld1NlbGVjdG9yID0gJy4nICsgQ1NTLmVzY2FwZShjbHMpICsgcHNldWRvU2VsZWN0b3I7XG4gICAgY29uc3QgbmV3UnVsZXMgPSBjc3NUZXh0O1xuXG4gICAgLy8gLy8gSW5qZWN0IG5ldyBydWxlIGludG8gdGhlIHN0eWxlc2hlZXRcbiAgICBhZGRDU1NSdWxlKFxuICAgICAgbWFpblN0eWxlU2hlZXQsXG4gICAgICBuZXdTZWxlY3RvcixcbiAgICAgIG5ld1J1bGVzLFxuICAgICAgbWFpblN0eWxlU2hlZXQuY3NzUnVsZXMubGVuZ3RoLFxuICAgICk7XG4gIH1cblxuICBjb25zdCBuZXdMaXN0ID0gbmV3UHJvY2Vzc2VkQ3NzUnVsZXNcbiAgICAuY29uY2F0KFxuICAgICAgZGlyZWN0TWF0Y2hDc3NSdWxlcy5zb3J0KChhOiBhbnksIGI6IGFueSkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiAtY3NzU3BlY2lmaWNpdHlDb21wYXJlKGEuc2VsZWN0b3IsIGIuc2VsZWN0b3IpO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAvLyBQdXQgdGhlIGludmFsaWQgZWxlbWVudHMgYXQgdGhlIGVuZFxuICAgICAgICAgIGxldCBhVmFsaWQgPSB0cnVlO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjc3NTcGVjaWZpY2l0eUNvbXBhcmUoYS5zZWxlY3RvciwgJ2JvZHknKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBhVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgYlZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY3NzU3BlY2lmaWNpdHlDb21wYXJlKGIuc2VsZWN0b3IsICdib2R5Jyk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgYlZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGFWYWxpZCAmJiAhYlZhbGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFhVmFsaWQgJiYgYlZhbGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgKVxuICAgIC5jb25jYXQob3RoZXJDc3NSdWxlcyk7XG5cbiAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSh7XG4gICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5QUk9DRVNTRURfQ1NTX1JVTEVTX0ZPUl9FTEVNRU5ULFxuICAgIHByb2Nlc3NlZENzc1J1bGVzOiBuZXdMaXN0LFxuICB9KTtcbn07XG5cbmV4cG9ydCBjb25zdCBjc3NFdmFsID0gKGVsZW1lbnQ6IGFueSwgcHJvcGVydHk6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gIHJldHVybiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50LCBudWxsKS5nZXRQcm9wZXJ0eVZhbHVlKHByb3BlcnR5KTtcbn07XG5cbmV4cG9ydCBjb25zdCBnZXRDc3NFdmFscyA9IChwYXJlbnRQb3J0OiBhbnksIHNlbGVjdGVkRWxlbWVudEtleTogc3RyaW5nKSA9PiB7XG4gIGxldCBjc3NFdmFsczogYW55ID0ge307XG5cbiAgY29uc3Qgc2VsZWN0ZEVsZW1lbnQgPSBUZW1wb0VsZW1lbnQuZnJvbUtleShzZWxlY3RlZEVsZW1lbnRLZXkpO1xuXG4gIGlmIChzZWxlY3RkRWxlbWVudC5pc0VtcHR5KCkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzZWxlY3RlZERvbUVsZW1lbnQgPSAkKFxuICAgIGAuJHtFTEVNRU5UX0tFWV9QUkVGSVh9JHtzZWxlY3RkRWxlbWVudC5nZXRLZXkoKX1gLFxuICApLmdldCgwKTtcblxuICBpZiAoIXNlbGVjdGVkRG9tRWxlbWVudCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIENTU19WQUxVRVNfVE9fQ09MTEVDVC5mb3JFYWNoKChjc3NOYW1lOiBzdHJpbmcpID0+IHtcbiAgICBjc3NFdmFsc1tjc3NOYW1lXSA9IGNzc0V2YWwoc2VsZWN0ZWREb21FbGVtZW50LCBjc3NOYW1lKTtcbiAgfSk7XG5cbiAgY29uc3QgcGFyZW50Q3NzRXZhbHM6IGFueSA9IHt9O1xuXG4gIGNvbnN0IHBhcmVudEVsZW1lbnQgPSBzZWxlY3RlZERvbUVsZW1lbnQucGFyZW50RWxlbWVudDtcblxuICBpZiAocGFyZW50RWxlbWVudCkge1xuICAgIENTU19WQUxVRVNfVE9fQ09MTEVDVF9GT1JfUEFSRU5ULmZvckVhY2goKGNzc05hbWU6IHN0cmluZykgPT4ge1xuICAgICAgcGFyZW50Q3NzRXZhbHNbY3NzTmFtZV0gPSBjc3NFdmFsKFxuICAgICAgICBzZWxlY3RlZERvbUVsZW1lbnQucGFyZW50RWxlbWVudCxcbiAgICAgICAgY3NzTmFtZSxcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICAvLyBVc2UgalF1ZXJ5IHRvIGNoZWNrIGlmICdkYXJrJyBjbGFzcyBpcyBpbiBhbnkgYW5jZXN0b3Igb2YgdGhlIHBhcmVudCBlbGVtZW50XG4gICAgbGV0IGRhcmtFbmFibGVkSW5QYXJlbnQgPVxuICAgICAgJChgLiR7RUxFTUVOVF9LRVlfUFJFRklYfSR7c2VsZWN0ZEVsZW1lbnQuZ2V0S2V5KCl9YCkuY2xvc2VzdCgnLmRhcmsnKVxuICAgICAgICAubGVuZ3RoID4gMDtcblxuICAgIHBhcmVudENzc0V2YWxzWydkYXJrRW5hYmxlZEluUGFyZW50J10gPSBkYXJrRW5hYmxlZEluUGFyZW50O1xuICB9XG5cbiAgY3NzRXZhbHNbJ3BhcmVudCddID0gcGFyZW50Q3NzRXZhbHM7XG5cbiAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSh7XG4gICAgaWQ6IEZJWEVEX0lGUkFNRV9NRVNTQUdFX0lEUy5DU1NfRVZBTFNfRk9SX0VMRU1FTlQsXG4gICAgY3NzRXZhbHMsXG4gIH0pO1xufTtcblxuZXhwb3J0IGNvbnN0IGdldEVsZW1lbnRDbGFzc0xpc3QgPSAoXG4gIHBhcmVudFBvcnQ6IGFueSxcbiAgc2VsZWN0ZWRFbGVtZW50S2V5OiBzdHJpbmcsXG4pID0+IHtcbiAgY29uc3Qgc2VsZWN0ZEVsZW1lbnQgPSBUZW1wb0VsZW1lbnQuZnJvbUtleShzZWxlY3RlZEVsZW1lbnRLZXkpO1xuXG4gIGlmIChzZWxlY3RkRWxlbWVudC5pc0VtcHR5KCkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzZWxlY3RlZERvbUVsZW1lbnQgPSAkKFxuICAgIGAuJHtFTEVNRU5UX0tFWV9QUkVGSVh9JHtzZWxlY3RkRWxlbWVudC5nZXRLZXkoKX1gLFxuICApLmdldCgwKTtcblxuICBpZiAoIXNlbGVjdGVkRG9tRWxlbWVudCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHBhcmVudFBvcnQucG9zdE1lc3NhZ2Uoe1xuICAgIGlkOiBGSVhFRF9JRlJBTUVfTUVTU0FHRV9JRFMuRUxFTUVOVF9DTEFTU19MSVNULFxuICAgIGNsYXNzTGlzdDogQXJyYXkuZnJvbShzZWxlY3RlZERvbUVsZW1lbnQuY2xhc3NMaXN0KSxcbiAgfSk7XG59O1xuXG5leHBvcnQgY29uc3QgcnVsZU1hdGNoZXNFbGVtZW50ID0gKFxuICBwYXJlbnRQb3J0OiBhbnksXG4gIG1lc3NhZ2VJZDogc3RyaW5nLFxuICBydWxlOiBzdHJpbmcsXG4gIHNlbGVjdGVkRWxlbWVudEtleTogc3RyaW5nLFxuKSA9PiB7XG4gIGlmICghcnVsZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHNlbGVjdGRFbGVtZW50ID0gVGVtcG9FbGVtZW50LmZyb21LZXkoc2VsZWN0ZWRFbGVtZW50S2V5KTtcblxuICBpZiAoc2VsZWN0ZEVsZW1lbnQuaXNFbXB0eSgpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc2VsZWN0ZWREb21FbGVtZW50ID0gJChcbiAgICBgLiR7RUxFTUVOVF9LRVlfUFJFRklYfSR7c2VsZWN0ZEVsZW1lbnQuZ2V0S2V5KCl9YCxcbiAgKS5nZXQoMCk7XG5cbiAgaWYgKCFzZWxlY3RlZERvbUVsZW1lbnQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICBpZDogbWVzc2FnZUlkLFxuICAgIG1hdGNoZXM6IHNlbGVjdGVkRG9tRWxlbWVudD8ubWF0Y2hlcyhydWxlKSxcbiAgfSk7XG59O1xuIl19