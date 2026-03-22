"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MutationToolName = exports.IntentClassification = void 0;
var IntentClassification;
(function (IntentClassification) {
    IntentClassification["ADD_FUNCTIONALITY"] = "add_functionality";
    IntentClassification["MODIFY_CONFIGURATION"] = "modify_configuration";
    IntentClassification["REWIRE_LOGIC"] = "rewire_logic";
    IntentClassification["FIX_VALIDATION"] = "fix_validation";
    IntentClassification["CLEANUP"] = "cleanup";
    IntentClassification["UNKNOWN"] = "unknown";
})(IntentClassification || (exports.IntentClassification = IntentClassification = {}));
var MutationToolName;
(function (MutationToolName) {
    MutationToolName["UPDATE_PARTIAL"] = "n8n_workflow_update_partial";
    MutationToolName["UPDATE_FULL"] = "n8n_workflow_update_full";
})(MutationToolName || (exports.MutationToolName = MutationToolName = {}));
//# sourceMappingURL=mutation-types.js.map