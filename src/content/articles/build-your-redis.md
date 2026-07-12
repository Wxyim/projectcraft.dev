---
title: 使用 Java 写一个 Redis 服务器
description: 这是 codecrafter 的一个练习课程，使用 Java 语言模拟 Redis 服务的各项功能。
pubDate: 2026-05-05
draft: false
featured: true
order: 10
tags:
  - Java
  - Redis
  - Practice
image: /uploads/cover.png
---
### 前言
　　这是 codecrafter 的一个练习课程，使用 Java 语言模拟 Redis 服务的各项功能。简要记录下内容、实现、思考。

### 如何实现服务端呢？
　　简单来说是通过 ServerSocket 监听某个端口，接受客户端的连接。
```java
ServerSocket serverSocket = new ServerSocket(6379);
serverSocket.setReuseAddress(true);

while (true) {
  // accept() 是阻塞的，直到有客户端连接
  Socket socket = serverSocket.accept();
  // 处理客户端请求...
}
```
### 如何读取客户端发送的数据呢？
　　通过客户端 socket 对象，获取输入流（此处主体是服务器，输入流即发向服务器的数据）；回复客户端则使用此 socket 的输出流。
```java
// 异步线程处理，避免阻塞主线程，以支持多客户端并行连接
Thread client = new Thread(() -> {
    try (BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
      PrintWriter printWriter = new PrintWriter(clientSocket.getOutputStream(), true)) {
        String message;
        // readLine() 是阻塞的，直到有客户端发送数据
        while ((message = bufferedReader.readLine()) != null) {
          // 处理客户端指令...
        }
    }
});
client.start();
```

### 协议部分
　　实现 Redis 官方 RESP 协议进行数据交互。

- 客户端发送的指令格式为：`*1\r\n$4\r\nPING\r\n`

　　其中 `*` 表示为数组，紧接为数组的长度，`\r\n` 为换行，`$` 代表长度字符串，紧接为字符串的长度，下一行则为字符串的值；客户端应按照这种官方协议发送指令。

- 服务端回的指令格式有多种：
1. `+PONG\r\n` `+OK\r\n` `+`开头代表成功，简单字符串
2. `-ERR\r\n` `-`开头代表失败，简单字符串
3. `:1\r\n` `:`开头代表数字
4. `*1\r\n$5\r\nvalue\r\n` `*`开头即数组

### 各种数据类型
　　对于各种数据类型的操作，一般来说都是选择合适的存储结构，即 Java 的各种数据结构类，例如 Map, Set, List, Queue 等，实现步骤类似。


### 主从复制
##### 1. 如何做为一个从服务器？

　　服务启动时，通过指定参数 `--replicaof "host port"` 表明此服务实例是指定 host 的从服务器。

　　所以可以判断参数，在此场景下他是主服务器的客户端，创建连接主服务器的 socket:
```java
Map<String, Object> argsMap = new HashMap<>();
// 从启动命令解析参数 --replicaof
// argsMap.add("replicaof", "...")
if (argsMap.containsKey("replicaof")) {
  String[] mainHost = ((String) argsMap.get("replicaof")).split(" ");
  // Replica connection handling — use PushbackInputStream and byte-level RESP parsing
  new Thread(() -> {
    try {
      // 作为客户端连接指定地址
      Socket masterSocket = new Socket(mainHost[0], Integer.parseInt(mainHost[1]));
      masterSocket.setKeepAlive(true);

      // Wrap input in PushbackInputStream so we can unread bytes when we peek
      PushbackInputStream pin = new PushbackInputStream(masterSocket.getInputStream(), 8192);
      PrintWriter printWriter = new PrintWriter(
        new OutputStreamWriter(masterSocket.getOutputStream(), StandardCharsets.ISO_8859_1), true);

      // 从服务器握手开始首先发送 PING
      printWriter.print("*1\r\n$4\r\nPING\r\n");
      printWriter.flush();

      String message;
      // 为了解析 RDB 数据，这里使用自定义方法读取数据
      while ((message = readLineFromStream(pin)) != null) {
        // 解析数据
      }

    }
  }).start();
}
```
##### 2. 握手部分

　　从服务器首先发送了 PING, 收到 PONG 后发送 `*3\r\n$8\r\nREPLCONF\r\n$14\r\nlistening-port\r\n$4\r\n6380\r\n"`，其中 `listening-port` 的值应为他自身监听的端口号。

　　接着收到 OK 后发送 `*3\r\n$8\r\nREPLCONF\r\n$4\r\ncapa\r\n$6\r\npsync2\r\n` capa 代表“能力”。它表明下一个参数是副本支持的功能。psync2 表示副本支持 PSYNC2 协议。PSYNC2 是部分同步功能 [partial synchronization] 的改进版本，用于将副本与其主副本重新同步。

　　之后收到 OK 后再发送 `*3\r\n$5\r\nPSYNC\r\n$1\r\n?\r\n$2\r\n-1\r\n` 对于副本与主服务器的第一次连接，复制ID将为 ?，因为副本还不知道主 ID；偏移量将为 -1，因为副本还没有来自主副本的数据。

　　总结下握手部分是 `PING` + `两次 REPLCONF` + `PSYNC`。

　　接下来会收到主服务器的 +FULLRESYNC 回复以及 RDB 文件，解析 RDB 文件以同步从服务器自身的存储。

##### 3. 复制部分

　　按照官方 RDB 格式，解析 RDB 文件。

### Authentication

　　默认 default 用户，连接不需要密码，如果为当前用户修改了密码，那么再次登录（已登录的客户端不会断开）发送各种指令时，服务器会返回 `-ERR` 未认证错误。可以使用 `ACL` 指令进行认证。

### AOF

　　这一部分实现 AOF 文件的创建，写指令的同步或间隔批量写入 AOF 文件，以及如果服务器启动时指定 AOF 工作目录且存在 manifest 文件，将按照 manifest 记录读取指定 AOF 文件并恢复其中的指令。

### 问题与思考 - 多线程

　　当前的实现可以这样概述为：

　　1. 通过 while 循环，让服务器 serverSocket.accept() 阻塞获取客户端连接，放入子线程异步处理，以实现多客户端的连接；

　　2. 每个客户端线程，都通过 socket 输入流的 readLine() 方法阻塞获取数据，这意味着客户端不发数据，线程就停在那里，不能做其他事。这在某些场景下，线程间通信就比较困难。比如客户端 SET 后发送 WAIT 指令，期望判断主从复制情况，需要主服务器发送 `REPLCONF GETACK *`, 因为此时在客户端线程当中，如何将指令发给从服务器呢？怎么才能与从服务器的 socket 进行通信呢？于是不得不在主服务器接收到 `PSYNC` 指令时，保存 socket 并绑定同步阻塞队列到一个 Map，线程内部新开一个线程处理当前队列（线程内部 take 队列任务）。当需要发送 getack 时就遍历 Map 加入到发送队列中。

　　由此看来，现版代码实现耦合度太高，在上述类似场景下颇为吃力。下一步探索基于事件响应的多线程模型是必要的。
