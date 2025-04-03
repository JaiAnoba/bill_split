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
exports.tempo = void 0;
const vite_plugin_pages_1 = __importDefault(require("vite-plugin-pages"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const defaultOptions = {
    pagesDir: 'src/tempobook',
    baseRoute: '/tempobook',
    pathToGlobalStyles: 'src/index.css',
};
function tempo(options) {
    const resolvedOptions = Object.assign(Object.assign({}, defaultOptions), options);
    // Create the pages directory if it doesn't exist
    const pagesDir = path_1.default.join(process.cwd(), resolvedOptions.pagesDir);
    if (!fs_1.default.existsSync(pagesDir)) {
        console.log(`Creating pages directory: ${pagesDir}`);
        fs_1.default.mkdirSync(pagesDir, { recursive: true });
    }
    return [
        (0, vite_plugin_pages_1.default)({
            dirs: [
                { dir: resolvedOptions.pagesDir, baseRoute: resolvedOptions.baseRoute },
            ],
            caseSensitive: true,
            importMode: 'sync',
            // Add debug logs to understand route generation
            onRoutesGenerated: (routes) => {
                console.log(`Routes generated at ${new Date().toISOString()}:`, routes.length);
                if (routes.length === 0) {
                    console.warn('WARNING: Empty routes array generated');
                }
            },
        }),
        {
            name: 'tempo-routes',
            resolveId(id) {
                if (id === 'tempo-routes') {
                    return id;
                }
                return null;
            },
            load(id) {
                if (id === 'tempo-routes') {
                    return `
            import routes from '~react-pages';
            export default routes;
          `;
                }
                return null;
            },
        },
        {
            // If a new file was added we need to make sure it
            // gets picked up by tailwind, so invalidate the global css file
            name: 'vite-plugin-tailwind-hmr',
            configureServer(_server) {
                let server = _server;
                // Add debugging for directory creation
                server.watcher.on('addDir', (dirPath) => {
                    if (dirPath.includes(resolvedOptions.pagesDir)) {
                        console.log(`Directory added: ${dirPath}`);
                    }
                });
                server.watcher.on('add', (filePath) => __awaiter(this, void 0, void 0, function* () {
                    console.log(`File added: ${filePath}`);
                    // Only care about files in the pages dir
                    if (!filePath.includes(resolvedOptions.pagesDir)) {
                        return;
                    }
                    const pathToRepo = filePath.split(resolvedOptions.pagesDir)[0];
                    if (filePath.match(/\.(js|jsx|ts|tsx)$/)) {
                        // Attempt to invalidate route modules to force regeneration
                        try {
                            const timestamp = Date.now();
                            const seen = new Set();
                            // Find and invalidate the Pages virtual module
                            const routesModule = Array.from(server.moduleGraph.idToModuleMap.keys()).find((id) => id.includes('~react-pages') ||
                                id.includes('virtual:generated-pages'));
                            if (routesModule) {
                                console.log(`Invalidating routes module: ${routesModule}`);
                                const mod = server.moduleGraph.getModuleById(routesModule);
                                if (mod) {
                                    server.moduleGraph.invalidateModule(mod, seen, timestamp);
                                    // Send HMR update to refresh routes
                                    setTimeout(() => {
                                        console.log('Sending routes HMR update');
                                        server.ws.send({
                                            type: 'update',
                                            updates: [
                                                {
                                                    type: 'js-update',
                                                    path: routesModule,
                                                    acceptedPath: routesModule,
                                                    timestamp,
                                                },
                                            ],
                                        });
                                    }, 100);
                                }
                            }
                            // Original Tailwind HMR logic
                            const globalStylesModule = server.moduleGraph.idToModuleMap.get(pathToRepo + resolvedOptions.pathToGlobalStyles);
                            if (globalStylesModule) {
                                // Jul 18 2024 - sometimes new added file that is added is not yet processed
                                // by the vite server, need to wait until it is
                                // Note that this function is marked experimental but it works when tested on this date
                                console.log(`Waiting for requests idle: ${filePath}`);
                                yield server.waitForRequestsIdle(filePath);
                                console.log(`Invalidating global styles module`);
                                server.moduleGraph.invalidateModule(globalStylesModule, seen, timestamp);
                            }
                        }
                        catch (e) {
                            console.error('Error during module invalidation:', e);
                        }
                    }
                }));
            },
        },
    ];
}
exports.tempo = tempo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdml0ZS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSwwRUFBc0M7QUFDdEMsNENBQW9CO0FBQ3BCLGdEQUF3QjtBQVF4QixNQUFNLGNBQWMsR0FBMkI7SUFDN0MsUUFBUSxFQUFFLGVBQWU7SUFDekIsU0FBUyxFQUFFLFlBQVk7SUFDdkIsa0JBQWtCLEVBQUUsZUFBZTtDQUNwQyxDQUFDO0FBRUYsU0FBZ0IsS0FBSyxDQUFDLE9BQXNCO0lBQzFDLE1BQU0sZUFBZSxtQ0FBUSxjQUFjLEdBQUssT0FBTyxDQUFFLENBQUM7SUFFMUQsaURBQWlEO0lBQ2pELE1BQU0sUUFBUSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNwRSxJQUFJLENBQUMsWUFBRSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3JELFlBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7S0FDN0M7SUFFRCxPQUFPO1FBQ0wsSUFBQSwyQkFBSyxFQUFDO1lBQ0osSUFBSSxFQUFFO2dCQUNKLEVBQUUsR0FBRyxFQUFFLGVBQWUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLGVBQWUsQ0FBQyxTQUFTLEVBQUU7YUFDeEU7WUFDRCxhQUFhLEVBQUUsSUFBSTtZQUNuQixVQUFVLEVBQUUsTUFBTTtZQUNsQixnREFBZ0Q7WUFDaEQsaUJBQWlCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FDVCx1QkFBdUIsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsR0FB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REFDUDtvREFDRSxJQUFJLEVBQUUsV0FBVztvREFDakIsSUFBSSxFQUFFLFlBQVk7b0RBQ2xCLFlBQVksRUFBRSxZQUFZO29EQUMxQixTQUFTO2lEQUNWOzZDQUNGO3lDQUNGLENBQUMsQ0FBQztvQ0FDTCxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7aUNBQ1Q7NkJBQ0Y7NEJBRUQsOEJBQThCOzRCQUM5QixNQUFNLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDN0QsVUFBVSxHQUFHLGVBQWUsQ0FBQyxrQkFBa0IsQ0FDaEQsQ0FBQzs0QkFFRixJQUFJLGtCQUFrQixFQUFFO2dDQUN0Qiw0RUFBNEU7Z0NBQzVFLCtDQUErQztnQ0FDL0MsdUZBQXVGO2dDQUN2RixPQUFPLENBQUMsR0FBRyxDQUFDLDhCQUE4QixRQUFRLEVBQUUsQ0FBQyxDQUFDO2dDQUN0RCxNQUFNLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQ0FDM0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO2dDQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUNqQyxrQkFBa0IsRUFDbEIsSUFBSSxFQUNKLFNBQVMsQ0FDVixDQUFDOzZCQUNIO3lCQUNGO3dCQUFDLE9BQU8sQ0FBQyxFQUFFOzRCQUNWLE9BQU8sQ0FBQyxLQUFLLENBQUMsbUNBQW1DLEVBQUUsQ0FBQyxDQUFDLENBQUM7eUJBQ3ZEO3FCQUNGO2dCQUNILENBQUMsQ0FBQSxDQUFDLENBQUM7WUFDTCxDQUFDO1NBQ0Y7S0FDRixDQUFDO0FBQ0osQ0FBQztBQXRJRCxzQkFzSUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2R1bGVOb2RlLCBQbHVnaW5PcHRpb24sIFZpdGVEZXZTZXJ2ZXIgfSBmcm9tICd2aXRlJztcbmltcG9ydCBQYWdlcyBmcm9tICd2aXRlLXBsdWdpbi1wYWdlcyc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmludGVyZmFjZSBUZW1wb09wdGlvbnMge1xuICBwYWdlc0Rpcj86IHN0cmluZztcbiAgYmFzZVJvdXRlPzogc3RyaW5nO1xuICBwYXRoVG9HbG9iYWxTdHlsZXM/OiBzdHJpbmc7XG59XG5cbmNvbnN0IGRlZmF1bHRPcHRpb25zOiBSZXF1aXJlZDxUZW1wb09wdGlvbnM+ID0ge1xuICBwYWdlc0RpcjogJ3NyYy90ZW1wb2Jvb2snLFxuICBiYXNlUm91dGU6ICcvdGVtcG9ib29rJyxcbiAgcGF0aFRvR2xvYmFsU3R5bGVzOiAnc3JjL2luZGV4LmNzcycsXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gdGVtcG8ob3B0aW9ucz86IFRlbXBvT3B0aW9ucyk6IFBsdWdpbk9wdGlvbltdIHtcbiAgY29uc3QgcmVzb2x2ZWRPcHRpb25zID0geyAuLi5kZWZhdWx0T3B0aW9ucywgLi4ub3B0aW9ucyB9O1xuXG4gIC8vIENyZWF0ZSB0aGUgcGFnZXMgZGlyZWN0b3J5IGlmIGl0IGRvZXNuJ3QgZXhpc3RcbiAgY29uc3QgcGFnZXNEaXIgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgcmVzb2x2ZWRPcHRpb25zLnBhZ2VzRGlyKTtcbiAgaWYgKCFmcy5leGlzdHNTeW5jKHBhZ2VzRGlyKSkge1xuICAgIGNvbnNvbGUubG9nKGBDcmVhdGluZyBwYWdlcyBkaXJlY3Rvcnk6ICR7cGFnZXNEaXJ9YCk7XG4gICAgZnMubWtkaXJTeW5jKHBhZ2VzRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgUGFnZXMoe1xuICAgICAgZGlyczogW1xuICAgICAgICB7IGRpcjogcmVzb2x2ZWRPcHRpb25zLnBhZ2VzRGlyLCBiYXNlUm91dGU6IHJlc29sdmVkT3B0aW9ucy5iYXNlUm91dGUgfSxcbiAgICAgIF0sXG4gICAgICBjYXNlU2Vuc2l0aXZlOiB0cnVlLFxuICAgICAgaW1wb3J0TW9kZTogJ3N5bmMnLFxuICAgICAgLy8gQWRkIGRlYnVnIGxvZ3MgdG8gdW5kZXJzdGFuZCByb3V0ZSBnZW5lcmF0aW9uXG4gICAgICBvblJvdXRlc0dlbmVyYXRlZDogKHJvdXRlcykgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICBgUm91dGVzIGdlbmVyYXRlZCBhdCAke25ldyBEYXRlKCkudG9JU09TdHJpbmcoKX06YCxcbiAgICAgICAgICByb3V0ZXMubGVuZ3RoLFxuICAgICAgICApO1xuICAgICAgICBpZiAocm91dGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGNvbnNvbGUud2FybignV0FSTklORzogRW1wdHkgcm91dGVzIGFycmF5IGdlbmVyYXRlZCcpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0pLFxuICAgIHtcbiAgICAgIG5hbWU6ICd0ZW1wby1yb3V0ZXMnLFxuICAgICAgcmVzb2x2ZUlkKGlkKSB7XG4gICAgICAgIGlmIChpZCA9PT0gJ3RlbXBvLXJvdXRlcycpIHtcbiAgICAgICAgICByZXR1cm4gaWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9LFxuICAgICAgbG9hZChpZCkge1xuICAgICAgICBpZiAoaWQgPT09ICd0ZW1wby1yb3V0ZXMnKSB7XG4gICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgIGltcG9ydCByb3V0ZXMgZnJvbSAnfnJlYWN0LXBhZ2VzJztcbiAgICAgICAgICAgIGV4cG9ydCBkZWZhdWx0IHJvdXRlcztcbiAgICAgICAgICBgO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIC8vIElmIGEgbmV3IGZpbGUgd2FzIGFkZGVkIHdlIG5lZWQgdG8gbWFrZSBzdXJlIGl0XG4gICAgICAvLyBnZXRzIHBpY2tlZCB1cCBieSB0YWlsd2luZCwgc28gaW52YWxpZGF0ZSB0aGUgZ2xvYmFsIGNzcyBmaWxlXG4gICAgICBuYW1lOiAndml0ZS1wbHVnaW4tdGFpbHdpbmQtaG1yJyxcbiAgICAgIGNvbmZpZ3VyZVNlcnZlcihfc2VydmVyKSB7XG4gICAgICAgIGxldCBzZXJ2ZXI6IFZpdGVEZXZTZXJ2ZXIgPSBfc2VydmVyO1xuXG4gICAgICAgIC8vIEFkZCBkZWJ1Z2dpbmcgZm9yIGRpcmVjdG9yeSBjcmVhdGlvblxuICAgICAgICBzZXJ2ZXIud2F0Y2hlci5vbignYWRkRGlyJywgKGRpclBhdGgpID0+IHtcbiAgICAgICAgICBpZiAoZGlyUGF0aC5pbmNsdWRlcyhyZXNvbHZlZE9wdGlvbnMucGFnZXNEaXIpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgRGlyZWN0b3J5IGFkZGVkOiAke2RpclBhdGh9YCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBzZXJ2ZXIud2F0Y2hlci5vbignYWRkJywgYXN5bmMgKGZpbGVQYXRoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coYEZpbGUgYWRkZWQ6ICR7ZmlsZVBhdGh9YCk7XG5cbiAgICAgICAgICAvLyBPbmx5IGNhcmUgYWJvdXQgZmlsZXMgaW4gdGhlIHBhZ2VzIGRpclxuICAgICAgICAgIGlmICghZmlsZVBhdGguaW5jbHVkZXMocmVzb2x2ZWRPcHRpb25zLnBhZ2VzRGlyKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHBhdGhUb1JlcG8gPSBmaWxlUGF0aC5zcGxpdChyZXNvbHZlZE9wdGlvbnMucGFnZXNEaXIpWzBdO1xuICAgICAgICAgIGlmIChmaWxlUGF0aC5tYXRjaCgvXFwuKGpzfGpzeHx0c3x0c3gpJC8pKSB7XG4gICAgICAgICAgICAvLyBBdHRlbXB0IHRvIGludmFsaWRhdGUgcm91dGUgbW9kdWxlcyB0byBmb3JjZSByZWdlbmVyYXRpb25cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0PE1vZHVsZU5vZGU+KCk7XG5cbiAgICAgICAgICAgICAgLy8gRmluZCBhbmQgaW52YWxpZGF0ZSB0aGUgUGFnZXMgdmlydHVhbCBtb2R1bGVcbiAgICAgICAgICAgICAgY29uc3Qgcm91dGVzTW9kdWxlID0gQXJyYXkuZnJvbShcbiAgICAgICAgICAgICAgICBzZXJ2ZXIubW9kdWxlR3JhcGguaWRUb01vZHVsZU1hcC5rZXlzKCksXG4gICAgICAgICAgICAgICkuZmluZChcbiAgICAgICAgICAgICAgICAoaWQpID0+XG4gICAgICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnfnJlYWN0LXBhZ2VzJykgfHxcbiAgICAgICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCd2aXJ0dWFsOmdlbmVyYXRlZC1wYWdlcycpLFxuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgIGlmIChyb3V0ZXNNb2R1bGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgSW52YWxpZGF0aW5nIHJvdXRlcyBtb2R1bGU6ICR7cm91dGVzTW9kdWxlfWApO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1vZCA9IHNlcnZlci5tb2R1bGVHcmFwaC5nZXRNb2R1bGVCeUlkKHJvdXRlc01vZHVsZSk7XG4gICAgICAgICAgICAgICAgaWYgKG1vZCkge1xuICAgICAgICAgICAgICAgICAgc2VydmVyLm1vZHVsZUdyYXBoLmludmFsaWRhdGVNb2R1bGUobW9kLCBzZWVuLCB0aW1lc3RhbXApO1xuXG4gICAgICAgICAgICAgICAgICAvLyBTZW5kIEhNUiB1cGRhdGUgdG8gcmVmcmVzaCByb3V0ZXNcbiAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnU2VuZGluZyByb3V0ZXMgSE1SIHVwZGF0ZScpO1xuICAgICAgICAgICAgICAgICAgICBzZXJ2ZXIud3Muc2VuZCh7XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3VwZGF0ZScsXG4gICAgICAgICAgICAgICAgICAgICAgdXBkYXRlczogW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnanMtdXBkYXRlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogcm91dGVzTW9kdWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBhY2NlcHRlZFBhdGg6IHJvdXRlc01vZHVsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gT3JpZ2luYWwgVGFpbHdpbmQgSE1SIGxvZ2ljXG4gICAgICAgICAgICAgIGNvbnN0IGdsb2JhbFN0eWxlc01vZHVsZSA9IHNlcnZlci5tb2R1bGVHcmFwaC5pZFRvTW9kdWxlTWFwLmdldChcbiAgICAgICAgICAgICAgICBwYXRoVG9SZXBvICsgcmVzb2x2ZWRPcHRpb25zLnBhdGhUb0dsb2JhbFN0eWxlcyxcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICBpZiAoZ2xvYmFsU3R5bGVzTW9kdWxlKSB7XG4gICAgICAgICAgICAgICAgLy8gSnVsIDE4IDIwMjQgLSBzb21ldGltZXMgbmV3IGFkZGVkIGZpbGUgdGhhdCBpcyBhZGRlZCBpcyBub3QgeWV0IHByb2Nlc3NlZFxuICAgICAgICAgICAgICAgIC8vIGJ5IHRoZSB2aXRlIHNlcnZlciwgbmVlZCB0byB3YWl0IHVudGlsIGl0IGlzXG4gICAgICAgICAgICAgICAgLy8gTm90ZSB0aGF0IHRoaXMgZnVuY3Rpb24gaXMgbWFya2VkIGV4cGVyaW1lbnRhbCBidXQgaXQgd29ya3Mgd2hlbiB0ZXN0ZWQgb24gdGhpcyBkYXRlXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFdhaXRpbmcgZm9yIHJlcXVlc3RzIGlkbGU6ICR7ZmlsZVBhdGh9YCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgc2VydmVyLndhaXRGb3JSZXF1ZXN0c0lkbGUoZmlsZVBhdGgpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBJbnZhbGlkYXRpbmcgZ2xvYmFsIHN0eWxlcyBtb2R1bGVgKTtcbiAgICAgICAgICAgICAgICBzZXJ2ZXIubW9kdWxlR3JhcGguaW52YWxpZGF0ZU1vZHVsZShcbiAgICAgICAgICAgICAgICAgIGdsb2JhbFN0eWxlc01vZHVsZSxcbiAgICAgICAgICAgICAgICAgIHNlZW4sXG4gICAgICAgICAgICAgICAgICB0aW1lc3RhbXAsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBkdXJpbmcgbW9kdWxlIGludmFsaWRhdGlvbjonLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9LFxuICBdO1xufVxuIl19