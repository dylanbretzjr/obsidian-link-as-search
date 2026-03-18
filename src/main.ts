import {Notice, Plugin, TFile} from 'obsidian';
import {DEFAULT_SETTINGS, MyPluginSettings, LinkAsSearchSettingTab} from "./settings";

export default class LinkAsSearch extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new LinkAsSearchSettingTab(this.app, this));
		this.toggleUnresolvedClass();

		this.registerDomEvent(document, 'mousedown', async (evt: MouseEvent) => {
			const target = evt.target as HTMLElement;

			// Ignore clicks on Markdown syntax characters (like | [[ ]])
			if (target.classList.contains('cm-link-alias-pipe') || target.classList.contains('cm-formatting-link')) {
				return;
			}

			// Capture the link element across all editor modes
			const linkEl = target.closest('.internal-link, .cm-underline, .cm-hmd-internal-link') as HTMLElement;
			if (!linkEl) return;

			evt.preventDefault();
			evt.stopPropagation();

			const clickedText = linkEl.innerText.trim();
			let destination = clickedText;
			let sourcePath = "";

			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile) {
				sourcePath = activeFile.path;
			}

			// Resolve the true destination (handling aliases and metadata)
			const dataHref = linkEl.getAttribute('data-href');
			if (dataHref) {
				destination = dataHref;
			} else if (activeFile) {
				const cache = this.app.metadataCache.getFileCache(activeFile);
				if (cache && cache.links) {
					const matchedLink = cache.links.find(l => 
						l.displayText === clickedText || l.link === clickedText
					);
					if (matchedLink) {
						destination = matchedLink.link;
					}
				}
			}

			if (!destination) return; 

			// --- FILE RESOLUTION ---
			
			// Try to find an exact match first
			let targetFile = this.app.metadataCache.getFirstLinkpathDest(destination, sourcePath);

			// If no exact match exists, scan for a file that contains the ID/Text in its name
			if (!targetFile) {
				const files = this.app.vault.getMarkdownFiles();
				targetFile = files.find(f => f.basename.startsWith(destination)) 
						  || files.find(f => f.basename.includes(destination)) 
						  || null;
			}

			// --- GLOBAL SEARCH ---
			
			const searchPlugin = (this.app as any).internalPlugins.getPluginById('global-search');
			if (searchPlugin && searchPlugin.enabled) {
				const exactQuery = `"${destination}"`;
				searchPlugin.instance.openGlobalSearch(exactQuery);
				new Notice(`Searching vault for: ${exactQuery}`);
			}

			// --- OPENING THE FILE ---
			
			if (targetFile) {
				const leafToUse = evt.metaKey ? 'tab' : false;
				const leaf = this.app.workspace.getLeaf(leafToUse);
				await leaf.openFile(targetFile);
			} else {
				// Fallback for non-existent files
				this.app.workspace.openLinkText(destination, sourcePath, evt.metaKey);
			}

		}, true);
	}

	onunload() {
		document.body.classList.remove('link-as-search-hide-unresolved');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MyPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// Toggles the CSS class used to remove the "dimmed" look of unresolved links
	toggleUnresolvedClass() {
		if (this.settings.hideUnresolvedIndicator) {
			document.body.classList.add('link-as-search-hide-unresolved');
		} else {
			document.body.classList.remove('link-as-search-hide-unresolved');
		}
	}
}
