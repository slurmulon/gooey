# Gooey

> Data binding for the modern web

Gooey aims to be the first N-way (Restful API, JavaScript, DOM) data-binding library for Single Page Applications using ES6.

## Features

* Hierarchical, bi-directional, acyclic event broadcasting
* Services as proxies (data can be manipulated before being handed off to next service, great for piplineing)
* Query subscriptions (in other words, subscribe to changes with JsonPath)
* Streaming data subscriptions
* View templating

## Goals

* Entirely event based (no polling)
* Flexible yet predictable pipelining of events
* Canonical source of data (encourage accessing data from service as much as possible)
* Transparency over common concurrency pitfalls such as deadlocks, livelocks, race conditions, etc.
* Minimally invasive (choose when to use it, plays nice with others)
* Simple configuration model (root defines globals, all other child services may override)
* Core HTTP and DOM integration
* Identifyable DOM templating syntax
* No shims other than Babel, it's time to move forward.

## Rational

Every JavaScript framework insists on creating its own data binding mechanism. Although a lot of great things
have risen from this, we believe that people have learned a lot over the years and that is quickly becoming a wasted effort.

There **is** a solution that can solve the majority of all modern needs, and we know this to be true because we keep
re-creating the same things over and over.

## Installation

`npm install`
`gulp install`

## Testing

`gulp test`

## Examples

## Troubleshooting

## TODO

[ ] Everything
