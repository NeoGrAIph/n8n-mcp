#!/usr/bin/env node
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedCanonicalExamples = seedCanonicalExamples;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const database_adapter_1 = require("../database/database-adapter");
const logger_1 = require("../utils/logger");
async function seedCanonicalExamples() {
    try {
        const examplesPath = path.join(__dirname, '../data/canonical-ai-tool-examples.json');
        const examplesData = fs.readFileSync(examplesPath, 'utf-8');
        const canonicalExamples = JSON.parse(examplesData);
        logger_1.logger.info('Loading canonical AI tool examples', {
            version: canonicalExamples.version,
            tools: canonicalExamples.examples.length
        });
        const db = await (0, database_adapter_1.createDatabaseAdapter)('./data/nodes.db');
        const templateStmt = db.prepare(`
      INSERT OR IGNORE INTO templates (
        id,
        workflow_id,
        name,
        description,
        views,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
        const canonicalTemplateId = -1000;
        templateStmt.run(canonicalTemplateId, canonicalTemplateId, 'Canonical AI Tool Examples', 'Hand-crafted examples demonstrating best practices for AI tools', 99999);
        const stmt = db.prepare(`
      INSERT OR REPLACE INTO template_node_configs (
        node_type,
        template_id,
        template_name,
        template_views,
        node_name,
        parameters_json,
        credentials_json,
        has_credentials,
        has_expressions,
        complexity,
        use_cases
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        let totalInserted = 0;
        for (const toolExamples of canonicalExamples.examples) {
            const { node_type, display_name, examples } = toolExamples;
            logger_1.logger.info(`Seeding examples for ${display_name}`, {
                nodeType: node_type,
                exampleCount: examples.length
            });
            for (let i = 0; i < examples.length; i++) {
                const example = examples[i];
                const templateId = canonicalTemplateId;
                const templateName = `Canonical: ${display_name} - ${example.name}`;
                const paramsStr = JSON.stringify(example.parameters);
                const hasExpressions = paramsStr.includes('={{') || paramsStr.includes('$json') || paramsStr.includes('$node') ? 1 : 0;
                stmt.run(node_type, templateId, templateName, 99999, example.name, JSON.stringify(example.parameters), example.credentials ? JSON.stringify(example.credentials) : null, example.credentials ? 1 : 0, hasExpressions, example.complexity, example.use_case);
                totalInserted++;
                logger_1.logger.info(`  ✓ Seeded: ${example.name}`, {
                    complexity: example.complexity,
                    hasCredentials: !!example.credentials,
                    hasExpressions: hasExpressions === 1
                });
            }
        }
        db.close();
        logger_1.logger.info('Canonical examples seeding complete', {
            totalExamples: totalInserted,
            tools: canonicalExamples.examples.length
        });
        console.log('\n✅ Successfully seeded', totalInserted, 'canonical AI tool examples');
        console.log('\nExamples are now available via:');
        console.log('  • n8n_nodes_search({query: "HTTP Request Tool", includeExamples: true})');
        console.log('  • get_node_essentials({nodeType: "nodes-langchain.toolCode", includeExamples: true})');
    }
    catch (error) {
        logger_1.logger.error('Failed to seed canonical examples', { error });
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    seedCanonicalExamples().catch(console.error);
}
//# sourceMappingURL=seed-canonical-ai-examples.js.map