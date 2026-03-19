import { App, PluginSettingTab, Setting } from 'obsidian';
import LinkAsSearch from './main';

export interface LinkAsSearchSettings {
	hideUnresolvedIndicator: boolean;
	useIdSuggester: boolean;
}

export const DEFAULT_SETTINGS: LinkAsSearchSettings = {
	hideUnresolvedIndicator: true,
	useIdSuggester: false
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
			.setName('Hide unresolved link indicator')
			.setDesc('Removes the dimmed effect from all unresolved links.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.hideUnresolvedIndicator)
				.onChange(async (value) => {
					this.plugin.settings.hideUnresolvedIndicator = value;
					await this.plugin.saveSettings();
					this.plugin.toggleUnresolvedClass(); 
				}));

		new Setting(containerEl)
			.setName('Use custom ID link suggester')
			.setDesc('Type "@@" to trigger a custom search that inserts only the ID of a note (e.g., inserts "20260318" instead of the full filename).')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useIdSuggester)
				.onChange(async (value) => {
					this.plugin.settings.useIdSuggester = value;
					await this.plugin.saveSettings();
				}));
	}
}
