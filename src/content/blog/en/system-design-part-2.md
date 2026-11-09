---
author: Nika Natsvlishvili
pubDatetime: 2025-01-11T11:00:00.000Z
modDatetime: 2026-11-09T00:00:00.000Z
title: "System Design Series - Part 2: Load Balancing, Caching and Databases"
tags:
  - system-design
  - architecture
  - scalability
  - databases
description: "How load balancers, caches and databases scale: balancing algorithms, cache patterns, replication, partitioning and consistent hashing."
series:
  id: system-design
  order: 2
  title: "System Design Fundamentals"
references:
  - id: mitzenmacher2001
    title: "The Power of Two Choices in Randomized Load Balancing"
    author: "Mitzenmacher, M."
    year: 2001
    journal: "IEEE Transactions on Parallel and Distributed Systems"
    doi: "10.1109/71.963420"
  - id: nishtala2013
    title: "Scaling Memcache at Facebook"
    author: "Nishtala, R., et al."
    year: 2013
    journal: "USENIX NSDI"
    url: "https://www.usenix.org/conference/nsdi13/technical-sessions/presentation/nishtala"
  - id: karger1997
    title: "Consistent Hashing and Random Trees: Distributed Caching Protocols for Relieving Hot Spots on the World Wide Web"
    author: "Karger, D., et al."
    year: 1997
    journal: "ACM Symposium on Theory of Computing"
    doi: "10.1145/258533.258660"
  - id: decandia2007
    title: "Dynamo: Amazon's Highly Available Key-value Store"
    author: "DeCandia, G., et al."
    year: 2007
    journal: "ACM SIGOPS Symposium on Operating Systems Principles"
    doi: "10.1145/1294261.1294281"
---

[Part 1](/en/posts/system-design-part-1) introduced the vocabulary: requirements, estimation, latency percentiles, scalability, availability and consistency. This part applies it to the three components that appear in almost every design. A **load balancer** spreads requests across stateless servers, a **cache** keeps hot data close to where it is needed, and a **database** holds the state everything else depends on.

## Table of contents

## Load Balancing

A load balancer sits in front of a pool of servers and decides which one handles each request. It gives you horizontal scaling (add servers behind it), fault tolerance (stop sending traffic to unhealthy servers) and a single stable address that clients can rely on.

### Layer 4 or Layer 7

**Layer 4** balancers route by IP address and port. They never look inside the payload, so they are extremely fast and work for any TCP or UDP protocol, but they cannot make decisions based on the content of a request.

**Layer 7** balancers understand HTTP. They can route `/api/*` and `/static/*` to different pools, terminate TLS, add headers, retry idempotent requests, and enforce rate limits. The price is more CPU per request and more configuration to get right.

A common arrangement uses both: a layer 4 tier (or DNS and anycast) spreads traffic across a fleet of layer 7 proxies, which then route to application services.

### Choosing a Server

| Algorithm            | How it works                                        | Good for                             |
| -------------------- | --------------------------------------------------- | ------------------------------------ |
| Round robin          | Each server in turn                                 | Uniform servers and uniform requests |
| Weighted round robin | In turn, in proportion to capacity                  | Mixed instance sizes                 |
| Least connections    | Server with the fewest open connections             | Requests of very different durations |
| Power of two choices | Pick two servers at random, use the less loaded one | Large pools with many balancers      |
| Consistent hashing   | Hash a key (user, session) to a server              | Cache affinity, sticky routing       |

The **power of two choices** deserves special mention. Picking a single server at random leaves the busiest server with a load that grows roughly as $\log n / \log \log n$. Comparing just two random candidates drops that to roughly $\log \log n$, an exponential improvement from almost no extra work <a href="#ref-mitzenmacher2001" class="citation-ref" aria-label="Reference [1]"><sup>[1]</sup></a>. It also behaves well when many independent balancers share the same backends, which is exactly where "least connections" breaks down, since each balancer only sees its own connections.

### Health Checks and Draining

Balancers send traffic only to healthy servers. **Active** health checks poll an endpoint such as `/health` at a fixed interval, while **passive** checks watch real traffic and eject a server after a run of errors. Keep the health endpoint cheap and honest: it should fail when the instance genuinely cannot serve requests, but not because a single non-critical downstream dependency is slow, or one bad dependency will take the whole fleet out of rotation at once.

For deployments, **connection draining** stops sending new requests to an instance while letting in-flight requests finish, so a rolling deploy causes no errors.

### Avoid Sticky Sessions When You Can

Session affinity pins each user to one server, usually so that server can keep session state in memory. It works, but it undoes most of the benefit of the load balancer: load becomes uneven, and a server crash logs out every user pinned to it. Move session state into a shared store such as Redis, or into a signed token held by the client, and keep the servers interchangeable.

## Caching

Caching trades memory and freshness for speed. Because memory is orders of magnitude faster than disk or a network hop, a cache with a high hit rate cuts both latency and the load on the system behind it. The figures in Part 1 suggested that a photo service is read-heavy by a factor of about 250, which is exactly the kind of workload caching is built for.

### Where Caches Live

- **Client and browser**: HTTP `Cache-Control` headers let the browser skip the request entirely.
- **CDN**: edge servers close to users hold static assets and cacheable responses.
- **Application in-process cache**: fastest of all, but each instance has its own copy and they drift apart.
- **Distributed cache** (Redis, Memcached): shared by all instances, one network hop away.
- **Database buffer pool**: the database's own cache of hot pages.

### Read and Write Patterns

**Cache-aside** (lazy loading) is the most common pattern:

```python title="cache_aside.py"
def get_user(user_id):
    key = f"user:{user_id}"
    user = cache.get(key)
    if user is None:                       # miss
        user = db.query_user(user_id)
        cache.set(key, user, ttl=300)      # populate for next time
    return user

def update_user(user_id, fields):
    db.update_user(user_id, fields)
    cache.delete(f"user:{user_id}")        # invalidate, don't overwrite
```

Only requested data enters the cache, and if the cache goes down the application can still read from the database, just more slowly. Note that the write path _deletes_ the key rather than writing the new value. Writing it can race with a concurrent read that loads an older value, leaving stale data in the cache indefinitely. Deleting it means the next read loads the fresh value.

The other patterns trade simplicity for different guarantees:

| Pattern       | Write path                                | Strength                        | Weakness                                  |
| ------------- | ----------------------------------------- | ------------------------------- | ----------------------------------------- |
| Cache-aside   | App writes DB, then invalidates cache     | Simple, resilient to cache loss | First read after a change is a miss       |
| Read-through  | Cache loads from DB on a miss by itself   | Cleaner application code        | Cache needs to know about the database    |
| Write-through | Write goes to cache and DB together       | Cache always fresh              | Slower writes; caches data never read     |
| Write-behind  | Write to cache; DB updated asynchronously | Very fast writes                | Data loss if the cache fails before flush |

### Invalidation and Expiry

Invalidation is famously one of the hard problems. In practice, combine several tools:

- A **TTL** on every key, so that any bug in invalidation heals itself eventually.
- **Explicit deletion** on writes, as in the example above.
- **Versioned keys** such as `user:42:v7`, where a change bumps the version and old entries simply expire.
- **Event-driven invalidation** from the database's change log, so that every writer does not have to remember to invalidate.

When memory fills up, an **eviction policy** decides what to drop. LRU (least recently used) is the usual default. LFU (least frequently used) protects long-term popular keys from being pushed out by a burst of one-off reads.

### Failure Modes

Caches introduce failure modes of their own:

- **Thundering herd** (cache stampede): a hot key expires and thousands of requests miss at once, all hitting the database. Let only one request rebuild the value while the rest wait or are served the stale copy. Facebook's memcache uses short-lived _leases_ for exactly this <a href="#ref-nishtala2013" class="citation-ref" aria-label="Reference [2]"><sup>[2]</sup></a>.
- **Synchronised expiry**: keys written together expire together. Add random jitter to TTLs.
- **Hot keys**: a single celebrity profile overwhelms one cache node. Replicate the key across nodes or add a small in-process cache in front of it.
- **Cold start**: a freshly restarted cache sends every request to the database. Warm it gradually, or bring capacity back in stages.
- **Penetration**: repeated requests for keys that do not exist always miss. Cache the negative result with a short TTL.

## Databases

The database is usually the hardest component to scale, because it holds state that has to stay correct.

### Relational or Not

Pick a data model based on access patterns, not fashion.

- **Relational** (PostgreSQL, MySQL): joins, transactions, a schema the database enforces, and decades of tooling. The right default for most business data.
- **Key-value** (DynamoDB, Redis): lookup by key at very large scale with predictable latency. Weak at ad-hoc queries.
- **Document** (MongoDB): self-contained records with flexible structure, good when data is read and written as a unit.
- **Wide-column** (Cassandra): high write throughput over very large, partitioned datasets with known query patterns.
- **Search and analytics** (Elasticsearch, columnar warehouses): full-text search and aggregation over large data, usually fed from the primary database rather than replacing it.

Many systems use several, with one acting as the source of truth and the others serving specialised reads.

### Indexing

Before reaching for replication or sharding, check the indexes. A missing index turns a lookup that touches a handful of rows into a full table scan. B-tree indexes serve equality and range queries, and composite indexes serve queries that filter on their leading columns. Every index, however, slows down writes and uses space, so add them for the queries you actually run and verify the result with the query planner (`EXPLAIN`).

### Replication

Replication keeps copies of the same data on several machines, for availability and for read scaling.

**Leader-follower** replication sends every write to a single leader, which streams changes to followers. Followers serve reads, and one is promoted if the leader fails. With **asynchronous** replication, writes are fast, but a follower may lag behind, and a failover can lose the last few writes. **Synchronous** replication waits for at least one follower to confirm before acknowledging, trading write latency for durability.

Replication lag produces visible anomalies. A user updates their profile and immediately sees the old version, because the read went to a follower that had not caught up. Common fixes are routing a user's reads to the leader for a short time after they write (_read-your-writes_), or pinning each user to one follower so they never see time go backwards (_monotonic reads_).

**Multi-leader** and **leaderless** replication accept writes on several nodes. They improve write availability across regions, but concurrent writes to the same key can conflict and must be resolved, for example with last-write-wins, version vectors or application-level merging. Dynamo-style stores make the trade-off configurable with quorums <a href="#ref-decandia2007" class="citation-ref" aria-label="Reference [4]"><sup>[4]</sup></a>. With $N$ replicas, a write waits for $W$ acknowledgements and a read queries $R$ replicas. When

$$
R + W > N
$$

every read set overlaps every write set in at least one replica, so a read will see the latest acknowledged write. $N = 3$, $W = 2$, $R = 2$ is the classic balanced choice.

### Partitioning (Sharding)

When one machine cannot hold the data or absorb the writes, split the data into **partitions**, each owned by a different node.

- **Range partitioning** assigns contiguous key ranges to each node. Range scans are efficient, but sequential keys such as timestamps send every new write to the same partition.
- **Hash partitioning** assigns keys by `hash(key)`. Load spreads evenly, but range queries must ask every partition.

The naive form of hash partitioning, `hash(key) % n`, has a serious flaw: changing $n$ moves almost every key. **Consistent hashing** <a href="#ref-karger1997" class="citation-ref" aria-label="Reference [3]"><sup>[3]</sup></a> places both nodes and keys on a ring, and each key belongs to the next node clockwise. Adding or removing a node moves only about $1/n$ of the keys. Giving each physical node many **virtual nodes** on the ring evens out the distribution and spreads a failed node's load across many survivors instead of just one.

Partitioning has real costs. Queries that span partitions get slower, transactions across partitions need coordination, and the partition key is very hard to change later. Choose it from the dominant access pattern, such as `user_id` for a social app, and watch for hot partitions caused by a few very active keys.

## Putting the Pieces Together

Back to the photo service from Part 1, at 15,000 reads per second and 23 uploads per second:

1. **DNS and a CDN** serve photo bytes from the edge. Most image requests never reach the origin.
2. **A layer 7 load balancer** spreads API calls across stateless application servers in several availability zones.
3. **A distributed cache** holds photo metadata and user profiles with cache-aside, TTLs with jitter, and lease-based stampede protection.
4. **A relational primary** with two asynchronous followers in other zones stores metadata. Reads go to followers, and the user's own reads go to the leader for a few seconds after an upload.
5. **Object storage** holds the photos themselves, with uploads written directly from the client using pre-signed URLs, so the application servers never handle the bytes.
6. **Sharding by `user_id`** is planned but deferred until the metadata outgrows a single primary, which the estimates put years away.

Each layer exists because a number from the estimate said it was needed, and each comes with a trade-off you can name. That is the whole method in miniature: requirements, estimates, the simplest design that meets them, and then scaling exactly where the numbers say it is needed.
