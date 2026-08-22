;(function () {
  const C = window.WechatConsoleCore
  if (!C) return

  const ACCOUNT_OPTION = '<option value="">请选择微信账号</option>'
  const GUARD_EXEMPT_IDS = new Set([
    'btn-account-refresh',
    'btn-contacts-chatroom-member-list',
    'btn-header-clear-cache',
    'clear-cache-cancel',
    'clear-cache-purge-only',
    'clear-cache-exit',
    'modal-ok',
    'modal-cancel',
  ])

  function syncHeaderUi() {
    const select = C.$('account-select')
    if (select) {
      select.innerHTML = ACCOUNT_OPTION + C.state.accounts
        .map((account) => '<option value="' + account.value + '">' + escapeHtml(account.robotName || account.nickname || account.appId) + (account.isOnline ? '（在线）' : '') + '</option>')
        .join('')
      select.value = C.state.accountId ? String(C.state.accountId) : ''
    }
    const appId = C.$('app-id-display')
    if (appId) appId.textContent = C.state.appId || '未设置'
    const nickname = C.$('header-nick-display')
    if (nickname) nickname.textContent = C.state.loginNickName || '—'
  }

  function escapeHtml(value) {
    const div = document.createElement('div')
    div.textContent = String(value || '')
    return div.innerHTML
  }

  async function refreshAccounts() {
    const refresh = C.$('btn-account-refresh')
    if (refresh) refresh.disabled = true
    try {
      await C.getAccounts()
      syncHeaderUi()
    } catch (error) {
      C.showModal('微信账号加载失败', error?.message || '请重新登录管理后台后重试')
    } finally {
      if (refresh) refresh.disabled = false
    }
  }

  function hasLoginProfileChanged(profile, account) {
    return ['appId', 'wxid', 'nickname', 'avatar'].some((field) => String(profile[field] || '') !== String(account?.[field] || ''))
  }

  async function syncLoginProfile(event) {
    const profile = event.detail || {}
    if (!profile.accountId || !profile.appId || !profile.wxid) return
    const account = C.state.accounts.find((item) => Number(item.value) === Number(profile.accountId))
    if (!hasLoginProfileChanged(profile, account)) return
    try {
      await C.syncAccount(profile)
      C.showToast('微信登录资料已同步', 'success')
    } catch (error) {
      C.showModal('微信登录资料同步失败', error?.message || '请稍后重试')
    }
  }

  function setNavActive(hash) {
    document.querySelectorAll('.side-menu a').forEach((item) => item.classList.toggle('active', item.getAttribute('href') === hash))
    document.querySelectorAll('.panel').forEach((panel) => panel.classList.toggle('active', '#' + panel.id === hash))
  }

  function onHashChange() {
    const allowed = new Set(['#login', '#profile-tags', '#contacts', '#messages', '#sns', '#labels', '#favorites', '#webhook', '#api-logs'])
    const hash = allowed.has(location.hash) ? location.hash : '#login'
    if (location.hash !== hash) location.replace(hash)
    setNavActive(hash)
  }

  function bindRequestGuard() {
    document.addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest('button') : null
      if (!button || GUARD_EXEMPT_IDS.has(button.id) || !button.id.startsWith('btn-')) return
      if (C.state.accountId) return
      event.preventDefault()
      event.stopPropagation()
      C.showModal('提示', '请先选择微信账号')
    }, true)
  }

  async function onHeaderClearCache() {
    const shouldClear = await C.modalConfirm('清理缓存', '清理本地控制台缓存，不会改变后台微信账号资料。')
    if (shouldClear) C.purgeLocalConsoleDataAndReload()
  }

  function init() {
    C.$('account-select')?.addEventListener('change', (event) => {
      const selected = C.state.accounts.find((item) => String(item.value) === event.target.value)
      C.setAccount(selected || null)
    })
    C.$('btn-account-refresh')?.addEventListener('click', () => void refreshAccounts())
    C.$('btn-header-clear-cache')?.addEventListener('click', () => void onHeaderClearCache())
    window.addEventListener('wechat-console:state-changed', syncHeaderUi)
    window.addEventListener('wechat-console:accounts-ready', syncHeaderUi)
    window.addEventListener('wechat-console:login-profile-ready', (event) => void syncLoginProfile(event))
    window.addEventListener('hashchange', onHashChange)
    if (!location.hash) location.hash = '#login'
    onHashChange()
    bindRequestGuard()
    syncHeaderUi()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
