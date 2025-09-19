# Endpoint: `GET /db/stats_player`

## Description

This endpoint queries the `stats_player` table to retrieve player statistics. It supports pagination.

## Request

`GET /db/stats_player`

### Query Parameters

*   `sport` (string): The sport to query (e.g., `cs2`, `lol`). Defaults to `cs2`.
*   `limit` (integer): The maximum number of records to return. Defaults to `100`.
*   `offset` (integer): The number of records to skip for pagination. Defaults to `0`.

## Response

### Success (200 OK)

Returns a JSON array of player statistic objects.

**Example Response Body:**

```json
[
    {
        "player_id": 9001,
        "average_kills": 20.5,
        "average_deaths": 15.2,
        "headshot_percentage": 45.5
    }
]
```

### Error

*   **500 Internal Server Error**: If there is a problem with the database query.
