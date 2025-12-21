/**
 * DDI (Direct Device Integration) API Types
 * Based on: docs/api-spec/directdeviceintegration/openapi.json
 */

// ============================================================
// Links
// ============================================================

export interface Link {
    href: string;
    hreflang?: string;
    title?: string;
    type?: string;
    deprecation?: string;
    profile?: string;
    name?: string;
    templated?: boolean;
}

export interface Links {
    [key: string]: Link;
}

// ============================================================
// Controller Base (Polling Response)
// ============================================================

export interface DdiPolling {
    /** Sleep time in HH:MM:SS notation */
    sleep: string;
}

export interface DdiConfig {
    polling?: DdiPolling;
}

export interface DdiControllerBase {
    config?: DdiConfig;
    _links?: Links;
}

// ============================================================
// Deployment
// ============================================================

export interface DdiArtifactHash {
    sha1?: string;
    md5?: string;
    sha256?: string;
}

export interface DdiArtifact {
    filename: string;
    hashes?: DdiArtifactHash;
    size?: number;
    _links?: Links;
}

export interface DdiMetadata {
    key: string;
    value: string;
}

export interface DdiChunk {
    /** Type of the chunk, e.g. firmware, bundle, app */
    part: string;
    /** Software version */
    version: string;
    /** Name of the chunk */
    name: string;
    /** If encrypted */
    encrypted?: boolean;
    /** List of artifacts */
    artifacts?: DdiArtifact[];
    /** Metadata visible to target */
    metadata?: DdiMetadata[];
}

export type DdiDownloadType = 'skip' | 'attempt' | 'forced';
export type DdiUpdateType = 'skip' | 'attempt' | 'forced';
export type DdiMaintenanceWindow = 'available' | 'unavailable';

export interface DdiDeployment {
    download?: DdiDownloadType;
    update?: DdiUpdateType;
    chunks: DdiChunk[];
    maintenanceWindow?: DdiMaintenanceWindow;
}

export interface DdiActionHistory {
    status?: string;
    messages?: string[];
}

export interface DdiDeploymentBase {
    id: string;
    deployment: DdiDeployment;
    actionHistory?: DdiActionHistory;
    _links?: Links;
}

// ============================================================
// Feedback
// ============================================================

export type DdiExecutionStatus =
    | 'closed'
    | 'proceeding'
    | 'canceled'
    | 'scheduled'
    | 'rejected'
    | 'resumed'
    | 'downloaded'
    | 'download';

export type DdiFinishedResult = 'success' | 'failure' | 'none';

export interface DdiProgress {
    cnt: number;
    of?: number;
}

export interface DdiResult {
    finished: DdiFinishedResult;
    progress?: DdiProgress;
}

export interface DdiStatus {
    execution: DdiExecutionStatus;
    result: DdiResult;
    code?: number;
    details?: string[];
}

export interface DdiActionFeedback {
    status: DdiStatus;
    /** Timestamp in milliseconds */
    timestamp?: number;
}

// ============================================================
// Config Data
// ============================================================

export type DdiConfigDataMode = 'merge' | 'replace' | 'remove';

export interface DdiConfigData {
    data: Record<string, string>;
    mode?: DdiConfigDataMode;
}

// ============================================================
// Confirmation
// ============================================================

export type DdiConfirmationType = 'confirmed' | 'denied';

export interface DdiConfirmationFeedback {
    confirmation: DdiConfirmationType;
    code?: number;
    details?: string[];
}

export interface DdiAutoConfirmationState {
    active: boolean;
    initiator?: string;
    remark?: string;
    activatedAt?: number;
    _links?: Links;
}

export interface DdiConfirmationBase {
    autoConfirm: DdiAutoConfirmationState;
    _links?: Links;
}

export interface DdiConfirmationBaseAction {
    id: string;
    confirmation: DdiDeployment;
    actionHistory?: DdiActionHistory;
    _links?: Links;
}

export interface DdiActivateAutoConfirmation {
    initiator?: string;
    remark?: string;
}

// ============================================================
// Cancel
// ============================================================

export interface DdiCancelActionToStop {
    stopId: string;
}

export interface DdiCancel {
    id?: string;
    cancelAction: DdiCancelActionToStop;
}

// ============================================================
// Assigned Version
// ============================================================

export interface DdiAssignedVersion {
    name: string;
    version: string;
}

// ============================================================
// Exception
// ============================================================

export interface ExceptionInfo {
    exceptionClass?: string;
    errorCode?: string;
    message?: string;
    info?: Record<string, unknown>;
}
