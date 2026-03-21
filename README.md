# Link by ID

Link by ID is a plugin for [Obsidian](https://obsidian.md/) that enables linking notes using unique IDs, rather than full filenames or paths.

When enabled, this plugin alters the behavior of internal links to function as **link-as-search** rather than direct links. Instead of resolving links directly by filename, clicking on an internal link searches the vault and navigates to the first file returned that contains the link target in the filename. If no such file exists, a new note is created as normal.

For example, you could link to the note `202603201552 Niklas Luhmann's Zettelkasten` by using `[[202603201552]]` rather than `[[202603201552 Niklas Luhmann's Zettelkasten]]`.

The same search logic applies to page previews, so hovering over these links will still display the correct note.

This approach decouples the link target from the note title itself, which allows each note to have a permanent location by using a unique ID (UID) that remains stable even if the note title changes. This is consistent with the software agnostic approach to Zettelkasten as discussed at <https://zettelkasten.de/>.

## Settings

- **Search on click (backlink view)**---When enabled, clicking on an internal link opens Obsidian's Search panel and triggers a vault-wide search using the link target as the query. This provides a way of viewing backlinks.
- **Hide unresolved link styling**---Enables CSS that removes the dimmed appearance of unresolved internal links so that links made using UIDs look identical to standard resolved links. Note that this affects _all_ unresolved links in the vault, not only those made using UIDs.
