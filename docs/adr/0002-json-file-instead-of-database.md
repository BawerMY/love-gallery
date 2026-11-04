# A JSON file instead of a database

All gallery data lives in a single `database.json` on a mounted volume, next to the `/media` folder. There's no SQLite or other database. One Curator writes, two people read, and the data is a few hundred Memories at most, so a single file is easy to back up, inspect and edit by hand. Writes go to a temporary file which is then renamed over `database.json`, so a crash can't leave the file half-written. Revisit this only if more than one person needs to edit at once.
