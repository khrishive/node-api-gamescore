# API Endpoints Documentation

This document provides a detailed summary of the available API endpoints. The endpoints are grouped by their primary function, such as acting as a gateway to an external API, providing direct database access, or serving specific data sets.

---

## Gateway Endpoints (`/api`)

This group of endpoints acts as a gateway or proxy to an external GameScore API. They are used to fetch live or recent data about competitions, fixtures, teams, and players.

### General
- `GET /api/team/:teamId/:competitionId/map-breakdown`: Retrieves the map breakdown for a specific team within a given competition.
- `GET /api/team/:teamId/map-breakdown`: Retrieves the general map breakdown for a specific team across all competitions.

### Competitions (`/api/competitions`)
- `GET /api/competitions`: Fetches a list of all available competitions.
- `GET /api/competitions/:id`: Fetches detailed information for a single competition by its unique ID.
- `GET /api/competitions/:id/participants`: Fetches a list of all participants (teams/players) in a specific competition.
- `GET /api/competitions/:id/stages`: Fetches the different stages (e.g., group stage, playoffs) for a competition.
- `GET /api/competitions/stage/:id/participants`: Fetches participants for a specific stage of a competition.
- `GET /api/competitions/stage/:id/stagefixtures`: Fetches all fixtures scheduled for a specific stage.

### Fixtures (`/api/fixtures`)
- `GET /api/fixtures`: Fetches a general list of fixtures.
- `GET /api/fixtures/:id`: Fetches detailed information for a single fixture by its ID.
- `GET /api/fixtures/:id/participants`: Fetches participants for a specific fixture.
- `GET /api/fixtures/:id/stages`: Fetches stages related to a specific fixture.
- `GET /api/fixtures/stage/:id/participants`: Fetches participants of a specific fixture stage.
- `GET /api/fixtures/stage/:id/stagefixtures`: Fetches fixtures within a specific fixture stage.
- `GET /api/fixtures/fixtures`: Fetches a list of fixtures.
- `GET /api/fixtures/fixtures/:id`: Fetches a fixture by ID.
- `GET /api/fixtures/fixtures/:competitionId/fixtures`: Fetches all fixtures for a given competition.

*Note: Some fixture endpoints appear redundant. This may be worth reviewing for consolidation.*

### Teams (`/api/teams`)
- `GET /api/teams`: Fetches a list of all teams.
- `GET /api/teams/:id`: Fetches detailed information for a single team by its ID.

### Players (`/api/players`)
- `GET /api/players/:id`: Fetches detailed information for a single player by ID.
- `GET /api/players/stats/player/:id`: Fetches gameplay statistics for a specific player.

---

## Direct Database Endpoints (`/db`)

These endpoints provide direct access to the underlying database. They are used for querying tables and for administrative tasks like populating or creating database structures. **Use these endpoints with caution, especially the `populate` routes.**

### Database Query Endpoints
- `GET /db/competitions`: Queries the `competitions` table. Supports filtering via query parameters.
- `GET /db/all_competitions`: Retrieves all records from the `competitions` table without any filters.
- `GET /db/fixtures`: Queries the `fixtures` table. Supports filtering via query parameters.
- `GET /db/all_fixtures`: Retrieves all records from the `fixtures` table.
- `GET /db/team_fixture_stats`: Queries the `team_fixture_stats` table for team statistics in fixtures.
- `GET /db/fixture_links`: Queries the `fixture_links` table.
- `GET /db/participants`: Queries the `participants` table. Supports filtering.
- `GET /db/players`: Queries the `player` table. Supports filtering.
- `GET /db/stats_player`: Queries the `stats_player` table for player statistics.
- `GET /db/team_info`: Queries the `team_info` table for team information.

### Database Population Endpoints (`/db/populate`)
These `POST` endpoints are used to perform administrative database operations.
- `POST /db/populate/general`: A general-purpose endpoint to populate data.
- `POST /db/populate/create-tables`: Executes scripts to create the necessary tables in the database.
- `POST /db/populate/insert-competitions`: Inserts a set of competitions into the database.
- `POST /db/populate/insert-fixtures`: Inserts a set of fixtures into the database.
- `POST /db/populate/insert-teams`: Inserts a set of teams into the database.
- `POST /db/populate/insert-teams-players`: Inserts teams and their associated players.
- `POST /db/populate/update-participants`: Recalculates and updates the number of participants in competitions.
- `POST /db/populate/update-descriptions`: Updates competition descriptions, possibly using an automated script.

---

## Fixture Data Endpoints (`/fixtures`)

This group of endpoints provides granular, detailed data for a specific fixture, identified by `:fixtureId`.

- `GET /fixtures/:fixtureId/stats`: Retrieves detailed statistics for a fixture. Can be filtered by map using the `?map_id=` query parameter.
- `GET /fixtures/:fixtureId/assists`: Retrieves all assist events that occurred in a fixture.
- `GET /fixtures/:fixtureId/equipment`: Retrieves the equipment state (e.g., weapons, armor) of players throughout a fixture.
- `GET /fixtures/:fixtureId/events-raw`: Retrieves the raw, unprocessed event stream for a fixture.
- `GET /fixtures/:fixtureId/maps`: Retrieves the maps played in a fixture.

---

## Competition Fixtures Endpoint (`/fixtures-by-comp`)

This endpoint is dedicated to retrieving all fixtures associated with a single competition.

- `GET /fixtures-by-comp/:competitionId`: Fetches all fixtures for a specific competition.

---

## Historic Event Endpoints (`/historic-events`)

This group provides access to historical data related to match events and scores.

- `GET /historic-events/events`: Queries historical match events. Supports filtering.
- `GET /historic-events/mapscores/:fixtureId`: Retrieves the final scores for each map played in a specific fixture.

---

## Map Statistics Endpoints (`/map-stats`)

These endpoints provide statistics aggregated at the map level for a given fixture.

- `GET /map-stats/map-stats/:fixtureId`: Retrieves overall statistics for each map in a fixture.
- `GET /map-stats/map-round-scores/:fixtureId`: Retrieves the score for each individual round within each map of a fixture.
