<template>
	<div class="layout-navbars-breadcrumb-index">
		<Logo v-if="setIsShowLogo" />
		<Breadcrumb />
		<Horizontal :menuList="menuList" v-if="isLayoutTransverse" />
		<User />
	</div>
</template>

<script setup lang="ts">
import { computed, reactive, toRefs, onMounted, onUnmounted, getCurrentInstance, defineComponent, watch } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useRoutesList } from '/@/stores/routesList';
import { useThemeConfig } from '/@/stores/themeConfig';
import Breadcrumb from '/@/layout/navBars/breadcrumb/breadcrumb.vue';
import User from '/@/layout/navBars/breadcrumb/user.vue';
import Logo from '/@/layout/logo/index.vue';
import Horizontal from '/@/layout/navMenu/horizontal.vue';

// 定义接口来定义对象的类型
interface IndexState {
	menuList: object[];
}
defineOptions({ name: 'layoutBreadcrumbIndex' });
const { proxy } = <any>getCurrentInstance();
const stores = useRoutesList();
const storesThemeConfig = useThemeConfig();
const { themeConfig } = storeToRefs(storesThemeConfig);
const { routesList } = storeToRefs(stores);
const route = useRoute();
const state = reactive<IndexState>({
	menuList: [],
});
const { menuList } = toRefs(state);
// 设置 logo 显示/隐藏
const setIsShowLogo = computed(() => {
	let { isShowLogo, layout } = themeConfig.value;
	return (isShowLogo && layout === 'classic') || (isShowLogo && layout === 'transverse');
});
// 设置是否显示横向导航菜单
const isLayoutTransverse = computed(() => {
	let { layout, isClassicSplitMenu } = themeConfig.value;
	return layout === 'transverse' || (isClassicSplitMenu && layout === 'classic');
});
// 设置/过滤路由（非静态路由/是否显示在菜单中）
const setFilterRoutes = () => {
	let { layout, isClassicSplitMenu } = themeConfig.value;
	if (layout === 'classic' && isClassicSplitMenu) {
		state.menuList = delClassicChildren(filterRoutesFun(routesList.value));
		const resData = setSendClassicChildren(route.path);
		proxy.mittBus.emit('setSendClassicChildren', resData);
	} else {
		state.menuList = filterRoutesFun(routesList.value);
	}
};
// 设置了分割菜单时，删除底下 children
const delClassicChildren = (arr: Array<object>) => {
	arr.map((v: any) => {
		if (v.children) delete v.children;
	});
	return arr;
};
// 路由过滤递归函数
const filterRoutesFun = (arr: Array<string>) => {
	return arr
		.filter((item: any) => !item.meta.isHide)
		.map((item: any) => {
			item = Object.assign({}, item);
			if (item.children) item.children = filterRoutesFun(item.children);
			return item;
		});
};
// 传送当前子级数据到菜单中
const setSendClassicChildren = (path: string) => {
	let currentData: any = {};
	const filteredRoutes = filterRoutesFun(routesList.value);

	// 使用递归查找匹配的路由项
	const findRouteByPath = (routes: any[], currentPath: string): any => {
		for (const route of routes) {
			// 直接匹配路径
			if (route.path === currentPath) {
				return route;
			}
			// 如果有子路由，递归查找
			if (route.children && route.children.length > 0) {
				const found = findRouteByPath(route.children, currentPath);
				if (found) {
					return found;
				}
			}
		}
		return null;
	};

	// 查找当前路径匹配的路由
	const matchedRoute = findRouteByPath(filteredRoutes, path);

	if (matchedRoute) {
		// 查找顶级菜单项（即经典布局下的主菜单）
		const findTopLevelRoute = (routes: any[], targetRoute: any): any => {
			// 首先检查是否是顶级菜单
			for (let k = 0; k < routes.length; k++) {
				const route = routes[k];
				// 直接匹配
				if (route === targetRoute || route.path === targetRoute.path) {
					route['k'] = k;
					return route;
				}
				// 检查是否包含目标路由作为子级
				if (route.children) {
					const hasTargetAsChild = route.children.some((child: any) => child === targetRoute || child.path === targetRoute.path);
					if (hasTargetAsChild) {
						route['k'] = k;
						return route;
					}
				}
			}

			// 递归查找包含目标路由的顶级菜单
			for (let k = 0; k < routes.length; k++) {
				const route = routes[k];
				if (route.children && route.children.length > 0) {
					// 检查子路由中是否包含目标路由
					const foundInChildren = findRouteByPath(route.children, targetRoute.path);
					if (foundInChildren) {
						route['k'] = k;
						return route;
					}
				}
			}

			return null;
		};

		// 获取顶级菜单项
		const topLevelRoute = findTopLevelRoute(filteredRoutes, matchedRoute);

		if (topLevelRoute) {
			const index = filteredRoutes.findIndex((route: any) => route.path === topLevelRoute.path);
			topLevelRoute['k'] = index >= 0 ? index : 0;
			currentData['item'] = [{ ...topLevelRoute }];
			currentData['children'] = [{ ...topLevelRoute }];
			if (topLevelRoute.children) currentData['children'] = topLevelRoute.children;
		}
	}

	// 如果还是没有找到匹配项，使用原来的逻辑作为备选方案
	if (Object.keys(currentData).length === 0) {
		const currentPathSplit = path.split('/');
		filteredRoutes.map((v, k) => {
			if (v.path === `/${currentPathSplit[1]}`) {
				v['k'] = k;
				currentData['item'] = [{ ...v }];
				currentData['children'] = [{ ...v }];
				if (v.children) currentData['children'] = v.children;
			}
		});
	}

	return currentData;
};
// 页面加载时
onMounted(() => {
	setFilterRoutes();
	proxy.mittBus.on('getBreadcrumbIndexSetFilterRoutes', () => {
		setFilterRoutes();
	});
});
// 监听布局配置变化
watch(
	() => [themeConfig.value.layout, themeConfig.value.isClassicSplitMenu],
	() => {
		setFilterRoutes();
	}
);
// 页面卸载时
onUnmounted(() => {
	proxy.mittBus.off('getBreadcrumbIndexSetFilterRoutes', () => {});
});
</script>

<style scoped lang="scss">
.layout-navbars-breadcrumb-index {
	height: 50px;
	display: flex;
	align-items: center;
	background: var(--next-bg-topBar);
	border-bottom: 1px solid var(--next-border-color-light);
}
</style>
