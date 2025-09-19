# Endpoint: `POST /db/populate/update-participants`

## Description

This endpoint runs the `updateNumberOfParticipantsInCompetitions.js` script. It iterates through all competitions in the database, fetches the list of participants for each one from an external API, and updates the `no_participants` count in the `competitions` table.

## Request

`POST /db/populate/update-participants`

### Body

*   `sport` (string, required): The sport for which to update participant counts (e.g., `cs2`, `lol`).

**Example Body:**

```json
{
    "sport": "cs2"
}
```

## Response

### Success (200 OK)

Returns a JSON object indicating that the update process has started.

**Example Response Body:**

```json
{
    "message": "Number of participants updated successfully.",
    "sport": "cs2"
}
```

### Error

*   **400 Bad Request**: If the `sport` parameter is missing.
*   **500 Internal Server Error**: If there is an error executing the worker script.
