# Scripts Documentation

This document provides a detailed explanation of each script located in the `src/scripts` directory. These scripts are designed to be run manually or as scheduled tasks (e.g., using PM2 cron jobs) to perform various data processing, synchronization, and population tasks.

---

## `fetchCompetitionsDescriptions.js`

### Purpose

This script automatically generates and updates descriptions for competitions in the database that are missing one.

### Detailed Workflow

1.  **Database Connection**: It connects to the main MySQL database using credentials from environment variables.
2.  **Identify Missing Descriptions**: The script queries the `competitions` table to find all entries where the `description` column is `NULL`.
3.  **Call Gemini API**: For each competition without a description, it sends a request to the Google Gemini API. The request asks the AI to generate a brief, descriptive text for the tournament based on its name.
4.  **Parse Response**: It parses the JSON response from the Gemini API to extract the generated description.
5.  **Update Database**: The script then runs an `UPDATE` query to save the newly generated description into the corresponding row in the `competitions` table.
6.  **Looping and Delay**: The process runs in a loop, continuing as long as there are competitions with `NULL` descriptions. A one-second delay is included between each API call to prevent rate-limiting issues.

**Key Dependencies**: `axios`, `mysql2/promise`

---

## `runAllActiveUpdates.js`

### Purpose

This script is responsible for updating the map breakdown data for all currently active tournaments across all supported sports (e.g., CS2, LoL).

### Detailed Workflow

1.  **Import Dependencies**: It imports the core function `updateActiveMapBreakdowns` and the database connections for each sport (`dbCS2`, `dbLOL`).
2.  **Iterate Through Sports**: The script dynamically identifies the configured sports from the imported database connections. It then loops through each one.
3.  **Execute Update**: Inside the loop, it calls the `updateActiveMapBreakdowns(sport)` function. This function contains the logic to identify active tournaments for that sport and update their associated map breakdown data.
4.  **Logging**: It logs the start and end of processing for each sport and provides a final summary of which sports were processed successfully or unsuccessfully.

**Key Dependencies**: `../middleware/updateActiveTournamentsMapBreakdowns.js`, `../db.js`

---

## `runAllCsMatchEventsCopy.js`

### Purpose

This script processes and inserts match events (like kills, assists, etc.) from a source to a destination table for all supported sports. While named with "Cs" (Counter-Strike), it is designed to be sport-agnostic.

### Detailed Workflow

1.  **Import Dependencies**: It imports the main processing function `processCsMatchEvents` from `../inserts/csMatchEventsCopy.js` and the database connections.
2.  **Iterate Through Sports**: It loops through each configured sport (CS2, LoL, etc.).
3.  **Process Events**: For each sport, it calls `processCsMatchEvents(sport)`, which handles the logic for fetching, transforming, and inserting match event data into the database.
4.  **Logging**: The script provides detailed logs for which sports are being processed and reports a final count of successful and failed operations.

**Key Dependencies**: `../inserts/csMatchEventsCopy.js`, `../db.js`

---

## `runAllInsertMapTeamPlayers.js`

### Purpose

This script populates the database with data that links players to specific teams for each map played in a fixture.

### Detailed Workflow

1.  **Import Dependencies**: It imports the `processMapTeamPlayers` function from `../inserts/insertMapTeamPlayers.js` and the database connections.
2.  **Iterate Through Sports**: The script runs in a loop for each supported sport.
3.  **Insert Data**: In each iteration, it calls `processMapTeamPlayers(sport)`. This function contains the logic to fetch player, team, and map associations and insert them into the relevant database tables.
4.  **Logging**: It logs the progress for each sport and provides a summary at the end of the execution.

**Key Dependencies**: `../inserts/insertMapTeamPlayers.js`, `../db.js`

---

## `runAllOtherFixtures.js`

### Purpose

This script is responsible for inserting "other" fixtures into the database. This likely refers to fixtures that are not from a primary source or require a different processing method.

### Detailed Workflow

1.  **Import Dependencies**: It imports the `processFixtures` function from `../inserts/insertOnlyOtherFixtures.js` and the database connections.
2.  **Iterate Through Sports**: It loops through all configured sports.
3.  **Process and Insert Fixtures**: For each sport, it calls `processFixtures(sport)`, which handles the fetching and insertion of these specific types of fixtures.
4.  **Logging**: The script logs its progress and reports a summary of successful and failed operations across the different sport databases.

**Key Dependencies**: `../inserts/insertOnlyOtherFixtures.js`, `../db.js`

---

## `runAllUpdateCompetitionStatusDaily.js`

### Purpose

This script runs on a daily basis to update the status of competitions (e.g., changing from "upcoming" to "active" or "active" to "finished").

### Detailed Workflow

1.  **Import Dependencies**: It imports the `updateCompetitionStatus` function from `../sync/updateCompetitionStatusDaily.js` and the database connections.
2.  **Iterate Through Sports**: The script loops through each supported sport.
3.  **Update Status**: In each loop, it calls `updateCompetitionStatus(sport)`. This function implements the logic to check the dates and status of competitions and update them as necessary.
4.  **Logging**: It provides logs for each sport being processed and a final summary of the execution.

**Key Dependencies**: `../sync/updateCompetitionStatusDaily.js`, `../db.js`