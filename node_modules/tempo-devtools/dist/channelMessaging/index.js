"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initChannelMessaging = void 0;
// KEEP THIS IN SYNC WITH sessionStorageUtils.*.tsx
const resqUtils_1 = require("./resqUtils");
const lz_string_1 = __importDefault(require("lz-string"));
const posthog_js_1 = __importDefault(require("../posthog.js"));
const channelMessagingFunctions_1 = require("./channelMessagingFunctions");
// For vite only, show errors in the browser
if (typeof window !== 'undefined' &&
    window.location.href.includes('framework=VITE')) {
    const showErrorOverlay = (err) => {
        // must be within function call because that's when the element is defined for sure.
        const ErrorOverlay = customElements.get('vite-error-overlay');
        // don't open outside vite environment
        if (!ErrorOverlay) {
            return;
        }
        const overlay = new ErrorOverlay(err);
        document.body.appendChild(overlay);
    };
    window.addEventListener('error', showErrorOverlay);
    window.addEventListener('unhandledrejection', ({ reason }) => showErrorOverlay(reason));
}
const debugLogInDev = (...str) => {
    var _a;
    // Only in dev
    if ((_a = window.location.search) === null || _a === void 0 ? void 0 : _a.includes('debugLog=true')) {
        console.debug(...str);
    }
};
function initChannelMessaging() {
    var _a;
    if (typeof window !== 'undefined') {
        (0, channelMessagingFunctions_1.initChannelMessagingFunctions)();
        // Only in prod
        if (window.location.hostname.endsWith('dev.tempolabs.ai') &&
            !window.location.hostname.endsWith('staging-dev.tempolabs.ai')) {
            if (posthog_js_1.default) {
                posthog_js_1.default.init();
            }
        }
    }
    if (typeof window !== 'undefined') {
        window.addEventListener('message', (event) => {
            const { data } = event;
            if (data.type === 'GET_STATE_AND_PROPS') {
                const { componentName } = data;
                // TODO: Support custom root that user provides
                let rootSelector = '#root';
                if (!document.querySelector(rootSelector)) {
                    rootSelector = '#__next';
                }
                const root = document.querySelector(rootSelector);
                const rootReactElement = (0, resqUtils_1.getRootReactElement)();
                const tree = (0, resqUtils_1.buildNodeTree)(rootReactElement, null);
                const foundNodes = (0, resqUtils_1.findElementInTree)(tree, (node) => {
                    if (componentName && node.name == componentName) {
                        return true;
                    }
                    return false;
                });
                if (!(foundNodes === null || foundNodes === void 0 ? void 0 : foundNodes.length)) {
                    const message = {
                        error: 'No component found',
                    };
                    console.log('STATE_AND_PROPS ', JSON.stringify(message));
                    return;
                }
                if (foundNodes.length > 1) {
                    console.log(foundNodes);
                    console.log('Warning: more than 1 component found');
                }
                const foundNode = foundNodes[0];
                const sendDataForNode = (node) => {
                    debugLogInDev('NODE FOUND: ', node);
                    const PROPS_TO_EXCLUDE = {
                        tempoelementid: true,
                        'data-testid': true,
                    };
                    const propsToSend = {};
                    if (node.props) {
                        Object.keys(node.props).forEach((key) => {
                            if (!PROPS_TO_EXCLUDE[key]) {
                                if (typeof node.props[key] === 'object') {
                                    propsToSend[key] = 'TEMPO_OBJECT_TYPE';
                                }
                                else if (typeof node.props[key] === 'function') {
                                    propsToSend[key] = 'TEMPO_FUNCTION_TYPE';
                                }
                                else {
                                    propsToSend[key] = node.props[key];
                                }
                            }
                        });
                    }
                    // TODO: This doesn't fully work because of this bug: https://github.com/baruchvlz/resq/issues/85
                    let stateToSend = {};
                    if (node.state) {
                        if (typeof node.state === 'string') {
                            stateToSend = {
                                state: node.state,
                            };
                        }
                        else {
                            Object.keys(node.state).forEach((key) => {
                                if (typeof node.state[key] === 'object') {
                                    stateToSend[key] = 'TEMPO_OBJECT_TYPE';
                                }
                                else if (typeof node.state[key] === 'function') {
                                    stateToSend[key] = 'TEMPO_FUNCTION_TYPE';
                                }
                                else {
                                    stateToSend[key] = node.state[key];
                                }
                            });
                        }
                    }
                    const message = {
                        id: data.id,
                        props: propsToSend,
                        state: stateToSend,
                    };
                    console.log('STATE_AND_PROPS ', JSON.stringify(message));
                };
                sendDataForNode(foundNode);
            }
        });
    }
    if (typeof window !== 'undefined') {
        if ((_a = window.location.search) === null || _a === void 0 ? void 0 : _a.includes('storyboard=true')) {
            let rootEl = document.getElementById('root');
            if (!rootEl) {
                rootEl = document.getElementById('__next');
            }
            if (rootEl) {
                if (window.location.search.includes('type=STORY') ||
                    window.location.search.includes('type=COMPONENT')) {
                    [rootEl, document.body, document.documentElement].forEach((el) => {
                        el.style.backgroundColor = 'transparent';
                        el.style.width = '100vw';
                        el.style.height = '100vh';
                        el.style.overflow = 'hidden';
                    });
                }
                else {
                    rootEl.style.width = '100vw';
                    rootEl.style.height = '100vh';
                }
            }
        }
        (function () {
            let port2 = null;
            let storyboardId = null;
            // Setup the transfered port
            const initPort = (e) => {
                if (e.data === 'init') {
                    port2 = e.ports[0];
                    port2.onmessage = onMessage;
                }
                else {
                    var msgObj = e.data;
                    onMessage({
                        data: msgObj,
                    });
                }
            };
            // Listen for the intial port transfer message
            window.addEventListener('message', initPort);
            const onInspectElement = (data) => __awaiter(this, void 0, void 0, function* () {
                if (!data.payload.componentName) {
                    console.log('NO COMPONENT NAME');
                    const message = {
                        id: data.id,
                        error: 'No component name',
                    };
                    port2.postMessage(message);
                    return;
                }
                // TODO: Support custom root that user provides
                const rootReactElement = (0, resqUtils_1.getRootReactElement)();
                const tree = (0, resqUtils_1.buildNodeTree)(rootReactElement, null);
                const { isComponent, componentName, tempoElementID, componentElementId, } = data.payload;
                if (!isComponent && !tempoElementID) {
                    console.log('No tempo element ID provided');
                    const message = {
                        id: data.id,
                        error: 'Could not find element',
                    };
                    port2.postMessage(message);
                    return;
                }
                if (isComponent && !tempoElementID && !componentName) {
                    console.log('No tempo element ID or component name provided');
                    const message = {
                        id: data.id,
                        error: 'Could not find component',
                    };
                    port2.postMessage(message);
                    return;
                }
                const foundNodes = (0, resqUtils_1.findElementInTree)(tree, (node) => {
                    var _a, _b, _c, _d, _e, _f;
                    if (isComponent) {
                        // Check tempoElementID, and if it's not provided, use the component name
                        if (tempoElementID &&
                            (((_a = node.props) === null || _a === void 0 ? void 0 : _a.tempoelementid) == tempoElementID ||
                                ((_b = node.props) === null || _b === void 0 ? void 0 : _b['data-testid']) == tempoElementID)) {
                            return true;
                        }
                        if (!tempoElementID &&
                            componentName &&
                            node.name == componentName) {
                            return true;
                        }
                    }
                    else {
                        // The tempo element ID must always match
                        if (tempoElementID &&
                            ((_c = node.props) === null || _c === void 0 ? void 0 : _c.tempoelementid) !== tempoElementID &&
                            ((_d = node.props) === null || _d === void 0 ? void 0 : _d['data-testid']) !== tempoElementID) {
                            return false;
                        }
                        // If the component instance ID is provided, go up the chain to check if there are any parents with this component instance ID set
                        if (componentElementId) {
                            let nodeToCheck = node.parent;
                            let foundMatchingComponent = false;
                            while (nodeToCheck) {
                                if (((_e = nodeToCheck.props) === null || _e === void 0 ? void 0 : _e.tempoelementid) === componentElementId ||
                                    ((_f = nodeToCheck.props) === null || _f === void 0 ? void 0 : _f['data-testid']) === componentElementId) {
                                    foundMatchingComponent = true;
                                    break;
                                }
                                nodeToCheck = nodeToCheck.parent;
                            }
                            if (!foundMatchingComponent) {
                                return false;
                            }
                        }
                        return true;
                    }
                    return false;
                });
                if (!(foundNodes === null || foundNodes === void 0 ? void 0 : foundNodes.length)) {
                    debugLogInDev('NO COMPONENT FOUND');
                    const message = {
                        id: data.id,
                        error: 'No component found',
                    };
                    port2.postMessage(message);
                    return;
                }
                if (foundNodes.length > 1) {
                    console.log(foundNodes);
                    console.log('Warning: more than 1 component found');
                }
                const foundNode = foundNodes[0];
                const sendDataForNode = (node) => {
                    debugLogInDev('NODE FOUND: ', node);
                    const propsToSend = {};
                    if (node.props) {
                        Object.keys(node.props).forEach((key) => {
                            if (typeof node.props[key] === 'object') {
                                propsToSend[key] = 'TEMPO_OBJECT_TYPE';
                            }
                            else if (typeof node.props[key] === 'function') {
                                propsToSend[key] = 'TEMPO_FUNCTION_TYPE';
                            }
                            else {
                                propsToSend[key] = node.props[key];
                            }
                        });
                    }
                    // TODO: This doesn't fully work because of this bug: https://github.com/baruchvlz/resq/issues/85
                    let stateToSend = {};
                    if (node.state) {
                        if (typeof node.state === 'string') {
                            stateToSend = {
                                state: node.state,
                            };
                        }
                        else {
                            Object.keys(node.state).forEach((key) => {
                                if (typeof node.state[key] === 'object') {
                                    stateToSend[key] = 'TEMPO_OBJECT_TYPE';
                                }
                                else if (typeof node.state[key] === 'function') {
                                    stateToSend[key] = 'TEMPO_FUNCTION_TYPE';
                                }
                                else {
                                    stateToSend[key] = node.state[key];
                                }
                            });
                        }
                    }
                    const message = {
                        id: data.id,
                        props: propsToSend,
                        state: stateToSend,
                    };
                    debugLogInDev('RESPONDING WITH: ', message);
                    port2.postMessage(message);
                };
                sendDataForNode(foundNode);
            });
            // Handle messages received on port2
            const onMessage = (e) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                try {
                    const data = e.data;
                    const dataToLog = Object.assign({}, data);
                    if ((_a = data === null || data === void 0 ? void 0 : data.payload) === null || _a === void 0 ? void 0 : _a.compressedArgs) {
                        dataToLog.payload = Object.assign(Object.assign({}, data.payload), { compressedArgs: 'COMPRESSED' });
                    }
                    // These contain args that are too large to log
                    const LOGS_TO_SKIP_ARGS = [
                        'initProject',
                        'setNewLookups',
                        'processRulesForSelectedElement',
                    ];
                    if (((_b = data === null || data === void 0 ? void 0 : data.payload) === null || _b === void 0 ? void 0 : _b.functionName) &&
                        LOGS_TO_SKIP_ARGS.includes(data.payload.functionName)) {
                        dataToLog.payload = Object.assign(Object.assign({}, data.payload), { args: 'ARGS_SKIPPED' });
                    }
                    debugLogInDev('INNER FRAME: Received message from parent: ', JSON.stringify(dataToLog));
                    if (!data || !data.payload) {
                        debugLogInDev('NO PAYLOAD');
                        return;
                    }
                    if (!data.id) {
                        debugLogInDev('NO ID');
                        return;
                    }
                    if (data.type === 'inspectElement') {
                        onInspectElement(data);
                    }
                    else if (data.type === 'executeFunction') {
                        const fn = window[data.payload.functionName];
                        if (typeof fn === 'function') {
                            // Special case to register the storyboardId
                            let args = data.payload.args;
                            if (data.payload.compressedArgs) {
                                args = JSON.parse(lz_string_1.default.decompress(data.payload.compressedArgs));
                            }
                            if (data.payload.functionName === 'initProject') {
                                storyboardId = args[0];
                                args = args.slice(1);
                            }
                            let res = null;
                            if (data.payload.args) {
                                // @ts-ignore
                                res = fn(port2, storyboardId, ...args);
                            }
                            else {
                                // @ts-ignore
                                res = fn(port2, storyboardId);
                            }
                            if (res) {
                                port2.postMessage({
                                    id: data.id,
                                    result: res,
                                });
                            }
                        }
                        else {
                            console.log('INNER FRAME ERROR: Function to execute not found');
                        }
                    }
                }
                catch (error) {
                    console.log('INNER FRAME ERROR: ', error);
                    // TODO: Send error back to parent?
                }
            });
        })();
    }
}
exports.initChannelMessaging = initChannelMessaging;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2hhbm5lbE1lc3NhZ2luZy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxtREFBbUQ7QUFDbkQsMkNBSXFCO0FBRXJCLDBEQUEyQjtBQUMzQiwrREFBb0M7QUFFcEMsMkVBQTRFO0FBRTVFLDRDQUE0QztBQUM1QyxJQUNFLE9BQU8sTUFBTSxLQUFLLFdBQVc7SUFDN0IsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLEVBQy9DO0lBQ0EsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLEdBQVEsRUFBRSxFQUFFO1FBQ3BDLG9GQUFvRjtRQUNwRixNQUFNLFlBQVksR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDOUQsc0NBQXNDO1FBQ3RDLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDakIsT0FBTztTQUNSO1FBQ0QsTUFBTSxPQUFPLEdBQUcsSUFBSSxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEMsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDckMsQ0FBQyxDQUFDO0lBRUYsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ25ELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxDQUMzRCxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FDekIsQ0FBQztDQUNIO0FBRUQsTUFBTSxhQUFhLEdBQUcsQ0FBQyxHQUFHLEdBQVUsRUFBRSxFQUFFOztJQUN0QyxjQUFjO0lBQ2QsSUFBSSxNQUFBLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSwwQ0FBRSxRQUFRLENBQUMsZUFBZSxDQUFDLEVBQUU7UUFDckQsT0FBTyxD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QUksQ0FBQyxFQUFFO29DQUNYLE1BQU0sRUFBRSxHQUFHO2lDQUNaLENBQUMsQ0FBQzs2QkFDSjt5QkFDRjs2QkFBTTs0QkFDTCxPQUFPLENBQUMsR0FBRyxDQUFDLGtEQUFrRCxDQUFDLENBQUM7eUJBQ2pFO3FCQUNGO2lCQUNGO2dCQUFDLE9BQU8sS0FBVSxFQUFFO29CQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUMxQyxtQ0FBbUM7aUJBQ3BDO1lBQ0gsQ0FBQyxDQUFBLENBQUM7UUFDSixDQUFDLENBQUMsRUFBRSxDQUFDO0tBQ047QUFDSCxDQUFDO0FBblpELG9EQW1aQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEtFRVAgVEhJUyBJTiBTWU5DIFdJVEggc2Vzc2lvblN0b3JhZ2VVdGlscy4qLnRzeFxuaW1wb3J0IHtcbiAgYnVpbGROb2RlVHJlZSxcbiAgZmluZEVsZW1lbnRJblRyZWUsXG4gIGdldFJvb3RSZWFjdEVsZW1lbnQsXG59IGZyb20gJy4vcmVzcVV0aWxzJztcblxuaW1wb3J0IGx6IGZyb20gJ2x6LXN0cmluZyc7XG5pbXBvcnQgUG9zdGhvZyBmcm9tICcuLi9wb3N0aG9nLmpzJztcblxuaW1wb3J0IHsgaW5pdENoYW5uZWxNZXNzYWdpbmdGdW5jdGlvbnMgfSBmcm9tICcuL2NoYW5uZWxNZXNzYWdpbmdGdW5jdGlvbnMnO1xuXG4vLyBGb3Igdml0ZSBvbmx5LCBzaG93IGVycm9ycyBpbiB0aGUgYnJvd3NlclxuaWYgKFxuICB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJlxuICB3aW5kb3cubG9jYXRpb24uaHJlZi5pbmNsdWRlcygnZnJhbWV3b3JrPVZJVEUnKVxuKSB7XG4gIGNvbnN0IHNob3dFcnJvck92ZXJsYXkgPSAoZXJyOiBhbnkpID0+IHtcbiAgICAvLyBtdXN0IGJlIHdpdGhpbiBmdW5jdGlvbiBjYWxsIGJlY2F1c2UgdGhhdCdzIHdoZW4gdGhlIGVsZW1lbnQgaXMgZGVmaW5lZCBmb3Igc3VyZS5cbiAgICBjb25zdCBFcnJvck92ZXJsYXkgPSBjdXN0b21FbGVtZW50cy5nZXQoJ3ZpdGUtZXJyb3Itb3ZlcmxheScpO1xuICAgIC8vIGRvbid0IG9wZW4gb3V0c2lkZSB2aXRlIGVudmlyb25tZW50XG4gICAgaWYgKCFFcnJvck92ZXJsYXkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgb3ZlcmxheSA9IG5ldyBFcnJvck92ZXJsYXkoZXJyKTtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG92ZXJsYXkpO1xuICB9O1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIHNob3dFcnJvck92ZXJsYXkpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndW5oYW5kbGVkcmVqZWN0aW9uJywgKHsgcmVhc29uIH0pID0+XG4gICAgc2hvd0Vycm9yT3ZlcmxheShyZWFzb24pLFxuICApO1xufVxuXG5jb25zdCBkZWJ1Z0xvZ0luRGV2ID0gKC4uLnN0cjogYW55W10pID0+IHtcbiAgLy8gT25seSBpbiBkZXZcbiAgaWYgKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2g/LmluY2x1ZGVzKCdkZWJ1Z0xvZz10cnVlJykpIHtcbiAgICBjb25zb2xlLmRlYnVnKC4uLnN0cik7XG4gIH1cbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0Q2hhbm5lbE1lc3NhZ2luZygpIHtcbiAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaW5pdENoYW5uZWxNZXNzYWdpbmdGdW5jdGlvbnMoKTtcblxuICAgIC8vIE9ubHkgaW4gcHJvZFxuICAgIGlmIChcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZS5lbmRzV2l0aCgnZGV2LnRlbXBvbGFicy5haScpICYmXG4gICAgICAhd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lLmVuZHNXaXRoKCdzdGFnaW5nLWRldi50ZW1wb2xhYnMuYWknKVxuICAgICkge1xuICAgICAgaWYgKFBvc3Rob2cpIHtcbiAgICAgICAgUG9zdGhvZy5pbml0KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbiAgICAgIGNvbnN0IHsgZGF0YSB9ID0gZXZlbnQ7XG4gICAgICBpZiAoZGF0YS50eXBlID09PSAnR0VUX1NUQVRFX0FORF9QUk9QUycpIHtcbiAgICAgICAgY29uc3QgeyBjb21wb25lbnROYW1lIH0gPSBkYXRhO1xuXG4gICAgICAgIC8vIFRPRE86IFN1cHBvcnQgY3VzdG9tIHJvb3QgdGhhdCB1c2VyIHByb3ZpZGVzXG4gICAgICAgIGxldCByb290U2VsZWN0b3IgPSAnI3Jvb3QnO1xuICAgICAgICBpZiAoIWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iocm9vdFNlbGVjdG9yKSkge1xuICAgICAgICAgIHJvb3RTZWxlY3RvciA9ICcjX19uZXh0JztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJvb3Q6IGFueSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iocm9vdFNlbGVjdG9yKTtcblxuICAgICAgICBjb25zdCByb290UmVhY3RFbGVtZW50ID0gZ2V0Um9vdFJlYWN0RWxlbWVudCgpO1xuXG4gICAgICAgIGNvbnN0IHRyZWUgPSBidWlsZE5vZGVUcmVlKHJvb3RSZWFjdEVsZW1lbnQsIG51bGwpO1xuXG4gICAgICAgIGNvbnN0IGZvdW5kTm9kZXMgPSBmaW5kRWxlbWVudEluVHJlZSh0cmVlLCAobm9kZTogYW55KSA9PiB7XG4gICAgICAgICAgaWYgKGNvbXBvbmVudE5hbWUgJiYgbm9kZS5uYW1lID09IGNvbXBvbmVudE5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICghZm91bmROb2Rlcz8ubGVuZ3RoKSB7XG4gICAgICAgICAgY29uc3QgbWVzc2FnZSA9IHtcbiAgICAgICAgICAgIGVycm9yOiAnTm8gY29tcG9uZW50IGZvdW5kJyxcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgY29uc29sZS5sb2coJ1NUQVRFX0FORF9QUk9QUyAnLCBKU09OLnN0cmluZ2lmeShtZXNzYWdlKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZvdW5kTm9kZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGZvdW5kTm9kZXMpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdXYXJuaW5nOiBtb3JlIHRoYW4gMSBjb21wb25lbnQgZm91bmQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZvdW5kTm9kZSA9IGZvdW5kTm9kZXNbMF07XG5cbiAgICAgICAgY29uc3Qgc2VuZERhdGFGb3JOb2RlID0gKG5vZGU6IGFueSkgPT4ge1xuICAgICAgICAgIGRlYnVnTG9nSW5EZXYoJ05PREUgRk9VTkQ6ICcsIG5vZGUpO1xuXG4gICAgICAgICAgY29uc3QgUFJPUFNfVE9fRVhDTFVERTogYW55ID0ge1xuICAgICAgICAgICAgdGVtcG9lbGVtZW50aWQ6IHRydWUsXG4gICAgICAgICAgICAnZGF0YS10ZXN0aWQnOiB0cnVlLFxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBjb25zdCBwcm9wc1RvU2VuZDogYW55ID0ge307XG4gICAgICAgICAgaWYgKG5vZGUucHJvcHMpIHtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKG5vZGUucHJvcHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgICBpZiAoIVBST1BTX1RPX0VYQ0xVREVba2V5XSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygbm9kZS5wcm9wc1trZXldID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgcHJvcHNUb1NlbmRba2V5XSA9ICdURU1QT19PQkpFQ1RfVFlQRSc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygbm9kZS5wcm9wc1trZXldID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICBwcm9wc1RvU2VuZFtrZXldID0gJ1RFTVBPX0ZVTkNUSU9OX1RZUEUnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBwcm9wc1RvU2VuZFtrZXldID0gbm9kZS5wcm9wc1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gVE9ETzogVGhpcyBkb2Vzbid0IGZ1bGx5IHdvcmsgYmVjYXVzZSBvZiB0aGlzIGJ1ZzogaHR0cHM6Ly9naXRodWIuY29tL2JhcnVjaHZsei9yZXNxL2lzc3Vlcy84NVxuICAgICAgICAgIGxldCBzdGF0ZVRvU2VuZDogYW55ID0ge307XG4gICAgICAgICAgaWYgKG5vZGUuc3RhdGUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygbm9kZS5zdGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgc3RhdGVUb1NlbmQgPSB7XG4gICAgICAgICAgICAgICAgc3RhdGU6IG5vZGUuc3RhdGUsXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBPYmplY3Qua2V5cyhub2RlLnN0YXRlKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG5vZGUuc3RhdGVba2V5XSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgIHN0YXRlVG9TZW5kW2tleV0gPSAnVEVNUE9fT0JKRUNUX1RZUEUnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG5vZGUuc3RhdGVba2V5XSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgc3RhdGVUb1NlbmRba2V5XSA9ICdURU1QT19GVU5DVElPTl9UWVBFJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgc3RhdGVUb1NlbmRba2V5XSA9IG5vZGUuc3RhdGVba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICBpZDogZGF0YS5pZCxcbiAgICAgICAgICAgIHByb3BzOiBwcm9wc1RvU2VuZCxcbiAgICAgICAgICAgIHN0YXRlOiBzdGF0ZVRvU2VuZCxcbiAgICAgICAgICB9O1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdTVEFURV9BTkRfUFJPUFMgJywgSlNPTi5zdHJpbmdpZnkobWVzc2FnZSkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHNlbmREYXRhRm9yTm9kZShmb3VuZE5vZGUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2g/LmluY2x1ZGVzKCdzdG9yeWJvYXJkPXRydWUnKSkge1xuICAgICAgbGV0IHJvb3RFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb290Jyk7XG4gICAgICBpZiAoIXJvb3RFbCkge1xuICAgICAgICByb290RWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnX19uZXh0Jyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyb290RWwpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2guaW5jbHVkZXMoJ3R5cGU9U1RPUlknKSB8fFxuICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2guaW5jbHVkZXMoJ3R5cGU9Q09NUE9ORU5UJylcbiAgICAgICAgKSB7XG4gICAgICAgICAgW3Jvb3RFbCwgZG9jdW1lbnQuYm9keSwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50XS5mb3JFYWNoKChlbCkgPT4ge1xuICAgICAgICAgICAgZWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3RyYW5zcGFyZW50JztcbiAgICAgICAgICAgIGVsLnN0eWxlLndpZHRoID0gJzEwMHZ3JztcbiAgICAgICAgICAgIGVsLnN0eWxlLmhlaWdodCA9ICcxMDB2aCc7XG4gICAgICAgICAgICBlbC5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJvb3RFbC5zdHlsZS53aWR0aCA9ICcxMDB2dyc7XG4gICAgICAgICAgcm9vdEVsLnN0eWxlLmhlaWdodCA9ICcxMDB2aCc7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IHBvcnQyOiBhbnkgPSBudWxsO1xuICAgICAgbGV0IHN0b3J5Ym9hcmRJZDogYW55ID0gbnVsbDtcblxuICAgICAgLy8gU2V0dXAgdGhlIHRyYW5zZmVyZWQgcG9ydFxuICAgICAgY29uc3QgaW5pdFBvcnQgPSAoZTogYW55KSA9PiB7XG4gICAgICAgIGlmIChlLmRhdGEgPT09ICdpbml0Jykge1xuICAgICAgICAgIHBvcnQyID0gZS5wb3J0c1swXTtcbiAgICAgICAgICBwb3J0Mi5vbm1lc3NhZ2UgPSBvbk1lc3NhZ2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIG1zZ09iaiA9IGUuZGF0YTtcbiAgICAgICAgICBvbk1lc3NhZ2Uoe1xuICAgICAgICAgICAgZGF0YTogbXNnT2JqLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAvLyBMaXN0ZW4gZm9yIHRoZSBpbnRpYWwgcG9ydCB0cmFuc2ZlciBtZXNzYWdlXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGluaXRQb3J0KTtcblxuICAgICAgY29uc3Qgb25JbnNwZWN0RWxlbWVudCA9IGFzeW5jIChkYXRhOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKCFkYXRhLnBheWxvYWQuY29tcG9uZW50TmFtZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdOTyBDT01QT05FTlQgTkFNRScpO1xuICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICBpZDogZGF0YS5pZCxcbiAgICAgICAgICAgIGVycm9yOiAnTm8gY29tcG9uZW50IG5hbWUnLFxuICAgICAgICAgIH07XG4gICAgICAgICAgcG9ydDIucG9zdE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogU3VwcG9ydCBjdXN0b20gcm9vdCB0aGF0IHVzZXIgcHJvdmlkZXNcbiAgICAgICAgY29uc3Qgcm9vdFJlYWN0RWxlbWVudCA9IGdldFJvb3RSZWFjdEVsZW1lbnQoKTtcblxuICAgICAgICBjb25zdCB0cmVlID0gYnVpbGROb2RlVHJlZShyb290UmVhY3RFbGVtZW50LCBudWxsKTtcblxuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgaXNDb21wb25lbnQsXG4gICAgICAgICAgY29tcG9uZW50TmFtZSxcbiAgICAgICAgICB0ZW1wb0VsZW1lbnRJRCxcbiAgICAgICAgICBjb21wb25lbnRFbGVtZW50SWQsXG4gICAgICAgIH0gPSBkYXRhLnBheWxvYWQ7XG5cbiAgICAgICAgaWYgKCFpc0NvbXBvbmVudCAmJiAhdGVtcG9FbGVtZW50SUQpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnTm8gdGVtcG8gZWxlbWVudCBJRCBwcm92aWRlZCcpO1xuICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICBpZDogZGF0YS5pZCxcbiAgICAgICAgICAgIGVycm9yOiAnQ291bGQgbm90IGZpbmQgZWxlbWVudCcsXG4gICAgICAgICAgfTtcbiAgICAgICAgICBwb3J0Mi5wb3N0TWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNDb21wb25lbnQgJiYgIXRlbXBvRWxlbWVudElEICYmICFjb21wb25lbnROYW1lKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ05vIHRlbXBvIGVsZW1lbnQgSUQgb3IgY29tcG9uZW50IG5hbWUgcHJvdmlkZWQnKTtcbiAgICAgICAgICBjb25zdCBtZXNzYWdlID0ge1xuICAgICAgICAgICAgaWQ6IGRhdGEuaWQsXG4gICAgICAgICAgICBlcnJvcjogJ0NvdWxkIG5vdCBmaW5kIGNvbXBvbmVudCcsXG4gICAgICAgICAgfTtcbiAgICAgICAgICBwb3J0Mi5wb3N0TWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmb3VuZE5vZGVzID0gZmluZEVsZW1lbnRJblRyZWUodHJlZSwgKG5vZGU6IGFueSkgPT4ge1xuICAgICAgICAgIGlmIChpc0NvbXBvbmVudCkge1xuICAgICAgICAgICAgLy8gQ2hlY2sgdGVtcG9FbGVtZW50SUQsIGFuZCBpZiBpdCdzIG5vdCBwcm92aWRlZCwgdXNlIHRoZSBjb21wb25lbnQgbmFtZVxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICB0ZW1wb0VsZW1lbnRJRCAmJlxuICAgICAgICAgICAgICAobm9kZS5wcm9wcz8udGVtcG9lbGVtZW50aWQgPT0gdGVtcG9FbGVtZW50SUQgfHxcbiAgICAgICAgICAgICAgICBub2RlLnByb3BzPy5bJ2RhdGEtdGVzdGlkJ10gPT0gdGVtcG9FbGVtZW50SUQpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgIXRlbXBvRWxlbWVudElEICYmXG4gICAgICAgICAgICAgIGNvbXBvbmVudE5hbWUgJiZcbiAgICAgICAgICAgICAgbm9kZS5uYW1lID09IGNvbXBvbmVudE5hbWVcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVGhlIHRlbXBvIGVsZW1lbnQgSUQgbXVzdCBhbHdheXMgbWF0Y2hcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgdGVtcG9FbGVtZW50SUQgJiZcbiAgICAgICAgICAgICAgbm9kZS5wcm9wcz8udGVtcG9lbGVtZW50aWQgIT09IHRlbXBvRWxlbWVudElEICYmXG4gICAgICAgICAgICAgIG5vZGUucHJvcHM/LlsnZGF0YS10ZXN0aWQnXSAhPT0gdGVtcG9FbGVtZW50SURcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIHRoZSBjb21wb25lbnQgaW5zdGFuY2UgSUQgaXMgcHJvdmlkZWQsIGdvIHVwIHRoZSBjaGFpbiB0byBjaGVjayBpZiB0aGVyZSBhcmUgYW55IHBhcmVudHMgd2l0aCB0aGlzIGNvbXBvbmVudCBpbnN0YW5jZSBJRCBzZXRcbiAgICAgICAgICAgIGlmIChjb21wb25lbnRFbGVtZW50SWQpIHtcbiAgICAgICAgICAgICAgbGV0IG5vZGVUb0NoZWNrID0gbm9kZS5wYXJlbnQ7XG4gICAgICAgICAgICAgIGxldCBmb3VuZE1hdGNoaW5nQ29tcG9uZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgIHdoaWxlIChub2RlVG9DaGVjaykge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIG5vZGVUb0NoZWNrLnByb3BzPy50ZW1wb2VsZW1lbnRpZCA9PT0gY29tcG9uZW50RWxlbWVudElkIHx8XG4gICAgICAgICAgICAgICAgICBub2RlVG9DaGVjay5wcm9wcz8uWydkYXRhLXRlc3RpZCddID09PSBjb21wb25lbnRFbGVtZW50SWRcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGZvdW5kTWF0Y2hpbmdDb21wb25lbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5vZGVUb0NoZWNrID0gbm9kZVRvQ2hlY2sucGFyZW50O1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKCFmb3VuZE1hdGNoaW5nQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCFmb3VuZE5vZGVzPy5sZW5ndGgpIHtcbiAgICAgICAgICBkZWJ1Z0xvZ0luRGV2KCdOTyBDT01QT05FTlQgRk9VTkQnKTtcbiAgICAgICAgICBjb25zdCBtZXNzYWdlID0ge1xuICAgICAgICAgICAgaWQ6IGRhdGEuaWQsXG4gICAgICAgICAgICBlcnJvcjogJ05vIGNvbXBvbmVudCBmb3VuZCcsXG4gICAgICAgICAgfTtcbiAgICAgICAgICBwb3J0Mi5wb3N0TWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZm91bmROb2Rlcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZm91bmROb2Rlcyk7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1dhcm5pbmc6IG1vcmUgdGhhbiAxIGNvbXBvbmVudCBmb3VuZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZm91bmROb2RlID0gZm91bmROb2Rlc1swXTtcblxuICAgICAgICBjb25zdCBzZW5kRGF0YUZvck5vZGUgPSAobm9kZTogYW55KSA9PiB7XG4gICAgICAgICAgZGVidWdMb2dJbkRldignTk9ERSBGT1VORDogJywgbm9kZSk7XG5cbiAgICAgICAgICBjb25zdCBwcm9wc1RvU2VuZDogYW55ID0ge307XG4gICAgICAgICAgaWYgKG5vZGUucHJvcHMpIHtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKG5vZGUucHJvcHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIG5vZGUucHJvcHNba2V5XSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBwcm9wc1RvU2VuZFtrZXldID0gJ1RFTVBPX09CSkVDVF9UWVBFJztcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygbm9kZS5wcm9wc1trZXldID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgcHJvcHNUb1NlbmRba2V5XSA9ICdURU1QT19GVU5DVElPTl9UWVBFJztcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcm9wc1RvU2VuZFtrZXldID0gbm9kZS5wcm9wc1trZXldO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBUT0RPOiBUaGlzIGRvZXNuJ3QgZnVsbHkgd29yayBiZWNhdXNlIG9mIHRoaXMgYnVnOiBodHRwczovL2dpdGh1Yi5jb20vYmFydWNodmx6L3Jlc3EvaXNzdWVzLzg1XG4gICAgICAgICAgbGV0IHN0YXRlVG9TZW5kOiBhbnkgPSB7fTtcbiAgICAgICAgICBpZiAobm9kZS5zdGF0ZSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBub2RlLnN0YXRlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICBzdGF0ZVRvU2VuZCA9IHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogbm9kZS5zdGF0ZSxcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIE9iamVjdC5rZXlzKG5vZGUuc3RhdGUpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygbm9kZS5zdGF0ZVtrZXldID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgc3RhdGVUb1NlbmRba2V5XSA9ICdURU1QT19PQkpFQ1RfVFlQRSc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygbm9kZS5zdGF0ZVtrZXldID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICBzdGF0ZVRvU2VuZFtrZXldID0gJ1RFTVBPX0ZVTkNUSU9OX1RZUEUnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBzdGF0ZVRvU2VuZFtrZXldID0gbm9kZS5zdGF0ZVtrZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgbWVzc2FnZSA9IHtcbiAgICAgICAgICAgIGlkOiBkYXRhLmlkLFxuICAgICAgICAgICAgcHJvcHM6IHByb3BzVG9TZW5kLFxuICAgICAgICAgICAgc3RhdGU6IHN0YXRlVG9TZW5kLFxuICAgICAgICAgIH07XG4gICAgICAgICAgZGVidWdMb2dJbkRldignUkVTUE9ORElORyBXSVRIOiAnLCBtZXNzYWdlKTtcblxuICAgICAgICAgIHBvcnQyLnBvc3RNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHNlbmREYXRhRm9yTm9kZShmb3VuZE5vZGUpO1xuICAgICAgfTtcblxuICAgICAgLy8gSGFuZGxlIG1lc3NhZ2VzIHJlY2VpdmVkIG9uIHBvcnQyXG4gICAgICBjb25zdCBvbk1lc3NhZ2UgPSBhc3luYyAoZTogYW55KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IGUuZGF0YTtcbiAgICAgICAgICBjb25zdCBkYXRhVG9Mb2cgPSB7IC4uLmRhdGEgfTtcbiAgICAgICAgICBpZiAoZGF0YT8ucGF5bG9hZD8uY29tcHJlc3NlZEFyZ3MpIHtcbiAgICAgICAgICAgIGRhdGFUb0xvZy5wYXlsb2FkID0ge1xuICAgICAgICAgICAgICAuLi5kYXRhLnBheWxvYWQsXG4gICAgICAgICAgICAgIGNvbXByZXNzZWRBcmdzOiAnQ09NUFJFU1NFRCcsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBUaGVzZSBjb250YWluIGFyZ3MgdGhhdCBhcmUgdG9vIGxhcmdlIHRvIGxvZ1xuICAgICAgICAgIGNvbnN0IExPR1NfVE9fU0tJUF9BUkdTID0gW1xuICAgICAgICAgICAgJ2luaXRQcm9qZWN0JyxcbiAgICAgICAgICAgICdzZXROZXdMb29rdXBzJyxcbiAgICAgICAgICAgICdwcm9jZXNzUnVsZXNGb3JTZWxlY3RlZEVsZW1lbnQnLFxuICAgICAgICAgIF07XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgZGF0YT8ucGF5bG9hZD8uZnVuY3Rpb25OYW1lICYmXG4gICAgICAgICAgICBMT0dTX1RPX1NLSVBfQVJHUy5pbmNsdWRlcyhkYXRhLnBheWxvYWQuZnVuY3Rpb25OYW1lKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgZGF0YVRvTG9nLnBheWxvYWQgPSB7XG4gICAgICAgICAgICAgIC4uLmRhdGEucGF5bG9hZCxcbiAgICAgICAgICAgICAgYXJnczogJ0FSR1NfU0tJUFBFRCcsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGRlYnVnTG9nSW5EZXYoXG4gICAgICAgICAgICAnSU5ORVIgRlJBTUU6IFJlY2VpdmVkIG1lc3NhZ2UgZnJvbSBwYXJlbnQ6ICcsXG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeShkYXRhVG9Mb2cpLFxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBpZiAoIWRhdGEgfHwgIWRhdGEucGF5bG9hZCkge1xuICAgICAgICAgICAgZGVidWdMb2dJbkRldignTk8gUEFZTE9BRCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghZGF0YS5pZCkge1xuICAgICAgICAgICAgZGVidWdMb2dJbkRldignTk8gSUQnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZGF0YS50eXBlID09PSAnaW5zcGVjdEVsZW1lbnQnKSB7XG4gICAgICAgICAgICBvbkluc3BlY3RFbGVtZW50KGRhdGEpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS50eXBlID09PSAnZXhlY3V0ZUZ1bmN0aW9uJykge1xuICAgICAgICAgICAgY29uc3QgZm4gPSB3aW5kb3dbZGF0YS5wYXlsb2FkLmZ1bmN0aW9uTmFtZV07XG4gICAgICAgICAgICBpZiAodHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIC8vIFNwZWNpYWwgY2FzZSB0byByZWdpc3RlciB0aGUgc3Rvcnlib2FyZElkXG4gICAgICAgICAgICAgIGxldCBhcmdzID0gZGF0YS5wYXlsb2FkLmFyZ3M7XG4gICAgICAgICAgICAgIGlmIChkYXRhLnBheWxvYWQuY29tcHJlc3NlZEFyZ3MpIHtcbiAgICAgICAgICAgICAgICBhcmdzID0gSlNPTi5wYXJzZShsei5kZWNvbXByZXNzKGRhdGEucGF5bG9hZC5jb21wcmVzc2VkQXJncykpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKGRhdGEucGF5bG9hZC5mdW5jdGlvbk5hbWUgPT09ICdpbml0UHJvamVjdCcpIHtcbiAgICAgICAgICAgICAgICBzdG9yeWJvYXJkSWQgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgIGFyZ3MgPSBhcmdzLnNsaWNlKDEpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgbGV0IHJlcyA9IG51bGw7XG4gICAgICAgICAgICAgIGlmIChkYXRhLnBheWxvYWQuYXJncykge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICByZXMgPSBmbihwb3J0Miwgc3Rvcnlib2FyZElkLCAuLi5hcmdzKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgcmVzID0gZm4ocG9ydDIsIHN0b3J5Ym9hcmRJZCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHJlcykge1xuICAgICAgICAgICAgICAgIHBvcnQyLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICAgIGlkOiBkYXRhLmlkLFxuICAgICAgICAgICAgICAgICAgcmVzdWx0OiByZXMsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJTk5FUiBGUkFNRSBFUlJPUjogRnVuY3Rpb24gdG8gZXhlY3V0ZSBub3QgZm91bmQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnSU5ORVIgRlJBTUUgRVJST1I6ICcsIGVycm9yKTtcbiAgICAgICAgICAvLyBUT0RPOiBTZW5kIGVycm9yIGJhY2sgdG8gcGFyZW50P1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pKCk7XG4gIH1cbn1cbiJdfQ==