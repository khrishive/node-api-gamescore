# Endpoint: `GET /db/all_fixtures`

## Description

This endpoint retrieves all records from the `fixtures` table for a specified sport, without any filtering capabilities.

## Request

`GET /db/all_fixtures`

### Query Parameters

*   `sport` (string): The sport to query (e.g., `cs2`, `lol`). Defaults to `cs2`.

## Response

### Success (200 OK)

Returns a JSON array of all fixture objects for the specified sport.

**Example Response Body:**

```json
[
    {
        "id": 54321,
        "competition_id": 12345,
        "status": "finished"
    },
    {
        "id": 54322,
        "competition_id": 12345,
        "status": "upcoming"
    }
]
```

### Error

*   **500 Internal Server Error**: If there is a problem with the database query.
