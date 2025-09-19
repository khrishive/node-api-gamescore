# Endpoint: `GET /db/fixtures`

## Description

This endpoint queries the `fixtures` table, allowing for detailed filtering of match fixtures. It supports pagination and a wide range of query parameters to narrow down results.

## Request

`GET /db/fixtures`

### Query Parameters

All parameters are optional and can be combined.

*   `sport` (string): The sport to query (e.g., `cs2`, `lol`). Defaults to `cs2`.
*   `limit` (integer): The maximum number of records to return. Defaults to `100`.
*   `offset` (integer): The number of records to skip for pagination. Defaults to `0`.
*   `from` (string): A start date to filter fixtures (e.g., `YYYY-MM-DD`).
*   `to` (string): An end date to filter fixtures (e.g., `YYYY-MM-DD`).
*   `id` (integer): Filter by a specific fixture ID.
*   `competition_id` (integer): Filter by the parent competition's ID.
*   `competition_name` (string): Filter by competition name.
*   `status` (string): Filter by fixture status (e.g., `finished`, `live`, `upcoming`).
*   `winner_id` (integer): Filter by the ID of the winning participant.
*   `participants0_id` (integer): Filter by the ID of the first participant.
*   `participants0_name` (string): Filter by the name of the first participant.
*   `participants1_id` (integer): Filter by the ID of the second participant.
*   `participants1_name` (string): Filter by the name of the second participant.

## Response

### Success (200 OK)

Returns a JSON array of fixture objects that match the filter criteria.

**Example Response Body:**

```json
[
    {
        "id": 54321,
        "competition_id": 12345,
        "competition_name": "Major Championship 2025",
        "status": "finished",
        "start_time": "2025-10-10T14:00:00.000Z",
        "winner_id": 101
    }
]
```

### Error

*   **500 Internal Server Error**: If there is a problem with the database query.
