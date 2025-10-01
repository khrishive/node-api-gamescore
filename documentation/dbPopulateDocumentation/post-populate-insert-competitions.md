# Endpoint: `POST /db/populate/insert-competitions`

## Description

This endpoint triggers the `insertCompetitions.js` script, which fetches competition data for the current year from an external API and saves it into the `competitions` table for the specified sport.

## Request

`POST /db/populate/insert-competitions`

### Body

*   `sport` (string, required): The sport for which to insert competitions (e.g., `cs2`, `lol`).

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
    "message": "Competiciones insertadas exitosamente.",
    "sport": "cs2"
}
```

### Error

*   **400 Bad Request**: If the `sport` parameter is missing.
*   **500 Internal Server Error**: If there is an error executing the worker script.
