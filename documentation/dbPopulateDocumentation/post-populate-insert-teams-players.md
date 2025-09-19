# Endpoint: `POST /db/populate/insert-teams-players`

## Description

This endpoint triggers the `insertTeamsAndPlayers.js` script. It fetches all unique team IDs from the `participants` table, retrieves the latest player lineup for each team from an external API, and saves the player details into the `player` table.

## Request

`POST /db/populate/insert-teams-players`

### Body

*   `sport` (string, required): The sport for which to insert players (e.g., `cs2`, `lol`).

**Example Body:**

```json
{
    "sport": "cs2"
}
```

## Response

### Success (200 OK)

Returns a JSON object indicating that the insertion process has started.

**Example Response Body:**

```json
{
    "message": "Teams and players inserted successfully.",
    "sport": "cs2"
}
```

### Error

*   **400 Bad Request**: If the `sport` parameter is missing.
*   **500 Internal Server Error**: If there is an error executing the worker script.
