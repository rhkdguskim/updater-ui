# OpenAPI Data Models

- Source file: openapi.json
- Generated at: 2025-12-24 06:20:08 UTC
- Total schemas: 77

## Table of Contents

- [ExceptionInfo](#exceptioninfo)
- [Link](#link)
- [Links](#links)
- [MgmtAction](#mgmtaction)
- [MgmtActionConfirmationRequestBodyPut](#mgmtactionconfirmationrequestbodyput)
- [MgmtActionId](#mgmtactionid)
- [MgmtActionRequestBodyPut](#mgmtactionrequestbodyput)
- [MgmtActionStatus](#mgmtactionstatus)
- [MgmtArtifact](#mgmtartifact)
- [MgmtArtifactHash](#mgmtartifacthash)
- [MgmtDistributionSet](#mgmtdistributionset)
- [MgmtDistributionSetAssignment](#mgmtdistributionsetassignment)
- [MgmtDistributionSetAssignments](#mgmtdistributionsetassignments)
- [MgmtDistributionSetAutoAssignment](#mgmtdistributionsetautoassignment)
- [MgmtDistributionSetRequestBodyPost](#mgmtdistributionsetrequestbodypost)
- [MgmtDistributionSetRequestBodyPut](#mgmtdistributionsetrequestbodyput)
- [MgmtDistributionSetStatistics](#mgmtdistributionsetstatistics)
- [MgmtDistributionSetType](#mgmtdistributionsettype)
- [MgmtDistributionSetTypeAssignment](#mgmtdistributionsettypeassignment)
- [MgmtDistributionSetTypeRequestBodyPost](#mgmtdistributionsettyperequestbodypost)
- [MgmtDistributionSetTypeRequestBodyPut](#mgmtdistributionsettyperequestbodyput)
- [MgmtDynamicRolloutGroupTemplate](#mgmtdynamicrolloutgrouptemplate)
- [MgmtId](#mgmtid)
- [MgmtInvalidateDistributionSetRequestBody](#mgmtinvalidatedistributionsetrequestbody)
- [MgmtMaintenanceWindowRequestBody](#mgmtmaintenancewindowrequestbody)
- [MgmtMetadata](#mgmtmetadata)
- [MgmtMetadataBodyPut](#mgmtmetadatabodyput)
- [MgmtPollStatus](#mgmtpollstatus)
- [MgmtRolloutCondition](#mgmtrolloutcondition)
- [MgmtRolloutErrorAction](#mgmtrollouterroraction)
- [MgmtRolloutGroup](#mgmtrolloutgroup)
- [MgmtRolloutGroupResponseBody](#mgmtrolloutgroupresponsebody)
- [MgmtRolloutResponseBody](#mgmtrolloutresponsebody)
- [MgmtRolloutRestRequestBodyPost](#mgmtrolloutrestrequestbodypost)
- [MgmtRolloutRestRequestBodyPut](#mgmtrolloutrestrequestbodyput)
- [MgmtRolloutSuccessAction](#mgmtrolloutsuccessaction)
- [MgmtSoftwareModule](#mgmtsoftwaremodule)
- [MgmtSoftwareModuleAssignment](#mgmtsoftwaremoduleassignment)
- [MgmtSoftwareModuleMetadata](#mgmtsoftwaremodulemetadata)
- [MgmtSoftwareModuleMetadataBodyPut](#mgmtsoftwaremodulemetadatabodyput)
- [MgmtSoftwareModuleRequestBodyPost](#mgmtsoftwaremodulerequestbodypost)
- [MgmtSoftwareModuleRequestBodyPut](#mgmtsoftwaremodulerequestbodyput)
- [MgmtSoftwareModuleType](#mgmtsoftwaremoduletype)
- [MgmtSoftwareModuleTypeAssignment](#mgmtsoftwaremoduletypeassignment)
- [MgmtSoftwareModuleTypeRequestBodyPost](#mgmtsoftwaremoduletyperequestbodypost)
- [MgmtSoftwareModuleTypeRequestBodyPut](#mgmtsoftwaremoduletyperequestbodyput)
- [MgmtSystemTenantConfigurationValue](#mgmtsystemtenantconfigurationvalue)
- [MgmtSystemTenantConfigurationValueRequest](#mgmtsystemtenantconfigurationvaluerequest)
- [MgmtTag](#mgmttag)
- [MgmtTagRequestBodyPut](#mgmttagrequestbodyput)
- [MgmtTarget](#mgmttarget)
- [MgmtTargetAssignmentRequestBody](#mgmttargetassignmentrequestbody)
- [MgmtTargetAssignmentResponseBody](#mgmttargetassignmentresponsebody)
- [MgmtTargetAttributes](#mgmttargetattributes)
- [MgmtTargetAutoConfirm](#mgmttargetautoconfirm)
- [MgmtTargetAutoConfirmUpdate](#mgmttargetautoconfirmupdate)
- [MgmtTargetFilterQuery](#mgmttargetfilterquery)
- [MgmtTargetFilterQueryRequestBody](#mgmttargetfilterqueryrequestbody)
- [MgmtTargetRequestBody](#mgmttargetrequestbody)
- [MgmtTargetType](#mgmttargettype)
- [MgmtTargetTypeRequestBodyPost](#mgmttargettyperequestbodypost)
- [MgmtTargetTypeRequestBodyPut](#mgmttargettyperequestbodyput)
- [MgmtUserInfo](#mgmtuserinfo)
- [PagedListMgmtAction](#pagedlistmgmtaction)
- [PagedListMgmtActionStatus](#pagedlistmgmtactionstatus)
- [PagedListMgmtDistributionSet](#pagedlistmgmtdistributionset)
- [PagedListMgmtDistributionSetType](#pagedlistmgmtdistributionsettype)
- [PagedListMgmtMetadata](#pagedlistmgmtmetadata)
- [PagedListMgmtRolloutGroupResponseBody](#pagedlistmgmtrolloutgroupresponsebody)
- [PagedListMgmtRolloutResponseBody](#pagedlistmgmtrolloutresponsebody)
- [PagedListMgmtSoftwareModule](#pagedlistmgmtsoftwaremodule)
- [PagedListMgmtSoftwareModuleMetadata](#pagedlistmgmtsoftwaremodulemetadata)
- [PagedListMgmtSoftwareModuleType](#pagedlistmgmtsoftwaremoduletype)
- [PagedListMgmtTag](#pagedlistmgmttag)
- [PagedListMgmtTarget](#pagedlistmgmttarget)
- [PagedListMgmtTargetFilterQuery](#pagedlistmgmttargetfilterquery)
- [PagedListMgmtTargetType](#pagedlistmgmttargettype)

## ExceptionInfo

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| exceptionClass |  | `string` |  |  |  |
| errorCode |  | `string` |  |  |  |
| message |  | `string` |  |  |  |
| info |  | `map<string, object>` |  |  |  |

## Link

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| href |  | `string` |  |  |  |
| hreflang |  | `string` |  |  |  |
| title |  | `string` |  |  |  |
| type |  | `string` |  |  |  |
| deprecation |  | `string` |  |  |  |
| profile |  | `string` |  |  |  |
| name |  | `string` |  |  |  |
| templated |  | `boolean` |  |  |  |

## Links

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| (additionalProperties) |  | `ref:Link` |  |  |  |

## MgmtAction

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| createdBy |  | `string` |  | Entity was originally created by (User, AMQP-Controller, anonymous etc.) | bumlux |
| createdAt |  | `integer(int64)` |  | Entity was originally created at (timestamp UTC in milliseconds) | 1691065905897 |
| lastModifiedBy |  | `string` |  | Entity was last modified by (User, AMQP-Controller, anonymous etc.) | bumlux |
| lastModifiedAt |  | `integer(int64)` |  | Entity was last modified at (timestamp UTC in milliseconds) | 1691065906407 |
| id |  | `integer(int64)` |  | ID of the action | 7 |
| type |  | `string` |  | Type of action | update |
| status |  | `string` |  | Status of action | finished |
| detailStatus |  | `string` |  | Detailed status of action | finished |
| forceTime |  | `integer(int64)` |  |  | 1691065903238 |
| forceType |  | `string` | soft, forced, timeforced, downloadonly |  |  |
| weight |  | `integer(int32)` |  | Weight of the action showing the importance of the update | 600 |
| rollout |  | `integer(int64)` |  | The ID of the rollout this action was created for | 1 |
| rolloutName |  | `string` |  | The name of the rollout this action was created for | rollout |
| lastStatusCode |  | `integer(int32)` |  | (Optional) Code provided as part of the last status update that was sent by the device. | 200 |
| externalRef |  | `string` |  | If created by external system this field contains the external reference for the action |  |
| _links |  | `ref:Links` |  |  |  |

## MgmtActionConfirmationRequestBodyPut

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| confirmation | Y | `string` | confirmed, denied | Action confirmation state |  |
| code |  | `integer(int32)` |  | (Optional) Individual status code | 200 |
| details |  | `array<string>` |  | List of detailed message information | ["Feedback message"] |

## MgmtActionId

{   "id" : 13,   "_links" : {      "self" : {        "href" : "https://management-api.host.com/rest/v1/targets/target2/actions/13"      }   } }

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| id |  | `integer(int64)` |  | ID of the action |  |
| _links |  | `ref:Links` |  |  |  |

## MgmtActionRequestBodyPut

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| forceType |  | `string` | soft, forced, timeforced, downloadonly |  |  |

## MgmtActionStatus

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| id |  | `integer(int64)` |  |  | 21 |
| type |  | `string` |  |  | running |
| messages |  | `array<string>` |  |  |  |
| reportedAt |  | `integer(int64)` |  |  | 1691065929524 |
| timestamp |  | `integer(int64)` |  |  | 1691065929524 |
| code |  | `integer(int32)` |  |  | 200 |

## MgmtArtifact

**_links**: * **download** - Download link of the artifact 

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| createdBy |  | `string` |  | Entity was originally created by (User, AMQP-Controller, anonymous etc.) | bumlux |
| createdAt |  | `integer(int64)` |  | Entity was originally created at (timestamp UTC in milliseconds) | 1691065905897 |
| lastModifiedBy |  | `string` |  | Entity was last modified by (User, AMQP-Controller, anonymous etc.) | bumlux |
| lastModifiedAt |  | `integer(int64)` |  | Entity was last modified at (timestamp UTC in milliseconds) | 1691065906407 |
| id |  | `integer(int64)` |  | Artifact id | 3 |
| hashes |  | `ref:MgmtArtifactHash` |  |  |  |
| providedFilename |  | `string` |  |  | file1 |
| size |  | `integer(int64)` |  | Size of the artifact | 3 |
| _links |  | `ref:Links` |  |  |  |

## MgmtArtifactHash

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| sha1 |  | `string` |  | SHA1 hash of the artifact | 2d86c2a659e364e9abba49ea6ffcd53dd5559f05 |
| md5 |  | `string` |  | MD5 hash of the artifact. | 0d1b08c34858921bc7c662b228acb7ba |
| sha256 |  | `string` |  | SHA256 hash of the artifact | a03b221c6c6eae7122ca51695d456d5222e524889136394944b2f9763b483615 |

## MgmtDistributionSet

**_links**: * **type** - The type of the distribution set * **modules** - List of software modules * **metadata** - List of metadata 

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| createdBy |  | `string` |  | Entity was originally created by (User, AMQP-Controller, anonymous etc.) | bumlux |
| createdAt |  | `integer(int64)` |  | Entity was originally created at (timestamp UTC in milliseconds) | 1691065905897 |
| lastModifiedBy |  | `string` |  | Entity was last modified by (User, AMQP-Controller, anonymous etc.) | bumlux |
| lastModifiedAt |  | `integer(int64)` |  | Entity was last modified at (timestamp UTC in milliseconds) | 1691065906407 |
| name | Y | `string` |  |  | Name of entity |
| description |  | `string` |  |  | Description of entity |
| id | Y | `integer(int64)` |  | The technical identifier of the entity | 51 |
| version |  | `string` |  | Package version | 1.4.2 |
| type |  | `string` |  | The type of the distribution set | test_default_ds_type |
| typeName |  | `string` |  | The type name of the distribution set | OS (FW) mandatory, runtime (FW) and app (SW) optional |
| complete |  | `boolean` |  | True of the distribution set software module setup is complete as defined by the distribution set type | true |
| locked |  | `boolean` |  | If the distribution set is locked | true |
| deleted |  | `boolean` |  | Deleted flag, used for soft deleted entities | false |
| valid |  | `boolean` |  | True by default and false after the distribution set is invalidated by the user | true |
| requiredMigrationStep |  | `boolean` |  | True if DS is a required migration step for another DS. As a result the DS’s assignment will not be cancelled when another DS is assigned (note: updatable only if DS is not yet assigned to a target) | false |
| modules |  | `array<ref:MgmtSoftwareModule>` |  |  |  |
| _links |  | `ref:Links` |  |  |  |

## MgmtDistributionSetAssignment

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| id | Y | `integer(int64)` |  |  | 108 |
| forcetime |  | `integer(int64)` |  | Forcetime in milliseconds | 1691065930359 |
| weight |  | `integer(int32)` |  | Importance of the assignment | 23 |
| confirmationRequired |  | `boolean` |  | (Available with user consent flow active) Specifies if the confirmation by the device is required for this action | false |
| type |  | `string` | soft, forced, timeforced, downloadonly | The type of the assignment |  |
| maintenanceWindow |  | `ref:MgmtMaintenanceWindowRequestBody` |  |  |  |

## MgmtDistributionSetAssignments

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| items |  | `ref:MgmtDistributionSetAssignment` |  |  |  |

## MgmtDistributionSetAutoAssignment

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| id |  | `integer(int64)` |  |  | 108 |
| type |  | `string` | soft, forced, timeforced, downloadonly |  |  |
| weight |  | `integer(int32)` |  |  |  |
| confirmationRequired |  | `boolean` |  |  |  |

## MgmtDistributionSetRequestBodyPost

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| name |  | `string` |  | The name of the entity | dsOne |
| description |  | `string` |  | The description of the entity | Description of the distribution set. |
| version |  | `string` |  | Package version | 1.0.0 |
| locked |  | `boolean` |  | Should be set only if change of locked state is requested. If put, the distribution set locked flag will be set to the requested. Note: unlock (i.e. set this property to false) with extreme care! In general once distribution set is locked it shall not be unlocked. Note that it could have been assigned / deployed to targets. | true |
| requiredMigrationStep |  | `boolean` |  | True if DS is a required migration step for another DS. As a result the DS’s assignment will not be cancelled when another DS is assigned (note: updatable only if DS is not yet assigned to a target) | false |
| modules |  | `array<ref:MgmtSoftwareModuleAssignment>` |  |  |  |
| type |  | `string` |  | The type of the distribution set | test_default_ds_type |

## MgmtDistributionSetRequestBodyPut

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| name |  | `string` |  | The name of the entity | dsOne |
| description |  | `string` |  | The description of the entity | Description of the distribution set. |
| version |  | `string` |  | Package version | 1.0.0 |
| locked |  | `boolean` |  | Should be set only if change of locked state is requested. If put, the distribution set locked flag will be set to the requested. Note: unlock (i.e. set this property to false) with extreme care! In general once distribution set is locked it shall not be unlocked. Note that it could have been assigned / deployed to targets. | true |
| requiredMigrationStep |  | `boolean` |  | True if DS is a required migration step for another DS. As a result the DS’s assignment will not be cancelled when another DS is assigned (note: updatable only if DS is not yet assigned to a target) | false |

## MgmtDistributionSetStatistics

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| actions |  | `map<string, integer(int64)>` |  |  |  |
| rollouts |  | `map<string, integer(int64)>` |  |  |  |
| totalAutoAssignments |  | `integer(int64)` |  |  |  |

## MgmtDistributionSetType

**_links**: * **mandatorymodules** - Link to mandatory software modules types in this distribution set type * **optionalmodules** - Link to optional software modules types in this distribution set type 

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| createdBy |  | `string` |  | Entity was originally created by (User, AMQP-Controller, anonymous etc.) | bumlux |
| createdAt |  | `integer(int64)` |  | Entity was originally created at (timestamp UTC in milliseconds) | 1691065905897 |
| lastModifiedBy |  | `string` |  | Entity was last modified by (User, AMQP-Controller, anonymous etc.) | bumlux |
| lastModifiedAt |  | `integer(int64)` |  | Entity was last modified at (timestamp UTC in milliseconds) | 1691065906407 |
| name | Y | `string` |  |  | Name of entity |
| description |  | `string` |  |  | Description of entity |
| key | Y | `string` |  | Key that can be interpreted by the target | id.t23 |
| colour |  | `string` |  | Colour assigned to the entity that could be used for representation purposes | brown |
| deleted |  | `boolean` |  | Deleted flag, used for soft deleted entities | false |
| id | Y | `integer(int64)` |  | The technical identifier of the entity | 99 |
| _links |  | `ref:Links` |  |  |  |

## MgmtDistributionSetTypeAssignment

Array of distribution set types that are compatible to that target type

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| id |  | `integer(int64)` |  |  | 108 |

## MgmtDistributionSetTypeRequestBodyPost

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| description |  | `string` |  | The description of the entity | Example description |
| colour |  | `string` |  | The colour of the entity | rgb(86,37,99) |
| name | Y | `string` |  | The name of the entity | Example type name |
| key | Y | `string` |  | Functional key of the distribution set type | Example key |
| mandatorymodules |  | `array<ref:MgmtSoftwareModuleTypeAssignment>` |  | Mandatory module type IDs |  |
| optionalmodules |  | `array<ref:MgmtSoftwareModuleTypeAssignment>` |  | Optional module type IDs |  |

## MgmtDistributionSetTypeRequestBodyPut

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| description |  | `string` |  | The description of the entity | Example description |
| colour |  | `string` |  | The colour of the entity | rgb(86,37,99) |

## MgmtDynamicRolloutGroupTemplate

Template for dynamic groups (only if dynamic flag is true)

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| nameSuffix |  | `string` |  | The name suffix of the dynamic groups | -dynamic |
| targetCount |  | `integer(int64)` |  | Count of targets a dynamic group shall include | 20 |

## MgmtId

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| id |  | `integer(int64)` |  |  | 108 |

## MgmtInvalidateDistributionSetRequestBody

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| actionCancelationType | Y | `string` | soft, force, none | Type of cancelation for actions referring to the given distribution set |  |
| cancelRollouts |  | `boolean` |  | Defines if rollouts referring to this distribution set should be canceled | true |

## MgmtMaintenanceWindowRequestBody

Separation of download and install by defining a maintenance window for the installation

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| schedule |  | `string` |  | Schedule for the maintenance window start in quartz cron notation, such as '0 15 10 * * ? 2018' for 10:15am every day during the year 2018 | 10 12 14 3 8 ? 2023 |
| duration |  | `string` |  | Duration of the window, such as '02:00:00' for 2 hours | 00:10:00 |
| timezone |  | `string` |  | A time-zone offset from Greenwich/UTC, such as '+02:00' | +00:00 |

## MgmtMetadata

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| key | Y | `string` |  | Metadata property key | someKnownKey |
| value |  | `string` |  | Metadata property value | someKnownKeyValue |

## MgmtMetadataBodyPut

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| value |  | `string` |  |  | someValue |

## MgmtPollStatus

Poll status

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| lastRequestAt |  | `integer(int64)` |  |  | 1691065941102 |
| nextExpectedRequestAt |  | `integer(int64)` |  |  | 1691109141102 |
| overdue |  | `boolean` |  |  | false |

## MgmtRolloutCondition

The error condition which takes in place to evaluate if a rollout group encounter errors

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| condition |  | `string` | THRESHOLD | The type of the condition |  |
| expression |  | `string` |  | The expression according to the condition, e.g. the value of threshold in percentage | 50 |

## MgmtRolloutErrorAction

The error action which is executed if the error condition is fulfilled

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| action |  | `string` | PAUSE | The error action to execute |  |
| expression |  | `string` |  | The expression for the error action | 80 |

## MgmtRolloutGroup

The list of group definitions

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| createdBy |  | `string` |  | Entity was originally created by (User, AMQP-Controller, anonymous etc.) | bumlux |
| createdAt |  | `integer(int64)` |  | Entity was originally created at (timestamp UTC in milliseconds) | 1691065905897 |
| lastModifiedBy |  | `string` |  | Entity was last modified by (User, AMQP-Controller, anonymous etc.) | bumlux |
| lastModifiedAt |  | `integer(int64)` |  | Entity was last modified at (timestamp UTC in milliseconds) | 1691065906407 |
| name | Y | `string` |  |  | Name of entity |
| description |  | `string` |  |  | Description of entity |
| successCondition |  | `ref:MgmtRolloutCondition` |  |  |  |
| successAction |  | `ref:MgmtRolloutSuccessAction` |  |  |  |
| errorCondition |  | `ref:MgmtRolloutCondition` |  |  |  |
| errorAction |  | `ref:MgmtRolloutErrorAction` |  |  |  |
| targetFilterQuery |  | `string` |  | The name of the entity | controllerId==exampleTarget* |
| targetPercentage |  | `number(float)` |  | Percentage of remaining and matching targets that should be added to this group | 20 |
| confirmationRequired |  | `boolean` |  | (Available with user consent flow active) If the confirmation is required for this rollout group. Confirmation is required per default | false |
| _links |  | `ref:Links` |  |  |  |

## MgmtRolloutGroupResponseBody

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| createdBy |  | `string` |  | Entity was originally created by (User, AMQP-Controller, anonymous etc.) | bumlux |
| createdAt |  | `integer(int64)` |  | Entity was originally created at (timestamp UTC in milliseconds) | 1691065905897 |
| lastModifiedBy |  | `string` |  | Entity was last modified by (User, AMQP-Controller, anonymous etc.) | bumlux |
| lastModifiedAt |  | `integer(int64)` |  | Entity was last modified at (timestamp UTC in milliseconds) | 1691065906407 |
| name | Y | `string` |  |  | Name of entity |
| description |  | `string` |  |  | Description of entity |
| successCondition |  | `ref:MgmtRolloutCondition` |  |  |  |
| successAction |  | `ref:MgmtRolloutSuccessAction` |  |  |  |
| errorCondition |  | `ref:MgmtRolloutCondition` |  |  |  |
| errorAction |  | `ref:MgmtRolloutErrorAction` |  |  |  |
| targetFilterQuery |  | `string` |  | The name of the entity | controllerId==exampleTarget* |
| targetPercentage |  | `number(float)` |  | Percentage of remaining and matching targets that should be added to this group | 20 |
| confirmationRequired |  | `boolean` |  | (Available with user consent flow active) If the confirmation is required for this rollout group. Confirmation is required per default | false |
| id | Y | `integer(int64)` |  | Rollouts id | 63 |
| dynamic |  | `boolean` |  | If the rollout group is dynamic | false |
| status |  | `string` |  | The status of this rollout | ready |
| totalTargets |  | `integer(int32)` |  | The total targets of a rollout | 4 |
| totalTargetsPerStatus |  | `map<string, integer(int64)>` |  | The total targets per status |  |
| _links |  | `ref:Links` |  |  |  |

## MgmtRolloutResponseBody

**_links**: * **start** - Link to start the rollout in sync mode * **pause** - Link to pause a running rollout * **triggerNextGroup** - Link for triggering next rollout group on a running rollout * **resume** - Link to resume a paused rollout * **groups** - Link to retrieve the groups a rollout * **approve** - Link to approve a rollout * **deny** - Link to deny a rollout * **distributionset** - The link to the distribution set 

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| createdBy |  | `string` |  | Entity was originally created by (User, AMQP-Controller, anonymous etc.) | bumlux |
| createdAt |  | `integer(int64)` |  | Entity was originally created at (timestamp UTC in milliseconds) | 1691065905897 |
| lastModifiedBy |  | `string` |  | Entity was last modified by (User, AMQP-Controller, anonymous etc.) | bumlux |
| lastModifiedAt |  | `integer(int64)` |  | Entity was last modified at (timestamp UTC in milliseconds) | 1691065906407 |
| name | Y | `string` |  |  | Name of entity |
| description |  | `string` |  |  | Description of entity |
| id | Y | `integer(int64)` |  | Rollout id | 2 |
| targetFilterQuery |  | `string` |  | Target filter query language expression | controllerId==exampleTarget* |
| distributionSetId |  | `integer(int64)` |  | The ID of distribution set of this rollout | 2 |
| status | Y | `string` |  | The status of this rollout | ready |
| totalTargets | Y | `integer(int64)` |  | The total targets of a rollout | 20 |
| totalTargetsPerStatus |  | `map<string, integer(int64)>` |  | The total targets per status |  |
| totalGroups |  | `integer(int32)` |  | The total number of groups created by this rollout | 5 |
| startAt |  | `integer(int64)` |  | Start at timestamp of Rollout | 1691065753136 |
| forcetime |  | `integer(int64)` |  | Forcetime in milliseconds | 1691065762496 |
| deleted |  | `boolean` |  | Deleted flag, used for soft deleted entities | false |
| type |  | `string` | soft, forced, timeforced, downloadonly | The type of this rollout |  |
| weight |  | `integer(int32)` |  | Weight of the resulting Actions | 400 |
| dynamic |  | `boolean` |  | If this rollout is dynamic or static | true |
| approvalRemark |  | `string` |  |  | Approved remark. |
| approveDecidedBy |  | `string` |  |  | exampleUsername |
| _links |  | `ref:Links` |  |  |  |

## MgmtRolloutRestRequestBodyPost

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| createdBy |  | `string` |  | Entity was originally created by (User, AMQP-Controller, anonymous etc.) | bumlux |
| createdAt |  | `integer(int64)` |  | Entity was originally created at (timestamp UTC in milliseconds) | 1691065905897 |
| lastModifiedBy |  | `string` |  | Entity was last modified by (User, AMQP-Controller, anonymous etc.) | bumlux |
| lastModifiedAt |  | `integer(int64)` |  | Entity was last modified at (timestamp UTC in milliseconds) | 1691065906407 |
| name | Y | `string` |  |  | Name of entity |
| description |  | `string` |  |  | Description of entity |
| successCondition |  | `ref:MgmtRolloutCondition` |  |  |  |
| successAction |  | `ref:MgmtRolloutSuccessAction` |  |  |  |
| errorCondition |  | `ref:MgmtRolloutCondition` |  |  |  |
| errorAction |  | `ref:MgmtRolloutErrorAction` |  |  |  |
| targetFilterQuery |  | `string` |  | Target filter query language expression | id==targets-* |
| distributionSetId |  | `integer(int64)` |  | The ID of distribution set of this rollout | 6 |
| amountGroups |  | `integer(int32)` |  | The amount of groups the rollout should split targets into | 5 |
| forcetime |  | `integer(int64)` |  | Force time in milliseconds | 1691065781929 |
| startAt |  | `integer(int64)` |  | Start at timestamp of Rollout | 1691065780929 |
| weight |  | `integer(int32)` |  | Weight of the resulting Actions | 400 |
| dynamic |  | `boolean` |  |  | true |
| dynamicGroupTemplate |  | `ref:MgmtDynamicRolloutGroupTemplate` |  |  |  |
| confirmationRequired |  | `boolean` |  | (Available with user consent flow active) If the confirmation is required for this rollout. Value will be used if confirmation options are missing in the rollout group definitions. Confirmation is required per default | false |
| type |  | `string` | soft, forced, timeforced, downloadonly | The type of this rollout |  |
| groups |  | `array<ref:MgmtRolloutGroup>` |  | The list of group definitions |  |
| _links |  | `ref:Links` |  |  |  |

## MgmtRolloutRestRequestBodyPut

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| createdBy |  | `string` |  | Entity was originally created by (User, AMQP-Controller, anonymous etc.) | bumlux |
| createdAt |  | `integer(int64)` |  | Entity was originally created at (timestamp UTC in milliseconds) | 1691065905897 |
| lastModifiedBy |  | `string` |  | Entity was last modified by (User, AMQP-Controller, anonymous etc.) | bumlux |
| lastModifiedAt |  | `integer(int64)` |  | Entity was last modified at (timestamp UTC in milliseconds) | 1691065906407 |
| name | Y | `string` |  |  | Name of entity |
| description |  | `string` |  |  | Description of entity |
| _links |  | `ref:Links` |  |  |  |

## MgmtRolloutSuccessAction

The success action which takes in place to execute in case the success action is fulfilled

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| action |  | `string` | NEXTGROUP | The success action to execute |  |
| expression |  | `string` |  | The expression for the success action |  |

## MgmtSoftwareModule

**_links**: * **type** - The software module type of the entity * **artifacts** - List of artifacts of given software module * **metadata** - List of metadata 

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| createdBy |  | `string` |  | Entity was originally created by (User, AMQP-Controller, anonymous etc.) | bumlux |
| createdAt |  | `integer(int64)` |  | Entity was originally created at (timestamp UTC in milliseconds) | 1691065905897 |
| lastModifiedBy |  | `string` |  | Entity was last modified by (User, AMQP-Controller, anonymous etc.) | bumlux |
| lastModifiedAt |  | `integer(int64)` |  | Entity was last modified at (timestamp UTC in milliseconds) | 1691065906407 |
| name | Y | `string` |  |  | Name of entity |
| description |  | `string` |  |  | Description of entity |
| id | Y | `integer(int64)` |  | The technical identifier of the entity | 6 |
| version | Y | `string` |  | Package version | 1.0.0 |
| type | Y | `string` |  | The software module type of the entity | os |
| typeName |  | `string` |  | The software module type name of the entity | OS |
| vendor |  | `string` |  | The software vendor | Vendor Limited, California |
| encrypted |  | `boolean` |  | If the software module is encrypted | false |
| locked |  | `boolean` |  | If the software module is locked | true |
| deleted |  | `boolean` |  | If the software module is deleted | false |
| _links |  | `ref:Links` |  |  |  |

## MgmtSoftwareModuleAssignment

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| id |  | `integer(int64)` |  |  | 108 |

## MgmtSoftwareModuleMetadata

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| key | Y | `string` |  | Metadata property key | someKnownKey |
| value |  | `string` |  | Metadata property value | someKnownValue |
| targetVisible |  | `boolean` |  | Metadata property is visible to targets as part of software update action | false |

## MgmtSoftwareModuleMetadataBodyPut

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| value |  | `string` |  |  | newValue |
| targetVisible |  | `boolean` |  |  | true |

## MgmtSoftwareModuleRequestBodyPost

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| name | Y | `string` |  |  | SM Name |
| version | Y | `string` |  |  | 1.0.0 |
| type | Y | `string` |  |  | os |
| description |  | `string` |  |  | SM Description |
| vendor |  | `string` |  |  | Vendor Limited, California |
| encrypted |  | `boolean` |  |  | false |

## MgmtSoftwareModuleRequestBodyPut

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| description |  | `string` |  |  | SM Description |
| vendor |  | `string` |  |  | SM Vendor Name |
| locked |  | `boolean` |  | Should be set only if change of locked state is requested. If put, the software module locked flag will be set to the requested. Note: unlock (i.e. set this property to false) with extreme care! In general once software module is locked it shall not be unlocked. Note that it could have been assigned / deployed to targets. | true |

## MgmtSoftwareModuleType

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| createdBy |  | `string` |  | Entity was originally created by (User, AMQP-Controller, anonymous etc.) | bumlux |
| createdAt |  | `integer(int64)` |  | Entity was originally created at (timestamp UTC in milliseconds) | 1691065905897 |
| lastModifiedBy |  | `string` |  | Entity was last modified by (User, AMQP-Controller, anonymous etc.) | bumlux |
| lastModifiedAt |  | `integer(int64)` |  | Entity was last modified at (timestamp UTC in milliseconds) | 1691065906407 |
| name | Y | `string` |  |  | Name of entity |
| description |  | `string` |  |  | Description of entity |
| key | Y | `string` |  | Key that can be interpreted by the target | id.t23 |
| colour |  | `string` |  | Colour assigned to the entity that could be used for representation purposes | brown |
| deleted |  | `boolean` |  | Deleted flag, used for soft deleted entities | false |
| id | Y | `integer(int64)` |  | The technical identifier of the entity | 83 |
| maxAssignments |  | `integer(int32)` |  | Software modules of that type can be assigned at this maximum number (e.g. operating system only once) | 1 |
| _links |  | `ref:Links` |  |  |  |

## MgmtSoftwareModuleTypeAssignment

Optional module type IDs

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| id |  | `integer(int64)` |  |  | 108 |

## MgmtSoftwareModuleTypeRequestBodyPost

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| description |  | `string` |  |  | Example description |
| colour |  | `string` |  |  | rgb(0,0,255 |
| name | Y | `string` |  |  | Example name |
| key | Y | `string` |  |  | Example key |
| maxAssignments |  | `integer(int32)` |  |  | 1 |

## MgmtSoftwareModuleTypeRequestBodyPut

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| description |  | `string` |  |  | Example description |
| colour |  | `string` |  |  | rgb(0,0,255 |

## MgmtSystemTenantConfigurationValue

**properties**: * **rollout.approval.enabled** - Boolean, The configuration key 'rollout.approval.enabled' defines if approval mode for Rollout Management is enabled. * **repository.actions.autoclose.enabled** - Boolean, The configuration key 'repository.actions.autoclose.enabled' defines if autoclose running actions with new Distribution Set assignment is enabled. * **user.confirmation.flow.enabled** - Boolean, The configuration key 'user.confirmation.flow.enabled' defines if confirmation is required when distribution set is assigned to target. * **authentication.gatewaytoken.enabled** - Boolean, The configuration key 'authentication.gatewaytoken.enabled' defines if the authentication mode 'gateway security token' is enabled. * **action.cleanup.enabled** - Boolean, The configuration key 'action.cleanup.enabled' defines if automatic cleanup of deployment actions is enabled. * **action.cleanup.actionExpiry** - Long, The configuration key 'action.cleanup.actionExpiry' defines the expiry time in milliseconds that needs to elapse before an action may be cleaned up. * **authentication.header.enabled** - Boolean, The configuration key 'authentication.header.enabled' defines if the authentication mode 'authority header' is enabled. * **maintenanceWindowPollCount** - Integer, The configuration key 'maintenanceWindowPollCount' defines the polling interval so that controller tries to poll at least these many times between the last polling and before start of maintenance window. The polling interval is bounded by configured pollingTime and minPollingTime. The polling interval is modified as per following scheme: pollingTime(@time=t) = (maintenanceWindowStartTime - t)/maintenanceWindowPollCount. * **authentication.targettoken.enabled** - Boolean, The configuration key 'authentication.targettoken.enabled' defines if the authentication mode 'target security token' is enabled. * **pollingTime** - String, The configuration key 'pollingTime' defines the time interval between two poll requests of a target. * **anonymous.download.enabled** - Boolean, The configuration key 'anonymous.download.enabled' defines if the anonymous download mode is enabled. * **authentication.header.authority** - String, The configuration key 'authentication.header.authority' defines the name of the 'authority header'. * **minPollingTime** - String, The configuration key 'minPollingTime' defines the smallest time interval permitted between two poll requests of a target. * **authentication.gatewaytoken.key** - String, The configuration key 'authentication.gatewaytoken.key' defines the key of the gateway security token. * **action.cleanup.actionStatus** - String, The configuration key 'action.cleanup.actionStatus' defines the list of action status that should be taken into account for the cleanup. * **pollingOverdueTime** - String, The configuration key 'pollingOverdueTime' defines the period of time after the SP server will recognize a target, which is not performing pull requests anymore. * **multi.assignments.enabled** - Boolean, The configuration key 'multi.assignments.enabled' defines if multiple distribution sets can be assigned to the same targets. * **batch.assignments.enabled** - Boolean, The configuration key 'batch.assignments.enabled' defines if distribution set can be assigned to multiple targets in a single batch message. * **implicit.lock.enabled** - Boolean (true by default), The configuration key 'implicit.lock.enabled' defines if distribution set and their software modules shall be implicitly locked when assigned to target, rollout or target filter. 

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| value |  | `object` |  | Current value of of configuration parameter | true |
| global |  | `boolean` |  | true - if the current value is the global configuration value, false - if there is a tenant specific value configured | true |
| lastModifiedAt |  | `integer(int64)` |  | Entity was last modified at (timestamp UTC in milliseconds) | 1623085150 |
| lastModifiedBy |  | `string` |  | Entity was last modified by (User, AMQP-Controller, anonymous etc.) | example user |
| createdAt |  | `integer(int64)` |  | Entity was originally created at (timestamp UTC in milliseconds) | 1523085150 |
| createdBy |  | `string` |  | Entity was originally created by (User, AMQP-Controller, anonymous etc.) | example user |
| _links |  | `ref:Links` |  |  |  |

## MgmtSystemTenantConfigurationValueRequest

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| value | Y | `object` |  | Current value of of configuration parameter | exampleToken |

## MgmtTag

**_links**: * **assignedDistributionSets** - Links to assigned distribution sets 

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| createdBy |  | `string` |  | Entity was originally created by (User, AMQP-Controller, anonymous etc.) | bumlux |
| createdAt |  | `integer(int64)` |  | Entity was originally created at (timestamp UTC in milliseconds) | 1691065905897 |
| lastModifiedBy |  | `string` |  | Entity was last modified by (User, AMQP-Controller, anonymous etc.) | bumlux |
| lastModifiedAt |  | `integer(int64)` |  | Entity was last modified at (timestamp UTC in milliseconds) | 1691065906407 |
| name | Y | `string` |  |  | Name of entity |
| description |  | `string` |  |  | Description of entity |
| id | Y | `integer(int64)` |  | The technical identifier of the entity | 2 |
| colour |  | `string` |  | The colour of the entity | red |
| _links |  | `ref:Links` |  |  |  |

## MgmtTagRequestBodyPut

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| name |  | `string` |  | The name of the entity | Example name |
| description |  | `string` |  | The description of the entity | Example description |
| colour |  | `string` |  | The colour of the entity | rgb(0,255,0) |

## MgmtTarget

**_links**: * **assignedDS** - Links to assigned distribution sets * **installedDS** - Links to installed distribution sets * **attributes** - Links to attributes of the target * **actions** - Links to actions of the target * **metadata** - List of metadata * **targetType** - The link to the target type * **autoConfirm** - The link to the detailed auto confirm state 

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| createdBy |  | `string` |  | Entity was originally created by (User, AMQP-Controller, anonymous etc.) | bumlux |
| createdAt |  | `integer(int64)` |  | Entity was originally created at (timestamp UTC in milliseconds) | 1691065905897 |
| lastModifiedBy |  | `string` |  | Entity was last modified by (User, AMQP-Controller, anonymous etc.) | bumlux |
| lastModifiedAt |  | `integer(int64)` |  | Entity was last modified at (timestamp UTC in milliseconds) | 1691065906407 |
| name | Y | `string` |  |  | Name of entity |
| description |  | `string` |  |  | Description of entity |
| controllerId | Y | `string` |  | Controller ID | 123 |
| updateStatus |  | `string` |  | If the target is in sync | in_sync |
| lastControllerRequestAt |  | `integer(int64)` |  | Timestamp of the last controller request | 1691065941102 |
| installedAt |  | `integer(int64)` |  | Install timestamp | 1691065941155 |
| ipAddress |  | `string` |  | Last known IP address of the target. Only presented if IP address of the target itself is known (connected directly through DDI API) | 192.168.0.1 |
| address |  | `string` |  | The last known address URI of the target. Includes information of the target is connected either directly (DDI) through HTTP or indirectly (DMF) through amqp. | http://192.168.0.1 |
| pollStatus |  | `ref:MgmtPollStatus` |  |  |  |
| securityToken |  | `string` |  | Pre-Shared key that allows targets to authenticate at Direct Device Integration API if enabled in the tenant settings | 38e6a19932b014040ba061795186514e |
| requestAttributes |  | `boolean` |  | Request re-transmission of target attributes | true |
| targetType |  | `integer(int64)` |  | ID of the target type | 19 |
| targetTypeName |  | `string` |  | Name of the target type | defaultType |
| autoConfirmActive |  | `boolean` |  | Present if user consent flow active. Indicates if auto-confirm is active | false |
| _links |  | `ref:Links` |  |  |  |

## MgmtTargetAssignmentRequestBody

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| id | Y | `string` |  | The technical identifier of the entity | target4 |
| forcetime |  | `integer(int64)` |  | Forcetime in milliseconds | 1682408575278 |
| type |  | `string` | soft, forced, timeforced, downloadonly | The type of the assignment |  |
| maintenanceWindow |  | `ref:MgmtMaintenanceWindowRequestBody` |  |  |  |
| weight |  | `integer(int32)` |  | Importance of the assignment | 100 |
| confirmationRequired |  | `boolean` |  | (Available with user consent flow active) Defines, if the confirmation is required for an action. Confirmation is required per default |  |

## MgmtTargetAssignmentResponseBody

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| alreadyAssigned |  | `integer(int32)` |  | Targets that had this distribution already assigned (in "offline" case this includes targets that have arbitrary updates running) |  |
| assignedActions |  | `array<ref:MgmtActionId>` |  | The newly created actions as a result of this assignment |  |
| _links |  | `ref:Links` |  |  |  |
| assigned |  | `integer(int32)` |  | Targets that had this distribution set really assigned excluding already assigned |  |
| total |  | `integer(int32)` |  | Total targets |  |

## MgmtTargetAttributes

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| (additionalProperties) |  | `string` |  |  |  |

## MgmtTargetAutoConfirm

**_links**: * **deactivate** - Reference link to deactivate auto confirm (present if active) 

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| active | Y | `boolean` |  | Flag if auto confirm is active | true |
| initiator |  | `string` |  | Initiator set on activation | custom_initiator_value |
| remark |  | `string` |  | Remark set on activation | custom_remark |
| activatedAt |  | `integer(int64)` |  | Timestamp of the activation | 1691065938576 |
| _links |  | `ref:Links` |  |  |  |

## MgmtTargetAutoConfirmUpdate

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| initiator |  | `string` |  | (Optional) Initiator set on activation | custom_initiator_value |
| remark |  | `string` |  | (Optional) Remark set on activation | custom_remark |

## MgmtTargetFilterQuery

**_links**: * **autoAssignDS** - Link to manage the auto assign distribution set 

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| createdBy |  | `string` |  | Entity was originally created by (User, AMQP-Controller, anonymous etc.) | bumlux |
| createdAt |  | `integer(int64)` |  | Entity was originally created at (timestamp UTC in milliseconds) | 1691065905897 |
| lastModifiedBy |  | `string` |  | Entity was last modified by (User, AMQP-Controller, anonymous etc.) | bumlux |
| lastModifiedAt |  | `integer(int64)` |  | Entity was last modified at (timestamp UTC in milliseconds) | 1691065906407 |
| id | Y | `integer(int64)` |  | The technical identifier of the entity | 2 |
| name |  | `string` |  | The name of the entity | filterName |
| query |  | `string` |  | Target filter query expression | name==* |
| autoAssignDistributionSet |  | `integer(int64)` |  |  | 15 |
| autoAssignActionType |  | `string` | soft, forced, timeforced, downloadonly | Auto assign distribution set id |  |
| autoAssignWeight |  | `integer(int32)` |  | Weight of the resulting Actions | 600 |
| confirmationRequired |  | `boolean` |  | (Available with user consent flow active) Defines, if the confirmation is required for an action. Confirmation is required per default. | false |
| _links |  | `ref:Links` |  |  |  |

## MgmtTargetFilterQueryRequestBody

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| name | Y | `string` |  |  | filterName |
| query | Y | `string` |  |  | controllerId==example-target-* |

## MgmtTargetRequestBody

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| name | Y | `string` |  | The name of the entity | controllerName |
| description |  | `string` |  | The description of the entity | Example description of a target |
| controllerId | Y | `string` |  | Controller ID | 123 |
| address |  | `string` |  | The last known address URI of the target. Includes information of the target is connected either directly (DDI) through HTTP or indirectly (DMF) through amqp | https://192.168.0.1 |
| securityToken |  | `string` |  | Pre-Shared key that allows targets to authenticate at Direct Device Integration API if enabled in the tenant settings | 2345678DGGDGFTDzztgf |
| requestAttributes |  | `boolean` |  | Request re-transmission of target attributes | true |
| targetType |  | `integer(int64)` |  | ID of the target type | 10 |

## MgmtTargetType

**_links**: * **compatibledistributionsettypes** - Link to the compatible distribution set types in this target type 

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| createdBy |  | `string` |  | Entity was originally created by (User, AMQP-Controller, anonymous etc.) | bumlux |
| createdAt |  | `integer(int64)` |  | Entity was originally created at (timestamp UTC in milliseconds) | 1691065905897 |
| lastModifiedBy |  | `string` |  | Entity was last modified by (User, AMQP-Controller, anonymous etc.) | bumlux |
| lastModifiedAt |  | `integer(int64)` |  | Entity was last modified at (timestamp UTC in milliseconds) | 1691065906407 |
| name | Y | `string` |  |  | Name of entity |
| description |  | `string` |  |  | Description of entity |
| key | Y | `string` |  | Key that can be interpreted by the target | id.t23 |
| colour |  | `string` |  | Colour assigned to the entity that could be used for representation purposes | brown |
| deleted |  | `boolean` |  | Deleted flag, used for soft deleted entities | false |
| id | Y | `integer(int64)` |  | The technical identifier of the entity | 26 |
| _links |  | `ref:Links` |  |  |  |

## MgmtTargetTypeRequestBodyPost

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| name | Y | `string` |  | The name of the entity | updatedTypeName |
| description |  | `string` |  | The description of the entity | an updated description |
| colour |  | `string` |  | The colour of the entity | #aaafff |
| key |  | `string` |  | Target type key | id.t23 |
| compatibledistributionsettypes |  | `array<ref:MgmtDistributionSetTypeAssignment>` |  | Array of distribution set types that are compatible to that target type |  |

## MgmtTargetTypeRequestBodyPut

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| name | Y | `string` |  | The name of the entity | updatedTypeName |
| description |  | `string` |  | The description of the entity | an updated description |
| colour |  | `string` |  | The colour of the entity | #aaafff |

## MgmtUserInfo

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| tenant |  | `string` |  |  |  |
| username |  | `string` |  |  |  |

## PagedListMgmtAction

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| content | Y | `array<ref:MgmtAction>` |  |  |  |
| total |  | `integer(int64)` |  |  |  |
| size |  | `integer(int32)` |  |  |  |
| _links |  | `ref:Links` |  |  |  |

## PagedListMgmtActionStatus

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| content | Y | `array<ref:MgmtActionStatus>` |  |  |  |
| total |  | `integer(int64)` |  |  |  |
| size |  | `integer(int32)` |  |  |  |
| _links |  | `ref:Links` |  |  |  |

## PagedListMgmtDistributionSet

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| content | Y | `array<ref:MgmtDistributionSet>` |  |  |  |
| total |  | `integer(int64)` |  |  |  |
| size |  | `integer(int32)` |  |  |  |
| _links |  | `ref:Links` |  |  |  |

## PagedListMgmtDistributionSetType

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| content | Y | `array<ref:MgmtDistributionSetType>` |  |  |  |
| total |  | `integer(int64)` |  |  |  |
| size |  | `integer(int32)` |  |  |  |
| _links |  | `ref:Links` |  |  |  |

## PagedListMgmtMetadata

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| content | Y | `array<ref:MgmtMetadata>` |  |  |  |
| total |  | `integer(int64)` |  |  |  |
| size |  | `integer(int32)` |  |  |  |
| _links |  | `ref:Links` |  |  |  |

## PagedListMgmtRolloutGroupResponseBody

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| content | Y | `array<ref:MgmtRolloutGroupResponseBody>` |  |  |  |
| total |  | `integer(int64)` |  |  |  |
| size |  | `integer(int32)` |  |  |  |
| _links |  | `ref:Links` |  |  |  |

## PagedListMgmtRolloutResponseBody

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| content | Y | `array<ref:MgmtRolloutResponseBody>` |  |  |  |
| total |  | `integer(int64)` |  |  |  |
| size |  | `integer(int32)` |  |  |  |
| _links |  | `ref:Links` |  |  |  |

## PagedListMgmtSoftwareModule

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| content | Y | `array<ref:MgmtSoftwareModule>` |  |  |  |
| total |  | `integer(int64)` |  |  |  |
| size |  | `integer(int32)` |  |  |  |
| _links |  | `ref:Links` |  |  |  |

## PagedListMgmtSoftwareModuleMetadata

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| content | Y | `array<ref:MgmtSoftwareModuleMetadata>` |  |  |  |
| total |  | `integer(int64)` |  |  |  |
| size |  | `integer(int32)` |  |  |  |
| _links |  | `ref:Links` |  |  |  |

## PagedListMgmtSoftwareModuleType

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| content | Y | `array<ref:MgmtSoftwareModuleType>` |  |  |  |
| total |  | `integer(int64)` |  |  |  |
| size |  | `integer(int32)` |  |  |  |
| _links |  | `ref:Links` |  |  |  |

## PagedListMgmtTag

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| content | Y | `array<ref:MgmtTag>` |  |  |  |
| total |  | `integer(int64)` |  |  |  |
| size |  | `integer(int32)` |  |  |  |
| _links |  | `ref:Links` |  |  |  |

## PagedListMgmtTarget

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| content | Y | `array<ref:MgmtTarget>` |  |  |  |
| total |  | `integer(int64)` |  |  |  |
| size |  | `integer(int32)` |  |  |  |
| _links |  | `ref:Links` |  |  |  |

## PagedListMgmtTargetFilterQuery

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| content | Y | `array<ref:MgmtTargetFilterQuery>` |  |  |  |
| total |  | `integer(int64)` |  |  |  |
| size |  | `integer(int32)` |  |  |  |
| _links |  | `ref:Links` |  |  |  |

## PagedListMgmtTargetType

| Field | Required | Type | Enum | Description | Example |
|---|---:|---|---|---|---|
| content | Y | `array<ref:MgmtTargetType>` |  |  |  |
| total |  | `integer(int64)` |  |  |  |
| size |  | `integer(int32)` |  |  |  |
| _links |  | `ref:Links` |  |  |  |
