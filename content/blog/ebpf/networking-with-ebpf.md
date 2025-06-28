---
title: "Networking with eBPF: From Fundamentals to Advanced Applications"
dateString: 28th June 2025
draft: false
tags: ["Networking", "eBPF", "Linux", "Kernel"]
weight: 101
---

### Motivation

eBPF (extended Berkeley Packet Filter) has revolutionized how we implement networking functionality in Linux systems. This comprehensive blog explores the networking concepts involved in eBPF, covering everything from fundamental principles to advanced implementations. With eBPF, developers can run sandboxed programs within the kernel space, providing unprecedented control over network traffic without compromising system stability or requiring kernel modifications.

## Introduction to eBPF

eBPF represents a significant evolution from the original Berkeley Packet Filter. Created initially for filtering network packets, eBPF has expanded into a versatile execution engine that can be leveraged for numerous use cases, with networking remaining one of its most prominent applications.

### The Evolution of BPF to eBPF

The original BPF was designed as a simple packet filtering mechanism, but its capabilities were radically expanded in 2014. The result-extended BPF or eBPF-allows programs broad access to kernel functions and system memory, but in a protected way. This expansion enables eBPF to gather detailed information about low-level networking, security, and other system-level activities within the kernel without requiring direct modifications to kernel code.

Unlike programs that run in user space, eBPF programs are inherently more efficient and potentially more powerful because they can see and respond to nearly all operations performed by the operating system. For application tracing, eBPF provides the advantage of not requiring any code instrumentation, and since it supports event-driven functions, tracing can be performed efficiently as CPU cycles are used only when needed.

### Why eBPF is Revolutionary for Networking

eBPF has transformed network programming in Linux by:

1. Providing built-in hooks for programs based on system calls, kernel functions, network events, and other triggers
2. Offering a mechanism for compiling and verifying code prior to running, ensuring security and stability
3. Enabling a more straightforward way to enhance kernel functionality than is possible through Loadable Kernel Modules (LKMs)

These capabilities make eBPF particularly valuable for networking challenges that traditional tools struggle to address efficiently or with sufficient granularity. Because eBPF programs are event-based, they can enable efficient but complex processing of network traffic and design detailed but lightweight security and observability features.

## Linux Networking Fundamentals

To understand how eBPF enhances networking, we first need to grasp the fundamentals of Linux networking architecture and how packets flow through the kernel.

### Linux Kernel Networking Stack

The Linux networking stack follows a layered model similar to the OSI model but with Linux-specific adaptations. When a network packet arrives, it flows through several layers before reaching user-space applications:

1. **Physical Layer**: Managed by network interface card (NIC) drivers that handle the physical reception of packets
2. **Link Layer**: Handles Ethernet frames and addressing
3. **Network Layer**: Processes IP packets, handles routing decisions
4. **Transport Layer**: Manages TCP/UDP connections and reliability
5. **Socket Interface**: Connects kernel networking to userspace applications

eBPF can attach to various points within this stack, allowing for unprecedented control over packet processing.

{{< figure src="https://raw.githubusercontent.com/hanshal101/hanshal101/main/static/blog/ebpf/02-linux-kernel-networking-stack.png" alt="Linux Kernel Networking Stack" caption="Linux Kernel Networking Stack" class="center-image" width="600" >}}

### Packet Flow in Linux

Understanding packet flow is crucial for effective eBPF programming. A packet typically follows this path:

**Ingress Path:**

1. Packet arrives at the NIC
2. XDP (eXpress Data Path) hook - earliest point for eBPF interception
3. NIC driver processing
4. Traffic Control (TC) ingress hook - another eBPF interception point
5. Netfilter hooks (used by iptables)
6. Protocol handlers (IP, TCP, UDP)
7. Socket delivery to applications

**Egress Path:**

1. Application sends data through socket
2. Protocol handlers process outgoing data
3. Routing subsystem makes forwarding decisions
4. Netfilter hooks process outgoing packets
5. Traffic Control (TC) egress hook - eBPF interception point
6. NIC driver prepares packet for transmission
7. Packet transmitted by NIC

Each of these points offers opportunities for eBPF programs to intercept, analyze, modify, or redirect network traffic.

## eBPF Program Types for Networking

eBPF provides several program types specifically designed for different networking use cases. Each program type corresponds to a specific attachment point in the networking stack.

### Socket Filter Programs

Socket filter programs (BPF_PROG_TYPE_SOCKET_FILTER) represent one of the earliest applications of BPF. These programs can hook into network sockets and are designed to filter or modify packets received by that socket. Importantly, these programs only operate on ingress (received) packets, not outgoing packets.

Socket filter programs are called by the kernel with a `__sk_buff` context. The return value from these programs indicates how many bytes of the message should be kept. Returning a value less than the size of the packet will truncate it, and returning `0` will discard the packet entirely.

A notable use case for this program type is `tcpdump`, which uses raw sockets in combination with socket filters generated from filter queries to efficiently process only packets of interest, minimizing the cost of kernel-userspace transitions.

To use socket filter programs, they are typically placed in an ELF section prefixed with `socket` and attached to network sockets using the `setsockopt` syscall with the `SOL_SOCKET` socket level and `SO_ATTACH_BPF` socket option.

### Traffic Control (TC) Programs

Traffic Control (TC) is Linux's mechanism for controlling packet sending and receiving in terms of rate, sequence, and other aspects. Located at the link layer, TC comes into play after sk_buff allocation and operates later in the processing path than XDP.

In the TC subsystem, the corresponding data structure and algorithm control mechanism are abstracted as qdisc (Queueing discipline). It exposes two callback interfaces for enqueuing and dequeuing packets externally while internally hiding the implementation of queuing algorithms.

TC can implement complex tree structures based on filters and classes:

- **Filters** are mounted on qdisc or class to implement specific filtering logic
- **Classes** organize packets into different categories
- **Actions** are executed when packets match specific filters

When a packet reaches the top-level qdisc, its enqueue interface is called, and mounted filters are executed sequentially until one matches successfully. The packet is then sent to the class pointed to by that filter and enters the qdisc processing configured for that class.

The TC framework with eBPF provides a classifier-action mechanism, allowing an eBPF program loaded as a filter to return values that determine packet handling, implementing a complete packet classification and processing system.

### XDP (eXpress Data Path) Programs

XDP programs represent one of the most powerful networking applications of eBPF. They operate at the earliest possible point in the networking stack, before the kernel allocates memory structures for packets. This early interception enables extremely high-performance packet processing.

XDP programs can return several actions that determine the packet's fate:

1. **XDP_DROP**: Tells the driver to drop packets at an early stage, which is extremely efficient for filtering and DDoS mitigation
2. **XDP_PASS**: Allows packets to continue to the normal network stack
3. **XDP_TX**: Forwards packets using the same NIC by which they were received
4. **XDP_REDIRECT**: Forwards packets to a different network interface or CPU

These capabilities make XDP ideal for high-performance networking applications such as:

- DDoS mitigation and firewalling
- Forwarding and load balancing
- Network monitoring
- Protocol translation


### cGroup Socket Programs

cGroup socket programs (BPF_PROG_TYPE_CGROUP_SOCK) are attached to cGroups and triggered when sockets are created, released, or bound by a process in that cGroup. These programs allow for policy enforcement and monitoring at the socket level based on a process's cGroup membership.

This program type enables fine-grained control over socket operations for processes in specific cGroups, which is particularly useful in containerized environments.

## XDP: High-Performance Packet Processing

XDP (eXpress Data Path) represents one of the most transformative networking features enabled by eBPF, offering unprecedented performance for packet processing applications.

### XDP Architecture and Hook Points

XDP operates directly at the driver level, intercepting packets immediately as they arrive from the network interface, before any memory allocations or other kernel processing occurs. This early interception point provides several advantages:

1. **Minimal Processing Overhead**: Packets can be processed or dropped before the kernel allocates memory for them
2. **Reduced Latency**: Fast-path operations can bypass much of the kernel's networking stack
3. **High Throughput**: XDP can process millions of packets per second on a single CPU core

XDP provides several hook points for attaching eBPF programs:

1. **Driver/Native XDP**: Implemented directly in the network driver, offering the best performance but requiring driver support
2. **Generic XDP**: Runs later in the stack after the `sk_buff` allocation, with somewhat reduced performance but broader compatibility
3. **Offloaded XDP**: Programs are offloaded to the NIC hardware, enabling wire-speed processing without CPU involvement for supported NICs

### XDP Actions and Use Cases

XDP programs can implement various packet handling strategies through several return values:

1. **XDP_DROP**: Instructs the driver to drop the packet immediately, which is extremely efficient for filtering and DDoS mitigation
2. **XDP_PASS**: Allows the packet to continue to the normal network stack for further processing
3. **XDP_TX**: Transmits the modified packet back out through the same NIC it arrived on, useful for creating simple packet responders or modifying and returning packets
4. **XDP_REDIRECT**: Forwards the packet to a different network interface or to a different CPU for processing, enabling advanced use cases like load balancing or packet steering

These actions make XDP particularly well-suited for several networking applications:

#### DDoS Mitigation and Firewalling

One of the fundamental functions of XDP is using XDP_DROP to eliminate unwanted traffic at an early stage. This capability allows for implementing various efficient network security strategies while keeping the processing cost of each packet very low.

XDP excels at handling DDoS attacks by scrubbing illegitimate traffic and forwarding legitimate packets to their destination using XDP_TX. It can be deployed either in standalone network appliances or distributed to multiple nodes that protect the host.

For maximum performance, offloaded XDP can shift processing entirely to the NIC, allowing packets to be processed at wire speed.

#### Forwarding and Load Balancing

XDP enables efficient packet forwarding and load balancing through XDP_TX or XDP_REDIRECT operations. This allows data packets to be manipulated using BPF helper functions to increase or decrease packet headroom, or to encapsulate and decapsulate packets before sending them.

Load balancers can be implemented using either:

- XDP_TX to forward packets using the same NIC by which they were received
- XDP_REDIRECT to forward packets to a different network interface


### Programming with XDP

Creating an XDP program involves several steps:

1. **Setting up the development environment** by installing required packages:
```
sudo dnf install clang llvm gcc libbpf libbpf-devel libxdp libxdp-devel xdp-tools bpftool kernel-headers
```

2. **Writing the XDP program** in C, such as a simple program to drop all packets:
```c
#include <linux/bpf.h>

SEC("xdp")
int xdp_drop(struct xdp_md *ctx) {
    return XDP_DROP;
}
```

3. **Building the program** using Clang:
```
clang -O2 -g -Wall -target bpf -c xdp_drop.c -o xdp_drop.o
```

4. **Loading the program** using appropriate tools like bpftool or xdp-loader

This straightforward approach allows for rapid development and deployment of high-performance networking applications.

## Traffic Control with eBPF

Traffic Control (TC) is Linux's subsystem for controlling packet sending and receiving. With eBPF support, TC has become a powerful platform for implementing complex packet processing logic.

### TC Architecture and Components

TC is located at the link layer in the Linux networking stack, operating after sk_buff allocation has been completed. The TC subsystem consists of several components:

1. **Queueing Disciplines (qdiscs)**: Algorithms that control how packets are queued and dequeued
2. **Classes**: Organize packets into categories for different treatment
3. **Filters**: Match packets based on criteria and assign them to classes
4. **Actions**: Operations performed on packets when they match filters

In the TC subsystem, the corresponding data structure and algorithm control mechanism are abstracted as qdisc (Queueing discipline). It exposes two callback interfaces for enqueuing and dequeuing packets externally while internally hiding the implementation of queuing algorithms.

### Filters and Classes in TC

TC can implement complex packet processing through filters and classes:

- **Filters** are mounted on qdisc or class to implement specific filtering logic
- **Classes** organize packets into different categories
- **Actions** are executed when packets match specific filters

When a packet reaches the top-level qdisc:

1. Its enqueue interface is called
2. Mounted filters are executed sequentially until one matches
3. The packet is sent to the class pointed to by that filter
4. The packet enters the qdisc processing configured for that class

The TC framework with eBPF provides a classifier-action mechanism that enables both packet classification and processing in an integrated way.

### TC vs. XDP: When to Use Which

While both TC and XDP enable programmable packet processing, they have different characteristics that make them suitable for different use cases:

**XDP advantages**:

- Processes packets earlier, before sk_buff allocation
- Higher performance for simple packet filtering and dropping
- Better suited for DDoS mitigation and high-throughput applications

**TC advantages**:

- Richer context with full sk_buff access
- Better integration with existing traffic control mechanisms
- More suitable for complex packet transformation and manipulation
- Works with virtual interfaces and in scenarios where XDP is not supported

Generally, use XDP for high-performance packet filtering and forwarding, and TC for complex traffic shaping, detailed packet manipulation, and where integration with existing QoS mechanisms is required.

## eBPF Maps for Networking

eBPF maps are key-value stores that allow data sharing between eBPF programs and between kernel and user space. They are crucial for networking applications, providing state storage, configuration, and inter-program communication.

### Map Types Overview

Linux kernel provides numerous map types for various use cases. For networking applications, these can be categorized as:

1. **Generic map types**: General-purpose storage like hash tables and arrays
2. **Map-in-map types**: Maps that store references to other maps
3. **Streaming maps**: For large data transfer between kernel and user space
4. **Packet redirection maps**: For steering packets between devices, CPUs, or sockets
5. **Special-purpose maps**: For specific networking functions

### Hash and Array Maps

These fundamental map types provide the building blocks for many networking applications:

1. **BPF_MAP_TYPE_HASH**: A generic hash table for key-value lookups
2. **BPF_MAP_TYPE_ARRAY**: An array with fixed-size entries, indexed by integers
3. **BPF_MAP_TYPE_LRU_HASH**: A hash with least-recently-used eviction policy
4. **BPF_MAP_TYPE_LPM_TRIE**: A longest-prefix match tree, ideal for IP routing tables

These maps are commonly used for connection tracking tables, flow state storage, configuration parameters, and statistics collection.

### Per-CPU Maps

Per-CPU map variants maintain separate copies of the map for each logical CPU, eliminating the need for synchronization:

1. **BPF_MAP_TYPE_PERCPU_HASH**: Per-CPU version of hash map
2. **BPF_MAP_TYPE_PERCPU_ARRAY**: Per-CPU version of array map

These maps offer superior performance for high-traffic networking applications by eliminating contention between CPUs. Since multiple CPUs never read or write to memory accessed by another CPU, these maps avoid race conditions and the need for synchronization mechanisms like spin-locks or atomic instructions.

Per-CPU maps also improve performance through better cache locality and can serve as efficient scratch buffers for temporary storage during packet processing.

### Socket Maps and Packet Redirection Maps

Specialized maps designed for networking operations:

1. **BPF_MAP_TYPE_SOCKMAP**: Stores socket references for redirection between sockets
2. **BPF_MAP_TYPE_SOCKHASH**: Hash-based socket storage for efficient lookups
3. **BPF_MAP_TYPE_DEVMAP**: Stores network device references for XDP redirection between interfaces
4. **BPF_MAP_TYPE_CPUMAP**: Enables XDP packet redirection between CPUs for balanced processing

These maps facilitate packet steering between network devices, CPUs, and sockets, enabling efficient implementation of load balancing, forwarding, and network function virtualization.

### Ringbuf and Perf Event Arrays

Maps that enable efficient data streaming between kernel and user space:

1. **BPF_MAP_TYPE_RINGBUF**: A ring buffer for efficient bulk data transfer
2. **BPF_MAP_TYPE_PERF_EVENT_ARRAY**: Uses perf subsystem for event notification

For networking applications, these maps are valuable for packet sampling and capture, network telemetry and monitoring, flow record export, and network analytics.

### Map-in-Map Structures

Map-in-map types store references to other maps, enabling complex data structures:

1. **BPF_MAP_TYPE_ARRAY_OF_MAPS**: An array where each element is a map
2. **BPF_MAP_TYPE_HASH_OF_MAPS**: A hash table where values are maps

These structures enable sophisticated networking applications like multi-level routing tables, hierarchical policy enforcement, and tenant isolation in multi-tenant networks.

## Socket Filtering and Manipulation

Socket filtering is one of the original use cases for BPF and continues to be a powerful application of eBPF. Socket filters allow programs to inspect and filter packets at the socket level, providing an efficient way to process only relevant network traffic.

### Socket Filter Programs

Socket filter programs (BPF_PROG_TYPE_SOCKET_FILTER) are designed to filter or modify packets received by network sockets. These programs hook into network sockets but only operate on ingress (received) packets, not egress (outgoing) packets.

Socket filter programs are called by the kernel with a `__sk_buff` context, and their return value indicates how many bytes of the message should be kept. Returning a value less than the size of the packet truncates it, while returning `0` discards the packet completely.

A common use case for socket filters is `tcpdump`, which uses raw sockets with socket filters generated from filter queries to efficiently process only packets of interest, minimizing the kernel-userspace barrier cost.

Socket filter programs are typically placed in an ELF section prefixed with `socket` and attached to network sockets using the `setsockopt` syscall with `SOL_SOCKET` socket level and `SO_ATTACH_BPF` socket option.

### Helper Functions for Socket Programs

Socket filter programs can use various helper functions to interact with the system and the context in which they operate. Some of the helper functions available to socket filter programs include:

- `bpf_get_socket_cookie`
- `bpf_get_socket_uid`
- `bpf_ktime_get_ns`
- `bpf_map_lookup_elem`
- `bpf_map_update_elem`
- `bpf_perf_event_output`
- `bpf_get_current_pid_tgid`
- `bpf_get_current_task`

These helpers enable socket filter programs to access various information about sockets, processes, and system state, enhancing their capabilities for packet processing and analysis.

### Socket Map Usage

eBPF provides special map types for socket operations:

1. **BPF_MAP_TYPE_SOCKMAP**: Stores references to sockets for redirection
2. **BPF_MAP_TYPE_SOCKHASH**: A hash-based version of SOCKMAP for efficient lookups

These maps enable advanced socket operations like fast socket lookup based on connection information, efficient socket redirection, and socket message forwarding between sockets.

## Packet Redirection and Forwarding

Packet redirection is a powerful capability of eBPF that allows packets to be steered between interfaces, CPUs, and sockets without traversing the entire networking stack. This capability enables efficient implementation of networking functions like load balancing, forwarding, and NAT.

### Interface Redirection with XDP

XDP allows packets to be redirected between network interfaces using the BPF_MAP_TYPE_DEVMAP and the bpf_redirect_map() helper function. This capability enables:

- Software-defined networking
- Virtual switching
- Service chaining
- Policy-based routing

Interface redirection typically involves:

1. Determining the target interface based on packet attributes or policy
2. Looking up the interface in a DEVMAP
3. Using XDP_REDIRECT action with appropriate helper function

### CPU Redirection

CPU redirection allows packets to be distributed across CPU cores for balanced processing:

1. **XDP CPU Redirection**: Using BPF_MAP_TYPE_CPUMAP and the bpf_redirect_map() helper
2. **RSS (Receive Side Scaling)**: Hardware-based distribution that can be influenced by eBPF

CPU redirection enables load balancing across cores, processor affinity for related flows, and optimization of cache locality.

### Implementing Load Balancing

XDP is particularly well-suited for implementing load balancers:

1. **L3/L4 Load Balancing**: Based on IP addresses and ports
    - Extract flow information (IPs, ports)
    - Compute consistent hash
    - Select backend using hash
    - Redirect to selected backend using XDP_TX or XDP_REDIRECT
2. **L7 Load Balancing**: Based on application-layer information
    - Parse HTTP/gRPC/etc. headers
    - Apply load balancing logic based on content
    - Redirect to appropriate backend

Load balancers can be implemented using either:

- XDP_TX to forward packets using the same NIC by which they were received
- XDP_REDIRECT to forward packets to a different network interface


## Network Monitoring and Observability

eBPF provides unprecedented capabilities for network monitoring and observability, enabling detailed visibility into network behavior without modifying applications or introducing significant overhead.

### Tracing Network Functions

eBPF can trace network-related kernel functions to provide insights into network behavior:

1. **Kprobe-based tracing**: Attaching eBPF programs to entry and exit points of kernel networking functions
2. **Tracepoint-based tracing**: Using predefined tracepoints in the networking stack
3. **Raw tracepoints**: Lower-overhead alternatives to standard tracepoints

These tracing mechanisms enable detailed function call tracking, parameter inspection, performance analysis, and debugging of network issues.

### Socket Monitoring

eBPF programs can monitor socket operations to provide insights into application network behavior:

1. **Socket creation and binding**: Tracking when sockets are created and bound to addresses
2. **Connection establishment**: Monitoring TCP connection setup and teardown
3. **Data transfer**: Measuring throughput and patterns of data flow
4. **Error conditions**: Detecting socket errors and failures

This monitoring provides valuable insights into application networking behavior and performance.

### Flow Monitoring

eBPF facilitates detailed flow monitoring at wire speed:

1. **Flow identification**: Based on 5-tuple (IPs, ports, protocol)
2. **Flow statistics**: Packets, bytes, duration
3. **Flow behavior analysis**: Patterns, protocols, periodicity
4. **Flow sampling**: Efficient collection of representative data

Flow monitoring applications include:

- Traffic accounting
- Anomaly detection
- Capacity planning
- Application dependency mapping


## Security Applications of eBPF Networking

eBPF has revolutionized network security by enabling programmable, high-performance security functions directly in the kernel.

### Firewalling with eBPF

eBPF enables next-generation firewall capabilities:

1. **XDP-based firewalling**: Ultra-fast packet filtering at the driver level, ideal for volumetric attack mitigation
2. **Stateful firewalling**: Using eBPF maps to track connection state
3. **Dynamic rule updates**: Modifying firewall behavior without service disruption

Using XDP_DROP with eBPF allows for implementing firewall policies with very little overhead per packet, making it extremely efficient for filtering large volumes of traffic.

### DDoS Mitigation Strategies

eBPF is particularly effective for DDoS mitigation:

1. **Early packet dropping**: Using XDP to drop attack traffic before it consumes system resources
2. **Traffic classification**: Distinguishing legitimate from attack traffic
3. **Rate limiting**: Implementing per-source rate limiting to contain attacks

XDP can handle DDoS scenarios by scrubbing illegitimate traffic and forwarding legitimate packets to their destination using XDP_TX. This approach can be implemented either in standalone network appliances or distributed across multiple nodes that protect the host.

For maximum performance, offloaded XDP can shift processing entirely to the NIC, allowing packets to be processed at wire speed.


### Conclusion

In this first part of our deep dive into networking with eBPF, we explored the fundamental building blocks that make eBPF a game-changer for modern networking on Linux. Starting with a historical evolution from classic BPF to the powerful eBPF framework, we examined how eBPF empowers developers to gain unprecedented control over packet flow within the kernel without compromising stability or requiring kernel modifications.

We navigated the Linux networking stack to understand where and how eBPF programs can be attached. We covered various eBPF program types such as socket filters, traffic control programs, XDP for high-performance packet processing, and cGroup socket programs. Each of these offers unique capabilities tailored to different networking needs.

We also delved into the rich landscape of eBPF maps that underpin stateful packet processing and data sharing, from basic hash maps to advanced per-CPU and redirection maps. Furthermore, we covered packet redirection strategies, load balancing techniques, observability through tracing and monitoring, and security applications including DDoS mitigation and firewalling—all achieved using eBPF’s flexible and performant architecture.

eBPF is redefining what’s possible in networking—bringing high throughput, fine-grained control, and programmability directly into the kernel. In the next part of this series, we’ll go deeper into real-world use cases, practical implementation patterns, and performance tuning techniques to harness the full potential of eBPF in production environments.
