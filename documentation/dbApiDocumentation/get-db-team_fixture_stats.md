# Endpoint: `GET /db/team_fixture_stats`

## Description

This endpoint queries the `team_fixture_stats` table to retrieve team statistics for fixtures. It supports pagination.

## Request

`GET /db/team_fixture_stats`

### Query Parameters

*   `sport` (string): The sport to query (e.g., `cs2`, `lol`). Defaults to `cs2`.
*   `limit` (integer): The maximum number of records to return. Defaults to `100`.
*   `offset` (integer): The number of records to skip for pagination. Defaults to `0`.

## Response

### Success (200 OK)

Returns a JSON array of team fixture statistic objects.

**Example Response Body:**

```json
[
    {
        "fixture_id": 54321,
        "team_id": 101,
        "kills": 50,
        "deaths": 40,
        "assists": 60
    }
]
```

### Error

*   **500 Internal Server Error**: If there is a problem with the database query.
