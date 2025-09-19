# Endpoint: `GET /db/participants`

## Description

This endpoint queries the `participants` table, which contains information about the teams or players participating in competitions.

## Request

`GET /db/participants`

### Query Parameters

All parameters are optional and can be combined.

*   `sport` (string): The sport to query (e.g., `cs2`, `lol`). Defaults to `cs2`.
*   `limit` (integer): The maximum number of records to return. Defaults to `100`.
*   `offset` (integer): The number of records to skip for pagination. Defaults to `0`.
*   `id` (integer): Filter by participant ID.
*   `name` (string): Filter by participant name.
*   `country` (string): Filter by country.
*   `player_id_0` to `player_id_4` (integer): Filter by the ID of a player on the team.
*   `player_name_0` to `player_name_4` (string): Filter by the name of a player on the team.

## Response

### Success (200 OK)

Returns a JSON array of participant objects.

**Example Response Body:**

```json
[
    {
        "id": 101,
        "name": "Team Alpha",
        "country": "USA",
        "sport": "cs2"
    }
]
```

### Error

*   **500 Internal Server Error**: If there is a problem with the database query.
