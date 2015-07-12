# Gooey

> Data binding for the modern web

Gooey aims to be a simple full-stack (Restful API, JavaScript, DOM) data-binding solution for Single Page Applications built with ES6.

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
* Functional parallelism (pure functions with immutable arguments that are parallelizable)
* Minimally invasive (choose when to use it, plays nice with others)
* Simple configuration model (root defines globals, all other child services may override)
* Core HTTP and DOM integration
* Identifyable DOM templating syntax
* No shims other than Babel - it's time to move forward.

## Rational

Many JavaScript SPA frameworks insist on creating their own data binding mechanism in addition to their other features.
Although a lot of great things have risen from this, we believe that people have learned a lot over the years and that 
this re-invention cycle is quickly becoming a wasted effort.

There **is** a solution that can solve the majority of all modern needs, and we know this to be true because we keep
re-creating the same things over and over.  We believe that the problem of data binding should be addressed independent
of superflous features.

## Installation

> $ npm install

> $ gulp install

## Testing

> $ gulp test

## Examples

## Troubleshooting

## TODO

- [ ] Everything
