---
author: Nika Natsvlishvili
pubDatetime: 2025-01-11T10:00:00.000Z
modDatetime: 2026-11-09T00:00:00.000Z
title: "System Design Series - Part 1: Fundamentals"
tags:
  - system-design
  - architecture
  - scalability
description: "The core vocabulary of system design: requirements, estimation, latency and throughput, scalability, reliability, and the trade-offs between them."
series:
  id: system-design
  order: 1
  title: "System Design Fundamentals"
references:
  - id: kleppmann2017
    title: "Designing Data-Intensive Applications"
    author: "Kleppmann, M."
    year: 2017
    journal: "O'Reilly Media"
    url: "https://dataintensive.net/"
  - id: little1961
    title: "A Proof for the Queuing Formula: L = λW"
    author: "Little, J. D. C."
    year: 1961
    journal: "Operations Research"
    doi: "10.1287/opre.9.3.383"
  - id: dean2013
    title: "The Tail at Scale"
    author: "Dean, J., & Barroso, L. A."
    year: 2013
    journal: "Communications of the ACM"
    doi: "10.1145/2408776.2408794"
  - id: brewer2012
    title: 'CAP Twelve Years Later: How the "Rules" Have Changed'
    author: "Brewer, E."
    year: 2012
    journal: "IEEE Computer"
    doi: "10.1109/MC.2012.37"
---

System design is the work of deciding what a system is made of, how those parts talk to each other, and how data moves between them, so that the whole thing meets its requirements today and can keep meeting them as load, data and the team grow. There is rarely a single correct answer. There are trade-offs, and the skill lies in knowing which ones you are making and why.

This first part builds the vocabulary the rest of the series relies on. [Part 2](/en/posts/system-design-part-2) applies it to the building blocks you reach for most often: load balancers, caches and databases.

## Table of contents

## Start With Requirements, Not Boxes

Every design discussion that starts by drawing boxes ends up redrawing them. Before choosing any technology, pin down two kinds of requirements.

**Functional requirements** say what the system does: "users can upload a photo", "a follower sees a new post in their feed". They decide which components must exist.

**Non-functional requirements** say how well it does it, and they are what actually shape the architecture:

| Requirement  | Question to ask                             | Example target             |
| ------------ | ------------------------------------------- | -------------------------- |
| Latency      | How fast must a single request feel?        | p99 read under 200 ms      |
| Throughput   | How much work per second at peak?           | 20,000 reads/s             |
| Availability | How much downtime is acceptable?            | 99.9% monthly              |
| Durability   | Can we ever lose acknowledged data?         | No acknowledged write lost |
| Consistency  | Must every reader see the latest write?     | Feed may lag up to 5 s     |
| Cost         | What is the budget per request or per user? | Under $0.001 per 1k reads  |

Two requirements that look similar often pull in opposite directions. Strong consistency across regions costs latency, and very high durability costs write throughput. Writing the targets down makes those tensions visible early, while they are still cheap to resolve.

## Back-of-the-Envelope Estimation

You do not need exact numbers to make good decisions, but you do need the right order of magnitude. A short estimate tells you whether one database will do or whether you need to partition from day one.

Take a photo-sharing service with 10 million daily active users:

- Each user views 50 photos and uploads 0.2 photos per day.
- Reads: $10^7 \times 50 = 5 \times 10^8$ per day, or about $5 \times 10^8 / 86{,}400 \approx 5{,}800$ requests per second on average.
- Peak traffic is commonly 2 to 3 times the average, so plan for roughly 15,000 reads per second.
- Writes: $10^7 \times 0.2 = 2 \times 10^6$ uploads per day, about 23 per second.
- Storage: at 2 MB per photo, that is 4 TB of new data per day, or about 1.5 PB per year before replication.

Three conclusions fall straight out of this. The workload is read-heavy by a factor of about 250, so caching and read replicas will pay off far more than write optimisation. The photo bytes belong in object storage, not in a database. And metadata (a few hundred bytes per photo) is small enough that a single well-indexed relational database could hold years of it.

A handful of latency figures are worth memorising, because they explain most architectural choices:

| Operation                          | Rough latency |
| ---------------------------------- | ------------- |
| Main memory reference              | 100 ns        |
| Read 1 MB sequentially from memory | 3 µs          |
| SSD random read                    | 16 µs         |
| Round trip within a data centre    | 0.5 ms        |
| Read 1 MB sequentially from SSD    | 50 µs – 1 ms  |
| Round trip between continents      | 150 ms        |

A memory reference is thousands of times faster than a network hop, and a network hop inside a data centre is hundreds of times faster than crossing an ocean. Caches, replicas placed near users, and batching all exist because of these ratios.

## Latency, Throughput and Little's Law

**Latency** is how long one request takes. **Throughput** is how many requests complete per unit of time. They are linked through concurrency by Little's Law <a href="#ref-little1961" class="citation-ref" aria-label="Reference [2]"><sup>[2]</sup></a>:

$$
L = \lambda W
$$

Here $L$ is the average number of requests in the system, $\lambda$ the arrival rate, and $W$ the average time each request spends inside. If your service handles 2,000 requests per second and each takes 50 ms, about $2000 \times 0.05 = 100$ requests are in flight at any moment. That number sizes your thread pools, connection pools and memory. It also shows why a slow dependency is dangerous: if $W$ doubles while $\lambda$ stays constant, the number of requests in flight doubles too, and the pools that were sized for normal operation run out.

### Measure Percentiles, Not Averages

Averages hide the experience of the users who suffer most. Report latency as percentiles: p50 (the median), p95, p99, and p99.9 for critical paths.

The tail matters more than intuition suggests. Suppose a page fans out to 100 backend calls in parallel and each call has a 1% chance of being slow. The probability that the page avoids every slow call is $0.99^{100} \approx 0.37$, so 63% of page loads hit at least one slow call. Dean and Barroso call this _the tail at scale_ <a href="#ref-dean2013" class="citation-ref" aria-label="Reference [3]"><sup>[3]</sup></a>, and techniques such as hedged requests, where you send a duplicate after a short delay and keep whichever answers first, exist specifically to tame it.

## Scalability

Scalability is the ability to handle more load by adding resources, ideally without redesigning the system. Kleppmann's advice is to describe load with concrete _load parameters_, such as requests per second, the read-to-write ratio, or the fan-out per write, and then ask what happens to performance when one of them grows <a href="#ref-kleppmann2017" class="citation-ref" aria-label="Reference [1]"><sup>[1]</sup></a>.

**Vertical scaling** (scale up) means a bigger machine. It is simple, keeps strong consistency trivially, and modern servers are enormous. Its limits are a hard ceiling, a steep price curve near the top, and a single point of failure.

**Horizontal scaling** (scale out) means more machines. It has no hard ceiling and tolerates individual failures, but it forces you to answer hard questions: how is work routed, where does state live, and what happens when machines disagree?

The single most useful habit for scaling out is to keep application servers **stateless**. When a server holds no session or user state in local memory, any instance can serve any request, so you can add or remove instances freely and a crash loses nothing. State goes to purpose-built stores, such as databases, caches and queues, which are scaled with their own techniques: replication, partitioning and caching, all covered in Part 2.

## Reliability and Availability

A **fault** is one component deviating from its specification. A **failure** is the system as a whole stopping to provide the service users expect. Reliable systems do not avoid faults, which is impossible at scale. They stop faults from turning into failures.

Availability is usually expressed in "nines":

| Availability | Downtime per year | Downtime per 30 days |
| ------------ | ----------------- | -------------------- |
| 99%          | 3.65 days         | 7.2 hours            |
| 99.9%        | 8.77 hours        | 43.2 minutes         |
| 99.99%       | 52.6 minutes      | 4.3 minutes          |
| 99.999%      | 5.26 minutes      | 26 seconds           |

Dependencies multiply. A request that must pass through three services, each 99.9% available, succeeds only $0.999^3 \approx 99.7\%$ of the time. Redundancy works the other way: two independent replicas, each 99% available, are both down only $0.01^2 = 0.01\%$ of the time, giving 99.99% for the pair. The word _independent_ carries a lot of weight there. Replicas in the same rack, on the same deployment or behind the same misconfigured DNS record fail together.

The patterns that turn this arithmetic into practice:

- **Redundancy** across failure domains: hosts, racks, availability zones, regions.
- **Timeouts** on every network call, because a call without one can wait forever.
- **Retries with exponential backoff and jitter**, limited by a retry budget so that retries cannot amplify an outage.
- **Circuit breakers** that stop calling a dependency that keeps failing and give it room to recover.
- **Graceful degradation**: serve a stale cached feed, or hide recommendations, rather than return an error page.
- **Idempotency keys** so that a retried payment or upload is applied only once.

Define availability with **SLIs** (what you measure, such as the fraction of successful requests) and **SLOs** (the target, such as 99.9% over 30 days). The gap between the SLO and 100% is your _error budget_: while it lasts, you can ship quickly, and when it runs out, reliability work takes priority.

## Maintainability

Most of a system's cost comes after launch, in operating it, debugging it and changing it. Three properties keep that cost down <a href="#ref-kleppmann2017" class="citation-ref" aria-label="Reference [1]"><sup>[1]</sup></a>:

- **Operability**: good metrics, logs and traces, safe deployments with fast rollback, and runbooks that do not rely on one person's memory.
- **Simplicity**: fewer moving parts and clear boundaries between components. Accidental complexity is the kind that comes from the implementation rather than from the problem itself.
- **Evolvability**: versioned APIs and schemas, feature flags, and data formats that tolerate fields being added.

A system that is slightly slower but that a new engineer can understand in a week often beats one that is clever and fragile.

## Consistency and the CAP Theorem

Once data is replicated, replicas can disagree. The CAP theorem says that during a network **partition**, a distributed store must choose between **consistency** (every read sees the latest write, or returns an error) and **availability** (every request gets a non-error response, possibly stale).

Brewer himself has pointed out that the popular "pick two of three" summary is misleading <a href="#ref-brewer2012" class="citation-ref" aria-label="Reference [4]"><sup>[4]</sup></a>. Partitions are not optional, so the real choice only arises while one is happening, and it can be made per operation rather than for the entire system. A bank balance may refuse writes during a partition, while the same bank's "recently viewed" list happily shows stale data.

The PACELC extension captures what happens the rest of the time: **e**lse, when there is no partition, you trade **l**atency against **c**onsistency. Synchronous replication across regions is consistent but slow, while asynchronous replication is fast but can lose recent writes when a node fails. Most real systems offer a spectrum, from linearizable reads through read-your-writes and monotonic reads to plain eventual consistency, and good designs pick the weakest model each feature can tolerate.

## Putting It Together

A repeatable approach to any design problem:

1. **Clarify requirements.** Functional scope plus explicit non-functional targets.
2. **Estimate.** Traffic, storage and bandwidth, to the nearest order of magnitude.
3. **Define the API and data model.** The interfaces outlive the implementation.
4. **Sketch the high-level design.** The simplest set of components that meets the targets.
5. **Find the bottlenecks.** Where does load concentrate, and what is the single point of failure?
6. **Scale and harden.** Add caching, replication, partitioning and the reliability patterns above, but only where the estimates say they are needed.
7. **State the trade-offs.** Every choice gives something up, so say what.

[Part 2](/en/posts/system-design-part-2) puts this into practice with the three components that show up in almost every design: load balancers, caches and databases.
