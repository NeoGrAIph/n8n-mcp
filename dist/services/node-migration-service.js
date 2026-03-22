"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeMigrationService = void 0;
class NodeMigrationService {
    constructor(versionService, breakingChangeDetector) {
        this.versionService = versionService;
        this.breakingChangeDetector = breakingChangeDetector;
    }
    async migrateNode(node, fromVersion, toVersion) {
        const nodeId = node.id || 'unknown';
        const nodeName = node.name || 'Unknown Node';
        const nodeType = node.type;
        const analysis = await this.breakingChangeDetector.analyzeVersionUpgrade(nodeType, fromVersion, toVersion);
        const migratedNode = JSON.parse(JSON.stringify(node));
        migratedNode.typeVersion = this.parseVersion(toVersion);
        const appliedMigrations = [];
        const remainingIssues = [];
        for (const change of analysis.changes.filter(c => c.autoMigratable)) {
            const migration = this.applyMigration(migratedNode, change);
            if (migration) {
                appliedMigrations.push(migration);
            }
        }
        for (const change of analysis.changes.filter(c => !c.autoMigratable)) {
            remainingIssues.push(`Manual action required for "${change.propertyName}": ${change.migrationHint}`);
        }
        let confidence = 'HIGH';
        if (remainingIssues.length > 0) {
            confidence = remainingIssues.length > 3 ? 'LOW' : 'MEDIUM';
        }
        return {
            success: remainingIssues.length === 0,
            nodeId,
            nodeName,
            fromVersion,
            toVersion,
            appliedMigrations,
            remainingIssues,
            confidence,
            updatedNode: migratedNode
        };
    }
    applyMigration(node, change) {
        if (!change.migrationStrategy)
            return null;
        const { type, defaultValue, sourceProperty, targetProperty } = change.migrationStrategy;
        switch (type) {
            case 'add_property':
                return this.addProperty(node, change.propertyName, defaultValue, change);
            case 'remove_property':
                return this.removeProperty(node, change.propertyName, change);
            case 'rename_property':
                return this.renameProperty(node, sourceProperty, targetProperty, change);
            case 'set_default':
                return this.setDefault(node, change.propertyName, defaultValue, change);
            default:
                return null;
        }
    }
    addProperty(node, propertyPath, defaultValue, change) {
        const value = this.resolveDefaultValue(propertyPath, defaultValue, node);
        const parts = propertyPath.split('.');
        let target = node;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!target[part]) {
                target[part] = {};
            }
            target = target[part];
        }
        const finalKey = parts[parts.length - 1];
        target[finalKey] = value;
        return {
            propertyName: propertyPath,
            action: 'Added property',
            newValue: value,
            description: `Added "${propertyPath}" with default value`
        };
    }
    removeProperty(node, propertyPath, change) {
        const parts = propertyPath.split('.');
        let target = node;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!target[part])
                return null;
            target = target[part];
        }
        const finalKey = parts[parts.length - 1];
        const oldValue = target[finalKey];
        if (oldValue !== undefined) {
            delete target[finalKey];
            return {
                propertyName: propertyPath,
                action: 'Removed property',
                oldValue,
                description: `Removed deprecated property "${propertyPath}"`
            };
        }
        return null;
    }
    renameProperty(node, sourcePath, targetPath, change) {
        const sourceParts = sourcePath.split('.');
        let sourceTarget = node;
        for (let i = 0; i < sourceParts.length - 1; i++) {
            if (!sourceTarget[sourceParts[i]])
                return null;
            sourceTarget = sourceTarget[sourceParts[i]];
        }
        const sourceKey = sourceParts[sourceParts.length - 1];
        const oldValue = sourceTarget[sourceKey];
        if (oldValue === undefined)
            return null;
        const targetParts = targetPath.split('.');
        let targetTarget = node;
        for (let i = 0; i < targetParts.length - 1; i++) {
            if (!targetTarget[targetParts[i]]) {
                targetTarget[targetParts[i]] = {};
            }
            targetTarget = targetTarget[targetParts[i]];
        }
        const targetKey = targetParts[targetParts.length - 1];
        targetTarget[targetKey] = oldValue;
        delete sourceTarget[sourceKey];
        return {
            propertyName: targetPath,
            action: 'Renamed property',
            oldValue: `${sourcePath}: ${JSON.stringify(oldValue)}`,
            newValue: `${targetPath}: ${JSON.stringify(oldValue)}`,
            description: `Renamed "${sourcePath}" to "${targetPath}"`
        };
    }
    setDefault(node, propertyPath, defaultValue, change) {
        const parts = propertyPath.split('.');
        let target = node;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!target[parts[i]]) {
                target[parts[i]] = {};
            }
            target = target[parts[i]];
        }
        const finalKey = parts[parts.length - 1];
        if (target[finalKey] === undefined) {
            const value = this.resolveDefaultValue(propertyPath, defaultValue, node);
            if (value === undefined)
                return null;
            target[finalKey] = value;
            return {
                propertyName: propertyPath,
                action: 'Set default value',
                newValue: value,
                description: `Set default value for "${propertyPath}"`
            };
        }
        return null;
    }
    resolveDefaultValue(propertyPath, defaultValue, node) {
        if (propertyPath === 'webhookId' || propertyPath.endsWith('.webhookId')) {
            return undefined;
        }
        if (propertyPath === 'path' || propertyPath.endsWith('.path')) {
            if (node.type === 'n8n-nodes-base.webhook') {
                return `/webhook-${Date.now()}`;
            }
        }
        return defaultValue !== null && defaultValue !== undefined ? defaultValue : null;
    }
    parseVersion(version) {
        const parts = version.split('.').map(Number);
        if (parts.length === 1)
            return parts[0];
        if (parts.length === 2)
            return parts[0] + parts[1] / 10;
        return parts[0];
    }
    async validateMigratedNode(node, nodeType) {
        const errors = [];
        const warnings = [];
        if (!node.typeVersion) {
            errors.push('Missing typeVersion after migration');
        }
        if (!node.parameters) {
            errors.push('Missing parameters object');
        }
        if (nodeType === 'n8n-nodes-base.webhook') {
            if (!node.parameters?.path) {
                errors.push('Webhook node missing required "path" parameter');
            }
            if (node.typeVersion >= 2.1 && !node.webhookId) {
                warnings.push('Webhook v2.1+ uses webhookId assigned by n8n; omit it in API payloads');
            }
        }
        if (nodeType === 'n8n-nodes-base.executeWorkflow') {
            if (node.typeVersion >= 1.1 && !node.parameters?.inputFieldMapping) {
                errors.push('Execute Workflow v1.1+ requires inputFieldMapping');
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    async migrateWorkflowNodes(workflow, targetVersions) {
        const results = [];
        for (const node of workflow.nodes || []) {
            const targetVersion = targetVersions[node.id];
            if (targetVersion && node.typeVersion) {
                const currentVersion = node.typeVersion.toString();
                const result = await this.migrateNode(node, currentVersion, targetVersion);
                results.push(result);
                Object.assign(node, result.updatedNode);
            }
        }
        const confidences = results.map(r => r.confidence);
        let overallConfidence = 'HIGH';
        if (confidences.includes('LOW')) {
            overallConfidence = 'LOW';
        }
        else if (confidences.includes('MEDIUM')) {
            overallConfidence = 'MEDIUM';
        }
        const success = results.every(r => r.success);
        return {
            success,
            results,
            overallConfidence
        };
    }
}
exports.NodeMigrationService = NodeMigrationService;
//# sourceMappingURL=node-migration-service.js.map