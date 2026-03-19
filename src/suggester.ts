import { App, Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo, TFile } from 'obsidian';
import LinkAsSearch from './main';

export class IdLinkSuggester extends EditorSuggest<TFile> {
	plugin: LinkAsSearch;

	constructor(app: App, plugin: LinkAsSearch) {
		super(app);
		this.plugin = plugin;
	}

	// 1. Determines WHEN the suggester should pop up
	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo | null {
		if (!this.plugin.settings.useIdSuggester) return null;

		const line = editor.getLine(cursor.line);
		const textBeforeCursor = line.substring(0, cursor.ch);

		// Trigger when typing @@ instead of [[ to avoid fighting Obsidian's native popup
		const match = textBeforeCursor.match(/@@(.*)$/);
		if (match) {
			return {
				// We start the capture at the first '@' so we can overwrite it later
				start: { line: cursor.line, ch: match.index! }, 
				end: cursor,
				query: match[1] ?? "" // The text typed after @@
			};
		}
		return null;
	}

	// 2. Finds the matching files based on what the user typed
	getSuggestions(context: EditorSuggestContext): TFile[] {
		const query = context.query.toLowerCase();
		const files = this.app.vault.getMarkdownFiles();

		// Return up to 10 files that include the search query in their name
		return files.filter(f => f.basename.toLowerCase().includes(query)).slice(0, 10);
	}

	// 3. Renders the list of options in the pop-up menu
	renderSuggestion(file: TFile, el: HTMLElement) {
		el.setText(file.basename);
	}

	// 4. Handles the actual insertion when the user hits Enter
	selectSuggestion(file: TFile, evt: MouseEvent | KeyboardEvent) {
		if (!this.context) return;

		// Extract the ID: Assumes the ID is a sequence of numbers at the start of the filename
		const match = file.basename.match(/^(\d+)/);
		
		// Fallback to the full name if no ID is found, otherwise use the ID
		const textToInsert = (match && match[1]) ? match[1] : file.basename;

		const editor = this.context.editor;
		
		// Replace the @@ and the query with a properly formatted Obsidian link
		editor.replaceRange(
			`[[${textToInsert}]]`,
			this.context.start,
			this.context.end
		);
	}
}
