# Action Management PRD

## 1. Goal
Provide a comprehensive interface for monitoring and controlling update actions, allowing operators to track progress, debug issues, and intervene (cancel/force) when necessary.

## 2. Feature Analysis (OpenAPI vs. Requirement)

### 2.1 Capability Gap Analysis

| Feature | OpenAPI Support | Current UI Status | Planned Improvement |
| :--- | :--- | :--- | :--- |
| **List Actions** | `GET /rest/v1/actions` (Supports Paging, Sort, FIQL) | Implemented (Basic) | Add Advanced Filtering (FIQL Builder), Date Range Filter |
| **Action Detail** | `GET /rest/v1/actions/{id}` | Basic View | Add Metadata, Relations (Link to Target/DS), Rollout Context |
| **Status History** | `GET /rest/v1/targets/{nid}/actions/{aid}/status` | **Missing** | **[NEW]** Implement Status History Timeline |
| **Cancel Action** | `DELETE /rest/v1/targets/{nid}/actions/{aid}` (Query: `force?`) | **Missing** | **[NEW]** Add Cancel Button with Confirmation |
| **Force Update** | `PUT /rest/v1/targets/{nid}/actions/{aid}` | **Missing** | **[NEW]** Add Force Button (Soft -> Forced) |
| **Confirm/Deny** | `PUT .../details/confirmation` | **Missing** | **[NEW]** Add Approval Workflow UI for `wait_for_confirmation` status |

## 3. Functional Requirements

### FR-01 Advanced Action List
- **Advanced Filters**:
  - Filter by Target Name (FIQL `target.name==*value*`)
  - Filter by Distribution Set (FIQL `distributionSet.name==*value*`)
  - Filter by Status (Multi-select)
- **Visuals**:
  - Progress bar for `running` actions (if progress data available in messages, otherwise intermediate spinner).
  - Clear status color coding (already started).

### FR-02 Action Detail View
- **Overview Tab**:
  - Properties: ID, Creation Time, Type (Soft/Forced/TimeForced), Weight.
  - Links: Clickable links to **Target** and **Distribution Set**.
- **Status History Tab (Crucial)**:
  - Fetch from `/rest/v1/targets/{targetId}/actions/{actionId}/status`.
  - Display list/timeline of status updates from the device (e.g., `downloading`, `installed`, `finished`).
  - Show `messages` list for error details.

### FR-03 Action Control (Admin Only)
- **Cancel**:
  - **API**: `DELETE /rest/v1/targets/{targetId}/actions/{actionId}?force=true`
  - **UI**: "Cancel" button in Detail view (Red danger button). 
  - **Validation**: Only defined for `pending`, `running` (if supported), `wait_for_confirmation`.
- **Force (Promote to Forced)**:
  - **API**: `PUT /rest/v1/targets/{targetId}/actions/{actionId}` with body `{"forceType": "forced"}`.
  - **UI**: "Force Update" button.
- **Confirmation**:
  - **Context**: When `maintenance window` or `user consent` flow is active, action pauses at `wait_for_confirmation`.
  - **API**: `PUT /rest/v1/targets/{targetId}/actions/{actionId}/confirmation`
  - **UI**: "Approve" (Green) and "Deny" (Red) buttons appear only when status is `wait_for_confirmation`.

### FR-04 Bulk Operations (Phase 2)
- Bulk Cancel: Iterate `DELETE` over selected IDs.

## 4. API Integration Plan

- `useConfirmAction(targetId, actionId)`

## 5. User Consideration & UI/UX Strategy

### 5.1 Smart Status & Monitoring
- **Real-time Indicators**: Use a "Live" badge or auto-polling (every 5-10s) for "Running" actions.
- **Progress Visualization**: If `messages` contain percentage data (e.g., "Downloading 50%"), parse and display a progress bar in the list and detail view.
- **Timeline View**: Instead of a raw table, visualize the status history as a **Vertical Timeline** (AntD `Timeline` component) to show the chronological flow.
  - Green dot: Success/Finished
  - Blue dot: Running/Downloading
  - Red dot: Error (with expandable error message)

### 5.2 Contextual Control
- **Safe "Force Update"**:
  - When clicking "Force Update", show a modal explaining the impact: *"This will instruct the device to update immediately, potentially interrupting operations."*
- **Smart "Cancel"**:
  - Disable "Cancel" for `finished` or `error` states to prevent API errors.
  - Show a warning if canceling a `running` update: *"Canceling now may leave the device in an undefined state if the installation has started."*

### 5.3 Enhanced Filtering
- **Status Pills**: Allow multi-select filtering for statuses (e.g., show "Running" AND "Pending") using a Tag-based selector.
- **Result & Error highlighting**: In the "History" tab, highlighting the final error message in a banner at the top of the detail page so the operator sees the root cause immediately without scrolling.

## 6. Questions
- Does `force=true` in Cancel API imply forcing the *cancellation* even if the device is offline? (Verify behavior)
- Is "Force Update" simply re-assignment? (Assumption: Yes, strict API does not have "update type" endpoint).
