## API Overview

The backend exposes a JSON API documented in `backend/openapi.json`. You have an access on `http://localhost:3000/docs#/`.
Most endpoints require authentication and return JSON payloads with a consistent error format.

### Common Success Responses

| Status | Meaning | Typical use |
| ------ | ------- | ----------- |
| `200 OK` | Request succeeded | Read/update endpoints returning a resource or a list |
| `201 Created` | Resource created | `POST` endpoints such as `/users`, `/rooms`, `/reservations` |
| `204 No Content` | Request succeeded with no body | `DELETE` endpoints and auth logout endpoints |

### Common Error Responses

| Status | Meaning | Typical use |
| ------ | ------- | ----------- |
| `400 Bad Request` | Invalid body, query params, or path params | Validation errors such as `INVALID_BODY`, `INVALID_PARAMS`, `INVALID_QUERY` |
| `401 Unauthorized` | Missing or invalid authentication | Protected routes, invalid session, invalid credentials |
| `403 Forbidden` | Authenticated but not allowed | Admin-only actions |
| `404 Not Found` | Resource does not exist | Missing building, room, reservation, user, etc. |
| `409 Conflict` | Business rule conflict | Duplicate names, overlapping reservations, room unavailability conflicts |
| `500 Internal Server Error` | Unexpected server failure | Unhandled backend errors |

### Error Body Format

Validation and business errors follow a compact JSON structure:

```json
{
	"code": "INVALID_BODY",
	"issues": []
}
```

or:

```json
{
	"code": "ROOM_NOT_FOUND",
	"message": "Room not found"
}
```

### Request / Response Examples

Create a room:

```json
POST "http://localhost:3000/rooms"
{
    "name": "A01",
    "floor_id": 2,
    "capacity": 12
}
```

```json
{
	"id": 14,
	"name": "A01",
	"floor_id": 2,
	"capacity": 12
}
```

List buildings:

```json
GET "http://localhost:3000/buildings"
```

```json
[
	{
		"id": 1,
		"name": "Batiment A"
	},
	{
		"id": 2,
		"name": "Batiment B"
	}
]
```

Delete a resource assignment:

```json
DELETE "http://localhost:3000/rooms/14/resources/3"
```

This returns `204 No Content` when the deletion succeeds.

Example error response for invalid credentials:

```json
{
	"code": "INVALID_CREDENTIALS",
	"message": "Invalid email or password"
}