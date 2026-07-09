<template>
	<div class="el-menu-horizontal-warp">
		<el-scrollbar @wheel.native.prevent="onElMenuHorizontalScroll" ref="elMenuHorizontalScrollRef">
			<el-menu router :default-active="defaultActive" :ellipsis="false" background-color="transparent" mode="horizontal">
				<template v-for="val in menuLists">
					<el-sub-menu :index="val.path" v-if="val.children && val.children.length > 0" :key="val.path">
						<template #title>
							<SvgIcon :name="val.meta.icon" />
							<span>{{ $t(val.meta.title) }}</span>
						</template>
						<SubItem :chil="val.children" />
					</el-sub-menu>
					<template v-else>
						<el-menu-item :index="val.path" :key="val.path">
							<template #title v-if="!val.meta.isLink || (val.meta.isLink && val.meta.isIframe)">
								<SvgIcon :name="val.meta.icon" />
								{{ $t(val.meta.title) }}
							</template>
							<template #title v-else>
								<a :href="val.meta.isLink" target="_blank" rel="opener" class="w100">
									<SvgIcon :name="val.meta.icon" />
									{{ $t(val.meta.title) }}
								</a>
							</template>
						</el-menu-item>
					</template>
				</template>
			</el-menu>
		</el-scrollbar>
	</div>
</template>

<script lang="ts">
import { toRefs, reactive, computed, defineComponent, getCurrentInstance, onMounted, nextTick, onBeforeMount } from 'vue';
import { useRoute, onBeforeRouteUpdate } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useRoutesList } from '/@/stores/routesList';
import { useThemeConfig } from '/@/stores/themeConfig';
import SubItem from '/@/layout/navMenu/subItem.vue';

export default defineComponent({
	name: 'navMenuHorizontal',
	components: { SubItem },
	props: {
		menuList: {
			type: Array,
			default: () => [],
		},
	},
	setup(props) {
		const { proxy } = <any>getCurrentInstance();
		const stores = useRoutesList();
		const storesThemeConfig = useThemeConfig();
		const { routesList } = storeToRefs(stores);
		const { themeConfig } = storeToRefs(storesThemeConfig);
		const route = useRoute();
		const state = reactive({
			defaultActive: null,
		});
		// 获取父级菜单数据
		const menuLists = computed(() => {
			return <any>props.menuList;
		});
		// 设置横向滚动条可以鼠标滚轮滚动
		const onElMenuHorizontalScroll = (e: any) => {
			const eventDelta = e.wheelDelta || -e.deltaY * 40;
			proxy.$refs.elMenuHorizontalScrollRef.$refs.wrap$.scrollLeft = proxy.$refs.elMenuHorizontalScrollRef.$refs.wrap$.scrollLeft + eventDelta / 4;
		};
		// 初始化数据，页面刷新时，滚动条滚动到对应位置
		const initElMenuOffsetLeft = () => {
			nextTick(() => {
				let els: any = document.querySelector('.el-menu.el-menu--horizontal li.is-active');
				if (!els || !proxy.$refs.elMenuHorizontalScrollRef || !proxy.$refs.elMenuHorizontalScrollRef.$refs.wrap$) return false;
				proxy.$refs.elMenuHorizontalScrollRef.$refs.wrap$.scrollLeft = els.offsetLeft;
			});
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
		// 设置页面当前路由高亮
		const setCurrentRouterHighlight = (currentRoute: any) => {
			const { path, meta } = currentRoute;
			if (themeConfig.value.layout === 'classic') {
				(<any>state.defaultActive) = `/${path.split('/')[1]}`;
			} else {
				const pathSplit = meta.isDynamic ? meta.isDynamicPath.split('/') : path.split('/');
				if (pathSplit.length >= 4 && meta.isHide) state.defaultActive = pathSplit.splice(0, 3).join('/');
				else state.defaultActive = path;
			}
		};
		// 页面加载前
		onBeforeMount(() => {
			setCurrentRouterHighlight(route);
		});
		// 页面加载时
		onMounted(() => {
			initElMenuOffsetLeft();
		});
		// 路由更新时
		onBeforeRouteUpdate((to) => {
			// 修复：https://gitee.com/lyt-top/vue-next-admin/issues/I3YX6G
			setCurrentRouterHighlight(to);
			// 修复经典布局开启切割菜单时，点击tagsView后左侧导航菜单数据不变的问题
			let { layout, isClassicSplitMenu } = themeConfig.value;
			if (layout === 'classic' && isClassicSplitMenu) {
				proxy.mittBus.emit('setSendClassicChildren', setSendClassicChildren(to.path));
			}
		});
		return {
			menuLists,
			onElMenuHorizontalScroll,
			...toRefs(state),
		};
	},
});
</script>

<style scoped lang="scss">
.el-menu-horizontal-warp {
	flex: 1;
	overflow: hidden;
	margin-right: 30px;
	:deep(.el-scrollbar__bar.is-vertical) {
		display: none;
	}
	:deep(a) {
		width: 100%;
	}
	.el-menu.el-menu--horizontal {
		display: flex;
		height: 100%;
		width: 100%;
		box-sizing: border-box;
	}
}
</style>
