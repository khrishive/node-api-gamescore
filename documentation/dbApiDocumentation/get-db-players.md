# Endpoint: `GET /db/players`

## Description

This endpoint queries the `player` table to retrieve information about individual players.

## Request

`GET /db/players`

### Query Parameters

All parameters are optional and can be combined.

*   `sport` (string): The sport to query (e.g., `cs2`, `lol`). Defaults to `cs2`.
*   `limit` (integer): The maximum number of records to return. Defaults to `100`.
*   `offset` (integer): The number of records to skip for pagination. Defaults to `0`.
*   `id` (integer): Filter by player ID.
*   `team_id` (integer): Filter by the player's team ID.
*   `first_name` (string): Filter by first name.
*   `last_name` (string): Filter by last name.
*   `nickname` (string): Filter by nickname.
*   `country` (string): Filter by country.

## Response

### Success (200 OK)

Returns a JSON array of player objects.

**Example Response Body:**

```json
[
    {
        "id": 9001,
        "team_id": 101,
        "nickname": "ProGamer",
        "first_name": "Alex",
        "country": "Canada"
    }
]
```

### Error

*   **500 Internal Server Error**: If there is a problem with the database query.
