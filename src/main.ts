import {Notice, Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, MyPluginSettings} from "./settings";

export default class LinkAsSearch extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerDomEvent(document, 'mousedown', (evt: MouseEvent) => {
			const target = evt.target as HTMLElement;

			if (target.classList.contains('cm-link-alias-pipe')) {
				return;
			}

			// Capture the link element in Reading, Live Preview, and Source modes
			const linkEl = target.closest('.internal-link, .cm-underline, .cm-hmd-internal-link') as HTMLElement;

			if (!linkEl) return;

			// 1. Prevent the default editor/browser behavior
			evt.preventDefault();
			evt.stopPropagation();

			// 2. Get clicked text and establish base variables
			const clickedText = linkEl.innerText.trim();
			let destination = clickedText;
			let sourcePath = "";

			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile) {
				sourcePath = activeFile.path;
			}

			// 3. Resolve the true destination (handling aliases)
			const dataHref = linkEl.getAttribute('data-href');

			if (dataHref) {
				// Reading Mode: use the reliable data attribute
				destination = dataHref;
			} else if (activeFile) {
				// Source/Live Preview Mode: query Obsidian's metadata cache
				const cache = this.app.metadataCache.getFileCache(activeFile);

				if (cache && cache.links) {
					// Find the link object matching the clicked alias or raw link
					const matchedLink = cache.links.find(l => 
						l.displayText === clickedText || l.link === clickedText
					);

					if (matchedLink) {
						destination = matchedLink.link;
					}
				}
			}

			if (!destination) return; // Failsafe

			// 4. Trigger Global Search (Wrapped in quotes for exact matching)
			const searchPlugin = (this.app as any).internalPlugins.getPluginById('global-search');
			if (searchPlugin && searchPlugin.enabled) {
				const exactQuery = `"${destination}"`;
				searchPlugin.instance.openGlobalSearch(exactQuery);
				new Notice(`Searching vault for: ${exactQuery}`);
			}

			// 5. Manually open the link
			// The third argument (evt.metaKey) handles opening in a new tab if Cmd/Ctrl is held
			this.app.workspace.openLinkText(destination, sourcePath, evt.metaKey);

		}, true);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MyPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}