# Endpoint: `GET /db/fixture_links`

## Description

This endpoint queries the `fixture_links` table, which contains links related to fixtures (e.g., stream URLs, VODs).

## Request

`GET /db/fixture_links`

### Query Parameters

*   `sport` (string): The sport to query (e.g., `cs2`, `lol`). Defaults to `cs2`.
*   `limit` (integer): The maximum number of records to return. Defaults to `100`.
*   `offset` (integer): The number of records to skip for pagination. Defaults to `0`.
*   `fixture_id` (integer): Filter links by a specific fixture ID.

## Response

### Success (200 OK)

Returns a JSON array of fixture link objects.

**Example Response Body:**

```json
[
    {
        "fixture_id": 54321,
        "name": "Official Stream",
        "url": "https://twitch.tv/gamescore_esports"
    }
]
```

### Error

*   **500 Internal Server Error**: If there is a problem with the database query.
