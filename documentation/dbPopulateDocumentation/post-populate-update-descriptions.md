# Endpoint: `POST /db/populate/update-descriptions`

## Description

This endpoint triggers the `insertCompetitionDescriptionsGeneralAI.js` script. It finds all competitions that are missing a description and uses a generative AI model (like Gemini or OpenAI) to create and save a description for each one.

## Request

`POST /db/populate/update-descriptions`

### Body

*   `sport` (string, required): The sport for which to update descriptions (e.g., `cs2`, `lol`).

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
    "message": "Descripciones de torneos actualizadas exitosamente.",
    "sport": "cs2"
}
```

### Error

*   **400 Bad Request**: If the `sport` parameter is missing.
*   **500 Internal Server Error**: If there is an error executing the worker script.
