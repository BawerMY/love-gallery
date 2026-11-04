# The Admin page shares the Gallery password

The Admin page at `/admin` has no login of its own: anyone who has entered the Gallery password can open it. The gallery has exactly two people, and we trust the Partner not to edit, so a second credential would only add friction. This means anyone who learns the Gallery password can also edit and delete Memories. If that ever matters, put a separate admin password in front of `/admin`.
