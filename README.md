# API Endpoints Documentation

This document provides a summary of the available API endpoints, grouped by their base routes.

## Endpoints `/api`

- `GET /api/team/:teamId/:competitionId/map-breakdown`: Get map breakdown for a team in a competition.
- `GET /api/team/:teamId/map-breakdown`: Get map breakdown for a team.

### Endpoints `/api/competitions`

- `GET /api/competitions`: Get a list of competitions.
- `GET /api/competitions/:id`: Get details of a competition by ID.
- `GET /api/competitions/:id/participants`: Get participants of a competition.
- `GET /api/competitions/:id/stages`: Get stages of a competition.
- `GET /api/competitions/stage/:id/participants`: Get participants of a stage.
- `GET /api/competitions/stage/:id/stagefixtures`: Get fixtures of a stage.

### Endpoints `/api/fixtures`

- `GET /api/fixtures`: Get a list of fixtures.
- `GET /api/fixtures/:id`: Get details of a fixture by ID.
- `GET /api/fixtures/:id/participants`: Get participants of a fixture.
- `GET /api/fixtures/:id/stages`: Get stages of a fixture.
- `GET /api/fixtures/stage/:id/participants`: Get participants of a stage.
- `GET /api/fixtures/stage/:id/stagefixtures`: Get fixtures of a stage.
- `GET /api/fixtures/fixtures`: Get a list of fixtures.
- `GET /api/fixtures/fixtures/:id`: Get a list of fixtures.
- `GET /api/fixtures/fixtures/:competitionId/fixtures`: Get fixtures by competition.

### Endpoints `/api/teams`

- `GET /api/teams`: Get a list of teams.
- `GET /api/teams/:id`: Get team details by ID.

### Endpoints `/api/players`

- `GET /api/players/:id`: Get player details by ID.
- `GET /api/players/stats/player/:id`: Get player stats by ID.

## Endpoints `/db`

- `GET /db/competitions`: Get records from the 'competitions' table with optional filters.
- `GET /db/all_competitions`: Get all records from the 'competitions' table.
- `GET /db/fixtures`: Get records from the 'fixtures' table with optional filters.
- `GET /db/all_fixtures`: Get all records from the 'fixtures' table.
- `GET /db/team_fixture_stats`: Get records from the 'team_fixture_stats' table.
- `GET /db/fixture_links`: Get records from the 'fixture_links' table.
- `GET /db/participants`: Get records from the 'participants' table with optional filters.
- `GET /db/players`: Get records from the 'player' table with optional filters.
- `GET /db/stats_player`: Get records from the 'stats_player' table.
- `GET /db/team_info`: Get records from the 'team_info' table.

### Endpoints `/db/populate`

- `POST /db/populate/general`: Populate data in the database.
- `POST /db/populate/create-tables`: Create tables in the database.
- `POST /db/populate/insert-competitions`: Insert competitions into the database.
- `POST /db/populate/insert-fixtures`: Insert fixtures into the database.
- `POST /db/populate/insert-teams`: Insert teams into the database.
- `POST /db/populate/insert-teams-players`: Insert teams and players into the database.
- `POST /db/populate/update-participants`: Update the number of participants in competitions.
- `POST /db/populate/update-descriptions`: Update competition descriptions.

## Endpoints `/fixtures`

- `GET /fixtures/:fixtureId/stats`: Get stats for a fixture, with an optional `map_id` query parameter.
- `GET /fixtures/:fixtureId/assists`: Get assists for a fixture.
- `GET /fixtures/:fixtureId/equipment`: Get equipment state for a fixture.
- `GET /fixtures/:fixtureId/events-raw`: Get raw events for a fixture.
- `GET /fixtures/:fixtureId/maps`: Get maps for a fixture.

## Endpoints `/fixtures-by-comp`

- `GET /fixtures-by-comp/:competitionId`: Get fixtures by competition.

## Endpoints `/historic-events`

- `GET /historic-events/events`: Get match events with filters.
- `GET /historic-events/mapscores/:fixtureId`: Get map scores for a fixture.

## Endpoints `/map-stats`

- `GET /map-stats/map-stats/:fixtureId`: Get map stats for a fixture.
- `GET /map-stats/map-round-scores/:fixtureId`: Get map round scores for a fixture.