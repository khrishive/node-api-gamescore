# PM2 Commands Reference Guide

This document explains each PM2 command used in your Node.js API GameScore project, breaking down every parameter and option.

## Command 1: Main Application Server

```bash
pm2 start npm --name new-node-api-gamescore -- start --prefix /mnt/data/home/master/new-node-api-gamescore/
```

### Breakdown:
- **`pm2 start`**: PM2 command to start a new process
- **`npm`**: The command to execute (npm in this case)
- **`--name new-node-api-gamescore`**: Sets a custom name for the PM2 process
- **`--`**: Separator that passes everything after it as arguments to the npm command
- **`start`**: The npm script to run (equivalent to `npm start`)
- **`--prefix /mnt/data/home/master/new-node-api-gamescore/`**: Sets the working directory for npm commands

**Purpose**: Starts the main Node.js API server using npm start from the specified directory.

---

## Command 2: Twice Daily Fixture Updates

```bash
pm2 start src/scripts/runAllOtherFixtures.js --cwd /mnt/data/home/master/new-node-api-gamescore/ --name "twice-daily-fixture-update" --no-autorestart --cron "0 0,12 * * *"
```

### Breakdown:
- **`pm2 start`**: PM2 command to start a new process
- **`src/scripts/runAllOtherFixtures.js`**: The JavaScript file to execute
- **`--cwd /mnt/data/home/master/new-node-api-gamescore/`**: Sets the current working directory
- **`--name "twice-daily-fixture-update"`**: Custom name for the process
- **`--no-autorestart`**: Prevents PM2 from automatically restarting the process when it exits
- **`--cron "0 0,12 * * *"`**: Cron expression for scheduling
  - `0`: Minutes (0 = at the top of the hour)
  - `0,12`: Hours (runs at midnight and noon)
  - `*`: Day of month (every day)
  - `*`: Month (every month)
  - `*`: Day of week (every day of the week)

**Purpose**: Runs fixture updates twice daily at midnight (00:00) and noon (12:00).

---

## Command 3: 2-Hourly Map Players Update

```bash
pm2 start src/scripts/runAllInsertMapTeamPlayers.js \
  --cwd /mnt/data/home/master/new-node-api-gamescore/ \
  --name "2-hourly-map-players-update" \
  --no-autorestart \
  --cron "0 */2 * * *"
```

### Breakdown:
- **`src/scripts/runAllInsertMapTeamPlayers.js`**: Script for mapping team players
- **`--cwd`**: Working directory specification
- **`--name "2-hourly-map-players-update"`**: Process identifier
- **`--no-autorestart`**: Disables automatic restart on exit
- **`--cron "0 */2 * * *"`**: Cron expression
  - `0`: At minute 0 (top of the hour)
  - `*/2`: Every 2 hours
  - `*`: Every day of month
  - `*`: Every month
  - `*`: Every day of week

**Purpose**: Updates player mappings every 2 hours at the top of the hour (00:00, 02:00, 04:00, etc.).

---

## Command 4: 3-Hourly Active Updates

```bash
pm2 start src/scripts/runAllActiveUpdates.js \
  --cwd /mnt/data/home/master/new-node-api-gamescore/ \
  --name "3-hourly-active-updates" \
  --no-autorestart \
  --cron "0 */3 * * *"
```

### Breakdown:
- **`src/scripts/runAllActiveUpdates.js`**: Script for active data updates
- **`--cron "0 */3 * * *"`**: Every 3 hours at minute 0
  - Runs at: 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00

**Purpose**: Performs active data updates every 3 hours.

---

## Command 5: 4-Hourly Status Update

```bash
pm2 start src/scripts/runAllUpdateCompetitionStatusDaily.js \
  --cwd /mnt/data/home/master/new-node-api-gamescore/ \
  --name "4-hourly-status-update" \
  --no-autorestart \
  --cron "0 */4 * * *"
```

### Breakdown:
- **`src/scripts/runAllUpdateCompetitionStatusDaily.js`**: Competition status update script
- **`--cron "0 */4 * * *"`**: Every 4 hours at minute 0
  - Runs at: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00

**Purpose**: Updates competition status every 4 hours.

---

## Command 6: Hourly Match Events Update

```bash
pm2 start src/scripts/runAllCsMatchEventsCopy.js --cwd /mnt/data/home/master/new-node-api-gamescore/ --name "hourly-match-events-update" --no-autorestart --cron "0 * * * *"
```

### Breakdown:
- **`src/scripts/runAllCsMatchEventsCopy.js`**: CS (Counter-Strike) match events copying script
- **`--cron "0 * * * *"`**: Every hour at minute 0
  - `0`: At minute 0
  - `*`: Every hour
  - `*`: Every day of month
  - `*`: Every month  
  - `*`: Every day of week

**Purpose**: Copies Counter-Strike match events data every hour on the hour.

---

## Common PM2 Options Explained

### `--cwd` (Current Working Directory)
Sets the working directory where the script will run. This ensures file paths are resolved correctly.

### `--name`
Assigns a human-readable name to the PM2 process, making it easier to identify and manage.

### `--no-autorestart`
Prevents PM2 from automatically restarting the process when it completes or crashes. Useful for scheduled tasks that should run once and then stop.

### `--cron`
Enables cron-based scheduling using standard cron syntax:
```
* * * * *
| | | | |
| | | | └─ Day of week (0-6, Sunday = 0)
| | | └─── Month (1-12)
| | └───── Day of month (1-31)
| └─────── Hour (0-23)
└───────── Minute (0-59)
```

## Schedule Summary

| Process | Frequency | Times |
|---------|-----------|-------|
| twice-daily-fixture-update | Every 12 hours | 00:00, 12:00 |
| 2-hourly-map-players-update | Every 2 hours | 00:00, 02:00, 04:00, 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00 |
| 3-hourly-active-updates | Every 3 hours | 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 |
| 4-hourly-status-update | Every 4 hours | 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 |
| hourly-match-events-update | Every hour | Every hour at :00 minutes |

## Useful PM2 Management Commands

Here’s a more detailed guide to common PM2 commands for managing your processes. You can target a process using its `name` (e.g., `new-node-api-gamescore`) or its `id`.

---

### Listing Processes

To see all processes currently managed by PM2, use `list`.

```bash
# List all processes with their status and resource usage
pm2 list
```
*Alias: `pm2 ls`*

The output table includes:
- **`id`**: The unique process ID.
- **`name`**: The name you assigned with `--name`.
- **`mode`**: `fork` or `cluster`.
- **`status`**: `online`, `stopped`, `errored`, etc.
- **`cpu`**: CPU percentage being used.
- **`memory`**: Memory usage.

---

### Monitoring Processes

For a real-time dashboard inside your terminal, use `monit`.

```bash
# Monitor CPU and memory of all processes in real-time
pm2 monit
```
This is great for a quick health check.

---

### Viewing Logs

To view the logs of a specific process or all processes, use `logs`.

```bash
# View logs for a specific process
pm2 logs <name>

# Example:
pm2 logs new-node-api-gamescore

# View logs for all processes combined
pm2 logs

# Show the last 200 lines
pm2 logs --lines 200

# Stream logs in real-time (similar to tail -f)
pm2 logs --raw
```

---

### Stopping a Process

To stop a running process without removing it from the PM2 list, use `stop`. The process can be started again later.

```bash
# Stop a specific process by name
pm2 stop <name>

# Example:
pm2 stop new-node-api-gamescore

# Stop a process by ID
pm2 stop <id>

# Stop all processes
pm2 stop all
```

---

### Starting a Stopped Process

If a process is stopped, you can start it again without re-creating it.

```bash
# Start a previously stopped process by name
pm2 start <name>

# Example:
pm2 start new-node-api-gamescore
```

---

### Restarting a Process

To restart a process, use `restart`. This is often a zero-downtime operation for clustered applications.

```bash
# Restart a specific process by name
pm2 restart <name>

# Example:
pm2 restart "twice-daily-fixture-update"

# Restart all processes
pm2 restart all
```
**Note**: For cron-based jobs (`--no-autorestart`), `restart` will run them immediately, and they will still run on their next scheduled time.

---

### Reloading a Process (Zero-downtime)

For applications running in `cluster` mode, `reload` provides a true zero-downtime restart by restarting each worker one by one.

```bash
# Reload a specific process
pm2 reload <name>

# Reload all processes
pm2 reload all
```
This is generally preferred over `restart` for stateless web servers.

---

### Deleting a Process

To stop a process AND remove it from the PM2 list, use `delete`. Once deleted, you must use the original `pm2 start` command to run it again.

```bash
# Delete a specific process by name
pm2 delete <name>

# Example:
pm2 delete new-node-api-gamescore

# Delete all processes
pm2 delete all
```

---

### Saving Your Process List

To ensure your processes restart automatically after a server reboot, you need to do two things: save the process list and create a startup script.

```bash
# Save the list of currently running processes
pm2 save
```
This command saves the process list to a file in your PM2 home directory (usually `~/.pm2/dump.pm2`).

### Automating Startup on Server Reboot

PM2 can generate a script that will automatically start PM2 and your saved processes when the server boots up.

```bash
# Generate a startup script for your OS
pm2 startup
```
This command will output another command that you need to run with administrator/root privileges. Once you run it, your saved process list will be restored on every server reboot.
