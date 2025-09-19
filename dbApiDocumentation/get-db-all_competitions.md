# Endpoint: `GET /db/all_competitions`

## Description

This endpoint retrieves all records from the `competitions` table for a specified sport without any filtering capabilities, aside from pagination.

## Request

`GET /db/all_competitions`

### Query Parameters

*   `sport` (string): The sport to query (e.g., `cs2`, `lol`). Defaults to `cs2`.
*   `limit` (integer): The maximum number of records to return. Defaults to `100`.
*   `offset` (integer): The number of records to skip for pagination. Defaults to `0`.

## Response

### Success (200 OK)

Returns a JSON array of all competition objects for the specified sport.

**Example Response Body:**

```json
[
    {
        "id": 12345,
        "name": "Major Championship 2025",
        "status": "upcoming"
    },
    {
        "id": 12346,
        "name": "Regional Qualifiers",
        "status": "finished"
    }
]
```

### Error

*   **500 Internal Server Error**: If there is a problem with the database query.
