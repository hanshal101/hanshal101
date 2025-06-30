---
title: "The Complete eBPF Function Reference: A Comprehensive Guide to libbpf Functions"
dateString: 30th June 2025
draft: false
tags: ["libbpf", "eBPF", "Linux", "Kernel"]
weight: 101
---

## Motivation
The extended Berkeley Packet Filter (eBPF) has rapidly evolved from a low-level packet filtering mechanism to a powerful framework for building high-performance, programmable applications within the Linux kernel. As its ecosystem has grown, so too has the complexity of its supporting libraries. One of the famous and most reliable library developers uses is libbpf.

For developers diving into eBPF, libbpf serves as the essential user-space library to interact with BPF objects, manage maps and programs, handle kernel integration, and access advanced features like BTF (BPF Type Format). However, despite its critical role, libbpf's documentation remains fragmented, and many of its functions are poorly understood or underutilized.

I am writting this post to change that.

In this comprehensive reference guide, you'll find categorized, structured documentation of libbpf functions, complete with parameters, return types, use cases, and practical explanations. Whether you're building observability tools, network filters, or system profilers, this guide is designed to help you quickly locate and understand the exact function you need.

For reference I have taken the following libraries into consideration:
**[`libbpf`](https://github.com/libbpf/libbpf) (C/C++) and [`libbpf-rs`](https://github.com/libbpf/libbpf-rs) (Rust - I Code a lot here)** the two most widely used APIs for managing eBPF programs, maps, links, and metadata.

On top of that I'll be attaching a Google Doc at the end, just incase you wish to download this guide and modify according to your preferences.

## 1. BTF (BPF Type Format) Functions

| Function Name | Purpose | Parameters | Return Type | When to Use | Detailed Explanation |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `bpf_btf_get_fd_by_id` | Get BTF file descriptor by ID | `__u32 id` | `int` | When you need to access BTF object with known ID | Returns file descriptor for BTF object with given ID. Useful for introspection tools to examine type information of loaded programs |
| `bpf_btf_get_fd_by_id_opts` | Get BTF file descriptor by ID with options | `__u32 id`, `const struct bpf_get_fd_by_id_opts *opts` | `int` | When you need BTF access with specific options | Extended version with options like token_fd for permission delegation |
| `bpf_btf_get_info_by_fd` | Get BTF information by file descriptor | `int btf_fd`, `struct bpf_btf_info *info`, `__u32 *info_len` | `int` | When you need metadata about BTF object | Populates BTF object information structure with metadata like name, BTF data size, etc. |
| `bpf_btf_get_next_id` | Get next BTF ID | `__u32 start_id`, `__u32 *next_id` | `int` | For iterating through all BTF objects | Used by introspection tools to enumerate all loaded BTF objects in the system |
| `bpf_btf_load` | Load BTF data into kernel | `const void *btf_data`, `size_t btf_size`, `struct bpf_btf_load_opts *opts` | `int` | When loading BTF type information | Loads BTF blob into kernel, returns BTF file descriptor for use with maps and programs |
| `btf__new` | Create new BTF object from raw data | `const void *data`, `__u32 size` | `struct btf *` | When parsing BTF from ELF or raw bytes | Creates BTF object instance from raw BTF section data, used during program loading |
| `btf__free` | Free BTF object | `struct btf *btf` | `void` | When cleaning up BTF resources | Frees all memory associated with BTF object, should be called for every btf__new() |
| `btf__load_into_kernel` | Load BTF into kernel | `struct btf *btf` | `int` | When making BTF available to kernel | Uploads BTF object to kernel, making it available for program verification and map creation |
| `btf__parse` | Parse BTF from file | `const char *path`, `struct btf_ext **btf_ext` | `struct btf *` | When loading BTF from ELF file | Parses BTF section from ELF file, commonly used with compiled BPF programs |

## 2. BPF Link Management Functions

| Function Name | Purpose | Parameters | Return Type | When to Use | Detailed Explanation |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `bpf_link__destroy` | Destroy BPF link | `struct bpf_link *link` | `int` | When detaching and cleaning up program | Detaches program from kernel hook and frees all associated resources |
| `bpf_link__detach` | Detach BPF link | `struct bpf_link *link` | `int` | When you want to detach but keep link object | Detaches program from hook point but preserves link object for potential reuse |
| `bpf_link__disconnect` | Disconnect BPF link | `struct bpf_link *link` | `void` | When severing link connection | Disconnects link from underlying kernel attachment without destroying the object |
| `bpf_link__fd` | Get link file descriptor | `const struct bpf_link *link` | `int` | When you need raw FD for operations | Returns underlying file descriptor for direct syscall operations |
| `bpf_link__open` | Open existing link from filesystem | `const char *path` | `struct bpf_link *` | When loading pinned link | Opens previously pinned link from BPF filesystem |
| `bpf_link__pin` | Pin link to filesystem | `struct bpf_link *link`, `const char *path` | `int` | When persisting link beyond process lifetime | Pins link to BPF filesystem, allowing it to persist after process exits |
| `bpf_link__pin_path` | Get pin path of link | `const struct bpf_link *link` | `const char *` | When checking where link is pinned | Returns filesystem path where link is pinned, NULL if not pinned |
| `bpf_link__unpin` | Unpin link from filesystem | `struct bpf_link *link` | `int` | When removing persisted link | Removes link from filesystem, decrementing reference count |
| `bpf_link__update_map` | Update map associated with link | `struct bpf_link *link`, `const struct bpf_map *map` | `int` | When changing map for struct_ops | Updates the map associated with struct_ops link to different map |
| `bpf_link__update_program` | Update program in link | `struct bpf_link *link`, `struct bpf_program *prog` | `int` | When hot-swapping programs | Atomically replaces program in existing link without recreating attachment |
| `bpf_link_create` | Create new BPF link | `int prog_fd`, `int target_fd`, `enum bpf_attach_type attach_type`, `const struct bpf_link_create_opts *opts` | `int` | When you need low-level link control | Low-level wrapper around BPF_LINK_CREATE syscall for precise control |
| `bpf_link_detach` | Detach link by FD | `int link_fd` | `int` | When detaching using raw file descriptor | Detaches link using its file descriptor directly |
| `bpf_link_get_fd_by_id` | Get link FD by ID | `__u32 id` | `int` | When accessing link with known ID | Returns file descriptor for link with specified ID |
| `bpf_link_get_fd_by_id_opts` | Get link FD by ID with options | `__u32 id`, `const struct bpf_get_fd_by_id_opts *opts` | `int` | When accessing link with options | Extended version with additional options like token_fd |
| `bpf_link_get_info_by_fd` | Get link information | `int link_fd`, `struct bpf_link_info *info`, `__u32 *info_len` | `int` | When querying link metadata | Retrieves link information including type, program ID, and attach information |
| `bpf_link_get_next_id` | Get next link ID | `__u32 start_id`, `__u32 *next_id` | `int` | For enumerating all links | Used by introspection tools to iterate through all links in system |
| `bpf_link_update` | Update existing link | `int link_fd`, `int new_prog_fd`, `const struct bpf_link_update_opts *opts` | `int` | When replacing program in link | Updates link to use different program, useful for program hot-swapping |

## 3. BPF Map Functions

| Function Name | Purpose | Parameters | Return Type | When to Use | Detailed Explanation |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `bpf_map__attach_struct_ops` | Attach struct_ops map | `const struct bpf_map *map` | `struct bpf_link *` | When using struct_ops maps | Attaches struct_ops map to kernel subsystem, enabling callback function registration |
| `bpf_map__autoattach` | Check if map auto-attaches | `const struct bpf_map *map` | `bool` | When checking map attachment behavior | Returns whether map will automatically attach during skeleton attach phase |
| `bpf_map__autocreate` | Check if map auto-creates | `const struct bpf_map *map` | `bool` | When checking map creation behavior | Returns whether map will be automatically created during object load |
| `bpf_map__btf_key_type_id` | Get BTF key type ID | `const struct bpf_map *map` | `__u32` | When working with typed maps | Returns BTF type ID for map key, enabling type-aware operations |
| `bpf_map__btf_value_type_id` | Get BTF value type ID | `const struct bpf_map *map` | `__u32` | When working with typed maps | Returns BTF type ID for map value, used for type verification |
| `bpf_map__delete_elem` | Delete map element | `const struct bpf_map *map`, `const void *key`, `size_t key_sz`, `__u64 flags` | `int` | When removing key-value pairs | High-level wrapper for deleting map elements with size validation |
| `bpf_map__fd` | Get map file descriptor | `const struct bpf_map *map` | `int` | When you need raw FD for operations | Returns underlying file descriptor for direct map operations |
| `bpf_map__get_next_key` | Get next key in map | `const struct bpf_map *map`, `const void *cur_key`, `void *next_key`, `size_t key_sz` | `int` | When iterating through map keys | Retrieves next key for map iteration, returns -ENOENT when reaching end |
| `bpf_map__get_pin_path` | Get map pin path | `const struct bpf_map *map` | `const char *` | When checking map persistence | Returns filesystem path where map is pinned, NULL if not pinned |
| `bpf_map__ifindex` | Get map network interface index | `const struct bpf_map *map` | `__u32` | When working with device maps | Returns network interface index for device-specific maps |
| `bpf_map__initial_value` | Get map initial value | `const struct bpf_map *map`, `size_t *psize` | `void *` | When accessing global data | Returns pointer to initial data for global variable maps (bss, data, rodata) |
| `bpf_map__inner_map` | Get inner map template | `struct bpf_map *map` | `struct bpf_map *` | When working with map-in-map | Returns template map for map-in-map types (array of maps, hash of maps) |
| `bpf_map__is_internal` | Check if map is internal | `const struct bpf_map *map` | `bool` | When filtering map types | Returns true for internal maps created by libbpf (global vars, externs) |
| `bpf_map__is_pinned` | Check if map is pinned | `const struct bpf_map *map` | `bool` | When checking map persistence | Returns whether map is currently pinned to filesystem |
| `bpf_map__key_size` | Get map key size | `const struct bpf_map *map` | `__u32` | When validating key sizes | Returns size in bytes of map keys |
| `bpf_map__lookup_and_delete_elem` | Lookup and delete atomically | `const struct bpf_map *map`, `const void *key`, `size_t key_sz`, `void *value`, `size_t value_sz`, `__u64 flags` | `int` | When implementing queues/stacks | Atomically retrieves and removes element, useful for FIFO/LIFO operations |
| `bpf_map__lookup_elem` | Lookup map element | `const struct bpf_map *map`, `const void *key`, `size_t key_sz`, `void *value`, `size_t value_sz`, `__u64 flags` | `int` | When reading map values | High-level wrapper for map lookups with size validation |
| `bpf_map__map_extra` | Get map extra parameters | `const struct bpf_map *map` | `__u64` | When accessing map-specific data | Returns map-specific extra data (bloom filter hash count, etc.) |
| `bpf_map__map_flags` | Get map flags | `const struct bpf_map *map` | `__u32` | When checking map properties | Returns map creation flags (NO_PREALLOC, NUMA_NODE, etc.) |
| `bpf_map__max_entries` | Get maximum entries | `const struct bpf_map *map` | `__u32` | When checking map capacity | Returns maximum number of entries the map can hold |
| `bpf_map__name` | Get map name | `const struct bpf_map *map` | `const char *` | When identifying maps | Returns name of the map as defined in BPF program |
| `bpf_map__numa_node` | Get NUMA node | `const struct bpf_map *map` | `__u32` | When checking NUMA placement | Returns NUMA node where map memory is allocated |
| `bpf_map__pin` | Pin map to filesystem | `struct bpf_map *map`, `const char *path` | `int` | When persisting maps | Pins map to BPF filesystem for persistence beyond process lifetime |
| `bpf_map__pin_path` | Get pin path | `const struct bpf_map *map` | `const char *` | When checking pin location | Returns filesystem path where map is pinned |
| `bpf_map__reuse_fd` | Reuse existing map FD | `struct bpf_map *map`, `int fd` | `int` | When sharing maps between processes | Makes map object use existing file descriptor instead of creating new map |
| `bpf_map__set_autoattach` | Set auto-attach behavior | `struct bpf_map *map`, `bool autoattach` | `int` | When controlling attachment | Sets whether map automatically attaches during skeleton attach phase |
| `bpf_map__set_autocreate` | Set auto-create behavior | `struct bpf_map *map`, `bool autocreate` | `int` | When controlling creation | Sets whether map is automatically created during object load |
| `bpf_map__set_ifindex` | Set network interface index | `struct bpf_map *map`, `__u32 ifindex` | `int` | When binding to specific device | Sets network interface for device-specific maps |
| `bpf_map__set_initial_value` | Set initial map value | `struct bpf_map *map`, `const void *data`, `size_t size` | `int` | When initializing global data | Sets initial data for global variable maps |
| `bpf_map__set_inner_map_fd` | Set inner map FD | `struct bpf_map *map`, `int fd` | `int` | When configuring map-in-map | Sets template map for map-in-map types |
| `bpf_map__set_key_size` | Set key size | `struct bpf_map *map`, `__u32 size` | `int` | When configuring map before load | Sets size of map keys, must be called before object load |
| `bpf_map__set_map_extra` | Set map extra parameters | `struct bpf_map *map`, `__u64 map_extra` | `int` | When setting map-specific options | Sets map-specific extra parameters |
| `bpf_map__set_map_flags` | Set map flags | `struct bpf_map *map`, `__u32 flags` | `int` | When configuring map behavior | Sets map creation flags before load |
| `bpf_map__set_max_entries` | Set maximum entries | `struct bpf_map *map`, `__u32 max_entries` | `int` | When sizing maps | Sets maximum number of entries, must be called before load |
| `bpf_map__set_numa_node` | Set NUMA node | `struct bpf_map *map`, `__u32 numa_node` | `int` | When optimizing memory placement | Sets NUMA node for map memory allocation |
| `bpf_map__set_pin_path` | Set pin path | `struct bpf_map *map`, `const char *path` | `int` | When configuring persistence | Sets filesystem path for map pinning |
| `bpf_map__set_type` | Set map type | `struct bpf_map *map`, `enum bpf_map_type type` | `int` | When changing map type | Changes map type, must be called before object load |
| `bpf_map__set_value_size` | Set value size | `struct bpf_map *map`, `__u32 size` | `int` | When configuring value size | Sets size of map values, can resize global data sections |
| `bpf_map__type` | Get map type | `const struct bpf_map *map` | `enum bpf_map_type` | When checking map type | Returns the type of the map (HASH, ARRAY, etc.) |
| `bpf_map__unpin` | Unpin map from filesystem | `struct bpf_map *map`, `const char *path` | `int` | When removing persistence | Removes map from filesystem, decrementing reference count |
| `bpf_map__update_elem` | Update map element | `const struct bpf_map *map`, `const void *key`, `size_t key_sz`, `const void *value`, `size_t value_sz`, `__u64 flags` | `int` | When writing to maps | High-level wrapper for map updates with size validation |
| `bpf_map__value_size` | Get value size | `const struct bpf_map *map` | `__u32` | When validating value sizes | Returns size in bytes of map values |
| `bpf_map_create` | Create new map | `enum bpf_map_type map_type`, `const char *map_name`, `__u32 key_size`, `__u32 value_size`, `__u32 max_entries`, `const struct bpf_map_create_opts *opts` | `int` | When creating maps programmatically | Low-level map creation with precise control over all parameters |

## 4. BPF Object Functions

| Function Name | Purpose | Parameters | Return Type | When to Use | Detailed Explanation |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `bpf_object__attach_skeleton` | Attach skeleton programs | `struct bpf_object_skeleton *s` | `int` | When using skeleton-based loading | Attaches all programs in skeleton to their respective hook points |
| `bpf_object__btf` | Get object's BTF | `const struct bpf_object *obj` | `struct btf *` | When accessing type information | Returns BTF object associated with BPF object for type introspection |
| `bpf_object__btf_fd` | Get BTF file descriptor | `const struct bpf_object *obj` | `int` | When you need BTF FD | Returns file descriptor of BTF object associated with BPF object |
| `bpf_object__close` | Close BPF object | `struct bpf_object *obj` | `void` | When cleaning up | Frees all resources associated with BPF object |
| `bpf_object__destroy_skeleton` | Destroy skeleton | `struct bpf_object_skeleton *s` | `void` | When cleaning up skeleton | Frees all skeleton resources including maps, programs, and links |
| `bpf_object__destroy_subskeleton` | Destroy subskeleton | `struct bpf_object_subskeleton *s` | `void` | When cleaning up subskeleton | Frees subskeleton resources for partial object access |
| `bpf_object__detach_skeleton` | Detach skeleton programs | `struct bpf_object_skeleton *s` | `void` | When detaching all programs | Detaches all programs in skeleton from their hook points |
| `bpf_object__find_map_by_name` | Find map by name | `const struct bpf_object *obj`, `const char *name` | `struct bpf_map *` | When accessing specific maps | Locates map within object by name, returns NULL if not found |
| `bpf_object__find_map_fd_by_name` | Find map FD by name | `const struct bpf_object *obj`, `const char *name` | `int` | When you need map FD directly | Returns file descriptor of named map, -1 if not found |
| `bpf_object__find_program_by_name` | Find program by name | `const struct bpf_object *obj`, `const char *name` | `struct bpf_program *` | When accessing specific programs | Locates program within object by name |
| `bpf_object__gen_loader` | Generate loader program | `struct bpf_object *obj`, `struct gen_loader_opts *opts` | `int` | When creating loader programs | Generates BPF program that can load the object at runtime |
| `bpf_object__kversion` | Get kernel version | `const struct bpf_object *obj` | `unsigned int` | When checking version requirements | Returns kernel version the object was compiled for |
| `bpf_object__load` | Load object into kernel | `struct bpf_object *obj` | `int` | When loading all programs and maps | Loads all programs and maps in object into kernel |
| `bpf_object__load_skeleton` | Load skeleton | `struct bpf_object_skeleton *s` | `int` | When using skeleton loading | Loads all skeleton components into kernel |
| `bpf_object__name` | Get object name | `const struct bpf_object *obj` | `const char *` | When identifying objects | Returns name of the BPF object |
| `bpf_object__next_map` | Get next map | `const struct bpf_object *obj`, `const struct bpf_map *map` | `struct bpf_map *` | When iterating through maps | Iterates through all maps in object, NULL to start |
| `bpf_object__next_program` | Get next program | `const struct bpf_object *obj`, `struct bpf_program *prog` | `struct bpf_program *` | When iterating through programs | Iterates through all programs in object, NULL to start |
| `bpf_object__open` | Open BPF object file | `const char *path` | `struct bpf_object *` | When loading from ELF file | Opens and parses BPF ELF object file |
| `bpf_object__open_file` | Open with options | `const char *path`, `const struct bpf_object_open_opts *opts` | `struct bpf_object *` | When you need open options | Extended open with options like BTF custom path |
| `bpf_object__open_mem` | Open from memory | `const void *obj_buf`, `size_t obj_buf_sz`, `const struct bpf_object_open_opts *opts` | `struct bpf_object *` | When loading from memory buffer | Opens BPF object from memory buffer instead of file |
| `bpf_object__open_skeleton` | Open skeleton | `struct bpf_object_skeleton *s`, `const struct bpf_object_open_opts *opts` | `int` | When using skeleton loading | Opens skeleton object with specified options |
| `bpf_object__open_subskeleton` | Open subskeleton | `struct bpf_object_subskeleton *s` | `int` | When accessing partial object | Opens subskeleton for accessing subset of object components |
| `bpf_object__pin` | Pin entire object | `struct bpf_object *object`, `const char *path` | `int` | When persisting entire object | Pins all maps and programs in object to filesystem directory |
| `bpf_object__pin_maps` | Pin all maps | `struct bpf_object *obj`, `const char *path` | `int` | When persisting maps only | Pins all maps in object to specified directory |
| `bpf_object__pin_programs` | Pin all programs | `struct bpf_object *obj`, `const char *path` | `int` | When persisting programs | Pins all programs in object to filesystem directory |
| `bpf_object__prev_map` | Get previous map | `const struct bpf_object *obj`, `const struct bpf_map *map` | `struct bpf_map *` | When reverse-iterating maps | Reverse iteration through maps in object |
| `bpf_object__prev_program` | Get previous program | `const struct bpf_object *obj`, `struct bpf_program *prog` | `struct bpf_program *` | When reverse-iterating programs | Reverse iteration through programs in object |
| `bpf_object__set_kversion` | Set kernel version | `struct bpf_object *obj`, `__u32 kern_version` | `int` | When targeting specific kernel | Sets target kernel version for compatibility |
| `bpf_object__token_fd` | Get token file descriptor | `const struct bpf_object *obj` | `int` | When using delegation tokens | Returns BPF token FD for permission delegation |
| `bpf_object__unpin` | Unpin entire object | `struct bpf_object *object`, `const char *path` | `int` | When removing object persistence | Unpins all object components from filesystem |
| `bpf_object__unpin_maps` | Unpin all maps | `struct bpf_object *obj`, `const char *path` | `int` | When removing map persistence | Unpins all maps from filesystem directory |
| `bpf_object__unpin_programs` | Unpin all programs | `struct bpf_object *obj`, `const char *path` | `int` | When removing program persistence | Unpins all programs from filesystem directory |

## 5. BPF Program Functions

| Function Name | Purpose | Parameters | Return Type | When to Use | Detailed Explanation |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `bpf_program__attach` | Generic program attachment | `const struct bpf_program *prog` | `struct bpf_link *` | When using auto-detection | Automatically detects program type and attaches appropriately |
| `bpf_program__attach_cgroup` | Attach to cgroup | `const struct bpf_program *prog`, `int cgroup_fd` | `struct bpf_link *` | When filtering cgroup operations | Attaches program to cgroup for network or process filtering |
| `bpf_program__attach_freplace` | Attach as function replacement | `const struct bpf_program *prog`, `int target_fd`, `const char *attach_func_name` | `struct bpf_link *` | When replacing kernel functions | Replaces existing BPF program function with new implementation |
| `bpf_program__attach_iter` | Attach to iterator | `const struct bpf_program *prog`, `const struct bpf_iter_attach_opts *opts` | `struct bpf_link *` | When creating BPF iterators | Attaches program to BPF iterator for custom data traversal |
| `bpf_program__attach_kprobe` | Attach to kernel probe | `const struct bpf_program *prog`, `bool retprobe`, `const char *func_name` | `struct bpf_link *` | When tracing kernel functions | Attaches to kernel function entry or exit for tracing |
| `bpf_program__attach_kprobe_multi_opts` | Attach to multiple kprobes | `const struct bpf_program *prog`, `const char *pattern`, `const struct bpf_kprobe_multi_opts *opts` | `struct bpf_link *` | When tracing multiple functions | Attaches to multiple kernel functions matching pattern |
| `bpf_program__attach_kprobe_opts` | Attach kprobe with options | `const struct bpf_program *prog`, `const char *func_name`, `const struct bpf_kprobe_opts *opts` | `struct bpf_link *` | When you need kprobe options | Extended kprobe attachment with custom options like offset, cookie |
| `bpf_program__attach_ksyscall` | Attach to system call | `const struct bpf_program *prog`, `const char *syscall_name`, `const struct bpf_ksyscall_opts *opts` | `struct bpf_link *` | When tracing system calls | Attaches to kernel system call handlers with arch-independence |
| `bpf_program__attach_lsm` | Attach to LSM hook | `const struct bpf_program *prog` | `struct bpf_link *` | When implementing security policies | Attaches to Linux Security Module hooks for security enforcement |
| `bpf_program__attach_netfilter` | Attach to netfilter | `const struct bpf_program *prog`, `const struct bpf_netfilter_opts *opts` | `struct bpf_link *` | When filtering network packets | Attaches to netfilter hooks for packet filtering |
| `bpf_program__attach_netkit` | Attach to netkit device | `const struct bpf_program *prog`, `int ifindex`, `const struct bpf_netkit_opts *opts` | `struct bpf_link *` | When working with netkit devices | Attaches program to netkit virtual network device |
| `bpf_program__attach_netns` | Attach to network namespace | `const struct bpf_program *prog`, `int netns_fd` | `struct bpf_link *` | When filtering per-netns | Attaches program to specific network namespace |
| `bpf_program__attach_perf_event` | Attach to perf event | `const struct bpf_program *prog`, `int pfd` | `struct bpf_link *` | When monitoring performance | Attaches to perf event for performance monitoring |
| `bpf_program__attach_perf_event_opts` | Attach to perf event with options | `const struct bpf_program *prog`, `int pfd`, `const struct bpf_perf_event_opts *opts` | `struct bpf_link *` | When you need perf options | Extended perf event attachment with custom options |
| `bpf_program__attach_raw_tracepoint` | Attach to raw tracepoint | `const struct bpf_program *prog`, `const char *tp_name` | `struct bpf_link *` | When you need low-latency tracing | Attaches to raw kernel tracepoints for minimal overhead |
| `bpf_program__attach_raw_tracepoint_opts` | Attach raw tracepoint with options | `const struct bpf_program *prog`, `const char *tp_name`, `struct bpf_raw_tracepoint_opts *opts` | `struct bpf_link *` | When you need raw tracepoint options | Extended raw tracepoint with additional options |
| `bpf_program__attach_sockmap` | Attach to socket map | `const struct bpf_program *prog`, `int map_fd` | `struct bpf_link *` | When redirecting sockets | Attaches program to socket map for socket redirection |
| `bpf_program__attach_tcx` | Attach to TC express | `const struct bpf_program *prog`, `int ifindex`, `const struct bpf_tcx_opts *opts` | `struct bpf_link *` | When using TC express datapath | Attaches to traffic control express path for high-performance packet processing |
| `bpf_program__attach_trace` | Attach tracing program | `const struct bpf_program *prog` | `struct bpf_link *` | When tracing with fentry/fexit | Attaches tracing programs like fentry, fexit, fmod_ret |
| `bpf_program__attach_trace_opts` | Attach trace with options | `const struct bpf_program *prog`, `const struct bpf_trace_opts *opts` | `struct bpf_link *` | When you need trace options | Extended tracing attachment with additional options |
| `bpf_program__attach_tracepoint` | Attach to tracepoint | `const struct bpf_program *prog`, `const char *tp_category`, `const char *tp_name` | `struct bpf_link *` | When tracing specific events | Attaches to kernel tracepoints for event monitoring |
| `bpf_program__attach_tracepoint_opts` | Attach tracepoint with options | `const struct bpf_program *prog`, `const char *tp_category`, `const char *tp_name`, `const struct bpf_tracepoint_opts *opts` | `struct bpf_link *` | When you need tracepoint options | Extended tracepoint attachment with custom options |
| `bpf_program__attach_uprobe` | Attach to user probe | `const struct bpf_program *prog`, `bool retprobe`, `pid_t pid`, `const char *binary_path`, `size_t func_offset` | `struct bpf_link *` | When tracing userspace functions | Attaches to userspace function for application tracing |
| `bpf_program__attach_uprobe_multi` | Attach to multiple uprobes | `const struct bpf_program *prog`, `pid_t pid`, `const char *binary_path`, `const char *func_pattern`, `const struct bpf_uprobe_multi_opts *opts` | `struct bpf_link *` | When tracing multiple user functions | Attaches to multiple userspace functions matching pattern |
| `bpf_program__attach_uprobe_opts` | Attach uprobe with options | `const struct bpf_program *prog`, `pid_t pid`, `const char *binary_path`, `size_t func_offset`, `const struct bpf_uprobe_opts *opts` | `struct bpf_link *` | When you need uprobe options | Extended uprobe attachment with custom options |
| `bpf_program__attach_usdt` | Attach to USDT probe | `const struct bpf_program *prog`, `pid_t pid`, `const char *binary_path`, `const char *usdt_provider`, `const char *usdt_name`, `const struct bpf_usdt_opts *opts` | `struct bpf_link *` | When tracing USDT probes | Attaches to User Statically Defined Tracepoints |
| `bpf_program__attach_xdp` | Attach to XDP | `const struct bpf_program *prog`, `int ifindex` | `struct bpf_link *` | When processing packets at driver level | Attaches XDP program to network interface for early packet processing |
| `bpf_program__autoattach` | Check auto-attach status | `const struct bpf_program *prog` | `bool` | When checking attachment behavior | Returns whether program will auto-attach during skeleton attach |
| `bpf_program__autoload` | Check auto-load status | `const struct bpf_program *prog` | `bool` | When checking load behavior | Returns whether program will be loaded automatically |
| `bpf_program__expected_attach_type` | Get expected attach type | `const struct bpf_program *prog` | `enum bpf_attach_type` | When querying attach requirements | Returns the expected attachment type for the program |
| `bpf_program__fd` | Get program file descriptor | `const struct bpf_program *prog` | `int` | When you need raw FD | Returns underlying file descriptor for direct operations |
| `bpf_program__flags` | Get program flags | `const struct bpf_program *prog` | `__u32` | When checking program properties | Returns program load flags |
| `bpf_program__get_expected_attach_type` | Get expected attach type | `const struct bpf_program *prog` | `enum bpf_attach_type` | When querying attachment requirements | Alias for bpf_program__expected_attach_type |
| `bpf_program__get_type` | Get program type | `const struct bpf_program *prog` | `enum bpf_prog_type` | When checking program type | Returns the BPF program type |
| `bpf_program__insn_cnt` | Get instruction count | `const struct bpf_program *prog` | `size_t` | When analyzing program size | Returns number of BPF instructions in program |
| `bpf_program__insns` | Get program instructions | `const struct bpf_program *prog` | `const struct bpf_insn *` | When analyzing program code | Returns pointer to BPF instruction array |
| `bpf_program__log_buf` | Get program log buffer | `const struct bpf_program *prog`, `size_t *log_size` | `const char *` | When debugging program loading | Returns verifier log buffer for debugging |
| `bpf_program__log_level` | Get log level | `const struct bpf_program *prog` | `__u32` | When checking debug settings | Returns current verifier log level |
| `bpf_program__name` | Get program name | `const struct bpf_program *prog` | `const char *` | When identifying programs | Returns name of the BPF program |
| `bpf_program__pin` | Pin program to filesystem | `struct bpf_program *prog`, `const char *path` | `int` | When persisting programs | Pins program to BPF filesystem for persistence |
| `bpf_program__section_name` | Get section name | `const struct bpf_program *prog` | `const char *` | When checking program source | Returns ELF section name where program was defined |
| `bpf_program__set_attach_target` | Set attach target | `struct bpf_program *prog`, `int attach_prog_fd`, `const char *attach_func_name` | `int` | When setting BTF attach targets | Sets target for BTF-aware programs (fentry, fexit, etc.) |
| `bpf_program__set_autoattach` | Set auto-attach behavior | `struct bpf_program *prog`, `bool autoattach` | `void` | When controlling attachment | Sets whether program auto-attaches during skeleton attach |
| `bpf_program__set_autoload` | Set auto-load behavior | `struct bpf_program *prog`, `bool autoload` | `int` | When controlling loading | Sets whether program loads automatically |
| `bpf_program__set_expected_attach_type` | Set expected attach type | `struct bpf_program *prog`, `enum bpf_attach_type type` | `int` | When configuring attachment | Sets expected attachment type for program |
| `bpf_program__set_flags` | Set program flags | `struct bpf_program *prog`, `__u32 flags` | `int` | When configuring load behavior | Sets program loading flags |
| `bpf_program__set_ifindex` | Set interface index | `struct bpf_program *prog`, `__u32 ifindex` | `void` | When targeting specific interfaces | Sets network interface index for device-specific programs |
| `bpf_program__set_insns` | Set program instructions | `struct bpf_program *prog`, `struct bpf_insn *new_insns`, `size_t new_insn_cnt` | `int` | When modifying program code | Replaces program instructions (advanced use only) |
| `bpf_program__set_log_buf` | Set log buffer | `struct bpf_program *prog`, `char *log_buf`, `size_t log_size` | `int` | When capturing verifier output | Sets buffer for verifier log messages |
| `bpf_program__set_log_level` | Set log level | `struct bpf_program *prog`, `__u32 log_level` | `int` | When configuring debug output | Sets verifier log verbosity level |
| `bpf_program__set_type` | Set program type | `struct bpf_program *prog`, `enum bpf_prog_type type` | `int` | When changing program type | Sets BPF program type, must be called before load |
| `bpf_program__type` | Get program type | `const struct bpf_program *prog` | `enum bpf_prog_type` | When checking program type | Returns the BPF program type |
| `bpf_program__unload` | Unload program | `struct bpf_program *prog` | `void` | When removing from kernel | Removes program from kernel, making it loadable again |
| `bpf_program__unpin` | Unpin program | `struct bpf_program *prog`, `const char *path` | `int` | When removing persistence | Removes program from filesystem |

## 6. Ring Buffer Functions

| Function Name | Purpose | Parameters | Return Type | When to Use | Detailed Explanation |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `ring_buffer__new` | Create ring buffer manager | `int map_fd`, `ring_buffer_sample_fn sample_cb`, `void *ctx`, `const struct ring_buffer_opts *opts` | `struct ring_buffer *` | When setting up efficient data transfer | Creates ring buffer manager for high-performance data streaming from kernel to userspace |
| `ring_buffer__free` | Free ring buffer | `struct ring_buffer *rb` | `void` | When cleaning up | Frees all resources associated with ring buffer manager |
| `ring_buffer__add` | Add ring buffer | `struct ring_buffer *rb`, `int map_fd`, `ring_buffer_sample_fn sample_cb`, `void *ctx` | `int` | When managing multiple ring buffers | Adds additional ring buffer to existing manager |
| `ring_buffer__poll` | Poll for data | `struct ring_buffer *rb`, `int timeout_ms` | `int` | When waiting for data | Polls ring buffer for new data with timeout |
| `ring_buffer__consume` | Consume available data | `struct ring_buffer *rb` | `int` | When processing all available data | Consumes all available data without blocking |
| `ring_buffer__consume_n` | Consume N records | `struct ring_buffer *rb`, `size_t n` | `int` | When limiting processing | Consumes up to N records from ring buffer |
| `ring_buffer__epoll_fd` | Get epoll file descriptor | `const struct ring_buffer *rb` | `int` | When integrating with event loops | Returns FD for epoll integration in event-driven applications |
| `ring_buffer__ring` | Get individual ring | `struct ring_buffer *rb`, `unsigned int idx` | `struct ring *` | When accessing specific rings | Returns specific ring buffer instance from manager |
| `user_ring_buffer__new` | Create user ring buffer | `int map_fd`, `const struct user_ring_buffer_opts *opts` | `struct user_ring_buffer *` | When userspace needs to send data to kernel | Creates ring buffer for userspace-to-kernel communication |
| `user_ring_buffer__reserve` | Reserve buffer space | `struct user_ring_buffer *rb`, `__u32 size` | `void *` | When writing to ring buffer | Reserves space in ring buffer for writing data |
| `user_ring_buffer__reserve_blocking` | Reserve with blocking | `struct user_ring_buffer *rb`, `__u32 size`, `int timeout_ms` | `void *` | When blocking until space available | Blocks until space becomes available in ring buffer |
| `user_ring_buffer__submit` | Submit reserved data | `struct user_ring_buffer *rb`, `void *sample` | `void` | When finalizing data write | Submits previously reserved data to ring buffer |
| `user_ring_buffer__discard` | Discard reserved data | `struct user_ring_buffer *rb`, `void *sample` | `void` | When canceling write operation | Discards previously reserved space without writing |
| `user_ring_buffer__free` | Free user ring buffer | `struct user_ring_buffer *rb` | `void` | When cleaning up | Frees user ring buffer resources |

## 7. Performance Buffer Functions

| Function Name | Purpose | Parameters | Return Type | When to Use | Detailed Explanation |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `perf_buffer__new` | Create performance buffer | `int map_fd`, `size_t page_cnt`, `perf_buffer_sample_fn sample_cb`, `perf_buffer_lost_fn lost_cb`, `void *ctx`, `const struct perf_buffer_opts *opts` | `struct perf_buffer *` | When using perf events for data transfer | Creates performance event buffer for kernel-to-userspace communication |
| `perf_buffer__new_raw` | Create raw performance buffer | `int map_fd`, `size_t page_cnt`, `struct perf_event_attr *attr`, `perf_buffer_event_fn event_cb`, `void *ctx`, `const struct perf_buffer_raw_opts *opts` | `struct perf_buffer *` | When you need custom perf event attributes | Creates perf buffer with custom performance event configuration |
| `perf_buffer__free` | Free performance buffer | `struct perf_buffer *pb` | `void` | When cleaning up | Frees all performance buffer resources |
| `perf_buffer__epoll_fd` | Get epoll file descriptor | `const struct perf_buffer *pb` | `int` | When integrating with event loops | Returns FD for epoll integration |
| `perf_buffer__poll` | Poll for events | `struct perf_buffer *pb`, `int timeout_ms` | `int` | When waiting for perf events | Polls performance buffer for new events |
| `perf_buffer__consume` | Consume all events | `struct perf_buffer *pb` | `int` | When processing all available events | Consumes all available events without blocking |
| `perf_buffer__consume_buffer` | Consume specific buffer | `struct perf_buffer *pb`, `size_t buf_idx` | `int` | When processing specific CPU buffer | Consumes events from specific per-CPU buffer |
| `perf_buffer__buffer_cnt` | Get buffer count | `const struct perf_buffer *pb` | `size_t` | When checking buffer configuration | Returns number of per-CPU buffers |
| `perf_buffer__buffer_fd` | Get buffer file descriptor | `const struct perf_buffer *pb`, `size_t buf_idx` | `int` | When accessing specific buffer FD | Returns FD for specific per-CPU buffer |
| `perf_buffer__buffer` | Get raw buffer data | `struct perf_buffer *pb`, `int buf_idx`, `void **buf`, `size_t *buf_size` | `int` | When implementing custom event processing | Returns raw mmap'd buffer for custom processing |

## 8. Utility Functions

| Function Name | Purpose | Parameters | Return Type | When to Use | Detailed Explanation |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `libbpf_get_error` | Extract error from pointer | `const void *ptr` | `long` | When checking libbpf API errors | Extracts error code from libbpf function pointers (deprecated in 1.0) |
| `libbpf_major_version` | Get major version | `void` | `__u32` | When checking libbpf version | Returns major version number of libbpf library |
| `libbpf_minor_version` | Get minor version | `void` | `__u32` | When checking libbpf version | Returns minor version number of libbpf library |
| `libbpf_version_string` | Get version string | `void` | `const char *` | When displaying version info | Returns human-readable version string |
| `libbpf_strerror` | Get error string | `int err`, `char *buf`, `size_t size` | `int` | When formatting error messages | Converts error code to human-readable string |
| `libbpf_set_print` | Set print callback | `libbpf_print_fn_t fn` | `libbpf_print_fn_t` | When customizing debug output | Sets custom function for libbpf debug/error messages |
| `libbpf_num_possible_cpus` | Get CPU count | `void` | `int` | When sizing per-CPU data structures | Returns number of possible CPUs for per-CPU map sizing |
| `libbpf_find_kernel_btf` | Find kernel BTF | `void` | `struct btf *` | When accessing kernel type info | Locates and loads kernel BTF for type information |
| `libbpf_find_vmlinux_btf_id` | Find kernel function BTF ID | `const char *name`, `enum bpf_attach_type attach_type` | `int` | When working with kernel functions | Finds BTF ID for kernel function by name |
| `libbpf_attach_type_by_name` | Get attach type by name | `const char *name`, `enum bpf_attach_type *attach_type` | `int` | When parsing attach type strings | Converts attach type name to enum value |
| `libbpf_prog_type_by_name` | Get program type by name | `const char *name`, `enum bpf_prog_type *prog_type`, `enum bpf_attach_type *expected_attach_type` | `int` | When parsing program type strings | Converts program type name to enum values |
| `libbpf_bpf_attach_type_str` | Get attach type string | `enum bpf_attach_type t` | `const char *` | When displaying attach types | Converts attach type enum to string representation |
| `libbpf_bpf_link_type_str` | Get link type string | `enum bpf_link_type t` | `const char *` | When displaying link types | Converts link type enum to string representation |
| `libbpf_bpf_map_type_str` | Get map type string | `enum bpf_map_type t` | `const char *` | When displaying map types | Converts map type enum to string representation |
| `libbpf_bpf_prog_type_str` | Get program type string | `enum bpf_prog_type t` | `const char *` | When displaying program types | Converts program type enum to string representation |
| `libbpf_probe_bpf_helper` | Probe helper availability | `enum bpf_prog_type prog_type`, `enum bpf_func_id helper_id`, `const void *opts` | `int` | When checking feature support | Tests if specific helper is available for program type |
| `libbpf_probe_bpf_map_type` | Probe map type support | `enum bpf_map_type map_type`, `const void *opts` | `int` | When checking map support | Tests if specific map type is supported by kernel |
| `libbpf_probe_bpf_prog_type` | Probe program type support | `enum bpf_prog_type prog_type`, `const void *opts` | `int` | When checking program support | Tests if specific program type is supported |
| `libbpf_set_memlock_rlim` | Set memory lock limit | `size_t memlock_bytes` | `int` | When configuring memory limits | Sets RLIMIT_MEMLOCK for BPF memory allocation |
| `libbpf_set_strict_mode` | Set strict mode | `enum libbpf_strict_mode mode` | `int` | When enabling strict error handling | Enables strict mode for cleaner error handling |
| `libbpf_register_prog_handler` | Register program handler | `const char *sec`, `enum bpf_prog_type prog_type`, `enum bpf_attach_type exp_attach_type`, `const struct libbpf_prog_handler_opts *opts` | `int` | When extending libbpf | Registers custom program section handler |
| `libbpf_unregister_prog_handler` | Unregister program handler | `int handler_id` | `int` | When cleaning up handlers | Removes previously registered program handler |

## 9. BPF Linker Functions

| Function Name | Purpose | Parameters | Return Type | When to Use | Detailed Explanation |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `bpf_linker__new` | Create new linker | `const char *filename`, `struct bpf_linker_opts *opts` | `struct bpf_linker *` | When linking multiple BPF objects | Creates linker for combining multiple BPF object files |
| `bpf_linker__add_file` | Add file to linker | `struct bpf_linker *linker`, `const char *filename`, `const struct bpf_linker_file_opts *opts` | `int` | When adding object files | Adds BPF object file to linker for combination |
| `bpf_linker__finalize` | Finalize linking | `struct bpf_linker *linker` | `int` | When completing link process | Finalizes linking process and generates output |
| `bpf_linker__free` | Free linker | `struct bpf_linker *linker` | `void` | When cleaning up linker | Frees all linker resources |

## 10. Low-Level BPF System Call Wrappers

| Function Name | Purpose | Parameters | Return Type | When to Use | Detailed Explanation |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `bpf_enable_stats` | Enable BPF statistics | `enum bpf_stats_type type` | `int` | When enabling runtime statistics | Enables BPF runtime statistics collection |
| `bpf_iter_create` | Create BPF iterator | `int link_fd` | `int` | When creating custom iterators | Creates iterator from BPF link for data traversal |
| `bpf_obj_get` | Get object from filesystem | `const char *pathname` | `int` | When loading pinned objects | Loads pinned BPF object from filesystem |
| `bpf_obj_get_info_by_fd` | Get object info by FD | `int bpf_fd`, `void *info`, `__u32 *info_len` | `int` | When querying object metadata | Generic object information retrieval |
| `bpf_obj_get_opts` | Get object with options | `const char *pathname`, `const struct bpf_obj_get_opts *opts` | `int` | When loading with specific options | Extended object loading with options |
| `bpf_obj_pin` | Pin object to filesystem | `int fd`, `const char *pathname` | `int` | When persisting objects | Pins BPF object to filesystem for persistence |
| `bpf_obj_pin_opts` | Pin object with options | `int fd`, `const char *pathname`, `const struct bpf_obj_pin_opts *opts` | `int` | When pinning with options | Extended pinning with additional options |
| `bpf_prog_attach` | Attach program | `int prog_fd`, `int attachable_fd`, `enum bpf_attach_type type`, `unsigned int flags` | `int` | When attaching with raw FDs | Low-level program attachment using file descriptors |
| `bpf_prog_attach_opts` | Attach program with options | `int prog_fd`, `int target`, `enum bpf_attach_type type`, `const struct bpf_prog_attach_opts *opts` | `int` | When you need attach options | Extended program attachment with additional options |
| `bpf_prog_bind_map` | Bind program to map | `int prog_fd`, `int map_fd`, `const struct bpf_prog_bind_opts *opts` | `int` | When pre-binding programs to maps | Associates program with map for optimization |
| `bpf_prog_detach` | Detach program | `int attachable_fd`, `enum bpf_attach_type type` | `int` | When detaching by type | Detaches program from attachment point by type |
| `bpf_prog_detach2` | Detach specific program | `int prog_fd`, `int attachable_fd`, `enum bpf_attach_type type` | `int` | When detaching specific program | Detaches specific program by file descriptor |
| `bpf_prog_detach_opts` | Detach with options | `int prog_fd`, `int target`, `enum bpf_attach_type type`, `const struct bpf_prog_detach_opts *opts` | `int` | When you need detach options | Extended program detachment with options |
| `bpf_prog_get_fd_by_id` | Get program FD by ID | `__u32 id` | `int` | When accessing program by ID | Returns file descriptor for program with specified ID |
| `bpf_prog_get_fd_by_id_opts` | Get program FD with options | `__u32 id`, `const struct bpf_get_fd_by_id_opts *opts` | `int` | When you need access options | Extended FD retrieval with options |
| `bpf_prog_get_info_by_fd` | Get program info | `int prog_fd`, `struct bpf_prog_info *info`, `__u32 *info_len` | `int` | When querying program metadata | Retrieves detailed program information |
| `bpf_prog_get_next_id` | Get next program ID | `__u32 start_id`, `__u32 *next_id` | `int` | When enumerating programs | Iterates through all loaded programs |
| `bpf_prog_load` | Load program into kernel | `enum bpf_prog_type prog_type`, `const char *prog_name`, `const char *license`, `const struct bpf_insn *insns`, `size_t insn_cnt`, `struct bpf_prog_load_opts *opts` | `int` | When loading with precise control | Low-level program loading with full control over parameters |
| `bpf_prog_query` | Query attached programs | `int target_fd`, `enum bpf_attach_type type`, `__u32 query_flags`, `__u32 *attach_flags`, `__u32 *prog_ids`, `__u32 *prog_cnt` | `int` | When listing attached programs | Queries programs attached to specific target |
| `bpf_prog_query_opts` | Query with options | `int target`, `enum bpf_attach_type type`, `struct bpf_prog_query_opts *opts` | `int` | When you need query options | Extended program querying with options |
| `bpf_prog_test_run_opts` | Test program execution | `int prog_fd`, `struct bpf_test_run_opts *opts` | `int` | When testing programs | Runs program in test mode with provided input |
| `bpf_raw_tracepoint_open` | Open raw tracepoint | `const char *name`, `int prog_fd` | `int` | When using raw tracepoints | Opens raw tracepoint for minimal-overhead tracing |
| `bpf_raw_tracepoint_open_opts` | Open raw tracepoint with options | `int prog_fd`, `struct bpf_raw_tp_opts *opts` | `int` | When you need raw tracepoint options | Extended raw tracepoint opening |
| `bpf_task_fd_query` | Query task file descriptor | `int pid`, `int fd`, `__u32 flags`, `char *buf`, `__u32 *buf_len`, `__u32 *prog_id`, `__u32 *fd_type`, `__u64 *probe_offset`, `__u64 *probe_addr` | `int` | When debugging attachments | Queries information about BPF programs attached to task |
| `bpf_token_create` | Create BPF token | `int bpffs_fd`, `struct bpf_token_create_opts *opts` | `int` | When delegating permissions | Creates token for permission delegation to non-privileged processes |

## 11. Traffic Control Functions

| Function Name | Purpose | Parameters | Return Type | When to Use | Detailed Explanation |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `bpf_tc_attach` | Attach TC program | `const struct bpf_tc_hook *hook`, `struct bpf_tc_opts *opts` | `int` | When attaching to traffic control | Attaches BPF program to traffic control hook for packet processing |
| `bpf_tc_detach` | Detach TC program | `const struct bpf_tc_hook *hook`, `const struct bpf_tc_opts *opts` | `int` | When removing TC attachment | Detaches BPF program from traffic control hook |
| `bpf_tc_hook_create` | Create TC hook | `struct bpf_tc_hook *hook` | `int` | When setting up TC infrastructure | Creates traffic control hook for program attachment |
| `bpf_tc_hook_destroy` | Destroy TC hook | `struct bpf_tc_hook *hook` | `int` | When cleaning up TC hooks | Destroys traffic control hook |
| `bpf_tc_query` | Query TC programs | `const struct bpf_tc_hook *hook`, `struct bpf_tc_opts *opts` | `int` | When listing TC programs | Queries programs attached to traffic control hook |

## 12. XDP Functions

| Function Name | Purpose | Parameters | Return Type | When to Use | Detailed Explanation |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `bpf_xdp_attach` | Attach XDP program | `int ifindex`, `int prog_fd`, `__u32 flags`, `const struct bpf_xdp_attach_opts *opts` | `int` | When attaching to network interface | Attaches XDP program to network interface for early packet processing |
| `bpf_xdp_detach` | Detach XDP program | `int ifindex`, `__u32 flags`, `const struct bpf_xdp_attach_opts *opts` | `int` | When removing XDP attachment | Detaches XDP program from network interface |
| `bpf_xdp_query` | Query XDP programs | `int ifindex`, `int flags`, `struct bpf_xdp_query_opts *opts` | `int` | When checking XDP status | Queries XDP programs attached to interface |
| `bpf_xdp_query_id` | Query XDP program ID | `int ifindex`, `int flags`, `__u32 *prog_id` | `int` | When getting attached program ID | Returns ID of XDP program attached to interface |

### Google Doc Link : https://docs.google.com/document/d/1ZgRbRbFUFqVlhRi7jPir8cwVJ1i7Gw_YY1rJ-TLNPSY/edit?usp=sharing
