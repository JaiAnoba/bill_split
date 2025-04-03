"use strict";
(function () {
    if (window.location.href.includes('framework=VITE')) {
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
    let parentPort = null;
    let queuedErrorToSend = null;
    // Setup the transfered port
    const initPort = (e) => {
        if (e.data === 'init') {
            parentPort = e.ports[0];
            if (queuedErrorToSend) {
                sendErrorToParent(queuedErrorToSend);
                queuedErrorToSend = null;
            }
        }
    };
    // Listen for the intial port transfer message
    window.addEventListener('message', initPort);
    const sendErrorToParent = (err) => {
        var _a;
        if (parentPort) {
            const serializedError = {
                message: err.message,
                filename: err.filename,
                lineno: err.lineno,
                colno: err.colno,
                stack: (_a = err.error) === null || _a === void 0 ? void 0 : _a.stack, // Optional chaining in case `error` is undefined
            };
            parentPort.postMessage({
                id: 'ERROR',
                error: serializedError,
            });
        }
        else {
            queuedErrorToSend = err;
        }
    };
    window.addEventListener('error', sendErrorToParent);
    window.addEventListener('unhandledrejection', ({ reason }) => sendErrorToParent(reason));
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3ItaGFuZGxpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc3RhbmRhbG9uZS1zY3JpcHQvZXJyb3ItaGFuZGxpbmcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLENBQUM7SUFDQyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO1FBQ25ELE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUMvQixvRkFBb0Y7WUFDcEYsTUFBTSxZQUFZLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQzlELHNDQUFzQztZQUN0QyxJQUFJLENBQUMsWUFBWSxFQUFFO2dCQUNqQixPQUFPO2FBQ1I7WUFDRCxNQUFNLE9BQU8sR0FBRyxJQUFJLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN0QyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyQyxDQUFDLENBQUM7UUFDRixNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDbkQsTUFBTSxDQUFDLGdCQUFnQixDQUFDLG9CQUFvQixFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQzNELGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUN6QixDQUFDO0tBQ0g7SUFFRCxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUM7SUFDdEIsSUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUM7SUFFN0IsNEJBQTRCO0lBQzVCLE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUU7UUFDckIsSUFBSSxDQUFDLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtZQUNyQixVQUFVLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QixJQUFJLGlCQUFpQixFQUFFO2dCQUNyQixpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUNyQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7YUFDMUI7U0FDRjtJQUNILENBQUMsQ0FBQztJQUVGLDhDQUE4QztJQUM5QyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBRTdDLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRTs7UUFDaEMsSUFBSSxVQUFVLEVBQUU7WUFDZCxNQUFNLGVBQWUsR0FBRztnQkFDdEIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxPQUFPO2dCQUNwQixRQUFRLEVBQUUsR0FBRyxDQUFDLFFBQVE7Z0JBQ3RCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTTtnQkFDbEIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLO2dCQUNoQixLQUFLLEVBQUUsTUFBQSxHQUFHLENBQUMsS0FBSywwQ0FBRSxLQUFLLEVBQUUsaURBQWlEO2FBQzNFLENBQUM7WUFFRixVQUFVLENBQUMsV0FBVyxDQUFDO2dCQUNyQixFQUFFLEVBQUUsT0FBTztnQkFDWCxLQUFLLEVBQUUsZUFBZTthQUN2QixDQUFDLENBQUM7U0FDSjthQUFNO1lBQ0wsaUJBQWlCLEdBQUcsR0FBRyxDQUFDO1NBQ3pCO0lBQ0gsQ0FBQyxDQUFDO0lBRUYsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBQ3BELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxDQUMzRCxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FDMUIsQ0FBQztBQUNKLENBQUMsQ0FBQyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gKCkge1xuICBpZiAod2luZG93LmxvY2F0aW9uLmhyZWYuaW5jbHVkZXMoJ2ZyYW1ld29yaz1WSVRFJykpIHtcbiAgICBjb25zdCBzaG93RXJyb3JPdmVybGF5ID0gKGVycikgPT4ge1xuICAgICAgLy8gbXVzdCBiZSB3aXRoaW4gZnVuY3Rpb24gY2FsbCBiZWNhdXNlIHRoYXQncyB3aGVuIHRoZSBlbGVtZW50IGlzIGRlZmluZWQgZm9yIHN1cmUuXG4gICAgICBjb25zdCBFcnJvck92ZXJsYXkgPSBjdXN0b21FbGVtZW50cy5nZXQoJ3ZpdGUtZXJyb3Itb3ZlcmxheScpO1xuICAgICAgLy8gZG9uJ3Qgb3BlbiBvdXRzaWRlIHZpdGUgZW52aXJvbm1lbnRcbiAgICAgIGlmICghRXJyb3JPdmVybGF5KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG92ZXJsYXkgPSBuZXcgRXJyb3JPdmVybGF5KGVycik7XG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG92ZXJsYXkpO1xuICAgIH07XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgc2hvd0Vycm9yT3ZlcmxheSk7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3VuaGFuZGxlZHJlamVjdGlvbicsICh7IHJlYXNvbiB9KSA9PlxuICAgICAgc2hvd0Vycm9yT3ZlcmxheShyZWFzb24pLFxuICAgICk7XG4gIH1cblxuICBsZXQgcGFyZW50UG9ydCA9IG51bGw7XG4gIGxldCBxdWV1ZWRFcnJvclRvU2VuZCA9IG51bGw7XG5cbiAgLy8gU2V0dXAgdGhlIHRyYW5zZmVyZWQgcG9ydFxuICBjb25zdCBpbml0UG9ydCA9IChlKSA9PiB7XG4gICAgaWYgKGUuZGF0YSA9PT0gJ2luaXQnKSB7XG4gICAgICBwYXJlbnRQb3J0ID0gZS5wb3J0c1swXTtcbiAgICAgIGlmIChxdWV1ZWRFcnJvclRvU2VuZCkge1xuICAgICAgICBzZW5kRXJyb3JUb1BhcmVudChxdWV1ZWRFcnJvclRvU2VuZCk7XG4gICAgICAgIHF1ZXVlZEVycm9yVG9TZW5kID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gTGlzdGVuIGZvciB0aGUgaW50aWFsIHBvcnQgdHJhbnNmZXIgbWVzc2FnZVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGluaXRQb3J0KTtcblxuICBjb25zdCBzZW5kRXJyb3JUb1BhcmVudCA9IChlcnIpID0+IHtcbiAgICBpZiAocGFyZW50UG9ydCkge1xuICAgICAgY29uc3Qgc2VyaWFsaXplZEVycm9yID0ge1xuICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcbiAgICAgICAgZmlsZW5hbWU6IGVyci5maWxlbmFtZSxcbiAgICAgICAgbGluZW5vOiBlcnIubGluZW5vLFxuICAgICAgICBjb2xubzogZXJyLmNvbG5vLFxuICAgICAgICBzdGFjazogZXJyLmVycm9yPy5zdGFjaywgLy8gT3B0aW9uYWwgY2hhaW5pbmcgaW4gY2FzZSBgZXJyb3JgIGlzIHVuZGVmaW5lZFxuICAgICAgfTtcblxuICAgICAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSh7XG4gICAgICAgIGlkOiAnRVJST1InLFxuICAgICAgICBlcnJvcjogc2VyaWFsaXplZEVycm9yLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHF1ZXVlZEVycm9yVG9TZW5kID0gZXJyO1xuICAgIH1cbiAgfTtcblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCBzZW5kRXJyb3JUb1BhcmVudCk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd1bmhhbmRsZWRyZWplY3Rpb24nLCAoeyByZWFzb24gfSkgPT5cbiAgICBzZW5kRXJyb3JUb1BhcmVudChyZWFzb24pLFxuICApO1xufSkoKTtcbiJdfQ==