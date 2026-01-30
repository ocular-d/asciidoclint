"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.AsciiDocLinter = void 0;
const core_1 = __importDefault(require("@asciidoctor/core"));
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('asciidoclint:core');
class AsciiDocLinter {
    constructor(config = { rules: {} }) {
        this.rules = new Map();
        this.asciidoc = (0, core_1.default)();
        this.config = config;
        debug('Linter initialized with config: %O', config);
    }
    addRule(rule) {
        this.rules.set(rule.name, rule);
        debug('Added rule: %s', rule.name);
    }
    removeRule(ruleName) {
        this.rules.delete(ruleName);
        debug('Removed rule: %s', ruleName);
    }
    lintText(content, filename) {
        debug('Linting content for file: %s', filename || 'unnamed');
        const document = this.asciidoc.load(content);
        const context = {
            filename,
            options: this.config
        };
        const messages = [];
        let errorCount = 0;
        let warningCount = 0;
        for (const [ruleName, rule] of this.rules) {
            const ruleConfig = this.config.rules[ruleName];
            if (ruleConfig === 'off') {
                continue;
            }
            try {
                const ruleMessages = rule.check(document, context);
                for (const message of ruleMessages) {
                    // Override severity based on config
                    const severity = ruleConfig || rule.severity;
                    const lintMessage = {
                        ...message,
                        severity
                    };
                    messages.push(lintMessage);
                    if (severity === 'error') {
                        errorCount++;
                    }
                    else if (severity === 'warning') {
                        warningCount++;
                    }
                }
            }
            catch (error) {
                debug('Error running rule %s: %O', ruleName, error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                messages.push({
                    rule: ruleName,
                    message: `Rule error: ${errorMessage}`,
                    severity: 'error'
                });
                errorCount++;
            }
        }
        const result = {
            filename: filename || 'unnamed',
            messages,
            errorCount,
            warningCount
        };
        debug('Linting complete. Errors: %d, Warnings: %d', errorCount, warningCount);
        return result;
    }
    async lintFile(filepath) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const content = await fs.readFile(filepath, 'utf8');
        return this.lintText(content, filepath);
    }
}
exports.AsciiDocLinter = AsciiDocLinter;
exports.default = AsciiDocLinter;
__exportStar(require("./types"), exports);
