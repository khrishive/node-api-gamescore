# Endpoint: `POST /db/populate/insert-teams`

## Description

This endpoint executes the `insertTeams.js` script. The script first finds all unique team IDs from the `fixtures` table, then fetches detailed information for each team from an external API, and finally saves this information into the `participants` table.

## Request

`POST /db/populate/insert-teams`

### Body

*   `sport` (string, required): The sport for which to insert teams (e.g., `cs2`, `lol`).

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
    "message": "Teams inserted successfully.",
    "sport": "cs2"
}
```

### Error

*   **400 Bad Request**: If the `sport` parameter is missing.
*   **500 Internal Server Error**: If there is an error executing the worker script.
