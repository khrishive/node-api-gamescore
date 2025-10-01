# Endpoint: `POST /db/populate/insert-fixtures`

## Description

This endpoint runs the `insertOnlyFixtures.js` script. It fetches all fixtures from the current date to the end of the year from an external API and inserts them into the `fixtures` table for the specified sport.

## Request

`POST /db/populate/insert-fixtures`

### Body

*   `sport` (string, required): The sport for which to insert fixtures (e.g., `cs2`, `lol`).

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
    "message": "Fixtures inserted successfully.",
    "sport": "cs2"
}
```

### Error

*   **400 Bad Request**: If the `sport` parameter is missing.
*   **500 Internal Server Error**: If there is an error executing the worker script.
