import { createWebSocketUrl, getToken, getUpFileUrl} from "/@/utils/gfast"
import {noticeStore} from "/@/stores/noticeStore";
import {refreshToken} from "/@/api/system/personal";
import {Session} from "/@/utils/storage";
import {useUserInfo} from "/@/stores/userInfo";
const noticeStoreAct = noticeStore()
const webSocketURL = import.meta.env.VITE_WEBSOCKET_URL

// WebSocket单例相关变量
let socket: WebSocket | null = null;
let isActive: boolean = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isConnecting: boolean = false;
let messageHandlers: Function[] = [];
let heartCheckTimer: ReturnType<typeof setTimeout> | null = null;
let serverTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

export function getSocket(): WebSocket | null {
  return socket;
}

export function getActive(): boolean {
  return isActive;
}

// 清理所有定时器和连接
export function cleanupWebSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (heartCheckTimer) {
    clearTimeout(heartCheckTimer);
    heartCheckTimer = null;
  }
  if (serverTimeoutTimer) {
    clearTimeout(serverTimeoutTimer);
    serverTimeoutTimer = null;
  }
  if (socket) {
    socket.close();
    socket = null;
  }
  isActive = false;
  isConnecting = false;
  messageHandlers = [];
}

export function sendMsg(event: string, data = null, retryCount = 10) {
  if (retryCount <= 0) {
    console.log('socket连接异常，已达最大重试次数，发送失败！');
    return;
  }
  if (!socket || !isActive) {
    console.log('socket连接异常，等待重试..');
    setTimeout(function () {
      sendMsg(event, data, retryCount - 1);
    }, 500);
    return;
  }

  try {
    socket.send(
      JSON.stringify({
        event: event,
        data: data,
      })
    );
  } catch (err) {
    // @ts-ignore
    console.log('ws发送消息失败，等待重试，err：' + err.message);
    setTimeout(function () {
      sendMsg(event, data, retryCount - 1);
    }, 500);
  }
}

export function addOnMessage(func: Function) {
  let exist = false;
  for (let i = 0; i < messageHandlers.length; i++) {
    if (messageHandlers[i].name == func.name) {
      messageHandlers[i] = func;
      exist = true;
    }
  }
  if (!exist) {
    messageHandlers.push(func);
  }
}

export function removeOnMessage(funcName: string) {
  messageHandlers = messageHandlers.filter(handler => handler.name !== funcName);
}

// 心跳检测函数
const heartCheck = {
  // 心跳间隔时间（10秒）
  interval: 10000,
  // 服务器响应超时时间（5秒）
  serverTimeout: 5000,
  reset: function () {
    if (heartCheckTimer) {
      clearTimeout(heartCheckTimer);
      heartCheckTimer = null;
    }
    if (serverTimeoutTimer) {
      clearTimeout(serverTimeoutTimer);
      serverTimeoutTimer = null;
    }
  },
  start: function () {
    this.reset();

    // 使用箭头函数保持正确的this上下文
    heartCheckTimer = setTimeout(() => {
      if (socket && isActive) {
        //console.log('发送心跳包');
        socket.send(
          JSON.stringify({
            event: 'ping',
          })
        );

        // 设置服务器响应超时检测
        serverTimeoutTimer = setTimeout(() => {
          console.log('服务器响应超时，关闭WebSocket连接');
          if (socket) {
            socket.close();
          }
        }, this.serverTimeout);
      }
    }, this.interval);
  },
};

// 创建WebSocket连接
const createSocket = () => {
  // 检查连接状态，只有当socket不存在或者连接已关闭时才创建新连接
  if (isConnecting || (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN))) {
    console.log('WebSocket连接已存在或正在连接中，状态:', socket ? socket.readyState : 'no socket');
    return;
  }

  console.log('创建WebSocket连接...');
  isConnecting = true;

  try {
    const token = encodeURIComponent(getToken());
    if (!token || token === 'undefined') {
      throw new Error('用户未登录...');
    }

    // 如果存在旧的socket连接，先关闭它
    if (socket) {
      socket.close();
      socket = null;
    }
    socket = new WebSocket(createWebSocketUrl(webSocketURL) + 'api/v1/websocket?token=' + token);
    initSocket();
  } catch (e) {
    console.log('创建WebSocket连接失败:', e);
    isConnecting = false;
    scheduleReconnect();
  }
};

// 初始化WebSocket事件监听
const initSocket = () => {
  if (!socket) return;

  socket.onopen = function (_) {
    console.log('WebSocket:已连接');
    isActive = true;
    isConnecting = false;
    heartCheck.start();
  };

  socket.onmessage = function (event) {
    isActive = true;
    let isHeart = false;
    const message = JSON.parse(event.data);

    // 处理心跳响应
    if (message.event === 'pong' || message.event === 'ping') {
      isHeart = true;
      //console.log('收到心跳响应，重置超时检测');
      heartCheck.reset(); // 重置超时检测
      heartCheck.start(); // 重新开始心跳检测
      return; // 心跳消息不需要进一步处理
    }

    // 通知私信
    if (message.event === 'notice') {
      noticeStoreAct.setMessages(message.data);
      return;
    }

    // 更新token
    if (message.event === 'tokenUpdated') {
      refreshToken().then((res: any) => {
        const userInfo = res.data.userInfo;
        userInfo.avatar = getUpFileUrl(userInfo.avatar);
        // 存储 token 到浏览器缓存
        Session.set('token', res.data.token);
        // 存储用户信息到浏览器缓存
        Session.set('userInfo', userInfo);
        useUserInfo().setUserInfos();
      });
      return;
    }

    // 调用所有注册的消息处理器
    messageHandlers.forEach(handler => {
      try {
        handler.call(null, event);
      } catch (error) {
        console.error('消息处理器执行错误:', error);
      }
    });
  };

  socket.onerror = function (_) {
    console.log('WebSocket:发生错误');
    isActive = false;
    isConnecting = false;
    scheduleReconnect();
  };

  socket.onclose = function (_) {
    console.log('WebSocket:已关闭');
    isActive = false;
    isConnecting = false;
    heartCheck.reset();
    scheduleReconnect();
  };
};

// 安排重连
const scheduleReconnect = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }

  reconnectTimer = setTimeout(() => {
    console.log('尝试重新连接WebSocket...');
    createSocket();
  }, 5000);
};

// 页面卸载时的清理逻辑
const setupPageUnloadHandler = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      cleanupWebSocket();
    });

    window.addEventListener('pagehide', () => {
      cleanupWebSocket();
    });
  }
};

export default (onMessage?: Function) => {
  // 设置页面卸载处理程序
  setupPageUnloadHandler();

  // 如果提供了消息处理器，添加到消息处理器列表
  if (onMessage) {
    addOnMessage(onMessage);
  }

  // 如果WebSocket已经存在且活跃，直接返回
  if (socket && isActive) {
    console.log('WebSocket连接已存在且活跃');
    return;
  }

  // 如果正在连接中，直接返回
  if (isConnecting) {
    console.log('WebSocket正在连接中');
    return;
  }

  // 创建WebSocket连接
  createSocket();
};

