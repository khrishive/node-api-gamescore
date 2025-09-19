# Endpoint: `POST /db/populate/general`

## Description

This endpoint serves as a general-purpose data population trigger. It executes the `populateDataInDB.js` script, which is designed to run a sequence of other insertion scripts to fully populate the database for a given sport.

This is a powerful administrative endpoint that should be used with caution, as it performs multiple database operations.

## Request

`POST /db/populate/general`

### Body

*   `sport` (string, required): The sport for which to populate data (e.g., `cs2`, `lol`).

**Example Body:**

```json
{
    "sport": "cs2"
}
```

## Response

### Success (200 OK)

Returns a JSON object indicating that the population process has started.

**Example Response Body:**

```json
{
    "message": "All processes completed.",
    "sport": "cs2"
}
```

### Error

*   **400 Bad Request**: If the `sport` parameter is missing.
*   **500 Internal Server Error**: If there is an error executing the worker script.
