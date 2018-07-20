"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appIdentityProviderHostResolver = (environment) => {
    switch (environment) {
        case 'LOCAL':
            return 'http://localhost:3000';
        case 'DEV':
            return 'https://aip-dev.upcode-api.co';
        case 'STAGE':
            return 'https://aip-stage.upcode-api.co';
        case 'PROD':
            return 'https://aip.upcode-api.co';
    }
};
//# sourceMappingURL=host-resolver.js.map