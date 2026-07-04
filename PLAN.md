# Investigation Plan: UI Not Updating

## Problem
The user reports that the UI is not updating when they make changes to the code, despite having a development server running with live reload.

## Possible Causes
1. The development server is not detecting file changes.
2. The live reload script is not being injected or is not working.
3. Browser caching is serving old files.
4. The changes are being made to the wrong files (e.g., source vs built files).
5. The file watcher is not watching the correct file extensions or directories.

## Steps to Investigate

### 1. Check Dev Server Logs
- Look at the output of the `npm run dev` command to see if it detects file changes and triggers rebuilds.
- Specifically, check the output from the `nodemon` process (for Python files) and the Vite dev server (for frontend files).

### 2. Verify File Watching Configuration
- In `dev_server.py`, check the `WATCH_EXTENSIONS` and `watch_roots` to ensure they include the file types and directories we are editing.
- In the Vite configuration (`port_zoning_map/vite.config.js`), ensure that the server is set to watch and serve the correct files.

### 3. Check Live Reload Injection
- Verify that the live reload script is being injected into the served HTML. This is done in the `LiveReloadHandler.copyfile` method in `dev_server.py`.
- Check that the script is being added to the HTML and that it is attempting to connect to the `/version` endpoint.

### 4. Test Manual Reload
- Manually refresh the browser to see if the changes appear. If they do, then the issue is with live reload, not the build process.

### 5. Check for Build Output
- After making a change, check if the build output directory (`stitch_ai_yard_pathfinding_system/map_app`) is being updated with the new files.
- Verify that the timestamps on the built files are updating.

### 6. Inspect Network Requests
- Use the browser's developer tools to check if the `/version` endpoint is being polled and if it returns a new value after changes.

### 7. Check for Errors
- Look for any errors in the browser console or in the dev server logs that might indicate why live reload is failing.

## Expected Outcome
Identify the root cause of the UI not updating and implement a fix so that changes to the source code are reflected in the browser without manual refresh.

## Next Steps
After identifying the issue, we will:
1. Fix the configuration or code causing the problem.
2. Test that the UI updates correctly on file changes.
3. Update the plan to reflect the resolution.