<template>
	<div class="mobile-record-list">
		<section v-if="$slots.filters" class="mobile-record-list__filters">
			<el-button class="mobile-record-list__filter-toggle" @click="filterOpen = !filterOpen">
				<el-icon><ele-Filter /></el-icon>
				<span>筛选条件</span>
				<small v-if="filterSummary">{{ filterSummary }}</small>
				<el-icon><ele-ArrowDown v-if="!filterOpen" /><ele-ArrowUp v-else /></el-icon>
			</el-button>
			<div :class="['mobile-record-list__filter-content', { 'is-open': filterOpen }]">
				<slot name="filters" />
			</div>
		</section>

		<div class="mobile-record-list__desktop">
			<slot name="desktop" />
		</div>

		<div v-loading="loading" class="mobile-record-list__mobile">
			<el-empty v-if="!loading && data.length === 0" description="暂无数据" />
			<article v-for="(row, index) in data" :key="recordKey(row, index)" class="mobile-record-card">
				<slot :row="row" :index="index" />
			</article>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineOptions({ name: 'MobileRecordList' });

const props = withDefaults(defineProps<{
	data: any[];
	loading?: boolean;
	rowKey?: string;
	filterSummary?: string;
}>(), {
	loading: false,
	rowKey: 'id',
	filterSummary: '',
});

const filterOpen = ref(false);
const recordKey = (row: any, index: number) => row?.[props.rowKey] ?? index;
</script>

<style lang="scss">
.mobile-record-list__filter-toggle,
.mobile-record-list__mobile {
	display: none;
}

@media (max-width: 768px) {
	.mobile-record-list__filter-toggle {
		display: grid;
		grid-template-columns: auto auto minmax(0, 1fr) auto;
		align-items: center;
		width: 100%;
		margin-bottom: 12px;

		small {
			overflow: hidden;
			color: var(--el-text-color-secondary);
			text-align: right;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}

	.mobile-record-list__filter-content {
		display: none;

		&.is-open {
			display: block;
		}

		.el-form {
			display: block;
		}

		.el-form-item,
		.el-input,
		.el-select,
		.el-date-editor {
			width: 100% !important;
		}
	}

	.mobile-record-list__desktop {
		display: none;
	}

	.mobile-record-list__mobile {
		display: grid;
		gap: 12px;
	}

	.mobile-record-card {
		min-width: 0;
		padding: 16px;
		border: 1px solid var(--el-border-color-lighter);
		border-radius: 8px;
		background: var(--el-bg-color);
		box-shadow: var(--el-box-shadow-lighter);
	}

	.mobile-record-card__header,
	.mobile-record-card__actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.mobile-record-card__title {
		min-width: 0;
		margin: 0;
		font-size: 16px;
		font-weight: 500;
		overflow-wrap: anywhere;
	}

	.mobile-record-card__subtitle {
		margin: 4px 0 0;
		color: var(--el-text-color-secondary);
	}

	.mobile-record-card__fields {
		display: grid;
		gap: 9px;
		margin: 14px 0;

		> div {
			display: grid;
			grid-template-columns: 104px minmax(0, 1fr);
			gap: 10px;
		}

		dt {
			color: var(--el-text-color-secondary);
		}

		dd {
			min-width: 0;
			margin: 0;
			overflow-wrap: anywhere;
		}
	}

	.mobile-record-card__details {
		margin: 12px 0;
		border-top: 1px solid var(--el-border-color-lighter);
		border-bottom: 1px solid var(--el-border-color-lighter);

		summary {
			min-height: 44px;
			padding: 12px 0;
			color: var(--el-color-primary);
			cursor: pointer;
		}
	}

	.mobile-record-card__actions {
		justify-content: flex-start;
		flex-wrap: wrap;

		.el-dropdown {
			margin-left: auto;
		}
	}
}
</style>
