---
title: "An Introduction to eBPF"
dateString: 22nd February 2024
draft: false
tags: ["eBPF", "Linux", "Kernel"]
weight: 101
---

### Motivation
In this blog series, we will deep dive into the fascinating world of eBPF (Extended Berkley Packet Filter) and its internals. Along the way, we
will explore core BPF (Berkley Packet Filter) internals that are essential to understanding how eBPF operates under the hood. This journey will also
include networking concepts, operating system principles, and computer architecture, all of which play a crucial role in making eBPF effective and
powerful.
Who should read this?: Everyone who's curious about eBPF and Linux Kernel.

### What is eBPF?
eBPF is a revolutionary kernel technology that allows developers to write
custom code that can be loaded into the kernel dynamically, changing the
way the kernel behaves.
This enables a new generation of highly performant networking, observability, and security tools. And as you'll see, if you want to instrument an app with these eBPF-based tools, you don't need to modify or reconfigure the app in any way, thanks to eBPF's vantage point within the kernel.
Just a few of the things you can do with eBPF include:
1. Performance tracing of pretty much any aspect of a system
2. High-performance networking, with built-in visibility
3. Detecting and (optionally) preventing malicious activity

### History of eBPF
Previously our OS was the center for all observability, networking and security functionality due to Kernel's ability to oversee and control entire system. However, evolving these functionalities within the kernel was challenging due to its critical role in maintaining stability and security. This limitation led to slower innovation compared to functionalities developed outside of the operating system. The introduction of eBPF (Extended Berkeley Packet Filter) in 2014 revolutionized this landscape by allowing developers to run sandboxed programs directly within the Linux kernel without modifying its source code or loading additional modules.

#### The Linux Kernel
The Linux kernel is the software layer between your applications and the hardware they're running on. Applications run in an unprivileged layer called user space, which can't access hardware directly. Instead, an application makes requests using the system call (syscall) interface to request the kernel to act on its behalf. That hardware access can involve reading and writing to files, sending or receiving network traffic, or even just accessing memory. The kernel is also responsible for coordinating concurrent processes, enabling many applications to run at once.

<center>
{{< figure src="https://raw.githubusercontent.com/hanshal101/hanshal101/main/static/blog/ebpf/01-linux-kernel.png" alt="Linux Kernel" caption="A diagram of the Linux Kernel" class="center-image" width="600" >}}
</center>

### How does eBPF programs run?
In a higher level abstraction
- eBPF programs can be writtern in languages like C/C++, Go, Rust, Python etc. Developers write eBPF programs primarily in restricted C or other supported languages. These programs are compiled into intermediary bytecode using tools like LLVM or clang.
- Then the bytecode is loaded into the Linux Kernel via tools like `bpftool` or through `bpf()` syscalls.
- After the program is loaded it goes through a verification process to make sure it is safe to run in the kernel. The verifier will check for potential issues like infinite loops, uninitialized variables, out-of-bound memory access, etc.
- If verified successfully, the bytecode is converted into native machine code by a JIT (Just-In-Time) compiler(We will discuss about this in later upcoming blogs) for efficient execution.
- The program then gets attached to specific hookpoints within the kernel. Example: syscalls, network events,
- Any event occuring at those hook points where the eBPF program is attached, it executes automatically.

We can also make the eBPF program to interact with the `user-space` of the system. This is done for better visibility of the traces. At last once the task is completed or when no longer needed, eBPF programs can be unloaded from the kernel using system calls again.

<center>
{{< figure src="https://raw.githubusercontent.com/hanshal101/hanshal101/main/static/blog/ebpf/01-ebpf-process.png" alt="eBPF Process" caption="A diagram of the eBPF process" class="center-image" width="600" >}}
</center>


### Basic Terminologies in eBPF

#### Maps
Remember we discussed about how eBPF program can interact with the `user-space`? Well MAPS help us to do so.
eBPF maps play a crucial role in facilitating data sharing and state management for eBPF programs. These maps enable the storage and retrieval of data using a variety of data structures, allowing eBPF programs to access them directly. Additionally, applications running in user space can also interact with these maps through system calls, providing a seamless way to exchange information between kernel and user space environments.
Hash-tables, arrays, Ring-Buffer, LRU (Least Recently Used) are some supported map types.
We will discuss in detail about different type of MAPS in upcoming blogs.

#### Helper Calls
eBPF programs are restricted from calling arbitrary kernel functions to maintain compatibility across different kernel versions. This limitation prevents eBPF programs from becoming tightly coupled with specific kernel releases, which would complicate their portability. Instead, eBPF programs can utilize a set of predefined and stable helper functions provided by the kernel. These helper functions offer a well-defined API that allows eBPF programs to perform various tasks without directly accessing the broader kernel functionality.
Few helper calls include:
- Generate random numbers
- Get current time & date
- eBPF map access
- Get process/cgroup context
- Manipulate network packets and forwarding logic

#### Tail Calls
Tail calls in eBPF allow developers to execute another eBPF program and replace the current execution context, somewhat analogous to how the `execve()` system call works for regular processes.

#### Function Calls
Function calls in eBPF allow developers to define and invoke functions within an eBPF program, enhancing code reusability and modularity.

### Why eBPF?
eBPF is a versatile technology that offers several compelling reasons for its adoption across various domains, including security, observability, and networking
#### Security
eBPF provides fine-grained control over system calls and network activities, allowing for real-time threat detection and mitigation without modifying kernel source code. Its sandboxed environment ensures stability by preventing crashes or security breaches.

#### Observability
It enables non-invasive monitoring of system events with minimal performance impact. This allows for real-time tracing and customizable monitoring solutions tailored to specific use cases

#### Performance
By executing directly within the kernel via JIT compilation, eBPF reduces latency and enhances throughput compared to traditional user-space applications. It also minimizes resource usage due to its lightweight nature.

### Where is eBPF currently used?
eBPF is currently used in a wide range of applications across various domains, including networking, security, and observability. In networking, eBPF is utilized for tasks such as traffic control, creating network policies, and connect-time load balancing in environments like Kubernetes. For security, it is employed for real-time threat detection by monitoring system calls and network activities to identify potential vulnerabilities. Additionally, eBPF enhances observability by providing granular insights into system metrics like CPU utilization and disk I/O operations. It also plays a crucial role in application performance monitoring by tracing micro-level events to optimize application performance. Tools like Cilium leverage eBPF for secure network connectivity and monitoring capabilities in cloud-native environments. Overall, its versatility makes it an essential tool across multiple industries.