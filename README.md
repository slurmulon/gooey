# Gooey

> :cactus: Hierarchical PubSub data synchronization solution for ES6

## tl;dr

Gooey intends to alleviate data and state synchronization challenges in Single Page Applications by combining the following traits, patterns, and philosophies:

* Publish / Subscribe as primary data / state synchronization mechanism
* Optimized bi-directional data traversals (synchronous and asynchronous)
* Hierarchical acyclic relationships between `Services`
* Allow decoupled communication between `Services` via pattern-matched topics (can go even further with a message-box)
* `Services` are canonical sources of entity states
* `Services` are proxies (data can be safely mutated by a `Service` before being passed on)
* `Promises` everywhere
* URLs are often clumsy or inadequate for representing every view state (i.e. those containing multiple selectable entities that affect other components) and should not act as a canonical source of state
* Components that exist out of view or on other "pages" are often functionally relevant even though they aren't _contextually_ relevant (in other words, state should stick by default instead of being forcefully re-evaluated)

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

This architecture allows consumer states to diverge from their providers, and it happens quite easily. This is especially prevelant true when
provider representation states and/or sub-states are denormalized.

Gooey aims to ease the management of high-level, complex multi-layer component states by isolating, refining and consolidating the imperative patterns into a single library.

### Concrete

SPAs typically consume Restful HTTP APIs. HTTP is a stateless protocol and SPA clients are inherently stateful, introducing an obvious and interesting conflict.
The client is responsible for ensuring that its own representations of API entity states are accurate, often involving reference entities and nested states of sub-entities.

This gap in state makes it possible for the client to have one representation of an entity and the API another.
The impact of this state gap scales proportionatily to the number of resource entities / sub-entities, and is invevitably toxic to design sustainability.

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
      - Difficult to validate requests
      - Difficult to test

 - Closely reflect the domain model of the Restful API in the client

   * Pros
      - Consistent domain model
      - Clean code (at first)
      - Easy to test and validate API integrations
   * Cons
      - Expensive
      - Low maintainability
      - Duplication of business logic

 - Allowing Restful API resources to provide both normalized and denormalized entity responses

   * Pros
      - Optimizes request size and number
      - Low to zero redundancy
      - Generally complements [HATEOS](https://en.wikipedia.org/wiki/HATEOAS)
   * Cons
      - Complicates client and API entity models with compsition combinations (e.g. A, B, C, AB, AC, BC, ABC)
      - Nested sub-entities are difficult to access and work with in API routing systems, Restful or not. To my knowledge no URL standards exist for this.
      - Fails to address client issue of cleanly managing responses with complex entity compositions
      - Can be difficult to test

On a semi-related note, the mechanism of data synchronization and "binding" in modern JS frameworks is often re-invented and sometimes implemented with
inefficient and bug-prone solutions that emphasize digest cycles or queued listeners.

Allowing client-side components to interact with each other via decoupled publish / subscribe messaging enables them to synchronize their state flexibly and efficiently, similar to an Actor-based message system like Erlang or Akka.
As an effect, complex client-side components can more easily interact and synchronize with their API resource counterparts.

### Example

Suppose you are designing an online portal for a company that finances renewable energy system projects.
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
    * Example: If a Finance Product component experiences a 500 error, ensure that User can no longer access the Product and, if more no Product options remain, clear out the page and re-select a new Quote for the User.

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
    (?) Child Service 1    ....   (?) Child Service N


`Services` that form a tree can publish data to each other bi-directionally. Gooey supports several
traversal patterns for data publication but performs breadth-first down by default.

Because `Services` can communicate with related services bi-directionally, they can be extended to support the components
of a modern SPA:


                (?) Rest Service
                        |
                        |
                     Service
                        |
         +-----------------------------+
         |                             |
         v                             v
    (?) View Service 1    ...   (?) View Service N


However, this design is out of the scope of Gooey core and will be implemented its own module (`gooey.web`).

## Usage

**Basic**

The following example outlines the most basic use-case of Gooey - a simple 1:1 publish / subscriber relationship:

```javascript
import * as gooey from 'gooey'

// publisher service
const pub = gooey.service({name: 'pub'})

// subscriber - matches any published object
const sub = pub.on('*', (data) => data.$modified = new Date())

pub
  .publish({foo: 'bar'})
  .then(data => console.log(`data modified on ${data.modified}`))
```

Any data published through `pub` (or, if it existed, a parent `Service`) will now trigger `sub`'s subscription behavior, which appends a last `$modified` property to incoming data

**Advanced**

This example represents a more realistic and concrete scenario. Assume you have a user, messages, and a Growl-style notification:

```javascript
import * as gooey from 'gooey'

const inbox = gooey.service({
  name: 'inbox',
  state: []
})

const user = gooey.service({
  name: 'user',
  parent: inbox,
  state: {
    messages: { latest: [] }
  }
})

const notify = gooey.service({
  name: 'notification',
  parent: inbox
})

// whenever a message is sent, capture that
// message in an independent store/session ("latest messages")
// this allows `user` to "share" data with `inbox` without establishing a strict relationship
user.on('/message', (msg) => user.state.messages.latest.push(msg))

// could call `document.addChild` or something,
// but using `alert` for simplicitly
notify.on('/message', (msg) => alert(`New email: ${msg.title}`))

// adds a new message to the inbox and
// publishes the result to subscribing `Services`
inbox
  .add({
    message: {
      title : 'hello',
      body  : 'world'
    }
  })
  .then(msg => console.log('message published (all subscriptions reached)', msg))
  .catch(err => console.log('message publication failed', err))
```

So although the `Services` draw explicit relationships with each other via `parent` and/or `children` properties, it's trivial to allow communication anywhere in in the `Service` forest through disjoint subscriptions.

This concept scales gracefully to complex domain models that include many interdependent entities since the published data will transparently delegate throughout the `Service` tree (the default traversal strategy is Breadth-First Search).

Gooey attempts to traverse your `Service` tree as efficiently as possible by visiting each node at most once, and supports additional synchronization strategies so that you can find the most efficient one for your architecture (Depth-First Search and Optimized Bi-directional BFS are in the works).

## Installation

> $ npm link

## Testing

> $ npm test

## Contributing

Gooey is still in its very early stages. Please feel free to message [me@madhax.io](mailto:me@madhax.io) if you are interested in contributing!

## Future Features

- [X] Depth-first Down Traversal
- [ ] Depth-first Up Traversal (in prog.)
- [X] Breadth-first Down Traversal
- [X] Breadth-first Up Traversal
- [ ] Concurrent traversals (in prog.)
- [ ] Sibling collisions (in prog.)
- [ ] Composite/Nested `Services`
- [ ] Integrate [Object.observer](http://mzl.la/1OXjS2Q) or [Proxy object shim](https://github.com/tvcutsem/harmony-reflect)

## Future Modules

- [X] `gooey.http`
- [ ] `gooey.dom` (in prog.)
- [ ] `gooey.stream`
- [ ] `gooey.debug`
- [ ] `gooey.web` (dependent on `core`, `http`, `dom`, and `debug`)
- [ ] `hyper.goo` (JSON Hyper-Schema parser)
