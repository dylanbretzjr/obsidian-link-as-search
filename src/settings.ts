import { App, PluginSettingTab, Setting } from 'obsidian';
import LinkAsSearch from './main';

export interface MyPluginSettings {
	hideUnresolvedIndicator: boolean;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	hideUnresolvedIndicator: true
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
	}
}
