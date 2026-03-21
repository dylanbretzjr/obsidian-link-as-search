import { App, PluginSettingTab, Setting } from 'obsidian';
import LinkAsSearch from './main';

export interface LinkAsSearchSettings {
	hideUnresolvedLinkStyling: boolean;
	searchOnClick: boolean;
}

export const DEFAULT_SETTINGS: LinkAsSearchSettings = {
	hideUnresolvedLinkStyling: false,
	searchOnClick: false
}

export class LinkAsSearchSettingTab extends PluginSettingTab {
	plugin: LinkAsSearch;

	constructor(app: App, plugin: LinkAsSearch) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Search on click (backlink view)')
			.setDesc('When enabled, clicking on an internal link opens Obsidian\'s Search panel and triggers a vault-wide search using the link target.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.searchOnClick)
				.onChange(async (value) => {
					this.plugin.settings.searchOnClick = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Hide unresolved link indicator')
			.setDesc('Removes the dimmed effect from all unresolved links.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.hideUnresolvedLinkStyling)
				.onChange(async (value) => {
					this.plugin.settings.hideUnresolvedLinkStyling = value;
					await this.plugin.saveSettings();
					this.plugin.toggleUnresolvedClass(); 
				}));
	}
}
