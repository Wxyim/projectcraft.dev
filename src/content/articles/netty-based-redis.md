---
title: 基于 Netty 实现 Redis 服务
description: 基于 Netty 模拟实现 Redis 服务的各种功能。
pubDate: 2026-05-08
updatedDate: 2026-05-10
draft: false
featured: true
order: 5
tags:
  - build-a-redis
---
### 前言
　　之前使用 Java 模拟实现的 Redis 存在代码耦合严重，线程通信不灵活等问题，现在探索基于 Netty 框架的实现。

### 实现服务端
　　Netty 框架使用 group 管理线程，这里建立 bossGroup 用于处理客户端连接，workerGroup 用于与管理客户端数据通信。

　　Netty 通道使用非阻塞 IO 模型。接着注册自定义处理器 Handler 到 pipeline 中。

　　这里 RedisCommandHandler 用于收到客户端指令，执行相应的操作。

　　监听指定端口后，调用 sync 阻塞当前主线程，防止服务器关闭以接受多客户端连接。直到服务器的 Channel 被关闭。

```java title="RedisServerGateway.java"
// 新写法 (Netty 4.2+): 使用通用多线程组 + Nio 处理器插件
EventLoopGroup bossGroup = new MultiThreadIoEventLoopGroup(1, NioIoHandler.newFactory());

// 默认线程数（CPU 核心数 * 2）
EventLoopGroup workerGroup = new MultiThreadIoEventLoopGroup(NioIoHandler.newFactory());

try {
    ServerBootstrap b = new ServerBootstrap();
    b.group(bossGroup, workerGroup)
            .channel(NioServerSocketChannel.class) // 指定使用 NIO (非阻塞 IO) 模型
            .childHandler(new ChannelInitializer<SocketChannel>() {
                @Override
                public void initChannel(SocketChannel ch) throws Exception {
                    // Netty 自带解码器与聚合器，注意顺序：先 Decoder，再 Aggregator
                    ch.pipeline().addLast(new RedisDecoder());
                    ch.pipeline().addLast(new RedisBulkStringAggregator());
                    ch.pipeline().addLast(new RedisArrayAggregator());
                    // 将我们自定义的事件处理器，注册到这个连接的流水线 (Pipeline) 中
                    ch.pipeline().addLast(new RedisCommandHandler());
                }
            });

    // 绑定端口，启动服务器
    int port = (int) argsMap.get("port");
    System.out.println("异步事件驱动 Redis 服务网关已启动，监听端口: " + port);
    ChannelFuture f = b.bind(port).sync();

    // 阻塞当前的主线程，直到服务器的 Channel 被关闭
    f.channel().closeFuture().sync();
} finally {
    // 优雅停机
    workerGroup.shutdownGracefully();
    bossGroup.shutdownGracefully();
}
```

### 实现客户端
　　同样使用 Netty 提供的模型，只建立一个组即可，用于连接建立和命令交互。

　　这里加入 Netty 自带的解码器，可以自动转为 RedisMessage 对象，再通过自定义的业务处理器 Handler 处理。

　　编码器则用于出站，发送数据时转换为 ByteBuf。

　　连接到服务器后通过 while 循环执行读取从终端的输入，实现命令交互。

```java title="RedisClient.java"
EventLoopGroup workerGroup = new MultiThreadIoEventLoopGroup(1, NioIoHandler.newFactory());

try {
    Bootstrap bootstrap = new Bootstrap();

    bootstrap.group(workerGroup)
            .channel(NioSocketChannel.class)
            .handler(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) {
                    // 解码器：将 ByteBuf 转换为 RedisMessage
                    ch.pipeline().addLast(new RedisDecoder());
                    // 聚合器：聚合 Bulk String 和 Array
                    ch.pipeline().addLast(new RedisBulkStringAggregator());
                    ch.pipeline().addLast(new RedisArrayAggregator());
                    // 编码器：将 RedisMessage 转换为 ByteBuf
                    ch.pipeline().addLast(new RedisEncoder());
                    // 业务处理器
                    ch.pipeline().addLast(new RedisClientHandler());
                }
            });

    Channel channel = bootstrap.connect("127.0.0.1", 6379).sync().channel();
    System.out.println("Redis 客户端已连接到: 127.0.0.1:6379");
    System.out.println("请输入 Redis 命令 (例如: SET key value)，输入 'quit' 退出:");

    BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
    while (true) {
        // 等待前面的命令完成
        if (responseLatch != null) {
            responseLatch.await();
            // 清空在这期间用户敲击键盘产生的缓冲字符
            while (in.ready()) {
                in.read();
            }
        }

        String line = in.readLine();
        if (line == null || "quit".equalsIgnoreCase(line)) {
            break;
        }
        if (line.trim().isEmpty()) {
            continue;
        }

        // 将输入的字符串解析为 Redis 命令格式
        String[] cmds = line.split("\\s+");
        List<RedisMessage> children = new ArrayList<>(cmds.length);
        for (String cmd : cmds) {
            children.add(new FullBulkStringRedisMessage(
                    ByteBufUtil.writeUtf8(channel.alloc(), cmd)
            ));
        }
        RedisMessage request = new ArrayRedisMessage(children);

        // 在发送命令前，创建一个 CountDownLatch
        responseLatch = new CountDownLatch(1);

        channel.writeAndFlush(request);
    }

    channel.closeFuture().sync();
} finally {
    // 优雅停机
    workerGroup.shutdownGracefully();
}
```

### LISTS 相关功能
　　RPUSH、LPUSH、LRANGE、LLEN、LPOP 等命令比较简单，都是发送指令后服务端即时响应。

　　着重记录下 BLPOP。其复杂之处在于阻塞等待的处理，客户端指定 timeout 时长的阻塞：`BLPOP key timeout`，服务端的处理，需要考虑使用异步阻塞。

　　一开始使用了 ReentrantLock、Condition 实现的同步阻塞，会使得 Netty 的工作线程一直被占用，这是不合理的。于是了解到异步阻塞：挂起客户端请求不回复，注册超时回调异步处理，Netty 本身有适合的方法。

　　ctx.executor().schedule() 就是为专门负责处理当前这个客户端连接的那个单线程创建定时任务。

　　ctx.channel().closeFuture() 会返回一个特殊的 Future，会在当前网络连接（Channel）关闭时完成。通过调用 addListener，注册一个回调任务（监听器），当客户端连接断开时，Netty 就会自动触发并执行这个任务。

```java title="BlpopHandler.java"
// 1. 立即检查所有 key，看是否有元素可以弹出
for (String key : keys) {
    CopyOnWriteArrayList<String> list = RedisStorage.mapList.get(key);
    if (list != null && !list.isEmpty()) {
        String ele = list.removeFirst();
        if (list.isEmpty()) {
            RedisStorage.mapList.remove(key);
        }
        sendSuccessReply(ctx, key, ele);
        return;
    }
}

// 2. 如果所有列表都为空，则准备异步等待

// 添加一个监听器，以便在客户端意外断开连接时进行清理
ctx.channel().closeFuture().addListener(_ -> {
    ScheduledFuture<?> timeoutFuture = RedisStorage.blpopTimeoutMap.remove(ctx);
    if (timeoutFuture != null) {
        timeoutFuture.cancel(false);
    }
    RedisStorage.blpopContextKeysMap.remove(ctx);
    for (String key : keys) {
        Queue<ChannelHandlerContext> queue = RedisStorage.blpopKeysQueueMap.get(key);
        if (queue != null) {
            queue.remove(ctx);
        }
    }
});

// 如果超时时间 > 0，则安排一个超时任务
if (timeoutSeconds > 0) {
    ScheduledFuture<?> timeoutFuture = ctx.executor().schedule(() -> {
        // 超时触发，将客户端从所有等待队列中移除
        for (String key : keys) {
            Queue<ChannelHandlerContext> queue = RedisStorage.blpopKeysQueueMap.get(key);
            if (queue != null) {
                queue.remove(ctx);
            }
        }
        RedisStorage.blpopTimeoutMap.remove(ctx);
        RedisStorage.blpopContextKeysMap.remove(ctx);

        // 如果连接仍然活跃，则发送 nil 回复
        if (ctx.channel().isActive()) {
            ctx.writeAndFlush(Unpooled.copiedBuffer("*-1\r\n", CharsetUtil.UTF_8));
        }
    }, timeoutSeconds, TimeUnit.SECONDS);
    // 保存超时任务的句柄，如果超时前断开连接了，可以在那里取消它
    RedisStorage.blpopTimeoutMap.put(ctx, timeoutFuture);
}

// 保存 ctx 关注的 keys
RedisStorage.blpopContextKeysMap.put(ctx, keys);

// 将客户端添加到所有相关 key 的等待队列中
for (String key : keys) {
    RedisStorage.blpopKeysQueueMap
            .computeIfAbsent(key, k -> new LinkedBlockingQueue<>())
            .offer(ctx);
}
```

```java title="RpushHandler.java"
// 1. 将所有新元素推入列表右侧
CopyOnWriteArrayList<String> list = RedisStorage.mapList.computeIfAbsent(key, k -> new CopyOnWriteArrayList<>());
list.addAll(valuesToPush);
long newSize = list.size();

// 2. 检查是否有等待 BLPOP 的客户端
Queue<ChannelHandlerContext> waitingQueue = RedisStorage.blpopKeysQueueMap.get(key);
while (waitingQueue != null && !waitingQueue.isEmpty() && !list.isEmpty()) {
    ChannelHandlerContext waitingCtx = waitingQueue.poll();
    if (waitingCtx != null) {
        // 从等待的所有键的队列中移除该客户端，防止它再次被其他键触发
        List<String> waitingKeys = RedisStorage.blpopContextKeysMap.remove(waitingCtx);
        if (waitingKeys != null) {
            for (String k : waitingKeys) {
                if (!k.equals(key)) {
                    Queue<ChannelHandlerContext> otherQueue = RedisStorage.blpopKeysQueueMap.get(k);
                    if (otherQueue != null) {
                        otherQueue.remove(waitingCtx);
                    }
                }
            }
        } else {
            continue;
        }

        // 从列表左侧弹出一个元素给等待的客户端
        String valueForWaitingClient = list.removeFirst();

        // 取消该客户端的超时任务
        ScheduledFuture<?> timeoutFuture = RedisStorage.blpopTimeoutMap.remove(waitingCtx);
        if (timeoutFuture != null) {
            timeoutFuture.cancel(false);
        }
        // 发送数据
        BlpopHandler.sendSuccessReply(waitingCtx, key, valueForWaitingClient);
    } else {
        break;
    }
}
```
