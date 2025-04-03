"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
// Must match the one in the tempo-api backend
const UUID5_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
module.exports = function (babel) {
    const { types: t } = babel;
    let skip = false;
    let genNumber = 0;
    let filename = '';
    let keyHashBase = '';
    /**
     * Important this is consistent across the SWC plugin, babel plugin and tempo backend
     */
    const getNextSeed = () => {
        const newSeed = `${filename}${genNumber}`;
        genNumber += 1;
        return newSeed;
    };
    return {
        // This method is called once before processing the file.
        pre(state) {
            skip = state.opts.filename.includes('node_modules/');
            const root = state.opts.root;
            filename = path_1.default.relative(root, state.opts.filename);
            genNumber = 0;
        },
        visitor: {
            Program(path, state) {
                const hash = crypto_1.default.createHash('sha1');
                hash.update(state.file.code);
                keyHashBase = hash.digest('base64');
            },
            JSXOpeningElement(path) {
                var _a;
                if (skip) {
                    return;
                }
                try {
                    const uuidToAssign = `tempo-${(0, uuid_1.v5)(getNextSeed(), UUID5_NAMESPACE)}`;
                    const node = path.node;
                    ///////////////////////////////////////////////////////
                    // Add the UUID to the class names
                    ///////////////////////////////////////////////////////
                    let foundClassName = false;
                    let foundKey = false;
                    node.attributes.forEach((attribute) => {
                        var _a, _b, _c, _d;
                        if (((_b = (_a = attribute.name) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === 'classname') {
                            foundClassName = true;
                            let valueToUse = null;
                            if (t.isLiteral(attribute.value)) {
                                valueToUse = attribute.value;
                            }
                            else if (t.isJSXExpressionContainer(attribute.value)) {
                                valueToUse = attribute.value.expression;
                            }
                            else {
                                throw Error(`Unknown attribute type!! + ${attribute.value.type}`);
                            }
                            const classesToSet = t.binaryExpression('+', valueToUse, t.stringLiteral(` ${uuidToAssign} `));
                            attribute.value = t.jsxExpressionContainer(classesToSet);
                        }
                        else if (((_d = (_c = attribute.name) === null || _c === void 0 ? void 0 : _c.name) === null || _d === void 0 ? void 0 : _d.toLowerCase()) === 'key') {
                            foundKey = true;
                        }
                    });
                    if (!foundClassName) {
                        const newClass = t.stringLiteral(uuidToAssign + ' ');
                        const newClassExpression = newClass;
                        node.attributes.push(t.jsxSpreadAttribute(t.objectExpression([
                            t.objectProperty(t.identifier('className'), newClassExpression),
                        ])));
                    }
                    // Always assign the UUID to this element itself for parsing in the frontend under tempoelementid
                    node.attributes.push(t.jsxSpreadAttribute(t.objectExpression([
                        t.objectProperty(t.identifier('tempoelementid'), t.stringLiteral(uuidToAssign)),
                    ])));
                    // For react native, also replace the test ID
                    // Remove any existing test ID
                    let foundTestId = false;
                    node.attributes.forEach((attribute) => {
                        var _a, _b;
                        if (((_b = (_a = attribute.name) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === 'testid') {
                            foundTestId = true;
                            attribute.value = t.stringLiteral(uuidToAssign);
                        }
                    });
                    // If not found, add it
                    if (!foundTestId) {
                        node.attributes.push(t.jsxSpreadAttribute(t.objectExpression([
                            t.objectProperty(t.identifier('testID'), t.stringLiteral(uuidToAssign)),
                        ])));
                    }
                    // Only if it's a component
                    if (!foundKey &&
                        ((_a = node === null || node === void 0 ? void 0 : node.name) === null || _a === void 0 ? void 0 : _a.name) &&
                        node.name.name[0].toLowerCase() === node.name.name[0]) {
                        const newKey = t.stringLiteral(keyHashBase + '-' + genNumber.toString());
                        node.attributes.push(t.jsxSpreadAttribute(t.objectExpression([
                            t.objectProperty(t.identifier('key'), newKey),
                        ])));
                    }
                }
                catch (e) {
                    console.log('Tempo babel plugin error: ' + e);
                }
            },
        },
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYmFiZWwtcGx1Z2luL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsK0JBQW9DO0FBQ3BDLGdEQUF3QjtBQUN4QixvREFBNEI7QUFFNUIsOENBQThDO0FBQzlDLE1BQU0sZUFBZSxHQUFHLHNDQUFzQyxDQUFDO0FBRS9ELE1BQU0sQ0FBQyxPQUFPLEdBQUcsVUFBVSxLQUFVO0lBQ25DLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDO0lBRTNCLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQztJQUNqQixJQUFJLFNBQVMsR0FBVyxDQUFDLENBQUM7SUFDMUIsSUFBSSxRQUFRLEdBQVcsRUFBRSxDQUFDO0lBQzFCLElBQUksV0FBVyxHQUFXLEVBQUUsQ0FBQztJQUU3Qjs7T0FFRztJQUNILE1BQU0sV0FBVyxHQUFHLEdBQUcsRUFBRTtRQUN2QixNQUFNLE9BQU8sR0FBRyxHQUFHLFFBQVEsR0FBRyxTQUFTLEVBQUUsQ0FBQztRQUMxQyxTQUFTLElBQUksQ0FBQyxDQUFDO1FBQ2YsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQyxDQUFDO0lBRUYsT0FBTztRQUNMLHlEQUF5RDtRQUN6RCxHQUFHLENBQUMsS0FBVTtZQUNaLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDckQsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDN0IsUUFBUSxHQUFHLGNBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEQsU0FBUyxHQUFHLENBQUMsQ0FBQztRQUNoQixDQUFDO1FBQ0QsT0FBTyxFQUFFO1lBQ1AsT0FBTyxDQUFDLElBQVMsRUFBRSxLQUFVO2dC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QUUsQ0FDekMsQ0FBQzt3QkFFRixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FDbEIsQ0FBQyxDQUFDLGtCQUFrQixDQUNsQixDQUFDLENBQUMsZ0JBQWdCLENBQUM7NEJBQ2pCLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBRSxNQUFNLENBQUM7eUJBQzlDLENBQUMsQ0FDSCxDQUNGLENBQUM7cUJBQ0g7aUJBQ0Y7Z0JBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsR0FBRyxDQUFDLENBQUMsQ0FBQztpQkFDL0M7WUFDSCxDQUFDO1NBQ0Y7S0FDRixDQUFDO0FBQ0osQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdjUgYXMgdXVpZHY1IH0gZnJvbSAndXVpZCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBjcnlwdG8gZnJvbSAnY3J5cHRvJztcblxuLy8gTXVzdCBtYXRjaCB0aGUgb25lIGluIHRoZSB0ZW1wby1hcGkgYmFja2VuZFxuY29uc3QgVVVJRDVfTkFNRVNQQUNFID0gJzFiNjcxYTY0LTQwZDUtNDkxZS05OWIwLWRhMDFmZjFmMzM0MSc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGJhYmVsOiBhbnkpIHtcbiAgY29uc3QgeyB0eXBlczogdCB9ID0gYmFiZWw7XG5cbiAgbGV0IHNraXAgPSBmYWxzZTtcbiAgbGV0IGdlbk51bWJlcjogbnVtYmVyID0gMDtcbiAgbGV0IGZpbGVuYW1lOiBzdHJpbmcgPSAnJztcbiAgbGV0IGtleUhhc2hCYXNlOiBzdHJpbmcgPSAnJztcblxuICAvKipcbiAgICogSW1wb3J0YW50IHRoaXMgaXMgY29uc2lzdGVudCBhY3Jvc3MgdGhlIFNXQyBwbHVnaW4sIGJhYmVsIHBsdWdpbiBhbmQgdGVtcG8gYmFja2VuZFxuICAgKi9cbiAgY29uc3QgZ2V0TmV4dFNlZWQgPSAoKSA9PiB7XG4gICAgY29uc3QgbmV3U2VlZCA9IGAke2ZpbGVuYW1lfSR7Z2VuTnVtYmVyfWA7XG4gICAgZ2VuTnVtYmVyICs9IDE7XG4gICAgcmV0dXJuIG5ld1NlZWQ7XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICAvLyBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgb25jZSBiZWZvcmUgcHJvY2Vzc2luZyB0aGUgZmlsZS5cbiAgICBwcmUoc3RhdGU6IGFueSkge1xuICAgICAgc2tpcCA9IHN0YXRlLm9wdHMuZmlsZW5hbWUuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcy8nKTtcbiAgICAgIGNvbnN0IHJvb3QgPSBzdGF0ZS5vcHRzLnJvb3Q7XG4gICAgICBmaWxlbmFtZSA9IHBhdGgucmVsYXRpdmUocm9vdCwgc3RhdGUub3B0cy5maWxlbmFtZSk7XG4gICAgICBnZW5OdW1iZXIgPSAwO1xuICAgIH0sXG4gICAgdmlzaXRvcjoge1xuICAgICAgUHJvZ3JhbShwYXRoOiBhbnksIHN0YXRlOiBhbnkpIHtcbiAgICAgICAgY29uc3QgaGFzaCA9IGNyeXB0by5jcmVhdGVIYXNoKCdzaGExJyk7XG4gICAgICAgIGhhc2gudXBkYXRlKHN0YXRlLmZpbGUuY29kZSk7XG4gICAgICAgIGtleUhhc2hCYXNlID0gaGFzaC5kaWdlc3QoJ2Jhc2U2NCcpO1xuICAgICAgfSxcbiAgICAgIEpTWE9wZW5pbmdFbGVtZW50KHBhdGg6IGFueSkge1xuICAgICAgICBpZiAoc2tpcCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgdXVpZFRvQXNzaWduID0gYHRlbXBvLSR7dXVpZHY1KFxuICAgICAgICAgICAgZ2V0TmV4dFNlZWQoKSxcbiAgICAgICAgICAgIFVVSUQ1X05BTUVTUEFDRSxcbiAgICAgICAgICApfWA7XG5cbiAgICAgICAgICBjb25zdCBub2RlID0gcGF0aC5ub2RlO1xuXG4gICAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgICAgICAgIC8vIEFkZCB0aGUgVVVJRCB0byB0aGUgY2xhc3MgbmFtZXNcbiAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgICBsZXQgZm91bmRDbGFzc05hbWUgPSBmYWxzZTtcbiAgICAgICAgICBsZXQgZm91bmRLZXkgPSBmYWxzZTtcbiAgICAgICAgICBub2RlLmF0dHJpYnV0ZXMuZm9yRWFjaCgoYXR0cmlidXRlOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmIChhdHRyaWJ1dGUubmFtZT8ubmFtZT8udG9Mb3dlckNhc2UoKSA9PT0gJ2NsYXNzbmFtZScpIHtcbiAgICAgICAgICAgICAgZm91bmRDbGFzc05hbWUgPSB0cnVlO1xuXG4gICAgICAgICAgICAgIGxldCB2YWx1ZVRvVXNlID0gbnVsbDtcbiAgICAgICAgICAgICAgaWYgKHQuaXNMaXRlcmFsKGF0dHJpYnV0ZS52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZVRvVXNlID0gYXR0cmlidXRlLnZhbHVlO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHQuaXNKU1hFeHByZXNzaW9uQ29udGFpbmVyKGF0dHJpYnV0ZS52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZVRvVXNlID0gYXR0cmlidXRlLnZhbHVlLmV4cHJlc3Npb247XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgICAgICBgVW5rbm93biBhdHRyaWJ1dGUgdHlwZSEhICsgJHthdHRyaWJ1dGUudmFsdWUudHlwZX1gLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb25zdCBjbGFzc2VzVG9TZXQgPSB0LmJpbmFyeUV4cHJlc3Npb24oXG4gICAgICAgICAgICAgICAgJysnLFxuICAgICAgICAgICAgICAgIHZhbHVlVG9Vc2UsXG4gICAgICAgICAgICAgICAgdC5zdHJpbmdMaXRlcmFsKGAgJHt1dWlkVG9Bc3NpZ259IGApLFxuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgIGF0dHJpYnV0ZS52YWx1ZSA9IHQuanN4RXhwcmVzc2lvbkNvbnRhaW5lcihjbGFzc2VzVG9TZXQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhdHRyaWJ1dGUubmFtZT8ubmFtZT8udG9Mb3dlckNhc2UoKSA9PT0gJ2tleScpIHtcbiAgICAgICAgICAgICAgZm91bmRLZXkgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaWYgKCFmb3VuZENsYXNzTmFtZSkge1xuICAgICAgICAgICAgY29uc3QgbmV3Q2xhc3MgPSB0LnN0cmluZ0xpdGVyYWwodXVpZFRvQXNzaWduICsgJyAnKTtcbiAgICAgICAgICAgIGNvbnN0IG5ld0NsYXNzRXhwcmVzc2lvbiA9IG5ld0NsYXNzO1xuXG4gICAgICAgICAgICBub2RlLmF0dHJpYnV0ZXMucHVzaChcbiAgICAgICAgICAgICAgdC5qc3hTcHJlYWRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgICAgdC5vYmplY3RFeHByZXNzaW9uKFtcbiAgICAgICAgICAgICAgICAgIHQub2JqZWN0UHJvcGVydHkoXG4gICAgICAgICAgICAgICAgICAgIHQuaWRlbnRpZmllcignY2xhc3NOYW1lJyksXG4gICAgICAgICAgICAgICAgICAgIG5ld0NsYXNzRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgXSksXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEFsd2F5cyBhc3NpZ24gdGhlIFVVSUQgdG8gdGhpcyBlbGVtZW50IGl0c2VsZiBmb3IgcGFyc2luZyBpbiB0aGUgZnJvbnRlbmQgdW5kZXIgdGVtcG9lbGVtZW50aWRcbiAgICAgICAgICBub2RlLmF0dHJpYnV0ZXMucHVzaChcbiAgICAgICAgICAgIHQuanN4U3ByZWFkQXR0cmlidXRlKFxuICAgICAgICAgICAgICB0Lm9iamVjdEV4cHJlc3Npb24oW1xuICAgICAgICAgICAgICAgIHQub2JqZWN0UHJvcGVydHkoXG4gICAgICAgICAgICAgICAgICB0LmlkZW50aWZpZXIoJ3RlbXBvZWxlbWVudGlkJyksXG4gICAgICAgICAgICAgICAgICB0LnN0cmluZ0xpdGVyYWwodXVpZFRvQXNzaWduKSxcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICBdKSxcbiAgICAgICAgICAgICksXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIC8vIEZvciByZWFjdCBuYXRpdmUsIGFsc28gcmVwbGFjZSB0aGUgdGVzdCBJRFxuICAgICAgICAgIC8vIFJlbW92ZSBhbnkgZXhpc3RpbmcgdGVzdCBJRFxuICAgICAgICAgIGxldCBmb3VuZFRlc3RJZCA9IGZhbHNlO1xuICAgICAgICAgIG5vZGUuYXR0cmlidXRlcy5mb3JFYWNoKChhdHRyaWJ1dGU6IGFueSkgPT4ge1xuICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZS5uYW1lPy5uYW1lPy50b0xvd2VyQ2FzZSgpID09PSAndGVzdGlkJykge1xuICAgICAgICAgICAgICBmb3VuZFRlc3RJZCA9IHRydWU7XG4gICAgICAgICAgICAgIGF0dHJpYnV0ZS52YWx1ZSA9IHQuc3RyaW5nTGl0ZXJhbCh1dWlkVG9Bc3NpZ24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gSWYgbm90IGZvdW5kLCBhZGQgaXRcbiAgICAgICAgICBpZiAoIWZvdW5kVGVzdElkKSB7XG4gICAgICAgICAgICBub2RlLmF0dHJpYnV0ZXMucHVzaChcbiAgICAgICAgICAgICAgdC5qc3hTcHJlYWRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgICAgdC5vYmplY3RFeHByZXNzaW9uKFtcbiAgICAgICAgICAgICAgICAgIHQub2JqZWN0UHJvcGVydHkoXG4gICAgICAgICAgICAgICAgICAgIHQuaWRlbnRpZmllcigndGVzdElEJyksXG4gICAgICAgICAgICAgICAgICAgIHQuc3RyaW5nTGl0ZXJhbCh1dWlkVG9Bc3NpZ24pLFxuICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBdKSxcbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gT25seSBpZiBpdCdzIGEgY29tcG9uZW50XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgIWZvdW5kS2V5ICYmXG4gICAgICAgICAgICBub2RlPy5uYW1lPy5uYW1lICYmXG4gICAgICAgICAgICBub2RlLm5hbWUubmFtZVswXS50b0xvd2VyQ2FzZSgpID09PSBub2RlLm5hbWUubmFtZVswXVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY29uc3QgbmV3S2V5ID0gdC5zdHJpbmdMaXRlcmFsKFxuICAgICAgICAgICAgICBrZXlIYXNoQmFzZSArICctJyArIGdlbk51bWJlci50b1N0cmluZygpLFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgbm9kZS5hdHRyaWJ1dGVzLnB1c2goXG4gICAgICAgICAgICAgIHQuanN4U3ByZWFkQXR0cmlidXRlKFxuICAgICAgICAgICAgICAgIHQub2JqZWN0RXhwcmVzc2lvbihbXG4gICAgICAgICAgICAgICAgICB0Lm9iamVjdFByb3BlcnR5KHQuaWRlbnRpZmllcigna2V5JyksIG5ld0tleSksXG4gICAgICAgICAgICAgICAgXSksXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdUZW1wbyBiYWJlbCBwbHVnaW4gZXJyb3I6ICcgKyBlKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICB9O1xufTtcbiJdfQ==