# Endpoint: `POST /db/populate/create-tables`

## Description

This endpoint executes the `createTables.js` script, which creates all the necessary tables in the database for a specified sport. It defines the schema for tables like `competitions`, `fixtures`, `players`, etc.

This is a foundational administrative endpoint. Running it on a database that already contains data is generally safe, as it uses `CREATE TABLE IF NOT EXISTS`.

## Request

`POST /db/populate/create-tables`

### Body

*   `sport` (string, required): The sport for which to create tables (e.g., `cs2`, `lol`).

**Example Body:**

```json
{
    "sport": "cs2"
}
```

## Response

### Success (200 OK)

Returns a JSON object indicating that the table creation process has started.

**Example Response Body:**

```json
{
    "message": "Tables created successfully.",
    "sport": "cs2"
}
```

### Error

*   **400 Bad Request**: If the `sport` parameter is missing.
*   **500 Internal Server Error**: If there is an error executing the worker script.
