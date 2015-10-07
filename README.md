# :seedling: Gooey

> PubSub data synchronization solution for ES6 Single Page Applications

## tl;dr

Gooey intends to alleviate data synchronization challenges in Single Page Applications by combining the following traits, patterns, and philosophies:

* Publish / Subscribe as primary data synchronization mechanism
* Bi-directional data traversals (synchronous and asynchronous)
* Hierarchical acyclic relationships between `Services`
* Allow decoupled communication between `Services` via pattern-matched topics
* `Services` are canonical
* `Services` are proxies (data can be safely mutated by a `Service` before being passed on)
* `Promises` everywhere

I will ellaborate more on the benefits of this combination with "proofs" and examples as I find the time :)
Until then, my evaluation of SPA design challenges provides some solid insights, so please give it a read!

## Problem

Single Page Applications (SPAs) enable incredibly responsive user experiences by loading a web application once and then dynamically updating
the state of the client application via JavaScript and asynchronous HTTP requests.

SPAs are innovative and an integral part of the modern web, but the engineers of these applications are often faced with challenges regarding state.
I've described the issues as I see them in both abstract and concrete terms.

### Abstract

SPAs have a dynamic context of multi-layered components that continually changes based on user interactions with the system.
The states and interactions between these components and their layers often span domains and typically become more complex as the context grows.

In this dynamic context, the provider layer (HTTP server) is stateless while the consumer layer (HTTP clients) is inherently stateful.
The consumer is therefore responsible for ensuring that its components' states are synchronized properly with that of the provider.

This architecture allows consumer states to incorrectly diverge from their providers, and it happens quite easily.

Gooey aims to ease the management of complex multi-layer component states by iscolating, refining and consolidating the imperative patterns into a single library.

### Concrete

SPAs typically consume Restful HTTP APIs. HTTP APIs are stateless and SPA clients are stateful, introducing an obvious and interesting conflict.
The client is responsible for ensuring that its own representations of API entity states are accurate, often involving reference entities and nested states of sub-entities.
This gap in state makes it possible for the client to have one representation of an entity and the API another.

The following is a non-exhaustive list of designs that attempt to alleviate the problem but seem to fall short because they do not address the root issue:

 - Monolithic resource entities and responses

   * Pros
      - Fast (at first)
      - Cheap (at first)
   * Cons
      - Bloated resources
      - God objects
      - Highly redundant (no granular sub-entity updates)
      - Violates encapsulation
      - Duplication of business logic
      - Hard to test

 - Closely reflect the domain model of the Restful API in the client

   * Pros
      - Consistent domain model
      - Clean code (at first)
      - Easy to test and validate API integrations
   * Cons
      - Expensive
      - Low maintainability
      - Duplication of business logic

 - Allow Restful API resources to provide both granular and verbose responses

   * Pros
      - Optimizes request size and number
      - Low to zero redundancy
      - Generally complements [HATEOS](https://en.wikipedia.org/wiki/HATEOAS)
   * Cons
      - Complicates client and API entity models with compsition combinations (e.g. A, B, C, AB, AC, BC, ABC)
      - Nested sub-entities are difficult to access and work with in API routing systems, Restful or not. To my knowledge no URL standards exist for this.
      - Fails to address client issue of cleanly managing responses with complex entity compositions
      - Can be hard to test

On a semi-related note, the mechanism of data synchronization and "binding" in modern JS frameworks is often re-invented and sometimes implemented with
inefficient and bug-prone solutions that emphasize digest cycles or queued listeners.

Allowing client-side components to interact with each other via publish / subscribe messaging enables them to synchronize their state flexibly and efficiently.
As an effect, complex client-side components can more easily interact and synchronize with their API resource counterparts.

### Example

Suppose you are designing an online portal for a company that finances renewable energy systems.
You might represent your model components as a composition hierarchy:

                                       User
                                        |
                         +-----------------------------+
                         |                             |
                         v                             v
                       Quotes                       Proposals
                         |
         +------------------------------+
         |                              |
         v                              v
      Systems                   Finance Products


In this architecture, the User component is essentially acting as the canonical context of the application since all other
model components depend on it.

Assume that a User can be viewing either one Quote or Proposal at a time. If a Quote is selected,
then the User must also have one System and one Finance Product selected.

What can make this simple yet dynamic context difficult to manage? (Examples may represent future business requirements):

 - Component states are often decoupled and split across layers of the stack
    * Example: The state of the User and its dependent components must be synchronized with relevant models, views, controllers, and API resources
 - Strong coupling between components (components expclitly reference and depend on each other)
    * Example: If the address of a User's only Quote is changed, reflect the change in the User's primary address as well
 - Distant interdependencies between client components that are difficult to architect cleanly
    * Example: If a System reaches a "finance ready" state, the Quote now needs to acquire Documents which the User can sign.
      Quote state must be refreshed via API in order to acquire Documents.
      Quote and Systems are functionally disabled until Documents are signed or rejected, but changes to Finance Products will
      re-generate Documents for a Quote.
 - Difficult to synchronize effects and limitations of errors between relevant components
    * Example: If a Finance Product component experiences a 500 error, ensure that User can no longer access the Quote and, if possible, re-select a new Quote for the User.

## Architecture

Gooey loosly follows the [composite pattern](https://en.wikipedia.org/wiki/Composite_pattern) and represents data components as canonical `Services` that
can subscribe and publish data via [topic-based](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern#Message_filtering) messsages.

`Services` have a 1:1 relationship with an optional parent `Service` and a 1:N relationship with optional child `Services`.

These relationships naturally establish a tree structure that can scale to support any number of `Services`:


                (?) Parent Service
                        |
                        |
                     Service
                        |
         +-----------------------------+
         |                             |
         v                             v
    (?) Child Service A           (?) Child Service B


`Services` that form this tree can publish data to each other bi-direciontally. Gooey supports several
traversal patterns for data publication but performs breadth-first up/down by default.

Because `Services` can communicate with related services bi-direciontally, they can be extended to support the components
of a modern SPA:


                (?) Rest Service
                        |
                        |
                     Service
                        |
         +-----------------------------+
         |                             |
         v                             v
    (?) View Service A         (?) View Service B


However, this design is out of the scope of Gooey core and will be implemented its own module (`gooey.web`).

## Installation

> $ npm install

## Testing

> $ npm test

## Contributing

Gooey is still in its very early stages. Please feel free to message [me@madhax.io](mailto:me@madhax.io) if you are interested in contributing!

## Future Features

- [X] Depth-first Down Traversal
- [ ] Depth-first Up Traversal (in prog.)
- [X] Breadth-first Down Traversal
- [ ] Breadth-first Up Traversal
- [ ] Concurrent traversals
- [ ] Sibling collisions (Up direction)
- [ ] Composite/Nested Services
- [ ] Support [queryl](http://bit.ly/1jbEyGz)
- [ ] Integrate [Object.observer](http://mzl.la/1OXjS2Q) or [Proxy object shim](https://github.com/tvcutsem/harmony-reflect)

## Future Modules

- [ ] `gooey.http`
- [ ] `gooey.dom`
- [ ] `gooey.debug`
- [ ] `gooey.web` (dependent on `core`, `net`, `dom`, and `debug`)
