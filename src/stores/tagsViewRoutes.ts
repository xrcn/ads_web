import { defineStore } from 'pinia';
import { TagsViewRoutesState } from './interface';
import { Session } from '/@/utils/storage';

/**
 * TagsView 路由列表
 * @methods setTagsViewRoutes 设置 TagsView 路由列表
 * @methods setCurrenFullscreen 设置开启/关闭全屏时的 boolean 状态
 */
export const useTagsViewRoutes = defineStore('tagsViewRoutes', {
	state: (): TagsViewRoutesState => ({
		tagsViewRoutes: [],
		isTagsViewCurrenFull: false,
	}),
	actions: {
		async setTagsViewRoutes(data: Array<any>) {
			this.tagsViewRoutes = data;
			const cached = Session.get('tagsViewList');
			if (Array.isArray(cached)) {
				const currentRoutes = new Map(data.map(route => [route.path, route]));
				for (const tab of cached) {
					const current = currentRoutes.get(tab.path);
					if (!current?.meta || !tab.meta) continue;
					tab.meta = { ...tab.meta, title: current.meta.title, icon: current.meta.icon };
					if (!tab.query?.tagsViewName && !tab.params?.tagsViewName) delete tab.meta.tagsViewName;
				}
				Session.set('tagsViewList', cached);
			}
		},
		setCurrenFullscreen(bool: Boolean) {
			Session.set('isTagsViewCurrenFull', bool);
			this.isTagsViewCurrenFull = bool;
		},
	},
});
