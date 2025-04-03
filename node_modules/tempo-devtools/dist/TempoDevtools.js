"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TempoDevtools = void 0;
const channelMessaging_1 = require("./channelMessaging");
exports.TempoDevtools = {
    state: {
        dependencies: {
            LzString: null,
        },
        env: {},
    },
    // Initialization method
    init: function (customEnv = {}) {
        if (customEnv) {
            this.state.env = Object.assign({}, customEnv);
        }
        (0, channelMessaging_1.initChannelMessaging)();
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGVtcG9EZXZ0b29scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9UZW1wb0RldnRvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHlEQUEwRDtBQUU3QyxRQUFBLGFBQWEsR0FBRztJQUMzQixLQUFLLEVBQUU7UUFDTCxZQUFZLEVBQUU7WUFDWixRQUFRLEVBQUUsSUFBSTtTQUNmO1FBQ0QsR0FBRyxFQUFFLEVBQUU7S0FDUjtJQUVELHdCQUF3QjtJQUN4QixJQUFJLEVBQUUsVUFBVSxTQUFTLEdBQUcsRUFBRTtRQUM1QixJQUFJLFNBQVMsRUFBRTtZQUNiLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxxQkFDVCxTQUFTLENBQ2IsQ0FBQztTQUNIO1FBRUQsSUFBQSx1Q0FBb0IsR0FBRSxDQUFDO0lBQ3pCLENBQUM7Q0FDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaW5pdENoYW5uZWxNZXNzYWdpbmcgfSBmcm9tICcuL2NoYW5uZWxNZXNzYWdpbmcnO1xuXG5leHBvcnQgY29uc3QgVGVtcG9EZXZ0b29scyA9IHtcbiAgc3RhdGU6IHtcbiAgICBkZXBlbmRlbmNpZXM6IHtcbiAgICAgIEx6U3RyaW5nOiBudWxsLFxuICAgIH0sXG4gICAgZW52OiB7fSxcbiAgfSxcblxuICAvLyBJbml0aWFsaXphdGlvbiBtZXRob2RcbiAgaW5pdDogZnVuY3Rpb24gKGN1c3RvbUVudiA9IHt9KSB7XG4gICAgaWYgKGN1c3RvbUVudikge1xuICAgICAgdGhpcy5zdGF0ZS5lbnYgPSB7XG4gICAgICAgIC4uLmN1c3RvbUVudixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaW5pdENoYW5uZWxNZXNzYWdpbmcoKTtcbiAgfSxcbn07XG4iXX0=