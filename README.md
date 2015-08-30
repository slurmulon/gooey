# Gooey

> PubSub data-binding solution for ES6 Single Page Applications.

## Features

* Hierarchical, bi-directional, acyclic event broadcasting
* Services as proxies (data can be safely mutated before being handed off to next service, great for pipelining)
* Pattern-matched subscriptions (in other words, subscribe to changes via JsonPath)

## Goals

* Reactive (no polling, hence PubSub)
* Flexible yet predictable pipelining of events
* Canonical source of data (encourage accessing data from service as much as possible)
* Transparency over common concurrency pitfalls such as deadlocks, livelocks, race conditions, etc.
* Functional parallelism (pure functions with immutable arguments that are parallelizable)
* Minimally invasive (choose when to use it, plays nice with others)
* Easily extensible to allow for new Services such as URL, REST, DOM, etc.
* Simple configuration model (root defines globals, all other child services may override)
* No shims other than Babel - it's time to move forward.

## Model



## Installation

> $ npm install

> $ gulp install

## Testing

> $ gulp test

## Examples

## Troubleshooting

## TODO

- [ ] Depth-first Down Traversal (in prog.)
- [ ] Depth-first Up Traversal
- [ ] Breadth-first Down Traversal
- [ ] Breadth-first Up Traversal
- [ ] Concurrent traversals
- [ ] Sibling collisions