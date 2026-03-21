import { Notice, Plugin, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, LinkAsSearchSettings, LinkAsSearchSettingTab } from "./settings";

// Explicitly define internal plugins
declare module 'obsidian' {
	interface App {
		internalPlugins: {
			getPluginById(id: 'global-search'): {
				enabled: boolean;
				instance: {
					openGlobalSearch(query: string): void;
				};
			} | undefined;
		};
	}
}

export default class LinkAsSearch extends Plugin {
	settings: LinkAsSearchSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new LinkAsSearchSettingTab(this.app, this));
		this.toggleUnresolvedClass();

		// --- HOVER PREVIEW LOGIC ---
		this.registerDomEvent(document, 'mouseover', (evt: MouseEvent) => {
			const target = evt.target as HTMLElement;
			const linkEl = target.closest('.internal-link, .cm-underline, .cm-hmd-internal-link') as HTMLElement;
			if (!linkEl) return;

			const activeFile = this.app.workspace.getActiveFile();
			const sourcePath = activeFile ? activeFile.path : "";

			const destination = this.resolveLinkDestination(linkEl, activeFile);
			if (!destination) return;

			const targetFile = this.getFileFromID(destination, sourcePath);

			if (targetFile) {
				// Stop Obsidian's native hover preview from attempting to load an unresolved ID
				evt.stopImmediatePropagation();

				// Manually trigger the hover preview using the fully resolved file path
				this.app.workspace.trigger('hover-link', {
					event: evt,
					source: 'preview', 
					hoverParent: linkEl,
					targetEl: linkEl,
					linktext: targetFile.path, 
					sourcePath: sourcePath
				});
			}
		}, true);

		// --- CLICK AND SEARCH LOGIC ---
		this.registerDomEvent(document, 'mousedown', async (evt: MouseEvent) => {
			const target = evt.target as HTMLElement;

			// Ignore clicks on Markdown syntax characters (e.g., '|' or '[[' and ']]')
			if (target.classList.contains('cm-link-alias-pipe') || target.classList.contains('cm-formatting-link')) {
				return;
			}

			// Capture the link element across all editor modes
			const linkEl = target.closest('.internal-link, .cm-underline, .cm-hmd-internal-link') as HTMLElement;
			if (!linkEl) return;

			evt.preventDefault();
			evt.stopPropagation();

			const activeFile = this.app.workspace.getActiveFile();
			const sourcePath = activeFile ? activeFile.path : "";

			const destination = this.resolveLinkDestination(linkEl, activeFile);
			if (!destination) return; 
			
			const targetFile = this.getFileFromID(destination, sourcePath);

			// --- GLOBAL SEARCH ---
			if (this.settings.searchOnClick) {
				const searchPlugin = this.app.internalPlugins.getPluginById('global-search');
				if (searchPlugin && searchPlugin.enabled) {
					const exactQuery = `"${destination}"`;
					searchPlugin.instance.openGlobalSearch(exactQuery);
					new Notice(`Searching vault for: ${exactQuery}`);
				}
			}

			// --- OPENING THE FILE ---
			if (targetFile) {
				const leafToUse = evt.metaKey ? 'tab' : false;
				const leaf = this.app.workspace.getLeaf(leafToUse);
				await leaf.openFile(targetFile);
			} else {
				// Let Obsidian handle non-existent files
				await this.app.workspace.openLinkText(destination, sourcePath, evt.metaKey);
			}
		}, true);
	}

	onunload() {
		document.body.classList.remove('link-as-search-hide-unresolved');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<LinkAsSearchSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// Toggles the CSS class used to remove the "dimmed" look of unresolved links
	toggleUnresolvedClass() {
		if (this.settings.hideUnresolvedLinkStyling) {
			document.body.classList.add('link-as-search-hide-unresolved');
		} else {
			document.body.classList.remove('link-as-search-hide-unresolved');
		}
	}

	// ============================================================
	// HELPER METHODS
	// ============================================================

	/**
	 * Extracts the intended destination from a link element, accounting for aliases and metadata.
	 */
	private resolveLinkDestination(linkEl: HTMLElement, activeFile: TFile | null): string | null {
		const linkText = linkEl.innerText.trim();
		const dataHref = linkEl.getAttribute('data-href');

		// 1. If the HTML element has a clean data-href attribute, use that
		if (dataHref) return dataHref;

		// 2. Check the file's metadata cache to see if the text is an alias
		if (activeFile) {
			const cache = this.app.metadataCache.getFileCache(activeFile);
			if (cache && cache.links) {
				const matchedLink = cache.links.find(l => 
					l.displayText === linkText || l.link === linkText
				);
				if (matchedLink) return matchedLink.link;
			}
		}

		// 3. Fallback to using raw link text
		return linkText || null;
	}

	/**
	 * Takes a destination string (ID or filename) and attempts to find the corresponding TFile in the vault.
	 */
	private getFileFromID(destination: string, sourcePath: string): TFile | null {
		// 1. Let Obsidian try to find an exact filename match first
		let file = this.app.metadataCache.getFirstLinkpathDest(destination, sourcePath);

		// 2. If no exact match exists, scan the vault for a file that begins with or contains the ID
		if (!file) {
			const files = this.app.vault.getMarkdownFiles();
			file = files.find(f => f.basename.startsWith(destination)) 
				  || files.find(f => f.basename.includes(destination)) 
				  || null;
		}

		return file;
	}
}
