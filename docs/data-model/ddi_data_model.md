# hawkBit REST APIs — Data Model
- **API Version**: v1
- **Generated**: 2025-12-24 06:28:53

Eclipse hawkBit™ is a domain-independent back-end framework for rolling out software updates to constrained edge devices as well as more powerful controllers and gateways connected to IP based networking infrastructure.

## Conventions
- Field **Required/Optional** is derived from each schema's `required` list.
- `ref: SchemaName` indicates a `$ref` to another component schema.
- If `additionalProperties` is present, the object is a dictionary/map type.

## DdiActionFeedback
- **Type**: `object`
- **Required fields**: `status`

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `status` | Yes | ref: `DdiStatus` |  |  |
| `timestamp` | No | type: `integer`; format: `int64` | Timestamp (in milliseconds) when this status change occurred on Device. | 1627997501890 |

### Referenced by API operations
- `POST /{tenant}/controller/v1/{controllerId}/cancelAction/{actionId}/feedback` — postCancelActionFeedback (Feedback channel for cancel actions) [DDI Root Controller]
- `POST /{tenant}/controller/v1/{controllerId}/deploymentBase/{actionId}/feedback` — postDeploymentBaseActionFeedback (Feedback channel for the DeploymentBase action) [DDI Root Controller]

## DdiActionHistory
Current deployment state
- **Type**: `object`

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `status` | No | type: `string` | Status of the deployment based on previous feedback by the device | RUNNING |
| `messages` | No | type: `array`; items: `string` | Messages are previously sent to the feedback channel in LIFO order by the device. Note: The first status message is set by the system and describes the trigger of the deployment |  |

## DdiActivateAutoConfirmation
- **Type**: `object`

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `initiator` | No | type: `string` | Individual value (e.g. username) stored as initiator and automatically used as confirmed user in future actions | exampleUser |
| `remark` | No | type: `string` | Individual value to attach a remark which will be persisted when automatically confirming future actions | exampleRemark |

### Referenced by API operations
- `POST /{tenant}/controller/v1/{controllerId}/confirmationBase/activateAutoConfirm` — activateAutoConfirmation (Interface to activate auto-confirmation for a specific device) [DDI Root Controller]

## DdiArtifact
**_links**: * **download** - HTTPs Download resource for artifacts. The resource supports partial download as specified by RFC7233 (range requests). Keep in mind that the target needs to have the artifact assigned in order to be granted permission to download. * **md5sum** - HTTPs Download resource for MD5SUM file is an optional auto generated artifact that is especially useful for Linux based devices on order to check artifact consistency after download by using the md5sum command line tool. The MD5 and SHA1 are in addition available as metadata in the deployment command itself. * **download-http** - HTTP Download resource for artifacts. The resource supports partial download as specified by RFC7233 (range requests). Keep in mind that the target needs to have the artifact assigned in order to be granted permission to download. (note: anonymous download needs to be enabled on the service account for non-TLS access) * **md5sum-http** - HTTP Download resource for MD5SUM file is an optional auto generated artifact that is especially useful for Linux based devices on order to check artifact consistency after download by using the md5sum command line tool. The MD5 and SHA1 are in addition available as metadata in the deployment command itself. (note: anonymous download needs to be enabled on the service account for non-TLS access)
- **Type**: `object`
- **Required fields**: `filename`

**Example**
```json
{
  "filename": "binaryFile",
  "hashes": {
    "sha1": "e4e667b70ff652cb9d9c8a49f141bd68e06cec6f",
    "md5": "13793b0e3a7830ed685d3ede7ff93048",
    "sha256": "c51368bf045803b429a67bdf04539a373d9fb8caa310fe0431265e6871b4f07a"
  },
  "size": 11,
  "_links": {
    "download": {
      "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/40/filename/binaryFile"
    },
    "download-http": {
      "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/40/filename/binaryFile"
    },
    "md5sum-http": {
      "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/40/filename/binaryFile.MD5SUM"
    },
    "md5sum": {
      "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/40/filename/binaryFile.MD5SUM"
    }
  }
}
```

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `filename` | Yes | type: `string` | File name | binary.tgz |
| `hashes` | No | ref: `DdiArtifactHash` |  |  |
| `size` | No | type: `integer`; format: `int64` | Artifact size | 3 |
| `_links` | No | ref: `Links` |  |  |

### Referenced by API operations
- `GET /{tenant}/controller/v1/{controllerId}/softwaremodules/{softwareModuleId}/artifacts` — getSoftwareModulesArtifacts (Return all artifacts of a given software module and target) [DDI Root Controller]

## DdiArtifactHash
Artifact hashes
- **Type**: `object`

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `sha1` | No | type: `string` | SHA1 hash of the artifact in Base 16 format | 2d86c2a659e364e9abba49ea6ffcd53dd5559f05 |
| `md5` | No | type: `string` | MD5 hash of the artifact | 0d1b08c34858921bc7c662b228acb7ba |
| `sha256` | No | type: `string` | SHA-256 hash of the artifact in Base 16 format | a03b221c6c6eae7122ca51695d456d5222e524889136394944b2f9763b483615 |

## DdiAssignedVersion
- **Type**: `object`
- **Required fields**: `name`, `version`

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `name` | Yes | type: `string` | Distribution Set name | linux |
| `version` | Yes | type: `string` | Distribution set version | 1.2.3 |

### Referenced by API operations
- `PUT /{tenant}/controller/v1/{controllerId}/installedBase` — setAssignedOfflineVersion (Set offline assigned version) [DDI Root Controller]

## DdiAutoConfirmationState
- **Type**: `object`
- **Required fields**: `active`

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `active` | Yes | type: `boolean` |  | True |
| `initiator` | No | type: `string` |  | exampleUserId |
| `remark` | No | type: `string` |  | exampleRemark |
| `activatedAt` | No | type: `integer`; format: `int64` |  | 1691065895439 |
| `_links` | No | ref: `Links` |  |  |

## DdiCancel
- **Type**: `object`
- **Required fields**: `cancelAction`

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `id` | No | type: `string` | Id of the action | 11 |
| `cancelAction` | Yes | ref: `DdiCancelActionToStop` |  |  |

### Referenced by API operations
- `GET /{tenant}/controller/v1/{controllerId}/cancelAction/{actionId}` — getControllerCancelAction (Cancel an action) [DDI Root Controller]

## DdiCancelActionToStop
Action that needs to be canceled
- **Type**: `object`
- **Required fields**: `stopId`

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `stopId` | Yes | type: `string` | Id of the action that needs to be canceled (typically identical to id field on the cancel action itself) | 11 |

## DdiChunk
Software chunks of an update. In server mapped by Software Module
- **Type**: `object`
- **Required fields**: `name`, `part`, `version`

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `part` | Yes | type: `string` | Type of the chunk, e.g. firmware, bundle, app. In update server mapped to Software Module Type |  |
| `version` | Yes | type: `string` | Software version of the chunk | 1.2.0 |
| `name` | Yes | type: `string` | Name of the chunk |  |
| `encrypted` | No | type: `boolean` | If encrypted |  |
| `artifacts` | No | type: `array`; items: `DdiArtifact` | List of artifacts |  |
| `metadata` | No | type: `array`; items: `DdiMetadata` | Meta data of the respective software module that has been marked with 'target visible' |  |

## DdiConfig
DDI controller configuration
- **Type**: `object`

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `polling` | No | ref: `DdiPolling` |  |  |

## DdiConfigData
- **Type**: `object`
- **Required fields**: `data`

**Example**
```json
{
  "mode": "merge",
  "data": {
    "VIN": "JH4TB2H26CC000000",
    "hwRevision": "2"
  }
}
```

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `data` | Yes | type: `object`; additionalProperties: `string` | Link which is provided whenever the provisioning target or device is supposed to push its configuration data (aka. "controller attributes") to the server. Only shown for the initial configuration, after a successful update action, or if requested explicitly (e.g. via the management UI). |  |
| `mode` | No | type: `string`; enum: `merge`, `replace`, `remove` | Optional parameter to specify the update mode that should be applied when updating target attributes. Valid values are 'merge', 'replace', and 'remove'. Defaults to 'merge'. |  |

### Referenced by API operations
- `PUT /{tenant}/controller/v1/{controllerId}/configData` — putConfigData (Feedback channel for the config data action) [DDI Root Controller]

## DdiConfirmationBase
**_links**: * **confirmationBase** - confirmation base * **deactivateAutoConfirm** - where to deactivate auto confirm * **activateAutoConfirm** - where to activate auto confirm
- **Type**: `object`
- **Required fields**: `autoConfirm`

**Example**
```json
{
  "autoConfirm": {
    "active": false
  },
  "_links": {
    "activateAutoConfirm": {
      "href": "https://management-api.host.com/TENANT_ID/controller/v1/CONTROLLER_ID/confirmationBase/activateAutoConfirm"
    },
    "confirmationBase": {
      "href": "https://management-api.host.com/TENANT_ID/controller/v1/CONTROLLER_ID/confirmationBase/10?c=-2122565939"
    }
  }
}
```

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `autoConfirm` | Yes | ref: `DdiAutoConfirmationState` |  |  |
| `_links` | No | ref: `Links` |  |  |

### Referenced by API operations
- `GET /{tenant}/controller/v1/{controllerId}/confirmationBase` — getConfirmationBase (Resource to request confirmation specific information for the controller) [DDI Root Controller]

## DdiConfirmationBaseAction
The response body includes the detailed information about the action awaiting confirmation in the same format as for the deploymentBase operation.
- **Type**: `object`
- **Required fields**: `confirmation`, `id`

**Example**
```json
{
  "id": "6",
  "confirmation": {
    "download": "forced",
    "update": "forced",
    "maintenanceWindow": "available",
    "chunks": [
      {
        "part": "jvm",
        "version": "1.0.62",
        "name": "oneapp runtime",
        "artifacts": [
          {
            "filename": "binary.tgz",
            "hashes": {
              "sha1": "3dceccec02e7626184bdbba12b247b67ff04c363",
              "md5": "a9a7df0aa4c72b3b03b654c42d29744b",
              "sha256": "971d8db88fef8e7a3e6d5bbf501d69b07d0c300d9be948aff8b52960ef039358"
            },
            "size": 11,
            "_links": {
              "download": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/17/filename/binary.tgz"
              },
              "download-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/17/filename/binary.tgz"
              },
              "md5sum-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/17/filename/binary.tgz.MD5SUM"
              },
              "md5sum": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/17/filename/binary.tgz.MD5SUM"
              }
            }
          },
          {
            "filename": "file.signature",
            "hashes": {
              "sha1": "3dceccec02e7626184bdbba12b247b67ff04c363",
              "md5": "a9a7df0aa4c72b3b03b654c42d29744b",
              "sha256": "971d8db88fef8e7a3e6d5bbf501d69b07d0c300d9be948aff8b52960ef039358"
            },
            "size": 11,
            "_links": {
              "download": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/17/filename/file.signature"
              },
              "download-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/17/filename/file.signature"
              },
              "md5sum-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/17/filename/file.signature.MD5SUM"
              },
              "md5sum": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/17/filename/file.signature.MD5SUM"
              }
            }
          }
        ]
      },
      {
        "part": "bApp",
        "version": "1.0.96",
        "name": "oneapplication",
        "artifacts": [
          {
            "filename": "binary.tgz",
            "hashes": {
              "sha1": "701c0c0fcbee5e96fa5c5b819cb519686940ade3",
              "md5": "f0f6a34c4c9e79d07c2d92c3c3d88560",
              "sha256": "cff472a07c3143741fb03ac6c577acabef72a186a8bfaab00bbb47ca5ebbe554"
            },
            "size": 11,
            "_links": {
              "download": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/16/filename/binary.tgz"
              },
              "download-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/16/filename/binary.tgz"
              },
              "md5sum-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/16/filename/binary.tgz.MD5SUM"
              },
              "md5sum": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/16/filename/binary.tgz.MD5SUM"
              }
            }
          },
          {
            "filename": "file.signature",
            "hashes": {
              "sha1": "701c0c0fcbee5e96fa5c5b819cb519686940ade3",
              "md5": "f0f6a34c4c9e79d07c2d92c3c3d88560",
              "sha256": "cff472a07c3143741fb03ac6c577acabef72a186a8bfaab00bbb47ca5ebbe554"
            },
            "size": 11,
            "_links": {
              "download": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/16/filename/file.signature"
              },
              "download-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/16/filename/file.signature"
              },
              "md5sum-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/16/filename/file.signature.MD5SUM"
              },
              "md5sum": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/16/filename/file.signature.MD5SUM"
              }
            }
          }
        ]
      },
      {
        "part": "os",
        "version": "1.0.44",
        "name": "one Firmware",
        "artifacts": [
          {
            "filename": "binary.tgz",
            "hashes": {
              "sha1": "2b09765e953cd138b7da8f4725e48183dab62aec",
              "md5": "9b0aa2f51379cb4a5e0b7d026c2605c9",
              "sha256": "618faa741070b3f8148bad06f088e537a8f7913e734df4dde61fb163725cb4ee"
            },
            "size": 15,
            "_links": {
              "download": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/18/filename/binary.tgz"
              },
              "download-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/18/filename/binary.tgz"
              },
              "md5sum-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/18/filename/binary.tgz.MD5SUM"
              },
              "md5sum": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/18/filename/binary.tgz.MD5SUM"
              }
            }
          },
          {
            "filename": "file.signature",
            "hashes": {
              "sha1": "2b09765e953cd138b7da8f4725e48183dab62aec",
              "md5": "9b0aa2f51379cb4a5e0b7d026c2605c9",
              "sha256": "618faa741070b3f8148bad06f088e537a8f7913e734df4dde61fb163725cb4ee"
            },
            "size": 15,
            "_links": {
              "download": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/18/filename/file.signature"
              },
              "download-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/18/filename/file.signature"
              },
              "md5sum-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/18/filename/file.signature.MD5SUM"
              },
              "md5sum": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/18/filename/file.signature.MD5SUM"
              }
            }
          }
        ],
        "metadata": [
          {
            "key": "aMetadataKey",
            "value": "Metadata value as defined in software module"
          }
        ]
      }
    ]
  },
  "actionHistory": {
    "status": "WAIT_FOR_CONFIRMATION",
    "messages": [
      "Assignment initiated by user 'TestPrincipal'",
      "Waiting for the confirmation by the device before processing with the deployment"
    ]
  }
}
```

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `id` | Yes | type: `string` | Id of the action | 6 |
| `confirmation` | Yes | ref: `DdiDeployment` |  |  |
| `actionHistory` | No | ref: `DdiActionHistory` |  |  |
| `_links` | No | ref: `Links` |  |  |

### Referenced by API operations
- `GET /{tenant}/controller/v1/{controllerId}/confirmationBase/{actionId}` — getConfirmationBaseAction (Confirmation status of an action) [DDI Root Controller]

## DdiConfirmationFeedback
- **Type**: `object`
- **Required fields**: `confirmation`

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `confirmation` | Yes | type: `string`; enum: `confirmed`, `denied` | Action confirmation state |  |
| `code` | No | type: `integer`; format: `int32` | (Optional) Individual status code | 200 |
| `details` | No | type: `array`; items: `string` | List of detailed message information | ['Feedback message'] |

### Referenced by API operations
- `POST /{tenant}/controller/v1/{controllerId}/confirmationBase/{actionId}/feedback` — postConfirmationActionFeedback (Feedback channel for actions waiting for confirmation) [DDI Root Controller]

## DdiControllerBase
**_links**: Actions that the server has for the target * **deploymentBase** - Detailed deployment operation * **installedBase** - Detailed operation of last successfully finished action * **configData** - Link which is provided whenever the provisioning target or device is supposed to push its configuration data (aka. "controller attributes") to the server. Only shown for the initial configuration, after a successful update action, or if requested explicitly (e.g. via the management UI)
- **Type**: `object`

**Example**
```json
{
  "config": {
    "polling": {
      "sleep": "12:00:00"
    }
  },
  "_links": {
    "deploymentBase": {
      "href": "https://management-api.host.com/TENANT_ID/controller/v1/CONTROLLER_ID/deploymentBase/5?c=-2127183556"
    },
    "installedBase": {
      "href": "https://management-api.host.com/TENANT_ID/controller/v1/CONTROLLER_ID/installedBase/4"
    },
    "configData": {
      "href": "https://management-api.host.com/TENANT_ID/controller/v1/CONTROLLER_ID/configData"
    }
  }
}
```

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `config` | No | ref: `DdiConfig` |  |  |
| `_links` | No | ref: `Links` |  |  |

### Referenced by API operations
- `GET /{tenant}/controller/v1/{controllerId}` — getControllerBase (Root resource for an individual Target) [DDI Root Controller]

## DdiDeployment
Detailed deployment operation
- **Type**: `object`
- **Required fields**: `chunks`

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `download` | No | type: `string`; enum: `skip`, `attempt`, `forced` | Handling for the download part of the provisioning process ('skip': do not download yet, 'attempt': server asks to download, 'forced': server requests immediate download) |  |
| `update` | No | type: `string`; enum: `skip`, `attempt`, `forced` | Handling for the update part of the provisioning process ('skip': do not update yet, 'attempt': server asks to update, 'forced': server requests immediate update) |  |
| `chunks` | Yes | type: `array`; items: `DdiChunk` | Software chunks of an update. In server mapped by Software Module |  |
| `maintenanceWindow` | No | type: `string`; enum: `available`, `unavailable` | Separation of download and installation by defining a maintenance window for the installation. Status shows if currently in a window |  |

## DdiDeploymentBase
- **Type**: `object`
- **Required fields**: `deployment`, `id`

**Example**
```json
{
  "id": "8",
  "deployment": {
    "download": "forced",
    "update": "forced",
    "maintenanceWindow": "available",
    "chunks": [
      {
        "part": "jvm",
        "version": "1.0.75",
        "name": "oneapp runtime",
        "artifacts": [
          {
            "filename": "binary.tgz",
            "hashes": {
              "sha1": "986a1ade8b8a2f758ce951340cc5e21335cc2a00",
              "md5": "d04440e6533863247655ac5fd4345bcc",
              "sha256": "b3a04740a19e36057ccf258701922f3cd2f1a880536be53a3ca8d50f6b615975"
            },
            "size": 13,
            "_links": {
              "download": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/23/filename/binary.tgz"
              },
              "download-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/23/filename/binary.tgz"
              },
              "md5sum-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/23/filename/binary.tgz.MD5SUM"
              },
              "md5sum": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/23/filename/binary.tgz.MD5SUM"
              }
            }
          },
          {
            "filename": "file.signature",
            "hashes": {
              "sha1": "986a1ade8b8a2f758ce951340cc5e21335cc2a00",
              "md5": "d04440e6533863247655ac5fd4345bcc",
              "sha256": "b3a04740a19e36057ccf258701922f3cd2f1a880536be53a3ca8d50f6b615975"
            },
            "size": 13,
            "_links": {
              "download": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/23/filename/file.signature"
              },
              "download-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/23/filename/file.signature"
              },
              "md5sum-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/23/filename/file.signature.MD5SUM"
              },
              "md5sum": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/23/filename/file.signature.MD5SUM"
              }
            }
          }
        ]
      },
      {
        "part": "os",
        "version": "1.0.79",
        "name": "one Firmware",
        "artifacts": [
          {
            "filename": "binary.tgz",
            "hashes": {
              "sha1": "574cd34be20f75d101ed23518339cc38c5157bdb",
              "md5": "a0637c1ccb9fd53e2ba6f45712516989",
              "sha256": "498014801aab66be1d7fbea56b1aa5959651b6fd710308e196a8c414029e7291"
            },
            "size": 13,
            "_links": {
              "download": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/24/filename/binary.tgz"
              },
              "download-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/24/filename/binary.tgz"
              },
              "md5sum-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/24/filename/binary.tgz.MD5SUM"
              },
              "md5sum": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/24/filename/binary.tgz.MD5SUM"
              }
            }
          },
          {
            "filename": "file.signature",
            "hashes": {
              "sha1": "574cd34be20f75d101ed23518339cc38c5157bdb",
              "md5": "a0637c1ccb9fd53e2ba6f45712516989",
              "sha256": "498014801aab66be1d7fbea56b1aa5959651b6fd710308e196a8c414029e7291"
            },
            "size": 13,
            "_links": {
              "download": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/24/filename/file.signature"
              },
              "download-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/24/filename/file.signature"
              },
              "md5sum-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/24/filename/file.signature.MD5SUM"
              },
              "md5sum": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/24/filename/file.signature.MD5SUM"
              }
            }
          }
        ]
      },
      {
        "part": "bApp",
        "version": "1.0.91",
        "name": "oneapplication",
        "artifacts": [
          {
            "filename": "binary.tgz",
            "hashes": {
              "sha1": "e3ba7ff5839c210c98e254dde655147ffc49f5c9",
              "md5": "020017c498e6b0b8f76168fd55fa6fd1",
              "sha256": "80406288820379a82bbcbfbf7e8690146e46256f505de1c6d430c0168a74f6dd"
            },
            "size": 11,
            "_links": {
              "download": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/22/filename/binary.tgz"
              },
              "download-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/22/filename/binary.tgz"
              },
              "md5sum-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/22/filename/binary.tgz.MD5SUM"
              },
              "md5sum": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/22/filename/binary.tgz.MD5SUM"
              }
            }
          },
          {
            "filename": "file.signature",
            "hashes": {
              "sha1": "e3ba7ff5839c210c98e254dde655147ffc49f5c9",
              "md5": "020017c498e6b0b8f76168fd55fa6fd1",
              "sha256": "80406288820379a82bbcbfbf7e8690146e46256f505de1c6d430c0168a74f6dd"
            },
            "size": 11,
            "_links": {
              "download": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/22/filename/file.signature"
              },
              "download-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/22/filename/file.signature"
              },
              "md5sum-http": {
                "href": "http://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/22/filename/file.signature.MD5SUM"
              },
              "md5sum": {
                "href": "https://link-to-cdn.com/api/v1/TENANT_ID/download/controller/CONTROLLER_ID/softwaremodules/22/filename/file.signature.MD5SUM"
              }
            }
          }
        ],
        "metadata": [
          {
            "key": "aMetadataKey",
            "value": "Metadata value as defined in software module"
          }
        ]
      }
    ]
  },
  "actionHistory": {
    "status": "RUNNING",
    "messages": [
      "Reboot",
      "Write firmware",
      "Download done",
      "Download failed. ErrorCode #5876745. Retry",
      "Started download",
      "Assignment initiated by user 'TestPrincipal'"
    ]
  }
}
```

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `id` | Yes | type: `string` | Id of the action | 8 |
| `deployment` | Yes | ref: `DdiDeployment` |  |  |
| `actionHistory` | No | ref: `DdiActionHistory` |  |  |
| `_links` | No | ref: `Links` |  |  |

### Referenced by API operations
- `GET /{tenant}/controller/v1/{controllerId}/deploymentBase/{actionId}` — getControllerDeploymentBaseAction (Resource for software module (Deployment Base)) [DDI Root Controller]
- `GET /{tenant}/controller/v1/{controllerId}/installedBase/{actionId}` — getControllerInstalledAction (Previously installed action) [DDI Root Controller]

## DdiMetadata
Meta data of the respective software module that has been marked with 'target visible'
- **Type**: `object`
- **Required fields**: `key`, `value`

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `key` | Yes | type: `string` | Key of meta data entry |  |
| `value` | Yes | type: `string` | Value of meta data entry |  |

## DdiPolling
Suggested sleep time between polls
- **Type**: `object`

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `sleep` | No | type: `string` | Sleep time in HH:MM:SS notation | 12:00:00 |

## DdiProgress
Progress assumption of the device (currently not supported)
- **Type**: `object`
- **Required fields**: `cnt`

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `cnt` | Yes | type: `integer`; format: `int32` | Achieved amount | 2 |
| `of` | No | type: `integer`; format: `int32` | Maximum levels | 5 |

## DdiResult
Result of the action execution
- **Type**: `object`
- **Required fields**: `finished`

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `finished` | Yes | type: `string`; enum: `success`, `failure`, `none` | Result of the action execution |  |
| `progress` | No | ref: `DdiProgress` |  |  |

## DdiStatus
Target action status
- **Type**: `object`
- **Required fields**: `execution`, `result`

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `execution` | Yes | type: `string`; enum: `closed`, `proceeding`, `canceled`, `scheduled`, `rejected`, `resumed`, `downloaded`, `download` | Status of the action execution |  |
| `result` | Yes | ref: `DdiResult` |  |  |
| `code` | No | type: `integer`; format: `int32` | (Optional) Individual status code | 200 |
| `details` | No | type: `array`; items: `string` | List of details message information | ['Some feedback'] |

## ExceptionInfo
- **Type**: `object`

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `exceptionClass` | No | type: `string` |  |  |
| `errorCode` | No | type: `string` |  |  |
| `message` | No | type: `string` |  |  |
| `info` | No | type: `object`; additionalProperties: `object` |  |  |

### Referenced by API operations
- `GET /{tenant}/controller/v1/{controllerId}/cancelAction/{actionId}` — getControllerCancelAction (Cancel an action) [DDI Root Controller]
- `GET /{tenant}/controller/v1/{controllerId}/confirmationBase/{actionId}` — getConfirmationBaseAction (Confirmation status of an action) [DDI Root Controller]
- `GET /{tenant}/controller/v1/{controllerId}/confirmationBase` — getConfirmationBase (Resource to request confirmation specific information for the controller) [DDI Root Controller]
- `GET /{tenant}/controller/v1/{controllerId}/deploymentBase/{actionId}` — getControllerDeploymentBaseAction (Resource for software module (Deployment Base)) [DDI Root Controller]
- `GET /{tenant}/controller/v1/{controllerId}/installedBase/{actionId}` — getControllerInstalledAction (Previously installed action) [DDI Root Controller]
- `GET /{tenant}/controller/v1/{controllerId}/softwaremodules/{softwareModuleId}/artifacts/{fileName}.MD5SUM` — downloadArtifactMd5 (MD5 checksum download) [DDI Root Controller]
- `GET /{tenant}/controller/v1/{controllerId}/softwaremodules/{softwareModuleId}/artifacts/{fileName}` — downloadArtifact (Artifact download) [DDI Root Controller]
- `GET /{tenant}/controller/v1/{controllerId}/softwaremodules/{softwareModuleId}/artifacts` — getSoftwareModulesArtifacts (Return all artifacts of a given software module and target) [DDI Root Controller]
- `GET /{tenant}/controller/v1/{controllerId}` — getControllerBase (Root resource for an individual Target) [DDI Root Controller]
- `POST /{tenant}/controller/v1/{controllerId}/cancelAction/{actionId}/feedback` — postCancelActionFeedback (Feedback channel for cancel actions) [DDI Root Controller]
- `POST /{tenant}/controller/v1/{controllerId}/confirmationBase/activateAutoConfirm` — activateAutoConfirmation (Interface to activate auto-confirmation for a specific device) [DDI Root Controller]
- `POST /{tenant}/controller/v1/{controllerId}/confirmationBase/deactivateAutoConfirm` — deactivateAutoConfirmation (Interface to deactivate auto-confirmation for a specific controller) [DDI Root Controller]
- `POST /{tenant}/controller/v1/{controllerId}/confirmationBase/{actionId}/feedback` — postConfirmationActionFeedback (Feedback channel for actions waiting for confirmation) [DDI Root Controller]
- `POST /{tenant}/controller/v1/{controllerId}/deploymentBase/{actionId}/feedback` — postDeploymentBaseActionFeedback (Feedback channel for the DeploymentBase action) [DDI Root Controller]
- `PUT /{tenant}/controller/v1/{controllerId}/configData` — putConfigData (Feedback channel for the config data action) [DDI Root Controller]
- `PUT /{tenant}/controller/v1/{controllerId}/installedBase` — setAssignedOfflineVersion (Set offline assigned version) [DDI Root Controller]

## Link
- **Type**: `object`

### Fields
| Field | Required? | Type / Constraints | Description | Example |
|---|---|---|---|---|
| `href` | No | type: `string` |  |  |
| `hreflang` | No | type: `string` |  |  |
| `title` | No | type: `string` |  |  |
| `type` | No | type: `string` |  |  |
| `deprecation` | No | type: `string` |  |  |
| `profile` | No | type: `string` |  |  |
| `name` | No | type: `string` |  |  |
| `templated` | No | type: `boolean` |  |  |

## Links
- **Type**: `object`

### Shape
- Dictionary/object values are `ref: Link`.
