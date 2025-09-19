# Endpoint: `GET /db/competitions`

## Description

This endpoint queries the `competitions` table in the database. It allows for retrieving a filtered list of competitions based on various query parameters. By default, it returns 100 records, but this can be adjusted with the `limit` and `offset` parameters.

## Request

`GET /db/competitions`

### Query Parameters

All parameters are optional and can be combined.

*   `sport` (string): The sport to query (e.g., `cs2`, `lol`). Defaults to `cs2`.
*   `limit` (integer): The maximum number of records to return. Defaults to `100`.
*   `offset` (integer): The number of records to skip for pagination. Defaults to `0`.
*   `id` (integer): Filter by a specific competition ID.
*   `name` (string): Filter by competition name (supports partial matching with `%`).
*   `sport_alias` (string): Filter by the sport's alias.
*   `start_date` (string): Filter by the competition's start date.
*   `end_date` (string): Filter by the competition's end date.
*   `prize_pool_usd` (string): Filter by the prize pool in USD.
*   `location` (string): Filter by the competition's location.
*   `organizer` (string): Filter by the organizer's name.
*   `type` (string): Filter by the competition type (e.g., "Online", "Offline").
*   `fixture_count` (integer): Filter by the number of fixtures.
*   `description` (string): Filter by the competition description.
*   `no_participants` (integer): Filter by the number of participants.
*   `stage` (string): Filter by the competition stage.
*   `time_of_year` (string): Filter by the time of year.
*   `year` (integer): Filter by the year.
*   `series` (string): Filter by the competition series.
*   `tier` (string): Filter by the competition tier.

## Response

### Success (200 OK)

Returns a JSON array of competition objects that match the filter criteria.

**Example Response Body:**

```json
[
    {
        "id": 12345,
        "name": "Major Championship 2025",
        "start_date": "2025-10-01T00:00:00.000Z",
        "end_date": "2025-10-15T23:59:59.000Z",
        "status": "upcoming",
        "organizer": "GameScore Events"
    }
]
```

### Error

*   **500 Internal Server Error**: If there is a problem with the database query.
