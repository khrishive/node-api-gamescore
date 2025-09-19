# Endpoint: `GET /db/team_info`

## Description

This endpoint queries the `team_info` table to retrieve general information about teams. It supports pagination.

## Request

`GET /db/team_info`

### Query Parameters

*   `sport` (string): The sport to query (e.g., `cs2`, `lol`). Defaults to `cs2`.
*   `limit` (integer): The maximum number of records to return. Defaults to `100`.
*   `offset` (integer): The number of records to skip for pagination. Defaults to `0`.

## Response

### Success (200 OK)

Returns a JSON array of team information objects.

**Example Response Body:**

```json
[
    {
        "team_id": 101,
        "name": "Team Alpha",
        "country": "USA",
        "founded": "2020-01-15"
    }
]
```

### Error

*   **500 Internal Server Error**: If there is a problem with the database query.
