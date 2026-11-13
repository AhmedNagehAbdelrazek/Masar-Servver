# Driver Verification — Rejection & Resubmission API Guide

**Scope:** How a driver learns that their verification documents were rejected, how they upload corrected documents, and what the admin dashboard shows.

**Decisions for this iteration**
- No verification submission history is stored.
- Resubmission replaces the current profile/vehicle document references.
- The dashboard shows only the current documents after resubmission.
- Old document versions are not displayed. Supporting old/new document comparison would require a separate submission-history table and is out of scope.

**Base URL:** `/api/v1`  
**Auth:** `Authorization: Bearer <access_token>`  
**Driver endpoints:** require a driver-role token.  
**Admin endpoints:** require an admin-role token.

---

## 1. Verification states

| Status | Meaning | Driver can edit/resubmit? | Mobile screen |
|---|---|---|---|
| `unverified` | Driver has never submitted a package. | Yes | Empty verification form |
| `pending` | Submitted and waiting for admin review. | No | Read-only “Under Review” |
| `rejected` | Admin rejected one or more documents/fields. | Yes | Rejection screen + editable form |
| `approved` | Verified and locked. | No | Read-only “Verified” |

The mobile app must treat `rejected` as its own stage. Do **not** infer the stage only from `isVerified` or from the onboarding booleans.

---

## 2. Recommended mobile flow

```text
Login
  -> GET /api/v1/driver/verification-status
      -> rejected
           show rejection reason + fields/documents to fix
           GET /api/v1/driver/verification        (prefill form)
           POST /api/v1/upload                    (for each changed file)
           PUT  /api/v1/driver/verification        (resubmit full package)
           show "Under Review"
      -> pending
           show read-only submitted data
      -> approved
           show verified profile
      -> unverified
           show empty form and submit
```

### Important
`GET /api/v1/auth/onboarding/status` currently returns only onboarding booleans (`profileSubmitted`, `vehicleSubmitted`, etc.). It does **not** return the rejection reason or failed fields.

Use `GET /api/v1/driver/verification-status` as the source of truth after login and after app resume. If the mobile app cannot make that extra call, the backend needs a small change to add verification rejection data to `/auth/onboarding/status` (see section 8).

---

## 3. Driver endpoints

### 3.1 Get verification status

`GET /api/v1/driver/verification-status`

Returns the current verification state and the latest submitted values.

**Rejected example**

```json
{
  "status": "success",
  "data": {
    "status": {
      "value": "rejected",
      "can_edit": true,
      "submitted_at": "2026-11-10T10:15:00.000Z",
      "rejected_at": "2026-11-12T14:30:00.000Z",
      "rejection_reason": "The license photo is blurry. Please upload a clear photo.",
      "fields_to_fix": ["license", "personal_photo"]
    },
    "driver": {
      "full_name": "Ali Ahmed",
      "national_id": "1234567890",
      "license_number": "L-12345",
      "license_expiry": "2028-06-30",
      "user_identification_front": 101,
      "user_identification_back": 102,
      "lincese_front": 103,
      "lincese_back": 104,
      "personal_image_with_id": 105
    },
    "vehicle": {
      "id": "4a6f5f0e-3e4f-4f1e-9a55-1234567890ab",
      "manufacturer": "Toyota",
      "model": "Camry",
      "vehicle_type": "sedan",
      "model_year": 2022,
      "plate_number": "ABC-123",
      "code_number": "88-99",
      "color": "white",
      "seats": 4,
      "registration_doc_front": 106,
      "registration_doc_back": 107,
      "vehicle_photo_front": 108,
      "vehicle_photo_back": 109
    }
  }
}
```

**Mobile behavior by status**

- `unverified`: `can_edit = true`, form empty or partially saved.
- `pending`: `can_edit = false`, show submitted data as read-only.
- `rejected`: `can_edit = true`, show `rejection_reason`, highlight `fields_to_fix`, prefill the form.
- `approved`: `can_edit = false`, show verified state.

**`fields_to_fix` values**

The dedicated admin rejection endpoint uses these mobile-friendly keys:

```text
national_id
license
personal_photo
vehicle_registration
vehicle_photo
vehicle_details
personal_details
```

The dashboard per-document rejection can return the more specific document keys:

```text
id_front
id_back
face_photo
license_front
license_back
registration_front
registration_back
vehicle_photo_front
vehicle_photo_back
```

Mobile should map both forms using the table in section 6.

---

### 3.2 Get current submission (form prefill)

`GET /api/v1/driver/verification`

Returns the latest profile and vehicle values. Use these values to prefill the edit form.

```json
{
  "status": "success",
  "data": {
    "driver": {
      "full_name": "Ali Ahmed",
      "national_id": "1234567890",
      "license_number": "L-12345",
      "license_expiry": "2028-06-30",
      "user_identification_front": 101,
      "user_identification_back": 102,
      "lincese_front": 103,
      "lincese_back": 104,
      "personal_image_with_id": 105
    },
    "vehicle": {
      "id": "4a6f5f0e-3e4f-4f1e-9a55-1234567890ab",
      "manufacturer": "Toyota",
      "model": "Camry",
      "vehicle_type": "sedan",
      "model_year": 2022,
      "plate_number": "ABC-123",
      "code_number": "88-99",
      "color": "white",
      "seats": 4,
      "registration_doc_front": 106,
      "registration_doc_back": 107,
      "vehicle_photo_front": 108,
      "vehicle_photo_back": 109
    }
  }
}
```

If the driver has never submitted, document fields are `null` and `vehicle.id` is `null`.

---

### 3.3 Upload a document

`POST /api/v1/upload`

`multipart/form-data` with one file field named `file`.

Supported types: JPEG, PNG, WebP, GIF.

**Response**

```json
{
  "id": 110,
  "filename": "license_front_2026.png",
  "url": "https://.../uploads/license_front_2026.png",
  "cached": false,
  "duplicate": false,
  "provider": "local"
}
```

If the exact same file was already uploaded, the server still accepts it and returns the existing image ID:

```json
{
  "id": 110,
  "filename": "license_front_2026.png",
  "url": "https://.../uploads/license_front_2026.png",
  "cached": true,
  "duplicate": true,
  "message": "This image was already uploaded. It was accepted, but please make sure it is the correct document.",
  "provider": "local"
}
```

`duplicate: true` is a warning, not an error. The upload remains valid and the returned `id` can be used in the verification submission. The message is localized using the normal request locale.

**Important:** the verification submission expects the numeric uploaded-image `id` (for example `110`), not the URL.

---

### 3.4 Submit or resubmit verification

`PUT /api/v1/driver/verification`

This is the endpoint to use after rejection. It is an upsert:
- Creates the profile/vehicle on first submission.
- Updates the existing profile/vehicle on resubmission.
- Merges omitted fields from the latest saved data.
- Replaces only the document IDs that are provided.
- Clears the previous rejection reason/fields.
- Clears the previous per-document review decisions, so the dashboard shows the new document set as `pending`.
- Sets the status back to `pending`.

**Request**

```json
{
  "full_name": "Ali Ahmed",
  "national_id": "1234567890",
  "license_number": "L-12345",
  "license_expiry": "2028-06-30",
  "user_identification_front": 101,
  "user_identification_back": 102,
  "lincese_front": 110,
  "lincese_back": 104,
  "personal_image_with_id": 105,
  "vehicle": {
    "manufacturer": "Toyota",
    "model": "Camry",
    "vehicle_type": "sedan",
    "model_year": 2022,
    "plate_number": "ABC-123",
    "code_number": "88-99",
    "color": "white",
    "seats": 4,
    "registration_doc_front": 106,
    "registration_doc_back": 107,
    "vehicle_photo_front": 108,
    "vehicle_photo_back": 109
  }
}
```

The `vehicle` object is required. These vehicle fields are required:

```text
manufacturer
model
vehicle_type
plate_number
seats
```

All driver document fields and all vehicle document fields are optional. Omitted document IDs keep their current value.

**Success response**

```json
{
  "status": "success",
  "data": {
    "status": "pending",
    "submitted_at": "2026-11-13T09:45:00.000Z"
  }
}
```

**Errors**

| HTTP | Code | When |
|---|---|---|
| `409` | `CONFLICT` | Status is already `pending`; message key `YOUR_VERIFICATION_APPLICATION_IS_ALREADY_UNDER_REVIEW`. |
| `403` | `FORBIDDEN` | Status is `approved`; message key `YOUR_VERIFICATION_IS_APPROVED_AND_LOCKED_CONTACT_SUPPORT_IF_YOU`. |
| `422` | `VALIDATION_ERROR` | Missing/invalid vehicle fields or body fields. |
| `422` | `VALIDATION_ERROR` | One or more uploaded document IDs do not exist. |
| `422` | `VALIDATION_ERROR` | A second vehicle insert is attempted; message key `YOU_ALREADY_HAVE_A_REGISTERED_VEHICLE_UPDATE_IT_INSTEAD`. |
| `404` | `NOT_FOUND` | Driver not found. |

---

### 3.5 What not to use for resubmission

Do not use these onboarding endpoints to replace rejected documents:

```text
POST /api/v1/auth/onboarding/profile
POST /api/v1/auth/onboarding/vehicle
```

They are for the first submission only. When a profile/vehicle already exists they return conflicts such as:

- `409 DRIVER_PROFILE_ALREADY_EXISTS`
- `422 YOU_ALREADY_HAVE_A_REGISTERED_VEHICLE_UPDATE_IT_INSTEAD`

Use `PUT /api/v1/driver/verification` instead.

---

## 4. Notification behavior

When an admin rejects verification, the driver receives a `VERIFICATION_REJECTED` notification.

Current notification data:

```json
{
  "driver_id": "driver-uuid",
  "reason": "The license photo is blurry.",
  "fields_to_fix": ["license", "personal_photo"]
}
```

When the rejection comes from the dashboard’s per-document action, `fields_to_fix` may contain document keys such as:

```json
{
  "driver_id": "driver-uuid",
  "reason": "The license photo is blurry.",
  "fields_to_fix": ["license_front"]
}
```

Mobile should use the mapping table in section 6 before highlighting fields.

---

## 5. Admin/dashboard endpoints

### 5.1 Verification queue

`GET /api/v1/admin/verification/queue?status=pending&page=1&limit=20`

Returns drivers whose `verification_status` matches the filter. The queue is the canonical list for overall approve/reject decisions.

Typical item:

```json
{
  "id": "driver-uuid",
  "status": {
    "value": "pending",
    "submitted_at": "2026-11-13T09:45:00.000Z"
  },
  "driver": {
    "user_id": "driver-uuid",
    "full_name": "Ali Ahmed",
    "phone": "+96279******",
    "profile_id": "profile-uuid",
    "national_id": "1234567890",
    "license_number": "L-12345",
    "user_identification_front": 101,
    "user_identification_back": 102,
    "lincese_front": 110,
    "lincese_back": 104,
    "personal_image_with_id": 105
  },
  "vehicle": {
    "vehicle_id": "vehicle-uuid",
    "manufacturer": "Toyota",
    "model": "Camry",
    "vehicle_type": "sedan",
    "model_year": 2022,
    "plate_number": "ABC-123",
    "code_number": "88-99",
    "color": "white",
    "seats": 4,
    "registration_doc_front": 106,
    "registration_doc_back": 107,
    "vehicle_photo_front": 108,
    "vehicle_photo_back": 109
  },
  "documents": [
    { "label": "national_id_front", "url": "https://.../front.png" }
  ]
}
```

### 5.2 Approve the whole driver

`POST /api/v1/admin/verification/drivers/:driver_id/approve`

No body.

### 5.3 Reject the whole driver

`POST /api/v1/admin/verification/drivers/:driver_id/reject`

```json
{
  "reason": "The license photo is blurry. Please upload a clear photo.",
  "fields_to_fix": ["license", "personal_photo"]
}
```

`reason` and a non-empty `fields_to_fix` array are required. Allowed keys:

```text
national_id
license
personal_photo
vehicle_registration
vehicle_photo
vehicle_details
personal_details
```

### 5.4 Dashboard document list

`GET /api/v1/admin/dashboard/drivers/:driver_id/documents`

Returns the current documents only. After a resubmission, this returns the new document IDs; previous documents are not returned.

```json
{
  "personal_documents": [
    {
      "key": "license_front",
      "document_url": "https://.../new-license-front.png",
      "upload_date": "2026-11-13T09:40:00.000Z",
      "status": "pending"
    }
  ],
  "vehicle_documents": []
}
```

Document `status` is one of:

```text
pending | approved | rejected | missing
```

Current dashboard document keys:

```text
id_front
id_back
face_photo
license_front
license_back
registration_front
registration_back
insurance (not tracked yet)
```

### 5.5 Dashboard document approve/reject

```text
POST /api/v1/admin/dashboard/drivers/:driver_id/documents/:document_key/approve
POST /api/v1/admin/dashboard/drivers/:driver_id/documents/:document_key/reject
```

Reject body:

```json
{
  "reason": "The license photo is blurry."
}
```

These actions update the current document review and can move the driver to `rejected` or back to `pending`.

---

## 6. Field-key mapping

Mobile should accept both sets of keys.

| Dashboard document key | Mobile fix key |
|---|---|
| `id_front` | `national_id` |
| `id_back` | `national_id` |
| `face_photo` | `personal_photo` |
| `license_front` | `license` |
| `license_back` | `license` |
| `registration_front` | `vehicle_registration` |
| `registration_back` | `vehicle_registration` |
| `vehicle_photo_front` | `vehicle_photo` |
| `vehicle_photo_back` | `vehicle_photo` |
| `personal_details` | `personal_details` |
| `vehicle_details` | `vehicle_details` |

---

## 7. Resubmission example: only the license front changed

1. Driver opens the app and calls:

```text
GET /api/v1/driver/verification-status
```

2. Response says `rejected`, `fields_to_fix: ["license_front"]`.

3. Driver uploads a new file:

```text
POST /api/v1/upload
file=<new-license-front.png>
```

Response contains `{ "id": 110, ... }`.

4. Driver fetches the existing form:

```text
GET /api/v1/driver/verification
```

5. Driver sends the existing package back with only the changed document ID:

```json
{
  "full_name": "Ali Ahmed",
  "national_id": "1234567890",
  "license_number": "L-12345",
  "license_expiry": "2028-06-30",
  "user_identification_front": 101,
  "user_identification_back": 102,
  "lincese_front": 110,
  "lincese_back": 104,
  "personal_image_with_id": 105,
  "vehicle": {
    "manufacturer": "Toyota",
    "model": "Camry",
    "vehicle_type": "sedan",
    "model_year": 2022,
    "plate_number": "ABC-123",
    "code_number": "88-99",
    "color": "white",
    "seats": 4,
    "registration_doc_front": 106,
    "registration_doc_back": 107,
    "vehicle_photo_front": 108,
    "vehicle_photo_back": 109
  }
}
```

6. Server responds `pending` and the dashboard now shows `110` as the current license-front image. The old image is not retained in a verification-history view.

---

## 8. Optional backend changes (only if needed)

The core rejection/resubmission flow already works through the endpoints above. These are optional improvements:

1. **Extend `GET /api/v1/auth/onboarding/status`** with the same rejection fields as `verification-status` if mobile cannot make a second call after login. Recommended shape:

```json
{
  "role": "driver",
  "passwordSet": true,
  "profileSubmitted": true,
  "profileVerified": false,
  "vehicleSubmitted": true,
  "vehicleVerified": false,
  "fullyVerified": false,
  "verificationStatus": "rejected",
  "verification": {
    "status": "rejected",
    "can_edit": true,
    "rejection_reason": "The license photo is blurry.",
    "fields_to_fix": ["license"],
    "documents_to_fix": ["license_front"],
    "rejected_at": "2026-11-12T14:30:00.000Z",
    "submitted_at": "2026-11-10T10:15:00.000Z"
  }
}
```

2. **Normalize dashboard rejection keys** to the mobile fix keys before sending the notification. Today the dashboard per-document action can send `license_front` while the dedicated rejection endpoint sends `license`. Mobile can map both as shown in section 6.

3. **Keep only the latest documents** is the current behavior and matches the “no history” decision. If old/new comparison is needed later, add a `driver_verification_submissions` table and store snapshots per submission; do not try to reconstruct old images from the current profile/vehicle rows.
