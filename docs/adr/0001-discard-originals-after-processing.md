# Discard originals after processing

Uploaded photos are converted to WebP (longest side 2560px, GPS data removed) and videos are transcoded to H.264 MP4 with `ffmpeg`. After that the originals are deleted and only the processed files are kept in `/media`. We chose this so that every Media item plays in every browser (HEIC and HEVC don't) and the homelab volume stays small. The cost is that full-quality originals can't be recovered from the gallery; the Curator's phone and their backups are where originals live.
